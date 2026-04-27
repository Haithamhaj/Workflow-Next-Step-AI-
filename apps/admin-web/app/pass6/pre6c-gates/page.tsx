import { store } from "../../../lib/store";

interface Pre6CGatesPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function Pre6CGatesPage({ searchParams }: Pre6CGatesPageProps) {
  const readinessResults = store.workflowReadinessResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const gates = store.prePackageGateResults.findAll()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <h2>Pass 6 Pre-6C Gates</h2>
      <p className="muted">Reviewable clarification and inquiry artifacts before 6C. No sending, evidence update, package generation, provider call, or Pass 7 mechanics happen here.</p>

      {searchParams?.error ? (
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Gate Error</h3>
          <p>{searchParams.error}</p>
        </div>
      ) : null}

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>No message or email has been sent.</li>
          <li>No answer has been collected.</li>
          <li>No evidence has been updated.</li>
          <li>No package or gap closure brief has been generated.</li>
          <li>No Pass 7 issue has been created.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Run Gate From Readiness Result</h3>
        {readinessResults.length === 0 ? (
          <p className="muted">No readiness results are available.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Readiness result</th>
                <th>Decision</th>
                <th>6C allowed</th>
                <th>Run gate</th>
                <th>Proceed with warnings</th>
              </tr>
            </thead>
            <tbody>
              {readinessResults.map((result) => (
                <tr key={result.resultId}>
                  <td>{result.resultId}</td>
                  <td>{result.readinessDecision}</td>
                  <td>{result.is6CAllowed ? "yes" : "no"}</td>
                  <td>
                    <form action="/api/pass6/pre6c-gates" method="post">
                      <input type="hidden" name="action" value="run-gate" />
                      <input type="hidden" name="workflowReadinessResultId" value={result.resultId} />
                      <button type="submit">Run gate</button>
                    </form>
                  </td>
                  <td>
                    {result.readinessDecision === "ready_for_initial_package_with_warnings" ? (
                      <form action="/api/pass6/pre6c-gates" method="post">
                        <input type="hidden" name="action" value="approve-proceed-with-warnings" />
                        <input type="hidden" name="workflowReadinessResultId" value={result.resultId} />
                        <input type="hidden" name="approvedBy" value="admin" />
                        <input type="hidden" name="approvalNote" value="Proceed with warnings approved from admin surface." />
                        <input type="hidden" name="reasonForProceeding" value="Admin accepted visible limitations for later 6C." />
                        <button type="submit">Approve warning path</button>
                      </form>
                    ) : <span className="muted">Not available</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Gate Results</h3>
        {gates.length === 0 ? (
          <p className="muted">No Pre-6C gate results are available yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Gate</th>
                <th>Case</th>
                <th>Readiness</th>
                <th>Decision</th>
                <th>Needs</th>
                <th>Packets</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate) => (
                <tr key={gate.gateResultId}>
                  <td><a href={`/pass6/pre6c-gates/${gate.gateResultId}`}>{gate.gateResultId}</a></td>
                  <td>{gate.caseId}</td>
                  <td>{gate.workflowReadinessResultId}</td>
                  <td>{gate.gateDecision}</td>
                  <td>{gate.clarificationNeeds.length}</td>
                  <td>{gate.inquiryPackets.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
