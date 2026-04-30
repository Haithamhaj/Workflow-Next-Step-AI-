import { NextResponse } from "next/server";
import { createFramingCandidate } from "@workflow/company-framing";
import { store } from "../../../../lib/store";

const recommendations = new Set(["promote", "defer", "merge", "split", "reject"]);
const statuses = new Set(["draft", "ready_for_review", "selected", "promoted", "dormant", "merged", "rejected"]);
const scopeTypes = new Set(["single_function", "multi_function", "company_workflow_scope"]);

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

function analysisScopeFrom(value: unknown) {
  if (!value || typeof value !== "object") return undefined;
  const input = value as Record<string, unknown>;
  const scopeType = stringFrom(input.scopeType);
  if (!scopeType || !scopeTypes.has(scopeType)) return undefined;
  const boundary = input.scopeBoundary && typeof input.scopeBoundary === "object"
    ? input.scopeBoundary as Record<string, unknown>
    : {};
  return Object.fromEntries(Object.entries({
    scopeType,
    scopeLabel: stringFrom(input.scopeLabel) ?? "",
    primaryFunctionalAnchor: stringFrom(input.primaryFunctionalAnchor) ?? "",
    participatingFunctions: stringArrayFrom(input.participatingFunctions) ?? [],
    excludedAdjacentScopes: stringArrayFrom(input.excludedAdjacentScopes) ?? [],
    scopeBoundary: {
      start: stringFrom(boundary.start) ?? "",
      end: stringFrom(boundary.end) ?? "",
    },
    crossFunctionalScope: stringArrayFrom(input.crossFunctionalScope),
    boundaryRationale: stringFrom(input.boundaryRationale),
    knownAdjacentCandidateIds: stringArrayFrom(input.knownAdjacentCandidateIds),
  }).filter(([, item]) => item !== undefined));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");
  const framingRunId = url.searchParams.get("framingRunId");
  const status = url.searchParams.get("status");
  const recommendation = url.searchParams.get("recommendation");

  const candidates = framingRunId
    ? store.framingCandidates.findByFramingRunId(framingRunId)
    : companyId
      ? store.framingCandidates.findByCompanyId(companyId)
      : store.framingCandidates.findAll();

  return NextResponse.json(
    candidates.filter((candidate) =>
      (!status || candidate.status === status)
      && (!recommendation || candidate.recommendation === recommendation)
    ),
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if ("caseId" in b || "sessionId" in b) {
    return NextResponse.json(
      { error: "FramingCandidate is pre-case material; caseId and sessionId are not accepted." },
      { status: 400 },
    );
  }

  const recommendation = stringFrom(b.recommendation);
  if (!recommendation || !recommendations.has(recommendation)) {
    return NextResponse.json({ error: "Valid recommendation is required." }, { status: 400 });
  }
  const status = stringFrom(b.status);
  if (status && !statuses.has(status)) {
    return NextResponse.json({ error: "Invalid candidate status." }, { status: 400 });
  }

  const result = createFramingCandidate(
    {
      candidateId: stringFrom(b.candidateId),
      companyId: stringFrom(b.companyId) ?? "",
      framingRunId: stringFrom(b.framingRunId) ?? "",
      candidateName: stringFrom(b.candidateName) ?? "",
      analysisScope: analysisScopeFrom(b.analysisScope) as never,
      sourceBasisIds: stringArrayFrom(b.sourceBasisIds),
      rationale: stringFrom(b.rationale) ?? "",
      risks: stringArrayFrom(b.risks),
      recommendation: recommendation as never,
      status: status as never,
      scoreSummary: scoreSummaryFrom(b.scoreSummary),
      scoreMeaning: stringFrom(b.scoreMeaning),
      operatorNotes: stringFrom(b.operatorNotes),
      relatedCandidateIds: stringArrayFrom(b.relatedCandidateIds),
      splitMergeNotes: stringFrom(b.splitMergeNotes),
      unknowns: stringArrayFrom(b.unknowns),
    },
    store.framingCandidates,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
  }

  return NextResponse.json(result.candidate, { status: 201 });
}
