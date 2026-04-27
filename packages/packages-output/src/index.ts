/**
 * Initial Package assembly — Pass 6 implementation.
 * Spec refs: §21.3 (five mandatory outward sections),
 *            §21.4 (conditional Document/Reference Implication — operator-
 *            supplied; triggers not invented),
 *            §21.5 (package status enum),
 *            §21.8 (seven-condition checklist must NOT appear in outward),
 *            §21.11 (admin-only judgment layer).
 *
 * Architecture constraint: this package does not derive status or checklist
 * values — both are operator-supplied, matching §21.8/§21.11 separation of
 * outward vs admin concerns. Structural separation is enforced by schema:
 * outward and admin are distinct sub-objects.
 */

import {
  validateDraftOperationalDocument,
  validateInitialWorkflowPackage,
  validateInitialPackageRecord,
  validateWorkflowGapClosureBrief,
  InitialPackageStatus,
  type AssembledWorkflowDraft,
  type DocumentDraftType,
  type DraftOperationalDocument,
  type ExternalInterfaceRecord,
  type InitialWorkflowPackage,
  type InitialPackageRecord,
  type InitialPackageOutward,
  type InitialPackageAdmin,
  type PackageSection,
  type PrePackageGateResult,
  type SevenConditionKey,
  type WorkflowGapClosureBrief,
  type WorkflowGraphRecord,
  type WorkflowReadinessResult,
} from "@workflow/contracts";
import type {
  DraftOperationalDocumentRepository,
  InitialWorkflowPackageRepository,
  StoredInitialPackageRecord,
  StoredDraftOperationalDocument,
  StoredInitialWorkflowPackage,
  StoredWorkflowGapClosureBrief,
  StoredWorkflowGraphRecord,
  InitialPackageRepository,
  WorkflowGapClosureBriefRepository,
  WorkflowGraphRecordRepository,
} from "@workflow/persistence";
import {
  validateWorkflowGraph,
  toMermaid,
  toReactFlow,
  type ValidationError,
  type WorkflowGraph,
  type WorkflowGraphEdge,
  type WorkflowGraphNode,
} from "workflow-visual-core";

export const PACKAGES_OUTPUT_PACKAGE = "@workflow/packages-output" as const;

export * from "./final-package.js";

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export { InitialPackageStatus } from "@workflow/contracts";
export type {
  InitialPackageRecord,
  InitialPackageOutward,
  InitialPackageAdmin,
} from "@workflow/contracts";
export type {
  StoredInitialPackageRecord,
  StoredInitialWorkflowPackage,
  StoredWorkflowGapClosureBrief,
  StoredDraftOperationalDocument,
  StoredWorkflowGraphRecord,
  InitialPackageRepository,
  InitialWorkflowPackageRepository,
  WorkflowGapClosureBriefRepository,
  DraftOperationalDocumentRepository,
  WorkflowGraphRecordRepository,
} from "@workflow/persistence";

// ---------------------------------------------------------------------------
// Outcome types
// ---------------------------------------------------------------------------

export interface InitialPackageOk {
  ok: true;
  initialPackage: StoredInitialPackageRecord;
}

export interface InitialPackageError {
  ok: false;
  error: string;
}

export type InitialPackageResult = InitialPackageOk | InitialPackageError;

// ---------------------------------------------------------------------------
// Pass 6 6C output generation — Block 16
// ---------------------------------------------------------------------------

export interface Pass6DraftRequest {
  requested: boolean;
  documentDraftType?: DocumentDraftType;
  approvedBy?: string;
  purpose?: string;
}

export interface GeneratePass6OutputInput {
  workflowReadinessResult: WorkflowReadinessResult;
  assembledWorkflowDraft: AssembledWorkflowDraft;
  prePackageGateResult?: PrePackageGateResult;
  externalInterfaces?: ExternalInterfaceRecord[];
  draftRequest?: Pass6DraftRequest;
  packageId?: string;
  briefId?: string;
  draftDocumentId?: string;
  now?: string;
  persist?: boolean;
}

export interface GeneratePass6OutputRepositories {
  initialWorkflowPackages?: InitialWorkflowPackageRepository;
  workflowGapClosureBriefs?: WorkflowGapClosureBriefRepository;
  draftOperationalDocuments?: DraftOperationalDocumentRepository;
}

export interface GeneratePass6OutputOk {
  ok: true;
  outputKind: "initial_workflow_package" | "workflow_gap_closure_brief";
  initialWorkflowPackage?: StoredInitialWorkflowPackage;
  workflowGapClosureBrief?: StoredWorkflowGapClosureBrief;
  draftOperationalDocument?: StoredDraftOperationalDocument;
  blockedDraftReason?: string;
  boundary: {
    notFinalPackage: true;
    noReleaseOccurred: true;
    noVisualGenerated: true;
    noProviderCalls: true;
    noPass7RecordsCreated: true;
  };
}

