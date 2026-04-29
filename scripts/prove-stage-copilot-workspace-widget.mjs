import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const panelPath = "apps/admin-web/app/workspace/_components/StageCopilotChatPanel.tsx";
const widgetPath = "apps/admin-web/app/workspace/_components/WorkspaceStageCopilotWidget.tsx";
const shellPath = "apps/admin-web/app/workspace/_components/WorkspaceShell.tsx";
const enPath = "apps/admin-web/app/workspace/_i18n/en.ts";
const arPath = "apps/admin-web/app/workspace/_i18n/ar.ts";
const cssPath = "apps/admin-web/app/workspace/workspace.module.css";

const panelSource = readFileSync(panelPath, "utf8");
const widgetSource = readFileSync(widgetPath, "utf8");
const shellSource = readFileSync(shellPath, "utf8");
const enSource = readFileSync(enPath, "utf8");
const arSource = readFileSync(arPath, "utf8");
const cssSource = readFileSync(cssPath, "utf8");

function assertFileExists(path, label) {
  assert.equal(existsSync(path), true, label);
}

function assertDoesNotMatch(source, pattern, label) {
  assert.equal(pattern.test(source), false, label);
}

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

assertFileExists(panelPath, "shared StageCopilotChatPanel source exists");
assertFileExists(widgetPath, "WorkspaceStageCopilotWidget source exists");
assert.match(panelSource, /export function StageCopilotChatPanel/, "shared component exports StageCopilotChatPanel");
assert.match(widgetSource, /export function WorkspaceStageCopilotWidget/, "widget exports WorkspaceStageCopilotWidget");
assert.match(shellSource, /WorkspaceStageCopilotWidget/, "workspace shell mounts widget broadly");

assert.match(widgetSource, /prompt_studio/, "widget supports prompt_studio");
assert.match(widgetSource, /sources_context/, "widget supports sources_context");
assert.match(widgetSource, /\/api\/stage-copilot\/prompt-studio\/chat/, "widget maps prompt_studio to Prompt Studio endpoint");
assert.match(widgetSource, /\/api\/stage-copilot\/sources-context\/chat/, "widget maps sources_context to Sources / Context endpoint");
assert.match(widgetSource, /stageCopilotWidgetTriggerMark/, "widget trigger uses a short circular mark");
assert.match(widgetSource, /aria-label=\{\`\$\{copy\.title\} - \$\{activeStage\.label\}`\}/, "widget trigger accessible label includes active stage");
assert.match(widgetSource, /title=\{\`\$\{copy\.title\} - \$\{activeStage\.label\}`\}/, "widget trigger title includes active stage");
assert.match(widgetSource, /stageCopilotWidgetClose/, "open panel close control exists");
assert.match(widgetSource, /<select/, "widget has manual stage override selector");
assert.match(widgetSource, /usePathname/, "widget uses route/path for current-stage detection");
assert.match(widgetSource, /\/workspace\/sources/, "widget detects Sources workspace route");
assert.match(widgetSource, /\/workspace\/prompts/, "widget detects Prompt Studio workspace route");
assert.match(widgetSource, /\/workspace\/copilot-instructions/, "widget detects Copilot Instructions workspace route");
assert.match(widgetSource, /\/workspace\/prompt-studio-copilot/, "widget detects Prompt Studio Copilot route");

