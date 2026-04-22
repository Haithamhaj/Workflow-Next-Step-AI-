import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { generateEvaluationInterpretation } from "@workflow/integrations";
import type { InterpretationSnapshot } from "@workflow/persistence";
import type { EvaluationConditions, EvaluationOutcome } from "@workflow/contracts";
import { store } from "../../../../lib/store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "Request body must be an object." },
      { status: 400 },
    );
  }

  const { conditions, outcome, synthesisContext } = body as Record<
    string,
    unknown
  >;

  if (typeof conditions !== "object" || conditions === null) {
    return NextResponse.json(
      { error: "conditions is required and must be an object." },
      { status: 400 },
    );
  }
  if (typeof outcome !== "string" || !outcome.trim()) {
    return NextResponse.json(
      { error: "outcome is required." },
      { status: 400 },
    );
  }

  const ctx =
    typeof synthesisContext === "string" ? synthesisContext : undefined;

  const conditionInterpretations = await generateEvaluationInterpretation(
    conditions as EvaluationConditions,
    outcome as EvaluationOutcome,
    ctx,
  );

  const snapshotId = randomUUID();
  const snapshot: InterpretationSnapshot = {
    snapshotId,
    conditionInterpretations,
    basis: {
      conditions: conditions as EvaluationConditions,
      outcome: outcome as EvaluationOutcome,
      synthesisContext: ctx,
    },
    createdAt: new Date().toISOString(),
  };

  store.snapshots.save(snapshot);

  return NextResponse.json({ snapshotId, conditionInterpretations }, { status: 201 });
}
