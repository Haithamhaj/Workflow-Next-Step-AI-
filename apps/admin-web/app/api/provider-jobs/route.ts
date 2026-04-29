import { NextResponse } from "next/server";
import { caseBelongsToCompany } from "@workflow/persistence";
import { getCompanyIdFromRequest, missingCompanyIdResponse, scopedNotFoundResponse } from "../../../lib/company-scope";
import { store } from "../../../lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }
  const caseId = url.searchParams.get("caseId")?.trim();
  if (!caseId || !caseBelongsToCompany(companyId, caseId, store.cases)) {
    return scopedNotFoundResponse();
  }
  const sourceId = url.searchParams.get("sourceId");
  const sessionId = url.searchParams.get("sessionId");
  const jobs = sourceId
    ? store.providerJobs.findBySourceId(sourceId)
    : sessionId
      ? store.providerJobs.findBySessionId(sessionId)
      : store.providerJobs.findAll();
  return NextResponse.json(jobs.filter((job) => job.companyId === companyId && job.caseId === caseId));
}
