/**
 * Prompt registry — Pass 4 implementation.
 * Spec refs: §29.9 (Prompt Registry Contract), §30.6 (module purposes),
 *            §30.7 (Prompt Unit Definition Rule), §30.16 (Prompt-to-Contract Binding Rule).
 *
 * Architecture constraint: this package must not import from core-state or core-case.
 * Validation uses makeValidator<T> from @workflow/contracts (CLAUDE.md rule).
 */

import {
  validatePass3PromptTestRun,
  validatePass4PromptTestRun,
  validateStructuredPromptSpec,
  validatePromptRegistration,
  type Pass4PromptCapability,
  type Pass4PromptTestRun,
  type Pass3PromptCapability,
  type Pass3PromptTestRun,
  type PromptRegistration,
  type PromptRole,
  type StructuredPromptSpec,
  type StructuredPromptSpecBlock,
} from "@workflow/contracts";
import type { Pass3PromptTestRunRepository, PromptRecord, PromptRepository, StructuredPromptSpecRepository } from "@workflow/persistence";
import type { Pass4PromptTestRunRepository } from "@workflow/persistence";

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
  Pass3PromptCapability,
  Pass3PromptTestRun,
  Pass4PromptCapability,
  Pass4PromptTestRun,
} from "@workflow/contracts";

