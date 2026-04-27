/**
 * Hand-mirrored TypeScript types for Pass 6 Block 1 seam contracts.
 * Source of truth is src/schemas/pass6-core.schema.json.
 *
 * These contracts define shared shapes only. They do not implement Pass 6A
 * bundle building, 6B analysis, Pre-6C gating, 6C output generation,
 * visual-core integration, Copilot write authority, or Pass 7 mechanics.
 */

export interface Pass6Reference {
  referenceId: string;
  referenceType: string;
  label?: string;
  sourceId?: string;
  sessionId?: string;
  evidenceItemId?: string;
  quote?: string;
  notes?: string;
}

export interface Pass6SourceBasis {
  basisId: string;
  basisType:
    | "pass5_output"
    | "raw_evidence"
    | "extraction"
    | "clarification"
    | "boundary_signal"
    | "handoff_candidate"
    | "admin_note"
    | "source_document"
    | "method_output"
    | "other";
  summary?: string;
  references: Pass6Reference[];
}

export interface Pass6RoleLayerContext {
  contextId: string;
  participantId?: string;
  sessionId?: string;
  targetCandidateId?: string;
  participantRole?: string;
  hierarchyNodeId?: string;
  department?: string;
  selectedUseCase?: string;
  layer?: string;
  groupingLayerCategory?: string;
  levelHint?: string;
  inUseCaseScope?: boolean;
  participantTargetType?: string;
  authorityScope?: string;
  notes?: string;
}

export interface Pass6TruthLensContext {
  contextId: string;
  lensType:
    | "execution_evidence"
    | "oversight_evidence"
    | "approval_control_evidence"
    | "policy_intent_evidence"
    | "handoff_dependency_evidence"
    | "document_signal_evidence";
  summary?: string;
  limitations?: string[];
}

export interface Pass6PreparedMaterialItem {
  itemId: string;
  itemType: string;
  summary: string;
  basis: Pass6SourceBasis;
  roleLayerContextIds?: string[];
  truthLensContextIds?: string[];
  notes?: string;
}

export interface SynthesisInputBundle {
  bundleId: string;
  caseId: string;
  createdAt: string;
  sourcePass5SessionIds: string[];
  analysis_material: Pass6PreparedMaterialItem[];
  boundary_role_limit_material: Pass6PreparedMaterialItem[];
  gap_risk_no_drop_material: Pass6PreparedMaterialItem[];
  document_source_signal_material: Pass6PreparedMaterialItem[];
  roleLayerContexts: Pass6RoleLayerContext[];
  truthLensContexts: Pass6TruthLensContext[];
  preparationSummary: {
    preparedBy: "system" | "admin" | "system_with_admin_review";
    summary: string;
    acceptedPass5Only?: boolean;
    doesNotRevalidatePass5?: boolean;
    noDropNotes: string[];
  };
}

export type WorkflowUnitType =
  | "action_step"
  | "trigger_input"
  | "output_outcome"
  | "sequence_signal"
  | "decision_rule"
  | "approval_control"
  | "handoff"
  | "exception"
  | "boundary"
  | "information_context"
  | "unknown_gap";

export interface WorkflowUnit {
  unitId: string;
  caseId: string;
  bundleId: string;
  unitType: WorkflowUnitType;
  unitText: string;
  roleLayerContextId?: string;
  basis: Pass6SourceBasis;
  notes?: string;
}

export type WorkflowClaimType =
  | "execution_claim"
  | "sequence_claim"
  | "decision_rule_claim"
  | "ownership_claim"
  | "boundary_claim";

export type WorkflowClaimStatus =
  | "proposed"
  | "accepted_for_assembly"
  | "warning"
  | "unresolved"
  | "review_needed";

export interface WorkflowClaim {
  claimId: string;
  caseId: string;
  bundleId: string;
  primaryClaimType: WorkflowClaimType;
  secondaryClaimTypes?: WorkflowClaimType[];
  claimText?: string;
  normalizedStatement: string;
  sourceParticipantIds?: string[];
  sourceSessionIds?: string[];
  sourceLayerContextIds?: string[];
  truthLensContextIds?: string[];
  unitIds: string[];
  basis: Pass6SourceBasis;
  confidence?: "high" | "medium" | "low" | "unknown";
  materiality?: "high" | "medium" | "low" | "unknown";
  status: WorkflowClaimStatus;
}

