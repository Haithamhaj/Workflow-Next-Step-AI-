import Link from "next/link";
import type { Case } from "@workflow/persistence";
import { listCases } from "@workflow/core-case";
import { DEFAULT_LOCAL_COMPANY_ID } from "@workflow/persistence";
import { store } from "../../lib/store";

function getCases(companyId: string): Case[] {
  return listCases(store.cases, companyId);
}

export default function CasesPage({ searchParams }: { searchParams?: { companyId?: string } }) {
  const selectedCompanyId = searchParams?.companyId ?? DEFAULT_LOCAL_COMPANY_ID;
  const companies = store.companies.findAll();
  const cases = getCases(selectedCompanyId);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>Cases</h2>
        <Link href="/cases/new" className="btn-primary">
          + New case
        </Link>
      </div>

      <form method="get" style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label htmlFor="companyId" className="muted">Company</label>
        <select id="companyId" name="companyId" defaultValue={selectedCompanyId}>
          {companies.map((company) => (
            <option key={company.companyId} value={company.companyId}>
              {company.displayName}
            </option>
          ))}
        </select>
        <button type="submit" className="btn-primary">Load</button>
      </form>

      {cases.length === 0 ? (
        <p className="muted">No cases yet. Create one to get started.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Case ID</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Company</th>
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
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <code>{c.companyId}</code>
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
