import type { StageCopilotStageKey } from "@workflow/contracts";
import {
  assertStageCopilotSystemPromptDoesNotClaimAuthority,
  getDefaultStageCopilotSystemPrompt,
  type StageCopilotSystemPromptAuthorityBoundary,
  type StageCopilotSystemPromptDefault,
  type StageCopilotSystemPromptKind,
  type StageCopilotSystemPromptStageKey,
  type StageCopilotSystemPromptViolationCode,
} from "./system-prompts.js";

export type EditableStageCopilotSystemPromptStatus = "current" | "superseded";
export type StageCopilotSystemPromptSource = "static_default" | "admin_custom";
export type StageCopilotSystemPromptChangeReason = "initial_default" | "admin_custom_save" | "reset_to_default";

export type EditableStageCopilotSystemPromptViolationCode =
  | StageCopilotSystemPromptViolationCode
  | "invalid_status"
  | "invalid_source"
  | "invalid_version"
  | "missing_default_ref"
  | "known_analysis_prompt_key_not_allowed"
  | "claims_package_generation_authority"
  | "claims_message_sending_authority"
  | "claims_source_of_truth_mutation_authority";

export interface EditableStageCopilotSystemPromptCheck {
  ok: boolean;
  violations: EditableStageCopilotSystemPromptViolationCode[];
}

export interface StageCopilotSystemPromptAuditMetadata {
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  changeNote: string;
  changeReason: StageCopilotSystemPromptChangeReason;
}

export interface StageCopilotSystemPromptVersion {
  version: number;
  source: StageCopilotSystemPromptSource;
  status: EditableStageCopilotSystemPromptStatus;
  systemPrompt: string;
  audit: StageCopilotSystemPromptAuditMetadata;
}

export interface EditableStageCopilotSystemPromptRecord {
  systemPromptId: string;
  stageKey: StageCopilotSystemPromptStageKey;
  promptKey: string;
  kind: StageCopilotSystemPromptKind;
  status: EditableStageCopilotSystemPromptStatus;
  version: number;
  systemPrompt: string;
  source: StageCopilotSystemPromptSource;
  defaultRefId: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  changeNote: string;
  separatesFromCapabilityPromptSpecs: true;
  authorityBoundary: StageCopilotSystemPromptAuthorityBoundary;
}

export interface CreateEditableStageCopilotSystemPromptInput {
  defaultPrompt: StageCopilotSystemPromptDefault;
  now: string;
  actorId: string;
  changeNote?: string;
}

export interface CreateNextStageCopilotSystemPromptVersionInput {
  current: EditableStageCopilotSystemPromptRecord;
  systemPrompt: string;
  now: string;
  actorId: string;
  changeNote: string;
}

export interface StageCopilotSystemPromptVersionTransition {
  current: EditableStageCopilotSystemPromptRecord;
  supersededPrevious?: EditableStageCopilotSystemPromptRecord;
}

const knownAnalysisPromptKeys = new Set<string>([
  "admin_assistant_prompt",
  "pass5.admin_assistant",
  "pass6_analysis_copilot",
  "pass5_participant_session_prompt_family",
  "PASS5_PROMPT_FAMILY",
  "PASS6_PROMPT_CAPABILITY_KEYS",
]);

const extraAuthorityClaimPatterns: readonly [EditableStageCopilotSystemPromptViolationCode, RegExp][] = [
  ["claims_package_generation_authority", /\b(can|may|will|should|allowed to)\s+(generate|create|draft)\s+packages?\b/i],
  ["claims_message_sending_authority", /\b(can|may|will|should|allowed to)\s+send\s+messages?\b/i],
  ["claims_source_of_truth_mutation_authority", /\b(can|may|will|should|allowed to)\s+(alter|change|mutate|modify|update)\s+source-of-truth\s+records?\b/i],
];

function uniqueViolations(
  violations: EditableStageCopilotSystemPromptViolationCode[],
): EditableStageCopilotSystemPromptCheck {
  return {
    ok: violations.length === 0,
    violations: [...new Set(violations)],
  };
}

function editablePromptKey(stageKey: StageCopilotStageKey): string {
  return `${stageKey}.copilot_system_prompt.custom`;
}

function editablePromptId(stageKey: StageCopilotStageKey, version: number): string {
  return `${stageKey}-copilot-system-prompt-v${version}`;
}

function supersede(record: EditableStageCopilotSystemPromptRecord, now: string, actorId: string): EditableStageCopilotSystemPromptRecord {
  return Object.freeze({
    ...record,
    status: "superseded",
    updatedAt: now,
    updatedBy: actorId,
  });
}

export function assertEditableStageCopilotSystemPromptDoesNotClaimAuthority(
  record: Pick<EditableStageCopilotSystemPromptRecord, "authorityBoundary" | "systemPrompt">,
): EditableStageCopilotSystemPromptCheck {
  const base = assertStageCopilotSystemPromptDoesNotClaimAuthority(record);
  const violations: EditableStageCopilotSystemPromptViolationCode[] = [...base.violations];

  for (const [violation, pattern] of extraAuthorityClaimPatterns) {
    if (pattern.test(record.systemPrompt)) violations.push(violation);
  }

  return uniqueViolations(violations);
}

