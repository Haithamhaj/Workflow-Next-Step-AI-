import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  validateTargetingRolloutPlan,
  validateFirstPassExtractionOutput,
} from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import { createPass5PromptTestJob } from "../packages/prompts/dist/index.js";
import { resolvePass5LiveProvider } from "./pass5-live-provider.mjs";
import {
  addAdminClarificationCandidate,
  approveTranscriptEvidence,
  buildAdminAssistantContextBundle,
  createPass6HandoffCandidateFromAdminEntry,
  createParticipantSessionsFromTargetingPlan,
  createTranscriptEvidenceForReview,
  createWebSessionAccessToken,
  createPass6HandoffCandidateFromBoundarySignal,
  deriveSessionEvidenceReadiness,
  getRawEvidenceExtractionEligibility,
  getTelegramConfig,
  listExtractionEligibleEvidenceForSession,
  markClarificationCandidateAsked,
  recordClarificationAnswer,
  rejectTranscriptEvidence,
  resolveSessionAccessToken,
  runAdminAssistantQuestion,
  runClarificationAnswerRecheck,
  runFirstPassExtractionForSession,
  submitWebSessionFirstNarrative,
  submitWebSessionFirstNarrativeVoice,
} from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";
const dbPath = join(tmpdir(), "workflow-pass5-block14-full-live.sqlite");
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

function candidate(id, adminDecision = "accepted") {
  return {
    candidateId: id,
    targetType: "core_participant",
    linkedHierarchyNodeId: `node-${id}`,
    roleLabel: `Role ${id}`,
    personLabel: `Person ${id}`,
    suggestedReason: "Admin approved participant target.",
    expectedWorkflowVisibility: "Participant should know the workflow.",
    sourceSignals: [],
    participantValidationNeeded: true,
    suggestedRolloutStage: 1,
    rolloutOrder: 1,
    contactChannelReadinessStatus: "ready_for_later_outreach",
    confidence: "medium",
    adminDecision,
  };
}

function profile(candidateId) {
  return {
    participantId: `profile-${candidateId}`,
    linkedTargetCandidateId: candidateId,
    displayName: `Participant ${candidateId}`,
    linkedHierarchyNodeId: `node-${candidateId}`,
    roleLabel: `Role ${candidateId}`,
    targetType: "core_participant",
    email: `${candidateId}@example.com`,
    availableChannels: ["email"],
    preferredChannel: "email",
    contactDataSource: { email: "pass4_manual_entry" },
    contactDataStatus: "ready_for_later_outreach",
    lastContactDataUpdatedAt: now,
    lastContactDataUpdatedBy: "admin",
  };
}

