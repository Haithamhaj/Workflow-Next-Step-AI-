import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runProviderExtractionJob } from "@workflow/sources-context";
import { caseBelongsToCompany } from "@workflow/persistence";
import { store } from "../../../../../lib/store";
import {
  getCompanyIdFromBody,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../../../lib/company-scope";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as {
    contentOverride?: string;
    binaryBase64?: string;
    audioBase64?: string;
    mimeType?: string;
    companyId?: string;
  };
  const companyId = getCompanyIdFromBody(body);
  if (!companyId) return missingCompanyIdResponse();
  const source = store.intakeSources.findById(params.id);
  if (!source || !caseBelongsToCompany(companyId, source.caseId, store.cases)) return scopedNotFoundResponse();
  const storedFile = store.fileStore.get(source.sourceId);
  const storedBinaryBase64 = storedFile
    ? btoa(String.fromCharCode(...new Uint8Array(storedFile.bytes)))
    : undefined;
  const job = await runProviderExtractionJob({
    sourceId: params.id,
    extractionProvider: providerRegistry.getExtractionProvider("google"),
    sttProvider: providerRegistry.getSTTProvider(),
    contentOverride: body.contentOverride,
    binaryBase64: body.binaryBase64 ?? storedBinaryBase64,
    audioBase64: body.audioBase64,
    mimeType: body.mimeType ?? storedFile?.mimeType,
    repos: store,
  });
  return NextResponse.json(job, { status: job.status === "failed" ? 424 : 201 });
}
