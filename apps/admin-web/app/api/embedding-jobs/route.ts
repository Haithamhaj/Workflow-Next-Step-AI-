import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runEmbeddingJob } from "@workflow/sources-context";
import { store } from "../../../lib/store";

export async function GET() {
  return NextResponse.json(store.embeddingJobs.findAll());
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    sourceId?: string;
    artifactId?: string;
    sampleText?: string;
    model?: string;
  };
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
