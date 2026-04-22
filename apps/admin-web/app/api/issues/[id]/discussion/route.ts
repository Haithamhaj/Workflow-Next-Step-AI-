import { NextResponse } from "next/server";
import { addDiscussionEntry } from "@workflow/review-issues";
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

  const payload = body as {
    entryId?: unknown;
    authorType?: unknown;
    message?: unknown;
  };

  if (
    typeof payload.entryId !== "string" ||
    (payload.authorType !== "admin" && payload.authorType !== "system") ||
    typeof payload.message !== "string"
  ) {
    return NextResponse.json(
      {
        error:
          "Discussion payload must include string entryId, authorType ('admin'|'system'), and string message.",
      },
      { status: 400 },
    );
  }

  const outcome = addDiscussionEntry(
    context.params.id,
    {
      entryId: payload.entryId,
      authorType: payload.authorType,
      message: payload.message,
    },
    store.reviewIssues,
  );

  if (!outcome.ok) {
    const status = outcome.error.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.issue);
}
