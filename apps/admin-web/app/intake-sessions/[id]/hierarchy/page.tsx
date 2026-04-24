import Link from "next/link";
import { getHierarchyFoundationState } from "@workflow/hierarchy-intake";
import {
  compileStructuredPromptSpec,
  ensureActivePass3HierarchyPromptSpec,
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

export default function HierarchyPage({ params }: { params: { id: string } }) {
  const foundation = getHierarchyFoundationState(params.id, {
    intakeSessions: store.intakeSessions,
    hierarchyIntakes: store.hierarchyIntakes,
    hierarchyDrafts: store.hierarchyDrafts,
    hierarchyCorrections: store.hierarchyCorrections,
    approvedHierarchySnapshots: store.approvedHierarchySnapshots,
    hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
  });
  const promptSpec = ensureActivePass3HierarchyPromptSpec(store.structuredPromptSpecs);
  const state = {
    ...foundation,
    promptSpec,
    compiledPromptPreview: compileStructuredPromptSpec(promptSpec, promptInput(params.id)),
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
