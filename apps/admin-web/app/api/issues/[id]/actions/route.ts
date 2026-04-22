import { NextResponse } from "next/server";
import {
  ReviewActionType,
  applyReviewAction,
  type ReviewActionType as ReviewActionTypeValue,
} from "@workflow/review-issues";
import { store } from "../../../../../lib/store";

const ACTION_TYPES = new Set(Object.values(ReviewActionType));

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
    actionId?: unknown;
    actionType?: unknown;
    actor?: unknown;
    note?: unknown;
  };

  const actionType = payload.actionType;
  if (
    typeof payload.actionId !== "string" ||
    typeof actionType !== "string" ||
    !ACTION_TYPES.has(actionType as ReviewActionTypeValue) ||
    typeof payload.actor !== "string" ||
    (payload.note !== undefined && typeof payload.note !== "string")
  ) {
    return NextResponse.json(
      {
        error:
          "Action payload must include string actionId, valid controlled actionType, string actor, and optional string note.",
      },
      { status: 400 },
    );
  }

  const outcome = applyReviewAction(
    context.params.id,
    {
        actionId: payload.actionId,
        actionType: actionType as ReviewActionTypeValue,
        actor: payload.actor,
        note: payload.note,
      },
    store.reviewIssues,
  );

  if (!outcome.ok) {
    const status = outcome.error.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.issue);
}
