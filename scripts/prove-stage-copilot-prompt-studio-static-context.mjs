import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  PROMPT_STUDIO_STATIC_CONTEXT_BOUNDARY_STATUS,
  assertStageCopilotContextEnvelopeReadOnly,
  createPromptStudioCopilotContextEnvelope,
  createPromptStudioStaticContextFixture,
  createStageCopilotContextEnvelope,
  isStageCopilotContextEnvelopeSafe,
  summarizePromptStudioCopilotContext,
  summarizeStageCopilotContextEnvelope,
} from "../packages/stage-copilot/dist/index.js";

function assertOk(result, label) {
  assert.equal(result.ok, true, `${label} should pass`);
  assert.deepEqual(result.violations, [], `${label} should not report violations`);
}

function assertRejected(input, code, label) {
  const result = assertStageCopilotContextEnvelopeReadOnly(input);
  assert.equal(result.ok, false, `${label} should be rejected`);
  assert.ok(result.violations.includes(code), `${label} should include ${code}; got ${result.violations.join(",")}`);
  assert.equal(isStageCopilotContextEnvelopeSafe(input), false, `${label} should not be safe`);
  assert.throws(() => createStageCopilotContextEnvelope(input), /Unsafe Stage Copilot context envelope/);
}

function withBoundaryOverride(boundaryOverride) {
  const base = createPromptStudioStaticContextFixture();
  return {
    ...base,
    boundaryStatus: {
      ...base.boundaryStatus,
      ...boundaryOverride,
    },
  };
}

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

// Valid cases.
const fixture = createPromptStudioStaticContextFixture();
assert.equal(fixture.stageKey, "prompt_studio", "fixture stageKey is prompt_studio");
assert.deepEqual(fixture.boundaryStatus, PROMPT_STUDIO_STATIC_CONTEXT_BOUNDARY_STATUS);

const envelope = createPromptStudioCopilotContextEnvelope();
assert.equal(envelope.stageKey, "prompt_studio", "envelope stageKey is prompt_studio");
assert.equal(Object.isFrozen(envelope), true, "envelope is frozen");
assert.equal(Object.isFrozen(envelope.scopeRefs), true, "scope refs are frozen");

assertOk(assertStageCopilotContextEnvelopeReadOnly(fixture), "Prompt Studio static context fixture");
assert.equal(isStageCopilotContextEnvelopeSafe(fixture), true, "Prompt Studio static context fixture is safe");

const capabilityRefs = envelope.promptSpecRefs.filter((ref) => ref.kind === "capability");
assert.ok(capabilityRefs.length >= 3, "Capability / Analysis PromptSpec refs are represented");
assert.deepEqual(
  capabilityRefs.map((ref) => ref.refId),
  [
    "capability_prompt_ref:source_understanding",
    "capability_prompt_ref:evidence_extraction",
    "capability_prompt_ref:synthesis",
  ],
  "expected static capability prompt refs are present",
);
assert.ok(
  capabilityRefs.every((ref) => /Static Capability \/ Analysis PromptSpec reference only/.test(ref.notes ?? "")),
  "capability refs are reference-only",
);

const instructionRefs = envelope.systemKnowledgeRefs.filter((ref) => ref.refId.startsWith("stage_copilot_instruction_ref:"));
assert.deepEqual(
  instructionRefs.map((ref) => ref.refId),
  [
    "stage_copilot_instruction_ref:prompt_studio",
    "stage_copilot_instruction_ref:analysis_package",
  ],
  "Stage Copilot Instructions refs are represented",
);
assert.ok(
  instructionRefs.every((ref) => /Reference only/.test(ref.notes ?? "")),
  "Stage Copilot Instructions refs are reference-only",
);

assert.ok(
  envelope.systemKnowledgeRefs.some((ref) => ref.refId === "taxonomy_ref:capability_vs_stage_copilot"),
  "taxonomy/separation ref is present",
);
assert.ok(
  envelope.blockerWarningSummaries.some((warning) => warning.refId === "warning_ref:copilot_instruction_edits_are_not_analysis_prompt_edits"),
  "separation warning is present",
);
assert.ok(
  envelope.systemKnowledgeRefs.some((ref) => ref.refId === "warning_ref:copilot_instructions_do_not_change_analysis_prompts"),
  "system warning that Copilot Instructions do not change analysis prompts is present",
);

assert.equal(envelope.dataAccessStrategy.executionMode, "declarative_only", "data access is declarative only");
assert.equal(envelope.retrievalScope.executionMode, "declarative_only", "retrieval is declarative only");
assert.equal(envelope.boundaryStatus.providerExecutionAllowed, false, "provider execution is prohibited");
assert.equal(envelope.boundaryStatus.retrievalExecutionAllowed, false, "retrieval execution is prohibited");
assert.equal(envelope.boundaryStatus.databaseExecutionAllowed, false, "DB/repository execution is prohibited");
assert.equal(envelope.boundaryStatus.promptCompilationAllowed, false, "prompt compilation is prohibited");
assert.equal(envelope.boundaryStatus.promptMutationAllowed, false, "prompt mutation is prohibited");
assert.equal(envelope.boundaryStatus.officialAnalysisRerunAllowed, false, "official analysis rerun is prohibited");
assert.equal(envelope.boundaryStatus.packageEligibilityMutationAllowed, false, "package eligibility mutation is prohibited");
assert.equal(envelope.boundaryStatus.sourceOfTruthMutationAllowed, false, "source-of-truth mutation is prohibited");

