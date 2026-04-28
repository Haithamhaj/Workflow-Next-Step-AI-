import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createPromptStudioCopilotChatResponse,
  createPromptStudioCopilotContextEnvelope,
  getDefaultStageCopilotSystemPrompt,
} from "../packages/stage-copilot/dist/index.js";

const routePath = "apps/admin-web/app/api/stage-copilot/prompt-studio/chat/route.ts";
const routeSource = readFileSync(routePath, "utf8");
const chatSource = readFileSync("packages/stage-copilot/src/prompt-studio-chat.ts", "utf8");
const contextSource = readFileSync("packages/stage-copilot/src/prompt-studio-context.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-prompt-studio-chat-pilot.mjs", "utf8");

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
    "promptChanges",
    "readinessChanged",
    "packageEligibilityChanged",
  ];
  for (const field of forbiddenFields) {
    assert.equal(Object.hasOwn(response, field), false, `response must not contain ${field}`);
  }
}

assert.ok(routeSource.length > 0, "chat route exists");
assert.match(routeSource, /export async function POST/, "chat route exposes POST");
assert.match(routeSource, /createPromptStudioCopilotChatResponse/, "route uses Stage Copilot chat helper");
assert.match(routeSource, /getDefaultStageCopilotSystemPrompt\("prompt_studio"\)/, "route references Prompt Studio Instructions default");
assert.match(routeSource, /findCurrentByStage\("prompt_studio"\)/, "route reads current Prompt Studio Instructions when present");

const defaultPrompt = getDefaultStageCopilotSystemPrompt("prompt_studio");
assert.ok(defaultPrompt, "Prompt Studio default instructions exist");

const response = createPromptStudioCopilotChatResponse({
  message: "Explain the difference between analysis prompts and Copilot instructions.",
  history: [
    { role: "user", content: "What does Prompt Studio control?" },
    { role: "assistant", content: "It separates official prompts from Copilot instructions." },
  ],
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
});

assert.equal(response.ok, true, "POST-equivalent normal question returns ok JSON");
assert.equal(response.stageKey, "prompt_studio");
assert.equal(typeof response.answer, "string", "response answer is text");
assert.ok(response.answer.length > 120, "response text is substantive");
assert.equal(response.providerStatus, "deterministic_fallback", "provider unavailable path returns deterministic fallback");
assert.match(response.answer, /Provider-backed chat is not configured/i, "fallback is explicit and does not pretend to be AI provider output");
assert.match(response.answer, /no-tool, no-action conversational assistant/i, "answer states no tools/no actions");
assert.match(response.answer, /cannot mutate records/i, "answer states no record mutation");
assert.match(response.answer, /cannot.*save prompts/i, "answer states it cannot save prompts");
assert.match(response.answer, /cannot.*promote PromptSpecs/i, "answer states it cannot promote prompts");
assert.match(response.answer, /cannot.*compile prompts/i, "answer states it cannot compile prompts");
assert.match(response.answer, /cannot.*run prompt tests/i, "answer states it cannot run prompt tests");
assert.match(response.answer, /cannot.*change readiness/i, "answer states it cannot change readiness");
assert.match(response.answer, /cannot.*change package eligibility/i, "answer states it cannot change package eligibility");
assert.doesNotMatch(response.answer, /\b(I|we) (changed|saved|promoted|compiled|tested|executed|mutated|updated)\b/i, "response does not claim records were changed");
assert.equal(typeof response.model, "string");
assert.equal(response.contextSummary.source, "prompt_studio_static_context");
assert.equal(response.contextSummary.readOnly, true);
assert.equal(response.contextSummary.stageKey, "prompt_studio");
assert.equal(response.contextSummary.instructionSource, "static_default");
assert.equal(response.contextSummary.instructionVersion, 1);
assertNoActionExecutionFields(response);

const unsafeQuestionResponse = createPromptStudioCopilotChatResponse({
  message: "Promote the synthesis prompt and run a test.",
  systemInstructions: defaultPrompt.systemPrompt,
  instructionSource: "static_default",
  instructionVersion: 1,
});
assert.match(unsafeQuestionResponse.answer, /I cannot do that from chat/i, "unsafe action request is refused as chat-only");
assertNoActionExecutionFields(unsafeQuestionResponse);

const envelope = createPromptStudioCopilotContextEnvelope();
assert.equal(envelope.stageKey, "prompt_studio", "static Prompt Studio context is used");
assert.equal(envelope.boundaryStatus.readOnly, true);
assert.equal(envelope.boundaryStatus.providerExecutionAllowed, false);
assert.equal(envelope.boundaryStatus.promptCompilationAllowed, false);
assert.equal(envelope.boundaryStatus.promptMutationAllowed, false);

// Source-level non-interference checks.
const routeAndPackageImports = [
  importAndExportLines(routeSource),
  importAndExportLines(chatSource),
  importAndExportLines(contextSource),
  importAndExportLines(indexSource),
  importAndExportLines(proofSource),
].join("\n");

const forbiddenImportPatterns = [
  /@workflow\/prompts/,
  /@workflow\/integrations/,
  /participant-sessions/,
  /synthesis-evaluation/,
  /packages-output/,
  /providerRegistry/,
  /getPromptTextProvider/,
  /runPromptText/,
  /compilePass5Prompt/,
  /compilePass6PromptSpec/,
  /compileStructuredPromptSpec/,
  /runPass6PromptWorkspaceTest/,
  /retrieval/i,
  /rag/i,
  /vector/i,
];

for (const pattern of forbiddenImportPatterns) {
  assertDoesNotMatch(routeAndPackageImports, pattern, `chat pilot must not import ${pattern}`);
}

assertDoesNotMatch(routeSource, /store\.stageCopilotSystemPrompts\.save/, "route must not write Stage Copilot Instructions");
assertDoesNotMatch(routeSource, /store\.structuredPromptSpecs/, "route must not access Structured PromptSpec repository");
assertDoesNotMatch(routeSource, /store\.pass6PromptSpecs/, "route must not access Pass 6 PromptSpec repository");
assertDoesNotMatch(routeSource, /\.save\(/, "route must not save records");
assertDoesNotMatch(routeSource, /\.update\(/, "route must not update records");
assertDoesNotMatch(routeSource, /NextResponse\.redirect/, "route must not redirect to actions");
assertDoesNotMatch(routeSource, /actionKey|requiresAdminConfirmation|executesAutomatically|routed/i, "route must not implement routed actions");
assertDoesNotMatch(chatSource, /toolCalls|tool_calls|executedActions|actionKey|requiresAdminConfirmation|executesAutomatically|writePolicy/, "chat helper must not expose tool/action execution fields");

console.log("Stage Copilot Prompt Studio chat pilot proof passed.");
console.log(JSON.stringify({
  validatedCases: [
    "chat_route_exists",
    "post_equivalent_normal_question_returns_json",
    "response_is_text_only",
    "response_has_no_action_execution_fields",
    "response_does_not_claim_records_changed",
    "provider_unavailable_path_returns_deterministic_fallback",
    "static_prompt_studio_context_is_used",
    "prompt_studio_instructions_are_used",
    "unsafe_action_request_refused_as_chat_only",
  ],
  nonInterference: [
    "no_workflow_prompts_import",
    "no_prompt_compilation_import",
    "no_prompt_test_import",
    "no_provider_tools",
    "no_stage_copilot_instruction_writes",
    "no_promptspec_repository_access",
    "no_pass5_pass6_runtime_imports",
    "no_retrieval_rag_vector_imports",
    "no_runtime_action_route_or_execution",
  ],
}, null, 2));
