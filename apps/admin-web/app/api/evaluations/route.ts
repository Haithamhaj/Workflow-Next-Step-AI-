import { NextResponse } from "next/server";
import {
  createEvaluation,
  listEvaluations,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../lib/store";

export async function GET() {
  return NextResponse.json(listEvaluations(store.evaluations));
}

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
  const outcome = createEvaluation(body, store.evaluations, store.snapshots);
  if (!outcome.ok) {
    const status = outcome.error.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }
  return NextResponse.json(outcome.evaluation, { status: 201 });
}