export type GeneratePass6OutputResult =
  | GeneratePass6OutputOk
  | { ok: false; error: string };

function safeIdPart(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9:_-]+/g, "_");
}

function validationErrorText(errors: readonly { message?: string }[]): string {
  return errors.map((error) => error.message ?? String(error)).join("; ");
}

function packageBoundary() {
  return {
    notFinalPackage: true,
    noReleaseOccurred: true,
    noVisualGenerated: true,
    noProviderCalls: true,
    noPass7RecordsCreated: true,
  } as const;
}

function hasProceedWithWarningsApproval(gate?: PrePackageGateResult): boolean {
  return gate?.gateDecision === "proceed_with_warnings_approved"
    && gate.proceedWithWarningsApproval?.approvalStatus === "approved"
    && Boolean(gate.proceedWithWarningsApproval.approvedBy)
    && Boolean(gate.proceedWithWarningsApproval.approvedAt);
}

function canGenerateInitialPackage(readiness: WorkflowReadinessResult, gate?: PrePackageGateResult): boolean {
  return readiness.readinessDecision === "ready_for_initial_package"
    || readiness.readinessDecision === "ready_for_initial_package_with_warnings"
    || hasProceedWithWarningsApproval(gate);
}

function packageStatusFor(readiness: WorkflowReadinessResult, gate?: PrePackageGateResult): InitialWorkflowPackage["packageStatus"] {
  if (hasProceedWithWarningsApproval(gate) && readiness.readinessDecision !== "ready_for_initial_package") {
    return "initial_package_admin_approved_with_limitations";
  }
  if (readiness.readinessDecision === "ready_for_initial_package") return "initial_package_ready";
  return "initial_package_ready_with_warnings";
}

function section(sectionId: string, title: string, contentSummary: string, basisClaimIds?: string[]): PackageSection {
  return { sectionId, title, contentSummary, basisClaimIds };
}

function listWorkflow(elements: { label: string; description?: string }[]): string {
  if (elements.length === 0) return "No detailed item is available in the current assembled workflow draft.";
  return elements.map((element, index) => `${index + 1}. ${element.label}${element.description ? ` — ${element.description}` : ""}`).join("\n");
}

function brokenConditionKeys(readiness: WorkflowReadinessResult): SevenConditionKey[] {
  return Object.entries(readiness.sevenConditionAssessment.conditions)
    .filter(([, condition]) => condition.blocksInitialPackage || condition.status === "materially_broken" || condition.status === "unknown")
    .map(([key]) => key as SevenConditionKey);
}

function sevenConditionSummary(readiness: WorkflowReadinessResult): string {
  return Object.entries(readiness.sevenConditionAssessment.conditions)
    .map(([key, condition]) => `${key}: ${condition.status}${condition.blocksInitialPackage ? " (blocks initial package)" : ""}. ${condition.rationale}`)
    .join("\n");
}

function interfaceSummary(record: ExternalInterfaceRecord): string {
  return `${record.interfaceType}: ${record.selectedDepartmentSide} ↔ ${record.externalDepartmentOrRole}; status ${record.confirmationStatus}; materiality ${record.materiality}; action ${record.recommendedAction}. ${record.whatIsTransferredOrRequired}`;
}

function carefulDocumentImplications(readiness: WorkflowReadinessResult, draft: AssembledWorkflowDraft): string[] {
  const warnings = [...draft.warningsCaveats, ...draft.unresolvedItems, readiness.gapRiskSummary.summary].join(" ").toLowerCase();
  if (warnings.includes("document") || warnings.includes("sop") || warnings.includes("policy")) {
    return [
      "Participant reality suggests a mismatch with the documented process; a documentation update is recommended before final package.",
      "The available reference appears too generic for detailed operational comparison where warnings remain.",
    ];
  }
  return ["No sufficient reference was available; this package is based primarily on participant evidence."];
}

