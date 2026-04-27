import { NextResponse } from "next/server";
import { runPre6CGateFromRepositories } from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

interface GateRequestBody {
  action?: string;
  workflowReadinessResultId?: string;
  gateResultId?: string;
  approvedBy?: string;
  approvalNote?: string;
  reasonForProceeding?: string;
}

function redirectWithError(request: Request, message: string) {
  const url = new URL("/pass6/pre6c-gates", request.url);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET() {
  const gates = store.prePackageGateResults.findAll()
    .map((gate) => ({
      gateResultId: gate.gateResultId,
      caseId: gate.caseId,
      workflowReadinessResultId: gate.workflowReadinessResultId,
      gateDecision: gate.gateDecision,
      clarificationNeedCount: gate.clarificationNeeds.length,
      inquiryPacketCount: gate.inquiryPackets.length,
      createdAt: gate.createdAt,
      updatedAt: gate.updatedAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({
    boundary: {
      noSendingOccurred: true,
      noAnswerCollected: true,
      noEvidenceUpdated: true,
      noPackageGenerated: true,
      noPass7IssueCreated: true,
      noProviderCalls: true,
    },
    gates,
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  try {
    const body: GateRequestBody = isJson
      ? await request.json() as GateRequestBody
      : Object.fromEntries((await request.formData()).entries()) as GateRequestBody;

    if (body.action !== "run-gate" && body.action !== "approve-proceed-with-warnings") {
      return NextResponse.json({ error: "Unsupported Pass 6 Pre-6C gate action." }, { status: 400 });
    }
    if (!body.workflowReadinessResultId) {
      const message = "workflowReadinessResultId is required.";
      return isJson ? NextResponse.json({ error: message }, { status: 400 }) : redirectWithError(request, message);
    }

    const result = runPre6CGateFromRepositories(body.workflowReadinessResultId, {
      workflowReadinessResults: store.workflowReadinessResults,
      assembledWorkflowDrafts: store.assembledWorkflowDrafts,
      differenceInterpretations: store.differenceInterpretations,
      prePackageGateResults: store.prePackageGateResults,
      clarificationNeeds: store.clarificationNeeds,
      inquiryPackets: store.inquiryPackets,
    }, {
      gateResultId: body.gateResultId,
      proceedWithWarningsApproval: body.action === "approve-proceed-with-warnings" ? {
        approvedBy: body.approvedBy || "admin",
        approvalNote: body.approvalNote || "Proceed with warnings approved from admin surface.",
        reasonForProceeding: body.reasonForProceeding || "Admin accepted visible limitations for later 6C.",
      } : undefined,
    });

    if (!result.ok) {
      return isJson
        ? NextResponse.json({ error: result.error }, { status: 400 })
        : redirectWithError(request, result.error);
    }

    if (!isJson) {
      return NextResponse.redirect(new URL(`/pass6/pre6c-gates/${result.gateResult.gateResultId}`, request.url), { status: 303 });
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
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
