/**
 * Prompt registry — Pass 4 implementation.
 * Spec refs: §29.9 (Prompt Registry Contract), §30.6 (module purposes),
 *            §30.7 (Prompt Unit Definition Rule), §30.16 (Prompt-to-Contract Binding Rule).
 *
 * Architecture constraint: this package must not import from core-state or core-case.
 * Validation uses makeValidator<T> from @workflow/contracts (CLAUDE.md rule).
 */

import {
  validateStructuredPromptSpec,
  validatePromptRegistration,
  type PromptRegistration,
  type PromptRole,
  type StructuredPromptSpec,
} from "@workflow/contracts";
import type { PromptRecord, PromptRepository, StructuredPromptSpecRepository } from "@workflow/persistence";

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export type {
  PromptRegistration,
  PromptType,
  PromptRole,
  PromptStatus,
  StructuredPromptSpec,
  StructuredPromptSpecBlock,
} from "@workflow/contracts";

export const PASS3_HIERARCHY_PROMPT_MODULE = "pass3.hierarchy.draft" as const;
export const PASS3_SOURCE_TRIAGE_PROMPT_MODULE = "pass3.source_hierarchy.triage" as const;

// ---------------------------------------------------------------------------
// registerPrompt
// ---------------------------------------------------------------------------

export interface RegisterPromptResult {
  ok: true;
  prompt: PromptRecord;
}

export interface RegisterPromptError {
  ok: false;
  error: string;
}

export type RegisterPromptOutcome = RegisterPromptResult | RegisterPromptError;

/**
 * Validate a PromptRegistration payload, check for duplicate ID, and persist.
 * Returns the saved PromptRecord (with registeredAt) on success, or an error.
 */
