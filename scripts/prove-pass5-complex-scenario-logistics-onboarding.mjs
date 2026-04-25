import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

import {
  validateFirstPassExtractionOutput,
  validateRawEvidenceItem,
  validateTargetingRolloutPlan,
} from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import { createPass5PromptTestJob } from "../packages/prompts/dist/index.js";
import { resolvePass5LiveProvider } from "./pass5-live-provider.mjs";
import {
  addAdminClarificationCandidate,
  approveTranscriptEvidence,
  buildAdminAssistantContextBundle,
  createParticipantSessionsFromTargetingPlan,
  createPass6HandoffCandidateFromAdminEntry,
  createTelegramDeepLink,
  createTranscriptEvidenceForReview,
  createWebSessionAccessToken,
  deriveSessionEvidenceReadiness,
  getRawEvidenceExtractionEligibility,
  handleTelegramStartCommand,
  handleTelegramTextMessage,
  listExtractionEligibleEvidenceForSession,
  markClarificationCandidateAsked,
  recordClarificationAnswer,
  resolveSessionAccessToken,
  runAdminAssistantQuestion,
  runClarificationAnswerRecheck,
  runFirstPassExtractionForSession,
  submitWebSessionFirstNarrative,
  submitWebSessionFirstNarrativeVoice,
} from "../packages/participant-sessions/dist/index.js";

const scenarioName = "P5-COMPLEX-E2E-LOGISTICS-SALES-ONBOARDING-01";
const now = "2026-04-26T00:00:00.000Z";
const dbPath = join(tmpdir(), "workflow-pass5-complex-logistics-sales-onboarding.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function candidate(id, roleLabel, personLabel) {
  return {
    candidateId: id,
    targetType: "core_participant",
    linkedHierarchyNodeId: `node-${id}`,
    roleLabel,
    personLabel,
    suggestedReason: "Admin approved participant target for logistics Sales onboarding validation.",
    expectedWorkflowVisibility: "Participant should know part of the client onboarding workflow.",
    sourceSignals: [],
    participantValidationNeeded: true,
    suggestedRolloutStage: 1,
    rolloutOrder: 1,
    contactChannelReadinessStatus: "ready_for_later_outreach",
    confidence: "medium",
    adminDecision: "accepted",
  };
}

function profile(candidateId, displayName, roleLabel, overrides = {}) {
  const hasEmail = overrides.email !== undefined ? Boolean(overrides.email) : true;
  return {
    participantId: `profile-${candidateId}`,
    linkedTargetCandidateId: candidateId,
    displayName,
    linkedHierarchyNodeId: `node-${candidateId}`,
    roleLabel,
    targetType: "core_participant",
    email: hasEmail ? overrides.email ?? `${candidateId}@example.com` : undefined,
    telegramHandle: overrides.telegramHandle,
    telegramUserId: overrides.telegramUserId,
    availableChannels: overrides.availableChannels ?? (hasEmail ? ["email"] : []),
    preferredChannel: overrides.preferredChannel ?? (hasEmail ? "email" : undefined),
    contactDataSource: { email: "pass4_manual_entry", telegram: "pass4_manual_entry" },
    contactDataStatus: "ready_for_later_outreach",
    lastContactDataUpdatedAt: now,
    lastContactDataUpdatedBy: "admin",
  };
}

