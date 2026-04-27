import assert from "node:assert/strict";

import { validateSevenConditionAssessment, validateWorkflowReadinessResult } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { evaluateWorkflowReadinessFromDraft } from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T20:00:00.000Z";
const caseId = "case-pass6-block12-proof";
const conditionKeys = [
  "core_sequence_continuity",
  "step_to_step_connection",
  "essential_step_requirements",
  "decision_rules_thresholds",
  "handoffs_responsibility",
  "controls_approvals",
  "use_case_boundary",
];

function basis(id) {
  return {
    basisId: `basis-${id}`,
    basisType: "extraction",
    summary: `basis for ${id}`,
    references: [{
      referenceId: `ref-${id}`,
      referenceType: "workflow_claim",
      evidenceItemId: `evidence-${id}`,
    }],
  };
}

function element(prefix, id, label) {
  return {
    elementId: `${prefix}:${id}`,
    label,
    description: `${label} assembled for readiness proof.`,
    claimIds: [`claim-${id}`],
    basis: basis(id),
  };
}

function basisEntry(elementId, claimId) {
  return {
    workflowElementId: elementId,
    claimIds: [claimId],
    sourceUnitIds: [`unit-${claimId}`],
    participantIds: ["participant-ops"],
    sessionIds: ["session-ops"],
    layerContextIds: ["layer:operations"],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    methodUsageIds: ["method-usage-readiness-proof"],
    differenceIds: ["difference-readiness-proof"],
    basis: basis(claimId),
    confidence: "high",
    materiality: "medium",
    notes: "Readiness proof claim basis.",
  };
}

function completeDraft(overrides = {}) {
  const steps = [element("step", "check-request", "Coordinator checks the request")];
  const sequence = [element("sequence", "send-finance", "Coordinator sends request to Finance")];
  const decisions = [element("decision", "international-threshold", "International vendors require Finance approval")];
  const handoffs = [element("handoff", "finance-owner", "Finance owns approval handoff")];
  const controls = [element("control", "manager-approval", "Manager approval is recorded")];
  const systemsTools = [element("system", "erp-tool", "ERP system records the request")];
  const variants = overrides.variants ?? [];
  const allElements = [...steps, ...sequence, ...decisions, ...handoffs, ...controls, ...systemsTools, ...variants];
  return {
    draftId: overrides.draftId ?? "draft-ready",
    caseId,
    basedOnBundleId: "bundle-pass6-block12-proof",
    workflowUnderstandingLevel: overrides.workflowUnderstandingLevel ?? "reconstructable_workflow_with_gaps",
    steps: overrides.steps ?? steps,
    sequence: overrides.sequence ?? sequence,
    decisions: overrides.decisions ?? decisions,
    handoffs: overrides.handoffs ?? handoffs,
    controls: overrides.controls ?? controls,
    systemsTools: overrides.systemsTools ?? systemsTools,
    variants,
    warningsCaveats: overrides.warningsCaveats ?? [],
    unresolvedItems: overrides.unresolvedItems ?? [],
    claimBasisMap: overrides.claimBasisMap ?? allElements.flatMap((item) => (item.claimIds ?? []).map((claimId) => basisEntry(item.elementId, claimId))),
    metadata: {
      createdAt: now,
      createdBy: "proof",
      notes: "Assembled workflow draft for Block 12 proof.",
    },
  };
}

function evaluate(draft, store = createInMemoryStore()) {
  const result = evaluateWorkflowReadinessFromDraft({
    assembledWorkflowDraft: draft,
    resultId: `readiness-${draft.draftId}`,
    assessmentId: `assessment-${draft.draftId}`,
    now,
  }, {
    workflowReadinessResults: store.workflowReadinessResults,
  });
  assert.equal(result.ok, true, result.ok ? "" : result.error);
  const { createdAt, updatedAt, ...contractReadiness } = result.readinessResult;
  assert.equal(createdAt, now);
  assert.equal(updatedAt, now);
  const readinessValidation = validateWorkflowReadinessResult(contractReadiness);
  assert.equal(readinessValidation.ok, true, JSON.stringify(readinessValidation.errors ?? []));
  const assessmentValidation = validateSevenConditionAssessment(result.sevenConditionAssessment);
  assert.equal(assessmentValidation.ok, true, JSON.stringify(assessmentValidation.errors ?? []));
  assert.deepEqual(Object.keys(result.sevenConditionAssessment.conditions), conditionKeys, "all seven conditions should be evaluated exactly once in the required object-map order");
  return { ...result, store };
}

const ready = evaluate(completeDraft({ draftId: "draft-ready" }));
assert.equal(ready.readinessResult.readinessDecision, "ready_for_initial_package", "clear complete workflow should be ready");
assert.equal(ready.readinessResult.is6CAllowed, true);
assert.deepEqual(ready.readinessResult.allowedUseFor6C, ["initial_package", "draft_operational_document"]);
assert.deepEqual(ready.readinessResult.routingRecommendations, ["proceed_to_6c"]);
assert.ok(conditionKeys.every((key) => ready.sevenConditionAssessment.conditions[key].blocksInitialPackage === false), "clear workflow should not block any condition");

const warning = evaluate(completeDraft({
  draftId: "draft-warning",
  warningsCaveats: ["automation-readiness weakness: downstream automation needs stricter field normalization."],
}));
assert.equal(warning.readinessResult.readinessDecision, "ready_for_initial_package_with_warnings", "non-blocking warnings should produce ready with warnings");
assert.equal(warning.readinessResult.is6CAllowed, true, "automation-readiness weakness should not block workflow documentability by itself");
assert.deepEqual(warning.readinessResult.allowedUseFor6C, ["initial_package_with_warnings"]);
assert.deepEqual(warning.readinessResult.routingRecommendations, ["proceed_to_6c_with_warnings"]);
assert.ok(warning.readinessResult.analysisMetadata.notes.includes("Automation-readiness weakness is not treated as workflow incompleteness"), "automation weakness boundary should be recorded");

