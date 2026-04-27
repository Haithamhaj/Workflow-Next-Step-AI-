import { store } from "../../../../lib/store";

interface Pre6CGateDetailPageProps {
  params: {
    gateResultId: string;
  };
}

function List({ items }: { items: string[] }) {
  return items.length === 0 ? <p className="muted">None.</p> : (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function Pre6CGateDetailPage({ params }: Pre6CGateDetailPageProps) {
  const gate = store.prePackageGateResults.findById(params.gateResultId);

  if (!gate) {
    return (
      <>
        <h2>Pass 6 Pre-6C Gate</h2>
        <p><a href="/pass6/pre6c-gates">Back to Pre-6C Gates</a></p>
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Gate unavailable</h3>
          <p>PrePackageGateResult not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Pass 6 Pre-6C Gate</h2>
      <p className="muted"><a href="/pass6/pre6c-gates">Back to Pre-6C Gates</a></p>

      <div className="card">
        <h3>Boundary</h3>
        <List items={[
          "No message or email has been sent.",
          "No answer has been collected.",
          "No evidence has been updated.",
          "No Initial Package or Gap Closure Brief has been generated.",
          "No Pass 7 issue has been created.",
        ]} />
      </div>

      <div className="card">
        <h3>Gate Summary</h3>
        <p><strong>Gate:</strong> {gate.gateResultId}</p>
        <p><strong>Case:</strong> {gate.caseId}</p>
        <p><strong>Readiness result:</strong> {gate.workflowReadinessResultId}</p>
        <p><strong>Decision:</strong> {gate.gateDecision}</p>
        {gate.proceedWithWarningsApproval ? (
          <>
            <p><strong>Proceed approval:</strong> {gate.proceedWithWarningsApproval.approvalStatus ?? "approved"} by {gate.proceedWithWarningsApproval.approvedBy}</p>
            <p><strong>Reason:</strong> {gate.proceedWithWarningsApproval.reasonForProceeding ?? gate.proceedWithWarningsApproval.approvalNote}</p>
            <h4>Warnings Accepted</h4>
            <List items={gate.proceedWithWarningsApproval.warningsAccepted ?? []} />
            <h4>Limitations To Keep Visible</h4>
            <List items={gate.proceedWithWarningsApproval.limitationsToKeepVisible ?? []} />
          </>
        ) : null}
      </div>

      <div className="card">
        <h3>Clarification Needs</h3>
        {gate.clarificationNeeds.length === 0 ? (
          <p className="muted">No clarification needs were generated.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Need</th>
                <th>Type</th>
                <th>Question</th>
                <th>Target</th>
                <th>Why</th>
                <th>Related</th>
                <th>Expected</th>
                <th>Blocking</th>
                <th>Channel</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {gate.clarificationNeeds.map((need) => (
                <tr key={need.clarificationNeedId}>
                  <td>{need.clarificationNeedId}</td>
                  <td>{need.questionType}</td>
                  <td>{need.questionText}<br /><span className="muted">Example: {need.exampleAnswer}</span></td>
                  <td>{need.targetRecipient ?? need.targetRole ?? "unspecified"}</td>
                  <td>{need.whyItMatters}</td>
                  <td>{[need.relatedWorkflowElementId, need.relatedGapId, need.relatedSevenConditionKey, ...(need.relatedClaimIds ?? []), ...(need.relatedDifferenceIds ?? [])].filter(Boolean).join(", ")}</td>
                  <td>{need.expectedAnswerType}</td>
                  <td>{need.blockingStatus}</td>
                  <td>{need.recommendedChannel}</td>
                  <td>{need.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3>Inquiry Packets</h3>
        {gate.inquiryPackets.length === 0 ? (
          <p className="muted">No inquiry packets were generated.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>Packet</th>
                <th>Target</th>
                <th>Status</th>
                <th>Needs</th>
              </tr>
            </thead>
            <tbody>
              {gate.inquiryPackets.map((packet) => (
                <tr key={packet.inquiryPacketId}>
                  <td>{packet.inquiryPacketId}</td>
                  <td>{packet.targetRecipient ?? packet.targetRole ?? "unspecified"}</td>
                  <td>{packet.packetStatus}</td>
                  <td>{packet.clarificationNeeds.map((need) => need.clarificationNeedId).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
