import type { StageCopilotStageKey } from "@workflow/contracts";

export type StageCopilotSystemPromptKind = "stage_copilot_system_prompt";
export type StageCopilotSystemPromptStatus = "static_default";
export type StageCopilotSystemPromptStageKey = Exclude<StageCopilotStageKey, "future_finalization">;

export type StageCopilotSystemPromptViolationCode =
  | "not_stage_copilot_system_prompt"
  | "not_conversation_only"
  | "not_separated_from_capability_prompts"
  | "claims_write_authority"
  | "claims_official_analysis_authority"
  | "claims_provider_execution_authority"
  | "claims_prompt_mutation_authority"
  | "claims_readiness_mutation_authority"
  | "claims_package_eligibility_mutation_authority"
  | "claims_approval_authority"
  | "claims_boundary_override_authority";

export interface StageCopilotSystemPromptCheck {
  ok: boolean;
  violations: StageCopilotSystemPromptViolationCode[];
}

export interface StageCopilotSystemPromptRef {
  refId: string;
  promptKey: string;
  stageKey: StageCopilotStageKey;
  kind: StageCopilotSystemPromptKind;
  status: StageCopilotSystemPromptStatus;
  displayName: string;
  separatesFromCapabilityPromptSpecs: true;
}

export interface StageCopilotSystemPromptAuthorityBoundary {
  conversationOnly: true;
  customInstructionsOnly: true;
  modifiesCapabilityPromptSpecs: false;
  grantsWriteAuthority: false;
  runsOfficialAnalysis: false;
  providerExecutionAllowed: false;
  promptMutationAllowed: false;
  promptPromotionAllowed: false;
  readinessMutationAllowed: false;
  packageEligibilityMutationAllowed: false;
  evidenceTranscriptGateApprovalAllowed: false;
  overridesSystemOrStageBoundaries: false;
}

export interface StageCopilotSystemPromptDefault extends StageCopilotSystemPromptRef {
  authorityBoundary: StageCopilotSystemPromptAuthorityBoundary;
  systemPrompt: string;
  notes?: string;
}

const REQUIRED_STAGE_KEYS: readonly StageCopilotSystemPromptStageKey[] = [
  "sources_context",
  "hierarchy",
  "targeting",
  "participant_evidence",
  "analysis_package",
  "prompt_studio",
  "advanced_debug",
];

const authorityBoundary: StageCopilotSystemPromptAuthorityBoundary = Object.freeze({
  conversationOnly: true,
  customInstructionsOnly: true,
  modifiesCapabilityPromptSpecs: false,
  grantsWriteAuthority: false,
  runsOfficialAnalysis: false,
  providerExecutionAllowed: false,
  promptMutationAllowed: false,
  promptPromotionAllowed: false,
  readinessMutationAllowed: false,
  packageEligibilityMutationAllowed: false,
  evidenceTranscriptGateApprovalAllowed: false,
  overridesSystemOrStageBoundaries: false,
});

const stageLabels: Record<StageCopilotStageKey, string> = {
  sources_context: "Pass 2 / Sources & Context Copilot",
  hierarchy: "Pass 3 / Hierarchy Copilot",
  targeting: "Pass 4 / Targeting Copilot",
  participant_evidence: "Pass 5 / Participant Evidence Copilot",
  analysis_package: "Pass 6 / Analysis / Package Copilot",
  prompt_studio: "Prompt Studio Copilot",
  advanced_debug: "Advanced / Debug Copilot",
  future_finalization: "Future Finalization Copilot",
};

const stageFocus: Record<StageCopilotSystemPromptStageKey, string> = {
  sources_context: "source usefulness, context boundaries, source-role reasoning, missing source evidence, and source-origin explanations",
  hierarchy: "role hierarchy reasoning, inferred versus confirmed structure, source-to-role links, reporting lines, and interface alternatives",
  targeting: "participant targeting choices, coverage gaps, question-hint origins, contact readiness, and sequencing alternatives",
  participant_evidence: "participant statements, transcript and evidence references, clarification gaps, disputes, boundary signals, and safe next questions",
  analysis_package: "analysis method and lens explanations, readiness blockers, caveats, evidence basis, package risk, and advisory what-if alternatives",
  prompt_studio: "the separation between Capability PromptSpecs and Copilot System Prompts, prompt test result interpretation, and prompt-edit risk",
  advanced_debug: "debug/proof/provider-job interpretation, route ownership, operational diagnostics, and debug-only versus business-authoritative outputs",
};

function systemPromptFor(stageKey: StageCopilotSystemPromptStageKey): string {
  const label = stageLabels[stageKey];
  const focus = stageFocus[stageKey];
  return [
    `You are the ${label}.`,
    "This Stage Copilot System Prompt controls conversation behavior and custom-instruction style only.",
    "It does not change Capability / Analysis System Prompts, PromptSpecs, prompt families, prompt keys, or official analysis behavior.",
    `Stay inside this stage boundary and help the admin discuss ${focus}.`,
    "You may explain, discuss, compare, critique, identify uncertainty, ask clarifying questions, and recommend safe routed next steps inside the stage.",
    "Separate recommendations from decisions. The admin or governed product surface makes decisions.",
    "Do not grant write authority. Do not mutate records. Do not run official analysis. Do not call providers or tools.",
    "Do not change readiness, package eligibility, evidence trust, package output, or source-of-truth records.",
    "Do not approve evidence, transcripts, gates, prompts, packages, or release actions.",
    "System, stage, and guardrail boundaries override this prompt.",
  ].join("\n");
}

