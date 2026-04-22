import type { SessionRecord } from "@workflow/persistence";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StateBadge } from "../StateBadge";

async function getSession(id: string): Promise<SessionRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/sessions/${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<SessionRecord>;
}

export default async function SessionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (session === null) notFound();

  return (
    <>
      <p style={{ marginBottom: "8px" }}>
        <Link href="/sessions" style={{ color: "#7af" }}>
          ← All sessions
        </Link>
      </p>
      <h2 style={{ fontFamily: "monospace" }}>{session.sessionId}</h2>

      <section
        data-testid="state-panel"
        style={{
          background: "#141422",
          border: "2px solid #335",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
          Session state — §28.9
        </div>
        <StateBadge state={session.currentState} />
        <div style={{ color: "#778", fontSize: "0.85em", marginTop: "10px" }}>
          Transition rule: §28.10. Allowed forward moves depend on current state.
        </div>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>Metadata</h3>
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
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{session.caseId}</dd>

          <dt style={{ color: "#888" }}>Participant</dt>
          <dd style={{ margin: 0 }}>
            {session.participantLabel ?? <span style={{ color: "#666" }}>—</span>}
          </dd>

          <dt style={{ color: "#888" }}>Created</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>
            {session.createdAt}
          </dd>

          {session.notes ? (
            <>
              <dt style={{ color: "#888" }}>Notes</dt>
              <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{session.notes}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <section>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>
          Clarification questions
          <span style={{ color: "#666", fontWeight: "normal", marginLeft: "8px", fontSize: "0.85em" }}>
            (§17.8 — each must carry question, explanation, and example)
          </span>
        </h3>
        {session.clarificationQuestions.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>
            No clarification questions recorded for this session yet.
          </p>
        ) : (
          <ol style={{ paddingLeft: "20px" }}>
            {session.clarificationQuestions.map((q, i) => (
              <li key={i} style={{ marginBottom: "14px" }}>
                <div style={{ fontWeight: "bold", color: "#eee" }}>{q.question}</div>
                <div style={{ color: "#bbb", marginTop: "4px" }}>
                  <span style={{ color: "#888" }}>Why: </span>
                  {q.explanation}
                </div>
                <div style={{ color: "#bbb", marginTop: "2px" }}>
                  <span style={{ color: "#888" }}>Example: </span>
                  <em>{q.example}</em>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
