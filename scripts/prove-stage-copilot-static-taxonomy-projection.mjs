import assert from "node:assert/strict";
import { validateStageCopilotProfile } from "../packages/contracts/dist/index.js";

const now = "2026-04-28T00:00:00.000Z";
const allForbiddenActions = [
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

function promptRef({
  refId,
  promptSpecKey,
  kind,
  stageKey,
  taxonomyStatus,
  projectionStatus,
  displayLabel,
  displayWarning,
  legacyMapping,
}) {
  return {
    refId,
    promptSpecKey,
    kind,
    classification: {
      kind,
      taxonomyStatus,
      stageKey,
      preservesExistingKey: true,
      projectionStatus,
      migrated: false,
      renameAllowed: false,
      runtimeBehaviorChanged: false,
      displayLabel,
      ...(displayWarning ? { displayWarning } : {}),
      ...(legacyMapping ? { legacyMapping } : {}),
      notes: "Static taxonomy projection fixture only; no prompt registry read or runtime behavior.",
    },
    linkedStage: stageKey,
    status: taxonomyStatus === "planned" ? "draft" : "active",
    notes: "Static contract-aligned prompt taxonomy reference.",
  };
}

const capabilityRef = promptRef({
  refId: "capability-source-role-suggestion",
  promptSpecKey: "sources_context.source_role_suggestion",
  kind: "capability",
  stageKey: "sources_context",
  taxonomyStatus: "planned",
  projectionStatus: "future",
  displayLabel: "Capability PromptSpec - source-role suggestion",
});

const nativeStageCopilotRef = promptRef({
  refId: "future-analysis-package-stage-copilot",
  promptSpecKey: "analysis_package.stage_copilot",
  kind: "stage_copilot",
  stageKey: "analysis_package",
  taxonomyStatus: "planned",
  projectionStatus: "future",
  displayLabel: "Stage Copilot PromptSpec - Analysis / Package",
});

const adminAssistantPromptRef = promptRef({
  refId: "legacy-admin-assistant-prompt-name",
  promptSpecKey: "admin_assistant_prompt",
  kind: "legacy_copilot_like",
  stageKey: "participant_evidence",
  taxonomyStatus: "legacy_current",
  projectionStatus: "legacy",
  displayLabel: "Current copilot-like prompt key - admin_assistant_prompt",
  displayWarning: "Legacy/current key; not migrated, renamed, or moved.",
  legacyMapping: {
    existingPromptKey: "admin_assistant_prompt",
    existingLinkedModule: "pass5.admin_assistant",
    sourceRegistry: "pass5_prompt_family",
    migrationStatus: "legacy_current",
  },
});

const pass5LinkedModuleRef = promptRef({
  refId: "legacy-pass5-admin-assistant-linked-module",
  promptSpecKey: "pass5.admin_assistant",
  kind: "legacy_copilot_like",
  stageKey: "participant_evidence",
  taxonomyStatus: "legacy_current",
  projectionStatus: "legacy",
  displayLabel: "Current copilot-like linked module - pass5.admin_assistant",
  displayWarning: "Legacy/current linked module; not migrated, renamed, or moved.",
  legacyMapping: {
    existingPromptKey: "pass5.admin_assistant",
    sourceRegistry: "pass5_prompt_family",
    migrationStatus: "legacy_current",
  },
});

const pass6AnalysisCopilotRef = promptRef({
  refId: "legacy-pass6-analysis-copilot",
  promptSpecKey: "pass6_analysis_copilot",
  kind: "legacy_copilot_like",
  stageKey: "analysis_package",
  taxonomyStatus: "legacy_current",
  projectionStatus: "legacy",
  displayLabel: "Current copilot-like prompt key - pass6_analysis_copilot",
  displayWarning: "Legacy/current key; not migrated, renamed, or moved.",
  legacyMapping: {
    existingPromptKey: "pass6_analysis_copilot",
    sourceRegistry: "pass6_prompt_workspace",
    migrationStatus: "legacy_current",
  },
});

const unknownRef = promptRef({
  refId: "unknown-unclassified-prompt",
  promptSpecKey: "some.future.prompt.key",
  kind: "unknown_or_unclassified",
  stageKey: "prompt_studio",
  taxonomyStatus: "unknown_or_unclassified",
  projectionStatus: "unknown",
  displayLabel: "Unclassified PromptSpec",
  displayWarning: "Prompt key has not yet been classified.",
});

function profile(overrides = {}) {
  return {
    profileId: "static-taxonomy-projection-profile",
    stageKey: "analysis_package",
    displayName: "Static taxonomy projection profile",
    runtimeMode: "static_profile",
    promptSpecRefs: [
      capabilityRef,
      nativeStageCopilotRef,
      adminAssistantPromptRef,
      pass5LinkedModuleRef,
      pass6AnalysisCopilotRef,
      unknownRef,
    ],
    capabilityPromptSpecRefs: [capabilityRef],
    stageCopilotPromptSpecRefs: [nativeStageCopilotRef, adminAssistantPromptRef, pass5LinkedModuleRef, pass6AnalysisCopilotRef],
    contextBundleRefs: [{
      refId: "static-taxonomy-context-ref",
      bundleKey: "static.taxonomy.context.ref",
      linkedStage: "analysis_package",
      scope: "case",
    }],
    systemKnowledgeRefs: [{
      refId: "static-taxonomy-proof-ref",
      refType: "proof_or_validation_logic",
      label: "Static taxonomy proof",
      sourceRef: "scripts/prove-stage-copilot-static-taxonomy-projection.mjs",
    }],
    caseContextRefs: [{
      refId: "static-taxonomy-prompt-test-context",
      family: "prompt_test_results",
      linkedStage: "analysis_package",
      scope: "case",
      recordType: "StaticPromptTaxonomyProjection",
    }],
    retrievalScope: {
      scopeId: "static-taxonomy-no-retrieval",
      allowedModes: ["direct_id_lookup"],
      allowedRecordFamilies: ["prompt_test_results"],
      citationRequired: false,
      auditRequired: false,
      executionMode: "declarative_only",
    },
    contextDataAccessStrategy: {
      strategyId: "static-taxonomy-no-runtime-access",
      intendedContextModel: "db_only",
      allowedModes: ["scoped_record_reference_lookup"],
      executionMode: "declarative_only",
      notes: "Static projection only; no live prompt registry read.",
    },
    refusalPolicy: {
      policyId: "static-taxonomy-refusal-policy",
      categories: refusalCategories,
      redirectToOwningStageAllowed: true,
      explainBoundary: true,
    },
    conversationalBehaviorProfile: {
      profileId: "static-taxonomy-conversation",
      supportsMultiTurnDiscussion: true,
      supportsAdvisoryWhatIfReasoning: true,
      supportsChallengeCritique: true,
      supportsMethodLensExplanation: true,
      separatesRecommendationFromDecision: true,
      explanationDepth: "standard",
      challengeLevel: "light",
      directness: "balanced",
      alternativesBehavior: "on_request",
      uncertaintyHandling: "highlight_uncertainty",
      citationBehavior: "cite_when_available",
    },
    advisoryModePolicy: {
      policyId: "static-taxonomy-advisory",
      advisoryWhatIfAllowed: true,
      advisoryOnly: true,
      labelHypotheticals: true,
      prohibitedOutcomes: allForbiddenActions,
    },
    routedRecommendationTypes: [{
      actionKey: "open_prompt_review_surface",
      label: "Open prompt review surface",
      reason: "Static routed recommendation type only.",
      owningArea: "prompt_studio",
      requiresAdminConfirmation: true,
      executesAutomatically: false,
    }],
    forbiddenActions: allForbiddenActions,
    readWriteBoundary: {
      readableScopes: ["prompt_studio", "analysis_package"],
      writePolicy: "no_writes",
      autonomousWritesAllowed: false,
      noAutonomousWrites: true,
      routedRecommendationsOnly: true,
      adminConfirmationRequired: true,
    },
    evidenceAccessPolicy: {
      policyId: "static-taxonomy-no-evidence",
      accessLevel: "none",
      rawEvidenceRequiresAdminScope: true,
      citationRequiredForEvidence: false,
      restrictedEvidenceCategories: [],
    },
    auditRequirements: {
      auditId: "static-taxonomy-audit",
      interactionRecordingRequired: false,
      contextReferenceRecordingRequired: true,
      providerModelRecordingRequired: false,
      routedRecommendationAuditRequired: true,
      refusalAuditRequired: true,
      dataAccessStrategyAuditRequired: true,
      retrievalCitationAuditRequired: false,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function assertValid(name, value) {
  const result = validateStageCopilotProfile(value);
  assert.equal(result.ok, true, `${name} should validate: ${JSON.stringify(result, null, 2)}`);
}

function assertInvalid(name, value) {
  const result = validateStageCopilotProfile(value);
  assert.equal(result.ok, false, `${name} should be rejected`);
}

const validProfile = profile();
assertValid("static taxonomy projection profile", validProfile);

assert.equal(validProfile.capabilityPromptSpecRefs[0].classification.kind, "capability");
assert.equal(validProfile.stageCopilotPromptSpecRefs[0].classification.kind, "stage_copilot");
assert.equal(validProfile.stageCopilotPromptSpecRefs[1].promptSpecKey, "admin_assistant_prompt");
assert.equal(validProfile.stageCopilotPromptSpecRefs[2].promptSpecKey, "pass5.admin_assistant");
assert.equal(validProfile.stageCopilotPromptSpecRefs[3].promptSpecKey, "pass6_analysis_copilot");
assert.equal(validProfile.promptSpecRefs[5].classification.kind, "unknown_or_unclassified");
assert.equal(validProfile.stageCopilotPromptSpecRefs.every((ref) => ref.classification.migrated === false), true);
assert.equal(validProfile.stageCopilotPromptSpecRefs.every((ref) => ref.classification.renameAllowed === false), true);
assert.equal(validProfile.stageCopilotPromptSpecRefs.every((ref) => ref.classification.runtimeBehaviorChanged === false), true);

const migratedLegacy = clone(validProfile);
migratedLegacy.stageCopilotPromptSpecRefs[1].classification.migrated = true;
assertInvalid("legacy/current key with migrated true", migratedLegacy);

const renameAllowed = clone(validProfile);
renameAllowed.stageCopilotPromptSpecRefs[1].classification.renameAllowed = true;
assertInvalid("legacy/current key with rename allowed", renameAllowed);

const replacementAttempt = clone(validProfile);
replacementAttempt.stageCopilotPromptSpecRefs[1].classification.legacyMapping.replacementPromptSpecKey = "participant_evidence.stage_copilot";
assertInvalid("reference attempts to replace original key", replacementAttempt);

const unknownKind = clone(validProfile);
unknownKind.promptSpecRefs[0].kind = "assistant_runtime";
assertInvalid("unknown taxonomy kind", unknownKind);

const missingPromptKey = clone(validProfile);
delete missingPromptKey.promptSpecRefs[0].promptSpecKey;
assertInvalid("missing prompt key", missingPromptKey);

const missingDisplayName = clone(validProfile);
delete missingDisplayName.promptSpecRefs[0].classification.displayLabel;
assertInvalid("missing prompt display name", missingDisplayName);

const runtimeChanged = clone(validProfile);
runtimeChanged.stageCopilotPromptSpecRefs[3].classification.runtimeBehaviorChanged = true;
assertInvalid("runtime behavior changed", runtimeChanged);

const extraProperty = clone(validProfile);
extraProperty.promptSpecRefs[0].classification.liveProjectionReader = "packages/prompts";
assertInvalid("extra unknown projection property", extraProperty);

console.log(JSON.stringify({
  ok: true,
  validatedValidCases: [
    "capability_prompt_reference",
    "future_native_stage_copilot_prompt_reference",
    "admin_assistant_prompt_legacy_copilot_like",
    "pass5.admin_assistant_legacy_copilot_like",
    "pass6_analysis_copilot_legacy_copilot_like",
    "unknown_or_unclassified_prompt_reference",
    "profile_with_capability_and_stage_copilot_refs",
    "profile_references_legacy_current_keys_without_migration_or_rename",
  ],
  rejectedInvalidCases: [
    "legacy_current_key_with_migrated_true",
    "legacy_current_key_with_rename_allowed",
    "reference_attempts_to_replace_original_key",
    "unknown_taxonomy_kind",
    "missing_prompt_key",
    "missing_prompt_display_name",
    "runtime_behavior_changed",
    "extra_unknown_properties",
  ],
}, null, 2));
