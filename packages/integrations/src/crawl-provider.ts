/**
 * Website crawl provider interface (§10).
 * Crawl4AI is default. Firecrawl is a future fallback.
 * Crawlers discover pages, respect admin approval, and return page content.
 */

import type { CrawlCandidatePage, CrawlPagePriority, WebsiteSummary } from "@workflow/contracts";

export interface DiscoveredPage {
  url: string;
  title: string;
  priority: CrawlPagePriority;
  excluded: boolean;
  exclusionReason?: string;
}

export interface CrawlPageResult {
  url: string;
  title: string;
  textContent: string;
  statusCode: number;
}

export interface CrawlProvider {
  readonly name: string;

  /** Discover candidate pages from a base URL (§10.2). */
  discoverPages(baseUrl: string, maxPages: number): Promise<DiscoveredPage[]>;

  /** Crawl approved pages and return their content (§10.4). */
  crawlPages(urls: string[]): Promise<CrawlPageResult[]>;

  /** Generate site-level summary from crawled content (§10.5). */
  generateSiteSummary(pages: CrawlPageResult[]): Promise<WebsiteSummary>;
}
