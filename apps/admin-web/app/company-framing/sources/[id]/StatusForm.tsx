"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["uploaded", "processing", "processed", "needs_review", "failed", "superseded"] as const;

export function StatusForm({
  sourceId,
  initialStatus,
}: {
  sourceId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [failureReason, setFailureReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch(`/api/company-framing/sources/${sourceId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        failureReason: status === "failed" ? failureReason : undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setError(data.error ?? "Could not update status.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "0.75rem", maxWidth: "34rem", marginTop: "1rem" }}>
      <label>
        <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Status</span>
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={{ width: "100%", padding: "0.45rem 0.6rem" }}>
          {STATUSES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      {status === "failed" ? (
        <label>
          <span className="muted" style={{ display: "block", marginBottom: "0.25rem" }}>Failure reason</span>
          <textarea value={failureReason} onChange={(event) => setFailureReason(event.target.value)} rows={3} style={{ width: "100%", padding: "0.45rem 0.6rem" }} />
        </label>
      ) : null}

      {error ? <p role="alert" style={{ color: "#f88", margin: 0 }}>{error}</p> : null}
      <button type="submit" disabled={submitting}>
        {submitting ? "Updating..." : "Update status metadata"}
      </button>
    </form>
  );
}
