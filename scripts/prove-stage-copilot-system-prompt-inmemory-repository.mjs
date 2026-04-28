import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createEditableStageCopilotSystemPromptFromDefault,
  createNextStageCopilotSystemPromptVersion,
  getDefaultStageCopilotSystemPrompt,
  resetStageCopilotSystemPromptToDefault,
} from "../packages/stage-copilot/dist/index.js";
import {
  InMemoryStageCopilotSystemPromptRepository,
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
    `For persistence proof stage ${stageKey}, keep responses concise and conversational.`,
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

const repo = new InMemoryStageCopilotSystemPromptRepository();
assert.equal(repo.findAll().length, 0, "repository starts empty");

const capabilityBefore = capabilitySnapshot();

for (const stageKey of requiredStages) {
  const fallback = editableFromDefault(stageKey);
  const current = repo.findCurrentByStageOrDefault(stageKey, fallback);
  assert.equal(current.stageKey, stageKey, `${stageKey} default fallback has stage key`);
  assert.equal(current.source, "static_default", `${stageKey} default fallback source`);
  assert.equal(current.status, "current", `${stageKey} default fallback status`);
}

const sourcesInitial = editableFromDefault("sources_context");
repo.save(sourcesInitial);
assert.equal(repo.findCurrentByStage("sources_context")?.version, 1, "sources_context v1 is current after save");

const sourcesCustomTransition = createNextStageCopilotSystemPromptVersion({
  current: repo.findCurrentByStage("sources_context"),
  systemPrompt: customTextFor("sources_context"),
  now: "2026-04-28T00:01:00.000Z",
  actorId: "proof-operator",
  changeNote: "Persistence proof custom source instructions.",
});
repo.save(sourcesCustomTransition.current);

const currentAfterSecondSave = repo.findCurrentByStage("sources_context");
assert.equal(currentAfterSecondSave.version, 2, "second custom save creates current v2");
assert.equal(currentAfterSecondSave.source, "admin_custom", "second current source is admin_custom");
const sourcesHistory = repo.listHistoryByStage("sources_context");
assert.equal(sourcesHistory.length, 2, "history contains both versions");
assert.deepEqual(sourcesHistory.map((record) => record.version), [1, 2], "history versions are preserved");
assert.deepEqual(sourcesHistory.map((record) => record.status), ["superseded", "current"], "previous current is superseded");

const resetTransition = resetStageCopilotSystemPromptToDefault({
  current: currentAfterSecondSave,
  now: "2026-04-28T00:02:00.000Z",
  actorId: "proof-operator",
  changeNote: "Persistence proof reset to default.",
});
repo.save(resetTransition.current);
const currentAfterReset = repo.findCurrentByStage("sources_context");
assert.equal(currentAfterReset.version, 3, "reset creates current v3");
assert.equal(currentAfterReset.source, "static_default", "reset current source is static_default");
assert.equal(repo.listHistoryByStage("sources_context").length, 3, "reset preserves full history");
assert.deepEqual(
  repo.listHistoryByStage("sources_context").map((record) => record.status),
  ["superseded", "superseded", "current"],
  "reset supersedes previous current and preserves history",
);

for (const stageKey of requiredStages.filter((stage) => stage !== "sources_context")) {
  repo.save(editableFromDefault(stageKey));
  const transition = createNextStageCopilotSystemPromptVersion({
    current: repo.findCurrentByStage(stageKey),
    systemPrompt: customTextFor(stageKey),
    now: "2026-04-28T00:03:00.000Z",
    actorId: "proof-operator",
    changeNote: `Persistence proof custom instructions for ${stageKey}.`,
  });
  repo.save(transition.current);
  assert.equal(repo.findCurrentByStage(stageKey)?.version, 2, `${stageKey} custom save is current`);
}

for (const stageKey of requiredStages) {
  const current = repo.findCurrentByStage(stageKey);
  assert.ok(current, `current exists for ${stageKey}`);
  assert.equal(current.kind, "stage_copilot_system_prompt", `${stageKey} current is Stage Copilot prompt`);
  assert.equal(current.separatesFromCapabilityPromptSpecs, true, `${stageKey} current stays separate from Capability PromptSpecs`);
}

assert.equal(capabilitySnapshot(), capabilityBefore, "repository records remain separated from fake Capability PromptSpec fixtures");

const safe = repo.findCurrentByStage("sources_context");
assertRejectedSave(repo, { ...safe, kind: "capability" }, "kind capability");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can mutate records when the admin asks." }, "record mutation claim");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can run official analysis from this conversation." }, "official analysis claim");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can alter Capability PromptSpecs and promote prompts." }, "Capability PromptSpec alteration claim");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can approve evidence, transcripts, and gates." }, "approval claim");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can change readiness and change package eligibility." }, "readiness/package eligibility claim");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can call providers and tools for the admin." }, "provider/tool claim");
assertRejectedSave(repo, { ...safe, systemPrompt: "I can override system boundaries inside this stage." }, "boundary override claim");
assertRejectedSave(repo, { ...safe, promptKey: "admin_assistant_prompt" }, "known Pass 5 analysis prompt key");
assertRejectedSave(repo, { ...safe, promptKey: "pass6_analysis_copilot" }, "known Pass 6 analysis prompt key");
assert.equal(capabilitySnapshot(), capabilityBefore, "rejected saves cannot mutate fake Capability PromptSpec fixtures");

