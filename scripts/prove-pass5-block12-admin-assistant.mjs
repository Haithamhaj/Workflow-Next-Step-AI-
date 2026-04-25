import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  buildAdminAssistantContextBundle,
  classifyAdminAssistantQuestion,
  runAdminAssistantQuestion,
} from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";

function session(sessionId, overrides = {}) {
  return {
    sessionId,
    caseId: "case-pass5-block12",
    targetingPlanId: "targeting-plan-pass5-block12",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: overrides.participantLabel ?? "Operations participant",
    participantRoleOrNodeId: overrides.participantRoleOrNodeId ?? "role-operations",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
    languagePreference: "en",
    sessionState: overrides.sessionState ?? "clarification_needed",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-pass5-block12",
      targetingPlanId: "targeting-plan-pass5-block12",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: overrides.participantLabel ?? "Operations participant",
      participantRoleOrNodeId: overrides.participantRoleOrNodeId ?? "role-operations",
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
    rawEvidence: { rawEvidenceItems: [], firstNarrativeEvidenceId: "evidence-1" },
    analysisProgress: {
      firstNarrativeStatus: "received_text",
      extractionStatus: overrides.extractionStatus ?? "completed_with_defects",
      clarificationItemIds: ["clarification-1"],
      boundarySignalIds: ["boundary-1"],
      unresolvedItemIds: ["unmapped-1"],
      nextActionIds: ["next-action-1"],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: "evidence-1",
    extractionStatus: overrides.extractionStatus ?? "completed_with_defects",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function evidence(evidenceItemId, sessionId, rawContent, overrides = {}) {
  return {
    evidenceItemId,
    sessionId,
    evidenceType: "participant_text_narrative",
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
    notes: "",
    ...overrides,
  };
}

const anchor = { evidenceItemId: "evidence-1", quote: "manager approval is needed for sensitive prices" };
const extractedItem = {
  itemId: "step-1",
  label: "Check sensitive price",
  description: "Participant checks whether manager approval is needed.",
  evidenceAnchors: [anchor],
  sourceTextSpan: anchor,
  completenessStatus: "partial",
  confidenceLevel: "medium",
  needsClarification: true,
  clarificationReason: "Sensitive price condition is vague.",
  relatedItemIds: [],
  adminReviewStatus: "review_required",
  createdFrom: "ai_extraction",
};

function extractionOutput() {
  return {
    extractionId: "extraction-1",
    sessionId: "session-1",
    basisEvidenceItemIds: ["evidence-1"],
    extractionStatus: "completed_with_defects",
    extractedActors: [],
    extractedSteps: [extractedItem],
    sequenceMap: {
      orderedItemIds: ["step-1"],
      sequenceLinks: [],
      unclearTransitions: [],
      notes: ["Participant-level sequence only."],
    },
    extractedDecisionPoints: [],
    extractedHandoffs: [],
    extractedExceptions: [],
    extractedSystems: [],
    extractedControls: [],
    extractedDependencies: [],
    extractedUnknowns: [],
    boundarySignals: [],
    clarificationCandidates: [],
    confidenceNotes: ["Needs admin review."],
    contradictionNotes: [],
    sourceCoverageSummary: "processedEvidenceItemIds=evidence-1; fullContentProcessed=true; mappedItemCount=1; unmappedContentCount=1; extractionDefectCount=1; evidenceDisputeCount=1; reviewSensitivity=review_sensitive",
    unmappedContentItems: [{
      unmappedItemId: "unmapped-1",
      sessionId: "session-1",
      evidenceItemId: "evidence-1",
      quote: "Sometimes another team handles it.",
      reasonUnmapped: "Owner is unclear.",
      possibleCategory: "unknown",
      confidenceLevel: "low",
      needsAdminReview: true,
      needsParticipantClarification: true,
      suggestedClarificationCandidateId: "clarification-1",
      createdAt: now,
    }],
    extractionDefects: [{
      defectId: "defect-1",
      defectType: "ambiguous_actor_or_owner",
      description: "Owner is ambiguous.",
      affectedOutputSection: "extractedSteps",
      affectedItemId: "step-1",
      basisEvidenceItemId: "evidence-1",
      severity: "medium",
      recommendedAction: "admin_review",
      createdAt: now,
    }],
    evidenceDisputes: [{
      disputeId: "dispute-1",
      sessionId: "session-1",
      extractionId: "extraction-1",
      affectedItemId: "step-1",
      aiProposedInterpretation: "Manager approval is always needed.",
      aiProposedEvidenceAnchor: anchor,
      codeValidationIssue: "The quote only supports conditional approval.",
      disputeType: "weak_semantic_support",
      severity: "medium",
      recommendedAction: "admin_review",
      adminDecision: "pending",
      createdAt: now,
    }],
    createdAt: now,
  };
}

function clarificationCandidate() {
  return {
    candidateId: "clarification-1",
    sessionId: "session-1",
    linkedExtractedItemIds: ["step-1"],
    linkedUnmappedItemIds: ["unmapped-1"],
    linkedDefectIds: ["defect-1"],
    linkedRawEvidenceItemIds: ["evidence-1"],
    gapType: "vague_decision_rule",
    questionTheme: "Sensitive price condition",
    participantFacingQuestion: "What makes a price sensitive enough for manager approval?",
    whyItMatters: "It clarifies the decision rule.",
    exampleAnswer: "For example, discounts above 15 percent need approval.",
    priority: "high",
    askNext: true,
    status: "open",
    createdFrom: "extraction",
    adminInstruction: "Clarify sensitive price.",
    aiFormulated: true,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
  };
}

function boundarySignal() {
  return {
    boundarySignalId: "boundary-1",
    sessionId: "session-1",
    boundaryType: "ownership_boundary",
    participantStatement: "Finance handles this part.",
    linkedEvidenceItemId: "evidence-1",
    linkedExtractedItemIds: ["step-1"],
    linkedClarificationCandidateIds: ["clarification-1"],
    workflowArea: "decision",
    interpretationNote: "Participant indicates another-team ownership.",
    requiresEscalation: true,
    suggestedEscalationTarget: "externalTeam",
    participantSuggestedOwner: "Finance",
    escalationReason: "Finance owns approval rule.",
    shouldStopAskingParticipant: true,
    confidenceLevel: "medium",
    createdAt: now,
  };
}

function seedStore() {
  const store = createInMemoryStore();
  store.participantSessions.save(session("session-1"));
  store.participantSessions.save(session("session-2", {
    participantLabel: "Finance participant",
    participantRoleOrNodeId: "role-finance",
    extractionStatus: "completed_clean",
    sessionState: "first_pass_extraction_ready",
    firstNarrativeEvidenceId: "evidence-2",
    rawEvidence: { rawEvidenceItems: [], firstNarrativeEvidenceId: "evidence-2" },
  }));
  store.participantSessions.save(session("session-other-case", { caseId: "case-other" }));
  store.rawEvidenceItems.save(evidence("evidence-1", "session-1", "I check the request. If the price is sensitive, manager approval is needed. Finance handles the final policy rule."));
  store.rawEvidenceItems.save(evidence("evidence-2", "session-2", "Finance reviews the policy rule and confirms whether approval is required."));
  store.firstPassExtractionOutputs.save(extractionOutput());
  store.clarificationCandidates.save(clarificationCandidate());
  store.boundarySignals.save(boundarySignal());
  store.evidenceDisputes.save(extractionOutput().evidenceDisputes[0]);
  store.sessionNextActions.save({
    nextActionId: "next-action-1",
    sessionId: "session-1",
    actionType: "review_extraction_defects",
    label: "Review extraction defects",
    reason: "Extraction output has defects.",
    blocking: true,
    priority: "high",
    relatedPanel: "Analysis Progress",
    relatedItemIds: ["defect-1"],
    recommendedAdminAction: "Review defect before later synthesis.",
    createdAt: now,
    updatedAt: now,
  });
  return store;
}

function assistantRepos(store) {
  return {
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
}

assert.equal(classifyAdminAssistantQuestion("What is the clarification status?"), "clarification_status_question");
assert.equal(classifyAdminAssistantQuestion("Compare the selected participants"), "cross_session_comparison");
assert.equal(classifyAdminAssistantQuestion("Should this become a Pass 6 handoff candidate?"), "pass6_handoff_candidate_suggestion");

const store = seedStore();
const repos = assistantRepos(store);
const bundle = buildAdminAssistantContextBundle({
  question: "What evidence supports the manager approval point?",
  scope: "current_session",
  sessionId: "session-1",
}, repos, { now: () => now, questionIdFactory: () => "assistant-question-1" });
assert.ok(bundle);
assert.equal(bundle.queryIntent, "evidence_question");
assert.equal(bundle.scope, "current_session");
assert.ok(bundle.structuredRecords.some((record) => record.recordType === "ParticipantSession" && record.recordId === "session-1"));
assert.ok(bundle.structuredRecords.some((record) => record.recordType === "RawEvidenceItem" && record.recordId === "evidence-1"));
assert.ok(bundle.evidenceSnippets.some((snippet) => snippet.evidenceItemId === "evidence-1" && snippet.quote.includes("manager approval")));
assert.equal(bundle.structuredRecords.some((record) => record.recordId === "session-2"), false);

const caseBundle = buildAdminAssistantContextBundle({
  question: "Compare participants without doing Pass 6 synthesis",
  scope: "case_pass5",
  caseId: "case-pass5-block12",
}, repos, { now: () => now, questionIdFactory: () => "assistant-question-2" });
assert.ok(caseBundle);
assert.equal(caseBundle.queryIntent, "cross_session_comparison");
assert.ok(caseBundle.structuredRecords.some((record) => record.recordId === "session-1"));
assert.ok(caseBundle.structuredRecords.some((record) => record.recordId === "session-2"));
assert.ok(caseBundle.excludedRecordsReason.some((reason) => reason.recordId === "session-other-case"));

const beforeCounts = {
  sessions: store.participantSessions.findAll().length,
  evidence: store.rawEvidenceItems.findAll().length,
  candidates: store.clarificationCandidates.findAll().length,
  boundaries: store.boundarySignals.findAll().length,
  handoffs: store.pass6HandoffCandidates.findAll().length,
};

const result = await runAdminAssistantQuestion({
  question: "What is the evidence dispute and next action?",
  scope: "current_session",
  sessionId: "session-1",
}, repos, null, {
  now: () => now,
  questionIdFactory: () => "assistant-question-3",
  providerJobIdFactory: () => "assistant-provider-job-1",
});
assert.equal(result.ok, true);
assert.equal(result.intent, "evidence_dispute_question");
assert.equal(result.answer.providerStatus, "not_configured");
assert.equal(result.answer.noMutationPerformed, true);
assert.ok(result.answer.references.includes("EvidenceDispute:dispute-1") || result.answer.references.some((ref) => ref.includes("FirstPassExtractionOutput:extraction-1")));
assert.ok(result.answer.routedActionSuggestions.some((action) => action.owningArea === "evidence_review" && action.requiresAdminConfirmation));
assert.equal(store.providerJobs.findById("assistant-provider-job-1").status, "failed");
assert.match(store.providerJobs.findById("assistant-provider-job-1").errorMessage, /provider_not_configured/);

const handoffResult = await runAdminAssistantQuestion({
  question: "Should this be a Pass 6 handoff candidate?",
  scope: "selected_sessions",
  selectedSessionIds: ["session-1", "session-2"],
}, repos, null, {
  now: () => now,
  questionIdFactory: () => "assistant-question-4",
  providerJobIdFactory: () => "assistant-provider-job-2",
});
assert.equal(handoffResult.ok, true);
assert.equal(handoffResult.intent, "pass6_handoff_candidate_suggestion");
assert.ok(handoffResult.answer.routedActionSuggestions.some((action) => action.owningArea === "pass6_handoff_candidate_review"));

assert.equal(store.participantSessions.findAll().length, beforeCounts.sessions);
assert.equal(store.rawEvidenceItems.findAll().length, beforeCounts.evidence);
assert.equal(store.clarificationCandidates.findAll().length, beforeCounts.candidates);
assert.equal(store.boundarySignals.findAll().length, beforeCounts.boundaries);
assert.equal(store.pass6HandoffCandidates.findAll().length, beforeCounts.handoffs);

const unsupported = await runAdminAssistantQuestion({
  question: "Tell me a joke",
  scope: "current_session",
  sessionId: "session-1",
}, repos, null, {
  now: () => now,
  questionIdFactory: () => "assistant-question-5",
});
assert.equal(unsupported.ok, false);
assert.equal(unsupported.errors[0].code, "unsupported_intent");

const detailPage = readFileSync("apps/admin-web/app/participant-sessions/[sessionId]/page.tsx", "utf8");
const assistantRoute = readFileSync("apps/admin-web/app/api/participant-sessions/assistant/route.ts", "utf8");
assert.ok(detailPage.includes("Admin Assistant / Section Copilot"));
assert.ok(detailPage.includes("runAdminAssistantQuestion"));
assert.ok(assistantRoute.includes("runAdminAssistantQuestion"));
for (const banned of ["createFinalPackage", "runPass6", "whatsapp", "sendParticipantMessage"]) {
  assert.equal(detailPage.includes(banned), false, `${banned} should not appear in assistant panel`);
  assert.equal(assistantRoute.includes(banned), false, `${banned} should not appear in assistant route`);
}

console.log("Pass 5 Block 12 admin assistant proof passed.");
