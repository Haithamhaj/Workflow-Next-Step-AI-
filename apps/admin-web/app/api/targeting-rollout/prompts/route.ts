import { NextResponse } from "next/server";
import {
  compilePass4TargetingPromptSpec,
  createOrUpdatePass4PromptDraft,
  ensureActivePass4TargetingPromptSpec,
  listPass4PromptSpecs,
  promotePass4PromptDraft,
  runPass4PromptComparisonTest,
} from "@workflow/prompts";
import { providerRegistry } from "@workflow/integrations";
import type { StructuredPromptSpecBlock } from "@workflow/contracts";
import { store } from "../../../../lib/store";

export async function GET() {
  const active = ensureActivePass4TargetingPromptSpec(store.structuredPromptSpecs);
  const specs = listPass4PromptSpecs(store.structuredPromptSpecs);
  const draft = specs.find((spec) => spec.status === "draft") ?? null;
  const previous = specs.filter((spec) => spec.status === "previous");
  const sampleContext = {
    caseId: "sample_case",
    sessionId: "sample_session",
    selectedDepartment: "Sample Department",
    selectedUseCase: "Sample Use Case",
    approvedHierarchySnapshotJson: "{\"nodes\":[]}",
    hierarchyReadinessSnapshotJson: "{\"status\":\"ready_for_participant_targeting_planning\"}",
    sourceSignalsJson: "[]",
  };
  return NextResponse.json({
    active,
    draft,
    previous,
    compiledActivePreview: compilePass4TargetingPromptSpec(active, sampleContext),
    compiledDraftPreview: draft ? compilePass4TargetingPromptSpec(draft, sampleContext) : null,
    testRuns: store.pass4PromptTestRuns.findAll(),
  });
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await request.json() as { action?: string; blocks?: StructuredPromptSpecBlock[]; draftPromptSpecId?: string; adminNote?: string }
      : Object.fromEntries((await request.formData()).entries()) as { action?: string; draftPromptSpecId?: string; adminNote?: string };
    if (body.action === "draft") {
      const draft = createOrUpdatePass4PromptDraft({ blocks: "blocks" in body ? body.blocks as StructuredPromptSpecBlock[] | undefined : undefined, adminNote: body.adminNote }, store.structuredPromptSpecs);
      if (!contentType.includes("application/json")) return NextResponse.redirect(new URL("/targeting-rollout/prompts", request.url), { status: 303 });
      return NextResponse.json(draft);
    }
    if (body.action === "promote" && body.draftPromptSpecId) {
      return NextResponse.json(promotePass4PromptDraft({ draftPromptSpecId: body.draftPromptSpecId, adminNote: body.adminNote }, store.structuredPromptSpecs));
    }
    if (body.action === "test" && body.draftPromptSpecId) {
      const active = ensureActivePass4TargetingPromptSpec(store.structuredPromptSpecs);
      const draft = store.structuredPromptSpecs.findById(body.draftPromptSpecId);
      if (!draft) return NextResponse.json({ error: "Draft prompt not found." }, { status: 404 });
      const sampleContext = {
        caseId: "sample_case",
        sessionId: "sample_session",
        selectedDepartment: "Sample Department",
        selectedUseCase: "Sample Use Case",
        approvedHierarchySnapshotJson: "{\"nodes\":[]}",
        hierarchyReadinessSnapshotJson: "{\"status\":\"ready_for_participant_targeting_planning\"}",
        sourceSignalsJson: "[]",
      };
      return NextResponse.json(await runPass4PromptComparisonTest({
        draftPromptSpecId: body.draftPromptSpecId,
        caseContextUsed: "sample Pass 4 case context",
        activeCompiledPrompt: compilePass4TargetingPromptSpec(active, sampleContext),
        draftCompiledPrompt: compilePass4TargetingPromptSpec(draft, sampleContext),
        provider: providerRegistry.getExtractionProvider("google"),
        adminNote: body.adminNote,
      }, { promptSpecs: store.structuredPromptSpecs, testRuns: store.pass4PromptTestRuns }));
    }
    return NextResponse.json({ error: "Unsupported prompt action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
