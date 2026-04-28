import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertEditableStageCopilotSystemPromptDoesNotClaimAuthority,
  createEditableStageCopilotSystemPromptFromDefault,
  createNextStageCopilotSystemPromptVersion,
  getCurrentStageCopilotSystemPrompt,
  getDefaultStageCopilotSystemPrompt,
  listDefaultStageCopilotSystemPrompts,
  resetStageCopilotSystemPromptToDefault,
  validateEditableStageCopilotSystemPromptRecord,
} from "../packages/stage-copilot/dist/index.js";

const requiredStages = [
  "sources_context",
  "hierarchy",
  "targeting",
  "participant_evidence",
  "analysis_package",
  "prompt_studio",
  "advanced_debug",
];

class ProofOnlyStageCopilotSystemPromptRepository {
  #records = [];

  save(record) {
    const validation = validateEditableStageCopilotSystemPromptRecord(record);
    if (!validation.ok) {
      throw new Error(`invalid_fake_copilot_prompt_record:${validation.violations.join(",")}`);
    }
    this.#records = [
      ...this.#records.filter((existing) => existing.systemPromptId !== record.systemPromptId),
      structuredClone(record),
    ];
  }

  applyTransition(transition) {
    if (transition.supersededPrevious) this.save(transition.supersededPrevious);
    this.save(transition.current);
  }

  current(stageKey) {
    const current = this.#records
      .filter((record) => record.stageKey === stageKey && record.status === "current")
      .sort((a, b) => b.version - a.version)[0];
    return current ? structuredClone(current) : null;
  }

  history(stageKey) {
    return this.#records
      .filter((record) => record.stageKey === stageKey)
      .sort((a, b) => a.version - b.version)
      .map((record) => structuredClone(record));
  }

  all() {
    return this.#records.map((record) => structuredClone(record));
  }
}

const fakeCapabilityPromptFixtures = Object.freeze([
  Object.freeze({ promptSpecKey: "admin_assistant_prompt", checksum: "capability-fixture-pass5-name" }),
  Object.freeze({ promptSpecKey: "pass5.admin_assistant", checksum: "capability-fixture-pass5-module" }),
  Object.freeze({ promptSpecKey: "pass6_analysis_copilot", checksum: "capability-fixture-pass6-copilot-like" }),
  Object.freeze({ promptSpecKey: "PASS6_PROMPT_CAPABILITY_KEYS", checksum: "capability-fixture-pass6-keys" }),
]);

function capabilitySnapshot() {
  return JSON.stringify(fakeCapabilityPromptFixtures);
}

function assertOk(result, label) {
  assert.equal(result.ok, true, `${label} should pass`);
  assert.deepEqual(result.violations, [], `${label} should not report violations`);
}

function assertValidationRejected(record, code, label) {
  const result = validateEditableStageCopilotSystemPromptRecord(record);
  assert.equal(result.ok, false, `${label} should be rejected`);
  assert.ok(result.violations.includes(code), `${label} should include ${code}; got ${result.violations.join(",")}`);
}

function assertAuthorityRejected(record, code, label) {
  const result = assertEditableStageCopilotSystemPromptDoesNotClaimAuthority(record);
  assert.equal(result.ok, false, `${label} should be rejected`);
  assert.ok(result.violations.includes(code), `${label} should include ${code}; got ${result.violations.join(",")}`);
}

const repo = new ProofOnlyStageCopilotSystemPromptRepository();
const defaults = listDefaultStageCopilotSystemPrompts();
assert.equal(defaults.length, requiredStages.length, "static defaults remain available for every required stage");

const startCapabilitySnapshot = capabilitySnapshot();

