import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { structureManualNoteWithProvider } from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

function repos() {
  return {
    intakeSessions: store.intakeSessions,
    intakeSources: store.intakeSources,
    departmentFraming: store.departmentFraming,
    structuredContexts: store.structuredContexts,
    textArtifacts: store.textArtifacts,
    providerJobs: store.providerJobs,
  };
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const job = await structureManualNoteWithProvider({
    sourceId: params.id,
    provider: providerRegistry.getExtractionProvider("google"),
  }, repos());
  return NextResponse.json(job, { status: job.status === "failed" ? 424 : 201 });
}
