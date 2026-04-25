import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  createSQLiteIntakeRepositories,
} from "../packages/persistence/dist/index.js";
import {
  validateBoundarySignal,
  validateClarificationCandidate,
  validateEvidenceDispute,
  validateFirstPassExtractionOutput,
  validateParticipantSession,
  validateRawEvidenceItem,
  validateSessionAccessToken,
} from "../packages/contracts/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block2-persistence.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
const sessionId = "participant-session-1";
const caseId = "case-1";

const evidenceAnchor = {
  evidenceItemId: "evidence-1",
  quote: "I receive the request and check the account.",
};

const sourceTextSpan = {
  evidenceItemId: "evidence-1",
  quote: "I receive the request and check the account.",
};

const rawEvidenceItem = {
  evidenceItemId: "evidence-1",
  sessionId,
  evidenceType: "participant_text_narrative",
  sourceChannel: "web_session_chatbot",
  rawContent: "I receive the request and check the account.",
  language: "en",
  capturedAt: now,
  capturedBy: "participant",
  trustStatus: "raw_unreviewed",
  confidenceScore: 0.9,
  originalFileName: null,
  providerJobId: null,
  linkedClarificationItemId: null,
  notes: "",
};

const extractedItem = {
  itemId: "item-1",
  label: "Receive request",
  description: "Participant receives the request.",
  evidenceAnchors: [evidenceAnchor],
  sourceTextSpan,
  completenessStatus: "clear",
  confidenceLevel: "high",
  needsClarification: false,
  clarificationReason: "",
  relatedItemIds: [],
  adminReviewStatus: "not_reviewed",
  createdFrom: "ai_extraction",
};

const unmappedContentItem = {
  unmappedItemId: "unmapped-1",
  sessionId,
  evidenceItemId: "evidence-1",
  quote: "Sometimes another team handles it.",
  reasonUnmapped: "Owner is unclear.",
  possibleCategory: "unknown",
  confidenceLevel: "low",
  needsAdminReview: true,
  needsParticipantClarification: true,
  suggestedClarificationCandidateId: "clarification-1",
  createdAt: now,
};

const extractionDefect = {
  defectId: "defect-1",
  defectType: "ambiguous_actor_or_owner",
  description: "Owner is ambiguous.",
  affectedOutputSection: "extractedSteps",
  affectedItemId: "item-1",
  basisEvidenceItemId: "evidence-1",
  severity: "medium",
  recommendedAction: "Ask participant who owns this step.",
  createdAt: now,
};

const evidenceDispute = {
  disputeId: "dispute-1",
  sessionId,
  extractionId: "extraction-1",
  affectedItemId: "item-1",
  aiProposedInterpretation: "Participant owns approval.",
  aiProposedEvidenceAnchor: evidenceAnchor,
  codeValidationIssue: "Quote supports receipt, not approval.",
  disputeType: "weak_semantic_support",
  severity: "high",
  recommendedAction: "admin_review",
  adminDecision: "pending",
  createdAt: now,
};

const clarificationCandidate = {
  candidateId: "clarification-1",
  sessionId,
  linkedExtractedItemIds: ["item-1"],
  linkedUnmappedItemIds: ["unmapped-1"],
  linkedDefectIds: ["defect-1"],
  linkedRawEvidenceItemIds: ["evidence-1"],
  gapType: "unclear_owner",
  questionTheme: "Step owner",
  participantFacingQuestion: "Who owns this step?",
  whyItMatters: "The owner must be clear before synthesis.",
  exampleAnswer: "Finance operations owns it.",
  priority: "high",
  askNext: true,
  status: "open",
  createdFrom: "extraction",
  adminInstruction: "",
  aiFormulated: true,
  adminReviewStatus: "not_reviewed",
  createdAt: now,
  updatedAt: now,
};

const boundarySignal = {
  boundarySignalId: "boundary-1",
  sessionId,
  boundaryType: "ownership_boundary",
  participantStatement: "Another team handles anything after approval.",
  linkedEvidenceItemId: "evidence-1",
  linkedExtractedItemIds: ["item-1"],
  linkedClarificationCandidateIds: ["clarification-1"],
  workflowArea: "handoff",
  interpretationNote: "Participant does not own downstream work.",
  requiresEscalation: true,
  suggestedEscalationTarget: "externalTeam",
  participantSuggestedOwner: "Finance operations",
  escalationReason: "Downstream owner needed.",
  shouldStopAskingParticipant: true,
  confidenceLevel: "medium",
  createdAt: now,
};

