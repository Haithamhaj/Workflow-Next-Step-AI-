export type StageCopilotStageKey =
  | "sources_context"
  | "hierarchy"
  | "targeting"
  | "participant_evidence"
  | "analysis_package"
  | "prompt_studio"
  | "advanced_debug"
  | "future_finalization";

export type StageCopilotRuntimeMode =
  | "disabled"
  | "static_profile"
  | "deterministic_mock"
  | "provider_backed";

export type StageCopilotPromptSpecKind =
  | "capability"
  | "stage_copilot"
  | "legacy_copilot_like"
  | "unknown_or_unclassified";

export type StageCopilotPromptSpecRefKind = StageCopilotPromptSpecKind;

export type StageCopilotPromptSpecTaxonomyStatus =
  | "native_current"
  | "legacy_current"
  | "planned"
  | "unknown_or_unclassified";

export interface StageCopilotPromptSpecLegacyMapping {
  existingPromptKey: string;
  existingLinkedModule?: string;
  sourceRegistry:
    | "structured_prompt_spec"
    | "pass5_prompt_family"
    | "pass6_prompt_workspace"
    | "stage_copilot_profile"
    | "external_or_unknown";
  migrationStatus: "legacy_current" | "metadata_only";
  notes?: string;
}

export interface StageCopilotPromptSpecClassification {
  kind: StageCopilotPromptSpecKind;
  taxonomyStatus: StageCopilotPromptSpecTaxonomyStatus;
  stageKey: StageCopilotStageKey;
  preservesExistingKey: boolean;
  legacyMapping?: StageCopilotPromptSpecLegacyMapping;
  notes?: string;
}

export interface StageCopilotPromptSpecRef {
  refId: string;
  promptSpecKey: string;
  kind: StageCopilotPromptSpecRefKind;
  classification?: StageCopilotPromptSpecClassification;
  linkedStage: StageCopilotStageKey;
  status?: "draft" | "active" | "previous" | "archived";
  version?: number;
  notes?: string;
}

export interface StageCopilotContextBundleRef {
  refId: string;
  bundleKey: string;
  linkedStage: StageCopilotStageKey;
  scope: "stage" | "case" | "session" | "selected_records" | "operator";
  version?: number;
  notes?: string;
}

export type StageCopilotSystemKnowledgeRefType =
  | "stage_purpose"
  | "stage_boundary"
  | "stage_rule"
  | "contract"
  | "gate"
  | "allowed_action"
  | "forbidden_action"
  | "capability_prompt"
  | "stage_copilot_prompt"
  | "proof_or_validation_logic"
  | "feature_behavior";

export interface StageCopilotSystemKnowledgeRef {
  refId: string;
  refType: StageCopilotSystemKnowledgeRefType;
  label: string;
  sourceRef: string;
  notes?: string;
}

export type StageCopilotCaseContextFamily =
  | "sources"
  | "extraction_jobs"
  | "source_role_scope_suggestions"
  | "hierarchy"
  | "targeting_packet"
  | "question_hint_seeds"
  | "participant_sessions"
  | "transcripts"
  | "clarification_answers"
  | "boundary_dispute_signals"
  | "synthesis_outputs"
  | "readiness_blockers"
  | "package_gate_state"
  | "prompt_test_results"
  | "provider_jobs"
  | "review_candidates";

export interface StageCopilotCaseContextRef {
  refId: string;
  family: StageCopilotCaseContextFamily;
  linkedStage: StageCopilotStageKey;
  scope: "case" | "session" | "selected_records" | "stage" | "operator";
  recordType?: string;
  notes?: string;
}

export type StageCopilotRetrievalMode =
  | "direct_id_lookup"
  | "evidence_anchor_lookup"
  | "stage_scoped_keyword_lookup"
  | "hybrid_exact_anchor_keyword_lookup"
  | "semantic_vector_lookup_future_optional";

export interface StageCopilotRetrievalScope {
  scopeId: string;
  allowedModes: StageCopilotRetrievalMode[];
  allowedRecordFamilies: StageCopilotCaseContextFamily[];
  citationRequired: boolean;
  auditRequired: boolean;
  executionMode: "declarative_only";
  notes?: string;
}

export type StageCopilotContextDataAccessMode =
  | "database_repository_lookup"
  | "scoped_record_reference_lookup"
  | "evidence_anchor_lookup"
  | "retrieval_search_index_lookup"
  | "hybrid_database_retrieval_lookup"
  | "semantic_vector_lookup_future_optional";

export interface StageCopilotContextDataAccessStrategy {
  strategyId: string;
  intendedContextModel:
    | "db_only"
    | "retrieval_only"
    | "anchor_based_evidence"
    | "hybrid_db_retrieval"
    | "future_semantic_retrieval";
  allowedModes: StageCopilotContextDataAccessMode[];
  executionMode: "declarative_only";
  notes?: string;
}

