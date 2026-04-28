import assert from "node:assert/strict";
import {
  stageCopilotProfileSchema,
  validateStageCopilotProfile,
} from "../packages/contracts/dist/index.js";

const now = "2026-04-28T00:00:00.000Z";

const universalForbiddenActions = [
  "approve_gates",
  "approve_transcripts",
  "approve_reject_evidence",
  "mutate_records",
  "run_providers",
  "generate_packages",
  "send_messages",
  "change_readiness",
  "change_package_eligibility",
  "promote_prompts",
  "release_final_package",
  "execute_pass7_review_actions",
  "alter_source_of_truth_records",
];

const refusalCategories = [
  "out_of_stage_topic",
  "unrelated_topic",
  "mutation_request",
  "restricted_evidence_request",
  "provider_execution_request",
  "business_decision_request",
  "package_release_authority_request",
  "prompt_promotion_request",
  "transcript_evidence_approval_request",
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function baseProfile(stageKey, overrides = {}) {
  const stagePrompt = {
    refId: `${stageKey}-stage-copilot-prompt`,
    kind: "stage_copilot",
    promptSpecKey: `${stageKey}.copilot`,
    linkedStage: stageKey,
    status: "draft",
    version: 1,
    notes: "Stage Copilot PromptSpec reference only; no prompt mutation or runtime execution.",
  };
  const capabilityPrompt = {
    refId: `${stageKey}-capability-prompt`,
    kind: "capability",
    promptSpecKey: `${stageKey}.capability.reference`,
    linkedStage: stageKey,
    status: "active",
    version: 1,
    notes: "Capability PromptSpec reference only.",
  };
  const profile = {
    profileId: `${stageKey}-profile`,
    stageKey,
    displayName: `${stageKey} Stage Copilot`,
    runtimeMode: "static_profile",
    promptSpecRefs: [stagePrompt, capabilityPrompt],
    capabilityPromptSpecRefs: [capabilityPrompt],
    stageCopilotPromptSpecRefs: [stagePrompt],
    contextBundleRefs: [
      {
        refId: `${stageKey}-context-ref`,
        bundleKey: `${stageKey}.future.context.bundle.ref`,
        linkedStage: stageKey,
        scope: "case",
        version: 1,
        notes: "Reference only; no stage-specific context bundle schema is created.",
      },
    ],
    systemKnowledgeRefs: [
      {
        refId: `${stageKey}-purpose`,
        refType: "stage_purpose",
        label: "Stage purpose",
        sourceRef: "handoff/STAGE_COPILOT_FOUNDATION_ARCHITECTURE_AND_BUILD_ORDER.md",
      },
      {
        refId: `${stageKey}-proof`,
        refType: "proof_or_validation_logic",
        label: "Proof logic reference",
        sourceRef: "scripts/prove-stage-copilot-foundation-contracts.mjs",
      },
    ],
    caseContextRefs: [
      {
        refId: `${stageKey}-case-context`,
        family: "sources",
        linkedStage: stageKey,
        scope: "case",
        recordType: "StageScopedRecordReference",
      },
    ],
    retrievalScope: {
      scopeId: `${stageKey}-retrieval-scope`,
      allowedModes: ["direct_id_lookup", "evidence_anchor_lookup"],
      allowedRecordFamilies: ["sources"],
      citationRequired: true,
      auditRequired: true,
      executionMode: "declarative_only",
      notes: "Future retrieval declaration only; no search/RAG/vector execution.",
    },
    contextDataAccessStrategy: {
      strategyId: `${stageKey}-context-data-access`,
      intendedContextModel: "db_only",
      allowedModes: ["database_repository_lookup", "scoped_record_reference_lookup"],
      executionMode: "declarative_only",
      notes: "Future context assembly declaration only; no repository/query behavior.",
    },
    refusalPolicy: {
      policyId: `${stageKey}-refusal-policy`,
      categories: refusalCategories,
      redirectToOwningStageAllowed: true,
      explainBoundary: true,
    },
    conversationalBehaviorProfile: {
      profileId: `${stageKey}-conversation`,
      supportsMultiTurnDiscussion: true,
      supportsAdvisoryWhatIfReasoning: true,
      supportsChallengeCritique: true,
      supportsMethodLensExplanation: true,
      separatesRecommendationFromDecision: true,
      explanationDepth: "deep",
      challengeLevel: "moderate",
      directness: "balanced",
      alternativesBehavior: "proactive_when_useful",
      uncertaintyHandling: "challenge_unsupported_assumptions",
      citationBehavior: "cite_or_request_evidence",
    },
    advisoryModePolicy: {
      policyId: `${stageKey}-advisory-policy`,
      advisoryWhatIfAllowed: true,
      advisoryOnly: true,
      labelHypotheticals: true,
      prohibitedOutcomes: universalForbiddenActions,
    },
    routedRecommendationTypes: [
      {
        actionKey: "open_governed_review_surface",
        label: "Open governed review surface",
        reason: "Routed recommendation only; admin must confirm in the owning surface.",
        owningArea: stageKey,
        targetReference: {
          referenceType: "route_or_record_ref",
          referenceId: `${stageKey}:review`,
          label: "Review target",
        },
        requiresAdminConfirmation: true,
        executesAutomatically: false,
      },
    ],
    forbiddenActions: universalForbiddenActions,
    readWriteBoundary: {
      readableScopes: [stageKey, "case"],
      writePolicy: "no_writes",
      autonomousWritesAllowed: false,
      noAutonomousWrites: true,
      routedRecommendationsOnly: true,
      adminConfirmationRequired: true,
    },
    evidenceAccessPolicy: {
      policyId: `${stageKey}-evidence-policy`,
      accessLevel: "anchored_evidence",
      rawEvidenceRequiresAdminScope: true,
      citationRequiredForEvidence: true,
      restrictedEvidenceCategories: ["raw_participant_data", "provider_payloads"],
    },
    auditRequirements: {
      auditId: `${stageKey}-audit`,
      interactionRecordingRequired: false,
      contextReferenceRecordingRequired: true,
      providerModelRecordingRequired: false,
      routedRecommendationAuditRequired: true,
      refusalAuditRequired: true,
      dataAccessStrategyAuditRequired: true,
      retrievalCitationAuditRequired: true,
    },
    createdAt: now,
    updatedAt: now,
  };
  return { ...profile, ...overrides };
}

function assertValid(name, profile) {
  const result = validateStageCopilotProfile(profile);
  assert.equal(result.ok, true, `${name} should validate: ${JSON.stringify(result, null, 2)}`);
}

function assertInvalid(name, profile) {
  const result = validateStageCopilotProfile(profile);
  assert.equal(result.ok, false, `${name} should be rejected`);
}

assert.equal(stageCopilotProfileSchema.title, "StageCopilotProfile");

const sourcesProfile = baseProfile("sources_context", {
  runtimeMode: "static_profile",
  caseContextRefs: [
    {
      refId: "sources-records",
      family: "sources",
      linkedStage: "sources_context",
      scope: "case",
      recordType: "IntakeSource",
    },
    {
      refId: "source-suggestions",
      family: "source_role_scope_suggestions",
      linkedStage: "sources_context",
      scope: "case",
      recordType: "AIIntakeSuggestion",
    },
  ],
  retrievalScope: {
    scopeId: "sources-retrieval-declaration",
    allowedModes: ["direct_id_lookup", "evidence_anchor_lookup", "stage_scoped_keyword_lookup"],
    allowedRecordFamilies: ["sources", "source_role_scope_suggestions", "extraction_jobs"],
    citationRequired: true,
    auditRequired: true,
    executionMode: "declarative_only",
  },
});
assertValid("Sources / Context profile", sourcesProfile);

const participantEvidenceProfile = baseProfile("participant_evidence", {
  displayName: "Participant Evidence Copilot",
  capabilityPromptSpecRefs: [
    {
      refId: "pass5-admin-assistant-current-reference",
      kind: "capability",
      promptSpecKey: "pass5.admin_assistant",
      linkedStage: "participant_evidence",
      status: "active",
      notes: "References existing Pass 5 assistant behavior only; no runtime import or execution.",
    },
  ],
  stageCopilotPromptSpecRefs: [
    {
      refId: "participant-evidence-copilot-future-ref",
      kind: "stage_copilot",
      promptSpecKey: "participant_evidence.copilot.future",
      linkedStage: "participant_evidence",
      status: "draft",
    },
  ],
  caseContextRefs: [
    {
      refId: "participant-sessions-context",
      family: "participant_sessions",
      linkedStage: "participant_evidence",
      scope: "session",
      recordType: "ParticipantSession",
    },
    {
      refId: "transcript-context",
      family: "transcripts",
      linkedStage: "participant_evidence",
      scope: "session",
      recordType: "RawEvidenceItem",
    },
    {
      refId: "clarification-context",
      family: "clarification_answers",
      linkedStage: "participant_evidence",
      scope: "session",
      recordType: "ClarificationCandidate",
    },
  ],
  retrievalScope: {
    scopeId: "participant-evidence-retrieval",
    allowedModes: ["direct_id_lookup", "evidence_anchor_lookup", "hybrid_exact_anchor_keyword_lookup"],
    allowedRecordFamilies: ["participant_sessions", "transcripts", "clarification_answers", "boundary_dispute_signals"],
    citationRequired: true,
    auditRequired: true,
    executionMode: "declarative_only",
  },
  contextDataAccessStrategy: {
    strategyId: "participant-evidence-hybrid-strategy",
    intendedContextModel: "hybrid_db_retrieval",
    allowedModes: ["database_repository_lookup", "scoped_record_reference_lookup", "evidence_anchor_lookup", "hybrid_database_retrieval_lookup"],
    executionMode: "declarative_only",
    notes: "Hybrid DB + evidence-anchor declaration only.",
  },
  evidenceAccessPolicy: {
    policyId: "participant-evidence-restrictive-policy",
    accessLevel: "restricted_raw_evidence",
    rawEvidenceRequiresAdminScope: true,
    citationRequiredForEvidence: true,
    restrictedEvidenceCategories: ["raw_participant_data", "unapproved_transcripts", "cross_session_material"],
  },
});
assertValid("Participant Evidence profile", participantEvidenceProfile);

const analysisPackageProfile = baseProfile("analysis_package", {
  runtimeMode: "provider_backed",
  displayName: "Analysis / Package Copilot",
  capabilityPromptSpecRefs: [
    {
      refId: "pass6-synthesis-capability",
      kind: "capability",
      promptSpecKey: "synthesis",
      linkedStage: "analysis_package",
      status: "active",
    },
    {
      refId: "pass6-evaluation-capability",
      kind: "capability",
      promptSpecKey: "evaluation",
      linkedStage: "analysis_package",
      status: "active",
    },
  ],
  stageCopilotPromptSpecRefs: [
    {
      refId: "pass6-analysis-copilot-current-reference",
      kind: "stage_copilot",
      promptSpecKey: "pass6_analysis_copilot",
      linkedStage: "analysis_package",
      status: "active",
      notes: "References existing Pass 6 Copilot behavior only; no runtime import or execution.",
    },
  ],
  caseContextRefs: [
    {
      refId: "synthesis-output-context",
      family: "synthesis_outputs",
      linkedStage: "analysis_package",
      scope: "case",
      recordType: "SynthesisInputBundle",
    },
    {
      refId: "readiness-context",
      family: "readiness_blockers",
      linkedStage: "analysis_package",
      scope: "case",
      recordType: "WorkflowReadinessResult",
    },
    {
      refId: "package-gate-context",
      family: "package_gate_state",
      linkedStage: "analysis_package",
      scope: "case",
      recordType: "PrePackageGateResult",
    },
  ],
  retrievalScope: {
    scopeId: "analysis-package-retrieval",
    allowedModes: ["direct_id_lookup", "evidence_anchor_lookup", "stage_scoped_keyword_lookup", "hybrid_exact_anchor_keyword_lookup"],
    allowedRecordFamilies: ["synthesis_outputs", "readiness_blockers", "package_gate_state", "provider_jobs"],
    citationRequired: true,
    auditRequired: true,
    executionMode: "declarative_only",
  },
  contextDataAccessStrategy: {
    strategyId: "analysis-package-db-retrieval-strategy",
    intendedContextModel: "hybrid_db_retrieval",
    allowedModes: ["database_repository_lookup", "scoped_record_reference_lookup", "retrieval_search_index_lookup", "hybrid_database_retrieval_lookup"],
    executionMode: "declarative_only",
  },
  auditRequirements: {
    auditId: "analysis-package-provider-backed-audit",
    interactionRecordingRequired: true,
    contextReferenceRecordingRequired: true,
    providerModelRecordingRequired: true,
    routedRecommendationAuditRequired: true,
    refusalAuditRequired: true,
    dataAccessStrategyAuditRequired: true,
    retrievalCitationAuditRequired: true,
  },
});
assertValid("Analysis / Package profile", analysisPackageProfile);

const hybridFutureDataAccessProfile = baseProfile("hierarchy", {
  contextDataAccessStrategy: {
    strategyId: "hierarchy-hybrid-future-data-access",
    intendedContextModel: "hybrid_db_retrieval",
    allowedModes: ["database_repository_lookup", "scoped_record_reference_lookup", "evidence_anchor_lookup", "retrieval_search_index_lookup", "hybrid_database_retrieval_lookup", "semantic_vector_lookup_future_optional"],
    executionMode: "declarative_only",
    notes: "Valid hybrid declaration, including future semantic mode, without executable DB/retrieval behavior.",
  },
  retrievalScope: {
    scopeId: "hierarchy-future-hybrid-retrieval",
    allowedModes: ["direct_id_lookup", "evidence_anchor_lookup", "hybrid_exact_anchor_keyword_lookup", "semantic_vector_lookup_future_optional"],
    allowedRecordFamilies: ["sources", "hierarchy"],
    citationRequired: true,
    auditRequired: true,
    executionMode: "declarative_only",
  },
  caseContextRefs: [
    {
      refId: "hierarchy-records",
      family: "hierarchy",
      linkedStage: "hierarchy",
      scope: "case",
      recordType: "HierarchyDraftRecord",
    },
  ],
});
assertValid("Hybrid future data access profile", hybridFutureDataAccessProfile);

const unknownStage = clone(sourcesProfile);
unknownStage.stageKey = "workspace_generic";
assertInvalid("unknown stage key", unknownStage);

const missingRefusal = clone(sourcesProfile);
delete missingRefusal.refusalPolicy;
assertInvalid("missing refusal policy", missingRefusal);

const autonomousWrites = clone(sourcesProfile);
autonomousWrites.readWriteBoundary.autonomousWritesAllowed = true;
assertInvalid("autonomous writes allowed", autonomousWrites);

const autoExecutingRecommendation = clone(sourcesProfile);
autoExecutingRecommendation.routedRecommendationTypes[0].executesAutomatically = true;
assertInvalid("auto-executing routed recommendation", autoExecutingRecommendation);

const noConfirmationRecommendation = clone(sourcesProfile);
noConfirmationRecommendation.routedRecommendationTypes[0].requiresAdminConfirmation = false;
assertInvalid("routed recommendation without admin confirmation", noConfirmationRecommendation);

const providerBackedMissingBoundary = clone(analysisPackageProfile);
delete providerBackedMissingBoundary.readWriteBoundary;
assertInvalid("provider-backed profile missing read/write boundary", providerBackedMissingBoundary);

const providerBackedMissingAudit = clone(analysisPackageProfile);
delete providerBackedMissingAudit.auditRequirements;
assertInvalid("provider-backed profile missing audit requirements", providerBackedMissingAudit);

const extraUnknownProperty = clone(sourcesProfile);
extraUnknownProperty.genericChatbot = true;
assertInvalid("extra unknown profile property", extraUnknownProperty);

const packageEligibilityMutation = clone(analysisPackageProfile);
packageEligibilityMutation.forbiddenActions = packageEligibilityMutation.forbiddenActions.filter((item) => item !== "change_package_eligibility");
assertInvalid("package eligibility mutation not forbidden", packageEligibilityMutation);

const directProviderAction = clone(sourcesProfile);
directProviderAction.forbiddenActions = directProviderAction.forbiddenActions.filter((item) => item !== "run_providers");
assertInvalid("provider execution not forbidden", directProviderAction);

const liveRetrievalExecution = clone(participantEvidenceProfile);
liveRetrievalExecution.retrievalScope.liveRetrievalEnabled = true;
assertInvalid("live retrieval execution claim", liveRetrievalExecution);

const liveDatabaseExecution = clone(analysisPackageProfile);
liveDatabaseExecution.contextDataAccessStrategy.repositoryExecutor = "runNow";
assertInvalid("live database execution claim", liveDatabaseExecution);

const runtimeDataAccessStrategy = clone(hybridFutureDataAccessProfile);
runtimeDataAccessStrategy.contextDataAccessStrategy.executionMode = "runtime_execution";
assertInvalid("context data access strategy as runtime execution", runtimeDataAccessStrategy);

console.log(JSON.stringify({
  ok: true,
  validatedValidFixtures: [
    "sources_context",
    "participant_evidence",
    "analysis_package",
    "hybrid_future_data_access",
  ],
  rejectedInvalidFixtures: [
    "unknown_stage_key",
    "missing_refusal_policy",
    "autonomous_writes_allowed",
    "routed_recommendation_executes_automatically",
    "routed_recommendation_without_admin_confirmation",
    "provider_backed_missing_read_write_boundary",
    "provider_backed_missing_audit_requirements",
    "extra_unknown_properties",
    "package_eligibility_mutation_allowed",
    "provider_execution_direct_action_allowed",
    "live_retrieval_execution_claim",
    "live_database_execution_claim",
    "context_data_access_runtime_execution",
  ],
}, null, 2));
