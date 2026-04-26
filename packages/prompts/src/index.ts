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
  validatePass6PromptSpec,
  validatePass6PromptTestCase,
  validateStructuredPromptSpec,
  validatePromptRegistration,
  type Pass4PromptCapability,
  type Pass4PromptTestRun,
  type Pass6PromptCapabilityKey,
  type Pass6PromptSpec,
  type Pass6PromptStructuredSections,
  type Pass6PromptTestCase,
  type Pass3PromptCapability,
  type Pass3PromptTestRun,
  type PromptRegistration,
  type PromptRole,
  type StructuredPromptSpec,
  type StructuredPromptSpecBlock,
} from "@workflow/contracts";
import type {
  Pass3PromptTestRunRepository,
  PromptRecord,
  PromptRepository,
  ProviderExtractionJobRepository,
  Pass6PromptSpecRepository,
  Pass6PromptTestCaseRepository,
  StoredProviderExtractionJob,
  StructuredPromptSpecRepository,
} from "@workflow/persistence";
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
  Pass6PromptCapabilityKey,
  Pass6PromptSpec,
  Pass6PromptStructuredSections,
  Pass6PromptTestCase,
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
    ["output_contract", "Output Contract / Schema", "Return JSON only with: suggestedTargetCandidates[], targetGroups[], rolloutOrderSuggestion[], sourceSignalsUsed[], questionHintSeeds[], contactChannelReadinessNotes[], adminReviewFlags[], boundaryWarnings[], confidenceSummary. When the approved hierarchy contains at least one in-scope operational, frontline, supervisor, manager, queue, approval, or named role, suggestedTargetCandidates must include at least one admin-review candidate. Use only approved target type, decision, contact status, and hint status values."],
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

export const PASS5_PROMPT_FAMILY = "pass5_participant_session_prompt_family" as const;
export const PASS5_BASE_GOVERNANCE_PROMPT_MODULE = "pass5.base_governance" as const;

export type Pass5PromptName =
  | "pass5_base_governance_prompt"
  | "participant_guidance_prompt"
  | "first_pass_extraction_prompt"
  | "evidence_interpretation_prompt"
  | "clarification_formulation_prompt"
  | "answer_recheck_prompt"
  | "admin_added_question_prompt"
  | "admin_assistant_prompt";

export type Pass5CapabilityPromptName = Exclude<Pass5PromptName, "pass5_base_governance_prompt">;

export interface Pass5PromptInputBundle {
  promptName: Pass5PromptName;
  caseId: string;
  sessionId?: string;
  languagePreference?: string;
  channel?: "web_session_chatbot" | "telegram_bot" | "email_link_delivery" | "calendar_meeting" | "manual_meeting_or_admin_entered";
  participantLabel?: string;
  selectedDepartment?: string;
  selectedUseCase?: string;
  evidenceRefs?: string[];
  rawContent?: string;
  contentRef?: string;
  adminInstruction?: string;
  contextBundleRef?: string;
}

export interface CompiledPass5Prompt {
  promptName: Pass5PromptName;
  promptSpec: StructuredPromptSpec;
  basePromptSpec: StructuredPromptSpec;
  compiledPrompt: string;
}

export type Pass5PromptTestJobResult =
  | { ok: true; job: StoredProviderExtractionJob; compiledPrompt: string }
  | { ok: false; job: StoredProviderExtractionJob; error: string; compiledPrompt: string };

const PASS5_PROMPT_MODULES: Record<Pass5PromptName, string> = {
  pass5_base_governance_prompt: PASS5_BASE_GOVERNANCE_PROMPT_MODULE,
  participant_guidance_prompt: "pass5.participant_guidance",
  first_pass_extraction_prompt: "pass5.first_pass_extraction",
  evidence_interpretation_prompt: "pass5.evidence_interpretation",
  clarification_formulation_prompt: "pass5.clarification_formulation",
  answer_recheck_prompt: "pass5.answer_recheck",
  admin_added_question_prompt: "pass5.admin_added_question",
  admin_assistant_prompt: "pass5.admin_assistant",
};

export const PASS5_CAPABILITY_PROMPT_NAMES: readonly Pass5CapabilityPromptName[] = [
  "participant_guidance_prompt",
  "first_pass_extraction_prompt",
  "evidence_interpretation_prompt",
  "clarification_formulation_prompt",
  "answer_recheck_prompt",
  "admin_added_question_prompt",
  "admin_assistant_prompt",
];

const pass5SectionLabels: Record<string, string> = {
  prompt_metadata: "Prompt Metadata",
  role_definition: "Role Definition",
  mission_or_task_purpose: "Mission Or Task Purpose",
  case_context_inputs: "Case Context Inputs",
  source_and_evidence_rules: "Source And Evidence Rules",
  operating_instructions: "Operating Instructions",
  domain_terminology_lens: "Domain Terminology Lens",
  boundaries_and_prohibitions: "Boundaries And Prohibitions",
  uncertainty_and_escalation_rules: "Uncertainty And Escalation Rules",
  output_contract_or_schema: "Output Contract Or Schema",
  examples_or_few_shot_cases: "Examples Or Few-Shot Cases",
  admin_discussion_behavior: "Admin Discussion Behavior",
  evaluation_checklist: "Evaluation Checklist",
  test_cases_or_golden_inputs: "Test Cases Or Golden Inputs",
  compiled_prompt_preview: "Compiled Prompt Preview",
  version_and_activation_controls: "Version And Activation Controls",
};

function pass5Blocks(entries: [string, string][]): StructuredPromptSpecBlock[] {
  return entries.map(([blockId, body]) => ({
    blockId,
    label: pass5SectionLabels[blockId] ?? blockId,
    body,
    editable: true,
  }));
}

