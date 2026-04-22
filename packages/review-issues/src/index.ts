import {
  ReviewActionType,
  ReviewState,
  validateReviewIssueRecord,
  type ReviewIssueRecord,
  type ReviewAction,
  type ReviewActionType as ReviewActionTypeValue,
  type IssueDiscussionEntry,
} from "@workflow/contracts";
import { isValidReviewTransition } from "@workflow/core-state";
import type {
  ReviewIssueRepository,
  StoredReviewIssueRecord,
} from "@workflow/persistence";

export const REVIEW_ISSUES_PACKAGE = "@workflow/review-issues" as const;

export { ReviewActionType } from "@workflow/contracts";
export type {
  ReviewIssueRecord,
  ReviewAction,
  IssueBrief,
  IssueDiscussionThread,
  IssueDiscussionEntry,
  IssueEvidenceLink,
  ReleaseApprovalRecord,
} from "@workflow/contracts";
export type { ReviewActionTypeValue };
export type {
  ReviewIssueRepository,
  StoredReviewIssueRecord,
} from "@workflow/persistence";

export interface ReviewIssueOk {
  ok: true;
  issue: StoredReviewIssueRecord;
}

export interface ReviewIssueError {
  ok: false;
  error: string;
}

export type ReviewIssueResult = ReviewIssueOk | ReviewIssueError;

export function createReviewIssue(
  payload: unknown,
  repo: ReviewIssueRepository,
): ReviewIssueResult {
  const result = validateReviewIssueRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return { ok: false, error: `Invalid ReviewIssueRecord: ${messages}` };
  }

  const record: ReviewIssueRecord = result.value;
  const existing = repo.findById(record.issueId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Review issue with id '${record.issueId}' already exists.`,
    };
  }

  const timestamp = new Date().toISOString();
  const stored: StoredReviewIssueRecord = {
    ...record,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  repo.save(stored);
  return { ok: true, issue: stored };
}

export function getReviewIssue(
  issueId: string,
  repo: ReviewIssueRepository,
): StoredReviewIssueRecord | null {
  return repo.findById(issueId);
}

export function listReviewIssues(
  repo: ReviewIssueRepository,
): StoredReviewIssueRecord[] {
  return repo.findAll();
}

export function listReviewIssuesByInitialPackageId(
  initialPackageId: string,
  repo: ReviewIssueRepository,
): StoredReviewIssueRecord[] {
  return repo.findByInitialPackageId(initialPackageId);
}

export function transitionReviewIssue(
  issueId: string,
  toState: ReviewState,
  repo: ReviewIssueRepository,
): ReviewIssueResult {
  const issue = repo.findById(issueId);
  if (issue === null) {
    return { ok: false, error: `Review issue '${issueId}' not found.` };
  }

  if (!isValidReviewTransition(issue.reviewState, toState)) {
    return {
      ok: false,
      error: `Invalid review-state transition: '${issue.reviewState}' -> '${toState}'.`,
    };
  }

  const updated: StoredReviewIssueRecord = {
    ...issue,
    reviewState: toState,
    updatedAt: new Date().toISOString(),
  };
  repo.save(updated);
  return { ok: true, issue: updated };
}

export function addDiscussionEntry(
  issueId: string,
  payload: {
    entryId: string;
    authorType: IssueDiscussionEntry["authorType"];
    message: string;
  },
  repo: ReviewIssueRepository,
): ReviewIssueResult {
  const issue = repo.findById(issueId);
  if (issue === null) {
    return { ok: false, error: `Review issue '${issueId}' not found.` };
  }

  const entryId = payload.entryId.trim();
  const message = payload.message.trim();
  if (entryId.length === 0) {
    return { ok: false, error: "Discussion entryId is required." };
  }
  if (message.length === 0) {
    return { ok: false, error: "Discussion message is required." };
  }

  const nextState =
    issue.reviewState === ReviewState.ReviewRequired
      ? ReviewState.IssueDiscussionActive
      : issue.reviewState;

  if (
    issue.reviewState === ReviewState.ReviewResolved ||
    issue.reviewState === ReviewState.ActionTaken
  ) {
    return {
      ok: false,
      error:
        "Discussion can only be added while review is pending or discussion is active.",
    };
  }

  const updated: StoredReviewIssueRecord = {
    ...issue,
    reviewState: nextState,
    discussionThread: {
      ...issue.discussionThread,
      entries: [
        ...issue.discussionThread.entries,
        {
          entryId,
          authorType: payload.authorType,
          message,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    updatedAt: new Date().toISOString(),
  };
  repo.save(updated);
  return { ok: true, issue: updated };
}

function resultingStateForAction(
  _actionType: ReviewActionTypeValue,
): ReviewState {
  return ReviewState.ActionTaken;
}

export function applyReviewAction(
  issueId: string,
  payload: {
    actionId: string;
    actionType: ReviewActionTypeValue;
    actor: string;
    note?: string;
  },
  repo: ReviewIssueRepository,
): ReviewIssueResult {
  const issue = repo.findById(issueId);
  if (issue === null) {
    return { ok: false, error: `Review issue '${issueId}' not found.` };
  }

  if (
    issue.reviewState !== ReviewState.ReviewRequired &&
    issue.reviewState !== ReviewState.IssueDiscussionActive
  ) {
    return {
      ok: false,
      error:
        "Final admin actions are only allowed from 'review_required' or 'issue_discussion_active'.",
    };
  }

  const actionId = payload.actionId.trim();
  const actor = payload.actor.trim();
  const note = payload.note?.trim();

  if (actionId.length === 0) {
    return { ok: false, error: "actionId is required." };
  }
  if (actor.length === 0) {
    return { ok: false, error: "actor is required." };
  }

  const resultingReviewState = resultingStateForAction(payload.actionType);
  if (!isValidReviewTransition(issue.reviewState, resultingReviewState)) {
    return {
      ok: false,
      error: `Invalid review-state transition: '${issue.reviewState}' -> '${resultingReviewState}'.`,
    };
  }

  const action: ReviewAction = {
    actionId,
    actionType: payload.actionType,
    actor,
    createdAt: new Date().toISOString(),
    priorReviewState: issue.reviewState,
    resultingReviewState,
    note: note && note.length > 0 ? note : undefined,
  };

  const updated: StoredReviewIssueRecord = {
    ...issue,
    reviewState: resultingReviewState,
    actionHistory: [...issue.actionHistory, action],
    releaseApprovalRecord: issue.releaseApprovalRecord,
    updatedAt: new Date().toISOString(),
  };
  repo.save(updated);
  return { ok: true, issue: updated };
}