export type StageCopilotRefusalCategory =
  | "out_of_stage_topic"
  | "unrelated_topic"
  | "mutation_request"
  | "restricted_evidence_request"
  | "provider_execution_request"
  | "business_decision_request"
  | "package_release_authority_request"
  | "prompt_promotion_request"
  | "transcript_evidence_approval_request";

export interface StageCopilotRefusalPolicy {
  policyId: string;
  categories: StageCopilotRefusalCategory[];
  redirectToOwningStageAllowed: boolean;
  explainBoundary: boolean;
}

export interface StageCopilotConversationalBehaviorProfile {
  profileId: string;
  supportsMultiTurnDiscussion: boolean;
  supportsAdvisoryWhatIfReasoning: boolean;
  supportsChallengeCritique: boolean;
  supportsMethodLensExplanation: boolean;
  separatesRecommendationFromDecision: boolean;
  explanationDepth: "brief" | "standard" | "deep";
  challengeLevel: "none" | "light" | "moderate" | "strong";
  directness: "soft" | "balanced" | "direct";
  alternativesBehavior: "none" | "on_request" | "proactive_when_useful";
  uncertaintyHandling: "state_limits" | "highlight_uncertainty" | "challenge_unsupported_assumptions";
  citationBehavior: "none" | "cite_when_available" | "cite_or_request_evidence";
}

export interface StageCopilotAdvisoryModePolicy {
  policyId: string;
  advisoryWhatIfAllowed: boolean;
  advisoryOnly: true;
  labelHypotheticals: boolean;
  prohibitedOutcomes: StageCopilotForbiddenAction[];
}

export interface StageCopilotTargetReference {
  referenceType: string;
  referenceId: string;
  label?: string;
}

export interface StageCopilotRoutedRecommendation {
  actionKey: string;
  label: string;
  reason: string;
  owningArea: string;
  targetReference?: StageCopilotTargetReference;
  requiresAdminConfirmation: true;
  executesAutomatically: false;
}

export type StageCopilotForbiddenAction =
  | "approve_gates"
  | "approve_transcripts"
  | "approve_reject_evidence"
  | "mutate_records"
  | "run_providers"
  | "generate_packages"
  | "send_messages"
  | "change_readiness"
  | "change_package_eligibility"
  | "promote_prompts"
  | "release_final_package"
  | "execute_pass7_review_actions"
  | "alter_source_of_truth_records";

export interface StageCopilotReadWriteBoundary {
  readableScopes: string[];
  writePolicy: "no_writes";
  autonomousWritesAllowed: false;
  noAutonomousWrites: true;
  routedRecommendationsOnly: true;
  adminConfirmationRequired: true;
}

export type StageCopilotEvidenceAccessLevel =
  | "none"
  | "summary_only"
  | "anchored_evidence"
  | "restricted_raw_evidence"
  | "admin_approved_raw_evidence";

export interface StageCopilotEvidenceAccessPolicy {
  policyId: string;
  accessLevel: StageCopilotEvidenceAccessLevel;
  rawEvidenceRequiresAdminScope: boolean;
  citationRequiredForEvidence: boolean;
  restrictedEvidenceCategories: string[];
  notes?: string;
}

export interface StageCopilotAuditRequirements {
  auditId: string;
  interactionRecordingRequired: boolean;
  contextReferenceRecordingRequired: boolean;
  providerModelRecordingRequired: boolean;
  routedRecommendationAuditRequired: boolean;
  refusalAuditRequired: boolean;
  dataAccessStrategyAuditRequired: boolean;
  retrievalCitationAuditRequired: boolean;
}

export interface StageCopilotProfile {
  profileId: string;
  stageKey: StageCopilotStageKey;
  displayName: string;
  runtimeMode: StageCopilotRuntimeMode;
  promptSpecRefs: StageCopilotPromptSpecRef[];
  capabilityPromptSpecRefs: StageCopilotPromptSpecRef[];
  stageCopilotPromptSpecRefs: StageCopilotPromptSpecRef[];
  contextBundleRefs: StageCopilotContextBundleRef[];
  systemKnowledgeRefs: StageCopilotSystemKnowledgeRef[];
  caseContextRefs: StageCopilotCaseContextRef[];
  retrievalScope: StageCopilotRetrievalScope;
  contextDataAccessStrategy: StageCopilotContextDataAccessStrategy;
  refusalPolicy: StageCopilotRefusalPolicy;
  conversationalBehaviorProfile: StageCopilotConversationalBehaviorProfile;
  advisoryModePolicy: StageCopilotAdvisoryModePolicy;
  routedRecommendationTypes: StageCopilotRoutedRecommendation[];
  forbiddenActions: StageCopilotForbiddenAction[];
  readWriteBoundary: StageCopilotReadWriteBoundary;
  evidenceAccessPolicy: StageCopilotEvidenceAccessPolicy;
  auditRequirements: StageCopilotAuditRequirements;
  createdAt: string;
  updatedAt: string;
}