function planFixture() {
  const candidates = [candidate("web-live"), candidate("voice-live")];
  const profiles = [profile("web-live"), profile("voice-live")];
  const plan = {
    planId: "plan-pass5-block14",
    caseId: "case-pass5-block14",
    sessionId: "intake-session-pass5-block14",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
    basisHierarchySnapshotId: "approved-snapshot-pass5-block14",
    basisReadinessSnapshotId: "readiness-pass5-block14",
    state: "approved_ready_for_outreach",
    targetCandidates: candidates,
    adminCandidateDecisions: candidates,
    participantContactProfiles: profiles,
    sourceSignalsUsed: [],
    questionHintSeeds: [],
    rolloutOrder: [{
      stageId: "stage-pass5-block14",
      stageNumber: 1,
      label: "Core participants",
      candidateIds: candidates.map((item) => item.candidateId),
      rationale: "Admin approved ordering.",
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

function repos() {
  return createSQLiteIntakeRepositories(dbPath);
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

loadEnvFile(join(process.cwd(), ".env.local"));
const { provider, providerConfig } = resolvePass5LiveProvider("PASS5_BLOCK14_BLOCKED");

const store = repos();
const plan = planFixture();
const creation = createParticipantSessionsFromTargetingPlan(plan, store, {
  now: () => now,
  idFactory: ({ targetCandidateId }) => `session-${targetCandidateId}`,
  defaultLanguagePreference: "en",
});
assert.equal(creation.ok, true);
const webSession = store.participantSessions.findById("session-web-live");
const voiceSession = store.participantSessions.findById("session-voice-live");
assert.ok(webSession);
assert.ok(voiceSession);

const tokenResult = createWebSessionAccessToken(webSession, store.sessionAccessTokens, {
  now: () => now,
  rawTokenFactory: () => "block14-web-token",
  tokenIdFactory: () => "access-token-web-live",
});
assert.equal(tokenResult.ok, true, tokenResult.ok ? "" : JSON.stringify(tokenResult.errors));
const resolved = resolveSessionAccessToken(tokenResult.rawToken, store.sessionAccessTokens, store.participantSessions, { now: () => now });
assert.equal(resolved.ok, true);
assert.equal(resolved.participantSession.sessionId, webSession.sessionId);

const narrative = [
  "Orders arrive by email. I check the customer code in ERP and confirm the requested items.",
  "If the price is sensitive, I ask the operations manager for approval, but I do not know the exact threshold.",
  "Finance owns the threshold rule. After approval I send the request to warehouse.",
  "Sometimes urgent orders skip the normal approval path and I am not sure who records that exception.",
].join(" ");
const narrativeResult = submitWebSessionFirstNarrative(tokenResult.rawToken, narrative, {
  sessionAccessTokens: store.sessionAccessTokens,
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
}, { now: () => now, evidenceItemIdFactory: () => "evidence-web-narrative" });
assert.equal(narrativeResult.ok, true, narrativeResult.ok ? "" : JSON.stringify(narrativeResult.errors));
assert.equal(narrativeResult.rawEvidenceItem.evidenceType, "participant_text_narrative");
assert.equal(narrativeResult.rawEvidenceItem.sessionId, webSession.sessionId);
assert.equal(getRawEvidenceExtractionEligibility(narrativeResult.rawEvidenceItem).eligible, true);
assert.equal(listExtractionEligibleEvidenceForSession(webSession.sessionId, store.rawEvidenceItems).length, 1);

const guidanceJob = await createPass5PromptTestJob({
  promptName: "participant_guidance_prompt",
  inputBundle: {
    promptName: "participant_guidance_prompt",
    caseId: webSession.caseId,
    sessionId: webSession.sessionId,
    languagePreference: webSession.languagePreference,
    channel: "web_session_chatbot",
    participantLabel: webSession.participantLabel,
    selectedDepartment: webSession.selectedDepartment,
    selectedUseCase: webSession.selectedUseCase,
    adminInstruction: "Generate participant-facing guidance for the live acceptance proof.",
  },
  provider,
  repos: { promptSpecs: store.structuredPromptSpecs, providerJobs: store.providerJobs },
  now: () => now,
});
assert.equal(guidanceJob.ok, true, guidanceJob.ok ? "" : guidanceJob.error);
assert.equal(guidanceJob.job.status, "succeeded");

const extractionResult = await runFirstPassExtractionForSession(webSession.sessionId, extractionRepos(store), provider, {
  now: () => now,
  extractionIdFactory: () => "extraction-live-web",
  providerJobIdFactory: () => "provider-job-live-extraction",
  defectIdFactory: () => `defect-live-${crypto.randomUUID()}`,
  disputeIdFactory: () => `dispute-live-${crypto.randomUUID()}`,
});
assert.equal(extractionResult.ok, true, extractionResult.ok ? "" : JSON.stringify(extractionResult.errors));
assert.equal(validateFirstPassExtractionOutput(extractionResult.createdExtraction).ok, true);
assert.ok(extractionResult.createdExtraction.basisEvidenceItemIds.includes("evidence-web-narrative"));
assert.ok(extractionResult.createdExtraction.sourceCoverageSummary.includes("fullContentProcessed=true"));
const governedNoDropRouteCount = [
  extractionResult.createdExtraction.unmappedContentItems.length,
  extractionResult.createdExtraction.extractionDefects.length,
  extractionResult.createdExtraction.evidenceDisputes.length,
  extractionResult.createdExtraction.extractedUnknowns.length,
  extractionResult.createdExtraction.boundarySignals.length,
  extractionResult.createdExtraction.clarificationCandidates.length,
].reduce((sum, count) => sum + count, 0);
assert.ok(
  governedNoDropRouteCount > 0,
  "Live extraction must preserve unclear content through an approved governed route.",
);
const extractedItems = [
  ...extractionResult.createdExtraction.extractedActors,
  ...extractionResult.createdExtraction.extractedSteps,
  ...extractionResult.createdExtraction.extractedDecisionPoints,
  ...extractionResult.createdExtraction.extractedHandoffs,
  ...extractionResult.createdExtraction.extractedExceptions,
  ...extractionResult.createdExtraction.extractedSystems,
  ...extractionResult.createdExtraction.extractedControls,
  ...extractionResult.createdExtraction.extractedDependencies,
  ...extractionResult.createdExtraction.extractedUnknowns,
];
assert.ok(extractedItems.filter((item) => item.createdFrom === "ai_extraction").every((item) => item.evidenceAnchors.length > 0));
assert.ok(extractionResult.createdClarificationCandidates.length > 0, "Live extraction must create at least one clarification candidate for the known gap.");

const activeCandidate = extractionResult.createdClarificationCandidates[0];
const formulation = await addAdminClarificationCandidate({
  sessionId: webSession.sessionId,
  questionTheme: "Finance-owned threshold",
  instruction: "Ask what the participant knows about the sensitive price approval threshold without pressuring them to guess.",
  linkedRawEvidenceItemIds: ["evidence-web-narrative"],
  priority: "high",
  askNext: true,
}, clarificationRepos(store), provider, { now: () => now, candidateIdFactory: () => "clarification-live-provider-formulated", providerJobIdFactory: () => "provider-job-live-clarification-formulation" });
assert.equal(formulation.ok, true, formulation.ok ? "" : JSON.stringify(formulation.errors));
assert.ok(formulation.value.participantFacingQuestion.length > 0);
assert.ok(!/\?.*\?/.test(formulation.value.participantFacingQuestion), "Clarification formulation should not contain multiple question marks.");

const markAsked = markClarificationCandidateAsked(activeCandidate.candidateId, clarificationRepos(store), { now: () => now });
assert.equal(markAsked.ok, true, markAsked.ok ? "" : JSON.stringify(markAsked.errors));
const answer = recordClarificationAnswer({
  sessionId: webSession.sessionId,
  candidateId: activeCandidate.candidateId,
  answerText: "I do not know the threshold. Finance handles the rule and I only see whether approval was granted.",
  sourceChannel: "web_session_chatbot",
  language: "en",
  capturedAt: now,
}, clarificationRepos(store), { evidenceItemIdFactory: () => "evidence-clarification-answer", now: () => now });
assert.equal(answer.ok, true, answer.ok ? "" : JSON.stringify(answer.errors));
const recheck = await runClarificationAnswerRecheck(webSession.sessionId, answer.value.evidenceItemId, clarificationRepos(store), provider, {
  now: () => now,
  providerJobIdFactory: () => "provider-job-live-answer-recheck",
  candidateIdFactory: () => `clarification-recheck-${crypto.randomUUID()}`,
  boundarySignalIdFactory: () => "boundary-live-finance-ownership",
});
assert.equal(recheck.ok, true, recheck.ok ? "" : JSON.stringify(recheck.errors));
assert.ok(
  recheck.value.updatedCandidates.length
    + recheck.value.createdCandidates.length
    + recheck.value.createdBoundarySignals.length > 0,
  "Answer recheck must produce a governed non-no-op outcome.",
);
assert.ok(recheck.value.createdBoundarySignals.length > 0, "Answer recheck must create a boundary signal for non-ownership/unknown answer.");
assert.ok(store.boundarySignals.findBySessionId(webSession.sessionId).some((signal) => signal.shouldStopAskingParticipant));

const invalidAnchorProvider = {
  name: "google",
  async runPromptText() {
    return {
      provider: "google",
      model: "deterministic-invalid-anchor-fixture",
      text: JSON.stringify({
        extractionId: "extraction-invalid-anchor",
        sessionId: webSession.sessionId,
        basisEvidenceItemIds: ["evidence-web-narrative"],
        extractionStatus: "completed_clean",
        extractedActors: [],
        extractedSteps: [{
          itemId: "unsupported-step",
          label: "Unsupported step",
          description: "This item has an anchor to unknown evidence.",
          evidenceAnchors: [{ evidenceItemId: "missing-evidence", quote: "not present" }],
          sourceTextSpan: { evidenceItemId: "missing-evidence", quote: "not present" },
          completenessStatus: "inferred",
          confidenceLevel: "low",
          needsClarification: false,
          clarificationReason: "",
          relatedItemIds: [],
          adminReviewStatus: "review_required",
          createdFrom: "ai_extraction",
        }],
        sequenceMap: { orderedItemIds: ["unsupported-step"], sequenceLinks: [], unclearTransitions: [], notes: [] },
        extractedDecisionPoints: [],
        extractedHandoffs: [],
        extractedExceptions: [],
        extractedSystems: [],
        extractedControls: [],
        extractedDependencies: [],
        extractedUnknowns: [],
        boundarySignals: [],
        clarificationCandidates: [],
        confidenceNotes: [],
        contradictionNotes: [],
        sourceCoverageSummary: "fixture",
        unmappedContentItems: [],
        extractionDefects: [],
        evidenceDisputes: [],
        createdAt: now,
      }),
    };
  },
};
const invalidAnchor = await runFirstPassExtractionForSession(webSession.sessionId, extractionRepos(store), invalidAnchorProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-invalid-anchor",
  providerJobIdFactory: () => "provider-job-invalid-anchor",
  defectIdFactory: () => "defect-invalid-anchor",
  disputeIdFactory: () => "dispute-invalid-anchor",
});
assert.equal(invalidAnchor.ok, true);
assert.ok(invalidAnchor.evidenceDisputes.length > 0, "Invalid anchor fixture must create evidence dispute.");

const tokenVoice = createWebSessionAccessToken(voiceSession, store.sessionAccessTokens, {
  now: () => now,
  rawTokenFactory: () => "block14-voice-token",
  tokenIdFactory: () => "access-token-voice-live",
});
assert.equal(tokenVoice.ok, true, tokenVoice.ok ? "" : JSON.stringify(tokenVoice.errors));
const voice = submitWebSessionFirstNarrativeVoice(tokenVoice.rawToken, {
  artifactRef: "file:data/participant-session-audio/block14-voice.webm",
  originalFileName: "block14-voice.webm",
}, {
  sessionAccessTokens: store.sessionAccessTokens,
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
}, { now: () => now, evidenceItemIdFactory: () => "evidence-voice-audio" });
assert.equal(voice.ok, true, voice.ok ? "" : JSON.stringify(voice.errors));
assert.equal(voice.rawEvidenceItem.artifactRef, "file:data/participant-session-audio/block14-voice.webm");
assert.equal(getRawEvidenceExtractionEligibility(voice.rawEvidenceItem).eligible, false);
const transcriptRaw = createTranscriptEvidenceForReview({
  evidenceItemId: "evidence-transcript-raw",
  sessionId: voiceSession.sessionId,
  evidenceType: "speech_to_text_transcript_raw",
  sourceChannel: "web_session_chatbot",
  rawContent: "Voice transcript: I receive the order and Finance handles the threshold.",
  language: "en",
  capturedAt: now,
  providerJobId: null,
}, store.rawEvidenceItems, store.participantSessions);
assert.equal(getRawEvidenceExtractionEligibility(transcriptRaw).eligible, false);
const approved = approveTranscriptEvidence("evidence-transcript-raw", {
  rawEvidenceItems: store.rawEvidenceItems,
  participantSessions: store.participantSessions,
}, { now: () => now });
assert.equal(approved.ok, true);
assert.equal(getRawEvidenceExtractionEligibility(approved.evidenceItem).eligible, true);
const editedRaw = createTranscriptEvidenceForReview({
  evidenceItemId: "evidence-transcript-edit-source",
  sessionId: voiceSession.sessionId,
  evidenceType: "meeting_transcript_uploaded",
  sourceChannel: "manual_meeting_or_admin_entered",
  rawContent: "Original transcript wording.",
  language: "en",
  capturedAt: now,
}, store.rawEvidenceItems, store.participantSessions);
const edited = approveTranscriptEvidence({
  evidenceItemId: editedRaw.evidenceItemId,
  editedTranscript: "Edited approved transcript wording.",
  repos: { rawEvidenceItems: store.rawEvidenceItems, participantSessions: store.participantSessions },
  options: { now: () => now, evidenceItemIdFactory: () => "evidence-transcript-edited" },
});
assert.equal(edited.ok, true);
assert.equal(store.rawEvidenceItems.findById("evidence-transcript-edit-source").rawContent, "Original transcript wording.");
assert.equal(edited.evidenceItem.evidenceType, "speech_to_text_transcript_approved");
const rejectedRaw = createTranscriptEvidenceForReview({
  evidenceItemId: "evidence-transcript-rejected-source",
  sessionId: voiceSession.sessionId,
  evidenceType: "meeting_transcript_uploaded",
  sourceChannel: "manual_meeting_or_admin_entered",
  rawContent: "Rejected transcript wording.",
  language: "en",
  capturedAt: now,
}, store.rawEvidenceItems, store.participantSessions);
const rejected = rejectTranscriptEvidence(rejectedRaw.evidenceItemId, {
  rawEvidenceItems: store.rawEvidenceItems,
  participantSessions: store.participantSessions,
}, "Poor quality", { now: () => now });
assert.equal(rejected.ok, true);
assert.equal(getRawEvidenceExtractionEligibility(rejected.evidenceItem).eligible, false);
const readiness = deriveSessionEvidenceReadiness(voiceSession, store.rawEvidenceItems.findBySessionId(voiceSession.sessionId));
assert.equal(readiness.hasEligibleEvidence, true);

const assistantBundle = buildAdminAssistantContextBundle({
  question: "What boundary or evidence issue should admin review?",
  scope: "current_session",
  sessionId: webSession.sessionId,
}, assistantRepos(store), { now: () => now, questionIdFactory: () => "assistant-block14-bundle" });
assert.ok(assistantBundle);
const assistantBeforeCounts = {
  sessions: store.participantSessions.findAll().length,
  evidence: store.rawEvidenceItems.findAll().length,
  handoffs: store.pass6HandoffCandidates.findAll().length,
};
const assistant = await runAdminAssistantQuestion({
  question: "What boundary or evidence issue should admin review?",
  scope: "current_session",
  sessionId: webSession.sessionId,
}, assistantRepos(store), provider, {
  now: () => now,
  questionIdFactory: () => "assistant-block14-live",
  providerJobIdFactory: () => "provider-job-live-admin-assistant",
});
assert.equal(assistant.ok, true, assistant.ok ? "" : JSON.stringify(assistant.errors));
assert.equal(assistant.answer.providerStatus, "succeeded");
assert.ok(assistant.answer.references.some((ref) => ref.includes(webSession.sessionId) || ref.includes("Evidence")));
assert.equal(store.participantSessions.findAll().length, assistantBeforeCounts.sessions);
assert.equal(store.rawEvidenceItems.findAll().length, assistantBeforeCounts.evidence);
assert.equal(store.pass6HandoffCandidates.findAll().length, assistantBeforeCounts.handoffs);

const boundarySignal = store.boundarySignals.findBySessionId(webSession.sessionId)[0];
assert.ok(boundarySignal);
const handoff = createPass6HandoffCandidateFromBoundarySignal(boundarySignal.boundarySignalId, {
  participantSessions: store.participantSessions,
  pass6HandoffCandidates: store.pass6HandoffCandidates,
  boundarySignals: store.boundarySignals,
}, { now: () => now, handoffCandidateIdFactory: () => "handoff-block14-boundary" });
assert.equal(handoff.ok, true, handoff.ok ? "" : JSON.stringify(handoff.errors));
const adminHandoff = createPass6HandoffCandidateFromAdminEntry({
  caseId: webSession.caseId,
  sessionIds: [webSession.sessionId],
  candidateType: "admin_observation",
  description: "Admin-confirmed candidate from Block 14 live proof.",
  evidenceRefs: [{ evidenceItemId: "evidence-web-narrative", note: "admin-confirmed live proof handoff" }],
  confidenceLevel: "medium",
  recommendedPass6Use: "Review later; not final synthesis.",
  mandatoryOrOptional: "optional",
}, {
  participantSessions: store.participantSessions,
  pass6HandoffCandidates: store.pass6HandoffCandidates,
}, { now: () => now, handoffCandidateIdFactory: () => "handoff-block14-admin" });
assert.equal(adminHandoff.ok, true);
assert.equal(store.pass6HandoffCandidates.findBySessionId(webSession.sessionId).length >= 2, true);

const providerFailure = await createPass5PromptTestJob({
  promptName: "participant_guidance_prompt",
  inputBundle: { promptName: "participant_guidance_prompt", caseId: webSession.caseId, sessionId: webSession.sessionId },
  provider: null,
  repos: { promptSpecs: store.structuredPromptSpecs, providerJobs: store.providerJobs },
  now: () => now,
});
assert.equal(providerFailure.ok, false);
assert.equal(providerFailure.job.status, "failed");
assert.ok(providerFailure.error.includes("provider_not_configured"));

const missingTelegram = getTelegramConfig({});
assert.equal(missingTelegram.ok, false);
assert.equal(resolveSessionAccessToken(tokenResult.rawToken, store.sessionAccessTokens, store.participantSessions).ok, true);

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
  "Unmapped content / defects / disputes",
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
  dbPath,
  provider: {
    provider: providerConfig.provider,
    configured: providerConfig.configured,
    model: providerConfig.resolvedModel,
  },
  web: {
    sessionId: webSession.sessionId,
    tokenResolved: true,
    narrativeEvidenceId: narrativeResult.rawEvidenceItem.evidenceItemId,
  },
  liveProviderProofs: {
    participant_guidance_prompt: guidanceJob.job.status,
    first_pass_extraction_prompt: store.providerJobs.findById("provider-job-live-extraction")?.status,
    clarification_formulation_prompt: store.providerJobs.findById("provider-job-live-clarification-formulation")?.status,
    answer_recheck_prompt: store.providerJobs.findById("provider-job-live-answer-recheck")?.status,
    admin_assistant_prompt: store.providerJobs.findById("provider-job-live-admin-assistant")?.status,
    evidence_interpretation_prompt: "not_required_current_code_path",
  },
  extraction: {
    extractionId: extractionResult.extractionId,
    unmappedContentItems: extractionResult.unmappedContentItems.length,
    clarificationCandidates: extractionResult.createdClarificationCandidates.length,
    defects: extractionResult.defects.length,
    disputes: extractionResult.evidenceDisputes.length,
    invalidAnchorDisputes: invalidAnchor.evidenceDisputes.length,
  },
  clarification: {
    formulatedCandidateId: formulation.value.candidateId,
    recheckUpdatedCandidates: recheck.value.updatedCandidates.length,
    boundarySignalsCreated: recheck.value.createdBoundarySignals.length,
  },
  voiceTranscriptTrust: {
    audioArtifactRef: voice.rawEvidenceItem.artifactRef,
    approvedTranscriptEligible: getRawEvidenceExtractionEligibility(approved.evidenceItem).eligible,
    editedTranscriptPreservedOriginal: store.rawEvidenceItems.findById("evidence-transcript-edit-source").rawContent === "Original transcript wording.",
    rejectedTranscriptEligible: getRawEvidenceExtractionEligibility(rejected.evidenceItem).eligible,
  },
  failureFallback: {
    providerFailureStatus: providerFailure.job.status,
    telegramMissingConfigVisible: !missingTelegram.ok,
    webFallbackTokenStillResolves: true,
  },
  dashboard: "source_assertions_passed",
  handoffCandidates: store.pass6HandoffCandidates.findBySessionId(webSession.sessionId).length,
  bannedExpansion: "passed",
  pass5Status: "accepted_by_block14_script",
}, null, 2));