function buildClientSections(
  readiness: WorkflowReadinessResult,
  draft: AssembledWorkflowDraft,
  interfaces: ExternalInterfaceRecord[],
  gate?: PrePackageGateResult,
): PackageSection[] {
  const claimIds = draft.claimBasisMap.flatMap((basis) => basis.claimIds);
  const interfaceText = interfaces.length > 0
    ? interfaces.map(interfaceSummary).join("\n")
    : "No cross-department or external interface records are currently attached.";
  const warningText = [
    ...draft.warningsCaveats,
    ...draft.unresolvedItems,
    readiness.gapRiskSummary.summary,
    ...(gate?.proceedWithWarningsApproval?.limitationsToKeepVisible ?? []),
  ].filter(Boolean).join("\n");
  return [
    section("package-status-readiness", "Package Status / Readiness Label", `${readiness.readinessDecision}; 6C allowed: ${readiness.is6CAllowed ? "yes" : "no"}.`, claimIds),
    section("initial-workflow-summary", "Initial Workflow Summary", `${draft.workflowUnderstandingLevel}. ${listWorkflow(draft.steps)}`, claimIds),
    section("workflow-scope-boundary", "Workflow Scope and Boundary", `Scope is limited to the selected department/use case represented by draft ${draft.draftId}. External work is included only as interfaces, dependencies, or caveats.`, claimIds),
    section("workflow-map-narrative", "Initial Workflow Map / Narrative", listWorkflow([...draft.sequence, ...draft.decisions, ...draft.handoffs, ...draft.controls]), claimIds),
    section("evidence-claim-basis-summary", "Evidence / Claim Basis Summary", `High-level basis uses ${draft.claimBasisMap.length} claim-basis entries. Detailed claims and method logs remain in the admin/internal appendix.`, claimIds),
    section("seven-condition-summary", "Seven-Condition Readiness Summary", sevenConditionSummary(readiness)),
    section("gap-warning-caveat", "Gap / Warning / Caveat Section", warningText || "No package-blocking caveat is recorded."),
    section("interface-dependency", "Interface / Dependency Section", interfaceText),
    section("document-reference-implication", "Document / Reference Implication Section", carefulDocumentImplications(readiness, draft).join("\n")),
    section("next-actions", "Next Actions", readiness.routingRecommendations.length > 0 ? readiness.routingRecommendations.join("\n") : "Proceed according to admin review and keep warnings visible."),
    section("package-metadata", "Package Metadata", `Generated as Initial Workflow Package only. Not final, not released, no visual generated.`),
    ...(draft.variants.length > 0 ? [section("variants-exceptions", "Variants and Exceptions", listWorkflow(draft.variants), claimIds)] : []),
    ...(gate?.proceedWithWarningsApproval ? [section("proceed-with-warnings-approval", "Proceed-With-Warnings Approval Note", `${gate.proceedWithWarningsApproval.approvedBy} approved proceeding with limitations: ${gate.proceedWithWarningsApproval.reasonForProceeding ?? gate.proceedWithWarningsApproval.approvalNote}`)] : []),
  ];
}

function adminAppendixSummary(
  readiness: WorkflowReadinessResult,
  draft: AssembledWorkflowDraft,
  interfaces: ExternalInterfaceRecord[],
  gate?: PrePackageGateResult,
): string {
  return [
    "Admin/internal appendix summary.",
    `Workflow draft: ${draft.draftId}; readiness result: ${readiness.resultId}.`,
    `Claim-basis entries: ${draft.claimBasisMap.length}; warnings/caveats: ${draft.warningsCaveats.length}; unresolved items: ${draft.unresolvedItems.length}.`,
    `Seven-condition assessment: ${readiness.sevenConditionAssessment.assessmentId}.`,
    `External interface records: ${interfaces.map((record) => record.interfaceId).join(", ") || "none"}.`,
    gate ? `Pre-6C gate: ${gate.gateResultId}; decision: ${gate.gateDecision}.` : "Pre-6C gate: none supplied.",
    "Detailed claims, method usage, scoring/confidence/materiality, config versions, and prompt versions remain admin/internal and are not exposed client-facing by default.",
  ].join("\n");
}

function buildInitialWorkflowPackage(input: GeneratePass6OutputInput, now: string): InitialWorkflowPackage {
  const readiness = input.workflowReadinessResult;
  const draft = input.assembledWorkflowDraft;
  const interfaces = input.externalInterfaces ?? [];
  return {
    packageId: input.packageId ?? `initial_workflow_package:${safeIdPart(readiness.resultId)}`,
    caseId: readiness.caseId,
    workflowReadinessResultId: readiness.resultId,
    packageStatus: packageStatusFor(readiness, input.prePackageGateResult),
    clientFacingSections: buildClientSections(readiness, draft, interfaces, input.prePackageGateResult),
    adminInternalAppendix: adminAppendixSummary(readiness, draft, interfaces, input.prePackageGateResult),
    warningsCaveats: [
      ...draft.warningsCaveats,
      ...draft.unresolvedItems,
      readiness.gapRiskSummary.summary,
      ...(input.prePackageGateResult?.proceedWithWarningsApproval?.limitationsToKeepVisible ?? []),
    ].filter(Boolean),
    interfacesDependencies: interfaces.map(interfaceSummary),
    documentReferenceImplications: carefulDocumentImplications(readiness, draft),
    metadata: {
      createdAt: now,
      createdBy: "pass6-block16-package-output",
      notes: "Initial Workflow Package only; not Final Package, not release, no visual output.",
    },
  };
}

