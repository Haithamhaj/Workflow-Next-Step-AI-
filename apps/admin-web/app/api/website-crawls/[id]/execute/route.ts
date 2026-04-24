import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runApprovedWebsiteCrawl } from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

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

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    const result = await runApprovedWebsiteCrawl({
      crawlPlanId: params.id,
      crawlProvider: providerRegistry.getCrawlProvider()!,
      embeddingProvider: providerRegistry.getEmbeddingProvider(),
      repos: repos(),
    });
    return NextResponse.json(result, {
      status: result.crawlJob.status === "failed" ? 424 : 200,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 409 },
    );
  }
}
