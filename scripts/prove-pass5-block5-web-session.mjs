import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  validateParticipantSession,
  validateRawEvidenceItem,
} from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  createWebSessionAccessToken,
  resolveSessionAccessToken,
  revokeSessionAccessToken,
  submitWebSessionFirstNarrative,
  submitWebSessionFirstNarrativeVoice,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block5-web-session.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
let tokenCounter = 0;
let tokenIdCounter = 0;
let evidenceCounter = 0;

function options(overrides = {}) {
  return {
    now: () => now,
    tokenTtlMs: 1000 * 60 * 60,
    tokenFactory: () => `web-raw-token-${++tokenCounter}`,
    accessTokenIdFactory: () => `web-access-token-${++tokenIdCounter}`,
    evidenceItemIdFactory: () => `raw-evidence-${++evidenceCounter}`,
    ...overrides,
  };
}

function participantSession(sessionId) {
  return {
    sessionId,
    caseId: "case-web-1",
    targetingPlanId: "targeting-plan-web-1",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Operations coordinator",
    participantRoleOrNodeId: "role-operations-coordinator",
    selectedDepartment: "Operations",
    selectedUseCase: "Order exception handling",
    languagePreference: "en",
    sessionState: "session_prepared",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-web-1",
      targetingPlanId: "targeting-plan-web-1",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Operations coordinator",
      participantRoleOrNodeId: "role-operations-coordinator",
      selectedDepartment: "Operations",
      selectedUseCase: "Order exception handling",
      languagePreference: "en",
    },
    channelAccess: {
      selectedParticipationMode: "web_session_chatbot",
      channelStatus: "channel_selected_pending_dispatch",
      sessionAccessTokenId: null,
      telegramBindingId: null,
      dispatchReference: null,
      notes: null,
    },
    rawEvidence: {
      rawEvidenceItems: [],
      firstNarrativeEvidenceId: null,
    },
    analysisProgress: {
      firstNarrativeStatus: "not_received",
      extractionStatus: "not_started",
      clarificationItemIds: [],
      boundarySignalIds: [],
      unresolvedItemIds: [],
      nextActionIds: [],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "not_received",
    firstNarrativeEvidenceId: null,
    extractionStatus: "not_started",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
  };
}

const repos = createSQLiteIntakeRepositories(dbPath);
const session = participantSession("participant-session-web-1");
const sessionValidation = validateParticipantSession(session);
assert.equal(sessionValidation.ok, true, sessionValidation.ok ? "" : JSON.stringify(sessionValidation.errors));
repos.participantSessions.save(session);

const token = createWebSessionAccessToken(session, repos.sessionAccessTokens, options());
assert.equal(token.ok, true);
const resolved = resolveSessionAccessToken(token.rawToken, repos.sessionAccessTokens, repos.participantSessions, options());
assert.equal(resolved.ok, true);
assert.equal(resolved.participantSession.sessionId, session.sessionId);

const narrativeText = "First we receive the exception in the order queue. I check the customer note, ask Support if the case is unclear, and then either release the order or send it to Finance.";
const submission = submitWebSessionFirstNarrative(token.rawToken, narrativeText, {
  sessionAccessTokens: repos.sessionAccessTokens,
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
}, options());
assert.equal(submission.ok, true);
assert.equal(submission.rawEvidenceItem.evidenceType, "participant_text_narrative");
assert.equal(submission.rawEvidenceItem.sourceChannel, "web_session_chatbot");
assert.equal(submission.rawEvidenceItem.rawContent, narrativeText);
assert.equal(submission.rawEvidenceItem.capturedBy, "participant");
assert.equal(submission.rawEvidenceItem.trustStatus, "raw_unreviewed");
assert.equal(validateRawEvidenceItem(submission.rawEvidenceItem).ok, true);
assert.equal(submission.participantSession.sessionState, "first_narrative_received");
assert.equal(submission.participantSession.firstNarrativeStatus, "received_text");
assert.equal(submission.participantSession.firstNarrativeEvidenceId, submission.rawEvidenceItem.evidenceItemId);
assert.equal(submission.participantSession.extractionStatus, "eligible");
assert.equal(submission.participantSession.rawEvidenceItems.length, 1);
assert.equal(submission.participantSession.rawEvidence.rawEvidenceItems.length, 1);

