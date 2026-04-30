import { NextResponse } from "next/server";
import { updateFramingSourceStatus } from "@workflow/company-framing";
import { store } from "../../../../../../lib/store";

const allowedStatuses = new Set([
  "uploaded",
  "processing",
  "processed",
  "needs_review",
  "failed",
  "superseded",
]);

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
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
  const status = stringFrom(b.status);
  if (!status || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Valid FramingSource status is required." }, { status: 400 });
  }

  const result = updateFramingSourceStatus(
    params.id,
    status as never,
    store.framingSources,
    { failureReason: stringFrom(b.failureReason) },
  );

  if (!result.ok) {
    const statusCode = result.error.code === "source_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: statusCode });
  }

  return NextResponse.json(result.source);
}

export const POST = PATCH;
