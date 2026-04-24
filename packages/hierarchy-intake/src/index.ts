import {
  validateApprovedHierarchySnapshot,
  validateHierarchyCorrectionEvent,
  validateHierarchyDraftRecord,
  validateHierarchyIntakeRecord,
  validateHierarchyReadinessSnapshot,
  validateSourceHierarchyTriageJob,
  validateSourceHierarchyTriageSuggestion,
  type ApprovedHierarchySnapshot,
  type HierarchyCorrectionEvent,
  type HierarchyDraftRecord,
  type HierarchyGroupingLayer,
  type HierarchyIntakeRecord,
  type HierarchyNodeRecord,
  type HierarchyReadinessSnapshot,
  type HierarchySecondaryRelationship,
  type HierarchySecondaryRelationshipType,
  type HierarchySourceBasis,
  type SourceHierarchyAdminDecision,
  type SourceHierarchyEvidenceStatus,
  type SourceHierarchySuggestedScope,
  type SourceHierarchyTriageJob,
  type SourceHierarchyTriageSuggestion,
} from "@workflow/contracts";
import type {
  ApprovedHierarchySnapshotRepository,
  HierarchyCorrectionEventRepository,
  HierarchyDraftRepository,
  HierarchyIntakeRepository,
  HierarchyReadinessSnapshotRepository,
  IntakeSessionRepository,
  IntakeSourceRepository,
  SourceHierarchyTriageJobRepository,
  SourceHierarchyTriageSuggestionRepository,
} from "@workflow/persistence";

export const HIERARCHY_INTAKE_PACKAGE = "@workflow/hierarchy-intake" as const;

export type {
  ApprovedHierarchySnapshot,
  HierarchyCorrectionEvent,
  HierarchyDraftRecord,
  HierarchyGroupingLayer,
  HierarchyIntakeRecord,
  HierarchyNodeRecord,
  HierarchyReadinessSnapshot,
  HierarchySecondaryRelationship,
  HierarchySecondaryRelationshipType,
  HierarchySourceBasis,
  SourceHierarchyAdminDecision,
  SourceHierarchyEvidenceStatus,
  SourceHierarchySuggestedScope,
  SourceHierarchyTriageJob,
  SourceHierarchyTriageSuggestion,
} from "@workflow/contracts";

export interface HierarchyFoundationRepos {
  intakeSessions: IntakeSessionRepository;
  intakeSources?: IntakeSourceRepository;
  hierarchyIntakes: HierarchyIntakeRepository;
  hierarchyDrafts: HierarchyDraftRepository;
  hierarchyCorrections: HierarchyCorrectionEventRepository;
  approvedHierarchySnapshots: ApprovedHierarchySnapshotRepository;
  hierarchyReadinessSnapshots: HierarchyReadinessSnapshotRepository;
  sourceHierarchyTriageJobs?: SourceHierarchyTriageJobRepository;
  sourceHierarchyTriageSuggestions?: SourceHierarchyTriageSuggestionRepository;
}

export interface HierarchyDraftProvider {
  readonly name: "google" | "openai";
  generateHierarchyDraft(input: {
    compiledPrompt: string;
  }): Promise<{
    nodes: HierarchyNodeRecord[];
    secondaryRelationships: HierarchySecondaryRelationship[];
    warnings: string[];
    provider: "google" | "openai";
    model: string;
    rawText: string;
  }>;
}

export interface SourceHierarchyTriageProvider {
  readonly name: "google" | "openai";
  generateSourceHierarchyTriage(input: {
    compiledPrompt: string;
  }): Promise<{
    suggestions: Omit<
      SourceHierarchyTriageSuggestion,
      "triageId" | "triageJobId" | "sessionId" | "caseId" | "adminDecision" | "createdAt" | "updatedAt"
    >[];
    warnings: string[];
    provider: "google" | "openai";
    model: string;
    rawText: string;
  }>;
}

