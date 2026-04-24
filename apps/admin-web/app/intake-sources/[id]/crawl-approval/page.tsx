import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "../../../../lib/store";
import CrawlApprovalClient from "./CrawlApprovalClient";

export default function CrawlApprovalPage({ params }: { params: { id: string } }) {
  const source = store.intakeSources.findById(params.id);
  if (!source || source.inputType !== "website_url") notFound();
  const plans = store.websiteCrawlPlans.findBySourceId(source.sourceId);
  const summaryByPlan = new Map(plans.map((plan) => [
    plan.crawlPlanId,
    store.websiteCrawlSiteSummaries.findByCrawlPlanId(plan.crawlPlanId),
  ]));

  return (
    <>
      <h2>Website Crawl Flow</h2>
      <p>
        <Link href={`/intake-sources/${params.id}`}>&larr; Source detail</Link>
      </p>
      <div className="card">
        <p style={{ marginTop: 0 }}>
          URL registration uses the persisted intake source record. Candidate discovery runs before crawl, and crawl execution is blocked until approval is persisted.
        </p>
        <p style={{ marginBottom: 0, color: "var(--fg-muted)" }}>
          Registered URL: <code>{source.websiteUrl}</code>
        </p>
      </div>
      <CrawlApprovalClient sourceId={source.sourceId} initialPlans={plans} />
      {plans.length > 0 && (
        <div className="card" style={{ marginTop: "16px" }}>
          <h3 style={{ margin: "0 0 8px" }}>Site Summary</h3>
          {plans.map((plan) => {
            const summary = summaryByPlan.get(plan.crawlPlanId);
            return (
              <div key={plan.crawlPlanId} style={{ marginBottom: "12px" }}>
                <p style={{ margin: "0 0 4px" }}><code>{plan.crawlPlanId}</code> — {plan.status}</p>
                {summary ? (
                  <ul>
                    <li>Company: {summary.summary.companyIdentity}</li>
                    <li>Services: {summary.summary.servicesProvided}</li>
                    <li>Domain signal: {summary.summary.domainSignal}</li>
                  </ul>
                ) : (
                  <p style={{ color: "var(--fg-muted)", margin: 0 }}>Site-level summary is pending approved Crawl4AI crawl output.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
