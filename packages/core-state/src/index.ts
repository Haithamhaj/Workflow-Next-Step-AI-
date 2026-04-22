import { CaseState, ReviewState } from "@workflow/contracts";

export const CORE_STATE_PACKAGE = "@workflow/core-state" as const;

// §28.6 — allowed next states for each CaseState value.
export const CaseStateTransitions: Readonly<
  Record<CaseState, readonly CaseState[]>
> = {
  [CaseState.Created]: [CaseState.ContextInProgress],
  [CaseState.ContextInProgress]: [CaseState.ContextReady, CaseState.Closed],
  [CaseState.ContextReady]: [
    CaseState.RolloutReady,
    CaseState.ContextInProgress,
    CaseState.Closed,
  ],
  [CaseState.RolloutReady]: [
    CaseState.RolloutActive,
    CaseState.ContextInProgress,
    CaseState.Closed,
  ],
  [CaseState.RolloutActive]: [
    CaseState.AnalysisInProgress,
    CaseState.RolloutReady,
    CaseState.Closed,
  ],
  [CaseState.AnalysisInProgress]: [
    CaseState.InitialPackageReady,
    CaseState.RolloutActive,
    CaseState.Closed,
  ],
  [CaseState.InitialPackageReady]: [
    CaseState.GapClosureActive,
    CaseState.ManagementInquiryActive,
    CaseState.FinalPackageReady,
    CaseState.AnalysisInProgress,
    CaseState.Closed,
  ],
  [CaseState.GapClosureActive]: [
    CaseState.InitialPackageReady,
    CaseState.ManagementInquiryActive,
    CaseState.FinalPackageReady,
    CaseState.Closed,
  ],
  [CaseState.ManagementInquiryActive]: [
    CaseState.FinalPackageReady,
    CaseState.GapClosureActive,
    CaseState.InitialPackageReady,
    CaseState.Closed,
  ],
  [CaseState.FinalPackageReady]: [
    CaseState.Closed,
    CaseState.ManagementInquiryActive,
    CaseState.GapClosureActive,
    CaseState.AnalysisInProgress,
  ],
  [CaseState.Closed]: [],
};

export function isValidTransition(from: CaseState, to: CaseState): boolean {
  return (CaseStateTransitions[from] as readonly CaseState[]).includes(to);
}

// §28.14 — allowed next states for each ReviewState value.
export const ReviewStateTransitions: Readonly<
  Record<ReviewState, readonly ReviewState[]>
> = {
  [ReviewState.NoReviewNeeded]: [ReviewState.ReviewRequired],
  [ReviewState.ReviewRequired]: [
    ReviewState.IssueDiscussionActive,
    ReviewState.ActionTaken,
    ReviewState.ReviewResolved,
  ],
  [ReviewState.IssueDiscussionActive]: [
    ReviewState.ActionTaken,
    ReviewState.ReviewResolved,
  ],
  [ReviewState.ActionTaken]: [ReviewState.ReviewResolved],
  [ReviewState.ReviewResolved]: [],
};

export function isValidReviewTransition(
  from: ReviewState,
  to: ReviewState,
): boolean {
  return (ReviewStateTransitions[from] as readonly ReviewState[]).includes(to);
}
