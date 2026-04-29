import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  buildSourcesContextCopilotProviderPrompt,
  createSourcesContextCopilotChatResponse,
  createSourcesContextCopilotContextEnvelope,
  createSourcesContextCopilotFallbackResponse,
  createSourcesContextCopilotProviderResponse,
  getDefaultStageCopilotSystemPrompt,
} from "../packages/stage-copilot/dist/index.js";

const routePath = "apps/admin-web/app/api/stage-copilot/sources-context/chat/route.ts";
const routeSource = readFileSync(routePath, "utf8");
const chatSource = readFileSync("packages/stage-copilot/src/sources-context-chat.ts", "utf8");
const contextSource = readFileSync("packages/stage-copilot/src/sources-context-context.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-sources-context-chat-pilot.mjs", "utf8");

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

function assertDoesNotMatch(source, pattern, label) {
  assert.equal(pattern.test(source), false, label);
}

function assertNoActionExecutionFields(response) {
  const forbiddenFields = [
    "actions",
    "toolCalls",
    "tool_calls",
    "routedActions",
    "executedActions",
    "mutations",
    "writes",
    "recordsChanged",
    "sourceChanges",
    "contextChanges",
    "readinessChanged",
    "packageEligibilityChanged",
  ];
  for (const field of forbiddenFields) {
    assert.equal(Object.hasOwn(response, field), false, `response must not contain ${field}`);
  }
}

assert.ok(routeSource.length > 0, "Sources / Context chat route exists");
assert.match(routeSource, /export async function POST/, "Sources / Context chat route exposes POST");
assert.match(routeSource, /buildSourcesContextCopilotProviderPrompt/, "route assembles provider prompt through Stage Copilot helper");
assert.match(routeSource, /createSourcesContextCopilotProviderResponse/, "route creates provider-backed response through Stage Copilot helper");
assert.match(routeSource, /createSourcesContextCopilotFallbackResponse/, "route creates fallback response through Stage Copilot helper");
assert.match(routeSource, /getDefaultStageCopilotSystemPrompt\("sources_context"\)/, "route references Sources / Context Instructions default");
assert.match(routeSource, /findCurrentByStage\("sources_context"\)/, "route reads current Sources / Context Instructions when present");
assert.match(routeSource, /providerRegistry\.getPromptTextProvider\("openai"\)/, "route uses existing OpenAI text provider path");
assert.match(routeSource, /provider\.runPromptText\(\{ compiledPrompt \}\)/, "route calls existing text provider without tools");
assert.match(routeSource, /caseId/, "route accepts future caseId field without loading live records");

const defaultPrompt = getDefaultStageCopilotSystemPrompt("sources_context");
assert.ok(defaultPrompt, "Sources / Context default instructions exist");

const normalQuestion = "Explain what Pass 2 Sources / Context can and cannot prove.";
const response = createSourcesContextCopilotChatResponse({
  message: normalQuestion,
  history: [
    { role: "user", content: "Can source claims prove workflow truth?" },
    { role: "assistant", content: "No, they are context signals." },
  ],
  caseId: "case-static-proof",
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
});

assert.equal(response.ok, true, "POST-equivalent normal question returns ok JSON");
assert.equal(response.stageKey, "sources_context");
assert.equal(typeof response.answer, "string", "response answer is text");
assert.ok(response.answer.length > 160, "response text is substantive");
assert.equal(response.providerStatus, "deterministic_fallback", "provider unavailable path returns deterministic fallback");
assert.match(response.answer, /Provider-backed chat is not configured/i, "fallback is explicit and does not pretend to be AI provider output");
assert.match(response.answer, /no-tool, no-action conversational assistant/i, "answer states no tools/no actions");
assert.match(response.answer, /cannot register or update sources/i, "answer states no source registration/update");
assert.match(response.answer, /run OCR/i, "answer states it cannot run OCR");
assert.match(response.answer, /run STT/i, "answer states it cannot run STT");
assert.match(response.answer, /crawl websites/i, "answer states it cannot crawl websites");
assert.match(response.answer, /provider extraction/i, "answer states it cannot run provider extraction");
assert.match(response.answer, /create structured context/i, "answer states it cannot create structured context");
assert.match(response.answer, /confirm final pre-hierarchy review/i, "answer states it cannot confirm review");
assert.match(response.answer, /start hierarchy/i, "answer states it cannot start hierarchy");
assert.match(response.answer, /source claims.*signals/i, "answer states source claims are signals");
assert.match(response.answer, /not confirmed workflow truth/i, "answer states source context is not workflow truth");
assert.doesNotMatch(response.answer, /\b(I|we) (registered|updated|saved|approved|confirmed|ran|executed|crawled|extracted|created|started|generated|mutated)\b/i, "response does not claim source/action changes");
assert.equal(typeof response.model, "string");
assert.equal(response.contextSummary.source, "sources_context_static_context");
assert.equal(response.contextSummary.readOnly, true);
assert.equal(response.contextSummary.stageKey, "sources_context");
assert.equal(response.contextSummary.liveSourceSummaryIncluded, false);
assert.equal(response.contextSummary.instructionSource, "static_default");
assert.equal(response.contextSummary.instructionVersion, 1);
assertNoActionExecutionFields(response);

