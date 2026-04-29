import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const pagePath = "apps/admin-web/app/workspace/prompt-studio-copilot/page.tsx";
const navPath = "apps/admin-web/app/workspace/_components/WorkspaceNav.tsx";
const enPath = "apps/admin-web/app/workspace/_i18n/en.ts";
const arPath = "apps/admin-web/app/workspace/_i18n/ar.ts";
const cssPath = "apps/admin-web/app/workspace/workspace.module.css";
const chatApiProofPath = "scripts/prove-stage-copilot-prompt-studio-chat-pilot.mjs";

const pageSource = readFileSync(pagePath, "utf8");
const navSource = readFileSync(navPath, "utf8");
const enSource = readFileSync(enPath, "utf8");
const arSource = readFileSync(arPath, "utf8");
const cssSource = readFileSync(cssPath, "utf8");

function assertDoesNotMatch(source, pattern, label) {
  assert.equal(pattern.test(source), false, label);
}

function assertFileExists(path, label) {
  assert.equal(existsSync(path), true, label);
}

assertFileExists(pagePath, "/workspace/prompt-studio-copilot page exists");
assert.match(pageSource, /export default function PromptStudioCopilotPage/, "page renders through a default component");
assert.match(pageSource, /WorkspaceShell/, "page uses workspace shell");
assert.match(pageSource, /Prompt Studio Copilot|promptStudioCopilot/, "page includes Prompt Studio Copilot label");
assert.match(pageSource, /textarea/, "page includes message input textarea");
assert.match(pageSource, /No tools\. No actions\. Advisory conversation only\.|boundaryCopy/, "page includes no tools/no actions/advisory boundary copy");
assert.match(pageSource, /does not change analysis prompts|separationCopy/, "page includes analysis prompt separation copy");
assert.match(pageSource, /\/api\/stage-copilot\/prompt-studio\/chat/, "page references Prompt Studio Copilot chat API");
assert.match(pageSource, /providerStatus/, "page displays provider status area");
assert.match(pageSource, /model/, "page displays model returned by API");
assert.match(pageSource, /contextSummary/, "page displays context source summary");
assert.match(pageSource, /fallbackNotice/, "page shows fallback notice for non-success provider statuses");
assert.match(pageSource, /setHistory/, "page keeps local in-page message history");

assert.match(navSource, /promptStudioCopilot/, "workspace nav includes Prompt Studio Copilot item");
assert.match(navSource, /\/workspace\/prompt-studio-copilot/, "workspace nav links to Prompt Studio Copilot page");
assert.match(enSource, /Prompt Studio Copilot/, "English Prompt Studio Copilot label exists");
assert.match(arSource, /مساعد البرومبتات/, "Arabic Prompt Studio Copilot label exists");
assert.match(enSource, /No tools\. No actions\. Advisory conversation only\./, "English boundary copy exists");
assert.match(arSource, /لا أدوات\. لا تنفيذ إجراءات\. محادثة استشارية فقط\./, "Arabic boundary copy exists");
assert.match(enSource, /This Copilot can discuss Prompt Studio and instructions, but it does not change analysis prompts\./, "English separation copy exists");
assert.match(arSource, /هذا المساعد يناقش البرومبتات والتعليمات، لكنه لا يغيّر برومبتات التحليل\./, "Arabic separation copy exists");

assert.match(cssSource, /workspaceChatTranscript/, "workspace chat transcript style exists");
assert.match(cssSource, /workspaceChatTextarea/, "workspace chat textarea style exists");

const pageAndNavSource = [pageSource, navSource].join("\n");
assertDoesNotMatch(pageAndNavSource, /@workflow\/prompts/, "UI must not import @workflow/prompts");
assertDoesNotMatch(pageSource, /compilePrompt|compilePass|runPromptTest|runPass6PromptWorkspaceTest/, "UI must not compile prompts or run prompt tests");
assertDoesNotMatch(pageSource, /providerRegistry|getPromptTextProvider|OPENAI_API_KEY/, "UI must not expose provider internals");
assertDoesNotMatch(pageSource, /<select|providerName|modelName|modelSelector|providerSelector/i, "UI must not include provider/model selector");
assertDoesNotMatch(pageSource, /applyFromCopilot|saveFromCopilot|apply suggestion|save prompt from/i, "UI must not include apply/save-from-Copilot controls");
assertDoesNotMatch(pageSource, /routedAction|actionKey|requiresAdminConfirmation|executesAutomatically/i, "UI must not implement routed actions");
assertDoesNotMatch(pageSource, /localStorage|sessionStorage|indexedDB/, "UI must not persist conversation");
assertDoesNotMatch(pageSource, /\/api\/prompts|\/api\/pass6\/prompts|\/api\/participant-sessions/, "UI must not call prompt or analysis APIs");
assertDoesNotMatch(pageSource, /retrieval|rag|vector/i, "UI must not add retrieval/RAG/vector behavior");

const requiredWorkspacePages = [
  "apps/admin-web/app/workspace/page.tsx",
  "apps/admin-web/app/workspace/copilot-instructions/page.tsx",
  "apps/admin-web/app/workspace/prompts/page.tsx",
  "apps/admin-web/app/workspace/hierarchy/page.tsx",
  "apps/admin-web/app/workspace/analysis/page.tsx",
];
for (const path of requiredWorkspacePages) {
  assertFileExists(path, `${path} still exists`);
}

assertFileExists(chatApiProofPath, "existing Prompt Studio Copilot chat API proof exists");

console.log("Stage Copilot Prompt Studio Copilot UI proof passed.");
console.log(JSON.stringify({
  validatedCases: [
    "workspace_prompt_studio_copilot_page_exists",
    "page_uses_workspace_shell",
    "page_includes_prompt_studio_copilot_label",
    "page_includes_message_input",
    "page_includes_no_tools_no_actions_boundary",
    "page_includes_analysis_prompt_separation_copy",
    "page_references_prompt_studio_chat_api",
    "page_displays_provider_status_model_and_context_summary",
    "page_shows_fallback_notice",
    "page_uses_local_component_history_only",
    "workspace_nav_includes_prompt_studio_copilot",
    "english_arabic_labels_exist",
    "existing_workspace_pages_still_exist",
    "existing_prompt_studio_chat_api_proof_exists",
  ],
  nonInterference: [
    "no_workflow_prompts_import",
    "no_prompt_compilation_or_prompt_tests",
    "no_provider_model_selector",
    "no_apply_or_save_from_copilot_controls",
    "no_routed_actions",
    "no_conversation_persistence",
    "no_prompt_or_analysis_api_calls",
    "no_retrieval_rag_vector_behavior",
  ],
}, null, 2));
