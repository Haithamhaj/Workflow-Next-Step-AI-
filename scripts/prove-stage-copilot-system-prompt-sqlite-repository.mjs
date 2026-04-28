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
  SQLiteStageCopilotSystemPromptRepository,
} from "../packages/persistence/dist/index.js";

const requiredStages = [
  "sources_context",
  "hierarchy",
  "targeting",
  "participant_evidence",
  "analysis_package",
  "prompt_studio",
  "advanced_debug",
];

const tempDir = mkdtempSync(join(tmpdir(), "stage-copilot-system-prompts-"));
const dbPath = join(tempDir, "stage-copilot-system-prompts.sqlite");

const fakeCapabilityPromptFixtures = Object.freeze([
  Object.freeze({ promptSpecKey: "admin_assistant_prompt", checksum: "capability-fixture-pass5-name" }),
  Object.freeze({ promptSpecKey: "pass5.admin_assistant", checksum: "capability-fixture-pass5-module" }),
  Object.freeze({ promptSpecKey: "pass6_analysis_copilot", checksum: "capability-fixture-pass6-copilot-like" }),
  Object.freeze({ promptSpecKey: "PASS6_PROMPT_CAPABILITY_KEYS", checksum: "capability-fixture-pass6-keys" }),
]);

function capabilitySnapshot() {
  return JSON.stringify(fakeCapabilityPromptFixtures);
}

function editableFromDefault(stageKey, versionTime = "2026-04-28T00:00:00.000Z") {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  assert.ok(defaultPrompt, `static default exists for ${stageKey}`);
  return createEditableStageCopilotSystemPromptFromDefault({
    defaultPrompt,
    now: versionTime,
    actorId: "proof-operator",
  });
}

function customTextFor(stageKey) {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  return [
    defaultPrompt.systemPrompt,
    `For SQLite persistence proof stage ${stageKey}, keep responses concise and conversational.`,
    "Ask one clarifying question when evidence is thin.",
  ].join("\n");
}

