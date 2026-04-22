import type { StoredFinalPackageRecord } from "@workflow/packages-output";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalPackageDetailClient } from "./FinalPackageDetailClient";

async function getFinalPackage(id: string): Promise<StoredFinalPackageRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/final-packages/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json() as Promise<StoredFinalPackageRecord>;
}

export default async function FinalPackageDetailPage({ params }: { params: { id: string } }) {
  const record = await getFinalPackage(params.id);
  if (record === null) notFound();

  return (
    <>
      <p style={{ marginBottom: "8px" }}>
        <Link href="/final-packages" style={{ color: "#7af" }}>← All final packages</Link>
      </p>
      <h2 style={{ fontFamily: "monospace" }}>{record.packageId}</h2>

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
          <dt style={{ color: "#888" }}>Package Type</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.packageType}</dd>
          <dt style={{ color: "#888" }}>Generated At</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.packageGeneratedAt}</dd>
          <dt style={{ color: "#888" }}>Created</dt>
          <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.createdAt}</dd>
          {record.initialPackageId ? (
            <>
              <dt style={{ color: "#888" }}>Initial Package ID</dt>
              <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>
                <Link href={`/initial-packages/${record.initialPackageId}`} style={{ color: "#7af" }}>
                  {record.initialPackageId}
                </Link>
              </dd>
            </>
          ) : null}
          {record.evaluationId ? (
            <>
              <dt style={{ color: "#888" }}>Evaluation ID</dt>
              <dd style={{ margin: 0, fontFamily: "monospace", color: "#aaa" }}>{record.evaluationId}</dd>
            </>
          ) : null}
        </dl>
      </section>

      <FinalPackageDetailClient record={record} />

      <section
        style={{
          background: "#141a22",
          border: "1px solid #335",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
          §24.13 structural separation
        </div>

        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "4px" }}>
            Final workflow reality — current-state (§29.8.3)
          </div>
          <div style={{ whiteSpace: "pre-wrap", color: "#ddd", background: "#1a1a28", padding: "10px", borderRadius: "4px" }}>
            {record.finalWorkflowReality}
          </div>
        </div>

        {record.improvedOrTargetStateWorkflow ? (
          <div>
            <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "4px" }}>
              Improved / target-state workflow (§29.8.3 — structurally separate)
            </div>
            <div style={{ whiteSpace: "pre-wrap", color: "#ddd", background: "#1a2818", padding: "10px", borderRadius: "4px" }}>
              {record.improvedOrTargetStateWorkflow}
            </div>
          </div>
        ) : (
          <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.85em" }}>
            No improved/target-state workflow provided.
          </p>
        )}
      </section>

      <section style={{ marginBottom: "24px" }}>
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
          Content sections — §29.8.2
        </div>

        {[
          { label: "Final source / reference output", value: record.finalSourceOrReferenceOutput },
          { label: "Final gap analysis", value: record.finalGapAnalysis },
          { label: "Improvement targets / final recommendations", value: record.improvementTargetsOrFinalRecommendations },
          { label: "UI overview layer", value: record.uiOverviewLayer },
          { label: "Finalization basis", value: record.finalizationBasis },
        ].map(({ label, value }) => (
          <div key={label} style={{ marginBottom: "14px" }}>
            <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "4px" }}>{label}</div>
            <div style={{ whiteSpace: "pre-wrap", color: "#ddd" }}>{value}</div>
          </div>
        ))}
      </section>

      <section
        style={{
          background: "#141a14",
          border: "1px solid #353",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#9a9", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "10px" }}>
          Gap layer — §29.8.5
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "6px" }}>Closed items</div>
          {record.gapLayer.closedItems.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.85em" }}>None</p>
          ) : (
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#4c7" }}>
              {record.gapLayer.closedItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "6px" }}>Non-blocking remaining items</div>
          {record.gapLayer.nonBlockingRemainingItems.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.85em" }}>None</p>
          ) : (
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#ca4" }}>
              {record.gapLayer.nonBlockingRemainingItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div style={{ color: "#ccc", fontSize: "0.9em", marginBottom: "6px" }}>Later review items</div>
          {record.gapLayer.laterReviewItems.length === 0 ? (
            <p style={{ color: "#666", fontStyle: "italic", fontSize: "0.85em" }}>None</p>
          ) : (
            <ul style={{ paddingLeft: "20px", margin: 0, color: "#7cf" }}>
              {record.gapLayer.laterReviewItems.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
