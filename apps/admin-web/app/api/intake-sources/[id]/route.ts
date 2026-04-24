import { NextResponse } from "next/server";
import { getIntakeSource, updateIntakeSourceStatus } from "@workflow/sources-context";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const source = getIntakeSource(params.id, store.intakeSources);
  if (!source) {
    return NextResponse.json({ error: "Intake source not found" }, { status: 404 });
  }
  const hasFileBytes = store.fileStore.has(params.id);
  return NextResponse.json({ ...source, hasFileBytes });
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
      if (b.status === "extracting" || b.status === "read") {
        return NextResponse.json(
          { error: "Provider extraction statuses are deferred until Phase 3." },
          { status: 400 },
        );
      }
      const updated = updateIntakeSourceStatus(params.id, b.status as never, store.intakeSources);
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: "No recognized update field" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
