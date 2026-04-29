import { NextResponse } from "next/server";
import {
  createPass6HandoffCandidateFromAdminEntry,
  createPass6HandoffCandidateFromAssistantRecommendation,
  type Pass6HandoffCandidateInput,
} from "@workflow/participant-sessions";
import { store } from "../../../../lib/store";

const repos = {
  participantSessions: store.participantSessions,
  pass6HandoffCandidates: store.pass6HandoffCandidates,
};

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  if (typeof value === "string" && value.trim().length > 0) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const companyId = params.get("companyId");
  const caseId = params.get("caseId");
  if (!companyId || !caseId) return NextResponse.json({ ok: false, error: "companyId_caseId_required" }, { status: 400 });
  return NextResponse.json({ ok: true, candidates: repos.pass6HandoffCandidates.findByCompanyAndCase(companyId, caseId) });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json().catch(() => ({})) as Record<string, unknown>
    : Object.fromEntries((await request.formData()).entries()) as Record<string, unknown>;
  const caseId = textValue(payload.caseId);
  const companyId = textValue(payload.companyId);
  const sessionIds = listValue(payload.sessionIds);
  const description = textValue(payload.description);
  const recommendedPass6Use = textValue(payload.recommendedPass6Use);
  if (!companyId || !caseId || sessionIds.length === 0 || !description || !recommendedPass6Use) {
    return NextResponse.json({ ok: false, error: "required_fields_missing" }, { status: 400 });
  }
  const sessions = sessionIds.map((sessionId) => repos.participantSessions.findByCompany(companyId, sessionId));
  if (sessions.some((session) => !session || session.caseId !== caseId)) {
    return NextResponse.json({ ok: false, error: "session_not_found" }, { status: 404 });
  }
  const input: Omit<Pass6HandoffCandidateInput, "createdFrom"> = {
    companyId,
    caseId,
    sessionIds,
    candidateType: (textValue(payload.candidateType) ?? "admin_observation") as Pass6HandoffCandidateInput["candidateType"],
    description,
    evidenceRefs: listValue(payload.evidenceItemIds).map((evidenceItemId) => ({
      evidenceItemId,
      note: textValue(payload.evidenceNote) ?? "Admin supplied handoff evidence reference.",
    })),
    confidenceLevel: (textValue(payload.confidenceLevel) ?? "medium") as Pass6HandoffCandidateInput["confidenceLevel"],
    recommendedPass6Use,
    mandatoryOrOptional: (textValue(payload.mandatoryOrOptional) ?? "optional") as Pass6HandoffCandidateInput["mandatoryOrOptional"],
  };
  const source = textValue(payload.source);
  const result = source === "admin_assistant"
    ? createPass6HandoffCandidateFromAssistantRecommendation(input, repos)
    : createPass6HandoffCandidateFromAdminEntry(input, repos);
  const returnTo = textValue(payload.returnTo);
  if (returnTo && !contentType.includes("application/json")) {
    return NextResponse.redirect(new URL(`${returnTo}?handoffStatus=${encodeURIComponent(result.ok ? `created:${result.value.handoffCandidateId}` : result.errors[0]?.code ?? "failed")}`, request.url), { status: 303 });
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
