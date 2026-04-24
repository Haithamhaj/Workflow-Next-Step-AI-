import { NextResponse } from "next/server";
import {
  approveStructuralHierarchy,
  calculateHierarchyReadinessSnapshot,
  createPastedHierarchyIntake,
  createUploadedDocumentHierarchyIntake,
  createManualSourceHierarchyLink,
  generateProviderBackedHierarchyDraft,
  generateProviderBackedSourceHierarchyTriage,
  getHierarchyFoundationState,
  parsePastedHierarchyText,
  saveManualHierarchyDraft,
  updateSourceHierarchyTriageSuggestion,
  type HierarchyNodeRecord,
  type HierarchySecondaryRelationship,
  type SourceHierarchySuggestedScope,
} from "@workflow/hierarchy-intake";
import { providerRegistry } from "@workflow/integrations";
import {
  compileStructuredPromptSpec,
  compilePass3SourceTriagePromptSpec,
  ensureActivePass3HierarchyPromptSpec,
  ensureActivePass3SourceTriagePromptSpec,
} from "@workflow/prompts";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSessions: store.intakeSessions,
    hierarchyIntakes: store.hierarchyIntakes,
    hierarchyDrafts: store.hierarchyDrafts,
    hierarchyCorrections: store.hierarchyCorrections,
    approvedHierarchySnapshots: store.approvedHierarchySnapshots,
    hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
    sourceHierarchyTriageJobs: store.sourceHierarchyTriageJobs,
    sourceHierarchyTriageSuggestions: store.sourceHierarchyTriageSuggestions,
  };
}

function payload(sessionId: string) {
  const foundation = getHierarchyFoundationState(sessionId, repos());
  const promptSpec = ensureActivePass3HierarchyPromptSpec(store.structuredPromptSpecs);
  const sourceTriagePromptSpec = ensureActivePass3SourceTriagePromptSpec(store.structuredPromptSpecs);
  return {
    ...foundation,
    promptSpec,
    compiledPromptPreview: compileStructuredPromptSpec(promptSpec, promptInput(sessionId)),
    sourceTriagePromptSpec,
    compiledSourceTriagePromptPreview: compilePass3SourceTriagePromptSpec(sourceTriagePromptSpec, sourceTriagePromptInput(sessionId)),
  };
}

function promptInput(sessionId: string) {
  const session = store.intakeSessions.findById(sessionId);
  const intake = store.hierarchyIntakes.findBySessionId(sessionId);
  const structuredContext = store.structuredContexts.findBySessionId(sessionId);
  return {
    caseId: session?.caseId ?? "unknown",
    sessionId,
    primaryDepartment: session?.primaryDepartment,
    selectedUseCase: session?.useCaseSelection?.useCaseLabel,
    pastedHierarchyText: intake?.pastedText,
    structuredContextSummary: structuredContext?.context
      ? [
        `Company: ${structuredContext.context.companyName}`,
        `Department: ${structuredContext.context.mainDepartment}`,
        `Use case: ${structuredContext.context.selectedUseCase}`,
        `Department context: ${structuredContext.context.departmentContextSummary}`,
      ].join("\n")
      : undefined,
  };
}

