/**
 * Pass 2 Phase 1 — final pre-hierarchy review contract.
 * Source of truth: src/schemas/final-pre-hierarchy-review.schema.json.
 *
 * The UI for final pre-hierarchy review is not built in Phase 1. Phase 1
 * establishes the durable row so later phases can write, read, and
 * transition review decisions.
 */

export type FinalPreHierarchyReviewStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "returned";

export interface FinalPreHierarchyReviewRecord {
  reviewId: string;
  caseId: string;
  structuredContextId?: string;
  useCaseLabel: string;
  status: FinalPreHierarchyReviewStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  reviewNotes?: string;
}