export function validateEditableStageCopilotSystemPromptRecord(
  record: EditableStageCopilotSystemPromptRecord,
): EditableStageCopilotSystemPromptCheck {
  const violations: EditableStageCopilotSystemPromptViolationCode[] = [];

  if (record.kind !== "stage_copilot_system_prompt") violations.push("not_stage_copilot_system_prompt");
  if (record.status !== "current" && record.status !== "superseded") violations.push("invalid_status");
  if (record.source !== "static_default" && record.source !== "admin_custom") violations.push("invalid_source");
  if (!Number.isInteger(record.version) || record.version < 1) violations.push("invalid_version");
  if (record.defaultRefId.length === 0) violations.push("missing_default_ref");
  if (record.separatesFromCapabilityPromptSpecs !== true) violations.push("not_separated_from_capability_prompts");
  if (knownAnalysisPromptKeys.has(record.promptKey)) violations.push("known_analysis_prompt_key_not_allowed");

  const authority = assertEditableStageCopilotSystemPromptDoesNotClaimAuthority(record);
  violations.push(...authority.violations);

  return uniqueViolations(violations);
}

export function createEditableStageCopilotSystemPromptFromDefault(
  input: CreateEditableStageCopilotSystemPromptInput,
): EditableStageCopilotSystemPromptRecord {
  const record: EditableStageCopilotSystemPromptRecord = Object.freeze({
    systemPromptId: editablePromptId(input.defaultPrompt.stageKey, 1),
    stageKey: input.defaultPrompt.stageKey as StageCopilotSystemPromptStageKey,
    promptKey: editablePromptKey(input.defaultPrompt.stageKey),
    kind: "stage_copilot_system_prompt",
    status: "current",
    version: 1,
    systemPrompt: input.defaultPrompt.systemPrompt,
    source: "static_default",
    defaultRefId: input.defaultPrompt.refId,
    createdAt: input.now,
    createdBy: input.actorId,
    updatedAt: input.now,
    updatedBy: input.actorId,
    changeNote: input.changeNote ?? "Initialized from static default.",
    separatesFromCapabilityPromptSpecs: true,
    authorityBoundary: input.defaultPrompt.authorityBoundary,
  });

  const validation = validateEditableStageCopilotSystemPromptRecord(record);
  if (!validation.ok) {
    throw new Error(`Invalid editable Stage Copilot System Prompt default record: ${validation.violations.join(", ")}`);
  }
  return record;
}

export function createNextStageCopilotSystemPromptVersion(
  input: CreateNextStageCopilotSystemPromptVersionInput,
): StageCopilotSystemPromptVersionTransition {
  const supersededPrevious = supersede(input.current, input.now, input.actorId);
  const next: EditableStageCopilotSystemPromptRecord = Object.freeze({
    ...input.current,
    systemPromptId: editablePromptId(input.current.stageKey, input.current.version + 1),
    status: "current",
    version: input.current.version + 1,
    systemPrompt: input.systemPrompt,
    source: "admin_custom",
    updatedAt: input.now,
    updatedBy: input.actorId,
    changeNote: input.changeNote,
  });

  const validation = validateEditableStageCopilotSystemPromptRecord(next);
  if (!validation.ok) {
    throw new Error(`Invalid editable Stage Copilot System Prompt custom record: ${validation.violations.join(", ")}`);
  }

  return Object.freeze({ current: next, supersededPrevious });
}

export function resetStageCopilotSystemPromptToDefault(input: {
  current: EditableStageCopilotSystemPromptRecord;
  now: string;
  actorId: string;
  changeNote: string;
}): StageCopilotSystemPromptVersionTransition {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt(input.current.stageKey);
  if (!defaultPrompt) {
    throw new Error(`No static Stage Copilot System Prompt default for stage '${input.current.stageKey}'.`);
  }

  const supersededPrevious = supersede(input.current, input.now, input.actorId);
  const next: EditableStageCopilotSystemPromptRecord = Object.freeze({
    ...input.current,
    systemPromptId: editablePromptId(input.current.stageKey, input.current.version + 1),
    status: "current",
    version: input.current.version + 1,
    systemPrompt: defaultPrompt.systemPrompt,
    source: "static_default",
    defaultRefId: defaultPrompt.refId,
    updatedAt: input.now,
    updatedBy: input.actorId,
    changeNote: input.changeNote,
    authorityBoundary: defaultPrompt.authorityBoundary,
  });

  const validation = validateEditableStageCopilotSystemPromptRecord(next);
  if (!validation.ok) {
    throw new Error(`Invalid editable Stage Copilot System Prompt reset record: ${validation.violations.join(", ")}`);
  }

  return Object.freeze({ current: next, supersededPrevious });
}

export function getCurrentStageCopilotSystemPrompt(
  records: readonly EditableStageCopilotSystemPromptRecord[],
  stageKey: StageCopilotSystemPromptStageKey,
): EditableStageCopilotSystemPromptRecord | StageCopilotSystemPromptDefault | null {
  const current = records
    .filter((record) => record.stageKey === stageKey && record.status === "current")
    .sort((a, b) => b.version - a.version)[0];
  return current ?? getDefaultStageCopilotSystemPrompt(stageKey);
}
