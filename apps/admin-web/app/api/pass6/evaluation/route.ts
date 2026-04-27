import { NextResponse } from "next/server";
import { store } from "../../../../lib/store";

export async function GET() {
  const results = store.workflowReadinessResults.findAll()
    .map((result) => ({
      resultId: result.resultId,
      caseId: result.caseId,
      assembledWorkflowDraftId: result.assembledWorkflowDraftId,
      readinessDecision: result.readinessDecision,
      is6CAllowed: result.is6CAllowed,
      allowedUseFor6C: result.allowedUseFor6C,
      routingRecommendations: result.routingRecommendations,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({
    boundary: {
      audience: "admin_internal",
      noPackageGenerated: true,
      noPre6CQuestionsGenerated: true,
      noPass7CandidatesCreated: true,
      noProviderCalls: true,
    },
    results,
  });
}