export const SOURCE_TRIAGE_SUGGESTED_SCOPES: SourceHierarchySuggestedScope[] = [
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

export const HIERARCHY_GROUPING_LAYERS: HierarchyGroupingLayer[] = [
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

export const SECONDARY_RELATIONSHIP_TYPES: HierarchySecondaryRelationshipType[] = [
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

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function validationMessage(errors: { message?: string }[]): string {
  return errors.map((e) => e.message ?? String(e)).join("; ");
}

function cloneNodes(nodes: HierarchyNodeRecord[]): HierarchyNodeRecord[] {
  return nodes.map((node) => ({ ...node }));
}

function cloneRelationships(relationships: HierarchySecondaryRelationship[]): HierarchySecondaryRelationship[] {
  return relationships.map((relationship) => ({ ...relationship }));
}

export function validateHierarchyNodes(input: {
  nodes: HierarchyNodeRecord[];
  secondaryRelationships?: HierarchySecondaryRelationship[];
}): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const ids = new Set<string>();

  for (const node of input.nodes) {
    if (!node.nodeId.trim()) errors.push("Every hierarchy node requires nodeId.");
    if (!node.roleLabel.trim()) errors.push(`Node ${node.nodeId || "(missing id)"} requires roleLabel.`);
    if (!HIERARCHY_GROUPING_LAYERS.includes(node.groupLayer)) {
      errors.push(`Node ${node.nodeId} has unsupported groupLayer ${node.groupLayer}.`);
    }
    if (node.groupLayer === "custom" && !node.customGroupLabel?.trim()) {
      errors.push(`Node ${node.nodeId} uses custom groupLayer but has no customGroupLabel.`);
    }
    if (ids.has(node.nodeId)) errors.push(`Duplicate nodeId ${node.nodeId}.`);
    ids.add(node.nodeId);
  }

  for (const node of input.nodes) {
    if (node.primaryParentNodeId) {
      if (node.primaryParentNodeId === node.nodeId) {
        errors.push(`Node ${node.nodeId} cannot be its own primary parent.`);
      }
      if (!ids.has(node.primaryParentNodeId)) {
        errors.push(`Node ${node.nodeId} primaryParentNodeId ${node.primaryParentNodeId} does not exist.`);
      }
    }
  }

  for (const relationship of input.secondaryRelationships ?? []) {
    if (!ids.has(relationship.fromNodeId)) {
      errors.push(`Secondary relationship ${relationship.relationshipId} fromNodeId does not exist.`);
    }
    if (!ids.has(relationship.relatedNodeId)) {
      errors.push(`Secondary relationship ${relationship.relationshipId} relatedNodeId does not exist.`);
    }
    if (relationship.fromNodeId === relationship.relatedNodeId) {
      errors.push(`Secondary relationship ${relationship.relationshipId} cannot point to the same node.`);
    }
    if (!SECONDARY_RELATIONSHIP_TYPES.includes(relationship.relationshipType)) {
      errors.push(`Secondary relationship ${relationship.relationshipId} has unsupported type.`);
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}

export function parsePastedHierarchyText(text: string): HierarchyNodeRecord[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      nodeId: `node_${index + 1}`,
      roleLabel: line.replace(/^[-*]\s*/, ""),
      groupLayer: "unknown" as const,
    }));
}

export function createPastedHierarchyIntake(input: {
  sessionId: string;
  pastedText: string;
  createdBy?: string;
}, repos: HierarchyFoundationRepos): HierarchyIntakeRecord {
  const session = repos.intakeSessions.findById(input.sessionId);
  if (!session) throw new Error(`Intake session not found: ${input.sessionId}`);

  const timestamp = now();
  const existing = repos.hierarchyIntakes.findBySessionId(input.sessionId);
  const record: HierarchyIntakeRecord = {
    hierarchyIntakeId: existing?.hierarchyIntakeId ?? id("hierarchy_intake"),
    sessionId: session.sessionId,
    caseId: session.caseId,
    inputMethod: "pasted_text",
    status: existing?.status === "structurally_approved" ? "structurally_approved" : "intake_created",
    pastedText: input.pastedText,
    createdBy: input.createdBy?.trim() || existing?.createdBy || "admin",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  const result = validateHierarchyIntakeRecord(record);
  if (!result.ok) throw new Error(`Invalid hierarchy intake: ${validationMessage(result.errors)}`);
  repos.hierarchyIntakes.save(record);
  return record;
}

export function createUploadedDocumentHierarchyIntake(input: {
  sessionId: string;
  sourceId: string;
  artifactId?: string;
  createdBy?: string;
}, repos: HierarchyFoundationRepos): HierarchyIntakeRecord {
  const session = repos.intakeSessions.findById(input.sessionId);
  if (!session) throw new Error(`Intake session not found: ${input.sessionId}`);

  const timestamp = now();
  const existing = repos.hierarchyIntakes.findBySessionId(input.sessionId);
  const record: HierarchyIntakeRecord = {
    hierarchyIntakeId: existing?.hierarchyIntakeId ?? id("hierarchy_intake"),
    sessionId: session.sessionId,
    caseId: session.caseId,
    inputMethod: "uploaded_document",
    status: existing?.status === "structurally_approved" ? "structurally_approved" : "intake_created",
    sourceId: input.sourceId,
    artifactId: input.artifactId,
    createdBy: input.createdBy?.trim() || existing?.createdBy || "admin",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  const result = validateHierarchyIntakeRecord(record);
  if (!result.ok) throw new Error(`Invalid hierarchy intake: ${validationMessage(result.errors)}`);
  repos.hierarchyIntakes.save(record);
  return record;
}

export function saveManualHierarchyDraft(input: {
  sessionId: string;
  nodes: HierarchyNodeRecord[];
  secondaryRelationships?: HierarchySecondaryRelationship[];
  createdBy?: string;
  correctionNote?: string;
}, repos: HierarchyFoundationRepos): HierarchyDraftRecord {
  const intake = repos.hierarchyIntakes.findBySessionId(input.sessionId);
  if (!intake) throw new Error("Create hierarchy intake before saving a manual draft.");

  const validation = validateHierarchyNodes({
    nodes: input.nodes,
    secondaryRelationships: input.secondaryRelationships ?? [],
  });
  if (!validation.ok) throw new Error(validation.errors.join(" "));

  const timestamp = now();
  const existing = repos.hierarchyDrafts.findBySessionId(input.sessionId);
  const draft: HierarchyDraftRecord = {
    hierarchyDraftId: existing?.hierarchyDraftId ?? id("hierarchy_draft"),
    hierarchyIntakeId: intake.hierarchyIntakeId,
    sessionId: intake.sessionId,
    caseId: intake.caseId,
    status: "manual_admin_created",
    nodes: cloneNodes(input.nodes),
    secondaryRelationships: cloneRelationships(input.secondaryRelationships ?? []),
    createdBy: input.createdBy?.trim() || existing?.createdBy || "admin",
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  const draftResult = validateHierarchyDraftRecord(draft);
  if (!draftResult.ok) throw new Error(`Invalid hierarchy draft: ${validationMessage(draftResult.errors)}`);
  repos.hierarchyDrafts.save(draft);

  const correction: HierarchyCorrectionEvent = {
    correctionId: id("hierarchy_correction"),
    hierarchyDraftId: draft.hierarchyDraftId,
    sessionId: draft.sessionId,
    caseId: draft.caseId,
    correctedBy: input.createdBy?.trim() || "admin",
    correctedAt: timestamp,
    correctionNote: input.correctionNote,
    nodes: cloneNodes(draft.nodes),
    secondaryRelationships: cloneRelationships(draft.secondaryRelationships),
  };
  const correctionResult = validateHierarchyCorrectionEvent(correction);
  if (!correctionResult.ok) throw new Error(`Invalid hierarchy correction: ${validationMessage(correctionResult.errors)}`);
  repos.hierarchyCorrections.save(correction);

  repos.hierarchyIntakes.save({ ...intake, status: "manual_draft_saved", updatedAt: timestamp });
  return draft;
}

export async function generateProviderBackedHierarchyDraft(input: {
  sessionId: string;
  provider: HierarchyDraftProvider | null;
  promptSpecId: string;
  compiledPrompt: string;
}, repos: HierarchyFoundationRepos): Promise<HierarchyDraftRecord> {
  const intake = repos.hierarchyIntakes.findBySessionId(input.sessionId);
  if (!intake) throw new Error("Create hierarchy intake before generating an AI hierarchy draft.");

  const timestamp = now();
  const existing = repos.hierarchyDrafts.findBySessionId(input.sessionId);

  if (!input.provider) {
    const failed: HierarchyDraftRecord = {
      hierarchyDraftId: existing?.hierarchyDraftId ?? id("hierarchy_draft"),
      hierarchyIntakeId: intake.hierarchyIntakeId,
      sessionId: intake.sessionId,
      caseId: intake.caseId,
      status: "ai_draft_failed",
      nodes: [],
      secondaryRelationships: [],
      createdBy: existing?.createdBy ?? "provider",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      promptSpecId: input.promptSpecId,
      compiledPrompt: input.compiledPrompt,
      errorMessage: "Google hierarchy draft provider configuration is missing.",
    };
    const result = validateHierarchyDraftRecord(failed);
    if (!result.ok) throw new Error(`Invalid failed hierarchy draft: ${validationMessage(result.errors)}`);
    repos.hierarchyDrafts.save(failed);
    return failed;
  }

  try {
    const generated = await input.provider.generateHierarchyDraft({
      compiledPrompt: input.compiledPrompt,
    });
    const validation = validateHierarchyNodes({
      nodes: generated.nodes,
      secondaryRelationships: generated.secondaryRelationships,
    });
    if (!validation.ok) {
      throw new Error(`Provider returned invalid hierarchy draft: ${validation.errors.join(" ")}`);
    }

    const draft: HierarchyDraftRecord = {
      hierarchyDraftId: existing?.hierarchyDraftId ?? id("hierarchy_draft"),
      hierarchyIntakeId: intake.hierarchyIntakeId,
      sessionId: intake.sessionId,
      caseId: intake.caseId,
      status: "ai_draft_succeeded",
      nodes: cloneNodes(generated.nodes),
      secondaryRelationships: cloneRelationships(generated.secondaryRelationships),
      createdBy: existing?.createdBy ?? "provider",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      provider: generated.provider,
      model: generated.model,
      promptSpecId: input.promptSpecId,
      compiledPrompt: input.compiledPrompt,
      rawProviderOutput: generated.rawText,
      warnings: generated.warnings,
    };
    const result = validateHierarchyDraftRecord(draft);
    if (!result.ok) throw new Error(`Invalid AI hierarchy draft: ${validationMessage(result.errors)}`);
    repos.hierarchyDrafts.save(draft);
    return draft;
  } catch (error) {
    const failed: HierarchyDraftRecord = {
      hierarchyDraftId: existing?.hierarchyDraftId ?? id("hierarchy_draft"),
      hierarchyIntakeId: intake.hierarchyIntakeId,
      sessionId: intake.sessionId,
      caseId: intake.caseId,
      status: "ai_draft_failed",
      nodes: [],
      secondaryRelationships: [],
      createdBy: existing?.createdBy ?? "provider",
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      provider: input.provider.name,
      promptSpecId: input.promptSpecId,
      compiledPrompt: input.compiledPrompt,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
    const result = validateHierarchyDraftRecord(failed);
    if (!result.ok) throw new Error(`Invalid failed hierarchy draft: ${validationMessage(result.errors)}`);
    repos.hierarchyDrafts.save(failed);
    return failed;
  }
}

function requireSourceTriageRepos(repos: HierarchyFoundationRepos): {
  jobs: SourceHierarchyTriageJobRepository;
  suggestions: SourceHierarchyTriageSuggestionRepository;
} {
  if (!repos.sourceHierarchyTriageJobs || !repos.sourceHierarchyTriageSuggestions) {
    throw new Error("Source-to-hierarchy triage repositories are not configured.");
  }
  return {
    jobs: repos.sourceHierarchyTriageJobs,
    suggestions: repos.sourceHierarchyTriageSuggestions,
  };
}

export async function generateProviderBackedSourceHierarchyTriage(input: {
  sessionId: string;
  provider: SourceHierarchyTriageProvider | null;
  promptSpecId: string;
  compiledPrompt: string;
}, repos: HierarchyFoundationRepos): Promise<{
  job: SourceHierarchyTriageJob;
  suggestions: SourceHierarchyTriageSuggestion[];
}> {
  const session = repos.intakeSessions.findById(input.sessionId);
  if (!session) throw new Error(`Intake session not found: ${input.sessionId}`);
  const triageRepos = requireSourceTriageRepos(repos);

  const timestamp = now();
  if (!input.provider) {
    const job: SourceHierarchyTriageJob = {
      triageJobId: id("source_hierarchy_triage_job"),
      sessionId: session.sessionId,
      caseId: session.caseId,
      status: "ai_triage_failed",
      promptSpecId: input.promptSpecId,
      compiledPrompt: input.compiledPrompt,
      errorMessage: "Google source-to-hierarchy triage provider configuration is missing.",
      createdBy: "provider",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const result = validateSourceHierarchyTriageJob(job);
    if (!result.ok) throw new Error(`Invalid failed source triage job: ${validationMessage(result.errors)}`);
    triageRepos.jobs.save(job);
    return { job, suggestions: triageRepos.suggestions.findBySessionId(session.sessionId) };
  }

  try {
    const generated = await input.provider.generateSourceHierarchyTriage({ compiledPrompt: input.compiledPrompt });
    const job: SourceHierarchyTriageJob = {
      triageJobId: id("source_hierarchy_triage_job"),
      sessionId: session.sessionId,
      caseId: session.caseId,
      status: "ai_triage_succeeded",
      provider: generated.provider,
      model: generated.model,
      promptSpecId: input.promptSpecId,
      compiledPrompt: input.compiledPrompt,
      rawProviderOutput: generated.rawText,
      createdBy: "provider",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const jobResult = validateSourceHierarchyTriageJob(job);
    if (!jobResult.ok) throw new Error(`Invalid source triage job: ${validationMessage(jobResult.errors)}`);
    triageRepos.jobs.save(job);

    const suggestions = generated.suggestions.map((suggestion) => ({
      ...suggestion,
      triageId: id("source_hierarchy_triage"),
      triageJobId: job.triageJobId,
      sessionId: session.sessionId,
      caseId: session.caseId,
      evidenceStatus: suggestion.evidenceStatus ?? "document_claim_only",
      participantValidationNeeded: suggestion.participantValidationNeeded,
      adminDecision: "pending_review" as const,
      provider: generated.provider,
      model: generated.model,
      promptSpecId: input.promptSpecId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    for (const suggestion of suggestions) {
      const result = validateSourceHierarchyTriageSuggestion(suggestion);
      if (!result.ok) throw new Error(`Invalid source triage suggestion: ${validationMessage(result.errors)}`);
      triageRepos.suggestions.save(suggestion);
    }
    return { job, suggestions: triageRepos.suggestions.findBySessionId(session.sessionId) };
  } catch (error) {
    const job: SourceHierarchyTriageJob = {
      triageJobId: id("source_hierarchy_triage_job"),
      sessionId: session.sessionId,
      caseId: session.caseId,
      status: "ai_triage_failed",
      provider: input.provider.name,
      promptSpecId: input.promptSpecId,
      compiledPrompt: input.compiledPrompt,
      errorMessage: error instanceof Error ? error.message : String(error),
      createdBy: "provider",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const result = validateSourceHierarchyTriageJob(job);
    if (!result.ok) throw new Error(`Invalid failed source triage job: ${validationMessage(result.errors)}`);
    triageRepos.jobs.save(job);
    return { job, suggestions: triageRepos.suggestions.findBySessionId(session.sessionId) };
  }
}

export function createManualSourceHierarchyLink(input: {
  sessionId: string;
  sourceId: string;
  sourceName: string;
  suggestedScope: SourceHierarchySuggestedScope;
  linkedNodeId?: string;
  linkedScopeLevel?: SourceHierarchySuggestedScope;
  signalType?: SourceHierarchyTriageSuggestion["signalType"];
  suggestedReason?: string;
  adminNote?: string;
  participantValidationNeeded?: boolean;
  createdBy?: string;
}, repos: HierarchyFoundationRepos): SourceHierarchyTriageSuggestion {
  const session = repos.intakeSessions.findById(input.sessionId);
  if (!session) throw new Error(`Intake session not found: ${input.sessionId}`);
  const triageRepos = requireSourceTriageRepos(repos);
  const timestamp = now();
  const job: SourceHierarchyTriageJob = {
    triageJobId: id("source_hierarchy_triage_job"),
    sessionId: session.sessionId,
    caseId: session.caseId,
    status: "manual_link_created",
    createdBy: input.createdBy?.trim() || "admin",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const jobResult = validateSourceHierarchyTriageJob(job);
  if (!jobResult.ok) throw new Error(`Invalid manual source triage job: ${validationMessage(jobResult.errors)}`);
  triageRepos.jobs.save(job);

  const suggestion: SourceHierarchyTriageSuggestion = {
    triageId: id("source_hierarchy_triage"),
    triageJobId: job.triageJobId,
    sessionId: session.sessionId,
    caseId: session.caseId,
    sourceId: input.sourceId,
    sourceName: input.sourceName || input.sourceId,
    suggestedScope: input.suggestedScope,
    linkedNodeId: input.linkedNodeId,
    linkedScopeLevel: input.linkedScopeLevel ?? input.suggestedScope,
    signalType: input.signalType ?? "unclear_scope_signal",
    suggestedReason: input.suggestedReason ?? "Manual admin source-to-hierarchy evidence candidate.",
    confidence: "unknown",
    evidenceStatus: input.participantValidationNeeded ? "participant_validation_needed" : "admin_confirmed_relevance",
    participantValidationNeeded: input.participantValidationNeeded ?? false,
    adminReviewQuestion: "Manual admin-created source relevance link; confirm this remains an evidence candidate and not workflow truth.",
    adminDecision: input.participantValidationNeeded ? "participant_validation_needed" : "accepted_link",
    adminNote: input.adminNote,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const result = validateSourceHierarchyTriageSuggestion(suggestion);
  if (!result.ok) throw new Error(`Invalid manual source triage suggestion: ${validationMessage(result.errors)}`);
  triageRepos.suggestions.save(suggestion);
  return suggestion;
}

export function updateSourceHierarchyTriageSuggestion(input: {
  triageId: string;
  action: "accept" | "reject" | "change_scope" | "mark_participant_validation_needed" | "add_note";
  suggestedScope?: SourceHierarchySuggestedScope;
  linkedNodeId?: string;
  linkedScopeLevel?: SourceHierarchySuggestedScope;
  adminNote?: string;
}, repos: HierarchyFoundationRepos): SourceHierarchyTriageSuggestion {
  const triageRepos = requireSourceTriageRepos(repos);
  const existing = triageRepos.suggestions.findById(input.triageId);
  if (!existing) throw new Error(`Source hierarchy triage suggestion not found: ${input.triageId}`);

  let evidenceStatus: SourceHierarchyEvidenceStatus = existing.evidenceStatus;
  let adminDecision: SourceHierarchyAdminDecision = existing.adminDecision;
  let participantValidationNeeded = existing.participantValidationNeeded;
  let suggestedScope = existing.suggestedScope;
  let linkedScopeLevel = existing.linkedScopeLevel;
  let linkedNodeId = existing.linkedNodeId;

  if (input.action === "accept") {
    evidenceStatus = "admin_confirmed_relevance";
    adminDecision = "accepted_link";
  } else if (input.action === "reject") {
    evidenceStatus = "rejected_by_admin";
    adminDecision = "rejected_link";
  } else if (input.action === "change_scope") {
    suggestedScope = input.suggestedScope ?? existing.suggestedScope;
    linkedScopeLevel = input.linkedScopeLevel ?? suggestedScope;
    linkedNodeId = input.linkedNodeId ?? existing.linkedNodeId;
    evidenceStatus = "scope_changed_by_admin";
    adminDecision = "changed_scope";
  } else if (input.action === "mark_participant_validation_needed") {
    participantValidationNeeded = true;
    evidenceStatus = "participant_validation_needed";
    adminDecision = "participant_validation_needed";
  } else if (input.action === "add_note") {
    adminDecision = "admin_note_added";
  }

  const updated: SourceHierarchyTriageSuggestion = {
    ...existing,
    suggestedScope,
    linkedScopeLevel,
    linkedNodeId,
    evidenceStatus,
    participantValidationNeeded,
    adminDecision,
    adminNote: input.adminNote ?? existing.adminNote,
    updatedAt: now(),
  };
  const result = validateSourceHierarchyTriageSuggestion(updated);
  if (!result.ok) throw new Error(`Invalid source triage update: ${validationMessage(result.errors)}`);
  triageRepos.suggestions.save(updated);
  return updated;
}

export function approveStructuralHierarchy(input: {
  sessionId: string;
  approvedBy?: string;
}, repos: HierarchyFoundationRepos): ApprovedHierarchySnapshot {
  const draft = repos.hierarchyDrafts.findBySessionId(input.sessionId);
  if (!draft) throw new Error("Manual hierarchy draft must be saved before structural approval.");
  const existing = repos.approvedHierarchySnapshots.findBySessionId(input.sessionId);
  if (existing) return existing;

  const snapshot: ApprovedHierarchySnapshot = {
    approvedSnapshotId: id("approved_hierarchy"),
    hierarchyDraftId: draft.hierarchyDraftId,
    sessionId: draft.sessionId,
    caseId: draft.caseId,
    nodes: cloneNodes(draft.nodes),
    secondaryRelationships: cloneRelationships(draft.secondaryRelationships),
    structuralApprovalOnly: true,
    approvalScopeNote:
      "Admin approval confirms hierarchy structure only. It does not validate responsibilities, KPIs, SOPs, policies, source claims, or workflow reality.",
    approvedBy: input.approvedBy?.trim() || "admin",
    approvedAt: now(),
  };
  const result = validateApprovedHierarchySnapshot(snapshot);
  if (!result.ok) throw new Error(`Invalid approved hierarchy snapshot: ${validationMessage(result.errors)}`);
  repos.approvedHierarchySnapshots.save(snapshot);

  const intake = repos.hierarchyIntakes.findBySessionId(input.sessionId);
  if (intake) {
    repos.hierarchyIntakes.save({ ...intake, status: "structurally_approved", updatedAt: snapshot.approvedAt });
  }
  return snapshot;
}

export function calculateHierarchyReadinessSnapshot(
  sessionId: string,
  repos: HierarchyFoundationRepos,
): HierarchyReadinessSnapshot {
  const session = repos.intakeSessions.findById(sessionId);
  if (!session) throw new Error(`Intake session not found: ${sessionId}`);

  const approved = repos.approvedHierarchySnapshots.findBySessionId(sessionId);
  const reasons: string[] = [];
  if (!approved) reasons.push("Structural hierarchy approval snapshot has not been created.");
  if (approved && approved.nodes.length === 0) reasons.push("Approved hierarchy snapshot has no nodes.");

  const snapshot: HierarchyReadinessSnapshot = {
    readinessSnapshotId: id("hierarchy_readiness"),
    sessionId: session.sessionId,
    caseId: session.caseId,
    status: reasons.length === 0 ? "ready_for_participant_targeting_planning" : "blocked",
    approvedSnapshotId: approved?.approvedSnapshotId,
    nodeCount: approved?.nodes.length ?? 0,
    relationshipCount: approved?.secondaryRelationships.length ?? 0,
    reasons,
    pass4Boundary: {
      participantTargetingCreated: false,
      rolloutOrderCreated: false,
      sessionsCreated: false,
    },
    createdAt: now(),
  };
  const result = validateHierarchyReadinessSnapshot(snapshot);
  if (!result.ok) throw new Error(`Invalid hierarchy readiness snapshot: ${validationMessage(result.errors)}`);
  repos.hierarchyReadinessSnapshots.save(snapshot);
  return snapshot;
}

export function getHierarchyFoundationState(sessionId: string, repos: HierarchyFoundationRepos) {
  const sourceTriageRepos = repos.sourceHierarchyTriageJobs && repos.sourceHierarchyTriageSuggestions
    ? {
      sourceTriageJobs: repos.sourceHierarchyTriageJobs.findBySessionId(sessionId),
      latestSourceTriageJob: repos.sourceHierarchyTriageJobs.findLatestBySessionId(sessionId),
      sourceTriageSuggestions: repos.sourceHierarchyTriageSuggestions.findBySessionId(sessionId),
    }
    : {
      sourceTriageJobs: [],
      latestSourceTriageJob: null,
      sourceTriageSuggestions: [],
    };
  return {
    intake: repos.hierarchyIntakes.findBySessionId(sessionId),
    draft: repos.hierarchyDrafts.findBySessionId(sessionId),
    corrections: repos.hierarchyCorrections.findBySessionId(sessionId),
    approvedSnapshot: repos.approvedHierarchySnapshots.findBySessionId(sessionId),
    readinessSnapshot: repos.hierarchyReadinessSnapshots.findBySessionId(sessionId),
    ...sourceTriageRepos,
    groupingLayers: HIERARCHY_GROUPING_LAYERS,
    secondaryRelationshipTypes: SECONDARY_RELATIONSHIP_TYPES,
    sourceTriageSuggestedScopes: SOURCE_TRIAGE_SUGGESTED_SCOPES,
  };
}
