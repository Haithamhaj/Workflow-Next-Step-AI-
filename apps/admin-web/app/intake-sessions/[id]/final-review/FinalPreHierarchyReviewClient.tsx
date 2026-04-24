"use client";

import { useState } from "react";

type Payload = {
  readiness: { ready: boolean; reasons: string[] };
  review: any;
  framing: any;
  structuredContext: any;
  sources: any[];
};

export default function FinalPreHierarchyReviewClient({
  sessionId,
  initial,
}: {
  sessionId: string;
  initial: Payload;
}) {
  const [data, setData] = useState(initial);
  const [confirmedBy, setConfirmedBy] = useState("admin");
  const [adminNote, setAdminNote] = useState("");
  const [message, setMessage] = useState("");

  async function post(action: string) {
    setMessage("");
    const response = await fetch(`/api/intake-sessions/${sessionId}/final-pre-hierarchy-review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, confirmedBy, adminNote }),
    });
    const payload = await response.json();
    setData((current) => ({
      ...current,
      readiness: payload.readiness ?? current.readiness,
      review: payload.review ?? current.review,
    }));
    setMessage(response.ok ? `${action} saved` : payload.error ?? "Request failed");
  }

  const review = data.review;
  const framing = data.framing;
  const structuredContext = data.structuredContext?.context;
  const sources = data.sources ?? [];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Readiness</h3>
        <p><strong>Status:</strong> {data.readiness.ready ? "ready for final review" : "blocked"}</p>
        {data.readiness.reasons.length ? (
          <ul>
            {data.readiness.reasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        ) : null}
        <button className="btn-primary" onClick={() => post("generate")}>Generate final review</button>
        {message ? <p className="muted">{message}</p> : null}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Framing Summary</h3>
        <p><strong>Company context:</strong> {review?.companyContextAvailabilityStatus ?? framing?.companyContextAvailabilityStatus ?? "not saved"}</p>
        <p><strong>Department context:</strong> {review?.departmentContextAvailabilityStatus ?? framing?.departmentContextAvailabilityStatus ?? "not saved"}</p>
        <p><strong>Selected department:</strong> {review?.selectedPrimaryDepartment ?? framing?.activeDepartmentLabel ?? "not selected"}</p>
        <p><strong>Custom department:</strong> {review?.customDepartmentLabel ?? framing?.customDepartmentLabel ?? "none"}</p>
        <p><strong>Internal mapping:</strong> {review?.internalDepartmentFamilyMapping ?? framing?.acceptedInternalFamily ?? "none"}</p>
        <p><strong>Mapping decision:</strong> {review?.mappingDecisionStatus ?? framing?.mappingDecision ?? "not saved"}</p>
        <p><strong>Use case:</strong> {review?.selectedUseCase ?? framing?.selectedUseCase ?? "not selected"}</p>
        <p><strong>Use case boundary:</strong> {review?.useCaseBoundaryStatus ?? framing?.useCaseBoundaryStatus ?? "not saved"}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sources and Batch</h3>
        <p><strong>Registered sources:</strong> {sources.length}</p>
        <ul>
          {(review?.sourceSummary ?? []).map((item: any) => (
            <li key={`${item.bucket}:${item.sourceKind}`}>{item.bucket} / {item.sourceKind}: {item.count}</li>
          ))}
        </ul>
        <p className="muted">Batch summary ref: {review?.batchSummaryRef ?? `intake-session:${sessionId}:batch-summary`}</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Structured Context</h3>
        <p><strong>Structured context:</strong> {review?.structuredContextId ?? data.structuredContext?.structuredContextId ?? "missing"}</p>
        <p><strong>Company summary:</strong> {review?.structuredContextSummary?.companyContextSummary ?? structuredContext?.companyContextSummary ?? "missing"}</p>
        <p><strong>Department summary:</strong> {review?.structuredContextSummary?.departmentContextSummary ?? structuredContext?.departmentContextSummary ?? "missing"}</p>
        <p><strong>Evidence fields:</strong> {review?.structuredContextSummary?.evidenceFieldCount ?? Object.keys(structuredContext?.fieldEvidence ?? {}).length}</p>
        <details>
          <summary>Field evidence summary</summary>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(review?.evidenceSummary ?? structuredContext?.fieldEvidence ?? {}, null, 2)}</pre>
        </details>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Risks, Caveats, and Next Step</h3>
        <ul>
          {(review?.unresolvedContextRisks ?? structuredContext?.keyContextSignalsAndRisks ?? []).map((risk: string) => <li key={risk}>{risk}</li>)}
        </ul>
        {review?.crawlRuntimeCaveat ? <p><strong>Crawl4AI caveat:</strong> {review.crawlRuntimeCaveat}</p> : null}
        {(review?.audioTranscriptConfidenceNotes ?? []).map((note: string) => <p key={note}><strong>Audio confidence:</strong> {note}</p>)}
        <p><strong>Next step:</strong> {review?.nextSliceName ?? "Hierarchy Intake & Approval Build Slice"}</p>
        <p className="muted">Hierarchy intake, hierarchy drafts, participant targeting, rollout readiness, synthesis/evaluation, final package, and video input are not active here.</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Admin Confirmation</h3>
        <p><strong>Confirmation status:</strong> {review?.adminConfirmationStatus ?? "not_confirmed"}</p>
        <label>Confirmed by</label>
        <input value={confirmedBy} onChange={(event) => setConfirmedBy(event.target.value)} />
        <label>Admin note</label>
        <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
        <button className="btn-primary" onClick={() => post("confirm")}>Confirm final pre-hierarchy review</button>
      </div>
    </div>
  );
}
