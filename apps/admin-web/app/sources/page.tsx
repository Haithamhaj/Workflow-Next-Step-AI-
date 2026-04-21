import type { Source } from "@workflow/persistence";
import Link from "next/link";

async function getSources(): Promise<Source[]> {
  const res = await fetch("http://localhost:3000/api/sources", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<Source[]>;
}

export default async function SourcesPage() {
  const sources = await getSources();

  return (
    <>
      <h2>Sources</h2>
      <p>
        <Link href="/sources/new">+ Register new source</Link>
      </p>
      {sources.length === 0 ? (
        <p className="muted">No sources registered yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
              <th style={{ padding: "6px 12px" }}>Source ID</th>
              <th style={{ padding: "6px 12px" }}>Case ID</th>
              <th style={{ padding: "6px 12px" }}>Display Name</th>
              <th style={{ padding: "6px 12px" }}>Intake Type</th>
              <th style={{ padding: "6px 12px" }}>Timing Tag</th>
              <th style={{ padding: "6px 12px" }}>Authority</th>
              <th style={{ padding: "6px 12px" }}>Status</th>
              <th style={{ padding: "6px 12px" }}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.sourceId} style={{ borderBottom: "1px solid #333" }}>
                <td style={{ padding: "6px 12px", fontFamily: "monospace", fontSize: "0.85em" }}>
                  {s.sourceId}
                </td>
                <td style={{ padding: "6px 12px", fontFamily: "monospace", fontSize: "0.85em" }}>
                  {s.caseId}
                </td>
                <td style={{ padding: "6px 12px" }}>{s.displayName ?? "—"}</td>
                <td style={{ padding: "6px 12px" }}>{s.intakeType}</td>
                <td style={{ padding: "6px 12px" }}>{s.timingTag}</td>
                <td style={{ padding: "6px 12px" }}>
                  <span
                    style={{
                      background:
                        s.authority === "company_truth" ? "#1a3a1a" : "#2a2a10",
                      color:
                        s.authority === "company_truth" ? "#7f7" : "#cc9",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8em",
                    }}
                  >
                    {s.authority}
                  </span>
                </td>
                <td style={{ padding: "6px 12px", fontSize: "0.85em" }}>
                  {s.processingStatus}
                </td>
                <td style={{ padding: "6px 12px" }}>
                  <Link href={`/sources/${s.sourceId}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
