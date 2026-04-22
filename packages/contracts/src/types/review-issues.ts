/**
 * Hand-mirrored TypeScript types for Pass 7 review issue handling.
 * Source of truth is src/schemas/review-issue-record.schema.json.
 * Spec refs: §25.4 issue brief minimum fields, §25.5–§25.9 admin-only scoped
 * discussion, §25.10 controlled final actions, §25.12 resulting state update,
 * §28.13 review states, §28.15 release-state seam.
 */

import type { ReleaseState, ReviewState } from "./states.js";

export const ReviewActionType = {
  Approve: "approve",
  Override: "override",
  RequestFollowUp: "request_follow_up",
  Escalate: "escalate",
  KeepVisibleAsReviewItem: "keep_visible_as_review_item",
  Unblock: "unblock",
  KeepBlocked: "keep_blocked",
  RegenerateAffectedOutput: "regenerate_affected_output",
} as const;

export type ReviewActionType =
  (typeof ReviewActionType)[keyof typeof ReviewActionType];

export interface IssueBrief {
  issueTitle: string;
  whatHappened: string;
  whyItWasTriggered: string;
  likelySourceDiagnosis: string;
  whyItMatters: string;
  whatItAffects: string;
  severityEffectLevel: string;
  systemRecommendation: string;
  correctiveDirection: string;
}

export interface IssueDiscussionEntry {
  entryId: string;
  authorType: "admin" | "system";
  message: string;
  createdAt: string;
}

export interface IssueDiscussionThread {
  scopeBoundary: string;
  entries: IssueDiscussionEntry[];
  closureSummary?: string;
}

export interface IssueEvidenceLink {
  label: string;
  relevance: string;
  sourceReference?: string;
  sourceSectionLink?: string;
  decisionBlockLink?: string;
  promptLink?: string;
  sessionId?: string;
  sourceId?: string;
}

export interface ReviewAction {
  actionId: string;
  actionType: ReviewActionType;
  actor: string;
  createdAt: string;
  priorReviewState: ReviewState;
  resultingReviewState: ReviewState;
  note?: string;
}

export interface ReleaseApprovalRecord {
  releaseState: ReleaseState;
  note?: string;
  approvedAt?: string;
  releasedAt?: string;
}

export interface ReviewIssueRecord {
  issueId: string;
  caseId: string;
  initialPackageId: string;
  evaluationId: string;
  synthesisId?: string;
  reviewState: ReviewState;
  issueBrief: IssueBrief;
  discussionThread: IssueDiscussionThread;
  linkedEvidence: IssueEvidenceLink[];
  actionHistory: ReviewAction[];
  releaseApprovalRecord?: ReleaseApprovalRecord;
}

