/**
 * Hand-mirrored TypeScript type for EvaluationRecord.
 * Source of truth is src/schemas/evaluation-record.schema.json.
 * Spec refs: §20.3 seven workflow-completeness conditions, §20.4 five axes,
 *            §20.5 four per-axis states, §20.10 hybrid outcome model (not
 *            a deterministic derivation), §20.11–§20.14 four outcomes,
 *            §20.19–§20.20 workflow validity vs automation-supportiveness,
 *            §20.21–§20.22 AI-interpreted / admin-routed / rule-guarded model.
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

/** Impact on workflow documentability — two levels per §20.19–§20.20. */
export type ConditionWorkflowEffect = "none" | "non_blocking" | "blocking";

/** Impact on automation-supportiveness — a separate maturity level (§20.19). */
export type ConditionAutomationEffect =
  | "none"
  | "limiting"
  | "blocking_for_automation";

/** LLM-generated interpretation for one false condition (§20.21). */
export interface ConditionInterpretation {
  workflowEffect: ConditionWorkflowEffect;
  automationEffect: ConditionAutomationEffect;
  whyItMatters: string;
  recommendedActions: string[];
}

/** Partial map — only false conditions receive an interpretation entry. */
export type ConditionInterpretations = Partial<
  Record<keyof EvaluationConditions, ConditionInterpretation>
>;

export interface EvaluationRecord {
  evaluationId: string;
  caseId: string;
  synthesisId: string;
  axes: EvaluationAxes;
  conditions: EvaluationConditions;
  outcome: EvaluationOutcome;
  readinessReasoning: string;
  confidenceEvidenceNotes?: string;
  /** UUID of the InterpretationSnapshot the admin reviewed before submitting. */
  interpretationSnapshotId: string;
  /** Admin confirmations for conditions the LLM labelled as workflow-blocking. */
  adminBlockingConfirmations?: Partial<Record<keyof EvaluationConditions, boolean>>;
  /** Required when admin rejects at least one blocking label (traceability). */
  adminNote?: string;
}
