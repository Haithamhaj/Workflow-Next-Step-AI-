"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "not_requested",
  "not_applicable_yet",
  "review_recommended",
  "rebuild_recommended",
  "conditional_early_draft_possible",
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

function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export default function NewInitialPackagePage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const initialPackageId = String(fd.get("initialPackageId") ?? "").trim();
    const caseId = String(fd.get("caseId") ?? "").trim();
    const evaluationId = String(fd.get("evaluationId") ?? "").trim();
    const status = String(fd.get("status") ?? "").trim();

    const outward: Record<string, unknown> = {
      initialSynthesizedWorkflow: String(fd.get("initialSynthesizedWorkflow") ?? "").trim(),
      workflowRationale: String(fd.get("workflowRationale") ?? "").trim(),
      workflowValueUsefulnessExplanation: String(
        fd.get("workflowValueUsefulnessExplanation") ?? "",
      ).trim(),
      initialGapAnalysis: String(fd.get("initialGapAnalysis") ?? "").trim(),
      initialRecommendations: String(fd.get("initialRecommendations") ?? "").trim(),
    };
    const docRef = String(fd.get("documentReferenceImplication") ?? "").trim();
    if (docRef !== "") outward.documentReferenceImplication = docRef;

    const sevenConditionChecklist: Record<string, boolean> = {};
    for (const [key] of CONDITIONS) {
      sevenConditionChecklist[key] = fd.get(`cond_${key}`) === "on";
    }
    const readinessReasoning = String(fd.get("readinessReasoning") ?? "").trim();
    const confidenceEvidenceNotes = String(fd.get("confidenceEvidenceNotes") ?? "").trim();
    const internalReviewPrompts = splitLines(
      String(fd.get("internalReviewPrompts") ?? ""),
    );

    const admin: Record<string, unknown> = {
      sevenConditionChecklist,
      readinessReasoning,
    };
    if (confidenceEvidenceNotes !== "") admin.confidenceEvidenceNotes = confidenceEvidenceNotes;
    if (internalReviewPrompts.length > 0) admin.internalReviewPrompts = internalReviewPrompts;

    const payload = {
      initialPackageId,
      caseId,
      evaluationId,
      status,
      outward,
      admin,
    };

    try {
      const res = await fetch("/api/initial-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { initialPackageId: string };
        router.push(`/initial-packages/${created.initialPackageId}`);
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
      <h2>New Initial Package</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        Assemble the §21 initial package: five mandatory outward sections (§21.3),
        optional document/reference implication (§21.4), operator-supplied status
        (§21.5), admin-only judgment layer (§21.11). The seven-condition checklist
        lives under admin and is forbidden from outward output (§21.8).
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
          <label htmlFor="initialPackageId">Initial Package ID *</label>
          <input id="initialPackageId" name="initialPackageId" style={inputStyle} placeholder="e.g. pkg-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input id="caseId" name="caseId" style={inputStyle} placeholder="e.g. case-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="evaluationId">Evaluation ID *</label>
          <input id="evaluationId" name="evaluationId" style={inputStyle} placeholder="e.g. eval-001" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="status">Status * (§21.5)</label>
          <select id="status" name="status" style={inputStyle} defaultValue="">
            <option value="" disabled>— select status —</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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
            Outward sections — §21.3 five mandatory + §21.4 optional
          </legend>

          <div style={fieldStyle}>
            <label htmlFor="initialSynthesizedWorkflow">Initial synthesized workflow *</label>
            <textarea
              id="initialSynthesizedWorkflow"
              name="initialSynthesizedWorkflow"
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="workflowRationale">Workflow rationale *</label>
            <textarea
              id="workflowRationale"
              name="workflowRationale"
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="workflowValueUsefulnessExplanation">
              Workflow value / usefulness explanation *
            </label>
            <textarea
              id="workflowValueUsefulnessExplanation"
              name="workflowValueUsefulnessExplanation"
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="initialGapAnalysis">Initial gap analysis *</label>
            <textarea
              id="initialGapAnalysis"
              name="initialGapAnalysis"
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="initialRecommendations">Initial recommendations *</label>
            <textarea
              id="initialRecommendations"
              name="initialRecommendations"
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="documentReferenceImplication">
              Document / reference implication (optional, §21.4)
            </label>
            <textarea
              id="documentReferenceImplication"
              name="documentReferenceImplication"
              style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
            />
          </div>
        </fieldset>

        <fieldset
          style={{
            border: "1px dashed #446",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
            background: "#161616",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#99a" }}>
            Admin-only judgment layer — §21.11 (not shown outward per §21.8)
          </legend>
          <div style={{ marginBottom: "10px", color: "#aaa", fontSize: "0.9em" }}>
            Seven-condition checklist:
          </div>
          {CONDITIONS.map(([key, label]) => (
            <label
              key={key}
              style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}
            >
              <input type="checkbox" name={`cond_${key}`} />
              <span>{label}</span>
            </label>
          ))}

          <div style={{ ...fieldStyle, marginTop: "14px" }}>
            <label htmlFor="readinessReasoning">Readiness reasoning *</label>
            <textarea
              id="readinessReasoning"
              name="readinessReasoning"
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
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
          <div style={fieldStyle}>
            <label htmlFor="internalReviewPrompts">
              Internal review prompts (optional, one per line)
            </label>
            <textarea
              id="internalReviewPrompts"
              name="internalReviewPrompts"
              style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Create Initial Package"}
        </button>
      </form>
    </>
  );
}