export function registerPrompt(
  payload: unknown,
  repo: PromptRepository
): RegisterPromptOutcome {
  // Validate against JSON Schema via makeValidator<T>
  const result = validatePromptRegistration(payload);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    return {
      ok: false,
      error: `Invalid PromptRegistration: ${messages}`,
    };
  }

  const registration: PromptRegistration = result.value;

  // Duplicate-ID check
  const existing = repo.findById(registration.promptId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Prompt with id '${registration.promptId}' is already registered.`,
    };
  }

  const record: PromptRecord = {
    ...registration,
    registeredAt: new Date().toISOString(),
  };

  repo.save(record);
  return { ok: true, prompt: record };
}

// ---------------------------------------------------------------------------
// getPrompt
// ---------------------------------------------------------------------------

/**
 * Lookup a prompt by its promptId. Returns null if not found.
 */
export function getPrompt(
  promptId: string,
  repo: PromptRepository
): PromptRecord | null {
  return repo.findById(promptId);
}

// ---------------------------------------------------------------------------
// listPrompts
// ---------------------------------------------------------------------------

/**
 * Return all registered prompts.
 */
export function listPrompts(repo: PromptRepository): PromptRecord[] {
  return repo.findAll();
}

// ---------------------------------------------------------------------------
// listPromptsByRole
// ---------------------------------------------------------------------------

/**
 * Return prompts filtered by role (e.g. "system" or "user").
 * See OQ-001 in handoff/OPEN_QUESTIONS.md for the open question on role enum values.
 */
export function listPromptsByRole(
  role: PromptRole,
  repo: PromptRepository
): PromptRecord[] {
  return repo.findByRole(role);
}

// ---------------------------------------------------------------------------
// Authority / role classification helpers
// ---------------------------------------------------------------------------

/**
 * True when this prompt occupies the "system" LLM message role.
 * See OQ-001 for open question on whether these are the correct role values.
 */
export function isSystemPrompt(prompt: PromptRecord): boolean {
  return prompt.role === "system";
}

/**
 * True when this prompt occupies the "user" LLM message role.
 * See OQ-001 for open question on whether these are the correct role values.
 */
export function isUserPrompt(prompt: PromptRecord): boolean {
  return prompt.role === "user";
}

export interface Pass3HierarchyPromptInput {
  caseId: string;
  sessionId: string;
  primaryDepartment?: string;
  selectedUseCase?: string;
  pastedHierarchyText?: string;
  structuredContextSummary?: string;
}

export interface Pass3SourceTriagePromptInput {
  caseId: string;
  sessionId: string;
  primaryDepartment?: string;
  hierarchyNodesJson: string;
  sourcesJson: string;
}

export function defaultPass3HierarchyPromptSpec(now = new Date().toISOString()): StructuredPromptSpec {
  return {
    promptSpecId: "promptspec_pass3_hierarchy_draft_v1",
    linkedModule: PASS3_HIERARCHY_PROMPT_MODULE,
    purpose: "Draft a role-first hierarchy for admin correction and structural approval in Pass 3.",
    status: "active",
    version: 1,
    inputContractRef: "HierarchyIntakeRecord + optional StructuredContextRecord",
    outputContractRef: "HierarchyDraftRecord.nodes + HierarchyDraftRecord.secondaryRelationships",
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        blockId: "role_definition",
        label: "Role Definition",
        editable: true,
        body: "You are a hierarchy drafting assistant. You produce a draft organizational hierarchy for admin review.",
      },
      {
        blockId: "pass3_mission",
        label: "Pass 3 Mission",
        editable: true,
        body: "Use the provided Pass 3 intake/context to draft hierarchy nodes, primary parent links, optional secondary relationships, grouping layers, and uncertainty warnings.",
      },
      {
        blockId: "case_context_inputs",
        label: "Case Context Inputs",
        editable: true,
        body: "Use only the supplied case id, session id, primary department, selected use case, structured context summary, and pasted/uploaded hierarchy intake text.",
      },
      {
        blockId: "hierarchy_drafting_rules",
        label: "Hierarchy Drafting Rules",
        editable: true,
        body: "Create role-first nodes. Use stable nodeId values. Use primaryParentNodeId only when a primary reporting parent is visible. Use the approved grouping taxonomy exactly. If custom groupLayer is used, include customGroupLabel and optional customGroupReason.",
      },
      {
        blockId: "uncertainty_rules",
        label: "Uncertainty Rules",
        editable: true,
        body: "When a reporting relationship, grouping layer, or secondary relationship is unclear, use unknown values and add a warning. Do not invent missing structure.",
      },
      {
        blockId: "prohibitions",
        label: "Prohibitions",
        editable: true,
        body: "Do not approve the hierarchy. Do not create participant targeting, rollout order, invitations, participant sessions, workflow analysis, synthesis/evaluation, or package generation. Do not treat source claims as workflow truth. Do not output email, phone, WhatsApp, preferred channel, targeting status, invitation status, or session status fields.",
      },
      {
        blockId: "output_schema_contract",
        label: "Output Schema / Contract",
        editable: true,
        body: "Return JSON only: {\"nodes\":[{\"nodeId\":\"string\",\"roleLabel\":\"string\",\"groupLayer\":\"approved_taxonomy_value\",\"customGroupLabel\":\"optional\",\"customGroupReason\":\"optional\",\"primaryParentNodeId\":\"optional\",\"personName\":\"optional\",\"employeeId\":\"optional\",\"internalIdentifier\":\"optional\",\"occupantOfRole\":\"optional\",\"candidateParticipantFlag\":false,\"personRoleConfidence\":\"high|medium|low|unknown\",\"notes\":\"optional\"}],\"secondaryRelationships\":[{\"relationshipId\":\"string\",\"fromNodeId\":\"string\",\"relatedNodeId\":\"string\",\"relationshipType\":\"approved_secondary_relationship_value\",\"relationshipScope\":\"string\",\"reasonOrNote\":\"string\",\"confidence\":\"high|medium|low|unknown\",\"sourceBasis\":\"pasted_text|uploaded_document|admin_entered|source_evidence_candidate|unknown\"}],\"warnings\":[\"string\"]}.",
      },
    ],
  };
}

export function ensureActivePass3HierarchyPromptSpec(repo: StructuredPromptSpecRepository): StructuredPromptSpec {
  const existing = repo.findActiveByLinkedModule(PASS3_HIERARCHY_PROMPT_MODULE);
  if (existing) return existing;
  const spec = defaultPass3HierarchyPromptSpec();
  const result = validateStructuredPromptSpec(spec);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid default Pass 3 PromptSpec: ${messages}`);
  }
  repo.save(spec);
  return spec;
}

export function compileStructuredPromptSpec(
  spec: StructuredPromptSpec,
  input: Pass3HierarchyPromptInput,
): string {
  const sections = spec.blocks.map((block) => `## ${block.label}\n${block.body}`).join("\n\n");
  const context = [
    `caseId: ${input.caseId}`,
    `sessionId: ${input.sessionId}`,
    `primaryDepartment: ${input.primaryDepartment ?? "unknown"}`,
    `selectedUseCase: ${input.selectedUseCase ?? "unknown"}`,
    `structuredContextSummary:\n${input.structuredContextSummary ?? "not provided"}`,
    `hierarchyIntakeText:\n${input.pastedHierarchyText ?? "not provided"}`,
  ].join("\n\n");

  return `${sections}\n\n## Runtime Case Context\n${context}`;
}

