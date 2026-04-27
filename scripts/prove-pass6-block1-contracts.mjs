import assert from "node:assert/strict";
import { execSync } from "node:child_process";

import {
  validateAnalysisMethodUsage,
  validateAssembledWorkflowDraft,
  validateClarificationNeed,
  validateDifferenceInterpretation,
  validateDraftOperationalDocument,
  validateInitialWorkflowPackage,
  validateInquiryPacket,
  validatePass6CopilotContextBundle,
  validatePass7ReviewCandidate,
  validatePrePackageGateResult,
  validateSevenConditionAssessment,
  validateSynthesisInputBundle,
  validateWorkflowClaim,
  validateWorkflowGapClosureBrief,
  validateWorkflowGraphRecord,
  validateWorkflowReadinessResult,
  validateWorkflowUnit,
} from "../packages/contracts/dist/index.js";

const now = "2026-04-26T00:00:00.000Z";

function assertValid(name, validator, value) {
  const result = validator(value);
  assert.equal(result.ok, true, `${name} should validate: ${JSON.stringify(result.errors ?? [])}`);
}

function assertInvalid(name, validator, value) {
  const result = validator(value);
  assert.equal(result.ok, false, `${name} should reject invalid input`);
}

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

const material = {
  itemId: "material-1",
  itemType: "accepted_extraction",
  summary: "Coordinator checks the request.",
  basis,
  roleLayerContextIds: ["role-context-1"],
  truthLensContextIds: ["truth-context-1"],
};

const metadata = {
  createdAt: now,
  createdBy: "pass6-block1-proof",
  notes: "Contract fixture only.",
};

const synthesisInputBundle = {
  bundleId: "bundle-1",
  caseId: "case-1",
  createdAt: now,
  sourcePass5SessionIds: ["session-1"],
  analysis_material: [material],
  boundary_role_limit_material: [material],
  gap_risk_no_drop_material: [material],
  document_source_signal_material: [material],
  roleLayerContexts: [
    {
      contextId: "role-context-1",
      participantRole: "Coordinator",
      department: "Operations",
      layer: "operator",
      authorityScope: "describes own work only",
    },
  ],
  truthLensContexts: [
    {
      contextId: "truth-context-1",
      lensType: "execution_evidence",
      summary: "First-person participant statement.",
      limitations: ["Not final workflow truth."],
    },
  ],
  preparationSummary: {
    preparedBy: "system_with_admin_review",
    summary: "Accepted Pass 5 outputs prepared for synthesis.",
    acceptedPass5Only: true,
    doesNotRevalidatePass5: true,
    noDropNotes: ["Unmapped and boundary material retained."],
  },
};

const workflowUnit = {
  unitId: "unit-1",
  caseId: "case-1",
  bundleId: "bundle-1",
  unitType: "action_step",
  unitText: "Coordinator checks the request.",
  roleLayerContextId: "role-context-1",
  basis,
};

const workflowClaim = {
  claimId: "claim-1",
  caseId: "case-1",
  bundleId: "bundle-1",
  primaryClaimType: "execution_claim",
  secondaryClaimTypes: ["ownership_claim"],
  claimText: "The coordinator checks the request.",
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
};

const differenceInterpretation = {
  differenceId: "difference-1",
  caseId: "case-1",
  involvedClaimIds: ["claim-1", "claim-2"],
  involvedLayers: ["operator", "supervisor"],
  involvedRoles: ["Coordinator", "Supervisor"],
  differenceType: "variant",
  materiality: "medium",
  recommendedRoute: "carry_as_variant",
  explanation: "Two roles describe different valid variants.",
  methodUsageIds: ["method-usage-1"],
  notPerformanceEvaluation: true,
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
  caseId: "case-1",
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
};

const conditionKeys = [
  "core_sequence_continuity",
  "step_to_step_connection",
  "essential_step_requirements",
  "decision_rules_thresholds",
  "handoffs_responsibility",
  "controls_approvals",
  "use_case_boundary",
];

const sevenConditionAssessment = {
  assessmentId: "assessment-1",
  caseId: "case-1",
  assembledWorkflowDraftId: "draft-1",
  conditions: Object.fromEntries(conditionKeys.map((conditionKey) => [conditionKey, {
    status: conditionKey === "decision_rules_thresholds" ? "warning" : "clear_enough",
    rationale: `${conditionKey} assessed for package readiness.`,
    basis,
    blocksInitialPackage: false,
  }])),
  overallSummary: "Workflow is usable with warnings.",
};

const workflowReadinessResult = {
  resultId: "readiness-1",
  caseId: "case-1",
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
};

