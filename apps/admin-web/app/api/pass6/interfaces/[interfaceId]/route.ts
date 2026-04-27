import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

interface RouteContext {
  params: {
    interfaceId: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const record = store.externalInterfaceRecords.findById(params.interfaceId);
  if (!record) {
    return NextResponse.json({ error: "ExternalInterfaceRecord not found." }, { status: 404 });
  }
  return NextResponse.json({
    boundary: {
      selectedScopeRemainsPrimary: true,
      noScopeExpansion: true,
      noExternalOutreach: true,
      noExternalWorkflowAnalysis: true,
      noPackageGenerated: true,
      noVisualGraphCreated: true,
      noPass7IssueCreated: true,
      noProviderCalls: true,
    },
    interface: record,
  });
}
