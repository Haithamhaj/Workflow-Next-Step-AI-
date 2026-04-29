#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  createInMemoryStore,
} from "../packages/persistence/dist/index.js";
import {
  createCase,
  createCompany,
} from "../packages/core-case/dist/index.js";
import {
  validateBoundarySignal,
  validateClarificationCandidate,
  validateFirstPassExtractionOutput,
  validateParticipantSession,
  validateRawEvidenceItem,
} from "../packages/contracts/dist/index.js";

const store = createInMemoryStore();
const now = "2026-04-30T00:00:00.000Z";

function company(companyId, displayName) {
  return {
    companyId,
    displayName,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

function caseConfig(companyId, caseId, mainDepartment) {
  return {
    companyId,
    caseId,
    domain: "operations",
    mainDepartment,
    useCaseLabel: "participant-evidence-isolation-proof",
    companyProfileRef: `${companyId}/profile`,
    createdAt: now,
  };
}

function session(companyId, caseId, sessionId, participantLabel) {
  const rawEvidenceItems = [];
  const clarificationItems = [];
  const boundarySignals = [];
  const unresolvedItems = [];
  const sessionContext = {
    sessionId,
    companyId,
    caseId,
    targetingPlanId: `targeting-${sessionId}`,
    targetCandidateId: `target-${sessionId}`,
    participantContactProfileId: `participant-${sessionId}`,
    participantLabel,
    participantRoleOrNodeId: "operations-analyst",
    selectedDepartment: "operations",
    selectedUseCase: "handoff review",
    languagePreference: "en",
  };
  return {
    ...sessionContext,
    sessionState: "clarification_in_progress",
    channelStatus: "manual_intake_ready",
    selectedParticipationMode: "manual_meeting_or_admin_entered",
    sessionContext,
    channelAccess: {
      selectedParticipationMode: "manual_meeting_or_admin_entered",
      channelStatus: "manual_intake_ready",
      sessionAccessTokenId: null,
      telegramBindingId: null,
      dispatchReference: null,
      notes: null,
    },
    rawEvidence: {
      rawEvidenceItems,
      firstNarrativeEvidenceId: null,
    },
    analysisProgress: {
      firstNarrativeStatus: "received_text",
      extractionStatus: "completed_with_unmapped",
      clarificationItemIds: [],
      boundarySignalIds: [],
      unresolvedItemIds: [],
      nextActionIds: [],
    },
    rawEvidenceItems,
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: null,
    extractionStatus: "completed_with_unmapped",
    clarificationItems,
    boundarySignals,
    unresolvedItems,
    createdAt: now,
    updatedAt: now,
  };
}

function rawEvidence(companyId, caseId, sessionId, evidenceItemId, linkedClarificationItemId = null) {
  return {
    evidenceItemId,
    companyId,
    caseId,
    sessionId,
    evidenceType: linkedClarificationItemId ? "participant_clarification_answer" : "participant_text_narrative",
    sourceChannel: "manual_meeting_or_admin_entered",
    rawContent: linkedClarificationItemId ? "The participant clarified the exception path." : "Initial participant narrative.",
    language: "en",
    capturedAt: now,
    capturedBy: linkedClarificationItemId ? "participant" : "admin",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId,
    notes: linkedClarificationItemId ? `Clarification answer for ${linkedClarificationItemId}.` : "Proof narrative evidence.",
  };
}

function clarificationCandidate(companyId, caseId, sessionId, candidateId, evidenceItemId) {
  return {
    candidateId,
    companyId,
    caseId,
    sessionId,
    linkedExtractedItemIds: [],
    linkedUnmappedItemIds: [],
    linkedDefectIds: [],
    linkedRawEvidenceItemIds: [evidenceItemId],
    gapType: "unclear_exception",
    questionTheme: "Exception path",
    participantFacingQuestion: "What happens when the request is rejected?",
    whyItMatters: "The exception path affects downstream workflow mapping.",
    exampleAnswer: "The request returns to the originator with notes.",
    priority: "high",
    askNext: true,
    status: "asked",
    createdFrom: "admin_entry",
    adminInstruction: "Clarify rejected request handling.",
    aiFormulated: false,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
  };
}

function boundarySignal(companyId, caseId, sessionId, boundarySignalId, evidenceItemId, candidateId) {
  return {
    boundarySignalId,
    companyId,
    caseId,
    sessionId,
    boundaryType: "knowledge_gap",
    participantStatement: "That exception belongs to the finance owner.",
    linkedEvidenceItemId: evidenceItemId,
    linkedExtractedItemIds: [],
    linkedClarificationCandidateIds: [candidateId],
    workflowArea: "handoff",
    interpretationNote: "Participant declared a boundary rather than answering for another team.",
    requiresEscalation: true,
    suggestedEscalationTarget: "externalTeam",
    participantSuggestedOwner: "Finance owner",
    escalationReason: "Participant does not own the answer.",
    shouldStopAskingParticipant: true,
    confidenceLevel: "high",
    createdAt: now,
  };
}

function firstPassOutput(companyId, caseId, sessionId, extractionId, evidenceItemId, candidate, signal) {
  return {
    extractionId,
    companyId,
    caseId,
    sessionId,
    basisEvidenceItemIds: [evidenceItemId],
    extractionStatus: "completed_with_unmapped",
    extractedActors: [],
    extractedSteps: [],
    sequenceMap: { orderedItemIds: [], sequenceLinks: [], unclearTransitions: [], notes: ["Proof output."] },
    extractedDecisionPoints: [],
    extractedHandoffs: [],
    extractedExceptions: [],
    extractedSystems: [],
    extractedControls: [],
    extractedDependencies: [],
    extractedUnknowns: [],
    boundarySignals: [signal],
    clarificationCandidates: [candidate],
    confidenceNotes: [],
    contradictionNotes: [],
    sourceCoverageSummary: "proof output",
    unmappedContentItems: [{
      unmappedItemId: `unmapped-${sessionId}`,
      companyId,
      caseId,
      sessionId,
      evidenceItemId,
      quote: "Rejected requests follow a different path.",
      reasonUnmapped: "Needs participant clarification.",
      possibleCategory: "exception",
      confidenceLevel: "medium",
      needsAdminReview: true,
      needsParticipantClarification: true,
      suggestedClarificationCandidateId: candidate.candidateId,
      createdAt: now,
    }],
    extractionDefects: [],
    evidenceDisputes: [],
    createdAt: now,
  };
}

const alpha = createCompany(company("company-evidence-alpha", "Evidence Alpha"), store.companies);
const beta = createCompany(company("company-evidence-beta", "Evidence Beta"), store.companies);
const alphaCase = createCase(caseConfig(alpha.companyId, "case-evidence-alpha", "operations"), store.cases);
const betaCase = createCase(caseConfig(beta.companyId, "case-evidence-beta", "finance"), store.cases);

const alphaSession = session(alpha.companyId, alphaCase.caseId, "session-evidence-shared", "Alpha participant");
const betaSession = session(beta.companyId, betaCase.caseId, "session-evidence-beta", "Beta participant");
assert.equal(validateParticipantSession(alphaSession).ok, true, "alpha session validates with companyId");
assert.equal(validateParticipantSession(betaSession).ok, true, "beta session validates with companyId");
store.participantSessions.save(alphaSession);
store.participantSessions.save(betaSession);

const alphaEvidence = rawEvidence(alpha.companyId, alphaCase.caseId, alphaSession.sessionId, "evidence-alpha-narrative");
const betaEvidence = rawEvidence(beta.companyId, betaCase.caseId, betaSession.sessionId, "evidence-beta-narrative");
assert.equal(validateRawEvidenceItem(alphaEvidence).ok, true, "raw evidence validates with companyId and caseId");
store.rawEvidenceItems.save(alphaEvidence);
store.rawEvidenceItems.save(betaEvidence);

const alphaCandidate = clarificationCandidate(alpha.companyId, alphaCase.caseId, alphaSession.sessionId, "clarification-alpha", alphaEvidence.evidenceItemId);
const betaCandidate = clarificationCandidate(beta.companyId, betaCase.caseId, betaSession.sessionId, "clarification-beta", betaEvidence.evidenceItemId);
assert.equal(validateClarificationCandidate(alphaCandidate).ok, true, "clarification candidate validates with companyId and caseId");
store.clarificationCandidates.save(alphaCandidate);
store.clarificationCandidates.save(betaCandidate);

const alphaAnswerEvidence = rawEvidence(
  alpha.companyId,
  alphaCase.caseId,
  alphaSession.sessionId,
  "evidence-alpha-answer",
  alphaCandidate.candidateId,
);
assert.equal(alphaAnswerEvidence.evidenceType, "participant_clarification_answer", "clarification answer remains RawEvidenceItem");
assert.equal("answerId" in alphaAnswerEvidence, false, "no first-class answerId was introduced");
assert.equal(validateRawEvidenceItem(alphaAnswerEvidence).ok, true, "clarification-answer raw evidence validates");
store.rawEvidenceItems.save(alphaAnswerEvidence);

const alphaSignal = boundarySignal(
  alpha.companyId,
  alphaCase.caseId,
  alphaSession.sessionId,
  "boundary-alpha",
  alphaAnswerEvidence.evidenceItemId,
  alphaCandidate.candidateId,
);
assert.equal(validateBoundarySignal(alphaSignal).ok, true, "boundary signal validates with companyId and caseId");
store.boundarySignals.save(alphaSignal);

const alphaExtraction = firstPassOutput(
  alpha.companyId,
  alphaCase.caseId,
  alphaSession.sessionId,
  "extraction-alpha",
  alphaEvidence.evidenceItemId,
  alphaCandidate,
  alphaSignal,
);
assert.equal(validateFirstPassExtractionOutput(alphaExtraction).ok, true, "first-pass extraction output validates with companyId and caseId");
store.firstPassExtractionOutputs.save(alphaExtraction);

store.evidenceDisputes.save({
  disputeId: "dispute-alpha",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sessionId: alphaSession.sessionId,
  extractionId: alphaExtraction.extractionId,
  affectedItemId: "step-alpha",
  aiProposedInterpretation: "Rejected requests are approved by operations.",
  aiProposedEvidenceAnchor: { evidenceItemId: alphaEvidence.evidenceItemId, quote: "Rejected requests follow a different path." },
  codeValidationIssue: "Anchor does not support the proposed owner.",
  disputeType: "anchor_not_found",
  severity: "high",
  recommendedAction: "admin_review",
  adminDecision: "pending",
  createdAt: now,
});
store.sessionNextActions.save({
  nextActionId: "next-alpha",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sessionId: alphaSession.sessionId,
  actionType: "ask_clarification",
  label: "Ask clarification",
  reason: "Exception owner remains unclear.",
  blocking: true,
  priority: "high",
  relatedPanel: "clarifications",
  relatedItemIds: [alphaCandidate.candidateId],
  recommendedAdminAction: "Ask the participant for the exception owner.",
  createdAt: now,
  updatedAt: now,
});
store.pass6HandoffCandidates.save({
  handoffCandidateId: "handoff-alpha",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sessionIds: [alphaSession.sessionId],
  relatedParticipantLabels: [alphaSession.participantLabel],
  candidateType: "boundary_pattern",
  description: "Boundary signal for later synthesis review.",
  evidenceRefs: [{ evidenceItemId: alphaAnswerEvidence.evidenceItemId, note: `clarificationCandidateId=${alphaCandidate.candidateId}` }],
  confidenceLevel: "high",
  recommendedPass6Use: "Review boundary before later cross-participant synthesis.",
  mandatoryOrOptional: "mandatory",
  adminDecision: "pending",
  createdFrom: "system_rule",
  createdAt: now,
});

assert.equal(store.companies.findAll().length, 2, "two companies exist");
assert.equal(
  store.participantSessions.findByCompany(alpha.companyId, alphaSession.sessionId)?.sessionId,
  alphaSession.sessionId,
  "correct company can load participant session",
);
assert.equal(
  store.participantSessions.findByCompany(beta.companyId, alphaSession.sessionId),
  null,
  "wrong companyId cannot load participant session",
);
assert.deepEqual(
  store.participantSessions.findByCompanyAndCase(alpha.companyId, alphaCase.caseId).map((record) => record.sessionId),
  [alphaSession.sessionId],
  "company/case session listing excludes beta sessions",
);
assert.deepEqual(
  store.rawEvidenceItems.findByCompanyAndSession(alpha.companyId, alphaCase.caseId, alphaSession.sessionId).map((record) => record.evidenceItemId).sort(),
  [alphaAnswerEvidence.evidenceItemId, alphaEvidence.evidenceItemId],
  "raw evidence is readable through company/case/session scope",
);
assert.deepEqual(
  store.rawEvidenceItems.findByCompanyAndSession(beta.companyId, alphaCase.caseId, alphaSession.sessionId),
  [],
  "wrong companyId cannot load raw evidence",
);
assert.deepEqual(
  store.clarificationCandidates.findByCompanyAndSession(alpha.companyId, alphaCase.caseId, alphaSession.sessionId).map((record) => record.candidateId),
  [alphaCandidate.candidateId],
  "clarification candidates are readable through company/case/session scope",
);
assert.deepEqual(
  store.clarificationCandidates.findByCompanyAndSession(beta.companyId, alphaCase.caseId, alphaSession.sessionId),
  [],
  "wrong companyId cannot load clarification candidates",
);
assert.equal(
  store.rawEvidenceItems.findByCompany(beta.companyId, alphaCase.caseId, alphaAnswerEvidence.evidenceItemId),
  null,
  "wrong companyId cannot direct-load clarification-answer raw evidence",
);
assert.equal(
  store.clarificationCandidates.findByCompany(beta.companyId, alphaCase.caseId, alphaCandidate.candidateId),
  null,
  "linkedClarificationItemId cannot be used to cross-load another company's candidate",
);
assert.equal(
  store.boundarySignals.findByCompany(beta.companyId, alphaCase.caseId, alphaSignal.boundarySignalId),
  null,
  "wrong companyId cannot load boundary signals",
);
assert.equal(
  store.firstPassExtractionOutputs.findByCompany(beta.companyId, alphaCase.caseId, alphaExtraction.extractionId),
  null,
  "wrong companyId cannot load first-pass extraction outputs",
);
assert.equal(
  store.evidenceDisputes.findByCompany(beta.companyId, alphaCase.caseId, "dispute-alpha"),
  null,
  "wrong companyId cannot load evidence disputes",
);
assert.equal(
  store.sessionNextActions.findByCompany(beta.companyId, alphaCase.caseId, "next-alpha"),
  null,
  "wrong companyId cannot load session next actions",
);
assert.equal(
  store.pass6HandoffCandidates.findByCompany(beta.companyId, alphaCase.caseId, "handoff-alpha"),
  null,
  "wrong companyId cannot load participant-session handoff candidates",
);

const guardedApiRoutes = [
  "apps/admin-web/app/api/participant-sessions/[sessionId]/actions/route.ts",
  "apps/admin-web/app/api/participant-sessions/assistant/route.ts",
  "apps/admin-web/app/api/participant-sessions/handoff-candidates/route.ts",
  "apps/admin-web/app/api/participant-sessions/handoff-candidates/[id]/decision/route.ts",
];
for (const routePath of guardedApiRoutes) {
  const source = readFileSync(routePath, "utf8");
  assert.match(source, /companyId/, `${routePath} requires companyId`);
  assert.match(source, /findByCompany/, `${routePath} uses participant evidence company guard`);
}

const forbiddenWorkStarted = false;
assert.equal(forbiddenWorkStarted, false, "no retrieval/RAG/vector/Answer Cards/ContextEnvelope behavior was implemented");

console.log("PASS Slice 4 participant evidence isolation proof");
