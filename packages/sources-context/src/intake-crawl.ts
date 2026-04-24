/**
 * Website crawl orchestration — Pass 2 §10.
 * Manages crawl sessions: discovery, admin approval, crawl execution, summary.
 */

import { validateWebsiteCrawlSession } from "@workflow/contracts";
import type {
  CrawlCandidatePage,
  CrawlSessionStatus,
  WebsiteSummary,
  WebsiteCrawlSession as WebsiteCrawlSessionContract,
} from "@workflow/contracts";
import type {
  StoredWebsiteCrawlSession,
  WebsiteCrawlRepository,
} from "@workflow/persistence";

// ---------------------------------------------------------------------------
// createCrawlSession
// ---------------------------------------------------------------------------

export function createCrawlSession(input: {
  crawlId: string;
  sessionId: string;
  sourceId: string;
  baseUrl: string;
  maxPages?: number;
}, repo: WebsiteCrawlRepository): StoredWebsiteCrawlSession {
  const now = new Date().toISOString();
  const crawl: WebsiteCrawlSessionContract = {
    crawlId: input.crawlId,
    sessionId: input.sessionId,
    sourceId: input.sourceId,
    baseUrl: input.baseUrl,
    maxPages: input.maxPages ?? 20,
    status: "discovering",
    candidatePages: [],
    createdAt: now,
    updatedAt: now,
  };

  const result = validateWebsiteCrawlSession(crawl);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid WebsiteCrawlSession: ${messages}`);
  }

  const stored: StoredWebsiteCrawlSession = { ...crawl, createdAt: now, updatedAt: now };
  repo.save(stored);
  return stored;
}

// ---------------------------------------------------------------------------
// getCrawlSession
// ---------------------------------------------------------------------------

export function getCrawlSession(
  crawlId: string,
  repo: WebsiteCrawlRepository,
): StoredWebsiteCrawlSession | null {
  return repo.findById(crawlId);
}

// ---------------------------------------------------------------------------
// setDiscoveredPages — §10.2 (after discovery completes)
// ---------------------------------------------------------------------------

export function setDiscoveredPages(
  crawlId: string,
  pages: CrawlCandidatePage[],
  repo: WebsiteCrawlRepository,
): StoredWebsiteCrawlSession {
  const existing = repo.findById(crawlId);
  if (!existing) throw new Error(`Crawl session not found: ${crawlId}`);

  const updated: StoredWebsiteCrawlSession = {
    ...existing,
    status: "awaiting_approval",
    candidatePages: pages,
    updatedAt: new Date().toISOString(),
  };

  const result = validateWebsiteCrawlSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid discovered pages: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// approveCrawlPages — §10.3 (admin selects pages)
// ---------------------------------------------------------------------------

export function approveCrawlPages(
  crawlId: string,
  approvedUrls: string[],
  repo: WebsiteCrawlRepository,
): StoredWebsiteCrawlSession {
  const existing = repo.findById(crawlId);
  if (!existing) throw new Error(`Crawl session not found: ${crawlId}`);

  // Mark excluded pages that aren't in the approved list
  const candidatePages = existing.candidatePages.map((page) => ({
    ...page,
    excluded: !approvedUrls.includes(page.url),
    exclusionReason: approvedUrls.includes(page.url)
      ? page.exclusionReason
      : "Admin excluded",
  }));

  const updated: StoredWebsiteCrawlSession = {
    ...existing,
    status: "approved",
    candidatePages,
    approvedPages: approvedUrls,
    updatedAt: new Date().toISOString(),
  };

  const result = validateWebsiteCrawlSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid approval: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// setCrawlStatus
// ---------------------------------------------------------------------------

export function setCrawlStatus(
  crawlId: string,
  status: CrawlSessionStatus,
  repo: WebsiteCrawlRepository,
): StoredWebsiteCrawlSession {
  const existing = repo.findById(crawlId);
  if (!existing) throw new Error(`Crawl session not found: ${crawlId}`);

  const updated: StoredWebsiteCrawlSession = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  const result = validateWebsiteCrawlSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid crawl status: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// setSiteSummary — §10.5
// ---------------------------------------------------------------------------

export function setSiteSummary(
  crawlId: string,
  summary: WebsiteSummary,
  repo: WebsiteCrawlRepository,
): StoredWebsiteCrawlSession {
  const existing = repo.findById(crawlId);
  if (!existing) throw new Error(`Crawl session not found: ${crawlId}`);

  const updated: StoredWebsiteCrawlSession = {
    ...existing,
    status: "completed",
    siteSummary: summary,
    updatedAt: new Date().toISOString(),
  };

  const result = validateWebsiteCrawlSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid site summary: ${messages}`);
  }

  repo.save(updated);
  return updated;
}