assert.match(panelSource, /fetch\(endpoint/, "shared panel posts to provided endpoint");
assert.match(panelSource, /setHistory/, "shared panel keeps local component history");
assert.match(panelSource, /providerStatus/, "shared panel displays provider status");
assert.match(panelSource, /model/, "shared panel displays model");
assert.match(panelSource, /contextSummary/, "shared panel displays context summary");
assert.match(panelSource, /fallbackNotice/, "shared panel displays fallback notice");
assert.match(panelSource, /initialMessages/, "shared panel accepts optional initial messages");
assert.match(panelSource, /onProviderStatusChange/, "shared panel accepts provider status callback");
assert.match(panelSource, /stageCopilotBoundaryNote/, "shared panel keeps boundary copy without a duplicate stage header");
assert.doesNotMatch(panelSource, /stageCopilotPanelHeader/, "open panel must not render a second stage header");
assert.match(panelSource, /stageCopilotFormFooter/, "composer has intentional send button placement");

assert.match(enSource, /Stage Copilot/, "English Stage Copilot label exists");
assert.match(enSource, /Prompt Studio/, "English Prompt Studio label exists");
assert.match(enSource, /Sources \/ Context/, "English Sources / Context label exists");
assert.match(enSource, /No tools\. No actions\. Advisory conversation only\./, "English no-tools/no-actions boundary exists");
assert.match(enSource, /Ask about this stage\.\.\./, "English ask-about-stage copy exists");
assert.match(enSource, /Provider status/, "English provider status label exists");
assert.match(enSource, /Context/, "English context label exists");
assert.match(enSource, /Fallback response/, "English fallback response label exists");

assert.match(arSource, /مساعد المرحلة/, "Arabic Stage Copilot label exists");
assert.match(arSource, /استوديو البرومبتات/, "Arabic Prompt Studio label exists");
assert.match(arSource, /المصادر والسياق/, "Arabic Sources / Context label exists");
assert.match(arSource, /لا أدوات\. لا تنفيذ إجراءات\. محادثة استشارية فقط\./, "Arabic no-tools/no-actions boundary exists");
assert.match(arSource, /اسأل عن هذه المرحلة\.\.\./, "Arabic ask-about-stage copy exists");
assert.match(arSource, /حالة المزوّد/, "Arabic provider status label exists");
assert.match(arSource, /السياق/, "Arabic context label exists");
assert.match(arSource, /رد احتياطي/, "Arabic fallback response label exists");

assert.match(cssSource, /stageCopilotWidget/, "widget CSS exists");
assert.match(cssSource, /stageCopilotPanel/, "chat panel CSS exists");
assert.match(cssSource, /\.stageCopilotWidget\s*\{[^}]*position:\s*fixed/s, "widget uses fixed positioning");
assert.match(cssSource, /\.stageCopilotWidget\s*\{[^}]*left:\s*22px/s, "LTR/default widget placement uses physical left alignment");
assert.match(cssSource, /\.workspaceRoot\[dir="rtl"\]\s+\.stageCopilotWidget\s*\{[^}]*left:\s*auto[^}]*right:\s*22px/s, "RTL widget placement uses physical right alignment");
assert.match(cssSource, /\.stageCopilotWidgetTrigger\s*\{[^}]*width:\s*58px[^}]*height:\s*58px[^}]*border-radius:\s*999px/s, "closed trigger is circular and compact");
assert.match(cssSource, /\.stageCopilotWidgetTriggerMark\s*\{[^}]*width:\s*40px[^}]*height:\s*40px[^}]*border-radius:\s*50%/s, "closed trigger uses icon-only circular mark");
assert.match(cssSource, /\.stageCopilotWidgetPanel\s*\{[^}]*position:\s*fixed[^}]*width:\s*min\(420px, calc\(100vw - 24px\)\)[^}]*max-height:\s*min\(680px, calc\(100vh - 124px\)\)[^}]*overflow:\s*auto/s, "panel is fixed, viewport-bounded, and internally scrollable");
assert.match(cssSource, /\.stageCopilotWidgetPanel\s*\{[^}]*left:\s*22px/s, "LTR/default panel aligns with left-side trigger");
assert.match(cssSource, /\.workspaceRoot\[dir="rtl"\]\s+\.stageCopilotWidgetPanel\s*\{[^}]*left:\s*auto[^}]*right:\s*22px[^}]*direction:\s*rtl[^}]*text-align:\s*right/s, "RTL panel aligns with right-side trigger and uses RTL text direction");
assert.match(cssSource, /@media \(max-width:\s*560px\)[\s\S]*\.stageCopilotWidgetPanel\s*\{[^}]*width:\s*calc\(100vw - 24px\)/, "mobile panel is viewport-bounded");
assert.doesNotMatch(cssSource, /\.stageCopilotWidgetTrigger\s*\{[^}]*width:\s*100%/s, "closed trigger must not be a wide bar");

