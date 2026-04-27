import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createInMemoryStore,
  createSQLiteIntakeRepositories,
} from "../packages/persistence/dist/index.js";

const now = "2026-04-27T00:00:00.000Z";
const updatedAt = "2026-04-27T00:05:00.000Z";
const caseId = "case-pass6-block2-proof";

const reference = {
  referenceId: "ref-evidence-1",
  referenceType: "raw_evidence",
  sessionId: "session-1",
  evidenceItemId: "evidence-1",
  quote: "The coordinator checks the request before approval.",
};

const basis = {
  basisId: "basis-1",
  basisType: "pass5_output",
  summary: "Accepted Pass 5 extraction and handoff candidate basis.",
  references: [reference],
};

const metadata = {
  createdAt: now,
  createdBy: "pass6-block2-proof",
  notes: "Persistence fixture only.",
};

const material = {
  itemId: "material-1",
  itemType: "accepted_extraction",
  summary: "Coordinator checks the request.",
  basis,
  roleLayerContextIds: ["role-context-1"],
  truthLensContextIds: ["truth-context-1"],
};

const synthesisInputBundle = {
  bundleId: "bundle-1",
  caseId,
  createdAt: now,
  updatedAt,
  sourcePass5SessionIds: ["session-1"],
  analysis_material: [material],
  boundary_role_limit_material: [material],
  gap_risk_no_drop_material: [material],
  document_source_signal_material: [material],
  roleLayerContexts: [{ contextId: "role-context-1", participantRole: "Coordinator" }],
  truthLensContexts: [{ contextId: "truth-context-1", lensType: "execution_evidence" }],
  preparationSummary: {
    preparedBy: "system_with_admin_review",
    summary: "Accepted Pass 5 outputs prepared for synthesis.",
    acceptedPass5Only: true,
    doesNotRevalidatePass5: true,
    noDropNotes: ["Unmapped material retained."],
  },
};

const workflowUnit = {
  unitId: "unit-1",
  caseId,
  bundleId: "bundle-1",
  unitType: "action_step",
  unitText: "Coordinator checks the request.",
  roleLayerContextId: "role-context-1",
  basis,
  createdAt: now,
  updatedAt,
};

const workflowClaim = {
  claimId: "claim-1",
  caseId,
  bundleId: "bundle-1",
  primaryClaimType: "execution_claim",
  normalizedStatement: "Coordinator checks request before approval.",
  sourceParticipantIds: ["participant-1"],
  sourceSessionIds: ["session-1"],
  sourceLayerContextIds: ["role-context-1"],
  truthLensContextIds: ["truth-context-1"],
  unitIds: ["unit-1"],
  basis,
  confidence: "medium",
  materiality: "high",
  status: "proposed",
  createdAt: now,
  updatedAt,
};

const analysisMethodUsage = {
  methodUsageId: "method-usage-1",
  methodId: "method-bpmn-1",
  methodKey: "bpmn_process_structure",
  methodName: "BPMN / Process Structure Lens",
  methodType: "process_structure_lens",
  version: "v1",
  selectionReason: "Sequence and decision structure needed interpretation.",
  selectionSource: "system_selected",
  appliedToType: "claim",
  appliedToId: "claim-1",
  outputSummary: "The claim represents an action step before approval.",
  impact: {
    affectedIds: ["claim-1"],
    impactSummary: "Classified as process step.",
    changedRouting: false,
    changedReadiness: false,
  },
  suitabilityAssessment: {
    suitable: true,
    notes: "Appropriate for process structure classification.",
    limitations: ["Does not prove final workflow truth."],
  },
  createdAt: now,
  updatedAt,
};

const differenceInterpretation = {
  differenceId: "difference-1",
  caseId,
  involvedClaimIds: ["claim-1", "claim-2"],
  involvedLayers: ["operator", "supervisor"],
  involvedRoles: ["Coordinator", "Supervisor"],
  differenceType: "variant",
  materiality: "medium",
  recommendedRoute: "carry_as_variant",
  explanation: "Two roles describe different valid variants.",
  methodUsageIds: ["method-usage-1"],
  notPerformanceEvaluation: true,
  createdAt: now,
  updatedAt,
};