assert.equal(repos.rawEvidenceItems.findBySessionId(session.sessionId).length, 1);
assert.equal(repos.firstPassExtractionOutputs.findBySessionId(session.sessionId).length, 0);
assert.equal(repos.clarificationCandidates.findBySessionId(session.sessionId).length, 0);
assert.equal(repos.boundarySignals.findBySessionId(session.sessionId).length, 0);

const duplicate = submitWebSessionFirstNarrative(token.rawToken, "Replacement text that must not overwrite.", {
  sessionAccessTokens: repos.sessionAccessTokens,
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
}, options());
assert.equal(duplicate.ok, false);
assert.equal(duplicate.errors[0]?.code, "narrative_already_submitted");
assert.equal(duplicate.existingEvidenceItemId, submission.rawEvidenceItem.evidenceItemId);
assert.equal(repos.rawEvidenceItems.findBySessionId(session.sessionId).length, 1);
assert.equal(repos.rawEvidenceItems.findById(submission.rawEvidenceItem.evidenceItemId)?.rawContent, narrativeText);
assert.equal(repos.participantSessions.findById(session.sessionId)?.firstNarrativeEvidenceId, submission.rawEvidenceItem.evidenceItemId);

const invalid = submitWebSessionFirstNarrative("not-a-token", "Text", {
  sessionAccessTokens: repos.sessionAccessTokens,
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
}, options());
assert.equal(invalid.ok, false);
assert.equal(invalid.errors[0]?.code, "token_not_found");

const expiredSession = participantSession("participant-session-web-expired");
repos.participantSessions.save(expiredSession);
const expiredToken = createWebSessionAccessToken(expiredSession, repos.sessionAccessTokens, options({ tokenTtlMs: -1000 }));
assert.equal(expiredToken.ok, true);
const expiredSubmission = submitWebSessionFirstNarrative(expiredToken.rawToken, "Text", {
  sessionAccessTokens: repos.sessionAccessTokens,
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
}, options());
assert.equal(expiredSubmission.ok, false);
assert.equal(expiredSubmission.errors[0]?.code, "token_expired");

const revokedSession = participantSession("participant-session-web-revoked");
repos.participantSessions.save(revokedSession);
const revokedToken = createWebSessionAccessToken(revokedSession, repos.sessionAccessTokens, options());
assert.equal(revokedToken.ok, true);
const revoked = revokeSessionAccessToken(revokedToken.token.accessTokenId, repos.sessionAccessTokens, "admin revoked", options());
assert.equal(revoked.ok, true);
const revokedSubmission = submitWebSessionFirstNarrative(revokedToken.rawToken, "Text", {
  sessionAccessTokens: repos.sessionAccessTokens,
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
}, options());
assert.equal(revokedSubmission.ok, false);
assert.equal(revokedSubmission.errors[0]?.code, "token_revoked");

const reloaded = createSQLiteIntakeRepositories(dbPath);
const reloadedSession = reloaded.participantSessions.findById(session.sessionId);
assert.equal(reloadedSession?.sessionState, "first_narrative_received");
assert.equal(reloadedSession?.firstNarrativeStatus, "received_text");
assert.equal(reloadedSession?.firstNarrativeEvidenceId, submission.rawEvidenceItem.evidenceItemId);
assert.equal(reloadedSession?.extractionStatus, "eligible");
const reloadedEvidence = reloaded.rawEvidenceItems.findBySessionId(session.sessionId);
assert.equal(reloadedEvidence.length, 1);
assert.equal(reloadedEvidence[0]?.rawContent, narrativeText);
assert.equal(reloaded.firstPassExtractionOutputs.findBySessionId(session.sessionId).length, 0);
assert.equal(reloaded.clarificationCandidates.findBySessionId(session.sessionId).length, 0);

