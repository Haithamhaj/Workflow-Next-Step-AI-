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
  SQLiteStageCopilotSystemPromptRepository,
} from "../packages/persistence/dist/index.js";

const tempDir = mkdtempSync(join(tmpdir(), "stage-copilot-sqlite-factory-"));
const dbPath = join(tempDir, "stage-copilot-sqlite-factory.sqlite");

function editableFromDefault(stageKey, versionTime = "2026-04-29T00:00:00.000Z") {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  assert.ok(defaultPrompt, `static default exists for ${stageKey}`);
  return createEditableStageCopilotSystemPromptFromDefault({
    defaultPrompt,
    now: versionTime,
    actorId: "factory-proof-operator",
  });
}

function customTextFor(stageKey) {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  return [
    defaultPrompt.systemPrompt,
    `For factory proof stage ${stageKey}, keep discussion concise and cite uncertainty clearly.`,
  ].join("\n");
}

function assertOneCurrentPerStage(db) {
  const rows = db.prepare(
    "SELECT stage_key, COUNT(*) AS count FROM stage_copilot_system_prompts WHERE status = 'current' GROUP BY stage_key",
  ).all();
  for (const row of rows) {
    assert.equal(row.count, 1, `${row.stage_key} has exactly one current record`);
  }
}

try {
  let repos = createSQLiteStageCopilotRepositories(dbPath);
  assert.ok(repos.stageCopilotSystemPrompts, "factory returns stageCopilotSystemPrompts");
  assert.ok(
    repos.stageCopilotSystemPrompts instanceof SQLiteStageCopilotSystemPromptRepository,
    "factory-created repository is SQLiteStageCopilotSystemPromptRepository",
  );

  const exposedKeys = Object.keys(repos).sort();
  assert.deepEqual(exposedKeys, ["stageCopilotSystemPrompts"], "factory returns only Stage Copilot repositories");

  const forbiddenFactoryKeys = [
    "structuredPromptSpecs",
    "pass6PromptSpecs",
    "pass6PromptTestCases",
    "pass6PromptTestExecutionResults",
    "prompts",
    "providerJobs",
    "synthesisInputBundles",
    "workflowReadinessResults",
    "pass6ConfigurationProfiles",
  ];
  for (const key of forbiddenFactoryKeys) {
    assert.equal(Object.hasOwn(repos, key), false, `factory must not expose ${key}`);
  }

  repos.stageCopilotSystemPrompts.save(editableFromDefault("sources_context"));
  const customTransition = createNextStageCopilotSystemPromptVersion({
    current: repos.stageCopilotSystemPrompts.findCurrentByStage("sources_context"),
    systemPrompt: customTextFor("sources_context"),
    now: "2026-04-29T00:01:00.000Z",
    actorId: "factory-proof-operator",
    changeNote: "Factory proof custom instructions.",
  });
  repos.stageCopilotSystemPrompts.save(customTransition.current);

  repos = createSQLiteStageCopilotRepositories(dbPath);
  const reloadedCurrent = repos.stageCopilotSystemPrompts.findCurrentByStage("sources_context");
  assert.equal(reloadedCurrent.version, 2, "current prompt survives factory reload");
  assert.equal(reloadedCurrent.source, "admin_custom", "custom current source survives factory reload");
  assert.deepEqual(
    repos.stageCopilotSystemPrompts.listHistoryByStage("sources_context").map((record) => record.version),
    [1, 2],
    "history survives factory reload",
  );

  const resetTransition = resetStageCopilotSystemPromptToDefault({
    current: reloadedCurrent,
    now: "2026-04-29T00:02:00.000Z",
    actorId: "factory-proof-operator",
    changeNote: "Factory proof reset to default.",
  });
  repos.stageCopilotSystemPrompts.save(resetTransition.current);

  repos = createSQLiteStageCopilotRepositories(dbPath);
  assert.equal(
    repos.stageCopilotSystemPrompts.findCurrentByStage("sources_context")?.source,
    "static_default",
    "reset-to-default works through the factory-created repository",
  );
  assert.deepEqual(
    repos.stageCopilotSystemPrompts.listHistoryByStage("sources_context").map((record) => record.status),
    ["superseded", "superseded", "current"],
    "factory-created repository preserves reset history",
  );

  const db = new DatabaseSync(dbPath);
  assertOneCurrentPerStage(db);
  const stageRows = db.prepare("SELECT COUNT(*) AS count FROM stage_copilot_system_prompts").get();
  const structuredPromptRows = db.prepare("SELECT COUNT(*) AS count FROM structured_prompt_specs").get();
  const pass6PromptRows = db.prepare(
    "SELECT COUNT(*) AS count FROM pass6_core_records WHERE record_type = 'pass6_prompt_spec'",
  ).get();
  assert.ok(stageRows.count > 0, "factory proof writes rows to stage_copilot_system_prompts");
  assert.equal(structuredPromptRows.count, 0, "factory proof does not write structured_prompt_specs");
  assert.equal(pass6PromptRows.count, 0, "factory proof does not write Pass 6 PromptSpec records");

  const persistenceSource = readFileSync("packages/persistence/src/index.ts", "utf8");
  const proofSource = readFileSync("scripts/prove-stage-copilot-sqlite-repository-factory.mjs", "utf8");

  function importLines(source) {
    return source
      .split("\n")
      .filter((line) => /^\s*import\s/.test(line))
      .join("\n");
  }

  const proofImports = importLines(proofSource);
  const factorySource = persistenceSource.slice(
    persistenceSource.indexOf("export interface SQLiteStageCopilotRepositories"),
    persistenceSource.indexOf("function createSQLitePass6Repositories"),
  );
  const createSQLiteIntakeSource = persistenceSource.slice(
    persistenceSource.indexOf("export function createSQLiteIntakeRepositories"),
    persistenceSource.indexOf("export function getDefaultIntakeSqlitePath"),
  );

  const forbiddenProofImportPatterns = [
    /@workflow\/prompts/,
    /apps\/admin-web/,
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

  assert.equal(/structuredPromptSpecs|pass6PromptSpecs|PromptSpec|PromptTest|providerJobs|synthesisInputBundles|workflowReadinessResults/.test(factorySource), false, "factory exposes no PromptSpec, provider, or analysis repositories");
  assert.equal(/createSQLiteStageCopilotRepositories|stageCopilotSystemPrompts/.test(createSQLiteIntakeSource), false, "createSQLiteIntakeRepositories remains unwired");

  console.log("Stage Copilot SQLite repository factory proof passed.");
  console.log(JSON.stringify({
    validatedValidCases: [
      "factory_returns_stageCopilotSystemPrompts",
      "factory_created_repository_can_save_custom_prompt",
      "factory_created_repository_reloads_from_same_sqlite_path",
      "current_prompt_survives_reload",
      "history_survives_reload",
      "reset_to_default_works_through_factory_repository",
      "one_current_per_stage_invariant_holds",
    ],
    separationCases: [
      "factory_returns_only_stage_copilot_repositories",
      "factory_does_not_expose_structuredPromptSpecs",
      "factory_does_not_expose_pass6PromptSpecs",
      "factory_does_not_expose_prompt_test_repositories",
      "factory_does_not_expose_provider_repositories",
      "factory_does_not_expose_analysis_repositories",
      "factory_writes_only_stage_copilot_system_prompt_rows",
      "no_structured_prompt_specs_writes",
      "no_pass6_prompt_spec_record_writes",
      "createSQLiteIntakeRepositories_not_modified_or_wired",
    ],
    nonInterference: {
      noPackagesPromptsImport: true,
      noPass5RuntimeImport: true,
      noPass6RuntimeImport: true,
      noAdminWebImport: true,
      noProviderIntegrationImport: true,
      noProviderCalls: true,
      noPromptCompilation: true,
      noPromptTests: true,
      noUiApiRuntimeAccess: true,
      noEnvironmentRequired: true,
    },
  }, null, 2));
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