const clarificationNeed = {
  clarificationNeedId: "clarification-need-1",
  questionText: "What threshold requires supervisor approval?",
  targetRole: "Supervisor",
  whyItMatters: "The package needs the approval rule caveat.",
  relatedWorkflowElementId: "step-1",
  relatedGapId: "gap-threshold",
  relatedSevenConditionKey: "decision_rules_thresholds",
  expectedAnswerType: "threshold_value",
  exampleAnswer: "Supervisor approval is required above 10,000 SAR.",
  blockingStatus: "non_blocking",
  basis,
  recommendedChannel: "manager_follow_up",
  priority: "medium",
};

const inquiryPacket = {
  inquiryPacketId: "inquiry-1",
  caseId: "case-1",
  targetRole: "Supervisor",
  clarificationNeeds: [clarificationNeed],
  packetStatus: "draft_not_sent",
  createdAt: now,
};

const prePackageGateResult = {
  gateResultId: "gate-1",
  caseId: "case-1",
  workflowReadinessResultId: "readiness-1",
  gateDecision: "proceed_with_warnings_approved",
  clarificationNeeds: [clarificationNeed],
  inquiryPackets: [inquiryPacket],
  proceedWithWarningsApproval: {
    approvedBy: "admin-1",
    approvedAt: now,
    approvalNote: "Proceed with explicit threshold caveat.",
  },
};

const packageSection = {
  sectionId: "section-1",
  title: "Current Workflow",
  contentSummary: "Coordinator checks the request before approval.",
  basisClaimIds: ["claim-1"],
};

const initialWorkflowPackage = {
  packageId: "initial-package-1",
  caseId: "case-1",
  workflowReadinessResultId: "readiness-1",
  packageStatus: "initial_package_ready_with_warnings",
  clientFacingSections: [packageSection],
  adminInternalAppendix: "Threshold caveat retained for admin review.",
  warningsCaveats: ["Approval threshold warning."],
  interfacesDependencies: ["Supervisor approval dependency."],
  documentReferenceImplications: ["SOP draft may need threshold field."],
  metadata,
};

const workflowGapClosureBrief = {
  briefId: "gap-brief-1",
  caseId: "case-1",
  packageBlockedReason: "Decision threshold unknown.",
  currentlyVisibleWorkflow: "Request check step is visible; approval threshold is missing.",
  brokenUnknownConditions: ["decision_rules_thresholds"],
  gapsToClose: ["Confirm approval threshold."],
  recommendedClarificationRoute: "Ask supervisor for threshold.",
  nextStepToReachPackageReadiness: "Resolve threshold question or approve warning route.",
};

const draftOperationalDocument = {
  draftId: "draft-document-1",
  caseId: "case-1",
  documentDraftType: "sop_draft",
  draftStatus: "draft_only_not_approved",
  evidenceMaturitySummary: "Evidence is mature enough for a draft with warnings.",
  sections: [packageSection],
  limitations: ["Draft only. Not approved or released."],
  metadata,
};

const workflowGraphRecord = {
  visualRecordId: "visual-1",
  caseId: "case-1",
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
  workflowReactFlowModel: {
    nodes: [],
    edges: [],
  },
  visualValidationErrors: [],
};

const contextRef = {
  referenceId: "bundle-1",
  referenceType: "synthesis_input_bundle",
  label: "Synthesis input bundle",
};

const pass6CopilotContextBundle = {
  contextBundleId: "copilot-context-1",
  caseId: "case-1",
  bundleRefs: [contextRef],
  claimRefs: [{ ...contextRef, referenceId: "claim-1", referenceType: "workflow_claim" }],
  methodUsageRefs: [{ ...contextRef, referenceId: "method-usage-1", referenceType: "analysis_method_usage" }],
  workflowDraftRefs: [{ ...contextRef, referenceId: "draft-1", referenceType: "assembled_workflow_draft" }],
  readinessResultRefs: [{ ...contextRef, referenceId: "readiness-1", referenceType: "workflow_readiness_result" }],
  gateResultRefs: [{ ...contextRef, referenceId: "gate-1", referenceType: "pre_package_gate_result" }],
  packageOrBriefRefs: [{ ...contextRef, referenceId: "initial-package-1", referenceType: "initial_workflow_package" }],
  visualRecordRefs: [{ ...contextRef, referenceId: "visual-1", referenceType: "workflow_graph_record" }],
  activeConfigPolicyRefs: [{ ...contextRef, referenceId: "policy-1", referenceType: "pass6_policy" }],
  relevantAdminActionRefs: [{ ...contextRef, referenceId: "admin-action-1", referenceType: "admin_action" }],
  readOnly: true,
};

