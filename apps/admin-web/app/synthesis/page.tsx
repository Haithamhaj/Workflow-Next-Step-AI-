import type { StoredSynthesisRecord } from "@workflow/synthesis-evaluation";
import Link from "next/link";

async function getSynthesisList(): Promise<StoredSynthesisRecord[]> {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/synthesis`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<StoredSynthesisRecord[]>;
}

export default async function SynthesisPage() {
  const records = await getSynthesisList();

  return (
    <>
      <h2>Synthesis</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        Per-case synthesis outputs (§19.1 hybrid common-path + material-difference-blocks,
        §19.11 minimum output fields).
      </p>
      <Link
        href="/synthesis/new"
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: "24px" }}
      >
        + New Synthesis
      </Link>

      {records.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No synthesis records yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Synthesis ID</th>
              <th style={{ padding: "8px 12px" }}>Case ID</th>
              <th style={{ padding: "8px 12px" }}>Session ID</th>
              <th style={{ padding: "8px 12px" }}>Difference Blocks</th>
              <th style={{ padding: "8px 12px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.synthesisId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/synthesis/${r.synthesisId}`} style={{ color: "#7af" }}>
                    {r.synthesisId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.caseId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.sessionId ?? <span style={{ color: "#666" }}>—</span>}
                </td>
                <td style={{ padding: "8px 12px", color: "#aaa" }}>
                  {r.differenceBlocks.length}
                </td>
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
