import { store } from "../../../../lib/store";

interface Pass6PackageDetailPageProps {
  params: {
    outputId: string;
  };
}

function List({ items }: { items: string[] }) {
  return items.length === 0 ? <p className="muted">None.</p> : (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export default function Pass6PackageDetailPage({ params }: Pass6PackageDetailPageProps) {
  const initialPackage = store.initialWorkflowPackages.findById(params.outputId);
  const brief = store.workflowGapClosureBriefs.findById(params.outputId);
  const draft = store.draftOperationalDocuments.findById(params.outputId);

  if (!initialPackage && !brief && !draft) {
    return (
      <>
        <h2>Pass 6 Output</h2>
        <p><a href="/pass6/packages">Back to 6C outputs</a></p>
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Output unavailable</h3>
          <p>Pass 6 output not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <h2>Pass 6 Output</h2>
      <p className="muted"><a href="/pass6/packages">Back to 6C outputs</a></p>

      <div className="card">
        <h3>Boundary</h3>
        <List items={[
          "This is not a Final Package.",
          "No release has occurred.",
          "No visual graph, Mermaid, or React Flow model has been generated.",
          "No provider call, Copilot runtime, Pass 7 mechanic, or external sending has occurred.",
        ]} />
      </div>

      {initialPackage ? (
        <>
          <div className="card">
            <h3>Initial Workflow Package</h3>
            <p><strong>Package:</strong> {initialPackage.packageId}</p>
            <p><strong>Status:</strong> {initialPackage.packageStatus}</p>
            <p><strong>Case:</strong> {initialPackage.caseId}</p>
            <p><strong>Readiness:</strong> {initialPackage.workflowReadinessResultId}</p>
            <p><a href={`/pass6/packages/${initialPackage.packageId}/visuals`}>View / generate visuals</a></p>
          </div>
          <div className="card">
            <h3>Client-Facing Sections</h3>
            {initialPackage.clientFacingSections.map((section) => (
              <section key={section.sectionId}>
                <h4>{section.title}</h4>
                <p style={{ whiteSpace: "pre-wrap" }}>{section.contentSummary}</p>
              </section>
            ))}
          </div>
          <div className="card">
            <h3>Warnings / Caveats</h3>
            <List items={initialPackage.warningsCaveats} />
          </div>
          <div className="card">
            <h3>Interfaces / Dependencies</h3>
            <List items={initialPackage.interfacesDependencies} />
          </div>
          <div className="card">
            <h3>Document / Reference Implications</h3>
            <List items={initialPackage.documentReferenceImplications ?? []} />
          </div>
          <div className="card">
            <h3>Admin/Internal Appendix</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{initialPackage.adminInternalAppendix ?? "None."}</p>
          </div>
        </>
      ) : null}

      {brief ? (
        <div className="card">
          <h3>Workflow Gap Closure Brief</h3>
          <p><strong>Brief:</strong> {brief.briefId}</p>
          <p><strong>Case:</strong> {brief.caseId}</p>
          <p><strong>Blocked reason:</strong> {brief.packageBlockedReason}</p>
          <h4>Currently Visible Workflow</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{brief.currentlyVisibleWorkflow}</p>
          <h4>Broken / Unknown Conditions</h4>
          <List items={brief.brokenUnknownConditions} />
          <h4>Gaps To Close</h4>
          <List items={brief.gapsToClose} />
          <h4>Recommended Route</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{brief.recommendedClarificationRoute}</p>
          <h4>Next Step</h4>
          <p>{brief.nextStepToReachPackageReadiness}</p>
        </div>
      ) : null}

      {draft ? (
        <div className="card">
          <h3>Draft Operational Document</h3>
          <p><strong>Draft:</strong> {draft.draftId}</p>
          <p><strong>Type:</strong> {draft.documentDraftType}</p>
          <p><strong>Status:</strong> {draft.draftStatus}</p>
          <p><strong>Maturity:</strong> {draft.evidenceMaturitySummary}</p>
          <h4>Sections</h4>
          {draft.sections.map((section) => (
            <section key={section.sectionId}>
              <h5>{section.title}</h5>
              <p>{section.contentSummary}</p>
            </section>
          ))}
          <h4>Limitations</h4>
          <List items={draft.limitations} />
        </div>
      ) : null}
    </>
  );
}
