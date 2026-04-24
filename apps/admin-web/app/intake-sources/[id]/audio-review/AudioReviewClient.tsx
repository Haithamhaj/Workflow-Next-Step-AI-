"use client";

import { useState } from "react";

type Review = {
  status: string;
  rawTranscriptText?: string;
  editedTranscriptText?: string;
  providerJobId?: string;
  rawTranscriptArtifactId?: string;
  trustedTranscriptArtifactId?: string;
  rejectionReason?: string;
  providerQualitySignal?: string;
};

export default function AudioReviewClient({
  sourceId,
  initialReview,
}: {
  sourceId: string;
  initialReview: Review;
}) {
  const [review, setReview] = useState(initialReview);
  const [editedText, setEditedText] = useState(initialReview.editedTranscriptText ?? initialReview.rawTranscriptText ?? "");
  const [message, setMessage] = useState<string | null>(null);

  async function startTranscription() {
    setMessage("Starting transcription...");
    const response = await fetch(`/api/intake-sources/${sourceId}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    if (data.review) {
      setReview(data.review);
      setEditedText(data.review.editedTranscriptText ?? data.review.rawTranscriptText ?? "");
      setMessage(data.errorMessage ?? `Transcription job ${data.status}.`);
    } else {
      setMessage(data.error ?? "Unable to start transcription.");
    }
  }

  async function decide(action: "approve" | "edit" | "reject") {
    const response = await fetch(`/api/intake-sources/${sourceId}/audio-review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        editedTranscriptText: editedText,
        rejectionReason: action === "reject" ? "Rejected or marked for retry by admin." : undefined,
      }),
    });
    const data = await response.json();
    if (data.review) {
      setReview(data.review);
      setMessage(`Review status: ${data.review.status}`);
    } else {
      setMessage(data.error ?? "Unable to save review decision.");
    }
  }

  return (
    <div className="card" style={{ marginTop: "16px" }}>
      <h3 style={{ margin: "0 0 8px" }}>Review Controls</h3>
      <p style={{ color: "var(--fg-muted)" }}>
        Status: <code>{review.status}</code>
        {review.providerQualitySignal ? ` — ${review.providerQualitySignal}` : ""}
      </p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        <button type="button" onClick={startTranscription}>Start transcription</button>
        <button type="button" onClick={() => decide("approve")}>Approve as-is</button>
        <button type="button" onClick={() => decide("edit")}>Save edited transcript</button>
        <button type="button" onClick={() => decide("reject")}>Reject / retry needed</button>
      </div>
      {message && <p style={{ color: "var(--fg-muted)" }}>{message}</p>}
      {review.rawTranscriptText ? (
        <>
          <h4>Raw transcript draft</h4>
          <pre style={{ whiteSpace: "pre-wrap", maxHeight: "180px", overflow: "auto" }}>{review.rawTranscriptText}</pre>
        </>
      ) : (
        <p style={{ color: "var(--fg-muted)" }}>No raw transcript is available yet.</p>
      )}
      <label htmlFor="editedTranscript" style={{ display: "block", marginBottom: "6px" }}>
        Editable transcript
      </label>
      <textarea
        id="editedTranscript"
        value={editedText}
        onChange={(event) => setEditedText(event.target.value)}
        rows={10}
        style={{ width: "100%", font: "inherit" }}
      />
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
        Only approved or edited transcript text becomes trusted text for later source-role suggestion and structured context.
      </p>
    </div>
  );
}
