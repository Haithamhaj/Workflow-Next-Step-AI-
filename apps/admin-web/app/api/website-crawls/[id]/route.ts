import { NextResponse } from "next/server";
import { approveWebsiteCrawlPlan } from "@workflow/sources-context";
import { store } from "../../../../lib/store";

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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const plan = store.websiteCrawlPlans.findById(params.id);
  if (!plan) return NextResponse.json({ error: "Website crawl plan not found" }, { status: 404 });
  return NextResponse.json({
    plan,
    approval: store.websiteCrawlApprovals.findByCrawlPlanId(params.id),
    summary: store.websiteCrawlSiteSummaries.findByCrawlPlanId(params.id),
    pageCount: store.crawledPageContents.findByCrawlPlanId(params.id).length,
    chunkCount: store.contentChunks.findByCrawlPlanId(params.id).length,
    crawlJobs: store.providerJobs.findBySourceId(plan.sourceId).filter((job) => job.jobKind === "website_crawl"),
    embeddingJobs: store.embeddingJobs.findBySourceId(plan.sourceId),
  });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json()) as { approvedUrls?: string[]; rejectedUrls?: string[] };
    const result = approveWebsiteCrawlPlan({
      crawlPlanId: params.id,
      approvedUrls: body.approvedUrls ?? [],
      rejectedUrls: body.rejectedUrls,
      repos: repos(),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
