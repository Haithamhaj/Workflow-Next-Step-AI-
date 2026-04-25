"use client";

import { useState } from "react";

export function SessionNarrativeForm({
  token,
  alreadySubmitted,
}: {
  token: string;
  alreadySubmitted: boolean;
}) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    alreadySubmitted ? "submitted" : "idle",
  );
  const [message, setMessage] = useState(
    alreadySubmitted
      ? "Your first narrative has already been submitted. The original text is preserved for review."
      : "",
  );

  async function submitNarrative(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const response = await fetch(`/api/participant-sessions/web/${encodeURIComponent(token)}/narrative`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narrativeText: text }),
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "The narrative could not be submitted.");
      return;
    }
    setStatus("submitted");
    setMessage("Thank you. Your first narrative was submitted and saved for review.");
    setText("");
  }

  return (
    <form onSubmit={submitNarrative} style={{ display: "grid", gap: "12px" }}>
      <label htmlFor="firstNarrative" style={{ color: "#d8dee6", fontWeight: 600 }}>
        What happens in practice?
      </label>
      <textarea
        id="firstNarrative"
        name="firstNarrative"
        value={text}
        onChange={(event) => setText(event.target.value)}
        disabled={status === "submitted" || status === "submitting"}
        rows={12}
        placeholder="Describe the workflow in your own words. Start anywhere you like."
        style={{
          width: "100%",
          minHeight: "220px",
          resize: "vertical",
          borderRadius: "6px",
          border: "1px solid #334052",
          background: "#0f141b",
          color: "#eef2f6",
          padding: "12px",
          font: "inherit",
        }}
      />
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          type="submit"
          disabled={status === "submitted" || status === "submitting" || text.trim().length === 0}
        >
          {status === "submitting" ? "Submitting..." : "Submit narrative"}
        </button>
        {message ? (
          <span
            role={status === "error" ? "alert" : "status"}
            style={{ color: status === "error" ? "#ff9a9a" : "#9ed19e" }}
          >
            {message}
          </span>
        ) : null}
      </div>
    </form>
  );
}
