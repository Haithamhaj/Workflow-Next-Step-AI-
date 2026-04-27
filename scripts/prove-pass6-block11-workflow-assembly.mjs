import assert from "node:assert/strict";

import { validateAssembledWorkflowDraft } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { assembleWorkflowDraftFromClaims } from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T19:00:00.000Z";
const caseId = "case-pass6-block11-proof";
const bundleId = "bundle-pass6-block11-proof";

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
    secondaryClaimTypes: input.secondaryClaimTypes,
    normalizedStatement: input.statement,
    claimText: input.statement,
    sourceParticipantIds: input.participants ?? ["participant-ops"],
    sourceSessionIds: input.sessions ?? ["session-ops"],
    sourceLayerContextIds: input.layers ?? ["layer:operations"],
    truthLensContextIds: input.truthLens ?? ["truth_lens:execution_evidence"],
    unitIds: input.unitIds ?? [`unit-${input.claimId}`],
    basis: input.basis ?? basis(input.claimId, "extraction", input.sessions?.[0] ?? "session-ops"),
    confidence: input.confidence ?? "medium",
    materiality: input.materiality ?? "medium",
    status: input.status ?? "accepted_for_assembly",
  };
}

const claims = [
  claim({
    claimId: "claim-step-check-request",
    primaryClaimType: "execution_claim",
    statement: "Coordinator checks the vendor request.",
    unitIds: ["unit-step-check"],
  }),
  claim({
    claimId: "claim-sequence-submit-finance",
    primaryClaimType: "sequence_claim",
    statement: "After checking the request, coordinator sends it to Finance.",
    unitIds: ["unit-sequence-finance"],
  }),
  claim({
    claimId: "claim-decision-international-vendor",
    primaryClaimType: "decision_rule_claim",
    statement: "If vendor is international, Finance approval is required.",
    unitIds: ["unit-decision-international"],
    materiality: "high",
  }),
  claim({
    claimId: "claim-handoff-finance-owner",
    primaryClaimType: "ownership_claim",
    statement: "Finance owns the approval handoff for international vendors.",
    truthLens: ["truth_lens:handoff_dependency_evidence", "truth_lens:approval_control_evidence"],
    unitIds: ["unit-handoff-finance"],
    materiality: "high",
  }),
  claim({
    claimId: "claim-control-manager-approval",
    primaryClaimType: "ownership_claim",
    statement: "Manager approval control is required before Finance processing.",
    truthLens: ["truth_lens:approval_control_evidence"],
    unitIds: ["unit-control-manager"],
    materiality: "high",
  }),
  claim({
    claimId: "claim-system-erp-tool",
    primaryClaimType: "execution_claim",
    statement: "The team records the request in the ERP system tool.",
    unitIds: ["unit-system-erp"],
  }),
  claim({
    claimId: "claim-document-finance-approves",
    primaryClaimType: "boundary_claim",
    statement: "SOP document/source signal says Finance approves every vendor request.",
    basis: basis("document-finance-approves", "source_document"),
    truthLens: ["truth_lens:document_signal_evidence", "truth_lens:policy_intent_evidence"],
    participants: [],
    sessions: [],
    layers: ["document:vendor-sop"],
    confidence: "unknown",
    status: "warning",
  }),
  claim({
    claimId: "claim-unresolved-tax-owner",
    primaryClaimType: "ownership_claim",
    statement: "Tax ownership is unclear.",
    status: "unresolved",
    confidence: "low",
    materiality: "high",
  }),
];