export type AnalysisMethodKey =
  | "bpmn_process_structure"
  | "sipoc_boundary"
  | "triangulation"
  | "espoused_theory_vs_theory_in_use"
  | "raci_responsibility"
  | "ssm_multi_perspective"
  | "apqc_vocabulary";

export interface AnalysisMethodUsage {
  methodUsageId: string;
  methodId: string;
  methodKey: AnalysisMethodKey;
  methodName: string;
  methodType:
    | "process_structure_lens"
    | "boundary_lens"
    | "evidence_lens"
    | "practice_reality_lens"
    | "responsibility_lens"
    | "multi_perspective_lens"
    | "vocabulary_lens";
  version: string;
  selectionReason: string;
  selectionSource: "system_selected" | "admin_forced";
  methodRole?: "primary" | "secondary" | "supporting" | "admin_forced";
  appliedToType:
    | "bundle"
    | "workflow_unit"
    | "claim"
    | "difference"
    | "workflow_draft"
    | "readiness_assessment"
    | "gap"
    | "package_section";
  appliedToId: string;
  outputSummary: string;
  impact: {
    affectedIds: string[];
    impactSummary: string;
    changedRouting?: boolean;
    changedReadiness?: boolean;
  };
  suitabilityAssessment: {
    suitable: boolean;
    notes: string;
    limitations?: string[];
  };
}

export interface DifferenceInterpretation {
  differenceId: string;
  caseId: string;
  involvedClaimIds: string[];
  involvedLayers?: string[];
  involvedRoles?: string[];
  differenceType: "completion" | "variant" | "normative_reality_mismatch" | "factual_conflict";
  materiality?: "high" | "medium" | "low" | "unknown";
  recommendedRoute:
    | "carry_as_completion"
    | "carry_as_variant"
    | "warning"
    | "clarification_needed"
    | "review_candidate"
    | "blocker_candidate";
  explanation: string;
  methodUsageIds?: string[];
  notPerformanceEvaluation?: boolean;
}

export type WorkflowUnderstandingLevel =
  | "partial_workflow_understanding"
  | "reconstructable_workflow_with_gaps"
  | "package_ready_workflow"
  | "workflow_exists_but_not_package_ready";

export interface WorkflowElement {
  elementId: string;
  label: string;
  description?: string;
  claimIds?: string[];
  basis?: Pass6SourceBasis;
}

export interface ClaimBasisEntry {
  workflowElementId: string;
  claimIds: string[];
  sourceUnitIds?: string[];
  participantIds?: string[];
  sessionIds?: string[];
  layerContextIds?: string[];
  truthLensContextIds?: string[];
  methodUsageIds?: string[];
  differenceIds?: string[];
  basis?: Pass6SourceBasis;
  confidence?: "high" | "medium" | "low" | "unknown";
  materiality?: "high" | "medium" | "low" | "unknown";
  notes?: string;
}

