import assert from "node:assert/strict";

import { validateAnalysisMethodUsage, validateDifferenceInterpretation } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  createDefaultPass6ConfigurationDraft,
  interpretWorkflowClaimDifferences,
  resolvePass6MethodRegistryForAdmin,
  savePass6ConfigurationProfile,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T18:00:00.000Z";
const caseId = "case-pass6-block10-proof";
const bundleId = "bundle-pass6-block10-proof";

function basis(id, type = "extraction", sessionId = "session-ops") {
  return {
    basisId: `basis-${id}`,
    basisType: type,
    summary: `${type} basis for ${id}`,
    references: [{
      referenceId: `ref-${id}`,
      referenceType: type === "source_document" ? "document_source_signal" : "pass5_evidence_anchor",
      sessionId: type === "source_document" ? undefined : sessionId,
      sourceId: type === "source_document" ? "source-sop" : undefined,
      evidenceItemId: type === "source_document" ? undefined : `evidence-${id}`,
      quote: `quote ${id}`,
    }],
  };
}

function claim(input) {
  return {
    claimId: input.claimId,
    caseId,
    bundleId,
    primaryClaimType: input.primaryClaimType,
    normalizedStatement: input.statement,
    claimText: input.statement,
    sourceParticipantIds: input.participants ?? ["participant-ops"],
    sourceSessionIds: input.sessions ?? ["session-ops"],
    sourceLayerContextIds: input.layers ?? ["layer:same:operations"],
    truthLensContextIds: input.truthLens ?? ["truth_lens:execution_evidence"],
    unitIds: [`unit-${input.claimId}`],
    basis: input.basis ?? basis(input.claimId, "extraction", input.sessions?.[0] ?? "session-ops"),
    confidence: input.confidence ?? "medium",
    materiality: input.materiality ?? "medium",
    status: input.status ?? "accepted_for_assembly",
  };
}

const claims = [
  claim({
    claimId: "claim-step-check",
    primaryClaimType: "execution_claim",
    statement: "Coordinator checks the vendor request.",
  }),
  claim({
    claimId: "claim-sequence-handoff",
    primaryClaimType: "sequence_claim",
    statement: "After the check, coordinator sends the request to Finance.",
  }),
  claim({
    claimId: "claim-international-approval",
    primaryClaimType: "decision_rule_claim",
    statement: "If vendor is international, Finance approval is required.",
    materiality: "high",
  }),
  claim({
    claimId: "claim-domestic-approval",
    primaryClaimType: "decision_rule_claim",
    statement: "When vendor is domestic, Finance approval is optional.",
    materiality: "high",
  }),
  claim({
    claimId: "claim-document-finance-approves",
    primaryClaimType: "boundary_claim",
    statement: "SOP document/source signal says Finance approves tax forms.",
    basis: basis("document-finance-approves", "source_document"),
    truthLens: ["truth_lens:document_signal_evidence", "truth_lens:policy_intent_evidence"],
    layers: ["document:vendor-sop"],
    participants: [],
    sessions: [],
    confidence: "unknown",
    status: "warning",
  }),
  claim({
    claimId: "claim-participant-finance-does-not-approve",
    primaryClaimType: "boundary_claim",
    statement: "Participant says Finance does not approve tax forms.",
    layers: ["layer:same:operations"],
    confidence: "medium",
    materiality: "high",
  }),
  claim({
    claimId: "claim-participant-finance-approves",
    primaryClaimType: "boundary_claim",
    statement: "Participant says Finance approves tax forms.",
    layers: ["layer:same:operations"],
    confidence: "medium",
    materiality: "high",
  }),
  claim({
    claimId: "claim-boundary-sales-start",
    primaryClaimType: "boundary_claim",
    statement: "Workflow starts when Sales submits the request.",
    layers: ["layer:same:operations"],
  }),
  claim({
    claimId: "claim-boundary-finance-start",
    primaryClaimType: "boundary_claim",
    statement: "Workflow starts when Finance receives the request.",
    layers: ["layer:same:operations"],
  }),
  claim({
    claimId: "claim-frontline-approval",
    primaryClaimType: "decision_rule_claim",
    statement: "Frontline layer says Operations approval is required.",
    layers: ["layer:frontline"],
    participants: ["participant-frontline"],
    sessions: ["session-frontline"],
    materiality: "high",
  }),
  claim({
    claimId: "claim-manager-approval",
    primaryClaimType: "decision_rule_claim",
    statement: "Manager layer says Finance approval is required.",
    layers: ["layer:manager"],
    participants: ["participant-manager"],
    sessions: ["session-manager"],
    materiality: "high",
  }),
];

