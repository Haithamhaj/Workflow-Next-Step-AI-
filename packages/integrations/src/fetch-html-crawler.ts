/**
 * Bounded native HTML crawler adapter.
 *
 * This adapter is intentionally simple: it uses Node fetch, enforces same-domain
 * URLs, extracts candidate links from HTML anchors, strips page text from HTML,
 * and leaves JavaScript-heavy crawling to Crawl4AI or another sidecar.
 */

import type { WebsiteSummary } from "@workflow/contracts";
import type { CrawlPageResult, CrawlProvider, DiscoveredPage } from "./crawl-provider.js";

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function normalizeUrl(baseUrl: string, href: string): string | null {
  try {
    const url = new URL(href, baseUrl);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function isSameDomain(baseUrl: string, targetUrl: string): boolean {
  return hostnameOf(baseUrl) === hostnameOf(targetUrl);
}

function titleFrom(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeEntities(stripTags(match?.[1] ?? "")).trim() || "Untitled page";
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function textFromHtml(html: string): string {
  return decodeEntities(stripTags(html)).replace(/\s+/g, " ").trim();
}

function linksFromHtml(baseUrl: string, html: string): string[] {
  const links = new Set<string>([baseUrl]);
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  for (const match of html.matchAll(anchorRegex)) {
    const normalized = normalizeUrl(baseUrl, match[1] ?? "");
    if (normalized && isSameDomain(baseUrl, normalized)) links.add(normalized);
  }
  return [...links];
}

async function fetchHtml(url: string): Promise<{ status: number; html: string }> {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "user-agent": "workflow-intake-fetch-html/1.0",
    },
    signal: AbortSignal.timeout(30_000),
  });
  const contentType = response.headers.get("content-type") ?? "";
  const body = await response.text();
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    return { status: response.status, html: body };
  }
  return { status: response.status, html: body };
}

export class FetchHtmlCrawlerAdapter implements CrawlProvider {
  readonly name = "fetch_html";

  async discoverPages(baseUrl: string, maxPages: number): Promise<DiscoveredPage[]> {
    const { status, html } = await fetchHtml(baseUrl);
    if (status < 200 || status >= 300) {
      throw new Error(`fetch_html candidate discovery failed with HTTP ${status}.`);
    }
    return linksFromHtml(baseUrl, html).slice(0, maxPages).map((url, index) => ({
      url,
      title: index === 0 ? titleFrom(html) : url,
      priority: index === 0 ? "homepage" : "other",
      excluded: false,
    }));
  }

  async crawlPages(urls: string[]): Promise<CrawlPageResult[]> {
    const results: CrawlPageResult[] = [];
    for (const url of urls) {
      try {
        const { status, html } = await fetchHtml(url);
        results.push({
          url,
          title: titleFrom(html),
          textContent: status >= 200 && status < 300 ? textFromHtml(html) : "",
          statusCode: status,
        });
      } catch {
        results.push({ url, title: url, textContent: "", statusCode: 0 });
      }
    }
    return results;
  }

  async generateSiteSummary(pages: CrawlPageResult[]): Promise<WebsiteSummary> {
    const successful = pages.filter((page) => page.textContent.trim());
    if (successful.length === 0) {
      throw new Error("fetch_html returned no extractable content for site-level summary.");
    }
    const allText = successful.map((page) => `[${page.url}] ${page.textContent.slice(0, 1000)}`).join("\n\n");
    return {
      companyIdentity: `Extracted from ${successful.length} crawled page(s)`,
      servicesProvided: allText.slice(0, 500),
      domainSignal: successful[0]?.url ?? "unknown",
      visibleDepartments: [],
      visibleProjectsClientsPartners: [],
      importantSignals: [`Crawled ${successful.length} page(s) with fetch_html adapter`],
    };
  }
}