function buildGapClosureBrief(input: GeneratePass6OutputInput, now: string): WorkflowGapClosureBrief {
  const readiness = input.workflowReadinessResult;
  const draft = input.assembledWorkflowDraft;
  const gateNeeds = input.prePackageGateResult?.clarificationNeeds ?? [];
  const broken = brokenConditionKeys(readiness);
  const needs = gateNeeds.length > 0
    ? gateNeeds.map((need) => `${need.relatedGapId ?? need.clarificationNeedId}: ${need.questionText} Target: ${need.targetRole ?? need.targetRecipient ?? "admin review"}`)
    : readiness.gapRiskSummary.gapIds;
  return {
    briefId: input.briefId ?? `workflow_gap_closure_brief:${safeIdPart(readiness.resultId)}`,
    caseId: readiness.caseId,
    packageBlockedReason: `${readiness.readinessDecision}: ${readiness.gapRiskSummary.summary}`,
    currentlyVisibleWorkflow: listWorkflow([...draft.steps, ...draft.sequence, ...draft.handoffs]),
    brokenUnknownConditions: broken.length > 0 ? broken : ["No exact blocker condition identified; current basis remains insufficient."],
    gapsToClose: needs.length > 0 ? needs : ["Clarify the missing workflow basis before package generation."],
    recommendedClarificationRoute: gateNeeds.length > 0
      ? gateNeeds.map((need) => `${need.recommendedChannel} → ${need.targetRole ?? need.targetRecipient ?? "admin"}`).join("\n")
      : readiness.routingRecommendations.join("\n") || "Return to Pre-6C clarification before generating a package.",
    nextStepToReachPackageReadiness: hasProceedWithWarningsApproval(input.prePackageGateResult)
      ? "Admin has approved proceeding with warnings; regenerate 6C package with limitations visible."
      : "Close blocking gaps through Pre-6C clarification or record an explicit proceed-with-warnings approval if policy allows.",
  };
}

function draftEligibility(input: GeneratePass6OutputInput): { eligible: true } | { eligible: false; reason: string } {
  const request = input.draftRequest;
  if (!request?.requested) return { eligible: false, reason: "Optional draft was not explicitly requested." };
  if (!request.documentDraftType) return { eligible: false, reason: "Optional draft document type is missing." };
  if (!canGenerateInitialPackage(input.workflowReadinessResult, input.prePackageGateResult)) {
    return { eligible: false, reason: "Optional draft is blocked because Initial Package generation is not allowed." };
  }
  const blockers = brokenConditionKeys(input.workflowReadinessResult);
  if (blockers.length > 0 && !hasProceedWithWarningsApproval(input.prePackageGateResult)) {
    return { eligible: false, reason: `Optional draft blocked by unresolved material conditions: ${blockers.join(", ")}.` };
  }
  return { eligible: true };
}

function buildDraftOperationalDocument(input: GeneratePass6OutputInput, now: string): { draft?: DraftOperationalDocument; blockedReason?: string } {
  const eligibility = draftEligibility(input);
  if (!eligibility.eligible) return { blockedReason: eligibility.reason };
  const documentDraftType = input.draftRequest?.documentDraftType as DocumentDraftType;
  const draft = input.assembledWorkflowDraft;
  return {
    draft: {
      draftId: input.draftDocumentId ?? `draft_operational_document:${safeIdPart(input.workflowReadinessResult.resultId)}:${documentDraftType}`,
      caseId: input.workflowReadinessResult.caseId,
      documentDraftType,
      draftStatus: "draft_only_not_approved",
      evidenceMaturitySummary: "Evidence is sufficient for a draft-only, pre-review operational document with visible limitations. This is not final, not approved, not released, and not implementation-ready.",
      sections: [
        section("draft-purpose", "Draft Purpose", input.draftRequest?.purpose ?? `Draft ${documentDraftType} based on current Initial Workflow Package evidence.`),
        section("draft-workflow-basis", "Workflow Basis", listWorkflow(draft.steps), draft.claimBasisMap.flatMap((basis) => basis.claimIds)),
        section("draft-limitations", "Draft Limitations", "Draft only. Not final. Not approved. Not released. Not implementation-ready."),
      ],
      limitations: [
        "Draft only.",
        "Not final.",
        "Not approved.",
        "Not released.",
        "Not implementation-ready.",
        ...draft.warningsCaveats,
      ],
      metadata: {
        createdAt: now,
        createdBy: input.draftRequest?.approvedBy ?? "pass6-block16-package-output",
        notes: "Optional draft generated only after explicit request and eligibility check.",
      },
    },
  };
}

