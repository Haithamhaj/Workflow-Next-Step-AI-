import type { StoredFinalPackageRecord } from "@workflow/packages-output";
import Link from "next/link";

async function getFinalPackages(): Promise<StoredFinalPackageRecord[]> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/final-packages`,
    { cache: "no-store" },
  );
  if (!res.ok) return [];
  return res.json() as Promise<StoredFinalPackageRecord[]>;
}

function releaseStateColor(state: string): string {
  switch (state) {
    case "released": return "#4c7";
    case "approved_for_release": return "#7cf";
    case "pending_admin_approval": return "#ca4";
    case "not_releasable": return "#888";
    default: return "#888";
  }
}

export default async function FinalPackagesPage() {
  const records = await getFinalPackages();

  return (
    <>
      <h2>Final Packages</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        §29.8 final package — operator-initiated creation only (§25.16). Release
        requires explicit admin approval; package existence ≠ release approval (§28.16).
      </p>
      <Link
        href="/final-packages/new"
        className="btn-primary"
        style={{ display: "inline-block", marginBottom: "24px" }}
      >
        + New Final Package
      </Link>

      {records.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No final packages yet.</p>
      ) : (
        <table
          data-testid="final-package-list"
          style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Package ID</th>
              <th style={{ padding: "8px 12px" }}>Case ID</th>
              <th style={{ padding: "8px 12px" }}>Package State</th>
              <th style={{ padding: "8px 12px" }}>Release State</th>
              <th style={{ padding: "8px 12px" }}>Admin Approval</th>
              <th style={{ padding: "8px 12px" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.packageId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/final-packages/${r.packageId}`} style={{ color: "#7af" }}>
                    {r.packageId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {r.caseId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#ccc" }}>
                  {r.packageState}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    fontFamily: "monospace",
                    color: releaseStateColor(r.packageReleaseState),
                  }}
                >
                  {r.packageReleaseState}
                </td>
                <td
                  style={{
                    padding: "8px 12px",
                    fontFamily: "monospace",
                    color: r.adminApprovalStatus === "approved" ? "#4c7" : "#c88",
                  }}
                >
                  {r.adminApprovalStatus}
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
