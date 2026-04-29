import type { HierarchyInputMethod } from "./intake.js";

/**
 * Pass 3 — Hierarchy Intake & Approval foundation contracts.
 *
 * These contracts model structural hierarchy intake only. They do not select
 * participants, create rollout order, create sessions, or validate workflow truth.
 */

export type HierarchyIntakeStatus =
  | "intake_created"
  | "manual_draft_saved"
  | "structurally_approved";

export type HierarchyGroupingLayer =
  | "owner_or_executive"
  | "director_layer"
  | "manager_layer"
  | "supervisor_layer"
  | "senior_individual_contributor"
  | "frontline_operational"
  | "support_role"
  | "shared_service_role"
  | "approval_or_control_role"
  | "external_interface"
  | "system_or_queue_node"
  | "committee_or_group"
  | "temporary_or_project_role"
  | "unknown"
  | "custom";

export type HierarchySecondaryRelationshipType =
  | "dotted_line_manager"
  | "cross_functional_responsibility"
  | "shared_supervision"
  | "dual_reporting"
  | "temporary_project_reporting"
  | "operational_dependency"
  | "approval_relationship"
  | "matrix_relationship"
  | "external_interface_relationship"
  | "custom";

export type HierarchyConfidence = "high" | "medium" | "low" | "unknown";

export type HierarchySourceBasis =
  | "admin_entered"
  | "pasted_text"
  | "uploaded_document"
  | "source_evidence_candidate"
  | "unknown";

export interface HierarchyIntakeRecord {
  hierarchyIntakeId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  inputMethod: HierarchyInputMethod;
  status: HierarchyIntakeStatus;
  pastedText?: string;
  sourceId?: string;
  artifactId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HierarchyNodeRecord {
  nodeId: string;
  roleLabel: string;
  groupLayer: HierarchyGroupingLayer;
  customGroupLabel?: string;
  customGroupReason?: string;
  primaryParentNodeId?: string;
  personName?: string;
  employeeId?: string;
  internalIdentifier?: string;
  occupantOfRole?: string;
  candidateParticipantFlag?: boolean;
  personRoleConfidence?: HierarchyConfidence;
  notes?: string;
}

export interface HierarchySecondaryRelationship {
  relationshipId: string;
  fromNodeId: string;
  relatedNodeId: string;
  relationshipType: HierarchySecondaryRelationshipType;
  relationshipScope: string;
  reasonOrNote: string;
  confidence: HierarchyConfidence;
  sourceBasis: HierarchySourceBasis;
}

export interface HierarchyDraftRecord {
  hierarchyDraftId: string;
  hierarchyIntakeId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  status: "manual_admin_created" | "ai_draft_succeeded" | "ai_draft_failed";
  nodes: HierarchyNodeRecord[];
  secondaryRelationships: HierarchySecondaryRelationship[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  provider?: "google" | "openai";
  model?: string;
  promptSpecId?: string;
  compiledPrompt?: string;
  rawProviderOutput?: string;
  warnings?: string[];
  errorMessage?: string;
}

export interface HierarchyCorrectionEvent {
  correctionId: string;
  hierarchyDraftId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  correctedBy: string;
  correctedAt: string;
  correctionNote?: string;
  nodes: HierarchyNodeRecord[];
  secondaryRelationships: HierarchySecondaryRelationship[];
}

export interface ApprovedHierarchySnapshot {
  approvedSnapshotId: string;
  hierarchyDraftId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  nodes: HierarchyNodeRecord[];
  secondaryRelationships: HierarchySecondaryRelationship[];
  structuralApprovalOnly: true;
  approvalScopeNote: string;
  approvedBy: string;
  approvedAt: string;
}

export interface HierarchyReadinessSnapshot {
  readinessSnapshotId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  status: "blocked" | "ready_for_participant_targeting_planning";
  approvedSnapshotId?: string;
  nodeCount: number;
  relationshipCount: number;
  reasons: string[];
  pass4Boundary: {
    participantTargetingCreated: false;
    rolloutOrderCreated: false;
    sessionsCreated: false;
  };
  createdAt: string;
}

export interface SourceHierarchyEvidenceCandidate {
  evidenceCandidateId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  sourceId: string;
  nodeId?: string;
  relationshipId?: string;
  tentativeEvidenceCandidate: true;
  relevanceNote: string;
  createdAt: string;
}

export type SourceHierarchySignalType =
  | "role_name_signal"
  | "department_scope_signal"
  | "kpi_or_target_signal"
  | "responsibility_signal"
  | "approval_or_authority_signal"
  | "system_or_queue_signal"
  | "person_name_signal"
  | "cross_functional_signal"
  | "external_interface_signal"
  | "unclear_scope_signal";

export type SourceHierarchySuggestedScope =
  | "company_wide"
  | "department_wide"
  | "team_or_unit"
  | "role_specific"
  | "person_or_occupant"
  | "system_or_queue"
  | "approval_or_control_node"
  | "external_interface"
  | "unknown_needs_review";

export type SourceHierarchyEvidenceStatus =
  | "document_claim_only"
  | "admin_confirmed_relevance"
  | "participant_validation_needed"
  | "rejected_by_admin"
  | "scope_changed_by_admin";

export type SourceHierarchyAdminDecision =
  | "pending_review"
  | "accepted_link"
  | "rejected_link"
  | "changed_scope"
  | "participant_validation_needed"
  | "admin_note_added";

export type SourceHierarchyTriageJobStatus = "ai_triage_succeeded" | "ai_triage_failed" | "manual_link_created";

export interface SourceHierarchyTriageJob {
  triageJobId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  status: SourceHierarchyTriageJobStatus;
  provider?: "google" | "openai";
  model?: string;
  promptSpecId?: string;
  compiledPrompt?: string;
  rawProviderOutput?: string;
  errorMessage?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceHierarchyTriageSuggestion {
  triageId: string;
  triageJobId?: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  sourceId: string;
  sourceName: string;
  suggestedScope: SourceHierarchySuggestedScope;
  linkedNodeId?: string;
  linkedScopeLevel?: SourceHierarchySuggestedScope;
  signalType: SourceHierarchySignalType;
  suggestedReason: string;
  confidence: HierarchyConfidence;
  evidenceStatus: SourceHierarchyEvidenceStatus;
  participantValidationNeeded: boolean;
  adminReviewQuestion: string;
  adminDecision: SourceHierarchyAdminDecision;
  adminNote?: string;
  provider?: "google" | "openai";
  model?: string;
  promptSpecId?: string;
  createdAt: string;
  updatedAt: string;
}
