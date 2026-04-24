import Link from "next/link";
import { notFound } from "next/navigation";
import { buildBatchSummary } from "@workflow/sources-context";
import { store } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export default function BatchSummaryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = store.intakeSessions.findById(params.id);
  if (!session) notFound();

  const items = buildBatchSummary(params.id, store.intakeSources);

  return (
    <>
      <h2>Batch Summary</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
      </p>

      <div className="card" style={{ marginTop: "16px", marginBottom: "16px" }}>
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          Batch rows come from persisted intake source records. AI suggestion fields are placeholders until provider phases.
        </p>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "var(--fg-muted)" }}>No sources registered yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Name</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Bucket</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Source kind</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>AI role</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>AI scope</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const source = store.intakeSources.findById(item.sourceId);
              return (
                <tr key={item.sourceId} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <Link href={`/intake-sources/${item.sourceId}`}>{item.displayName}</Link>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{item.bucket}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{source?.inputType ?? "unknown"}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}><code>{item.status}</code></td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{item.aiSuggestedType}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}><code>{item.aiSuggestedScope}</code></td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--fg-muted)" }}>{item.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