const voiceSession = participantSession("participant-session-web-voice");
repos.participantSessions.save(voiceSession);
const voiceToken = createWebSessionAccessToken(voiceSession, repos.sessionAccessTokens, options());
assert.equal(voiceToken.ok, true);
const voiceSubmission = submitWebSessionFirstNarrativeVoice(
  voiceToken.rawToken,
  {
    artifactRef: "file:data/participant-session-audio/proof-voice.webm",
    originalFileName: "proof-voice.webm",
  },
  {
    sessionAccessTokens: repos.sessionAccessTokens,
    participantSessions: repos.participantSessions,
    rawEvidenceItems: repos.rawEvidenceItems,
  },
  options(),
);
assert.equal(voiceSubmission.ok, true);
assert.equal(voiceSubmission.rawEvidenceItem.evidenceType, "audio_recording_uploaded");
assert.equal(voiceSubmission.rawEvidenceItem.sourceChannel, "web_session_chatbot");
assert.equal(voiceSubmission.rawEvidenceItem.artifactRef, "file:data/participant-session-audio/proof-voice.webm");
assert.equal(voiceSubmission.rawEvidenceItem.rawContent, undefined);
assert.equal(voiceSubmission.rawEvidenceItem.originalFileName, "proof-voice.webm");
assert.equal(voiceSubmission.rawEvidenceItem.providerJobId, null);
assert.equal(voiceSubmission.rawEvidenceItem.capturedBy, "participant");
assert.equal(validateRawEvidenceItem(voiceSubmission.rawEvidenceItem).ok, true);
assert.equal(voiceSubmission.participantSession.sessionState, "transcript_pending_review");
assert.equal(voiceSubmission.participantSession.firstNarrativeStatus, "received_voice_pending_transcript");
assert.equal(voiceSubmission.participantSession.firstNarrativeEvidenceId, voiceSubmission.rawEvidenceItem.evidenceItemId);
assert.equal(voiceSubmission.participantSession.extractionStatus, "blocked_evidence_not_approved");
assert.equal(repos.firstPassExtractionOutputs.findBySessionId(voiceSession.sessionId).length, 0);
assert.equal(repos.clarificationCandidates.findBySessionId(voiceSession.sessionId).length, 0);

const duplicateVoice = submitWebSessionFirstNarrativeVoice(
  voiceToken.rawToken,
  {
    artifactRef: "file:data/participant-session-audio/replacement.webm",
    originalFileName: "replacement.webm",
  },
  {
    sessionAccessTokens: repos.sessionAccessTokens,
    participantSessions: repos.participantSessions,
    rawEvidenceItems: repos.rawEvidenceItems,
  },
  options(),
);
assert.equal(duplicateVoice.ok, false);
assert.equal(duplicateVoice.errors[0]?.code, "narrative_already_submitted");
assert.equal(repos.rawEvidenceItems.findBySessionId(voiceSession.sessionId).length, 1);
assert.equal(
  repos.rawEvidenceItems.findById(voiceSubmission.rawEvidenceItem.evidenceItemId)?.artifactRef,
  "file:data/participant-session-audio/proof-voice.webm",
);

const reloadedVoice = createSQLiteIntakeRepositories(dbPath);
const reloadedVoiceSession = reloadedVoice.participantSessions.findById(voiceSession.sessionId);
assert.equal(reloadedVoiceSession?.sessionState, "transcript_pending_review");
assert.equal(reloadedVoiceSession?.firstNarrativeStatus, "received_voice_pending_transcript");
assert.equal(reloadedVoiceSession?.extractionStatus, "blocked_evidence_not_approved");
assert.equal(reloadedVoice.rawEvidenceItems.findBySessionId(voiceSession.sessionId)[0]?.artifactRef, "file:data/participant-session-audio/proof-voice.webm");
assert.equal(reloadedVoice.firstPassExtractionOutputs.findBySessionId(voiceSession.sessionId).length, 0);
assert.equal(reloadedVoice.clarificationCandidates.findBySessionId(voiceSession.sessionId).length, 0);

console.log("Pass 5 Block 5 web session proof passed.");
