/**
 * Dev-only endpoint: seeds an InterpretationSnapshot with caller-supplied
 * conditionInterpretations so that enforcement paths (blocking confirmations,
 * adminNote, hard-stop) can be proven without a real ANTHROPIC_API_KEY.
 * Not wired into any production surface.
 */
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import type { InterpretationSnapshot } from "@workflow/persistence";
import type { EvaluationConditions, EvaluationOutcome } from "@workflow/contracts";
import { store } from "../../../../lib/store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const {
    conditions,
    outcome,
    conditionInterpretations = {},
    synthesisContext,
  } = body as Record<string, unknown>;

  if (typeof conditions !== "object" || conditions === null) {
    return NextResponse.json(
      { error: "conditions required." },
      { status: 400 },
    );
  }
  if (typeof outcome !== "string") {
    return NextResponse.json({ error: "outcome required." }, { status: 400 });
  }

  const snapshotId = randomUUID();
  const snapshot: InterpretationSnapshot = {
    snapshotId,
    conditionInterpretations: conditionInterpretations as InterpretationSnapshot["conditionInterpretations"],
    basis: {
      conditions: conditions as EvaluationConditions,
      outcome: outcome as EvaluationOutcome,
      synthesisContext:
        typeof synthesisContext === "string" ? synthesisContext : undefined,
    },
    createdAt: new Date().toISOString(),
  };

  store.snapshots.save(snapshot);

  return NextResponse.json({ snapshotId }, { status: 201 });
}
