import { NextResponse } from "next/server";
import {
  addAdminClarificationCandidate,
  dismissClarificationCandidate,
  formulateClarificationQuestion,
  markClarificationCandidateAsked,
  recordClarificationAnswer,
  runClarificationAnswerRecheck,
  selectNextClarificationCandidate,
} from "@workflow/participant-sessions";
import { store } from "../../../../../lib/store";

const repos = {
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
  clarificationCandidates: store.clarificationCandidates,
  boundarySignals: store.boundarySignals,
  providerJobs: store.providerJobs,
  promptSpecs: store.structuredPromptSpecs,
};

function textValue(form: FormData, key: string): string | undefined {
  const value = form.get(key);
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function redirectToSession(request: Request, sessionId: string, status: string) {
  return NextResponse.redirect(new URL(`/participant-sessions/${sessionId}?actionStatus=${encodeURIComponent(status)}`, request.url), { status: 303 });
}

export async function POST(request: Request, { params }: { params: { sessionId: string } }) {
  const form = await request.formData();
  const action = textValue(form, "action");
  const sessionId = params.sessionId;

  try {
    if (action === "select-next") {
      const result = selectNextClarificationCandidate(sessionId, repos);
      return redirectToSession(request, sessionId, result.ok ? `selected:${result.value.candidate.candidateId}` : result.errors[0]?.code ?? "select_failed");
    }
    if (action === "mark-asked") {
      const candidateId = textValue(form, "candidateId");
      if (!candidateId) return redirectToSession(request, sessionId, "candidate_required");
      const result = markClarificationCandidateAsked(candidateId, repos);
      return redirectToSession(request, sessionId, result.ok ? `asked:${candidateId}` : result.errors[0]?.code ?? "ask_failed");
    }
    if (action === "record-answer") {
      const candidateId = textValue(form, "candidateId");
      const answerText = textValue(form, "answerText");
      if (!candidateId || !answerText) return redirectToSession(request, sessionId, "answer_required");
      const result = recordClarificationAnswer({ sessionId, candidateId, answerText, capturedBy: "admin" }, repos);
      return redirectToSession(request, sessionId, result.ok ? `answer_recorded:${result.value.evidenceItemId}` : result.errors[0]?.code ?? "answer_failed");
    }
    if (action === "dismiss") {
      const candidateId = textValue(form, "candidateId");
      if (!candidateId) return redirectToSession(request, sessionId, "candidate_required");
      const result = dismissClarificationCandidate(candidateId, repos, textValue(form, "reason"));
      return redirectToSession(request, sessionId, result.ok ? `dismissed:${candidateId}` : result.errors[0]?.code ?? "dismiss_failed");
    }
    if (action === "add-admin-exact") {
      const questionTheme = textValue(form, "questionTheme");
      const exactQuestion = textValue(form, "exactQuestion");
      if (!questionTheme || !exactQuestion) return redirectToSession(request, sessionId, "admin_question_required");
      const result = await addAdminClarificationCandidate({ sessionId, questionTheme, exactQuestion, askNext: true }, repos, null);
      return redirectToSession(request, sessionId, result.ok ? `admin_question_added:${result.value.candidateId}` : result.errors[0]?.code ?? "admin_question_failed");
    }
    if (action === "formulate") {
      const candidateId = textValue(form, "candidateId");
      if (!candidateId) return redirectToSession(request, sessionId, "candidate_required");
      const result = await formulateClarificationQuestion(candidateId, repos, null);
      return redirectToSession(request, sessionId, result.ok ? `formulated:${candidateId}` : result.errors[0]?.code ?? "provider_not_configured");
    }
    if (action === "recheck") {
      const answerEvidenceId = textValue(form, "answerEvidenceId");
      if (!answerEvidenceId) return redirectToSession(request, sessionId, "answer_evidence_required");
      const result = await runClarificationAnswerRecheck(sessionId, answerEvidenceId, repos, null);
      return redirectToSession(request, sessionId, result.ok ? `rechecked:${answerEvidenceId}` : result.errors[0]?.code ?? "provider_not_configured");
    }
    return redirectToSession(request, sessionId, "unsupported_action");
  } catch (error) {
    return redirectToSession(request, sessionId, error instanceof Error ? error.message : String(error));
  }
}
