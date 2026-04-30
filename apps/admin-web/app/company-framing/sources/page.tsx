import Link from "next/link";
import { store } from "../../../lib/store";

export const dynamic = "force-dynamic";

function sourceLabel(source: {
  displayName?: string;
  fileName?: string;
  websiteUrl?: string;
  noteText?: string;
}) {
  return source.displayName
    ?? source.fileName
    ?? source.websiteUrl
    ?? source.noteText?.slice(0, 64)
    ?? "Untitled framing source";
}

export default function FramingSourcesPage({
  searchParams,
}: {
  searchParams: { companyId?: string; status?: string; inputType?: string };
}) {
  const sources = (searchParams.companyId
    ? store.framingSources.findByCompanyId(searchParams.companyId)
    : store.framingSources.findAll())
    .filter((source) => !searchParams.status || source.status === searchParams.status)
    .filter((source) => !searchParams.inputType || source.inputType === searchParams.inputType);

  return (
    <main data-testid="framing-source-list">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Company framing sources</h2>
          <p
            data-testid="framing-source-boundary-note"
            className="muted"
            style={{ margin: "0.4rem 0 0", maxWidth: "58rem" }}
          >
            Framing sources are pre-case materials used for candidate framing. They are not participant evidence,
            workflow truth, case-bound IntakeSource records, or a trigger for Pass 2B processing.
          </p>
        </div>
        <Link href="/company-framing/sources/new" style={{ whiteSpace: "nowrap" }}>
          Create source
        </Link>
      </div>

      {sources.length === 0 ? (
        <p className="muted">No framing sources registered yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Source ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Company</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Type</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Name / URL</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Version</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Runs</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Created</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => (
              <tr key={source.framingSourceId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/company-framing/sources/${source.framingSourceId}`}>
                    <code>{source.framingSourceId}</code>
                  </Link>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{source.companyId}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.inputType}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{source.status}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{sourceLabel(source)}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.sourceVersion}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.framingRunIds?.length ?? 0}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.createdAt}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{source.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
