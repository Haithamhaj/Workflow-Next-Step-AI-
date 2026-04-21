import { CaseState, StateFamily } from "@workflow/contracts";

export default function StatesPage() {
  return (
    <>
      <h2>States</h2>
      <p className="muted">
        Read-only view of state families and the Case state machine — sourced
        from <code>@workflow/contracts</code>. Pass 1 only enumerates Case
        states; the other families are deferred to Pass 2.
      </p>

      <div className="card">
        <h3>Families</h3>
        <ul>
          {Object.values(StateFamily).map((f) => <li key={f}><code>{f}</code></li>)}
        </ul>
      </div>

      <div className="card">
        <h3>Case state ordering (handoff §28.5)</h3>
        <ol>
          {Object.values(CaseState).map((s) => <li key={s}><code>{s}</code></li>)}
        </ol>
      </div>
    </>
  );
}
