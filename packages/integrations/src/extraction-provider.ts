/**
 * Provider-agnostic extraction interface (§8).
 * Google is default; OpenAI is available. Admin selects; never auto-switched.
 */

import type {
  HierarchyNodeRecord,
  HierarchySecondaryRelationship,
  SourceHierarchyTriageSuggestion,
  TargetingRecommendationPacket,
  ProviderName,
  StructuredContext,
  AttachmentScope,
  IntakeSourceRole,
} from "@workflow/contracts";

export interface ExtractionResult {
  text: string;
  provider: ProviderName;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface ClassificationResult {
  suggestedSourceRole: IntakeSourceRole;
  suggestedScope: AttachmentScope;
  confidenceLevel: "high" | "medium" | "low";
  shortRationale: string;
}

export interface ContextTransformResult {
  structuredContext: StructuredContext;
  provider: ProviderName;
  model: string;
}

export interface HierarchyDraftGenerationResult {
  nodes: HierarchyNodeRecord[];
  secondaryRelationships: HierarchySecondaryRelationship[];
  warnings: string[];
  provider: ProviderName;
  model: string;
  rawText: string;
}

export interface SourceHierarchyTriageGenerationResult {
  suggestions: Omit<
    SourceHierarchyTriageSuggestion,
    "triageId" | "triageJobId" | "sessionId" | "companyId" | "caseId" | "adminDecision" | "createdAt" | "updatedAt"
  >[];
  warnings: string[];
  provider: ProviderName;
  model: string;
  rawText: string;
}

export interface TargetingRecommendationGenerationResult {
  packet: Omit<
    TargetingRecommendationPacket,
    | "packetId"
    | "companyId"
    | "caseId"
    | "selectedDepartment"
    | "selectedUseCase"
    | "basisHierarchySnapshotId"
    | "basisReadinessSnapshotId"
    | "generatedByPromptVersionId"
    | "generatedAt"
    | "adminDecisionStatus"
    | "manualFallbackAvailable"
  >;
  provider: ProviderName;
  model: string;
  rawText: string;
}

export interface PromptTextUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface PromptTextResult {
  text: string;
  provider: ProviderName;
  model: string;
  usage?: PromptTextUsage;
}

export interface ExtractionInput {
  /** Text content (for text/document sources, or fallback label for binary). */
  content: string;
  /** MIME type of the input. */
  mimeType?: string;
  /** Raw binary data for multimodal extraction (images, audio, video). */
  binaryData?: ArrayBuffer;
}

export interface ExtractionProvider {
  readonly name: ProviderName;

  /** Extract text from raw content (text, binary media, URL fetch, etc.). */
  extractText(input: ExtractionInput): Promise<ExtractionResult>;

  /** Classify a source: suggest type, scope, confidence (§7). */
  classifySource(input: {
    displayName: string;
    extractedText: string;
    bucket: string;
  }): Promise<ClassificationResult>;

  /** Transform raw notes / batch text into structured context (§12). */
  transformToStructuredContext(input: {
    rawText: string;
    bucket: string;
    domain?: string;
  }): Promise<ContextTransformResult>;

  /** Generate a Pass 3 draft hierarchy from a visible compiled PromptSpec. */
  generateHierarchyDraft(input: {
    compiledPrompt: string;
  }): Promise<HierarchyDraftGenerationResult>;

  /** Generate Pass 3 source-to-hierarchy evidence-candidate suggestions from a visible compiled PromptSpec. */
  generateSourceHierarchyTriage(input: {
    compiledPrompt: string;
  }): Promise<SourceHierarchyTriageGenerationResult>;

  /** Execute a visible compiled prompt for Pass 3 prompt draft testing. */
  runPromptText(input: {
    compiledPrompt: string;
  }): Promise<PromptTextResult>;

  /** Generate a Pass 4 Targeting Recommendation Packet from a visible compiled PromptSpec. */
  generateTargetingRecommendationPacket?(input: {
    compiledPrompt: string;
  }): Promise<TargetingRecommendationGenerationResult>;
}
