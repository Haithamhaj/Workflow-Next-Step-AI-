import { store } from "../../../../lib/store";

interface Pass6InterfaceDetailPageProps {
  params: {
    interfaceId: string;
  };
}

function List({ items }: { items: string[] }) {
  return items.length === 0 ? <p className="muted">None.</p> : (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function Pass6InterfaceDetailPage({ params }: Pass6InterfaceDetailPageProps) {
  const record = store.externalInterfaceRecords.findById(params.interfaceId);

  if (!record) {
    return (
      <>
        <h2>Pass 6 Interface</h2>
        <p><a href="/pass6/interfaces">Back to interfaces</a></p>
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Interface unavailable</h3>
          <p>ExternalInterfaceRecord not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Pass 6 Interface</h2>
      <p className="muted"><a href="/pass6/interfaces">Back to interfaces</a></p>

      <div className="card">
        <h3>Boundary</h3>
        <List items={[
          "Selected department/use case remains the primary scope.",
          "External internal workflow is not analyzed or invented here.",
          "No external outreach or message sending has occurred.",
          "No Initial Package, Gap Closure Brief, visual graph, Copilot state, or Pass 7 record has been created.",
        ]} />
      </div>

      <div className="card">
        <h3>Interface Summary</h3>
        <p><strong>Interface:</strong> {record.interfaceId}</p>
        <p><strong>Case:</strong> {record.caseId}</p>
        <p><strong>Type:</strong> {record.interfaceType}</p>
        <p><strong>External side:</strong> {record.externalDepartmentOrRole}</p>
        <p><strong>External system/queue:</strong> {record.externalSystemOrQueue ?? "Not specified"}</p>
        <p><strong>Selected side:</strong> {record.selectedDepartmentSide}</p>
        <p><strong>Occurs at:</strong> {record.whereItOccursInWorkflow}</p>
        <p><strong>Transferred/required:</strong> {record.whatIsTransferredOrRequired}</p>
        <p><strong>Confirmation:</strong> {record.confirmationStatus}</p>
        <p><strong>Materiality:</strong> {record.materiality}</p>
        <p><strong>Recommended action:</strong> {record.recommendedAction}</p>
        <p><strong>Draft:</strong> {record.relatedWorkflowDraftId ?? "None"}</p>
        <p><strong>Readiness:</strong> {record.relatedReadinessResultId ?? "None"}</p>
        <p><strong>Gate:</strong> {record.relatedGateResultId ?? "None"}</p>
      </div>

      <div className="card">
        <h3>Admin Marking</h3>
        <form action="/api/pass6/interfaces" method="post" style={{ display: "grid", gap: 8, maxWidth: 640 }}>
          <input type="hidden" name="action" value="mark-interface" />
          <input type="hidden" name="interfaceId" value={record.interfaceId} />
          <label>
            Confirmation status
            <select name="confirmationStatus" defaultValue={record.confirmationStatus}>
              <option value="confirmed">confirmed</option>
              <option value="assumed">assumed</option>
              <option value="unclear">unclear</option>
              <option value="unvalidated">unvalidated</option>
              <option value="disputed">disputed</option>
            </select>
          </label>
          <label>
            Materiality
            <select name="materiality" defaultValue={record.materiality}>
              <option value="non_material">non_material</option>
              <option value="warning">warning</option>
              <option value="blocker_candidate">blocker_candidate</option>
              <option value="blocker">blocker</option>
            </select>
          </label>
          <label>
            Admin note
            <textarea name="adminNote" defaultValue={record.metadata.notes ?? ""} />
          </label>
          <button type="submit">Save marking</button>
        </form>
      </div>

      <div className="card">
        <h3>Seven-Condition Effects</h3>
        <List items={record.affectsSevenCondition ?? []} />
      </div>

      <div className="card">
        <h3>Basis</h3>
        <p>{record.basis.summary ?? record.basis.basisId}</p>
        <List items={record.basis.references.map((reference) => `${reference.referenceType}: ${reference.notes ?? reference.referenceId}`)} />
      </div>

      <div className="card">
        <h3>Later Consumption</h3>
        <p><strong>Package interface note:</strong> {record.packageVisualConsumption.includeInPackageInterfaceNotes ? "yes" : "no"}</p>
        <p><strong>Visual graph candidate:</strong> {record.packageVisualConsumption.includeInVisualGraph ? "yes" : "no"}</p>
        <p><strong>Visual node status:</strong> {record.packageVisualConsumption.visualNodeStatus}</p>
      </div>

      <div className="card">
        <h3>Limitations</h3>
        <List items={record.limitationsCaveats} />
      </div>
    </>
  );
}