const pass7ReviewCandidate = {
  candidateId: "pass7-candidate-1",
  caseId: "case-1",
  sourcePass6ResultId: "readiness-1",
  issueType: "gap_blocks_package",
  reason: "Approval threshold needs review if package warning is rejected.",
  linkedReferences: [
    { referenceId: "claim-1", referenceType: "workflow_claim" },
    { referenceId: "gap-threshold", referenceType: "gap" },
  ],
  recommendedReviewRoute: "Create Pass 7 review only if admin rejects warning path.",
  status: "candidate_open",
};

const validFixtures = [
  ["SynthesisInputBundle", validateSynthesisInputBundle, synthesisInputBundle],
  ["WorkflowUnit", validateWorkflowUnit, workflowUnit],
  ["WorkflowClaim", validateWorkflowClaim, workflowClaim],
  ["AnalysisMethodUsage", validateAnalysisMethodUsage, analysisMethodUsage],
  ["DifferenceInterpretation", validateDifferenceInterpretation, differenceInterpretation],
  ["AssembledWorkflowDraft", validateAssembledWorkflowDraft, assembledWorkflowDraft],
  ["SevenConditionAssessment", validateSevenConditionAssessment, sevenConditionAssessment],
  ["WorkflowReadinessResult", validateWorkflowReadinessResult, workflowReadinessResult],
  ["ClarificationNeed", validateClarificationNeed, clarificationNeed],
  ["InquiryPacket", validateInquiryPacket, inquiryPacket],
  ["PrePackageGateResult", validatePrePackageGateResult, prePackageGateResult],
  ["InitialWorkflowPackage", validateInitialWorkflowPackage, initialWorkflowPackage],
  ["WorkflowGapClosureBrief", validateWorkflowGapClosureBrief, workflowGapClosureBrief],
  ["DraftOperationalDocument", validateDraftOperationalDocument, draftOperationalDocument],
  ["WorkflowGraphRecord", validateWorkflowGraphRecord, workflowGraphRecord],
  ["Pass6CopilotContextBundle", validatePass6CopilotContextBundle, pass6CopilotContextBundle],
  ["Pass7ReviewCandidate", validatePass7ReviewCandidate, pass7ReviewCandidate],
];

for (const [name, validator, fixture] of validFixtures) {
  assert.equal(typeof validator, "function", `${name} validator must be exported`);
  assertValid(name, validator, fixture);
}

assertInvalid("SynthesisInputBundle missing required conceptual folder", validateSynthesisInputBundle, {
  ...synthesisInputBundle,
  analysis_material: undefined,
});

assertInvalid("WorkflowReadinessResult invalid readiness decision", validateWorkflowReadinessResult, {
  ...workflowReadinessResult,
  readinessDecision: "ready_for_final_package",
});

const missingConditionAssessment = structuredClone(sevenConditionAssessment);
delete missingConditionAssessment.conditions.use_case_boundary;
assertInvalid("SevenConditionAssessment missing required condition key", validateSevenConditionAssessment, missingConditionAssessment);

const extraConditionAssessment = structuredClone(sevenConditionAssessment);
extraConditionAssessment.conditions.employee_performance = {
  status: "warning",
  rationale: "This condition key is outside the Pass 6 readiness contract.",
  basis,
  blocksInitialPackage: false,
};
assertInvalid("SevenConditionAssessment unknown condition key", validateSevenConditionAssessment, extraConditionAssessment);

const invalidStatusAssessment = structuredClone(sevenConditionAssessment);
invalidStatusAssessment.conditions.core_sequence_continuity.status = "blocked";
assertInvalid("SevenConditionAssessment invalid condition status", validateSevenConditionAssessment, invalidStatusAssessment);

assertInvalid("WorkflowGraphRecord invalid visual-core node enum", validateWorkflowGraphRecord, {
  ...workflowGraphRecord,
  workflowGraphJson: {
    ...workflowGraphRecord.workflowGraphJson,
    nodes: [{ id: "bad-node", type: "task", status: "confirmed", label: "Bad node" }],
  },
});

assertInvalid("Pass7ReviewCandidate missing identity", validatePass7ReviewCandidate, {
  ...pass7ReviewCandidate,
  candidateId: undefined,
});

const changedFiles = execSync("git diff --name-only HEAD", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
const allowedPrefixes = [
  "packages/contracts/",
  "packages/persistence/",
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
  "handoff/",
];
for (const file of changedFiles) {
  assert.ok(
    allowedPrefixes.some((prefix) => file.startsWith(prefix)),
    `Pass 6 Block 1 proof found non-contract behavior change: ${file}`,
  );
}

console.log("Pass 6 Block 1 contract proof passed.");
