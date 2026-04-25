import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  validateParticipantSession,
  validateTargetingRolloutPlan,
} from "../packages/contracts/dist/index.js";
import {
  createSQLiteIntakeRepositories,
} from "../packages/persistence/dist/index.js";
import {
  createParticipantSessionsFromTargetingPlan,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block3-session-creation.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";

function candidate(id, adminDecision, contactStatus = "ready_for_later_outreach") {
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
    contactChannelReadinessStatus: contactStatus,
    confidence: "medium",
    adminDecision,
  };
}

function profile(candidateId, overrides = {}) {
  const hasEmail = overrides.email !== undefined ? Boolean(overrides.email) : true;
  return {
    participantId: `profile-${candidateId}`,
    linkedTargetCandidateId: candidateId,
    displayName: `Participant ${candidateId}`,
    linkedHierarchyNodeId: `node-${candidateId}`,
    roleLabel: `Role ${candidateId}`,
    targetType: "core_participant",
    email: hasEmail ? overrides.email ?? `${candidateId}@example.com` : undefined,
    mobileNumber: overrides.mobileNumber,
    whatsAppNumber: overrides.whatsAppNumber,
    telegramHandle: overrides.telegramHandle,
    telegramUserId: overrides.telegramUserId,
    availableChannels: overrides.availableChannels ?? (hasEmail ? ["email"] : []),
    preferredChannel: overrides.preferredChannel ?? (hasEmail ? "email" : undefined),
    contactDataSource: { email: "pass4_manual_entry" },
    contactDataStatus: overrides.contactDataStatus ?? "ready_for_later_outreach",
    lastContactDataUpdatedAt: now,
    lastContactDataUpdatedBy: "admin",
  };
}

