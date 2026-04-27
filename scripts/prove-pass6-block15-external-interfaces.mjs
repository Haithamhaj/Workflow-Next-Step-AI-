import assert from "node:assert/strict";

import { validateExternalInterfaceRecord } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  registerExternalInterfacesFromPass6Context,
  registerExternalInterfacesFromRepositories,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T23:00:00.000Z";
const caseId = "case-pass6-block15-proof";
const draftId = "draft-pass6-block15-proof";
const readinessId = "readiness-pass6-block15-proof";
const gateId = "gate-pass6-block15-proof";

function basis(id, referenceType = "workflow_claim") {
  return {
    basisId: `basis-${id}`,
    basisType: "method_output",
    summary: `basis for ${id}`,
    references: [{
      referenceId: `ref-${id}`,
      referenceType,
      evidenceItemId: `evidence-${id}`,
    }],
  };
}

function element(elementId, label, description) {
  return {
    elementId,
    label,
    description,
    claimIds: [`claim-${elementId}`],
    basis: basis(elementId),
  };
}

function condition(status, rationale, blocksInitialPackage = false) {
  return {
    status,
    rationale,
    basis: basis(rationale.replace(/\W+/g, "-"), "seven_condition_assessment"),
    blocksInitialPackage,
  };
}

const draft = {
  draftId,
  caseId,
  basedOnBundleId: "bundle-pass6-block15-proof",
  workflowUnderstandingLevel: "reconstructable_workflow_with_gaps",
  steps: [element("step-intake", "Receive request", "Operations receives request from the customer portal.")],
  sequence: [element("seq-downstream", "Send output downstream", "Operations sends approved request to downstream Finance after validation.")],
  decisions: [],
  handoffs: [
    element("handoff-finance", "Handoff to Finance", "Finance receives the approved request for payment setup."),
  ],
  controls: [
    element("control-legal", "Legal approval authority", "Legal approval is required for non-standard contract terms."),
  ],
  systemsTools: [
    element("system-shared-queue", "Shared queue", "Operations and Finance use a shared queue for request routing."),
  ],
  variants: [],
  warningsCaveats: [
    "Unknown downstream process after Finance receives the output remains outside selected scope.",
  ],
  unresolvedItems: [
    "External input from Procurement is unknown and may block package readiness.",
  ],
  claimBasisMap: [],
  metadata: {
    createdAt: now,
    createdBy: "proof",
    notes: "Block 15 draft fixture.",
  },
  createdAt: now,
  updatedAt: now,
};

const readiness = {
  resultId: readinessId,
  caseId,
  assembledWorkflowDraftId: draftId,
  readinessDecision: "needs_more_clarification_before_package",
  sevenConditionAssessment: {
    assessmentId: "assessment-pass6-block15-proof",
    caseId,
    assembledWorkflowDraftId: draftId,
    conditions: {
      core_sequence_continuity: condition("clear_enough", "Core sequence is clear enough."),
      step_to_step_connection: condition("warning", "Downstream Finance handoff is visible but external process is unvalidated."),
      essential_step_requirements: condition("clear_enough", "Essential selected-department steps are visible."),
      decision_rules_thresholds: condition("clear_enough", "Decision thresholds are visible."),
      handoffs_responsibility: condition("warning", "External Finance handoff owner needs confirmation."),
      controls_approvals: condition("warning", "Legal approval authority is external to selected department."),
      use_case_boundary: condition("unknown", "External Procurement input boundary is unknown.", true),
    },
    overallSummary: "External interfaces need clarification before package readiness.",
  },
  gapRiskSummary: {
    summary: "External Procurement input and Finance downstream process are not fully validated.",
    gapIds: ["gap-external-procurement-input"],
    riskIds: ["risk-external-interface-unvalidated"],
  },
  allowedUseFor6C: ["none"],
  routingRecommendations: ["route external Procurement input to Pre-6C clarification"],
  analysisMetadata: {
    createdAt: now,
    createdBy: "proof",
    notes: "Block 15 readiness fixture.",
  },
  is6CAllowed: false,
  createdAt: now,
  updatedAt: now,
};

const gate = {
  gateResultId: gateId,
  caseId,
  workflowReadinessResultId: readinessId,
  gateDecision: "clarification_required_before_package",
  clarificationNeeds: [{
    clarificationNeedId: "clarification-external-procurement",
    questionType: "formal_email_inquiry",
    questionText: "Can Procurement confirm what input is required before Operations starts?",
    targetRole: "External or cross-functional process owner",
    whyItMatters: "External input is material to the selected workflow boundary.",
    relatedWorkflowElementId: "step-intake",
    relatedGapId: "gap-external-procurement-input",
    relatedSevenConditionKey: "use_case_boundary",
    expectedAnswerType: "other",
    exampleAnswer: "Procurement sends the approved vendor form, or another team handles this.",
    blockingStatus: "blocking",
    basis: basis("clarification-external-procurement", "clarification_need"),
    recommendedChannel: "external_interface_review",
    priority: "high",
  }],
  inquiryPackets: [],
  createdAt: now,
  updatedAt: now,
};

