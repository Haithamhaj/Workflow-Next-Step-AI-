import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { generatePass6Output } from "../packages/packages-output/dist/index.js";

const now = "2026-04-28T00:00:00.000Z";
const caseId = "case-pass6-block16-proof";
const draftId = "draft-pass6-block16-proof";

function basis(id) {
  return {
    basisId: `basis-${id}`,
    basisType: "method_output",
    summary: `basis for ${id}`,
    references: [{ referenceId: `ref-${id}`, referenceType: "workflow_claim", evidenceItemId: `evidence-${id}` }],
  };
}

function element(id, label, description) {
  return { elementId: id, label, description, claimIds: [`claim-${id}`], basis: basis(id) };
}

function condition(status, rationale, blocksInitialPackage = false) {
  return { status, rationale, basis: basis(rationale.replace(/\W+/g, "-")), blocksInitialPackage };
}

function draft(overrides = {}) {
  return {
    draftId,
    caseId,
    basedOnBundleId: "bundle-pass6-block16-proof",
    workflowUnderstandingLevel: "package_ready_workflow",
    steps: [
      element("step-intake", "Receive request", "Coordinator receives the request from the selected department queue."),
      element("step-check", "Check request", "Coordinator checks required fields before approval."),
    ],
    sequence: [element("seq-main", "Receive then check", "The request is received before field validation.")],
    decisions: [element("decision-threshold", "Approval threshold", "Manager approval is required above the threshold.")],
    handoffs: [element("handoff-finance", "Finance handoff", "Finance receives the approved request as an external interface.")],
    controls: [element("control-manager", "Manager approval", "Manager approval controls high-value requests.")],
    systemsTools: [element("system-queue", "Shared queue", "Operations and Finance use a shared queue.")],
    variants: [element("variant-urgent", "Urgent exception", "Urgent cases may skip the standard queue with manager approval.")],
    warningsCaveats: ["Document/reference comparison remains advisory."],
    unresolvedItems: [],
    claimBasisMap: [{ workflowElementId: "step-check", claimIds: ["claim-step-check"], sourceUnitIds: ["unit-step-check"], confidence: "high", materiality: "high" }],
    metadata: { createdAt: now, createdBy: "proof", notes: "Block 16 draft fixture." },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function readiness(decision, overrides = {}) {
  const isAllowed = decision === "ready_for_initial_package" || decision === "ready_for_initial_package_with_warnings";
  return {
    resultId: `readiness-${decision}-${overrides.suffix ?? "base"}`,
    caseId,
    assembledWorkflowDraftId: draftId,
    readinessDecision: decision,
    sevenConditionAssessment: {
      assessmentId: `assessment-${decision}-${overrides.suffix ?? "base"}`,
      caseId,
      assembledWorkflowDraftId: draftId,
      conditions: {
        core_sequence_continuity: condition("clear_enough", "Core sequence is clear."),
        step_to_step_connection: condition("clear_enough", "Step connection is clear."),
        essential_step_requirements: condition("clear_enough", "Essential requirements are clear."),
        decision_rules_thresholds: condition("clear_enough", "Decision threshold is clear."),
        handoffs_responsibility: condition("clear_enough", "Handoff responsibility is visible."),
        controls_approvals: condition("clear_enough", "Controls and approvals are visible."),
        use_case_boundary: condition("clear_enough", "Use-case boundary is clear."),
        ...(overrides.conditions ?? {}),
      },
      overallSummary: "Readiness fixture.",
    },
    gapRiskSummary: overrides.gapRiskSummary ?? { summary: "No blocking gap remains.", gapIds: [], riskIds: [] },
    allowedUseFor6C: overrides.allowedUseFor6C ?? (isAllowed ? ["initial_package"] : ["none"]),
    routingRecommendations: overrides.routingRecommendations ?? (isAllowed ? ["proceed_to_6c"] : ["send_to_pre_6c_clarification"]),
    analysisMetadata: { createdAt: now, createdBy: "proof", notes: "Block 16 readiness fixture." },
    is6CAllowed: isAllowed,
    createdAt: now,
    updatedAt: now,
  };
}

function gate(resultId, approved = false) {
  return {
    gateResultId: `gate-${resultId}`,
    caseId,
    workflowReadinessResultId: resultId,
    gateDecision: approved ? "proceed_with_warnings_approved" : "clarification_required_before_package",
    clarificationNeeds: [{
      clarificationNeedId: `need-${resultId}`,
      questionType: "formal_email_inquiry",
      questionText: "Can Finance confirm the external handoff condition?",
      targetRole: "External or cross-functional process owner",
      whyItMatters: "External handoff is material to package limitations.",
      relatedGapId: "gap-external-handoff",
      relatedSevenConditionKey: "handoffs_responsibility",
      expectedAnswerType: "other",
      exampleAnswer: "Finance receives the approved request; another team handles downstream work.",
      blockingStatus: "blocking",
      basis: basis(`need-${resultId}`),
      recommendedChannel: "external_interface_review",
      priority: "high",
    }],
    inquiryPackets: [],
    proceedWithWarningsApproval: approved ? {
      approvalStatus: "approved",
      approvedBy: "admin-proof",
      approvedAt: now,
      approvalNote: "Proceed with visible limitations.",
      warningsAccepted: ["risk-external-interface-unvalidated"],
      reasonForProceeding: "Admin accepted limited initial package with external handoff caveat.",
      limitationsToKeepVisible: ["External Finance process remains unvalidated."],
      followUpRecommendation: "Clarify external handoff after initial package.",
    } : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

function externalInterface() {
  return {
    interfaceId: "external-interface-finance",
    caseId,
    relatedWorkflowDraftId: draftId,
    interfaceType: "handoff_owner",
    externalDepartmentOrRole: "Finance",
    externalSystemOrQueue: "Shared queue",
    selectedDepartmentSide: "Operations selected use case",
    whereItOccursInWorkflow: "handoff:handoff-finance",
    whatIsTransferredOrRequired: "Approved request is handed off to Finance; Finance internal workflow is not in scope.",
    basis: basis("external-interface-finance"),
    confirmationStatus: "unvalidated",
    materiality: "warning",
    affectsSevenCondition: ["handoffs_responsibility", "use_case_boundary"],
    recommendedAction: "proceed_with_warning",
    limitationsCaveats: ["Finance internal workflow is not analyzed."],
    packageVisualConsumption: { includeInPackageInterfaceNotes: true, includeInVisualGraph: true, visualNodeStatus: "external_unvalidated" },
    scopeBoundary: { selectedScopeRemainsPrimary: true, externalWorkflowNotAnalyzed: true, scopeExpansionImplemented: false },
    metadata: { createdAt: now, createdBy: "proof" },
    createdAt: now,
    updatedAt: now,
  };
}

function run(input, store = createInMemoryStore()) {
  const result = generatePass6Output(input, {
    initialWorkflowPackages: store.initialWorkflowPackages,
    workflowGapClosureBriefs: store.workflowGapClosureBriefs,
    draftOperationalDocuments: store.draftOperationalDocuments,
  });
  assert.equal(result.ok, true, result.ok ? "" : result.error);
  return { result, store };
}

const ready = readiness("ready_for_initial_package", { suffix: "ready" });
const readyRun = run({ workflowReadinessResult: ready, assembledWorkflowDraft: draft(), externalInterfaces: [externalInterface()], now });
assert.equal(readyRun.result.outputKind, "initial_workflow_package");
assert.equal(readyRun.result.initialWorkflowPackage.packageStatus, "initial_package_ready");

const warningReady = readiness("ready_for_initial_package_with_warnings", {
  suffix: "warning",
  gapRiskSummary: { summary: "External interface remains warning-only.", gapIds: [], riskIds: ["risk-interface-warning"] },
  allowedUseFor6C: ["initial_package_with_warnings"],
  routingRecommendations: ["proceed_to_6c_with_warnings"],
});
const warningRun = run({ workflowReadinessResult: warningReady, assembledWorkflowDraft: draft(), externalInterfaces: [externalInterface()], now });
assert.equal(warningRun.result.initialWorkflowPackage.packageStatus, "initial_package_ready_with_warnings");
assert.ok(warningRun.result.initialWorkflowPackage.warningsCaveats.some((item) => item.includes("External interface")));

const notReadyWithApproval = readiness("needs_more_clarification_before_package", {
  suffix: "approved",
  conditions: { use_case_boundary: condition("unknown", "External boundary unknown.", true) },
  gapRiskSummary: { summary: "External handoff is unknown.", gapIds: ["gap-external-handoff"], riskIds: ["risk-external-interface-unvalidated"] },
});
const approvedGate = gate(notReadyWithApproval.resultId, true);
const approvedRun = run({ workflowReadinessResult: notReadyWithApproval, assembledWorkflowDraft: draft(), prePackageGateResult: approvedGate, externalInterfaces: [externalInterface()], now });
assert.equal(approvedRun.result.outputKind, "initial_workflow_package");
assert.equal(approvedRun.result.initialWorkflowPackage.packageStatus, "initial_package_admin_approved_with_limitations");
assert.ok(approvedRun.result.initialWorkflowPackage.clientFacingSections.some((section) => section.sectionId === "proceed-with-warnings-approval"));

const notReady = readiness("needs_more_clarification_before_package", {
  suffix: "blocked",
  conditions: { use_case_boundary: condition("unknown", "External Procurement input boundary unknown.", true) },
  gapRiskSummary: { summary: "External Procurement input blocks package.", gapIds: ["gap-procurement-input"], riskIds: ["risk-blocker"] },
});
const blockedRun = run({ workflowReadinessResult: notReady, assembledWorkflowDraft: draft(), prePackageGateResult: gate(notReady.resultId, false), externalInterfaces: [externalInterface()], now });
assert.equal(blockedRun.result.outputKind, "workflow_gap_closure_brief");
assert.ok(blockedRun.result.workflowGapClosureBrief.packageBlockedReason.includes("needs_more_clarification"));
assert.equal(blockedRun.store.initialWorkflowPackages.findAll().length, 0, "not-ready readiness without approval must not create package");

const noApprovalStore = createInMemoryStore();
const noApproval = run({ workflowReadinessResult: notReady, assembledWorkflowDraft: draft(), externalInterfaces: [externalInterface()], now }, noApprovalStore);
assert.equal(noApproval.result.outputKind, "workflow_gap_closure_brief", "missing proceed-with-warnings approval blocks package when readiness forbids it");

const clientText = readyRun.result.initialWorkflowPackage.clientFacingSections.map((section) => `${section.title} ${section.contentSummary}`).join("\n");
assert.ok(!clientText.includes("methodUsageId"), "client-facing package excludes full internal method complexity");
assert.ok(!clientText.includes("detailed scoring"), "client-facing package excludes full internal scoring complexity");
assert.ok(readyRun.result.initialWorkflowPackage.adminInternalAppendix.includes("Detailed claims"), "admin appendix preserves traceability summary");
assert.ok(readyRun.result.initialWorkflowPackage.interfacesDependencies.some((item) => item.includes("Finance")), "external interface appears in dependency section");
assert.ok(readyRun.result.initialWorkflowPackage.interfacesDependencies.some((item) => item.includes("unvalidated")), "unknown external process remains unvalidated");
assert.ok(readyRun.result.initialWorkflowPackage.documentReferenceImplications.every((item) => !item.includes("SOP is wrong") && !item.includes("policy is invalid") && !item.includes("workflow is final")), "document implication uses careful wording");

const draftBlocked = run({
  workflowReadinessResult: ready,
  assembledWorkflowDraft: draft(),
  externalInterfaces: [externalInterface()],
  draftRequest: { requested: true },
  now,
});
assert.equal(draftBlocked.result.draftOperationalDocument, undefined, "optional draft is blocked without document type");
assert.ok(draftBlocked.result.blockedDraftReason.includes("document type"));

const draftCreatedStore = createInMemoryStore();
const draftCreated = run({
  workflowReadinessResult: ready,
  assembledWorkflowDraft: draft(),
  externalInterfaces: [externalInterface()],
  draftRequest: { requested: true, documentDraftType: "sop_draft", approvedBy: "admin-proof", purpose: "Draft SOP skeleton for review." },
  now,
}, draftCreatedStore);
assert.ok(draftCreated.result.draftOperationalDocument, "optional draft is created when explicitly requested and eligible");
assert.equal(draftCreated.result.draftOperationalDocument.documentDraftType, "sop_draft");
assert.equal(draftCreated.result.draftOperationalDocument.draftStatus, "draft_only_not_approved");
assert.ok(draftCreated.result.draftOperationalDocument.limitations.includes("Not final."));
assert.equal(draftCreatedStore.draftOperationalDocuments.findAll().length, 1);

assert.equal(draftCreatedStore.workflowGraphRecords.findAll().length, 0, "no visual graph records should be created");
assert.equal(draftCreatedStore.pass6CopilotContextBundles.findAll().length, 0, "no Copilot records should be created");
assert.equal(draftCreatedStore.pass7ReviewCandidates.findAll().length, 0, "no Pass 7 records should be created");
assert.equal(draftCreatedStore.finalPackages.findAll().length, 0, "no Final Package records should be created");
assert.equal(draftCreated.result.boundary.noProviderCalls, true, "no provider calls are made");
assert.equal(draftCreated.result.boundary.noReleaseOccurred, true, "no release occurs");

console.log("Pass 6 Block 16 package generation proof passed.");
