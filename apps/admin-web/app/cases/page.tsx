import Link from "next/link";
import type { Case } from "@workflow/persistence";

async function getCases(): Promise<Case[]> {
  const res = await fetch("http://localhost:3000/api/cases", {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<Case[]>;
}

export default async function CasesPage() {
  const cases = await getCases();

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Cases</h2>
        <Link href="/cases/new" className="btn-primary">
          + New case
        </Link>
      </div>

      {cases.length === 0 ? (
        <p className="muted">No cases yet. Create one to get started.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Case ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Domain</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Department</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>State</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.caseId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <code>{c.caseId}</code>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{c.domain}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{c.mainDepartment}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <code>{c.state}</code>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  {new Date(c.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
