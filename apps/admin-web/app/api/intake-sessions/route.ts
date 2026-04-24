import { NextResponse } from "next/server";
import { createIntakeSession, listIntakeSessionsByCase } from "@workflow/sources-context";
import { store } from "../../../lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");
  if (caseId) {
    const sessions = listIntakeSessionsByCase(caseId, store.intakeSessions);
    return NextResponse.json(sessions);
  }
  const sessions = store.intakeSessions.findAll();
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const b = body as Record<string, unknown>;
    const session = createIntakeSession(
      {
        sessionId: typeof b.sessionId === "string" && b.sessionId.trim()
          ? b.sessionId.trim()
          : `intake_${crypto.randomUUID()}`,
        caseId: String(b.caseId ?? ""),
        bucket: (b.bucket as "company" | "department") ?? "company",
        defaultProvider: "google",
        availableProviders: ["google", "openai"],
      },
      store.intakeSessions,
    );
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("Invalid") ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
