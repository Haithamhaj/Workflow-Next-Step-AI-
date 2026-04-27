import { NextResponse } from "next/server";
import { generatePackageVisuals } from "@workflow/packages-output";
import { store } from "../../../../../../lib/store";

interface RouteContext {
  params: {
    outputId: string;
  };
}

function boundary() {
  return {
    visualRenderersDoNotOwnWorkflowTruth: true,
    noWorkflowAnalysis: true,
    noReadinessRecalculation: true,
    noPackageEligibilityChange: true,
    noProviderCalls: true,
    noCopilotRuntime: true,
    noPass7Mechanics: true,
    noFinalPackageGeneration: true,
    noReleaseBehavior: true,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const records = store.workflowGraphRecords.findAll()
    .filter((record) => {
      const metadata = record.workflowGraphJson.metadata as Record<string, unknown> | undefined;
      return metadata?.packageId === params.outputId || record.visualRecordId === params.outputId;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ boundary: boundary(), visuals: records });
}

export async function POST(_request: Request, { params }: RouteContext) {
  const initialPackage = store.initialWorkflowPackages.findById(params.outputId);
  if (!initialPackage) {
    return NextResponse.json({ error: "InitialWorkflowPackage not found for visual generation." }, { status: 404 });
  }
  const readiness = store.workflowReadinessResults.findById(initialPackage.workflowReadinessResultId);
  const draft = readiness ? store.assembledWorkflowDrafts.findById(readiness.assembledWorkflowDraftId) : null;
  if (!draft) {
    return NextResponse.json({ error: "AssembledWorkflowDraft not found for package visual generation." }, { status: 404 });
  }
  const result = generatePackageVisuals({
    initialWorkflowPackage: initialPackage,
    assembledWorkflowDraft: draft,
    externalInterfaces: store.externalInterfaceRecords.findByCaseId(initialPackage.caseId),
  }, {
    workflowGraphRecords: store.workflowGraphRecords,
  });

  if (!result.ok) {
    return NextResponse.json({ boundary: boundary(), result }, { status: 400 });
  }
  return NextResponse.json({ boundary: boundary(), result });
}
