import { NextResponse } from "next/server";
import { validateReleaseState } from "@workflow/contracts";
import { isValidReleaseTransition } from "@workflow/core-state";
import { getFinalPackage, updateFinalPackage } from "@workflow/packages-output";
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
  const validation = validateReleaseState(payload.toState);
  if (!validation.ok) {
    const messages = validation.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return NextResponse.json(
      { error: `Invalid ReleaseState: ${messages}` },
      { status: 400 },
    );
  }

  const existing = getFinalPackage(context.params.id, store.finalPackages);
  if (existing === null) {
    return NextResponse.json(
      { error: "Final package not found" },
      { status: 404 },
    );
  }

  if (!isValidReleaseTransition(existing.packageReleaseState, validation.value)) {
    return NextResponse.json(
      {
        error: `Invalid release transition: '${existing.packageReleaseState}' → '${validation.value}' is not allowed (§28.16).`,
      },
      { status: 400 },
    );
  }

  const outcome = updateFinalPackage(
    context.params.id,
    { packageReleaseState: validation.value },
    store.finalPackages,
  );
  if (!outcome.ok) {
    return NextResponse.json({ error: outcome.error }, { status: 400 });
  }

  return NextResponse.json(outcome.finalPackage);
}
