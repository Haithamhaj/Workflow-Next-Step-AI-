import { store } from "../../../lib/store";

export default function Pass6EvaluationPage() {
  const results = store.workflowReadinessResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <h2>Pass 6 Evaluation</h2>
      <p className="muted">Admin/internal Methodology and Analysis Report surface for completed 6B outputs. This view does not generate packages, Pre-6C questions, provider calls, or Pass 7 candidates.</p>

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>No client-facing Initial Workflow Package has been generated.</li>
          <li>No Pre-6C questions have been generated.</li>
          <li>No Pass 7 candidates have been created.</li>
          <li>No readiness override action is available here.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Workflow Readiness Results</h3>
        {results.length === 0 ? (
          <p className="muted">No Pass 6 readiness results are available yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Result</th>
                <th>Case</th>
                <th>Decision</th>
                <th>6C allowed</th>
                <th>Allowed use</th>
                <th>Routing</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.resultId}>
                  <td><a href={`/pass6/evaluation/${result.resultId}`}>{result.resultId}</a></td>
                  <td>{result.caseId}</td>
                  <td>{result.readinessDecision}</td>
                  <td>{result.is6CAllowed ? "yes" : "no"}</td>
                  <td>{result.allowedUseFor6C.join(", ")}</td>
                  <td>{result.routingRecommendations.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
