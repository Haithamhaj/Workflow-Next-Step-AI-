import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  defaultPass6PromptSpec,
  promotePass6PromptDraft,
  runPass6Copilot,
} from "../packages/prompts/dist/index.js";

const now = "2026-04-28T02:00:00.000Z";
const caseId = "case-pass6-block18-proof";
const bundleId = "bundle-pass6-block18-proof";
const draftId = "draft-pass6-block18-proof";
const readinessResultId = "readiness-pass6-block18-proof";

function basis(id, basisType = "method_output") {
  return {
    basisId: `basis-${id}`,
    basisType,
    summary: `basis for ${id}`,
    references: [{ referenceId: `ref-${id}`, referenceType: basisType, evidenceItemId: `evidence-${id}` }],
  };
}

function material(itemId, itemType, summary, basisType = "pass5_output") {
  return {
    itemId,
    itemType,
    summary,
    basis: basis(itemId, basisType),
    roleLayerContextIds: ["role-frontline"],
    truthLensContextIds: basisType === "source_document" ? ["truth-document"] : ["truth-execution"],
  };
}

function element(id, label, description) {
  return { elementId: id, label, description, claimIds: [`claim-${id}`], basis: basis(id) };
}

function condition(status, rationale, blocksInitialPackage = false) {
  return { status, rationale, basis: basis(rationale.replace(/\W+/g, "-")), blocksInitialPackage };
}

const store = createInMemoryStore();

const promptSpec = defaultPass6PromptSpec("pass6_analysis_copilot", {
  promptSpecId: "pass6-analysis-copilot-proof-draft",
  status: "draft",
  now,
});
store.pass6PromptSpecs.save(promptSpec);
const promoted = promotePass6PromptDraft(promptSpec.promptSpecId, store.pass6PromptSpecs);
assert.equal(promoted.ok, true);

store.synthesisInputBundles.save({
  bundleId,
  caseId,
  createdAt: now,
  sourcePass5SessionIds: ["session-frontline", "session-supervisor"],
  analysis_material: [material("analysis-step", "extracted_step", "Frontline receives and validates the request.")],
  boundary_role_limit_material: [material("boundary-upstream", "upstream_boundary", "Finance downstream work is outside selected scope.")],
  gap_risk_no_drop_material: [material("gap-disputed", "evidence_dispute", "Manager threshold is disputed and review-needed.")],
  document_source_signal_material: [material("doc-sop", "source_document_signal", "SOP implies a different approval threshold.", "source_document")],
  roleLayerContexts: [{
    contextId: "role-frontline",
    participantId: "participant-1",
    sessionId: "session-frontline",
    participantRole: "Coordinator",
    department: "Operations",
    groupingLayerCategory: "frontline",
    inUseCaseScope: true,
  }],
  truthLensContexts: [
    { contextId: "truth-execution", lensType: "execution_evidence", summary: "Participant execution evidence." },
    { contextId: "truth-document", lensType: "document_signal_evidence", summary: "Document/source signal only.", limitations: ["Not operational truth by default."] },
  ],
  preparationSummary: {
    preparedBy: "system",
    summary: "Prepared accepted Pass 5 outputs only.",
    acceptedPass5Only: true,
    doesNotRevalidatePass5: true,
    noDropNotes: ["Disputed threshold preserved as gap/risk material."],
  },
});