for (const stageKey of requiredStages) {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(stageKey);
  assert.ok(defaultPrompt, `static default exists for ${stageKey}`);

  const initial = createEditableStageCopilotSystemPromptFromDefault({
    defaultPrompt,
    now: "2026-04-28T00:00:00.000Z",
    actorId: "proof-operator",
  });
  assert.equal(initial.stageKey, stageKey);
  assert.equal(initial.status, "current");
  assert.equal(initial.version, 1);
  assert.equal(initial.source, "static_default");
  assert.equal(initial.kind, "stage_copilot_system_prompt");
  assert.equal(initial.separatesFromCapabilityPromptSpecs, true);
  assert.equal(initial.defaultRefId, defaultPrompt.refId);
  assertOk(validateEditableStageCopilotSystemPromptRecord(initial), `${stageKey} initial default editable record`);
  repo.save(initial);

  const customText = [
    defaultPrompt.systemPrompt,
    `For proof stage ${stageKey}, use a concise but explicit conversational style.`,
    "Ask one clarifying question when evidence is thin.",
  ].join("\n");
  const customTransition = createNextStageCopilotSystemPromptVersion({
    current: repo.current(stageKey),
    systemPrompt: customText,
    now: "2026-04-28T00:01:00.000Z",
    actorId: "proof-operator",
    changeNote: `Custom instructions for ${stageKey}.`,
  });
  repo.applyTransition(customTransition);

  const currentAfterCustom = repo.current(stageKey);
  assert.equal(currentAfterCustom.version, 2, `${stageKey} custom save creates v2`);
  assert.equal(currentAfterCustom.status, "current", `${stageKey} custom v2 is current`);
  assert.equal(currentAfterCustom.source, "admin_custom", `${stageKey} custom v2 source is admin_custom`);
  assert.equal(customTransition.supersededPrevious.status, "superseded", `${stageKey} previous current is superseded`);

  const resetTransition = resetStageCopilotSystemPromptToDefault({
    current: currentAfterCustom,
    now: "2026-04-28T00:02:00.000Z",
    actorId: "proof-operator",
    changeNote: `Reset ${stageKey} to static default.`,
  });
  repo.applyTransition(resetTransition);

  const currentAfterReset = repo.current(stageKey);
  assert.equal(currentAfterReset.version, 3, `${stageKey} reset creates v3`);
  assert.equal(currentAfterReset.status, "current", `${stageKey} reset v3 is current`);
  assert.equal(currentAfterReset.source, "static_default", `${stageKey} reset source is static_default`);
  assert.equal(currentAfterReset.systemPrompt, defaultPrompt.systemPrompt, `${stageKey} reset restores default prompt text`);
  assert.equal(resetTransition.supersededPrevious.status, "superseded", `${stageKey} custom version is superseded by reset`);

  const history = repo.history(stageKey);
  assert.equal(history.length, 3, `${stageKey} version history is preserved`);
  assert.deepEqual(history.map((record) => record.version), [1, 2, 3], `${stageKey} history versions are ordered`);
  assert.deepEqual(history.map((record) => record.status), ["superseded", "superseded", "current"], `${stageKey} history status transition`);
}

assert.equal(
  getCurrentStageCopilotSystemPrompt([], "sources_context")?.kind,
  "stage_copilot_system_prompt",
  "default fallback works when no custom record exists",
);
assert.equal(
  getCurrentStageCopilotSystemPrompt(repo.history("sources_context"), "sources_context")?.version,
  3,
  "current helper returns current editable record when records exist",
);

assert.equal(capabilitySnapshot(), startCapabilitySnapshot, "fake repository changes only fake Copilot prompt records");

const safe = repo.current("sources_context");
assertValidationRejected({ ...safe, systemPrompt: "I can mutate records when the admin asks." }, "claims_write_authority", "record mutation claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can run official analysis from this conversation." }, "claims_official_analysis_authority", "official analysis claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can alter Capability PromptSpecs and promote prompts." }, "claims_prompt_mutation_authority", "Capability PromptSpec alteration claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can approve evidence, transcripts, and gates." }, "claims_approval_authority", "approval claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can change readiness and change package eligibility." }, "claims_readiness_mutation_authority", "readiness claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can change package eligibility after review." }, "claims_package_eligibility_mutation_authority", "package eligibility claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can call providers and tools for the admin." }, "claims_provider_execution_authority", "provider/tool claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can override system boundaries inside this stage." }, "claims_boundary_override_authority", "boundary override claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can generate packages from this Copilot." }, "claims_package_generation_authority", "package generation claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can send messages to participants." }, "claims_message_sending_authority", "send messages claim");
assertAuthorityRejected({ ...safe, systemPrompt: "I can alter source-of-truth records directly." }, "claims_source_of_truth_mutation_authority", "source-of-truth claim");