function sourceTriagePromptInput(sessionId: string) {
  const session = store.intakeSessions.findById(sessionId);
  const draft = store.hierarchyDrafts.findBySessionId(sessionId);
  const sources = store.intakeSources.findBySessionId(sessionId).map((source) => {
    const artifacts = store.textArtifacts.findBySourceId(source.sourceId);
    return {
      sourceId: source.sourceId,
      sourceName: source.displayName ?? source.fileName ?? source.websiteUrl ?? source.sourceId,
      inputType: source.inputType,
      bucket: source.bucket,
      noteText: source.noteText,
      extractedText: source.extractedText,
      artifactText: artifacts.map((artifact) => artifact.text).join("\n\n").slice(0, 4000),
    };
  });
  return {
    caseId: session?.caseId ?? "unknown",
    sessionId,
    primaryDepartment: session?.primaryDepartment,
    hierarchyNodesJson: JSON.stringify(draft?.nodes ?? [], null, 2),
    sourcesJson: JSON.stringify(sources, null, 2),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return NextResponse.json(payload(params.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const action = typeof body.action === "string" ? body.action : "";

  try {
    if (action === "create-pasted-intake") {
      const intake = createPastedHierarchyIntake({
        sessionId: params.id,
        pastedText: typeof body.pastedText === "string" ? body.pastedText : "",
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), intake }, { status: 201 });
    }

    if (action === "create-uploaded-document-intake") {
      const intake = createUploadedDocumentHierarchyIntake({
        sessionId: params.id,
        sourceId: typeof body.sourceId === "string" ? body.sourceId : "",
        artifactId: typeof body.artifactId === "string" ? body.artifactId : undefined,
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), intake }, { status: 201 });
    }

    if (action === "parse-pasted-text") {
      const pastedText = typeof body.pastedText === "string" ? body.pastedText : "";
      return NextResponse.json({ nodes: parsePastedHierarchyText(pastedText) });
    }

    if (action === "save-manual-draft") {
      const nodes = Array.isArray(body.nodes) ? body.nodes as HierarchyNodeRecord[] : [];
      const secondaryRelationships = Array.isArray(body.secondaryRelationships)
        ? body.secondaryRelationships as HierarchySecondaryRelationship[]
        : [];
      const draft = saveManualHierarchyDraft({
        sessionId: params.id,
        nodes,
        secondaryRelationships,
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
        correctionNote: typeof body.correctionNote === "string" ? body.correctionNote : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), draft }, { status: 201 });
    }

    if (action === "generate-ai-draft") {
      const promptSpec = ensureActivePass3HierarchyPromptSpec(store.structuredPromptSpecs);
      const compiledPrompt = compileStructuredPromptSpec(promptSpec, promptInput(params.id));
      const draft = await generateProviderBackedHierarchyDraft({
        sessionId: params.id,
        provider: providerRegistry.getExtractionProvider("google"),
        promptSpecId: promptSpec.promptSpecId,
        compiledPrompt,
      }, repos());
      const status = draft.status === "ai_draft_failed" ? 424 : 201;
      return NextResponse.json({ ...payload(params.id), draft }, { status });
    }

    if (action === "generate-source-triage") {
      const promptSpec = ensureActivePass3SourceTriagePromptSpec(store.structuredPromptSpecs);
      const compiledPrompt = compilePass3SourceTriagePromptSpec(promptSpec, sourceTriagePromptInput(params.id));
      const result = await generateProviderBackedSourceHierarchyTriage({
        sessionId: params.id,
        provider: providerRegistry.getExtractionProvider("google"),
        promptSpecId: promptSpec.promptSpecId,
        compiledPrompt,
      }, repos());
      const status = result.job.status === "ai_triage_failed" ? 424 : 201;
      return NextResponse.json({ ...payload(params.id), sourceTriageJob: result.job, sourceTriageSuggestions: result.suggestions }, { status });
    }

    if (action === "update-source-triage") {
      const suggestion = updateSourceHierarchyTriageSuggestion({
        triageId: typeof body.triageId === "string" ? body.triageId : "",
        action: body.decisionAction as "accept" | "reject" | "change_scope" | "mark_participant_validation_needed" | "add_note",
        suggestedScope: body.suggestedScope as SourceHierarchySuggestedScope | undefined,
        linkedNodeId: typeof body.linkedNodeId === "string" ? body.linkedNodeId : undefined,
        linkedScopeLevel: body.linkedScopeLevel as SourceHierarchySuggestedScope | undefined,
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), sourceTriageSuggestion: suggestion }, { status: 201 });
    }

    if (action === "create-manual-source-link") {
      const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
      const source = store.intakeSources.findById(sourceId);
      const suggestion = createManualSourceHierarchyLink({
        sessionId: params.id,
        sourceId,
        sourceName: typeof body.sourceName === "string" ? body.sourceName : source?.displayName ?? source?.fileName ?? sourceId,
        suggestedScope: body.suggestedScope as SourceHierarchySuggestedScope,
        linkedNodeId: typeof body.linkedNodeId === "string" ? body.linkedNodeId : undefined,
        linkedScopeLevel: body.linkedScopeLevel as SourceHierarchySuggestedScope | undefined,
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
        participantValidationNeeded: Boolean(body.participantValidationNeeded),
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), sourceTriageSuggestion: suggestion }, { status: 201 });
    }

    if (action === "approve-structural-snapshot") {
      const approvedSnapshot = approveStructuralHierarchy({
        sessionId: params.id,
        approvedBy: typeof body.approvedBy === "string" ? body.approvedBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), approvedSnapshot }, { status: 201 });
    }

    if (action === "calculate-readiness") {
      const readinessSnapshot = calculateHierarchyReadinessSnapshot(params.id, repos());
      return NextResponse.json({ ...payload(params.id), readinessSnapshot }, { status: 201 });
    }

    return NextResponse.json({
      error: "Unsupported hierarchy action.",
      supportedActions: [
        "create-pasted-intake",
        "create-uploaded-document-intake",
        "parse-pasted-text",
        "save-manual-draft",
        "generate-ai-draft",
        "generate-source-triage",
        "update-source-triage",
        "create-manual-source-link",
        "approve-structural-snapshot",
        "calculate-readiness",
      ],
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      ...payload(params.id),
      error: error instanceof Error ? error.message : String(error),
    }, { status: 400 });
  }
}
