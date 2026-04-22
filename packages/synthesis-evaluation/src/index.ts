/**
 * Synthesis + seven-condition evaluation — Pass 6 implementation.
 * Spec refs: §19 (synthesis: common-path + difference blocks + §19.11 output),
 *            §20.3 (seven conditions), §20.4 (five axes), §20.5 (per-axis states),
 *            §20.10 (hybrid outcome philosophy — not deterministic),
 *            §20.11–20.14 (the four outcomes).
 *
 * Architecture constraint: this package must not import from core-state,
 * core-case, or sessions-clarification. Per §20.10, evaluation outcome is
 * operator-supplied; this package does not derive it from axes/conditions.
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
 * StoredEvaluationRecord. Axes (§20.4), per-axis states (§20.5), seven
 * conditions (§20.3), and outcome (§20.11–20.14) are all enforced by the
 * schema. Per §20.10 the outcome is operator-supplied — this function does
 * not derive it from axes/conditions.
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
