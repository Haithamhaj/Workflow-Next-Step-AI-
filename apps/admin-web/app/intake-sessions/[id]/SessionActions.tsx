"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SessionActionsProps {
  sessionId: string;
  status: string;
}

export default function SessionActions({ sessionId, status }: SessionActionsProps) {
  const router = useRouter();
  const [department, setDepartment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const inputStyle: React.CSSProperties = {
    padding: "0.4rem 0.6rem",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: "inherit",
  };

  const btnStyle: React.CSSProperties = {
    padding: "0.4rem 0.8rem",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  };

  async function patchSession(body: Record<string, unknown>) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/intake-sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Update failed");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "16px" }}>
      {error && (
        <div
          style={{
            background: "#3b1a1a",
            border: "1px solid #a33",
            borderRadius: "6px",
            padding: "0.5rem 0.75rem",
            marginBottom: "0.75rem",
            color: "#f88",
            fontSize: "0.85rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Primary Department (admin-selected, not AI auto) */}
      <div
        className="card"
        style={{
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <label style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          Set Primary Department:
        </label>
        <input
          style={inputStyle}
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="e.g. Engineering"
        />
        <button
          style={btnStyle}
          disabled={submitting || !department}
          onClick={() => patchSession({ primaryDepartment: department })}
        >
          Set
        </button>
      </div>

      {/* Status advance */}
      <div
        className="card"
        style={{
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          Advance status:
        </span>
        <button
          style={btnStyle}
          disabled={submitting}
          onClick={() => patchSession({ status: "sources_received" })}
        >
          Sources Received
        </button>
        <button
          style={btnStyle}
          disabled={submitting}
          onClick={() => patchSession({ status: "batch_summary_ready" })}
        >
          Batch Summary Ready
        </button>
      </div>
    </div>
  );
}
