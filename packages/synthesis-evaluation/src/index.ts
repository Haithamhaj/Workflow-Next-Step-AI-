/**
 * Synthesis + seven-condition evaluation — Pass 6 implementation.
 * Spec refs: §19 (synthesis: common-path + difference blocks + §19.11 output),
 *            §20.3 (seven conditions), §20.4 (five axes), §20.5 (per-axis states),
 *            §20.10 (hybrid outcome: seven conditions "must govern" final outcome;
 *                    axis rubrics are supporting lenses only),
 *            §20.11–20.14 (the four outcomes and their enabling conditions).
 *
 * Architecture constraint: this package must not import from core-state,
 * core-case, or sessions-clarification.
 *
 * Outcome governance (§20.10 + §20.11–20.14):
 *   The operator supplies the outcome, but the seven conditions constrain it.
 *   If any condition is false (i.e. essential workflow completion is broken):
 *     - ready_for_initial_package is invalid (§20.11 requires no blocking issues)
 *     - finalizable_with_review is invalid (§20.13 requires no issue that breaks
 *       essential workflow completion)
 *     - ready_for_final_package is invalid (§20.14 requires no blocking issue)
 *     - needs_more_clarification is the only valid outcome (§20.12)
 *   Axis states alone do NOT constrain the outcome; only the seven conditions do.
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
} from "@workflow/contracts";
export type {
  StoredSynthesisRecord,
  StoredEvaluationRecord,
  SynthesisRepository,
  EvaluationRepository,
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
 * Validate an EvaluationRecord payload, reject duplicate IDs, persist a
 * StoredEvaluationRecord.
 *
 * After schema validation, enforces §20.10 seven-condition governance:
 * if any condition is false (essential workflow completion is broken),
 * the outcome must be needs_more_clarification — any "ready" or
 * "finalizable" outcome is rejected (§20.11, §20.13, §20.14 each require
 * that no issue breaks essential workflow completion).
 */
export function createEvaluation(
  payload: unknown,
  repo: EvaluationRepository,
): EvaluationResult {
  const result = validateEvaluationRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return {
      ok: false,
      error: `Invalid EvaluationRecord: ${messages}`,
    };
  }

  const record: EvaluationRecord = result.value;

  // §20.10 seven-condition constraint: if any critical completeness condition
  // is false, it "must govern the final outcome" (§20.10). Outcomes other than
  // needs_more_clarification each require no broken essential condition:
  //   §20.11 ("remaining issues do not prevent a useful analytical package")
  //   §20.13 ("no remaining issue breaks essential workflow completion")
  //   §20.14 ("no remaining blocking issue prevents final package creation")
  const anyConditionFailed = Object.values(record.conditions).some(
    (v) => v === false,
  );
  if (anyConditionFailed) {
    const REQUIRES_INTACT_CONDITIONS = [
      EvaluationOutcome.ReadyForInitialPackage,
      EvaluationOutcome.FinalizableWithReview,
      EvaluationOutcome.ReadyForFinalPackage,
    ] as const;
    if (
      (REQUIRES_INTACT_CONDITIONS as readonly string[]).includes(record.outcome)
    ) {
      return {
        ok: false,
        error:
          "§20.10: one or more critical completeness conditions are false — essential workflow completion is broken. Outcome must be needs_more_clarification (§20.12). Outcomes ready_for_initial_package (§20.11), finalizable_with_review (§20.13), and ready_for_final_package (§20.14) all require that no remaining issue breaks essential workflow completion.",
      };
    }
  }

  const existing = repo.findById(record.evaluationId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Evaluation with id '${record.evaluationId}' already exists.`,
    };
  }

  const stored: StoredEvaluationRecord = {
    ...record,
    createdAt: new Date().toISOString(),
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