const workflowElement = {
  elementId: "step-1",
  label: "Check request",
  description: "Coordinator checks request completeness.",
  claimIds: ["claim-1"],
  basis,
};

const assembledWorkflowDraft = {
  draftId: "draft-1",
  caseId,
  basedOnBundleId: "bundle-1",
  workflowUnderstandingLevel: "reconstructable_workflow_with_gaps",
  steps: [workflowElement],
  sequence: [workflowElement],
  decisions: [],
  handoffs: [],
  controls: [],
  systemsTools: [],
  variants: [],
  warningsCaveats: ["Approval threshold is not fully clear."],
  unresolvedItems: ["approval-threshold"],
  claimBasisMap: [{ workflowElementId: "step-1", claimIds: ["claim-1"] }],
  metadata,
  createdAt: now,
  updatedAt,
};

const conditionItem = (status = "clear_enough") => ({
  status,
  rationale: "Condition assessed from stored contract basis.",
  basis,
  blocksInitialPackage: false,
});

const sevenConditionAssessment = {
  assessmentId: "assessment-1",
  caseId,
  assembledWorkflowDraftId: "draft-1",
  conditions: {
    core_sequence_continuity: conditionItem(),
    step_to_step_connection: conditionItem(),
    essential_step_requirements: conditionItem(),
    decision_rules_thresholds: conditionItem("warning"),
    handoffs_responsibility: conditionItem(),
    controls_approvals: conditionItem(),
    use_case_boundary: conditionItem(),
  },
  overallSummary: "Workflow is usable with warnings.",
};

const workflowReadinessResult = {
  resultId: "readiness-1",
  caseId,
  assembledWorkflowDraftId: "draft-1",
  readinessDecision: "ready_for_initial_package_with_warnings",
  sevenConditionAssessment,
  gapRiskSummary: {
    summary: "One threshold warning remains.",
    gapIds: ["gap-threshold"],
    riskIds: ["risk-warning-package"],
  },
  allowedUseFor6C: ["initial_package_with_warnings", "gap_closure_brief"],
  routingRecommendations: ["Proceed only with warning approval."],
  analysisMetadata: metadata,
  is6CAllowed: true,
  createdAt: now,
  updatedAt,
};

const clarificationNeed = {
  clarificationNeedId: "clarification-need-1",
  questionType: "open_question",
  questionText: "What threshold requires supervisor approval?",
  targetRole: "Supervisor",
  whyItMatters: "The package needs the approval rule caveat.",
  relatedWorkflowElementId: "step-1",
  relatedGapId: "gap-threshold",
  relatedSevenConditionKey: "decision_rules_thresholds",
  relatedClaimIds: ["claim-1"],
  relatedDifferenceIds: ["difference-1"],
  expectedAnswerType: "threshold_value",
  exampleAnswer: "Supervisor approval is required above 10,000 SAR.",
  blockingStatus: "non_blocking",
  basis,
  recommendedChannel: "manager_follow_up",
  priority: "medium",
  createdAt: now,
  updatedAt,
};

const inquiryPacket = {
  inquiryPacketId: "inquiry-1",
  caseId,
  targetRole: "Supervisor",
  clarificationNeeds: [clarificationNeed],
  packetStatus: "draft_not_sent",
  createdAt: now,
  updatedAt,
};

const prePackageGateResult = {
  gateResultId: "gate-1",
  caseId,
  workflowReadinessResultId: "readiness-1",
  gateDecision: "proceed_with_warnings_approved",
  clarificationNeeds: [clarificationNeed],
  inquiryPackets: [inquiryPacket],
  proceedWithWarningsApproval: {
    approvalStatus: "approved",
    approvedBy: "admin-1",
    approvedAt: now,
    approvalNote: "Proceed with explicit threshold caveat.",
    warningsAccepted: ["risk-warning-package"],
    reasonForProceeding: "Client needs an initial limited package.",
    limitationsToKeepVisible: ["Threshold remains a caveat."],
    followUpRecommendation: "Confirm threshold after package delivery.",
  },
  createdAt: now,
  updatedAt,
};

