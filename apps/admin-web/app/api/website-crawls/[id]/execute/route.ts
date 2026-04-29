import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runApprovedWebsiteCrawl } from "@workflow/sources-context";
import { caseBelongsToCompany } from "@workflow/persistence";
import { store } from "../../../../../lib/store";
import {
  getCompanyIdFromBody,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../../../lib/company-scope";

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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = (await request.json().catch(() => ({}))) as { companyId?: string };
    const companyId = getCompanyIdFromBody(body);
    if (!companyId) return missingCompanyIdResponse();
    const plan = store.websiteCrawlPlans.findById(params.id);
    if (!plan || !caseBelongsToCompany(companyId, plan.caseId, store.cases)) return scopedNotFoundResponse();
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
