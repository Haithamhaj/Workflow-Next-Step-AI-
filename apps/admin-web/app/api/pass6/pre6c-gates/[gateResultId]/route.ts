import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

interface RouteContext {
  params: {
    gateResultId: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const gate = store.prePackageGateResults.findById(params.gateResultId);
  if (!gate) {
    return NextResponse.json({ error: "PrePackageGateResult not found." }, { status: 404 });
  }

  return NextResponse.json({
    boundary: {
      noSendingOccurred: true,
      noAnswerCollected: true,
      noEvidenceUpdated: true,
      noPackageGenerated: true,
      noPass7IssueCreated: true,
      noProviderCalls: true,
    },
    gate,
  });
}
