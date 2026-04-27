import { buildPass6CopilotContextBundle } from "@workflow/prompts";
import { providerRegistry } from "@workflow/integrations";
import { store } from "../../../lib/store";

interface PageProps {
  searchParams?: {
    caseId?: string;
  };
}

function copilotRepos() {
  return {
    synthesisInputBundles: store.synthesisInputBundles,
    workflowUnits: store.workflowUnits,
    workflowClaims: store.workflowClaims,
    analysisMethodUsages: store.analysisMethodUsages,
    differenceInterpretations: store.differenceInterpretations,
    assembledWorkflowDrafts: store.assembledWorkflowDrafts,
    workflowReadinessResults: store.workflowReadinessResults,
    prePackageGateResults: store.prePackageGateResults,
    clarificationNeeds: store.clarificationNeeds,
    inquiryPackets: store.inquiryPackets,
    externalInterfaceRecords: store.externalInterfaceRecords,
    initialWorkflowPackages: store.initialWorkflowPackages,
    workflowGapClosureBriefs: store.workflowGapClosureBriefs,
    draftOperationalDocuments: store.draftOperationalDocuments,
    workflowGraphRecords: store.workflowGraphRecords,
    pass6ConfigurationProfiles: store.pass6ConfigurationProfiles,
    pass6PromptSpecs: store.pass6PromptSpecs,
    pass6CopilotContextBundles: store.pass6CopilotContextBundles,
    pass6CopilotInteractions: store.pass6CopilotInteractions,
    pass7ReviewCandidates: store.pass7ReviewCandidates,
  };
}

export default function Pass6CopilotPage({ searchParams }: PageProps) {
  const caseIds = Array.from(new Set([
    ...store.synthesisInputBundles.findAll().map((record) => record.caseId),
    ...store.workflowClaims.findAll().map((record) => record.caseId),
    ...store.workflowReadinessResults.findAll().map((record) => record.caseId),
    ...store.initialWorkflowPackages.findAll().map((record) => record.caseId),
    ...store.workflowGapClosureBriefs.findAll().map((record) => record.caseId),
  ])).sort();
  const selectedCaseId = searchParams?.caseId ?? caseIds[0] ?? "";
  const context = selectedCaseId
    ? buildPass6CopilotContextBundle({ caseId: selectedCaseId, persist: false }, copilotRepos())
    : undefined;
  const interactions = selectedCaseId
    ? store.pass6CopilotInteractions.findByCaseId(selectedCaseId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    : [];
  const providerAvailability = providerRegistry.getPromptTextAvailability();

  return (
    <>
      <h2>Pass 6 Copilot</h2>
      <p className="muted">Read-only admin copilot for discussing stored Pass 6 records. Routed actions are recommendations only.</p>

      <div className="card">
        <h3>Boundary</h3>
        <ul>
          <li>No autonomous writes, participant-facing sends, or message/email sending.</li>
          <li>No readiness recalculation, readiness override, package approval, or package eligibility change.</li>
          <li>No Pass 7 mechanics, Final Package generation, or release behavior.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Ask Copilot</h3>
        <form action="/api/pass6/copilot" method="post" style={{ display: "grid", gap: 8, maxWidth: 760 }}>
          <input type="hidden" name="action" value="ask-copilot" />
          <label>
            Case
            <select name="caseId" defaultValue={selectedCaseId}>
              {caseIds.length === 0 ? (
                <option value="">No Pass 6 cases available</option>
              ) : caseIds.map((caseId) => (
                <option key={caseId} value={caseId}>{caseId}</option>
              ))}
            </select>
          </label>
          <label>
            Provider
            <select name="providerName" defaultValue="openai">
              {providerAvailability.map((provider) => (
                <option key={provider.name} value={provider.name}>{provider.name} — {provider.available ? "available" : provider.reason}</option>
              ))}
            </select>
          </label>
          <label>
            Question
            <textarea name="question" rows={5} placeholder="Why is this workflow ready with warnings? What should I inspect next?" />
          </label>
          <button type="submit" disabled={!selectedCaseId}>Ask read-only Copilot</button>
        </form>
      </div>

      <div className="card">
        <h3>Current Context</h3>
        {context ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>{context.summary}</pre>
        ) : (
          <p className="muted">No Pass 6 context is available yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Interactions</h3>
        {interactions.length === 0 ? (
          <p className="muted">No Copilot interactions are stored for this case.</p>
        ) : interactions.map((interaction) => (
          <section key={interaction.interactionId} style={{ borderTop: "1px solid #ddd", paddingTop: 12, marginTop: 12 }}>
            <h4>{interaction.status}: {interaction.interactionId}</h4>
            <p><strong>Question:</strong> {interaction.question}</p>
            <p><strong>Provider:</strong> {interaction.providerName} / {interaction.modelName}</p>
            {interaction.failureMessage ? <p><strong>Failure:</strong> {interaction.failureMessage}</p> : null}
            <p><strong>Answer:</strong> {interaction.answer}</p>
            <p><strong>Recommendations:</strong> {interaction.routedActionRecommendations.map((action) => action.action).join(", ")}</p>
          </section>
        ))}
      </div>
    </>
  );
}