const FIRST_PASS_EXTRACTION_OUTPUT_CONTRACT_GUIDE = [
  "Return strict JSON only matching FirstPassExtractionOutput. Do not include markdown fences or prose.",
  "All required fields must be present. Required arrays must be present even when empty; use [] and do not omit them.",
  "Top-level required fields: extractionId, sessionId, basisEvidenceItemIds[], extractionStatus, extractedActors[], extractedSteps[], sequenceMap, extractedDecisionPoints[], extractedHandoffs[], extractedExceptions[], extractedSystems[], extractedControls[], extractedDependencies[], extractedUnknowns[], boundarySignals[], clarificationCandidates[], confidenceNotes[], contradictionNotes[], sourceCoverageSummary, unmappedContentItems[], extractionDefects[], evidenceDisputes[], createdAt.",
  "Canonical JSON skeleton: {\"extractionId\":\"string\",\"sessionId\":\"string\",\"basisEvidenceItemIds\":[\"evidence-id\"],\"extractionStatus\":\"completed_clean|completed_with_unmapped|completed_with_defects|completed_with_evidence_disputes|failed\",\"extractedActors\":[],\"extractedSteps\":[],\"sequenceMap\":{\"orderedItemIds\":[],\"sequenceLinks\":[],\"unclearTransitions\":[],\"notes\":[]},\"extractedDecisionPoints\":[],\"extractedHandoffs\":[],\"extractedExceptions\":[],\"extractedSystems\":[],\"extractedControls\":[],\"extractedDependencies\":[],\"extractedUnknowns\":[],\"boundarySignals\":[],\"clarificationCandidates\":[],\"confidenceNotes\":[],\"contradictionNotes\":[],\"sourceCoverageSummary\":\"string\",\"unmappedContentItems\":[],\"extractionDefects\":[],\"evidenceDisputes\":[],\"createdAt\":\"ISO timestamp\"}.",
  "Every extracted item in extractedActors/extractedSteps/extractedDecisionPoints/extractedHandoffs/extractedExceptions/extractedSystems/extractedControls/extractedDependencies/extractedUnknowns requires: itemId, label, description, evidenceAnchors[], sourceTextSpan, completenessStatus, confidenceLevel, needsClarification, clarificationReason, relatedItemIds[], adminReviewStatus, createdFrom.",
  "Minimal valid AI-extracted item example: {\"itemId\":\"step-1\",\"label\":\"Check order\",\"description\":\"Participant checks the order.\",\"evidenceAnchors\":[{\"evidenceItemId\":\"evidence-1\",\"quote\":\"I check the order\",\"note\":\"Direct participant statement.\"}],\"sourceTextSpan\":{\"evidenceItemId\":\"evidence-1\",\"quote\":\"I check the order\"},\"completenessStatus\":\"clear\",\"confidenceLevel\":\"high\",\"needsClarification\":false,\"clarificationReason\":\"\",\"relatedItemIds\":[],\"adminReviewStatus\":\"not_reviewed\",\"createdFrom\":\"ai_extraction\"}.",
  "Allowed enum values: extractionStatus = completed_clean|completed_with_unmapped|completed_with_defects|completed_with_evidence_disputes|failed; completenessStatus = clear|partial|vague|inferred|unresolved; confidenceLevel = high|medium|low; adminReviewStatus = not_reviewed|reviewed_accepted|reviewed_edited|reviewed_rejected|review_required; createdFrom = ai_extraction|admin_entry|participant_followup|system_rule.",
  "Structured SequenceMap requirements: orderedItemIds[], sequenceLinks[], unclearTransitions[], notes[]. Every sequenceLink requires fromItemId, toItemId, relationType, condition, evidenceAnchors[], confidenceLevel. relationType = then|conditional|parallel|optional|loop|unknown. Every unclearTransition requires fromItemId, toItemId, reasonUnclear, needsClarification, suggestedClarificationCandidateId.",
  "ClarificationCandidate requirements: candidateId, sessionId, linkedExtractedItemIds[], linkedUnmappedItemIds[], linkedDefectIds[], linkedRawEvidenceItemIds[], gapType, questionTheme, participantFacingQuestion, whyItMatters, exampleAnswer, priority, askNext, status, createdFrom, adminInstruction, aiFormulated, adminReviewStatus, createdAt, updatedAt. priority = high|medium|low. status = open|asked|answered|resolved|partially_resolved|dismissed_by_admin|escalated.",
  "BoundarySignal requirements: boundarySignalId, sessionId, boundaryType, participantStatement, linkedEvidenceItemId, linkedExtractedItemIds[], linkedClarificationCandidateIds[], workflowArea, interpretationNote, requiresEscalation, suggestedEscalationTarget, participantSuggestedOwner, escalationReason, shouldStopAskingParticipant, confidenceLevel, createdAt.",
  "UnmappedContentItem requirements: unmappedItemId, sessionId, evidenceItemId, sourceTextSpan or quote, reasonUnmapped, possibleCategory, confidenceLevel, needsAdminReview, needsParticipantClarification, suggestedClarificationCandidateId, createdAt. possibleCategory = step|decision|handoff|exception|system|control|dependency|unknown|boundary_signal|unclear.",
  "ExtractionDefect requirements: defectId, defectType, description, affectedOutputSection, affectedItemId, basisEvidenceItemId, severity, recommendedAction, createdAt. defectType = missing_evidence_anchor|schema_validation_failed|unsupported_inference|low_confidence_mapping|contradictory_extraction|content_not_mapped|transcript_quality_issue|ambiguous_actor_or_owner|ambiguous_sequence|evidence_anchor_dispute. severity = low|medium|high|blocking.",
  "EvidenceDispute requirements: disputeId, sessionId, extractionId, affectedItemId, aiProposedInterpretation, aiProposedEvidenceAnchor, codeValidationIssue, disputeType, severity, recommendedAction, adminDecision, createdAt. disputeType = missing_anchor|anchor_not_found|weak_semantic_support|unsupported_inference|quote_mismatch|conflicting_possible_interpretations. recommendedAction = admin_review|regenerate_anchor|ask_participant_clarification|downgrade_to_unmapped|reject_item. adminDecision = pending|accepted_with_edit|rejected|converted_to_clarification|converted_to_unmapped.",
  "Every normal AI-extracted clean item must include at least one valid evidenceAnchors[] entry using a supplied evidenceItemId. Do not invent evidence IDs, quotes, offsets, owners, thresholds, sequence, or workflow facts. If evidence support is missing or required fields cannot be restored from source content, do not place the item in clean extracted arrays; route it to unmappedContentItems, extractionDefects, evidenceDisputes, extractedUnknowns, boundarySignals, or clarificationCandidates.",
].join("\n");

function pass5CapabilityPromptMetadata(promptName: Pass5CapabilityPromptName, base: StructuredPromptSpec): string {
  return [
    `Prompt family: ${PASS5_PROMPT_FAMILY}.`,
    `Prompt name: ${promptName}.`,
    `Base governance prompt version id: ${base.promptSpecId}.`,
    `Base governance prompt version: ${base.version}.`,
    "Capability prompts must be compiled with the active base governance prompt before provider execution.",
  ].join(" ");
}

