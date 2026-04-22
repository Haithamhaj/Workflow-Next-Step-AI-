import type { SessionRecord } from "@workflow/persistence";
import Link from "next/link";
import { StateBadge } from "./StateBadge";

async function getSessions(): Promise<SessionRecord[]> {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/sessions`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<SessionRecord[]>;
}

export default async function SessionsPage() {
  const sessions = await getSessions();

  return (
    <>
      <h2>Sessions</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        Clarification sessions per case (§28.9 SessionState, §28.10 transition rule, §17.8 clarification structure).
      </p>
      <Link
        href="/sessions/new"
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: "24px" }}
      >
        + Start Session
      </Link>

      {sessions.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No sessions registered yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9em",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Session ID</th>
              <th style={{ padding: "8px 12px" }}>Case ID</th>
              <th style={{ padding: "8px 12px" }}>Participant</th>
              <th style={{ padding: "8px 12px" }}>State</th>
              <th style={{ padding: "8px 12px" }}>Clarifications</th>
              <th style={{ padding: "8px 12px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.sessionId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/sessions/${s.sessionId}`} style={{ color: "#7af" }}>
                    {s.sessionId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {s.caseId}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  {s.participantLabel ?? <span style={{ color: "#666" }}>—</span>}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <StateBadge state={s.currentState} />
                </td>
                <td style={{ padding: "8px 12px", color: "#aaa" }}>
                  {s.clarificationQuestions.length}
                </td>
                <td style={{ padding: "8px 12px", color: "#888", fontFamily: "monospace" }}>
                  {s.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
