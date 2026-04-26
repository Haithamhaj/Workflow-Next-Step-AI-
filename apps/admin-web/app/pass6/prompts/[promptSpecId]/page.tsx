import {
  comparePass6PromptDraftToActive,
  createDefaultPass6PromptSpecs,
  findPass6PromptSpec,
  listPass6PromptTestExecutionResults,
  listPass6PromptTestCases,
} from "@workflow/prompts";
import { providerRegistry } from "@workflow/integrations";
import { store } from "../../../../lib/store";

interface Pass6PromptDetailPageProps {
  params: {
    promptSpecId: string;
  };
  searchParams?: {
    error?: string;
  };
}

export default function Pass6PromptDetailPage({ params, searchParams }: Pass6PromptDetailPageProps) {
  createDefaultPass6PromptSpecs(store.pass6PromptSpecs);
  const spec = findPass6PromptSpec(params.promptSpecId, store.pass6PromptSpecs);

  if (!spec) {
    return (
      <>
        <h2>Pass 6 PromptSpec</h2>
        <div className="card">
          <p>PromptSpec not found.</p>
          <p><a href="/pass6/prompts">Back to Pass 6 Prompt Workspace</a></p>
        </div>
      </>
    );
  }

  const comparison = comparePass6PromptDraftToActive(spec.capabilityKey, store.pass6PromptSpecs);
  const testCases = listPass6PromptTestCases(spec.promptSpecId, store.pass6PromptTestCases);
  const executions = listPass6PromptTestExecutionResults(spec.promptSpecId, store.pass6PromptTestExecutionResults)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const providerAvailability = providerRegistry.getPromptTextAvailability();
  const canArchive = spec.status !== "active" && spec.status !== "archived";

  return (
    <>
      <h2>Pass 6 PromptSpec Detail</h2>
      <p className="muted"><a href="/pass6/prompts">Back to Pass 6 Prompt Workspace</a></p>

      {searchParams?.error ? (
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Save Error</h3>
          <p>{searchParams.error}</p>
        </div>
      ) : null}

      <div className="card">
        <h3>{spec.name}</h3>
        <p><strong>ID:</strong> {spec.promptSpecId}</p>
        <p><strong>Capability:</strong> {spec.capabilityKey}</p>
        <p><strong>Status:</strong> {spec.status}</p>
        <p><strong>Version:</strong> {spec.version}</p>
        <p><strong>Description:</strong> {spec.description}</p>
        <p><strong>Provider preference:</strong> {spec.providerPreference?.providerKey ?? "none"} {spec.providerPreference?.modelKey ?? ""}</p>
        <p><strong>Linked policy config:</strong> {spec.linkedPolicyConfigId ?? "none"} {spec.linkedPolicyConfigVersion ?? ""}</p>
      </div>

      <div className="card">
        <h3>Lifecycle Controls</h3>
        {spec.status === "draft" ? (
          <form action="/api/pass6/prompts" method="post">
            <input type="hidden" name="action" value="promote" />
            <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
            <button type="submit">Promote Draft To Active</button>
          </form>
        ) : null}
        {spec.status === "active" || spec.status === "previous" ? (
          <form action="/api/pass6/prompts" method="post">
            <input type="hidden" name="action" value="clone-to-draft" />
            <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
            <button type="submit">Clone To Draft</button>
          </form>
        ) : null}
        {canArchive ? (
          <form action="/api/pass6/prompts" method="post">
            <input type="hidden" name="action" value="archive" />
            <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
            <input type="hidden" name="reason" value="Archived from admin Prompt Workspace." />
            <button type="submit">Archive</button>
          </form>
        ) : null}
      </div>

      <div className="card">
        <h3>Structured Section Editor</h3>
        {spec.status === "draft" ? (
          <form action="/api/pass6/prompts" method="post">
            <input type="hidden" name="action" value="update-sections" />
            <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
            <label htmlFor="pass6-prompt-sections"><strong>Editable sections JSON</strong></label>
            <textarea
              id="pass6-prompt-sections"
              name="sectionsJson"
              rows={26}
              style={{ width: "100%", fontFamily: "monospace", marginTop: "8px" }}
              defaultValue={JSON.stringify(spec.sections, null, 2)}
            />
            <button type="submit">Save Structured Sections</button>
          </form>
        ) : (
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: "420px", overflow: "auto" }}>{JSON.stringify(spec.sections, null, 2)}</pre>
        )}
      </div>

      <div className="card">
        <h3>Compiled Prompt Preview</h3>
        <pre style={{ whiteSpace: "pre-wrap", maxHeight: "520px", overflow: "auto" }}>{spec.compiledPromptPreview}</pre>
      </div>

      <div className="card">
        <h3>Draft vs Active Comparison</h3>
        <p><strong>Active:</strong> {comparison.activePromptSpecId ?? "none"}</p>
        <p><strong>Draft:</strong> {comparison.draftPromptSpecId ?? "none"}</p>
        <p><strong>Changed sections:</strong> {comparison.changedSections.join(", ") || "none"}</p>
        <p>{comparison.summary}</p>
      </div>

      <div className="card">
        <h3>Test Cases</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Enabled</th>
              <th>Updated</th>
              <th>Run</th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((testCase) => (
              <tr key={testCase.testCaseId}>
                <td>{testCase.name}</td>
                <td>{testCase.status}</td>
                <td>{testCase.enabled ? "yes" : "no"}</td>
                <td>{testCase.updatedAt}</td>
                <td>
                  <form action="/api/pass6/prompts" method="post">
                    <input type="hidden" name="action" value="run-test" />
                    <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
                    <input type="hidden" name="testCaseId" value={testCase.testCaseId} />
                    <input type="hidden" name="providerName" value="openai" />
                    <button type="submit">Run Test</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form action="/api/pass6/prompts" method="post" style={{ marginTop: "16px" }}>
          <input type="hidden" name="action" value="create-test-case" />
          <input type="hidden" name="promptSpecId" value={spec.promptSpecId} />
          <label>
            <strong>Test case name</strong>
            <input name="testCaseName" defaultValue={`${spec.name} sample context`} />
          </label>
          <label>
            <strong>Input fixture JSON</strong>
            <textarea
              name="inputFixtureJson"
              rows={8}
              style={{ width: "100%", fontFamily: "monospace", marginTop: "8px" }}
              defaultValue={JSON.stringify({ sampleContext: "Offline Prompt Workspace fixture; no provider execution." }, null, 2)}
            />
          </label>
          <label>
            <strong>Expected output notes</strong>
            <textarea
              name="expectedOutputNotes"
              rows={4}
              style={{ width: "100%", marginTop: "8px" }}
              defaultValue="Expected output should preserve locked governance boundaries and stay within the output contract."
            />
          </label>
          <input type="hidden" name="testCaseStatus" value="enabled" />
          <button type="submit">Create Test Case</button>
        </form>
      </div>

      <div className="card">
        <h3>Provider Test Harness</h3>
        <p><strong>Default Pass 6 text test provider:</strong> {providerRegistry.resolveDefaultPromptTextProvider()}</p>
        <ul>
          {providerAvailability.map((provider) => (
            <li key={provider.name}>{provider.name}: {provider.available ? "available" : "unavailable"} — {provider.reason}</li>
          ))}
        </ul>
        <p className="muted">Prompt Workspace test outputs are inspection records only. They do not become 6A evidence, 6B claims, readiness results, package content, visuals, Copilot state, or Pass 7 candidates.</p>
      </div>

      <div className="card">
        <h3>Latest Test Results</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Execution</th>
              <th>Test Case</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Model</th>
              <th>Started</th>
              <th>Latency</th>
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => (
              <tr key={execution.executionId}>
                <td><a href={`/pass6/prompts/results/${execution.executionId}`}>{execution.executionId}</a></td>
                <td>{execution.testCaseId}</td>
                <td>{execution.status}</td>
                <td>{execution.providerName}</td>
                <td>{execution.modelName}</td>
                <td>{execution.startedAt}</td>
                <td>{execution.latencyMs ?? "n/a"}</td>
                <td>{execution.status === "succeeded" ? (execution.outputText ?? "output captured") : `${execution.errorCode}: ${execution.errorMessage}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Locked Prompt Boundaries</h3>
        <ul>
          <li>Prompt cannot make document claims operational truth by default.</li>
          <li>Prompt cannot approve Initial Package by score alone.</li>
          <li>Prompt cannot bypass admin review for material conflicts.</li>
          <li>Prompt cannot make Copilot write state autonomously.</li>
          <li>Prompt cannot make visual renderer own workflow truth.</li>
          <li>Prompt cannot start Pass 7 mechanics.</li>
        </ul>
      </div>
    </>
  );
}