const externalInterfaceRecord = {
  interfaceId: "external-interface-1",
  caseId,
  relatedWorkflowDraftId: "draft-1",
  relatedReadinessResultId: "readiness-1",
  relatedGateResultId: "gate-1",
  interfaceType: "handoff_owner",
  externalDepartmentOrRole: "Finance",
  externalSystemOrQueue: "Shared queue",
  selectedDepartmentSide: "Operations selected use case",
  whereItOccursInWorkflow: "handoff:handoff-finance",
  whatIsTransferredOrRequired: "Approved request is handed off to Finance through a shared queue.",
  inputOutputCondition: "Finance receives the approved request after Operations validation.",
  knownOwnerOrReceivingSide: "Finance",
  basis,
  confirmationStatus: "unvalidated",
  materiality: "warning",
  affectsSevenCondition: ["handoffs_responsibility", "use_case_boundary"],
  recommendedAction: "proceed_with_warning",
  limitationsCaveats: [
    "Selected department remains primary.",
    "Finance internal workflow is not analyzed.",
  ],
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
  metadata,
  createdAt: now,
  updatedAt,
};

const packageSection = {
  sectionId: "section-1",
  title: "Current Workflow",
  contentSummary: "Coordinator checks the request before approval.",
  basisClaimIds: ["claim-1"],
};

const initialWorkflowPackage = {
  packageId: "initial-package-1",
  caseId,
  workflowReadinessResultId: "readiness-1",
  packageStatus: "initial_package_ready_with_warnings",
  clientFacingSections: [packageSection],
  adminInternalAppendix: "Threshold caveat retained for admin review.",
  warningsCaveats: ["Approval threshold warning."],
  interfacesDependencies: ["Supervisor approval dependency."],
  documentReferenceImplications: ["SOP draft may need threshold field."],
  metadata,
  createdAt: now,
  updatedAt,
};

const workflowGapClosureBrief = {
  briefId: "gap-brief-1",
  caseId,
  packageBlockedReason: "Decision threshold unknown.",
  currentlyVisibleWorkflow: "Request check step is visible; approval threshold is missing.",
  brokenUnknownConditions: ["decision_rules_thresholds"],
  gapsToClose: ["Confirm approval threshold."],
  recommendedClarificationRoute: "Ask supervisor for threshold.",
  nextStepToReachPackageReadiness: "Resolve threshold question or approve warning route.",
  createdAt: now,
  updatedAt,
};

const draftOperationalDocument = {
  draftId: "draft-document-1",
  caseId,
  documentDraftType: "sop_draft",
  draftStatus: "draft_only_not_approved",
  evidenceMaturitySummary: "Evidence is mature enough for a draft with warnings.",
  sections: [packageSection],
  limitations: ["Draft only. Not approved or released."],
  metadata,
  createdAt: now,
  updatedAt,
};

const workflowGraphRecord = {
  visualRecordId: "visual-1",
  caseId,
  assembledWorkflowDraftId: "draft-1",
  workflowGraphJson: {
    nodes: [
      { id: "start-1", type: "start", status: "confirmed", label: "Start" },
      { id: "step-1", type: "step", status: "warning", label: "Check request" },
    ],
    edges: [
      { id: "edge-1", source: "start-1", target: "step-1", type: "sequence", status: "confirmed" },
    ],
  },
  workflowMermaid: "flowchart LR\n  start-1 --> step-1",
  workflowReactFlowModel: { nodes: [], edges: [] },
  visualValidationErrors: [],
  createdAt: now,
  updatedAt,
};

const contextRef = { referenceId: "bundle-1", referenceType: "synthesis_input_bundle" };

