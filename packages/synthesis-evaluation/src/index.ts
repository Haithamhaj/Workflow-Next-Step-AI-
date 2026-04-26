/**
 * Synthesis + seven-condition evaluation — Pass 6 implementation.
 * Spec refs: §19 (synthesis: common-path + difference blocks + §19.11 output),
 *            §20.3 (seven conditions), §20.4 (five axes), §20.5 (per-axis states),
 *            §20.10 (hybrid outcome: seven conditions "must govern" final outcome;
 *                    axis rubrics are supporting lenses only),
 *            §20.11–20.14 (the four outcomes and their enabling conditions),
 *            §20.19–20.20 (workflow validity vs automation-supportiveness),
 *            §20.21–20.22 (AI-interpreted / admin-routed / rule-guarded model).
 *
 * Architecture constraint: this package must not import from core-state,
 * core-case, or sessions-clarification.
 *
 * Outcome governance (§20.21–§20.22 active model):
 *   1. LLM generates per-condition interpretations at preview time (stored as snapshot).
 *   2. Admin reviews interpretations and confirms/rejects blocking labels.
 *   3. Server enforces: snapshot basis must match submitted payload (integrity).
 *   4. Server enforces: all LLM-blocking conditions require adminBlockingConfirmation.
 *   5. Server enforces: adminNote required when admin rejects a blocking label.
 *   6. Narrow hard-stop: admin-confirmed blocking + incompatible outcome → 400.
 *   Axis states alone do NOT constrain the outcome.
 */

import {
  validateSynthesisRecord,
  validateEvaluationRecord,
  validatePass6ConfigurationProfile,
  EvaluationAxisState,
  EvaluationOutcome,
  type Pass6ConfigurationProfile,
  type Pass6LockedGovernanceRule,
  type Pass6PolicySet,
  type SynthesisRecord,
  type SynthesisDifferenceBlock,
  type EvaluationRecord,
  type EvaluationAxes,
  type EvaluationConditions,
} from "@workflow/contracts";
import type {
  StoredSynthesisRecord,
  StoredEvaluationRecord,
  SynthesisRepository,
  EvaluationRepository,
  InterpretationSnapshotRepository,
  Pass6ConfigurationProfileRepository,
  StoredPass6ConfigurationProfile,
} from "@workflow/persistence";

export const SYNTHESIS_EVALUATION_PACKAGE =
  "@workflow/synthesis-evaluation" as const;

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export { EvaluationAxisState, EvaluationOutcome } from "@workflow/contracts";
export type {
  SynthesisRecord,
  SynthesisDifferenceBlock,
  EvaluationRecord,
  EvaluationAxes,
  EvaluationConditions,
  ConditionInterpretations,
  ConditionInterpretation,
} from "@workflow/contracts";
export type {
  StoredSynthesisRecord,
  StoredEvaluationRecord,
  SynthesisRepository,
  EvaluationRepository,
  InterpretationSnapshotRepository,
  Pass6ConfigurationProfileRepository,
  StoredPass6ConfigurationProfile,
} from "@workflow/persistence";

export type {
  Pass6ConfigurationProfile,
  Pass6ConfigScope,
  Pass6ConfigStatus,
  Pass6LockedGovernanceRule,
  Pass6PolicySet,
} from "@workflow/contracts";

// ---------------------------------------------------------------------------
// Outcome types — discriminated unions
// ---------------------------------------------------------------------------

export interface SynthesisOk {
  ok: true;
  synthesis: StoredSynthesisRecord;
}

export interface SynthesisError {
  ok: false;
  error: string;
}

export type SynthesisResult = SynthesisOk | SynthesisError;

export interface EvaluationOk {
  ok: true;
  evaluation: StoredEvaluationRecord;
}

export interface EvaluationError {
  ok: false;
  error: string;
}

export type EvaluationResult = EvaluationOk | EvaluationError;

// ---------------------------------------------------------------------------
// Synthesis — §19
// ---------------------------------------------------------------------------

