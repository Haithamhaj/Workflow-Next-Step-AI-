import { NextResponse } from "next/server";
import {
  buildPass6CopilotContextBundle,
  runPass6Copilot,
} from "@workflow/prompts";
import { providerRegistry } from "@workflow/integrations";
import { store } from "../../../../lib/store";

interface CopilotRequestBody {
  caseId?: string;
  question?: string;
  providerName?: "openai" | "google";
  action?: string;
}

function boundary() {
  return {
    readOnlyByDefault: true,
    noAutonomousWrites: true,
    noParticipantFacingSends: true,
    noMessageOrEmailSending: true,
    noReadinessRecalculation: true,
    noReadinessOverride: true,
    noPackageEligibilityChange: true,
    noPackageApproval: true,
    noPass7Mechanics: true,
    noFinalPackageGeneration: true,
    noReleaseBehavior: true,
  };
}

function copilotRepos() {
  return {
    synthesisInputBundles: store.synthesisInputBundles,
    workflowUnits: store.workflowUnits,
    workflowClaims: store.workflowClaims,
    analysisMethodUsages: store.analysisMethodUsages,
    differenceInterpretations: store.differenceInterpretations,
    assembledWorkflowDrafts: store.assembledWorkflowDrafts,
    workflowReadinessResults: store.workflowReadinessResults,
    prePackageGateResults: store.prePackageGateResults,
    clarificationNeeds: store.clarificationNeeds,
    inquiryPackets: store.inquiryPackets,
    externalInterfaceRecords: store.externalInterfaceRecords,
    initialWorkflowPackages: store.initialWorkflowPackages,
    workflowGapClosureBriefs: store.workflowGapClosureBriefs,
    draftOperationalDocuments: store.draftOperationalDocuments,
    workflowGraphRecords: store.workflowGraphRecords,
    pass6ConfigurationProfiles: store.pass6ConfigurationProfiles,
    pass6PromptSpecs: store.pass6PromptSpecs,
    pass6CopilotContextBundles: store.pass6CopilotContextBundles,
    pass6CopilotInteractions: store.pass6CopilotInteractions,
    pass7ReviewCandidates: store.pass7ReviewCandidates,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId");
  const interactions = caseId
    ? store.pass6CopilotInteractions.findByCaseId(caseId)
    : store.pass6CopilotInteractions.findAll();
  const context = caseId
    ? buildPass6CopilotContextBundle({ caseId, persist: false }, copilotRepos())
    : undefined;
  return NextResponse.json({
    boundary: boundary(),
    providerAvailability: providerRegistry.getPromptTextAvailability(),
    contextSummary: context?.summary,
    contextBundle: context?.contextBundle,
    interactions: interactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body: CopilotRequestBody = isJson
    ? await request.json() as CopilotRequestBody
    : Object.fromEntries((await request.formData()).entries()) as CopilotRequestBody;

  if (body.action && body.action !== "ask-copilot") {
    return NextResponse.json({ error: "Unsupported Pass 6 Copilot action." }, { status: 400 });
  }
  if (!body.caseId || !body.question) {
    return NextResponse.json({ error: "caseId and question are required." }, { status: 400 });
  }

  const providerName = body.providerName ?? providerRegistry.resolveDefaultPromptTextProvider();
  const provider = providerRegistry.getPromptTextProvider(providerName);
  const result = await runPass6Copilot({
    caseId: body.caseId,
    question: body.question,
    provider,
    providerName,
  }, copilotRepos());

  if (!isJson) {
    return NextResponse.redirect(new URL(`/pass6/copilot?caseId=${encodeURIComponent(body.caseId)}`, request.url), { status: 303 });
  }
  return NextResponse.json({ boundary: boundary(), result });
}
