import type { StoredEvaluationRecord } from "@workflow/synthesis-evaluation";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getEvaluation(id: string): Promise<StoredEvaluationRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/evaluations/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<StoredEvaluationRecord>;
}

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

function stateColor(state: string): string {
  switch (state) {
    case "strong": return "#4c7";
    case "partial": return "#ca4";
    case "weak": return "#c74";
    case "blocking": return "#c44";
    default: return "#888";
  }
}

function outcomeColor(outcome: string): string {
  switch (outcome) {
    case "ready_for_initial_package": return "#4c7";
    case "needs_more_clarification": return "#ca4";
    case "finalizable_with_review": return "#7cf";
    case "ready_for_final_package": return "#4cf";
    default: return "#888";
  }
}

export default async function EvaluationDetailPage({ params }: { params: { id: string } }) {
  const record = await getEvaluation(params.id);
  if (record === null) notFound();

  return (
    <>
      <p style={{ marginBottom: "8px" }}>
        <Link href="/evaluations" style={{ color: "#7af" }}>← All evaluations</Link>
      </p>
      <h2 style={{ fontFamily: "monospace" }}>{record.evaluationId}</h2>

      <section style={{ marginBottom: "20px" }}>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "max-content 1fr",
            columnGap: "16px",
            rowGap: "6px",
            fontSize: "0.9em",
          }}
        >
          <dt style={{ color: "#888" }}>Case ID</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{record.caseId}</dd>
          <dt style={{ color: "#888" }}>Synthesis ID</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{record.synthesisId}</dd>
          <dt style={{ color: "#888" }}>Created</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.createdAt}</dd>
        </dl>
      </section>

      <section
        data-testid="outcome-panel"
        style={{
          background: "#141422",
          border: `2px solid ${outcomeColor(record.outcome)}`,
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
          Outcome — §20.10 (operator-supplied, §20.11–§20.14)
        </div>
        <div
          data-testid="outcome-badge"
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            background: "#223",
            color: outcomeColor(record.outcome),
            fontFamily: "monospace",
            fontSize: "1.05em",
          }}
        >
          {record.outcome}
        </div>
        <div style={{ color: "#ccc", marginTop: "10px", whiteSpace: "pre-wrap" }}>
          <span style={{ color: "#888" }}>Readiness reasoning: </span>
          {record.readinessReasoning}
        </div>
      </section>

      <section data-testid="axis-table" style={{ marginBottom: "24px" }}>
        <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>
          Axes <span style={{ color: "#666", fontWeight: "normal", marginLeft: "8px", fontSize: "0.85em" }}>(§20.4 five axes, §20.5 four per-axis states)</span>
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "6px 10px" }}>Axis</th>
              <th style={{ padding: "6px 10px" }}>State</th>
            </tr>
          </thead>
          <tbody>
            {AXES.map(([key, label]) => {
              const state = record.axes[key];
              return (
                <tr key={key} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "6px 10px" }}>{label}</td>
                  <td style={{ padding: "6px 10px", color: stateColor(state), fontFamily: "monospace" }}>
                    {state}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section
        data-testid="seven-condition-admin"
        style={{
          background: "#161616",
          border: "1px dashed #446",
          borderRadius: "6px",
          padding: "14px 18px",
          marginBottom: "20px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
          Seven workflow-completeness conditions — §20.3 (admin-only view)
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {CONDITIONS.map(([key, label]) => {
            const met = record.conditions[key];
            return (
              <li key={key} style={{ padding: "4px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: met ? "#4c7" : "#c44", fontFamily: "monospace", width: "20px" }}>
                  {met ? "✓" : "✗"}
                </span>
                <span style={{ color: met ? "#eee" : "#aaa" }}>{label}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {record.confidenceEvidenceNotes ? (
        <section style={{ marginBottom: "20px" }}>
          <h3 style={{ color: "#ccc", fontSize: "1em", marginBottom: "8px" }}>Confidence / evidence notes</h3>
          <div style={{ whiteSpace: "pre-wrap", color: "#bbb" }}>{record.confidenceEvidenceNotes}</div>
        </section>
      ) : null}
    </>
  );
}
