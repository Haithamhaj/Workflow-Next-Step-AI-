import { NextResponse } from "next/server";

export function blockedOldPass6TestSurfaceResponse(surface: string) {
  return NextResponse.json({
    error: "obsolete_pass6_test_surface_blocked",
    surface,
    message: "This old admin Pass 6/package test surface has been retired. It is not a supported production or client data surface.",
    boundary: {
      noRetrieval: true,
      noRag: true,
      noVectorDb: true,
      noAnswerCards: true,
      noContextEnvelope: true,
      noCopilotEnhancement: true,
      noPass6AnalysisBehaviorChange: true,
      noPackageGeneration: true,
    },
  }, { status: 410 });
}
