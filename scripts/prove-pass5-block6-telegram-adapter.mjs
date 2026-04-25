import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  validateParticipantSession,
  validateRawEvidenceItem,
} from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  createTelegramDeepLink,
  createWebSessionAccessToken,
  buildParticipantGuidanceText,
  buildTelegramParticipantGuidance,
  getTelegramConfig,
  handleTelegramStartCommand,
  handleTelegramTextMessage,
} from "../packages/participant-sessions/dist/index.js";

const dbPath = join(tmpdir(), "workflow-pass5-block6-telegram-adapter.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const now = "2026-04-25T00:00:00.000Z";
let tokenCounter = 0;
let tokenIdCounter = 0;
let bindingCounter = 0;
let evidenceCounter = 0;

function options(overrides = {}) {
  return {
    now: () => now,
    tokenTtlMs: 1000 * 60 * 60,
    tokenFactory: () => `telegram-raw-token-${++tokenCounter}`,
    accessTokenIdFactory: () => `telegram-access-token-${++tokenIdCounter}`,
    bindingIdFactory: () => `telegram-binding-${++bindingCounter}`,
    evidenceItemIdFactory: () => `telegram-evidence-${++evidenceCounter}`,
    botUsername: "NextStepWorkflowBot",
    ...overrides,
  };
}

function participantSession(sessionId, mode = "telegram_bot") {
  return {
    sessionId,
    caseId: "case-telegram-1",
    targetingPlanId: "targeting-plan-telegram-1",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Operations lead",
    participantRoleOrNodeId: "role-operations-lead",
    selectedDepartment: "Operations",
    selectedUseCase: "Refund exception handling",
    languagePreference: "en",
    sessionState: "session_prepared",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: mode,
    sessionContext: {
      sessionId,
      caseId: "case-telegram-1",
      targetingPlanId: "targeting-plan-telegram-1",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Operations lead",
      participantRoleOrNodeId: "role-operations-lead",
      selectedDepartment: "Operations",
      selectedUseCase: "Refund exception handling",
      languagePreference: "en",
    },
    channelAccess: {
      selectedParticipationMode: mode,
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
}

function startMessage(rawToken, userId = "101", chatId = "201") {
  return {
    message: {
      text: `/start ${rawToken}`,
      from: {
        id: userId,
        username: `user${userId}`,
        first_name: "Ops",
        last_name: "Lead",
        language_code: "en",
      },
      chat: { id: chatId },
    },
  };
}

function textMessage(text, userId = "101", chatId = "201") {
  return {
    message: {
      text,
      from: {
        id: userId,
        username: `user${userId}`,
        first_name: "Ops",
        last_name: "Lead",
        language_code: "en",
      },
      chat: { id: chatId },
    },
  };
}

const missingConfig = getTelegramConfig({});
assert.equal(missingConfig.ok, false);
assert.equal(missingConfig.configured, false);
assert.deepEqual(missingConfig.missingKeys, [
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_UPDATES_MODE",
]);
assert.equal(JSON.stringify(missingConfig).includes("secret-test-token"), false);

const validConfig = getTelegramConfig({
  TELEGRAM_BOT_TOKEN: "secret-test-token",
  TELEGRAM_BOT_USERNAME: "NextStepWorkflowBot",
  TELEGRAM_UPDATES_MODE: "polling",
  PUBLIC_APP_URL: "http://localhost:3000",
  TELEGRAM_WEBHOOK_SECRET: "local-dev-not-used-yet",
});
assert.equal(validConfig.ok, true);
assert.equal(validConfig.configured, true);
assert.equal(validConfig.botUsername, "NextStepWorkflowBot");
assert.equal(validConfig.updatesMode, "polling");
assert.equal(validConfig.tokenConfigured, true);
assert.equal(JSON.stringify(validConfig).includes("secret-test-token"), false);

const repos = createSQLiteIntakeRepositories(dbPath);
const session = participantSession("participant-session-telegram-1");
const sessionValidation = validateParticipantSession(session);
assert.equal(sessionValidation.ok, true, sessionValidation.ok ? "" : JSON.stringify(sessionValidation.errors));
repos.participantSessions.save(session);

const englishTelegramGuidance = buildTelegramParticipantGuidance(session);
assert.equal(englishTelegramGuidance.includes("Hi Operations lead"), true);
assert.equal(englishTelegramGuidance.includes("Refund exception handling"), true);
assert.equal(englishTelegramGuidance.includes("Perfect order is not required"), true);
const englishWebGuidance = buildParticipantGuidanceText(session, "web");
assert.equal(englishWebGuidance.language, "en");
assert.equal(englishWebGuidance.text.includes("You can write your answer or upload an audio recording"), true);

const arabicBaseSession = participantSession("participant-session-telegram-ar");
const arabicSession = {
  ...arabicBaseSession,
  languagePreference: "ar",
  sessionContext: {
    ...arabicBaseSession.sessionContext,
    languagePreference: "ar",
  },
};
const arabicTelegramGuidance = buildTelegramParticipantGuidance(arabicSession);
assert.equal(arabicTelegramGuidance.includes("أهلًا Operations lead"), true);
assert.equal(arabicTelegramGuidance.includes("شكرًا لتعاونك"), true);
assert.equal(arabicTelegramGuidance.includes("Refund exception handling"), true);
assert.equal(arabicTelegramGuidance.includes("أرسل إجابتك الآن كتابة"), true);
const arabicWebGuidance = buildParticipantGuidanceText(arabicSession, "web");
assert.equal(arabicWebGuidance.language, "ar");
assert.equal(arabicWebGuidance.text.includes("يمكنك الإجابة كتابة أو رفع تسجيل صوتي"), true);

const deepLink = createTelegramDeepLink(session, repos.sessionAccessTokens, options());
assert.equal(deepLink.ok, true);
assert.equal(deepLink.deepLink, `https://t.me/NextStepWorkflowBot?start=${encodeURIComponent(deepLink.rawToken)}`);
assert.equal(deepLink.deepLink.includes(session.sessionId), false);
assert.equal(deepLink.token.channelType, "telegram_bot");

const startResult = handleTelegramStartCommand(
  startMessage(deepLink.rawToken),
  repos,
  options(),
);
assert.equal(startResult.ok, true);
assert.equal(startResult.participantSession.sessionId, session.sessionId);
assert.equal(startResult.participantSession.channelStatus, "telegram_linked");
assert.equal(startResult.binding.participantSessionId, session.sessionId);
assert.equal(startResult.binding.telegramUserId, "101");
assert.equal(startResult.binding.bindingStatus, "token_bound_unverified");
assert.equal(startResult.guidanceMessage.includes("Refund exception handling"), true);
assert.equal(repos.telegramIdentityBindings.findById(startResult.binding.bindingId)?.telegramUserId, "101");

const duplicateLink = createTelegramDeepLink(session, repos.sessionAccessTokens, options());
assert.equal(duplicateLink.ok, true);
const duplicateBinding = handleTelegramStartCommand(
  startMessage(duplicateLink.rawToken, "102", "202"),
  repos,
  options(),
);
assert.equal(duplicateBinding.ok, false);
assert.equal(duplicateBinding.errors[0]?.code, "telegram_binding_conflict");

const narrativeText = "We receive the refund exception, check the customer account, ask Finance if the refund limit is unclear, and then close or escalate the case.";
const textResult = handleTelegramTextMessage(
  textMessage(narrativeText),
  repos,
  options(),
);
assert.equal(textResult.ok, true);
assert.equal(textResult.rawEvidenceItem.evidenceType, "telegram_message");
assert.equal(textResult.rawEvidenceItem.sourceChannel, "telegram_bot");
assert.equal(textResult.rawEvidenceItem.rawContent, narrativeText);
assert.equal(textResult.rawEvidenceItem.capturedBy, "participant");
assert.equal(textResult.rawEvidenceItem.trustStatus, "raw_unreviewed");
assert.equal(validateRawEvidenceItem(textResult.rawEvidenceItem).ok, true);
assert.equal(textResult.participantSession.sessionState, "first_narrative_received");
assert.equal(textResult.participantSession.channelStatus, "telegram_message_received");
assert.equal(textResult.participantSession.firstNarrativeStatus, "received_text");
assert.equal(textResult.participantSession.firstNarrativeEvidenceId, textResult.rawEvidenceItem.evidenceItemId);
assert.equal(textResult.participantSession.extractionStatus, "eligible");
assert.equal(repos.rawEvidenceItems.findBySessionId(session.sessionId).length, 1);
assert.equal(repos.firstPassExtractionOutputs.findBySessionId(session.sessionId).length, 0);
assert.equal(repos.clarificationCandidates.findBySessionId(session.sessionId).length, 0);

const unboundText = handleTelegramTextMessage(
  textMessage("I am not bound.", "999", "999"),
  repos,
  options(),
);
assert.equal(unboundText.ok, false);
assert.equal(unboundText.errors[0]?.code, "unbound_telegram_user");
assert.equal(repos.rawEvidenceItems.findAll().length, 1);

const duplicateNarrative = handleTelegramTextMessage(
  textMessage("Replacement text that must not overwrite."),
  repos,
  options(),
);
assert.equal(duplicateNarrative.ok, false);
assert.equal(duplicateNarrative.errors[0]?.code, "narrative_already_submitted");
assert.equal(duplicateNarrative.existingEvidenceItemId, textResult.rawEvidenceItem.evidenceItemId);
assert.equal(repos.rawEvidenceItems.findBySessionId(session.sessionId).length, 1);
assert.equal(repos.rawEvidenceItems.findById(textResult.rawEvidenceItem.evidenceItemId)?.rawContent, narrativeText);

const webSession = participantSession("participant-session-web-fallback", "web_session_chatbot");
repos.participantSessions.save(webSession);
const webToken = createWebSessionAccessToken(webSession, repos.sessionAccessTokens, options());
assert.equal(webToken.ok, true);
assert.equal(webToken.token.channelType, "web_session_chatbot");
const mismatch = handleTelegramStartCommand(
  startMessage(webToken.rawToken, "333", "333"),
  repos,
  options(),
);
assert.equal(mismatch.ok, false);
assert.equal(mismatch.errors[0]?.code, "channel_type_mismatch");
assert.equal(repos.participantSessions.findById(webSession.sessionId)?.firstNarrativeEvidenceId, null);

const reloaded = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloaded.telegramIdentityBindings.findById(startResult.binding.bindingId)?.participantSessionId, session.sessionId);
assert.equal(reloaded.participantSessions.findById(session.sessionId)?.sessionState, "first_narrative_received");
assert.equal(reloaded.participantSessions.findById(session.sessionId)?.firstNarrativeEvidenceId, textResult.rawEvidenceItem.evidenceItemId);
assert.equal(reloaded.rawEvidenceItems.findBySessionId(session.sessionId)[0]?.rawContent, narrativeText);
assert.equal(reloaded.firstPassExtractionOutputs.findBySessionId(session.sessionId).length, 0);
assert.equal(reloaded.clarificationCandidates.findBySessionId(session.sessionId).length, 0);

console.log("Pass 5 Block 6 Telegram adapter proof passed.");