const providerPrompt = buildSourcesContextCopilotProviderPrompt({
  message: normalQuestion,
  history: [
    { role: "user", content: "What does Pass 2 control?" },
    { role: "assistant", content: "It controls intake/context framing only." },
  ],
  caseId: "case-static-proof",
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
});
assert.match(providerPrompt, /No tools\./, "provider prompt includes no-tools boundary");
assert.match(providerPrompt, /No actions\./, "provider prompt includes no-actions boundary");
assert.match(providerPrompt, /No record mutation\./, "provider prompt includes no-record-mutation boundary");
assert.match(providerPrompt, /Do not register or update sources/, "provider prompt forbids source mutation");
assert.match(providerPrompt, /Do not run OCR, STT, website crawl, provider extraction/, "provider prompt forbids source processing execution");
assert.match(providerPrompt, /Do not create structured context/, "provider prompt forbids structured context creation");
assert.match(providerPrompt, /Do not confirm final pre-hierarchy review/, "provider prompt forbids review confirmation");
assert.match(providerPrompt, /source claims.*context signals/i, "provider prompt includes source signal boundary");
assert.match(providerPrompt, /Source registration|source registration/, "provider prompt includes source registration concept");
assert.match(providerPrompt, /source-role\/source-scope suggestions/, "provider prompt includes source role/scope suggestions");
assert.match(providerPrompt, /structured context/, "provider prompt includes structured context concept");
assert.match(providerPrompt, /handoff to hierarchy|Handoff/i, "provider prompt includes hierarchy handoff");
assert.match(providerPrompt, /case-static-proof/, "provider prompt preserves caseId only as future scope");

const providerResponse = createSourcesContextCopilotProviderResponse({
  message: normalQuestion,
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
}, {
  text: "Pass 2 Sources / Context can discuss source registration, source trust, OCR/STT/crawl concepts, structured context, and the handoff to hierarchy. Source claims are signals, not workflow truth, and I did not change any records.",
  provider: "openai",
  model: "gpt-proof",
  usage: {
    inputTokens: 90,
    outputTokens: 45,
    totalTokens: 135,
  },
});
assert.equal(providerResponse.providerStatus, "provider_success", "provider-backed success path returns provider_success");
assert.equal(providerResponse.model, "gpt-proof", "provider-backed response preserves model name");
assert.deepEqual(providerResponse.tokenUsage, {
  inputTokens: 90,
  outputTokens: 45,
  totalTokens: 135,
  raw: {
    inputTokens: 90,
    outputTokens: 45,
    totalTokens: 135,
  },
}, "provider-backed response passes through provider token usage");
assert.equal(providerResponse.tokenUsageUnavailable, false, "provider-backed response marks token usage available when provider returns usage");
assertNoActionExecutionFields(providerResponse);
assert.throws(
  () => createSourcesContextCopilotProviderResponse({
    message: normalQuestion,
    systemInstructions: defaultPrompt.systemPrompt,
    instructionSource: "static_default",
    instructionVersion: 1,
  }, {
    text: "I registered a source and confirmed the final pre-hierarchy review.",
    provider: "openai",
    model: "gpt-proof",
  }),
  /claimed action execution/,
  "provider response claiming source/action execution is rejected",
);

const notConfiguredFallback = createSourcesContextCopilotFallbackResponse({
  message: normalQuestion,
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
}, "provider_not_configured");
assert.equal(notConfiguredFallback.providerStatus, "provider_not_configured", "provider unavailable path returns provider_not_configured fallback");
assert.equal(notConfiguredFallback.tokenUsage, null, "provider unavailable fallback reports null token usage");
assert.equal(notConfiguredFallback.tokenUsageUnavailable, true, "provider unavailable fallback marks token usage unavailable");
assert.match(notConfiguredFallback.answer, /deterministic fallback response/i, "provider unavailable fallback is explicit");
assertNoActionExecutionFields(notConfiguredFallback);

const unsafeQuestionResponse = createSourcesContextCopilotChatResponse({
  message: "Register this PDF as approved and run OCR, then create structured context and start hierarchy.",
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
});
assert.match(unsafeQuestionResponse.answer, /I cannot do that from chat/i, "unsafe action request is refused as chat-only");
assert.match(unsafeQuestionResponse.answer, /register, update, approve, confirm, crawl, run OCR\/STT, extract, create structured context, start hierarchy/i, "unsafe request refusal names forbidden Pass 2 actions");
assertNoActionExecutionFields(unsafeQuestionResponse);

