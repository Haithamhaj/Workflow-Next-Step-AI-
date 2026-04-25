/**
 * Google extraction provider — real Gemini SDK path (§8).
 * Default provider. Uses @google/generative-ai when GOOGLE_AI_API_KEY is set.
 * Fails visibly when credentials/config are missing.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import type {
  HierarchyConfidence,
  HierarchyGroupingLayer,
  HierarchyNodeRecord,
  HierarchySecondaryRelationship,
  HierarchySecondaryRelationshipType,
  HierarchySourceBasis,
  IntakeSourceRole,
  ProviderName,
  SourceHierarchyEvidenceStatus,
  SourceHierarchySignalType,
  SourceHierarchySuggestedScope,
  StructuredContext,
} from "@workflow/contracts";
import type {
  ExtractionInput,
  ExtractionProvider,
  ExtractionResult,
  ClassificationResult,
  ContextTransformResult,
  HierarchyDraftGenerationResult,
  SourceHierarchyTriageGenerationResult,
} from "./extraction-provider.js";
import { classifyGoogleProviderError, getEnv, getGoogleAIKeyOrThrow, resolveGoogleAIProviderConfig } from "./google-config.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** MIME types supported by Gemini inlineData for Phase 3 extraction. */
function isMultimodalMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("audio/") ||
    mimeType === "application/pdf"
  );
}

function getApiModel(key: string, fallback: string): string {
  const value = getEnv(key);
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

const STRUCTURED_CONTEXT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    companyName: { type: SchemaType.STRING },
    companyScopeSummary: { type: SchemaType.STRING },
    domain: { type: SchemaType.STRING },
    subtypeOrOperatingModel: { type: SchemaType.STRING },
    visibleServicesOrProducts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    mainDepartment: { type: SchemaType.STRING },
    subUnitOrTeam: { type: SchemaType.STRING },
    visibleRoleFamiliesOrOrgSignals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    keyContextSignalsAndRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    confidenceAndUnknowns: { type: SchemaType.STRING },
  },
  required: [
    "companyName",
    "companyScopeSummary",
    "domain",
    "visibleServicesOrProducts",
    "mainDepartment",
    "visibleRoleFamiliesOrOrgSignals",
    "keyContextSignalsAndRisks",
    "confidenceAndUnknowns",
  ],
};

const CONTEXT_SYSTEM = `You are a company intelligence extraction assistant.
Given raw text about a company (website summaries, notes, documents), extract a structured context.
Rules:
- Only extract information explicitly stated in the text. Do NOT infer or hallucinate.
- If a field cannot be determined, use an empty string (for strings) or empty array (for arrays).
- For confidenceAndUnknowns, honestly state what is known vs. uncertain.
- Be specific, not generic. "A company that does X" is not useful — name the company if mentioned.`;

const CLASSIFY_SYSTEM = `You classify intake sources by type and scope.
Given a source's display name and extracted text, determine:
- suggestedSourceRole: what intake role this source appears to play (e.g. company_overview, org_signal, policy_reference, department_note, audio_transcript, website_url)
- suggestedScope: company_level if it covers the whole organization, department_level if it's specific to a team/unit
- confidenceLevel: high/medium/low based on how clearly the content signals its role
- shortRationale: one-sentence explanation
This is intake triage only. Do not judge reference suitability, workflow truth, or document quality.`;

const INTAKE_SOURCE_ROLES: IntakeSourceRole[] = [
  "company_overview",
  "company_context",
  "org_signal",
  "policy_reference",
  "department_note",
  "audio_transcript",
  "website_url",
  "general_intake_source",
];

const GROUP_LAYERS: HierarchyGroupingLayer[] = [
  "owner_or_executive",
  "director_layer",
  "manager_layer",
  "supervisor_layer",
  "senior_individual_contributor",
  "frontline_operational",
  "support_role",
  "shared_service_role",
  "approval_or_control_role",
  "external_interface",
  "system_or_queue_node",
  "committee_or_group",
  "temporary_or_project_role",
  "unknown",
  "custom",
];