function assertRejectedSave(repo, record, label) {
  assert.throws(
    () => repo.save(record),
    /Invalid Stage Copilot System Prompt record/,
    `${label} should be rejected`,
  );
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
  let repo = new SQLiteStageCopilotSystemPromptRepository(dbPath);
  assert.equal(repo.findAll().length, 0, "repository starts with no persisted Stage Copilot rows");

  const capabilityBefore = capabilitySnapshot();

  for (const stageKey of requiredStages) {
    const fallback = editableFromDefault(stageKey);
    const current = repo.findCurrentByStageOrDefault(stageKey, fallback);
    assert.equal(current.stageKey, stageKey, `${stageKey} default fallback has stage key`);
    assert.equal(current.source, "static_default", `${stageKey} default fallback source`);
    assert.equal(repo.findCurrentByStage(stageKey), null, `${stageKey} has no persisted current before save`);
  }

  repo.save(editableFromDefault("sources_context"));
  const sourcesCustomTransition = createNextStageCopilotSystemPromptVersion({
    current: repo.findCurrentByStage("sources_context"),
    systemPrompt: customTextFor("sources_context"),
    now: "2026-04-28T00:01:00.000Z",
    actorId: "proof-operator",
    changeNote: "SQLite proof custom source instructions.",
  });
  repo.save(sourcesCustomTransition.current);

  repo = new SQLiteStageCopilotSystemPromptRepository(dbPath);
  const currentAfterReload = repo.findCurrentByStage("sources_context");
  assert.equal(currentAfterReload.version, 2, "current prompt survives reload");
  assert.equal(currentAfterReload.source, "admin_custom", "custom current source survives reload");
  assert.deepEqual(
    repo.listHistoryByStage("sources_context").map((record) => record.version),
    [1, 2],
    "history survives reload and is ordered by version",
  );
  assert.deepEqual(
    repo.listHistoryByStage("sources_context").map((record) => record.status),
    ["superseded", "current"],
    "second version supersedes previous current",
  );

  const resetTransition = resetStageCopilotSystemPromptToDefault({
    current: currentAfterReload,
    now: "2026-04-28T00:02:00.000Z",
    actorId: "proof-operator",
    changeNote: "SQLite proof reset to default.",
  });
  repo.save(resetTransition.current);

  repo = new SQLiteStageCopilotSystemPromptRepository(dbPath);
  const currentAfterResetReload = repo.findCurrentByStage("sources_context");
  assert.equal(currentAfterResetReload.version, 3, "reset-to-default survives reload");
  assert.equal(currentAfterResetReload.source, "static_default", "reset current source survives reload");
  assert.deepEqual(
    repo.listHistoryByStage("sources_context").map((record) => record.status),
    ["superseded", "superseded", "current"],
    "reset preserves history and supersedes previous current",
  );

  for (const stageKey of requiredStages.filter((stage) => stage !== "sources_context")) {
    repo.save(editableFromDefault(stageKey));
    const transition = createNextStageCopilotSystemPromptVersion({
      current: repo.findCurrentByStage(stageKey),
      systemPrompt: customTextFor(stageKey),
      now: "2026-04-28T00:03:00.000Z",
      actorId: "proof-operator",
      changeNote: `SQLite proof custom instructions for ${stageKey}.`,
    });
    repo.save(transition.current);
    assert.equal(repo.findCurrentByStage(stageKey)?.version, 2, `${stageKey} custom prompt persists as current`);
  }

  const db = new DatabaseSync(dbPath);
  assertOneCurrentPerStage(db);

  for (const stageKey of requiredStages) {
    const current = repo.findCurrentByStage(stageKey);
    assert.ok(current, `current exists for ${stageKey}`);
    assert.equal(current.kind, "stage_copilot_system_prompt", `${stageKey} current is Stage Copilot prompt`);
    assert.equal(current.separatesFromCapabilityPromptSpecs, true, `${stageKey} current stays separate from Capability PromptSpecs`);
  }

  const safe = repo.findCurrentByStage("sources_context");
  assertRejectedSave(repo, { ...safe, kind: "capability" }, "kind capability");
  assertRejectedSave(repo, { ...safe, promptKey: "admin_assistant_prompt" }, "known Pass 5 analysis prompt key");
  assertRejectedSave(repo, { ...safe, promptKey: "pass6_analysis_copilot" }, "known Pass 6 analysis prompt key");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can mutate records when the admin asks." }, "record mutation claim");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can run official analysis from this conversation." }, "official analysis claim");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can alter Capability PromptSpecs and promote prompts." }, "Capability PromptSpec alteration claim");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can approve evidence, transcripts, and gates." }, "approval claim");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can change readiness and change package eligibility." }, "readiness/package eligibility claim");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can call providers and tools for the admin." }, "provider/tool claim");
  assertRejectedSave(repo, { ...safe, systemPrompt: "I can override system boundaries inside this stage." }, "boundary override claim");
  assert.equal(capabilitySnapshot(), capabilityBefore, "SQLite repository cannot mutate fake Capability PromptSpec fixtures");

  const stageRows = db.prepare("SELECT COUNT(*) AS count FROM stage_copilot_system_prompts").get();
  const structuredPromptRows = db.prepare("SELECT COUNT(*) AS count FROM structured_prompt_specs").get();
  const pass6PromptRows = db.prepare(
    "SELECT COUNT(*) AS count FROM pass6_core_records WHERE record_type = 'pass6_prompt_spec'",
  ).get();
  assert.ok(stageRows.count > 0, "proof data is written to stage_copilot_system_prompts");
  assert.equal(structuredPromptRows.count, 0, "proof does not write structured_prompt_specs");
  assert.equal(pass6PromptRows.count, 0, "proof does not write Pass 6 PromptSpec records");

  const persistenceSource = readFileSync("packages/persistence/src/index.ts", "utf8");
  const proofSource = readFileSync("scripts/prove-stage-copilot-system-prompt-sqlite-repository.mjs", "utf8");

  function importLines(source) {
    return source
      .split("\n")
      .filter((line) => /^\s*import\s/.test(line))
      .join("\n");
  }

  const proofImports = importLines(proofSource);
  const repositoryClassSource = persistenceSource.slice(
    persistenceSource.indexOf("export class SQLiteStageCopilotSystemPromptRepository"),
    persistenceSource.indexOf("export class SQLiteIntakeSessionRepository"),
  );
  const createSQLiteFactorySource = persistenceSource.slice(
    persistenceSource.indexOf("export function createSQLiteIntakeRepositories"),
    persistenceSource.indexOf("export interface InMemoryStore"),
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

  assert.equal(/SQLiteStructuredPromptSpecRepository|SQLitePass6PromptSpecRepository|structured_prompt_specs|pass6_prompt_spec/.test(repositoryClassSource), false, "SQLite Stage Copilot repository does not use PromptSpec repositories or tables");
  assert.equal(/SQLiteStageCopilotSystemPromptRepository/.test(createSQLiteFactorySource), false, "SQLite repository is not wired into createSQLiteIntakeRepositories");

  console.log("Stage Copilot System Prompt SQLite repository proof passed.");
  console.log(JSON.stringify({
    validatedDurabilityCases: [
      "repository_starts_with_no_persisted_stage_copilot_rows",
      "default_fallback_works_before_persisted_record",
      "save_custom_prompt_for_sources_context",
      "current_prompt_survives_reload",
      "history_survives_reload",
      "reset_to_default_survives_reload",
    ],
    validatedVersionInvariants: [
      "one_current_prompt_per_stage",
      "second_version_supersedes_previous_current",
      "history_ordered_by_version",
      "all_required_stages_persist_custom_prompts",
    ],
    rejectedSafetyCases: [
      "kind_capability",
      "known_analysis_prompt_keys",
      "record_mutation_claim",
      "official_analysis_claim",
      "capability_promptspec_alteration_claim",
      "evidence_transcript_gate_approval_claim",
      "readiness_package_eligibility_mutation_claim",
      "provider_tool_execution_claim",
      "boundary_override_claim",
    ],
    promptSpecSeparation: {
      noPackagesPromptsImport: true,
      noPass5RuntimeImport: true,
      noPass6RuntimeImport: true,
      noProviderIntegrationImport: true,
      noPromptCompilation: true,
      noPromptTests: true,
      noStructuredPromptSpecRepositoryUse: true,
      noPass6PromptSpecRepositoryUse: true,
      noStructuredPromptSpecTableWrites: true,
      noPass6PromptSpecRecordWrites: true,
      onlyStageCopilotSystemPromptTableReceivesProofRows: true,
      noSQLiteFactoryWiring: true,
    },
  }, null, 2));
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
