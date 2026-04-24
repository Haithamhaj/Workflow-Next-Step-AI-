import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "../../../lib/store";
import SessionActions from "./SessionActions";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: "8px 16px 8px 0", color: "#aaa", fontWeight: 500, verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ padding: "8px 0" }}>{value}</td>
    </tr>
  );
}

export default function IntakeSessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = store.intakeSessions.findById(params.id);
  if (!session) notFound();

  const sources = store.intakeSources.findBySessionId(params.id);
  const hasCompanySource = sources.some((source) => source.bucket === "company");
  const hasDepartmentSource = sources.some((source) => source.bucket === "department");

  return (
    <>
      <h2>Intake Session</h2>
      <p>
        <Link href="/intake-sessions">&larr; Back to intake</Link>
      </p>

      <div className="card" style={{ marginTop: "16px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <Row label="Session ID" value={<code>{session.sessionId}</code>} />
            <Row label="Case ID" value={<code>{session.caseId}</code>} />
            <Row label="Primary bucket" value={session.bucket} />
            <Row label="Pass 2 status" value={<code>pass2_not_complete</code>} />
            <Row label="Processing status" value={<code>{session.status}</code>} />
            <Row label="Context purpose" value="Intake/context only; not workflow analysis" />
            <Row
              label="Company context"
              value={hasCompanySource ? "Provided in registered sources" : "Missing or skipped; non-blocking"}
            />
            <Row
              label="Department documents"
              value={hasDepartmentSource ? "Provided in registered sources" : "Unavailable or pending; non-blocking"}
            />
            <Row label="Primary department" value={session.primaryDepartment ?? "Not set"} />
            <Row label="Created" value={new Date(session.createdAt).toLocaleString()} />
          </tbody>
        </table>
      </div>

      <SessionActions sessionId={session.sessionId} status={session.status} />

      <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Link className="btn-primary" href={`/intake-sessions/${params.id}/add-note`}>
          Add manual note
        </Link>
        <Link className="btn-primary" href={`/intake-sessions/${params.id}/batch-summary`}>
          Batch summary
        </Link>
        <Link className="btn-primary" href={`/intake-sessions/${params.id}/context`}>
          Department context
        </Link>
        <Link className="btn-primary" href={`/intake-sessions/${params.id}/final-review`}>
          Final pre-hierarchy review
        </Link>
        <Link className="btn-primary" href={`/intake-sessions/${params.id}/hierarchy`}>
          Hierarchy intake
        </Link>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Context and Provider Results</h3>
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          Phase 6 structured context is available through Department context. Phase 7 final review closes intake/context framing. Pass 3 hierarchy intake is structural only and does not create participant targeting or rollout.
        </p>
      </div>

      <div style={{ marginTop: "24px" }}>
        <h3>Sources ({sources.length})</h3>
        {sources.length === 0 ? (
          <p className="muted">No sources registered yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "0.5rem 0.75rem" }}>Source ID</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Kind</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Bucket</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Name</th>
                <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
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
                  <td style={{ padding: "0.5rem 0.75rem" }}>{source.inputType}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{source.bucket}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    {source.displayName ?? source.websiteUrl ?? source.fileName ?? "Untitled source"}
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem" }}><code>{source.status}</code></td>
                  <td style={{ padding: "0.5rem 0.75rem", color: "var(--fg-muted)" }}>
                    {source.adminOverride ? "Override recorded" : "Not reviewed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
