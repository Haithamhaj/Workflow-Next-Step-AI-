import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateParticipantSession } from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  bindTelegramIdentityToSession,
  completeSessionAccessToken,
  createTelegramPairingToken,
  createWebSessionAccessToken,
  resolveSessionAccessToken,
  revokeSessionAccessToken,
  unlinkTelegramIdentityBinding,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block4-channel-access.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
let tokenCounter = 0;
let tokenIdCounter = 0;
let bindingCounter = 0;

function options(overrides = {}) {
  return {
    now: () => now,
    tokenTtlMs: 1000 * 60 * 60,
    tokenFactory: () => `raw-token-${++tokenCounter}`,
    accessTokenIdFactory: () => `access-token-${++tokenIdCounter}`,
    bindingIdFactory: () => `telegram-binding-${++bindingCounter}`,
    ...overrides,
  };
}

const sessionId = "participant-session-1";
const participantSession = {
  sessionId,
  caseId: "case-1",
  targetingPlanId: "targeting-plan-1",
  targetCandidateId: "candidate-1",
  participantContactProfileId: "profile-1",
  participantLabel: "Ops lead",
  participantRoleOrNodeId: "role-1",
  selectedDepartment: "Operations",
  selectedUseCase: "Invoice handling",
  languagePreference: "en",
  sessionState: "session_prepared",
  channelStatus: "channel_selected_pending_dispatch",
  selectedParticipationMode: "web_session_chatbot",
  sessionContext: {
    sessionId,
    caseId: "case-1",
    targetingPlanId: "targeting-plan-1",
    targetCandidateId: "candidate-1",
    participantContactProfileId: "profile-1",
    participantLabel: "Ops lead",
    participantRoleOrNodeId: "role-1",
    selectedDepartment: "Operations",
    selectedUseCase: "Invoice handling",
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
  rawEvidence: {
    rawEvidenceItems: [],
    firstNarrativeEvidenceId: null,
  },
  analysisProgress: {
    firstNarrativeStatus: "not_received",
    extractionStatus: "not_started",
    clarificationItemIds: [],
    boundarySignalIds: [],
    unresolvedItemIds: [],
    nextActionIds: [],
  },
  rawEvidenceItems: [],
  firstNarrativeStatus: "not_received",
  firstNarrativeEvidenceId: null,
  extractionStatus: "not_started",
  clarificationItems: [],
  boundarySignals: [],
  unresolvedItems: [],
  createdAt: now,
  updatedAt: now,
};

const validation = validateParticipantSession(participantSession);
assert.equal(validation.ok, true, validation.ok ? "" : JSON.stringify(validation.errors));

const repos = createSQLiteIntakeRepositories(dbPath);
repos.participantSessions.save(participantSession);

const webCreated = createWebSessionAccessToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(webCreated.ok, true);
assert.equal(webCreated.token.channelType, "web_session_chatbot");
assert.notEqual(webCreated.rawToken, participantSession.sessionId);
assert.equal(webCreated.token.tokenHash?.includes(participantSession.sessionId), false);

const resolved1 = resolveSessionAccessToken(webCreated.rawToken, repos.sessionAccessTokens, repos.participantSessions, options());
assert.equal(resolved1.ok, true);
assert.equal(resolved1.participantSession.sessionId, sessionId);
assert.equal(resolved1.token.useCount, 1);
assert.equal(resolved1.token.lastUsedAt, now);

const resolved2 = resolveSessionAccessToken(webCreated.rawToken, repos.sessionAccessTokens, repos.participantSessions, options());
assert.equal(resolved2.ok, true);
assert.equal(resolved2.token.useCount, 2);
assert.equal(repos.participantSessions.findByTargetingPlanId("targeting-plan-1").length, 1);

const expired = createWebSessionAccessToken(participantSession, repos.sessionAccessTokens, options({
  tokenTtlMs: -1000,
}));
assert.equal(expired.ok, true);
const expiredResult = resolveSessionAccessToken(expired.rawToken, repos.sessionAccessTokens, repos.participantSessions, options());
assert.equal(expiredResult.ok, false);
assert.equal(expiredResult.errors[0]?.code, "token_expired");
assert.equal(repos.sessionAccessTokens.findById(expired.token.accessTokenId)?.tokenStatus, "expired");

const revoked = createWebSessionAccessToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(revoked.ok, true);
const revokeResult = revokeSessionAccessToken(revoked.token.accessTokenId, repos.sessionAccessTokens, "admin revoked", options());
assert.equal(revokeResult.ok, true);
const revokedResult = resolveSessionAccessToken(revoked.rawToken, repos.sessionAccessTokens, repos.participantSessions, options());
assert.equal(revokedResult.ok, false);
assert.equal(revokedResult.errors[0]?.code, "token_revoked");

const completed = createWebSessionAccessToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(completed.ok, true);
const completeResult = completeSessionAccessToken(completed.token.accessTokenId, repos.sessionAccessTokens, options());
assert.equal(completeResult.ok, true);
const completedResolve = resolveSessionAccessToken(completed.rawToken, repos.sessionAccessTokens, repos.participantSessions, options());
assert.equal(completedResolve.ok, false);
assert.equal(completedResolve.errors[0]?.code, "token_completed");

const telegramCreated = createTelegramPairingToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(telegramCreated.ok, true);
assert.equal(telegramCreated.token.channelType, "telegram_bot");
const telegramBind = bindTelegramIdentityToSession(
  telegramCreated.rawToken,
  {
    telegramUserId: "telegram-user-1",
    telegramChatId: "telegram-chat-1",
    telegramUsername: "opslead",
    telegramFirstName: "Ops",
    telegramLastName: "Lead",
    telegramLanguageCode: "en",
    participantConfirmedName: true,
  },
  repos,
  options(),
);
assert.equal(telegramBind.ok, true);
assert.equal(telegramBind.binding.participantSessionId, sessionId);
assert.equal(telegramBind.binding.bindingStatus, "participant_confirmed_name");
assert.equal(repos.telegramIdentityBindings.findById(telegramBind.binding.bindingId)?.telegramUserId, "telegram-user-1");
assert.equal(repos.sessionAccessTokens.findById(telegramCreated.token.accessTokenId)?.boundChannelIdentityId, telegramBind.binding.bindingId);

const secondTelegram = createTelegramPairingToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(secondTelegram.ok, true);
const duplicateBind = bindTelegramIdentityToSession(
  secondTelegram.rawToken,
  {
    telegramUserId: "telegram-user-2",
    telegramChatId: "telegram-chat-2",
    telegramUsername: "other",
    telegramFirstName: "Other",
    telegramLastName: "User",
    telegramLanguageCode: "en",
  },
  repos,
  options(),
);
assert.equal(duplicateBind.ok, false);
assert.equal(duplicateBind.errors[0]?.code, "telegram_binding_conflict");

const unlinkResult = unlinkTelegramIdentityBinding(telegramBind.binding.bindingId, repos.telegramIdentityBindings, "admin unlink", options());
assert.equal(unlinkResult.ok, true);
assert.equal(unlinkResult.binding.bindingStatus, "rejected_or_unlinked");

const thirdTelegram = createTelegramPairingToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(thirdTelegram.ok, true);
const adminVerifiedBind = bindTelegramIdentityToSession(
  thirdTelegram.rawToken,
  {
    telegramUserId: "telegram-user-3",
    telegramChatId: "telegram-chat-3",
    telegramUsername: "verified",
    telegramFirstName: "Verified",
    telegramLastName: "User",
    telegramLanguageCode: "en",
    adminVerified: true,
  },
  repos,
  options(),
);
assert.equal(adminVerifiedBind.ok, true);
assert.equal(adminVerifiedBind.binding.bindingStatus, "admin_verified");
const unlinkAdminVerified = unlinkTelegramIdentityBinding(adminVerifiedBind.binding.bindingId, repos.telegramIdentityBindings, "admin unlink", options());
assert.equal(unlinkAdminVerified.ok, true);

const mismatchToken = createTelegramPairingToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(mismatchToken.ok, true);
const mismatchBind = bindTelegramIdentityToSession(
  mismatchToken.rawToken,
  {
    telegramUserId: "telegram-user-4",
    telegramChatId: "telegram-chat-4",
    telegramUsername: "mismatch",
    telegramFirstName: "Mismatch",
    telegramLastName: "User",
    telegramLanguageCode: "en",
    mismatchRequiresReview: true,
  },
  repos,
  options(),
);
assert.equal(mismatchBind.ok, true);
assert.equal(mismatchBind.binding.bindingStatus, "mismatch_requires_review");

const webForTelegram = createWebSessionAccessToken(participantSession, repos.sessionAccessTokens, options());
assert.equal(webForTelegram.ok, true);
const channelMismatch = bindTelegramIdentityToSession(
  webForTelegram.rawToken,
  {
    telegramUserId: "telegram-user-web",
    telegramChatId: "telegram-chat-web",
    telegramUsername: "wrong",
    telegramFirstName: "Wrong",
    telegramLastName: "Channel",
    telegramLanguageCode: "en",
  },
  repos,
  options(),
);
assert.equal(channelMismatch.ok, false);
assert.equal(channelMismatch.errors[0]?.code, "channel_type_mismatch");

const reloaded = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloaded.participantSessions.findById(sessionId)?.sessionId, sessionId);
assert.equal(reloaded.sessionAccessTokens.findByTokenHash(webCreated.token.tokenHash)?.participantSessionId, sessionId);
assert.equal(reloaded.sessionAccessTokens.findById(webCreated.token.accessTokenId)?.useCount, 2);
assert.equal(reloaded.telegramIdentityBindings.findById(telegramBind.binding.bindingId)?.bindingStatus, "rejected_or_unlinked");
assert.equal(reloaded.telegramIdentityBindings.findById(adminVerifiedBind.binding.bindingId)?.bindingStatus, "rejected_or_unlinked");
assert.equal(reloaded.telegramIdentityBindings.findById(mismatchBind.binding.bindingId)?.bindingStatus, "mismatch_requires_review");
assert.equal(reloaded.participantSessions.findByTargetingPlanId("targeting-plan-1").length, 1);

console.log("Pass 5 Block 4 channel access proof passed.");