const pass6CopilotContextBundle = {
  contextBundleId: "copilot-context-1",
  caseId,
  bundleRefs: [contextRef],
  claimRefs: [{ referenceId: "claim-1", referenceType: "workflow_claim" }],
  methodUsageRefs: [{ referenceId: "method-usage-1", referenceType: "analysis_method_usage" }],
  workflowDraftRefs: [{ referenceId: "draft-1", referenceType: "assembled_workflow_draft" }],
  readinessResultRefs: [{ referenceId: "readiness-1", referenceType: "workflow_readiness_result" }],
  gateResultRefs: [{ referenceId: "gate-1", referenceType: "pre_package_gate_result" }],
  packageOrBriefRefs: [{ referenceId: "initial-package-1", referenceType: "initial_workflow_package" }],
  visualRecordRefs: [{ referenceId: "visual-1", referenceType: "workflow_graph_record" }],
  activeConfigPolicyRefs: [{ referenceId: "policy-1", referenceType: "pass6_policy" }],
  relevantAdminActionRefs: [{ referenceId: "admin-action-1", referenceType: "admin_action" }],
  readOnly: true,
  createdAt: now,
  updatedAt,
};

const pass7ReviewCandidate = {
  candidateId: "pass7-candidate-1",
  caseId,
  sourcePass6ResultId: "readiness-1",
  issueType: "gap_blocks_package",
  reason: "Approval threshold needs review if package warning is rejected.",
  linkedReferences: [
    { referenceId: "claim-1", referenceType: "workflow_claim" },
    { referenceId: "gap-threshold", referenceType: "gap" },
  ],
  recommendedReviewRoute: "Create Pass 7 review only if admin rejects warning path.",
  status: "candidate_open",
  createdAt: now,
  updatedAt,
};

const records = [
  ["synthesisInputBundles", "bundle-1", synthesisInputBundle],
  ["workflowUnits", "unit-1", workflowUnit],
  ["workflowClaims", "claim-1", workflowClaim],
  ["analysisMethodUsages", "method-usage-1", analysisMethodUsage],
  ["differenceInterpretations", "difference-1", differenceInterpretation],
  ["assembledWorkflowDrafts", "draft-1", assembledWorkflowDraft],
  ["workflowReadinessResults", "readiness-1", workflowReadinessResult],
  ["prePackageGateResults", "gate-1", prePackageGateResult],
  ["clarificationNeeds", "clarification-need-1", clarificationNeed],
  ["inquiryPackets", "inquiry-1", inquiryPacket],
  ["externalInterfaceRecords", "external-interface-1", externalInterfaceRecord],
  ["initialWorkflowPackages", "initial-package-1", initialWorkflowPackage],
  ["workflowGapClosureBriefs", "gap-brief-1", workflowGapClosureBrief],
  ["draftOperationalDocuments", "draft-document-1", draftOperationalDocument],
  ["workflowGraphRecords", "visual-1", workflowGraphRecord],
  ["pass6CopilotContextBundles", "copilot-context-1", pass6CopilotContextBundle],
  ["pass7ReviewCandidates", "pass7-candidate-1", pass7ReviewCandidate],
];

