import assert from "node:assert/strict";

import {
  validateAnalysisMethodUsage,
} from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  createDefaultPass6ConfigurationDraft,
  resolvePass6MethodRegistryForAdmin,
  savePass6ConfigurationProfile,
  updatePass6MethodActiveStatus,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T14:00:00.000Z";
const requiredMethodKeys = [
  "bpmn_process_structure",
  "sipoc_boundary",
  "triangulation",
  "espoused_theory_vs_theory_in_use",
  "raci_responsibility",
  "ssm_multi_perspective",
  "apqc_vocabulary",
];

const requiredProblemMappings = new Map([
  ["step_order_process_structure_handoff_sequence", "bpmn_process_structure"],
  ["start_end_input_output_trigger_use_case_boundary", "sipoc_boundary"],
  ["claim_support_repeated_evidence_disagreement_support_map", "triangulation"],
  ["policy_document_management_view_vs_frontline_practice", "espoused_theory_vs_theory_in_use"],
  ["ownership_approval_accountability_handoff_responsibility", "raci_responsibility"],
  ["different_layers_or_departments_see_different_realities", "ssm_multi_perspective"],
  ["process_naming_terminology_process_family_alignment", "apqc_vocabulary"],
]);

const store = createInMemoryStore();
const draft = createDefaultPass6ConfigurationDraft({
  configId: "pass6-method-registry-proof-draft",
  changedBy: "proof",
  changeReason: "Pass 6 Block 8 method registry proof.",
  now,
});
const saveResult = savePass6ConfigurationProfile(draft, store.pass6ConfigurationProfiles);
assert.equal(saveResult.ok, true, saveResult.ok ? "" : saveResult.error);

const registry = resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles);
assert.equal(registry.methods.length, 7, "all seven required methods should be listed");
for (const methodKey of requiredMethodKeys) {
  const method = registry.methods.find((item) => item.methodKey === methodKey);
  assert.ok(method, `missing required method ${methodKey}`);
  assert.ok(method.methodId, `${methodKey} should have methodId`);
  assert.ok(method.displayName, `${methodKey} should have displayName`);
  assert.ok(["methodology", "lens", "tool", "vocabulary_support"].includes(method.methodType), `${methodKey} should have supported methodType`);
  assert.ok(method.shortDefinition, `${methodKey} should have shortDefinition`);
  assert.ok(method.normalUseCases.length > 0, `${methodKey} should have normal use cases`);
  assert.ok(method.requiredInputs.length > 0, `${methodKey} should have required inputs`);
  assert.ok(method.expectedOutputs.length > 0, `${methodKey} should have expected outputs`);
  assert.ok(method.scoringOrClassificationImpact.length > 0, `${methodKey} should have impact mapping`);
  assert.ok(method.limitations.length > 0, `${methodKey} should have limitations`);
  assert.ok(method.hardBoundaries.length > 0, `${methodKey} should have hard boundaries`);
  assert.ok(method.methodVersion, `${methodKey} should have methodVersion`);
  assert.ok(method.adminFacingDescription, `${methodKey} should have admin-facing description`);
}

for (const [problemType, methodKey] of requiredProblemMappings) {
  const rule = registry.defaultSelectionRules.find((item) => item.problemType === problemType);
  assert.ok(rule, `missing selection rule for ${problemType}`);
  assert.equal(rule.primaryMethodKey, methodKey, `unexpected primary method for ${problemType}`);
}

