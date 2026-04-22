/**
 * Session lifecycle + clarification — Pass 5 implementation.
 * Spec refs: §28.9 (Session States), §28.10 (Session-State Transition Rule),
 *            §17.8 (Required Structure of Each Clarification Question).
 *
 * Architecture constraint: this package must not import from core-state or core-case.
 * Validation uses makeValidator<T> from @workflow/contracts (CLAUDE.md rule).
 * State values come from @workflow/contracts (SessionState) — not redefined here.
 */

import {
  validateSessionCreation,
  SessionState,
  type SessionCreation,
  type ClarificationQuestion,
} from "@workflow/contracts";
import type {
  SessionRecord,
  SessionRepository,
} from "@workflow/persistence";

export const SESSIONS_CLARIFICATION_PACKAGE =
  "@workflow/sessions-clarification" as const;

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export { SessionState } from "@workflow/contracts";
export type { SessionCreation, ClarificationQuestion } from "@workflow/contracts";
export type { SessionRecord, SessionRepository } from "@workflow/persistence";

// ---------------------------------------------------------------------------
// Transition table (literal §28.10)
// ---------------------------------------------------------------------------
//
// Spec §28.10: "not_started → input_received → extraction_in_progress →
// follow_up_needed or session_partial or session_ready_for_synthesis".
//
// Only forward transitions from §28.10 are encoded. No back-transitions or
// loops are assumed (would be inventing governance). Terminal-state looping
// (e.g. whether follow_up_needed may resume extraction) is recorded as an
// open question in handoff/OPEN_QUESTIONS.md.

export const SessionStateTransitions: Readonly<
  Record<SessionState, readonly SessionState[]>
> = {
  [SessionState.NotStarted]: [SessionState.InputReceived],
  [SessionState.InputReceived]: [SessionState.ExtractionInProgress],
  [SessionState.ExtractionInProgress]: [
    SessionState.FollowUpNeeded,
    SessionState.SessionPartial,
    SessionState.SessionReadyForSynthesis,
  ],
  [SessionState.FollowUpNeeded]: [],
  [SessionState.SessionPartial]: [],
  [SessionState.SessionReadyForSynthesis]: [],
};

export function isValidSessionTransition(
  from: SessionState,
  to: SessionState
): boolean {
  return SessionStateTransitions[from].includes(to);
}

// ---------------------------------------------------------------------------
// Outcome types
// ---------------------------------------------------------------------------

export interface SessionResult {
  ok: true;
  session: SessionRecord;
}

export interface SessionError {
  ok: false;
  error: string;
}

export type SessionOutcome = SessionResult | SessionError;

// ---------------------------------------------------------------------------
// createSession
// ---------------------------------------------------------------------------

/**
 * Validate a SessionCreation payload, reject duplicate IDs, persist a
 * SessionRecord. Defaults currentState to not_started (§28.9 first value,
 * also §28.10 entry point) when the caller omits initialState.
 */
export function createSession(
  payload: unknown,
  repo: SessionRepository
): SessionOutcome {
  const result = validateSessionCreation(payload);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    return {
      ok: false,
      error: `Invalid SessionCreation: ${messages}`,
    };
  }

  const creation: SessionCreation = result.value;

  const existing = repo.findById(creation.sessionId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Session with id '${creation.sessionId}' already exists.`,
    };
  }

  const record: SessionRecord = {
    ...creation,
    createdAt: new Date().toISOString(),
    currentState: creation.initialState ?? SessionState.NotStarted,
    clarificationQuestions: [],
  };

  repo.save(record);
  return { ok: true, session: record };
}

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

export function getSession(
  sessionId: string,
  repo: SessionRepository
): SessionRecord | null {
  return repo.findById(sessionId);
}

// ---------------------------------------------------------------------------
// listSessions / listSessionsByCaseId
// ---------------------------------------------------------------------------

export function listSessions(repo: SessionRepository): SessionRecord[] {
  return repo.findAll();
}

export function listSessionsByCaseId(
  caseId: string,
  repo: SessionRepository
): SessionRecord[] {
  return repo.findByCaseId(caseId);
}

// ---------------------------------------------------------------------------
// transitionSession
// ---------------------------------------------------------------------------

/**
 * Move a session into a new SessionState. Rejects invalid transitions per
 * §28.10 transition rule.
 */
export function transitionSession(
  sessionId: string,
  toState: SessionState,
  repo: SessionRepository
): SessionOutcome {
  const current = repo.findById(sessionId);
  if (current === null) {
    return { ok: false, error: `Session '${sessionId}' not found.` };
  }

  if (!isValidSessionTransition(current.currentState, toState)) {
    return {
      ok: false,
      error: `Invalid session transition: ${current.currentState} → ${toState} (see §28.10).`,
    };
  }

  const updated: SessionRecord = { ...current, currentState: toState };
  repo.save(updated);
  return { ok: true, session: updated };
}

// ---------------------------------------------------------------------------
// addClarificationQuestion
// ---------------------------------------------------------------------------

/**
 * Append a clarification question to an existing session. Enforces §17.8:
 * every clarification question must carry a question, explanation, and
 * example.
 */
export function addClarificationQuestion(
  sessionId: string,
  question: ClarificationQuestion,
  repo: SessionRepository
): SessionOutcome {
  const current = repo.findById(sessionId);
  if (current === null) {
    return { ok: false, error: `Session '${sessionId}' not found.` };
  }

  if (
    typeof question.question !== "string" ||
    question.question.trim() === "" ||
    typeof question.explanation !== "string" ||
    question.explanation.trim() === "" ||
    typeof question.example !== "string" ||
    question.example.trim() === ""
  ) {
    return {
      ok: false,
      error:
        "Invalid ClarificationQuestion: question, explanation, and example are all required (see §17.8).",
    };
  }

  const updated: SessionRecord = {
    ...current,
    clarificationQuestions: [...current.clarificationQuestions, { ...question }],
  };
  repo.save(updated);
  return { ok: true, session: updated };
}
