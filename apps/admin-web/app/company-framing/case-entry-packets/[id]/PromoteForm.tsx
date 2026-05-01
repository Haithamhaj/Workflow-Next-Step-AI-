"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PromoteForm({
  packetId,
  createdCaseId,
}: {
  packetId: string;
  createdCaseId?: string;
}) {
  const router = useRouter();
  const [caseId, setCaseId] = useState("");
  const [promotedBy, setPromotedBy] = useState("admin");
  const [error, setError] = useState("");
  const [created, setCreated] = useState(createdCaseId ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const response = await fetch(`/api/company-framing/case-entry-packets/${packetId}/promote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseId || undefined, promotedBy }),
    });
    const data = await response.json() as { case?: { caseId: string }; error?: string };
    if (!response.ok || !data.case) {
      setError(data.error ?? "Could not promote packet.");
      setSubmitting(false);
      return;
    }
    setCreated(data.case.caseId);
    setSubmitting(false);
    router.refresh();
  }

  if (created) {
    return <p>Promoted case: <code>{created}</code></p>;
  }

  return (
    <form data-testid="case-entry-packet-promote-form" onSubmit={submit} style={{ display: "grid", gap: "0.75rem", maxWidth: "36rem" }}>
      <p data-testid="case-entry-packet-no-session-note" className="muted">
        Promotion creates the formal case only. It does not create an intake session, IntakeSource, or SourceToCaseLink.
      </p>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Case ID</span>
        <input value={caseId} onChange={(event) => setCaseId(event.target.value)} placeholder="Optional; generated if blank" style={{ width: "100%", padding: "0.45rem 0.6rem" }} />
      </label>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Promoted by</span>
        <input value={promotedBy} onChange={(event) => setPromotedBy(event.target.value)} style={{ width: "100%", padding: "0.45rem 0.6rem" }} />
      </label>
      {error ? <p role="alert" style={{ color: "#f88", margin: 0 }}>{error}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? "Promoting..." : "Promote to formal case"}</button>
    </form>
  );
}
