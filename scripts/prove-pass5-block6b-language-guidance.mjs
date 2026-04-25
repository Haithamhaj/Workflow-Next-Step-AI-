import assert from "node:assert/strict";

import {
  buildParticipantGuidanceText,
  buildTelegramParticipantGuidance,
} from "../packages/participant-sessions/dist/index.js";

function participantSession(languagePreference) {
  return {
    sessionId: `participant-session-language-${languagePreference}`,
    caseId: "case-language",
    targetingPlanId: "targeting-plan-language",
    targetCandidateId: "candidate-language",
    participantContactProfileId: "profile-language",
    participantLabel: "عمليات الدعم",
    participantRoleOrNodeId: "role-language",
    selectedDepartment: "Operations",
    selectedUseCase: "Refund exception handling",
    languagePreference,
    sessionState: "session_prepared",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "telegram_bot",
    sessionContext: {
      sessionId: `participant-session-language-${languagePreference}`,
      caseId: "case-language",
      targetingPlanId: "targeting-plan-language",
      targetCandidateId: "candidate-language",
      participantContactProfileId: "profile-language",
      participantLabel: "عمليات الدعم",
      participantRoleOrNodeId: "role-language",
      selectedDepartment: "Operations",
      selectedUseCase: "Refund exception handling",
      languagePreference,
    },
    channelAccess: {
      selectedParticipationMode: "telegram_bot",
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
    createdAt: "2026-04-25T00:00:00.000Z",
    updatedAt: "2026-04-25T00:00:00.000Z",
  };
}

const arabicSession = participantSession("ar");
const arabicTelegram = buildTelegramParticipantGuidance(arabicSession);
assert.equal(arabicTelegram.includes("أهلًا عمليات الدعم"), true);
assert.equal(arabicTelegram.includes("شكرًا لتعاونك معنا"), true);
assert.equal(arabicTelegram.includes("Refund exception handling"), true);
assert.equal(arabicTelegram.includes("لا تحتاج أن تكون الإجابة مرتبة بشكل مثالي"), true);
assert.equal(arabicTelegram.includes("أرسل إجابتك الآن كتابة"), true);

const englishSession = participantSession("en");
const englishTelegram = buildTelegramParticipantGuidance(englishSession);
assert.equal(englishTelegram.includes("Hi عمليات الدعم"), true);
assert.equal(englishTelegram.includes("thank you for your help"), true);
assert.equal(englishTelegram.includes("Refund exception handling"), true);
assert.equal(englishTelegram.includes("Perfect order is not required"), true);
assert.equal(englishTelegram.includes("Please send your answer now by text"), true);

const arabicWeb = buildParticipantGuidanceText(arabicSession, "web");
assert.equal(arabicWeb.language, "ar");
assert.equal(arabicWeb.text.includes("نحتاج نفهم كيف تتم عملية Refund exception handling فعليًا"), true);
assert.equal(arabicWeb.text.includes("وليس فقط الطريقة المثالية أو الرسمية"), true);
assert.equal(arabicWeb.text.includes("يمكنك الإجابة كتابة أو رفع تسجيل صوتي"), true);

const englishWeb = buildParticipantGuidanceText(englishSession, "web");
assert.equal(englishWeb.language, "en");
assert.equal(englishWeb.text.includes("We are asking you because your perspective helps explain"), true);
assert.equal(englishWeb.text.includes("what really happens in practice"), true);
assert.equal(englishWeb.text.includes("You can write your answer or upload an audio recording"), true);

const unsupportedSession = participantSession("fr");
const fallback = buildParticipantGuidanceText(unsupportedSession, "telegram");
assert.equal(fallback.language, "en");
assert.equal(fallback.text.includes("Please send your answer now by text"), true);

console.log("Pass 5 Block 6B language guidance proof passed.");
