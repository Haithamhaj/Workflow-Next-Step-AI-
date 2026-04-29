import type { StoredReviewIssueRecord } from "@workflow/review-issues";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IssueDetailClient } from "./IssueDetailClient";

const DEFAULT_COMPANY_ID = "company-default-local";

async function getIssue(id: string): Promise<StoredReviewIssueRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/issues/${encodeURIComponent(id)}?companyId=${encodeURIComponent(DEFAULT_COMPANY_ID)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<StoredReviewIssueRecord>;
}

export default async function IssueDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const issue = await getIssue(params.id);
  if (issue === null) notFound();

  return (
    <>
      <p style={{ marginBottom: "8px" }}>
        <Link href="/issues" style={{ color: "#7af" }}>← All review issues</Link>
      </p>
      <h2 style={{ fontFamily: "monospace" }}>{issue.issueId}</h2>

      <section style={{ marginBottom: "20px" }}>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            columnGap: "16px",
            rowGap: "6px",
            fontSize: "0.9em",
          }}
        >
          <dt style={{ color: "#888" }}>Case ID</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{issue.caseId}</dd>
          <dt style={{ color: "#888" }}>Initial Package</dt>
          <dd style={{ margin: 0 }}>
            <Link href={`/initial-packages/${issue.initialPackageId}`} style={{ color: "#7af", fontFamily: "monospace" }}>
              {issue.initialPackageId}
            </Link>
          </dd>
          <dt style={{ color: "#888" }}>Evaluation</dt>
          <dd style={{ margin: 0 }}>
            <Link href={`/evaluations/${issue.evaluationId}`} style={{ color: "#7af", fontFamily: "monospace" }}>
              {issue.evaluationId}
            </Link>
          </dd>
          {issue.synthesisId ? (
            <>
              <dt style={{ color: "#888" }}>Synthesis</dt>
              <dd style={{ margin: 0 }}>
                <Link href={`/synthesis/${issue.synthesisId}`} style={{ color: "#7af", fontFamily: "monospace" }}>
                  {issue.synthesisId}
                </Link>
              </dd>
            </>
          ) : null}
          <dt style={{ color: "#888" }}>Created</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{issue.createdAt}</dd>
          <dt style={{ color: "#888" }}>Updated</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{issue.updatedAt}</dd>
        </dl>
      </section>

      <IssueDetailClient issue={issue} />
    </>
  );
}
