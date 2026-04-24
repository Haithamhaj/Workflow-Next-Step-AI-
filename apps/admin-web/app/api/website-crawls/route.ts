import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import {
  createWebsiteCrawlPlan,
  DEFAULT_WEBSITE_CRAWL_MAX_PAGES,
} from "@workflow/sources-context";
import { store } from "../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSources: store.intakeSources,
    providerJobs: store.providerJobs,
    textArtifacts: store.textArtifacts,
    embeddingJobs: store.embeddingJobs,
    aiIntakeSuggestions: store.aiIntakeSuggestions,
    websiteCrawlPlans: store.websiteCrawlPlans,
    websiteCrawlApprovals: store.websiteCrawlApprovals,
    crawledPageContents: store.crawledPageContents,
    websiteCrawlSiteSummaries: store.websiteCrawlSiteSummaries,
    contentChunks: store.contentChunks,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("sourceId");
  const plans = sourceId
    ? store.websiteCrawlPlans.findBySourceId(sourceId)
    : store.websiteCrawlPlans.findAll();
  return NextResponse.json({
    plans,
    defaultMaxPages: DEFAULT_WEBSITE_CRAWL_MAX_PAGES,
    maxPageOptions: [20, 30, 40, 50],
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sourceId?: string; maxPages?: number };
    if (!body.sourceId) {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
    }
    const plan = await createWebsiteCrawlPlan({
      sourceId: body.sourceId,
      maxPages: body.maxPages,
      crawlProvider: providerRegistry.getCrawlProvider()!,
      repos: repos(),
    });
    return NextResponse.json(
      { plan },
      { status: plan.status === "discovery_failed" ? 424 : 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