const result = registerExternalInterfacesFromPass6Context({
  assembledWorkflowDraft: draft,
  workflowReadinessResult: readiness,
  prePackageGateResult: gate,
  selectedDepartmentSide: "Operations selected use case",
  now,
});
assert.equal(result.ok, true, result.ok ? "" : result.error);

const records = result.interfaceRecords;
assert.ok(records.length >= 7, "interfaces should be detected from draft, readiness, and gate context");
for (const record of records) {
  const { createdAt, updatedAt, ...contractRecord } = record;
  assert.ok(createdAt && updatedAt, "stored interface timestamps should exist");
  const validation = validateExternalInterfaceRecord(contractRecord);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  assert.equal(record.scopeBoundary.selectedScopeRemainsPrimary, true);
  assert.equal(record.scopeBoundary.externalWorkflowNotAnalyzed, true);
  assert.equal(record.scopeBoundary.scopeExpansionImplemented, false);
  assert.ok(record.basis.references.length > 0, "interface should preserve source basis");
  assert.ok(record.whereItOccursInWorkflow, "interface should preserve workflow location");
  assert.equal(record.packageVisualConsumption.includeInPackageInterfaceNotes, true);
  assert.equal(record.packageVisualConsumption.includeInVisualGraph, true);
}

const handoff = records.find((record) => record.interfaceType === "handoff_owner" && record.externalDepartmentOrRole === "Finance");
assert.ok(handoff, "handoff to another department should create handoff_owner interface");

const approval = records.find((record) => record.interfaceType === "approval_control_authority");
assert.ok(approval, "external approval/control authority should create approval_control_authority interface");
assert.equal(approval.externalDepartmentOrRole, "Legal");

const sharedQueue = records.find((record) => record.interfaceType === "shared_system_queue_interface");
assert.ok(sharedQueue, "shared system/queue should create shared_system_queue_interface");
assert.ok(sharedQueue.externalSystemOrQueue, "shared system/queue should be visible");

const outOfScope = records.find((record) => record.interfaceType === "out_of_scope_external_process" || record.confirmationStatus === "unvalidated");
assert.ok(outOfScope, "unknown downstream process should be out of scope or unvalidated");

const procurement = records.find((record) => record.whatIsTransferredOrRequired.includes("Procurement"));
assert.ok(procurement, "material unknown external input should be recorded");
assert.equal(procurement.recommendedAction, "route_to_pre6c_clarification");
assert.equal(procurement.materiality, "blocker_candidate");

assert.equal(result.boundary.selectedScopeRemainsPrimary, true, "selected department scope remains unchanged");
assert.equal(result.boundary.externalWorkflowNotAnalyzed, true, "external internal workflow is not analyzed");
assert.equal(result.boundary.noExternalOutreach, true, "no external sending should occur");

const store = createInMemoryStore();
store.assembledWorkflowDrafts.save(draft);
store.workflowReadinessResults.save(readiness);
store.prePackageGateResults.save(gate);
const persisted = registerExternalInterfacesFromRepositories({
  prePackageGateResultId: gateId,
  selectedDepartmentSide: "Operations selected use case",
  now,
}, {
  assembledWorkflowDrafts: store.assembledWorkflowDrafts,
  workflowReadinessResults: store.workflowReadinessResults,
  prePackageGateResults: store.prePackageGateResults,
  externalInterfaceRecords: store.externalInterfaceRecords,
});
assert.equal(persisted.ok, true, persisted.ok ? "" : persisted.error);
assert.equal(store.externalInterfaceRecords.findByCaseId(caseId).length, persisted.interfaceRecords.length, "interfaces should persist by case");

const updated = store.externalInterfaceRecords.update(persisted.interfaceRecords[0].interfaceId, {
  confirmationStatus: "confirmed",
  materiality: "warning",
});
assert.ok(updated, "admin status/materiality marking should be persistable");
assert.equal(updated.confirmationStatus, "confirmed");
assert.equal(updated.materiality, "warning");

assert.equal(store.initialWorkflowPackages.findAll().length, 0, "no InitialWorkflowPackage records should be created");
assert.equal(store.workflowGapClosureBriefs.findAll().length, 0, "no WorkflowGapClosureBrief records should be created");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "no visual graph records should be created");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "no Copilot records should be created");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "no Pass 7 records should be created");

console.log("Pass 6 Block 15 external interface proof passed.");
