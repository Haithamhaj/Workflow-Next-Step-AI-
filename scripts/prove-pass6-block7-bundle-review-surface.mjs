import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  createSynthesisInputBundleForAdminReview,
  findSynthesisInputBundleForReview,
  getSynthesisInputBundleReviewDetail,
  listSynthesisInputBundlesForReview,
  summarizeSynthesisInputBundleForReview,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T12:00:00.000Z";
const caseId = "case-pass6-block7-proof";
const sessionId = "session-pass6-block7-proof";

function anchor(quote) {
  return {
    evidenceItemId: "evidence-block7-1",
    quote,
    startOffset: 0,
    endOffset: quote.length,
  };
}

function extractedItem(itemId, label, description, overrides = {}) {
  return {
    itemId,
    label,
    description,
    evidenceAnchors: [anchor(description)],
    sourceTextSpan: {
      evidenceItemId: "evidence-block7-1",
      quote: description,
      startOffset: 0,
      endOffset: description.length,
    },
    completenessStatus: "clear",
    confidenceLevel: "high",
    needsClarification: false,
    clarificationReason: "",
    relatedItemIds: [],
    adminReviewStatus: "reviewed_accepted",
    createdFrom: "ai_extraction",
    ...overrides,
  };
}

const participantSession = {
  sessionId,
  caseId,
  targetingPlanId: "target-plan-block7",
  targetCandidateId: "target-candidate-block7",
  participantContactProfileId: "participant-block7",
  participantLabel: "Operations Reviewer",
  participantRoleOrNodeId: "role-operations-reviewer",
  selectedDepartment: "Operations",
  selectedUseCase: "Vendor onboarding",
  languagePreference: "en",
  sessionState: "ready_for_later_synthesis_handoff",
  channelStatus: "manual_intake_ready",
  selectedParticipationMode: "manual_meeting_or_admin_entered",
  sessionContext: {
    sessionId,
    caseId,
    targetingPlanId: "target-plan-block7",
    targetCandidateId: "target-candidate-block7",
    participantContactProfileId: "participant-block7",
    participantLabel: "Operations Reviewer",
    participantRoleOrNodeId: "role-operations-reviewer",
    selectedDepartment: "Operations",
    selectedUseCase: "Vendor onboarding",
    languagePreference: "en",
  },
  channelAccess: {
    selectedParticipationMode: "manual_meeting_or_admin_entered",
    channelStatus: "manual_intake_ready",
    sessionAccessTokenId: null,
    telegramBindingId: null,
    dispatchReference: null,
    notes: null,
  },
  rawEvidence: {
    rawEvidenceItems: [],
    firstNarrativeEvidenceId: "evidence-block7-1",
  },
  analysisProgress: {
    firstNarrativeStatus: "approved_for_extraction",
    extractionStatus: "completed_with_evidence_disputes",
    clarificationItemIds: [],
    boundarySignalIds: ["boundary-block7"],
    unresolvedItemIds: ["unmapped-block7"],
    nextActionIds: [],
  },
  rawEvidenceItems: [{
    evidenceItemId: "evidence-block7-1",
    sessionId,
    evidenceType: "meeting_notes_admin_entered",
    sourceChannel: "manual_meeting_or_admin_entered",
    rawContent: "The reviewer checks the vendor request and escalates missing tax details.",
    language: "en",
    capturedAt: now,
    capturedBy: "admin",
    trustStatus: "admin_approved",
    confidenceScore: 0.94,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Accepted Pass 5 record.",
  }],
  firstNarrativeStatus: "approved_for_extraction",
  firstNarrativeEvidenceId: "evidence-block7-1",
  extractionStatus: "completed_with_evidence_disputes",
  clarificationItems: [],
  boundarySignals: [],
  unresolvedItems: [],
  createdAt: now,
  updatedAt: now,
};