export function defaultPass5BaseGovernancePromptSpec(now = new Date().toISOString()): StructuredPromptSpec {
  return {
    promptSpecId: "promptspec_pass5_base_governance_v1",
    linkedModule: PASS5_BASE_GOVERNANCE_PROMPT_MODULE,
    purpose: "Shared Pass 5 governance rules for participant-session prompt capabilities.",
    status: "active",
    version: 1,
    inputContractRef: "Pass5PromptInputBundle",
    outputContractRef: "Capability-specific PromptSpec output contract",
    createdAt: now,
    updatedAt: now,
    blocks: pass5Blocks([
      ["prompt_metadata", `Prompt family: ${PASS5_PROMPT_FAMILY}. Prompt name: pass5_base_governance_prompt. Lifecycle: active base governance must be referenced by every Pass 5 capability prompt.`],
      ["role_definition", "You are operating inside Pass 5 participant-session analysis. You must preserve participant narrative, uncertainty, and evidence boundaries."],
      ["mission_or_task_purpose", "Govern all Pass 5 prompt capabilities so they support narrative-first clarification and participant-level draft analysis without creating final workflow truth."],
      ["source_and_evidence_rules", "Use full participant content first. Extraction must be evidence-anchored. No eligible content may be dropped: unmapped content, extraction defects, unknowns, boundary signals, clarification candidates, or admin review items must preserve it. Evidence disputes must preserve conflicts between AI interpretation and code/schema validation."],
      ["operating_instructions", "Narrative-first principle: collect what the participant says before forcing structure. Support voice, text, and mixed answers. Ask one question at a time. Do not use compound-question loopholes. Boundary or unknown responses are evidence, not failures. Route actions to the correct later capability instead of mutating hidden state."],
      ["boundaries_and_prohibitions", "No shadow state. Do not synthesize across participants. Do not evaluate, score, reconstruct final workflow truth, create package output, approve evidence, send participant messages, run channel dispatch, or bypass admin approval boundaries inside prompt output."],
      ["uncertainty_and_escalation_rules", "Do not pressure participants to guess. Honest uncertainty, lack of visibility, ownership boundaries, refusal, or another-team ownership must be preserved as boundary/unknown evidence and routed for later admin review or escalation."],
      ["admin_discussion_behavior", "Admin-facing capabilities are read-only by default unless a later governed execution path explicitly routes a proposed action for admin confirmation."],
      ["evaluation_checklist", "Check narrative-first handling, one-question-at-a-time behavior, no dropped content, evidence anchors, dispute preservation, no hidden state, no final synthesis/evaluation/package generation, and channel-specific boundary compliance."],
      ["version_and_activation_controls", "Draft edits must not become active automatically. Activation requires explicit admin promotion. Capability prompts must record the base prompt version used at compile/test time."],
    ]),
  };
}