function exerciseRepositories(store, label) {
  for (const [repositoryName, id, record] of records) {
    const repository = store[repositoryName];
    assert.equal(typeof repository.save, "function", `${label}.${repositoryName}.save exists`);
    repository.save(record);
    assert.deepEqual(repository.findById(id), record, `${label}.${repositoryName} findById round-trip`);
    assert.ok(repository.findAll().length >= 1, `${label}.${repositoryName} findAll returns records`);
  }

  assert.equal(store.workflowClaims.findByCaseId(caseId).length, 1, `${label}.workflowClaims findByCaseId`);
  assert.equal(store.workflowReadinessResults.findByCaseId(caseId).length, 1, `${label}.workflowReadinessResults findByCaseId`);
  assert.equal(store.externalInterfaceRecords.findByCaseId(caseId).length, 1, `${label}.externalInterfaceRecords findByCaseId`);
  assert.equal(store.initialWorkflowPackages.findByCaseId(caseId).length, 1, `${label}.initialWorkflowPackages findByCaseId`);
  assert.equal(store.analysisMethodUsages.findByCaseId(caseId).length, 0, `${label}.analysisMethodUsages has no case index in contract`);

  const updated = store.workflowClaims.update("claim-1", {
    status: "accepted_for_assembly",
    updatedAt: "2026-04-27T00:10:00.000Z",
  });
  assert.equal(updated.status, "accepted_for_assembly", `${label}.workflowClaims update stores supplied fields`);

  const storedDraft = store.assembledWorkflowDrafts.findById("draft-1");
  storedDraft.steps[0].label = "mutated outside repository";
  assert.equal(
    store.assembledWorkflowDrafts.findById("draft-1").steps[0].label,
    "Check request",
    `${label}.assembledWorkflowDrafts returns defensive copies`,
  );

  assert.equal(
    store.workflowReadinessResults.findById("readiness-1").sevenConditionAssessment.conditions.decision_rules_thresholds.status,
    "warning",
    `${label}.workflowReadinessResults preserves nested seven-condition map`,
  );
}

const memoryStore = createInMemoryStore();
exerciseRepositories(memoryStore, "memory");

memoryStore.workflowReadinessResults.save(workflowReadinessResult);
assert.equal(
  memoryStore.initialWorkflowPackages.findAll().length,
  1,
  "saving readiness results does not derive additional packages",
);
assert.equal(
  memoryStore.pass7ReviewCandidates.findAll().length,
  1,
  "persistence stores Pass 7 candidates only when explicitly saved",
);

const sqlitePath = join(tmpdir(), `workflow-pass6-block2-${process.pid}-${Date.now()}.sqlite`);
if (existsSync(sqlitePath)) unlinkSync(sqlitePath);
const sqliteStore = createSQLiteIntakeRepositories(sqlitePath);
exerciseRepositories(sqliteStore, "sqlite");

const restartedSqliteStore = createSQLiteIntakeRepositories(sqlitePath);
assert.deepEqual(
  restartedSqliteStore.workflowClaims.findById("claim-1"),
  sqliteStore.workflowClaims.findById("claim-1"),
  "SQLite restart preserves workflow claim",
);
assert.equal(
  restartedSqliteStore.workflowGraphRecords.findById("visual-1").workflowGraphJson.nodes[1].status,
  "warning",
  "SQLite restart preserves nested visual graph record",
);

const changedFiles = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const allowedPrefixes = [
  "packages/persistence/",
  "packages/contracts/",
  "packages/synthesis-evaluation/",
  "packages/prompts/",
  "packages/integrations/",
  "apps/admin-web/",
  "scripts/prove-pass6-block1-contracts.mjs",
  "scripts/prove-pass6-block2-persistence.mjs",
  "scripts/prove-pass6-block3-configuration.mjs",
  "scripts/prove-pass6-block4-prompt-workspace.mjs",
  "scripts/prove-pass6-block5-prompt-test-harness.mjs",
  "scripts/prove-pass6-block6-synthesis-input-bundle.mjs",
  "scripts/prove-pass6-block7-bundle-review-surface.mjs",
  "scripts/prove-pass6-block8-method-registry.mjs",
  "scripts/prove-pass6-block9-claim-pipeline.mjs",
  "scripts/prove-pass6-block10-difference-interpretation.mjs",
  "scripts/prove-pass6-block11-workflow-assembly.mjs",
  "scripts/prove-pass6-block12-readiness-result.mjs",
  "scripts/prove-pass6-block13-analysis-report.mjs",
  "scripts/prove-pass6-block14-pre6c-gate.mjs",
  "scripts/prove-pass6-block15-external-interfaces.mjs",
  "handoff/",
];
for (const file of changedFiles) {
  assert.ok(
    allowedPrefixes.some((prefix) => file.startsWith(prefix)),
    `Pass 6 Block 2 proof found out-of-scope change: ${file}`,
  );
}

console.log("Pass 6 Block 2 persistence proof passed.");
