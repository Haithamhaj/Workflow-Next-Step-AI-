import assert from "node:assert/strict";

import { validateClarificationNeed, validateInquiryPacket, validatePrePackageGateResult } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { runPre6CGateFromReadiness, runPre6CGateFromRepositories } from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T22:00:00.000Z";
const caseId = "case-pass6-block14-proof";
const draftId = "draft-pass6-block14-proof";

function basis(id) {
  return {
    basisId: `basis-${id}`,
    basisType: "method_output",
    summary: `basis for ${id}`,
    references: [{
      referenceId: `ref-${id}`,
      referenceType: "workflow_readiness_result",
      evidenceItemId: `evidence-${id}`,
    }],
  };
}

function condition(status, rationale, blocksInitialPackage = false) {
  return {
    status,
    rationale,
    basis: basis(`condition-${rationale.replace(/\W+/g, "-")}`),
    blocksInitialPackage,
  };
}

function readiness(decision, overrides = {}) {
  const conditions = {
    core_sequence_continuity: condition("clear_enough", "Core sequence is clear enough."),
    step_to_step_connection: condition("clear_enough", "Step-to-step connection is clear enough."),
    essential_step_requirements: condition("clear_enough", "Essential steps are clear enough."),
    decision_rules_thresholds: condition("not_applicable", "No decision threshold gap is visible."),
    handoffs_responsibility: condition("clear_enough", "Handoff responsibility is clear enough."),
    controls_approvals: condition("clear_enough", "Controls and approvals are clear enough."),
    use_case_boundary: condition("clear_enough", "Use-case boundary is clear enough."),
    ...(overrides.conditions ?? {}),
  };
  return {
    resultId: overrides.resultId ?? `readiness-${decision}`,
    caseId,
    assembledWorkflowDraftId: draftId,
    readinessDecision: decision,
    sevenConditionAssessment: {
      assessmentId: `assessment-${decision}`,
      caseId,
      assembledWorkflowDraftId: draftId,
      conditions,
      overallSummary: "Readiness fixture.",
    },
    gapRiskSummary: overrides.gapRiskSummary ?? {
      summary: "No blocking gap remains.",
      gapIds: [],
      riskIds: [],
    },
    allowedUseFor6C: overrides.allowedUseFor6C ?? (decision === "ready_for_initial_package" ? ["initial_package"] : ["none"]),
    routingRecommendations: overrides.routingRecommendations ?? [],
    analysisMetadata: {
      createdAt: now,
      createdBy: "proof",
      notes: "Readiness fixture for Pre-6C gate proof.",
    },
    is6CAllowed: decision === "ready_for_initial_package" || decision === "ready_for_initial_package_with_warnings",
    createdAt: now,
    updatedAt: now,
  };
}

function assertGateContracts(result) {
  assert.equal(result.ok, true, result.ok ? "" : result.error);
  const { createdAt, updatedAt, ...contractGate } = result.gateResult;
  assert.ok(createdAt && updatedAt, "gate persistence timestamps should exist");
  const gateValidation = validatePrePackageGateResult(contractGate);
  assert.equal(gateValidation.ok, true, JSON.stringify(gateValidation.errors ?? []));
  for (const need of result.clarificationNeeds) {
    const { createdAt: needCreatedAt, updatedAt: needUpdatedAt, ...contractNeed } = need;
    assert.ok(needCreatedAt && needUpdatedAt, "need persistence timestamps should exist");
    const validation = validateClarificationNeed(contractNeed);
    assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  }
  for (const packet of result.inquiryPackets) {
    const { updatedAt: packetUpdatedAt, ...contractPacket } = packet;
    assert.ok(packetUpdatedAt, "packet updatedAt should exist");
    const validation = validateInquiryPacket(contractPacket);
    assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  }
}

const ready = runPre6CGateFromReadiness({
  workflowReadinessResult: readiness("ready_for_initial_package", {
    resultId: "readiness-ready",
    allowedUseFor6C: ["initial_package"],
    routingRecommendations: ["proceed_to_6c"],
  }),
  gateResultId: "gate-ready",
  now,
});
assertGateContracts(ready);
assert.equal(ready.gateResult.gateDecision, "no_gate_block_package_allowed", "ready package should not create blocking gate");
assert.equal(ready.gateResult.clarificationNeeds.length, 0);