const sequenceBroken = evaluate(completeDraft({
  draftId: "draft-sequence-broken",
  unresolvedItems: ["sequence materially broken: step order between request check and Finance handoff is unknown."],
}));
assert.equal(sequenceBroken.sevenConditionAssessment.conditions.core_sequence_continuity.status, "materially_broken");
assert.equal(sequenceBroken.sevenConditionAssessment.conditions.core_sequence_continuity.blocksInitialPackage, true);
assert.equal(sequenceBroken.readinessResult.is6CAllowed, false, "materially broken sequence should block 6C");

const boundaryBroken = evaluate(completeDraft({
  draftId: "draft-boundary-broken",
  warningsCaveats: ["use-case boundary broken: unclear whether vendor onboarding or payment processing is in scope."],
}));
assert.equal(boundaryBroken.sevenConditionAssessment.conditions.use_case_boundary.status, "materially_broken");
assert.equal(boundaryBroken.sevenConditionAssessment.conditions.use_case_boundary.blocksInitialPackage, true);
assert.equal(boundaryBroken.readinessResult.is6CAllowed, false, "materially broken boundary should block 6C");

const factualConflict = evaluate(completeDraft({
  draftId: "draft-factual-conflict",
  unresolvedItems: ["factual conflict remains unresolved/review-needed: Finance owner and Tax owner claims directly conflict."],
}));
assert.equal(factualConflict.readinessResult.readinessDecision, "needs_review_decision_before_package", "material factual conflict should require review decision");
assert.equal(factualConflict.readinessResult.is6CAllowed, false);
assert.deepEqual(factualConflict.readinessResult.routingRecommendations, ["require_review_decision", "produce_gap_closure_brief_later"]);

const missingDetail = evaluate(completeDraft({
  draftId: "draft-missing-detail",
  unresolvedItems: ["missing essential detail: approval threshold amount is absent."],
}));
assert.equal(missingDetail.readinessResult.readinessDecision, "needs_more_clarification_before_package", "missing essential detail should require clarification before package");
assert.equal(missingDetail.readinessResult.is6CAllowed, false);
assert.deepEqual(missingDetail.readinessResult.routingRecommendations, ["send_to_pre_6c_clarification", "produce_gap_closure_brief_later"]);

const partial = evaluate(completeDraft({
  draftId: "draft-partial",
  workflowUnderstandingLevel: "partial_workflow_understanding",
  sequence: [],
  decisions: [],
  handoffs: [],
  controls: [],
  systemsTools: [],
  warningsCaveats: [],
  unresolvedItems: [],
  claimBasisMap: [basisEntry("step:check-request", "claim-check-request")],
}));
assert.equal(partial.readinessResult.readinessDecision, "partial_only_not_package_ready", "partial workflow should not be package ready");
assert.equal(partial.readinessResult.is6CAllowed, false);
assert.deepEqual(partial.readinessResult.allowedUseFor6C, ["none"]);

const insufficient = evaluate(completeDraft({
  draftId: "draft-insufficient",
  workflowUnderstandingLevel: "partial_workflow_understanding",
  steps: [],
  sequence: [],
  decisions: [],
  handoffs: [],
  controls: [],
  systemsTools: [],
  variants: [],
  warningsCaveats: [],
  unresolvedItems: [],
  claimBasisMap: [],
}));
assert.equal(insufficient.readinessResult.readinessDecision, "workflow_exists_but_current_basis_insufficient", "empty current basis should be insufficient");
assert.equal(insufficient.readinessResult.is6CAllowed, false);
assert.deepEqual(insufficient.readinessResult.routingRecommendations, ["insufficient_basis_stop", "produce_gap_closure_brief_later"]);

const documentOnly = evaluate(completeDraft({
  draftId: "draft-document-only-caveat",
  warningsCaveats: ["claim-document-finance-approves remains document/source signal only, not operational truth."],
}));
assert.equal(documentOnly.sevenConditionAssessment.conditions.use_case_boundary.status, "warning", "document-only claims should not make boundary clear by default");
assert.equal(documentOnly.readinessResult.readinessDecision, "ready_for_initial_package_with_warnings");
assert.ok(documentOnly.readinessResult.gapRiskSummary.summary.includes("document/source claims must not be presented as complete operational truth"), "allowed use summary should preserve document/source boundary");

const stored = ready.store.workflowReadinessResults.findById("readiness-draft-ready");
assert.equal(stored?.resultId, "readiness-draft-ready", "readiness result should persist");
assert.equal(ready.store.prePackageGateResults.findAll().length, 0, "Block 12 must not create PrePackageGateResult records");
assert.equal(ready.store.initialWorkflowPackages.findAll().length, 0, "Block 12 must not create InitialWorkflowPackage records");
assert.equal(ready.store.workflowGapClosureBriefs.findAll().length, 0, "Block 12 must not create WorkflowGapClosureBrief records");
assert.equal(ready.store.workflowGraphRecords.findAll().length, 0, "Block 12 must not create visual records");
assert.equal(ready.store.pass6CopilotContextBundles.findAll().length, 0, "Block 12 must not create Copilot records");
assert.equal(ready.store.pass7ReviewCandidates.findAll().length, 0, "Block 12 must not create Pass 7 records");

console.log("Pass 6 Block 12 readiness result proof passed.");