const boundarySignal = {
  boundarySignalId: "boundary-block7",
  sessionId,
  boundaryType: "ownership_boundary",
  participantStatement: "Finance owns tax validation.",
  linkedEvidenceItemId: "evidence-block7-1",
  linkedExtractedItemIds: ["handoff-block7"],
  linkedClarificationCandidateIds: [],
  workflowArea: "handoff",
  interpretationNote: "Ownership boundary, not final truth.",
  requiresEscalation: true,
  suggestedEscalationTarget: "role",
  participantSuggestedOwner: "Finance",
  escalationReason: "Needs later synthesis review.",
  shouldStopAskingParticipant: true,
  confidenceLevel: "medium",
  createdAt: now,
};

const unresolvedItem = {
  unmappedItemId: "unmapped-block7",
  sessionId,
  evidenceItemId: "evidence-block7-1",
  quote: "Tax details sometimes come later.",
  reasonUnmapped: "Timing exception is unclear.",
  possibleCategory: "exception",
  confidenceLevel: "low",
  needsAdminReview: true,
  needsParticipantClarification: true,
  suggestedClarificationCandidateId: null,
  createdAt: now,
};

const defect = {
  defectId: "defect-block7",
  defectType: "low_confidence_mapping",
  description: "Timing exception has low-confidence mapping.",
  affectedOutputSection: "extractedExceptions",
  affectedItemId: "low-step-block7",
  basisEvidenceItemId: "evidence-block7-1",
  severity: "medium",
  recommendedAction: "Review before synthesis.",
  createdAt: now,
};

const dispute = {
  disputeId: "dispute-block7",
  sessionId,
  extractionId: "extraction-block7",
  affectedItemId: "decision-block7",
  aiProposedInterpretation: "Reviewer decides if tax detail escalation is required.",
  aiProposedEvidenceAnchor: anchor("escalates missing tax details"),
  codeValidationIssue: "Decision owner needs review.",
  disputeType: "unsupported_inference",
  severity: "high",
  recommendedAction: "admin_review",
  adminDecision: "pending",
  createdAt: now,
};

const acceptedClarification = {
  candidateId: "clarification-block7",
  sessionId,
  linkedExtractedItemIds: ["step-block7"],
  linkedUnmappedItemIds: [],
  linkedDefectIds: [],
  linkedRawEvidenceItemIds: ["evidence-block7-1"],
  gapType: "unclear_step",
  questionTheme: "Check sequence",
  participantFacingQuestion: "What check happens first?",
  whyItMatters: "Sequence anchor.",
  exampleAnswer: "I check completeness first.",
  priority: "medium",
  askNext: false,
  status: "resolved",
  createdFrom: "extraction",
  adminInstruction: "Resolved by Pass 5.",
  aiFormulated: true,
  adminReviewStatus: "reviewed_accepted",
  createdAt: now,
  updatedAt: now,
};

const extraction = {
  extractionId: "extraction-block7",
  sessionId,
  basisEvidenceItemIds: ["evidence-block7-1"],
  extractionStatus: "completed_with_evidence_disputes",
  extractedActors: [],
  extractedSteps: [
    extractedItem("step-block7", "Check vendor request", "Reviewer checks vendor request completeness."),
    extractedItem("low-step-block7", "Late tax detail path", "Tax details sometimes come later.", {
      completenessStatus: "unresolved",
      confidenceLevel: "low",
      needsClarification: true,
      clarificationReason: "Timing path is unclear.",
      adminReviewStatus: "review_required",
    }),
  ],
  sequenceMap: {
    orderedItemIds: ["step-block7", "handoff-block7"],
    sequenceLinks: [],
    unclearTransitions: [],
    notes: [],
  },
  extractedDecisionPoints: [extractedItem("decision-block7", "Escalation needed", "Reviewer may escalate missing tax details.")],
  extractedHandoffs: [extractedItem("handoff-block7", "Send to Finance", "Reviewer sends tax validation to Finance.")],
  extractedExceptions: [],
  extractedSystems: [],
  extractedControls: [],
  extractedDependencies: [],
  extractedUnknowns: [],
  boundarySignals: [boundarySignal],
  clarificationCandidates: [acceptedClarification],
  confidenceNotes: [],
  contradictionNotes: [],
  sourceCoverageSummary: "One accepted Pass 5 session.",
  unmappedContentItems: [unresolvedItem],
  extractionDefects: [defect],
  evidenceDisputes: [dispute],
  createdAt: now,
};

