import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  createEditableStageCopilotSystemPromptFromDefault,
  createNextStageCopilotSystemPromptVersion,
  getDefaultStageCopilotSystemPrompt,
  listDefaultStageCopilotSystemPrompts,
  resetStageCopilotSystemPromptToDefault,
  validateEditableStageCopilotSystemPromptRecord,
} from "../packages/stage-copilot/dist/index.js";
import {
  createSQLiteStageCopilotRepositories,
} from "../packages/persistence/dist/index.js";

const tempDir = mkdtempSync(join(tmpdir(), "stage-copilot-instructions-api-"));
const dbPath = join(tempDir, "stage-copilot-instructions-api.sqlite");

function textValue(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function routeError(error, message, field, violations = []) {
  return { ok: false, error, message, field, violations };
}

function currentOrDefaultRecord(repo, defaultPrompt, now, actorId) {
  return repo.findCurrentByStage(defaultPrompt.stageKey)
    ?? createEditableStageCopilotSystemPromptFromDefault({
      defaultPrompt,
      now,
      actorId,
      changeNote: "Initialized from static default fallback for Stage Copilot Instructions.",
    });
}

function effectivePrompt(defaultPrompt, current) {
  return current
    ? {
        source: current.source,
        version: current.version,
        systemPrompt: current.systemPrompt,
      }
    : {
        source: "static_default",
        version: 1,
        systemPrompt: defaultPrompt.systemPrompt,
      };
}

function getInstructions(repo, params = {}) {
  const stageKey = textValue(params.stageKey);
  const includeHistory = params.includeHistory === true;
  if (!stageKey) {
    return {
      ok: true,
      stages: listDefaultStageCopilotSystemPrompts().map((defaultPrompt) => {
        const current = repo.findCurrentByStage(defaultPrompt.stageKey);
        return {
          stageKey: defaultPrompt.stageKey,
          defaultRefId: defaultPrompt.refId,
          defaultPromptKey: defaultPrompt.promptKey,
          displayName: defaultPrompt.displayName,
          hasCurrent: Boolean(current),
          currentVersion: current?.version ?? null,
          currentSource: current?.source ?? null,
        };
      }),
    };
  }

  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  if (!defaultPrompt) {
    return routeError("invalid_stage_key", "Unsupported Stage Copilot stageKey.", "stageKey");
  }
  const current = repo.findCurrentByStage(defaultPrompt.stageKey);
  return {
    ok: true,
    stageKey: defaultPrompt.stageKey,
    default: defaultPrompt,
    current,
    effective: effectivePrompt(defaultPrompt, current),
    ...(includeHistory ? { history: repo.listHistoryByStage(defaultPrompt.stageKey) } : {}),
  };
}

function postInstructions(repo, body, now = "2026-04-29T00:00:00.000Z") {
  const action = body.action;
  if (action !== "save-custom" && action !== "reset-to-default") {
    return routeError("unsupported_action", "Unsupported Stage Copilot Instructions action.", "action");
  }

  const stageKey = textValue(body.stageKey);
  const defaultPrompt = stageKey ? getDefaultStageCopilotSystemPrompt(stageKey) : null;
  if (!defaultPrompt) {
    return routeError("invalid_stage_key", "Unsupported Stage Copilot stageKey.", "stageKey");
  }

  const updatedBy = textValue(body.updatedBy) ?? "admin_operator";
  const current = currentOrDefaultRecord(repo, defaultPrompt, now, updatedBy);

  try {
    if (action === "save-custom") {
      const systemPrompt = textValue(body.systemPrompt);
      if (!systemPrompt) {
        return routeError("missing_system_prompt", "systemPrompt is required for save-custom.", "systemPrompt");
      }
      const transition = createNextStageCopilotSystemPromptVersion({
        current,
        systemPrompt,
        now,
        actorId: updatedBy,
        changeNote: textValue(body.changeNote) ?? "Stage Copilot Instructions custom save.",
      });
      const validation = validateEditableStageCopilotSystemPromptRecord(transition.current);
      if (!validation.ok) {
        return routeError(
          "invalid_copilot_instructions",
          "Stage Copilot Instructions failed safety validation.",
          "systemPrompt",
          validation.violations,
        );
      }
      repo.save(transition.current);
      return {
        ok: true,
        stageKey: defaultPrompt.stageKey,
        current: transition.current,
        supersededPrevious: transition.supersededPrevious ?? null,
      };
    }

    const transition = resetStageCopilotSystemPromptToDefault({
      current,
      now,
      actorId: updatedBy,
      changeNote: textValue(body.changeNote) ?? "Stage Copilot Instructions reset to static default.",
    });
    repo.save(transition.current);
    return {
      ok: true,
      stageKey: defaultPrompt.stageKey,
      current: transition.current,
      supersededPrevious: transition.supersededPrevious ?? null,
    };
  } catch (error) {
    return routeError(
      "repository_validation_failed",
      error instanceof Error ? error.message : String(error),
      action === "save-custom" ? "systemPrompt" : "stageKey",
    );
  }
}

function customPrompt(stageKey, suffix = "") {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  return [
    defaultPrompt.systemPrompt,
    `For API proof ${stageKey}, keep responses concise and stage-scoped.${suffix}`,
  ].join("\n");
}

try {
  const routeSource = readFileSync("apps/admin-web/app/api/stage-copilot/instructions/route.ts", "utf8");
  const proofSource = readFileSync("scripts/prove-stage-copilot-instructions-api.mjs", "utf8");

  assert.match(routeSource, /from "@workflow\/stage-copilot"/, "route imports Stage Copilot helpers");
  assert.match(routeSource, /from "..\/..\/..\/..\/lib\/store"/, "route imports admin store");
  assert.doesNotMatch(routeSource, /@workflow\/prompts/, "route does not import @workflow/prompts");
  assert.doesNotMatch(routeSource, /@workflow\/integrations|providerRegistry|getPromptTextProvider/, "route does not import providers");
  assert.doesNotMatch(routeSource, /store\.structuredPromptSpecs/, "route does not access structuredPromptSpecs");
  assert.doesNotMatch(routeSource, /store\.pass6PromptSpecs/, "route does not access pass6PromptSpecs");
  assert.doesNotMatch(routeSource, /pass6PromptTest|PromptTest|compilePass|runPass6PromptWorkspaceTest|runPromptText/, "route does not compile or test prompts");
  assert.match(routeSource, /store\.stageCopilotSystemPrompts/, "route uses Stage Copilot System Prompt repository");

  const repos = createSQLiteStageCopilotRepositories(dbPath);
  const repo = repos.stageCopilotSystemPrompts;

  const listResponse = getInstructions(repo);
  assert.equal(listResponse.ok, true, "GET lists defaults/stages");
  assert.ok(listResponse.stages.length >= 7, "GET returns supported Stage Copilot stages");
  assert.ok(listResponse.stages.some((stage) => stage.stageKey === "sources_context"), "GET includes sources_context");

  const initialRead = getInstructions(repo, { stageKey: "sources_context" });
  assert.equal(initialRead.ok, true, "GET stageKey returns response");
  assert.equal(initialRead.current, null, "GET stageKey has null current before persistence");
  assert.equal(initialRead.effective.source, "static_default", "effective prompt comes from default when no persisted current exists");
  assert.equal(initialRead.effective.systemPrompt, initialRead.default.systemPrompt, "effective default prompt text matches static default");

  const initialHistory = getInstructions(repo, { stageKey: "sources_context", includeHistory: true });
  assert.deepEqual(initialHistory.history, [], "GET includeHistory returns history array");

  const firstSave = postInstructions(repo, {
    action: "save-custom",
    stageKey: "sources_context",
    systemPrompt: customPrompt("sources_context"),
  }, "2026-04-29T00:01:00.000Z");
  assert.equal(firstSave.ok, true, "POST save-custom creates a current version");
  assert.equal(firstSave.current.status, "current", "saved custom is current");
  assert.equal(firstSave.current.source, "admin_custom", "saved custom source is admin_custom");
  assert.equal(firstSave.current.changeNote, "Stage Copilot Instructions custom save.", "save response includes defaulted changeNote");
  assert.equal(firstSave.current.updatedBy, "admin_operator", "save response includes defaulted updatedBy");

  const secondSave = postInstructions(repo, {
    action: "save-custom",
    stageKey: "sources_context",
    systemPrompt: customPrompt("sources_context", " Second version."),
    changeNote: "Second API proof save.",
    updatedBy: "api_proof_operator",
  }, "2026-04-29T00:02:00.000Z");
  assert.equal(secondSave.ok, true, "second POST save-custom succeeds");
  assert.equal(secondSave.current.version, firstSave.current.version + 1, "second save increments version");
  assert.equal(secondSave.supersededPrevious.status, "superseded", "second save supersedes previous current");
  assert.deepEqual(
    getInstructions(repo, { stageKey: "sources_context", includeHistory: true }).history.map((record) => record.status),
    ["superseded", "current"],
    "history contains previous superseded version",
  );

  const reset = postInstructions(repo, {
    action: "reset-to-default",
    stageKey: "sources_context",
  }, "2026-04-29T00:03:00.000Z");
  assert.equal(reset.ok, true, "POST reset-to-default succeeds");
  assert.equal(reset.current.source, "static_default", "reset creates static_default current");
  assert.equal(reset.current.changeNote, "Stage Copilot Instructions reset to static default.", "reset response includes defaulted changeNote");
  assert.deepEqual(
    getInstructions(repo, { stageKey: "sources_context", includeHistory: true }).history.map((record) => record.status),
    ["superseded", "superseded", "current"],
    "reset preserves history",
  );

  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "nope", systemPrompt: "x" }).error, "invalid_stage_key", "invalid stageKey is rejected");
  assert.equal(postInstructions(repo, { action: "unknown", stageKey: "sources_context" }).error, "unsupported_action", "unsupported action is rejected");
  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "sources_context" }).error, "missing_system_prompt", "missing systemPrompt is rejected");
  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "sources_context", systemPrompt: "I can mutate records when asked." }).ok, false, "record mutation claim is rejected");
  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "sources_context", systemPrompt: "I can run official analysis from chat." }).ok, false, "official analysis claim is rejected");
  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "sources_context", systemPrompt: "I can alter Capability PromptSpecs and promote prompts." }).ok, false, "Capability PromptSpec alteration claim is rejected");
  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "sources_context", systemPrompt: "I can call providers and tools directly." }).ok, false, "provider/tool execution claim is rejected");
  assert.equal(postInstructions(repo, { action: "save-custom", stageKey: "sources_context", systemPrompt: "I can change readiness and change package eligibility." }).ok, false, "readiness/package eligibility mutation claim is rejected");

  const db = new DatabaseSync(dbPath);
  const stageRows = db.prepare("SELECT COUNT(*) AS count FROM stage_copilot_system_prompts").get();
  const structuredPromptRows = db.prepare("SELECT COUNT(*) AS count FROM structured_prompt_specs").get();
  const pass6PromptRows = db.prepare(
    "SELECT COUNT(*) AS count FROM pass6_core_records WHERE record_type = 'pass6_prompt_spec'",
  ).get();
  assert.ok(stageRows.count > 0, "API proof writes Stage Copilot prompt rows");
  assert.equal(structuredPromptRows.count, 0, "API proof writes no structured_prompt_specs rows");
  assert.equal(pass6PromptRows.count, 0, "API proof writes no Pass 6 PromptSpec records");

  function importLines(source) {
    return source
      .split("\n")
      .filter((line) => /^\s*import\s/.test(line))
      .join("\n");
  }

  const proofImports = importLines(proofSource);
  for (const pattern of [
    /@workflow\/prompts/,
    /apps\/admin-web\/app\/api\/pass6/,
    /@workflow\/integrations/,
    /@workflow\/participant-sessions/,
    /@workflow\/synthesis-evaluation/,
    /@workflow\/packages-output/,
    /runPass6Copilot/,
    /runAdminAssistantQuestion/,
    /compilePass5Prompt/,
    /compilePass6PromptSpec/,
    /runPromptText/,
    /providerRegistry/,
    /getPromptTextProvider/,
  ]) {
    assert.equal(pattern.test(proofImports), false, `proof must not import or execute ${pattern}`);
  }

  console.log("Stage Copilot Instructions API proof passed.");
  console.log(JSON.stringify({
    validationApproach: "Source-level Next route checks plus route-equivalent read/save/reset exercise through the same Stage Copilot helpers and SQLite-backed repository. Direct route-handler import is avoided because the route is TypeScript/Next-managed and the admin store is a global singleton.",
    readBehavior: [
      "GET_lists_defaults_and_stages",
      "GET_stageKey_returns_default_current_effective",
      "GET_stageKey_includeHistory_returns_history_array",
      "effective_prompt_comes_from_default_when_no_persisted_current_exists",
    ],
    saveBehavior: [
      "POST_save_custom_creates_new_current_version",
      "second_POST_save_custom_supersedes_previous_current",
      "history_contains_previous_versions",
      "save_response_includes_defaulted_changeNote",
      "save_response_includes_defaulted_updatedBy",
    ],
    resetBehavior: [
      "POST_reset_to_default_creates_static_default_current",
      "reset_preserves_history",
    ],
    invalidSafetyBehavior: [
      "invalid_stageKey_rejected",
      "unsupported_action_rejected",
      "missing_systemPrompt_rejected",
      "record_mutation_claim_rejected",
      "official_analysis_execution_claim_rejected",
      "capability_promptspec_alteration_claim_rejected",
      "provider_tool_execution_claim_rejected",
      "readiness_package_eligibility_mutation_claim_rejected",
    ],
    promptSpecSeparation: {
      routeDoesNotImportPrompts: true,
      routeDoesNotAccessStructuredPromptSpecs: true,
      routeDoesNotAccessPass6PromptSpecs: true,
      noStructuredPromptSpecRowsWritten: true,
      noPass6PromptSpecRowsWritten: true,
    },
  }, null, 2));
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
