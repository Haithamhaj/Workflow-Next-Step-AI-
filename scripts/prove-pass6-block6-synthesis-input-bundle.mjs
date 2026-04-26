import assert from "node:assert/strict";

import { validateSynthesisInputBundle } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { buildSynthesisInputBundleFromPass5 } from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T10:00:00.000Z";
const caseId = "case-pass6-block6-proof";
const sessionId = "session-pass5-accepted-1";

function evidenceAnchor(evidenceItemId, quote) {
  return {
    evidenceItemId,
    quote,
    startOffset: 0,
    endOffset: quote.length,
    note: "Pass 5 accepted evidence anchor.",
  };
}

function extractedItem(itemId, label, description, overrides = {}) {
  return {
    itemId,
    label,
    description,
    evidenceAnchors: [evidenceAnchor("evidence-1", description)],
    sourceTextSpan: {
      evidenceItemId: "evidence-1",
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

const session = {
  sessionId,
  caseId,
  targetingPlanId: "target-plan-1",
  targetCandidateId: "target-candidate-1",
  participantContactProfileId: "participant-1",
  participantLabel: "Operations Coordinator",
  participantRoleOrNodeId: "role-operations-coordinator",
  selectedDepartment: "Operations",
  selectedUseCase: "Vendor onboarding",
  languagePreference: "en",
  sessionState: "ready_for_later_synthesis_handoff",
  channelStatus: "manual_intake_ready",
  selectedParticipationMode: "manual_meeting_or_admin_entered",
  sessionContext: {
    sessionId,
    caseId,
    targetingPlanId: "target-plan-1",
    targetCandidateId: "target-candidate-1",
    participantContactProfileId: "participant-1",
    participantLabel: "Operations Coordinator",
    participantRoleOrNodeId: "role-operations-coordinator",
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
    firstNarrativeEvidenceId: "evidence-1",
  },
  analysisProgress: {
    firstNarrativeStatus: "approved_for_extraction",
    extractionStatus: "completed_with_defects",
    clarificationItemIds: ["clarification-resolved", "clarification-open"],
    boundarySignalIds: ["boundary-1"],
    unresolvedItemIds: ["unmapped-1"],
    nextActionIds: [],
  },
  rawEvidenceItems: [{
    evidenceItemId: "evidence-1",
    sessionId,
    evidenceType: "meeting_notes_admin_entered",
    sourceChannel: "manual_meeting_or_admin_entered",
    rawContent: "I check the onboarding request, send Finance the tax form, and wait for approval.",
    language: "en",
    capturedAt: now,
    capturedBy: "admin",
    trustStatus: "admin_approved",
    confidenceScore: 0.95,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Approved Pass 5 fixture evidence.",
  }],
  firstNarrativeStatus: "approved_for_extraction",
  firstNarrativeEvidenceId: "evidence-1",
  extractionStatus: "completed_with_defects",
  clarificationItems: [],
  boundarySignals: [],
  unresolvedItems: [],
  createdAt: now,
  updatedAt: now,
};

const boundarySignal = {
  boundarySignalId: "boundary-1",
  sessionId,
  boundaryType: "upstream_workflow_boundary",
  participantStatement: "Finance owns the tax validation after I hand it off.",
  linkedEvidenceItemId: "evidence-1",
  linkedExtractedItemIds: ["handoff-1"],
  linkedClarificationCandidateIds: [],
  workflowArea: "handoff",
  interpretationNote: "Participant described upstream/downstream ownership boundary.",
  requiresEscalation: true,
  suggestedEscalationTarget: "role",
  participantSuggestedOwner: "Finance",
  escalationReason: "Finance ownership should be reviewed later.",
  shouldStopAskingParticipant: true,
  confidenceLevel: "medium",
  createdAt: now,
};

const resolvedClarification = {
  candidateId: "clarification-resolved",
  sessionId,
  linkedExtractedItemIds: ["step-1"],
  linkedUnmappedItemIds: [],
  linkedDefectIds: [],
  linkedRawEvidenceItemIds: ["evidence-1"],
  gapType: "unclear_step",
  questionTheme: "Confirm first check",
  participantFacingQuestion: "What do you check first?",
  whyItMatters: "The first check anchors the sequence.",
  exampleAnswer: "I verify the request is complete.",
  priority: "high",
  askNext: false,
  status: "resolved",
  createdFrom: "extraction",
  adminInstruction: "Resolved by participant answer.",
  aiFormulated: true,
  adminReviewStatus: "reviewed_accepted",
  createdAt: now,
  updatedAt: now,
};

const openClarification = {
  ...resolvedClarification,
  candidateId: "clarification-open",
  linkedExtractedItemIds: ["low-confidence-step"],
  questionTheme: "Unclear backup step",
  participantFacingQuestion: "Who covers the check when you are absent?",
  whyItMatters: "Backup ownership is still unclear.",
  status: "open",
  adminInstruction: "Keep open for later review.",
};

const unmappedContent = {
  unmappedItemId: "unmapped-1",
  sessionId,
  evidenceItemId: "evidence-1",
  sourceTextSpan: {
    evidenceItemId: "evidence-1",
    quote: "Sometimes Legal gets involved.",
    startOffset: 90,
    endOffset: 118,
  },
  quote: "Sometimes Legal gets involved.",
  reasonUnmapped: "Unclear exception path.",
  possibleCategory: "exception",
  confidenceLevel: "low",
  needsAdminReview: true,
  needsParticipantClarification: true,
  suggestedClarificationCandidateId: "clarification-open",
  createdAt: now,
};

const extractionDefect = {
  defectId: "defect-1",
  defectType: "ambiguous_sequence",
  description: "Backup coverage sequence is ambiguous.",
  affectedOutputSection: "extractedSteps",
  affectedItemId: "low-confidence-step",
  basisEvidenceItemId: "evidence-1",
  severity: "medium",
  recommendedAction: "Preserve for later synthesis review.",
  createdAt: now,
};

const evidenceDispute = {
  disputeId: "dispute-1",
  sessionId,
  extractionId: "extraction-1",
  affectedItemId: "decision-1",
  aiProposedInterpretation: "The coordinator decides whether Finance approval is required.",
  aiProposedEvidenceAnchor: evidenceAnchor("evidence-1", "wait for approval"),
  codeValidationIssue: "Decision owner is not fully supported by evidence.",
  disputeType: "unsupported_inference",
  severity: "high",
  recommendedAction: "admin_review",
  adminDecision: "pending",
  createdAt: now,
};

const extraction = {
  extractionId: "extraction-1",
  sessionId,
  basisEvidenceItemIds: ["evidence-1"],
  extractionStatus: "completed_with_defects",
  extractedActors: [extractedItem("actor-1", "Coordinator", "The coordinator participates in onboarding.")],
  extractedSteps: [
    extractedItem("step-1", "Check request", "The coordinator checks the onboarding request."),
    extractedItem("low-confidence-step", "Backup check", "A backup may check the request.", {
      completenessStatus: "unresolved",
      confidenceLevel: "low",
      needsClarification: true,
      clarificationReason: "Backup role unclear.",
      adminReviewStatus: "review_required",
    }),
  ],
  sequenceMap: {
    orderedItemIds: ["step-1", "handoff-1", "decision-1"],
    sequenceLinks: [{
      fromItemId: "step-1",
      toItemId: "handoff-1",
      relationType: "then",
      condition: "Request complete",
      evidenceAnchors: [evidenceAnchor("evidence-1", "send Finance the tax form")],
      confidenceLevel: "high",
    }],
    unclearTransitions: [{
      fromItemId: "handoff-1",
      toItemId: "decision-1",
      reasonUnclear: "Approval trigger is unclear.",
      needsClarification: true,
      suggestedClarificationCandidateId: "clarification-open",
    }],
    notes: ["Sequence from accepted Pass 5 extraction."],
  },
  extractedDecisionPoints: [extractedItem("decision-1", "Approval needed", "Finance approval may be required.")],
  extractedHandoffs: [extractedItem("handoff-1", "Send to Finance", "Coordinator sends the tax form to Finance.")],
  extractedExceptions: [extractedItem("exception-1", "Legal exception", "Legal may get involved for unusual cases.")],
  extractedSystems: [extractedItem("system-1", "Vendor portal", "The request is checked in the vendor portal.")],
  extractedControls: [extractedItem("control-1", "Finance approval", "Finance approves before onboarding completes.")],
  extractedDependencies: [extractedItem("dependency-1", "Tax form dependency", "The tax form must be available before Finance review.")],
  extractedUnknowns: [extractedItem("unknown-1", "Unknown backup", "Backup owner is unknown.", {
    completenessStatus: "unresolved",
    confidenceLevel: "low",
    needsClarification: true,
    clarificationReason: "Backup owner not known.",
    adminReviewStatus: "review_required",
  })],
  boundarySignals: [boundarySignal],
  clarificationCandidates: [resolvedClarification, openClarification],
  confidenceNotes: ["Accepted with noted gaps."],
  contradictionNotes: ["No contradiction resolved by 6A."],
  sourceCoverageSummary: "One accepted participant session.",
  unmappedContentItems: [unmappedContent],
  extractionDefects: [extractionDefect],
  evidenceDisputes: [evidenceDispute],
  createdAt: now,
};

const handoffCandidate = {
  handoffCandidateId: "handoff-candidate-1",
  caseId,
  sessionIds: [sessionId],
  relatedParticipantLabels: ["Operations Coordinator"],
  candidateType: "candidate_difference_block",
  description: "Finance approval route may differ by vendor type.",
  evidenceRefs: [evidenceAnchor("evidence-1", "wait for approval")],
  confidenceLevel: "medium",
  recommendedPass6Use: "Preserve as candidate-only later synthesis material.",
  mandatoryOrOptional: "optional",
  adminDecision: "pending",
  createdFrom: "system_rule",
  createdAt: now,
};

const rolloutPlan = {
  planId: "target-plan-1",
  caseId,
  sessionId: "pass4-session-1",
  selectedDepartment: "Operations",
  selectedUseCase: "Vendor onboarding",
  basisHierarchySnapshotId: "hierarchy-1",
  basisReadinessSnapshotId: "readiness-1",
  state: "approved_for_rollout",
  targetCandidates: [{
    candidateId: "target-candidate-1",
    targetType: "role",
    linkedHierarchyNodeId: "role-operations-coordinator",
    roleLabel: "Operations Coordinator",
    suggestedReason: "Role executes the onboarding check.",
    expectedWorkflowVisibility: "execution_layer",
    sourceSignals: ["source-signal-1"],
    participantValidationNeeded: false,
    suggestedRolloutStage: 1,
    rolloutOrder: 1,
    contactChannelReadinessStatus: "ready",
    confidence: "high",
    adminDecision: "approved",
  }],
  adminCandidateDecisions: [],
  participantContactProfiles: [],
  sourceSignalsUsed: [{
    signalId: "source-signal-1",
    sourceId: "source-sop-1",
    sourceName: "Vendor Onboarding SOP",
    linkedHierarchyNodeId: "role-operations-coordinator",
    signalType: "sop_role_signal",
    documentSignal: "The SOP says Finance validates tax forms.",
    suggestedRelevance: "Compare with participant handoff evidence later.",
    participantValidationNeeded: true,
    confidence: "medium",
    adminNote: "Document signal only.",
  }],
  questionHintSeeds: [{
    hintId: "question-hint-1",
    sourceId: "source-sop-1",
    sourceName: "Vendor Onboarding SOP",
    linkedTargetCandidateId: "target-candidate-1",
    linkedHierarchyNodeId: "role-operations-coordinator",
    documentSignal: "SOP mentions Finance approval threshold.",
    whyItMayMatter: "Approval threshold may affect readiness later.",
    suggestedLaterQuestionTheme: "Approval threshold",
    triggerConditionForPass5: "Ask only if not already covered.",
    doNotAskIfAlreadyCovered: "Participant already described threshold.",
    participantValidationNeeded: true,
    status: "carry_forward",
    adminNote: "No question is sent by 6A.",
  }],
  rolloutOrder: [],
  finalReviewSummary: {
    approvedCandidateIds: ["target-candidate-1"],
    rejectedCandidateIds: [],
    unresolvedContactGaps: [],
    adminEditsAndNotes: [],
    readyForLaterOutreachCount: 1,
    contactGapCount: 0,
  },
  finalPlanState: "approved_for_rollout",
  providerStatus: "provider_success",
  approvalMetadata: {
    approvedBy: "admin",
    approvedAt: now,
    approvalNote: "Fixture plan.",
  },
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

const store = createInMemoryStore();
store.participantSessions.save(session);
store.firstPassExtractionOutputs.save(extraction);
store.clarificationCandidates.save(openClarification);
store.boundarySignals.save(boundarySignal);
store.evidenceDisputes.save(evidenceDispute);
store.pass6HandoffCandidates.save(handoffCandidate);
store.targetingRolloutPlans.save(rolloutPlan);

const result = buildSynthesisInputBundleFromPass5(
  {
    caseId,
    bundleId: "bundle-pass6-block6-proof",
    now,
  },
  store,
);

assert.equal(result.ok, true, result.ok ? "" : result.error);
const bundle = result.bundle;
const validation = validateSynthesisInputBundle(bundle);
assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));

const persisted = store.synthesisInputBundles.findById(bundle.bundleId);
assert.ok(persisted, "builder should persist SynthesisInputBundle when repository is provided");
assert.equal(persisted.updatedAt, now, "persisted bundle should carry updatedAt outside the shared contract");

assert.deepEqual(bundle.sourcePass5SessionIds, [sessionId], "only accepted Pass 5 sessions should be consumed");
assert.ok(bundle.analysis_material.some((item) => item.itemType === "extracted_step"), "analysis_material should include accepted extracted steps");
assert.ok(bundle.analysis_material.some((item) => item.itemType === "sequence_map"), "analysis_material should include sequence maps");
assert.ok(bundle.analysis_material.some((item) => item.itemType === "clarification_outcome"), "analysis_material should include accepted clarification outcomes");
assert.ok(bundle.boundary_role_limit_material.some((item) => item.itemType === "boundary_signal"), "boundary signals should be sorted into boundary_role_limit_material");
assert.ok(bundle.gap_risk_no_drop_material.some((item) => item.itemType === "unmapped_content"), "unmapped content should be preserved as gap/risk material");
assert.ok(bundle.gap_risk_no_drop_material.some((item) => item.itemType === "extraction_defect"), "defects should be preserved as gap/risk material");
assert.ok(bundle.gap_risk_no_drop_material.some((item) => item.itemType === "evidence_dispute"), "disputes should be preserved as gap/risk material");
assert.ok(bundle.gap_risk_no_drop_material.some((item) => item.itemType === "pass6_handoff_candidate"), "candidate-only handoff material should be preserved as gap/risk material");
assert.ok(bundle.gap_risk_no_drop_material.some((item) => item.notes?.includes("not upgraded to workflow truth")), "risk materials should explicitly avoid truth upgrade");
assert.ok(bundle.document_source_signal_material.some((item) => item.itemType === "source_signal"), "document/source signals should be sorted into document_source_signal_material");
assert.ok(bundle.document_source_signal_material.some((item) => item.itemType === "document_question_hint"), "document-derived question hints should be carried forward");
assert.ok(bundle.document_source_signal_material.every((item) => item.notes?.includes("signal") || item.notes?.includes("signals")), "document/source materials should remain signal-only");

const roleContext = bundle.roleLayerContexts.find((context) => context.sessionId === sessionId);
assert.ok(roleContext, "role/layer context should be attached");
assert.equal(roleContext.participantId, "participant-1");
assert.equal(roleContext.targetCandidateId, "target-candidate-1");
assert.equal(roleContext.hierarchyNodeId, "role-operations-coordinator");
assert.equal(roleContext.participantTargetType, "role");

const approvedLensTypes = new Set([
  "execution_evidence",
  "oversight_evidence",
  "approval_control_evidence",
  "policy_intent_evidence",
  "handoff_dependency_evidence",
  "document_signal_evidence",
]);
assert.ok(bundle.truthLensContexts.length >= approvedLensTypes.size, "truth-lens context should be attached");
assert.ok(bundle.truthLensContexts.every((context) => approvedLensTypes.has(context.lensType)), "truth-lens categories should use approved conservative values");

assert.equal(store.workflowClaims.findAll().length, 0, "6A builder must not create 6B claims");
assert.equal(store.analysisMethodUsages.findAll().length, 0, "6A builder must not create method usage records");
assert.equal(store.differenceInterpretations.findAll().length, 0, "6A builder must not create difference interpretations");
assert.equal(store.assembledWorkflowDrafts.findAll().length, 0, "6A builder must not assemble workflows");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "6A builder must not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "6A builder must not create Pre-6C gate records");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "6A builder must not create package records");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "6A builder must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "6A builder must not create Copilot context records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "6A builder must not create Pass 7 candidates");

console.log("Pass 6 Block 6 synthesis input bundle proof passed.");
