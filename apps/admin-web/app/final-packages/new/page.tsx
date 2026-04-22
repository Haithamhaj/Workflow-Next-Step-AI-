"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PACKAGE_STATES = [
  "not_started",
  "initial_package_in_progress",
  "initial_package_ready",
  "final_package_blocked",
  "final_package_in_progress",
  "final_package_ready",
] as const;

const RELEASE_STATES = [
  "not_releasable",
  "pending_admin_approval",
  "approved_for_release",
  "released",
] as const;

const OUTPUT_DIRECTIONS = [
  "updated_source_aligned_with_reality",
  "rebuilt_source_draft",
  "reviewed_source_replacement_candidate",
  "recommendation_only_when_draft_not_eligible",
] as const;

function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export default function NewFinalPackagePage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);

    const packageId = String(fd.get("packageId") ?? "").trim();
    const caseId = String(fd.get("caseId") ?? "").trim();
    const packageState = String(fd.get("packageState") ?? "").trim();
    const packageReleaseState = String(fd.get("packageReleaseState") ?? "").trim();
    const finalizationBasis = String(fd.get("finalizationBasis") ?? "").trim();
    const adminApprovalStatus = fd.get("adminApprovalStatus") === "on" ? "approved" : "not_approved";
    const finalWorkflowReality = String(fd.get("finalWorkflowReality") ?? "").trim();
    const finalSourceOrReferenceOutput = String(fd.get("finalSourceOrReferenceOutput") ?? "").trim();
    const finalGapAnalysis = String(fd.get("finalGapAnalysis") ?? "").trim();
    const improvementTargetsOrFinalRecommendations = String(
      fd.get("improvementTargetsOrFinalRecommendations") ?? "",
    ).trim();
    const uiOverviewLayer = String(fd.get("uiOverviewLayer") ?? "").trim();
    const improvedOrTargetStateWorkflow = String(
      fd.get("improvedOrTargetStateWorkflow") ?? "",
    ).trim();
    const outputDirection = String(fd.get("outputDirection") ?? "").trim();
    const initialPackageId = String(fd.get("initialPackageId") ?? "").trim();
    const evaluationId = String(fd.get("evaluationId") ?? "").trim();

    const closedItems = splitLines(String(fd.get("closedItems") ?? ""));
    const nonBlockingRemainingItems = splitLines(String(fd.get("nonBlockingRemainingItems") ?? ""));
    const laterReviewItems = splitLines(String(fd.get("laterReviewItems") ?? ""));

    const payload: Record<string, unknown> = {
      packageId,
      caseId,
      packageType: "final_workflow_and_reference_package",
      packageState,
      packageReleaseState,
      packageGeneratedAt: new Date().toISOString(),
      finalizationBasis,
      adminApprovalStatus,
      finalWorkflowReality,
      finalSourceOrReferenceOutput,
      finalGapAnalysis,
      improvementTargetsOrFinalRecommendations,
      uiOverviewLayer,
      outputDirection,
      gapLayer: { closedItems, nonBlockingRemainingItems, laterReviewItems },
    };

    if (improvedOrTargetStateWorkflow !== "") {
      payload.improvedOrTargetStateWorkflow = improvedOrTargetStateWorkflow;
    }
    if (initialPackageId !== "") payload.initialPackageId = initialPackageId;
    if (evaluationId !== "") payload.evaluationId = evaluationId;

    try {
      const res = await fetch("/api/final-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { packageId: string };
        router.push(`/final-packages/${created.packageId}`);
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
  const taStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: "80px",
    resize: "vertical",
  };

  return (
    <>
      <h2>New Final Package</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        §29.8 final package — operator-initiated only (§25.16). Admin approval is
        required before release; it is structurally separate from
        packageReleaseState (§28.16). §24.13 structural separation: current-state
        workflow reality and improved/target-state workflow must not be merged.
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

      <form onSubmit={handleSubmit} style={{ maxWidth: "800px" }}>
        <div style={fieldStyle}>
          <label htmlFor="packageId">Package ID *</label>
          <input id="packageId" name="packageId" style={inputStyle} placeholder="e.g. fp-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input id="caseId" name="caseId" style={inputStyle} placeholder="e.g. case-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="packageState">Package State * (§28.11)</label>
          <select id="packageState" name="packageState" style={inputStyle} defaultValue="">
            <option value="" disabled>— select package state —</option>
            {PACKAGE_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="packageReleaseState">Release State * (§28.15)</label>
          <select id="packageReleaseState" name="packageReleaseState" style={inputStyle} defaultValue="">
            <option value="" disabled>— select release state —</option>
            {RELEASE_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div style={fieldStyle}>
          <label htmlFor="finalizationBasis">Finalization basis * (§29.8.1)</label>
          <textarea id="finalizationBasis" name="finalizationBasis" style={taStyle} />
        </div>

        <label
          style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}
        >
          <input type="checkbox" name="adminApprovalStatus" />
          <span>Admin approval granted (§25.16)</span>
        </label>

        <fieldset
          style={{
            border: "1px solid #335",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#ccc" }}>
            §24.13 structural separation — current-state vs target-state
          </legend>

          <div style={fieldStyle}>
            <label htmlFor="finalWorkflowReality">
              Final workflow reality * — current-state (§24.13, §29.8.3)
            </label>
            <textarea id="finalWorkflowReality" name="finalWorkflowReality" style={taStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="improvedOrTargetStateWorkflow">
              Improved / target-state workflow (optional, §24.13 — must NOT be merged with
              finalWorkflowReality)
            </label>
            <textarea id="improvedOrTargetStateWorkflow" name="improvedOrTargetStateWorkflow" style={taStyle} />
          </div>
        </fieldset>

        <fieldset
          style={{
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#ccc" }}>Content sections — §29.8.2</legend>

          <div style={fieldStyle}>
            <label htmlFor="finalSourceOrReferenceOutput">Final source / reference output *</label>
            <textarea id="finalSourceOrReferenceOutput" name="finalSourceOrReferenceOutput" style={taStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="finalGapAnalysis">Final gap analysis *</label>
            <textarea id="finalGapAnalysis" name="finalGapAnalysis" style={taStyle} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="improvementTargetsOrFinalRecommendations">
              Improvement targets / final recommendations *
            </label>
            <textarea
              id="improvementTargetsOrFinalRecommendations"
              name="improvementTargetsOrFinalRecommendations"
              style={taStyle}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="uiOverviewLayer">UI overview layer *</label>
            <textarea id="uiOverviewLayer" name="uiOverviewLayer" style={taStyle} />
          </div>
        </fieldset>

        <div style={fieldStyle}>
          <label htmlFor="outputDirection">Output direction * (§29.8.4)</label>
          <select id="outputDirection" name="outputDirection" style={inputStyle} defaultValue="">
            <option value="" disabled>— select output direction —</option>
            {OUTPUT_DIRECTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <fieldset
          style={{
            border: "1px solid #353",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#ccc" }}>Gap layer — §29.8.5</legend>
          <div style={fieldStyle}>
            <label htmlFor="closedItems">Closed items (one per line)</label>
            <textarea id="closedItems" name="closedItems" style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="nonBlockingRemainingItems">Non-blocking remaining items (one per line)</label>
            <textarea
              id="nonBlockingRemainingItems"
              name="nonBlockingRemainingItems"
              style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
            />
          </div>
          <div style={fieldStyle}>
            <label htmlFor="laterReviewItems">Later review items (one per line)</label>
            <textarea id="laterReviewItems" name="laterReviewItems" style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }} />
          </div>
        </fieldset>

        <div style={fieldStyle}>
          <label htmlFor="initialPackageId">Initial Package ID (optional)</label>
          <input id="initialPackageId" name="initialPackageId" style={inputStyle} placeholder="e.g. pkg-001" />
        </div>
        <div style={fieldStyle}>
          <label htmlFor="evaluationId">Evaluation ID (optional)</label>
          <input id="evaluationId" name="evaluationId" style={inputStyle} placeholder="e.g. eval-001" />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Create Final Package"}
        </button>
      </form>
    </>
  );
}
