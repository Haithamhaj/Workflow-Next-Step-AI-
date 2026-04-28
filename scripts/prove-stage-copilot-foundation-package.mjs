import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertStageCopilotNoAnalysisMutation,
  assertStageCopilotNoProviderExecution,
  assertStageCopilotReadOnlyBoundary,
  assertStageCopilotRuntimeModeSafeForFoundation,
  isStageCopilotForbiddenAction,
  labelStageCopilotAdvisoryWhatIf,
  validateStageCopilotRoutedRecommendationSafety,
} from "../packages/stage-copilot/dist/index.js";

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

const readOnlyProfile = {
  runtimeMode: "static_profile",
  readWriteBoundary: {
    readableScopes: ["stage", "case"],
    writePolicy: "no_writes",
    autonomousWritesAllowed: false,
    noAutonomousWrites: true,
    routedRecommendationsOnly: true,
    adminConfirmationRequired: true,
  },
  advisoryModePolicy: {
    policyId: "proof-advisory-policy",
    advisoryWhatIfAllowed: true,
    advisoryOnly: true,
    labelHypotheticals: true,
    prohibitedOutcomes: allForbiddenActions,
  },
};

function assertOk(result, label) {
  assert.equal(result.ok, true, `${label} should pass`);
  assert.deepEqual(result.violations, [], `${label} should not report violations`);
}

function assertRejected(result, code, label) {
  assert.equal(result.ok, false, `${label} should be rejected`);
  assert.ok(result.violations.includes(code), `${label} should include ${code}; got ${result.violations.join(",")}`);
}

// Valid/safe cases.
assertOk(assertStageCopilotReadOnlyBoundary(readOnlyProfile), "read-only profile boundary");
assertOk(assertStageCopilotRuntimeModeSafeForFoundation("static_profile"), "static profile runtime mode");
assertOk(assertStageCopilotRuntimeModeSafeForFoundation("disabled"), "disabled runtime mode");
assertOk(assertStageCopilotRuntimeModeSafeForFoundation("deterministic_mock"), "deterministic mock without side effects");

const advisory = labelStageCopilotAdvisoryWhatIf(
  readOnlyProfile,
  "What if a readiness blocker were treated as a warning?",
);
assert.equal(advisory.advisoryOnly, true, "what-if label is advisory-only");
assert.match(advisory.label, /does not change official workflow records/i);
assert.equal(advisory.doesNotMutateOfficialRecords, true);
assert.equal(advisory.doesNotRerunOfficialAnalysis, true);
assert.equal(advisory.doesNotChangeReadiness, true);
assert.equal(advisory.doesNotChangePackageEligibility, true);
assert.equal(advisory.doesNotGeneratePackageOutput, true);

assertOk(validateStageCopilotRoutedRecommendationSafety({
  actionKey: "inspect_readiness_result",
  label: "Inspect readiness result",
  reason: "Safe read-only routed navigation recommendation.",
  owningArea: "analysis_package",
  requiresAdminConfirmation: true,
  executesAutomatically: false,
}), "safe routed recommendation");

assert.equal(isStageCopilotForbiddenAction("run_providers"), true);
assert.equal(isStageCopilotForbiddenAction("mutate_analysis_outputs"), true);
assert.equal(isStageCopilotForbiddenAction("rerun_official_analysis"), true);
assert.equal(isStageCopilotForbiddenAction("inspect_readiness_result"), false);

assertOk(assertStageCopilotReadOnlyBoundary(readOnlyProfile, {
  requestedActions: ["explain_unknown_or_unclassified_prompt"],
}), "unknown/unclassified prompt references do not imply runtime behavior");

// Invalid/unsafe cases.
assertRejected(assertStageCopilotReadOnlyBoundary(readOnlyProfile, {
  autonomousWriteRequested: true,
}), "autonomous_writes_not_allowed", "autonomous write attempt");

assertRejected(validateStageCopilotRoutedRecommendationSafety({
  actionKey: "inspect_readiness_result",
  requiresAdminConfirmation: true,
  executesAutomatically: true,
}), "auto_execution_not_allowed", "auto-executing routed recommendation");

assertRejected(validateStageCopilotRoutedRecommendationSafety({
  actionKey: "inspect_readiness_result",
  requiresAdminConfirmation: false,
  executesAutomatically: false,
}), "missing_admin_confirmation", "routed recommendation without admin confirmation");

