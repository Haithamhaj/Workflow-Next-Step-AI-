import { NextResponse } from "next/server";
import { caseBelongsToCompany } from "@workflow/persistence";
import { store } from "../../../../../lib/store";
import {
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../../../lib/company-scope";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) return missingCompanyIdResponse();
  const plan = store.websiteCrawlPlans.findById(params.id);
  if (!plan || !caseBelongsToCompany(companyId, plan.caseId, store.cases)) return scopedNotFoundResponse();
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