function planFixture() {
  const candidates = [
    candidate("ahmad-sales", "Sales Executive", "Ahmad"),
    candidate("sara-supervisor", "Sales Supervisor", "Sara"),
    candidate("omar-finance", "Finance Coordinator", "Omar"),
    candidate("lina-operations", "Operations Coordinator", "Lina"),
  ];
  const profiles = [
    profile("ahmad-sales", "Ahmad", "Sales Executive", { email: "ahmad.sales@example.com" }),
    profile("sara-supervisor", "Sara", "Sales Supervisor", {
      email: "",
      availableChannels: ["telegram"],
      preferredChannel: "telegram",
      telegramHandle: "sara_supervisor",
      telegramUserId: "7001",
    }),
    profile("omar-finance", "Omar", "Finance Coordinator", { email: "omar.finance@example.com" }),
    profile("lina-operations", "Lina", "Operations Coordinator", { email: "lina.ops@example.com" }),
  ];
  const plan = {
    planId: "plan-complex-logistics-sales-onboarding",
    caseId: "case-complex-logistics-sales-onboarding",
    sessionId: "intake-session-complex-logistics-sales-onboarding",
    selectedDepartment: "Sales",
    selectedUseCase: "Client Onboarding",
    basisHierarchySnapshotId: "approved-snapshot-complex-logistics",
    basisReadinessSnapshotId: "readiness-complex-logistics",
    state: "approved_ready_for_outreach",
    targetCandidates: candidates,
    adminCandidateDecisions: candidates,
    participantContactProfiles: profiles,
    sourceSignalsUsed: [],
    questionHintSeeds: [],
    rolloutOrder: [{
      stageId: "stage-complex-logistics",
      stageNumber: 1,
      label: "Sales onboarding participants",
      candidateIds: candidates.map((item) => item.candidateId),
      rationale: "Admin approved cross-functional participants.",
    }],
    finalReviewSummary: {
      approvedCandidateIds: candidates.map((item) => item.candidateId),
      rejectedCandidateIds: [],
      unresolvedContactGaps: [],
      adminEditsAndNotes: [],
      readyForLaterOutreachCount: profiles.length,
      contactGapCount: 0,
    },
    finalPlanState: "approved_ready_for_outreach",
    providerStatus: "not_requested",
    approvalMetadata: {},
    boundaryConfirmations: {
      noOutreachSent: true,
      noInvitationsCreated: true,
      noParticipantSessionsCreated: true,
      noParticipantResponsesCollected: true,
      noWorkflowAnalysisPerformed: true,
    },
    manualFallbackAvailable: true,
    createdAt: now,
    updatedAt: now,
  };
  const validation = validateTargetingRolloutPlan(plan);
  assert.equal(validation.ok, true, validation.ok ? "" : JSON.stringify(validation.errors));
  return plan;
}

function startMessage(rawToken, userId = "7001", chatId = "9001") {
  return {
    message: {
      text: `/start ${rawToken}`,
      from: {
        id: userId,
        username: `user${userId}`,
        first_name: "Sara",
        last_name: "Supervisor",
        language_code: "en",
      },
      chat: { id: chatId },
    },
  };
}

function textMessage(text, userId = "7001", chatId = "9001") {
  return {
    message: {
      text,
      from: {
        id: userId,
        username: `user${userId}`,
        first_name: "Sara",
        last_name: "Supervisor",
        language_code: "en",
      },
      chat: { id: chatId },
    },
  };
}

function extractionRepos(store) {
  return {
    participantSessions: store.participantSessions,
    rawEvidenceItems: store.rawEvidenceItems,
    firstPassExtractionOutputs: store.firstPassExtractionOutputs,
    clarificationCandidates: store.clarificationCandidates,
    boundarySignals: store.boundarySignals,
    evidenceDisputes: store.evidenceDisputes,
    providerJobs: store.providerJobs,
    promptSpecs: store.structuredPromptSpecs,
  };
}

