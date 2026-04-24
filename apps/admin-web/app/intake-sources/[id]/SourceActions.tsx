"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SourceActionsProps {
  sourceId: string;
  status: string;
}

export default function SourceActions({ sourceId, status }: SourceActionsProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function patchStatus(newStatus: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/intake-sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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

  async function postAction(path: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(path, { method: "POST" });
      if (!res.ok && res.status !== 424) {
        const data = (await res.json()) as { error?: string; errorMessage?: string };
        setError(data.error ?? data.errorMessage ?? "Action failed");
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  const btnStyle: React.CSSProperties = {
    padding: "0.4rem 0.8rem",
    background: "var(--accent)",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  };

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

      <div className="card" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <span style={{ color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          Current status: <code>{status}</code>
        </span>
        <button style={btnStyle} disabled={submitting} onClick={() => patchStatus("stored")}>
          Mark stored
        </button>
        <button style={btnStyle} disabled={submitting} onClick={() => patchStatus("pending_analysis")}>
          Mark pending analysis
        </button>
        <button style={btnStyle} disabled={submitting} onClick={() => patchStatus("needs_review")}>
          Mark needs review
        </button>
        <button style={btnStyle} disabled={submitting} onClick={() => patchStatus("failed")}>
          Mark failed
        </button>
        <button style={btnStyle} disabled={submitting} onClick={() => postAction(`/api/intake-sources/${sourceId}/extract`)}>
          Run provider job
        </button>
        <button style={btnStyle} disabled={submitting} onClick={() => postAction(`/api/intake-sources/${sourceId}/suggest`)}>
          Generate intake suggestion
        </button>
      </div>
    </div>
  );
}