const handoffCandidate = {
  handoffCandidateId: "handoff-candidate-block7",
  caseId,
  sessionIds: [sessionId],
  relatedParticipantLabels: ["Operations Reviewer"],
  candidateType: "candidate_difference_block",
  description: "Finance handoff may vary by vendor type.",
  evidenceRefs: [anchor("Finance owns tax validation")],
  confidenceLevel: "medium",
  recommendedPass6Use: "Review as candidate-only material.",
  mandatoryOrOptional: "optional",
  adminDecision: "pending",
  createdFrom: "system_rule",
  createdAt: now,
};

const rolloutPlan = {
  planId: "target-plan-block7",
  caseId,
  sessionId: "pass4-session-block7",
  targetCandidates: [{
    candidateId: "target-candidate-block7",
    targetType: "role",
    linkedHierarchyNodeId: "role-operations-reviewer",
    roleLabel: "Operations Reviewer",
    suggestedReason: "Reviews vendor onboarding requests.",
    expectedWorkflowVisibility: "execution_layer",
    sourceSignals: ["source-signal-block7"],
    participantValidationNeeded: false,
    suggestedRolloutStage: 1,
    contactChannelReadinessStatus: "ready",
    confidence: "high",
    adminDecision: "approved",
  }],
  adminCandidateDecisions: [],
  sourceSignalsUsed: [{
    signalId: "source-signal-block7",
    sourceId: "source-policy-block7",
    sourceName: "Vendor Tax Policy",
    linkedHierarchyNodeId: "role-operations-reviewer",
    signalType: "policy_signal",
    documentSignal: "Policy says Finance validates tax details.",
    suggestedRelevance: "Compare later with participant statement.",
    participantValidationNeeded: true,
    confidence: "medium",
    adminNote: "Signal only.",
  }],
  questionHintSeeds: [{
    hintId: "question-hint-block7",
    sourceId: "source-policy-block7",
    sourceName: "Vendor Tax Policy",
    linkedTargetCandidateId: "target-candidate-block7",
    linkedHierarchyNodeId: "role-operations-reviewer",
    documentSignal: "Policy mentions escalation threshold.",
    whyItMayMatter: "Threshold may matter later.",
    suggestedLaterQuestionTheme: "Escalation threshold",
    triggerConditionForPass5: "Only if not covered.",
    doNotAskIfAlreadyCovered: "Participant already covered.",
    participantValidationNeeded: true,
    status: "carry_forward",
    adminNote: "No question is sent by Block 7.",
  }],
};

const store = createInMemoryStore();
store.participantSessions.save(participantSession);
store.firstPassExtractionOutputs.save(extraction);
store.boundarySignals.save(boundarySignal);
store.evidenceDisputes.save(dispute);
store.pass6HandoffCandidates.save(handoffCandidate);
store.targetingRolloutPlans.save(rolloutPlan);

const beforePass5Session = JSON.stringify(store.participantSessions.findById(sessionId));
const createResult = createSynthesisInputBundleForAdminReview({
  caseId,
  bundleId: "bundle-pass6-block7-proof",
  now,
}, store);

assert.equal(createResult.ok, true, createResult.ok ? "" : createResult.error);
assert.equal(JSON.stringify(store.participantSessions.findById(sessionId)), beforePass5Session, "create action must not mutate Pass 5 participant session records");

const listed = listSynthesisInputBundlesForReview(store.synthesisInputBundles);
assert.equal(listed.length, 1, "SynthesisInputBundle should be listable");

