import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { startExternalAudioTranscription } from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSources: store.intakeSources,
    providerJobs: store.providerJobs,
    textArtifacts: store.textArtifacts,
    embeddingJobs: store.embeddingJobs,
    aiIntakeSuggestions: store.aiIntakeSuggestions,
    audioTranscriptReviews: store.audioTranscriptReviews,
    contentChunks: store.contentChunks,
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as {
    audioBase64?: string;
    mimeType?: string;
  };
  try {
    const result = await startExternalAudioTranscription({
      sourceId: params.id,
      sttProvider: providerRegistry.getSTTProvider(),
      extractionProvider: providerRegistry.getExtractionProvider("google"),
      audioBase64: body.audioBase64,
      mimeType: body.mimeType,
      repos: repos(),
    });
    return NextResponse.json(result, { status: result.status === "failed" ? 424 : 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