const widgetAndPanelImports = [
  importAndExportLines(panelSource),
  importAndExportLines(widgetSource),
  importAndExportLines(shellSource),
].join("\n");

for (const pattern of [
  /@workflow\/prompts/,
  /@workflow\/sources-context/,
  /@workflow\/hierarchy-intake/,
  /@workflow\/targeting-rollout/,
  /@workflow\/participant-sessions/,
  /@workflow\/synthesis-evaluation/,
  /@workflow\/packages-output/,
  /@workflow\/integrations/,
  /@workflow\/persistence/,
]) {
  assertDoesNotMatch(widgetAndPanelImports, pattern, `widget/panel must not import ${pattern}`);
}

const widgetAndPanelSource = [panelSource, widgetSource].join("\n");
assertDoesNotMatch(widgetAndPanelSource, /providerRegistry|getPromptTextProvider|OPENAI_API_KEY/, "widget must not import provider internals");
assertDoesNotMatch(widgetAndPanelSource, /compilePrompt|compilePass|runPromptTest|runPass6PromptWorkspaceTest/i, "widget must not compile prompts or run prompt tests");
assertDoesNotMatch(widgetAndPanelSource, /retrieval|rag|vector/i, "widget must not add retrieval/RAG/vector behavior");
assertDoesNotMatch(widgetAndPanelSource, /localStorage|sessionStorage|indexedDB/, "widget must not persist conversation");
assertDoesNotMatch(widgetAndPanelSource, /applyFromCopilot|saveFromCopilot|runFromCopilot|approveFromCopilot|generateFromCopilot/i, "widget must not expose action controls");
assertDoesNotMatch(widgetAndPanelSource, /providerSelector|modelSelector|providerName|modelName|<option[^>]*openai/i, "widget must not expose provider/model selector");
assertDoesNotMatch(widgetAndPanelSource, /actionKey|requiresAdminConfirmation|executesAutomatically|routedAction/i, "widget must not implement routed actions");

const requiredWorkspacePages = [
  "apps/admin-web/app/workspace/page.tsx",
  "apps/admin-web/app/workspace/prompts/page.tsx",
  "apps/admin-web/app/workspace/copilot-instructions/page.tsx",
  "apps/admin-web/app/workspace/prompt-studio-copilot/page.tsx",
  "apps/admin-web/app/workspace/hierarchy/page.tsx",
  "apps/admin-web/app/workspace/analysis/page.tsx",
];
for (const path of requiredWorkspacePages) {
  assertFileExists(path, `${path} still exists`);
}

assertFileExists("scripts/prove-stage-copilot-prompt-studio-chat-pilot.mjs", "existing Prompt Studio API proof exists");
assertFileExists("scripts/prove-stage-copilot-sources-context-chat-pilot.mjs", "existing Sources / Context API proof exists");

console.log("Stage Copilot workspace widget proof passed.");
console.log(JSON.stringify({
  validatedCases: [
    "shared_component_source_exists",
    "widget_source_exists",
    "widget_mounted_in_workspace_shell",
    "closed_trigger_is_circular_icon_only",
    "widget_uses_fixed_positioning",
    "ltr_left_rtl_right_placement_validated",
    "panel_is_fixed_viewport_bounded_and_scrollable",
    "open_panel_has_single_header_pattern",
    "close_control_exists",
    "prompt_studio_supported",
    "sources_context_supported",
    "stage_keys_map_to_correct_endpoints",
    "manual_stage_override_exists",
    "route_based_stage_detection_exists",
    "no_tools_no_actions_boundary_copy_exists",
    "provider_status_model_context_and_fallback_displayed",
    "existing_workspace_pages_still_exist",
    "existing_prompt_studio_api_proof_exists",
    "existing_sources_context_api_proof_exists",
  ],
  nonInterference: [
    "no_workflow_prompts_import",
    "no_stage_package_imports",
    "no_provider_package_import",
    "no_persistence_import",
    "no_provider_model_selector",
    "no_apply_save_run_approve_generate_controls",
    "no_conversation_persistence",
    "no_retrieval_rag_vector_behavior",
  ],
}, null, 2));
