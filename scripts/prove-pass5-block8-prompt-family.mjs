import assert from "node:assert/strict";

import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  PASS5_CAPABILITY_PROMPT_NAMES,
  PASS5_PROMPT_FAMILY,
  compilePass5Prompt,
  createPass5PromptTestJob,
  getPass5PromptSpec,
  listPass5PromptSpecs,
  registerPass5PromptFamily,
} from "../packages/prompts/dist/index.js";

const store = createInMemoryStore();

const family = registerPass5PromptFamily(store.structuredPromptSpecs);
assert.equal(family.basePrompt.promptSpecId, "promptspec_pass5_base_governance_v1");
assert.equal(family.basePrompt.status, "active");
assert.equal(family.capabilityPrompts.length, 7);

const promptSpecs = listPass5PromptSpecs(store.structuredPromptSpecs);
assert.equal(promptSpecs.length, 8);
for (const promptName of PASS5_CAPABILITY_PROMPT_NAMES) {
  const spec = getPass5PromptSpec(promptName, store.structuredPromptSpecs);
  assert.ok(spec, `${promptName} should be registered`);
  assert.equal(spec.previousActivePromptSpecId, family.basePrompt.promptSpecId);
  assert.match(
    spec.blocks.find((block) => block.blockId === "prompt_metadata")?.body ?? "",
    new RegExp(family.basePrompt.promptSpecId),
  );
}

const arabicGuidance = compilePass5Prompt("participant_guidance_prompt", {
  promptName: "participant_guidance_prompt",
  caseId: "case-pass5-prompt-family",
  sessionId: "session-ar",
  languagePreference: "ar",
  channel: "telegram_bot",
  participantLabel: "سارة",
  selectedDepartment: "Operations",
  selectedUseCase: "Order approval",
}, store.structuredPromptSpecs);
assert.match(arabicGuidance.compiledPrompt, /narrative-first/i);
assert.match(arabicGuidance.compiledPrompt, /language-aware/i);
assert.match(arabicGuidance.compiledPrompt, /languagePreference: ar/);
assert.match(arabicGuidance.compiledPrompt, /channel: telegram_bot/);

const englishGuidance = compilePass5Prompt("participant_guidance_prompt", {
  promptName: "participant_guidance_prompt",
  caseId: "case-pass5-prompt-family",
  sessionId: "session-en",
  languagePreference: "en",
  channel: "web_session_chatbot",
  participantLabel: "Mona",
  selectedDepartment: "Operations",
  selectedUseCase: "Order approval",
}, store.structuredPromptSpecs);
assert.match(englishGuidance.compiledPrompt, /languagePreference: en/);
assert.match(englishGuidance.compiledPrompt, /channel: web_session_chatbot/);

const extractionPrompt = compilePass5Prompt("first_pass_extraction_prompt", {
  promptName: "first_pass_extraction_prompt",
  caseId: "case-pass5-prompt-family",
  sessionId: "session-extract",
  languagePreference: "en",
  evidenceRefs: ["evidence-1"],
  rawContent: "The participant described the workflow.",
}, store.structuredPromptSpecs);
assert.match(extractionPrompt.compiledPrompt, /FirstPassExtractionOutput/);
assert.match(extractionPrompt.compiledPrompt, /no-drop extraction rule/i);
assert.match(extractionPrompt.compiledPrompt, /evidence anchors/i);
assert.match(extractionPrompt.compiledPrompt, /evidence disputes/i);
assert.match(extractionPrompt.compiledPrompt, /structured SequenceMap/i);

const clarificationPrompt = compilePass5Prompt("clarification_formulation_prompt", {
  promptName: "clarification_formulation_prompt",
  caseId: "case-pass5-prompt-family",
  sessionId: "session-clarify",
  languagePreference: "en",
  adminInstruction: "Ask who approves the order exception.",
}, store.structuredPromptSpecs);
assert.match(clarificationPrompt.compiledPrompt, /participantFacingQuestion/);
assert.match(clarificationPrompt.compiledPrompt, /whyItMatters/);
assert.match(clarificationPrompt.compiledPrompt, /exampleAnswer/);
assert.match(clarificationPrompt.compiledPrompt, /one question at a time/i);
assert.match(clarificationPrompt.compiledPrompt, /No compound-question loophole/i);

const adminAssistantPrompt = compilePass5Prompt("admin_assistant_prompt", {
  promptName: "admin_assistant_prompt",
  caseId: "case-pass5-prompt-family",
  sessionId: "session-admin",
  languagePreference: "en",
  contextBundleRef: "context-bundle-ref",
  adminInstruction: "Summarize what needs review.",
}, store.structuredPromptSpecs);
assert.match(adminAssistantPrompt.compiledPrompt, /Read-only by default/i);
assert.match(adminAssistantPrompt.compiledPrompt, /routed action/i);
assert.match(adminAssistantPrompt.compiledPrompt, /no shadow state/i);

const beforeSessions = store.participantSessions.findAll().length;
const beforeExtractionOutputs = store.firstPassExtractionOutputs.findAll().length;
const beforeClarifications = store.clarificationCandidates.findAll().length;

const jobResult = await createPass5PromptTestJob({
  promptName: "participant_guidance_prompt",
  inputBundle: {
    promptName: "participant_guidance_prompt",
    caseId: "case-pass5-prompt-family",
    sessionId: "session-provider-test",
    languagePreference: "en",
    channel: "web_session_chatbot",
    participantLabel: "Provider test participant",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
  },
  provider: null,
  repos: {
    promptSpecs: store.structuredPromptSpecs,
    providerJobs: store.providerJobs,
  },
  now: () => "2026-04-25T00:00:00.000Z",
});

assert.equal(jobResult.ok, false);
assert.equal(jobResult.job.jobKind, "pass5_prompt_test");
assert.equal(jobResult.job.promptFamily, PASS5_PROMPT_FAMILY);
assert.equal(jobResult.job.promptName, "participant_guidance_prompt");
assert.equal(jobResult.job.promptVersionId, englishGuidance.promptSpec.promptSpecId);
assert.equal(jobResult.job.basePromptVersionId, family.basePrompt.promptSpecId);
assert.equal(jobResult.job.status, "failed");
assert.match(jobResult.job.errorMessage ?? "", /provider_not_configured/);
assert.equal(store.providerJobs.findById(jobResult.job.jobId)?.status, "failed");

assert.equal(store.participantSessions.findAll().length, beforeSessions);
assert.equal(store.firstPassExtractionOutputs.findAll().length, beforeExtractionOutputs);
assert.equal(store.clarificationCandidates.findAll().length, beforeClarifications);

console.log("Pass 5 Block 8 prompt family proof passed.");
console.log("Provider-backed participant guidance test was not executed because provider was intentionally not configured for this proof; failure state was persisted honestly.");
