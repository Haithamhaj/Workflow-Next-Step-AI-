import { store } from "../../../lib/store";

export default function Pass6InterfacesPage() {
  const drafts = store.assembledWorkflowDrafts.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const readinessResults = store.workflowReadinessResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const gates = store.prePackageGateResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const interfaces = store.externalInterfaceRecords.findAll()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <>
      <h2>Pass 6 Interfaces</h2>
      <p className="muted">Cross-department and external intersections for later package and visual consumption. The selected department/use case remains the primary scope.</p>

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>No scope expansion is implemented.</li>
          <li>No external outreach or message sending occurs.</li>
          <li>No external department internal workflow is analyzed or invented.</li>
          <li>No Initial Package, Gap Closure Brief, visual graph, Copilot state, or Pass 7 record is created.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Register From Existing Context</h3>
        <form action="/api/pass6/interfaces" method="post" style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <input type="hidden" name="action" value="register-from-context" />
          <label>
            Selected department side
            <input name="selectedDepartmentSide" placeholder="Operations / selected use case" />
          </label>
          <label>
            Workflow draft
            <select name="workflowDraftId" defaultValue="">
              <option value="">Optional</option>
              {drafts.map((draft) => <option key={draft.draftId} value={draft.draftId}>{draft.draftId}</option>)}
            </select>
          </label>
          <label>
            Readiness result
            <select name="workflowReadinessResultId" defaultValue="">
              <option value="">Optional</option>
              {readinessResults.map((result) => <option key={result.resultId} value={result.resultId}>{result.resultId}</option>)}
            </select>
          </label>
          <label>
            Pre-6C gate
            <select name="prePackageGateResultId" defaultValue="">
              <option value="">Optional</option>
              {gates.map((gate) => <option key={gate.gateResultId} value={gate.gateResultId}>{gate.gateResultId}</option>)}
            </select>
          </label>
          <button type="submit">Register interface records</button>
        </form>
      </div>

      <div className="card">
        <h3>Interface Records</h3>
        {interfaces.length === 0 ? (
          <p className="muted">No interface records are available.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Interface</th>
                <th>Type</th>
                <th>External side</th>
                <th>Selected side</th>
                <th>Status</th>
                <th>Materiality</th>
                <th>Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map((record) => (
                <tr key={record.interfaceId}>
                  <td><a href={`/pass6/interfaces/${record.interfaceId}`}>{record.interfaceId}</a></td>
                  <td>{record.interfaceType}</td>
                  <td>{record.externalDepartmentOrRole}</td>
                  <td>{record.selectedDepartmentSide}</td>
                  <td>{record.confirmationStatus}</td>
                  <td>{record.materiality}</td>
                  <td>{record.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
