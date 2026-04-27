import { NextResponse } from "next/server";
import { generatePass6Output } from "@workflow/packages-output";
import { store } from "../../../../lib/store";

interface PackageRequestBody {
  action?: string;
  workflowReadinessResultId?: string;
  prePackageGateResultId?: string;
  documentDraftType?: "sop_draft" | "policy_draft" | "sla_supporting_reference_draft" | "work_instruction_draft" | "role_responsibility_guidance_draft" | "questionnaire_inquiry_set_draft";
  requestDraft?: string | boolean;
  approvedBy?: string;
  purpose?: string;
}

function boundary() {
  return {
    notFinalPackage: true,
    noReleaseOccurred: true,
    noVisualGenerated: true,
    noWorkflowGraphJson: true,
    noMermaidGenerated: true,
    noReactFlowGenerated: true,
    noProviderCalls: true,
    noPass7RecordsCreated: true,
  };
}

export async function GET() {
  const packages = store.initialWorkflowPackages.findAll()
    .map((record) => ({
      outputType: "initial_workflow_package",
      id: record.packageId,
      caseId: record.caseId,
      status: record.packageStatus,
      workflowReadinessResultId: record.workflowReadinessResultId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  const briefs = store.workflowGapClosureBriefs.findAll()
    .map((record) => ({
      outputType: "workflow_gap_closure_brief",
      id: record.briefId,
      caseId: record.caseId,
      status: "brief_created",
      workflowReadinessResultId: undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  const drafts = store.draftOperationalDocuments.findAll()
    .map((record) => ({
      outputType: "draft_operational_document",
      id: record.draftId,
      caseId: record.caseId,
      status: record.draftStatus,
      workflowReadinessResultId: undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  return NextResponse.json({
    boundary: boundary(),
    outputs: [...packages, ...briefs, ...drafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body: PackageRequestBody = isJson
    ? await request.json() as PackageRequestBody
    : Object.fromEntries((await request.formData()).entries()) as PackageRequestBody;

  if (body.action !== "generate-6c-output") {
    return NextResponse.json({ error: "Unsupported Pass 6 package action." }, { status: 400 });
  }
  if (!body.workflowReadinessResultId) {
    return NextResponse.json({ error: "workflowReadinessResultId is required." }, { status: 400 });
  }

  const readiness = store.workflowReadinessResults.findById(body.workflowReadinessResultId);
  if (!readiness) return NextResponse.json({ error: "WorkflowReadinessResult not found." }, { status: 404 });
  const draft = store.assembledWorkflowDrafts.findById(readiness.assembledWorkflowDraftId);
  if (!draft) return NextResponse.json({ error: "AssembledWorkflowDraft not found." }, { status: 404 });
  const gate = body.prePackageGateResultId
    ? store.prePackageGateResults.findById(body.prePackageGateResultId) ?? undefined
    : store.prePackageGateResults.findByCaseId(readiness.caseId)
      .filter((candidate) => candidate.workflowReadinessResultId === readiness.resultId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const interfaces = store.externalInterfaceRecords.findByCaseId(readiness.caseId);

  const result = generatePass6Output({
    workflowReadinessResult: readiness,
    assembledWorkflowDraft: draft,
    prePackageGateResult: gate,
    externalInterfaces: interfaces,
    draftRequest: {
      requested: body.requestDraft === true || body.requestDraft === "true",
      documentDraftType: body.documentDraftType,
      approvedBy: body.approvedBy || "admin",
      purpose: body.purpose,
    },
  }, {
    initialWorkflowPackages: store.initialWorkflowPackages,
    workflowGapClosureBriefs: store.workflowGapClosureBriefs,
    draftOperationalDocuments: store.draftOperationalDocuments,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  if (!isJson) {
    const id = result.initialWorkflowPackage?.packageId
      ?? result.workflowGapClosureBrief?.briefId
      ?? result.draftOperationalDocument?.draftId
      ?? "";
    return NextResponse.redirect(new URL(`/pass6/packages/${id}`, request.url), { status: 303 });
  }
  return NextResponse.json({ boundary: boundary(), result });
}
