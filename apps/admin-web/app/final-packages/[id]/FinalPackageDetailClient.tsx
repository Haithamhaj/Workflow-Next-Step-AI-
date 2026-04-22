"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StoredFinalPackageRecord } from "@workflow/packages-output";

const RELEASE_STATES = [
  "not_releasable",
  "pending_admin_approval",
  "approved_for_release",
  "released",
] as const;

function releaseStateColor(state: string): string {
  switch (state) {
    case "released": return "#4c7";
    case "approved_for_release": return "#7cf";
    case "pending_admin_approval": return "#ca4";
    case "not_releasable": return "#888";
    default: return "#888";
  }
}

interface Props {
  record: StoredFinalPackageRecord;
}

export function FinalPackageDetailClient({ record }: Props) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);

  async function handleReleaseTransition(toState: string) {
    setReleaseError(null);
    setTransitioning(true);
    try {
      const res = await fetch(`/api/final-packages/${record.packageId}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toState }),
      });
      if (res.ok) {
        router.refresh();
        return;
      }
      const data = (await res.json()) as { error?: string };
      setReleaseError(data.error ?? "Transition failed.");
    } catch {
      setReleaseError("Network error — could not reach server.");
    } finally {
      setTransitioning(false);
    }
  }

  const nextReleaseStates = RELEASE_STATES.filter((s) => {
    const idx = RELEASE_STATES.indexOf(record.packageReleaseState as typeof RELEASE_STATES[number]);
    return s === RELEASE_STATES[idx + 1];
  });

  return (
    <>
      <section
        data-testid="release-state-panel"
        style={{
          background: "#141422",
          border: `2px solid ${releaseStateColor(record.packageReleaseState)}`,
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
          Release state — §28.15 / §28.16
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "4px",
              background: "#223",
              color: releaseStateColor(record.packageReleaseState),
              fontFamily: "monospace",
              fontSize: "1.05em",
            }}
          >
            {record.packageReleaseState}
          </span>

          {nextReleaseStates.map((toState) => (
            <button
              key={toState}
              disabled={transitioning}
              onClick={() => handleReleaseTransition(toState)}
              style={{
                padding: "6px 14px",
                background: "#223",
                border: `1px solid ${releaseStateColor(toState)}`,
                color: releaseStateColor(toState),
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "0.9em",
                opacity: transitioning ? 0.6 : 1,
              }}
            >
              → {toState}
            </button>
          ))}
        </div>

        {releaseError && (
          <p style={{ color: "#f77", marginTop: "10px", fontSize: "0.9em" }}>
            {releaseError}
          </p>
        )}

        <p style={{ color: "#666", fontSize: "0.8em", marginTop: "10px" }}>
          §28.16: pending_admin_approval cannot be skipped. Package existence ≠ release approval.
        </p>
      </section>

      <section
        data-testid="admin-approval-panel"
        style={{
          background: "#161616",
          border: `1px solid ${record.adminApprovalStatus === "approved" ? "#4c7" : "#644"}`,
          borderRadius: "6px",
          padding: "14px 18px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
          Admin approval — §25.16 (structurally separate from release state)
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            background: "#1a1a1a",
            color: record.adminApprovalStatus === "approved" ? "#4c7" : "#c88",
            fontFamily: "monospace",
            fontSize: "1em",
          }}
        >
          {record.adminApprovalStatus}
        </span>
        <p style={{ color: "#666", fontSize: "0.8em", marginTop: "8px" }}>
          Admin approval is set at package creation and is kept separate from
          packageReleaseState per §25.16.
        </p>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
          Package state — §28.11
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            background: "#223",
            color: "#ccc",
            fontFamily: "monospace",
            fontSize: "1em",
          }}
        >
          {record.packageState}
        </span>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "8px" }}>
          Output direction — §29.8.4
        </div>
        <span
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            background: "#223",
            color: "#adf",
            fontFamily: "monospace",
            fontSize: "1em",
          }}
        >
          {record.outputDirection}
        </span>
      </section>
    </>
  );
}