assertRejected(assertStageCopilotNoProviderExecution({
  providerExecutionRequested: true,
}), "provider_execution_not_allowed", "provider execution request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  packageEligibilityMutationRequested: true,
}), "package_eligibility_mutation_not_allowed", "package eligibility mutation request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  readinessMutationRequested: true,
}), "readiness_mutation_not_allowed", "readiness mutation request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  promptMutationRequested: true,
}), "prompt_mutation_not_allowed", "prompt mutation request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  promptPromotionRequested: true,
}), "prompt_mutation_not_allowed", "prompt promotion request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  officialAnalysisRerunRequested: true,
}), "official_analysis_rerun_not_allowed", "official analysis rerun request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  analysisRecordMutationRequested: true,
}), "analysis_mutation_not_allowed", "analysis record mutation request");

assertRejected(assertStageCopilotNoAnalysisMutation({
  sourceOfTruthMutationRequested: true,
}), "source_of_truth_mutation_not_allowed", "source-of-truth mutation request");

assertRejected(validateStageCopilotRoutedRecommendationSafety({
  actionKey: "run_providers",
  requiresAdminConfirmation: true,
  executesAutomatically: false,
}), "provider_execution_not_allowed", "provider execution routed recommendation");

assertRejected(validateStageCopilotRoutedRecommendationSafety({
  actionKey: "change_package_eligibility",
  requiresAdminConfirmation: true,
  executesAutomatically: false,
}), "package_eligibility_mutation_not_allowed", "package eligibility routed recommendation");

assertRejected(validateStageCopilotRoutedRecommendationSafety({
  actionKey: "rerun_official_analysis",
  requiresAdminConfirmation: true,
  executesAutomatically: false,
}), "official_analysis_rerun_not_allowed", "official analysis rerun routed recommendation");

assertRejected(assertStageCopilotRuntimeModeSafeForFoundation("provider_backed"), "provider_backed_runtime_not_allowed", "provider-backed runtime mode");
assertRejected(assertStageCopilotRuntimeModeSafeForFoundation("deterministic_mock", {
  writesRecords: true,
}), "runtime_mode_not_safe_for_foundation", "deterministic mock with writes");

const packageSource = readFileSync("packages/stage-copilot/src/boundary.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-foundation-package.mjs", "utf8");

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

const combinedImports = [
  importAndExportLines(packageSource),
  importAndExportLines(indexSource),
  importAndExportLines(proofSource),
].join("\n");

const forbiddenImportPatterns = [
  /@workflow\/prompts/,
  /@workflow\/persistence/,
  /@workflow\/integrations/,
  /apps\/admin-web/,
  /participant-sessions/,
  /synthesis-evaluation/,
  /packages-output/,
  /runPass6Copilot/,
  /runAdminAssistantQuestion/,
  /compilePass5Prompt/,
  /compilePass6PromptSpec/,
  /providerRegistry/,
  /getPromptTextProvider/,
];

for (const pattern of forbiddenImportPatterns) {
  assert.equal(pattern.test(combinedImports), false, `Stage Copilot foundation package/proof must not import or execute ${pattern}`);
}

assert.match(packageSource, /from "@workflow\/contracts"/, "package imports contract types only");

console.log("Stage Copilot foundation package proof passed.");
console.log(JSON.stringify({
  validatedSafeCases: [
    "read_only_profile_boundary",
    "static_profile_no_write_boundary",
    "disabled_runtime_mode",
    "deterministic_mock_without_side_effects",
    "advisory_what_if_labelled_advisory_only",
    "safe_routed_recommendation",
    "unknown_unclassified_prompt_reference_no_runtime_behavior",
  ],
  rejectedUnsafeCases: [
    "autonomous_write_attempt",
    "auto_executing_routed_recommendation",
    "routed_recommendation_without_admin_confirmation",
    "provider_execution_request",
    "package_eligibility_mutation_request",
    "readiness_mutation_request",
    "prompt_mutation_request",
    "prompt_promotion_request",
    "official_analysis_rerun_request",
    "analysis_record_mutation_request",
    "source_of_truth_mutation_request",
    "provider_backed_runtime_mode",
    "deterministic_mock_with_writes",
  ],
  nonInterference: {
    importsOnlyContractsAndLocalPackageFiles: true,
    noPass5RuntimeImport: true,
    noPass6RuntimeImport: true,
    noPromptCompileImport: true,
    noProviderIntegrationImport: true,
    noPersistenceImport: true,
    noAdminWebImport: true,
  },
}, null, 2));