const extractionOutput = {
  extractionId: "extraction-1",
  sessionId,
  basisEvidenceItemIds: ["evidence-1"],
  extractionStatus: "completed_with_evidence_disputes",
  extractedActors: [extractedItem],
  extractedSteps: [extractedItem],
  sequenceMap: {
    orderedItemIds: ["item-1", "item-2"],
    sequenceLinks: [
      {
        fromItemId: "item-1",
        toItemId: "item-2",
        relationType: "then",
        condition: "",
        evidenceAnchors: [evidenceAnchor],
        confidenceLevel: "high",
      },
    ],
    unclearTransitions: [
      {
        fromItemId: "item-2",
        toItemId: "item-3",
        reasonUnclear: "Next owner was not identified.",
        needsClarification: true,
        suggestedClarificationCandidateId: "clarification-1",
      },
    ],
    notes: ["Participant-level draft only."],
  },
  extractedDecisionPoints: [],
  extractedHandoffs: [],
  extractedExceptions: [],
  extractedSystems: [],
  extractedControls: [],
  extractedDependencies: [],
  extractedUnknowns: [],
  boundarySignals: [boundarySignal],
  clarificationCandidates: [clarificationCandidate],
  confidenceNotes: ["One direct participant source."],
  contradictionNotes: [],
  sourceCoverageSummary: "One narrative source.",
  unmappedContentItems: [unmappedContentItem],
  extractionDefects: [extractionDefect],
  evidenceDisputes: [evidenceDispute],
  createdAt: now,
};

const participantSession = {
  sessionId,
  caseId,
  targetingPlanId: "targeting-plan-1",
  targetCandidateId: "target-candidate-1",
  participantContactProfileId: "contact-profile-1",
  participantLabel: "Ops lead",
  participantRoleOrNodeId: "role-1",
  selectedDepartment: "Operations",
  selectedUseCase: "Invoice handling",
  languagePreference: "en",
  sessionState: "awaiting_first_narrative",
  channelStatus: "channel_selected_pending_dispatch",
  selectedParticipationMode: "web_session_chatbot",
  sessionContext: {
    sessionId,
    caseId,
    targetingPlanId: "targeting-plan-1",
    targetCandidateId: "target-candidate-1",
    participantContactProfileId: "contact-profile-1",
    participantLabel: "Ops lead",
    participantRoleOrNodeId: "role-1",
    selectedDepartment: "Operations",
    selectedUseCase: "Invoice handling",
    languagePreference: "en",
  },
  channelAccess: {
    selectedParticipationMode: "web_session_chatbot",
    channelStatus: "channel_selected_pending_dispatch",
    sessionAccessTokenId: "token-1",
    telegramBindingId: null,
    dispatchReference: null,
    notes: null,
  },
  rawEvidence: {
    rawEvidenceItems: [rawEvidenceItem],
    firstNarrativeEvidenceId: "evidence-1",
  },
  analysisProgress: {
    firstNarrativeStatus: "received_text",
    extractionStatus: "eligible",
    clarificationItemIds: ["clarification-1"],
    boundarySignalIds: ["boundary-1"],
    unresolvedItemIds: ["unmapped-1"],
    nextActionIds: ["next-action-1"],
  },
  rawEvidenceItems: [rawEvidenceItem],
  firstNarrativeStatus: "received_text",
  firstNarrativeEvidenceId: "evidence-1",
  extractionStatus: "eligible",
  clarificationItems: [clarificationCandidate],
  boundarySignals: [boundarySignal],
  unresolvedItems: [unmappedContentItem],
  createdAt: now,
  updatedAt: now,
};

const sessionAccessToken = {
  accessTokenId: "token-1",
  tokenHash: "token-hash-1",
  participantSessionId: sessionId,
  channelType: "web_session_chatbot",
  tokenStatus: "active",
  expiresAt: "2026-05-25T00:00:00.000Z",
  createdAt: now,
  lastUsedAt: null,
  revokedAt: null,
  revokedReason: null,
  useCount: 0,
  boundChannelIdentityId: null,
};

const telegramBinding = {
  bindingId: "telegram-binding-1",
  participantSessionId: sessionId,
  accessTokenId: "token-1",
  telegramUserId: "telegram-user-1",
  telegramChatId: "telegram-chat-1",
  telegramUsername: "opslead",
  telegramFirstName: "Ops",
  telegramLastName: "Lead",
  telegramLanguageCode: "en",
  bindingStatus: "token_bound_unverified",
  createdAt: now,
  updatedAt: now,
};