const differences = [
  {
    differenceId: "difference-completion-step-sequence",
    caseId,
    involvedClaimIds: ["claim-step-check-request", "claim-sequence-submit-finance"],
    involvedLayers: ["layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "completion",
    materiality: "medium",
    recommendedRoute: "carry_as_completion",
    explanation: "Execution and sequence claims complete each other.",
    methodUsageIds: ["method-usage-bpmn-completion"],
    notPerformanceEvaluation: true,
  },
  {
    differenceId: "difference-variant-decision",
    caseId,
    involvedClaimIds: ["claim-decision-international-vendor", "claim-control-manager-approval"],
    involvedLayers: ["layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "variant",
    materiality: "high",
    recommendedRoute: "carry_as_variant",
    explanation: "Approval path varies by vendor and manager control.",
    methodUsageIds: ["method-usage-raci-variant"],
    notPerformanceEvaluation: true,
  },
  {
    differenceId: "difference-normative-doc-reality",
    caseId,
    involvedClaimIds: ["claim-document-finance-approves", "claim-decision-international-vendor"],
    involvedLayers: ["document:vendor-sop", "layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "normative_reality_mismatch",
    materiality: "high",
    recommendedRoute: "review_candidate",
    explanation: "SOP wording differs from participant-described operational threshold.",
    methodUsageIds: ["method-usage-espoused-doc"],
    notPerformanceEvaluation: true,
  },
  {
    differenceId: "difference-factual-tax-owner",
    caseId,
    involvedClaimIds: ["claim-handoff-finance-owner", "claim-unresolved-tax-owner"],
    involvedLayers: ["layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "factual_conflict",
    materiality: "high",
    recommendedRoute: "blocker_candidate",
    explanation: "Tax ownership conflicts with Finance handoff ownership.",
    methodUsageIds: ["method-usage-triangulation-tax"],
    notPerformanceEvaluation: true,
  },
];

const methodUsages = [
  {
    methodUsageId: "method-usage-bpmn-completion",
    methodId: "method-bpmn-process-structure-v1",
    methodKey: "bpmn_process_structure",
    methodName: "BPMN / Process Structure Lens",
    methodType: "process_structure_lens",
    version: "1.0.0",
    selectionReason: "Sequence and step completion interpretation.",
    selectionSource: "system_selected",
    methodRole: "primary",
    appliedToType: "difference",
    appliedToId: "difference-completion-step-sequence",
    outputSummary: "Completion only.",
    impact: {
      affectedIds: ["claim-step-check-request", "claim-sequence-submit-finance"],
      impactSummary: "Enriches workflow understanding without readiness.",
      changedRouting: false,
      changedReadiness: false,
    },
    suitabilityAssessment: { suitable: true, notes: "Suitable.", limitations: ["No readiness."] },
  },
];

const store = createInMemoryStore();
const result = assembleWorkflowDraftFromClaims({
  caseId,
  basedOnBundleId: bundleId,
  claims,
  differences,
  methodUsages,
  draftId: "draft-pass6-block11-proof",
  now,
}, {
  assembledWorkflowDrafts: store.assembledWorkflowDrafts,
});

assert.equal(result.ok, true, result.ok ? "" : result.error);
const draft = result.draft;
const { createdAt, updatedAt, ...contractDraft } = draft;
assert.equal(createdAt, now);
assert.equal(updatedAt, now);
const validation = validateAssembledWorkflowDraft(contractDraft);
assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));

assert.ok(draft.steps.some((step) => step.claimIds?.includes("claim-step-check-request")), "accepted execution claim should become assembled workflow step");
assert.ok(draft.sequence.some((sequence) => sequence.claimIds?.includes("claim-sequence-submit-finance")), "sequence claim should contribute to sequence");
assert.ok(draft.decisions.some((decision) => decision.claimIds?.includes("claim-decision-international-vendor")), "decision rule claim should contribute to decisions");
assert.ok(draft.handoffs.some((handoff) => handoff.claimIds?.includes("claim-handoff-finance-owner")), "ownership/handoff claim should contribute to handoffs");
assert.ok(draft.controls.some((control) => control.claimIds?.includes("claim-control-manager-approval")), "approval/control claim should contribute to controls");
assert.ok(draft.systemsTools.some((system) => system.claimIds?.includes("claim-system-erp-tool")), "system/tool claim should contribute to systems/tools");

assert.ok(draft.warningsCaveats.some((warning) => warning.includes("completion difference enriches workflow understanding")), "completion difference should enrich workflow understanding as caveat/trace");
assert.ok(draft.variants.some((variant) => variant.claimIds?.includes("claim-decision-international-vendor") && variant.claimIds?.includes("claim-control-manager-approval")), "variant difference should remain visible as variant");
assert.ok(draft.warningsCaveats.some((warning) => warning.includes("normative/document-vs-reality mismatch")), "normative mismatch should remain warning/caveat");
assert.ok(!draft.steps.some((step) => step.claimIds?.includes("claim-document-finance-approves")), "document-only claim should not become operational step");
assert.ok(draft.warningsCaveats.some((warning) => warning.includes("document/source signal only")), "document-only claim should remain source signal/caveat");
assert.ok(draft.unresolvedItems.some((item) => item.includes("factual conflict remains unresolved")), "factual conflict should remain unresolved/review-needed");
assert.ok(draft.unresolvedItems.some((item) => item.includes("claim-unresolved-tax-owner")), "unresolved claim should not be assembled as clean truth");

const stepBasis = draft.claimBasisMap.find((entry) => entry.workflowElementId === "step:claim-step-check-request");
assert.ok(stepBasis, "claim basis map should include step basis");
assert.deepEqual(stepBasis.claimIds, ["claim-step-check-request"]);
assert.deepEqual(stepBasis.sourceUnitIds, ["unit-step-check"]);
assert.deepEqual(stepBasis.participantIds, ["participant-ops"]);
assert.deepEqual(stepBasis.sessionIds, ["session-ops"]);
assert.deepEqual(stepBasis.layerContextIds, ["layer:operations"]);
assert.deepEqual(stepBasis.truthLensContextIds, ["truth_lens:execution_evidence"]);
assert.ok(stepBasis.differenceIds?.includes("difference-completion-step-sequence"), "basis should include related difference IDs");
assert.ok(stepBasis.methodUsageIds?.includes("method-usage-bpmn-completion"), "basis should include related method usage IDs");
assert.equal(stepBasis.basis?.basisId, "basis-claim-step-check-request", "basis should preserve evidence/source basis");
assert.equal(stepBasis.confidence, "medium");
assert.equal(stepBasis.materiality, "medium");

const variantBasis = draft.claimBasisMap.find((entry) => entry.workflowElementId === "variant:difference-variant-decision");
assert.ok(variantBasis, "claim basis map should include variant basis");
assert.ok(variantBasis.claimIds.includes("claim-decision-international-vendor"));
assert.ok(variantBasis.differenceIds?.includes("difference-variant-decision"));
assert.ok(variantBasis.methodUsageIds?.includes("method-usage-raci-variant"));

assert.ok(draft.workflowUnderstandingLevel, "workflowUnderstandingLevel should be produced");
assert.notEqual(draft.workflowUnderstandingLevel, "package_ready_workflow", "Block 11 should not convert understanding level into package readiness");
assert.ok(draft.metadata.notes?.includes("No seven-condition evaluation"), "metadata should preserve boundary summary");
assert.equal(store.assembledWorkflowDrafts.findById(draft.draftId)?.draftId, draft.draftId, "assembled draft should persist");

assert.equal(store.workflowReadinessResults.findAll().length, 0, "Block 11 must not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "Block 11 must not create Pre-6C results");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 11 must not create InitialWorkflowPackage records");
assert.equal(store.workflowGapClosureBriefs.findAll().length, 0, "Block 11 must not create gap closure briefs");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "Block 11 must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 11 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 11 must not create Pass 7 records");

console.log("Pass 6 Block 11 workflow assembly proof passed.");
