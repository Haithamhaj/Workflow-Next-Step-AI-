import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  buildPackageVisuals,
  buildWorkflowGraphFromInitialPackage,
  generatePackageVisuals,
} from "../packages/packages-output/dist/index.js";

const { validateWorkflowGraph } = await import("../packages/packages-output/node_modules/workflow-visual-core/dist/index.js");

const now = "2026-04-28T01:00:00.000Z";
const caseId = "case-pass6-block17-proof";
const draftId = "draft-pass6-block17-proof";
const packageId = "initial-package-pass6-block17-proof";

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

const draft = {
  draftId,
  caseId,
  basedOnBundleId: "bundle-pass6-block17-proof",
  workflowUnderstandingLevel: "package_ready_workflow",
  steps: [
    element("receive", "Receive request", "Coordinator receives the request."),
    element("check", "Check request", "Coordinator validates required fields."),
  ],
  sequence: [element("sequence-main", "Receive then check", "Receive request before validation.")],
  decisions: [element("decision-approval", "Approval needed?", "High value requests require approval.")],
  handoffs: [element("handoff-finance", "Handoff to Finance", "Finance receives the approved request as an external interface.")],
  controls: [element("approval-manager", "Manager approval", "Manager approves high value requests.")],
  systemsTools: [element("system-queue", "Shared queue", "Operations and Finance use a shared queue.")],
  variants: [element("variant-urgent", "Urgent exception", "Urgent work may follow an exception path.")],
  warningsCaveats: ["Document reference remains warning-only."],
  unresolvedItems: ["Unknown downstream Finance process remains out of selected scope."],
  claimBasisMap: [{ workflowElementId: "check", claimIds: ["claim-check"], sourceUnitIds: ["unit-check"], confidence: "high", materiality: "high" }],
  metadata: { createdAt: now, createdBy: "proof" },
  createdAt: now,
  updatedAt: now,
};

const initialPackage = {
  packageId,
  caseId,
  workflowReadinessResultId: "readiness-pass6-block17-proof",
  packageStatus: "initial_package_ready_with_warnings",
  clientFacingSections: [
    { sectionId: "summary", title: "Initial Workflow Summary", contentSummary: "Receive, check, approve, and hand off request.", basisClaimIds: ["claim-check"] },
    { sectionId: "warnings", title: "Warnings", contentSummary: "Document reference remains warning-only." },
  ],
  adminInternalAppendix: "Traceability summary only.",
  warningsCaveats: ["Document reference remains warning-only."],
  interfacesDependencies: ["Finance receives the approved request; Finance internal workflow is not analyzed."],
  documentReferenceImplications: ["Participant reality suggests a mismatch with the documented process."],
  metadata: { createdAt: now, createdBy: "proof" },
  createdAt: now,
  updatedAt: now,
};

const externalInterface = {
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

assert.equal(typeof validateWorkflowGraph, "function", "visual-core dependency can be imported");

const graph = buildWorkflowGraphFromInitialPackage({
  initialWorkflowPackage: initialPackage,
  assembledWorkflowDraft: draft,
  externalInterfaces: [externalInterface],
  direction: "TD",
});
assert.equal(graph.graphType, "workflow");
assert.equal(graph.direction, "TD");
assert.ok(graph.nodes.some((node) => node.nodeType === "warning"), "warnings appear in graph output");
assert.ok(graph.nodes.some((node) => node.nodeType === "unresolved"), "unresolved items appear in graph output");
assert.ok(graph.nodes.some((node) => node.nodeType === "interface" && node.status === "external_unvalidated"), "external interfaces appear as interface nodes");
assert.ok(graph.edges.some((edge) => edge.edgeType === "handoff" || edge.edgeType === "dependency"), "external interfaces create handoff/dependency edges");
assert.equal(graph.metadata.selectedScopeRemainsPrimary, true, "visual graph does not expand selected scope");

const validation = validateWorkflowGraph(graph);
assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));

const visuals = buildPackageVisuals(graph);
assert.equal(visuals.ok, true, visuals.ok ? "" : JSON.stringify(visuals.errors));
assert.equal(visuals.workflowGraphJson, validation.data, "Mermaid and React Flow use the same validated graph object");
assert.ok(visuals.workflowMermaid.includes("flowchart"), "Mermaid output should be generated");
assert.ok(Array.isArray(visuals.workflowReactFlowModel.nodes), "React Flow model should include nodes");
assert.ok(Array.isArray(visuals.workflowReactFlowModel.edges), "React Flow model should include edges");

const store = createInMemoryStore();
const generated = generatePackageVisuals({
  initialWorkflowPackage: initialPackage,
  assembledWorkflowDraft: draft,
  externalInterfaces: [externalInterface],
  now,
}, { workflowGraphRecords: store.workflowGraphRecords });
assert.equal(generated.ok, true, generated.ok ? "" : JSON.stringify(generated.errors));
assert.equal(store.workflowGraphRecords.findAll().length, 1, "visual record should be stored");
const stored = store.workflowGraphRecords.findAll()[0];
assert.ok(stored.workflowGraphJson);
assert.ok(stored.workflowMermaid.includes("flowchart"));
assert.ok(Array.isArray(stored.workflowReactFlowModel.nodes));
assert.equal(stored.visualValidationErrors.length, 0);

const invalid = buildPackageVisuals({
  ...graph,
  nodes: [{ ...graph.nodes[0], id: "" }],
});
assert.equal(invalid.ok, false, "invalid graph should return validation errors");
assert.ok(invalid.errors.length > 0);
assert.equal("workflowMermaid" in invalid, false, "invalid graph must not fake Mermaid success");
assert.equal("workflowReactFlowModel" in invalid, false, "invalid graph must not fake React Flow success");

assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 17 must not create package records");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "Block 17 must not recalculate readiness");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 17 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 17 must not create Pass 7 records");
assert.equal(store.finalPackages.findAll().length, 0, "Block 17 must not create Final Package records");

console.log("Pass 6 Block 17 visual-core integration proof passed.");
