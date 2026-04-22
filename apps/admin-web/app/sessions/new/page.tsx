"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INITIAL_STATES = [
  "not_started",
  "input_received",
  "extraction_in_progress",
  "follow_up_needed",
  "session_partial",
  "session_ready_for_synthesis",
] as const;

export default function NewSessionPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = {};
    for (const [key, value] of fd.entries()) {
      if (typeof value === "string" && value.trim() !== "") {
        payload[key] = value.trim();
      }
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        const created = (await res.json()) as { sessionId: string };
        router.push(`/sessions/${created.sessionId}`);
        return;
      }

      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (data.errors && Array.isArray(data.errors)) {
        setErrors(data.errors);
      } else if (data.error) {
        setErrors([data.error]);
      } else {
        setErrors(["Unknown error"]);
      }
    } catch {
      setErrors(["Network error — could not reach server"]);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "16px",
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    background: "#1a1a1a",
    border: "1px solid #555",
    color: "#eee",
    borderRadius: "4px",
    fontSize: "0.95em",
  };

  return (
    <>
      <h2>Start New Session</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        A clarification session is created against an existing case (§28.9). Initial state defaults to{" "}
        <code>not_started</code> (§28.10 entry point).
      </p>

      {errors.length > 0 && (
        <div
          data-testid="validation-errors"
          style={{
            background: "#3b1a1a",
            border: "1px solid #a33",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <strong style={{ color: "#f88" }}>Validation errors</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#f99" }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: "640px" }}>
        <div style={fieldStyle}>
          <label htmlFor="sessionId">Session ID *</label>
          <input
            id="sessionId"
            name="sessionId"
            style={inputStyle}
            placeholder="e.g. session-001"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input
            id="caseId"
            name="caseId"
            style={inputStyle}
            placeholder="e.g. case-001"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="participantLabel">Participant Label</label>
          <input
            id="participantLabel"
            name="participantLabel"
            style={inputStyle}
            placeholder="Optional — e.g. Ops lead, CFO"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="initialState">Initial State (§28.9)</label>
          <select id="initialState" name="initialState" style={inputStyle} defaultValue="">
            <option value="">— default (not_started) —</option>
            {INITIAL_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            placeholder="Optional operator notes"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Starting…" : "Start Session"}
        </button>
      </form>
    </>
  );
}
