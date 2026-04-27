import { NextResponse } from "next/server";
import { createPass7ReviewCandidatesFromRepositories } from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

interface CandidateRequestBody {
  action?: string;
  caseId?: string;
  workflowReadinessResultId?: string;
  prePackageGateResultId?: string;
  candidateId?: string;
  status?: "candidate_open" | "accepted_for_pass7_later" | "dismissed" | "deferred";
  adminNote?: string;
}

function boundary() {
  return {
    candidateSeamOnly: true,
    noPass7DiscussionStarted: true,
    noIssueThreadCreated: true,
    noReviewActionTaken: true,
    noFinalDecisionMade: true,
    noPackageOrReleaseStateChanged: true,
    noProviderCalls: true,
  };
}

export async function GET() {
  const candidates = store.pass7ReviewCandidates.findAll()
    .map((candidate) => ({
      candidateId: candidate.candidateId,
      caseId: candidate.caseId,
      sourceType: candidate.sourceType,
      sourceId: candidate.sourceId,
      sourcePass6RecordType: candidate.sourcePass6RecordType,
      issueType: candidate.issueType,
      reason: candidate.reason,
      severityMateriality: candidate.severityMateriality,
      recommendedReviewRoute: candidate.recommendedReviewRoute,
      status: candidate.status,
      updatedAt: candidate.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return NextResponse.json({ boundary: boundary(), candidates });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body: CandidateRequestBody = isJson
    ? await request.json() as CandidateRequestBody
    : Object.fromEntries((await request.formData()).entries()) as CandidateRequestBody;

  if (body.action === "create-from-pass6-context") {
    const result = createPass7ReviewCandidatesFromRepositories({
      caseId: body.caseId || undefined,
      workflowReadinessResultId: body.workflowReadinessResultId || undefined,
      prePackageGateResultId: body.prePackageGateResultId || undefined,
    }, {
      differenceInterpretations: store.differenceInterpretations,
      workflowReadinessResults: store.workflowReadinessResults,
      prePackageGateResults: store.prePackageGateResults,
      externalInterfaceRecords: store.externalInterfaceRecords,
      pass7ReviewCandidates: store.pass7ReviewCandidates,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    if (!isJson) return NextResponse.redirect(new URL("/pass6/pass7-candidates", request.url), { status: 303 });
    return NextResponse.json({ boundary: boundary(), result });
  }

  if (body.action === "update-status") {
    if (!body.candidateId) return NextResponse.json({ error: "candidateId is required." }, { status: 400 });
    if (!body.status || body.status === "candidate_open") return NextResponse.json({ error: "status must be accepted_for_pass7_later, dismissed, or deferred." }, { status: 400 });

    const adminDecision =
      body.status === "accepted_for_pass7_later" ? "accepted_for_later_pass7"
        : body.status === "dismissed" ? "dismissed"
          : "deferred";
    const updated = store.pass7ReviewCandidates.update(body.candidateId, {
      status: body.status,
      adminDecision,
      adminNote: body.adminNote || undefined,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) return NextResponse.json({ error: "Pass7ReviewCandidate not found." }, { status: 404 });
    if (!isJson) return NextResponse.redirect(new URL(`/pass6/pass7-candidates/${updated.candidateId}`, request.url), { status: 303 });
    return NextResponse.json({ boundary: boundary(), candidate: updated });
  }

  return NextResponse.json({ error: "Unsupported Pass 7 candidate seam action." }, { status: 400 });
}
