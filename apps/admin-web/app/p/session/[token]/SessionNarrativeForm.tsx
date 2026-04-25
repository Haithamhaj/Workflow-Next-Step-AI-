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
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "submitting" | "submitted" | "error">(
    alreadySubmitted ? "submitted" : "idle",
  );
  const [voiceMessage, setVoiceMessage] = useState("");

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

  async function submitVoice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVoiceStatus("submitting");
    setVoiceMessage("");
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("audio") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];
    if (!file) {
      setVoiceStatus("error");
      setVoiceMessage("Choose an audio file before submitting.");
      return;
    }
    const formData = new FormData();
    formData.set("audio", file);
    const response = await fetch(`/api/participant-sessions/web/${encodeURIComponent(token)}/voice`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) {
      setVoiceStatus("error");
      setVoiceMessage(data.error ?? "The voice narrative could not be submitted.");
      return;
    }
    setVoiceStatus("submitted");
    setStatus("submitted");
    setVoiceMessage("Thank you. Your voice narrative was uploaded and saved for transcript review.");
    form.reset();
  }

  return (
    <div style={{ display: "grid", gap: "22px" }}>
      <form onSubmit={submitNarrative} style={{ display: "grid", gap: "12px" }}>
        <label htmlFor="firstNarrative" style={{ color: "#d8dee6", fontWeight: 600 }}>
          Write your answer
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
            {status === "submitting" ? "Submitting..." : "Submit written answer"}
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

      <form onSubmit={submitVoice} style={{ display: "grid", gap: "12px", borderTop: "1px solid #263141", paddingTop: "18px" }}>
        <label htmlFor="voiceNarrative" style={{ color: "#d8dee6", fontWeight: 600 }}>
          Upload a voice answer
        </label>
        <input
          id="voiceNarrative"
          name="audio"
          type="file"
          accept="audio/*"
          disabled={voiceStatus === "submitted" || voiceStatus === "submitting" || status === "submitted"}
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #334052",
            background: "#0f141b",
            color: "#eef2f6",
            padding: "10px",
          }}
        />
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            type="submit"
            disabled={voiceStatus === "submitted" || voiceStatus === "submitting" || status === "submitted"}
          >
            {voiceStatus === "submitting" ? "Uploading..." : "Submit voice answer"}
          </button>
          {voiceMessage ? (
            <span
              role={voiceStatus === "error" ? "alert" : "status"}
              style={{ color: voiceStatus === "error" ? "#ff9a9a" : "#9ed19e" }}
            >
              {voiceMessage}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}
