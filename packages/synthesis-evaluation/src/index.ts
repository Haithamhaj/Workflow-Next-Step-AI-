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
  EvaluationAxisState,
  EvaluationOutcome,
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
} from "@workflow/persistence";

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
