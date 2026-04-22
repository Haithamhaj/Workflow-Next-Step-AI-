"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ConditionInterpretations } from "@workflow/synthesis-evaluation";

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

const CONDITION_LABELS: Record<string, string> = Object.fromEntries(CONDITIONS);

type Phase = "fill" | "analyzing" | "review";

interface SavedValues {
  evaluationId: string;
  caseId: string;
  synthesisId: string;
  axes: Record<string, string>;
  conditions: Record<string, boolean>;
  outcome: string;
  readinessReasoning: string;
  confidenceEvidenceNotes: string;
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

export default function NewEvaluationPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("fill");
  const [errors, setErrors] = useState<string[]>([]);
  const [savedValues, setSavedValues] = useState<SavedValues | null>(null);
  const [snapshotId, setSnapshotId] = useState("");
  const [interpretations, setInterpretations] = useState<ConditionInterpretations>({});
  const [adminConfirmations, setAdminConfirmations] = useState<Record<string, boolean>>({});
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setPhase("analyzing");

    const fd = new FormData(e.currentTarget);
    const values: SavedValues = {
      evaluationId: String(fd.get("evaluationId") ?? "").trim(),
      caseId: String(fd.get("caseId") ?? "").trim(),
      synthesisId: String(fd.get("synthesisId") ?? "").trim(),
      outcome: String(fd.get("outcome") ?? "").trim(),
      readinessReasoning: String(fd.get("readinessReasoning") ?? "").trim(),
      confidenceEvidenceNotes: String(
        fd.get("confidenceEvidenceNotes") ?? "",
      ).trim(),
      axes: Object.fromEntries(
        AXES.map(([k]) => [k, String(fd.get(`axis_${k}`) ?? "")]),
      ),
      conditions: Object.fromEntries(
        CONDITIONS.map(([k]) => [k, fd.get(`cond_${k}`) === "on"]),
      ),
    };
    setSavedValues(values);

