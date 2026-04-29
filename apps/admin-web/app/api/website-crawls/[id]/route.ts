import { NextResponse } from "next/server";
import { approveWebsiteCrawlPlan } from "@workflow/sources-context";
import { caseBelongsToCompany } from "@workflow/persistence";
import { store } from "../../../../lib/store";
import {
  getCompanyIdFromBody,
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../../lib/company-scope";

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) return missingCompanyIdResponse();
  const plan = store.websiteCrawlPlans.findById(params.id);
  if (!plan || !caseBelongsToCompany(companyId, plan.caseId, store.cases)) return scopedNotFoundResponse();
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
    const body = (await request.json()) as { approvedUrls?: string[]; rejectedUrls?: string[]; companyId?: string };
    const companyId = getCompanyIdFromBody(body);
    if (!companyId) return missingCompanyIdResponse();
    const plan = store.websiteCrawlPlans.findById(params.id);
    if (!plan || !caseBelongsToCompany(companyId, plan.caseId, store.cases)) return scopedNotFoundResponse();
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