/**
 * Validate a SynthesisRecord payload, reject duplicate IDs, persist a
 * StoredSynthesisRecord with server-assigned createdAt. §19.3 difference-block
 * structure and §19.11 minimum output fields are enforced by the schema.
 */
export function createSynthesis(
  payload: unknown,
  repo: SynthesisRepository,
): SynthesisResult {
  const result = validateSynthesisRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return {
      ok: false,
      error: `Invalid SynthesisRecord: ${messages}`,
    };
  }

  const record: SynthesisRecord = result.value;

  const existing = repo.findById(record.synthesisId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Synthesis with id '${record.synthesisId}' already exists.`,
    };
  }

  const stored: StoredSynthesisRecord = {
    ...record,
    createdAt: new Date().toISOString(),
  };

  repo.save(stored);
  return { ok: true, synthesis: stored };
}

export function getSynthesis(
  synthesisId: string,
  repo: SynthesisRepository,
): StoredSynthesisRecord | null {
  return repo.findById(synthesisId);
}

export function listSynthesis(
  repo: SynthesisRepository,
): StoredSynthesisRecord[] {
  return repo.findAll();
}

export function listSynthesisByCaseId(
  caseId: string,
  repo: SynthesisRepository,
): StoredSynthesisRecord[] {
  return repo.findByCaseId(caseId);
}

// ---------------------------------------------------------------------------
// Pass 6 configuration and policy control — Block 3
// ---------------------------------------------------------------------------

export const PASS6_LOCKED_GOVERNANCE_RULES: readonly Pass6LockedGovernanceRule[] = [
  {
    ruleId: "pass6a_no_pass5_revalidation",
    label: "Pass 6A does not redo Pass 5",
    description: "Synthesis input preparation consumes accepted Pass 5 outputs only and does not revalidate Pass 5.",
    locked: true,
  },
  {
    ruleId: "document_source_claims_are_signals",
    label: "Document/source claims are signals",
    description: "Document and source claims are signals, not operational truth by default.",
    locked: true,
  },
  {
    ruleId: "candidate_items_not_truth",
    label: "Candidate items are not workflow truth",
    description: "Unresolved, disputed, defective, and candidate-only items are not upgraded into workflow truth by configuration.",
    locked: true,
  },
  {
    ruleId: "scores_do_not_approve_packages",
    label: "Scores do not approve packages",
    description: "Scores and thresholds can surface review needs but cannot approve packages automatically.",
    locked: true,
  },
  {
    ruleId: "material_conflicts_require_review",
    label: "Material conflicts require handling",
    description: "Material conflicts require admin or review handling and cannot be suppressed through admin config.",
    locked: true,
  },
  {
    ruleId: "six_c_requires_readiness_or_warning_approval",
    label: "6C package generation is readiness-bound",
    description: "6C cannot generate a full Initial Package unless readiness allows it or admin explicitly proceeds with warnings.",
    locked: true,
  },
  {
    ruleId: "visual_renderers_do_not_own_truth",
    label: "Visual renderers do not own workflow truth",
    description: "Visual renderers validate and render; WDE owns workflow truth and graph construction.",
    locked: true,
  },
  {
    ruleId: "copilot_read_only_default",
    label: "Copilot is read-only by default",
    description: "Pass 6 Copilot context is read-only by default and has no write authority.",
    locked: true,
  },
] as const;

function defaultPolicies(): Pass6PolicySet {
  return {
    claimScoringPolicy: {
      weights: [
        { factorKey: "evidence_strength", label: "Evidence strength", weight: 0.35 },
        { factorKey: "source_agreement", label: "Source agreement", weight: 0.25 },
        { factorKey: "role_authority_fit", label: "Role authority fit", weight: 0.2 },
        { factorKey: "recency_context", label: "Recency/context fit", weight: 0.2 },
      ],
      adminReviewTriggerThreshold: 0.45,
    },
    materialityPolicy: {
      weights: [
        { factorKey: "customer_impact", label: "Customer impact", weight: 0.3 },
        { factorKey: "control_or_compliance_impact", label: "Control or compliance impact", weight: 0.3 },
        { factorKey: "handoff_impact", label: "Handoff impact", weight: 0.2 },
        { factorKey: "frequency", label: "Frequency", weight: 0.2 },
      ],
      materialConflictReviewThreshold: 0.65,
    },
    differenceSeverityPolicy: {
      thresholds: [
        { thresholdKey: "warning", label: "Warning threshold", value: 0.4 },
        { thresholdKey: "blocker", label: "Blocker threshold", value: 0.75 },
      ],
      adminReviewTriggerThreshold: 0.6,
    },
    methodRegistryConfig: {
      defaultSelectionPreference: "Use active preferred methods when relevant; do not force every method.",
      methods: [
        { methodKey: "bpmn_process_structure", label: "BPMN / Process Structure Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "sipoc_boundary", label: "SIPOC Boundary Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "triangulation", label: "Triangulation Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "espoused_theory_vs_theory_in_use", label: "Espoused Theory vs Theory-in-Use Lens", active: true, defaultPreference: "available" },
        { methodKey: "raci_responsibility", label: "RACI / Responsibility Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "ssm_multi_perspective", label: "SSM / Multi-Perspective Lens", active: true, defaultPreference: "available" },
        { methodKey: "apqc_vocabulary", label: "APQC Vocabulary Lens", active: true, defaultPreference: "available" },
      ],
    },
    layerFitPolicy: {
      assumptions: [
        "Participant statements are strongest for work the participant performs or directly observes.",
        "Manager statements may clarify policy and boundaries but do not erase participant-level variants.",
      ],
      documentSourceInfluenceWeights: [
        { factorKey: "approved_policy", label: "Approved policy/source document", weight: 0.35 },
        { factorKey: "participant_narrative", label: "Participant narrative", weight: 0.4 },
        { factorKey: "admin_note", label: "Admin note", weight: 0.25 },
      ],
    },
    sevenConditionPolicy: {
      conditions: [
        { conditionKey: "core_sequence_continuity", label: "Core sequence continuity", helperText: "Can the core sequence be followed?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "step_to_step_connection", label: "Step-to-step connection", helperText: "Are transitions sufficiently connected?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "essential_step_requirements", label: "Essential step requirements", helperText: "Are required inputs and outputs clear enough?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "decision_rules_thresholds", label: "Decision rules and thresholds", helperText: "Are decision rules clear enough for package use?", warningThreshold: 0.4, blockerThreshold: 0.7 },
        { conditionKey: "handoffs_responsibility", label: "Handoffs and responsibility", helperText: "Are owners and handoffs clear enough?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "controls_approvals", label: "Controls and approvals", helperText: "Are control and approval points clear enough?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "use_case_boundary", label: "Use-case boundary", helperText: "Is the workflow boundary clear enough?", warningThreshold: 0.4, blockerThreshold: 0.7 },
      ],
      warningVsBlockerThresholds: [
        { thresholdKey: "warning_default", label: "Warning default", value: 0.45 },
        { thresholdKey: "blocker_default", label: "Blocker default", value: 0.75 },
      ],
    },
    readinessRoutingPolicy: {
      warningThreshold: 0.45,
      blockerThreshold: 0.75,
      adminReviewTriggerThreshold: 0.6,
      proceedWithWarningsMessageTemplate: "Proceed with warnings only when admin accepts the stated limitations.",
    },
    prePackageGatePolicy: {
      clarificationPriorityThreshold: 0.6,
      reviewDecisionThreshold: 0.7,
    },
    packageOutputPolicy: {
      clientFacingVisibility: ["current_workflow", "warnings", "interfaces"],
      adminInternalVisibility: ["claim_basis", "method_usage", "condition_assessment", "unresolved_items"],
      packageWarningLanguageTemplate: "This package contains known limitations: {{warnings}}",
      optionalDraftDocumentEligibilityThreshold: 0.8,
      methodologyReportSections: ["method_usage", "evidence_basis", "condition_summary"],
      tableLayoutPreference: "compact_admin_review",
    },
    visualMapPolicy: {
      markerPreferences: ["warning_badge", "unresolved_marker", "external_interface_marker"],
      showWarnings: true,
      showUnresolved: true,
    },
    promptBehaviorProfile: {
      profileName: "default-prompt-behavior-placeholder",
      promptWorkspaceOwned: true,
      behaviorNotes: ["Prompt behavior is visible here as a profile reference; prompt editing belongs to the later Prompt Workspace block."],
    },
  };
}

function validateProfile(profile: Pass6ConfigurationProfile): { ok: true } | { ok: false; error: string } {
  const result = validatePass6ConfigurationProfile(profile);
  if (!result.ok) {
    return { ok: false, error: result.errors.map((error) => error.message ?? String(error)).join("; ") };
  }
  return { ok: true };
}

export function createDefaultPass6ConfigurationDraft(input: {
  configId?: string;
  changedBy: string;
  changeReason: string;
  now?: string;
  basedOnConfigId?: string;
  policies?: Pass6PolicySet;
}): StoredPass6ConfigurationProfile {
  const now = input.now ?? new Date().toISOString();
  return {
    configId: input.configId ?? `pass6-config-${Date.now()}`,
    version: "1.0.0",
    status: "draft",
    scope: "global",
    changedBy: input.changedBy,
    changedAt: now,
    changeReason: input.changeReason,
    basedOnConfigId: input.basedOnConfigId,
    policies: input.policies ?? defaultPolicies(),
    lockedGovernanceRules: PASS6_LOCKED_GOVERNANCE_RULES.map((rule) => ({ ...rule })),
  };
}

export function savePass6ConfigurationProfile(
  profile: Pass6ConfigurationProfile,
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const validation = validateProfile(profile);
  if (!validation.ok) return validation;
  repo.save(profile);
  return { ok: true, profile };
}

export function listPass6ConfigurationProfiles(
  repo: Pass6ConfigurationProfileRepository,
): StoredPass6ConfigurationProfile[] {
  return repo.findAll();
}

export function findActivePass6ConfigurationProfile(
  repo: Pass6ConfigurationProfileRepository,
): StoredPass6ConfigurationProfile | null {
  return repo.findActive("global", "");
}

export function compareActiveVsDraftPass6Configuration(
  repo: Pass6ConfigurationProfileRepository,
): { activeConfigId: string | null; draftConfigId: string | null; changedSections: string[]; summary: string } {
  const active = repo.findActive("global", "");
  const draft = repo.findDrafts()[0] ?? null;
  if (!active || !draft) {
    return { activeConfigId: active?.configId ?? null, draftConfigId: draft?.configId ?? null, changedSections: [], summary: "Active and draft profiles are not both available." };
  }
  const changedSections = Object.keys(draft.policies).filter((key) =>
    JSON.stringify(draft.policies[key as keyof Pass6PolicySet]) !== JSON.stringify(active.policies[key as keyof Pass6PolicySet])
  );
  return {
    activeConfigId: active.configId,
    draftConfigId: draft.configId,
    changedSections,
    summary: changedSections.length === 0 ? "No policy section differences." : `${changedSections.length} policy section(s) differ.`,
  };
}

export function updatePass6ConfigurationDraft(
  configId: string,
  updates: {
    policies?: Pass6PolicySet;
    lockedGovernanceRules?: Pass6LockedGovernanceRule[];
    changedBy: string;
    changeReason: string;
    now?: string;
  },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  if (updates.lockedGovernanceRules !== undefined) {
    return { ok: false, error: "Locked governance rules are visible but not editable through Pass 6 admin configuration." };
  }
  const existing = repo.findById(configId);
  if (!existing) return { ok: false, error: `Config '${configId}' not found.` };
  if (existing.status !== "draft") return { ok: false, error: "Only draft config profiles can be edited." };
  const updated: StoredPass6ConfigurationProfile = {
    ...existing,
    policies: updates.policies ?? existing.policies,
    changedBy: updates.changedBy,
    changedAt: updates.now ?? new Date().toISOString(),
    changeReason: updates.changeReason,
    lockedGovernanceRules: PASS6_LOCKED_GOVERNANCE_RULES.map((rule) => ({ ...rule })),
  };
  return savePass6ConfigurationProfile(updated, repo);
}

export function promotePass6ConfigurationDraft(
  draftConfigId: string,
  input: { changedBy: string; changeReason: string; now?: string },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; active: StoredPass6ConfigurationProfile; previous: StoredPass6ConfigurationProfile | null } | { ok: false; error: string } {
  const draft = repo.findById(draftConfigId);
  if (!draft) return { ok: false, error: `Draft config '${draftConfigId}' not found.` };
  if (draft.status !== "draft") return { ok: false, error: "Only draft config profiles can be promoted." };
  const now = input.now ?? new Date().toISOString();
  const currentActive = repo.findActive(draft.scope, draft.scopeRef ?? "");
  let previous: StoredPass6ConfigurationProfile | null = null;
  if (currentActive) {
    previous = {
      ...currentActive,
      status: "previous",
      changedBy: input.changedBy,
      changedAt: now,
      changeReason: `Superseded by ${draft.configId}. ${input.changeReason}`,
      previousVersionConfigId: currentActive.previousVersionConfigId,
    };
    repo.save(previous);
  }
  const active: StoredPass6ConfigurationProfile = {
    ...draft,
    status: "active",
    changedBy: input.changedBy,
    changedAt: now,
    changeReason: input.changeReason,
    previousVersionConfigId: previous?.configId,
    effectiveFrom: now,
    lockedGovernanceRules: PASS6_LOCKED_GOVERNANCE_RULES.map((rule) => ({ ...rule })),
  };
  repo.save(active);
  return { ok: true, active, previous };
}

export function archivePass6ConfigurationProfile(
  configId: string,
  input: { changedBy: string; changeReason: string; now?: string },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const existing = repo.findById(configId);
  if (!existing) return { ok: false, error: `Config '${configId}' not found.` };
  if (existing.status === "active") return { ok: false, error: "Active config must be superseded before archive." };
  const archived = { ...existing, status: "archived" as const, changedBy: input.changedBy, changedAt: input.now ?? new Date().toISOString(), changeReason: input.changeReason };
  repo.save(archived);
  return { ok: true, profile: archived };
}

export function rollbackPass6ConfigurationProfile(
  previousConfigId: string,
  input: { newConfigId: string; changedBy: string; changeReason: string; now?: string },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; draft: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const previous = repo.findById(previousConfigId);
  if (!previous) return { ok: false, error: `Rollback source '${previousConfigId}' not found.` };
  const draft = createDefaultPass6ConfigurationDraft({
    configId: input.newConfigId,
    changedBy: input.changedBy,
    changeReason: input.changeReason,
    now: input.now,
    basedOnConfigId: previous.configId,
    policies: previous.policies,
  });
  const stored = { ...draft, rollbackReference: previous.configId };
  repo.save(stored);
  return { ok: true, draft: stored };
}

// ---------------------------------------------------------------------------
// Evaluation — §20
// ---------------------------------------------------------------------------

/**
 * Validate an EvaluationRecord payload, verify snapshot integrity, enforce
 * admin blocking confirmations, apply narrow hard-stop, then persist.
 *
 * §20.21–§20.22 AI-interpreted / admin-routed / rule-guarded model:
 *   1. Schema validation (Ajv).
 *   2. Snapshot lookup — interpretationSnapshotId must exist.
 *   3. Basis integrity — submitted conditions + outcome must match snapshot.basis.
 *   4. For each condition the LLM labelled workflow-blocking, admin must supply
 *      adminBlockingConfirmations[key] (true or false).
 *   5. adminNote required when any blocking label is rejected (false).
 *   6. Narrow hard-stop: admin-confirmed blocking + incompatible outcome → 400.
 *   7. Duplicate check.
 *   8. Persist with conditionInterpretations copied from snapshot.
 */
export function createEvaluation(
  payload: unknown,
  repo: EvaluationRepository,
  snapshotRepo: InterpretationSnapshotRepository,
): EvaluationResult {
  const result = validateEvaluationRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return { ok: false, error: `Invalid EvaluationRecord: ${messages}` };
  }

  const record: EvaluationRecord = result.value;

  // Step 2: snapshot lookup
  const snapshot = snapshotRepo.findById(record.interpretationSnapshotId);
  if (snapshot === null) {
    return {
      ok: false,
      error: `Interpretation snapshot '${record.interpretationSnapshotId}' not found. Submit the conditions via /api/evaluations/interpret before creating an evaluation.`,
    };
  }

  // Step 3: basis integrity — submitted payload must match what the admin reviewed
  const basisConditionsMatch =
    JSON.stringify(snapshot.basis.conditions) ===
    JSON.stringify(record.conditions);
  if (!basisConditionsMatch) {
    return {
      ok: false,
      error:
        "Snapshot integrity failure: the submitted conditions do not match the conditions in the interpretation snapshot. Re-run the analysis before submitting.",
    };
  }
  if (snapshot.basis.outcome !== record.outcome) {
    return {
      ok: false,
      error:
        "Snapshot integrity failure: the submitted outcome does not match the outcome in the interpretation snapshot. Re-run the analysis before submitting.",
    };
  }

  // Step 4: admin must confirm/reject each condition labelled blocking by the LLM
  const blockingKeys = (
    Object.keys(snapshot.conditionInterpretations) as (keyof EvaluationConditions)[]
  ).filter(
    (k) => snapshot.conditionInterpretations[k]?.workflowEffect === "blocking",
  );

  for (const key of blockingKeys) {
    if (record.adminBlockingConfirmations?.[key] === undefined) {
      return {
        ok: false,
        error: `§20.22: the LLM labelled condition '${key}' as workflow-blocking. adminBlockingConfirmations.${key} must be true (confirmed blocking) or false (label rejected).`,
      };
    }
  }

  // Step 5: adminNote required when any blocking label is rejected
  const anyRejected = blockingKeys.some(
    (k) => record.adminBlockingConfirmations?.[k] === false,
  );
  if (anyRejected && !record.adminNote?.trim()) {
    return {
      ok: false,
      error:
        "adminNote is required when rejecting a blocking label — provide a brief explanation for traceability.",
    };
  }

  // Step 6: narrow hard-stop — admin-confirmed blocking + incompatible outcome
  const INCOMPATIBLE_WITH_CONFIRMED_BLOCKING = [
    EvaluationOutcome.ReadyForInitialPackage,
    EvaluationOutcome.FinalizableWithReview,
    EvaluationOutcome.ReadyForFinalPackage,
  ] as const;

  const anyConfirmed = blockingKeys.some(
    (k) => record.adminBlockingConfirmations?.[k] === true,
  );
  if (
    anyConfirmed &&
    (INCOMPATIBLE_WITH_CONFIRMED_BLOCKING as readonly string[]).includes(
      record.outcome,
    )
  ) {
    return {
      ok: false,
      error:
        "§20.22 hard-stop: at least one condition is admin-confirmed as workflow-blocking. The outcome must be needs_more_clarification while a materially blocking condition remains unresolved.",
    };
  }

  // Step 7: duplicate check
  const existing = repo.findById(record.evaluationId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Evaluation with id '${record.evaluationId}' already exists.`,
    };
  }

  // Step 8: persist with interpretations from the snapshot
  const stored: StoredEvaluationRecord = {
    ...record,
    createdAt: new Date().toISOString(),
    conditionInterpretations: snapshot.conditionInterpretations,
  };

  repo.save(stored);
  return { ok: true, evaluation: stored };
}

export function getEvaluation(
  evaluationId: string,
  repo: EvaluationRepository,
): StoredEvaluationRecord | null {
  return repo.findById(evaluationId);
}

export function listEvaluations(
  repo: EvaluationRepository,
): StoredEvaluationRecord[] {
  return repo.findAll();
}

export function listEvaluationsByCaseId(
  caseId: string,
  repo: EvaluationRepository,
): StoredEvaluationRecord[] {
  return repo.findByCaseId(caseId);
}

export function listEvaluationsBySynthesisId(
  synthesisId: string,
  repo: EvaluationRepository,
): StoredEvaluationRecord[] {
  return repo.findBySynthesisId(synthesisId);
}