const nextAction = {
  nextActionId: "next-action-1",
  sessionId,
  actionType: "review_boundary_signal",
  label: "Review boundary",
  reason: "Participant identified downstream ownership boundary.",
  blocking: true,
  priority: "high",
  relatedPanel: "Boundary/Escalation",
  relatedItemIds: ["boundary-1"],
  recommendedAdminAction: "Review escalation target.",
  createdAt: now,
  updatedAt: now,
};

const pass6HandoffCandidate = {
  handoffCandidateId: "handoff-1",
  caseId,
  sessionIds: [sessionId],
  relatedParticipantLabels: ["Ops lead"],
  candidateType: "possible_escalation_need",
  description: "Downstream owner may need follow-up in later synthesis.",
  evidenceRefs: [evidenceAnchor],
  confidenceLevel: "medium",
  recommendedPass6Use: "Compare with supervisor and downstream participant inputs.",
  mandatoryOrOptional: "optional",
  adminDecision: "pending",
  createdFrom: "system_rule",
  createdAt: now,
};

for (const [name, validate, value] of [
  ["ParticipantSession", validateParticipantSession, participantSession],
  ["SessionAccessToken", validateSessionAccessToken, sessionAccessToken],
  ["RawEvidenceItem", validateRawEvidenceItem, rawEvidenceItem],
  ["FirstPassExtractionOutput", validateFirstPassExtractionOutput, extractionOutput],
  ["ClarificationCandidate", validateClarificationCandidate, clarificationCandidate],
  ["BoundarySignal", validateBoundarySignal, boundarySignal],
  ["EvidenceDispute", validateEvidenceDispute, evidenceDispute],
]) {
  const result = validate(value);
  assert.equal(result.ok, true, `${name} fixture must validate: ${result.ok ? "" : JSON.stringify(result.errors)}`);
}

const repos = createSQLiteIntakeRepositories(dbPath);

repos.participantSessions.save(participantSession);
assert.deepEqual(repos.participantSessions.findById(sessionId), participantSession);
assert.equal(repos.participantSessions.findByCaseId(caseId).length, 1);
assert.equal(repos.participantSessions.findByTargetingPlanId("targeting-plan-1").length, 1);
const updatedSession = repos.participantSessions.updateSessionStatus(sessionId, {
  sessionState: "first_narrative_received",
  channelStatus: "telegram_linked",
  updatedAt: "2026-04-25T01:00:00.000Z",
});
assert.equal(updatedSession?.sessionState, "first_narrative_received");
assert.equal(updatedSession?.rawEvidence.rawEvidenceItems[0]?.rawContent, rawEvidenceItem.rawContent);

repos.sessionAccessTokens.save(sessionAccessToken);
assert.deepEqual(repos.sessionAccessTokens.findById("token-1"), sessionAccessToken);
assert.equal(repos.sessionAccessTokens.findByTokenHash("token-hash-1")?.participantSessionId, sessionId);
assert.equal(repos.sessionAccessTokens.findByParticipantSessionId(sessionId).length, 1);
const usedToken = repos.sessionAccessTokens.updateTokenUsage("token-1", {
  lastUsedAt: "2026-04-25T01:00:00.000Z",
  useCount: 1,
  tokenStatus: "bound",
});
assert.equal(usedToken?.useCount, 1);
assert.equal(repos.sessionAccessTokens.findByTokenHash("token-hash-1")?.participantSessionId, sessionId);

repos.telegramIdentityBindings.save(telegramBinding);
assert.deepEqual(repos.telegramIdentityBindings.findById("telegram-binding-1"), telegramBinding);
assert.equal(repos.telegramIdentityBindings.findByParticipantSessionId(sessionId).length, 1);
assert.equal(repos.telegramIdentityBindings.findByTelegramUserId("telegram-user-1").length, 1);
assert.equal(
  repos.telegramIdentityBindings.updateBindingStatus("telegram-binding-1", "admin_verified", "2026-04-25T02:00:00.000Z")?.bindingStatus,
  "admin_verified",
);

repos.rawEvidenceItems.save(rawEvidenceItem);
assert.deepEqual(repos.rawEvidenceItems.findById("evidence-1"), rawEvidenceItem);
assert.equal(repos.rawEvidenceItems.findBySessionId(sessionId).length, 1);
repos.rawEvidenceItems.save({ ...rawEvidenceItem, rawContent: "changed", trustStatus: "admin_approved", notes: "reviewed" });
assert.equal(repos.rawEvidenceItems.findById("evidence-1")?.rawContent, rawEvidenceItem.rawContent);
const reviewedEvidence = repos.rawEvidenceItems.updateTrustStatus("evidence-1", {
  trustStatus: "admin_approved",
  confidenceScore: 0.95,
  notes: "admin approved",
});
assert.equal(reviewedEvidence?.rawContent, rawEvidenceItem.rawContent);
assert.equal(repos.rawEvidenceItems.findByTrustStatus("admin_approved").length, 1);

