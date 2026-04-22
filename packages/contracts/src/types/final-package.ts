/**
 * Hand-mirrored TypeScript types for Pass 8 final package record.
 * Source of truth is src/schemas/final-package-record.schema.json.
 * Spec refs: §29.8.1 required top-level fields, §29.8.2 content sections,
 * §29.8.3 current-state vs target-state separation, §29.8.4 output direction,
 * §29.8.5 gap layer, §25.16 approval gate, §28.15–§28.16 release states.
 */

import type { PackageState, ReleaseState } from "./states.js";

// Operator-confirmed values (STOP-A resolved 2026-04-22).
// Kept separate from ReleaseState per §28.16 / §25.16 separation.
export const AdminApprovalStatus = {
  NotApproved: "not_approved",
  Approved: "approved",
} as const;

export type AdminApprovalStatus =
  (typeof AdminApprovalStatus)[keyof typeof AdminApprovalStatus];

// §29.8.4 Output direction traceability
export const OutputDirection = {
  UpdatedSourceAlignedWithReality: "updated_source_aligned_with_reality",
  RebuiltSourceDraft: "rebuilt_source_draft",
  ReviewedSourceReplacementCandidate: "reviewed_source_replacement_candidate",
  RecommendationOnlyWhenDraftNotEligible:
    "recommendation_only_when_draft_not_eligible",
} as const;

export type OutputDirection =
  (typeof OutputDirection)[keyof typeof OutputDirection];

// §29.8.5 Gap layer — closed items, non-blocking remainders, later review items
export interface FinalPackageGapLayer {
  closedItems: string[];
  nonBlockingRemainingItems: string[];
  laterReviewItems: string[];
}

// §29.8 Final Package record
export interface FinalPackageRecord {
  // §29.8.1 Required top-level fields
  packageId: string;
  caseId: string;
  packageType: "final_workflow_and_reference_package";
  packageState: PackageState;
  packageReleaseState: ReleaseState;
  packageGeneratedAt: string;
  finalizationBasis: string;
  adminApprovalStatus: AdminApprovalStatus;
  // §29.8.2 Required content sections
  finalWorkflowReality: string;
  finalSourceOrReferenceOutput: string;
  finalGapAnalysis: string;
  improvementTargetsOrFinalRecommendations: string;
  uiOverviewLayer: string;
  // §29.8.3 Distinct target-state field — must not be merged with finalWorkflowReality
  improvedOrTargetStateWorkflow?: string;
  // §29.8.4
  outputDirection: OutputDirection;
  // §29.8.5
  gapLayer: FinalPackageGapLayer;
  // Back-links (optional — operator may supply at creation time)
  initialPackageId?: string;
  evaluationId?: string;
}
