"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const REVIEW_STATES = [
  "review_required",
  "issue_discussion_active",
  "action_taken",
  "review_resolved",
] as const;

const DEFAULT_COMPANY_ID = "company-default-local";

function parseEvidence(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [label, relevance, sourceReference, sourceSectionLink, decisionBlockLink, sessionId, sourceId] =
        line.split("|").map((part) => part.trim());

      return {
        label,
        relevance,
        ...(sourceReference ? { sourceReference } : {}),
        ...(sourceSectionLink ? { sourceSectionLink } : {}),
        ...(decisionBlockLink ? { decisionBlockLink } : {}),
        ...(sessionId ? { sessionId } : {}),
        ...(sourceId ? { sourceId } : {}),
      };
    });
}

export default function NewIssuePage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      companyId: DEFAULT_COMPANY_ID,
      issueId: String(fd.get("issueId") ?? "").trim(),
      caseId: String(fd.get("caseId") ?? "").trim(),
      initialPackageId: String(fd.get("initialPackageId") ?? "").trim(),
      evaluationId: String(fd.get("evaluationId") ?? "").trim(),
      synthesisId: String(fd.get("synthesisId") ?? "").trim() || undefined,
      reviewState: String(fd.get("reviewState") ?? "").trim(),
      issueBrief: {
        issueTitle: String(fd.get("issueTitle") ?? "").trim(),
        whatHappened: String(fd.get("whatHappened") ?? "").trim(),
        whyItWasTriggered: String(fd.get("whyItWasTriggered") ?? "").trim(),
        likelySourceDiagnosis: String(fd.get("likelySourceDiagnosis") ?? "").trim(),
        whyItMatters: String(fd.get("whyItMatters") ?? "").trim(),
        whatItAffects: String(fd.get("whatItAffects") ?? "").trim(),
        severityEffectLevel: String(fd.get("severityEffectLevel") ?? "").trim(),
        systemRecommendation: String(fd.get("systemRecommendation") ?? "").trim(),
        correctiveDirection: String(fd.get("correctiveDirection") ?? "").trim(),
      },
      discussionThread: {
        scopeBoundary: String(fd.get("scopeBoundary") ?? "").trim(),
        entries: [],
      },
      linkedEvidence: parseEvidence(String(fd.get("linkedEvidence") ?? "")),
      actionHistory: [],
      releaseApprovalRecord: {
        releaseState: "not_releasable",
      },
    };

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { issueId: string };
        router.push(`/issues/${created.issueId}`);
        return;
      }
      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (Array.isArray(data.errors)) setErrors(data.errors);
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
      <h2>New Review Issue</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        Capture the §25.4 issue brief, define the scoped discussion boundary,
        and attach evidence links to existing Pass 6 records.
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
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: "860px" }}>
        <div style={fieldStyle}>
          <label htmlFor="issueId">Issue ID *</label>
          <input id="issueId" name="issueId" style={inputStyle} placeholder="e.g. issue-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input id="caseId" name="caseId" style={inputStyle} placeholder="e.g. case-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="initialPackageId">Initial Package ID *</label>
          <input id="initialPackageId" name="initialPackageId" style={inputStyle} placeholder="e.g. pkg-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="evaluationId">Evaluation ID *</label>
          <input id="evaluationId" name="evaluationId" style={inputStyle} placeholder="e.g. eval-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="synthesisId">Synthesis ID</label>
          <input id="synthesisId" name="synthesisId" style={inputStyle} placeholder="e.g. synth-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="reviewState">Initial Review State *</label>
          <select id="reviewState" name="reviewState" style={inputStyle} defaultValue="review_required">
            {REVIEW_STATES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>

        <fieldset style={{ border: "1px solid #333", borderRadius: "6px", padding: "12px 16px", marginBottom: "20px" }}>
          <legend style={{ padding: "0 8px", color: "#ccc" }}>Issue brief — §25.4</legend>
          {[
            ["issueTitle", "Issue title"],
            ["whatHappened", "What happened"],
            ["whyItWasTriggered", "Why it was triggered"],
            ["likelySourceDiagnosis", "Likely source / diagnosis"],
            ["whyItMatters", "Why it matters"],
            ["whatItAffects", "What it affects"],
            ["severityEffectLevel", "Severity / effect level"],
            ["systemRecommendation", "System recommendation"],
            ["correctiveDirection", "Corrective direction"],
          ].map(([name, label]) => (
            <div key={name} style={fieldStyle}>
              <label htmlFor={name}>{label} *</label>
              <textarea
                id={name}
                name={name}
                style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
              />
            </div>
          ))}
        </fieldset>

        <div style={fieldStyle}>
          <label htmlFor="scopeBoundary">Discussion scope boundary *</label>
          <textarea
            id="scopeBoundary"
            name="scopeBoundary"
            style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
            placeholder="Keep discussion scoped to this issue, directly linked workflow steps, linked package sections, and directly relevant evidence."
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="linkedEvidence">Linked evidence lines</label>
          <textarea
            id="linkedEvidence"
            name="linkedEvidence"
            style={{ ...inputStyle, minHeight: "110px", resize: "vertical" }}
            placeholder="label | relevance | sourceReference | sourceSectionLink | decisionBlockLink | sessionId | sourceId"
          />
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Creating..." : "Create Review Issue"}
        </button>
      </form>
    </>
  );
}