function clarificationRepos(store) {
  return {
    participantSessions: store.participantSessions,
    rawEvidenceItems: store.rawEvidenceItems,
    clarificationCandidates: store.clarificationCandidates,
    boundarySignals: store.boundarySignals,
    providerJobs: store.providerJobs,
    promptSpecs: store.structuredPromptSpecs,
  };
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

function handoffRepos(store) {
  return {
    participantSessions: store.participantSessions,
    pass6HandoffCandidates: store.pass6HandoffCandidates,
    boundarySignals: store.boundarySignals,
    clarificationCandidates: store.clarificationCandidates,
    evidenceDisputes: store.evidenceDisputes,
    firstPassExtractionOutputs: store.firstPassExtractionOutputs,
  };
}

function governedRouteCount(extraction) {
  return [
    extraction.unmappedContentItems.length,
    extraction.extractionDefects.length,
    extraction.evidenceDisputes.length,
    extraction.extractedUnknowns.length,
    extraction.boundarySignals.length,
    extraction.clarificationCandidates.length,
  ].reduce((sum, count) => sum + count, 0);
}

async function runExtraction(sessionId, store, provider, id) {
  const result = await runFirstPassExtractionForSession(sessionId, extractionRepos(store), provider, {
    now: () => now,
    extractionIdFactory: () => `extraction-complex-${id}`,
    providerJobIdFactory: () => `provider-job-complex-extraction-${id}`,
    defectIdFactory: () => `defect-complex-${id}-${randomUUID()}`,
    disputeIdFactory: () => `dispute-complex-${id}-${randomUUID()}`,
  });
  assert.equal(result.ok, true, result.ok ? "" : JSON.stringify(result.errors));
  assert.equal(validateFirstPassExtractionOutput(result.createdExtraction).ok, true);
  assert.ok(result.createdExtraction.sourceCoverageSummary.includes("fullContentProcessed=true"));
  const extractedItems = [
    ...result.createdExtraction.extractedActors,
    ...result.createdExtraction.extractedSteps,
    ...result.createdExtraction.extractedDecisionPoints,
    ...result.createdExtraction.extractedHandoffs,
    ...result.createdExtraction.extractedExceptions,
    ...result.createdExtraction.extractedSystems,
    ...result.createdExtraction.extractedControls,
    ...result.createdExtraction.extractedDependencies,
    ...result.createdExtraction.extractedUnknowns,
  ];
  assert.ok(extractedItems.filter((item) => item.createdFrom === "ai_extraction").every((item) => item.evidenceAnchors.length > 0));
  return result;
}

loadEnvFile(join(process.cwd(), ".env.local"));
const { provider, providerConfig } = resolvePass5LiveProvider("P5_COMPLEX_SCENARIO_BLOCKED");
const store = createSQLiteIntakeRepositories(dbPath);
const plan = planFixture();
const creation = createParticipantSessionsFromTargetingPlan(plan, store, {
  now: () => now,
  idFactory: ({ targetCandidateId }) => `session-${targetCandidateId}`,
  defaultLanguagePreference: "en",
});
assert.equal(creation.ok, true);
assert.equal(creation.createdSessions.length, 4);

const ahmad = store.participantSessions.findById("session-ahmad-sales");
const sara = store.participantSessions.findById("session-sara-supervisor");
const omar = store.participantSessions.findById("session-omar-finance");
const lina = store.participantSessions.findById("session-lina-operations");
assert.ok(ahmad);
assert.ok(sara);
assert.ok(omar);
assert.ok(lina);
assert.equal(sara.selectedParticipationMode, "telegram_bot");

const ahmadToken = createWebSessionAccessToken(ahmad, store.sessionAccessTokens, {
  now: () => now,
  rawTokenFactory: () => "complex-ahmad-web-token",
  tokenIdFactory: () => "complex-ahmad-web-token-id",
});
assert.equal(ahmadToken.ok, true, ahmadToken.ok ? "" : JSON.stringify(ahmadToken.errors));
assert.equal(resolveSessionAccessToken(ahmadToken.rawToken, store.sessionAccessTokens, store.participantSessions, { now: () => now }).participantSession.sessionId, ahmad.sessionId);
const ahmadNarrative = [
  "I receive the client inquiry and collect client requirements such as delivery locations, volume, timing, and service expectations.",
  "I prepare the quotation and if the price is sensitive I send the request to my supervisor or Finance before promising the custom price.",
  "After approval I open a ticket for operations so they can plan the onboarding handoff.",
  "I do not know the exact sensitive price threshold.",
].join(" ");
const ahmadEvidence = submitWebSessionFirstNarrative(ahmadToken.rawToken, ahmadNarrative, {
  sessionAccessTokens: store.sessionAccessTokens,
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
}, { now: () => now, evidenceItemIdFactory: () => "evidence-ahmad-web-narrative" });
assert.equal(ahmadEvidence.ok, true, ahmadEvidence.ok ? "" : JSON.stringify(ahmadEvidence.errors));
assert.equal(ahmadEvidence.rawEvidenceItem.evidenceType, "participant_text_narrative");
assert.equal(getRawEvidenceExtractionEligibility(ahmadEvidence.rawEvidenceItem).eligible, true);

const saraLink = createTelegramDeepLink(sara, store.sessionAccessTokens, {
  now: () => now,
  tokenFactory: () => "complex-sara-telegram-token",
  accessTokenIdFactory: () => "complex-sara-telegram-token-id",
  bindingIdFactory: () => "complex-sara-telegram-binding",
  evidenceItemIdFactory: () => "evidence-sara-telegram-message",
  botUsername: "NextStepWorkflowBot",
});
assert.equal(saraLink.ok, true, saraLink.ok ? "" : JSON.stringify(saraLink.errors));
const saraStart = handleTelegramStartCommand(startMessage(saraLink.rawToken), {
  participantSessions: store.participantSessions,
  sessionAccessTokens: store.sessionAccessTokens,
  telegramIdentityBindings: store.telegramIdentityBindings,
  rawEvidenceItems: store.rawEvidenceItems,
}, {
  now: () => now,
  bindingIdFactory: () => "complex-sara-telegram-binding",
});
assert.equal(saraStart.ok, true, saraStart.ok ? "" : JSON.stringify(saraStart.errors));
const saraNarrative = [
  "I review special pricing cases and remind sales not to promise custom pricing before approval.",
  "Finance owns the final price exception rule.",
  "Operations only receives the case after the onboarding ticket is completed.",
].join(" ");
const saraEvidence = handleTelegramTextMessage(textMessage(saraNarrative), {
  participantSessions: store.participantSessions,
  sessionAccessTokens: store.sessionAccessTokens,
  telegramIdentityBindings: store.telegramIdentityBindings,
  rawEvidenceItems: store.rawEvidenceItems,
}, {
  now: () => now,
  evidenceItemIdFactory: () => "evidence-sara-telegram-message",
});
assert.equal(saraEvidence.ok, true, saraEvidence.ok ? "" : JSON.stringify(saraEvidence.errors));
assert.equal(saraEvidence.rawEvidenceItem.evidenceType, "telegram_message");
assert.equal(saraEvidence.rawEvidenceItem.rawContent, saraNarrative);

const omarToken = createWebSessionAccessToken(omar, store.sessionAccessTokens, {
  now: () => now,
  rawTokenFactory: () => "complex-omar-voice-token",
  tokenIdFactory: () => "complex-omar-voice-token-id",
});
assert.equal(omarToken.ok, true);
const omarVoice = submitWebSessionFirstNarrativeVoice(omarToken.rawToken, {
  artifactRef: "file:data/participant-session-audio/complex-omar-finance.webm",
  originalFileName: "complex-omar-finance.webm",
}, {
  sessionAccessTokens: store.sessionAccessTokens,
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
}, { now: () => now, evidenceItemIdFactory: () => "evidence-omar-voice-audio" });
assert.equal(omarVoice.ok, true, omarVoice.ok ? "" : JSON.stringify(omarVoice.errors));
assert.equal(getRawEvidenceExtractionEligibility(omarVoice.rawEvidenceItem).eligible, false);
const omarTranscriptRaw = createTranscriptEvidenceForReview({
  evidenceItemId: "evidence-omar-transcript-raw",
  sessionId: omar.sessionId,
  evidenceType: "speech_to_text_transcript_raw",
  sourceChannel: "web_session_chatbot",
  rawContent: [
    "Finance reviews discount and exception cases.",
    "The threshold is not always visible to sales.",
    "Finance sends approval status back to sales.",
    "I do not handle the operations handoff.",
  ].join(" "),
  language: "en",
  capturedAt: now,
  providerJobId: null,
}, store.rawEvidenceItems, store.participantSessions);
assert.equal(getRawEvidenceExtractionEligibility(omarTranscriptRaw).eligible, false);
assert.equal(listExtractionEligibleEvidenceForSession(omar.sessionId, store.rawEvidenceItems).length, 0);
const omarApproved = approveTranscriptEvidence("evidence-omar-transcript-raw", {
  rawEvidenceItems: store.rawEvidenceItems,
  participantSessions: store.participantSessions,
}, { now: () => now });
assert.equal(omarApproved.ok, true, omarApproved.ok ? "" : JSON.stringify(omarApproved.errors));
assert.equal(getRawEvidenceExtractionEligibility(omarApproved.evidenceItem).eligible, true);
assert.equal(deriveSessionEvidenceReadiness(store.participantSessions.findById(omar.sessionId), store.rawEvidenceItems.findBySessionId(omar.sessionId)).hasEligibleEvidence, true);

const linaEvidenceItem = {
  evidenceItemId: "evidence-lina-manual-note",
  sessionId: lina.sessionId,
  evidenceType: "manual_admin_note",
  sourceChannel: "manual_meeting_or_admin_entered",
  rawContent: [
    "Operations receives a ticket only after approval.",
    "If client details are missing, the ticket is returned to sales.",
    "Operations does not know the finance threshold logic.",
  ].join(" "),
  language: "en",
  capturedAt: now,
  capturedBy: "admin",
  trustStatus: "admin_approved",
  confidenceScore: 1,
  originalFileName: "lina-operations-meeting-note.txt",
  providerJobId: null,
  linkedClarificationItemId: null,
  notes: "Admin-entered meeting note for complex Pass 5 validation scenario.",
};
assert.equal(validateRawEvidenceItem(linaEvidenceItem).ok, true);
store.rawEvidenceItems.save(linaEvidenceItem);
store.participantSessions.save({
  ...lina,
  sessionState: "first_narrative_received",
  firstNarrativeStatus: "approved_for_extraction",
  firstNarrativeEvidenceId: linaEvidenceItem.evidenceItemId,
  extractionStatus: "eligible",
  rawEvidence: { ...lina.rawEvidence, firstNarrativeEvidenceId: linaEvidenceItem.evidenceItemId },
  analysisProgress: {
    ...lina.analysisProgress,
    firstNarrativeStatus: "approved_for_extraction",
    extractionStatus: "eligible",
  },
  updatedAt: now,
});
assert.equal(getRawEvidenceExtractionEligibility(linaEvidenceItem).eligible, true);

const guidanceJob = await createPass5PromptTestJob({
  promptName: "participant_guidance_prompt",
  inputBundle: {
    promptName: "participant_guidance_prompt",
    caseId: ahmad.caseId,
    sessionId: ahmad.sessionId,
    languagePreference: ahmad.languagePreference,
    channel: "web_session_chatbot",
    participantLabel: ahmad.participantLabel,
    selectedDepartment: ahmad.selectedDepartment,
    selectedUseCase: ahmad.selectedUseCase,
    adminInstruction: "Generate participant-facing guidance for the complex logistics Sales onboarding validation scenario.",
  },
  provider,
  repos: { promptSpecs: store.structuredPromptSpecs, providerJobs: store.providerJobs },
  now: () => now,
});
if (!guidanceJob.ok) {
  console.error(JSON.stringify({
    stage: "participant_guidance_prompt",
    providerConfig: {
      configured: providerConfig.configured,
      provider: providerConfig.provider,
      model: providerConfig.resolvedModel,
    },
    error: guidanceJob.error,
    jobStatus: guidanceJob.job?.status,
    jobError: guidanceJob.job?.errorMessage,
  }, null, 2));
}
assert.equal(guidanceJob.ok, true, guidanceJob.ok ? "" : guidanceJob.error);
assert.equal(guidanceJob.job.status, "succeeded");

const extractionAhmad = await runExtraction(ahmad.sessionId, store, provider, "ahmad");
const extractionSara = await runExtraction(sara.sessionId, store, provider, "sara");
const extractionOmar = await runExtraction(omar.sessionId, store, provider, "omar");
const extractionLina = await runExtraction(lina.sessionId, store, provider, "lina");
const noDropCount = [
  extractionAhmad,
  extractionSara,
  extractionOmar,
  extractionLina,
].reduce((sum, result) => sum + governedRouteCount(result.createdExtraction), 0);
assert.ok(noDropCount > 0, "Unclear scenario content must be preserved through at least one governed no-drop route.");

const clarification = await addAdminClarificationCandidate({
  sessionId: ahmad.sessionId,
  questionTheme: "Sensitive price threshold",
  instruction: "Ask Ahmad what threshold makes a price sensitive, without pressuring him to guess if Finance owns the rule.",
  linkedRawEvidenceItemIds: ["evidence-ahmad-web-narrative"],
  priority: "high",
  askNext: true,
}, clarificationRepos(store), provider, {
  now: () => now,
  candidateIdFactory: () => "clarification-sensitive-price-threshold",
  providerJobIdFactory: () => "provider-job-complex-clarification-formulation",
});
assert.equal(clarification.ok, true, clarification.ok ? "" : JSON.stringify(clarification.errors));
assert.ok(clarification.value.participantFacingQuestion.length > 0);
assert.ok(!/\?.*\?/.test(clarification.value.participantFacingQuestion), "Clarification question must not hide compound questions.");
const asked = markClarificationCandidateAsked(clarification.value.candidateId, clarificationRepos(store), { now: () => now });
assert.equal(asked.ok, true, asked.ok ? "" : JSON.stringify(asked.errors));
const answer = recordClarificationAnswer({
  sessionId: ahmad.sessionId,
  candidateId: clarification.value.candidateId,
  answerText: "I do not know the threshold. Finance owns that rule and I only see whether approval was granted.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  capturedAt: now,
}, clarificationRepos(store), { now: () => now, evidenceItemIdFactory: () => "evidence-sensitive-price-threshold-answer" });
assert.equal(answer.ok, true, answer.ok ? "" : JSON.stringify(answer.errors));
const recheck = await runClarificationAnswerRecheck(ahmad.sessionId, answer.value.evidenceItemId, clarificationRepos(store), provider, {
  now: () => now,
  providerJobIdFactory: () => "provider-job-complex-answer-recheck",
  candidateIdFactory: () => `clarification-recheck-${randomUUID()}`,
  boundarySignalIdFactory: () => `boundary-complex-${randomUUID()}`,
});
assert.equal(recheck.ok, true, recheck.ok ? "" : JSON.stringify(recheck.errors));
assert.ok(
  recheck.value.updatedCandidates.length
    + recheck.value.createdCandidates.length
    + recheck.value.createdBoundarySignals.length
    + (recheck.value.noChangeReasons?.length ?? 0) > 0,
  "Answer recheck must not silently no-op.",
);
const boundarySignals = store.boundarySignals.findBySessionId(ahmad.sessionId);
assert.ok(boundarySignals.length > 0, "Clarification answer should create a boundary or visibility signal.");
assert.ok(boundarySignals.some((signal) =>
  (signal.boundaryType === "ownership_boundary" || signal.boundaryType === "visibility_limitation")
    && signal.shouldStopAskingParticipant
    && ((signal.participantSuggestedOwner ?? "").toLowerCase().includes("finance") || signal.participantStatement.toLowerCase().includes("finance"))),
);

const assistantBundle = buildAdminAssistantContextBundle({
  question: "Which sessions still have unresolved pricing or handoff issues?",
  scope: "selected_sessions",
  selectedSessionIds: [ahmad.sessionId, sara.sessionId, omar.sessionId, lina.sessionId],
}, assistantRepos(store), { now: () => now, questionIdFactory: () => "assistant-complex-bundle" });
assert.ok(assistantBundle);
const beforeAssistant = {
  evidence: store.rawEvidenceItems.findAll().length,
  candidates: store.clarificationCandidates.findAll().length,
  boundaries: store.boundarySignals.findAll().length,
  handoffs: store.pass6HandoffCandidates.findAll().length,
};
const assistant = await runAdminAssistantQuestion({
  question: "Which sessions still have unresolved pricing or handoff issues?",
  scope: "selected_sessions",
  selectedSessionIds: [ahmad.sessionId, sara.sessionId, omar.sessionId, lina.sessionId],
}, assistantRepos(store), provider, {
  now: () => now,
  questionIdFactory: () => "assistant-complex-live",
  providerJobIdFactory: () => "provider-job-complex-admin-assistant",
});
assert.equal(assistant.ok, true, assistant.ok ? "" : JSON.stringify(assistant.errors));
assert.equal(assistant.answer.providerStatus, "succeeded");
assert.ok(assistant.contextBundle.structuredRecords.length > 0);
assert.ok(assistant.answer.references.length > 0);
assert.ok(assistant.answer.noMutationPerformed);
assert.equal(store.rawEvidenceItems.findAll().length, beforeAssistant.evidence);
assert.equal(store.clarificationCandidates.findAll().length, beforeAssistant.candidates);
assert.equal(store.boundarySignals.findAll().length, beforeAssistant.boundaries);
assert.equal(store.pass6HandoffCandidates.findAll().length, beforeAssistant.handoffs);

const handoff = createPass6HandoffCandidateFromAdminEntry({
  caseId: ahmad.caseId,
  sessionIds: [ahmad.sessionId, sara.sessionId, omar.sessionId, lina.sessionId],
  candidateType: "possible_gap",
  description: "Pricing threshold ownership and operations handoff gaps should be reviewed later as candidates only.",
  evidenceRefs: [
    { evidenceItemId: "evidence-ahmad-web-narrative", note: "Ahmad does not know sensitive price threshold." },
    { evidenceItemId: "evidence-sara-telegram-message", note: "Sara says Finance owns final price exception rule." },
    { evidenceItemId: "evidence-omar-transcript-raw", note: "Omar says threshold is not always visible to sales." },
    { evidenceItemId: "evidence-lina-manual-note", note: "Lina says operations does not know finance threshold logic." },
  ],
  confidenceLevel: "medium",
  recommendedPass6Use: "Review as a later handoff candidate; do not treat as synthesis or final workflow truth.",
  mandatoryOrOptional: "mandatory",
}, handoffRepos(store), { now: () => now, handoffCandidateIdFactory: () => "handoff-complex-pricing-handoff-gap" });
assert.equal(handoff.ok, true, handoff.ok ? "" : JSON.stringify(handoff.errors));
assert.equal(handoff.value.adminDecision, "pending");
assert.equal(store.pass6HandoffCandidates.findBySessionId(ahmad.sessionId).length, 1);

const dashboardSource = readFileSync("apps/admin-web/app/participant-sessions/page.tsx", "utf8");
const detailSource = readFileSync("apps/admin-web/app/participant-sessions/[sessionId]/page.tsx", "utf8");
for (const expected of [
  "Total sessions",
  "Participant Sessions",
  "Next action",
  "Session Context",
  "Channel Access",
  "Raw Evidence",
  "Analysis Progress",
  "Clarification Queue",
  "Boundary / Escalation",
  "Admin Assistant / Section Copilot",
  "Pass 6 Handoff Candidates",
]) {
  assert.ok(dashboardSource.includes(expected) || detailSource.includes(expected), `Dashboard/detail should expose ${expected}`);
}

const implementationFiles = [
  "packages/participant-sessions/src/index.ts",
  "apps/admin-web/app/api/participant-sessions/assistant/route.ts",
  "apps/admin-web/app/api/participant-sessions/handoff-candidates/route.ts",
  "apps/admin-web/app/api/participant-sessions/handoff-candidates/[id]/decision/route.ts",
  "apps/admin-web/app/participant-sessions/[sessionId]/page.tsx",
];
for (const file of implementationFiles) {
  const source = readFileSync(file, "utf8").toLowerCase();
  for (const banned of ["whatsapp api", "common-path formation", "final workflow reconstruction", "createfinalpackage", "runpass6"]) {
    assert.equal(source.includes(banned), false, `${file} must not introduce ${banned}`);
  }
}
const repositoryCount = (repo) => repo?.findAll?.().length ?? 0;
assert.equal(repositoryCount(store.synthesis), 0);
assert.equal(repositoryCount(store.evaluations), 0);
assert.equal(repositoryCount(store.initialPackages), 0);
assert.equal(repositoryCount(store.finalPackages), 0);

console.log(JSON.stringify({
  ok: true,
  scenarioName,
  dbPath,
  provider: {
    provider: providerConfig.provider,
    configured: providerConfig.configured,
    model: providerConfig.resolvedModel,
  },
  participants: {
    ahmad: { sessionId: ahmad.sessionId, channel: "web_session_chatbot", evidenceId: ahmadEvidence.rawEvidenceItem.evidenceItemId },
    sara: { sessionId: sara.sessionId, channel: "telegram_bot_handler", evidenceId: saraEvidence.rawEvidenceItem.evidenceItemId, bindingStored: Boolean(store.telegramIdentityBindings.findById(saraStart.binding.bindingId)) },
    omar: { sessionId: omar.sessionId, channel: "web_voice_transcript", audioArtifactRef: omarVoice.rawEvidenceItem.artifactRef, transcriptEligible: getRawEvidenceExtractionEligibility(omarApproved.evidenceItem).eligible },
    lina: { sessionId: lina.sessionId, channel: "manual_admin_note", evidenceId: linaEvidenceItem.evidenceItemId },
  },
  providerProofs: {
    participant_guidance_prompt: guidanceJob.job.status,
    first_pass_extraction_prompt: [
      store.providerJobs.findById("provider-job-complex-extraction-ahmad")?.status,
      store.providerJobs.findById("provider-job-complex-extraction-sara")?.status,
      store.providerJobs.findById("provider-job-complex-extraction-omar")?.status,
      store.providerJobs.findById("provider-job-complex-extraction-lina")?.status,
    ],
    clarification_formulation_prompt: store.providerJobs.findById("provider-job-complex-clarification-formulation")?.status,
    answer_recheck_prompt: store.providerJobs.findById("provider-job-complex-answer-recheck")?.status,
    admin_assistant_prompt: store.providerJobs.findById("provider-job-complex-admin-assistant")?.status,
  },
  extractionNoDrop: {
    governedRouteCount: noDropCount,
    extractions: [extractionAhmad.extractionId, extractionSara.extractionId, extractionOmar.extractionId, extractionLina.extractionId],
  },
  clarification: {
    candidateId: clarification.value.candidateId,
    answerEvidenceId: answer.value.evidenceItemId,
    updatedCandidates: recheck.value.updatedCandidates.length,
    newCandidates: recheck.value.createdCandidates.length,
    boundarySignals: boundarySignals.length,
  },
  assistant: {
    questionId: assistant.questionId,
    providerStatus: assistant.answer.providerStatus,
    references: assistant.answer.references.length,
    noMutationPerformed: assistant.answer.noMutationPerformed,
  },
  handoffCandidate: {
    handoffCandidateId: handoff.value.handoffCandidateId,
    candidateType: handoff.value.candidateType,
    adminDecision: handoff.value.adminDecision,
  },
  dashboard: "source_assertions_passed",
  bannedBoundaries: "passed",
}, null, 2));