const SECONDARY_RELATIONSHIP_TYPES: HierarchySecondaryRelationshipType[] = [
  "dotted_line_manager",
  "cross_functional_responsibility",
  "shared_supervision",
  "dual_reporting",
  "temporary_project_reporting",
  "operational_dependency",
  "approval_relationship",
  "matrix_relationship",
  "external_interface_relationship",
  "custom",
];

const CONFIDENCE_VALUES: HierarchyConfidence[] = ["high", "medium", "low", "unknown"];
const SOURCE_BASIS_VALUES: HierarchySourceBasis[] = ["admin_entered", "pasted_text", "uploaded_document", "source_evidence_candidate", "unknown"];
const SOURCE_TRIAGE_SIGNAL_TYPES: SourceHierarchySignalType[] = [
  "role_name_signal",
  "department_scope_signal",
  "kpi_or_target_signal",
  "responsibility_signal",
  "approval_or_authority_signal",
  "system_or_queue_signal",
  "person_name_signal",
  "cross_functional_signal",
  "external_interface_signal",
  "unclear_scope_signal",
];
const SOURCE_TRIAGE_SCOPES: SourceHierarchySuggestedScope[] = [
  "company_wide",
  "department_wide",
  "team_or_unit",
  "role_specific",
  "person_or_occupant",
  "system_or_queue",
  "approval_or_control_node",
  "external_interface",
  "unknown_needs_review",
];
const SOURCE_TRIAGE_EVIDENCE_STATUSES: SourceHierarchyEvidenceStatus[] = [
  "document_claim_only",
  "admin_confirmed_relevance",
  "participant_validation_needed",
  "rejected_by_admin",
  "scope_changed_by_admin",
];