store.workflowUnits.save({
  unitId: "unit-step-receive",
  caseId,
  bundleId,
  unitType: "action_step",
  unitText: "Receive request.",
  roleLayerContextId: "role-frontline",
  basis: basis("unit-step-receive"),
});
store.workflowClaims.save({
  claimId: "claim-step-receive",
  caseId,
  bundleId,
  sourceUnitIds: ["unit-step-receive"],
  primaryClaimType: "execution_claim",
  normalizedStatement: "Coordinator receives the request.",
  roleLayerContextIds: ["role-frontline"],
  truthLensContextIds: ["truth-execution"],
  basis: basis("claim-step-receive"),
  confidence: "high",
  materiality: "high",
  status: "accepted_for_assembly",
});
store.workflowClaims.save({
  claimId: "claim-doc-threshold",
  caseId,
  bundleId,
  sourceUnitIds: ["unit-doc-threshold"],
  primaryClaimType: "decision_rule_claim",
  normalizedStatement: "Document says approval starts at a lower threshold.",
  roleLayerContextIds: [],
  truthLensContextIds: ["truth-document"],
  basis: basis("claim-doc-threshold", "source_document"),
  confidence: "medium",
  materiality: "medium",
  status: "warning",
});
store.analysisMethodUsages.save({
  methodUsageId: "method-usage-doc-mismatch",
  methodId: "method-espoused",
  methodKey: "espoused_theory_vs_theory_in_use",
  methodName: "Espoused Theory vs Theory-in-Use Lens",
  methodType: "practice_reality_lens",
  version: "v1",
  selectionReason: "Document/source signal conflicts with participant reality.",
  selectionSource: "system_selected",
  methodRole: "primary",
  appliedToType: "difference",
  appliedToId: "difference-doc-mismatch",
  outputSummary: "Document/source signal remains a mismatch warning.",
  impact: { affectedIds: ["difference-doc-mismatch"], impactSummary: "Adds caveat only.", changedRouting: false, changedReadiness: false },
  suitabilityAssessment: { suitable: true, notes: "Appropriate for document-vs-practice mismatch." },
});
store.differenceInterpretations.save({
  differenceId: "difference-doc-mismatch",
  caseId,
  involvedClaimIds: ["claim-step-receive", "claim-doc-threshold"],
  involvedLayers: ["frontline", "document"],
  involvedRoles: ["Coordinator", "SOP"],
  differenceType: "normative_reality_mismatch",
  materiality: "medium",
  recommendedRoute: "warning",
  explanation: "Document signal does not override participant execution evidence.",
  methodUsageIds: ["method-usage-doc-mismatch"],
  notPerformanceEvaluation: true,
});

