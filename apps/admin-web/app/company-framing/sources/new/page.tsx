"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type InputType = "manual_note" | "website_url" | "document";

const DEFAULT_COMPANY_ID = "company-default-local";

export default function NewFramingSourcePage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(DEFAULT_COMPANY_ID);
  const [inputType, setInputType] = useState<InputType>("manual_note");
  const [displayName, setDisplayName] = useState("");
  const [fileName, setFileName] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [framingRunIds, setFramingRunIds] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      companyId,
      inputType,
      displayName: displayName || undefined,
      framingRunIds: framingRunIds
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (inputType === "manual_note") payload.noteText = noteText;
    if (inputType === "website_url") payload.websiteUrl = websiteUrl;
    if (inputType === "document") {
      payload.fileName = fileName || undefined;
      payload.mimeType = mimeType || undefined;
    }

    const response = await fetch("/api/company-framing/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as { framingSourceId?: string; error?: string };
    if (!response.ok || !data.framingSourceId) {
      setError(data.error ?? "Could not create framing source.");
      setSubmitting(false);
      return;
    }

    router.push(`/company-framing/sources/${data.framingSourceId}`);
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
  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };
  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.25rem",
    color: "var(--fg-muted)",
    fontSize: "0.85rem",
  };

  return (
    <main>
      <Link href="/company-framing/sources">Back to framing sources</Link>
      <h2>Create framing source</h2>
      <p
        data-testid="framing-source-boundary-note"
        className="muted"
        style={{ maxWidth: "58rem" }}
      >
        Framing sources are pre-case source records. This form does not ask for caseId or sessionId,
        does not create a case IntakeSource, and does not trigger provider processing.
      </p>

      <form data-testid="framing-source-create-form" onSubmit={submit} style={{ maxWidth: "44rem" }}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="companyId">Company ID</label>
          <input id="companyId" name="companyId" required value={companyId} onChange={(event) => setCompanyId(event.target.value)} style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="inputType">Input type</label>
          <select id="inputType" name="inputType" value={inputType} onChange={(event) => setInputType(event.target.value as InputType)} style={inputStyle}>
            <option value="manual_note">Manual note</option>
            <option value="website_url">Website URL</option>
            <option value="document">Document metadata</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="displayName">Display name</label>
          <input id="displayName" name="displayName" value={displayName} onChange={(event) => setDisplayName(event.target.value)} style={inputStyle} />
        </div>

        {inputType === "manual_note" ? (
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="noteText">Manual note</label>
            <textarea id="noteText" name="noteText" required value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={7} style={inputStyle} />
          </div>
        ) : null}

        {inputType === "website_url" ? (
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="websiteUrl">Website URL</label>
            <input id="websiteUrl" name="websiteUrl" required value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} style={inputStyle} />
          </div>
        ) : null}

        {inputType === "document" ? (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="fileName">File name</label>
              <input id="fileName" name="fileName" value={fileName} onChange={(event) => setFileName(event.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="mimeType">MIME type</label>
              <input id="mimeType" name="mimeType" value={mimeType} onChange={(event) => setMimeType(event.target.value)} style={inputStyle} />
            </div>
          </>
        ) : null}

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="framingRunIds">Framing run IDs</label>
          <input id="framingRunIds" name="framingRunIds" value={framingRunIds} onChange={(event) => setFramingRunIds(event.target.value)} placeholder="Optional, comma-separated" style={inputStyle} />
        </div>

        <p data-testid="framing-source-no-caseid-note" className="muted">
          No caseId or sessionId is accepted here. Source status starts as uploaded and sourceVersion starts at 1.
        </p>

        {error ? <p role="alert" style={{ color: "#f88" }}>{error}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create framing source"}
        </button>
      </form>
    </main>
  );
}
