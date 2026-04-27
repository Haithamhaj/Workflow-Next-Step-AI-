import { NextResponse } from "next/server";
import { buildPass6MethodologyAnalysisReportFromRepositories } from "@workflow/synthesis-evaluation";
import { store } from "../../../../../lib/store";

interface RouteContext {
  params: {
    resultId: string;
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const result = buildPass6MethodologyAnalysisReportFromRepositories(params.resultId, {
    workflowReadinessResults: store.workflowReadinessResults,
    assembledWorkflowDrafts: store.assembledWorkflowDrafts,
    workflowClaims: store.workflowClaims,
    differenceInterpretations: store.differenceInterpretations,
    analysisMethodUsages: store.analysisMethodUsages,
    pass6ConfigurationProfiles: store.pass6ConfigurationProfiles,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    boundary: {
      audience: "admin_internal",
      noPackageGenerated: true,
      noPre6CQuestionsGenerated: true,
      noPass7CandidatesCreated: true,
      noProviderCalls: true,
      noReadinessOverride: true,
    },
    report: result.report,
  });
}
