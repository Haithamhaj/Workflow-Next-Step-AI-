import Link from "next/link";
import { store } from "../../../lib/store";

export const dynamic = "force-dynamic";

function scoreLabel(scoreSummary: object | undefined) {
  if (!scoreSummary) return "Not scored";
  const values = Object.values(scoreSummary).filter((value) => typeof value === "number");
  if (!values.length) return "Not scored";
  return `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}/100 avg`;
}

export default function FramingCandidatesPage({
  searchParams,
}: {
  searchParams: { companyId?: string; framingRunId?: string; status?: string; recommendation?: string };
}) {
  const candidates = (searchParams.framingRunId
    ? store.framingCandidates.findByFramingRunId(searchParams.framingRunId)
    : searchParams.companyId
      ? store.framingCandidates.findByCompanyId(searchParams.companyId)
      : store.framingCandidates.findAll())
    .filter((candidate) => !searchParams.status || candidate.status === searchParams.status)
    .filter((candidate) => !searchParams.recommendation || candidate.recommendation === searchParams.recommendation);

  return (
    <main data-testid="framing-candidate-list">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Framing candidates</h2>
          <p data-testid="framing-candidate-boundary-note" className="muted" style={{ margin: "0.4rem 0 0", maxWidth: "58rem" }}>
            Framing candidates are pre-case workflow/use-case options for operator review. They are not confirmed workflows,
            participant evidence, Pass 6 synthesis/evaluation, package-ready findings, or automation recommendations.
          </p>
        </div>
        <Link href="/company-framing/candidates/new" style={{ whiteSpace: "nowrap" }}>Create candidate</Link>
      </div>

      {candidates.length === 0 ? (
        <p className="muted">No framing candidates created yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Candidate</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Company</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Framing run</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Scope</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Anchor</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Recommendation</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Score</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Sources</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.candidateId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/company-framing/candidates/${candidate.candidateId}`}>{candidate.candidateName}</Link>
                  <br />
                  <code>{candidate.candidateId}</code>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{candidate.companyId}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{candidate.framingRunId}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  {candidate.analysisScope.scopeType}<br />
                  <span className="muted">{candidate.analysisScope.scopeLabel}</span>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{candidate.analysisScope.primaryFunctionalAnchor}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{candidate.status}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{candidate.recommendation}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{scoreLabel(candidate.scoreSummary)}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{candidate.sourceBasisIds.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
