import Link from "next/link";
import { store } from "../../lib/store";

export const dynamic = "force-dynamic";

export default function IntakeSessionsPage() {
  const sessions = store.intakeSessions.findAll();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Intake &amp; Context</h2>
        <Link href="/intake-sessions/new" className="btn-primary">
          New intake
        </Link>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          Pass 2 status: <code>pass2_not_complete</code>. This surface registers intake context only; it is not workflow analysis.
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="muted">No intake sessions yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Session ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Case ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Bucket</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Context availability</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Status</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.sessionId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/intake-sessions/${session.sessionId}`}>
                    <code>{session.sessionId}</code>
                  </Link>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{session.caseId}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{session.bucket}</td>
                <td style={{ padding: "0.5rem 0.75rem", color: "var(--fg-muted)" }}>
                  {session.bucket === "company"
                    ? "Company context provided or pending; department documents optional"
                    : "Company context optional; department documents optional"}
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{session.status}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  {new Date(session.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
