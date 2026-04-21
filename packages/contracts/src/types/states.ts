/**
 * State family identifiers and state enums per spec §28.
 *
 * CaseState (§28.5), SessionState (§28.9), PackageState (§28.11),
 * ReviewState (§28.13), ReleaseState (§28.15) are fully enumerated.
 *
 * RolloutState (§28.7) is NOT enumerated in the spec — it describes pillars
 * only. It remains a branded placeholder until the spec author provides values.
 */

export const StateFamily = {
  Case: "case",
  Rollout: "rollout",
  Session: "session",
  Package: "package",
  Review: "review",
  Release: "release",
} as const;

export type StateFamily = (typeof StateFamily)[keyof typeof StateFamily];

// §28.5
export const CaseState = {
  Created: "created",
  ContextInProgress: "context_in_progress",
  ContextReady: "context_ready",
  RolloutReady: "rollout_ready",
  RolloutActive: "rollout_active",
  AnalysisInProgress: "analysis_in_progress",
  InitialPackageReady: "initial_package_ready",
  GapClosureActive: "gap_closure_active",
  ManagementInquiryActive: "management_inquiry_active",
  FinalPackageReady: "final_package_ready",
  Closed: "closed",
} as const;

export type CaseState = (typeof CaseState)[keyof typeof CaseState];

// §28.9
export const SessionState = {
  NotStarted: "not_started",
  InputReceived: "input_received",
  ExtractionInProgress: "extraction_in_progress",
  FollowUpNeeded: "follow_up_needed",
  SessionPartial: "session_partial",
  SessionReadyForSynthesis: "session_ready_for_synthesis",
} as const;

export type SessionState = (typeof SessionState)[keyof typeof SessionState];

// §28.11
export const PackageState = {
  NotStarted: "not_started",
  InitialPackageInProgress: "initial_package_in_progress",
  InitialPackageReady: "initial_package_ready",
  FinalPackageBlocked: "final_package_blocked",
  FinalPackageInProgress: "final_package_in_progress",
  FinalPackageReady: "final_package_ready",
} as const;

export type PackageState = (typeof PackageState)[keyof typeof PackageState];

// §28.13
export const ReviewState = {
  NoReviewNeeded: "no_review_needed",
  ReviewRequired: "review_required",
  IssueDiscussionActive: "issue_discussion_active",
  ActionTaken: "action_taken",
  ReviewResolved: "review_resolved",
} as const;

export type ReviewState = (typeof ReviewState)[keyof typeof ReviewState];

// §28.15
export const ReleaseState = {
  NotReleasable: "not_releasable",
  PendingAdminApproval: "pending_admin_approval",
  ApprovedForRelease: "approved_for_release",
  Released: "released",
} as const;

export type ReleaseState = (typeof ReleaseState)[keyof typeof ReleaseState];

// ---------------------------------------------------------------------------
// PASS 2 PLACEHOLDER — RolloutState is not enumerated in spec §28.7.
// Spec describes pillars only (hierarchy, reference, targeting, admin approval).
// Do not guess values. Awaiting author input before this type can be filled.
// ---------------------------------------------------------------------------
type _Pass1Placeholder<Tag extends string> = string & {
  readonly __pass1Placeholder__: Tag;
};

// TODO(spec author): enumerate RolloutState values in §28.7 and replace this.
export type RolloutState = _Pass1Placeholder<"RolloutState">;