export interface Pass6RecordMetadata {
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export interface AssembledWorkflowDraft {
  draftId: string;
  caseId: string;
  basedOnBundleId: string;
  workflowUnderstandingLevel: WorkflowUnderstandingLevel;
  steps: WorkflowElement[];
  sequence: WorkflowElement[];
  decisions: WorkflowElement[];
  handoffs: WorkflowElement[];
  controls: WorkflowElement[];
  systemsTools: WorkflowElement[];
  variants: WorkflowElement[];
  warningsCaveats: string[];
  unresolvedItems: string[];
  claimBasisMap: ClaimBasisEntry[];
  metadata: Pass6RecordMetadata;
}

export type SevenConditionKey =
  | "core_sequence_continuity"
  | "step_to_step_connection"
  | "essential_step_requirements"
  | "decision_rules_thresholds"
  | "handoffs_responsibility"
  | "controls_approvals"
  | "use_case_boundary";

export type SevenConditionStatus =
  | "clear_enough"
  | "warning"
  | "materially_broken"
  | "unknown"
  | "not_applicable";

export interface SevenConditionAssessmentItem {
  status: SevenConditionStatus;
  rationale: string;
  basis: Pass6SourceBasis;
  blocksInitialPackage: boolean;
}

export type SevenConditionAssessmentMap = Record<
  SevenConditionKey,
  SevenConditionAssessmentItem
>;

export interface SevenConditionAssessment {
  assessmentId: string;
  caseId: string;
  assembledWorkflowDraftId: string;
  conditions: SevenConditionAssessmentMap;
  overallSummary: string;
}

export type WorkflowReadinessDecision =
  | "ready_for_initial_package"
  | "ready_for_initial_package_with_warnings"
  | "partial_only_not_package_ready"
  | "needs_more_clarification_before_package"
  | "needs_review_decision_before_package"
  | "workflow_exists_but_current_basis_insufficient";

export interface WorkflowReadinessResult {
  resultId: string;
  caseId: string;
  assembledWorkflowDraftId: string;
  readinessDecision: WorkflowReadinessDecision;
  sevenConditionAssessment: SevenConditionAssessment;
  gapRiskSummary: {
    summary: string;
    gapIds: string[];
    riskIds: string[];
  };
  allowedUseFor6C: Array<
    "initial_package" | "initial_package_with_warnings" | "gap_closure_brief" | "draft_operational_document" | "none"
  >;
  routingRecommendations: string[];
  analysisMetadata: Pass6RecordMetadata;
  is6CAllowed: boolean;
}

export type GateDecision =
  | "no_gate_block_package_allowed"
  | "clarification_required_before_package"
  | "review_decision_required_before_package"
  | "proceed_with_warnings_approved"
  | "package_blocked_gap_brief_required";

export interface ClarificationNeed {
  clarificationNeedId: string;
  questionText: string;
  targetRecipient?: string;
  targetRole?: string;
  whyItMatters: string;
  relatedWorkflowElementId?: string;
  relatedGapId?: string;
  relatedSevenConditionKey?: SevenConditionKey | "unknown";
  expectedAnswerType:
    | "free_text"
    | "yes_no"
    | "owner_name"
    | "threshold_value"
    | "system_name"
    | "document_reference"
    | "sequence_order"
    | "approval_rule"
    | "other";
  exampleAnswer?: string;
  blockingStatus: "blocking" | "non_blocking";
  basis: Pass6SourceBasis;
  recommendedChannel:
    | "admin_review"
    | "participant_follow_up"
    | "manager_follow_up"
    | "source_document_review"
    | "external_interface_review"
    | "other";
  priority: "high" | "medium" | "low";
}

export interface InquiryPacket {
  inquiryPacketId: string;
  caseId: string;
  targetRole?: string;
  targetRecipient?: string;
  clarificationNeeds: ClarificationNeed[];
  packetStatus: "draft_not_sent" | "ready_for_admin_review" | "superseded";
  createdAt: string;
}

export interface PrePackageGateResult {
  gateResultId: string;
  caseId: string;
  workflowReadinessResultId: string;
  gateDecision: GateDecision;
  clarificationNeeds: ClarificationNeed[];
  inquiryPackets: InquiryPacket[];
  proceedWithWarningsApproval?: {
    approvedBy: string;
    approvedAt: string;
    approvalNote: string;
  };
}

export interface PackageSection {
  sectionId: string;
  title: string;
  contentSummary: string;
  basisClaimIds?: string[];
}

export type InitialWorkflowPackageStatus =
  | "initial_package_ready"
  | "initial_package_ready_with_warnings"
  | "initial_package_admin_approved_with_limitations"
  | "initial_package_blocked"
  | "partial_output_only";

export interface InitialWorkflowPackage {
  packageId: string;
  caseId: string;
  workflowReadinessResultId: string;
  packageStatus: InitialWorkflowPackageStatus;
  clientFacingSections: PackageSection[];
  adminInternalAppendix?: string;
  warningsCaveats: string[];
  interfacesDependencies: string[];
  documentReferenceImplications?: string[];
  metadata: Pass6RecordMetadata;
}

export interface WorkflowGapClosureBrief {
  briefId: string;
  caseId: string;
  packageBlockedReason: string;
  currentlyVisibleWorkflow: string;
  brokenUnknownConditions: string[];
  gapsToClose: string[];
  recommendedClarificationRoute: string;
  nextStepToReachPackageReadiness: string;
}

export type DocumentDraftType =
  | "sop_draft"
  | "policy_draft"
  | "sla_supporting_reference_draft"
  | "work_instruction_draft"
  | "role_responsibility_guidance_draft"
  | "questionnaire_inquiry_set_draft";

export interface DraftOperationalDocument {
  draftId: string;
  caseId: string;
  documentDraftType: DocumentDraftType;
  draftStatus: "draft_only_not_approved" | "requested_but_not_ready" | "superseded";
  evidenceMaturitySummary: string;
  sections: PackageSection[];
  limitations: string[];
  metadata: Pass6RecordMetadata;
}

export type WorkflowGraphNodeType =
  | "start"
  | "end"
  | "step"
  | "decision"
  | "handoff"
  | "approval"
  | "control"
  | "system"
  | "document"
  | "interface"
  | "external"
  | "warning"
  | "unresolved"
  | "note"
  | "group"
  | "custom";

export type WorkflowGraphNodeStatus =
  | "confirmed"
  | "assumed"
  | "warning"
  | "unresolved"
  | "external_unvalidated"
  | "out_of_scope";

export type WorkflowGraphEdgeType =
  | "sequence"
  | "conditional"
  | "handoff"
  | "approval"
  | "dependency"
  | "reference"
  | "exception"
  | "feedback"
  | "custom";

export type WorkflowGraphEdgeStatus = "confirmed" | "assumed" | "warning" | "unresolved";

export interface WorkflowGraphNodeReference {
  id: string;
  type: WorkflowGraphNodeType;
  status: WorkflowGraphNodeStatus;
  label: string;
  [key: string]: unknown;
}

export interface WorkflowGraphEdgeReference {
  id: string;
  source: string;
  target: string;
  type: WorkflowGraphEdgeType;
  status: WorkflowGraphEdgeStatus;
  [key: string]: unknown;
}

export interface WorkflowGraphReferenceJson {
  nodes?: WorkflowGraphNodeReference[];
  edges?: WorkflowGraphEdgeReference[];
  [key: string]: unknown;
}

export interface WorkflowGraphRecord {
  visualRecordId: string;
  caseId: string;
  assembledWorkflowDraftId: string;
  workflowGraphJson: WorkflowGraphReferenceJson;
  workflowMermaid: string;
  workflowReactFlowModel: Record<string, unknown>;
  visualValidationErrors: string[];
}

export interface Pass6CopilotContextBundle {
  contextBundleId: string;
  caseId: string;
  bundleRefs: Pass6Reference[];
  claimRefs: Pass6Reference[];
  methodUsageRefs: Pass6Reference[];
  workflowDraftRefs: Pass6Reference[];
  readinessResultRefs: Pass6Reference[];
  gateResultRefs: Pass6Reference[];
  packageOrBriefRefs: Pass6Reference[];
  visualRecordRefs: Pass6Reference[];
  activeConfigPolicyRefs: Pass6Reference[];
  relevantAdminActionRefs: Pass6Reference[];
  readOnly: boolean;
}

export interface Pass7ReviewCandidate {
  candidateId: string;
  caseId: string;
  sourcePass6ResultId: string;
  issueType:
    | "claim_conflict"
    | "difference_unresolved"
    | "gap_blocks_package"
    | "evidence_weakness"
    | "admin_review_needed"
    | "external_interface_unvalidated"
    | "other";
  reason: string;
  linkedReferences: Pass6Reference[];
  recommendedReviewRoute: string;
  status: "candidate_open" | "candidate_deferred" | "candidate_dismissed" | "accepted_for_pass7_review";
}
