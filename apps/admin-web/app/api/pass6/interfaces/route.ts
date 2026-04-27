import { NextResponse } from "next/server";
import { registerExternalInterfacesFromRepositories } from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

interface InterfaceRequestBody {
  action?: string;
  workflowDraftId?: string;
  workflowReadinessResultId?: string;
  prePackageGateResultId?: string;
  caseId?: string;
  selectedDepartmentSide?: string;
  interfaceId?: string;
  confirmationStatus?: "confirmed" | "assumed" | "unclear" | "unvalidated" | "disputed";
  materiality?: "non_material" | "warning" | "blocker_candidate" | "blocker";
  adminNote?: string;
}

function boundary() {
  return {
    selectedScopeRemainsPrimary: true,
    noScopeExpansion: true,
    noExternalOutreach: true,
    noExternalWorkflowAnalysis: true,
    noPackageGenerated: true,
    noVisualGraphCreated: true,
    noPass7IssueCreated: true,
    noProviderCalls: true,
  };
}

export async function GET() {
  const interfaces = store.externalInterfaceRecords.findAll()
    .map((record) => ({
      interfaceId: record.interfaceId,
      caseId: record.caseId,
      interfaceType: record.interfaceType,
      externalDepartmentOrRole: record.externalDepartmentOrRole,
      selectedDepartmentSide: record.selectedDepartmentSide,
      confirmationStatus: record.confirmationStatus,
      materiality: record.materiality,
      recommendedAction: record.recommendedAction,
      whereItOccursInWorkflow: record.whereItOccursInWorkflow,
      relatedWorkflowDraftId: record.relatedWorkflowDraftId,
      relatedReadinessResultId: record.relatedReadinessResultId,
      relatedGateResultId: record.relatedGateResultId,
      updatedAt: record.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ boundary: boundary(), interfaces });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body: InterfaceRequestBody = isJson
    ? await request.json() as InterfaceRequestBody
    : Object.fromEntries((await request.formData()).entries()) as InterfaceRequestBody;

  if (body.action === "register-from-context") {
    const result = registerExternalInterfacesFromRepositories({
      workflowDraftId: body.workflowDraftId || undefined,
      workflowReadinessResultId: body.workflowReadinessResultId || undefined,
      prePackageGateResultId: body.prePackageGateResultId || undefined,
      caseId: body.caseId || undefined,
      selectedDepartmentSide: body.selectedDepartmentSide || undefined,
    }, {
      assembledWorkflowDrafts: store.assembledWorkflowDrafts,
      workflowReadinessResults: store.workflowReadinessResults,
      prePackageGateResults: store.prePackageGateResults,
      externalInterfaceRecords: store.externalInterfaceRecords,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!isJson) {
      return NextResponse.redirect(new URL("/pass6/interfaces", request.url), { status: 303 });
    }
    return NextResponse.json({ boundary: boundary(), result });
  }

  if (body.action === "mark-interface") {
    if (!body.interfaceId) return NextResponse.json({ error: "interfaceId is required." }, { status: 400 });
    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (body.confirmationStatus) updates.confirmationStatus = body.confirmationStatus;
    if (body.materiality) updates.materiality = body.materiality;
    if (body.adminNote) updates.metadata = {
      ...(store.externalInterfaceRecords.findById(body.interfaceId)?.metadata ?? {}),
      notes: body.adminNote,
    };
    const updated = store.externalInterfaceRecords.update(body.interfaceId, updates);
    if (!updated) return NextResponse.json({ error: "ExternalInterfaceRecord not found." }, { status: 404 });
    if (!isJson) {
      return NextResponse.redirect(new URL(`/pass6/interfaces/${updated.interfaceId}`, request.url), { status: 303 });
    }
    return NextResponse.json({ boundary: boundary(), interface: updated });
  }

  return NextResponse.json({ error: "Unsupported Pass 6 interface action." }, { status: 400 });
}
