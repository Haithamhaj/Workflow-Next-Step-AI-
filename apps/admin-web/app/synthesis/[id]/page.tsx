import type { StoredSynthesisRecord } from "@workflow/synthesis-evaluation";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getSynthesis(id: string): Promise<StoredSynthesisRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/synthesis/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<StoredSynthesisRecord>;
}

function List({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p style={{ color: "#666", fontStyle: "italic", margin: 0 }}>None recorded.</p>;
  }
  return (
    <ul style={{ paddingLeft: "20px", margin: 0 }}>
      {items.map((x, i) => (
        <li key={i} style={{ marginBottom: "4px" }}>{x}</li>
      ))}
    </ul>
  );
}

export default async function SynthesisDetailPage({ params }: { params: { id: string } }) {
  const record = await getSynthesis(params.id);
  if (record === null) notFound();

  return (
    <>
      <p style={{ marginBottom: "8px" }}>
        <Link href="/synthesis" style={{ color: "#7af" }}>← All synthesis</Link>
      </p>
      <h2 style={{ fontFamily: "monospace" }}>{record.synthesisId}</h2>

      <section style={{ marginBottom: "20px" }}>
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
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{record.caseId}</dd>
          <dt style={{ color: "#888" }}>Session ID</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>
            {record.sessionId ?? <span style={{ color: "#666" }}>—</span>}
          </dd>
          <dt style={{ color: "#888" }}>Created</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.createdAt}</dd>
        </dl>
      </section>

      <section
        data-testid="synthesis-common-path"
        style={{
          background: "#141a22",
          border: "2px solid #335",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
          Common path — §19.11
        </div>
        <div style={{ whiteSpace: "pre-wrap" }}>{record.commonPath}</div>
      </section>

      <section data-testid="synthesis-difference-blocks" style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>
          Material difference blocks
          <span style={{ color: "#666", fontWeight: "normal", marginLeft: "8px", fontSize: "0.85em" }}>
            (§19.3 — five fields per block)
          </span>
        </h3>
        {record.differenceBlocks.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No difference blocks recorded.</p>
        ) : (
          record.differenceBlocks.map((b, i) => (
            <div
              key={i}
              data-testid="synthesis-difference-block"
              style={{
                border: "1px solid #2a2a2a",
                background: "#161616",
                borderRadius: "6px",
                padding: "12px 16px",
                marginBottom: "10px",
              }}
            >
              <div style={{ color: "#888", fontSize: "0.85em", marginBottom: "6px" }}>Block {i + 1}</div>
              <dl
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr",
                  columnGap: "12px",
                  rowGap: "4px",
                  fontSize: "0.9em",
                  margin: 0,
                }}
              >
                <dt style={{ color: "#888" }}>Where</dt>
                <dd style={{ margin: 0 }}>{b.where}</dd>
                <dt style={{ color: "#888" }}>What</dt>
                <dd style={{ margin: 0 }}>{b.what}</dd>
                <dt style={{ color: "#888" }}>Participants per side</dt>
                <dd style={{ margin: 0 }}>{b.participantsPerSide}</dd>
                <dt style={{ color: "#888" }}>Why matters</dt>
                <dd style={{ margin: 0 }}>{b.whyMatters}</dd>
                <dt style={{ color: "#888" }}>Later closure path</dt>
                <dd style={{ margin: 0 }}>{b.laterClosurePath}</dd>
              </dl>
            </div>
          ))
        )}
      </section>

      <section data-testid="synthesis-major-unresolved" style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>Major unresolved items</h3>
        <List items={record.majorUnresolvedItems} />
      </section>

      <section data-testid="synthesis-closure-candidates" style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>Closure candidates</h3>
        <List items={record.closureCandidates} />
      </section>

      <section data-testid="synthesis-escalation-candidates" style={{ marginBottom: "20px" }}>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>Escalation candidates</h3>
        <List items={record.escalationCandidates} />
      </section>

      {record.confidenceEvidenceNotes ? (
        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>Confidence / evidence notes</h3>
          <div style={{ whiteSpace: "pre-wrap", color: "#bbb" }}>{record.confidenceEvidenceNotes}</div>
        </section>
      ) : null}
    </>
  );
}
