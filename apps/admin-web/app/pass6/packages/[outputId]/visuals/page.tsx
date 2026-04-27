import { store } from "../../../../../lib/store";

interface PackageVisualsPageProps {
  params: {
    outputId: string;
  };
}

function JsonBlock({ value }: { value: unknown }) {
  return <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>{JSON.stringify(value, null, 2)}</pre>;
}

export default function PackageVisualsPage({ params }: PackageVisualsPageProps) {
  const initialPackage = store.initialWorkflowPackages.findById(params.outputId);
  const visuals = store.workflowGraphRecords.findAll()
    .filter((record) => {
      const metadata = record.workflowGraphJson.metadata as Record<string, unknown> | undefined;
      return metadata?.packageId === params.outputId;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const latest = visuals[0];

  return (
    <>
      <h2>Pass 6 Package Visuals</h2>
      <p className="muted"><a href={`/pass6/packages/${params.outputId}`}>Back to package</a></p>

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>WDE owns workflow truth, package eligibility, and WorkflowGraph JSON construction.</li>
          <li>workflow-visual-core owns validation, Mermaid rendering, and React Flow adapter output.</li>
          <li>No workflow analysis, readiness recalculation, package eligibility change, provider call, Copilot runtime, Pass 7 mechanic, Final Package, or release occurs here.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Generate Visuals</h3>
        {initialPackage ? (
          <form action={`/api/pass6/packages/${params.outputId}/visuals`} method="post">
            <button type="submit">Generate package visuals</button>
          </form>
        ) : (
          <p className="muted">InitialWorkflowPackage not found.</p>
        )}
      </div>

      {latest ? (
        <>
          <div className="card">
            <h3>Visual Record</h3>
            <p><strong>Visual:</strong> {latest.visualRecordId}</p>
            <p><strong>Case:</strong> {latest.caseId}</p>
            <p><strong>Draft:</strong> {latest.assembledWorkflowDraftId}</p>
            <p><strong>Validation errors:</strong> {latest.visualValidationErrors.length}</p>
          </div>

          {latest.visualValidationErrors.length > 0 ? (
            <div className="card" style={{ borderColor: "#b91c1c" }}>
              <h3>Validation Errors</h3>
              <ul>
                {latest.visualValidationErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          ) : null}

          <div className="card">
            <h3>Mermaid</h3>
            <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>{latest.workflowMermaid || "Not generated because graph validation failed."}</pre>
          </div>

          <div className="card">
            <h3>WorkflowGraph JSON</h3>
            <JsonBlock value={latest.workflowGraphJson} />
          </div>

          <div className="card">
            <h3>React Flow Model</h3>
            <JsonBlock value={latest.workflowReactFlowModel} />
          </div>
        </>
      ) : (
        <div className="card">
          <h3>No Visuals</h3>
          <p className="muted">No visual record has been generated for this package yet.</p>
        </div>
      )}
    </>
  );
}
