"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Bucket = "company" | "department";
type InputType = "document" | "website_url" | "manual_note" | "image" | "audio";

interface SourceEntry {
  inputType: InputType;
  displayName: string;
  websiteUrl: string;
  noteText: string;
  fileName: string;
  mimeType: string;
  fileSize: number | null;
  /** The actual File object for upload (not serialized) */
  file: File | null;
}

const EMPTY_SOURCE: SourceEntry = {
  inputType: "document",
  displayName: "",
  websiteUrl: "",
  noteText: "",
  fileName: "",
  mimeType: "",
  fileSize: null,
  file: null,
};

const INPUT_TYPE_OPTIONS: { value: InputType; label: string }[] = [
  { value: "document", label: "Document" },
  { value: "website_url", label: "Website URL" },
  { value: "manual_note", label: "Manual note" },
  { value: "image", label: "Image" },
  { value: "audio", label: "Audio" },
];

const DEFAULT_COMPANY_ID = "company-default-local";

export default function NewIntakeSessionPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Session fields
  const [sessionId, setSessionId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [bucket, setBucket] = useState<Bucket>("company");
  // Sources to register
  const [sources, setSources] = useState<SourceEntry[]>([{ ...EMPTY_SOURCE }]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function updateSource(index: number, field: keyof SourceEntry, value: string | number | null | File) {
    setSources((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    );
  }

  function addSource() {
    setSources((prev) => [...prev, { ...EMPTY_SOURCE }]);
  }

  function removeSource(index: number) {
    setSources((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    try {
      // 1. Create session
      const sessionRes = await fetch("/api/intake-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: DEFAULT_COMPANY_ID,
          sessionId: sessionId || undefined,
          caseId,
          bucket,
          availableProviders: ["google", "openai"],
        }),
      });

      if (!sessionRes.ok) {
        const data = (await sessionRes.json()) as { error?: string };
        setErrors([data.error ?? "Failed to create session"]);
        setSubmitting(false);
        return;
      }

      const session = (await sessionRes.json()) as { sessionId: string };
      const createdSessionId = session.sessionId;
      const sourceErrors: string[] = [];

      // 2. Register each source
      for (let i = 0; i < sources.length; i++) {
        const src = sources[i]!;
        const isFileType = ["document", "image", "audio"].includes(src.inputType);

        if (isFileType && src.file) {
          // Send real file bytes via FormData
          const formData = new FormData();
          formData.append("file", src.file);
          formData.append("metadata", JSON.stringify({
            companyId: DEFAULT_COMPANY_ID,
            sessionId: createdSessionId,
            caseId,
            inputType: src.inputType,
            bucket,
            displayName: src.displayName || undefined,
          }));

          const srcRes = await fetch("/api/intake-sources", {
            method: "POST",
            body: formData,
          });

          if (!srcRes.ok) {
            const data = (await srcRes.json()) as { error?: string };
            sourceErrors.push(`Source ${i + 1}: ${data.error ?? "Failed"}`);
          }
        } else {
          // JSON registration for non-file sources
          const sourcePayload: Record<string, unknown> = {
            companyId: DEFAULT_COMPANY_ID,
            sessionId: createdSessionId,
            caseId,
            inputType: src.inputType,
            bucket,
            displayName: src.displayName || undefined,
          };

          if (src.inputType === "website_url") {
            sourcePayload.websiteUrl = src.websiteUrl;
          }
          if (src.inputType === "manual_note") {
            sourcePayload.noteText = src.noteText;
            sourcePayload.noteOrigin = "typed_text";
          }
          if (isFileType) {
            // File metadata only (no actual file selected)
            sourcePayload.fileName = src.fileName || `upload_${i + 1}`;
            sourcePayload.mimeType = src.mimeType || `${src.inputType}/placeholder`;
            sourcePayload.fileSize = src.fileSize;
          }

          const srcRes = await fetch("/api/intake-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sourcePayload),
          });

          if (!srcRes.ok) {
            const data = (await srcRes.json()) as { error?: string };
            sourceErrors.push(`Source ${i + 1}: ${data.error ?? "Failed"}`);
          }
        }
      }

      if (sourceErrors.length > 0) {
        setErrors(sourceErrors);
        setSubmitting(false);
        router.push(`/intake-sessions/${createdSessionId}/confirm`);
        return;
      }

      router.push(`/intake-sessions/${createdSessionId}/confirm`);
    } catch {
      setErrors(["Network error — could not reach server"]);
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

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.25rem",
    color: "var(--fg-muted)",
    fontSize: "0.85rem",
  };

  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };

  const cardStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "6px",
    padding: "1rem",
    marginBottom: "1rem",
    background: "var(--card-bg, #111)",
  };

  const removeBtnStyle: React.CSSProperties = {
    background: "#3b1a1a",
    color: "#f88",
    border: "1px solid #a33",
    borderRadius: "4px",
    padding: "0.3rem 0.6rem",
    cursor: "pointer",
    fontSize: "0.8rem",
  };

  return (
    <>
      <h2>Intake Registration</h2>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.9rem" }}>
        Pass 2 is <code>pass2_not_complete</code>. This page registers intake/context sources only; it does not run workflow analysis or provider extraction.
      </p>

      {errors.length > 0 && (
        <div
          style={{
            background: "#3b1a1a",
            border: "1px solid #a33",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
          }}
        >
          <strong style={{ color: "#f88" }}>Errors</strong>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", color: "#f99" }}>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Session metadata */}
        <div className="card" style={cardStyle}>
          <h3 style={{ margin: "0 0 0.75rem" }}>Session</h3>
          <div style={fieldStyle}>
            <label style={labelStyle}>Session ID (auto if blank)</label>
            <input style={inputStyle} value={sessionId} onChange={(e) => setSessionId(e.target.value)} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Case ID *</label>
            <input style={inputStyle} required value={caseId} onChange={(e) => setCaseId(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ ...fieldStyle, flex: 1 }}>
              <label style={labelStyle}>Primary Intake Bucket *</label>
              <select style={inputStyle} value={bucket} onChange={(e) => setBucket(e.target.value as Bucket)}>
                <option value="company">Company</option>
                <option value="department">Department</option>
              </select>
            </div>
          </div>
          <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.85rem" }}>
            Company context is optional. Department documents are optional. Missing context is tracked as a non-blocking intake status.
          </p>
        </div>

        {/* Source entries */}
        {sources.map((src, index) => (
          <div key={index} style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <h3 style={{ margin: 0 }}>Source {index + 1}</h3>
              {sources.length > 1 && (
                <button type="button" style={removeBtnStyle} onClick={() => removeSource(index)}>
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}>
                <label style={labelStyle}>Input Type *</label>
                <select
                  style={inputStyle}
                  value={src.inputType}
                  onChange={(e) => updateSource(index, "inputType", e.target.value)}
                >
                  {INPUT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ ...fieldStyle, flex: 1, minWidth: "200px" }}>
                <label style={labelStyle}>Display Name</label>
                <input
                  style={inputStyle}
                  value={src.displayName}
                  onChange={(e) => updateSource(index, "displayName", e.target.value)}
                  placeholder="Optional name for this source"
                />
              </div>
            </div>

            {/* Conditional fields based on input type */}
            {src.inputType === "website_url" && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Website URL *</label>
                <input
                  style={inputStyle}
                  value={src.websiteUrl}
                  onChange={(e) => updateSource(index, "websiteUrl", e.target.value)}
                  placeholder="https://example.com"
                  required
                />
              </div>
            )}

            {src.inputType === "manual_note" && (
              <div style={fieldStyle}>
                <label style={labelStyle}>Note Text *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }}
                  value={src.noteText}
                  onChange={(e) => updateSource(index, "noteText", e.target.value)}
                  placeholder="Enter the note content here..."
                  required
                />
              </div>
            )}

            {["document", "image", "audio"].includes(src.inputType) && (
              <>
                <div style={fieldStyle}>
                  <label style={labelStyle}>File</label>
                  <input
                    type="file"
                    ref={(el) => { fileInputRefs.current[index] = el; }}
                    style={inputStyle}
                    accept={
                      src.inputType === "document" ? ".pdf,.docx,.txt,.md,.csv"
                      : src.inputType === "image" ? ".png,.jpg,.jpeg,.gif,.webp"
                      : ".mp3,.wav,.ogg,.m4a"
                    }
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateSource(index, "fileName", file.name);
                        updateSource(index, "mimeType", file.type || `${src.inputType}/upload`);
                        updateSource(index, "fileSize", file.size);
                        updateSource(index, "file", file);
                      }
                    }}
                  />
                  {src.fileName && (
                    <span style={{ fontSize: "0.8rem", color: "var(--fg-muted)", marginLeft: "0.5rem" }}>
                      {src.fileName} ({src.fileSize ? `${Math.round(src.fileSize / 1024)} KB` : "?"})
                      {src.file ? " (file bytes will be uploaded)" : " (metadata only — no file selected)"}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addSource}
          style={{
            background: "transparent",
            border: "1px dashed var(--border)",
            color: "var(--fg-muted)",
            borderRadius: "6px",
            padding: "0.6rem 1rem",
            cursor: "pointer",
            width: "100%",
            marginBottom: "1rem",
          }}
        >
          + Add Another Source
        </button>

        <button type="submit" disabled={submitting} className="btn-primary" style={{ width: "100%" }}>
          {submitting ? "Creating session and registering sources..." : "Create Intake Session"}
        </button>
      </form>

      <div className="card" style={{ marginTop: "1rem" }}>
        <p style={{ margin: 0, color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          Live dictation is deferred to the provider phase. In Phase 2, dictated text can only be saved later as a manual note; no speech-to-text provider is implemented here.
        </p>
      </div>
    </>
  );
}
