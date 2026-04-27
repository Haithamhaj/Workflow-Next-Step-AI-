import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

interface RouteContext {
  params: {
    outputId: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const initialPackage = store.initialWorkflowPackages.findById(params.outputId);
  if (initialPackage) return NextResponse.json({ outputType: "initial_workflow_package", output: initialPackage });
  const brief = store.workflowGapClosureBriefs.findById(params.outputId);
  if (brief) return NextResponse.json({ outputType: "workflow_gap_closure_brief", output: brief });
  const draft = store.draftOperationalDocuments.findById(params.outputId);
  if (draft) return NextResponse.json({ outputType: "draft_operational_document", output: draft });
  return NextResponse.json({ error: "Pass 6 output not found." }, { status: 404 });
}
