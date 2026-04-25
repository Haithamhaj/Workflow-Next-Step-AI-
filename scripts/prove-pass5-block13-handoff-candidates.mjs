import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  createPass6HandoffCandidateFromAdminEntry,
  createPass6HandoffCandidateFromAssistantRecommendation,
  createPass6HandoffCandidateFromBoundarySignal,
  createPass6HandoffCandidateFromEvidenceDispute,
  createRepeatedUncertaintyHandoffCandidateForSession,
  listPass6HandoffCandidatesByCase,
  listPass6HandoffCandidatesBySession,
  updatePass6HandoffCandidateAdminDecision,
} from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";

function session(sessionId) {
  return {
    sessionId,
    caseId: "case-pass5-block13",
    targetingPlanId: "targeting-plan-pass5-block13",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Operations participant",
    participantRoleOrNodeId: "role-operations",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
    languagePreference: "en",
    sessionState: "clarification_needed",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-pass5-block13",
      targetingPlanId: "targeting-plan-pass5-block13",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Operations participant",
      participantRoleOrNodeId: "role-operations",
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
      extractionStatus: "completed_with_evidence_disputes",
      clarificationItemIds: ["clarification-1", "clarification-2"],
      boundarySignalIds: ["boundary-1"],
      unresolvedItemIds: ["unmapped-1"],
      nextActionIds: [],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: "evidence-1",
    extractionStatus: "completed_with_evidence_disputes",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
  };
}

function clarification(candidateId, evidenceItemId) {
  return {
    candidateId,
    sessionId: "session-1",
    linkedExtractedItemIds: [],
    linkedUnmappedItemIds: ["unmapped-1"],
    linkedDefectIds: [],
    linkedRawEvidenceItemIds: [evidenceItemId],
    gapType: "unclear_owner",
    questionTheme: "Owner uncertainty",
    participantFacingQuestion: "Who owns this step?",
    whyItMatters: "Owner is needed for later review.",
    exampleAnswer: "Finance owns this step.",
    priority: "high",
    askNext: true,
    status: candidateId === "clarification-1" ? "open" : "partially_resolved",
    createdFrom: "extraction",
    adminInstruction: "Clarify owner.",
    aiFormulated: true,
    adminReviewStatus: "review_required",
    createdAt: now,
    updatedAt: now,
  };
}

function seed() {
  const store = createInMemoryStore();
  store.participantSessions.save(session("session-1"));
  store.rawEvidenceItems.save({
    evidenceItemId: "evidence-1",
    sessionId: "session-1",
    evidenceType: "participant_text_narrative",
    sourceChannel: "web_session_chatbot",
    rawContent: "Finance handles this, but I am not sure who approves exceptions.",
    language: "en",
    capturedAt: now,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "",
  });
  store.evidenceDisputes.save({
    disputeId: "dispute-1",
    sessionId: "session-1",
    extractionId: "extraction-1",
    affectedItemId: "step-1",
    aiProposedInterpretation: "Operations owns the approval.",
    aiProposedEvidenceAnchor: { evidenceItemId: "evidence-1", quote: "Finance handles this" },
    codeValidationIssue: "Quote points to Finance, not Operations.",
    disputeType: "weak_semantic_support",
    severity: "high",
    recommendedAction: "admin_review",
    adminDecision: "pending",
    createdAt: now,
  });
  store.boundarySignals.save({
    boundarySignalId: "boundary-1",
    sessionId: "session-1",
    boundaryType: "ownership_boundary",
    participantStatement: "Finance handles this.",
    linkedEvidenceItemId: "evidence-1",
    linkedExtractedItemIds: ["step-1"],
    linkedClarificationCandidateIds: ["clarification-1"],
    workflowArea: "decision",
    interpretationNote: "Participant says another team owns it.",
    requiresEscalation: true,
    suggestedEscalationTarget: "externalTeam",
    participantSuggestedOwner: "Finance",
    escalationReason: "Finance owns this policy.",
    shouldStopAskingParticipant: true,
    confidenceLevel: "medium",
    createdAt: now,
  });
  store.clarificationCandidates.save(clarification("clarification-1", "evidence-1"));
  store.clarificationCandidates.save(clarification("clarification-2", "evidence-1"));
  return store;
}

function repos(store) {
  return {
    participantSessions: store.participantSessions,
    pass6HandoffCandidates: store.pass6HandoffCandidates,
    evidenceDisputes: store.evidenceDisputes,
    boundarySignals: store.boundarySignals,
    clarificationCandidates: store.clarificationCandidates,
    firstPassExtractionOutputs: store.firstPassExtractionOutputs,
  };
}

const store = seed();
const r = repos(store);

