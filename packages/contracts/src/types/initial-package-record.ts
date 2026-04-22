/**
 * Hand-mirrored TypeScript type for InitialPackageRecord.
 * Source of truth is src/schemas/initial-package-record.schema.json.
 * Spec refs: §21.3 five mandatory outward sections, §21.4 conditional
 *            Document/Reference Implication, §21.5 status enum,
 *            §21.8 forbids seven-condition checklist in outward package,
 *            §21.11 admin-only judgment layer.
 */

/** §21.5 initial-package status values. */
export const InitialPackageStatus = {
  NotRequested: "not_requested",
  NotApplicableYet: "not_applicable_yet",
  ReviewRecommended: "review_recommended",
  RebuildRecommended: "rebuild_recommended",
  ConditionalEarlyDraftPossible: "conditional_early_draft_possible",
} as const;

export type InitialPackageStatus =
  (typeof InitialPackageStatus)[keyof typeof InitialPackageStatus];

/** §21.3 mandatory outward sections + §21.4 conditional section. */
export interface InitialPackageOutward {
  initialSynthesizedWorkflow: string;
  workflowRationale: string;
  workflowValueUsefulnessExplanation: string;
  initialGapAnalysis: string;
  initialRecommendations: string;
  documentReferenceImplication?: string;
}

/**
 * §21.11 admin-only judgment layer. Contains the seven-condition checklist
 * (forbidden in outward output by §21.8), readiness reasoning, and
 * optional confidence/evidence notes and internal review prompts.
 */
export interface InitialPackageAdmin {
  sevenConditionChecklist: {
    sequenceContinuity: boolean;
    aToBToCClarity: boolean;
    coreStepConditions: boolean;
    decisionRuleOrThreshold: boolean;
    handoffResponsibility: boolean;
    controlOrApproval: boolean;
    boundary: boolean;
  };
  readinessReasoning: string;
  confidenceEvidenceNotes?: string;
  internalReviewPrompts?: string[];
}

export interface InitialPackageRecord {
  initialPackageId: string;
  caseId: string;
  evaluationId: string;
  status: InitialPackageStatus;
  outward: InitialPackageOutward;
  admin: InitialPackageAdmin;
}