function pass5CapabilitySpecBlocks(promptName: Pass5CapabilityPromptName, base: StructuredPromptSpec): StructuredPromptSpecBlock[] {
  const common = pass5CapabilityPromptMetadata(promptName, base);
  const byPrompt: Record<Pass5CapabilityPromptName, [string, string][]> = {
    participant_guidance_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You generate participant-facing opening guidance for a Pass 5 session."],
      ["mission_or_task_purpose", "Create clear channel-aware and language-aware guidance for Telegram, Web chatbot, email instruction style, or meeting/interviewer scripts."],
      ["case_context_inputs", "Use participant label, selected department, selected use case, language preference, and channel. Do not load unrelated database context."],
      ["operating_instructions", "Explain why the participant is being asked, ask them to describe actual practice, say perfect order is not required, and invite honest unknown/outside-responsibility statements."],
      ["boundaries_and_prohibitions", "Do not run extraction, clarification, answer recheck, admin assistant behavior, synthesis, evaluation, package generation, or channel dispatch. Do not replace deterministic Web or Telegram runtime guidance in Block 8."],
      ["output_contract_or_schema", "Return JSON only: {\"guidanceText\":\"string\",\"language\":\"en|ar\",\"channel\":\"telegram|web|email|meeting\",\"safetyNotes\":[\"string\"]}."],
      ["evaluation_checklist", "Check language awareness, channel fit, participant non-pressure, no AI claims of authority, and no hidden workflow state."],
    ],
    first_pass_extraction_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You create participant-level structured draft extraction from approved eligible evidence."],
      ["mission_or_task_purpose", "Read the full eligible participant content/transcript and output a FirstPassExtractionOutput draft."],
      ["source_and_evidence_rules", "Every normal AI-extracted item must include evidence anchors. Every extracted item must include required nested arrays such as evidenceAnchors and relatedItemIds. AI-extracted clean items must not omit evidence anchors. If evidence support is missing, route the content to unmappedContentItems, extractionDefects, extractedUnknowns, evidenceDisputes, or clarificationCandidates instead of clean extracted arrays. Apply full-content-first analysis and the no-drop extraction rule."],
      ["operating_instructions", "Identify actors, steps, sequence map, decisions, handoffs, exceptions, systems, controls, dependencies, unknowns, boundary signals, confidence notes, contradiction notes, source coverage, unmapped content, defects, and evidence disputes."],
      ["boundaries_and_prohibitions", "Participant-level structured draft only. Do not create final workflow truth. Do not synthesize across participants. Do not evaluate or package."],
      ["output_contract_or_schema", FIRST_PASS_EXTRACTION_OUTPUT_CONTRACT_GUIDE],
      ["evaluation_checklist", "Check no-drop coverage, evidence anchors, evidence disputes, source coverage summary, and no final synthesis claims."],
    ],
    evidence_interpretation_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You explain semantic support between source text and a proposed extracted item."],
      ["mission_or_task_purpose", "Assess why a quoted source span supports, weakly supports, or fails to support an extracted item."],
      ["source_and_evidence_rules", "AI may propose semantic evidence strength, but code validates anchor/schema integrity. If interpretation and code validation disagree, preserve an EvidenceDispute."],
      ["operating_instructions", "Explain semantic support, quote alignment, possible interpretations, weak support, unsupported inference, and recommended admin action."],
      ["boundaries_and_prohibitions", "Do not override code validation. Do not accept unsupported items as normal extracted items."],
      ["output_contract_or_schema", "Return JSON only: {\"semanticSupport\":\"strong|medium|weak|unsupported\",\"interpretation\":\"string\",\"possibleDisputeType\":\"string|null\",\"recommendedAction\":\"admin_review|regenerate_anchor|ask_participant_clarification|downgrade_to_unmapped|reject_item\"}."],
      ["evaluation_checklist", "Check evidence support, quote fit, no code-validation override, and dispute preservation."],
    ],
    clarification_formulation_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You formulate one participant-facing clarification question from a reviewed ClarificationCandidate."],
      ["mission_or_task_purpose", "Turn a clarification candidate into a clear question with whyItMatters, exampleAnswer, and optional answer mode hint."],
      ["operating_instructions", "Ask one question at a time. No compound-question loophole. Use plain participant language. Do not pressure guessing; invite unknown, outside-responsibility, or another-team answers."],
      ["boundaries_and_prohibitions", "Do not ask the next question by yourself. Do not execute clarification queue state changes in Block 8."],
      ["output_contract_or_schema", "Return JSON only: {\"participantFacingQuestion\":\"string\",\"whyItMatters\":\"string\",\"exampleAnswer\":\"string\",\"answerModeHint\":\"text|voice|either|null\"}."],
      ["evaluation_checklist", "Check one-question-at-a-time, no compound question, no pressure, and clear why/example fields."],
    ],
    answer_recheck_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You review a participant's single clarification answer against open clarification candidates."],
      ["mission_or_task_purpose", "Propose status updates for later governed execution by checking whether the answer resolves, partially resolves, or fails to resolve open candidates."],
      ["operating_instructions", "Compare the answer to every supplied open, asked, or partially resolved candidate. Return an explicit outcome for every candidate: resolved, partially_resolved, open, escalated, or dismissed_by_admin. Include a reason for each outcome. Preserve unresolved gaps and boundary/unknown responses. If the participant says they do not know, it is not their role, or another team handles it, create a boundarySignals entry. Do not silently no-op."],
      ["boundaries_and_prohibitions", "Do not ask the next question. Do not mutate clarification status. Do not create participant messages."],
      ["output_contract_or_schema", "Return JSON only matching this shape: {\"candidateStatusUpdates\":[{\"candidateId\":\"string\",\"status\":\"resolved|partially_resolved|open|escalated|dismissed_by_admin\",\"reason\":\"string\"}],\"newClarificationCandidates\":[{\"questionTheme\":\"string\",\"participantFacingQuestion\":\"string\",\"whyItMatters\":\"string\",\"exampleAnswer\":\"string\",\"gapType\":\"missing_step_detail|vague_decision_rule|unclear_actor|unclear_owner|unclear_sequence|unclear_handoff|unclear_system|unclear_exception|unclear_control|boundary_or_unknown|transcript_uncertainty|contradiction|admin_observed_gap\",\"priority\":\"high|medium|low\",\"askNext\":false}],\"boundarySignals\":[{\"boundaryType\":\"knowledge_gap|ownership_boundary|execution_boundary|visibility_limitation|upstream_workflow_boundary|downstream_workflow_boundary|cross_team_boundary|outcome_only_knowledge|tacit_only_practice|responsibility_disputed|participant_declined_or_refused\",\"participantStatement\":\"string\",\"workflowArea\":\"step|decision|handoff|exception|system|control|dependency|unknown|general\",\"participantSuggestedOwner\":\"string|null\",\"requiresEscalation\":false,\"suggestedEscalationTarget\":\"role|hierarchyNodeId|externalTeam|referenceCheck|adminReview|none\",\"shouldStopAskingParticipant\":true,\"confidenceLevel\":\"high|medium|low\"}],\"recommendedAdminReview\":true}. Use [] for empty arrays. Do not include deprecated keys candidateStatusProposals or newBoundarySignals."],
      ["evaluation_checklist", "Check that every supplied candidate has an explicit outcome or a boundary/new-candidate route, no silent no-op occurs, and no next question or mutation is performed by the prompt itself."],
    ],
    admin_added_question_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You convert admin instructions into participant-friendly clarification question drafts."],
      ["mission_or_task_purpose", "Translate an admin's analytical instruction into a safe participant-facing question draft for later admin review."],
      ["operating_instructions", "Keep one question only. Preserve the admin's intent without exposing internal terms or pressuring the participant."],
      ["boundaries_and_prohibitions", "Admin review is required before surfacing questions. Do not send messages or mutate queue state."],
      ["output_contract_or_schema", "Return JSON only: {\"participantFacingQuestion\":\"string\",\"whyItMatters\":\"string\",\"exampleAnswer\":\"string\",\"adminReviewRequired\":true}."],
      ["evaluation_checklist", "Check participant-friendly wording, one-question rule, admin review required, and no internal jargon."],
    ],
    admin_assistant_prompt: [
      ["prompt_metadata", common],
      ["role_definition", "You are a stage-aware, read-only Pass 5 admin/operator copilot."],
      ["mission_or_task_purpose", "Help the admin understand the full Pass 5 operational structure: participant sessions, channel access, raw evidence, transcript trust, first-pass extraction, clarification candidates, answer rechecks, boundary signals, evidence disputes, extraction defects, unmapped content, next actions, and later-review handoff candidates."],
      ["case_context_inputs", "Use only supplied context bundle references, session summaries, evidence refs, and admin instruction. Do not load entire database context."],
      ["operating_instructions", "Answer broad Pass 5 questions such as your mission, what this stage is responsible for, what happened in the current session, what questions were asked, what answers came back, what evidence exists, what extraction produced, what remains missing or blocked, what boundary signals mean, what next action is recommended, and what handoff candidates exist. Distinguish general stage explanation from evidence-backed findings. When records are supplied, cite product-native record references and separate uncertainty from supported facts. Recommend routed admin actions only."],
      ["boundaries_and_prohibitions", "Read-only by default. Do not approve evidence, send participant messages, mutate session state, run Pass 6 synthesis/evaluation, reconstruct final workflow truth, create package output, implement unsupported channel expansion, or create hidden shadow state. If asked to do later-stage or mutating work, explain the boundary and offer a Pass 5-safe alternative such as reviewing records or drafting an admin-confirmed handoff candidate."],
      ["output_contract_or_schema", "Return JSON only: {\"summary\":\"string\",\"routedActionOptions\":[{\"action\":\"string\",\"reason\":\"string\",\"requiresAdminConfirmation\":true}],\"riskNotes\":[\"string\"],\"noMutationPerformed\":true}."],
      ["evaluation_checklist", "Check read-only behavior, routed action rule, no shadow state, and no synthesis/evaluation/package generation."],
    ],
  };
  return pass5Blocks(byPrompt[promptName]);
}