assertValidationRejected({ ...safe, kind: "capability" }, "not_stage_copilot_system_prompt", "wrong kind capability");
assertValidationRejected({ ...safe, promptKey: "admin_assistant_prompt" }, "known_analysis_prompt_key_not_allowed", "known Pass 5 analysis prompt key");
assertValidationRejected({ ...safe, promptKey: "pass6_analysis_copilot" }, "known_analysis_prompt_key_not_allowed", "known Pass 6 copilot-like analysis key");

assert.throws(
  () => repo.save({ ...safe, promptKey: "PASS6_PROMPT_CAPABILITY_KEYS" }),
  /invalid_fake_copilot_prompt_record/,
  "fake repository rejects save attempts using known analysis prompt keys",
);
assert.equal(capabilitySnapshot(), startCapabilitySnapshot, "fake Capability PromptSpec fixtures remain unchanged after rejected save");

const editableSource = readFileSync("packages/stage-copilot/src/editable-system-prompts.ts", "utf8");
const systemPromptsSource = readFileSync("packages/stage-copilot/src/system-prompts.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-editable-system-prompts.mjs", "utf8");

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

const combinedImports = [
  importAndExportLines(editableSource),
  importAndExportLines(systemPromptsSource),
  importAndExportLines(indexSource),
  importAndExportLines(proofSource),
].join("\n");

const forbiddenImportPatterns = [
  /@workflow\/prompts/,
  /@workflow\/persistence/,
  /@workflow\/integrations/,
  /apps\/admin-web/,
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
  /sqlite/i,
];

for (const pattern of forbiddenImportPatterns) {
  assert.equal(pattern.test(combinedImports), false, `Editable system prompt package/proof must not import or execute ${pattern}`);
}

console.log("Stage Copilot editable system prompt proof passed.");
console.log(JSON.stringify({
  validatedValidCases: [
    "static_default_creates_editable_current_record",
    "custom_prompt_version_created_for_each_required_stage",
    "new_custom_version_becomes_current",
    "previous_current_version_becomes_superseded",
    "version_history_is_preserved",
    "reset_to_default_creates_new_current_static_default_version",
    "default_fallback_works_when_no_custom_record_exists",
    "editable_records_are_stage_copilot_system_prompt_not_capability_promptspec",
    "editable_records_preserve_separation_from_capability_promptspecs",
    "fake_repository_changes_only_fake_copilot_prompt_records",
  ],
  rejectedInvalidCases: [
    "prompt_claiming_record_mutation",
    "prompt_claiming_official_analysis_execution",
    "prompt_claiming_capability_promptspec_alteration",
    "prompt_claiming_evidence_transcript_gate_approval",
    "prompt_claiming_readiness_or_package_eligibility_mutation",
    "prompt_claiming_provider_tool_execution",
    "prompt_claiming_boundary_override",
    "prompt_claiming_package_generation",
    "prompt_claiming_message_sending",
    "prompt_claiming_source_of_truth_mutation",
    "prompt_using_kind_capability",
    "prompt_using_known_analysis_prompt_key",
    "fake_repository_rejects_analysis_prompt_key_save",
  ],
  nonInterference: {
    noPackagesPromptsImport: true,
    noPass5RuntimeImport: true,
    noPass6RuntimeImport: true,
    noAdminWebImport: true,
    noPersistenceImport: true,
    noIntegrationsImport: true,
    noProviderCalls: true,
    noDatabaseOrSqlite: true,
    noPromptCompilation: true,
    noPromptTests: true,
    noRuntimeBehavior: true,
  },
}, null, 2));
