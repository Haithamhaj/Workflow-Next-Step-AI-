import type { Pass6PreparedMaterialItem } from "@workflow/contracts";
import {
  findSynthesisInputBundleForReview,
  getSynthesisInputBundleReviewDetail,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

interface SynthesisInputBundleDetailPageProps {
  params: {
    bundleId: string;
  };
}

function MaterialTable({ items }: { items: Pass6PreparedMaterialItem[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Item</th>
          <th>Type</th>
          <th>Summary</th>
          <th>Basis</th>
          <th>Role Context</th>
          <th>Truth Lens</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.itemId}>
            <td>{item.itemId}</td>
            <td>{item.itemType}</td>
            <td>{item.summary}</td>
            <td>{item.basis.basisType}: {item.basis.summary ?? item.basis.basisId}</td>
            <td>{item.roleLayerContextIds?.join(", ") ?? "none"}</td>
            <td>{item.truthLensContextIds?.join(", ") ?? "none"}</td>
            <td>{item.notes ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function SynthesisInputBundleDetailPage({ params }: SynthesisInputBundleDetailPageProps) {
  const bundle = findSynthesisInputBundleForReview(params.bundleId, store.synthesisInputBundles);

  if (!bundle) {
    return (
      <>
        <h2>Pass 6 SynthesisInputBundle</h2>
        <div className="card">
          <p>SynthesisInputBundle not found.</p>
          <p><a href="/pass6/synthesis-input-bundles">Back to SynthesisInputBundles</a></p>
        </div>
      </>
    );
  }

  const detail = getSynthesisInputBundleReviewDetail(bundle);

  return (
    <>
      <h2>Pass 6 SynthesisInputBundle Detail</h2>
      <p className="muted"><a href="/pass6/synthesis-input-bundles">Back to SynthesisInputBundles</a></p>

      <div className="card">
        <h3>Bundle Identity</h3>
        <p><strong>Bundle ID:</strong> {detail.identity.bundleId}</p>
        <p><strong>Case ID:</strong> {detail.identity.caseId}</p>
        <p><strong>Created:</strong> {detail.identity.createdAt}</p>
        <p><strong>Source Pass 5 sessions:</strong> {detail.identity.sourcePass5SessionIds.join(", ") || "none"}</p>
      </div>

      <div className="card">
        <h3>Preparation Summary</h3>
        <p><strong>Sessions consumed:</strong> {detail.preparationSummary.sessionCount}</p>
        <p><strong>Analysis material:</strong> {detail.preparationSummary.folderCounts.analysis_material}</p>
        <p><strong>Boundary / role-limit material:</strong> {detail.preparationSummary.folderCounts.boundary_role_limit_material}</p>
        <p><strong>Gap / risk / no-drop material:</strong> {detail.preparationSummary.folderCounts.gap_risk_no_drop_material}</p>
        <p><strong>Document / source signal material:</strong> {detail.preparationSummary.folderCounts.document_source_signal_material}</p>
        <p><strong>Open/risk/candidate-only count:</strong> {detail.preparationSummary.openRiskCandidateOnlyCount}</p>
        <p><strong>Admin review before synthesis:</strong> {detail.preparationSummary.adminReviewRecommendedBeforeSynthesis ? "recommended" : "not flagged"}</p>
        <p><strong>Missing optional context:</strong> {detail.preparationSummary.missingOptionalContextNotes.join("; ") || "none noted"}</p>
        <p>{bundle.preparationSummary.summary}</p>
        <ul>
          {bundle.preparationSummary.noDropNotes.map((note) => <li key={note}>{note}</li>)}
        </ul>
      </div>

      <div className="card">
        <h3>Boundary Warnings</h3>
        <ul>
          {detail.boundaryWarnings.map((warning) => <li key={warning}>{warning}</li>)}
        </ul>
      </div>

      <div className="card">
        <h3>analysis_material</h3>
        <MaterialTable items={detail.folders.analysis_material} />
      </div>

      <div className="card">
        <h3>boundary_role_limit_material</h3>
        <MaterialTable items={detail.folders.boundary_role_limit_material} />
      </div>

      <div className="card">
        <h3>gap_risk_no_drop_material</h3>
        <MaterialTable items={detail.folders.gap_risk_no_drop_material} />
      </div>

      <div className="card">
        <h3>document_source_signal_material</h3>
        <p className="muted">Document/source signal material is shown as signal-only context and is not operational truth.</p>
        <MaterialTable items={detail.folders.document_source_signal_material} />
      </div>

      <div className="card">
        <h3>Risk/Open Item Visibility</h3>
        <MaterialTable items={detail.riskOpenItems} />
      </div>

      <div className="card">
        <h3>Role / Layer Context</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Context</th>
              <th>Participant</th>
              <th>Session</th>
              <th>Target Candidate</th>
              <th>Role</th>
              <th>Hierarchy Node</th>
              <th>Grouping/Layer</th>
              <th>Level Hint</th>
              <th>In Scope</th>
              <th>Target Type</th>
            </tr>
          </thead>
          <tbody>
            {detail.roleLayerContexts.map((context) => (
              <tr key={context.contextId}>
                <td>{context.contextId}</td>
                <td>{context.participantId ?? "n/a"}</td>
                <td>{context.sessionId ?? "n/a"}</td>
                <td>{context.targetCandidateId ?? "n/a"}</td>
                <td>{context.participantRole ?? context.notes ?? "n/a"}</td>
                <td>{context.hierarchyNodeId ?? "n/a"}</td>
                <td>{context.groupingLayerCategory ?? context.layer ?? "n/a"}</td>
                <td>{context.levelHint ?? "n/a"}</td>
                <td>{context.inUseCaseScope === undefined ? "n/a" : context.inUseCaseScope ? "yes" : "no"}</td>
                <td>{context.participantTargetType ?? "n/a"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Truth-Lens Context</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Context</th>
              <th>Lens</th>
              <th>Summary</th>
              <th>Limitations</th>
            </tr>
          </thead>
          <tbody>
            {detail.truthLensContexts.map((context) => (
              <tr key={context.contextId}>
                <td>{context.contextId}</td>
                <td>{context.lensType}</td>
                <td>{context.summary ?? ""}</td>
                <td>{context.limitations?.join("; ") ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