const envelope = createSourcesContextCopilotContextEnvelope();
assert.equal(envelope.stageKey, "sources_context", "static Sources / Context context is used");
assert.equal(envelope.boundaryStatus.readOnly, true);
assert.equal(envelope.boundaryStatus.writesAllowed, false);
assert.equal(envelope.boundaryStatus.providerExecutionAllowed, false);
assert.equal(envelope.boundaryStatus.retrievalExecutionAllowed, false);
assert.equal(envelope.boundaryStatus.databaseExecutionAllowed, false);
assert.equal(envelope.boundaryStatus.officialAnalysisRerunAllowed, false);
assert.equal(envelope.boundaryStatus.sourceOfTruthMutationAllowed, false);

const routeAndPackageImports = [
  importAndExportLines(routeSource),
  importAndExportLines(chatSource),
  importAndExportLines(contextSource),
  importAndExportLines(indexSource),
  importAndExportLines(proofSource),
].join("\n");

const forbiddenImportPatterns = [
  /@workflow\/prompts/,
  /@workflow\/sources-context/,
  /@workflow\/hierarchy-intake/,
  /@workflow\/targeting-rollout/,
  /@workflow\/participant-sessions/,
  /@workflow\/synthesis-evaluation/,
  /@workflow\/packages-output/,
  /compilePass5Prompt/,
  /compilePass6PromptSpec/,
  /compileStructuredPromptSpec/,
  /runPass6PromptWorkspaceTest/,
  /retrieval/i,
  /rag/i,
  /vector/i,
];

for (const pattern of forbiddenImportPatterns) {
  assertDoesNotMatch(routeAndPackageImports, pattern, `Sources / Context chat pilot must not import ${pattern}`);
}

assertDoesNotMatch(routeSource, /store\.stageCopilotSystemPrompts\.save/, "route must not write Stage Copilot Instructions");
assertDoesNotMatch(routeSource, /store\.structuredPromptSpecs/, "route must not access Structured PromptSpec repository");
assertDoesNotMatch(routeSource, /store\.pass6PromptSpecs/, "route must not access Pass 6 PromptSpec repository");
assertDoesNotMatch(routeSource, /store\.sources|store\.intake|store\.context/i, "route must not access source/context live repositories in this slice");
assertDoesNotMatch(routeSource, /\.save\(/, "route must not save records");
assertDoesNotMatch(routeSource, /\.update\(/, "route must not update records");
assertDoesNotMatch(routeSource, /registerIntakeSource|createStructuredContext|confirmFinalPreHierarchyReview|approveCrawl|runOcr|runStt|crawl/i, "route must not invoke source-processing operations");
assertDoesNotMatch(routeSource, /NextResponse\.redirect/, "route must not redirect to actions");
assertDoesNotMatch(routeSource, /actionKey|requiresAdminConfirmation|executesAutomatically|routed/i, "route must not implement routed actions");
assertDoesNotMatch(chatSource, /toolCalls|tool_calls|executedActions|actionKey|requiresAdminConfirmation|executesAutomatically|writePolicy/, "chat helper must not expose tool/action execution fields");
assertDoesNotMatch(routeSource, /tools\s*:/, "route must not send provider tools");

console.log("Stage Copilot Sources / Context chat pilot proof passed.");
console.log(JSON.stringify({
  validatedCases: [
    "sources_context_chat_route_exists",
    "post_equivalent_normal_question_returns_json",
    "response_is_text_only",
    "response_has_no_action_execution_fields",
    "response_does_not_claim_source_or_record_changes",
    "provider_backed_success_response_is_text_only",
    "provider_response_claiming_action_execution_is_rejected",
    "provider_unavailable_path_returns_deterministic_fallback",
    "static_sources_context_context_is_used",
    "sources_context_instructions_are_used",
    "unsafe_pass2_action_request_refused_as_chat_only",
    "live_source_summary_not_included",
  ],
  nonInterference: [
    "no_workflow_prompts_import",
    "no_sources_context_package_import",
    "no_prompt_compilation_import",
    "no_prompt_test_import",
    "existing_openai_prompt_text_provider_path_used",
    "no_provider_tools",
    "no_stage_copilot_instruction_writes",
    "no_promptspec_repository_access",
    "no_live_source_repository_access",
    "no_source_processing_execution",
    "no_pass5_pass6_runtime_imports",
    "no_retrieval_rag_vector_imports",
    "no_runtime_action_route_or_execution",
  ],
}, null, 2));
