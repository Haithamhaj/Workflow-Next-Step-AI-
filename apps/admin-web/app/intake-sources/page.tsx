import Link from "next/link";
import { store } from "../../lib/store";

export const dynamic = "force-dynamic";

export default function IntakeSourcesPage({
  searchParams,
}: {
  searchParams: { sessionId?: string };
}) {
  const sources = searchParams.sessionId
    ? store.intakeSources.findBySessionId(searchParams.sessionId)
    : store.intakeSources.findAll();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Intake Sources</h2>
        {searchParams.sessionId && (
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            Filtered by session: <code>{searchParams.sessionId}</code>
          </span>
        )}
      </div>

      {sources.length === 0 ? (
        <p className="muted">No intake sources registered yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Source ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Session</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Kind</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Bucket</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Name / URL</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Processing</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Admin review</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.sourceId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/intake-sources/${source.sourceId}`}>
                    <code>{source.sourceId}</code>
                  </Link>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/intake-sessions/${source.sessionId}`}>
                    <code>{source.sessionId}</code>
                  </Link>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.inputType}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.bucket}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  {source.displayName ?? source.websiteUrl ?? source.fileName ?? "Untitled source"}
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{source.status}</code></td>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--fg-muted)" }}>
                  {source.adminOverride ? "Admin override recorded" : "Not reviewed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
