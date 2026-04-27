import { store } from "../../../lib/store";

export default function Pass6PackagesPage() {
  const readinessResults = store.workflowReadinessResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const gates = store.prePackageGateResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const outputs = [
    ...store.initialWorkflowPackages.findAll().map((record) => ({
      id: record.packageId,
      caseId: record.caseId,
      type: "Initial Workflow Package",
      status: record.packageStatus,
      createdAt: record.createdAt,
    })),
    ...store.workflowGapClosureBriefs.findAll().map((record) => ({
      id: record.briefId,
      caseId: record.caseId,
      type: "Workflow Gap Closure Brief",
      status: "brief_created",
      createdAt: record.createdAt,
    })),
    ...store.draftOperationalDocuments.findAll().map((record) => ({
      id: record.draftId,
      caseId: record.caseId,
      type: "Draft Operational Document",
      status: record.draftStatus,
      createdAt: record.createdAt,
    })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <h2>Pass 6 Packages</h2>
      <p className="muted">6C output governance and generation. These outputs are not Final Packages and no release or visual generation occurs here.</p>

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>No Final Package is generated.</li>
          <li>No release occurs.</li>
          <li>No visual graph, Mermaid, or React Flow model is generated.</li>
          <li>No provider call, Copilot runtime, Pass 7 mechanic, or external sending occurs.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Generate 6C Output</h3>
        {readinessResults.length === 0 ? (
          <p className="muted">No readiness results are available.</p>
        ) : (
          <form action="/api/pass6/packages" method="post" style={{ display: "grid", gap: 8, maxWidth: 720 }}>
            <input type="hidden" name="action" value="generate-6c-output" />
            <label>
              Readiness result
              <select name="workflowReadinessResultId">
                {readinessResults.map((result) => (
                  <option key={result.resultId} value={result.resultId}>{result.resultId} — {result.readinessDecision}</option>
                ))}
              </select>
            </label>
            <label>
              Pre-6C gate
              <select name="prePackageGateResultId" defaultValue="">
                <option value="">Use latest matching gate if available</option>
                {gates.map((gate) => (
                  <option key={gate.gateResultId} value={gate.gateResultId}>{gate.gateResultId} — {gate.gateDecision}</option>
                ))}
              </select>
            </label>
            <label>
              <input type="checkbox" name="requestDraft" value="true" /> Request optional draft document
            </label>
            <label>
              Draft type
              <select name="documentDraftType" defaultValue="">
                <option value="">None</option>
                <option value="sop_draft">sop_draft</option>
                <option value="policy_draft">policy_draft</option>
                <option value="sla_supporting_reference_draft">sla_supporting_reference_draft</option>
                <option value="work_instruction_draft">work_instruction_draft</option>
                <option value="role_responsibility_guidance_draft">role_responsibility_guidance_draft</option>
                <option value="questionnaire_inquiry_set_draft">questionnaire_inquiry_set_draft</option>
              </select>
            </label>
            <label>
              Draft purpose
              <input name="purpose" placeholder="Optional purpose for draft-only document" />
            </label>
            <button type="submit">Generate governed output</button>
          </form>
        )}
      </div>

      <div className="card">
        <h3>6C Outputs</h3>
        {outputs.length === 0 ? (
          <p className="muted">No 6C outputs are available.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Output</th>
                <th>Type</th>
                <th>Case</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {outputs.map((output) => (
                <tr key={output.id}>
                  <td><a href={`/pass6/packages/${output.id}`}>{output.id}</a></td>
                  <td>{output.type}</td>
                  <td>{output.caseId}</td>
                  <td>{output.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
