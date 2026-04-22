/**
 * Hand-mirrored TypeScript type for EvaluationRecord.
 * Source of truth is src/schemas/evaluation-record.schema.json.
 * Spec refs: §20.3 seven workflow-completeness conditions, §20.4 five axes,
 *            §20.5 four per-axis states, §20.10 hybrid outcome model (not
 *            a deterministic derivation), §20.11–§20.14 four outcomes.
 */

/** Four per-axis states from §20.5. */
export const EvaluationAxisState = {
  Strong: "strong",
  Partial: "partial",
  Weak: "weak",
  Blocking: "blocking",
} as const;

export type EvaluationAxisState =
  (typeof EvaluationAxisState)[keyof typeof EvaluationAxisState];

/** Four outcomes from §20.11–§20.14. */
export const EvaluationOutcome = {
  ReadyForInitialPackage: "ready_for_initial_package",
  NeedsMoreClarification: "needs_more_clarification",
  FinalizableWithReview: "finalizable_with_review",
  ReadyForFinalPackage: "ready_for_final_package",
} as const;

export type EvaluationOutcome =
  (typeof EvaluationOutcome)[keyof typeof EvaluationOutcome];

/** Five workflow-completeness axes from §20.4. */
export interface EvaluationAxes {
  workflowCompleteness: EvaluationAxisState;
  sequenceClarity: EvaluationAxisState;
  decisionExceptionClarity: EvaluationAxisState;
  ownershipHandoffClarity: EvaluationAxisState;
  documentationStrength: EvaluationAxisState;
}

/** Seven workflow-completeness conditions from §20.3. */
export interface EvaluationConditions {
  sequenceContinuity: boolean;
  aToBToCClarity: boolean;
  coreStepConditions: boolean;
  decisionRuleOrThreshold: boolean;
  handoffResponsibility: boolean;
  controlOrApproval: boolean;
  boundary: boolean;
}

export interface EvaluationRecord {
  evaluationId: string;
  caseId: string;
  synthesisId: string;
  axes: EvaluationAxes;
  conditions: EvaluationConditions;
  outcome: EvaluationOutcome;
  readinessReasoning: string;
  confidenceEvidenceNotes?: string;
}
