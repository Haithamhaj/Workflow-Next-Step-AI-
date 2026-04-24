import {
  validateApprovedHierarchySnapshot,
  validateHierarchyCorrectionEvent,
  validateHierarchyDraftRecord,
  validateHierarchyIntakeRecord,
  validateHierarchyReadinessSnapshot,
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
} from "@workflow/contracts";
import type {
  ApprovedHierarchySnapshotRepository,
  HierarchyCorrectionEventRepository,
  HierarchyDraftRepository,
  HierarchyIntakeRepository,
  HierarchyReadinessSnapshotRepository,
  IntakeSessionRepository,
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
} from "@workflow/contracts";

export interface HierarchyFoundationRepos {
  intakeSessions: IntakeSessionRepository;
  hierarchyIntakes: HierarchyIntakeRepository;
  hierarchyDrafts: HierarchyDraftRepository;
  hierarchyCorrections: HierarchyCorrectionEventRepository;
  approvedHierarchySnapshots: ApprovedHierarchySnapshotRepository;
  hierarchyReadinessSnapshots: HierarchyReadinessSnapshotRepository;
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
  return {
    intake: repos.hierarchyIntakes.findBySessionId(sessionId),
    draft: repos.hierarchyDrafts.findBySessionId(sessionId),
    corrections: repos.hierarchyCorrections.findBySessionId(sessionId),
    approvedSnapshot: repos.approvedHierarchySnapshots.findBySessionId(sessionId),
    readinessSnapshot: repos.hierarchyReadinessSnapshots.findBySessionId(sessionId),
    groupingLayers: HIERARCHY_GROUPING_LAYERS,
    secondaryRelationshipTypes: SECONDARY_RELATIONSHIP_TYPES,
  };
}
