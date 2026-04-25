import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateFirstPassExtractionOutput } from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  approveTranscriptEvidence,
  createTranscriptEvidenceForReview,
  runFirstPassExtractionForSession,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block9-first-pass-extraction.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
let evidenceCounter = 0;
let extractionCounter = 0;

function participantSession(sessionId, overrides = {}) {
  return {
    sessionId,
    caseId: "case-pass5-block9",
    targetingPlanId: "targeting-plan-pass5-block9",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Operations participant",
    participantRoleOrNodeId: "role-operations-participant",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
    languagePreference: "en",
    sessionState: "first_narrative_received",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-pass5-block9",
      targetingPlanId: "targeting-plan-pass5-block9",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Operations participant",
      participantRoleOrNodeId: "role-operations-participant",
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
    rawEvidence: {
      rawEvidenceItems: [],
      firstNarrativeEvidenceId: null,
    },
    analysisProgress: {
      firstNarrativeStatus: "received_text",
      extractionStatus: "eligible",
      clarificationItemIds: [],
      boundarySignalIds: [],
      unresolvedItemIds: [],
      nextActionIds: [],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: null,
    extractionStatus: "eligible",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function evidence(sessionId, evidenceType, rawContent, overrides = {}) {
  const item = {
    evidenceItemId: `evidence-${++evidenceCounter}`,
    sessionId,
    evidenceType,
    sourceChannel: "web_session_chatbot",
    rawContent,
    language: "en",
    capturedAt: now,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Block 9 proof evidence.",
    ...overrides,
  };
  return item;
}

function anchor(evidenceItemId, quote = "I check the order") {
  return { evidenceItemId, quote, startOffset: 0, endOffset: quote.length, note: "Provider proposed anchor." };
}

function sourceTextSpan(evidenceItemId, quote = "I check the order") {
  return { evidenceItemId, quote, startOffset: 0, endOffset: quote.length };
}

function extractedItem(itemId, evidenceItemId, overrides = {}) {
  return {
    itemId,
    label: "Check order",
    description: "The participant checks the order details.",
    evidenceAnchors: [anchor(evidenceItemId)],
    sourceTextSpan: sourceTextSpan(evidenceItemId),
    completenessStatus: "clear",
    confidenceLevel: "high",
    needsClarification: false,
    clarificationReason: "",
    relatedItemIds: [],
    adminReviewStatus: "not_reviewed",
    createdFrom: "ai_extraction",
    ...overrides,
  };
}

function sequenceMap(evidenceItemId, overrides = {}) {
  return {
    orderedItemIds: ["step-1"],
    sequenceLinks: [],
    unclearTransitions: [],
    notes: ["Participant-level sequence draft only."],
    ...overrides,
  };
}

function clarificationCandidate(sessionId, evidenceItemId, linkedExtractedItemIds = []) {
  return {
    candidateId: `clarification-${sessionId}`,
    sessionId,
    linkedExtractedItemIds,
    linkedUnmappedItemIds: [],
    linkedDefectIds: [],
    linkedRawEvidenceItemIds: [evidenceItemId],
    gapType: "missing_step_detail",
    questionTheme: "Exception approval detail",
    participantFacingQuestion: "Who approves an exception when order details do not match?",
    whyItMatters: "It clarifies ownership for exception handling.",
    exampleAnswer: "Usually my supervisor approves it, or I send it to Finance.",
    priority: "high",
    askNext: true,
    status: "open",
    createdFrom: "extraction",
    adminInstruction: "Review before asking.",
    aiFormulated: true,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
  };
}

function boundarySignal(sessionId, evidenceItemId) {
  return {
    boundarySignalId: `boundary-${sessionId}`,
    sessionId,
    boundaryType: "ownership_boundary",
    participantStatement: "I do not know what Finance does after I send it.",
    linkedEvidenceItemId: evidenceItemId,
    linkedExtractedItemIds: [],
    linkedClarificationCandidateIds: [],
    workflowArea: "handoff",
    interpretationNote: "Participant states downstream ownership boundary.",
    requiresEscalation: false,
    suggestedEscalationTarget: "none",
    participantSuggestedOwner: "Finance",
    escalationReason: null,
    shouldStopAskingParticipant: true,
    confidenceLevel: "high",
    createdAt: now,
  };
}

function unmappedItem(sessionId, evidenceItemId) {
  return {
    unmappedItemId: `unmapped-${sessionId}`,
    sessionId,
    evidenceItemId,
    sourceTextSpan: sourceTextSpan(evidenceItemId, "Sometimes it depends"),
    quote: "Sometimes it depends",
    reasonUnmapped: "The condition is too vague to map safely.",
    possibleCategory: "unclear",
    confidenceLevel: "low",
    needsAdminReview: true,
    needsParticipantClarification: true,
    suggestedClarificationCandidateId: null,
    createdAt: now,
  };
}

function extractionOutput(sessionId, evidenceItemId, overrides = {}) {
  const output = {
    extractionId: `extraction-${++extractionCounter}`,
    sessionId,
    basisEvidenceItemIds: [evidenceItemId],
    extractionStatus: "completed_clean",
    extractedActors: [],
    extractedSteps: [extractedItem("step-1", evidenceItemId)],
    sequenceMap: sequenceMap(evidenceItemId),
    extractedDecisionPoints: [],
    extractedHandoffs: [],
    extractedExceptions: [],
    extractedSystems: [],
    extractedControls: [],
    extractedDependencies: [],
    extractedUnknowns: [],
    boundarySignals: [],
    clarificationCandidates: [],
    confidenceNotes: ["High confidence for the simple first step."],
    contradictionNotes: [],
    sourceCoverageSummary: "provider draft before governed source coverage rewrite",
    unmappedContentItems: [],
    extractionDefects: [],
    evidenceDisputes: [],
    createdAt: now,
    ...overrides,
  };
  return output;
}

class FixtureExtractionProvider {
  constructor(outputFactory) {
    this.name = "google";
    this.outputFactory = outputFactory;
    this.lastPrompt = "";
  }

  async runPromptText(input) {
    this.lastPrompt = input.compiledPrompt;
    return {
      text: JSON.stringify(this.outputFactory(input.compiledPrompt)),
      provider: "google",
      model: "deterministic-pass5-block9-fixture",
    };
  }
}

const repos = createSQLiteIntakeRepositories(dbPath);
const baseRepos = {
  participantSessions: repos.participantSessions,
  rawEvidenceItems: repos.rawEvidenceItems,
  firstPassExtractionOutputs: repos.firstPassExtractionOutputs,
  clarificationCandidates: repos.clarificationCandidates,
  boundarySignals: repos.boundarySignals,
  evidenceDisputes: repos.evidenceDisputes,
  providerJobs: repos.providerJobs,
  promptSpecs: repos.structuredPromptSpecs,
};
const options = {
  now: () => now,
  providerJobIdFactory: () => `provider-job-${++extractionCounter}`,
  defectIdFactory: () => `defect-${++extractionCounter}`,
  disputeIdFactory: () => `dispute-${++extractionCounter}`,
};

const cleanSession = participantSession("session-clean");
const cleanEvidence = evidence(cleanSession.sessionId, "participant_text_narrative", "I check the order, then I approve it if all details match.");
repos.participantSessions.save({ ...cleanSession, firstNarrativeEvidenceId: cleanEvidence.evidenceItemId });
repos.rawEvidenceItems.save(cleanEvidence);
const cleanProvider = new FixtureExtractionProvider(() => extractionOutput(cleanSession.sessionId, cleanEvidence.evidenceItemId));
const cleanResult = await runFirstPassExtractionForSession(cleanSession.sessionId, baseRepos, cleanProvider, options);
assert.equal(cleanResult.ok, true);
assert.match(cleanProvider.lastPrompt, /Full eligible participant evidence follows/);
assert.match(cleanProvider.lastPrompt, /I check the order, then I approve it/);
assert.equal(cleanResult.createdExtraction.extractionStatus, "completed_clean");
assert.equal(cleanResult.createdExtraction.extractedSteps[0].evidenceAnchors.length, 1);
assert.equal(validateFirstPassExtractionOutput(cleanResult.createdExtraction).ok, true);
assert.equal(repos.firstPassExtractionOutputs.findById(cleanResult.extractionId)?.extractionId, cleanResult.extractionId);
const updatedCleanSession = repos.participantSessions.findById(cleanSession.sessionId);
assert.equal(updatedCleanSession.extractionStatus, "completed_clean");
assert.equal(updatedCleanSession.sessionState, "first_pass_extraction_ready");

const gapSession = participantSession("session-gaps");
const gapEvidence = evidence(
  gapSession.sessionId,
  "participant_text_narrative",
  "I check the order. Sometimes it depends. I do not know what Finance does after I send it.",
);
repos.participantSessions.save(gapSession);
repos.rawEvidenceItems.save(gapEvidence);
const gapProvider = new FixtureExtractionProvider(() => extractionOutput(gapSession.sessionId, gapEvidence.evidenceItemId, {
  extractedSteps: [
    extractedItem("step-1", gapEvidence.evidenceItemId),
    extractedItem("step-no-anchor", gapEvidence.evidenceItemId, {
      evidenceAnchors: [],
      sourceTextSpan: {},
      label: "Unsupported inferred step",
      description: "AI inferred a step without evidence.",
    }),
    extractedItem("step-bad-anchor", "evidence-does-not-exist", {
      itemId: "step-bad-anchor",
      label: "Unsupported handoff",
      description: "AI proposed a handoff using a missing evidence id.",
    }),
  ],
  sequenceMap: sequenceMap(gapEvidence.evidenceItemId, {
    orderedItemIds: ["step-1", "step-bad-anchor"],
    sequenceLinks: [{
      fromItemId: "step-1",
      toItemId: "step-bad-anchor",
      relationType: "unknown",
      condition: "Unclear from one participant.",
      evidenceAnchors: [anchor("evidence-does-not-exist", "missing quote")],
      confidenceLevel: "low",
    }],
    unclearTransitions: [{
      fromItemId: "step-1",
      toItemId: "step-bad-anchor",
      reasonUnclear: "The participant did not explain sequence.",
      needsClarification: true,
      suggestedClarificationCandidateId: `clarification-${gapSession.sessionId}`,
    }],
    notes: ["Participant-level sequence remains unclear."],
  }),
  clarificationCandidates: [clarificationCandidate(gapSession.sessionId, gapEvidence.evidenceItemId, ["step-1"])],
  boundarySignals: [boundarySignal(gapSession.sessionId, gapEvidence.evidenceItemId)],
  unmappedContentItems: [unmappedItem(gapSession.sessionId, gapEvidence.evidenceItemId)],
}));
const gapResult = await runFirstPassExtractionForSession(gapSession.sessionId, baseRepos, gapProvider, options);
assert.equal(gapResult.ok, true);
assert.equal(gapResult.createdExtraction.extractedSteps.some((item) => item.itemId === "step-no-anchor"), false);
assert.ok(gapResult.defects.some((defect) => defect.defectType === "missing_evidence_anchor"));
assert.ok(gapResult.evidenceDisputes.some((dispute) => dispute.codeValidationIssue.includes("not an eligible evidence item")));
assert.equal(gapResult.unmappedContentItems.length, 1);
assert.equal(gapResult.createdClarificationCandidates.length, 1);
assert.equal(gapResult.createdClarificationCandidates[0].status, "open");
assert.notEqual(gapResult.createdClarificationCandidates[0].status, "asked");
assert.equal(gapResult.createdBoundarySignals.length, 1);
assert.match(gapResult.createdExtraction.sourceCoverageSummary, /unmappedContentCount=1/);
assert.match(gapResult.createdExtraction.sourceCoverageSummary, /extractionDefectCount=/);
assert.match(gapResult.createdExtraction.sourceCoverageSummary, /evidenceDisputeCount=/);
const updatedGapSession = repos.participantSessions.findById(gapSession.sessionId);
assert.equal(updatedGapSession.sessionState, "clarification_needed");
assert.equal(updatedGapSession.extractionStatus, "completed_with_evidence_disputes");
assert.equal(repos.clarificationCandidates.findOpenBySessionId(gapSession.sessionId).length, 1);
assert.equal(repos.boundarySignals.findBySessionId(gapSession.sessionId).length, 1);
assert.ok(repos.evidenceDisputes.findByExtractionId(gapResult.extractionId).length >= 1);

const audioSession = participantSession("session-audio-only", {
  sessionState: "transcript_pending_review",
  firstNarrativeStatus: "received_voice_pending_transcript",
  extractionStatus: "blocked_evidence_not_approved",
});
const audioEvidence = evidence(audioSession.sessionId, "audio_recording_uploaded", undefined, {
  artifactRef: "artifact://audio-only.webm",
  rawContent: undefined,
  originalFileName: "audio-only.webm",
});
repos.participantSessions.save(audioSession);
repos.rawEvidenceItems.save(audioEvidence);
const audioResult = await runFirstPassExtractionForSession(audioSession.sessionId, baseRepos, cleanProvider, options);
assert.equal(audioResult.ok, false);
assert.equal(audioResult.errors[0].code, "no_eligible_evidence");
assert.equal(repos.firstPassExtractionOutputs.findBySessionId(audioSession.sessionId).length, 0);

const rawTranscriptSession = participantSession("session-raw-transcript", {
  sessionState: "transcript_pending_review",
  firstNarrativeStatus: "transcript_pending_review",
  extractionStatus: "blocked_evidence_not_approved",
});
repos.participantSessions.save(rawTranscriptSession);
const rawTranscript = createTranscriptEvidenceForReview({
  evidenceItemId: "raw-transcript-evidence",
  sessionId: rawTranscriptSession.sessionId,
  evidenceType: "speech_to_text_transcript_raw",
  rawContent: "Raw transcript awaiting review.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  capturedAt: now,
}, repos.rawEvidenceItems);
const rawTranscriptResult = await runFirstPassExtractionForSession(rawTranscriptSession.sessionId, baseRepos, cleanProvider, options);
assert.equal(rawTranscriptResult.ok, false);
assert.equal(rawTranscriptResult.errors[0].code, "no_eligible_evidence");

const approvedResult = approveTranscriptEvidence(rawTranscript.evidenceItemId, {
  rawEvidenceItems: repos.rawEvidenceItems,
  participantSessions: repos.participantSessions,
}, options);
assert.equal(approvedResult.ok, true);
const transcriptProvider = new FixtureExtractionProvider(() => extractionOutput(rawTranscriptSession.sessionId, rawTranscript.evidenceItemId));
const approvedTranscriptExtraction = await runFirstPassExtractionForSession(rawTranscriptSession.sessionId, baseRepos, transcriptProvider, options);
assert.equal(approvedTranscriptExtraction.ok, true);
assert.equal(approvedTranscriptExtraction.createdExtraction.basisEvidenceItemIds[0], rawTranscript.evidenceItemId);

const noProviderSession = participantSession("session-no-provider");
const noProviderEvidence = evidence(noProviderSession.sessionId, "participant_text_narrative", "I enter the order.");
repos.participantSessions.save(noProviderSession);
repos.rawEvidenceItems.save(noProviderEvidence);
const noProviderResult = await runFirstPassExtractionForSession(noProviderSession.sessionId, baseRepos, null, options);
assert.equal(noProviderResult.ok, false);
assert.equal(noProviderResult.errors[0].code, "provider_not_configured");
assert.equal(repos.firstPassExtractionOutputs.findBySessionId(noProviderSession.sessionId).length, 0);
assert.equal(repos.providerJobs.findById(noProviderResult.providerJobId).status, "failed");

assert.equal(repos.pass6HandoffCandidates.findAll().length, 0);

const reloadedRepos = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloadedRepos.firstPassExtractionOutputs.findById(gapResult.extractionId).extractionId, gapResult.extractionId);
assert.equal(reloadedRepos.clarificationCandidates.findOpenBySessionId(gapSession.sessionId).length, 1);
assert.equal(reloadedRepos.boundarySignals.findBySessionId(gapSession.sessionId).length, 1);
assert.ok(reloadedRepos.evidenceDisputes.findByExtractionId(gapResult.extractionId).length >= 1);
assert.ok(reloadedRepos.firstPassExtractionOutputs.findById(gapResult.extractionId).extractionDefects.length >= 1);

console.log("Pass 5 Block 9 first-pass extraction proof passed.");
console.log("Deterministic extraction provider was a test fixture only; no real provider success is claimed.");