export function generatePass6Output(
  input: GeneratePass6OutputInput,
  repos: GeneratePass6OutputRepositories = {},
): GeneratePass6OutputResult {
  const now = input.now ?? new Date().toISOString();
  if (input.workflowReadinessResult.caseId !== input.assembledWorkflowDraft.caseId) {
    return { ok: false, error: "WorkflowReadinessResult and AssembledWorkflowDraft caseId must match." };
  }

  const draftBuild = buildDraftOperationalDocument(input, now);
  let storedDraft: StoredDraftOperationalDocument | undefined;
  if (draftBuild.draft) {
    const draftValidation = validateDraftOperationalDocument(draftBuild.draft);
    if (!draftValidation.ok) return { ok: false, error: `Invalid DraftOperationalDocument: ${validationErrorText(draftValidation.errors)}` };
    storedDraft = { ...draftBuild.draft, createdAt: now, updatedAt: now };
  }

  if (canGenerateInitialPackage(input.workflowReadinessResult, input.prePackageGateResult)) {
    const output = buildInitialWorkflowPackage(input, now);
    const validation = validateInitialWorkflowPackage(output);
    if (!validation.ok) return { ok: false, error: `Invalid InitialWorkflowPackage: ${validationErrorText(validation.errors)}` };
    const storedPackage: StoredInitialWorkflowPackage = { ...output, createdAt: now, updatedAt: now };
    if (input.persist !== false) {
      repos.initialWorkflowPackages?.save(storedPackage);
      if (storedDraft) repos.draftOperationalDocuments?.save(storedDraft);
    }
    return {
      ok: true,
      outputKind: "initial_workflow_package",
      initialWorkflowPackage: storedPackage,
      draftOperationalDocument: storedDraft,
      blockedDraftReason: draftBuild.blockedReason,
      boundary: packageBoundary(),
    };
  }

  const brief = buildGapClosureBrief(input, now);
  const validation = validateWorkflowGapClosureBrief(brief);
  if (!validation.ok) return { ok: false, error: `Invalid WorkflowGapClosureBrief: ${validationErrorText(validation.errors)}` };
  const storedBrief: StoredWorkflowGapClosureBrief = { ...brief, createdAt: now, updatedAt: now };
  if (input.persist !== false) {
    repos.workflowGapClosureBriefs?.save(storedBrief);
  }
  return {
    ok: true,
    outputKind: "workflow_gap_closure_brief",
    workflowGapClosureBrief: storedBrief,
    blockedDraftReason: draftBuild.blockedReason,
    boundary: packageBoundary(),
  };
}

// ---------------------------------------------------------------------------
// Pass 6 Visual Core Integration — Block 17
// ---------------------------------------------------------------------------

export interface BuildWorkflowGraphInput {
  initialWorkflowPackage: InitialWorkflowPackage;
  assembledWorkflowDraft: AssembledWorkflowDraft;
  externalInterfaces?: ExternalInterfaceRecord[];
  direction?: WorkflowGraph["direction"];
  graphId?: string;
}

export type BuildPackageVisualsResult =
  | {
    ok: true;
    workflowGraphJson: WorkflowGraph;
    workflowMermaid: string;
    workflowReactFlowModel: ReturnType<typeof toReactFlow>;
  }
  | { ok: false; errors: ValidationError[] };

export interface GeneratePackageVisualsInput extends BuildWorkflowGraphInput {
  visualRecordId?: string;
  now?: string;
  persist?: boolean;
}

export type GeneratePackageVisualsResult =
  | { ok: true; visualRecord: StoredWorkflowGraphRecord; visuals: Extract<BuildPackageVisualsResult, { ok: true }> }
  | { ok: false; visualRecord?: StoredWorkflowGraphRecord; errors: ValidationError[] };

function graphNodeId(prefix: string, value: string): string {
  return `${prefix}_${safeIdPart(value).replace(/:/g, "_")}`;
}

function graphStatusFromText(text: string): WorkflowGraphNode["status"] {
  const lower = text.toLowerCase();
  if (lower.includes("unresolved") || lower.includes("unknown")) return "unresolved";
  if (lower.includes("warning") || lower.includes("caveat")) return "warning";
  if (lower.includes("assumed")) return "assumed";
  return "confirmed";
}

