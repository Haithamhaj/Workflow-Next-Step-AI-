import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runProviderExtractionJob } from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as {
    contentOverride?: string;
    audioBase64?: string;
    mimeType?: string;
  };
  const source = store.intakeSources.findById(params.id);
  if (!source) {
    return NextResponse.json({ error: "Intake source not found" }, { status: 404 });
  }
  const job = await runProviderExtractionJob({
    sourceId: params.id,
    extractionProvider: providerRegistry.getExtractionProvider("google"),
    sttProvider: providerRegistry.getSTTProvider(),
    contentOverride: body.contentOverride,
    audioBase64: body.audioBase64,
    mimeType: body.mimeType,
    repos: store,
  });
  return NextResponse.json(job, { status: job.status === "failed" ? 424 : 201 });
}
