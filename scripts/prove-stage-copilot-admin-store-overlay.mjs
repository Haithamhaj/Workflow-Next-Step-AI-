import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  createEditableStageCopilotSystemPromptFromDefault,
  createNextStageCopilotSystemPromptVersion,
  getDefaultStageCopilotSystemPrompt,
  resetStageCopilotSystemPromptToDefault,
} from "../packages/stage-copilot/dist/index.js";
import {
  createSQLiteStageCopilotRepositories,
} from "../packages/persistence/dist/index.js";

const tempDir = mkdtempSync(join(tmpdir(), "stage-copilot-admin-store-overlay-"));
const dbPath = join(tempDir, "stage-copilot-admin-store-overlay.sqlite");

function editableFromDefault(stageKey, versionTime = "2026-04-29T00:00:00.000Z") {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  assert.ok(defaultPrompt, `static default exists for ${stageKey}`);
  return createEditableStageCopilotSystemPromptFromDefault({
    defaultPrompt,
    now: versionTime,
    actorId: "admin-store-proof-operator",
  });
}

function customTextFor(stageKey) {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  return [
    defaultPrompt.systemPrompt,
    `For admin store overlay proof stage ${stageKey}, keep discussion concise and evidence-aware.`,
  ].join("\n");
}

try {
  const storeSource = readFileSync("apps/admin-web/lib/store.ts", "utf8");
  const proofSource = readFileSync("scripts/prove-stage-copilot-admin-store-overlay.mjs", "utf8");

  assert.match(
    storeSource,
    /createSQLiteStageCopilotRepositories/,
    "admin store imports/uses createSQLiteStageCopilotRepositories",
  );
  assert.match(
    storeSource,
    /const stageCopilotRepositories = createSQLiteStageCopilotRepositories\(\);/,
    "admin store constructs Stage Copilot repositories through dedicated factory",
  );
  assert.match(
    storeSource,
    /stageCopilotSystemPrompts:\s*stageCopilotRepositories\.stageCopilotSystemPrompts/,
    "admin store overlays only stageCopilotSystemPrompts from Stage Copilot factory",
  );
  assert.match(
    storeSource,
    /structuredPromptSpecs:\s*intakeRepositories\.structuredPromptSpecs/,
    "structuredPromptSpecs remains wired from intake repositories",
  );
  assert.match(
    storeSource,
    /pass6PromptSpecs:\s*intakeRepositories\.pass6PromptSpecs/,
    "pass6PromptSpecs remains wired from intake repositories",
  );
  assert.doesNotMatch(
    storeSource,
    /SQLiteStageCopilotSystemPromptRepository/,
    "admin store does not directly construct the SQLite Stage Copilot repository",
  );

  const stageCopilotOverlayLines = storeSource
    .split("\n")
    .filter((line) => /stageCopilot/i.test(line));
  assert.deepEqual(
    stageCopilotOverlayLines.map((line) => line.trim()),
    [
      "createSQLiteStageCopilotRepositories,",
      "const stageCopilotRepositories = createSQLiteStageCopilotRepositories();",
      "stageCopilotSystemPrompts: stageCopilotRepositories.stageCopilotSystemPrompts,",
    ],
    "admin store adds only the Stage Copilot repository factory and single repository overlay",
  );

  let stageCopilotRepositories = createSQLiteStageCopilotRepositories(dbPath);
  assert.ok(stageCopilotRepositories.stageCopilotSystemPrompts, "factory-backed admin overlay exposes stageCopilotSystemPrompts");

  stageCopilotRepositories.stageCopilotSystemPrompts.save(editableFromDefault("sources_context"));
  const customTransition = createNextStageCopilotSystemPromptVersion({
    current: stageCopilotRepositories.stageCopilotSystemPrompts.findCurrentByStage("sources_context"),
    systemPrompt: customTextFor("sources_context"),
    now: "2026-04-29T00:01:00.000Z",
    actorId: "admin-store-proof-operator",
    changeNote: "Admin store overlay proof custom instructions.",
  });
  stageCopilotRepositories.stageCopilotSystemPrompts.save(customTransition.current);

  stageCopilotRepositories = createSQLiteStageCopilotRepositories(dbPath);
  const reloadedCurrent = stageCopilotRepositories.stageCopilotSystemPrompts.findCurrentByStage("sources_context");
  assert.equal(reloadedCurrent.version, 2, "current prompt survives same-db-path reconstruction");
  assert.equal(reloadedCurrent.source, "admin_custom", "custom current source survives same-db-path reconstruction");
  assert.deepEqual(
    stageCopilotRepositories.stageCopilotSystemPrompts.listHistoryByStage("sources_context").map((record) => record.version),
    [1, 2],
    "history survives same-db-path reconstruction",
  );

  const resetTransition = resetStageCopilotSystemPromptToDefault({
    current: reloadedCurrent,
    now: "2026-04-29T00:02:00.000Z",
    actorId: "admin-store-proof-operator",
    changeNote: "Admin store overlay proof reset to default.",
  });
  stageCopilotRepositories.stageCopilotSystemPrompts.save(resetTransition.current);

  stageCopilotRepositories = createSQLiteStageCopilotRepositories(dbPath);
  assert.equal(
    stageCopilotRepositories.stageCopilotSystemPrompts.findCurrentByStage("sources_context")?.source,
    "static_default",
    "reset-to-default works through factory-backed admin overlay repository",
  );
  assert.deepEqual(
    stageCopilotRepositories.stageCopilotSystemPrompts.listHistoryByStage("sources_context").map((record) => record.status),
    ["superseded", "superseded", "current"],
    "reset history survives same-db-path reconstruction",
  );

  const db = new DatabaseSync(dbPath);
  const stageRows = db.prepare("SELECT COUNT(*) AS count FROM stage_copilot_system_prompts").get();
  const structuredPromptRows = db.prepare("SELECT COUNT(*) AS count FROM structured_prompt_specs").get();
  const pass6PromptRows = db.prepare(
    "SELECT COUNT(*) AS count FROM pass6_core_records WHERE record_type = 'pass6_prompt_spec'",
  ).get();
  assert.ok(stageRows.count > 0, "admin store overlay proof writes rows to stage_copilot_system_prompts");
  assert.equal(structuredPromptRows.count, 0, "admin store overlay proof does not write structured_prompt_specs");
  assert.equal(pass6PromptRows.count, 0, "admin store overlay proof does not write Pass 6 PromptSpec records");

  function importLines(source) {
    return source
      .split("\n")
      .filter((line) => /^\s*import\s/.test(line))
      .join("\n");
  }

  const storeImports = importLines(storeSource);
  const proofImports = importLines(proofSource);
  const forbiddenProofImportPatterns = [
    /@workflow\/prompts/,
    /apps\/admin-web\/app/,
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
  ];

  for (const pattern of forbiddenProofImportPatterns) {
    assert.equal(pattern.test(proofImports), false, `proof must not import or execute ${pattern}`);
  }

  assert.equal(/@workflow\/prompts|@workflow\/integrations/.test(storeImports), false, "admin store overlay does not add prompt or provider imports");
  assert.equal(/createSQLiteIntakeRepositories/.test(storeSource), true, "existing intake repository factory remains present");

  console.log("Stage Copilot admin store overlay proof passed.");
  console.log(JSON.stringify({
    validationApproach: "Source-level admin store wiring checks plus same-db-path durable repository reconstruction through createSQLiteStageCopilotRepositories. Direct module reload of apps/admin-web/lib/store.ts is intentionally avoided because the app store is a TypeScript global singleton for Next.js hot reloads.",
    validatedValidCases: [
      "admin_store_exposes_stageCopilotSystemPrompts_overlay",
      "stageCopilotSystemPrompts_is_created_through_dedicated_sqlite_factory",
      "custom_prompt_saved_through_factory_backed_overlay_repository",
      "current_prompt_survives_same_db_path_reconstruction",
      "history_survives_same_db_path_reconstruction",
      "reset_to_default_works_through_overlay_repository",
    ],
    separationCases: [
      "structuredPromptSpecs_field_remains_existing_intake_repository_field",
      "pass6PromptSpecs_field_remains_existing_intake_repository_field",
      "promptspec_repositories_not_replaced_by_stage_copilot_repository",
      "no_structured_prompt_specs_writes",
      "no_pass6_prompt_spec_record_writes",
      "stage_copilot_prompt_rows_written_only_to_stage_copilot_system_prompts",
    ],
    nonInterference: {
      noPackagesPromptsImport: true,
      noPass5RuntimeImport: true,
      noPass6RuntimeImport: true,
      noProviderCalls: true,
      noPromptCompilation: true,
      noPromptTests: true,
      noUiRoutesTouched: true,
      noExternalServicesRequired: true,
    },
  }, null, 2));
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
