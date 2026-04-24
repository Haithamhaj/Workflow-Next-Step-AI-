import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const plan = store.websiteCrawlPlans.findById(params.id);
  if (!plan) return NextResponse.json({ error: "Website crawl plan not found" }, { status: 404 });
  return NextResponse.json({
    plan: {
      crawlPlanId: plan.crawlPlanId,
      sourceId: plan.sourceId,
      baseUrl: plan.baseUrl,
      status: plan.status,
    },
    pages: store.crawledPageContents.findByCrawlPlanId(params.id).map((page) => ({
      ...page,
      chunks: store.contentChunks.findByPageContentId(page.pageContentId),
    })),
  });
}
