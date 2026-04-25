import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  markClarificationCandidateAsked,
  recordClarificationAnswer,
  runClarificationAnswerRecheck,
} from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";
const dbPath = join(tmpdir(), "workflow-pass5-block14-answer-recheck-governance.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

function session(sessionId) {
  return {
    sessionId,
    caseId: "case-pass5-block14-answer-recheck",
    targetingPlanId: "targeting-plan-pass5-block14-answer-recheck",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Operations participant",
    participantRoleOrNodeId: "role-operations",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
    languagePreference: "en",
    sessionState: "clarification_needed",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-pass5-block14-answer-recheck",
      targetingPlanId: "targeting-plan-pass5-block14-answer-recheck",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Operations participant",
      participantRoleOrNodeId: "role-operations",
      selectedDepartment: "Operations",
      selectedUseCase: "Order approval",
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
    rawEvidence: { rawEvidenceItems: [], firstNarrativeEvidenceId: null },
    analysisProgress: {
      firstNarrativeStatus: "received_text",
      extractionStatus: "completed_with_unmapped",
      clarificationItemIds: [],
      boundarySignalIds: [],
      unresolvedItemIds: [],
      nextActionIds: [],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: null,
    extractionStatus: "completed_with_unmapped",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
  };
}

function candidate(sessionId, candidateId) {
  return {
    candidateId,
    sessionId,
    linkedExtractedItemIds: [],
    linkedUnmappedItemIds: [],
    linkedDefectIds: [],
    linkedRawEvidenceItemIds: ["evidence-original-narrative"],
    gapType: "boundary_or_unknown",
    questionTheme: "Finance-owned threshold",
    participantFacingQuestion: "What do you know about the sensitive price approval threshold?",
    whyItMatters: "It determines whether the participant can clarify the rule or whether Finance owns it.",
    exampleAnswer: "I know the threshold, or Finance owns that rule.",
    priority: "high",
    askNext: true,
    status: "open",
    createdFrom: "extraction",
    adminInstruction: "Ask without pressuring the participant to guess.",
    aiFormulated: true,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
  };
}

function clarificationRepos(repos) {
  return {
    participantSessions: repos.participantSessions,
    rawEvidenceItems: repos.rawEvidenceItems,
    clarificationCandidates: repos.clarificationCandidates,
    boundarySignals: repos.boundarySignals,
    providerJobs: repos.providerJobs,
    promptSpecs: repos.structuredPromptSpecs,
  };
}

class FixtureExecutor {
  constructor(output) {
    this.name = "google";
    this.output = output;
    this.lastPrompt = "";
  }

  async runPromptText(input) {
    this.lastPrompt = input.compiledPrompt;
    return {
      provider: "google",
      model: "deterministic-answer-recheck-governance-fixture",
      text: JSON.stringify(this.output),
    };
  }
}

function seedAnsweredCandidate(repos, sessionId, candidateId, evidenceItemId) {
  repos.participantSessions.save(session(sessionId));
  repos.clarificationCandidates.save(candidate(sessionId, candidateId));
  const asked = markClarificationCandidateAsked(candidateId, clarificationRepos(repos), { now: () => now });
  assert.equal(asked.ok, true, asked.ok ? "" : JSON.stringify(asked.errors));
  const answer = recordClarificationAnswer({
    sessionId,
    candidateId,
    answerText: "I do not know the threshold. Finance handles the rule and I only see whether approval was granted.",
    sourceChannel: "web_session_chatbot",
    language: "en",
    capturedAt: now,
  }, clarificationRepos(repos), { evidenceItemIdFactory: () => evidenceItemId, now: () => now });
  assert.equal(answer.ok, true, answer.ok ? "" : JSON.stringify(answer.errors));
  assert.equal(repos.rawEvidenceItems.findById(evidenceItemId)?.rawContent, answer.value.rawContent);
  return answer.value;
}

const repos = createSQLiteIntakeRepositories(dbPath);

const answerEvidence = seedAnsweredCandidate(repos, "session-boundary-only", "candidate-boundary-only", "evidence-boundary-only");
const boundaryOnlyProvider = new FixtureExecutor({
  candidateStatusUpdates: [],
  newClarificationCandidates: [],
  boundarySignals: [{
    boundaryType: "ownership_boundary",
    participantStatement: "Finance handles the rule.",
    workflowArea: "decision",
    participantSuggestedOwner: "Finance",
    requiresEscalation: false,
    suggestedEscalationTarget: "none",
    shouldStopAskingParticipant: true,
    confidenceLevel: "high",
  }],
  recommendedAdminReview: true,
});
const boundaryOnly = await runClarificationAnswerRecheck(
  "session-boundary-only",
  answerEvidence.evidenceItemId,
  clarificationRepos(repos),
  boundaryOnlyProvider,
  { now: () => now, providerJobIdFactory: () => "provider-job-boundary-only", boundarySignalIdFactory: () => "boundary-signal-boundary-only" },
);
assert.equal(boundaryOnly.ok, true, boundaryOnly.ok ? "" : JSON.stringify(boundaryOnly.errors));
assert.equal(boundaryOnly.value.updatedCandidates.length, 0);
assert.equal(boundaryOnly.value.createdCandidates.length, 0);
assert.equal(boundaryOnly.value.createdBoundarySignals.length, 1);
assert.equal(repos.boundarySignals.findBySessionId("session-boundary-only")[0]?.shouldStopAskingParticipant, true);
assert.equal(repos.providerJobs.findById("provider-job-boundary-only")?.status, "succeeded");
assert.ok(boundaryOnlyProvider.lastPrompt.includes("candidateStatusUpdates"));
assert.ok(boundaryOnlyProvider.lastPrompt.includes("boundarySignals"));
assert.ok(boundaryOnlyProvider.lastPrompt.includes("Do not include deprecated keys candidateStatusProposals or newBoundarySignals."));

const noOpAnswerEvidence = seedAnsweredCandidate(repos, "session-no-op", "candidate-no-op", "evidence-no-op");
const noOpProvider = new FixtureExecutor({
  candidateStatusUpdates: [],
  newClarificationCandidates: [],
  boundarySignals: [],
  recommendedAdminReview: true,
});
const noOp = await runClarificationAnswerRecheck(
  "session-no-op",
  noOpAnswerEvidence.evidenceItemId,
  clarificationRepos(repos),
  noOpProvider,
  { now: () => now, providerJobIdFactory: () => "provider-job-no-op", boundarySignalIdFactory: () => "boundary-signal-no-op" },
);
assert.equal(noOp.ok, false);
assert.equal(noOp.errors[0].code, "schema_validation_failed");
assert.match(noOp.errors[0].message, /no governed outcome/);
assert.equal(repos.providerJobs.findById("provider-job-no-op")?.status, "failed");

console.log(JSON.stringify({
  ok: true,
  boundaryOnlyAcceptedWithoutUpdatedCandidates: boundaryOnly.value.updatedCandidates.length === 0
    && boundaryOnly.value.createdBoundarySignals.length === 1,
  noSilentNoOpAccepted: noOp.ok === false,
  boundaryOnlyJobStatus: repos.providerJobs.findById("provider-job-boundary-only")?.status,
  noOpJobStatus: repos.providerJobs.findById("provider-job-no-op")?.status,
  answerEvidencePreserved: repos.rawEvidenceItems.findById("evidence-boundary-only")?.rawContent === answerEvidence.rawContent,
}, null, 2));