const store = createInMemoryStore();
const draft = createDefaultPass6ConfigurationDraft({
  configId: "pass6-block10-config",
  changedBy: "proof",
  changeReason: "Pass 6 Block 10 proof config.",
  now,
});
const saved = savePass6ConfigurationProfile(draft, store.pass6ConfigurationProfiles);
assert.equal(saved.ok, true, saved.ok ? "" : saved.error);

const registry = resolvePass6MethodRegistryForAdmin(store.pass6ConfigurationProfiles);
assert.equal(registry.methods.length, 7, "all seven method cards should remain listed");
for (const method of registry.methods) {
  assert.ok(method.displayName, "method card should expose method/tool name");
  assert.ok(method.methodType, "method card should expose type");
  assert.ok(method.shortDefinition, "method card should expose definition");
  assert.ok(method.adminFacingDescription, "method card should expose purpose/admin description");
  assert.ok(method.normalUseCases.length > 0, "method card should expose normal use");
  assert.ok(method.requiredInputs.length > 0, "method card should expose required input");
  assert.ok(method.expectedOutputs.length > 0, "method card should expose expected output");
  assert.ok(method.scoringOrClassificationImpact.length > 0, "method card should expose impact");
  assert.ok(method.limitations.length > 0, "method card should expose limitations");
  assert.ok(method.hardBoundaries.length > 0, "method card should expose boundaries");
  assert.ok(method.exampleUseCase, "method card should expose example use case");
  assert.ok(method.methodVersion, "method card should expose version");
}
const apqc = registry.methods.find((method) => method.methodKey === "apqc_vocabulary");
assert.equal(apqc.methodType, "vocabulary_support", "APQC remains vocabulary/process naming support");
assert.ok(apqc.scoringOrClassificationImpact.some((impact) => impact.includes("must not affect truth")), "APQC must not decide workflow truth");

const result = interpretWorkflowClaimDifferences({
  caseId,
  claims,
  now,
  configRepo: store.pass6ConfigurationProfiles,
  adminForcedMethods: [{
    methodKey: "apqc_vocabulary",
    reason: "Admin requested terminology support check for naming consistency.",
    appliedToClaimIds: ["claim-step-check", "claim-sequence-handoff"],
    suitability: "weakly_suitable",
    limitationsOrRisks: ["Vocabulary support is weakly suitable for factual difference interpretation and must not decide truth."],
    preserveSystemSuggestedMethod: true,
  }],
}, {
  differenceInterpretations: store.differenceInterpretations,
  analysisMethodUsages: store.analysisMethodUsages,
});

assert.equal(result.ok, true, result.ok ? "" : result.error);
assert.ok(result.differences.length > 0, "difference interpretations should be produced");
assert.ok(result.methodUsages.length > 0, "method usage records should be produced");

for (const usage of result.methodUsages) {
  const { createdAt, updatedAt, ...contractUsage } = usage;
  assert.ok(createdAt && updatedAt, "method usage persistence timestamps should be present");
  const validation = validateAnalysisMethodUsage(contractUsage);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  assert.ok(usage.methodKey, "usage should record method key");
  assert.ok(usage.selectionReason, "usage should record reason selected");
  assert.equal(usage.appliedToType, "difference", "usage should record applied target type");
  assert.ok(usage.appliedToId, "usage should record applied target ID");
  assert.ok(usage.version, "usage should record method version");
  assert.ok(usage.impact.impactSummary, "usage should record impact summary");
  assert.ok(result.methodRegistry.methods.some((method) => method.methodKey === usage.methodKey && method.methodVersion === usage.version), "usage should consume registered Block 8 method card");
}

for (const difference of result.differences) {
  const { createdAt, updatedAt, ...contractDifference } = difference;
  assert.ok(createdAt && updatedAt, "difference persistence timestamps should be present");
  const validation = validateDifferenceInterpretation(contractDifference);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  assert.equal(difference.notPerformanceEvaluation, true, "difference should explicitly avoid employee evaluation");
}

