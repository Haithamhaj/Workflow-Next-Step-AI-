import { NextResponse } from "next/server";
import { getIntakeSession, updateIntakeSessionStatus, setPrimaryDepartment } from "@workflow/sources-context";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const session = getIntakeSession(params.id, store.intakeSessions);
  if (!session) {
    return NextResponse.json({ error: "Intake session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;

  try {
    if (typeof b.status === "string") {
      if (!["intake_started", "sources_received", "batch_summary_ready"].includes(b.status)) {
        return NextResponse.json(
          { error: "This status is outside Pass 2 Phase 2 scope." },
          { status: 400 },
        );
      }
      const updated = updateIntakeSessionStatus(params.id, b.status as never, store.intakeSessions);
      return NextResponse.json(updated);
    }
    if (typeof b.primaryDepartment === "string") {
      const updated = setPrimaryDepartment(params.id, b.primaryDepartment, store.intakeSessions);
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "No recognized update field" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