export function defaultPass5CapabilityPromptSpec(
  promptName: Pass5CapabilityPromptName,
  base: StructuredPromptSpec,
  now = new Date().toISOString(),
): StructuredPromptSpec {
  const outputContractByPrompt: Record<Pass5CapabilityPromptName, string> = {
    participant_guidance_prompt: "ParticipantGuidanceDraft",
    first_pass_extraction_prompt: "FirstPassExtractionOutput",
    evidence_interpretation_prompt: "EvidenceDispute semantic support draft",
    clarification_formulation_prompt: "ClarificationCandidate participant fields",
    answer_recheck_prompt: "ClarificationCandidate status proposals",
    admin_added_question_prompt: "ClarificationCandidate draft requiring admin review",
    admin_assistant_prompt: "Read-only routed action suggestions",
  };
  return {
    promptSpecId: `promptspec_pass5_${promptName}_v1`,
    linkedModule: PASS5_PROMPT_MODULES[promptName],
    purpose: `Pass 5 ${promptName} capability prompt governed by ${base.promptSpecId}.`,
    status: "active",
    version: 1,
    inputContractRef: "Pass5PromptInputBundle",
    outputContractRef: outputContractByPrompt[promptName],
    previousActivePromptSpecId: base.promptSpecId,
    createdAt: now,
    updatedAt: now,
    blocks: pass5CapabilitySpecBlocks(promptName, base),
  };
}

export function ensureActivePass5BaseGovernancePromptSpec(repo: StructuredPromptSpecRepository): StructuredPromptSpec {
  const existing = repo.findActiveByLinkedModule(PASS5_BASE_GOVERNANCE_PROMPT_MODULE);
  if (existing) return existing;
  const spec = defaultPass5BaseGovernancePromptSpec();
  const result = validateStructuredPromptSpec(spec);
  if (!result.ok) throw new Error(`Invalid Pass 5 base governance PromptSpec: ${validationMessage(result.errors)}`);
  repo.save(spec);
  return spec;
}

export function ensureActivePass5PromptSpec(
  promptName: Pass5PromptName,
  repo: StructuredPromptSpecRepository,
): StructuredPromptSpec {
  if (promptName === "pass5_base_governance_prompt") return ensureActivePass5BaseGovernancePromptSpec(repo);
  const existing = repo.findActiveByLinkedModule(PASS5_PROMPT_MODULES[promptName]);
  if (existing) return existing;
  const base = ensureActivePass5BaseGovernancePromptSpec(repo);
  const spec = defaultPass5CapabilityPromptSpec(promptName, base);
  const result = validateStructuredPromptSpec(spec);
  if (!result.ok) throw new Error(`Invalid Pass 5 ${promptName} PromptSpec: ${validationMessage(result.errors)}`);
  repo.save(spec);
  return spec;
}

export function registerPass5PromptFamily(repo: StructuredPromptSpecRepository): {
  basePrompt: StructuredPromptSpec;
  capabilityPrompts: StructuredPromptSpec[];
} {
  const basePrompt = ensureActivePass5BaseGovernancePromptSpec(repo);
  return {
    basePrompt,
    capabilityPrompts: PASS5_CAPABILITY_PROMPT_NAMES.map((promptName) => ensureActivePass5PromptSpec(promptName, repo)),
  };
}

export function listPass5PromptSpecs(repo: StructuredPromptSpecRepository): StructuredPromptSpec[] {
  return [
    ...repo.findByLinkedModule(PASS5_BASE_GOVERNANCE_PROMPT_MODULE),
    ...PASS5_CAPABILITY_PROMPT_NAMES.flatMap((promptName) => repo.findByLinkedModule(PASS5_PROMPT_MODULES[promptName])),
  ];
}

export function getPass5PromptSpec(
  promptName: Pass5PromptName,
  repo: StructuredPromptSpecRepository,
  version?: number,
): StructuredPromptSpec | null {
  const specs = repo.findByLinkedModule(PASS5_PROMPT_MODULES[promptName]);
  if (version !== undefined) return specs.find((spec) => spec.version === version) ?? null;
  return specs.find((spec) => spec.status === "active") ?? null;
}

export function compilePass5Prompt(
  promptName: Pass5PromptName,
  input: Pass5PromptInputBundle,
  repo: StructuredPromptSpecRepository,
): CompiledPass5Prompt {
  const basePromptSpec = ensureActivePass5BaseGovernancePromptSpec(repo);
  const promptSpec = ensureActivePass5PromptSpec(promptName, repo);
  const baseSections = basePromptSpec.blocks.map((block) => `## Base Governance / ${block.label}\n${block.body}`).join("\n\n");
  const capabilitySections = promptSpec.blocks.map((block) => `## Capability / ${block.label}\n${block.body}`).join("\n\n");
  const runtimeContext = [
    `promptName: ${input.promptName}`,
    `caseId: ${input.caseId}`,
    `sessionId: ${input.sessionId ?? "not provided"}`,
    `languagePreference: ${input.languagePreference ?? "en"}`,
    `channel: ${input.channel ?? "not provided"}`,
    `participantLabel: ${input.participantLabel ?? "not provided"}`,
    `selectedDepartment: ${input.selectedDepartment ?? "not provided"}`,
    `selectedUseCase: ${input.selectedUseCase ?? "not provided"}`,
    `evidenceRefs: ${(input.evidenceRefs ?? []).join(", ") || "none"}`,
    `rawContent:\n${input.rawContent ?? "not provided"}`,
    `contentRef: ${input.contentRef ?? "not provided"}`,
    `adminInstruction:\n${input.adminInstruction ?? "not provided"}`,
    `contextBundleRef: ${input.contextBundleRef ?? "not provided"}`,
  ].join("\n\n");
  return {
    promptName,
    promptSpec,
    basePromptSpec,
    compiledPrompt: `${baseSections}\n\n${capabilitySections}\n\n## Runtime Pass 5 Input Bundle\n${runtimeContext}`,
  };
}

