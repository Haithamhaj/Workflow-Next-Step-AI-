import { NextResponse } from "next/server";
import {
  createCandidateCaseEntryPacket,
  createKnownUseCasePacket,
} from "@workflow/company-framing";
import { store } from "../../../../lib/store";

const scopeTypes = new Set(["single_function", "multi_function", "company_workflow_scope"]);

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArrayFrom(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;
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
    boundaryRationale: stringFrom(input.boundaryRationale),
  }).filter(([, item]) => item !== undefined));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");
  const framingRunId = url.searchParams.get("framingRunId");
  const candidateId = url.searchParams.get("candidateId");

  const packets = candidateId
    ? store.caseEntryPackets.findByCandidateId(candidateId)
    : framingRunId
      ? store.caseEntryPackets.findByFramingRunId(framingRunId)
      : companyId
        ? store.caseEntryPackets.findByCompanyId(companyId)
        : store.caseEntryPackets.findAll();

  return NextResponse.json(packets);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const source = stringFrom(b.source);
  if (source === "framing_candidate") {
    const candidateId = stringFrom(b.candidateId);
    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required for framing_candidate packets.", code: "candidate_not_found" }, { status: 400 });
    }
    const result = createCandidateCaseEntryPacket(
      candidateId,
      {
        packetId: stringFrom(b.packetId),
        proposedDomain: stringFrom(b.proposedDomain),
        proposedMainDepartment: stringFrom(b.proposedMainDepartment),
        proposedUseCaseLabel: stringFrom(b.proposedUseCaseLabel),
        includedFramingSourceIds: stringArrayFrom(b.includedFramingSourceIds),
        contextOnlyFramingSourceIds: stringArrayFrom(b.contextOnlyFramingSourceIds),
        excludedFramingSourceIds: stringArrayFrom(b.excludedFramingSourceIds),
        assumptions: stringArrayFrom(b.assumptions),
        unknowns: stringArrayFrom(b.unknowns),
      },
      { candidates: store.framingCandidates, packets: store.caseEntryPackets },
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
    }
    return NextResponse.json(result.packet, { status: 201 });
  }

  if (source !== "known_use_case") {
    return NextResponse.json({ error: "source must be known_use_case or framing_candidate." }, { status: 400 });
  }

  const result = createKnownUseCasePacket(
    {
      packetId: stringFrom(b.packetId),
      companyId: stringFrom(b.companyId) ?? "",
      framingRunId: stringFrom(b.framingRunId),
      proposedDomain: stringFrom(b.proposedDomain) ?? "",
      proposedMainDepartment: stringFrom(b.proposedMainDepartment) ?? "",
      proposedUseCaseLabel: stringFrom(b.proposedUseCaseLabel) ?? "",
      analysisScope: analysisScopeFrom(b.analysisScope) as never,
      includedFramingSourceIds: stringArrayFrom(b.includedFramingSourceIds),
      contextOnlyFramingSourceIds: stringArrayFrom(b.contextOnlyFramingSourceIds),
      excludedFramingSourceIds: stringArrayFrom(b.excludedFramingSourceIds),
      assumptions: stringArrayFrom(b.assumptions),
      unknowns: stringArrayFrom(b.unknowns),
      adjacentWorkflowCandidateIds: stringArrayFrom(b.adjacentWorkflowCandidateIds),
    },
    store.caseEntryPackets,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
  }
  return NextResponse.json(result.packet, { status: 201 });
}
