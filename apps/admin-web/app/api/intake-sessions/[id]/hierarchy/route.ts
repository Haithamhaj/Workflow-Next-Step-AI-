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
  createOrUpdatePass3PromptDraft,
  promotePass3PromptDraft,
  runPass3PromptComparisonTest,
  compileStructuredPromptSpec,
  compilePass3SourceTriagePromptSpec,
  ensureActivePass3HierarchyPromptSpec,
  ensureActivePass3SourceTriagePromptSpec,
  listPass3PromptSpecs,
  pass3CapabilityModule,
} from "@workflow/prompts";
import type { Pass3PromptCapability, StructuredPromptSpecBlock } from "@workflow/contracts";
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

function sessionForCompany(companyId: string, sessionId: string) {
  const session = store.intakeSessions.findById(sessionId);
  if (!session) return null;
  return store.cases.findByCompanyAndCase(companyId, session.caseId) ? session : null;
}

function payload(companyId: string, sessionId: string) {
  const session = sessionForCompany(companyId, sessionId);
  if (!session) throw new Error("Intake session not found.");
  const foundation = getHierarchyFoundationState(sessionId, repos());
  const structuredContext = store.structuredContexts.findBySessionId(sessionId);
  const context = structuredContext?.context;
  const promptSpec = ensureActivePass3HierarchyPromptSpec(store.structuredPromptSpecs);
  const sourceTriagePromptSpec = ensureActivePass3SourceTriagePromptSpec(store.structuredPromptSpecs);
  const pass3PromptSpecs = listPass3PromptSpecs(store.structuredPromptSpecs);
  const hierarchyDraftPrompt = pass3PromptSpecs.find((spec) => spec.linkedModule === pass3CapabilityModule("hierarchy_draft") && spec.status === "draft") ?? null;
  const sourceDraftPrompt = pass3PromptSpecs.find((spec) => spec.linkedModule === pass3CapabilityModule("source_hierarchy_triage") && spec.status === "draft") ?? null;
  return {
    ...foundation,
    sessionContext: {
      companyName: context?.companyName,
      department: context?.mainDepartment ?? session?.primaryDepartment,
      useCase: context?.selectedUseCase ?? session?.useCaseSelection?.useCaseLabel,
      companyId,
      caseId: session?.caseId,
    },
    promptSpec,
    compiledPromptPreview: compileStructuredPromptSpec(promptSpec, promptInput(sessionId)),
    sourceTriagePromptSpec,
    compiledSourceTriagePromptPreview: compilePass3SourceTriagePromptSpec(sourceTriagePromptSpec, sourceTriagePromptInput(sessionId)),
    pass3PromptSpecs,
    promptTestRuns: store.pass3PromptTestRuns.findAll(),
    promptDrafts: {
      hierarchyDraftPrompt,
      sourceDraftPrompt,
    },
    compiledDraftPromptPreviews: {
      hierarchy: hierarchyDraftPrompt ? compileStructuredPromptSpec(hierarchyDraftPrompt, promptInput(sessionId)) : null,
      sourceTriage: sourceDraftPrompt ? compilePass3SourceTriagePromptSpec(sourceDraftPrompt, sourceTriagePromptInput(sessionId)) : null,
    },
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
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const companyId = new URL(request.url).searchParams.get("companyId");
    if (!companyId) return NextResponse.json({ error: "companyId is required." }, { status: 400 });
    return NextResponse.json(payload(companyId, params.id));
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
  const companyId = typeof body.companyId === "string" ? body.companyId : "";
  const session = companyId ? sessionForCompany(companyId, params.id) : null;
  if (!companyId || !session) return NextResponse.json({ error: "Intake session not found." }, { status: 404 });

  try {
    if (action === "create-pasted-intake") {
      const intake = createPastedHierarchyIntake({
        sessionId: params.id,
        companyId,
        pastedText: typeof body.pastedText === "string" ? body.pastedText : "",
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(companyId, params.id), intake }, { status: 201 });
    }

    if (action === "create-uploaded-document-intake") {
      const intake = createUploadedDocumentHierarchyIntake({
        sessionId: params.id,
        companyId,
        sourceId: typeof body.sourceId === "string" ? body.sourceId : "",
        artifactId: typeof body.artifactId === "string" ? body.artifactId : undefined,
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(companyId, params.id), intake }, { status: 201 });
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
        companyId,
        nodes,
        secondaryRelationships,
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
        correctionNote: typeof body.correctionNote === "string" ? body.correctionNote : undefined,
      }, repos());
      return NextResponse.json({ ...payload(companyId, params.id), draft }, { status: 201 });
    }

    if (action === "generate-ai-draft") {
      const promptSpec = ensureActivePass3HierarchyPromptSpec(store.structuredPromptSpecs);
      const compiledPrompt = compileStructuredPromptSpec(promptSpec, promptInput(params.id));
      const draft = await generateProviderBackedHierarchyDraft({
        sessionId: params.id,
        companyId,
        provider: providerRegistry.getExtractionProvider("google"),
        promptSpecId: promptSpec.promptSpecId,
        compiledPrompt,
      }, repos());
      const status = draft.status === "ai_draft_failed" ? 424 : 201;
      return NextResponse.json({ ...payload(companyId, params.id), draft }, { status });
    }

    if (action === "generate-source-triage") {
      const promptSpec = ensureActivePass3SourceTriagePromptSpec(store.structuredPromptSpecs);
      const compiledPrompt = compilePass3SourceTriagePromptSpec(promptSpec, sourceTriagePromptInput(params.id));
      const result = await generateProviderBackedSourceHierarchyTriage({
        sessionId: params.id,
        companyId,
        provider: providerRegistry.getExtractionProvider("google"),
        promptSpecId: promptSpec.promptSpecId,
        compiledPrompt,
      }, repos());
      const status = result.job.status === "ai_triage_failed" ? 424 : 201;
      return NextResponse.json({ ...payload(companyId, params.id), sourceTriageJob: result.job, sourceTriageSuggestions: result.suggestions }, { status });
    }

    if (action === "update-source-triage") {
      const triageId = typeof body.triageId === "string" ? body.triageId : "";
      if (!store.sourceHierarchyTriageSuggestions.findByCompany(companyId, session.caseId, triageId)) {
        return NextResponse.json({ ...payload(companyId, params.id), error: "Source hierarchy triage suggestion not found." }, { status: 404 });
      }
      const suggestion = updateSourceHierarchyTriageSuggestion({
        triageId,
        companyId,
        caseId: session.caseId,
        action: body.decisionAction as "accept" | "reject" | "change_scope" | "mark_participant_validation_needed" | "add_note",
        suggestedScope: body.suggestedScope as SourceHierarchySuggestedScope | undefined,
        linkedNodeId: typeof body.linkedNodeId === "string" ? body.linkedNodeId : undefined,
        linkedScopeLevel: body.linkedScopeLevel as SourceHierarchySuggestedScope | undefined,
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      }, repos());
      return NextResponse.json({ ...payload(companyId, params.id), sourceTriageSuggestion: suggestion }, { status: 201 });
    }

    if (action === "save-prompt-draft") {
      const capability = body.capability as Pass3PromptCapability;
      const blocks = Array.isArray(body.blocks) ? body.blocks as StructuredPromptSpecBlock[] : undefined;
      const draft = createOrUpdatePass3PromptDraft({
        capability,
        blocks,
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      }, store.structuredPromptSpecs);
      return NextResponse.json({ ...payload(companyId, params.id), promptDraft: draft }, { status: 201 });
    }

    if (action === "run-prompt-test") {
      const capability = body.capability as Pass3PromptCapability;
      const module = pass3CapabilityModule(capability);
      const draftPromptSpecId = typeof body.draftPromptSpecId === "string"
        ? body.draftPromptSpecId
        : store.structuredPromptSpecs.findByLinkedModule(module).find((spec) => spec.status === "draft")?.promptSpecId ?? "";
      const draft = store.structuredPromptSpecs.findById(draftPromptSpecId);
      if (!draft) throw new Error("Prompt draft not found for test run.");
      const active = store.structuredPromptSpecs.findActiveByLinkedModule(module);
      if (!active) throw new Error("Active prompt not found for test run.");
      const requestedTestInput = typeof body.testInput === "string" ? body.testInput : "";
      const hierarchyTestInput = {
        ...promptInput(params.id),
        pastedHierarchyText: requestedTestInput || promptInput(params.id).pastedHierarchyText,
      };
      const sourceTriageTestInput = {
        ...sourceTriagePromptInput(params.id),
        sourcesJson: requestedTestInput || sourceTriagePromptInput(params.id).sourcesJson,
      };
      const activeCompiledPrompt = capability === "hierarchy_draft"
        ? compileStructuredPromptSpec(active, hierarchyTestInput)
        : compilePass3SourceTriagePromptSpec(active, sourceTriageTestInput);
      const draftCompiledPrompt = capability === "hierarchy_draft"
        ? compileStructuredPromptSpec(draft, hierarchyTestInput)
        : compilePass3SourceTriagePromptSpec(draft, sourceTriageTestInput);
      const testRun = await runPass3PromptComparisonTest({
        capability,
        draftPromptSpecId,
        caseContextUsed: params.id,
        testInput: requestedTestInput || (capability === "hierarchy_draft" ? JSON.stringify(promptInput(params.id)) : JSON.stringify(sourceTriagePromptInput(params.id))),
        activeCompiledPrompt,
        draftCompiledPrompt,
        provider: providerRegistry.getExtractionProvider("google"),
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      }, {
        promptSpecs: store.structuredPromptSpecs,
        testRuns: store.pass3PromptTestRuns,
      });
      const status = testRun.providerStatus === "provider_success" ? 201 : 424;
      return NextResponse.json({ ...payload(companyId, params.id), promptTestRun: testRun }, { status });
    }

    if (action === "promote-prompt-draft") {
      const result = promotePass3PromptDraft({
        draftPromptSpecId: typeof body.draftPromptSpecId === "string" ? body.draftPromptSpecId : "",
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      }, store.structuredPromptSpecs);
      return NextResponse.json({ ...payload(companyId, params.id), promotedPrompt: result.active, previousPrompt: result.previous }, { status: 201 });
    }

    if (action === "create-manual-source-link") {
      const sourceId = typeof body.sourceId === "string" ? body.sourceId : "";
      const source = store.intakeSources.findById(sourceId);
      const suggestion = createManualSourceHierarchyLink({
        sessionId: params.id,
        companyId,
        sourceId,
        sourceName: typeof body.sourceName === "string" ? body.sourceName : source?.displayName ?? source?.fileName ?? sourceId,
        suggestedScope: body.suggestedScope as SourceHierarchySuggestedScope,
        linkedNodeId: typeof body.linkedNodeId === "string" ? body.linkedNodeId : undefined,
        linkedScopeLevel: body.linkedScopeLevel as SourceHierarchySuggestedScope | undefined,
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
        participantValidationNeeded: Boolean(body.participantValidationNeeded),
        createdBy: typeof body.createdBy === "string" ? body.createdBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(companyId, params.id), sourceTriageSuggestion: suggestion }, { status: 201 });
    }

    if (action === "approve-structural-snapshot") {
      const approvedSnapshot = approveStructuralHierarchy({
        sessionId: params.id,
        companyId,
        approvedBy: typeof body.approvedBy === "string" ? body.approvedBy : undefined,
      }, repos());
      return NextResponse.json({ ...payload(companyId, params.id), approvedSnapshot }, { status: 201 });
    }

    if (action === "calculate-readiness") {
      const readinessSnapshot = calculateHierarchyReadinessSnapshot(params.id, companyId, repos());
      return NextResponse.json({ ...payload(companyId, params.id), readinessSnapshot }, { status: 201 });
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
        "save-prompt-draft",
        "run-prompt-test",
        "promote-prompt-draft",
        "approve-structural-snapshot",
        "calculate-readiness",
      ],
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      ...payload(companyId, params.id),
      error: error instanceof Error ? error.message : String(error),
    }, { status: 400 });
  }
}