function normalizeSourceRole(value: unknown): IntakeSourceRole {
  return typeof value === "string" && INTAKE_SOURCE_ROLES.includes(value as IntakeSourceRole)
    ? value as IntakeSourceRole
    : "general_intake_source";
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function normalizeGroupLayer(value: unknown): HierarchyGroupingLayer {
  return typeof value === "string" && GROUP_LAYERS.includes(value as HierarchyGroupingLayer)
    ? value as HierarchyGroupingLayer
    : "unknown";
}

function normalizeSecondaryType(value: unknown): HierarchySecondaryRelationshipType {
  return typeof value === "string" && SECONDARY_RELATIONSHIP_TYPES.includes(value as HierarchySecondaryRelationshipType)
    ? value as HierarchySecondaryRelationshipType
    : "custom";
}

function normalizeConfidence(value: unknown): HierarchyConfidence {
  return typeof value === "string" && CONFIDENCE_VALUES.includes(value as HierarchyConfidence)
    ? value as HierarchyConfidence
    : "unknown";
}

function normalizeSourceBasis(value: unknown): HierarchySourceBasis {
  return typeof value === "string" && SOURCE_BASIS_VALUES.includes(value as HierarchySourceBasis)
    ? value as HierarchySourceBasis
    : "unknown";
}

function normalizeTriageSignalType(value: unknown): SourceHierarchySignalType {
  return typeof value === "string" && SOURCE_TRIAGE_SIGNAL_TYPES.includes(value as SourceHierarchySignalType)
    ? value as SourceHierarchySignalType
    : "unclear_scope_signal";
}

function normalizeTriageScope(value: unknown): SourceHierarchySuggestedScope {
  return typeof value === "string" && SOURCE_TRIAGE_SCOPES.includes(value as SourceHierarchySuggestedScope)
    ? value as SourceHierarchySuggestedScope
    : "unknown_needs_review";
}

function normalizeTriageEvidenceStatus(value: unknown): SourceHierarchyEvidenceStatus {
  return typeof value === "string" && SOURCE_TRIAGE_EVIDENCE_STATUSES.includes(value as SourceHierarchyEvidenceStatus)
    ? value as SourceHierarchyEvidenceStatus
    : "document_claim_only";
}

export class GoogleExtractionProvider implements ExtractionProvider {
  readonly name: ProviderName = "google";

  private getClient(): GoogleGenerativeAI | null {
    try {
      return new GoogleGenerativeAI(getGoogleAIKeyOrThrow());
    } catch {
      return null;
    }
  }

  async extractText(input: ExtractionInput): Promise<ExtractionResult> {
    const client = this.getClient();
    if (!client) {
      throw new Error("GOOGLE_AI_API_KEY is not configured for Google document/OCR extraction.");
    }

    const modelName = getApiModel("GOOGLE_EXTRACTION_MODEL", "gemini-3.1-pro-preview");
    const model = client.getGenerativeModel({ model: modelName });
    const prompt = "Extract all text content from this Pass 2 intake source. Return only extracted text, no commentary.";
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: prompt }];
    if (input.binaryData && input.mimeType && isMultimodalMimeType(input.mimeType)) {
      parts.push({ inlineData: { data: arrayBufferToBase64(input.binaryData), mimeType: input.mimeType } });
    } else {
      parts.push({ text: input.content });
    }
    const result = await model.generateContent(parts);
    return {
      text: result.response.text(),
      provider: "google",
      model: modelName,
    };
  }

  async classifySource(input: {
    displayName: string;
    extractedText: string;
    bucket: string;
  }): Promise<ClassificationResult> {
    const client = this.getClient();
    if (!client) {
      throw new Error("GOOGLE_AI_API_KEY is not configured for AI intake source-role suggestions.");
    }

    const modelName = getApiModel("GOOGLE_SUGGESTION_MODEL", "gemini-3.1-pro-preview");
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const result = await model.generateContent([
      { text: CLASSIFY_SYSTEM },
      { text: `Display name: ${input.displayName}\nBucket: ${input.bucket}\nExtracted text (first 2000 chars):\n${input.extractedText.slice(0, 2000)}` },
    ]);
    const parsed = JSON.parse(result.response.text()) as {
      suggestedSourceRole?: string;
      suggestedType?: string;
      suggestedScope?: string;
      confidenceLevel?: string;
      confidence?: string;
      shortRationale?: string;
      reason?: string;
    };
    return {
      suggestedSourceRole: normalizeSourceRole(parsed.suggestedSourceRole ?? parsed.suggestedType),
      suggestedScope: (parsed.suggestedScope === "company_level" || parsed.suggestedScope === "department_level")
        ? parsed.suggestedScope
        : input.bucket === "company" ? "company_level" : "department_level",
      confidenceLevel: (parsed.confidenceLevel === "high" || parsed.confidenceLevel === "medium" || parsed.confidenceLevel === "low")
        ? parsed.confidenceLevel
        : (parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low") ? parsed.confidence : "low",
      shortRationale: parsed.shortRationale ?? parsed.reason ?? "Generated by Google Gemini for intake triage only.",
    };
  }

  async transformToStructuredContext(input: {
    rawText: string;
    bucket: string;
    domain?: string;
  }): Promise<ContextTransformResult> {
    const client = this.getClient();
    if (!client) {
      throw new Error("GOOGLE_AI_API_KEY is not configured for structured context generation.");
    }

    const modelName = getApiModel("GOOGLE_STRUCTURED_CONTEXT_MODEL", "gemini-3.1-pro-preview");
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: STRUCTURED_CONTEXT_SCHEMA,
      },
    });

    const userPrompt = `Bucket: ${input.bucket}${input.domain ? `\nDomain hint: ${input.domain}` : ""}

Raw source text:
${input.rawText.slice(0, 8000)}`;

    const result = await model.generateContent([
      { text: CONTEXT_SYSTEM },
      { text: userPrompt },
    ]);

    const parsed = JSON.parse(result.response.text()) as StructuredContext;

    const context: StructuredContext = {
      companyName: parsed.companyName ?? "",
      companyScopeSummary: parsed.companyScopeSummary ?? "",
      domain: parsed.domain ?? input.domain ?? "unknown",
      subtypeOrOperatingModel: parsed.subtypeOrOperatingModel || undefined,
      visibleServicesOrProducts: Array.isArray(parsed.visibleServicesOrProducts) ? parsed.visibleServicesOrProducts : [],
      mainDepartment: parsed.mainDepartment ?? "",
      subUnitOrTeam: parsed.subUnitOrTeam || undefined,
      visibleRoleFamiliesOrOrgSignals: Array.isArray(parsed.visibleRoleFamiliesOrOrgSignals) ? parsed.visibleRoleFamiliesOrOrgSignals : [],
      keyContextSignalsAndRisks: Array.isArray(parsed.keyContextSignalsAndRisks) ? parsed.keyContextSignalsAndRisks : [],
      confidenceAndUnknowns: parsed.confidenceAndUnknowns ?? "Extracted by Google Gemini; admin review remains required.",
    };

    return {
      structuredContext: context,
      provider: "google",
      model: modelName,
    };
  }

  async generateHierarchyDraft(input: {
    compiledPrompt: string;
  }): Promise<HierarchyDraftGenerationResult> {
    const modelName = resolveGoogleAIProviderConfig().resolvedModel;
    let rawText: string;
    try {
      const client = new GoogleGenerativeAI(getGoogleAIKeyOrThrow());
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent([
        { text: input.compiledPrompt },
      ]);
      rawText = result.response.text();
    } catch (error) {
      throw classifyGoogleProviderError(error);
    }
    let parsed: {
      nodes?: unknown[];
      secondaryRelationships?: unknown[];
      warnings?: unknown[];
    };
    try {
      parsed = JSON.parse(rawText) as typeof parsed;
    } catch (error) {
      throw classifyGoogleProviderError(error);
    }

    const nodeIds = new Set<string>();
    const nodes: HierarchyNodeRecord[] = (Array.isArray(parsed.nodes) ? parsed.nodes : []).map((raw, index) => {
      const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const nodeId = cleanString(item.nodeId) ?? `ai_node_${index + 1}`;
      nodeIds.add(nodeId);
      const groupLayer = normalizeGroupLayer(item.groupLayer);
      return {
        nodeId,
        roleLabel: cleanString(item.roleLabel) ?? `Unlabeled role ${index + 1}`,
        groupLayer,
        customGroupLabel: groupLayer === "custom" ? cleanString(item.customGroupLabel) ?? "Custom" : cleanString(item.customGroupLabel),
        customGroupReason: cleanString(item.customGroupReason),
        primaryParentNodeId: cleanString(item.primaryParentNodeId),
        personName: cleanString(item.personName),
        employeeId: cleanString(item.employeeId),
        internalIdentifier: cleanString(item.internalIdentifier),
        occupantOfRole: cleanString(item.occupantOfRole),
        candidateParticipantFlag: typeof item.candidateParticipantFlag === "boolean" ? item.candidateParticipantFlag : undefined,
        personRoleConfidence: normalizeConfidence(item.personRoleConfidence),
        notes: cleanString(item.notes),
      };
    });
    for (const node of nodes) {
      const parentId = node.primaryParentNodeId;
      if (!parentId) continue;
      if (parentId.toLowerCase() === "unknown" || parentId === node.nodeId || !nodeIds.has(parentId)) {
        delete node.primaryParentNodeId;
      }
    }

    const secondaryRelationships: HierarchySecondaryRelationship[] = (Array.isArray(parsed.secondaryRelationships) ? parsed.secondaryRelationships : []).flatMap((raw, index) => {
      const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const fromNodeId = cleanString(item.fromNodeId);
      const relatedNodeId = cleanString(item.relatedNodeId);
      if (!fromNodeId || !relatedNodeId || !nodeIds.has(fromNodeId) || !nodeIds.has(relatedNodeId)) return [];
      return [{
        relationshipId: cleanString(item.relationshipId) ?? `ai_rel_${index + 1}`,
        fromNodeId,
        relatedNodeId,
        relationshipType: normalizeSecondaryType(item.relationshipType),
        relationshipScope: cleanString(item.relationshipScope) ?? "",
        reasonOrNote: cleanString(item.reasonOrNote) ?? "",
        confidence: normalizeConfidence(item.confidence),
        sourceBasis: normalizeSourceBasis(item.sourceBasis),
      }];
    });

    const warnings = (Array.isArray(parsed.warnings) ? parsed.warnings : [])
      .flatMap((warning) => cleanString(warning) ? [cleanString(warning)!] : []);

    return {
      nodes,
      secondaryRelationships,
      warnings,
      provider: "google",
      model: modelName,
      rawText,
    };
  }

  async generateSourceHierarchyTriage(input: {
    compiledPrompt: string;
  }): Promise<SourceHierarchyTriageGenerationResult> {
    const modelName = resolveGoogleAIProviderConfig().resolvedModel;
    let rawText: string;
    try {
      const client = new GoogleGenerativeAI(getGoogleAIKeyOrThrow());
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: "application/json",
        },
      });
      const result = await model.generateContent([
        { text: input.compiledPrompt },
      ]);
      rawText = result.response.text();
    } catch (error) {
      throw classifyGoogleProviderError(error);
    }
    let parsed: {
      suggestions?: unknown[];
      warnings?: unknown[];
    };
    try {
      parsed = JSON.parse(rawText) as typeof parsed;
    } catch (error) {
      throw classifyGoogleProviderError(error);
    }

    const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : []).map((raw) => {
      const item = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
      const suggestedScope = normalizeTriageScope(item.suggestedScope);
      return {
        sourceId: cleanString(item.sourceId) ?? "unknown_source",
        sourceName: cleanString(item.sourceName) ?? cleanString(item.sourceId) ?? "Unknown source",
        suggestedScope,
        linkedNodeId: cleanString(item.linkedNodeId),
        linkedScopeLevel: item.linkedScopeLevel ? normalizeTriageScope(item.linkedScopeLevel) : suggestedScope,
        signalType: normalizeTriageSignalType(item.signalType),
        suggestedReason: cleanString(item.suggestedReason) ?? "Provider suggested this as a tentative source-to-hierarchy evidence candidate.",
        confidence: normalizeConfidence(item.confidence),
        evidenceStatus: normalizeTriageEvidenceStatus(item.evidenceStatus),
        participantValidationNeeded: typeof item.participantValidationNeeded === "boolean"
          ? item.participantValidationNeeded
          : normalizeTriageSignalType(item.signalType) !== "role_name_signal",
        adminReviewQuestion: cleanString(item.adminReviewQuestion) ?? "Is this source only a documented/formal claim, or does it reflect actual practice?",
        provider: "google" as const,
        model: modelName,
      };
    });

    const warnings = (Array.isArray(parsed.warnings) ? parsed.warnings : [])
      .flatMap((warning) => cleanString(warning) ? [cleanString(warning)!] : []);

    return {
      suggestions,
      warnings,
      provider: "google",
      model: modelName,
      rawText,
    };
  }

  async runPromptText(input: {
    compiledPrompt: string;
  }): Promise<{ text: string; provider: ProviderName; model: string }> {
    const modelName = resolveGoogleAIProviderConfig().resolvedModel;
    try {
      const client = new GoogleGenerativeAI(getGoogleAIKeyOrThrow());
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([{ text: input.compiledPrompt }]);
      return {
        text: result.response.text(),
        provider: "google",
        model: modelName,
      };
    } catch (error) {
      throw classifyGoogleProviderError(error);
    }
  }
}
