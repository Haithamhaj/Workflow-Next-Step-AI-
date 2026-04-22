import { NextResponse } from "next/server";
import { createSession, listSessions } from "@workflow/sessions-clarification";
import { store } from "../../../lib/store";

export async function GET() {
  const sessions = listSessions(store.sessions);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const outcome = createSession(body, store.sessions);

  if (!outcome.ok) {
    const status = outcome.error.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.session, { status: 201 });
}
