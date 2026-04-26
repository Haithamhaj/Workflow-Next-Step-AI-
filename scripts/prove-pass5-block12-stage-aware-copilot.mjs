import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  buildAdminAssistantContextBundle,
  classifyAdminAssistantQuestion,
  runAdminAssistantQuestion,
} from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-26T00:00:00.000Z";

function session(sessionId, overrides = {}) {
  return {
    sessionId,
    caseId: "case-pass5-stage-aware-copilot",
    targetingPlanId: "targeting-plan-stage-aware",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: overrides.participantLabel ?? "Ahmad - Sales Executive",
    participantRoleOrNodeId: overrides.participantRoleOrNodeId ?? "role-sales-executive",
    selectedDepartment: "Sales",
    selectedUseCase: "Client Onboarding",
    languagePreference: "en",
    sessionState: overrides.sessionState ?? "clarification_needed",
    channelStatus: "active",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-pass5-stage-aware-copilot",
      targetingPlanId: "targeting-plan-stage-aware",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: overrides.participantLabel ?? "Ahmad - Sales Executive",
      participantRoleOrNodeId: overrides.participantRoleOrNodeId ?? "role-sales-executive",
      selectedDepartment: "Sales",
      selectedUseCase: "Client Onboarding",
      languagePreference: "en",
    },
    channelAccess: {
      selectedParticipationMode: "web_session_chatbot",
      channelStatus: "active",
      sessionAccessTokenId: null,
      telegramBindingId: null,
      dispatchReference: null,
      notes: null,
    },
    rawEvidence: { rawEvidenceItems: [], firstNarrativeEvidenceId: "evidence-ahmad-narrative" },
    analysisProgress: {
      firstNarrativeStatus: "received_text",
      extractionStatus: "completed_with_unmapped",
      clarificationItemIds: ["clarification-sensitive-price"],
      boundarySignalIds: ["boundary-finance-owns-rule"],
      unresolvedItemIds: ["unmapped-sensitive-threshold"],
      nextActionIds: ["next-action-sensitive-price"],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: "evidence-ahmad-narrative",
    extractionStatus: "completed_with_unmapped",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function evidence(evidenceItemId, rawContent, overrides = {}) {
  return {
    evidenceItemId,
    sessionId: "session-ahmad",
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

function seedStore() {
  const store = createInMemoryStore();
  store.participantSessions.save(session("session-ahmad"));
  store.participantSessions.save(session("session-sara", {
    participantLabel: "Sara - Sales Supervisor",
    participantRoleOrNodeId: "role-sales-supervisor",
    selectedParticipationMode: "telegram_bot",
  }));
  store.rawEvidenceItems.save(evidence(
    "evidence-ahmad-narrative",
    "Ahmad receives the client inquiry, collects requirements, prepares a quotation, and escalates sensitive prices for approval. He does not know the exact sensitive price threshold.",
  ));
  store.rawEvidenceItems.save(evidence(
    "evidence-ahmad-answer",
    "I do not know the threshold. Finance owns that rule and I only see whether approval was granted.",
    {
      evidenceType: "participant_clarification_answer",
      linkedClarificationItemId: "clarification-sensitive-price",
    },
  ));
  store.clarificationCandidates.save({
    candidateId: "clarification-sensitive-price",
    sessionId: "session-ahmad",
    linkedExtractedItemIds: ["step-sensitive-price"],
    linkedUnmappedItemIds: ["unmapped-sensitive-threshold"],
    linkedDefectIds: [],
    linkedRawEvidenceItemIds: ["evidence-ahmad-narrative", "evidence-ahmad-answer"],
    gapType: "vague_decision_rule",
    questionTheme: "Sensitive price threshold",
    participantFacingQuestion: "What makes a price sensitive enough to require approval?",
    whyItMatters: "It identifies the decision rule for pricing approval.",
    exampleAnswer: "For example, discounts above 15 percent require finance approval.",
    priority: "high",
    askNext: true,
    status: "partially_resolved",
    createdFrom: "extraction",
    adminInstruction: "Clarify sensitive pricing rule.",
    aiFormulated: true,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
  });
  store.boundarySignals.save({
    boundarySignalId: "boundary-finance-owns-rule",
    sessionId: "session-ahmad",
    boundaryType: "ownership_boundary",
    participantStatement: "Finance owns that rule.",
    linkedEvidenceItemId: "evidence-ahmad-answer",
    linkedExtractedItemIds: ["step-sensitive-price"],
    linkedClarificationCandidateIds: ["clarification-sensitive-price"],
    workflowArea: "decision",
    interpretationNote: "Participant says the pricing threshold is owned by Finance.",
    requiresEscalation: true,
    suggestedEscalationTarget: "externalTeam",
    participantSuggestedOwner: "Finance",
    escalationReason: "Finance owns approval threshold.",
    shouldStopAskingParticipant: true,
    confidenceLevel: "high",
    createdAt: now,
  });
  store.sessionNextActions.save({
    nextActionId: "next-action-sensitive-price",
    sessionId: "session-ahmad",
    actionType: "ask_next_clarification_question",
    label: "Review pricing threshold clarification",
    reason: "Sensitive price threshold is still partially resolved and may need Finance review.",
    blocking: true,
    priority: "high",
    relatedPanel: "Clarification Queue",
    relatedItemIds: ["clarification-sensitive-price", "boundary-finance-owns-rule"],
    recommendedAdminAction: "Review boundary signal and route Finance-owned question if needed.",
    createdAt: now,
    updatedAt: now,
  });
  store.pass6HandoffCandidates.save({
    handoffCandidateId: "handoff-pricing-gap",
    caseId: "case-pass5-stage-aware-copilot",
    sessionIds: ["session-ahmad"],
    relatedParticipantLabels: ["Ahmad - Sales Executive"],
    candidateType: "possible_gap",
    description: "Pricing threshold is unresolved from Sales perspective and may need later review.",
    evidenceRefs: [{ sessionId: "session-ahmad", rawEvidenceItemId: "evidence-ahmad-answer", clarificationCandidateId: "clarification-sensitive-price", boundarySignalId: "boundary-finance-owns-rule" }],
    confidenceLevel: "medium",
    recommendedPass6Use: "Review as a later-stage handoff candidate only.",
    mandatoryOrOptional: "optional",
    adminDecision: "pending",
    createdFrom: "admin_assistant_recommendation",
    createdAt: now,
  });
  return store;
}

function repos(store) {
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

async function ask(store, question, questionId) {
  return runAdminAssistantQuestion({
    question,
    scope: "current_session",
    sessionId: "session-ahmad",
    requestedByAdminId: "admin_operator",
  }, repos(store), null, {
    now: () => now,
    questionIdFactory: () => questionId,
    providerJobIdFactory: () => `provider-${questionId}`,
  });
}

function domainCounts(store) {
  return {
    sessions: store.participantSessions.findAll().length,
    evidence: store.rawEvidenceItems.findAll().length,
    candidates: store.clarificationCandidates.findAll().length,
    boundaries: store.boundarySignals.findAll().length,
    handoffs: store.pass6HandoffCandidates.findAll().length,
    actions: store.sessionNextActions.findAll().length,
  };
}

assert.equal(classifyAdminAssistantQuestion("what is your mission"), "pass5_stage_overview");
assert.equal(classifyAdminAssistantQuestion("what can you help me with in this stage?"), "pass5_stage_overview");
assert.equal(classifyAdminAssistantQuestion("explain Pass 5"), "pass5_general_discussion");
assert.equal(classifyAdminAssistantQuestion("explain what happened in this session"), "pass5_session_discussion");
assert.equal(classifyAdminAssistantQuestion("what questions were asked?"), "clarification_status_question");
assert.equal(classifyAdminAssistantQuestion("what evidence do we have?"), "evidence_question");
assert.equal(classifyAdminAssistantQuestion("what is still missing?"), "unresolved_items_question");
assert.equal(classifyAdminAssistantQuestion("run Pass 6 synthesis and create final package"), "out_of_scope_request");
assert.equal(classifyAdminAssistantQuestion("tell me a joke"), "unsupported");

const store = seedStore();
const before = domainCounts(store);

const mission = await ask(store, "what is your mission", "question-mission");
assert.equal(mission.ok, true);
assert.equal(mission.intent, "pass5_stage_overview");
assert.match(mission.answer.conciseFinding, /read-only Pass 5 Section Copilot/);
assert.match(mission.answer.conciseFinding, /does not mutate records or send participant messages/);
assert.equal(mission.answer.noMutationPerformed, true);

const happened = await ask(store, "explain what happened in this session", "question-happened");
assert.equal(happened.ok, true);
assert.equal(happened.intent, "pass5_session_discussion");
assert.ok(happened.contextBundle.structuredRecords.some((record) => record.recordId === "session-ahmad"));
assert.ok(happened.contextBundle.evidenceSnippets.some((snippet) => snippet.evidenceItemId === "evidence-ahmad-narrative"));
assert.ok(happened.answer.references.includes("RawEvidenceItem:evidence-ahmad-narrative"));

const questions = await ask(store, "what questions were asked?", "question-asked");
assert.equal(questions.ok, true);
assert.equal(questions.intent, "clarification_status_question");
assert.ok(questions.answer.references.includes("ClarificationCandidate:clarification-sensitive-price"));
assert.ok(questions.answer.references.includes("RawEvidenceItem:evidence-ahmad-answer"));

const evidenceResult = await ask(store, "what evidence do we have?", "question-evidence");
assert.equal(evidenceResult.ok, true);
assert.equal(evidenceResult.intent, "evidence_question");
assert.ok(evidenceResult.contextBundle.evidenceSnippets.length >= 1);
assert.ok(evidenceResult.answer.evidenceBasis.some((basis) => basis.includes("RawEvidenceItem:evidence-ahmad-narrative")));

const missing = await ask(store, "what is still missing?", "question-missing");
assert.equal(missing.ok, true);
assert.equal(missing.intent, "unresolved_items_question");
assert.match(missing.answer.conciseFinding, /Review pricing threshold clarification|Open clarification/);
assert.ok(missing.answer.references.includes("SessionNextAction:next-action-sensitive-price"));
assert.ok(missing.answer.routedActionSuggestions.every((action) => action.requiresAdminConfirmation === true));

const outOfScope = await ask(store, "run Pass 6 synthesis and create final package", "question-out-of-scope");
assert.equal(outOfScope.ok, true);
assert.equal(outOfScope.intent, "out_of_scope_request");
assert.match(outOfScope.answer.conciseFinding, /outside the Pass 5 copilot boundary/);
assert.match(outOfScope.answer.conciseFinding, /cannot run Pass 6 synthesis\/evaluation/);
assert.equal(outOfScope.answer.noMutationPerformed, true);
assert.ok(outOfScope.answer.routedActionSuggestions.every((action) => action.requiresAdminConfirmation === true));

const unsupported = await ask(store, "tell me a joke", "question-unsupported");
assert.equal(unsupported.ok, false);
assert.equal(unsupported.errors[0].code, "unsupported_intent");

assert.deepEqual(domainCounts(store), before);

const bundle = buildAdminAssistantContextBundle({
  question: "which participants have unresolved pricing or handoff issues?",
  scope: "case_pass5",
  caseId: "case-pass5-stage-aware-copilot",
}, repos(store), { now: () => now, questionIdFactory: () => "question-case" });
assert.ok(bundle);
assert.equal(bundle.queryIntent, "unresolved_items_question");
assert.ok(bundle.structuredRecords.some((record) => record.recordType === "Pass6HandoffCandidate" && record.recordId === "handoff-pricing-gap"));

console.log("Pass 5 Block 12 stage-aware copilot proof passed.");