assert.ok(registry.conditionalMultiLensPolicy.steps.some((step) => step.includes("Start with the primary method")), "conditional policy should start with primary method");
assert.ok(registry.conditionalMultiLensPolicy.additionalLensTriggers.includes("high materiality"), "conditional policy should include high-materiality trigger");
assert.ok(registry.conditionalMultiLensPolicy.additionalLensTriggers.includes("low confidence"), "conditional policy should include low-confidence trigger");
assert.ok(registry.conditionalMultiLensPolicy.additionalLensTriggers.includes("disputed evidence"), "conditional policy should include disputed trigger");
assert.ok(registry.conditionalMultiLensPolicy.additionalLensTriggers.includes("document-sensitive material"), "conditional policy should include document-sensitive trigger");
assert.ok(registry.conditionalMultiLensPolicy.additionalLensTriggers.includes("layer-sensitive material"), "conditional policy should include layer-sensitive trigger");
assert.ok(registry.conditionalMultiLensPolicy.complementaryFindingHandling.includes("may be merged"), "complementary handling should be represented");
assert.ok(registry.conditionalMultiLensPolicy.supportingFindingHandling.includes("raise confidence"), "supporting handling should be represented");
assert.ok(registry.conditionalMultiLensPolicy.conflictingFindingHandling.includes("must not be merged"), "conflicting handling should prevent fake clean merge");

const systemTraceability = validateAnalysisMethodUsage(registry.traceabilityShape.systemSelectedExample);
assert.equal(systemTraceability.ok, true, JSON.stringify(systemTraceability.errors ?? []));
assert.equal(registry.traceabilityShape.systemSelectedExample.selectionSource, "system_selected");
assert.equal(registry.traceabilityShape.systemSelectedExample.methodRole, "primary");
const adminTraceability = validateAnalysisMethodUsage(registry.traceabilityShape.adminForcedExample);
assert.equal(adminTraceability.ok, true, JSON.stringify(adminTraceability.errors ?? []));
assert.equal(registry.traceabilityShape.adminForcedExample.selectionSource, "admin_forced");
assert.equal(registry.traceabilityShape.adminForcedExample.methodRole, "admin_forced");

assert.ok(registry.methods.every((method) => method.hardBoundaries.includes("Methods cannot invent evidence.")), "admin/API method cards should expose boundaries");
assert.ok(registry.lockedBoundaries.includes("Methods cannot override Pass 5 status."), "locked boundaries should be visible");
assert.ok(registry.adminForcedMethodRule.includes("does not execute analysis"), "admin-forced method rule should be documentation/scaffold only");

const toggleResult = updatePass6MethodActiveStatus({
  configId: "pass6-method-registry-proof-draft",
  methodKey: "apqc_vocabulary",
  active: false,
  changedBy: "proof",
  changeReason: "Deactivate APQC for proof.",
  now,
}, store.pass6ConfigurationProfiles);
assert.equal(toggleResult.ok, true, toggleResult.ok ? "" : toggleResult.error);
const updatedRegistry = resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles);
const apqc = updatedRegistry.methods.find((method) => method.methodKey === "apqc_vocabulary");
assert.ok(apqc, "APQC method should still resolve after config update");
assert.equal(apqc.active, false, "deactivating a configurable method should be reflected in registry resolution");
assert.equal(store.pass6ConfigurationProfiles.findById("pass6-method-registry-proof-draft")?.policies.methodRegistryConfig.methods.find((method) => method.methodKey === "apqc_vocabulary")?.active, false, "method active/inactive config should persist");

const lockedBoundaryBefore = registry.lockedBoundaries.join("|");
const lockedBoundaryAfter = updatedRegistry.lockedBoundaries.join("|");
assert.equal(lockedBoundaryAfter, lockedBoundaryBefore, "locked method boundaries should not be edited by active/inactive config");

assert.equal(store.workflowUnits.findAll().length, 0, "Block 8 must not extract workflow units");
assert.equal(store.workflowClaims.findAll().length, 0, "Block 8 must not create workflow claims");
assert.equal(store.analysisMethodUsages.findAll().length, 0, "Block 8 must not create real method usage records");
assert.equal(store.differenceInterpretations.findAll().length, 0, "Block 8 must not execute difference interpretation");
assert.equal(store.assembledWorkflowDrafts.findAll().length, 0, "Block 8 must not assemble workflows");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "Block 8 must not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "Block 8 must not create Pre-6C results");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 8 must not create packages");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "Block 8 must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 8 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 8 must not create Pass 7 records");

console.log("Pass 6 Block 8 method registry proof passed.");
