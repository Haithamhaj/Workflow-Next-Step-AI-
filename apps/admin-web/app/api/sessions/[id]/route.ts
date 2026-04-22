import { NextResponse } from "next/server";
import { getSession } from "@workflow/sessions-clarification";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession(params.id, store.sessions);
  if (session === null) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}