const warningReadiness = readiness("ready_for_initial_package_with_warnings", {
  resultId: "readiness-warning",
  allowedUseFor6C: ["initial_package_with_warnings"],
  routingRecommendations: ["proceed_to_6c_with_warnings"],
  gapRiskSummary: {
    summary: "Document/source signal remains warning-only.",
    gapIds: [],
    riskIds: ["risk-document-caveat"],
  },
});
const warningGate = runPre6CGateFromReadiness({
  workflowReadinessResult: warningReadiness,
  gateResultId: "gate-warning-request",
  now,
});
assertGateContracts(warningGate);
assert.equal(warningGate.gateResult.gateDecision, "clarification_required_before_package", "warning result should expose proceed decision path before approval");
assert.equal(warningGate.clarificationNeeds[0].blockingStatus, "non_blocking");

const warningApproved = runPre6CGateFromReadiness({
  workflowReadinessResult: warningReadiness,
  gateResultId: "gate-warning-approved",
  now,
  proceedWithWarningsApproval: {
    approvedBy: "admin-1",
    approvalNote: "Proceed with visible document caveat.",
    reasonForProceeding: "Client needs an initial limited package.",
  },
});
assertGateContracts(warningApproved);
assert.equal(warningApproved.gateResult.gateDecision, "proceed_with_warnings_approved");
assert.equal(warningApproved.gateResult.proceedWithWarningsApproval.approvalStatus, "approved");
assert.deepEqual(warningApproved.gateResult.proceedWithWarningsApproval.warningsAccepted, ["risk-document-caveat"]);
assert.ok(warningApproved.gateResult.proceedWithWarningsApproval.limitationsToKeepVisible.some((item) => item.includes("does not close the gap")), "proceed-with-warnings should preserve limitations");

const clarification = runPre6CGateFromReadiness({
  workflowReadinessResult: readiness("needs_more_clarification_before_package", {
    resultId: "readiness-clarification",
    gapRiskSummary: {
      summary: "missing essential actual execution step before Finance handoff.",
      gapIds: ["gap-execution-step"],
      riskIds: [],
    },
    routingRecommendations: ["send_to_pre_6c_clarification"],
    conditions: {
      essential_step_requirements: condition("materially_broken", "missing essential actual execution step before Finance handoff.", true),
    },
  }),
  gateResultId: "gate-clarification",
  now,
});
assertGateContracts(clarification);
assert.equal(clarification.gateResult.gateDecision, "clarification_required_before_package");
assert.ok(clarification.clarificationNeeds.length > 0, "clarification-required result should produce needs");

const executionNeed = clarification.clarificationNeeds.find((need) => need.relatedGapId === "gap-execution-step");
assert.ok(executionNeed, "unclear execution gap should produce a need");
assert.equal(executionNeed.targetRole, "Participant or frontline role");
assert.equal(executionNeed.recommendedChannel, "participant_follow_up");

const reviewGate = runPre6CGateFromReadiness({
  workflowReadinessResult: readiness("needs_review_decision_before_package", {
    resultId: "readiness-review",
    gapRiskSummary: {
      summary: "Material contradiction needing judgment remains.",
      gapIds: ["gap-review-conflict"],
      riskIds: ["risk-conflict"],
    },
    routingRecommendations: ["require_review_decision"],
    conditions: {
      handoffs_responsibility: condition("materially_broken", "approval owner conflict requires review decision.", true),
    },
  }),
  differences: [{
    differenceId: "difference-owner-conflict",
    caseId,
    involvedClaimIds: ["claim-manager-owner", "claim-frontline-owner"],
    differenceType: "factual_conflict",
    materiality: "high",
    recommendedRoute: "blocker_candidate",
    explanation: "approval authority conflict needs admin judgment.",
    methodUsageIds: ["method-usage-raci"],
  }],
  gateResultId: "gate-review",
  now,
});
assertGateContracts(reviewGate);
assert.equal(reviewGate.gateResult.gateDecision, "review_decision_required_before_package");
assert.ok(reviewGate.clarificationNeeds.some((need) => need.questionType === "admin_review_decision"), "review decision should create admin review recommendation");
assert.ok(reviewGate.clarificationNeeds.some((need) => need.relatedDifferenceIds?.includes("difference-owner-conflict")), "review need should link difference");

