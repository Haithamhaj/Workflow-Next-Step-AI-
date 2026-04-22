import type { StoredEvaluationRecord } from "@workflow/synthesis-evaluation";
import Link from "next/link";

async function getEvaluations(): Promise<StoredEvaluationRecord[]> {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/evaluations`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<StoredEvaluationRecord[]>;
}

export default async function EvaluationsPage() {
  const records = await getEvaluations();

  return (
    <>
      <h2>Evaluations</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        Seven-condition evaluation outputs (§20.3 seven conditions, §20.4 five axes,
        §20.5 per-axis states, §20.10 hybrid outcome, §20.11–§20.14 four outcomes).
      </p>
      <Link
        href="/evaluations/new"
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: "24px" }}
      >
        + New Evaluation
      </Link>

      {records.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No evaluations yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Evaluation ID</th>
              <th style={{ padding: "8px 12px" }}>Case ID</th>
              <th style={{ padding: "8px 12px" }}>Synthesis ID</th>
              <th style={{ padding: "8px 12px" }}>Outcome</th>
              <th style={{ padding: "8px 12px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.evaluationId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/evaluations/${r.evaluationId}`} style={{ color: "#7af" }}>
                    {r.evaluationId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.caseId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.synthesisId}
                </td>
                <td style={{ padding: "8px 12px", color: "#cfc" }}>{r.outcome}</td>
                <td style={{ padding: "8px 12px", color: "#888", fontFamily: "monospace" }}>
                  {r.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
