import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import {
  createWebsiteCrawlPlan,
  DEFAULT_WEBSITE_CRAWL_MAX_PAGES,
} from "@workflow/sources-context";
import { caseBelongsToCompany } from "@workflow/persistence";
import {
  getCompanyIdFromBody,
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../lib/company-scope";
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
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) return missingCompanyIdResponse();
  const caseId = searchParams.get("caseId")?.trim();
  if (!caseId || !caseBelongsToCompany(companyId, caseId, store.cases)) return scopedNotFoundResponse();
  const sourceId = searchParams.get("sourceId");
  const plans = sourceId
    ? store.websiteCrawlPlans.findBySourceId(sourceId)
    : store.websiteCrawlPlans.findAll();
  return NextResponse.json({
    plans: plans.filter((plan) => plan.companyId === companyId && plan.caseId === caseId),
    defaultMaxPages: DEFAULT_WEBSITE_CRAWL_MAX_PAGES,
    maxPageOptions: [20, 30, 40, 50],
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sourceId?: string; maxPages?: number; companyId?: string };
    const companyId = getCompanyIdFromBody(body);
    if (!companyId) return missingCompanyIdResponse();
    if (!body.sourceId) {
      return NextResponse.json({ error: "sourceId is required" }, { status: 400 });
    }
    const source = store.intakeSources.findById(body.sourceId);
    if (!source || !caseBelongsToCompany(companyId, source.caseId, store.cases)) return scopedNotFoundResponse();
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