const summary = summarizeSynthesisInputBundleForReview(listed[0]);
assert.equal(summary.bundleId, "bundle-pass6-block7-proof");
assert.equal(summary.caseId, caseId);
assert.equal(summary.sessionCount, 1);
assert.ok(summary.folderCounts.analysis_material > 0, "summary should expose analysis material count");
assert.ok(summary.folderCounts.boundary_role_limit_material > 0, "summary should expose boundary material count");
assert.ok(summary.folderCounts.gap_risk_no_drop_material > 0, "summary should expose gap/risk material count");
assert.ok(summary.folderCounts.document_source_signal_material > 0, "summary should expose document/source signal count");
assert.equal(summary.adminReviewRecommendedBeforeSynthesis, true, "admin review should be recommended when risk material exists");

const found = findSynthesisInputBundleForReview("bundle-pass6-block7-proof", store.synthesisInputBundles);
assert.ok(found, "bundle detail should be retrievable by id");

const detail = getSynthesisInputBundleReviewDetail(found);
assert.ok(detail.folders.analysis_material.length > 0, "detail should contain analysis_material");
assert.ok(detail.folders.boundary_role_limit_material.length > 0, "detail should contain boundary_role_limit_material");
assert.ok(detail.folders.gap_risk_no_drop_material.length > 0, "detail should contain gap_risk_no_drop_material");
assert.ok(detail.folders.document_source_signal_material.length > 0, "detail should contain document_source_signal_material");
assert.ok(detail.preparationSummary.boundaryWarnings.some((warning) => warning.includes("No workflow synthesis")), "boundary warnings should state no synthesis occurred");
assert.ok(detail.roleLayerContexts.some((context) => context.participantId === "participant-block7"), "role/layer context should be visible");
assert.ok(detail.truthLensContexts.some((context) => context.lensType === "execution_evidence"), "truth-lens context should be visible");
assert.ok(detail.riskOpenItems.some((item) => item.itemType === "evidence_dispute"), "disputed items should be visible");
assert.ok(detail.riskOpenItems.some((item) => item.itemType === "extraction_defect"), "defective items should be visible");
assert.ok(detail.riskOpenItems.some((item) => item.itemType === "unmapped_content"), "unmapped items should be visible");
assert.ok(detail.riskOpenItems.some((item) => item.itemType === "pass6_handoff_candidate"), "candidate-only items should be visible");
assert.ok(detail.riskOpenItems.every((item) => !item.itemType.includes("claim")), "risk/open items should not be upgraded to claims");
assert.ok(detail.documentSourceSignals.some((item) => item.itemType === "source_signal"), "document/source signals should be visible");
assert.ok(detail.documentSourceSignals.every((item) => item.notes?.includes("signal")), "document/source signals should remain signal-only");

const emptyStore = createInMemoryStore();
const emptyCreateResult = createSynthesisInputBundleForAdminReview({
  caseId: "case-without-eligible-pass5",
  bundleId: "bundle-empty-should-not-save",
  now,
}, emptyStore);
assert.equal(emptyCreateResult.ok, false, "create action should reject cases with no eligible accepted Pass 5 output");
assert.equal(emptyStore.synthesisInputBundles.findAll().length, 0, "failed create action should not persist an empty bundle");

assert.equal(store.workflowClaims.findAll().length, 0, "review surface must not create 6B claims");
assert.equal(store.analysisMethodUsages.findAll().length, 0, "review surface must not create method usage records");
assert.equal(store.differenceInterpretations.findAll().length, 0, "review surface must not create differences");
assert.equal(store.assembledWorkflowDrafts.findAll().length, 0, "review surface must not create workflow drafts");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "review surface must not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "review surface must not create Pre-6C results");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "review surface must not create packages");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "review surface must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "review surface must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "review surface must not create Pass 7 records");

console.log("Pass 6 Block 7 bundle review surface proof passed.");
