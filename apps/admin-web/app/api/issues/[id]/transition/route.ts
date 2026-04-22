import { NextResponse } from "next/server";
import { validateReviewState } from "@workflow/contracts";
import { transitionReviewIssue } from "@workflow/review-issues";
import { store } from "../../../../../lib/store";

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const payload = body as { toState?: unknown };
  const validation = validateReviewState(payload.toState);
  if (!validation.ok) {
    const messages = validation.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return NextResponse.json(
      { error: `Invalid ReviewState: ${messages}` },
      { status: 400 },
    );
  }

  const outcome = transitionReviewIssue(
    context.params.id,
    validation.value,
    store.reviewIssues,
  );
  if (!outcome.ok) {
    const status = outcome.error.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.issue);
}