const workflowDraft = {
  draftId,
  caseId,
  basedOnBundleId: bundleId,
  workflowUnderstandingLevel: "package_ready_workflow",
  steps: [element("step-receive", "Receive request", "Coordinator receives the request.")],
  sequence: [element("seq-main", "Receive then validate", "Receive request before validation.")],
  decisions: [element("decision-threshold", "Approval threshold", "Threshold remains a warning.")],
  handoffs: [element("handoff-finance", "Finance handoff", "Finance receives approved requests.")],
  controls: [element("control-manager", "Manager approval", "Manager approval controls high-value requests.")],
  systemsTools: [element("system-queue", "Shared queue", "Operations and Finance share a queue.")],
  variants: [element("variant-urgent", "Urgent variant", "Urgent requests follow a warning-visible variant.")],
  warningsCaveats: ["Document threshold remains warning-only."],
  unresolvedItems: ["Finance downstream process unvalidated."],
  claimBasisMap: [{
    workflowElementId: "step-receive",
    claimIds: ["claim-step-receive"],
    sourceUnitIds: ["unit-step-receive"],
    methodUsageIds: ["method-usage-doc-mismatch"],
    differenceIds: ["difference-doc-mismatch"],
    confidence: "high",
    materiality: "high",
  }],
  metadata: { createdAt: now, createdBy: "proof" },
  createdAt: now,
  updatedAt: now,
};
store.assembledWorkflowDrafts.save(workflowDraft);
store.workflowReadinessResults.save({
  resultId: readinessResultId,
  caseId,
  assembledWorkflowDraftId: draftId,
  readinessDecision: "ready_for_initial_package_with_warnings",
  sevenConditionAssessment: {
    assessmentId: "assessment-pass6-block18-proof",
    caseId,
    assembledWorkflowDraftId: draftId,
    conditions: {
      core_sequence_continuity: condition("clear_enough", "Core sequence is clear."),
      step_to_step_connection: condition("clear_enough", "Step connection is clear."),
      essential_step_requirements: condition("clear_enough", "Essential requirements are clear."),
      decision_rules_thresholds: condition("warning", "Threshold mismatch remains warning-visible."),
      handoffs_responsibility: condition("warning", "External handoff is visible but downstream work is unvalidated."),
      controls_approvals: condition("clear_enough", "Manager approval is visible."),
      use_case_boundary: condition("clear_enough", "Selected Operations scope is clear."),
    },
    overallSummary: "Ready with warnings.",
  },
  gapRiskSummary: { summary: "No blocker remains; warning caveats stay visible.", gapIds: ["gap-disputed"], riskIds: ["risk-external"] },
  allowedUseFor6C: ["initial_package_with_warnings"],
  routingRecommendations: ["proceed_to_6c_with_warnings"],
  analysisMetadata: { createdAt: now, createdBy: "proof" },
  is6CAllowed: true,
  createdAt: now,
  updatedAt: now,
});
store.prePackageGateResults.save({
  gateResultId: "gate-pass6-block18-proof",
  caseId,
  workflowReadinessResultId: readinessResultId,
  gateDecision: "no_gate_block_package_allowed",
  clarificationNeeds: [{
    clarificationNeedId: "need-external-finance",
    questionType: "formal_email_inquiry",
    questionText: "Can Finance confirm what they receive from Operations?",
    targetRole: "External or cross-functional process owner",
    whyItMatters: "External handoff remains warning-visible.",
    relatedWorkflowElementId: "handoff-finance",
    relatedGapId: "gap-external-finance",
    relatedSevenConditionKey: "handoffs_responsibility",
    expectedAnswerType: "other",
    exampleAnswer: "Finance receives approved requests in the shared queue.",
    blockingStatus: "non_blocking",
    basis: basis("need-external-finance"),
    recommendedChannel: "external_interface_review",
    priority: "medium",
  }],
  inquiryPackets: [],
  createdAt: now,
  updatedAt: now,
});
store.externalInterfaceRecords.save({
  interfaceId: "interface-finance",
  caseId,
  relatedWorkflowDraftId: draftId,
  relatedReadinessResultId: readinessResultId,
  interfaceType: "handoff_owner",
  externalDepartmentOrRole: "Finance",
  externalSystemOrQueue: "Shared queue",
  selectedDepartmentSide: "Operations",
  whereItOccursInWorkflow: "handoff-finance",
  whatIsTransferredOrRequired: "Approved request moves to Finance queue.",
  basis: basis("interface-finance"),
  confirmationStatus: "unvalidated",
  materiality: "warning",
  affectsSevenCondition: ["handoffs_responsibility"],
  recommendedAction: "proceed_with_warning",
  limitationsCaveats: ["Finance internal process is not analyzed."],
  packageVisualConsumption: { includeInPackageInterfaceNotes: true, includeInVisualGraph: true, visualNodeStatus: "external_unvalidated" },
  scopeBoundary: { selectedScopeRemainsPrimary: true, externalWorkflowNotAnalyzed: true, scopeExpansionImplemented: false },
  metadata: { createdAt: now, createdBy: "proof" },
  createdAt: now,
  updatedAt: now,
});
store.initialWorkflowPackages.save({
  packageId: "initial-package-pass6-block18-proof",
  caseId,
  workflowReadinessResultId: readinessResultId,
  packageStatus: "initial_package_ready_with_warnings",
  clientFacingSections: [{ sectionId: "summary", title: "Initial Workflow Summary", contentSummary: "Receive, validate, approve, and hand off request.", basisClaimIds: ["claim-step-receive"] }],
  adminInternalAppendix: "Admin/internal traceability summary.",
  warningsCaveats: ["Document threshold warning remains visible."],
  interfacesDependencies: ["Finance handoff remains an external interface."],
  documentReferenceImplications: ["Participant reality suggests a mismatch with the documented process."],
  metadata: { createdAt: now, createdBy: "proof" },
  createdAt: now,
  updatedAt: now,
});
store.workflowGraphRecords.save({
  visualRecordId: "visual-pass6-block18-proof",
  caseId,
  assembledWorkflowDraftId: draftId,
  workflowGraphJson: {
    graphId: "graph-pass6-block18-proof",
    title: "Operations request workflow",
    graphType: "workflow",
    nodes: [{ id: "step-receive", label: "Receive request", nodeType: "step", status: "confirmed" }],
    edges: [],
    warnings: ["Document threshold warning remains visible."],
    unresolvedItems: ["Finance downstream process unvalidated."],
  },
  workflowMermaid: "flowchart TD\n  step-receive[Receive request]",
  workflowReactFlowModel: { nodes: [{ id: "step-receive", data: { label: "Receive request" } }], edges: [] },
  visualValidationErrors: [],
  createdAt: now,
  updatedAt: now,
});

