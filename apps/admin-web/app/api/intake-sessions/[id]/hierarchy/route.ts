import { NextResponse } from "next/server";
import {
  approveStructuralHierarchy,
  calculateHierarchyReadinessSnapshot,
  createPastedHierarchyIntake,
  createUploadedDocumentHierarchyIntake,
  getHierarchyFoundationState,
  parsePastedHierarchyText,
  saveManualHierarchyDraft,
  type HierarchyNodeRecord,
  type HierarchySecondaryRelationship,
} from "@workflow/hierarchy-intake";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSessions: store.intakeSessions,
    hierarchyIntakes: store.hierarchyIntakes,
    hierarchyDrafts: store.hierarchyDrafts,
    hierarchyCorrections: store.hierarchyCorrections,
    approvedHierarchySnapshots: store.approvedHierarchySnapshots,
    hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
  };
}

function payload(sessionId: string) {
  return getHierarchyFoundationState(sessionId, repos());
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return NextResponse.json(payload(params.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";

  try {
    if (action === "create-pasted-intake") {
      const intake = createPastedHierarchyIntake({
        sessionId: params.id,
        pastedText: typeof body.pastedText === "string" ? body.pastedText : "",
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), intake }, { status: 201 });
    }

    if (action === "create-uploaded-document-intake") {
      const intake = createUploadedDocumentHierarchyIntake({
        sessionId: params.id,
        sourceId: typeof body.sourceId === "string" ? body.sourceId : "",
        artifactId: typeof body.artifactId === "string" ? body.artifactId : undefined,
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), intake }, { status: 201 });
    }

    if (action === "parse-pasted-text") {
      const pastedText = typeof body.pastedText === "string" ? body.pastedText : "";
      return NextResponse.json({ nodes: parsePastedHierarchyText(pastedText) });
    }

    if (action === "save-manual-draft") {
      const nodes = Array.isArray(body.nodes) ? body.nodes as HierarchyNodeRecord[] : [];
      const secondaryRelationships = Array.isArray(body.secondaryRelationships)
        ? body.secondaryRelationships as HierarchySecondaryRelationship[]
        : [];
      const draft = saveManualHierarchyDraft({
        sessionId: params.id,
        nodes,
        secondaryRelationships,
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
        correctionNote: typeof body.correctionNote === "string" ? body.correctionNote : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), draft }, { status: 201 });
    }

    if (action === "approve-structural-snapshot") {
      const approvedSnapshot = approveStructuralHierarchy({
        sessionId: params.id,
        approvedBy: typeof body.approvedBy === "string" ? body.approvedBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), approvedSnapshot }, { status: 201 });
    }

    if (action === "calculate-readiness") {
      const readinessSnapshot = calculateHierarchyReadinessSnapshot(params.id, repos());
      return NextResponse.json({ ...payload(params.id), readinessSnapshot }, { status: 201 });
    }

    return NextResponse.json({
      error: "Unsupported hierarchy action.",
      supportedActions: [
        "create-pasted-intake",
        "create-uploaded-document-intake",
        "parse-pasted-text",
        "save-manual-draft",
        "approve-structural-snapshot",
        "calculate-readiness",
      ],
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      ...payload(params.id),
      error: error instanceof Error ? error.message : String(error),
    }, { status: 400 });
  }
}