function elementNode(
  element: { elementId: string; label: string; description?: string; claimIds?: string[] },
  nodeType: WorkflowGraphNode["nodeType"],
  lane: string,
): WorkflowGraphNode {
  const text = `${element.label} ${element.description ?? ""}`;
  return {
    id: graphNodeId(nodeType, element.elementId),
    label: element.label,
    nodeType,
    description: element.description,
    lane,
    status: graphStatusFromText(text),
    metadata: {
      workflowElementId: element.elementId,
      claimIds: element.claimIds ?? [],
    },
  };
}

function edge(
  id: string,
  from: string,
  to: string,
  edgeType: WorkflowGraphEdge["edgeType"] = "sequence",
  label?: string,
  status: WorkflowGraphEdge["status"] = "confirmed",
): WorkflowGraphEdge {
  return { id: graphNodeId("edge", id), from, to, edgeType, label, status };
}

function uniqueGraphNodes(nodes: WorkflowGraphNode[]): WorkflowGraphNode[] {
  const seen = new Set<string>();
  const out: WorkflowGraphNode[] = [];
  for (const node of nodes) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    out.push(node);
  }
  return out;
}

function uniqueGraphEdges(edges: WorkflowGraphEdge[]): WorkflowGraphEdge[] {
  const seen = new Set<string>();
  const out: WorkflowGraphEdge[] = [];
  for (const item of edges) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function interfaceNode(record: ExternalInterfaceRecord): WorkflowGraphNode {
  return {
    id: graphNodeId("interface", record.interfaceId),
    label: record.externalDepartmentOrRole,
    nodeType: record.interfaceType === "out_of_scope_external_process" ? "external" : "interface",
    description: record.whatIsTransferredOrRequired,
    lane: record.externalDepartmentOrRole,
    status: record.packageVisualConsumption.visualNodeStatus,
    markers: [record.interfaceType, record.materiality, record.recommendedAction],
    metadata: {
      interfaceId: record.interfaceId,
      confirmationStatus: record.confirmationStatus,
      materiality: record.materiality,
      selectedScopeRemainsPrimary: record.scopeBoundary.selectedScopeRemainsPrimary,
      externalWorkflowNotAnalyzed: record.scopeBoundary.externalWorkflowNotAnalyzed,
    },
  };
}

function markerNodes(
  items: string[],
  nodeType: "warning" | "unresolved",
  lane: string,
): WorkflowGraphNode[] {
  return items.map((item, index) => ({
    id: graphNodeId(nodeType, `${index}:${item}`),
    label: nodeType === "warning" ? `Warning ${index + 1}` : `Unresolved ${index + 1}`,
    nodeType,
    description: item,
    lane,
    status: nodeType === "warning" ? "warning" : "unresolved",
    markers: [nodeType],
  }));
}

function selectedLane(input: BuildWorkflowGraphInput): string {
  const fromInterface = input.externalInterfaces?.[0]?.selectedDepartmentSide;
  if (fromInterface) return fromInterface;
  return "Selected department / package scope";
}

export function buildWorkflowGraphFromInitialPackage(input: BuildWorkflowGraphInput): WorkflowGraph {
  const selected = selectedLane(input);
  const nodes: WorkflowGraphNode[] = [
    { id: "start", label: "Package Scope Start", nodeType: "start", lane: selected, status: "confirmed" },
  ];
  const edges: WorkflowGraphEdge[] = [];

  const stepNodes = input.assembledWorkflowDraft.steps.map((item) => elementNode(item, "step", selected));
  const sequenceNodes = input.assembledWorkflowDraft.sequence.map((item) => elementNode(item, "step", selected));
  const decisionNodes = input.assembledWorkflowDraft.decisions.map((item) => elementNode(item, "decision", selected));
  const handoffNodes = input.assembledWorkflowDraft.handoffs.map((item) => elementNode(item, "handoff", selected));
  const controlNodes = input.assembledWorkflowDraft.controls.map((item) => {
    const nodeType: WorkflowGraphNode["nodeType"] = item.label.toLowerCase().includes("approval") ? "approval" : "control";
    return elementNode(item, nodeType, selected);
  });
  const systemNodes = input.assembledWorkflowDraft.systemsTools.map((item) => elementNode(item, "system", selected));
  const variantNodes = input.assembledWorkflowDraft.variants.map((item) => elementNode(item, "note", selected));
  const warningNodes = markerNodes(input.initialWorkflowPackage.warningsCaveats, "warning", selected);
  const unresolvedNodes = markerNodes(input.assembledWorkflowDraft.unresolvedItems, "unresolved", selected);
  const interfaceNodes = (input.externalInterfaces ?? []).map(interfaceNode);
  const endNode: WorkflowGraphNode = { id: "end", label: "Package Scope End", nodeType: "end", lane: selected, status: "confirmed" };

  nodes.push(...stepNodes, ...sequenceNodes, ...decisionNodes, ...handoffNodes, ...controlNodes, ...systemNodes, ...variantNodes, ...interfaceNodes, ...warningNodes, ...unresolvedNodes, endNode);

  const primaryFlow = stepNodes.length > 0 ? stepNodes : sequenceNodes;
  const flowNodes = [...primaryFlow, ...decisionNodes, ...handoffNodes].filter((node) => node.id !== "start" && node.id !== "end");
  if (flowNodes.length > 0) {
    const firstFlowNode = flowNodes[0] as WorkflowGraphNode;
    const lastFlowNode = flowNodes[flowNodes.length - 1] as WorkflowGraphNode;
    edges.push(edge("start-to-first", "start", firstFlowNode.id));
    for (let index = 0; index < flowNodes.length - 1; index += 1) {
      const from = flowNodes[index] as WorkflowGraphNode;
      const to = flowNodes[index + 1] as WorkflowGraphNode;
      edges.push(edge(`${from.id}-to-${to.id}`, from.id, to.id, from.nodeType === "decision" ? "conditional" : "sequence"));
    }
    edges.push(edge("last-to-end", lastFlowNode.id, "end"));
  } else {
    edges.push(edge("start-to-end", "start", "end", "sequence", "No assembled steps available", "warning"));
  }

  const anchor = flowNodes.at(-1)?.id ?? "start";
  for (const node of controlNodes) edges.push(edge(`${anchor}-approval-${node.id}`, anchor, node.id, node.nodeType === "approval" ? "approval" : "dependency"));
  for (const node of systemNodes) edges.push(edge(`${anchor}-system-${node.id}`, anchor, node.id, "dependency"));
  for (const node of interfaceNodes) {
    const edgeType: WorkflowGraphEdge["edgeType"] = node.nodeType === "external" ? "dependency" : "handoff";
    edges.push(edge(`${anchor}-interface-${node.id}`, anchor, node.id, edgeType, "External interface", node.status === "confirmed" ? "confirmed" : "warning"));
  }
  for (const node of warningNodes) edges.push(edge(`${anchor}-warning-${node.id}`, anchor, node.id, "reference", "Warning/caveat", "warning"));
  for (const node of unresolvedNodes) edges.push(edge(`${anchor}-unresolved-${node.id}`, anchor, node.id, "reference", "Unresolved item", "unresolved"));

  const lanes = [
    { id: graphNodeId("lane", selected), label: selected },
    ...(input.externalInterfaces ?? []).map((record) => ({
      id: graphNodeId("lane", record.externalDepartmentOrRole),
      label: record.externalDepartmentOrRole,
      description: "External/interface lane only; scope is not expanded.",
    })),
  ];

  return {
    graphId: input.graphId ?? `workflow_graph:${safeIdPart(input.initialWorkflowPackage.packageId)}`,
    title: `Workflow Visual — ${input.initialWorkflowPackage.packageId}`,
    description: "Generated from WDE Pass 6C package/workflow data. Visual renderers do not own workflow truth.",
    version: "1.0.0",
    graphType: "workflow",
    direction: input.direction ?? "TD",
    nodes: uniqueGraphNodes(nodes),
    edges: uniqueGraphEdges(edges),
    lanes,
    legend: [
      { symbol: "warning", meaning: "Warning or caveat retained from WDE package data" },
      { symbol: "unresolved", meaning: "Unresolved item retained from WDE workflow draft" },
      { symbol: "interface", meaning: "Cross-department/external interface; scope not expanded" },
    ],
    sourceRefs: [
      input.initialWorkflowPackage.packageId,
      input.initialWorkflowPackage.workflowReadinessResultId,
      input.assembledWorkflowDraft.draftId,
      ...(input.externalInterfaces ?? []).map((record) => record.interfaceId),
    ],
    warnings: input.initialWorkflowPackage.warningsCaveats,
    unresolvedItems: input.assembledWorkflowDraft.unresolvedItems,
    metadata: {
      caseId: input.initialWorkflowPackage.caseId,
      packageId: input.initialWorkflowPackage.packageId,
      workflowReadinessResultId: input.initialWorkflowPackage.workflowReadinessResultId,
      assembledWorkflowDraftId: input.assembledWorkflowDraft.draftId,
      visualTruthBoundary: "WDE owns workflow truth and package eligibility; workflow-visual-core validates and renders only.",
      selectedScopeRemainsPrimary: true,
    },
  };
}

export function buildPackageVisuals(graph: WorkflowGraph): BuildPackageVisualsResult {
  const validation = validateWorkflowGraph(graph);
  if (!validation.ok) return { ok: false, errors: validation.errors };
  const workflowGraphJson = validation.data;
  return {
    ok: true,
    workflowGraphJson,
    workflowMermaid: toMermaid(workflowGraphJson),
    workflowReactFlowModel: toReactFlow(workflowGraphJson),
  };
}

export function generatePackageVisuals(
  input: GeneratePackageVisualsInput,
  repos: { workflowGraphRecords?: WorkflowGraphRecordRepository } = {},
): GeneratePackageVisualsResult {
  const now = input.now ?? new Date().toISOString();
  const graph = buildWorkflowGraphFromInitialPackage(input);
  const visuals = buildPackageVisuals(graph);
  const baseRecord = {
    visualRecordId: input.visualRecordId ?? `workflow_visual:${safeIdPart(input.initialWorkflowPackage.packageId)}`,
    caseId: input.initialWorkflowPackage.caseId,
    assembledWorkflowDraftId: input.assembledWorkflowDraft.draftId,
    workflowGraphJson: graph as unknown as WorkflowGraphRecord["workflowGraphJson"],
    workflowMermaid: "",
    workflowReactFlowModel: {},
    visualValidationErrors: [],
  };

  if (!visuals.ok) {
    const invalidRecord: StoredWorkflowGraphRecord = {
      ...baseRecord,
      visualValidationErrors: visuals.errors.map((error) => `${error.field}: ${error.message}`),
      createdAt: now,
      updatedAt: now,
    };
    if (input.persist !== false) repos.workflowGraphRecords?.save(invalidRecord);
    return { ok: false, visualRecord: invalidRecord, errors: visuals.errors };
  }

  const visualRecord: StoredWorkflowGraphRecord = {
    ...baseRecord,
    workflowGraphJson: visuals.workflowGraphJson as unknown as WorkflowGraphRecord["workflowGraphJson"],
    workflowMermaid: visuals.workflowMermaid,
    workflowReactFlowModel: visuals.workflowReactFlowModel as unknown as Record<string, unknown>,
    createdAt: now,
    updatedAt: now,
  };
  if (input.persist !== false) repos.workflowGraphRecords?.save(visualRecord);
  return { ok: true, visualRecord, visuals };
}

// ---------------------------------------------------------------------------
// createInitialPackage
// ---------------------------------------------------------------------------

/**
 * Validate an InitialPackageRecord payload, reject duplicate IDs, persist a
 * StoredInitialPackageRecord with server-assigned createdAt.
 *
 * The schema enforces §21.3 (five outward fields required), §21.4 (document
 * reference implication optional at outward level), §21.5 (status enum),
 * §21.8 (outward has no sevenConditionChecklist field — structurally absent),
 * and §21.11 (admin sub-object contains the seven-condition checklist plus
 * readiness reasoning).
 */
export function createInitialPackage(
  payload: unknown,
  repo: InitialPackageRepository,
): InitialPackageResult {
  const result = validateInitialPackageRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return {
      ok: false,
      error: `Invalid InitialPackageRecord: ${messages}`,
    };
  }

  const record: InitialPackageRecord = result.value;

  const existing = repo.findById(record.initialPackageId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Initial package with id '${record.initialPackageId}' already exists.`,
    };
  }

  const stored: StoredInitialPackageRecord = {
    ...record,
    createdAt: new Date().toISOString(),
  };

  repo.save(stored);
  return { ok: true, initialPackage: stored };
}

// ---------------------------------------------------------------------------
// get / list helpers
// ---------------------------------------------------------------------------

export function getInitialPackage(
  initialPackageId: string,
  repo: InitialPackageRepository,
): StoredInitialPackageRecord | null {
  return repo.findById(initialPackageId);
}

export function listInitialPackages(
  repo: InitialPackageRepository,
): StoredInitialPackageRecord[] {
  return repo.findAll();
}

export function listInitialPackagesByCaseId(
  caseId: string,
  repo: InitialPackageRepository,
): StoredInitialPackageRecord[] {
  return repo.findByCaseId(caseId);
}

export function listInitialPackagesByEvaluationId(
  evaluationId: string,
  repo: InitialPackageRepository,
): StoredInitialPackageRecord[] {
  return repo.findByEvaluationId(evaluationId);
}
