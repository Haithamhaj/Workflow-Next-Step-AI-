import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export default function WebsiteCrawlPagesPage({ params }: { params: { id: string } }) {
  const plan = store.websiteCrawlPlans.findById(params.id);
  if (!plan) notFound();
  const pages = store.crawledPageContents.findByCrawlPlanId(plan.crawlPlanId);
  const chunks = store.contentChunks.findByCrawlPlanId(plan.crawlPlanId);

  return (
    <>
      <h2>Website Crawl Page Drill-down</h2>
      <p>
        <Link href={`/intake-sources/${plan.sourceId}/crawl-approval`}>&larr; Crawl approval flow</Link>
      </p>
      <div className="card">
        <p style={{ marginTop: 0 }}><code>{plan.crawlPlanId}</code> — {plan.status}</p>
        <p style={{ color: "var(--fg-muted)", marginBottom: 0 }}>
          Page-level content is shown only in this admin drill-down. Chunks preserve page URL and crawl-plan traceability.
        </p>
      </div>
      {pages.length === 0 ? (
        <div className="card" style={{ marginTop: "16px" }}>
          <p style={{ margin: 0, color: "var(--fg-muted)" }}>No page-level crawl content has been persisted yet.</p>
        </div>
      ) : (
        pages.map((page) => (
          <div className="card" key={page.pageContentId} style={{ marginTop: "16px" }}>
            <h3 style={{ margin: "0 0 8px" }}>{page.pageTitle ?? page.url}</h3>
            <p style={{ color: "var(--fg-muted)" }}>
              <code>{page.url}</code> — status {page.statusCode} — pageContentId <code>{page.pageContentId}</code>
            </p>
            <pre style={{ whiteSpace: "pre-wrap", maxHeight: "220px", overflow: "auto" }}>{page.textContent}</pre>
            <h4>Chunks</h4>
            <ul>
              {chunks.filter((chunk) => chunk.pageContentId === page.pageContentId).map((chunk) => (
                <li key={chunk.chunkId}>
                  <code>{chunk.chunkId}</code> — index {chunk.chunkIndex} — source <code>{chunk.sourceId}</code> — plan <code>{chunk.crawlPlanId}</code>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </>
  );
}
