import { store } from "../../../lib/store";

export default function Pass6Pass7CandidatesPage() {
  const readinessResults = store.workflowReadinessResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const gates = store.prePackageGateResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const candidates = store.pass7ReviewCandidates.findAll()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <>
      <h2>Pass 7 Review Candidates</h2>
      <p className="muted">Candidate seam records created from unresolved or review-worthy Pass 6 outputs. This page does not start Pass 7.</p>

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>This is a candidate seam only.</li>
          <li>No Pass 7 discussion has started and no issue thread has been created.</li>
          <li>No review action, final decision, Final Package, release, readiness recalculation, or package eligibility change occurs here.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Create Candidates From Pass 6 Context</h3>
        <form action="/api/pass6/pass7-candidates" method="post" style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <input type="hidden" name="action" value="create-from-pass6-context" />
          <label>
            Case ID
            <input name="caseId" placeholder="Optional when readiness/gate selected" />
          </label>
          <label>
            Workflow readiness result
            <select name="workflowReadinessResultId" defaultValue="">
              <option value="">Optional</option>
              {readinessResults.map((result) => <option key={result.resultId} value={result.resultId}>{result.resultId}</option>)}
            </select>
          </label>
          <label>
            Pre-6C gate result
            <select name="prePackageGateResultId" defaultValue="">
              <option value="">Optional</option>
              {gates.map((gate) => <option key={gate.gateResultId} value={gate.gateResultId}>{gate.gateResultId}</option>)}
            </select>
          </label>
          <button type="submit">Create candidate seam records</button>
        </form>
      </div>

      <div className="card">
        <h3>Candidate Records</h3>
        {candidates.length === 0 ? (
          <p className="muted">No Pass 7 review candidates are available.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Issue</th>
                <th>Source</th>
                <th>Materiality</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.candidateId}>
                  <td><a href={`/pass6/pass7-candidates/${candidate.candidateId}`}>{candidate.candidateId}</a></td>
                  <td>{candidate.issueType}</td>
                  <td>{candidate.sourcePass6RecordType}</td>
                  <td>{candidate.severityMateriality ?? "unknown"}</td>
                  <td>{candidate.recommendedReviewRoute}</td>
                  <td>{candidate.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
