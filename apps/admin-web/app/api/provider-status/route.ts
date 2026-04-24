import { NextResponse } from "next/server";
import { providerRegistry, resolveGoogleAIProviderConfig } from "@workflow/integrations";
import { store } from "../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    googleAI: resolveGoogleAIProviderConfig(),
    extraction: providerRegistry.getExtractionAvailability(),
    crawl: providerRegistry.getCrawlAvailability(),
    stt: providerRegistry.getSTTAvailability(),
    embedding: providerRegistry.getEmbeddingAvailability(),
    providerJobs: store.providerJobs.findAll(),
    embeddingJobs: store.embeddingJobs.findAll(),
    aiIntakeSuggestions: store.aiIntakeSuggestions.findAll(),
  });
}