function findDifference(type, claimA, claimB) {
  return result.differences.find((difference) =>
    difference.differenceType === type &&
    difference.involvedClaimIds.includes(claimA) &&
    difference.involvedClaimIds.includes(claimB)
  );
}

const completion = findDifference("completion", "claim-step-check", "claim-sequence-handoff");
assert.ok(completion, "same-layer complementary claims should produce completion difference");
assert.equal(completion.recommendedRoute, "carry_as_completion");

const variant = findDifference("variant", "claim-international-approval", "claim-domestic-approval");
assert.ok(variant, "condition-based alternate claims should produce variant difference");
assert.equal(variant.recommendedRoute, "carry_as_variant");

const normative = findDifference("normative_reality_mismatch", "claim-document-finance-approves", "claim-participant-finance-does-not-approve");
assert.ok(normative, "document/source conflict with participant reality should produce normative mismatch");
assert.ok(normative.explanation.includes("does not override participant evidence"), "document/source signal should not override participant evidence by default");

const factual = findDifference("factual_conflict", "claim-participant-finance-does-not-approve", "claim-participant-finance-approves");
assert.ok(factual, "directly contradictory participant claims should produce factual conflict");
assert.ok(factual.explanation.includes("not auto-resolved"), "factual conflict should not be auto-resolved");
assert.ok(["clarification_needed", "blocker_candidate"].includes(factual.recommendedRoute), "factual conflict should route to clarification/review, not clean merge");

const boundaryVariant = findDifference("variant", "claim-boundary-sales-start", "claim-boundary-finance-start");
assert.ok(boundaryVariant, "boundary alternate claims should produce a boundary variant");

const layerVariant = findDifference("variant", "claim-frontline-approval", "claim-manager-approval");
assert.ok(layerVariant, "materially different layer perspectives should produce variant difference");

function usageForDifference(difference, methodKey) {
  return result.methodUsages.find((usage) => difference.methodUsageIds.includes(usage.methodUsageId) && usage.methodKey === methodKey);
}

assert.ok(usageForDifference(completion, "bpmn_process_structure"), "BPMN should be selected for sequence/handoff issue");
assert.ok(usageForDifference(boundaryVariant, "sipoc_boundary"), "SIPOC should be selected for boundary issue");
assert.ok(usageForDifference(variant, "raci_responsibility"), "RACI should be selected for ownership/approval issue");
assert.ok(usageForDifference(normative, "espoused_theory_vs_theory_in_use"), "Espoused Theory vs Theory-in-Use should be selected for document/practice mismatch");
assert.ok(usageForDifference(layerVariant, "ssm_multi_perspective"), "SSM should be selected for layer-sensitive perspectives");
assert.ok(usageForDifference(factual, "triangulation"), "Triangulation should be selected for support/disagreement mapping");

const maxMethodUsagesForAnyDifference = Math.max(...result.differences.map((difference) => difference.methodUsageIds.length));
assert.ok(maxMethodUsagesForAnyDifference < 7, "engine must not run every method on every claim");
const adminForced = result.methodUsages.find((usage) => usage.selectionSource === "admin_forced" && usage.methodKey === "apqc_vocabulary");
assert.ok(adminForced, "admin-forced method usage should be representable");
assert.equal(adminForced.methodRole, "admin_forced");
assert.equal(adminForced.suitabilityAssessment.suitable, false, "weakly suitable admin-forced method should be recorded as not suitable");
assert.ok(adminForced.suitabilityAssessment.notes.includes("System-suggested method is preserved"), "admin-forced usage should preserve system-suggested method for comparison when requested");
assert.ok(adminForced.suitabilityAssessment.limitations?.some((limit) => limit.includes("must not decide truth")), "admin-forced usage should include limitation/risk note");

assert.ok(factual.explanation.includes("not auto-resolved"), "conflicting method findings must not be merged into a fake clean workflow");
assert.equal(store.analysisMethodUsages.findAll().length, result.methodUsages.length, "method usage records should persist");
assert.equal(store.differenceInterpretations.findAll().length, result.differences.length, "difference interpretation records should persist");

assert.equal(store.assembledWorkflowDrafts.findAll().length, 0, "Block 10 must not assemble workflow drafts");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "Block 10 must not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "Block 10 must not create Pre-6C results");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 10 must not create packages");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "Block 10 must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 10 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 10 must not create Pass 7 records");

console.log("Pass 6 Block 10 difference interpretation proof passed.");
