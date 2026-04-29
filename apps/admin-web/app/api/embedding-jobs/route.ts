import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runEmbeddingJob } from "@workflow/sources-context";
import { caseBelongsToCompany } from "@workflow/persistence";
import {
  getCompanyIdFromBody,
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../lib/company-scope";
import { store } from "../../../lib/store";

export async function GET(request: Request) {
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }
  const caseId = new URL(request.url).searchParams.get("caseId")?.trim();
  if (!caseId || !caseBelongsToCompany(companyId, caseId, store.cases)) {
    return scopedNotFoundResponse();
  }
  return NextResponse.json(
    store.embeddingJobs.findAll().filter((job) => job.companyId === companyId && job.caseId === caseId),
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    sourceId?: string;
    artifactId?: string;
    sampleText?: string;
    model?: string;
    companyId?: string;
  };
  const companyId = getCompanyIdFromBody(body);
  if (body.sourceId) {
    const source = store.intakeSources.findById(body.sourceId);
    if (!companyId) return missingCompanyIdResponse();
    if (!source || !caseBelongsToCompany(companyId, source.caseId, store.cases)) return scopedNotFoundResponse();
  }
  const job = await runEmbeddingJob({
    embeddingProvider: providerRegistry.getEmbeddingProvider(),
    sourceId: body.sourceId,
    artifactId: body.artifactId,
    sampleText: body.sampleText,
    model: body.model,
    repos: store,
  });
  return NextResponse.json(job, { status: job.status === "failed" ? 424 : 201 });
}
