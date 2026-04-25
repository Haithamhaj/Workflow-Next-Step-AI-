import assert from "node:assert/strict";

import {
  validateBoundarySignal,
  validateClarificationCandidate,
  validateEvidenceDispute,
  validateExtractionStatus,
  validateFirstPassExtractionOutput,
  validateFirstNarrativeStatus,
  validateParticipantSession,
  validateRawEvidenceItem,
  validateSequenceMap,
  validateSessionAccessToken,
  validateExtractedItem,
} from "../packages/contracts/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";

const evidenceAnchor = {
  evidenceItemId: "evidence-1",
  quote: "I receive the request and check the account.",
  startOffset: 0,
  endOffset: 42,
};

const sourceTextSpan = {
  evidenceItemId: "evidence-1",
  quote: "I receive the request and check the account.",
  startOffset: 0,
  endOffset: 42,
};

const validRawEvidenceItem = {
  evidenceItemId: "evidence-1",
  sessionId: "participant-session-1",
  evidenceType: "participant_text_narrative",
  sourceChannel: "web_session_chatbot",
  rawContent: "I receive the request and check the account.",
  language: "en",
  capturedAt: now,
  capturedBy: "participant",
  trustStatus: "raw_unreviewed",
  confidenceScore: 0.92,
  originalFileName: null,
  providerJobId: null,
  linkedClarificationItemId: null,
  notes: "",
};

