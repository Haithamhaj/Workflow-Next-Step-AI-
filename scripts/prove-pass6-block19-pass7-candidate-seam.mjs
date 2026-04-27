import assert from "node:assert/strict";
import {
  validatePass7ReviewCandidate,
} from "../packages/contracts/dist/index.js";
import {
  createInMemoryStore,
} from "../packages/persistence/dist/index.js";
import {
  createPass7ReviewCandidatesFromPass6Context,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T00:00:00.000Z";
const caseId = "case-pass6-block19";

function basis(id, summary = "Pass 6 proof basis") {
  return {
    basisId: `basis:${id}`,
    basisType: "method_output",
    summary,
    references: [{ referenceId: `ref:${id}`, referenceType: "proof_fixture" }],
  };
}

function difference(overrides) {
  return {
    differenceId: overrides.differenceId,
    caseId,
    involvedClaimIds: overrides.involvedClaimIds ?? [`claim:${overrides.differenceId}:a`, `claim:${overrides.differenceId}:b`],
    involvedLayers: overrides.involvedLayers ?? ["frontline", "manager"],
    involvedRoles: overrides.involvedRoles ?? ["Coordinator", "Manager"],
    differenceType: overrides.differenceType,
    materiality: overrides.materiality ?? "high",
    recommendedRoute: overrides.recommendedRoute ?? "review_candidate",
    explanation: overrides.explanation,
    methodUsageIds: overrides.methodUsageIds ?? [`method:${overrides.differenceId}`],
    notPerformanceEvaluation: true,
  };
}

const sevenConditions = {
  core_sequence_continuity: { status: "warning", rationale: "Sequence has review-worthy caveat.", basis: basis("sequence"), blocksInitialPackage: false },
  step_to_step_connection: { status: "warning", rationale: "Step connection has warning.", basis: basis("step"), blocksInitialPackage: false },
  essential_step_requirements: { status: "unknown", rationale: "Essential requirement is unresolved.", basis: basis("essential"), blocksInitialPackage: true },
  decision_rules_thresholds: { status: "clear_enough", rationale: "Decision rules are sufficient.", basis: basis("decision"), blocksInitialPackage: false },
  handoffs_responsibility: { status: "warning", rationale: "Responsibility warning remains visible.", basis: basis("handoff"), blocksInitialPackage: false },
  controls_approvals: { status: "materially_broken", rationale: "Material approval conflict requires review.", basis: basis("control"), blocksInitialPackage: true },
  use_case_boundary: { status: "warning", rationale: "Boundary warning remains visible.", basis: basis("boundary"), blocksInitialPackage: false },
};

const readinessResult = {
  resultId: "readiness-review-required",
  caseId,
  assembledWorkflowDraftId: "draft-1",
  readinessDecision: "needs_review_decision_before_package",
  sevenConditionAssessment: {
    assessmentId: "assessment-1",
    caseId,
    assembledWorkflowDraftId: "draft-1",
    conditions: sevenConditions,
    overallSummary: "Review decision required before package.",
  },
  gapRiskSummary: {
    summary: "Material approval/control conflict requires review.",
    gapIds: ["gap-control-1"],
    riskIds: ["risk-control-1"],
  },
  allowedUseFor6C: ["none"],
  routingRecommendations: ["require_review_decision"],
  analysisMetadata: { createdAt: now, createdBy: "proof" },
  is6CAllowed: false,
};

const reviewGate = {
  gateResultId: "gate-review-required",
  caseId,
  workflowReadinessResultId: readinessResult.resultId,
  gateDecision: "review_decision_required_before_package",
  clarificationNeeds: [],
  inquiryPackets: [],
};

const proceedWithWarningsGate = {
  gateResultId: "gate-proceed-warnings",
  caseId,
  workflowReadinessResultId: "readiness-warnings",
  gateDecision: "proceed_with_warnings_approved",
  clarificationNeeds: [],
  inquiryPackets: [],
  proceedWithWarningsApproval: {
    approvalStatus: "approved",
    approvedBy: "admin",
    approvedAt: now,
    approvalNote: "Proceed with limitation visible.",
    warningsAccepted: ["External dependency remains unvalidated."],
    reasonForProceeding: "Client needs initial package with limitations.",
    limitationsToKeepVisible: ["External dependency remains unvalidated."],
    followUpRecommendation: "Review external dependency after initial package delivery.",
  },
};

const externalInterface = {
  interfaceId: "external-interface-blocker",
  caseId,
  relatedWorkflowDraftId: "draft-1",
  relatedReadinessResultId: readinessResult.resultId,
  relatedGateResultId: reviewGate.gateResultId,
  interfaceType: "approval_control_authority",
  externalDepartmentOrRole: "Finance",
  selectedDepartmentSide: "Operations",
  whereItOccursInWorkflow: "control:approval",
  whatIsTransferredOrRequired: "Finance approval is required but authority is unvalidated.",
  basis: basis("external-interface", "External interface proof basis"),
  confirmationStatus: "unvalidated",
  materiality: "blocker",
  affectsSevenCondition: ["controls_approvals"],
  recommendedAction: "require_review_decision",
  limitationsCaveats: ["External workflow is not analyzed or invented."],
  packageVisualConsumption: {
    includeInPackageInterfaceNotes: true,
    includeInVisualGraph: true,
    visualNodeStatus: "external_unvalidated",
  },
  scopeBoundary: {
    selectedScopeRemainsPrimary: true,
    externalWorkflowNotAnalyzed: true,
    scopeExpansionImplemented: false,
  },
  metadata: {
    createdAt: now,
    createdBy: "proof",
    notes: "Interface record only.",
  },
};

const packageWithReviewWarning = {
  packageId: "initial-package-warning",
  caseId,
  workflowReadinessResultId: "readiness-warnings",
  packageStatus: "initial_package_ready_with_warnings",
  clientFacingSections: [{ sectionId: "summary", title: "Summary", contentSummary: "Initial package with warning." }],
  warningsCaveats: ["Formal review follow-up required for accepted limitation."],
  interfacesDependencies: ["Finance approval remains visible."],
  documentReferenceImplications: ["Reference appears too generic for detailed comparison."],
  metadata: { createdAt: now, createdBy: "proof" },
};

const differences = [
  difference({
    differenceId: "difference-factual-conflict",
    differenceType: "factual_conflict",
    explanation: "Two participant claims directly conflict on whether approval is required.",
  }),
  difference({
    differenceId: "difference-document-reality",
    differenceType: "normative_reality_mismatch",
    explanation: "SOP/document says manager approves, but participant reality says Finance approves.",
  }),
  difference({
    differenceId: "difference-ownership-authority",
    differenceType: "variant",
    explanation: "Owner and authority for exception handling remain unclear.",
    recommendedRoute: "review_candidate",
  }),
  difference({
    differenceId: "difference-approval-control",
    differenceType: "variant",
    explanation: "Approval control threshold conflicts across claims.",
    recommendedRoute: "blocker_candidate",
  }),
  difference({
    differenceId: "difference-low-warning",
    differenceType: "variant",
    materiality: "low",
    recommendedRoute: "warning",
    explanation: "Low-materiality wording variation should remain a warning only.",
  }),
];

const store = createInMemoryStore();
const beforeCounts = {
  readiness: store.workflowReadinessResults.findAll().length,
  packages: store.initialWorkflowPackages.findAll().length,
  briefs: store.workflowGapClosureBriefs.findAll().length,
  visuals: store.workflowGraphRecords.findAll().length,
  copilot: store.pass6CopilotInteractions.findAll().length,
  reviewIssues: store.reviewIssues.findAll().length,
};

const result = createPass7ReviewCandidatesFromPass6Context({
  caseId,
  differences,
  workflowReadinessResult: readinessResult,
  prePackageGateResult: reviewGate,
  externalInterfaceRecords: [externalInterface],
  initialWorkflowPackage: packageWithReviewWarning,
  now,
}, {
  pass7ReviewCandidates: store.pass7ReviewCandidates,
});

assert.equal(result.ok, true, result.ok ? "" : result.error);
assert.equal(result.boundary.candidateSeamOnly, true, "Block 19 must return candidate seam boundary");
assert.equal(result.boundary.noPass7DiscussionThreads, true, "Block 19 must not create discussion mechanics");
assert.equal(result.boundary.noProviderCalls, true, "Block 19 must not call providers");

for (const candidate of result.candidates) {
  const validation = validatePass7ReviewCandidate(candidate);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  assert.equal(candidate.status, "candidate_open", "new candidates start open only");
  assert.ok(candidate.sourceId, "candidate links to source ID");
  assert.ok(candidate.sourcePass6RecordType, "candidate links to source record type");
  assert.ok(candidate.linkedReferences.length > 0, "candidate preserves source references");
}

function hasCandidate(issueType, sourceId) {
  return result.candidates.some((candidate) => candidate.issueType === issueType && (!sourceId || candidate.sourceId === sourceId));
}

assert.ok(hasCandidate("factual_conflict", "difference-factual-conflict"), "material factual conflict creates candidate");
assert.ok(hasCandidate("document_reality_mismatch", "difference-document-reality"), "document-vs-reality mismatch creates candidate");
assert.ok(hasCandidate("ownership_authority_conflict", "difference-ownership-authority"), "ownership/authority conflict creates candidate");
assert.ok(hasCandidate("approval_control_conflict", "difference-approval-control"), "approval/control conflict creates candidate");
assert.ok(hasCandidate("external_interface_blocker", externalInterface.interfaceId), "external interface blocker creates candidate");
assert.ok(hasCandidate("unresolved_high_materiality_gap", reviewGate.gateResultId), "Pre-6C review decision gate creates candidate");
assert.ok(hasCandidate("proceed_with_warnings_followup", packageWithReviewWarning.packageId), "proceed-with-warnings follow-up can create candidate");
assert.equal(hasCandidate("other_review_needed", "difference-low-warning"), false, "low-materiality warning does not automatically create candidate");
assert.equal(result.candidates.some((candidate) => candidate.sourceId === "difference-low-warning"), false, "low-materiality warning source is not auto-candidated");

const factualConflict = result.candidates.find((candidate) => candidate.issueType === "factual_conflict");
assert.ok(factualConflict?.linkedDifferenceIds?.includes("difference-factual-conflict"), "candidate links back to difference");
assert.ok(factualConflict?.linkedClaimIds?.length, "candidate links back to claims");

const accepted = store.pass7ReviewCandidates.update(factualConflict.candidateId, {
  status: "accepted_for_pass7_later",
  adminDecision: "accepted_for_later_pass7",
  adminNote: "Accept seam candidate for later Pass 7 discussion.",
  updatedAt: "2026-04-27T01:00:00.000Z",
});
assert.equal(accepted?.status, "accepted_for_pass7_later", "candidate can be accepted for later Pass 7");
assert.equal(accepted?.adminDecision, "accepted_for_later_pass7", "accepted candidate records admin decision");

const dismissCandidate = result.candidates.find((candidate) => candidate.issueType === "document_reality_mismatch");
const dismissed = store.pass7ReviewCandidates.update(dismissCandidate.candidateId, {
  status: "dismissed",
  adminDecision: "dismissed",
  adminNote: "Dismissed as already covered by document policy review.",
  updatedAt: "2026-04-27T01:01:00.000Z",
});
assert.equal(dismissed?.status, "dismissed", "candidate can be dismissed");

const deferCandidate = result.candidates.find((candidate) => candidate.issueType === "external_interface_blocker");
const deferred = store.pass7ReviewCandidates.update(deferCandidate.candidateId, {
  status: "deferred",
  adminDecision: "deferred",
  adminNote: "Defer until external owner provides evidence.",
  updatedAt: "2026-04-27T01:02:00.000Z",
});
assert.equal(deferred?.status, "deferred", "candidate can be deferred");

const proceedResult = createPass7ReviewCandidatesFromPass6Context({
  caseId,
  prePackageGateResult: proceedWithWarningsGate,
  now,
  persist: false,
});
assert.equal(proceedResult.ok, true, proceedResult.ok ? "" : proceedResult.error);
assert.ok(
  proceedResult.candidates.some((candidate) => candidate.issueType === "proceed_with_warnings_followup"),
  "proceed-with-warnings gate follow-up can create review candidate",
);

assert.equal(store.workflowReadinessResults.findAll().length, beforeCounts.readiness, "candidate seam must not recalculate or create readiness");
assert.equal(store.initialWorkflowPackages.findAll().length, beforeCounts.packages, "candidate seam must not create packages");
assert.equal(store.workflowGapClosureBriefs.findAll().length, beforeCounts.briefs, "candidate seam must not create gap briefs");
assert.equal(store.workflowGraphRecords.findAll().length, beforeCounts.visuals, "candidate seam must not create visuals");
assert.equal(store.pass6CopilotInteractions.findAll().length, beforeCounts.copilot, "candidate seam must not create Copilot writes");
assert.equal(store.reviewIssues.findAll().length, beforeCounts.reviewIssues, "candidate seam must not create Pass 7 issue threads or review mechanics");

console.log("Pass 6 Block 19 Pass 7 candidate seam proof passed.");
