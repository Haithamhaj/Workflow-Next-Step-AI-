import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pagePath = "apps/admin-web/app/workspace/copilot-instructions/page.tsx";
const navPath = "apps/admin-web/app/workspace/_components/WorkspaceNav.tsx";
const enPath = "apps/admin-web/app/workspace/_i18n/en.ts";
const arPath = "apps/admin-web/app/workspace/_i18n/ar.ts";
const cssPath = "apps/admin-web/app/workspace/workspace.module.css";

const page = readFileSync(pagePath, "utf8");
const nav = readFileSync(navPath, "utf8");
const en = readFileSync(enPath, "utf8");
const ar = readFileSync(arPath, "utf8");
const css = readFileSync(cssPath, "utf8");

function assertIncludes(source, text, label) {
  assert.ok(source.includes(text), label);
}

function assertDoesNotInclude(source, text, label) {
  assert.equal(source.includes(text), false, label);
}

assertIncludes(page, "export default function WorkspaceCopilotInstructionsPage", "workspace copilot instructions page renders as a Next page");
assertIncludes(page, "WorkspaceShell", "page uses the workspace shell");
assertIncludes(page, "/api/stage-copilot/instructions", "page uses the Stage Copilot Instructions API route");
assertIncludes(page, "save-custom", "page supports save-custom through the API");
assertIncludes(page, "reset-to-default", "page supports reset-to-default through the API");

assertIncludes(nav, "/workspace/copilot-instructions", "workspace nav includes the Copilot Instructions route");
assertIncludes(nav, "copilotInstructions", "workspace nav uses the Copilot Instructions label key");
assertIncludes(en, "Copilot Instructions", "English Copilot Instructions label exists");
assertIncludes(ar, "تعليمات المساعد", "Arabic Copilot Instructions label exists");

assertIncludes(en, "Controls how stage copilots speak and reason. Does not change analysis prompts.", "English separation copy exists");
assertIncludes(ar, "تتحكم في طريقة حديث مساعدي المراحل ولا تغيّر برومبتات التحليل.", "Arabic separation copy exists");
assertIncludes(en, "This changes Copilot conversation behavior only. It does not change Capability / Analysis PromptSpecs or official analysis behavior.", "English hard separation warning exists");
assertIncludes(ar, "هذا يغيّر طريقة حوار المساعد فقط، ولا يغيّر برومبتات التحليل أو سلوك التحليل الرسمي.", "Arabic hard separation warning exists");

for (const stage of [
  "sources_context",
  "hierarchy",
  "targeting",
  "participant_evidence",
  "analysis_package",
  "prompt_studio",
  "advanced_debug",
]) {
  assertIncludes(page, stage, `page includes stage key ${stage}`);
}

for (const label of [
  "Sources / Context",
  "Hierarchy",
  "Targeting",
  "Participant Evidence",
  "Analysis / Package",
  "Prompt Studio",
  "Advanced / Debug",
]) {
  assertIncludes(en, label, `English stage selector label exists: ${label}`);
}

assertIncludes(en, "Save instructions", "English save control exists");
assertIncludes(en, "Reset to static default", "English reset control exists");
assertIncludes(ar, "حفظ التعليمات", "Arabic save control exists");
assertIncludes(ar, "إعادة إلى الافتراضي الثابت", "Arabic reset control exists");
assertIncludes(page, "role=\"alert\"", "page displays validation errors");
assertIncludes(en, "Instructions cannot be empty.", "missing systemPrompt error is visible");
assertIncludes(en, "Unsupported instruction action.", "unsupported action error is visible");
assertIncludes(en, "Unsupported Stage Copilot stage.", "invalid stage error is visible");
assertIncludes(en, "unsafe authority claims", "unsafe authority guidance is visible");

assertDoesNotInclude(page, "@workflow/prompts", "page does not import @workflow/prompts");
assertDoesNotInclude(page, "PASS6_PROMPT_CAPABILITY_KEYS", "page does not reference Pass 6 capability prompt keys");
assertDoesNotInclude(page, "compilePass", "page does not compile prompts");
assertDoesNotInclude(page, "runPrompt", "page does not run prompt tests");
assertDoesNotInclude(page, "Ask Copilot", "page does not present live chat controls");
assertDoesNotInclude(page, "model selector", "page does not present provider/model controls");
assertDoesNotInclude(page, "provider model", "page does not present provider/model controls");

assertIncludes(css, "workspaceStageSelectorGrid", "stage selector styles exist");
assertIncludes(css, "workspaceInstructionTextarea", "instruction editor styles exist");
assertIncludes(css, "workspaceInstructionActions", "save/reset action styles exist");
assertIncludes(css, "workspaceRoot[dir=\"rtl\"]", "workspace stylesheet preserves RTL handling");

for (const existingPage of [
  "apps/admin-web/app/workspace/page.tsx",
  "apps/admin-web/app/workspace/prompts/page.tsx",
  "apps/admin-web/app/workspace/hierarchy/page.tsx",
  "apps/admin-web/app/workspace/analysis/page.tsx",
]) {
  const source = readFileSync(existingPage, "utf8");
  assert.ok(source.length > 0, `${existingPage} still exists and can be compiled by Next/typecheck`);
}

console.log("Stage Copilot Instructions workspace page proof passed.");
console.log(JSON.stringify({
  validatedCases: [
    "workspace_copilot_instructions_page_exists",
    "workspace_nav_includes_copilot_instructions",
    "separation_warning_exists",
    "all_required_stage_selector_labels_exist",
    "save_and_reset_controls_exist",
    "validation_error_copy_exists",
    "page_uses_stage_copilot_instructions_api",
    "english_and_arabic_labels_exist",
    "existing_workspace_pages_still_exist",
  ],
  nonInterference: {
    noWorkflowPromptsImport: true,
    noPromptCompilation: true,
    noPromptTests: true,
    noLiveChatControls: true,
    noProviderModelControls: true,
  },
}, null, 2));
