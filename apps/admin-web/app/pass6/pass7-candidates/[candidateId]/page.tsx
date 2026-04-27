import { store } from "../../../../lib/store";

export default function Pass6Pass7CandidateDetailPage({
  params,
}: {
  params: { candidateId: string };
}) {
  const candidate = store.pass7ReviewCandidates.findById(params.candidateId);

  if (!candidate) {
    return (
      <>
        <h2>Pass 7 Review Candidate</h2>
        <div className="card"><p className="muted">Candidate not found.</p></div>
      </>
    );
  }

  return (
    <>
      <h2>Pass 7 Review Candidate</h2>
      <p className="muted">Candidate seam detail only. No Pass 7 discussion, issue thread, review action, final decision, package state change, or release occurs here.</p>

      <div className="card">
        <h3>{candidate.candidateId}</h3>
        <dl>
          <dt>Case</dt>
          <dd>{candidate.caseId}</dd>
          <dt>Issue type</dt>
          <dd>{candidate.issueType}</dd>
          <dt>Reason</dt>
          <dd>{candidate.reason}</dd>
          <dt>Source</dt>
          <dd>{candidate.sourcePass6RecordType}: {candidate.sourceId}</dd>
          <dt>Recommended route</dt>
          <dd>{candidate.recommendedReviewRoute}</dd>
          <dt>Status</dt>
          <dd>{candidate.status}</dd>
          <dt>Materiality</dt>
          <dd>{candidate.severityMateriality ?? "unknown"}</dd>
        </dl>
      </div>

      <div className="card">
        <h3>Links Back To Pass 6</h3>
        <ul>
          {(candidate.linkedClaimIds ?? []).map((id) => <li key={`claim-${id}`}>Claim: {id}</li>)}
          {(candidate.linkedDifferenceIds ?? []).map((id) => <li key={`diff-${id}`}>Difference: {id}</li>)}
          {candidate.linkedWorkflowReadinessResultId ? <li>Readiness result: {candidate.linkedWorkflowReadinessResultId}</li> : null}
          {candidate.linkedPrePackageGateResultId ? <li>Pre-6C gate: {candidate.linkedPrePackageGateResultId}</li> : null}
          {candidate.linkedExternalInterfaceRecordId ? <li>External interface: {candidate.linkedExternalInterfaceRecordId}</li> : null}
          {candidate.linkedPackageOrBriefId ? <li>Package/brief: {candidate.linkedPackageOrBriefId}</li> : null}
        </ul>
      </div>

      <div className="card">
        <h3>Candidate Status</h3>
        <form action="/api/pass6/pass7-candidates" method="post" style={{ display: "grid", gap: 8, maxWidth: 720 }}>
          <input type="hidden" name="action" value="update-status" />
          <input type="hidden" name="candidateId" value={candidate.candidateId} />
          <label>
            Status
            <select name="status" defaultValue={candidate.status === "candidate_open" ? "deferred" : candidate.status}>
              <option value="accepted_for_pass7_later">Accept for later Pass 7</option>
              <option value="dismissed">Dismiss</option>
              <option value="deferred">Defer</option>
            </select>
          </label>
          <label>
            Admin note
            <textarea name="adminNote" defaultValue={candidate.adminNote ?? ""} rows={4} />
          </label>
          <button type="submit">Update candidate seam status</button>
        </form>
      </div>
    </>
  );
}