function planFixture(state, candidates, profiles, suffix) {
  const plan = {
    planId: `plan-${suffix}`,
    caseId: `case-${suffix}`,
    sessionId: `intake-session-${suffix}`,
    selectedDepartment: "Operations",
    selectedUseCase: "Invoice handling",
    basisHierarchySnapshotId: `approved-snapshot-${suffix}`,
    basisReadinessSnapshotId: `readiness-${suffix}`,
    state,
    targetCandidates: candidates,
    adminCandidateDecisions: candidates,
    participantContactProfiles: profiles,
    sourceSignalsUsed: [],
    questionHintSeeds: [],
    rolloutOrder: [{
      stageId: `stage-${suffix}`,
      stageNumber: 1,
      label: "Core participants",
      candidateIds: candidates.map((item) => item.candidateId),
      rationale: "Admin approved ordering.",
    }],
    finalReviewSummary: {
      approvedCandidateIds: candidates
        .filter((item) => item.adminDecision === "accepted" || item.adminDecision === "edited")
        .map((item) => item.candidateId),
      rejectedCandidateIds: candidates
        .filter((item) => item.adminDecision === "rejected")
        .map((item) => item.candidateId),
      unresolvedContactGaps: profiles
        .filter((item) => item.contactDataStatus !== "ready_for_later_outreach")
        .map((item) => `${item.displayName}: ${item.contactDataStatus}`),
      adminEditsAndNotes: [],
      readyForLaterOutreachCount: profiles.filter((item) => item.contactDataStatus === "ready_for_later_outreach").length,
      contactGapCount: profiles.filter((item) => item.contactDataStatus !== "ready_for_later_outreach").length,
    },
    finalPlanState: state,
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
  assert.equal(validation.ok, true, `TargetingRolloutPlan fixture should validate: ${validation.ok ? "" : JSON.stringify(validation.errors)}`);
  return plan;
}

function repos() {
  return createSQLiteIntakeRepositories(dbPath);
}

const idFactory = ({ targetingPlanId, targetCandidateId }) =>
  `${targetingPlanId}-${targetCandidateId}-session`;
const options = {
  now: () => now,
  idFactory,
  defaultLanguagePreference: "en",
};

const readyCandidate = candidate("ready", "accepted");
const rejectedCandidate = candidate("rejected", "rejected");
const readyPlan = planFixture(
  "approved_ready_for_outreach",
  [readyCandidate, rejectedCandidate],
  [profile("ready"), profile("rejected")],
  "ready",
);

const store = repos();
const readyResult = createParticipantSessionsFromTargetingPlan(readyPlan, store, options);
assert.equal(readyResult.ok, true);
assert.equal(readyResult.createdSessions.length, 1);
assert.equal(readyResult.skippedCandidates.length, 1);
assert.equal(readyResult.skippedCandidates[0]?.targetCandidateId, "rejected");
const readySession = readyResult.createdSessions[0];
assert.ok(readySession);
assert.equal(readySession.sessionState, "session_prepared");
assert.equal(readySession.channelStatus, "channel_selected_pending_dispatch");
assert.equal(readySession.selectedParticipationMode, "email_link_delivery");
assert.equal(readySession.rawEvidenceItems.length, 0);
assert.equal(readySession.rawEvidence.rawEvidenceItems.length, 0);
assert.equal(readySession.clarificationItems.length, 0);
assert.equal(readySession.boundarySignals.length, 0);
assert.equal(readySession.unresolvedItems.length, 0);
assert.equal(readySession.analysisProgress.firstNarrativeStatus, "not_received");
assert.equal(readySession.analysisProgress.extractionStatus, "not_started");
assert.equal(validateParticipantSession(readySession).ok, true);

const duplicateResult = createParticipantSessionsFromTargetingPlan(readyPlan, store, options);
assert.equal(duplicateResult.ok, true);
assert.equal(duplicateResult.createdSessions.length, 0);
assert.equal(duplicateResult.existingSessions.length, 1);
assert.equal(store.participantSessions.findByTargetingPlanId(readyPlan.planId).length, 1);

const completeCandidate = candidate("complete", "accepted");
const gapCandidate = candidate("gap", "accepted", "missing_required_contact_method");
const editedCandidate = candidate("edited", "edited");
const gapPlan = planFixture(
  "approved_with_contact_gaps",
  [completeCandidate, gapCandidate, editedCandidate],
  [
    profile("complete", { email: "complete@example.com" }),
    profile("gap", {
      email: "",
      availableChannels: [],
      preferredChannel: undefined,
      contactDataStatus: "missing_required_contact_method",
    }),
    profile("edited", {
      email: "",
      availableChannels: ["telegram"],
      preferredChannel: "telegram",
      telegramHandle: "edited_user",
    }),
  ],
  "gaps",
);

const gapResult = createParticipantSessionsFromTargetingPlan(gapPlan, store, options);
assert.equal(gapResult.ok, true);
assert.equal(gapResult.createdSessions.length, 3);
assert.equal(gapResult.blockedSessions.length, 1);
const completeSession = gapResult.createdSessions.find((session) => session.targetCandidateId === "complete");
const gapSession = gapResult.createdSessions.find((session) => session.targetCandidateId === "gap");
const editedSession = gapResult.createdSessions.find((session) => session.targetCandidateId === "edited");
assert.equal(completeSession?.sessionState, "session_prepared");
assert.equal(completeSession?.channelStatus, "channel_selected_pending_dispatch");
assert.equal(gapSession?.sessionState, "blocked_contact_gap");
assert.equal(gapSession?.channelStatus, "contact_data_missing");
assert.equal(editedSession?.sessionState, "session_prepared");
assert.equal(editedSession?.selectedParticipationMode, "telegram_bot");
for (const session of gapResult.createdSessions) {
  assert.equal(validateParticipantSession(session).ok, true);
  assert.equal(session.rawEvidenceItems.length, 0);
  assert.equal(session.clarificationItems.length, 0);
  assert.equal(session.boundarySignals.length, 0);
  assert.equal(session.unresolvedItems.length, 0);
}

const reloadedStore = repos();
assert.equal(reloadedStore.participantSessions.findById(readySession.sessionId)?.sessionId, readySession.sessionId);
assert.equal(reloadedStore.participantSessions.findByTargetingPlanId(gapPlan.planId).length, 3);
assert.equal(reloadedStore.participantSessions.findById(gapSession.sessionId)?.sessionState, "blocked_contact_gap");

const invalidStatePlan = planFixture(
  "under_admin_review",
  [candidate("pending", "accepted")],
  [profile("pending")],
  "invalid",
);
const beforeInvalidCount = store.participantSessions.findByTargetingPlanId(invalidStatePlan.planId).length;
const invalidResult = createParticipantSessionsFromTargetingPlan(invalidStatePlan, store, options);
assert.equal(invalidResult.ok, false);
assert.equal(invalidResult.errors[0]?.code, "targeting_plan_not_approved");
assert.equal(store.participantSessions.findByTargetingPlanId(invalidStatePlan.planId).length, beforeInvalidCount);

console.log("Pass 5 Block 3 session creation proof passed.");
