"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEFAULT_COMPANY_ID = "company-default-local";

export default function AddNotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/intake-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: DEFAULT_COMPANY_ID,
          sessionId: params.id,
          inputType: "manual_note",
          displayName: displayName || undefined,
          noteText,
          noteOrigin: "typed_text",
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to create note");
        setSubmitting(false);
        return;
      }

      router.push(`/intake-sessions/${params.id}`);
    } catch {
      setError("Network error");
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.45rem 0.6rem",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: "inherit",
    boxSizing: "border-box",
  };

  return (
    <>
      <h2>Add Manual Note</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
      </p>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
        Add a typed note as a source to session <code>{params.id}</code>.
        Notes are saved as operator-origin sources. They are not treated as deep analysis or workflow truth in Phase 2.
      </p>

      {error && (
        <div
          style={{
            background: "#3b1a1a",
            border: "1px solid #a33",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
            color: "#f88",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "1rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--fg-muted)", fontSize: "0.85rem" }}>
              Display Name (optional)
            </label>
            <input
              style={inputStyle}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Client requirements summary"
            />
          </div>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--fg-muted)", fontSize: "0.85rem" }}>
              Note Text *
            </label>
            <textarea
              style={{ ...inputStyle, minHeight: "200px", resize: "vertical" }}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter the note content here. This will be saved as an intake source."
              required
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary" style={{ width: "100%" }}>
            {submitting ? "Saving..." : "Save Note"}
          </button>
        </div>
      </form>
    </>
  );
}
