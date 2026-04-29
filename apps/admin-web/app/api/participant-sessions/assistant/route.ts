import { NextResponse } from "next/server";
import { runAdminAssistantQuestion, type AdminAssistantScope } from "@workflow/participant-sessions";
import { store } from "../../../../lib/store";

const repos = {
  participantSessions: store.participantSessions,
  sessionAccessTokens: store.sessionAccessTokens,
  telegramIdentityBindings: store.telegramIdentityBindings,
  rawEvidenceItems: store.rawEvidenceItems,
  firstPassExtractionOutputs: store.firstPassExtractionOutputs,
  clarificationCandidates: store.clarificationCandidates,
  boundarySignals: store.boundarySignals,
  evidenceDisputes: store.evidenceDisputes,
  sessionNextActions: store.sessionNextActions,
  pass6HandoffCandidates: store.pass6HandoffCandidates,
  providerJobs: store.providerJobs,
  promptSpecs: store.structuredPromptSpecs,
};

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function scopeValue(value: unknown): AdminAssistantScope {
  return value === "selected_sessions" || value === "case_pass5" || value === "targeted_records" ? value : "current_session";
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({})) as Record<string, unknown>;
  const question = textValue(payload.question);
  const companyId = textValue(payload.companyId);
  if (!question) {
    return NextResponse.json({ ok: false, error: "question_required" }, { status: 400 });
  }
  if (!companyId) {
    return NextResponse.json({ ok: false, error: "companyId_required" }, { status: 400 });
  }
  const caseId = textValue(payload.caseId);
  const sessionId = textValue(payload.sessionId);
  const selectedSessionIds = Array.isArray(payload.selectedSessionIds)
    ? payload.selectedSessionIds.filter((value): value is string => typeof value === "string")
    : undefined;
  if (sessionId && !repos.participantSessions.findByCompany(companyId, sessionId)) {
    return NextResponse.json({ ok: false, error: "session_not_found" }, { status: 404 });
  }
  if (caseId && repos.participantSessions.findByCompanyAndCase(companyId, caseId).length === 0) {
    return NextResponse.json({ ok: false, error: "case_not_found" }, { status: 404 });
  }
  if (selectedSessionIds?.some((id) => !repos.participantSessions.findByCompany(companyId, id))) {
    return NextResponse.json({ ok: false, error: "session_not_found" }, { status: 404 });
  }
  const result = await runAdminAssistantQuestion({
    question,
    scope: scopeValue(payload.scope),
    caseId,
    sessionId,
    selectedSessionIds,
    requestedByAdminId: textValue(payload.requestedByAdminId) ?? "admin_operator",
  }, repos, null);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
