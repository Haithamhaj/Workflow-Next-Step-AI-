"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AXIS_STATES = ["strong", "partial", "weak", "blocking"] as const;
const OUTCOMES = [
  "ready_for_initial_package",
  "needs_more_clarification",
  "finalizable_with_review",
  "ready_for_final_package",
] as const;

const AXES = [
  ["workflowCompleteness", "Workflow completeness"],
  ["sequenceClarity", "Sequence clarity"],
  ["decisionExceptionClarity", "Decision / exception clarity"],
  ["ownershipHandoffClarity", "Ownership & handoff clarity"],
  ["documentationStrength", "Documentation strength"],
] as const;

const CONDITIONS = [
  ["sequenceContinuity", "1. Sequence continuity"],
  ["aToBToCClarity", "2. A→B→C clarity"],
  ["coreStepConditions", "3. Core step conditions"],
  ["decisionRuleOrThreshold", "4. Decision rule / threshold"],
  ["handoffResponsibility", "5. Handoff responsibility"],
  ["controlOrApproval", "6. Control / approval"],
  ["boundary", "7. Boundary"],
] as const;

export default function NewEvaluationPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const evaluationId = String(fd.get("evaluationId") ?? "").trim();
    const caseId = String(fd.get("caseId") ?? "").trim();
    const synthesisId = String(fd.get("synthesisId") ?? "").trim();
    const outcome = String(fd.get("outcome") ?? "").trim();
    const readinessReasoning = String(fd.get("readinessReasoning") ?? "").trim();
    const confidenceEvidenceNotes = String(fd.get("confidenceEvidenceNotes") ?? "").trim();

    const axes: Record<string, string> = {};
    for (const [key] of AXES) axes[key] = String(fd.get(`axis_${key}`) ?? "");
    const conditions: Record<string, boolean> = {};
    for (const [key] of CONDITIONS) conditions[key] = fd.get(`cond_${key}`) === "on";

    const payload: Record<string, unknown> = {
      evaluationId,
      caseId,
      synthesisId,
      axes,
      conditions,
      outcome,
      readinessReasoning,
    };
    if (confidenceEvidenceNotes !== "") payload.confidenceEvidenceNotes = confidenceEvidenceNotes;

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { evaluationId: string };
        router.push(`/evaluations/${created.evaluationId}`);
        return;
      }
      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (data.errors && Array.isArray(data.errors)) setErrors(data.errors);
      else if (data.error) setErrors([data.error]);
      else setErrors(["Unknown error"]);
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
      <h2>New Evaluation</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        Record the §20 evaluation: five axes (§20.4) each in one of four states (§20.5),
        seven workflow-completeness conditions (§20.3), operator-supplied outcome (§20.10).
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

      <form onSubmit={handleSubmit} style={{ maxWidth: "780px" }}>
        <div style={fieldStyle}>
          <label htmlFor="evaluationId">Evaluation ID *</label>
          <input id="evaluationId" name="evaluationId" style={inputStyle} placeholder="e.g. eval-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input id="caseId" name="caseId" style={inputStyle} placeholder="e.g. case-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="synthesisId">Synthesis ID *</label>
          <input id="synthesisId" name="synthesisId" style={inputStyle} placeholder="e.g. synth-001" />
        </div>

        <fieldset
          style={{
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#ccc" }}>
            Axes — §20.4 (each in a §20.5 state)
          </legend>
          {AXES.map(([key, label]) => (
            <div key={key} style={fieldStyle}>
              <label htmlFor={`axis_${key}`}>{label} *</label>
              <select id={`axis_${key}`} name={`axis_${key}`} style={inputStyle} defaultValue="">
                <option value="" disabled>— select state —</option>
                {AXIS_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          ))}
        </fieldset>

        <fieldset
          style={{
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#ccc" }}>
            Seven workflow-completeness conditions — §20.3
          </legend>
          {CONDITIONS.map(([key, label]) => (
            <label
              key={key}
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}
            >
              <input type="checkbox" name={`cond_${key}`} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <div style={fieldStyle}>
          <label htmlFor="outcome">Outcome * (§20.10 operator-supplied)</label>
          <select id="outcome" name="outcome" style={inputStyle} defaultValue="">
            <option value="" disabled>— select outcome —</option>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="readinessReasoning">Readiness reasoning *</label>
          <textarea
            id="readinessReasoning"
            name="readinessReasoning"
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            placeholder="Explain, in prose, why the chosen outcome is justified by the axes and conditions."
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="confidenceEvidenceNotes">Confidence / evidence notes (optional)</label>
          <textarea
            id="confidenceEvidenceNotes"
            name="confidenceEvidenceNotes"
            style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Create Evaluation"}
        </button>
      </form>
    </>
  );
}