function defaultFor(stageKey: StageCopilotSystemPromptStageKey): StageCopilotSystemPromptDefault {
  return Object.freeze({
    refId: `${stageKey}-copilot-system-prompt-default`,
    promptKey: `${stageKey}.copilot_system_prompt.default`,
    stageKey,
    kind: "stage_copilot_system_prompt",
    status: "static_default",
    displayName: `${stageLabels[stageKey]} System Prompt Default`,
    separatesFromCapabilityPromptSpecs: true,
    authorityBoundary,
    systemPrompt: systemPromptFor(stageKey),
    notes: "Static starter default only. Future operator/admin edits must remain separate from Capability / Analysis PromptSpecs.",
  });
}

const DEFAULT_STAGE_COPILOT_SYSTEM_PROMPTS: readonly StageCopilotSystemPromptDefault[] = Object.freeze(
  REQUIRED_STAGE_KEYS.map((stageKey) => defaultFor(stageKey)),
);

const positiveAuthorityClaimPatterns: readonly [StageCopilotSystemPromptViolationCode, RegExp][] = [
  ["claims_write_authority", /\b(can|may|will|should|allowed to)\s+(mutate|write|update|delete|alter)\s+(records?|source-of-truth|state)\b/i],
  ["claims_official_analysis_authority", /\b(can|may|will|should|allowed to)\s+(run|rerun|execute)\s+official\s+analysis\b/i],
  ["claims_provider_execution_authority", /\b(can|may|will|should|allowed to)\s+(call|run|execute)\s+(providers?|tools?)\b/i],
  ["claims_prompt_mutation_authority", /\b(can|may|will|should|allowed to)\s+(alter|change|mutate|modify|promote)\s+(capability\s+)?prompts?/i],
  ["claims_readiness_mutation_authority", /\b(can|may|will|should|allowed to)\s+change\s+readiness\b/i],
  ["claims_package_eligibility_mutation_authority", /\b(can|may|will|should|allowed to)\s+change\s+package\s+eligibility\b/i],
  ["claims_approval_authority", /\b(can|may|will|should|allowed to)\s+approve\s+(evidence|transcripts?|gates?)\b/i],
  ["claims_boundary_override_authority", /\b(can|may|will|should|allowed to)\s+override\s+(system|stage|guardrail)\s+boundaries\b/i],
];

function uniqueViolations(
  violations: StageCopilotSystemPromptViolationCode[],
): StageCopilotSystemPromptCheck {
  return {
    ok: violations.length === 0,
    violations: [...new Set(violations)],
  };
}

export function listDefaultStageCopilotSystemPrompts(): readonly StageCopilotSystemPromptDefault[] {
  return DEFAULT_STAGE_COPILOT_SYSTEM_PROMPTS;
}

export function getDefaultStageCopilotSystemPrompt(
  stageKey: string,
): StageCopilotSystemPromptDefault | null {
  return DEFAULT_STAGE_COPILOT_SYSTEM_PROMPTS.find((prompt) => prompt.stageKey === stageKey) ?? null;
}

export function assertStageCopilotSystemPromptIsConversationOnly(
  prompt: Pick<StageCopilotSystemPromptDefault, "kind" | "separatesFromCapabilityPromptSpecs" | "authorityBoundary" | "systemPrompt">,
): StageCopilotSystemPromptCheck {
  const violations: StageCopilotSystemPromptViolationCode[] = [];
  const boundary = prompt.authorityBoundary;

  if (prompt.kind !== "stage_copilot_system_prompt") violations.push("not_stage_copilot_system_prompt");
  if (boundary.conversationOnly !== true || boundary.customInstructionsOnly !== true) {
    violations.push("not_conversation_only");
  }
  if (prompt.separatesFromCapabilityPromptSpecs !== true || boundary.modifiesCapabilityPromptSpecs !== false) {
    violations.push("not_separated_from_capability_prompts");
  }

  return uniqueViolations(violations);
}

export function assertStageCopilotSystemPromptDoesNotClaimAuthority(
  prompt: Pick<StageCopilotSystemPromptDefault, "authorityBoundary" | "systemPrompt">,
): StageCopilotSystemPromptCheck {
  const violations: StageCopilotSystemPromptViolationCode[] = [];
  const boundary = prompt.authorityBoundary;

  if (boundary.grantsWriteAuthority !== false) violations.push("claims_write_authority");
  if (boundary.runsOfficialAnalysis !== false) violations.push("claims_official_analysis_authority");
  if (boundary.providerExecutionAllowed !== false) violations.push("claims_provider_execution_authority");
  if (boundary.promptMutationAllowed !== false || boundary.promptPromotionAllowed !== false) {
    violations.push("claims_prompt_mutation_authority");
  }
  if (boundary.readinessMutationAllowed !== false) violations.push("claims_readiness_mutation_authority");
  if (boundary.packageEligibilityMutationAllowed !== false) {
    violations.push("claims_package_eligibility_mutation_authority");
  }
  if (boundary.evidenceTranscriptGateApprovalAllowed !== false) violations.push("claims_approval_authority");
  if (boundary.overridesSystemOrStageBoundaries !== false) violations.push("claims_boundary_override_authority");

  for (const [violation, pattern] of positiveAuthorityClaimPatterns) {
    if (pattern.test(prompt.systemPrompt)) violations.push(violation);
  }

  return uniqueViolations(violations);
}