    try {
      const res = await fetch("/api/evaluations/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditions: values.conditions,
          outcome: values.outcome,
        }),
      });
      const data = (await res.json()) as {
        snapshotId?: string;
        conditionInterpretations?: ConditionInterpretations;
        error?: string;
      };
      if (!res.ok || !data.snapshotId) {
        setErrors([data.error ?? "Failed to analyze conditions"]);
        setPhase("fill");
        return;
      }
      setSnapshotId(data.snapshotId);
      setInterpretations(data.conditionInterpretations ?? {});
      setAdminConfirmations({});
      setAdminNote("");
      setPhase("review");
    } catch {
      setErrors(["Network error — could not reach server"]);
      setPhase("fill");
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!savedValues) return;
    setErrors([]);
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      evaluationId: savedValues.evaluationId,
      caseId: savedValues.caseId,
      synthesisId: savedValues.synthesisId,
      axes: savedValues.axes,
      conditions: savedValues.conditions,
      outcome: savedValues.outcome,
      readinessReasoning: savedValues.readinessReasoning,
      interpretationSnapshotId: snapshotId,
    };
    if (savedValues.confidenceEvidenceNotes) {
      payload.confidenceEvidenceNotes = savedValues.confidenceEvidenceNotes;
    }
    if (Object.keys(adminConfirmations).length > 0) {
      payload.adminBlockingConfirmations = adminConfirmations;
    }
    if (adminNote.trim()) {
      payload.adminNote = adminNote.trim();
    }

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
      const data = (await res.json()) as {
        error?: string;
        errors?: string[];
      };
      if (data.errors && Array.isArray(data.errors)) setErrors(data.errors);
      else if (data.error) setErrors([data.error]);
      else setErrors(["Unknown error"]);
    } catch {
      setErrors(["Network error — could not reach server"]);
    } finally {
      setSubmitting(false);
    }
  }

  const blockingKeys = Object.entries(interpretations)
    .filter(([, v]) => v?.workflowEffect === "blocking")
    .map(([k]) => k);

  const anyRejected = blockingKeys.some(
    (k) => adminConfirmations[k] === false,
  );

  const ErrorBanner = () =>
    errors.length > 0 ? (
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
        <ul
          style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#f99" }}
        >
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    ) : null;

  // Phase 2: review interpretations + confirm blocking labels
  if (phase === "review" && savedValues) {
    const conditionKeys = Object.keys(interpretations) as Array<
      keyof ConditionInterpretations
    >;

    return (
      <>
        <h2>New Evaluation — Review Interpretations</h2>
        <p style={{ color: "#aaa", marginBottom: "20px" }}>
          The LLM has analysed the false conditions below (§20.21). Confirm or
          reject any blocking labels, then create the evaluation.
        </p>
        <ErrorBanner />

        {conditionKeys.length === 0 && (
          <p style={{ color: "#aaa", marginBottom: "20px" }}>
            No LLM interpretation required (all conditions satisfied or
            analysis unavailable). Proceed to create the evaluation.
          </p>
        )}

        {conditionKeys.map((key) => {
          const interp = interpretations[key];
          if (!interp) return null;
          const isBlocking = interp.workflowEffect === "blocking";
          const label = CONDITION_LABELS[key as string] ?? (key as string);
          return (
            <div
              key={key as string}
              style={{
                border: `1px solid ${isBlocking ? "#a33" : "#333"}`,
                borderRadius: "6px",
                padding: "16px",
                marginBottom: "16px",
                background: isBlocking ? "#2a1a1a" : "#1a1a1a",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  marginBottom: "8px",
                  flexWrap: "wrap",
                }}
              >
                <strong>{label}</strong>
                <span
                  style={{
                    fontSize: "0.8em",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: isBlocking ? "#7a1a1a" : "#1a3a1a",
                    color: isBlocking ? "#f88" : "#8f8",
                  }}
                >
                  {interp.workflowEffect}
                </span>
                <span
                  style={{
                    fontSize: "0.8em",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "#1a1a3a",
                    color: "#88f",
                  }}
                >
                  automation: {interp.automationEffect}
                </span>
              </div>
              <p style={{ margin: "0 0 8px", color: "#ccc" }}>
                {interp.whyItMatters}
              </p>
              {interp.recommendedActions.length > 0 && (
                <ul
                  style={{
                    margin: "0 0 8px",
                    paddingLeft: "20px",
                    color: "#aaa",
                  }}
                >
                  {interp.recommendedActions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
              {isBlocking && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px",
                    background: "#3a1a1a",
                    borderRadius: "4px",
                  }}
                >
                  <strong style={{ color: "#f88" }}>
                    LLM assessed this as workflow-blocking. Confirm? (§20.22)
                  </strong>
                  <div
                    style={{ display: "flex", gap: "16px", marginTop: "8px" }}
                  >
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`confirm_${key as string}`}
                        value="true"
                        checked={adminConfirmations[key as string] === true}
                        onChange={() =>
                          setAdminConfirmations((prev) => ({
                            ...prev,
                            [key as string]: true,
                          }))
                        }
                      />
                      <span style={{ color: "#f88" }}>
                        Yes, confirm blocking
                      </span>
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`confirm_${key as string}`}
                        value="false"
                        checked={adminConfirmations[key as string] === false}
                        onChange={() =>
                          setAdminConfirmations((prev) => ({
                            ...prev,
                            [key as string]: false,
                          }))
                        }
                      />
                      <span style={{ color: "#8f8" }}>No, reject label</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <form onSubmit={handleCreate} style={{ maxWidth: "780px" }}>
          {blockingKeys.length > 0 && (
            <div style={fieldStyle}>
              <label htmlFor="adminNote">
                Admin note
                {anyRejected
                  ? " (required — you rejected a blocking label)"
                  : " (optional)"}
              </label>
              <textarea
                id="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                placeholder="Explain any rejected blocking labels for traceability."
              />
            </div>
          )}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setPhase("fill")}
              style={{
                padding: "10px 20px",
                background: "#333",
                border: "1px solid #555",
                color: "#eee",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ← Back (re-enter details)
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ opacity: submitting ? 0.6 : 1 }}
            >
              {submitting ? "Saving…" : "Create Evaluation"}
            </button>
          </div>
        </form>
      </>
    );
  }

  // Phase 1: fill in evaluation details
  return (
    <>
      <h2>New Evaluation</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        Record the §20 evaluation: five axes (§20.4) each in one of four
        states (§20.5), seven workflow-completeness conditions (§20.3),
        operator-supplied outcome (§20.10). Click &quot;Analyze Conditions&quot;
        to generate LLM interpretations before finalising.
      </p>
      <ErrorBanner />

      <form onSubmit={handleAnalyze} style={{ maxWidth: "780px" }}>
        <div style={fieldStyle}>
          <label htmlFor="evaluationId">Evaluation ID *</label>
          <input
            id="evaluationId"
            name="evaluationId"
            style={inputStyle}
            placeholder="e.g. eval-001"
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
          <label htmlFor="synthesisId">Synthesis ID *</label>
          <input
            id="synthesisId"
            name="synthesisId"
            style={inputStyle}
            placeholder="e.g. synth-001"
          />
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
              <select
                id={`axis_${key}`}
                name={`axis_${key}`}
                style={inputStyle}
                defaultValue=""
              >
                <option value="" disabled>
                  — select state —
                </option>
                {AXIS_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
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
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <input type="checkbox" name={`cond_${key}`} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <div style={fieldStyle}>
          <label htmlFor="outcome">
            Outcome * (§20.10 operator-supplied)
          </label>
          <select
            id="outcome"
            name="outcome"
            style={inputStyle}
            defaultValue=""
          >
            <option value="" disabled>
              — select outcome —
            </option>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
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
          <label htmlFor="confidenceEvidenceNotes">
            Confidence / evidence notes (optional)
          </label>
          <textarea
            id="confidenceEvidenceNotes"
            name="confidenceEvidenceNotes"
            style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          disabled={phase === "analyzing"}
          className="btn-primary"
          style={{ opacity: phase === "analyzing" ? 0.6 : 1 }}
        >
          {phase === "analyzing" ? "Analyzing…" : "Analyze Conditions →"}
        </button>
      </form>
    </>
  );
}
