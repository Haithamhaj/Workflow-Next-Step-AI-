import {
  listSynthesisInputBundlesForReview,
  summarizeSynthesisInputBundleForReview,
} from "@workflow/synthesis-evaluation";
import { store } from "../../../lib/store";

interface SynthesisInputBundleListPageProps {
  searchParams?: {
    error?: string;
  };
}

export default function SynthesisInputBundleListPage({ searchParams }: SynthesisInputBundleListPageProps) {
  const bundles = listSynthesisInputBundlesForReview(store.synthesisInputBundles);
  const summaries = bundles.map(summarizeSynthesisInputBundleForReview);

  return (
    <>
      <h2>Pass 6 SynthesisInputBundles</h2>
      <p className="muted">6A review surface for accepted Pass 5 material prepared for later synthesis. No workflow analysis, readiness evaluation, or package generation occurs here.</p>

      {searchParams?.error ? (
        <div className="card" style={{ borderColor: "#b91c1c" }}>
          <h3>Bundle Build Error</h3>
          <p>{searchParams.error}</p>
        </div>
      ) : null}

      <div className="card">
        <h3>Build Review Bundle</h3>
        <p className="muted">Creates a new SynthesisInputBundle from eligible accepted Pass 5 outputs. This action does not modify Pass 5 records.</p>
        <form action="/api/pass6/synthesis-input-bundles" method="post">
          <input type="hidden" name="action" value="build-from-case" />
          <label>
            <strong>Case ID</strong>
            <input name="caseId" placeholder="case-id" required />
          </label>
          <label>
            <strong>Optional bundle ID</strong>
            <input name="bundleId" placeholder="leave blank for generated id" />
          </label>
          <button type="submit">Build Bundle</button>
        </form>
      </div>

      <div className="card">
        <h3>Prepared Bundles</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Bundle</th>
              <th>Case</th>
              <th>Created</th>
              <th>Sessions</th>
              <th>Analysis</th>
              <th>Boundary</th>
              <th>Gap/Risk</th>
              <th>Doc Signals</th>
              <th>Review</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((summary) => (
              <tr key={summary.bundleId}>
                <td><a href={`/pass6/synthesis-input-bundles/${summary.bundleId}`}>{summary.bundleId}</a></td>
                <td>{summary.caseId}</td>
                <td>{summary.createdAt}</td>
                <td>{summary.sessionCount}</td>
                <td>{summary.folderCounts.analysis_material}</td>
                <td>{summary.folderCounts.boundary_role_limit_material}</td>
                <td>{summary.folderCounts.gap_risk_no_drop_material}</td>
                <td>{summary.folderCounts.document_source_signal_material}</td>
                <td>{summary.adminReviewRecommendedBeforeSynthesis ? "recommended" : "not flagged"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {summaries.length === 0 ? <p className="muted">No 6A bundles have been prepared yet.</p> : null}
      </div>

      <div className="card">
        <h3>6A Boundaries</h3>
        <ul>
          <li>6A prepares accepted Pass 5 material only.</li>
          <li>No workflow synthesis has occurred.</li>
          <li>No workflow readiness evaluation has occurred.</li>
          <li>No package generation has occurred.</li>
          <li>Document/source signals are signals only and are not operational truth.</li>
          <li>Open, disputed, defective, unresolved, and candidate-only items are not workflow truth.</li>
        </ul>
      </div>
    </>
  );
}
