import Link from "next/link";
import { getHierarchyFoundationState } from "@workflow/hierarchy-intake";
import {
  compilePass3SourceTriagePromptSpec,
  compileStructuredPromptSpec,
  ensureActivePass3HierarchyPromptSpec,
  ensureActivePass3SourceTriagePromptSpec,
  listPass3PromptSpecs,
  pass3CapabilityModule,
} from "@workflow/prompts";
import { store } from "../../../../lib/store";
import HierarchyFoundationClient from "./HierarchyFoundationClient";

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
  const sources = store.intakeSources.findBySessionId(sessionId).map((source) => ({
    sourceId: source.sourceId,
    sourceName: source.displayName ?? source.fileName ?? source.websiteUrl ?? source.sourceId,
    inputType: source.inputType,
    bucket: source.bucket,
    noteText: source.noteText,
    extractedText: source.extractedText,
    artifactText: store.textArtifacts.findBySourceId(source.sourceId).map((artifact) => artifact.text).join("\n\n").slice(0, 4000),
  }));
  return {
    caseId: session?.caseId ?? "unknown",
    sessionId,
    primaryDepartment: session?.primaryDepartment,
    hierarchyNodesJson: JSON.stringify(draft?.nodes ?? [], null, 2),
    sourcesJson: JSON.stringify(sources, null, 2),
  };
}

export default function HierarchyPage({ params }: { params: { id: string } }) {
  const foundation = getHierarchyFoundationState(params.id, {
    intakeSessions: store.intakeSessions,
    hierarchyIntakes: store.hierarchyIntakes,
    hierarchyDrafts: store.hierarchyDrafts,
    hierarchyCorrections: store.hierarchyCorrections,
    approvedHierarchySnapshots: store.approvedHierarchySnapshots,
    hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
    sourceHierarchyTriageJobs: store.sourceHierarchyTriageJobs,
    sourceHierarchyTriageSuggestions: store.sourceHierarchyTriageSuggestions,
  });
  const promptSpec = ensureActivePass3HierarchyPromptSpec(store.structuredPromptSpecs);
  const sourceTriagePromptSpec = ensureActivePass3SourceTriagePromptSpec(store.structuredPromptSpecs);
  const pass3PromptSpecs = listPass3PromptSpecs(store.structuredPromptSpecs);
  const hierarchyDraftPrompt = pass3PromptSpecs.find((spec) => spec.linkedModule === pass3CapabilityModule("hierarchy_draft") && spec.status === "draft") ?? null;
  const sourceDraftPrompt = pass3PromptSpecs.find((spec) => spec.linkedModule === pass3CapabilityModule("source_hierarchy_triage") && spec.status === "draft") ?? null;
  const session = store.intakeSessions.findById(params.id);
  const structuredContext = store.structuredContexts.findBySessionId(params.id);
  const context = structuredContext?.context;
  const state = {
    ...foundation,
    sessionContext: {
      companyName: context?.companyName,
      department: context?.mainDepartment ?? session?.primaryDepartment,
      useCase: context?.selectedUseCase ?? session?.useCaseSelection?.useCaseLabel,
      caseId: session?.caseId,
    },
    promptSpec,
    compiledPromptPreview: compileStructuredPromptSpec(promptSpec, promptInput(params.id)),
    sourceTriagePromptSpec,
    compiledSourceTriagePromptPreview: compilePass3SourceTriagePromptSpec(sourceTriagePromptSpec, sourceTriagePromptInput(params.id)),
    pass3PromptSpecs,
    promptTestRuns: store.pass3PromptTestRuns.findAll(),
    promptDrafts: {
      hierarchyDraftPrompt,
      sourceDraftPrompt,
    },
    compiledDraftPromptPreviews: {
      hierarchy: hierarchyDraftPrompt ? compileStructuredPromptSpec(hierarchyDraftPrompt, promptInput(params.id)) : null,
      sourceTriage: sourceDraftPrompt ? compilePass3SourceTriagePromptSpec(sourceDraftPrompt, sourceTriagePromptInput(params.id)) : null,
    },
  };

  return (
    <>
      <h2>Hierarchy Intake & Structural Approval</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
      </p>
      <HierarchyFoundationClient sessionId={params.id} initialState={state} />
    </>
  );
}
