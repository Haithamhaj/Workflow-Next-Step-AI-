import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateParticipantSession } from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  approveTranscriptEvidence,
  createTranscriptEvidenceForReview,
  deriveSessionEvidenceReadiness,
  getRawEvidenceExtractionEligibility,
  listExtractionEligibleEvidenceForSession,
  markEvidenceNeedsRetry,
  rejectTranscriptEvidence,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block7-evidence-trust.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
let evidenceCounter = 0;

function participantSession(sessionId, overrides = {}) {
  return {
    sessionId,
    caseId: "case-evidence-trust",
    targetingPlanId: "targeting-plan-evidence-trust",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Evidence reviewer",
    participantRoleOrNodeId: "role-evidence-reviewer",
    selectedDepartment: "Operations",
    selectedUseCase: "Transcript trust review",
    languagePreference: "en",
    sessionState: "session_prepared",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-evidence-trust",
      targetingPlanId: "targeting-plan-evidence-trust",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Evidence reviewer",
      participantRoleOrNodeId: "role-evidence-reviewer",
      selectedDepartment: "Operations",
      selectedUseCase: "Transcript trust review",
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
    ...overrides,
  };
}

function evidence(sessionId, evidenceType, overrides = {}) {
  return {
    evidenceItemId: `evidence-${++evidenceCounter}`,
    sessionId,
    evidenceType,
    sourceChannel: "web_session_chatbot",
    rawContent: "Raw evidence text",
    language: "en",
    capturedAt: now,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Proof evidence.",
    ...overrides,
  };
}

const repos = createSQLiteIntakeRepositories(dbPath);

const textSession = participantSession("session-text-ready", {
  sessionState: "first_narrative_received",
  firstNarrativeStatus: "received_text",
  extractionStatus: "eligible",
});
repos.participantSessions.save(textSession);
const textEvidence = evidence(textSession.sessionId, "participant_text_narrative", {
  rawContent: "Participant text answer.",
});
repos.rawEvidenceItems.save(textEvidence);
assert.equal(getRawEvidenceExtractionEligibility(textEvidence).eligible, true);
assert.equal(getRawEvidenceExtractionEligibility(textEvidence).reasonCode, "direct_participant_text");

const telegramEvidence = evidence(textSession.sessionId, "telegram_message", {
  sourceChannel: "telegram_bot",
  rawContent: "Telegram answer.",
});
assert.equal(getRawEvidenceExtractionEligibility(telegramEvidence).eligible, true);
assert.equal(getRawEvidenceExtractionEligibility(telegramEvidence).reasonCode, "direct_participant_text");

const audioSession = participantSession("session-audio");
repos.participantSessions.save(audioSession);
const audioEvidence = evidence(audioSession.sessionId, "audio_recording_uploaded", {
  rawContent: undefined,
  artifactRef: "file:data/participant-session-audio/audio.webm",
  originalFileName: "audio.webm",
});
repos.rawEvidenceItems.save(audioEvidence);
const audioEligibility = getRawEvidenceExtractionEligibility(audioEvidence);
assert.equal(audioEligibility.eligible, false);
assert.equal(audioEligibility.reasonCode, "audio_requires_transcription");

const rawTranscript = createTranscriptEvidenceForReview({
  evidenceItemId: "raw-transcript-1",
  sessionId: audioSession.sessionId,
  evidenceType: "speech_to_text_transcript_raw",
  rawContent: "Raw transcript from STT.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  providerJobId: "provider-job-1",
  capturedAt: now,
}, repos.rawEvidenceItems, repos.participantSessions);
assert.equal(getRawEvidenceExtractionEligibility(rawTranscript).eligible, false);
assert.equal(getRawEvidenceExtractionEligibility(rawTranscript).reasonCode, "transcript_requires_admin_review");

const approvedAsIs = approveTranscriptEvidence("raw-transcript-1", {
  rawEvidenceItems: repos.rawEvidenceItems,
  participantSessions: repos.participantSessions,
}, { now: () => now });
assert.equal(approvedAsIs.ok, true);
assert.equal(approvedAsIs.evidenceItem.trustStatus, "admin_approved");
assert.equal(approvedAsIs.evidenceItem.rawContent, "Raw transcript from STT.");
assert.equal(getRawEvidenceExtractionEligibility(approvedAsIs.evidenceItem).eligible, true);
assert.equal(approvedAsIs.participantSession?.sessionState, "first_pass_extraction_ready");
assert.equal(approvedAsIs.participantSession?.firstNarrativeStatus, "approved_for_extraction");
assert.equal(approvedAsIs.participantSession?.extractionStatus, "eligible");
assert.equal(repos.rawEvidenceItems.findById(audioEvidence.evidenceItemId)?.artifactRef, "file:data/participant-session-audio/audio.webm");

const editSession = participantSession("session-edited-transcript");
repos.participantSessions.save(editSession);
const rawTranscriptForEdit = createTranscriptEvidenceForReview({
  evidenceItemId: "raw-transcript-edit",
  sessionId: editSession.sessionId,
  evidenceType: "speech_to_text_transcript_raw",
  rawContent: "Original raw transcript.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  providerJobId: "provider-job-2",
  capturedAt: now,
}, repos.rawEvidenceItems, repos.participantSessions);
const edited = approveTranscriptEvidence({
  evidenceItemId: rawTranscriptForEdit.evidenceItemId,
  repos: {
    rawEvidenceItems: repos.rawEvidenceItems,
    participantSessions: repos.participantSessions,
  },
  editedTranscript: "Edited approved transcript.",
  options: {
    now: () => now,
    evidenceItemIdFactory: () => "approved-transcript-edit",
  },
});
assert.equal(edited.ok, true);
assert.equal(edited.evidenceItem.evidenceType, "speech_to_text_transcript_approved");
assert.equal(edited.evidenceItem.trustStatus, "admin_edited");
assert.equal(edited.evidenceItem.rawContent, "Edited approved transcript.");
assert.equal(edited.evidenceItem.providerJobId, "provider-job-2");
assert.equal(repos.rawEvidenceItems.findById(rawTranscriptForEdit.evidenceItemId)?.rawContent, "Original raw transcript.");
assert.equal(getRawEvidenceExtractionEligibility(edited.evidenceItem).eligible, true);

