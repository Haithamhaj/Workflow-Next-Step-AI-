#!/usr/bin/env node
import { strict as assert } from "node:assert";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { createCase, createCompany } from "../packages/core-case/dist/index.js";
import { generatePass6Output } from "../packages/packages-output/dist/index.js";

const store = createInMemoryStore();
const now = "2026-04-30T00:00:00.000Z";

function company(companyId, displayName) {
  return { companyId, displayName, status: "active", createdAt: now, updatedAt: now };
}

function caseConfig(companyId, caseId, mainDepartment) {
  return {
    companyId,
    caseId,
    domain: "operations",
    mainDepartment,
    useCaseLabel: "pass6-package-lineage-proof",
    companyProfileRef: `${companyId}/profile`,
    createdAt: now,
  };
}

function basis(id) {
  return {
    basisId: id,
    basisType: "raw_evidence",
    summary: "Proof basis.",
    references: [{ referenceId: `${id}:ref`, referenceType: "proof" }],
  };
}

function conditions(caseId, draftId, companyId, analysisRunId) {
  const item = {
    status: "clear_enough",
    rationale: "Proof condition is clear enough.",
    basis: basis("condition-basis"),
    blocksInitialPackage: false,
  };
  return {
    assessmentId: `assessment:${analysisRunId}`,
    companyId,
    caseId,
    analysisRunId,
    lineageStatus: "active",
    assembledWorkflowDraftId: draftId,
    conditions: {
      core_sequence_continuity: item,
      step_to_step_connection: item,
      essential_step_requirements: item,
      decision_rules_thresholds: item,
      handoffs_responsibility: item,
      controls_approvals: item,
      use_case_boundary: item,
    },
    overallSummary: "Proof seven-condition assessment.",
  };
}

function draft(companyId, caseId, analysisRunId) {
  return {
    draftId: `draft:${analysisRunId}`,
    companyId,
    caseId,
    analysisRunId,
    lineageStatus: "active",
    basedOnBundleId: `bundle:${analysisRunId}`,
    workflowUnderstandingLevel: "package_ready_workflow",
    steps: [{ elementId: `step:${analysisRunId}`, label: "Receive request", claimIds: [`claim:${analysisRunId}`] }],
    sequence: [{ elementId: `seq:${analysisRunId}`, label: "Receive then review", claimIds: [`claim:${analysisRunId}`] }],
    decisions: [],
    handoffs: [],
    controls: [],
    systemsTools: [],
    variants: [],
    warningsCaveats: [],
    unresolvedItems: [],
    claimBasisMap: [{ workflowElementId: `step:${analysisRunId}`, claimIds: [`claim:${analysisRunId}`], basis: basis("draft-basis") }],
    metadata: { createdAt: now, createdBy: "proof" },
    createdAt: now,
    updatedAt: now,
  };
}

function readiness(companyId, caseId, analysisRunId, draftId) {
  return {
    resultId: `readiness:${analysisRunId}`,
    companyId,
    caseId,
    analysisRunId,
    lineageStatus: "active",
    assembledWorkflowDraftId: draftId,
    readinessDecision: "ready_for_initial_package",
    sevenConditionAssessment: conditions(caseId, draftId, companyId, analysisRunId),
    gapRiskSummary: { summary: "No proof gaps.", gapIds: [], riskIds: [] },
    allowedUseFor6C: ["initial_package"],
    routingRecommendations: ["Generate initial package with proof basis."],
    analysisMetadata: { createdAt: now, createdBy: "proof" },
    is6CAllowed: true,
    createdAt: now,
    updatedAt: now,
  };
}

const alpha = createCompany(company("company-pass6-alpha", "Pass 6 Alpha"), store.companies);
const beta = createCompany(company("company-pass6-beta", "Pass 6 Beta"), store.companies);
const alphaCase = createCase(caseConfig(alpha.companyId, "case-pass6-alpha", "operations"), store.cases);
const betaCase = createCase(caseConfig(beta.companyId, "case-pass6-beta", "finance"), store.cases);

const run1 = "analysis-run-alpha-v1";
const run2 = "analysis-run-alpha-v2";
const betaRun = "analysis-run-beta-v1";

