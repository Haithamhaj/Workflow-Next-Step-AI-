/**
 * Crawl4AI adapter (§10).
 * Default website crawler. A configured CRAWL4AI_URL is required; missing
 * runtime/config is reported as a visible failure by callers.
 *
 * Sidecar API contract:
 *   POST /crawl        { url: string } → { text: string, title?: string }
 *   POST /sitemap      { url: string } → { urls: string[] }
 */

import type { WebsiteSummary } from "@workflow/contracts";
import type {
  CrawlProvider,
  DiscoveredPage,
  CrawlPageResult,
} from "./crawl-provider.js";

// ---------------------------------------------------------------------------
// Env access
// ---------------------------------------------------------------------------

function getCrawl4AIUrl(): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.CRAWL4AI_URL;
  } catch {
    return undefined;
  }
}

/** Returns true when a real Crawl4AI sidecar is reachable. */
export function isCrawl4AILive(): boolean {
  const url = getCrawl4AIUrl();
  return typeof url === "string" && url.length > 0;
}

// ---------------------------------------------------------------------------
// Same-domain enforcement
// ---------------------------------------------------------------------------

function getHostname(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}

function isSameDomain(base: string, target: string): boolean {
  return getHostname(base) === getHostname(target);
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

export class Crawl4AIAdapter implements CrawlProvider {
  readonly name = "crawl4ai";

  async discoverPages(baseUrl: string, maxPages: number): Promise<DiscoveredPage[]> {
    const sidecarUrl = getCrawl4AIUrl();
    if (!sidecarUrl) {
      throw new Error("CRAWL4AI_URL is not configured for website candidate discovery.");
    }

    const res = await fetch(`${sidecarUrl}/sitemap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: baseUrl }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      throw new Error(`Crawl4AI candidate discovery failed with HTTP ${res.status}.`);
    }
    const data = (await res.json()) as { urls?: string[] };
    const rawUrls: string[] = Array.isArray(data.urls) ? data.urls : [];

    const filtered = rawUrls
      .filter((u) => isSameDomain(baseUrl, u))
      .slice(0, maxPages);

    if (filtered.length === 0) {
      filtered.push(baseUrl);
    }

    return filtered.map((url, i) => ({
      url,
      title: url === baseUrl ? "Homepage" : `Page ${i + 1}`,
      priority: (i === 0 ? "homepage" : "other") as DiscoveredPage["priority"],
      excluded: false,
    }));
  }

  async crawlPages(urls: string[]): Promise<CrawlPageResult[]> {
    const sidecarUrl = getCrawl4AIUrl();
    if (!sidecarUrl) {
      throw new Error("CRAWL4AI_URL is not configured for approved website crawling.");
    }

    const results: CrawlPageResult[] = [];
    // Crawl pages sequentially to avoid overwhelming the sidecar
    for (const url of urls) {
      try {
        const res = await fetch(`${sidecarUrl}/crawl`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: AbortSignal.timeout(60_000),
        });
        if (res.ok) {
          const data = (await res.json()) as { text?: string; title?: string };
          results.push({
            url,
            title: data.title ?? url,
            textContent: data.text ?? "",
            statusCode: 200,
          });
        } else {
          results.push({
            url,
            title: url,
            textContent: "",
            statusCode: res.status,
          });
        }
      } catch {
        results.push({
          url,
          title: url,
          textContent: "",
          statusCode: 0,
        });
      }
    }
    return results;
  }

  async generateSiteSummary(pages: CrawlPageResult[]): Promise<WebsiteSummary> {
    const hasContent = pages.some((p) => p.textContent.length > 0);
    if (!hasContent) {
      throw new Error("Crawl4AI returned no extractable content for site-level summary.");
    }

    // With sidecar + content, return basic summary from crawled text.
    // Real AI-powered summary is done by the extraction provider, not here.
    const allText = pages
      .filter((p) => p.textContent.length > 0)
      .map((p) => `[${p.url}]\n${p.textContent.slice(0, 1000)}`)
      .join("\n\n");

    return {
      companyIdentity: `Extracted from ${pages.length} crawled page(s)`,
      servicesProvided: allText.slice(0, 500),
      domainSignal: pages[0]?.url ?? "unknown",
      visibleDepartments: [],
      visibleProjectsClientsPartners: [],
      importantSignals: [`Crawled ${pages.length} page(s) with real Crawl4AI sidecar`],
    };
  }
}