export const PASS3_HIERARCHY_PROMPT_MODULE = "pass3.hierarchy.draft" as const;
export const PASS3_SOURCE_TRIAGE_PROMPT_MODULE = "pass3.source_hierarchy.triage" as const;
export const PASS4_TARGETING_ROLLOUT_PROMPT_MODULE = "pass4.targeting_rollout.packet" as const;

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function validationMessage(errors: { message?: string }[]): string {
  return errors.map((e) => e.message ?? String(e)).join("; ");
}

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
        blockId: "prompt_metadata",
        label: "Prompt Metadata",
        editable: true,
        body: "Capability: hierarchy_draft. Lifecycle: draft saves are review-only until explicit admin promotion. Previous active versions must remain available for rollback/reference.",
      },
      {
        blockId: "role_definition",
        label: "Role Definition",
        editable: true,
        body: "You are a hierarchy drafting assistant. You produce a draft organizational hierarchy for admin review.",
      },
      {
        blockId: "mission_or_task_purpose",
        label: "Mission Or Task Purpose",
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
        blockId: "source_and_evidence_rules",
        label: "Source And Evidence Rules",
        editable: true,
        body: "Source references may only be treated as tentative evidence candidates. They are not workflow truth and must not validate responsibilities, KPIs, SOPs, policies, or actual practice.",
      },
      {
        blockId: "operating_instructions",
        label: "Operating Instructions",
        editable: true,
        body: "Create role-first nodes. Use stable nodeId values. Use primaryParentNodeId only when a primary reporting parent is visible. Use the approved grouping taxonomy exactly. If custom groupLayer is used, include customGroupLabel and optional customGroupReason.",
      },
      {
        blockId: "domain_terminology_lens",
        label: "Domain Terminology Lens",
        editable: true,
        body: "Interpret titles, layers, queues, shared services, committees, external interfaces, and approval/control roles as hierarchy structure only when the provided intake supports that classification.",
      },
      {
        blockId: "boundaries_and_prohibitions",
        label: "Boundaries And Prohibitions",
        editable: true,
        body: "Do not approve the hierarchy. Do not create participant targeting, rollout order, invitations, participant sessions, workflow analysis, synthesis/evaluation, or package generation. Do not output email, phone, WhatsApp, preferred channel, targeting status, invitation status, or session status fields.",
      },
      {
        blockId: "uncertainty_and_escalation_rules",
        label: "Uncertainty And Escalation Rules",
        editable: true,
        body: "When a reporting relationship, grouping layer, or secondary relationship is unclear, use unknown values and add a warning. Do not invent missing structure.",
      },
      {
        blockId: "examples_or_few_shot_cases",
        label: "Examples Or Few-Shot Cases",
        editable: true,
        body: "Example: a Sales Director over a Sales Manager with Supervisors and Sales roles should produce role-first nodes and visible primaryParentNodeId values only where reporting lines are reasonably inferable.",
      },
      {
        blockId: "admin_discussion_behavior",
        label: "Admin Discussion Behavior",
        editable: true,
        body: "Surface warnings for admin correction. Treat generated hierarchy as editable draft material, never as approved structure.",
      },
      {
        blockId: "evaluation_checklist",
        label: "Evaluation Checklist",
        editable: true,
        body: "Check that output contains no contact fields, no participant targeting, no rollout/session fields, no workflow-analysis claims, and uses only approved taxonomy values.",
      },
      {
        blockId: "test_cases_or_golden_inputs",
        label: "Test Cases Or Golden Inputs",
        editable: true,
        body: "Golden input: Sales Director; Sales Manager; 2 Supervisors; 3 Senior Sales; 2 Sales; 2 Account Managers; 2 Communicators.",
      },
      {
        blockId: "output_contract_or_schema",
        label: "Output Contract Or Schema",
        editable: true,
        body: "Return JSON only: {\"nodes\":[{\"nodeId\":\"string\",\"roleLabel\":\"string\",\"groupLayer\":\"approved_taxonomy_value\",\"customGroupLabel\":\"optional\",\"customGroupReason\":\"optional\",\"primaryParentNodeId\":\"optional\",\"personName\":\"optional\",\"employeeId\":\"optional\",\"internalIdentifier\":\"optional\",\"occupantOfRole\":\"optional\",\"candidateParticipantFlag\":false,\"personRoleConfidence\":\"high|medium|low|unknown\",\"notes\":\"optional\"}],\"secondaryRelationships\":[{\"relationshipId\":\"string\",\"fromNodeId\":\"string\",\"relatedNodeId\":\"string\",\"relationshipType\":\"approved_secondary_relationship_value\",\"relationshipScope\":\"string\",\"reasonOrNote\":\"string\",\"confidence\":\"high|medium|low|unknown\",\"sourceBasis\":\"pasted_text|uploaded_document|admin_entered|source_evidence_candidate|unknown\"}],\"warnings\":[\"string\"]}.",
      },
      {
        blockId: "version_and_activation_controls",
        label: "Version And Activation Controls",
        editable: true,
        body: "Draft edits must not become active automatically. Activation requires explicit admin promotion after review of compiled prompt preview and active-vs-draft test output.",
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
        blockId: "prompt_metadata",
        label: "Prompt Metadata",
        editable: true,
        body: "Capability: source_hierarchy_triage. Lifecycle: draft saves are review-only until explicit admin promotion. Previous active versions must remain available for rollback/reference.",
      },
      {
        blockId: "role_definition",
        label: "Role Definition",
        editable: true,
        body: "You are a Pass 3 source relevance triage assistant. You identify only tentative evidence-candidate links between intake sources and hierarchy scopes/nodes for admin review.",
      },
      {
        blockId: "mission_or_task_purpose",
        label: "Mission Or Task Purpose",
        editable: true,
        body: "Analyze existing intake sources for hierarchy relevance signals. Suggest candidate links to company-wide context, department-wide context, team/unit, role-specific node, person/occupant, system/queue, approval/control node, external interface, or unknown/needs review.",
      },
      {
        blockId: "case_context_inputs",
        label: "Case Context Inputs",
        editable: true,
        body: "Use only the supplied case id, session id, primary department, current hierarchy node JSON, and existing intake source JSON.",
      },
      {
        blockId: "source_and_evidence_rules",
        label: "Source And Evidence Rules",
        editable: true,
        body: "Use only these signalType values: role_name_signal, department_scope_signal, kpi_or_target_signal, responsibility_signal, approval_or_authority_signal, system_or_queue_signal, person_name_signal, cross_functional_signal, external_interface_signal, unclear_scope_signal. Use only these suggestedScope values: company_wide, department_wide, team_or_unit, role_specific, person_or_occupant, system_or_queue, approval_or_control_node, external_interface, unknown_needs_review.",
      },
      {
        blockId: "operating_instructions",
        label: "Operating Instructions",
        editable: true,
        body: "All suggestions are evidence candidates only. Default evidenceStatus to document_claim_only. Set participantValidationNeeded true for KPI/target, responsibility, approval/authority, or unclear practice claims. Ask an adminReviewQuestion that distinguishes documented/formal claims from actual practice.",
      },
      {
        blockId: "domain_terminology_lens",
        label: "Domain Terminology Lens",
        editable: true,
        body: "Map documents to department, team, role, person/occupant, system/queue, approval/control, or external-interface scopes based on text signals without forcing a narrower scope than the document supports.",
      },
      {
        blockId: "boundaries_and_prohibitions",
        label: "Boundaries And Prohibitions",
        editable: true,
        body: "Do not treat source claims as workflow truth. Do not validate SOPs, KPIs, policies, responsibilities, or actual practice. Do not create participant targeting, rollout order, invitations, participant sessions, workflow analysis, reference suitability scoring, synthesis/evaluation, or package generation.",
      },
      {
        blockId: "uncertainty_and_escalation_rules",
        label: "Uncertainty And Escalation Rules",
        editable: true,
        body: "When source scope is unclear, use unknown_needs_review and ask a focused adminReviewQuestion. Preserve uncertainty instead of inventing role/person links.",
      },
      {
        blockId: "examples_or_few_shot_cases",
        label: "Examples Or Few-Shot Cases",
        editable: true,
        body: "Example: a KPI sheet requiring 20 sales activities is a kpi_or_target_signal and document_claim_only evidence; it may require participant validation and must not be treated as actual practice.",
      },
      {
        blockId: "admin_discussion_behavior",
        label: "Admin Discussion Behavior",
        editable: true,
        body: "Frame suggestions as reviewable evidence candidates. Ask the admin whether a claim is only formal/documented or also used in practice.",
      },
      {
        blockId: "evaluation_checklist",
        label: "Evaluation Checklist",
        editable: true,
        body: "Check that suggestions do not become workflow truth, do not create participant targeting, and use only approved signal, scope, and evidence-status values.",
      },
      {
        blockId: "test_cases_or_golden_inputs",
        label: "Test Cases Or Golden Inputs",
        editable: true,
        body: "Golden input: a department KPI document, an org-chart title list, and a named approval owner should produce evidence-candidate suggestions with adminReviewQuestion values.",
      },
      {
        blockId: "output_contract_or_schema",
        label: "Output Contract Or Schema",
        editable: true,
        body: "Return JSON only: {\"suggestions\":[{\"sourceId\":\"string\",\"sourceName\":\"string\",\"suggestedScope\":\"approved_scope_value\",\"linkedNodeId\":\"optional existing nodeId only\",\"linkedScopeLevel\":\"optional approved_scope_value\",\"signalType\":\"approved_signal_type\",\"suggestedReason\":\"string\",\"confidence\":\"high|medium|low|unknown\",\"evidenceStatus\":\"document_claim_only\",\"participantValidationNeeded\":true,\"adminReviewQuestion\":\"string\"}],\"warnings\":[\"string\"]}. Do not include participant_confirmed_later or contradicted_by_reality_later.",
      },
      {
        blockId: "version_and_activation_controls",
        label: "Version And Activation Controls",
        editable: true,
        body: "Draft edits must not become active automatically. Activation requires explicit admin promotion after review of compiled prompt preview and active-vs-draft test output.",
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

export function pass3CapabilityModule(capability: Pass3PromptCapability): string {
  return capability === "hierarchy_draft" ? PASS3_HIERARCHY_PROMPT_MODULE : PASS3_SOURCE_TRIAGE_PROMPT_MODULE;
}

export interface Pass4TargetingPromptInput {
  caseId: string;
  sessionId: string;
  selectedDepartment: string;
  selectedUseCase: string;
  approvedHierarchySnapshotJson: string;
  hierarchyReadinessSnapshotJson: string;
  sourceSignalsJson: string;
}

export function defaultPass4TargetingPromptSpec(now = new Date().toISOString()): StructuredPromptSpec {
  const labels: Array<[string, string, string]> = [
    ["role_definition", "Role Definition", "You are a participant-targeting and source-signal planning assistant. Your job is to help the admin identify which people, roles, or external decision/clarification sources should be considered for later participant outreach based on the approved hierarchy, selected department, selected use case, and approved/tentative source signals. You may suggest targeting candidates, rollout order, targeting reasons, validation needs, and non-final question-hint seeds. You must not send invitations, create sessions, prepare participant-facing questions, validate workflow reality, or treat document claims as operational truth. Admin approval is required for all targeting decisions."],
    ["pass4_mission", "Pass 4 Mission", "Generate one unified Targeting Recommendation Packet for admin review. The packet answers who should be considered later, why, candidate type, rollout stage, contact readiness, source signals, and later Pass 5 hint seeds."],
    ["case_context_inputs", "Case Context Inputs", "Use only the supplied case id, session id, selected department, selected use case, approved hierarchy snapshot, readiness snapshot, and source signals."],
    ["targeting_scope_rules", "Targeting Scope Rules", "Suggest candidates only for later outreach planning. Do not create invitations, sessions, responses, synthesis, evaluation, or packages."],
    ["source_signal_interpretation_rules", "Source-Signal Interpretation Rules", "Documents may influence targeting as source signals when they mention roles, responsibilities, KPIs, approvals, thresholds, handoffs, systems, queues, people, process stages, or exception handling. Documents are not workflow truth."],
    ["participant_candidate_classification_rules", "Participant Candidate Classification Rules", "Classify as core_participant for frontline/operational roles inside scope, enrichment_participant for supervisors/managers/oversight inside scope, or external_decision_or_clarification_source only for specific outside dependencies."],
    ["external_decision_source_rules", "External Decision / Clarification Source Rules", "External sources are not default first-round workflow narrators. Include only with a specific decision, approval, handoff, dependency, or missing clarification rationale."],
    ["question_hint_seed_rules", "Question-Hint Seed Rules", "Create analytical Pass 5 hint seeds only. They are not participant-facing questions and must not be sent directly. Preserve trigger conditions and do-not-ask-if-covered guidance."],
    ["contact_channel_readiness_rules", "Contact / Channel Readiness Metadata Rules", "Assess contact readiness from available person-light fields and document signals without sending outreach. preferredChannel is optional; multiple channels without preferred selection should be marked preferred_channel_not_selected without blocking approval by default."],
    ["bottom_up_rollout_order_rules", "Bottom-Up Rollout Order Rules", "Prefer bottom-up rollout: core operational roles first, enrichment/oversight after, external decision or clarification sources only when needed."],
    ["admin_override_rules", "Admin Override and Approval Rules", "All candidates require admin review. Admin may accept, reject, change target type, change rollout order, mark contact missing, or add notes."],
    ["evidence_boundary_rules", "Evidence / Source Truth Boundary Rules", "Source signals can raise or lower priority and identify validation needs; they must never validate workflow reality."],
    ["uncertainty_rules", "Uncertainty and Manual Fallback Rules", "Expose uncertainty. If provider execution fails, no fake output should be produced; manual fallback remains available."],
    ["prohibitions", "Prohibitions", "Do not send WhatsApp, Telegram, SMS, or email. Do not generate invitation links. Do not create participant sessions. Do not collect responses. Do not perform workflow analysis."],
    ["output_contract", "Output Contract / Schema", "Return JSON only with: suggestedTargetCandidates[], targetGroups[], rolloutOrderSuggestion[], sourceSignalsUsed[], questionHintSeeds[], contactChannelReadinessNotes[], adminReviewFlags[], boundaryWarnings[], confidenceSummary. Use only approved target type, decision, contact status, and hint status values."],
    ["admin_discussion_behavior", "Admin Discussion Behavior", "Frame everything as recommendation material for admin review, not final targeting decisions."],
    ["evaluation_checklist", "Evaluation Checklist", "Check no outreach, no invitations, no sessions, no responses, no workflow analysis, no document-as-truth claim, and no participant-facing questions."],
    ["test_cases", "Test Cases / Golden Inputs", "Golden input: approved Sales hierarchy with frontline sales, supervisors, sales manager, KPI source, approval policy source. Expected: frontline core candidates first, manager enrichment, policy owner external only if approval dependency is explicit."],
    ["compiled_prompt_preview", "Compiled Prompt Preview", "The admin UI must show the compiled prompt with runtime case context before generation or test runs."],
    ["draft_active_controls", "Draft / Active / Previous / Rollback Controls", "Draft edits must not become active automatically. Promotion requires explicit admin action and note; previous active versions remain available for rollback reference."],
  ];
  return {
    promptSpecId: "promptspec_pass4_targeting_rollout_v1",
    linkedModule: PASS4_TARGETING_ROLLOUT_PROMPT_MODULE,
    purpose: "Generate a Pass 4 Targeting Recommendation Packet for admin-reviewed participant targeting and rollout planning.",
    status: "active",
    version: 1,
    inputContractRef: "ApprovedHierarchySnapshot + HierarchyReadinessSnapshot + source signals",
    outputContractRef: "TargetingRecommendationPacket",
    createdAt: now,
    updatedAt: now,
    blocks: labels.map(([blockId, label, body]) => ({ blockId, label, body, editable: true })),
  };
}

export function ensureActivePass4TargetingPromptSpec(repo: StructuredPromptSpecRepository): StructuredPromptSpec {
  const existing = repo.findActiveByLinkedModule(PASS4_TARGETING_ROLLOUT_PROMPT_MODULE);
  if (existing) return existing;
  const spec = defaultPass4TargetingPromptSpec();
  const result = validateStructuredPromptSpec(spec);
  if (!result.ok) throw new Error(`Invalid default Pass 4 PromptSpec: ${validationMessage(result.errors)}`);
  repo.save(spec);
  return spec;
}

export function compilePass4TargetingPromptSpec(spec: StructuredPromptSpec, input: Pass4TargetingPromptInput): string {
  const sections = spec.blocks.map((block) => `## ${block.label}\n${block.body}`).join("\n\n");
  const context = [
    `caseId: ${input.caseId}`,
    `sessionId: ${input.sessionId}`,
    `selectedDepartment: ${input.selectedDepartment}`,
    `selectedUseCase: ${input.selectedUseCase}`,
    `approvedHierarchySnapshotJson:\n${input.approvedHierarchySnapshotJson}`,
    `hierarchyReadinessSnapshotJson:\n${input.hierarchyReadinessSnapshotJson}`,
    `sourceSignalsJson:\n${input.sourceSignalsJson}`,
  ].join("\n\n");
  return `${sections}\n\n## Runtime Pass 4 Case Context\n${context}`;
}

export function listPass4PromptSpecs(repo: StructuredPromptSpecRepository): StructuredPromptSpec[] {
  return repo.findByLinkedModule(PASS4_TARGETING_ROLLOUT_PROMPT_MODULE);
}

export function createOrUpdatePass4PromptDraft(input: {
  blocks?: StructuredPromptSpecBlock[];
  adminNote?: string;
}, repo: StructuredPromptSpecRepository): StructuredPromptSpec {
  const active = repo.findActiveByLinkedModule(PASS4_TARGETING_ROLLOUT_PROMPT_MODULE) ?? ensureActivePass4TargetingPromptSpec(repo);
  const timestamp = new Date().toISOString();
  const draft = repo.findByLinkedModule(PASS4_TARGETING_ROLLOUT_PROMPT_MODULE).find((spec) => spec.status === "draft");
  const next: StructuredPromptSpec = {
    ...(draft ?? active),
    promptSpecId: draft?.promptSpecId ?? `${active.promptSpecId}_draft_${crypto.randomUUID()}`,
    status: "draft",
    version: draft?.version ?? active.version + 1,
    blocks: (input.blocks ?? draft?.blocks ?? active.blocks).map((block) => ({ ...block })),
    previousActivePromptSpecId: active.promptSpecId,
    createdAt: draft?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  const result = validateStructuredPromptSpec(next);
  if (!result.ok) throw new Error(`Invalid Pass 4 prompt draft: ${validationMessage(result.errors)}`);
  repo.save(next);
  return next;
}

export function promotePass4PromptDraft(input: {
  draftPromptSpecId: string;
  adminNote?: string;
}, repo: StructuredPromptSpecRepository): { active: StructuredPromptSpec; previous: StructuredPromptSpec } {
  const draft = repo.findById(input.draftPromptSpecId);
  if (!draft || draft.status !== "draft") throw new Error("Prompt draft not found or not in draft state.");
  const active = repo.findActiveByLinkedModule(PASS4_TARGETING_ROLLOUT_PROMPT_MODULE);
  if (!active) throw new Error("Active Pass 4 prompt not found for draft promotion.");
  const timestamp = new Date().toISOString();
  const previous: StructuredPromptSpec = { ...active, status: "previous", updatedAt: timestamp };
  const nextActive: StructuredPromptSpec = { ...draft, status: "active", previousActivePromptSpecId: previous.promptSpecId, updatedAt: timestamp };
  repo.save(previous);
  repo.save(nextActive);
  return { active: nextActive, previous };
}

export async function runPass4PromptComparisonTest(input: {
  draftPromptSpecId: string;
  caseContextUsed: string;
  activeCompiledPrompt: string;
  draftCompiledPrompt: string;
  provider: null | {
    readonly name: "google" | "openai";
    runPromptText(input: { compiledPrompt: string }): Promise<{ text: string; provider: "google" | "openai"; model: string }>;
  };
  adminNote?: string;
}, repos: {
  promptSpecs: StructuredPromptSpecRepository;
  testRuns: Pass4PromptTestRunRepository;
}): Promise<Pass4PromptTestRun> {
  const draft = repos.promptSpecs.findById(input.draftPromptSpecId);
  if (!draft || draft.status !== "draft") throw new Error("Pass 4 prompt draft not found for test run.");
  const active = repos.promptSpecs.findActiveByLinkedModule(PASS4_TARGETING_ROLLOUT_PROMPT_MODULE);
  if (!active) throw new Error("Active Pass 4 prompt not found for test run.");
  const timestamp = new Date().toISOString();
  let run: Pass4PromptTestRun;
  if (!input.provider) {
    run = {
      testRunId: id("pass4_prompt_test"),
      promptSpecId: active.promptSpecId,
      promptVersionId: draft.promptSpecId,
      capability: "targeting_recommendation_packet",
      caseContextUsed: input.caseContextUsed,
      activePromptVersion: active.version,
      draftPromptVersion: draft.version,
      comparisonSummary: "Provider was not configured; no prompt outputs were generated.",
      boundaryViolationFlags: [],
      providerStatus: "provider_not_configured",
      errorMessage: "provider_not_configured: provider unavailable for Pass 4 prompt test.",
      adminNote: input.adminNote,
      createdAt: timestamp,
    };
  } else {
    try {
      const activeOutput = await input.provider.runPromptText({ compiledPrompt: input.activeCompiledPrompt });
      const draftOutput = await input.provider.runPromptText({ compiledPrompt: input.draftCompiledPrompt });
      const flags = [...new Set([...boundaryFlags(activeOutput.text), ...boundaryFlags(draftOutput.text)])];
      run = {
        testRunId: id("pass4_prompt_test"),
        promptSpecId: active.promptSpecId,
        promptVersionId: draft.promptSpecId,
        capability: "targeting_recommendation_packet",
        caseContextUsed: input.caseContextUsed,
        activePromptOutput: activeOutput.text,
        draftPromptOutput: draftOutput.text,
        provider: draftOutput.provider,
        model: draftOutput.model,
        activePromptVersion: active.version,
        draftPromptVersion: draft.version,
        comparisonSummary: `Active output length ${activeOutput.text.length}; draft output length ${draftOutput.text.length}; boundary flags ${flags.length}.`,
        boundaryViolationFlags: flags,
        providerStatus: "provider_success",
        adminNote: input.adminNote,
        createdAt: timestamp,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("provider_auth_failed") ? "provider_auth_failed"
        : message.includes("provider_model_unavailable") ? "provider_model_unavailable"
          : message.includes("provider_rate_limited") ? "provider_rate_limited"
            : message.includes("provider_not_configured") ? "provider_not_configured"
              : "provider_execution_failed";
      run = {
        testRunId: id("pass4_prompt_test"),
        promptSpecId: active.promptSpecId,
        promptVersionId: draft.promptSpecId,
        capability: "targeting_recommendation_packet",
        caseContextUsed: input.caseContextUsed,
        activePromptVersion: active.version,
        draftPromptVersion: draft.version,
        comparisonSummary: "Provider execution failed; no fake Pass 4 prompt outputs were generated.",
        boundaryViolationFlags: [],
        providerStatus: status,
        errorMessage: message,
        adminNote: input.adminNote,
        createdAt: timestamp,
      };
    }
  }
  const result = validatePass4PromptTestRun(run);
  if (!result.ok) throw new Error(`Invalid Pass 4 prompt test run: ${validationMessage(result.errors)}`);
  repos.testRuns.save(run);
  return run;
}

export function listPass3PromptSpecs(repo: StructuredPromptSpecRepository): StructuredPromptSpec[] {
  return [
    ...repo.findByLinkedModule(PASS3_HIERARCHY_PROMPT_MODULE),
    ...repo.findByLinkedModule(PASS3_SOURCE_TRIAGE_PROMPT_MODULE),
  ];
}

export function createOrUpdatePass3PromptDraft(input: {
  capability: Pass3PromptCapability;
  blocks?: StructuredPromptSpecBlock[];
  adminNote?: string;
}, repo: StructuredPromptSpecRepository): StructuredPromptSpec {
  const linkedModule = pass3CapabilityModule(input.capability);
  const active = repo.findActiveByLinkedModule(linkedModule)
    ?? (input.capability === "hierarchy_draft" ? ensureActivePass3HierarchyPromptSpec(repo) : ensureActivePass3SourceTriagePromptSpec(repo));
  const timestamp = new Date().toISOString();
  const draft = repo.findByLinkedModule(linkedModule).find((spec) => spec.status === "draft");
  const next: StructuredPromptSpec = {
    ...(draft ?? active),
    promptSpecId: draft?.promptSpecId ?? `${active.promptSpecId}_draft_${crypto.randomUUID()}`,
    status: "draft",
    version: draft?.version ?? active.version + 1,
    blocks: (input.blocks ?? draft?.blocks ?? active.blocks).map((block) => ({ ...block })),
    previousActivePromptSpecId: active.promptSpecId,
    createdAt: draft?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
  const result = validateStructuredPromptSpec(next);
  if (!result.ok) throw new Error(`Invalid Pass 3 prompt draft: ${validationMessage(result.errors)}`);
  repo.save(next);
  return next;
}

export function promotePass3PromptDraft(input: {
  draftPromptSpecId: string;
  adminNote?: string;
}, repo: StructuredPromptSpecRepository): { active: StructuredPromptSpec; previous: StructuredPromptSpec } {
  const draft = repo.findById(input.draftPromptSpecId);
  if (!draft || draft.status !== "draft") throw new Error("Prompt draft not found or not in draft state.");
  const active = repo.findActiveByLinkedModule(draft.linkedModule);
  if (!active) throw new Error("Active prompt not found for draft promotion.");
  const timestamp = new Date().toISOString();
  const previous: StructuredPromptSpec = {
    ...active,
    status: "previous",
    updatedAt: timestamp,
  };
  const nextActive: StructuredPromptSpec = {
    ...draft,
    status: "active",
    previousActivePromptSpecId: previous.promptSpecId,
    updatedAt: timestamp,
  };
  for (const spec of [previous, nextActive]) {
    const result = validateStructuredPromptSpec(spec);
    if (!result.ok) throw new Error(`Invalid prompt promotion record: ${validationMessage(result.errors)}`);
  }
  repo.save(previous);
  repo.save(nextActive);
  return { active: nextActive, previous };
}

function boundaryFlags(text: string): string[] {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  for (const phrase of ["participant targeting", "rollout", "invitation", "participant session", "workflow analysis", "package generation"]) {
    if (lower.includes(phrase)) flags.push(`mentions_${phrase.replaceAll(" ", "_")}`);
  }
  return flags;
}

export async function runPass3PromptComparisonTest(input: {
  capability: Pass3PromptCapability;
  draftPromptSpecId: string;
  caseContextUsed: string;
  testInput: string;
  activeCompiledPrompt: string;
  draftCompiledPrompt: string;
  provider: null | {
    readonly name: "google" | "openai";
    runPromptText(input: { compiledPrompt: string }): Promise<{ text: string; provider: "google" | "openai"; model: string }>;
  };
  adminNote?: string;
}, repos: {
  promptSpecs: StructuredPromptSpecRepository;
  testRuns: Pass3PromptTestRunRepository;
}): Promise<Pass3PromptTestRun> {
  const draft = repos.promptSpecs.findById(input.draftPromptSpecId);
  if (!draft || draft.status !== "draft") throw new Error("Prompt draft not found for test run.");
  const active = repos.promptSpecs.findActiveByLinkedModule(draft.linkedModule);
  if (!active) throw new Error("Active prompt not found for test run.");
  const timestamp = new Date().toISOString();

  let run: Pass3PromptTestRun;
  if (!input.provider) {
    run = {
      testRunId: id("pass3_prompt_test"),
      promptSpecId: active.promptSpecId,
      promptVersionId: draft.promptSpecId,
      capability: input.capability,
      caseContextUsed: input.caseContextUsed,
      testInput: input.testInput,
      activePromptVersion: active.version,
      draftPromptVersion: draft.version,
      comparisonSummary: "Provider was not configured; no prompt outputs were generated.",
      boundaryViolationFlags: [],
      providerStatus: "provider_not_configured",
      errorMessage: "provider_not_configured: Google AI provider is missing GOOGLE_AI_API_KEY.",
      adminNote: input.adminNote,
      createdAt: timestamp,
    };
  } else {
    try {
      const activeOutput = await input.provider.runPromptText({ compiledPrompt: input.activeCompiledPrompt });
      const draftOutput = await input.provider.runPromptText({ compiledPrompt: input.draftCompiledPrompt });
      const flags = [...new Set([...boundaryFlags(activeOutput.text), ...boundaryFlags(draftOutput.text)])];
      run = {
        testRunId: id("pass3_prompt_test"),
        promptSpecId: active.promptSpecId,
        promptVersionId: draft.promptSpecId,
        capability: input.capability,
        caseContextUsed: input.caseContextUsed,
        testInput: input.testInput,
        activePromptOutput: activeOutput.text,
        draftPromptOutput: draftOutput.text,
        provider: draftOutput.provider,
        model: draftOutput.model,
        activePromptVersion: active.version,
        draftPromptVersion: draft.version,
        comparisonSummary: `Active output length ${activeOutput.text.length}; draft output length ${draftOutput.text.length}; boundary flags ${flags.length}.`,
        boundaryViolationFlags: flags,
        providerStatus: "provider_success",
        adminNote: input.adminNote,
        createdAt: timestamp,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("provider_auth_failed") ? "provider_auth_failed"
        : message.includes("provider_model_unavailable") ? "provider_model_unavailable"
          : message.includes("provider_rate_limited") ? "provider_rate_limited"
            : message.includes("provider_not_configured") ? "provider_not_configured"
              : "provider_execution_failed";
      run = {
        testRunId: id("pass3_prompt_test"),
        promptSpecId: active.promptSpecId,
        promptVersionId: draft.promptSpecId,
        capability: input.capability,
        caseContextUsed: input.caseContextUsed,
        testInput: input.testInput,
        activePromptVersion: active.version,
        draftPromptVersion: draft.version,
        comparisonSummary: "Provider execution failed; no fake prompt outputs were generated.",
        boundaryViolationFlags: [],
        providerStatus: status,
        errorMessage: message,
        adminNote: input.adminNote,
        createdAt: timestamp,
      };
    }
  }
  const result = validatePass3PromptTestRun(run);
  if (!result.ok) throw new Error(`Invalid Pass 3 prompt test run: ${validationMessage(result.errors)}`);
  repos.testRuns.save(run);
  return run;
}