const validExtractedItem = {
  itemId: "item-1",
  label: "Receive request",
  description: "The participant receives the request.",
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

const validUnmappedContentItem = {
  unmappedItemId: "unmapped-1",
  sessionId: "participant-session-1",
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

const validExtractionDefect = {
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

const validEvidenceDispute = {
  disputeId: "dispute-1",
  sessionId: "participant-session-1",
  extractionId: "extraction-1",
  affectedItemId: "item-1",
  aiProposedInterpretation: "Participant owns the approval.",
  aiProposedEvidenceAnchor: evidenceAnchor,
  codeValidationIssue: "Quote supports review, not approval.",
  disputeType: "weak_semantic_support",
  severity: "high",
  recommendedAction: "admin_review",
  adminDecision: "pending",
  createdAt: now,
};

const validClarificationCandidate = {
  candidateId: "clarification-1",
  sessionId: "participant-session-1",
  linkedExtractedItemIds: ["item-1"],
  linkedUnmappedItemIds: ["unmapped-1"],
  linkedDefectIds: ["defect-1"],
  linkedRawEvidenceItemIds: ["evidence-1"],
  gapType: "unclear_owner",
  questionTheme: "Step owner",
  participantFacingQuestion: "Who owns this step?",
  whyItMatters: "The workflow owner must be clear.",
  exampleAnswer: "The finance coordinator owns it.",
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

const validBoundarySignal = {
  boundarySignalId: "boundary-1",
  sessionId: "participant-session-1",
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

const validSessionAccessToken = {
  accessTokenId: "token-1",
  tokenHash: "hashed-token-reference",
  participantSessionId: "participant-session-1",
  channelType: "web_session_chatbot",
  tokenStatus: "active",
  expiresAt: now,
  createdAt: now,
  lastUsedAt: null,
  revokedAt: null,
  revokedReason: null,
  useCount: 0,
  boundChannelIdentityId: null,
};

const validFirstPassExtractionOutput = {
  extractionId: "extraction-1",
  sessionId: "participant-session-1",
  basisEvidenceItemIds: ["evidence-1"],
  extractionStatus: "completed_with_unmapped",
  extractedActors: [validExtractedItem],
  extractedSteps: [validExtractedItem],
  sequenceMap: {
    orderedItemIds: ["item-1"],
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
        reasonUnclear: "Participant did not describe the next owner.",
        needsClarification: true,
        suggestedClarificationCandidateId: "clarification-1",
      },
    ],
    notes: ["Initial participant-level sequence draft."],
  },
  extractedDecisionPoints: [],
  extractedHandoffs: [],
  extractedExceptions: [],
  extractedSystems: [],
  extractedControls: [],
  extractedDependencies: [],
  extractedUnknowns: [],
  boundarySignals: [validBoundarySignal],
  clarificationCandidates: [validClarificationCandidate],
  confidenceNotes: ["Participant provided first-person evidence."],
  contradictionNotes: [],
  sourceCoverageSummary: "One participant narrative covered one step.",
  unmappedContentItems: [validUnmappedContentItem],
  extractionDefects: [validExtractionDefect],
  evidenceDisputes: [validEvidenceDispute],
  createdAt: now,
};

const validParticipantSession = {
  sessionId: "participant-session-1",
  caseId: "case-1",
  targetingPlanId: "plan-1",
  targetCandidateId: "candidate-1",
  participantContactProfileId: "contact-1",
  participantLabel: "Ops lead",
  participantRoleOrNodeId: "role-1",
  selectedDepartment: "Operations",
  selectedUseCase: "Invoice handling",
  languagePreference: "en",
  sessionState: "awaiting_first_narrative",
  channelStatus: "channel_selected_pending_dispatch",
  selectedParticipationMode: "web_session_chatbot",
  sessionContext: {
    sessionId: "participant-session-1",
    caseId: "case-1",
    targetingPlanId: "plan-1",
    targetCandidateId: "candidate-1",
    participantContactProfileId: "contact-1",
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
    rawEvidenceItems: [validRawEvidenceItem],
    firstNarrativeEvidenceId: "evidence-1",
  },
  analysisProgress: {
    firstNarrativeStatus: "received_text",
    extractionStatus: "not_started",
    clarificationItemIds: ["clarification-1"],
    boundarySignalIds: ["boundary-1"],
    unresolvedItemIds: ["unmapped-1"],
    nextActionIds: ["next-action-1"],
  },
  rawEvidenceItems: [validRawEvidenceItem],
  firstNarrativeStatus: "received_text",
  firstNarrativeEvidenceId: "evidence-1",
  extractionStatus: "not_started",
  clarificationItems: [validClarificationCandidate],
  boundarySignals: [validBoundarySignal],
  unresolvedItems: [validUnmappedContentItem],
  createdAt: now,
  updatedAt: now,
};

function expectValid(name, validator, value) {
  const result = validator(value);
  assert.equal(result.ok, true, `${name} should be valid`);
}

function expectInvalid(name, validator, value) {
  const result = validator(value);
  assert.equal(result.ok, false, `${name} should be invalid`);
}

expectValid("ParticipantSession", validateParticipantSession, validParticipantSession);
expectInvalid("ParticipantSession bad sessionState", validateParticipantSession, {
  ...validParticipantSession,
  sessionState: "not_started",
});
expectInvalid("ParticipantSession bad firstNarrativeStatus", validateParticipantSession, {
  ...validParticipantSession,
  firstNarrativeStatus: "received",
});

expectValid("RawEvidenceItem", validateRawEvidenceItem, validRawEvidenceItem);
const rawEvidenceMissingTrust = { ...validRawEvidenceItem };
delete rawEvidenceMissingTrust.trustStatus;
expectInvalid("RawEvidenceItem missing trustStatus", validateRawEvidenceItem, rawEvidenceMissingTrust);

expectValid("FirstPassExtractionOutput", validateFirstPassExtractionOutput, validFirstPassExtractionOutput);
expectInvalid("FirstPassExtractionOutput malformed sequenceMap", validateFirstPassExtractionOutput, {
  ...validFirstPassExtractionOutput,
  sequenceMap: { orderedItemIds: ["item-1"] },
});
expectInvalid("ExtractedItem ai_extraction without anchor", validateExtractedItem, {
  ...validExtractedItem,
  evidenceAnchors: [],
});

expectValid("FirstNarrativeStatus", validateFirstNarrativeStatus, "approved_for_extraction");
expectInvalid("FirstNarrativeStatus bad value", validateFirstNarrativeStatus, "approved");
expectValid("ExtractionStatus", validateExtractionStatus, "completed_with_evidence_disputes");
expectInvalid("ExtractionStatus bad value", validateExtractionStatus, "draft_ready_for_admin_review");
expectValid("SequenceMap", validateSequenceMap, validFirstPassExtractionOutput.sequenceMap);

expectValid("ClarificationCandidate", validateClarificationCandidate, validClarificationCandidate);
expectValid("BoundarySignal", validateBoundarySignal, validBoundarySignal);
expectValid("EvidenceDispute", validateEvidenceDispute, validEvidenceDispute);
expectValid("SessionAccessToken", validateSessionAccessToken, validSessionAccessToken);

console.log("Pass 5 Block 1 contract validation examples passed.");