const beforeCounts = {
  bundles: store.synthesisInputBundles.findAll().length,
  claims: store.workflowClaims.findAll().length,
  gates: store.prePackageGateResults.findAll().length,
  packages: store.initialWorkflowPackages.findAll().length,
  visuals: store.workflowGraphRecords.findAll().length,
  pass7: store.pass7ReviewCandidates.findAll().length,
};

const successProvider = {
  name: "openai",
  async runPromptText({ compiledPrompt }) {
    assert.match(compiledPrompt, /DB-Grounded Context Summary/);
    assert.match(compiledPrompt, /Read-only admin assistant/);
    return {
      text: [
        "6A contains analysis material, boundary material, gap/risk material, and document/source signals.",
        "The readiness decision is ready_for_initial_package_with_warnings because warnings remain visible but do not block 6C.",
        "Document/source signals remain signals only, and the Finance interface remains unvalidated external risk.",
        "Visual output is available through visual-pass6-block18-proof.",
      ].join(" "),
      provider: "openai",
      model: "proof-model",
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
    };
  },
};

const answer = await runPass6Copilot({
  caseId,
  question: "What does the 6A bundle contain, why is readiness with warnings, and what visual should I inspect?",
  provider: successProvider,
  interactionId: "copilot-success-proof",
  now,
}, store);
assert.equal(answer.interaction.status, "succeeded");
assert.match(answer.interaction.answer, /6A contains/);
assert.match(answer.contextSummary, /analysis=1 boundary=1 gapRisk=1 documentSignals=1/);
assert.match(answer.contextSummary, /ready_for_initial_package_with_warnings/);
assert.ok(answer.interaction.routedActionRecommendations.some((item) => item.action === "view_bundle"));
assert.ok(answer.interaction.routedActionRecommendations.some((item) => item.action === "inspect_readiness_result"));
assert.ok(answer.interaction.routedActionRecommendations.some((item) => item.action === "inspect_visual"));
assert.equal(answer.interaction.routedActionRecommendations.every((item) => item.executesAutomatically === false), true);
assert.equal(answer.contextBundle.readOnly, true);
assert.ok(answer.interaction.contextReferencesUsed.some((item) => item.referenceType === "workflow_graph_record"));

const failure = await runPass6Copilot({
  caseId,
  question: "Explain blocker versus warning.",
  provider: null,
  interactionId: "copilot-missing-provider-proof",
  now,
}, store);
assert.equal(failure.interaction.status, "failed");
assert.equal(failure.interaction.failureCode, "provider_not_configured");
assert.match(failure.interaction.answer, /provider is not configured/);
assert.ok(failure.interaction.routedActionRecommendations.some((item) => item.action === "inspect_readiness_result"));

assert.equal(store.synthesisInputBundles.findAll().length, beforeCounts.bundles, "Copilot must not mutate 6A bundles");
assert.equal(store.workflowClaims.findAll().length, beforeCounts.claims, "Copilot must not mutate claims");
assert.equal(store.prePackageGateResults.findAll().length, beforeCounts.gates, "Copilot must not create gates");
assert.equal(store.initialWorkflowPackages.findAll().length, beforeCounts.packages, "Copilot must not create packages");
assert.equal(store.workflowGraphRecords.findAll().length, beforeCounts.visuals, "Copilot must not create visuals");
assert.equal(store.pass7ReviewCandidates.findAll().length, beforeCounts.pass7, "Copilot must not create Pass 7 records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 2, "Copilot context bundles are persisted for traceability only");
assert.equal(store.pass6CopilotInteractions.findAll().length, 2, "Copilot interactions are persisted for admin inspection");
assert.equal(answer.boundary.noAutonomousWrites, true);
assert.equal(answer.boundary.noParticipantFacingSends, true);
assert.equal(answer.boundary.noMessageOrEmailSending, true);
assert.equal(answer.boundary.noPass7Mechanics, true);

console.log("Pass 6 Block 18 Copilot proof passed.");
