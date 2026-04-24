"use client";

import { useState } from "react";

type Candidate = {
  url: string;
  pageTitle?: string;
  priorityReason: string;
  defaultIncluded: boolean;
  adminIncluded: boolean;
  exclusionReason?: string;
};

type Plan = {
  crawlPlanId: string;
  sourceId: string;
  baseUrl: string;
  maxPages: number;
  status: string;
  candidatePages: Candidate[];
  errorMessage?: string;
};

export default function CrawlApprovalClient({
  sourceId,
  initialPlans,
}: {
  sourceId: string;
  initialPlans: Plan[];
}) {
  const [plans, setPlans] = useState(initialPlans);
  const [maxPages, setMaxPages] = useState(20);
  const [message, setMessage] = useState<string | null>(null);

  async function createPlan() {
    setMessage("Creating crawl plan...");
    const response = await fetch("/api/website-crawls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, maxPages }),
    });
    const data = await response.json();
    if (data.plan) {
      setPlans((current) => [data.plan, ...current.filter((plan) => plan.crawlPlanId !== data.plan.crawlPlanId)]);
      setMessage(response.ok ? "Crawl plan created." : data.plan.errorMessage ?? "Crawl plan saved with discovery failure.");
    } else {
      setMessage(data.error ?? "Unable to create crawl plan.");
    }
  }

  async function approvePlan(plan: Plan) {
    const approvedUrls = plan.candidatePages
      .filter((page) => page.adminIncluded)
      .map((page) => page.url);
    const fallbackUrl = approvedUrls.length > 0 ? [] : [plan.baseUrl];
    const response = await fetch(`/api/website-crawls/${plan.crawlPlanId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvedUrls: approvedUrls.length > 0 ? approvedUrls : fallbackUrl }),
    });
    const data = await response.json();
    if (data.plan) {
      setPlans((current) => current.map((item) => item.crawlPlanId === data.plan.crawlPlanId ? data.plan : item));
      setMessage("Crawl approval persisted.");
    } else {
      setMessage(data.error ?? "Unable to approve crawl plan.");
    }
  }

  async function executePlan(plan: Plan) {
    setMessage("Executing approved crawl...");
    const response = await fetch(`/api/website-crawls/${plan.crawlPlanId}/execute`, { method: "POST" });
    const data = await response.json();
    if (data.plan) {
      setPlans((current) => current.map((item) => item.crawlPlanId === data.plan.crawlPlanId ? data.plan : item));
      setMessage(data.crawlJob?.errorMessage ?? `Crawl job ${data.crawlJob?.status ?? "updated"}.`);
    } else {
      setMessage(data.error ?? "Unable to execute crawl.");
    }
  }

  function toggle(planId: string, url: string) {
    setPlans((current) => current.map((plan) => {
      if (plan.crawlPlanId !== planId) return plan;
      return {
        ...plan,
        candidatePages: plan.candidatePages.map((page) => page.url === url ? { ...page, adminIncluded: !page.adminIncluded } : page),
      };
    }));
  }

  return (
    <div className="card" style={{ marginTop: "16px" }}>
      <h3 style={{ margin: "0 0 12px" }}>Website Crawl Plan</h3>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <label htmlFor="maxPages">Max pages</label>
        <select id="maxPages" value={maxPages} onChange={(event) => setMaxPages(Number(event.target.value))}>
          {[20, 30, 40, 50].map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button type="button" onClick={createPlan}>Create crawl plan</button>
      </div>
      {message && <p style={{ color: "var(--fg-muted)" }}>{message}</p>}
      {plans.length === 0 ? (
        <p style={{ color: "var(--fg-muted)" }}>No website crawl plan has been created for this source.</p>
      ) : (
        plans.map((plan) => (
          <div key={plan.crawlPlanId} style={{ borderTop: "1px solid var(--border)", marginTop: "16px", paddingTop: "16px" }}>
            <p>
              <strong>{plan.status}</strong> — max pages {plan.maxPages} — <code>{plan.crawlPlanId}</code>
            </p>
            {plan.errorMessage && <p style={{ color: "#ffb4a8" }}>{plan.errorMessage}</p>}
            {plan.candidatePages.length === 0 ? (
              <p style={{ color: "var(--fg-muted)" }}>No candidate pages are available. Admin can still approve the registered URL for a visible runtime crawl attempt.</p>
            ) : (
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px" }}>Include</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>URL</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Priority reason</th>
                    <th style={{ textAlign: "left", padding: "6px" }}>Exclusion</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.candidatePages.map((page) => (
                    <tr key={page.url}>
                      <td style={{ padding: "6px" }}>
                        <input
                          type="checkbox"
                          checked={page.adminIncluded}
                          onChange={() => toggle(plan.crawlPlanId, page.url)}
                        />
                      </td>
                      <td style={{ padding: "6px" }}>
                        <code>{page.url}</code>
                        {page.pageTitle ? <div style={{ color: "var(--fg-muted)" }}>{page.pageTitle}</div> : null}
                      </td>
                      <td style={{ padding: "6px" }}>{page.priorityReason}</td>
                      <td style={{ padding: "6px" }}>{page.exclusionReason ?? "Included by default"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
              <button type="button" onClick={() => approvePlan(plan)}>Persist approval</button>
              <button type="button" onClick={() => executePlan(plan)}>Run approved crawl</button>
              <a href={`/website-crawls/${plan.crawlPlanId}/pages`}>Open page drill-down</a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
