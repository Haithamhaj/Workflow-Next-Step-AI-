"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_COMPANY_ID = "company-default-local";
const SCORE_FIELDS = [
  "boundaryClarity",
  "sourceSupport",
  "businessRelevance",
  "workflowSeparability",
  "roleFunctionVisibility",
  "ambiguityRisk",
  "suitabilityAsFirstCase",
] as const;

function splitLines(value: string): string[] {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

function scoreSummaryFrom(values: Record<string, string>) {
  const entries = SCORE_FIELDS.flatMap((field) => {
    const raw = values[field];
    if (!raw) return [];
    const value = Number(raw);
    return Number.isFinite(value) ? [[field, value] as const] : [];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export default function NewFramingCandidatePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    companyId: DEFAULT_COMPANY_ID,
    framingRunId: "manual-framing-run",
    candidateName: "",
    scopeType: "multi_function",
    scopeLabel: "",
    primaryFunctionalAnchor: "",
    participatingFunctions: "",
    excludedAdjacentScopes: "",
    boundaryStart: "",
    boundaryEnd: "",
    sourceBasisIds: "",
    rationale: "",
    risks: "",
    recommendation: "defer",
    status: "draft",
    scoreMeaning: "",
    operatorNotes: "",
    splitMergeNotes: "",
    unknowns: "",
    relatedCandidateIds: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/company-framing/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: form.companyId,
        framingRunId: form.framingRunId,
        candidateName: form.candidateName,
        analysisScope: {
          scopeType: form.scopeType,
          scopeLabel: form.scopeLabel,
          primaryFunctionalAnchor: form.primaryFunctionalAnchor,
          participatingFunctions: splitLines(form.participatingFunctions),
          excludedAdjacentScopes: splitLines(form.excludedAdjacentScopes),
          scopeBoundary: { start: form.boundaryStart, end: form.boundaryEnd },
        },
        sourceBasisIds: splitLines(form.sourceBasisIds),
        rationale: form.rationale,
        risks: splitLines(form.risks),
        recommendation: form.recommendation,
        status: form.status,
        scoreSummary: scoreSummaryFrom(scores),
        scoreMeaning: form.scoreMeaning || undefined,
        operatorNotes: form.operatorNotes || undefined,
        splitMergeNotes: form.splitMergeNotes || undefined,
        unknowns: splitLines(form.unknowns),
        relatedCandidateIds: splitLines(form.relatedCandidateIds),
      }),
    });

    const data = await response.json() as { candidateId?: string; error?: string };
    if (!response.ok || !data.candidateId) {
      setError(data.error ?? "Could not create framing candidate.");
      setSubmitting(false);
      return;
    }

    router.push(`/company-framing/candidates/${data.candidateId}`);
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.45rem 0.6rem", boxSizing: "border-box" };
  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };
  const labelStyle: React.CSSProperties = { display: "block", marginBottom: "0.25rem", color: "var(--fg-muted)", fontSize: "0.85rem" };

  return (
    <main>
      <Link href="/company-framing/candidates">Back to framing candidates</Link>
      <h2>Create framing candidate</h2>
      <p data-testid="framing-candidate-boundary-note" className="muted" style={{ maxWidth: "58rem" }}>
        Manual framing candidates are operator-authored options. They are not workflow truth, participant evidence,
        Pass 6 synthesis/evaluation, package-ready findings, or automation recommendations.
      </p>
      <p data-testid="framing-candidate-no-promotion-note" className="muted">
        This page does not promote candidates, create cases, or create CaseEntryPackets.
      </p>
      <p data-testid="framing-candidate-no-caseid-note" className="muted">
        No caseId or sessionId is accepted here.
      </p>

      <form data-testid="framing-candidate-create-form" onSubmit={submit} style={{ maxWidth: "52rem" }}>
        {[
          ["companyId", "Company ID"],
          ["framingRunId", "Framing run ID"],
          ["candidateName", "Candidate name"],
          ["scopeLabel", "Scope label"],
          ["primaryFunctionalAnchor", "Primary functional anchor"],
          ["boundaryStart", "Boundary start"],
          ["boundaryEnd", "Boundary end"],
        ].map(([field, label]) => (
          <div key={field} style={fieldStyle}>
            <label style={labelStyle} htmlFor={field}>{label}</label>
            <input id={field} name={field} required value={form[field as keyof typeof form]} onChange={(event) => update(field as keyof typeof form, event.target.value)} style={inputStyle} />
          </div>
        ))}

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="scopeType">Scope type</label>
          <select id="scopeType" name="scopeType" value={form.scopeType} onChange={(event) => update("scopeType", event.target.value)} style={inputStyle}>
            <option value="single_function">single_function</option>
            <option value="multi_function">multi_function</option>
            <option value="company_workflow_scope">company_workflow_scope</option>
          </select>
        </div>

        {[
          ["participatingFunctions", "Participating functions"],
          ["excludedAdjacentScopes", "Excluded adjacent scopes"],
          ["sourceBasisIds", "Source basis IDs"],
          ["risks", "Risks"],
          ["unknowns", "Unknowns"],
          ["relatedCandidateIds", "Related candidate IDs"],
        ].map(([field, label]) => (
          <div key={field} style={fieldStyle}>
            <label style={labelStyle} htmlFor={field}>{label}</label>
            <textarea id={field} name={field} value={form[field as keyof typeof form]} onChange={(event) => update(field as keyof typeof form, event.target.value)} rows={3} style={inputStyle} />
          </div>
        ))}

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="rationale">Rationale</label>
          <textarea id="rationale" name="rationale" required value={form.rationale} onChange={(event) => update("rationale", event.target.value)} rows={5} style={inputStyle} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="recommendation">Recommendation</label>
          <select id="recommendation" name="recommendation" value={form.recommendation} onChange={(event) => update("recommendation", event.target.value)} style={inputStyle}>
            <option value="promote">promote</option>
            <option value="defer">defer</option>
            <option value="merge">merge</option>
            <option value="split">split</option>
            <option value="reject">reject</option>
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="status">Status</label>
          <select id="status" name="status" value={form.status} onChange={(event) => update("status", event.target.value)} style={inputStyle}>
            <option value="draft">draft</option>
            <option value="ready_for_review">ready_for_review</option>
            <option value="selected">selected</option>
            <option value="dormant">dormant</option>
            <option value="merged">merged</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <fieldset style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "1rem", marginBottom: "1rem" }}>
          <legend>Decision-support scores</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(12rem, 1fr))", gap: "0.75rem" }}>
            {SCORE_FIELDS.map((field) => (
              <label key={field}>
                <span style={labelStyle}>{field}</span>
                <input type="number" min="0" max="100" value={scores[field] ?? ""} onChange={(event) => setScores((current) => ({ ...current, [field]: event.target.value }))} style={inputStyle} />
              </label>
            ))}
          </div>
        </fieldset>

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="scoreMeaning">Score meaning</label>
          <textarea id="scoreMeaning" name="scoreMeaning" value={form.scoreMeaning} onChange={(event) => update("scoreMeaning", event.target.value)} rows={3} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="operatorNotes">Operator notes</label>
          <textarea id="operatorNotes" name="operatorNotes" value={form.operatorNotes} onChange={(event) => update("operatorNotes", event.target.value)} rows={3} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="splitMergeNotes">Split / merge notes</label>
          <textarea id="splitMergeNotes" name="splitMergeNotes" value={form.splitMergeNotes} onChange={(event) => update("splitMergeNotes", event.target.value)} rows={3} style={inputStyle} />
        </div>

        {error ? <p role="alert" style={{ color: "#f88" }}>{error}</p> : null}
        <button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create candidate"}</button>
      </form>
    </main>
  );
}
