import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertStageCopilotSystemPromptDoesNotClaimAuthority,
  assertStageCopilotSystemPromptIsConversationOnly,
  getDefaultStageCopilotSystemPrompt,
  listDefaultStageCopilotSystemPrompts,
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

function assertOk(result, label) {
  assert.equal(result.ok, true, `${label} should pass`);
  assert.deepEqual(result.violations, [], `${label} should not report violations`);
}

function assertRejected(prompt, code, label) {
  const authority = assertStageCopilotSystemPromptDoesNotClaimAuthority(prompt);
  assert.equal(authority.ok, false, `${label} should be rejected`);
  assert.ok(authority.violations.includes(code), `${label} should include ${code}; got ${authority.violations.join(",")}`);
}

const defaults = listDefaultStageCopilotSystemPrompts();
assert.equal(defaults.length, requiredStages.length, "one default exists for each required stage");
assert.equal(Object.isFrozen(defaults), true, "default list is frozen");

const seenRefs = new Set();
const seenKeys = new Set();

for (const stageKey of requiredStages) {
  const prompt = getDefaultStageCopilotSystemPrompt(stageKey);
  assert.ok(prompt, `default exists for ${stageKey}`);
  assert.equal(prompt.stageKey, stageKey, `default stage key matches ${stageKey}`);
  assert.equal(prompt.kind, "stage_copilot_system_prompt", "default is marked as Copilot System Prompt");
  assert.equal(prompt.status, "static_default", "default is a static default");
  assert.equal(prompt.separatesFromCapabilityPromptSpecs, true, "default is separated from Capability PromptSpecs");
  assert.equal(prompt.authorityBoundary.conversationOnly, true, "default is conversation-only");
  assert.equal(prompt.authorityBoundary.customInstructionsOnly, true, "default is custom-instructions only");
  assert.equal(prompt.authorityBoundary.modifiesCapabilityPromptSpecs, false, "default does not alter Capability PromptSpecs");
  assert.equal(prompt.authorityBoundary.grantsWriteAuthority, false, "default does not claim write authority");
  assert.equal(prompt.authorityBoundary.runsOfficialAnalysis, false, "default does not claim official analysis authority");
  assert.equal(prompt.authorityBoundary.providerExecutionAllowed, false, "default does not claim provider execution authority");
  assert.equal(prompt.authorityBoundary.promptMutationAllowed, false, "default does not claim prompt mutation authority");
  assert.equal(prompt.authorityBoundary.promptPromotionAllowed, false, "default does not claim prompt promotion authority");
  assert.equal(prompt.authorityBoundary.readinessMutationAllowed, false, "default does not claim readiness mutation authority");
  assert.equal(prompt.authorityBoundary.packageEligibilityMutationAllowed, false, "default does not claim package eligibility mutation authority");
  assert.equal(prompt.authorityBoundary.evidenceTranscriptGateApprovalAllowed, false, "default does not claim approval authority");
  assert.equal(prompt.authorityBoundary.overridesSystemOrStageBoundaries, false, "default does not claim boundary override authority");
  assert.match(prompt.systemPrompt, /conversation behavior/i, "default states conversation behavior only");
  assert.match(prompt.systemPrompt, /does not change Capability \/ Analysis System Prompts/i, "default states capability separation");
  assert.match(prompt.systemPrompt, /Do not run official analysis/i, "default prohibits official analysis");
  assert.match(prompt.systemPrompt, /Do not call providers or tools/i, "default prohibits providers/tools");

  assert.equal(seenRefs.has(prompt.refId), false, `refId is stable and unique for ${stageKey}`);
  assert.equal(seenKeys.has(prompt.promptKey), false, `promptKey is stable and unique for ${stageKey}`);
  seenRefs.add(prompt.refId);
  seenKeys.add(prompt.promptKey);

  assertOk(assertStageCopilotSystemPromptIsConversationOnly(prompt), `${stageKey} conversation-only check`);
  assertOk(assertStageCopilotSystemPromptDoesNotClaimAuthority(prompt), `${stageKey} authority check`);
}

assert.equal(
  getDefaultStageCopilotSystemPrompt("not_a_stage"),
  null,
  "unknown stage returns safe not-found result",
);