export function defaultPass3SourceTriagePromptSpec(now = new Date().toISOString()): StructuredPromptSpec {
  return {
    promptSpecId: "promptspec_pass3_source_hierarchy_triage_v1",
    linkedModule: PASS3_SOURCE_TRIAGE_PROMPT_MODULE,
    purpose: "Suggest tentative source-to-hierarchy relevance links for admin review in Pass 3.",
    status: "active",
    version: 1,
    inputContractRef: "IntakeSource[] + current HierarchyDraftRecord.nodes",
    outputContractRef: "SourceHierarchyTriageSuggestion[]",
    createdAt: now,
    updatedAt: now,
    blocks: [
      {
        blockId: "role_definition",
        label: "Role Definition",
        editable: true,
        body: "You are a Pass 3 source relevance triage assistant. You identify only tentative evidence-candidate links between intake sources and hierarchy scopes/nodes for admin review.",
      },
      {
        blockId: "mission",
        label: "Pass 3 Source Triage Mission",
        editable: true,
        body: "Analyze existing intake sources for hierarchy relevance signals. Suggest candidate links to company-wide context, department-wide context, team/unit, role-specific node, person/occupant, system/queue, approval/control node, external interface, or unknown/needs review.",
      },
      {
        blockId: "signal_and_scope_rules",
        label: "Signal And Scope Rules",
        editable: true,
        body: "Use only these signalType values: role_name_signal, department_scope_signal, kpi_or_target_signal, responsibility_signal, approval_or_authority_signal, system_or_queue_signal, person_name_signal, cross_functional_signal, external_interface_signal, unclear_scope_signal. Use only these suggestedScope values: company_wide, department_wide, team_or_unit, role_specific, person_or_occupant, system_or_queue, approval_or_control_node, external_interface, unknown_needs_review.",
      },
      {
        blockId: "evidence_candidate_rules",
        label: "Evidence Candidate Rules",
        editable: true,
        body: "All suggestions are evidence candidates only. Default evidenceStatus to document_claim_only. Set participantValidationNeeded true for KPI/target, responsibility, approval/authority, or unclear practice claims. Ask an adminReviewQuestion that distinguishes documented/formal claims from actual practice.",
      },
      {
        blockId: "prohibitions",
        label: "Prohibitions",
        editable: true,
        body: "Do not treat source claims as workflow truth. Do not validate SOPs, KPIs, policies, responsibilities, or actual practice. Do not create participant targeting, rollout order, invitations, participant sessions, workflow analysis, reference suitability scoring, synthesis/evaluation, or package generation.",
      },
      {
        blockId: "output_schema_contract",
        label: "Output Schema / Contract",
        editable: true,
        body: "Return JSON only: {\"suggestions\":[{\"sourceId\":\"string\",\"sourceName\":\"string\",\"suggestedScope\":\"approved_scope_value\",\"linkedNodeId\":\"optional existing nodeId only\",\"linkedScopeLevel\":\"optional approved_scope_value\",\"signalType\":\"approved_signal_type\",\"suggestedReason\":\"string\",\"confidence\":\"high|medium|low|unknown\",\"evidenceStatus\":\"document_claim_only\",\"participantValidationNeeded\":true,\"adminReviewQuestion\":\"string\"}],\"warnings\":[\"string\"]}. Do not include participant_confirmed_later or contradicted_by_reality_later.",
      },
    ],
  };
}

export function ensureActivePass3SourceTriagePromptSpec(repo: StructuredPromptSpecRepository): StructuredPromptSpec {
  const existing = repo.findActiveByLinkedModule(PASS3_SOURCE_TRIAGE_PROMPT_MODULE);
  if (existing) return existing;
  const spec = defaultPass3SourceTriagePromptSpec();
  const result = validateStructuredPromptSpec(spec);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid default Pass 3 source triage PromptSpec: ${messages}`);
  }
  repo.save(spec);
  return spec;
}

export function compilePass3SourceTriagePromptSpec(
  spec: StructuredPromptSpec,
  input: Pass3SourceTriagePromptInput,
): string {
  const sections = spec.blocks.map((block) => `## ${block.label}\n${block.body}`).join("\n\n");
  const context = [
    `caseId: ${input.caseId}`,
    `sessionId: ${input.sessionId}`,
    `primaryDepartment: ${input.primaryDepartment ?? "unknown"}`,
    `hierarchyNodesJson:\n${input.hierarchyNodesJson}`,
    `sourcesJson:\n${input.sourcesJson}`,
  ].join("\n\n");

  return `${sections}\n\n## Runtime Source Triage Context\n${context}`;
}
