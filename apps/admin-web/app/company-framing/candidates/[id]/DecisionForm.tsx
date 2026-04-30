"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DecisionForm({
  candidateId,
  initialStatus,
  initialRecommendation,
  initialOperatorNotes,
  initialSplitMergeNotes,
}: {
  candidateId: string;
  initialStatus: string;
  initialRecommendation: string;
  initialOperatorNotes?: string;
  initialSplitMergeNotes?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [recommendation, setRecommendation] = useState(initialRecommendation);
  const [operatorNotes, setOperatorNotes] = useState(initialOperatorNotes ?? "");
  const [splitMergeNotes, setSplitMergeNotes] = useState(initialSplitMergeNotes ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const response = await fetch(`/api/company-framing/candidates/${candidateId}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, recommendation, operatorNotes, splitMergeNotes }),
    });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setError(data.error ?? "Could not update candidate decision.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem", maxWidth: "40rem" }}>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: "100%", padding: "0.45rem 0.6rem" }}>
          {["draft", "ready_for_review", "selected", "promoted", "dormant", "merged", "rejected"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Recommendation</span>
        <select value={recommendation} onChange={(event) => setRecommendation(event.target.value)} style={{ width: "100%", padding: "0.45rem 0.6rem" }}>
          {["promote", "defer", "merge", "split", "reject"].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Operator notes</span>
        <textarea value={operatorNotes} onChange={(event) => setOperatorNotes(event.target.value)} rows={3} style={{ width: "100%", padding: "0.45rem 0.6rem" }} />
      </label>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Split / merge notes</span>
        <textarea value={splitMergeNotes} onChange={(event) => setSplitMergeNotes(event.target.value)} rows={3} style={{ width: "100%", padding: "0.45rem 0.6rem" }} />
      </label>
      {error ? <p role="alert" style={{ color: "#f88", margin: 0 }}>{error}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? "Updating..." : "Update candidate decision metadata"}</button>
    </form>
  );
}
