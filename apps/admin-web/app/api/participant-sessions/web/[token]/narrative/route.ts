import { NextResponse } from "next/server";
import { submitWebSessionFirstNarrative } from "@workflow/participant-sessions";
import { store } from "../../../../../../lib/store";

const repos = {
  sessionAccessTokens: store.sessionAccessTokens,
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
};

function statusFor(code: string): number {
  if (code === "narrative_already_submitted") return 409;
  if (code === "empty_narrative") return 400;
  if (code === "token_not_found" || code === "session_not_found") return 404;
  if (
    code === "token_expired" ||
    code === "token_revoked" ||
    code === "token_completed" ||
    code === "token_blocked_review_required" ||
    code === "channel_type_mismatch"
  ) {
    return 403;
  }
  return 400;
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const narrativeText =
    typeof body === "object" &&
    body !== null &&
    "narrativeText" in body &&
    typeof body.narrativeText === "string"
      ? body.narrativeText
      : "";

  const result = submitWebSessionFirstNarrative(params.token, narrativeText, repos);
  if (!result.ok) {
    const first = result.errors[0];
    return NextResponse.json(
      {
        error: first?.message ?? "Unable to submit first narrative.",
        code: first?.code ?? "unknown_error",
        existingEvidenceItemId: result.existingEvidenceItemId,
      },
      { status: statusFor(first?.code ?? "unknown_error") },
    );
  }

  return NextResponse.json(
    {
      participantSession: result.participantSession,
      rawEvidenceItem: result.rawEvidenceItem,
    },
    { status: 201 },
  );
}