export async function createPass5PromptTestJob(input: {
  promptName: Pass5PromptName;
  inputBundle: Pass5PromptInputBundle;
  provider: null | {
    readonly name: "google" | "openai";
    runPromptText(input: { compiledPrompt: string }): Promise<{ text: string; provider: "google" | "openai"; model: string }>;
  };
  repos: {
    promptSpecs: StructuredPromptSpecRepository;
    providerJobs: ProviderExtractionJobRepository;
  };
  now?: () => string;
}): Promise<Pass5PromptTestJobResult> {
  const compiled = compilePass5Prompt(input.promptName, input.inputBundle, input.repos.promptSpecs);
  const timestamp = input.now?.() ?? new Date().toISOString();
  const baseJob: StoredProviderExtractionJob = {
    jobId: id("pass5_prompt_job"),
    sourceId: input.inputBundle.contentRef ?? input.inputBundle.sessionId ?? "pass5_prompt_test",
    sessionId: input.inputBundle.sessionId ?? "pass5_prompt_test",
    caseId: input.inputBundle.caseId,
    provider: input.provider?.name ?? "google",
    jobKind: "pass5_prompt_test",
    status: "queued",
    inputType: "manual_note",
    promptFamily: PASS5_PROMPT_FAMILY,
    promptName: input.promptName,
    promptVersionId: compiled.promptSpec.promptSpecId,
    basePromptVersionId: compiled.basePromptSpec.promptSpecId,
    inputBundleRef: JSON.stringify({
      promptName: input.inputBundle.promptName,
      caseId: input.inputBundle.caseId,
      sessionId: input.inputBundle.sessionId,
      languagePreference: input.inputBundle.languagePreference,
      channel: input.inputBundle.channel,
      evidenceRefs: input.inputBundle.evidenceRefs ?? [],
      contentRef: input.inputBundle.contentRef,
      hasRawContent: typeof input.inputBundle.rawContent === "string" && input.inputBundle.rawContent.length > 0,
    }),
    outputContractRef: compiled.promptSpec.outputContractRef,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.providerJobs.save(baseJob);
  if (!input.provider) {
    const failed: StoredProviderExtractionJob = {
      ...baseJob,
      status: "failed",
      errorMessage: "provider_not_configured: no provider was supplied for Pass 5 prompt test execution.",
      updatedAt: input.now?.() ?? new Date().toISOString(),
    };
    input.repos.providerJobs.save(failed);
    return { ok: false, job: failed, error: failed.errorMessage ?? "provider_not_configured", compiledPrompt: compiled.compiledPrompt };
  }
  const running: StoredProviderExtractionJob = {
    ...baseJob,
    status: "running",
    updatedAt: input.now?.() ?? new Date().toISOString(),
  };
  input.repos.providerJobs.save(running);
  try {
    const output = await input.provider.runPromptText({ compiledPrompt: compiled.compiledPrompt });
    const succeeded: StoredProviderExtractionJob = {
      ...running,
      status: "succeeded",
      provider: output.provider,
      model: output.model,
      outputRef: `pass5_prompt_test_output_length:${output.text.length}`,
      updatedAt: input.now?.() ?? new Date().toISOString(),
    };
    input.repos.providerJobs.save(succeeded);
    return { ok: true, job: succeeded, compiledPrompt: compiled.compiledPrompt };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed: StoredProviderExtractionJob = {
      ...running,
      status: "failed",
      errorMessage: message,
      updatedAt: input.now?.() ?? new Date().toISOString(),
    };
    input.repos.providerJobs.save(failed);
    return { ok: false, job: failed, error: message, compiledPrompt: compiled.compiledPrompt };
  }
}

export const runPass5PromptTestJob = createPass5PromptTestJob;

export function recordPass5ProviderFailure(input: {
  promptName: Pass5PromptName;
  inputBundle: Pass5PromptInputBundle;
  repos: {
    promptSpecs: StructuredPromptSpecRepository;
    providerJobs: ProviderExtractionJobRepository;
  };
  errorMessage: string;
  now?: () => string;
}): Promise<Pass5PromptTestJobResult> {
  return createPass5PromptTestJob({
    promptName: input.promptName,
    inputBundle: input.inputBundle,
    provider: null,
    repos: input.repos,
    now: input.now,
  }).then((result) => {
    if (result.ok) return result;
    const updated: StoredProviderExtractionJob = {
      ...result.job,
      errorMessage: input.errorMessage,
      updatedAt: input.now?.() ?? new Date().toISOString(),
    };
    input.repos.providerJobs.save(updated);
    return { ...result, job: updated, error: input.errorMessage };
  });
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

// ---------------------------------------------------------------------------
// Pass 6 Prompt Workspace / PromptOps — Block 4 only
// ---------------------------------------------------------------------------

export const PASS6_PROMPT_CAPABILITY_KEYS: readonly Pass6PromptCapabilityKey[] = [
  "synthesis",
  "difference_interpretation",
  "evaluation",
  "initial_package_drafting",
  "admin_explanation",
  "pre_package_inquiry_generation",
  "optional_draft_document_generation",
  "visual_narrative_support",
  "pass6_analysis_copilot",
] as const;

export const PASS6_PROMPT_SECTION_KEYS: readonly (keyof Pass6PromptStructuredSections)[] = [
  "roleDefinition",
  "missionOrTaskPurpose",
  "caseContextInputs",
  "sourceAndEvidenceRules",
  "methodOrPolicyRules",
  "outputContract",
  "boundariesAndProhibitions",
  "adminReviewNotes",
  "evaluationChecklist",
  "examplesOrGoldenCases",
] as const;

const pass6PromptNames: Record<Pass6PromptCapabilityKey, { name: string; description: string; output: string }> = {
  synthesis: {
    name: "Synthesis PromptSpec",
    description: "Supports later synthesis wording over accepted Pass 5 outputs without building the 6A bundle.",
    output: "Draft synthesis support notes conforming to later SynthesisInputBundle consumers.",
  },
  difference_interpretation: {
    name: "Difference Interpretation PromptSpec",
    description: "Supports later explanation of claim/workflow differences without classifying live differences in Block 4.",
    output: "Draft difference interpretation support text only.",
  },
  evaluation: {
    name: "Evaluation PromptSpec",
    description: "Supports later 6B evaluation explanation without running scoring or readiness routing.",
    output: "Draft evaluation explanation support text only.",
  },
  initial_package_drafting: {
    name: "Initial Package Drafting PromptSpec",
    description: "Supports later 6C drafting style without generating package content in Block 4.",
    output: "Draft package-writing support text only.",
  },
  admin_explanation: {
    name: "Admin Explanation PromptSpec",
    description: "Supports later admin-facing explanation of Pass 6 records.",
    output: "Draft admin explanation support text only.",
  },
  pre_package_inquiry_generation: {
    name: "Pre-Package Inquiry Generation PromptSpec",
    description: "Supports later clarification question drafting without creating Pre-6C gate behavior.",
    output: "Draft inquiry support text only.",
  },
  optional_draft_document_generation: {
    name: "Optional Draft Document Generation PromptSpec",
    description: "Supports later optional operational draft wording without producing release-ready documents.",
    output: "Draft document support text only.",
  },
  visual_narrative_support: {
    name: "Visual Narrative Support PromptSpec",
    description: "Supports later visual narration wording without visual-core validation or rendering.",
    output: "Draft visual narrative support text only.",
  },
  pass6_analysis_copilot: {
    name: "Pass 6 Analysis Copilot PromptSpec",
    description: "Supports later read-only Copilot behavior without runtime Copilot state changes.",
    output: "Draft read-only Copilot answer support text only.",
  },
};

function pass6PromptSections(capabilityKey: Pass6PromptCapabilityKey): Pass6PromptStructuredSections {
  const metadata = pass6PromptNames[capabilityKey];
  return {
    roleDefinition: `You support Pass 6 ${metadata.name}. You are a drafting and explanation assistant for admin review.`,
    missionOrTaskPurpose: metadata.description,
    caseContextInputs: "Use only supplied Pass 6 contract records, accepted Pass 5 references, active admin configuration references, and explicit admin-provided sample context.",
    sourceAndEvidenceRules: "Document/source claims are signals, not operational truth by default. Do not upgrade unresolved, disputed, defective, or candidate-only items into workflow truth.",
    methodOrPolicyRules: "Use method and policy references as context only. Prompt wording must not own scoring weights, method registry truth, readiness thresholds, package eligibility, review decisions, or release decisions.",
    outputContract: metadata.output,
    boundariesAndProhibitions: "Do not call providers. Do not execute 6A, 6B, Pre-6C, 6C, visual-core, Copilot runtime, or Pass 7 behavior. Do not approve Initial Package by score alone. Do not bypass admin review for material conflicts. Do not make visual renderers own workflow truth.",
    adminReviewNotes: "Outputs are preview material for admin inspection and later provider tests. Drafts are not sent automatically and are not evidence.",
    evaluationChecklist: "Check that the prompt respects locked governance, uses only supplied inputs, preserves uncertainty, and keeps review/release decisions outside prompt behavior.",
    examplesOrGoldenCases: "Example cases may be added as Prompt Workspace test cases. Golden cases are offline fixtures until Block 5 provider execution exists.",
  };
}

export function compilePass6PromptSpec(spec: Pass6PromptSpec): string {
  const lines = [
    `# ${spec.name}`,
    `Capability: ${spec.capabilityKey}`,
    `Version: ${spec.version}`,
    `Status: ${spec.status}`,
  ];
  for (const key of PASS6_PROMPT_SECTION_KEYS) {
    lines.push("", `## ${key}`, spec.sections[key]);
  }
  return lines.join("\n");
}

function validatePass6PromptSpecOrThrow(spec: Pass6PromptSpec, label: string): void {
  const result = validatePass6PromptSpec(spec);
  if (!result.ok) throw new Error(`${label}: ${validationMessage(result.errors)}`);
}

function validatePass6PromptTestCaseOrThrow(testCase: Pass6PromptTestCase, label: string): void {
  const result = validatePass6PromptTestCase(testCase);
  if (!result.ok) throw new Error(`${label}: ${validationMessage(result.errors)}`);
}

export function defaultPass6PromptSpec(
  capabilityKey: Pass6PromptCapabilityKey,
  input: {
    promptSpecId?: string;
    version?: string;
    status?: "draft" | "active";
    linkedPolicyConfigId?: string;
    linkedPolicyConfigVersion?: string;
    now?: string;
  } = {},
): Pass6PromptSpec {
  const timestamp = input.now ?? new Date().toISOString();
  const metadata = pass6PromptNames[capabilityKey];
  const spec: Pass6PromptSpec = {
    promptSpecId: input.promptSpecId ?? `pass6-prompt-${capabilityKey}-draft-v1`,
    capabilityKey,
    name: metadata.name,
    description: metadata.description,
    version: input.version ?? "v1",
    status: input.status ?? "draft",
    providerPreference: {
      providerKey: "openai",
      preferenceReason: "Provider preference placeholder only; Block 4 does not execute providers.",
    },
    linkedPolicyConfigId: input.linkedPolicyConfigId,
    linkedPolicyConfigVersion: input.linkedPolicyConfigVersion,
    sections: pass6PromptSections(capabilityKey),
    compiledPromptPreview: "",
    testCaseIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  spec.compiledPromptPreview = compilePass6PromptSpec(spec);
  validatePass6PromptSpecOrThrow(spec, "Invalid default Pass 6 PromptSpec");
  return spec;
}

export function createDefaultPass6PromptSpecs(
  repo: Pass6PromptSpecRepository,
  input: {
    linkedPolicyConfigId?: string;
    linkedPolicyConfigVersion?: string;
    now?: string;
  } = {},
): Pass6PromptSpec[] {
  return PASS6_PROMPT_CAPABILITY_KEYS.map((capabilityKey) => {
    const existing = repo.findByCapability(capabilityKey);
    if (existing.length > 0) return existing[0]!;
    const spec = defaultPass6PromptSpec(capabilityKey, input);
    repo.save(spec);
    return spec;
  });
}

export function listPass6PromptSpecs(repo: Pass6PromptSpecRepository): Pass6PromptSpec[] {
  return repo.findAll();
}

export function findPass6PromptSpec(promptSpecId: string, repo: Pass6PromptSpecRepository): Pass6PromptSpec | null {
  return repo.findById(promptSpecId);
}

export function updatePass6PromptDraftSections(
  promptSpecId: string,
  sections: Pass6PromptStructuredSections,
  repo: Pass6PromptSpecRepository,
  input: { now?: string } = {},
): { ok: true; promptSpec: Pass6PromptSpec } | { ok: false; error: string } {
  const draft = repo.findById(promptSpecId);
  if (!draft || draft.status !== "draft") return { ok: false, error: "PromptSpec draft not found or not editable." };
  const timestamp = input.now ?? new Date().toISOString();
  const next: Pass6PromptSpec = {
    ...draft,
    sections,
    updatedAt: timestamp,
  };
  next.compiledPromptPreview = compilePass6PromptSpec(next);
  const result = validatePass6PromptSpec(next);
  if (!result.ok) return { ok: false, error: `Invalid Pass 6 PromptSpec sections: ${validationMessage(result.errors)}` };
  repo.save(next);
  return { ok: true, promptSpec: next };
}

export function clonePass6PromptSpecToDraft(
  promptSpecId: string,
  repo: Pass6PromptSpecRepository,
  input: {
    newPromptSpecId?: string;
    now?: string;
  } = {},
): { ok: true; draft: Pass6PromptSpec } | { ok: false; error: string } {
  const source = repo.findById(promptSpecId);
  if (!source || source.status === "draft") return { ok: false, error: "Source PromptSpec not found or already draft." };
  const timestamp = input.now ?? new Date().toISOString();
  const draft: Pass6PromptSpec = {
    ...source,
    promptSpecId: input.newPromptSpecId ?? `${source.promptSpecId}-draft-${crypto.randomUUID()}`,
    status: "draft",
    version: `${source.version}-draft`,
    previousActivePromptSpecId: source.status === "active" ? source.promptSpecId : source.previousActivePromptSpecId,
    basedOnPromptSpecId: source.promptSpecId,
    archivedReason: undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  draft.compiledPromptPreview = compilePass6PromptSpec(draft);
  validatePass6PromptSpecOrThrow(draft, "Invalid cloned Pass 6 PromptSpec draft");
  repo.save(draft);
  return { ok: true, draft };
}

export function promotePass6PromptDraft(
  promptSpecId: string,
  repo: Pass6PromptSpecRepository,
  input: { now?: string } = {},
): { ok: true; active: Pass6PromptSpec; previous?: Pass6PromptSpec } | { ok: false; error: string } {
  const draft = repo.findById(promptSpecId);
  if (!draft || draft.status !== "draft") return { ok: false, error: "PromptSpec draft not found for promotion." };
  const validation = validatePass6PromptSpec(draft);
  if (!validation.ok) return { ok: false, error: `PromptSpec draft is not valid for promotion: ${validationMessage(validation.errors)}` };
  const timestamp = input.now ?? new Date().toISOString();
  const existingActive = repo.findActiveByCapability(draft.capabilityKey);
  const previous = existingActive ? {
    ...existingActive,
    status: "previous" as const,
    updatedAt: timestamp,
  } : undefined;
  const active: Pass6PromptSpec = {
    ...draft,
    status: "active",
    previousActivePromptSpecId: previous?.promptSpecId ?? draft.previousActivePromptSpecId,
    updatedAt: timestamp,
  };
  active.compiledPromptPreview = compilePass6PromptSpec(active);
  if (previous) repo.save(previous);
  repo.save(active);
  return { ok: true, active, previous };
}

export function archivePass6PromptSpec(
  promptSpecId: string,
  repo: Pass6PromptSpecRepository,
  input: { reason?: string; now?: string } = {},
): { ok: true; promptSpec: Pass6PromptSpec } | { ok: false; error: string } {
  const spec = repo.findById(promptSpecId);
  if (!spec) return { ok: false, error: "PromptSpec not found for archive." };
  if (spec.status === "active") return { ok: false, error: "Active PromptSpec cannot be archived before replacement." };
  const archived: Pass6PromptSpec = {
    ...spec,
    status: "archived",
    archivedReason: input.reason ?? "Archived from Pass 6 Prompt Workspace.",
    updatedAt: input.now ?? new Date().toISOString(),
  };
  archived.compiledPromptPreview = compilePass6PromptSpec(archived);
  validatePass6PromptSpecOrThrow(archived, "Invalid archived Pass 6 PromptSpec");
  repo.save(archived);
  return { ok: true, promptSpec: archived };
}

export function comparePass6PromptDraftToActive(
  capabilityKey: Pass6PromptCapabilityKey,
  repo: Pass6PromptSpecRepository,
): {
  capabilityKey: Pass6PromptCapabilityKey;
  activePromptSpecId?: string;
  draftPromptSpecId?: string;
  changedSections: string[];
  summary: string;
} {
  const active = repo.findActiveByCapability(capabilityKey);
  const draft = repo.findDraftsByCapability(capabilityKey)[0] ?? null;
  const changedSections = active && draft
    ? PASS6_PROMPT_SECTION_KEYS.filter((key) => active.sections[key] !== draft.sections[key])
    : [];
  return {
    capabilityKey,
    activePromptSpecId: active?.promptSpecId,
    draftPromptSpecId: draft?.promptSpecId,
    changedSections,
    summary: !active && !draft ? "No active or draft PromptSpec exists."
      : !active ? "Draft exists; no active PromptSpec exists yet."
        : !draft ? "Active exists; no draft PromptSpec exists."
          : changedSections.length === 0 ? "Draft and active structured sections match."
            : `${changedSections.length} structured section(s) changed.`,
  };
}

export function createPass6PromptTestCase(
  input: Omit<Pass6PromptTestCase, "createdAt" | "updatedAt"> & { createdAt?: string; updatedAt?: string },
  repos: {
    promptSpecs: Pass6PromptSpecRepository;
    testCases: Pass6PromptTestCaseRepository;
  },
): { ok: true; testCase: Pass6PromptTestCase; promptSpec: Pass6PromptSpec } | { ok: false; error: string } {
  const promptSpec = repos.promptSpecs.findById(input.promptSpecId);
  if (!promptSpec) return { ok: false, error: "PromptSpec not found for test case." };
  const timestamp = input.createdAt ?? new Date().toISOString();
  const testCase: Pass6PromptTestCase = {
    ...input,
    createdAt: timestamp,
    updatedAt: input.updatedAt ?? timestamp,
  };
  const result = validatePass6PromptTestCase(testCase);
  if (!result.ok) return { ok: false, error: `Invalid Pass 6 prompt test case: ${validationMessage(result.errors)}` };
  repos.testCases.save(testCase);
  const updatedPromptSpec: Pass6PromptSpec = {
    ...promptSpec,
    testCaseIds: [...new Set([...promptSpec.testCaseIds, testCase.testCaseId])],
    updatedAt: testCase.updatedAt,
  };
  updatedPromptSpec.compiledPromptPreview = compilePass6PromptSpec(updatedPromptSpec);
  repos.promptSpecs.save(updatedPromptSpec);
  return { ok: true, testCase, promptSpec: updatedPromptSpec };
}

export function listPass6PromptTestCases(
  promptSpecId: string,
  repo: Pass6PromptTestCaseRepository,
): Pass6PromptTestCase[] {
  return repo.findByPromptSpecId(promptSpecId);
}