const authorityGate = runPre6CGateFromReadiness({
  workflowReadinessResult: readiness("needs_more_clarification_before_package", {
    resultId: "readiness-authority",
    gapRiskSummary: {
      summary: "unclear approval authority and threshold amount.",
      gapIds: ["gap-approval-authority"],
      riskIds: [],
    },
    conditions: {
      controls_approvals: condition("materially_broken", "unclear approval authority and threshold amount.", true),
    },
  }),
  gateResultId: "gate-authority",
  now,
});
assertGateContracts(authorityGate);
const authorityNeed = authorityGate.clarificationNeeds.find((need) => need.relatedGapId === "gap-approval-authority");
assert.equal(authorityNeed.targetRole, "Manager or department owner");
assert.equal(authorityNeed.recommendedChannel, "manager_follow_up");

const externalGate = runPre6CGateFromReadiness({
  workflowReadinessResult: readiness("needs_more_clarification_before_package", {
    resultId: "readiness-external",
    gapRiskSummary: {
      summary: "upstream/downstream dependency outside selected department is unclear.",
      gapIds: ["gap-external-dependency"],
      riskIds: [],
    },
    conditions: {
      handoffs_responsibility: condition("materially_broken", "upstream/downstream dependency outside selected department is unclear.", true),
    },
  }),
  gateResultId: "gate-external",
  now,
});
assertGateContracts(externalGate);
const externalNeed = externalGate.clarificationNeeds.find((need) => need.relatedGapId === "gap-external-dependency");
assert.equal(externalNeed.targetRole, "External or cross-functional process owner");
assert.equal(externalNeed.recommendedChannel, "external_interface_review");

for (const need of [...clarification.clarificationNeeds, ...reviewGate.clarificationNeeds, ...authorityGate.clarificationNeeds, ...externalGate.clarificationNeeds]) {
  assert.ok(need.questionText, "need should include question text");
  assert.ok(need.targetRecipient || need.targetRole, "need should include target");
  assert.ok(need.whyItMatters, "need should include why it matters");
  assert.ok(need.relatedGapId || need.relatedSevenConditionKey, "need should include related gap/condition");
  assert.ok(need.exampleAnswer, "need should include example answer");
  assert.ok(need.blockingStatus, "need should include blocking status");
  assert.ok(need.basis.references.length > 0, "need should include evidence/source basis");
  assert.ok(need.recommendedChannel, "need should include recommended channel");
  assert.ok(need.priority, "need should include priority");
  assert.ok(need.exampleAnswer.includes("I do not know") || need.questionType === "admin_review_decision" || need.expectedAnswerType !== "free_text", "participant-facing open questions should allow not knowing/out-of-role answers");
}

const store = createInMemoryStore();
store.workflowReadinessResults.save(warningReadiness);
const fromRepos = runPre6CGateFromRepositories(warningReadiness.resultId, {
  workflowReadinessResults: store.workflowReadinessResults,
  prePackageGateResults: store.prePackageGateResults,
  clarificationNeeds: store.clarificationNeeds,
  inquiryPackets: store.inquiryPackets,
}, {
  gateResultId: "gate-from-repos",
  now,
});
assertGateContracts(fromRepos);
assert.equal(store.prePackageGateResults.findById("gate-from-repos")?.gateResultId, "gate-from-repos", "gate should persist from repository path");
assert.ok(store.clarificationNeeds.findAll().length > 0, "clarification needs should persist");
assert.ok(store.inquiryPackets.findAll().length > 0, "inquiry packets should persist");

assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 14 must not create InitialWorkflowPackage records");
assert.equal(store.workflowGapClosureBriefs.findAll().length, 0, "Block 14 must not create WorkflowGapClosureBrief records");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "Block 14 must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 14 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 14 must not create Pass 7 records");

console.log("Pass 6 Block 14 Pre-6C gate proof passed.");
