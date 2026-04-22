import type { StoredInitialPackageRecord } from "@workflow/packages-output";
import Link from "next/link";
import { notFound } from "next/navigation";

async function getInitialPackage(id: string): Promise<StoredInitialPackageRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/initial-packages/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<StoredInitialPackageRecord>;
}

const CONDITIONS = [
  ["sequenceContinuity", "1. Sequence continuity"],
  ["aToBToCClarity", "2. A→B→C clarity"],
  ["coreStepConditions", "3. Core step conditions"],
  ["decisionRuleOrThreshold", "4. Decision rule / threshold"],
  ["handoffResponsibility", "5. Handoff responsibility"],
  ["controlOrApproval", "6. Control / approval"],
  ["boundary", "7. Boundary"],
] as const;

function statusColor(status: string): string {
  switch (status) {
    case "conditional_early_draft_possible": return "#4c7";
    case "review_recommended": return "#7cf";
    case "rebuild_recommended": return "#c74";
    case "not_applicable_yet": return "#ca4";
    case "not_requested": return "#888";
    default: return "#888";
  }
}

interface OutwardFieldSpec {
  key: keyof StoredInitialPackageRecord["outward"];
  label: string;
  sectionRef: string;
}

const OUTWARD_FIELDS: OutwardFieldSpec[] = [
  { key: "initialSynthesizedWorkflow", label: "Initial synthesized workflow", sectionRef: "§21.3" },
  { key: "workflowRationale", label: "Workflow rationale", sectionRef: "§21.3" },
  { key: "workflowValueUsefulnessExplanation", label: "Workflow value / usefulness explanation", sectionRef: "§21.3" },
  { key: "initialGapAnalysis", label: "Initial gap analysis", sectionRef: "§21.3" },
  { key: "initialRecommendations", label: "Initial recommendations", sectionRef: "§21.3" },
];

export default async function InitialPackageDetailPage({ params }: { params: { id: string } }) {
  const record = await getInitialPackage(params.id);
  if (record === null) notFound();

  return (
    <>
      <p style={{ marginBottom: "8px" }}>
        <Link href="/initial-packages" style={{ color: "#7af" }}>← All initial packages</Link>
      </p>
      <h2 style={{ fontFamily: "monospace" }}>{record.initialPackageId}</h2>

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
          <dt style={{ color: "#888" }}>Evaluation ID</dt>
          <dd style={{ margin: 0, fontFamily: "monospace" }}>{record.evaluationId}</dd>
          <dt style={{ color: "#888" }}>Created</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.createdAt}</dd>
        </dl>
      </section>

      <section
        data-testid="package-status-panel"
        style={{
          background: "#141422",
          border: `2px solid ${statusColor(record.status)}`,
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
          Status — §21.5
        </div>
        <div
          data-testid="package-status-badge"
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            background: "#223",
            color: statusColor(record.status),
            fontFamily: "monospace",
            fontSize: "1.05em",
          }}
        >
          {record.status}
        </div>
      </section>

      <section
        data-testid="initial-package-outward"
        style={{
          background: "#141a22",
          border: "2px solid #335",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
          Outward package — §21.3 + §21.4 (seven-condition checklist absent per §21.8)
        </div>

        {OUTWARD_FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: "14px" }}>
            <div style={{ color: "#ccc", fontSize: "0.95em", marginBottom: "4px" }}>
              {f.label}
              <span style={{ color: "#666", marginLeft: "8px", fontSize: "0.8em" }}>
                {f.sectionRef}
              </span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {record.outward[f.key]}
            </div>
          </div>
        ))}

        {record.outward.documentReferenceImplication ? (
          <div style={{ marginBottom: "4px" }}>
            <div style={{ color: "#ccc", fontSize: "0.95em", marginBottom: "4px" }}>
              Document / reference implication
              <span style={{ color: "#666", marginLeft: "8px", fontSize: "0.8em" }}>§21.4</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
              {record.outward.documentReferenceImplication}
            </div>
          </div>
        ) : null}
      </section>

      <section
        data-testid="initial-package-admin"
        style={{
          background: "#161616",
          border: "1px dashed #446",
          borderRadius: "6px",
          padding: "14px 18px",
          marginBottom: "20px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
          Admin-only judgment layer — §21.11 (not in outward per §21.8)
        </div>

        <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "6px" }}>
          Seven-condition checklist (§20.3 / §21.11):
        </div>
        <ul
          data-testid="admin-seven-condition-checklist"
          style={{ listStyle: "none", padding: 0, margin: "0 0 14px 0" }}
        >
          {CONDITIONS.map(([key, label]) => {
            const met = record.admin.sevenConditionChecklist[key];
            return (
              <li key={key} style={{ padding: "3px 0", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ color: met ? "#4c7" : "#c44", fontFamily: "monospace", width: "20px" }}>
                  {met ? "✓" : "✗"}
                </span>
                <span style={{ color: met ? "#eee" : "#aaa" }}>{label}</span>
              </li>
            );
          })}
        </ul>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "4px" }}>
            Readiness reasoning
          </div>
          <div style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>
            {record.admin.readinessReasoning}
          </div>
        </div>

        {record.admin.confidenceEvidenceNotes ? (
          <div style={{ marginBottom: "12px" }}>
            <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "4px" }}>
              Confidence / evidence notes
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#bbb" }}>
              {record.admin.confidenceEvidenceNotes}
            </div>
          </div>
        ) : null}

        {record.admin.internalReviewPrompts && record.admin.internalReviewPrompts.length > 0 ? (
          <div>
            <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "4px" }}>
              Internal review prompts
            </div>
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#bbb" }}>
              {record.admin.internalReviewPrompts.map((p, i) => (
                <li key={i} style={{ marginBottom: "4px" }}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </>
  );
}