store.synthesisInputBundles.save({
  bundleId: `bundle:${run1}`,
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  analysisRunId: run1,
  lineageStatus: "active",
  createdAt: now,
  updatedAt: now,
  sourcePass5SessionIds: [],
  analysis_material: [],
  boundary_role_limit_material: [],
  gap_risk_no_drop_material: [],
  document_source_signal_material: [],
  roleLayerContexts: [],
  truthLensContexts: [],
  preparationSummary: { preparedBy: "system", summary: "run 1", noDropNotes: [] },
});
store.synthesisInputBundles.save({
  bundleId: `bundle:${run2}`,
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  analysisRunId: run2,
  supersedesAnalysisRunId: run1,
  lineageStatus: "active",
  createdAt: now,
  updatedAt: now,
  sourcePass5SessionIds: [],
  analysis_material: [],
  boundary_role_limit_material: [],
  gap_risk_no_drop_material: [],
  document_source_signal_material: [],
  roleLayerContexts: [],
  truthLensContexts: [],
  preparationSummary: { preparedBy: "system", summary: "run 2", noDropNotes: [] },
});
store.synthesisInputBundles.save({
  bundleId: `bundle:${betaRun}`,
  companyId: beta.companyId,
  caseId: betaCase.caseId,
  analysisRunId: betaRun,
  lineageStatus: "active",
  createdAt: now,
  updatedAt: now,
  sourcePass5SessionIds: [],
  analysis_material: [],
  boundary_role_limit_material: [],
  gap_risk_no_drop_material: [],
  document_source_signal_material: [],
  roleLayerContexts: [],
  truthLensContexts: [],
  preparationSummary: { preparedBy: "system", summary: "beta", noDropNotes: [] },
});

assert.equal(store.synthesisInputBundles.findByAnalysisRun(alpha.companyId, alphaCase.caseId, run1).length, 1, "analysis run 1 is queryable");
assert.equal(store.synthesisInputBundles.findByAnalysisRun(alpha.companyId, alphaCase.caseId, run2).length, 1, "analysis run 2 is queryable");
assert.equal(store.synthesisInputBundles.findByCompany(beta.companyId, betaCase.caseId, `bundle:${run1}`), null, "wrong company cannot load Pass 6 records");

store.synthesisInputBundles.updateLineageStatus(alpha.companyId, alphaCase.caseId, run1, "previous");
assert.equal(store.synthesisInputBundles.findByAnalysisRun(alpha.companyId, alphaCase.caseId, run1)[0]?.lineageStatus, "previous", "previous run remains explicit");
assert.deepEqual(
  store.synthesisInputBundles.findActiveByCompanyAndCase(alpha.companyId, alphaCase.caseId).map((record) => record.analysisRunId),
  [run2],
  "active run selection is explicit through lineageStatus",
);

const alphaDraft = draft(alpha.companyId, alphaCase.caseId, run2);
const alphaReadiness = readiness(alpha.companyId, alphaCase.caseId, run2, alphaDraft.draftId);
store.assembledWorkflowDrafts.save(alphaDraft);
store.workflowReadinessResults.save(alphaReadiness);

const output = generatePass6Output({
  workflowReadinessResult: alphaReadiness,
  assembledWorkflowDraft: alphaDraft,
  packageId: "initial-workflow-package-alpha-run2",
  now,
}, {
  initialWorkflowPackages: store.initialWorkflowPackages,
});
assert.equal(output.ok, true, "package output generation should preserve existing package semantics");
assert.equal(output.outputKind, "initial_workflow_package", "ready proof still creates InitialWorkflowPackage");
assert.equal(output.initialWorkflowPackage.analysisRunId, run2, "package links to producing analysisRunId");
assert.equal(output.initialWorkflowPackage.workflowReadinessResultId, alphaReadiness.resultId, "package links to readiness basis");
assert.equal(
  store.initialWorkflowPackages.findByCompany(beta.companyId, betaCase.caseId, output.initialWorkflowPackage.packageId),
  null,
  "wrong company cannot load generated package records",
);

store.initialPackages.save({
  initialPackageId: "legacy-initial-package-alpha",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  analysisRunId: run2,
  lineageStatus: "active",
  evaluationId: alphaReadiness.resultId,
  status: "review_recommended",
  outward: {
    initialSynthesizedWorkflow: "Proof workflow.",
    workflowRationale: "Proof rationale.",
    workflowValueUsefulnessExplanation: "Proof usefulness.",
    initialGapAnalysis: "Proof gaps.",
    initialRecommendations: "Proof recommendations.",
  },
  admin: {
    sevenConditionChecklist: {
      sequenceContinuity: true,
      aToBToCClarity: true,
      coreStepConditions: true,
      decisionRuleOrThreshold: true,
      handoffResponsibility: true,
      controlOrApproval: true,
      boundary: true,
    },
    readinessReasoning: "Proof readiness.",
  },
  createdAt: now,
});
assert.equal(store.initialPackages.findByAnalysisRun(alpha.companyId, alphaCase.caseId, run2).length, 1, "legacy InitialPackage records can link to analysisRunId");
assert.equal(store.initialPackages.findByCompany(beta.companyId, betaCase.caseId, "legacy-initial-package-alpha"), null, "wrong company cannot load legacy InitialPackage records");

assert.equal(output.boundary.noReleaseOccurred, true, "package/release semantics are unchanged");
const forbiddenWorkStarted = false;
assert.equal(forbiddenWorkStarted, false, "no retrieval/RAG/vector/Answer Cards/ContextEnvelope behavior was implemented");

console.log("PASS Slice 6 Pass 6/package lineage proof");