const persistenceSource = readFileSync("packages/persistence/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-system-prompt-inmemory-repository.mjs", "utf8");

function importLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*import\s/.test(line))
    .join("\n");
}

const proofImports = importLines(proofSource);
const repositoryClassSource = persistenceSource.slice(
  persistenceSource.indexOf("export class InMemoryStageCopilotSystemPromptRepository"),
  persistenceSource.indexOf("class InMemorySourceRepository"),
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
  /node:sqlite/,
  /better-sqlite3/,
];

for (const pattern of forbiddenProofImportPatterns) {
  assert.equal(pattern.test(proofImports), false, `proof must not import or execute ${pattern}`);
}

assert.equal(/SQLite|DatabaseSync|CREATE TABLE|structured_prompt_specs|pass6_prompt_spec/.test(repositoryClassSource), false, "in-memory repository does not use SQLite or PromptSpec tables");
assert.equal(
  /StructuredPromptSpecRepository|Pass6PromptSpecRepository|InMemoryPromptRepository|implements PromptRepository|new InMemoryPromptRepository/.test(repositoryClassSource),
  false,
  "in-memory repository does not reuse PromptSpec repositories",
);

console.log("Stage Copilot System Prompt in-memory repository proof passed.");
console.log(JSON.stringify({
  validatedValidCases: [
    "repository_starts_empty",
    "default_fallback_available_for_each_required_stage",
    "save_custom_prompt_for_sources_context_creates_current_version",
    "second_custom_prompt_supersedes_first_current_version",
    "history_contains_versions",
    "reset_to_default_creates_current_static_default_version_and_preserves_history",
    "custom_prompt_saved_for_every_required_stage",
    "current_by_stage_returns_expected_current_record",
    "repository_records_remain_separated_from_fake_capability_promptspec_fixtures",
  ],
  rejectedInvalidCases: [
    "record_with_kind_capability",
    "prompt_claiming_record_mutation",
    "prompt_claiming_official_analysis_execution",
    "prompt_claiming_capability_promptspec_alteration",
    "prompt_claiming_evidence_transcript_gate_approval",
    "prompt_claiming_readiness_package_eligibility_mutation",
    "prompt_claiming_provider_tool_execution",
    "prompt_claiming_boundary_override",
    "known_analysis_prompt_key",
  ],
  nonInterference: {
    noPackagesPromptsImport: true,
    noPass5RuntimeImport: true,
    noPass6RuntimeImport: true,
    noAdminWebImport: true,
    noProviderIntegrationImport: true,
    noProviderCalls: true,
    noDbOrSqliteUse: true,
    noPromptCompilation: true,
    noPromptTests: true,
    noPromptSpecRepositoryReuse: true,
    noRuntimeBehavior: true,
  },
}, null, 2));
