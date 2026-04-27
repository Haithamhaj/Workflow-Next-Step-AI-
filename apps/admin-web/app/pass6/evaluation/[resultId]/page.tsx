import { buildPass6MethodologyAnalysisReportFromRepositories } from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

interface Pass6EvaluationDetailPageProps {
  params: {
    resultId: string;
  };
}

function List({ items }: { items: string[] }) {
  return items.length === 0 ? <p className="muted">None.</p> : (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function Pass6EvaluationDetailPage({ params }: Pass6EvaluationDetailPageProps) {
  const result = buildPass6MethodologyAnalysisReportFromRepositories(params.resultId, {
    workflowReadinessResults: store.workflowReadinessResults,
    assembledWorkflowDrafts: store.assembledWorkflowDrafts,
    workflowClaims: store.workflowClaims,
    differenceInterpretations: store.differenceInterpretations,
    analysisMethodUsages: store.analysisMethodUsages,
    pass6ConfigurationProfiles: store.pass6ConfigurationProfiles,
  });

  if (!result.ok) {
    return (
      <>
        <h2>Pass 6 Analysis Report</h2>
        <p><a href="/pass6/evaluation">Back to Pass 6 Evaluation</a></p>
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Report unavailable</h3>
          <p>{result.error}</p>
        </div>
      </>
    );
  }

  const report = result.report;

  return (
    <>
      <h2>Pass 6 Analysis Report</h2>
      <p className="muted"><a href="/pass6/evaluation">Back to Pass 6 Evaluation</a></p>

      <div className="card">
        <h3>Admin/Internal Boundary</h3>
        <p><strong>Audience:</strong> {report.audience}</p>
        <p>{report.clientFacingSplitNote}</p>
        <List items={report.reportBoundaryNotes} />
      </div>

      <div className="card">
        <h3>Workflow Readiness Summary</h3>
        <p><strong>Decision:</strong> {report.workflowReadinessSummary.readinessDecision}</p>
        <p><strong>6C allowed:</strong> {report.workflowReadinessSummary.is6CAllowed ? "yes" : "no"}</p>
        <p><strong>Allowed use for 6C:</strong> {report.workflowReadinessSummary.allowedUseFor6C.join(", ")}</p>
        <p><strong>Routing recommendations:</strong> {report.workflowReadinessSummary.routingRecommendations.join(", ")}</p>
        <p><strong>Gap/risk summary:</strong> {report.workflowReadinessSummary.gapRiskSummary.summary}</p>
      </div>

      <div className="card">
        <h3>Decision Needed</h3>
        <h4>Blockers</h4>
        <List items={report.decisionNeededPanel.blockers} />
        <h4>Review Needed</h4>
        <List items={report.decisionNeededPanel.reviewNeeded} />
        <h4>Clarification Needed</h4>
        <List items={report.decisionNeededPanel.clarificationNeeded} />
        <h4>Warnings That Can Proceed</h4>
        <List items={report.decisionNeededPanel.warningsProceedable} />
      </div>

      <div className="card">
        <h3>Workflow Assembly View</h3>
        <p><strong>Draft:</strong> {report.workflowAssemblyView.draftId}</p>
        <p><strong>Understanding:</strong> {report.workflowAssemblyView.workflowUnderstandingLevel}</p>
        <h4>Steps</h4>
        <List items={report.workflowAssemblyView.steps.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Sequence</h4>
        <List items={report.workflowAssemblyView.sequence.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Decisions</h4>
        <List items={report.workflowAssemblyView.decisions.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Handoffs</h4>
        <List items={report.workflowAssemblyView.handoffs.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Controls</h4>
        <List items={report.workflowAssemblyView.controls.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Systems/Tools</h4>
        <List items={report.workflowAssemblyView.systemsTools.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Variants</h4>
        <List items={report.workflowAssemblyView.variants.map((item) => `${item.elementId}: ${item.label}`)} />
        <h4>Warnings/Caveats</h4>
        <List items={report.workflowAssemblyView.warningsCaveats} />
        <h4>Unresolved Items</h4>
        <List items={report.workflowAssemblyView.unresolvedItems} />
      </div>

      <div className="card">
        <h3>Claims Review Table</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Type</th>
              <th>Status</th>
              <th>Statement</th>
              <th>Units</th>
              <th>Context</th>
              <th>Truth Lens</th>
              <th>Confidence / Materiality</th>
              <th>Workflow Element</th>
            </tr>
          </thead>
          <tbody>
            {report.claimsReviewTable.map((claim) => (
              <tr key={claim.claimId}>
                <td>{claim.claimId}</td>
                <td>{claim.claimType}</td>
                <td>{claim.status}</td>
                <td>{claim.normalizedStatement}</td>
                <td>{claim.sourceUnitIds.join(", ")}</td>
                <td>{[...claim.participantIds, ...claim.sessionIds, ...claim.layerContextIds].join(", ")}</td>
                <td>{claim.truthLensContextIds.join(", ")}</td>
                <td>{claim.confidence ?? "unknown"} / {claim.materiality ?? "unknown"}</td>
                <td>{claim.linkedWorkflowElementIds.join(", ") || "none"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Method Usage Table</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Method</th>
              <th>Type</th>
              <th>Why selected</th>
              <th>Applied target</th>
              <th>Source</th>
              <th>Suitability</th>
              <th>Impact</th>
              <th>Version</th>
            </tr>
          </thead>
          <tbody>
            {report.methodUsageTable.map((usage) => (
              <tr key={usage.methodUsageId}>
                <td>{usage.methodKey}<br />{usage.methodName}</td>
                <td>{usage.methodType}</td>
                <td>{usage.selectionReason}</td>
                <td>{usage.appliedTarget.type}: {usage.appliedTarget.id}</td>
                <td>{usage.selectionSource}</td>
                <td>{usage.suitability.suitable ? "suitable" : "not suitable"} — {usage.suitability.notes}</td>
                <td>{usage.impactSummary}</td>
                <td>{usage.version}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Difference / Mismatch Table</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Difference</th>
              <th>Type</th>
              <th>Claims</th>
              <th>Layers/Roles</th>
              <th>Route</th>
              <th>Materiality</th>
              <th>Explanation</th>
              <th>Methods</th>
            </tr>
          </thead>
          <tbody>
            {report.differenceMismatchTable.map((difference) => (
              <tr key={difference.differenceId}>
                <td>{difference.differenceId}</td>
                <td>{difference.differenceType}</td>
                <td>{difference.involvedClaimIds.join(", ")}</td>
                <td>{[...difference.involvedLayers, ...difference.involvedRoles].join(", ")}</td>
                <td>{difference.recommendedRoute}</td>
                <td>{difference.materiality}</td>
                <td>{difference.explanation}</td>
                <td>{difference.methodUsageIds.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Seven-Condition Assessment</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Condition</th>
              <th>Status</th>
              <th>Rationale</th>
              <th>Basis</th>
              <th>Blocks Initial Package</th>
            </tr>
          </thead>
          <tbody>
            {report.sevenConditionAssessmentTable.map((condition) => (
              <tr key={condition.conditionKey}>
                <td>{condition.conditionKey}</td>
                <td>{condition.status}</td>
                <td>{condition.rationale}</td>
                <td>{condition.basis.basisId}</td>
                <td>{condition.blocksInitialPackage ? "yes" : "no"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