const summaryA = summarizePromptStudioCopilotContext(envelope);
const summaryB = summarizePromptStudioCopilotContext(envelope);
const genericSummary = summarizeStageCopilotContextEnvelope(envelope);
assert.deepEqual(summaryA, summaryB, "Prompt Studio context summary is deterministic");
assert.deepEqual(summaryA, genericSummary, "Prompt Studio summary matches generic envelope summary");
assert.equal(summaryA.stageKey, "prompt_studio");
assert.equal(summaryA.readOnly, true);
assert.equal(summaryA.promptSpecRefCount, envelope.promptSpecRefs.length);
assert.equal(summaryA.warningCount, 1);

const unknownRefs = envelope.promptSpecRefs.filter((ref) => ref.kind === "unknown_or_unclassified");
assert.equal(unknownRefs.length, 1, "unknown/unclassified prompt ref can be represented");
assert.match(unknownRefs[0].notes ?? "", /reference-only/i);

// Invalid/safety cases.
assertRejected(withBoundaryOverride({ writesAllowed: true }), "write_authority_not_allowed", "write authority");
assertRejected(withBoundaryOverride({ readOnly: false }), "write_authority_not_allowed", "not read-only");
assertRejected(withBoundaryOverride({ providerExecutionAllowed: true }), "provider_execution_not_allowed", "provider execution");
assertRejected(withBoundaryOverride({ retrievalExecutionAllowed: true }), "retrieval_execution_not_allowed", "retrieval execution");
assertRejected(withBoundaryOverride({ databaseExecutionAllowed: true }), "database_execution_not_allowed", "DB execution");
assertRejected(withBoundaryOverride({ promptCompilationAllowed: true }), "prompt_compilation_not_allowed", "prompt compilation");
assertRejected(withBoundaryOverride({ promptMutationAllowed: true }), "prompt_mutation_not_allowed", "prompt mutation");
assertRejected(withBoundaryOverride({ officialAnalysisRerunAllowed: true }), "official_analysis_rerun_not_allowed", "official analysis rerun");
assertRejected(withBoundaryOverride({ packageEligibilityMutationAllowed: true }), "package_eligibility_mutation_not_allowed", "package eligibility mutation");
assertRejected(withBoundaryOverride({ sourceOfTruthMutationAllowed: true }), "source_of_truth_mutation_not_allowed", "source-of-truth mutation");
assertRejected({
  ...fixture,
  notes: () => "executable callback",
}, "executable_content_not_allowed", "executable callback content");

// Non-interference checks.
const fixtureSource = readFileSync("packages/stage-copilot/src/prompt-studio-context.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-prompt-studio-static-context.mjs", "utf8");
const combinedImports = [
  importAndExportLines(fixtureSource),
  importAndExportLines(indexSource),
  importAndExportLines(proofSource),
].join("\n");

const forbiddenImportPatterns = [
  /@workflow\/prompts/,
  /@workflow\/persistence/,
  /@workflow\/integrations/,
  /apps\/admin-web/,
  /participant-sessions/,
  /synthesis-evaluation/,
  /packages-output/,
  /runPass6Copilot/,
  /runAdminAssistantQuestion/,
  /compilePass5Prompt/,
  /compilePass6PromptSpec/,
  /compileStructuredPromptSpec/,
  /runPrompt/,
  /PromptTest/,
  /providerRegistry/,
  /getPromptTextProvider/,
];

for (const pattern of forbiddenImportPatterns) {
  assert.equal(pattern.test(combinedImports), false, `Prompt Studio static context fixture/proof must not import or execute ${pattern}`);
}

assert.equal(/from "@workflow\/contracts"/.test(fixtureSource), true, "fixture imports contract types only from workspace packages");
assert.equal(/from "\.\/context-envelope\.js"/.test(fixtureSource), true, "fixture uses local context envelope helpers");

console.log("Stage Copilot Prompt Studio static context proof passed.");
console.log(JSON.stringify({
  validatedSafeCases: [
    "prompt_studio_static_context_envelope_created",
    "stage_key_prompt_studio",
    "capability_prompt_refs_reference_only",
    "stage_copilot_instruction_refs_reference_only",
    "taxonomy_separation_warning_present",
    "read_only_boundary",
    "deterministic_summary",
    "assert_readonly_passes",
    "safe_check_passes",
    "unknown_unclassified_prompt_ref_reference_only",
  ],
  rejectedUnsafeCases: [
    "write_authority",
    "provider_execution",
    "retrieval_execution",
    "database_execution",
    "prompt_compilation",
    "prompt_mutation",
    "official_analysis_rerun",
    "package_eligibility_mutation",
    "source_of_truth_mutation",
    "executable_callback_content",
  ],
  nonInterference: [
    "no_packages_prompts_import",
    "no_pass5_runtime_import",
    "no_pass6_runtime_import",
    "no_admin_web_import",
    "no_persistence_import",
    "no_provider_import",
    "no_db_touch",
    "no_prompt_compile",
    "no_prompt_tests",
    "no_runtime_behavior",
    "no_environment_variables",
  ],
}, null, 2));
