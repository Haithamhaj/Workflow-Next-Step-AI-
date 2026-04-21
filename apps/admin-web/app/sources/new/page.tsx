"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const INTAKE_TYPES = [
  "uploaded_document",
  "uploaded_form",
  "uploaded_template",
  "uploaded_contract_sample",
  "uploaded_quotation_sample",
  "uploaded_role_document",
  "uploaded_workflow_reference",
  "uploaded_contextual_source",
] as const;

const TIMING_TAGS = [
  "uploaded_at_case_setup",
  "uploaded_after_round_1",
  "uploaded_before_reanalysis",
  "uploaded_before_round_2",
  "uploaded_during_gap_closure",
  "uploaded_for_finalization_support",
] as const;

const AUTHORITIES = ["company_truth", "informational_domain_support"] as const;

const PROCESSING_STATUSES = [
  "registered_not_processed",
  "extraction_in_progress",
  "extracted_pending_classification",
  "classified_ready_for_use",
  "limited_value_visible",
  "requires_admin_review",
] as const;

export default function NewSourcePage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    for (const [key, value] of fd.entries()) {
      if (typeof value === "string" && value.trim() !== "") {
        payload[key] = value.trim();
      }
    }

    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 201) {
        router.push("/sources");
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
      <h2>Register New Source</h2>

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

      <form onSubmit={handleSubmit} style={{ maxWidth: "600px" }}>
        <div style={fieldStyle}>
          <label htmlFor="sourceId">Source ID *</label>
          <input id="sourceId" name="sourceId" style={inputStyle} placeholder="e.g. src-001" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input id="caseId" name="caseId" style={inputStyle} placeholder="e.g. case-001" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="uploaderId">Uploader ID *</label>
          <input id="uploaderId" name="uploaderId" style={inputStyle} placeholder="e.g. admin" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="uploadedAt">Uploaded At * (ISO date-time)</label>
          <input
            id="uploadedAt"
            name="uploadedAt"
            style={inputStyle}
            placeholder="e.g. 2026-04-22T10:00:00Z"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="displayName">Display Name</label>
          <input id="displayName" name="displayName" style={inputStyle} placeholder="Optional label" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="intakeType">Intake Type *</label>
          <select id="intakeType" name="intakeType" style={inputStyle}>
            <option value="">— select —</option>
            {INTAKE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="timingTag">Timing Tag *</label>
          <select id="timingTag" name="timingTag" style={inputStyle}>
            <option value="">— select —</option>
            {TIMING_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="authority">Authority *</label>
          <select id="authority" name="authority" style={inputStyle}>
            <option value="">— select —</option>
            {AUTHORITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="processingStatus">Processing Status *</label>
          <select id="processingStatus" name="processingStatus" style={inputStyle}>
            <option value="">— select —</option>
            {PROCESSING_STATUSES.map((s) => (
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
            placeholder="Optional notes"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Registering…" : "Register Source"}
        </button>
      </form>
    </>
  );
}
