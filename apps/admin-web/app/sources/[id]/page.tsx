import type { Source } from "@workflow/persistence";
import { getSource } from "@workflow/sources-context";
import Link from "next/link";
import { store } from "../../../lib/store";

function getSourceById(id: string): Source | null {
  return getSource(id, store.sources);
}

function AuthorityBadge({ authority }: { authority: string }) {
  const isCompanyTruth = authority === "company_truth";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "6px",
        fontWeight: "bold",
        fontSize: "0.9em",
        background: isCompanyTruth ? "#1a3a1a" : "#2a2a10",
        color: isCompanyTruth ? "#7f7" : "#cc9",
        border: isCompanyTruth ? "1px solid #3a7a3a" : "1px solid #6a6a20",
      }}
    >
      {isCompanyTruth ? "✓ company_truth" : "ℹ informational_domain_support"}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td
        style={{
          padding: "8px 16px 8px 0",
          color: "#aaa",
          fontWeight: 500,
          verticalAlign: "top",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </td>
      <td style={{ padding: "8px 0", fontFamily: "monospace" }}>{value}</td>
    </tr>
  );
}

export default function SourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const source = getSourceById(params.id);

  if (!source) {
    return (
      <>
        <h2>Source not found</h2>
        <p>
          <Link href="/sources">← Back to sources</Link>
        </p>
      </>
    );
  }

  const isCompanyTruth = source.authority === "company_truth";

  return (
    <>
      <h2>Source Detail</h2>
      <p>
        <Link href="/sources">← Back to sources</Link>
      </p>

      {/* Authority classification block — visibly distinguishable (proof item #7) */}
      <div
        style={{
          margin: "20px 0",
          padding: "16px 20px",
          borderRadius: "8px",
          background: isCompanyTruth ? "#0e2a0e" : "#1e1e08",
          border: isCompanyTruth ? "2px solid #3a7a3a" : "2px solid #6a6a20",
        }}
      >
        <div style={{ marginBottom: "8px", fontSize: "0.8em", color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Authority Classification
        </div>
        <AuthorityBadge authority={source.authority} />
        <p style={{ marginTop: "10px", marginBottom: 0, color: "#bbb", fontSize: "0.88em" }}>
          {isCompanyTruth
            ? "This source is a company-truth document. It carries operational authority and may inform workflow reconstruction and reference analysis."
            : "This source is informational domain support only. It is non-authoritative and must not be confused with company reality or internal operational references (§11.10)."}
        </p>
      </div>

      {/* Full source record */}
      <div className="card" style={{ marginTop: "16px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <Row label="Source ID" value={source.sourceId} />
            <Row label="Case ID" value={source.caseId} />
            <Row label="Display Name" value={source.displayName ?? "—"} />
            <Row label="Uploader ID" value={source.uploaderId} />
            <Row label="Uploaded At" value={source.uploadedAt} />
            <Row label="Registered At" value={source.registeredAt} />
            <Row label="Intake Type" value={source.intakeType} />
            <Row
              label="Timing Tag"
              value={
                <span style={{ background: "#1a2a3a", padding: "2px 8px", borderRadius: "4px", color: "#8af" }}>
                  {source.timingTag}
                </span>
              }
            />
            <Row label="Processing Status" value={source.processingStatus} />
            <Row label="Notes" value={source.notes ?? "—"} />
          </tbody>
        </table>
      </div>
    </>
  );
}
