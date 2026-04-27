import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  buildPass6MethodologyAnalysisReport,
  buildPass6MethodologyAnalysisReportFromRepositories,
  resolvePass6MethodRegistryForAdmin,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T21:00:00.000Z";
const caseId = "case-pass6-block13-proof";
const bundleId = "bundle-pass6-block13-proof";
const conditionKeys = [
  "core_sequence_continuity",
  "step_to_step_connection",
  "essential_step_requirements",
  "decision_rules_thresholds",
  "handoffs_responsibility",
  "controls_approvals",
  "use_case_boundary",
];

function basis(id, basisType = "extraction") {
  return {
    basisId: `basis-${id}`,
    basisType,
    summary: `basis for ${id}`,
    references: [{
      referenceId: `ref-${id}`,
      referenceType: basisType === "source_document" ? "document_source_signal" : "workflow_claim",
      evidenceItemId: basisType === "source_document" ? undefined : `evidence-${id}`,
      sourceId: basisType === "source_document" ? "source-policy" : undefined,
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
    sourceLayerContextIds: input.layers ?? ["layer:operations"],
    truthLensContextIds: input.truthLens ?? ["truth_lens:execution_evidence"],
    unitIds: input.unitIds ?? [`unit-${input.claimId}`],
    basis: input.basis ?? basis(input.claimId),
    confidence: input.confidence ?? "medium",
    materiality: input.materiality ?? "medium",
    status: input.status ?? "accepted_for_assembly",
  };
}

const claims = [
  claim({
    claimId: "claim-step",
    primaryClaimType: "execution_claim",
    statement: "Coordinator checks the request.",
    unitIds: ["unit-step"],
    confidence: "high",
  }),
  claim({
    claimId: "claim-sequence",
    primaryClaimType: "sequence_claim",
    statement: "Coordinator sends the checked request to Finance.",
    unitIds: ["unit-sequence"],
  }),
  claim({
    claimId: "claim-decision",
    primaryClaimType: "decision_rule_claim",
    statement: "If vendor is international, Finance approval is required.",
    unitIds: ["unit-decision"],
    materiality: "high",
  }),
  claim({
    claimId: "claim-handoff",
    primaryClaimType: "ownership_claim",
    statement: "Finance owns the approval handoff.",
    truthLens: ["truth_lens:handoff_dependency_evidence"],
    unitIds: ["unit-handoff"],
  }),
  claim({
    claimId: "claim-document",
    primaryClaimType: "boundary_claim",
    statement: "Document/source signal says Finance approves all requests.",
    participants: [],
    sessions: [],
    layers: ["document:policy"],
    truthLens: ["truth_lens:document_signal_evidence"],
    basis: basis("document", "source_document"),
    status: "warning",
    confidence: "unknown",
  }),
];

const methodUsages = [
  {
    methodUsageId: "method-usage-bpmn",
    methodId: "method-bpmn-process-structure-v1",
    methodKey: "bpmn_process_structure",
    methodName: "BPMN / Process Structure Lens",
    methodType: "process_structure_lens",
    version: "1.0.0",
    selectionReason: "Sequence and step relationship.",
    selectionSource: "system_selected",
    methodRole: "primary",
    appliedToType: "difference",
    appliedToId: "difference-completion",
    outputSummary: "Completion trace.",
    impact: {
      affectedIds: ["claim-step", "claim-sequence"],
      impactSummary: "Enriches assembly view without readiness override.",
      changedRouting: false,
      changedReadiness: false,
    },
    suitabilityAssessment: {
      suitable: true,
      notes: "Suitable for sequence interpretation.",
      limitations: ["Does not decide readiness."],
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    methodUsageId: "method-usage-raci",
    methodId: "method-raci-responsibility-v1",
    methodKey: "raci_responsibility",
    methodName: "RACI / Responsibility Lens",
    methodType: "responsibility_lens",
    version: "1.0.0",
    selectionReason: "Ownership and approval responsibility.",
    selectionSource: "admin_forced",
    methodRole: "admin_forced",
    appliedToType: "difference",
    appliedToId: "difference-conflict",
    outputSummary: "Responsibility review trace.",
    impact: {
      affectedIds: ["claim-handoff", "claim-document"],
      impactSummary: "Flags review-sensitive mismatch without creating Pass 7.",
      changedRouting: false,
      changedReadiness: false,
    },
    suitabilityAssessment: {
      suitable: true,
      notes: "Suitable with caveat.",
      limitations: ["Cannot evaluate employees.", "Cannot override admin decision."],
    },
    createdAt: now,
    updatedAt: now,
  },
];

const differences = [
  {
    differenceId: "difference-completion",
    caseId,
    involvedClaimIds: ["claim-step", "claim-sequence"],
    involvedLayers: ["layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "completion",
    materiality: "medium",
    recommendedRoute: "carry_as_completion",
    explanation: "Step and sequence complete each other.",
    methodUsageIds: ["method-usage-bpmn"],
    notPerformanceEvaluation: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    differenceId: "difference-variant",
    caseId,
    involvedClaimIds: ["claim-decision", "claim-handoff"],
    involvedLayers: ["layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "variant",
    materiality: "high",
    recommendedRoute: "carry_as_variant",
    explanation: "Approval path variant remains visible.",
    methodUsageIds: ["method-usage-raci"],
    notPerformanceEvaluation: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    differenceId: "difference-normative",
    caseId,
    involvedClaimIds: ["claim-document", "claim-decision"],
    involvedLayers: ["document:policy", "layer:operations"],
    involvedRoles: ["participant-ops"],
    differenceType: "normative_reality_mismatch",
    materiality: "high",
    recommendedRoute: "review_candidate",
    explanation: "Document signal differs from participant-described threshold.",
    methodUsageIds: ["method-usage-raci"],
    notPerformanceEvaluation: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    differenceId: "difference-conflict",
    caseId,
    involvedClaimIds: ["claim-handoff", "claim-document"],
    involvedLayers: ["layer:operations", "document:policy"],
    involvedRoles: ["participant-ops"],
    differenceType: "factual_conflict",
    materiality: "high",
    recommendedRoute: "blocker_candidate",
    explanation: "Material ownership conflict remains review-needed.",
    methodUsageIds: ["method-usage-raci"],
    notPerformanceEvaluation: true,
    createdAt: now,
    updatedAt: now,
  },
];

const draft = {
  draftId: "draft-pass6-block13",
  caseId,
  basedOnBundleId: bundleId,
  workflowUnderstandingLevel: "workflow_exists_but_not_package_ready",
  steps: [{ elementId: "step:claim-step", label: "Coordinator checks the request", claimIds: ["claim-step"], basis: basis("claim-step") }],
  sequence: [{ elementId: "sequence:claim-sequence", label: "Coordinator sends request to Finance", claimIds: ["claim-sequence"], basis: basis("claim-sequence") }],
  decisions: [{ elementId: "decision:claim-decision", label: "International vendor approval threshold", claimIds: ["claim-decision"], basis: basis("claim-decision") }],
  handoffs: [{ elementId: "handoff:claim-handoff", label: "Finance approval handoff", claimIds: ["claim-handoff"], basis: basis("claim-handoff") }],
  controls: [{ elementId: "control:claim-decision", label: "Finance approval control", claimIds: ["claim-decision"], basis: basis("claim-decision") }],
  systemsTools: [],
  variants: [{ elementId: "variant:difference-variant", label: "Approval path variant", claimIds: ["claim-decision", "claim-handoff"], basis: basis("difference-variant", "method_output") }],
  warningsCaveats: ["claim-document remains document/source signal only, not operational truth.", "warning: approval wording needs admin review."],
  unresolvedItems: ["factual conflict remains unresolved/review-needed: ownership conflict."],
  claimBasisMap: [
    {
      workflowElementId: "step:claim-step",
      claimIds: ["claim-step"],
      sourceUnitIds: ["unit-step"],
      participantIds: ["participant-ops"],
      sessionIds: ["session-ops"],
      layerContextIds: ["layer:operations"],
      truthLensContextIds: ["truth_lens:execution_evidence"],
      methodUsageIds: ["method-usage-bpmn"],
      differenceIds: ["difference-completion"],
      basis: basis("claim-step"),
      confidence: "high",
      materiality: "medium",
      notes: "Step basis.",
    },
  ],
  metadata: {
    createdAt: now,
    createdBy: "proof",
    notes: "Block 13 proof draft.",
  },
  createdAt: now,
  updatedAt: now,
};

function condition(status, rationale, blocksInitialPackage = false) {
  return {
    status,
    rationale,
    basis: basis(`condition-${rationale.replace(/\W+/g, "-")}`, "method_output"),
    blocksInitialPackage,
  };
}

const readinessResult = {
  resultId: "readiness-pass6-block13",
  caseId,
  assembledWorkflowDraftId: draft.draftId,
  readinessDecision: "needs_review_decision_before_package",
  sevenConditionAssessment: {
    assessmentId: "assessment-pass6-block13",
    caseId,
    assembledWorkflowDraftId: draft.draftId,
    conditions: {
      core_sequence_continuity: condition("clear_enough", "Core sequence is clear enough."),
      step_to_step_connection: condition("clear_enough", "Step connection is clear enough."),
      essential_step_requirements: condition("warning", "Document-only caveat remains visible."),
      decision_rules_thresholds: condition("warning", "Decision variant remains visible."),
      handoffs_responsibility: condition("materially_broken", "Material ownership conflict requires review.", true),
      controls_approvals: condition("clear_enough", "Approval control is visible."),
      use_case_boundary: condition("warning", "Document/source boundary remains caveated."),
    },
    overallSummary: "Review needed before package.",
  },
  gapRiskSummary: {
    summary: "One material conflict and two warnings remain.",
    gapIds: ["gap-owner-conflict"],
    riskIds: ["risk-document-caveat"],
  },
  allowedUseFor6C: ["none"],
  routingRecommendations: ["require_review_decision", "produce_gap_closure_brief_later"],
  analysisMetadata: {
    createdAt: now,
    createdBy: "proof",
    notes: "Readiness bridge only; no package generation.",
  },
  is6CAllowed: false,
  createdAt: now,
  updatedAt: now,
};

const registry = resolvePass6MethodRegistryForAdmin();
const built = buildPass6MethodologyAnalysisReport({
  claims,
  methodUsages,
  differences,
  assembledWorkflowDraft: draft,
  readinessResult,
  methodRegistry: registry,
  generatedAt: now,
});
assert.equal(built.ok, true, built.ok ? "" : built.error);
const report = built.report;

assert.equal(report.audience, "admin_internal");
assert.ok(report.clientFacingSplitNote.includes("not the client-facing Initial Workflow Package"));
assert.ok(report.reportBoundaryNotes.some((note) => note.includes("No Pre-6C questions")));
assert.equal(report.workflowAssemblyView.workflowUnderstandingLevel, "workflow_exists_but_not_package_ready");
assert.equal(report.workflowAssemblyView.steps.length, 1);
assert.equal(report.workflowAssemblyView.variants.length, 1);
assert.equal(report.workflowAssemblyView.warningsCaveats.length, 2);
assert.equal(report.workflowAssemblyView.unresolvedItems.length, 1);

const claimRow = report.claimsReviewTable.find((row) => row.claimId === "claim-step");
assert.ok(claimRow, "claims table should include claim-step");
assert.equal(claimRow.claimType, "execution_claim");
assert.equal(claimRow.status, "accepted_for_assembly");
assert.deepEqual(claimRow.sourceUnitIds, ["unit-step"]);
assert.deepEqual(claimRow.participantIds, ["participant-ops"]);
assert.deepEqual(claimRow.sessionIds, ["session-ops"]);
assert.deepEqual(claimRow.layerContextIds, ["layer:operations"]);
assert.deepEqual(claimRow.truthLensContextIds, ["truth_lens:execution_evidence"]);
assert.equal(claimRow.confidence, "high");
assert.equal(claimRow.materiality, "medium");
assert.ok(claimRow.linkedWorkflowElementIds.includes("step:claim-step"));

const methodRow = report.methodUsageTable.find((row) => row.methodUsageId === "method-usage-bpmn");
assert.ok(methodRow, "method table should include BPMN usage");
assert.equal(methodRow.methodKey, "bpmn_process_structure");
assert.ok(methodRow.methodDefinition, "method usage should include method card reference details");
assert.equal(methodRow.selectionReason, "Sequence and step relationship.");
assert.equal(methodRow.selectionSource, "system_selected");
assert.equal(methodRow.suitability.suitable, true);
assert.ok(methodRow.impactSummary.includes("without readiness override"));
assert.equal(methodRow.version, "1.0.0");
assert.ok(methodRow.limitationsBoundaries.length > 0);

for (const differenceType of ["completion", "variant", "normative_reality_mismatch", "factual_conflict"]) {
  assert.ok(report.differenceMismatchTable.some((row) => row.differenceType === differenceType), `difference table should include ${differenceType}`);
}
const conflictRow = report.differenceMismatchTable.find((row) => row.differenceId === "difference-conflict");
assert.equal(conflictRow.recommendedRoute, "blocker_candidate");
assert.equal(conflictRow.materiality, "high");
assert.ok(conflictRow.methodUsageIds.includes("method-usage-raci"));

assert.deepEqual(report.sevenConditionAssessmentTable.map((row) => row.conditionKey), conditionKeys, "seven-condition table should contain exactly all seven conditions");
assert.ok(report.sevenConditionAssessmentTable.some((row) => row.blocksInitialPackage), "seven-condition table should expose blockers");

assert.equal(report.workflowReadinessSummary.readinessDecision, "needs_review_decision_before_package");
assert.equal(report.workflowReadinessSummary.is6CAllowed, false);
assert.deepEqual(report.workflowReadinessSummary.allowedUseFor6C, ["none"]);
assert.deepEqual(report.workflowReadinessSummary.routingRecommendations, ["require_review_decision", "produce_gap_closure_brief_later"]);

assert.ok(report.decisionNeededPanel.blockers.some((item) => item.includes("handoffs_responsibility")), "decision panel should distinguish blockers");
assert.ok(report.decisionNeededPanel.reviewNeeded.some((item) => item.includes("difference-conflict")), "decision panel should distinguish review-needed material conflicts");
assert.ok(report.decisionNeededPanel.warningsProceedable.some((item) => item.includes("document/source signal")), "decision panel should distinguish proceedable warnings");

const store = createInMemoryStore();
for (const claimRecord of claims.map((item) => ({ ...item, createdAt: now, updatedAt: now }))) store.workflowClaims.save(claimRecord);
for (const usage of methodUsages) store.analysisMethodUsages.save(usage);
for (const difference of differences) store.differenceInterpretations.save(difference);
store.assembledWorkflowDrafts.save(draft);
store.workflowReadinessResults.save(readinessResult);

const fromRepos = buildPass6MethodologyAnalysisReportFromRepositories(readinessResult.resultId, {
  workflowReadinessResults: store.workflowReadinessResults,
  assembledWorkflowDrafts: store.assembledWorkflowDrafts,
  workflowClaims: store.workflowClaims,
  differenceInterpretations: store.differenceInterpretations,
  analysisMethodUsages: store.analysisMethodUsages,
  pass6ConfigurationProfiles: store.pass6ConfigurationProfiles,
});
assert.equal(fromRepos.ok, true, fromRepos.ok ? "" : fromRepos.error);
assert.equal(fromRepos.report.resultId, readinessResult.resultId, "admin/API repository output should expose report detail");
assert.equal(fromRepos.report.claimsReviewTable.length, claims.length);
assert.equal(fromRepos.report.methodUsageTable.length, methodUsages.length);

assert.equal(store.prePackageGateResults.findAll().length, 0, "Block 13 must not create PrePackageGateResult records");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 13 must not create InitialWorkflowPackage records");
assert.equal(store.workflowGapClosureBriefs.findAll().length, 0, "Block 13 must not create WorkflowGapClosureBrief records");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "Block 13 must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 13 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 13 must not create Pass 7 records");

console.log("Pass 6 Block 13 analysis report proof passed.");
