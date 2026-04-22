import type { StoredInitialPackageRecord } from "@workflow/packages-output";
import Link from "next/link";

async function getInitialPackages(): Promise<StoredInitialPackageRecord[]> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/initial-packages`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json() as Promise<StoredInitialPackageRecord[]>;
}

export default async function InitialPackagesPage() {
  const records = await getInitialPackages();

  return (
    <>
      <h2>Initial Packages</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        §21 initial package assembly — five mandatory outward sections (§21.3),
        optional document/reference implication (§21.4), status enum (§21.5),
        admin-only judgment layer (§21.11).
      </p>
      <Link
        href="/initial-packages/new"
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: "24px" }}
      >
        + New Initial Package
      </Link>

      {records.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No initial packages yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Initial Package ID</th>
              <th style={{ padding: "8px 12px" }}>Case ID</th>
              <th style={{ padding: "8px 12px" }}>Evaluation ID</th>
              <th style={{ padding: "8px 12px" }}>Status</th>
              <th style={{ padding: "8px 12px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.initialPackageId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/initial-packages/${r.initialPackageId}`} style={{ color: "#7af" }}>
                    {r.initialPackageId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.caseId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.evaluationId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#cfc" }}>
                  {r.status}
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
