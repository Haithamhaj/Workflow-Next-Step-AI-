import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import { runAIIntakeSuggestionJob } from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const source = store.intakeSources.findById(params.id);
  if (!source) {
    return NextResponse.json({ error: "Intake source not found" }, { status: 404 });
  }
  const suggestion = await runAIIntakeSuggestionJob({
    sourceId: params.id,
    provider: providerRegistry.getExtractionProvider("google"),
    repos: store,
  });
  return NextResponse.json(suggestion, { status: suggestion.status === "failed" ? 424 : 201 });
}
