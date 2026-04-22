import { NextResponse } from "next/server";
import { getReviewIssue } from "@workflow/review-issues";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  const issue = getReviewIssue(context.params.id, store.reviewIssues);
  if (issue === null) {
    return NextResponse.json(
      { error: `Review issue '${context.params.id}' not found.` },
      { status: 404 },
    );
  }

  return NextResponse.json(issue);
}
