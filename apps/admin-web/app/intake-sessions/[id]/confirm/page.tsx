import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export default function IntakeConfirmPage({
  params,
}: {
  params: { id: string };
}) {
  const session = store.intakeSessions.findById(params.id);
  if (!session) notFound();

  const sources = store.intakeSources.findBySessionId(params.id);

  return (
    <>
      <h2>Intake Receipt</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
      </p>

      <div className="card" style={{ marginTop: "16px" }}>
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          {sources.length} source record(s) received for <code>{session.sessionId}</code>. Provider extraction has not run.
        </p>
      </div>

      {sources.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Name / ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Kind</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Bucket</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.sourceId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/intake-sources/${source.sourceId}`}>
                    {source.displayName ?? source.fileName ?? source.websiteUrl ?? source.sourceId}
                  </Link>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.inputType}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.bucket}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{source.status}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="card" style={{ marginTop: "16px" }}>
        <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          Next in Phase 2: <Link href={`/intake-sessions/${params.id}/batch-summary`}>view batch summary</Link>.
        </p>
      </div>
    </>
  );
}