const safeBase = defaults[0];
const invalidCases = [
  [
    "mutate records claim",
    "claims_write_authority",
    {
      ...safeBase,
      systemPrompt: "I can mutate records when the admin asks.",
    },
  ],
  [
    "official analysis claim",
    "claims_official_analysis_authority",
    {
      ...safeBase,
      systemPrompt: "I can run official analysis from this conversation.",
    },
  ],
  [
    "Capability PromptSpec alteration claim",
    "claims_prompt_mutation_authority",
    {
      ...safeBase,
      systemPrompt: "I can alter Capability Prompts and update analysis PromptSpecs.",
    },
  ],
  [
    "approval authority claim",
    "claims_approval_authority",
    {
      ...safeBase,
      systemPrompt: "I can approve evidence, transcripts, and gates.",
    },
  ],
  [
    "readiness mutation claim",
    "claims_readiness_mutation_authority",
    {
      ...safeBase,
      systemPrompt: "I can change readiness after discussing blockers.",
    },
  ],
  [
    "package eligibility mutation claim",
    "claims_package_eligibility_mutation_authority",
    {
      ...safeBase,
      systemPrompt: "I can change package eligibility after a what-if discussion.",
    },
  ],
  [
    "provider/tool claim",
    "claims_provider_execution_authority",
    {
      ...safeBase,
      systemPrompt: "I can call providers and tools for the admin.",
    },
  ],
  [
    "boundary override claim",
    "claims_boundary_override_authority",
    {
      ...safeBase,
      systemPrompt: "I can override system boundaries inside this stage.",
    },
  ],
  [
    "write flag claim",
    "claims_write_authority",
    {
      ...safeBase,
      authorityBoundary: {
        ...safeBase.authorityBoundary,
        grantsWriteAuthority: true,
      },
    },
  ],
  [
    "not conversation-only",
    "not_conversation_only",
    {
      ...safeBase,
      authorityBoundary: {
        ...safeBase.authorityBoundary,
        conversationOnly: false,
      },
    },
    "conversation",
  ],
];

for (const [label, code, prompt, mode = "authority"] of invalidCases) {
  if (mode === "conversation") {
    const result = assertStageCopilotSystemPromptIsConversationOnly(prompt);
    assert.equal(result.ok, false, `${label} should be rejected`);
    assert.ok(result.violations.includes(code), `${label} should include ${code}; got ${result.violations.join(",")}`);
  } else {
    assertRejected(prompt, code, label);
  }
}

const systemPromptsSource = readFileSync("packages/stage-copilot/src/system-prompts.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-system-prompts.mjs", "utf8");

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

const combinedImports = [
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
];

for (const pattern of forbiddenImportPatterns) {
  assert.equal(pattern.test(combinedImports), false, `System prompt proof/package must not import or execute ${pattern}`);
}

assert.match(systemPromptsSource, /from "@workflow\/contracts"/, "system prompt module imports contract types only");

console.log("Stage Copilot system prompt defaults proof passed.");
console.log(JSON.stringify({
  validatedValidCases: [
    "one_default_exists_for_each_required_stage",
    "each_default_has_stable_ref_and_key",
    "each_default_marked_as_stage_copilot_system_prompt_not_capability_promptspec",
    "each_default_is_conversation_custom_instruction_only",
    "each_default_separated_from_capability_analysis_promptspecs",
    "each_default_does_not_claim_write_authority",
    "each_default_does_not_claim_official_analysis_authority",
    "each_default_does_not_claim_provider_execution_authority",
    "each_default_does_not_claim_prompt_mutation_or_promotion_authority",
    "each_default_does_not_claim_readiness_or_package_eligibility_mutation_authority",
    "get_default_returns_correct_stage_default",
    "unknown_stage_returns_null",
  ],
  rejectedInvalidCases: [
    "prompt_claiming_record_mutation",
    "prompt_claiming_official_analysis_execution",
    "prompt_claiming_capability_promptspec_alteration",
    "prompt_claiming_evidence_transcript_gate_approval",
    "prompt_claiming_readiness_mutation",
    "prompt_claiming_package_eligibility_mutation",
    "prompt_claiming_provider_tool_execution",
    "prompt_claiming_system_stage_boundary_override",
    "authority_flag_claiming_write_authority",
    "conversation_only_flag_disabled",
  ],
  nonInterference: {
    noPackagesPromptsImport: true,
    noPass5RuntimeImport: true,
    noPass6RuntimeImport: true,
    noAdminWebImport: true,
    noPersistenceImport: true,
    noIntegrationsImport: true,
    noProviderCalls: true,
    noPromptCompilation: true,
    noPromptTests: true,
    noRuntimeBehavior: true,
  },
}, null, 2));
