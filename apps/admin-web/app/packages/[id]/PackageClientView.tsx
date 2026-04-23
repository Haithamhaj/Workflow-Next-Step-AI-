"use client";

import Link from "next/link";
import { useState } from "react";
import type { PackageSurfaceDetail } from "../../../lib/package-surface";

const TABS = ["preview", "workflow", "comparison", "status"] as const;
type SurfaceTab = (typeof TABS)[number];

function releaseTone(releaseState: string | null): string {
  switch (releaseState) {
    case "released":
      return "#58d68d";
    case "approved_for_release":
      return "#6fc2ff";
    case "pending_admin_approval":
      return "#f6c453";
    case "not_releasable":
      return "#f08b68";
    default:
      return "#8a9099";
  }
}

function splitWorkflowNarrative(text: string): string[] {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;

  return text
    .split(/(?<=[.;])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function DetailPill({
  label,
  value,
  tone = "#8a9099",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="package-pill">
      <span className="package-pill-label">{label}</span>
      <span className="package-pill-value" style={{ color: tone }}>
        {value}
      </span>
    </div>
  );
}

export function PackageClientView({ detail }: { detail: PackageSurfaceDetail }) {
  const [activeTab, setActiveTab] = useState<SurfaceTab>("preview");
  const currentWorkflow = detail.finalPackage?.finalWorkflowReality
    ?? detail.initialPackage.outward.initialSynthesizedWorkflow;
  const targetWorkflow = detail.finalPackage?.improvedOrTargetStateWorkflow ?? null;
  const currentWorkflowBlocks = splitWorkflowNarrative(currentWorkflow);
  const targetWorkflowBlocks = targetWorkflow
    ? splitWorkflowNarrative(targetWorkflow)
    : [];

  return (
    <>
      <section className="package-summary-row" data-testid="package-summary-row">
        <div className="package-overview-card">
          <span className="package-card-label">Package view</span>
          <h3>{detail.kind === "final_package" ? "Final client delivery" : "Initial client preview"}</h3>
          <p>{detail.subtitle}</p>
        </div>

        <div className="package-overview-card">
          <span className="package-card-label">Delivery visibility</span>
          <div className="package-pill-list">
            <DetailPill
              label="Package status"
              value={detail.finalPackage?.packageState ?? detail.initialPackage.status}
            />
            <DetailPill
              label="Release status"
              value={detail.finalPackage?.packageReleaseState ?? "preview_only"}
              tone={releaseTone(detail.finalPackage?.packageReleaseState ?? null)}
            />
            <DetailPill
              label="Linked review items"
              value={String(detail.reviewIssues.length)}
              tone={detail.reviewIssues.length > 0 ? "#f6c453" : "#58d68d"}
            />
          </div>
        </div>
      </section>

      <section className="package-tab-row">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`package-tab ${activeTab === tab ? "package-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
        <Link href={detail.downloadHref} className="package-download-link">
          Export package
        </Link>
      </section>

      {activeTab === "preview" ? (
        <section className="package-panel" data-testid="client-preview-surface">
          <div className="package-panel-header">Package preview</div>
          <div className="package-copy-block">
            <h3>Workflow summary</h3>
            <p>{detail.initialPackage.outward.workflowRationale}</p>
          </div>
          <div className="package-copy-grid">
            <div className="package-copy-block">
              <h3>Current package output</h3>
              <p>{detail.finalPackage?.finalSourceOrReferenceOutput ?? detail.initialPackage.outward.initialSynthesizedWorkflow}</p>
            </div>
            <div className="package-copy-block">
              <h3>Recommendations</h3>
              <p>{detail.finalPackage?.improvementTargetsOrFinalRecommendations ?? detail.initialPackage.outward.initialRecommendations}</p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "workflow" ? (
        <section className="package-panel" data-testid="workflow-visual-view">
          <div className="package-panel-header">Workflow view</div>
          <div className="workflow-column-grid">
            <div>
              <h3>Current workflow</h3>
              <div className="workflow-visual-stack">
                {currentWorkflowBlocks.map((step, index) => (
                  <div key={`${index}-${step}`} className="workflow-step current-step">
                    <span className="workflow-step-index">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3>Target workflow</h3>
              {targetWorkflowBlocks.length > 0 ? (
                <div className="workflow-visual-stack">
                  {targetWorkflowBlocks.map((step, index) => (
                    <div key={`${index}-${step}`} className="workflow-step target-step">
                      <span className="workflow-step-index">{index + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="package-copy-block">
                  <p>No target-state workflow was included in the accepted package.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "comparison" ? (
        <section className="package-panel" data-testid="comparison-view">
          <div className="package-panel-header">Current vs target comparison</div>
          <div className="workflow-column-grid">
            <div className="package-copy-block">
              <h3>Current-state reality</h3>
              <p>{currentWorkflow}</p>
            </div>
            <div className="package-copy-block">
              <h3>Target-state direction</h3>
              <p>{targetWorkflow ?? "No target-state workflow was included in the accepted package."}</p>
            </div>
          </div>
          <div className="package-copy-grid">
            <div className="package-copy-block">
              <h3>Gap analysis</h3>
              <p>{detail.finalPackage?.finalGapAnalysis ?? detail.initialPackage.outward.initialGapAnalysis}</p>
            </div>
            <div className="package-copy-block">
              <h3>Improvement direction</h3>
              <p>{detail.finalPackage?.improvementTargetsOrFinalRecommendations ?? detail.initialPackage.outward.initialRecommendations}</p>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "status" ? (
        <section className="package-panel" data-testid="status-visibility-view">
          <div className="package-panel-header">Status and release visibility</div>
          <div className="package-pill-list">
            <DetailPill
              label="Package state"
              value={detail.finalPackage?.packageState ?? detail.initialPackage.status}
            />
            <DetailPill
              label="Release state"
              value={detail.finalPackage?.packageReleaseState ?? "preview_only"}
              tone={releaseTone(detail.finalPackage?.packageReleaseState ?? null)}
            />
            <DetailPill
              label="Approval status"
              value={detail.finalPackage?.adminApprovalStatus ?? "not_applicable"}
              tone={detail.finalPackage?.adminApprovalStatus === "approved" ? "#58d68d" : "#8a9099"}
            />
          </div>

          <div className="package-copy-grid">
            <div className="package-copy-block">
              <h3>Review visibility</h3>
              {detail.reviewIssues.length === 0 ? (
                <p>No linked review items are currently visible for this package.</p>
              ) : (
                <ul className="package-plain-list">
                  {detail.reviewIssues.map((issue) => (
                    <li key={issue.issueId}>
                      <strong>{issue.issueBrief.issueTitle}</strong>
                      <span className="package-inline-note"> {issue.reviewState.replaceAll("_", " ")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="package-copy-block">
              <h3>Package linkage</h3>
              <ul className="package-plain-list">
                <li>Initial package: {detail.initialPackage.initialPackageId}</li>
                {detail.finalPackage ? <li>Final package: {detail.finalPackage.packageId}</li> : null}
                <li>Evaluation: {detail.initialPackage.evaluationId}</li>
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

