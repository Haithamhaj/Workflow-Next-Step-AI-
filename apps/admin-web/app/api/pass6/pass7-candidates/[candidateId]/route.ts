import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { candidateId: string } },
) {
  const candidate = store.pass7ReviewCandidates.findById(params.candidateId);
  if (!candidate) {
    return NextResponse.json({ error: "Pass7ReviewCandidate not found." }, { status: 404 });
  }
  return NextResponse.json({
    boundary: {
      candidateSeamOnly: true,
      noPass7DiscussionStarted: true,
      noIssueThreadCreated: true,
      noReviewActionTaken: true,
      noFinalDecisionMade: true,
      noPackageOrReleaseStateChanged: true,
      noProviderCalls: true,
    },
    candidate,
  });
}
