"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROMPT_TYPES = [
  "extraction",
  "classification",
  "synthesis",
  "package_section_drafting",
  "clarification_generation",
] as const;

const ROLES = ["system", "user"] as const;
const STATUSES = ["active", "inactive"] as const;

export default function NewPromptPage() {
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

    // sourceSectionLinks: split comma-separated string into array
    if (typeof payload["sourceSectionLinks"] === "string") {
      const raw = (payload["sourceSectionLinks"] as string).trim();
      payload["sourceSectionLinks"] = raw
        ? raw.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
    }

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        router.push("/prompts");
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
      <h2>Register New Prompt</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        All registered prompts must be traceable to a module and purpose (§29.9). Required fields are marked *.
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
          <label htmlFor="promptId">Prompt ID *</label>
          <input
            id="promptId"
            name="promptId"
            style={inputStyle}
            placeholder="e.g. prompt-extraction-001"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="promptName">Prompt Name *</label>
          <input
            id="promptName"
            name="promptName"
            style={inputStyle}
            placeholder="e.g. Company Context Extraction"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="promptType">Prompt Type * (§30.16)</label>
          <select id="promptType" name="promptType" style={inputStyle}>
            <option value="">— select —</option>
            {PROMPT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="role">Role * (LLM message role — see OQ-001)</label>
          <select id="role" name="role" style={inputStyle}>
            <option value="">— select —</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="linkedModule">Linked Module * (§29.9.1)</label>
          <input
            id="linkedModule"
            name="linkedModule"
            style={inputStyle}
            placeholder="e.g. company-context-interpretation"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="linkedDecisionBlock">Linked Decision Block</label>
          <input
            id="linkedDecisionBlock"
            name="linkedDecisionBlock"
            style={inputStyle}
            placeholder="Optional — specific decision block within the module"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="promptPurpose">Prompt Purpose * (§29.9.1)</label>
          <textarea
            id="promptPurpose"
            name="promptPurpose"
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            placeholder="Plain-English description of what this prompt does"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="promptVersion">Prompt Version *</label>
          <input
            id="promptVersion"
            name="promptVersion"
            style={inputStyle}
            placeholder="e.g. v1.0"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="status">Status *</label>
          <select id="status" name="status" style={inputStyle}>
            <option value="">— select —</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="inputContractRef">Input Contract Reference</label>
          <input
            id="inputContractRef"
            name="inputContractRef"
            style={inputStyle}
            placeholder="e.g. SourceRegistration"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="outputContractRef">Output Contract Reference</label>
          <input
            id="outputContractRef"
            name="outputContractRef"
            style={inputStyle}
            placeholder="e.g. ExtractionOutput"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="sourceSectionLinks">Source Section Links (comma-separated)</label>
          <input
            id="sourceSectionLinks"
            name="sourceSectionLinks"
            style={inputStyle}
            placeholder="e.g. §29.9, §30.7"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
            placeholder="Optional operator notes"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Registering…" : "Register Prompt"}
        </button>
      </form>
    </>
  );
}