repos.firstPassExtractionOutputs.save(extractionOutput);
assert.deepEqual(repos.firstPassExtractionOutputs.findById("extraction-1"), extractionOutput);
assert.equal(repos.firstPassExtractionOutputs.findBySessionId(sessionId).length, 1);
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-1")?.sequenceMap.sequenceLinks.length, 1);
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-1")?.unmappedContentItems.length, 1);
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-1")?.extractionDefects.length, 1);
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-1")?.evidenceDisputes.length, 1);

repos.clarificationCandidates.save(clarificationCandidate);
assert.deepEqual(repos.clarificationCandidates.findById("clarification-1"), clarificationCandidate);
assert.equal(repos.clarificationCandidates.findOpenBySessionId(sessionId).length, 1);
assert.equal(
  repos.clarificationCandidates.updateReviewState("clarification-1", {
    status: "asked",
    priority: "medium",
    askNext: false,
    adminReviewStatus: "reviewed_accepted",
    updatedAt: "2026-04-25T03:00:00.000Z",
  })?.status,
  "asked",
);

repos.boundarySignals.save(boundarySignal);
assert.deepEqual(repos.boundarySignals.findById("boundary-1"), boundarySignal);
assert.equal(repos.boundarySignals.findBySessionId(sessionId).length, 1);
assert.equal(repos.boundarySignals.findRequiringEscalation().length, 1);

repos.evidenceDisputes.save(evidenceDispute);
assert.deepEqual(repos.evidenceDisputes.findById("dispute-1"), evidenceDispute);
assert.equal(repos.evidenceDisputes.findBySessionId(sessionId).length, 1);
assert.equal(repos.evidenceDisputes.findByExtractionId("extraction-1").length, 1);
assert.equal(repos.evidenceDisputes.updateAdminDecision("dispute-1", "converted_to_unmapped")?.adminDecision, "converted_to_unmapped");

repos.sessionNextActions.save(nextAction);
assert.deepEqual(repos.sessionNextActions.findById("next-action-1"), nextAction);
assert.equal(repos.sessionNextActions.findBySessionId(sessionId).length, 1);
assert.equal(repos.sessionNextActions.findCurrentBySessionId(sessionId)?.nextActionId, "next-action-1");

repos.pass6HandoffCandidates.save(pass6HandoffCandidate);
assert.deepEqual(repos.pass6HandoffCandidates.findById("handoff-1"), pass6HandoffCandidate);
assert.equal(repos.pass6HandoffCandidates.findByCaseId(caseId).length, 1);
assert.equal(repos.pass6HandoffCandidates.findBySessionId(sessionId).length, 1);
assert.equal(repos.pass6HandoffCandidates.updateAdminDecision("handoff-1", "accepted_for_pass6")?.adminDecision, "accepted_for_pass6");

const reloaded = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloaded.participantSessions.findById(sessionId)?.sessionId, sessionId);
assert.equal(reloaded.sessionAccessTokens.findByTokenHash("token-hash-1")?.participantSessionId, sessionId);
assert.equal(reloaded.telegramIdentityBindings.findByParticipantSessionId(sessionId).length, 1);
assert.equal(reloaded.rawEvidenceItems.findById("evidence-1")?.rawContent, rawEvidenceItem.rawContent);
assert.equal(reloaded.firstPassExtractionOutputs.findById("extraction-1")?.sequenceMap.sequenceLinks[0]?.relationType, "then");
assert.equal(reloaded.firstPassExtractionOutputs.findById("extraction-1")?.unmappedContentItems.length, 1);
assert.equal(reloaded.firstPassExtractionOutputs.findById("extraction-1")?.extractionDefects.length, 1);
assert.equal(reloaded.firstPassExtractionOutputs.findById("extraction-1")?.evidenceDisputes.length, 1);
assert.equal(reloaded.clarificationCandidates.findById("clarification-1")?.status, "asked");
assert.equal(reloaded.boundarySignals.findRequiringEscalation().length, 1);
assert.equal(reloaded.evidenceDisputes.findById("dispute-1")?.adminDecision, "converted_to_unmapped");
assert.equal(reloaded.sessionNextActions.findCurrentBySessionId(sessionId)?.nextActionId, "next-action-1");
assert.equal(reloaded.pass6HandoffCandidates.findById("handoff-1")?.adminDecision, "accepted_for_pass6");

console.log("Pass 5 Block 2 persistence proof passed.");