const admin = createPass6HandoffCandidateFromAdminEntry({
  caseId: "case-pass5-block13",
  sessionIds: ["session-1"],
  candidateType: "admin_observation",
  description: "Admin observed a possible later review gap.",
  evidenceRefs: [{ evidenceItemId: "evidence-1", note: "rawEvidenceItemId=evidence-1" }],
  confidenceLevel: "medium",
  recommendedPass6Use: "Review as a possible gap later; do not treat as final workflow truth.",
  mandatoryOrOptional: "optional",
}, r, { now: () => now, handoffCandidateIdFactory: () => "handoff-admin-1" });
assert.equal(admin.ok, true);
assert.equal(admin.value.adminDecision, "pending");
assert.equal(admin.value.createdFrom, "admin_entry");

const assistant = createPass6HandoffCandidateFromAssistantRecommendation({
  caseId: "case-pass5-block13",
  sessionIds: ["session-1"],
  candidateType: "possible_gap",
  description: "Assistant recommended a draft later gap candidate after admin confirmation.",
  evidenceRefs: [{ evidenceItemId: "evidence-1", note: "assistantRecommendation=confirmed_by_admin" }],
  confidenceLevel: "low",
  recommendedPass6Use: "Use only as a reviewed candidate in later Pass 6.",
  mandatoryOrOptional: "optional",
}, r, { now: () => now, handoffCandidateIdFactory: () => "handoff-assistant-1" });
assert.equal(assistant.ok, true);
assert.equal(assistant.value.createdFrom, "admin_assistant");

const dispute = createPass6HandoffCandidateFromEvidenceDispute("dispute-1", r, {
  now: () => now,
  handoffCandidateIdFactory: () => "handoff-dispute-1",
});
assert.equal(dispute.ok, true);
assert.equal(dispute.value.candidateType, "evidence_dispute_for_later_review");
assert.equal(dispute.value.mandatoryOrOptional, "mandatory");

const boundary = createPass6HandoffCandidateFromBoundarySignal("boundary-1", r, {
  now: () => now,
  handoffCandidateIdFactory: () => "handoff-boundary-1",
});
assert.equal(boundary.ok, true);
assert.equal(boundary.value.candidateType, "possible_escalation_need");

const repeated = createRepeatedUncertaintyHandoffCandidateForSession("session-1", r, {
  now: () => now,
  handoffCandidateIdFactory: () => "handoff-uncertainty-1",
});
assert.equal(repeated.ok, true);
assert.equal(repeated.value.candidateType, "repeated_uncertainty");

assert.equal(listPass6HandoffCandidatesByCase("case-pass5-block13", r).length, 5);
assert.equal(listPass6HandoffCandidatesBySession("session-1", r).length, 5);

assert.equal(updatePass6HandoffCandidateAdminDecision("handoff-admin-1", "accepted_for_pass6", r).value.adminDecision, "accepted_for_pass6");
assert.equal(updatePass6HandoffCandidateAdminDecision("handoff-assistant-1", "dismissed", r).value.adminDecision, "dismissed");
assert.equal(updatePass6HandoffCandidateAdminDecision("handoff-dispute-1", "needs_more_evidence", r).value.adminDecision, "needs_more_evidence");

assert.equal(store.participantSessions.findById("session-1").sessionState, "clarification_needed");
assert.equal(store.pass6HandoffCandidates.findAll().length, 5);

const detailPage = readFileSync("apps/admin-web/app/participant-sessions/[sessionId]/page.tsx", "utf8");
const dashboardPage = readFileSync("apps/admin-web/app/participant-sessions/page.tsx", "utf8");
const helper = readFileSync("apps/admin-web/lib/pass5-dashboard.ts", "utf8");
const createRoute = readFileSync("apps/admin-web/app/api/participant-sessions/handoff-candidates/route.ts", "utf8");
const decisionRoute = readFileSync("apps/admin-web/app/api/participant-sessions/handoff-candidates/[id]/decision/route.ts", "utf8");
assert.ok(detailPage.includes("Pass 6 Handoff Candidates"));
assert.ok(detailPage.includes("Create admin handoff candidate"));
assert.ok(detailPage.includes("accepted_for_pass6"));
assert.ok(dashboardPage.includes("Handoff pending / accepted"));
assert.ok(helper.includes("pendingPass6HandoffCandidates"));
assert.ok(createRoute.includes("createPass6HandoffCandidateFromAdminEntry"));
assert.ok(createRoute.includes("createPass6HandoffCandidateFromAssistantRecommendation"));
assert.ok(decisionRoute.includes("updatePass6HandoffCandidateAdminDecision"));

for (const source of [detailPage, dashboardPage, helper, createRoute, decisionRoute]) {
  for (const banned of ["createFinalPackage", "commonPath", "runPass6", "workflow reconstruction", "whatsapp", "final provider-backed extraction"]) {
    assert.equal(source.toLowerCase().includes(banned.toLowerCase()), false, `${banned} should not be introduced`);
  }
}

console.log("Pass 5 Block 13 handoff candidate proof passed.");
