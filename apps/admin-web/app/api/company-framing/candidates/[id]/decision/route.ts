import { NextResponse } from "next/server";
import { updateFramingCandidateDecision } from "@workflow/company-framing";
import { store } from "../../../../../../lib/store";

const recommendations = new Set(["promote", "defer", "merge", "split", "reject"]);
const statuses = new Set(["draft", "ready_for_review", "selected", "promoted", "dormant", "merged", "rejected"]);

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArrayFrom(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;
}

function scoreSummaryFrom(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(input).filter(([, item]) => typeof item === "number"),
  );
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
  const recommendation = stringFrom(b.recommendation);
  if (status && !statuses.has(status)) {
    return NextResponse.json({ error: "Invalid candidate status." }, { status: 400 });
  }
  if (recommendation && !recommendations.has(recommendation)) {
    return NextResponse.json({ error: "Invalid candidate recommendation." }, { status: 400 });
  }

  const result = updateFramingCandidateDecision(
    params.id,
    {
      status: status as never,
      recommendation: recommendation as never,
      operatorNotes: stringFrom(b.operatorNotes),
      splitMergeNotes: stringFrom(b.splitMergeNotes),
      risks: stringArrayFrom(b.risks),
      unknowns: stringArrayFrom(b.unknowns),
      scoreSummary: scoreSummaryFrom(b.scoreSummary),
      scoreMeaning: stringFrom(b.scoreMeaning),
    },
    store.framingCandidates,
  );

  if (!result.ok) {
    const statusCode = result.error.code === "candidate_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: statusCode });
  }

  return NextResponse.json(result.candidate);
}

export const POST = PATCH;
