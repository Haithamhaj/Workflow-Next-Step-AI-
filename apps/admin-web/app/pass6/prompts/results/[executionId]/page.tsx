import { findPass6PromptTestExecutionResult } from "@workflow/prompts";
import { store } from "../../../../../lib/store";

interface Pass6PromptResultDetailPageProps {
  params: {
    executionId: string;
  };
}

export default function Pass6PromptResultDetailPage({ params }: Pass6PromptResultDetailPageProps) {
  const result = findPass6PromptTestExecutionResult(params.executionId, store.pass6PromptTestExecutionResults);

  if (!result) {
    return (
      <>
        <h2>Pass 6 Prompt Test Result</h2>
        <div className="card">
          <p>Prompt test execution result not found.</p>
          <p><a href="/pass6/prompts">Back to Pass 6 Prompt Workspace</a></p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Pass 6 Prompt Test Result</h2>
      <p className="muted"><a href={`/pass6/prompts/${result.promptSpecId}`}>Back to PromptSpec</a></p>

      <div className="card">
        <h3>Execution</h3>
        <p><strong>ID:</strong> {result.executionId}</p>
        <p><strong>Status:</strong> {result.status}</p>
        <p><strong>PromptSpec:</strong> {result.promptSpecId} {result.promptSpecVersion} ({result.promptStatusAtRun})</p>
        <p><strong>Test case:</strong> {result.testCaseId}</p>
        <p><strong>Provider:</strong> {result.providerName}</p>
        <p><strong>Model:</strong> {result.modelName}</p>
        <p><strong>Started:</strong> {result.startedAt}</p>
        <p><strong>Completed:</strong> {result.completedAt}</p>
        <p><strong>Latency:</strong> {result.latencyMs ?? "n/a"}</p>
      </div>

      <div className="card">
        <h3>Input Fixture Summary</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{result.inputFixtureSummary}</pre>
      </div>

      <div className="card">
        <h3>Compiled Prompt Snapshot</h3>
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: "520px", overflow: "auto" }}>{result.compiledPromptSnapshot}</pre>
      </div>

      <div className="card">
        <h3>Provider Output / Failure</h3>
        {result.status === "succeeded" ? (
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: "520px", overflow: "auto" }}>{result.outputText ?? JSON.stringify(result.outputJson, null, 2)}</pre>
        ) : (
          <>
            <p><strong>Error code:</strong> {result.errorCode}</p>
            <pre style={{ whiteSpace: "pre-wrap" }}>{result.errorMessage}</pre>
          </>
        )}
      </div>

      <div className="card">
        <h3>Boundary Record Creation</h3>
        <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(result.createdRecords, null, 2)}</pre>
      </div>
    </>
  );
}
