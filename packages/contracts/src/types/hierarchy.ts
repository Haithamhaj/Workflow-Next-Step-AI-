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
  caseId: string;
  status: "manual_admin_created";
  nodes: HierarchyNodeRecord[];
  secondaryRelationships: HierarchySecondaryRelationship[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HierarchyCorrectionEvent {
  correctionId: string;
  hierarchyDraftId: string;
  sessionId: string;
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
  caseId: string;
  sourceId: string;
  nodeId?: string;
  relationshipId?: string;
  tentativeEvidenceCandidate: true;
  relevanceNote: string;
  createdAt: string;
}
