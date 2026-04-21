import { CaseState, StateFamily } from "@workflow/contracts";

export default function DashboardPage() {
  const caseStates = Object.values(CaseState);
  const families = Object.values(StateFamily);

  return (
    <>
      <h2>Dashboard</h2>
      <p className="muted">
        Pass 1 health view. Confirms <code>@workflow/admin-web</code> can import
        contracts from <code>@workflow/contracts</code>.
      </p>

      <div className="card">
        <h3>State families ({families.length})</h3>
        <ul>
          {families.map((f) => <li key={f}><code>{f}</code></li>)}
        </ul>
      </div>

      <div className="card">
        <h3>Case states ({caseStates.length})</h3>
        <ol>
          {caseStates.map((s) => <li key={s}><code>{s}</code></li>)}
        </ol>
        <p className="muted">
          Source of truth: <code>@workflow/contracts</code> →{" "}
          <code>types/states.ts</code>.
        </p>
      </div>

      <div className="card">
        <h3>Pass 1 status</h3>
        <p>
          Repo skeleton, contracts foundation, and admin shell are in place.
          No business logic, no workflow engine, no synthesis or review behavior
          has been implemented yet — those land in later passes.
        </p>
      </div>
    </>
  );
}