const rejectSession = participantSession("session-rejected-transcript");
repos.participantSessions.save(rejectSession);
const rejectRawTranscript = createTranscriptEvidenceForReview({
  evidenceItemId: "raw-transcript-reject",
  sessionId: rejectSession.sessionId,
  evidenceType: "speech_to_text_transcript_raw",
  rawContent: "Bad transcript.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  capturedAt: now,
}, repos.rawEvidenceItems, repos.participantSessions);
const rejected = rejectTranscriptEvidence(rejectRawTranscript.evidenceItemId, {
  rawEvidenceItems: repos.rawEvidenceItems,
  participantSessions: repos.participantSessions,
}, "too noisy", { now: () => now });
assert.equal(rejected.ok, true);
assert.equal(rejected.evidenceItem.trustStatus, "rejected_or_needs_retry");
assert.equal(rejected.evidenceItem.rawContent, "Bad transcript.");
assert.equal(getRawEvidenceExtractionEligibility(rejected.evidenceItem).eligible, false);
assert.equal(getRawEvidenceExtractionEligibility(rejected.evidenceItem).reasonCode, "evidence_rejected_or_needs_retry");
assert.equal(rejected.participantSession?.firstNarrativeStatus, "rejected_or_needs_retry");
assert.equal(rejected.participantSession?.extractionStatus, "blocked_evidence_not_approved");

const meetingTranscript = evidence("session-meeting", "meeting_transcript_uploaded", {
  capturedBy: "admin",
  trustStatus: "raw_unreviewed",
});
assert.equal(getRawEvidenceExtractionEligibility(meetingTranscript).eligible, false);
assert.equal(getRawEvidenceExtractionEligibility({ ...meetingTranscript, trustStatus: "admin_approved" }).eligible, true);

const manualNote = evidence("session-note", "manual_admin_note", {
  capturedBy: "admin",
  trustStatus: "raw_unreviewed",
});
assert.equal(getRawEvidenceExtractionEligibility(manualNote).eligible, false);
assert.equal(getRawEvidenceExtractionEligibility({ ...manualNote, trustStatus: "admin_edited" }).eligible, true);
assert.equal(getRawEvidenceExtractionEligibility({ ...manualNote, trustStatus: "admin_edited" }).reasonCode, "admin_approved_manual_note");

const retry = markEvidenceNeedsRetry("raw-transcript-reject", {
  rawEvidenceItems: repos.rawEvidenceItems,
  participantSessions: repos.participantSessions,
}, "retry proof", { now: () => now });
assert.equal(retry.ok, true);
assert.equal(retry.evidenceItem.trustStatus, "rejected_or_needs_retry");

const eligibleForAudioSession = listExtractionEligibleEvidenceForSession(audioSession.sessionId, repos.rawEvidenceItems);
assert.equal(eligibleForAudioSession.length, 1);
assert.equal(eligibleForAudioSession[0]?.evidenceItemId, "raw-transcript-1");

const textReady = deriveSessionEvidenceReadiness(textSession, [textEvidence]);
assert.equal(textReady.hasEligibleEvidence, true);
assert.equal(textReady.recommendedSessionState, "first_pass_extraction_ready");
assert.equal(textReady.recommendedExtractionStatus, "eligible");

const audioAwaiting = deriveSessionEvidenceReadiness(audioSession, [audioEvidence]);
assert.equal(audioAwaiting.hasAudioAwaitingTranscript, true);
assert.equal(audioAwaiting.recommendedFirstNarrativeStatus, "received_voice_pending_transcript");

const pendingReview = deriveSessionEvidenceReadiness(editSession, [rawTranscriptForEdit]);
assert.equal(pendingReview.hasTranscriptPendingReview, true);
assert.equal(pendingReview.recommendedFirstNarrativeStatus, "transcript_pending_review");

const approvedReadiness = deriveSessionEvidenceReadiness(editSession, [edited.evidenceItem]);
assert.equal(approvedReadiness.hasEligibleEvidence, true);
assert.equal(approvedReadiness.recommendedFirstNarrativeStatus, "approved_for_extraction");

const rejectedReadiness = deriveSessionEvidenceReadiness(rejectSession, [rejected.evidenceItem]);
assert.equal(rejectedReadiness.hasRejectedEvidence, true);
assert.equal(rejectedReadiness.recommendedFirstNarrativeStatus, "rejected_or_needs_retry");

const reloaded = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloaded.rawEvidenceItems.findById("raw-transcript-1")?.trustStatus, "admin_approved");
assert.equal(reloaded.rawEvidenceItems.findById("approved-transcript-edit")?.rawContent, "Edited approved transcript.");
assert.equal(reloaded.rawEvidenceItems.findById("raw-transcript-edit")?.rawContent, "Original raw transcript.");
assert.equal(reloaded.participantSessions.findById(audioSession.sessionId)?.sessionState, "first_pass_extraction_ready");
assert.equal(validateParticipantSession(reloaded.participantSessions.findById(audioSession.sessionId)).ok, true);

console.log("Pass 5 Block 7 evidence trust proof passed.");
