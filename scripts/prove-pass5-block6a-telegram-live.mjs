import assert from "node:assert/strict";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateParticipantSession } from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import {
  createTelegramDeepLink,
  getTelegramConfig,
  handleTelegramStartCommand,
  handleTelegramTextMessage,
} from "../packages/participant-sessions/dist/index.js";

const envPath = join(process.cwd(), ".env.local");
const timeoutMs = Number(process.env.TELEGRAM_LIVE_TIMEOUT_MS ?? 120_000);
const exactNarrative = "Telegram smoke test narrative";

function timeoutExit(message) {
  console.error(message);
  console.error("Manual steps required:");
  console.error("1. Open the printed Telegram deep link.");
  console.error("2. Press Start.");
  console.error(`3. Send exactly: ${exactNarrative}`);
  process.exit(1);
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}.`);
  }
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equals = trimmed.indexOf("=");
    if (equals === -1) continue;
    const key = trimmed.slice(0, equals).trim();
    let value = trimmed.slice(equals + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function assertNoTokenLeak(value, token) {
  assert.equal(JSON.stringify(value).includes(token), false, "Telegram token leaked into returned/logged value.");
}

async function telegramApi(method, payload) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ok === false) {
    const description = typeof body.description === "string" ? body.description : response.statusText;
    if (description.toLowerCase().includes("webhook")) {
      throw new Error(`Telegram polling failed because webhook mode appears active: ${description}. Disable the webhook before polling.`);
    }
    throw new Error(`Telegram API ${method} failed: ${description}`);
  }
  return body.result;
}

function participantSession(sessionId) {
  const now = new Date().toISOString();
  return {
    sessionId,
    caseId: "case-telegram-live",
    targetingPlanId: "targeting-plan-telegram-live",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Telegram live smoke participant",
    participantRoleOrNodeId: "role-telegram-smoke",
    selectedDepartment: "Operations",
    selectedUseCase: "Telegram live smoke workflow",
    languagePreference: process.env.TELEGRAM_LIVE_LANGUAGE === "ar" ? "ar" : "en",
    sessionState: "session_prepared",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "telegram_bot",
    sessionContext: {
      sessionId,
      caseId: "case-telegram-live",
      targetingPlanId: "targeting-plan-telegram-live",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Telegram live smoke participant",
      participantRoleOrNodeId: "role-telegram-smoke",
      selectedDepartment: "Operations",
      selectedUseCase: "Telegram live smoke workflow",
      languagePreference: process.env.TELEGRAM_LIVE_LANGUAGE === "ar" ? "ar" : "en",
    },
    channelAccess: {
      selectedParticipationMode: "telegram_bot",
      channelStatus: "channel_selected_pending_dispatch",
      sessionAccessTokenId: null,
      telegramBindingId: null,
      dispatchReference: null,
      notes: "Created by local Block 6A Telegram live smoke proof.",
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

function toAdapterMessage(update) {
  return { message: update.message };
}

async function sendMessage(chatId, text) {
  await telegramApi("sendMessage", { chat_id: chatId, text });
}

async function pollForUpdate({ offset, untilMs, predicate }) {
  let nextOffset = offset;
  while (Date.now() < untilMs) {
    const updates = await telegramApi("getUpdates", {
      offset: nextOffset,
      timeout: 10,
      allowed_updates: ["message"],
    });
    for (const update of updates) {
      nextOffset = Math.max(nextOffset, update.update_id + 1);
      if (predicate(update)) return { update, offset: nextOffset };
    }
  }
  return { update: null, offset: nextOffset };
}

loadEnvFile(envPath);
const token = process.env.TELEGRAM_BOT_TOKEN;
const config = getTelegramConfig(process.env);
if (!config.ok) {
  console.error(`Telegram config unavailable: ${config.errors[0]?.message ?? "unknown error"}`);
  console.error(`Config status: token=${token ? "present_hidden" : "missing"}`);
  process.exit(1);
}
assertNoTokenLeak(config, token);
console.log(`Telegram config: token=present_hidden username=${config.botUsername} mode=${config.updatesMode}`);
if (config.updatesMode !== "polling") {
  throw new Error(`Block 6A local live smoke requires polling mode; received ${config.updatesMode}.`);
}

const me = await telegramApi("getMe");
assert.equal(me.username, config.botUsername, `Bot username mismatch: expected ${config.botUsername}, got ${me.username}`);
assertNoTokenLeak(me, token);
console.log(`Telegram getMe succeeded for @${me.username}.`);

const dbPath = join(tmpdir(), "workflow-pass5-block6a-telegram-live.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}
const repos = createSQLiteIntakeRepositories(dbPath);
const session = participantSession(`participant-session-telegram-live-${Date.now()}`);
const sessionValidation = validateParticipantSession(session);
assert.equal(sessionValidation.ok, true, sessionValidation.ok ? "" : JSON.stringify(sessionValidation.errors));
repos.participantSessions.save(session);

const deepLink = createTelegramDeepLink(session, repos.sessionAccessTokens, {
  botUsername: config.botUsername,
});
assert.equal(deepLink.ok, true, deepLink.ok ? "" : JSON.stringify(deepLink.errors));

const existingUpdates = await telegramApi("getUpdates", { timeout: 0, allowed_updates: ["message"] });
let offset = existingUpdates.reduce((max, update) => Math.max(max, update.update_id + 1), 0);

console.log("");
console.log("Open this Telegram deep link:");
console.log(deepLink.deepLink);
console.log("Press Start, then send this exact message:");
console.log(exactNarrative);
console.log(`Waiting up to ${Math.round(timeoutMs / 1000)} seconds...`);
console.log("");

const untilMs = Date.now() + timeoutMs;
const startPoll = await pollForUpdate({
  offset,
  untilMs,
  predicate: (update) => update.message?.text?.trim() === `/start ${deepLink.rawToken}`,
});
if (!startPoll.update) {
  timeoutExit("Timed out waiting for /start <token> update from Telegram.");
}
offset = startPoll.offset;
const startResult = handleTelegramStartCommand(toAdapterMessage(startPoll.update), repos);
assert.equal(startResult.ok, true, startResult.ok ? "" : JSON.stringify(startResult.errors));
console.log(`Captured /start and stored binding ${startResult.binding.bindingId}.`);
await sendMessage(startResult.binding.telegramChatId, startResult.guidanceMessage);
await sendMessage(startResult.binding.telegramChatId, `Please send this exact message now:\n${exactNarrative}`);

const textPoll = await pollForUpdate({
  offset,
  untilMs,
  predicate: (update) =>
    String(update.message?.from?.id ?? "") === startResult.binding.telegramUserId &&
    update.message?.text?.trim() === exactNarrative,
});
if (!textPoll.update) {
  timeoutExit(`Timed out waiting for exact Telegram text message: ${exactNarrative}`);
}
const textResult = handleTelegramTextMessage(toAdapterMessage(textPoll.update), repos);
assert.equal(textResult.ok, true, textResult.ok ? "" : JSON.stringify(textResult.errors));
await sendMessage(startResult.binding.telegramChatId, textResult.replyMessage);

assert.equal(repos.telegramIdentityBindings.findById(startResult.binding.bindingId)?.participantSessionId, session.sessionId);
assert.equal(textResult.rawEvidenceItem.evidenceType, "telegram_message");
assert.equal(textResult.rawEvidenceItem.rawContent, exactNarrative);
assert.equal(textResult.participantSession.sessionState, "first_narrative_received");
assert.equal(textResult.participantSession.firstNarrativeStatus, "received_text");
assert.equal(textResult.participantSession.extractionStatus, "eligible");
assert.equal(repos.rawEvidenceItems.findBySessionId(session.sessionId).length, 1);

const reloaded = createSQLiteIntakeRepositories(dbPath);
assert.equal(reloaded.telegramIdentityBindings.findById(startResult.binding.bindingId)?.telegramUserId, startResult.binding.telegramUserId);
assert.equal(reloaded.participantSessions.findById(session.sessionId)?.sessionState, "first_narrative_received");
assert.equal(reloaded.rawEvidenceItems.findBySessionId(session.sessionId)[0]?.rawContent, exactNarrative);

console.log("Telegram live smoke proof passed.");
