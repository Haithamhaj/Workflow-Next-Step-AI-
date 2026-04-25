import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  addAdminClarificationCandidate,
  createBoundarySignalFromAnswer,
  dismissClarificationCandidate,
  formulateClarificationQuestion,
  listOpenClarificationCandidates,
  markClarificationCandidateAsked,
  recordClarificationAnswer,
  runClarificationAnswerRecheck,
  selectNextClarificationCandidate,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block10-clarification.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function session(sessionId, overrides = {}) {
  return {
    sessionId,
    caseId: "case-pass5-block10",
    targetingPlanId: "targeting-plan-pass5-block10",
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
      caseId: "case-pass5-block10",
      targetingPlanId: "targeting-plan-pass5-block10",
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
    ...overrides,
  };
}

function candidate(sessionId, candidateId, overrides = {}) {
  return {
    candidateId,
    sessionId,
    linkedExtractedItemIds: [],
    linkedUnmappedItemIds: [],
    linkedDefectIds: [],
    linkedRawEvidenceItemIds: [],
    gapType: "missing_step_detail",
    questionTheme: "Approval condition",
    participantFacingQuestion: "What condition makes the order require manager approval?",
    whyItMatters: "It clarifies the decision rule.",
    exampleAnswer: "If the amount is above the limit, I ask the manager.",
    priority: "medium",
    askNext: false,
    status: "open",
    createdFrom: "extraction",
    adminInstruction: "Review before asking.",
    aiFormulated: true,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

class FixtureExecutor {
  constructor(outputs) {
    this.name = "google";
    this.outputs = [...outputs];
    this.lastPrompt = "";
  }

  async runPromptText(input) {
    this.lastPrompt = input.compiledPrompt;
    const next = this.outputs.shift();
    if (!next) throw new Error("No fixture output configured.");
    return {
      text: JSON.stringify(next),
      provider: "google",
      model: "deterministic-pass5-block10-fixture",
    };
  }
}

const repos = createSQLiteIntakeRepositories(dbPath);
const clarificationRepos = {
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
  clarificationCandidates: repos.clarificationCandidates,
  boundarySignals: repos.boundarySignals,
  providerJobs: repos.providerJobs,
  promptSpecs: repos.structuredPromptSpecs,
};
const options = {
  now: () => now,
  evidenceItemIdFactory: () => nextId("answer-evidence"),
  candidateIdFactory: () => nextId("candidate"),
  boundarySignalIdFactory: () => nextId("boundary"),
  providerJobIdFactory: () => nextId("provider-job"),
};

const mainSession = session("session-clarification-main");
repos.participantSessions.save(mainSession);
const askNextCandidate = candidate(mainSession.sessionId, "candidate-ask-next", { askNext: true, priority: "medium" });
const highCandidate = candidate(mainSession.sessionId, "candidate-high", { priority: "high", questionTheme: "Approver" });
const lowCandidate = candidate(mainSession.sessionId, "candidate-low", { priority: "low", questionTheme: "Low priority" });
const resolvedCandidate = candidate(mainSession.sessionId, "candidate-resolved", { status: "resolved", priority: "high" });
const dismissedCandidate = candidate(mainSession.sessionId, "candidate-dismissed", { status: "dismissed_by_admin", priority: "high" });
for (const item of [askNextCandidate, highCandidate, lowCandidate, resolvedCandidate, dismissedCandidate]) {
  repos.clarificationCandidates.save(item);
}

assert.equal(listOpenClarificationCandidates(mainSession.sessionId, clarificationRepos).length, 3);
let selected = selectNextClarificationCandidate(mainSession.sessionId, clarificationRepos);
assert.equal(selected.ok, true);
assert.equal(selected.value.candidate.candidateId, askNextCandidate.candidateId);

repos.clarificationCandidates.save({ ...askNextCandidate, askNext: false });
selected = selectNextClarificationCandidate(mainSession.sessionId, clarificationRepos);
assert.equal(selected.value.candidate.candidateId, highCandidate.candidateId);
assert.notEqual(selected.value.candidate.candidateId, resolvedCandidate.candidateId);
assert.notEqual(selected.value.candidate.candidateId, dismissedCandidate.candidateId);

const formulationExecutor = new FixtureExecutor([{
  participantFacingQuestion: "When does the order require manager approval?",
  whyItMatters: "This identifies the decision rule without guessing.",
  exampleAnswer: "It requires approval when the order amount is over the limit.",
}]);
const formulated = await formulateClarificationQuestion(highCandidate.candidateId, clarificationRepos, formulationExecutor, options);
assert.equal(formulated.ok, true);
assert.equal(formulated.value.candidate.participantFacingQuestion.includes(", and "), false);
assert.equal((formulated.value.candidate.participantFacingQuestion.match(/\?/g) ?? []).length, 1);

const asked = markClarificationCandidateAsked(highCandidate.candidateId, clarificationRepos, options);
assert.equal(asked.ok, true);
assert.equal(asked.value.status, "asked");
assert.equal(repos.participantSessions.findById(mainSession.sessionId).sessionState, "clarification_in_progress");
const askOther = markClarificationCandidateAsked(lowCandidate.candidateId, clarificationRepos, options);
assert.equal(askOther.ok, false);
assert.equal(askOther.errors[0].code, "active_question_already_exists");

const answer = recordClarificationAnswer({
  sessionId: mainSession.sessionId,
  candidateId: highCandidate.candidateId,
  answerText: "Manager approval is needed above 10,000 SAR. This also answers the low priority question, but Finance owns what happens after approval.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  capturedAt: now,
}, clarificationRepos, options);
assert.equal(answer.ok, true);
assert.equal(answer.value.evidenceType, "participant_clarification_answer");
assert.equal(answer.value.rawContent.includes("10,000 SAR"), true);
assert.equal(answer.value.linkedClarificationItemId, highCandidate.candidateId);
assert.equal(repos.clarificationCandidates.findById(highCandidate.candidateId).status, "answered");

const recheckExecutor = new FixtureExecutor([{
  candidateStatusUpdates: [
    { candidateId: highCandidate.candidateId, status: "resolved", reason: "Answer gives the approval threshold." },
    { candidateId: lowCandidate.candidateId, status: "resolved", reason: "Same answer resolves the lower-priority duplicate." },
    { candidateId: askNextCandidate.candidateId, status: "partially_resolved", reason: "Still needs one detail." },
  ],
  newClarificationCandidates: [{
    questionTheme: "Finance downstream ownership",
    participantFacingQuestion: "What does Finance do after approval?",
    whyItMatters: "It may identify a downstream boundary.",
    exampleAnswer: "Finance books the approved order.",
    gapType: "unclear_handoff",
    priority: "medium",
    askNext: false,
  }],
  boundarySignals: [{
    boundaryType: "downstream_workflow_boundary",
    participantStatement: "Finance owns what happens after approval.",
    workflowArea: "handoff",
    participantSuggestedOwner: "Finance",
    shouldStopAskingParticipant: true,
    requiresEscalation: false,
    suggestedEscalationTarget: "none",
    confidenceLevel: "high",
  }],
}]);
const recheck = await runClarificationAnswerRecheck(mainSession.sessionId, answer.value.evidenceItemId, clarificationRepos, recheckExecutor, options);
assert.equal(recheck.ok, true);
assert.equal(repos.clarificationCandidates.findById(highCandidate.candidateId).status, "resolved");
assert.equal(repos.clarificationCandidates.findById(lowCandidate.candidateId).status, "resolved");
assert.equal(repos.clarificationCandidates.findById(askNextCandidate.candidateId).status, "partially_resolved");
assert.equal(recheck.value.createdCandidates.length, 1);
assert.equal(recheck.value.createdBoundarySignals.length, 1);
assert.equal(recheck.value.createdBoundarySignals[0].shouldStopAskingParticipant, true);
assert.equal(repos.participantSessions.findById(mainSession.sessionId).sessionState, "clarification_needed");

const boundaryCandidate = recheck.value.createdCandidates[0];
repos.clarificationCandidates.save({ ...boundaryCandidate, askNext: true });
const boundarySignal = createBoundarySignalFromAnswer({
  sessionId: mainSession.sessionId,
  answerEvidenceId: answer.value.evidenceItemId,
  candidateId: boundaryCandidate.candidateId,
  boundaryType: "downstream_workflow_boundary",
  participantSuggestedOwner: "Finance",
  shouldStopAskingParticipant: true,
}, clarificationRepos, options);
assert.equal(boundarySignal.ok, true);
assert.equal(repos.clarificationCandidates.findById(boundaryCandidate.candidateId).status, "escalated");
const selectedAfterBoundary = selectNextClarificationCandidate(mainSession.sessionId, clarificationRepos);
assert.equal(selectedAfterBoundary.value.candidate.candidateId, askNextCandidate.candidateId);

const adminExact = await addAdminClarificationCandidate({
  sessionId: mainSession.sessionId,
  questionTheme: "Admin exact question",
  exactQuestion: "Which queue receives the approved order?",
  whyItMatters: "It clarifies the handoff.",
  exampleAnswer: "The fulfillment queue receives it.",
  askNext: true,
}, clarificationRepos, null, options);
assert.equal(adminExact.ok, true);
assert.equal(adminExact.value.createdFrom, "admin_entry");
assert.equal(adminExact.value.aiFormulated, false);

const adminExecutor = new FixtureExecutor([{
  participantFacingQuestion: "Who checks the exception before it is approved?",
  whyItMatters: "It clarifies exception ownership.",
  exampleAnswer: "The shift lead checks it first.",
}]);
const adminFormulated = await addAdminClarificationCandidate({
  sessionId: mainSession.sessionId,
  questionTheme: "Admin instruction question",
  instruction: "Ask who checks the exception before approval.",
  askNext: false,
}, clarificationRepos, adminExecutor, options);
assert.equal(adminFormulated.ok, true);
assert.equal(adminFormulated.value.createdFrom, "admin_entry");
assert.equal(adminFormulated.value.aiFormulated, true);

const dismissed = dismissClarificationCandidate(adminExact.value.candidateId, clarificationRepos, "Covered elsewhere.", options);
assert.equal(dismissed.ok, true);
assert.equal(dismissed.value.status, "dismissed_by_admin");
assert.ok(repos.clarificationCandidates.findById(adminExact.value.candidateId));

const providerMissing = await formulateClarificationQuestion(askNextCandidate.candidateId, clarificationRepos, null, options);
assert.equal(providerMissing.ok, false);
assert.equal(providerMissing.errors[0].code, "provider_not_configured");

repos.clarificationCandidates.save({ ...repos.clarificationCandidates.findById(askNextCandidate.candidateId), status: "resolved", askNext: false });
repos.clarificationCandidates.save({ ...repos.clarificationCandidates.findById(adminFormulated.value.candidateId), status: "resolved", askNext: false });
const finalAnswer = recordClarificationAnswer({
  sessionId: mainSession.sessionId,
  candidateId: askNextCandidate.candidateId,
  answerText: "The missing detail is now resolved.",
}, clarificationRepos, options);
assert.equal(finalAnswer.ok, true);
const finalRecheckExecutor = new FixtureExecutor([{
  candidateStatusUpdates: [{ candidateId: askNextCandidate.candidateId, status: "resolved", reason: "Resolved by final answer." }],
  newClarificationCandidates: [],
  boundarySignals: [],
}]);
const finalRecheck = await runClarificationAnswerRecheck(mainSession.sessionId, finalAnswer.value.evidenceItemId, clarificationRepos, finalRecheckExecutor, options);
assert.equal(finalRecheck.ok, true);
assert.equal(repos.participantSessions.findById(mainSession.sessionId).sessionState, "first_pass_extraction_ready");

assert.equal(repos.pass6HandoffCandidates.findAll().length, 0);
const reloaded = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloaded.rawEvidenceItems.findById(answer.value.evidenceItemId).rawContent.includes("10,000 SAR"), true);
assert.equal(reloaded.clarificationCandidates.findById(highCandidate.candidateId).status, "resolved");
assert.ok(reloaded.boundarySignals.findBySessionId(mainSession.sessionId).length >= 2);
assert.equal(reloaded.participantSessions.findById(mainSession.sessionId).sessionState, "first_pass_extraction_ready");

console.log("Pass 5 Block 10 clarification proof passed.");
console.log("Deterministic executors were test fixtures only; no participant-facing channel send occurred.");
