import type { StoredReviewIssueRecord } from "@workflow/review-issues";
import { listReviewIssues } from "@workflow/review-issues";
import Link from "next/link";
import { store } from "../../lib/store";

function getIssues(): StoredReviewIssueRecord[] {
  return listReviewIssues(store.reviewIssues);
}

function reviewColor(reviewState: string): string {
  switch (reviewState) {
    case "review_required":
      return "#ca4";
    case "issue_discussion_active":
      return "#7cf";
    case "action_taken":
      return "#c74";
    case "review_resolved":
      return "#4c7";
    default:
      return "#888";
  }
}

export default function IssuesPage() {
  const issues = getIssues();

  return (
    <>
      <h2>Review Issues</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        Pass 7 admin-only issue discussion layer: §25.4 issue brief, scoped
        discussion, controlled final actions, and review-state updates.
      </p>
      <Link
        href="/issues/new"
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: "24px" }}
      >
        + New Review Issue
      </Link>

      {issues.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No review issues yet.</p>
      ) : (
        <table
          data-testid="review-issue-list"
          style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Issue ID</th>
              <th style={{ padding: "8px 12px" }}>Case ID</th>
              <th style={{ padding: "8px 12px" }}>Initial Package</th>
              <th style={{ padding: "8px 12px" }}>Review State</th>
              <th style={{ padding: "8px 12px" }}>Actions</th>
              <th style={{ padding: "8px 12px" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.issueId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/issues/${issue.issueId}`} style={{ color: "#7af" }}>
                    {issue.issueId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {issue.caseId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {issue.initialPackageId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: reviewColor(issue.reviewState) }}>
                  {issue.reviewState}
                </td>
                <td style={{ padding: "8px 12px", color: "#aaa" }}>
                  {issue.actionHistory.length}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#888" }}>
                  {issue.updatedAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
