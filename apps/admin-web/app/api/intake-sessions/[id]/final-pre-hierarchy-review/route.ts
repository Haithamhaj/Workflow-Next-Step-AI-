import { NextResponse } from "next/server";
import {
  confirmFinalPreHierarchyReview,
  createFinalPreHierarchyReview,
  evaluateFinalPreHierarchyReadiness,
  getFinalPreHierarchyReview,
} from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSessions: store.intakeSessions,
    intakeSources: store.intakeSources,
    departmentFraming: store.departmentFraming,
    structuredContexts: store.structuredContexts,
    finalPreHierarchyReviews: store.finalPreHierarchyReviews,
    websiteCrawlPlans: store.websiteCrawlPlans,
    audioTranscriptReviews: store.audioTranscriptReviews,
    providerJobs: store.providerJobs,
    contentChunks: store.contentChunks,
  };
}

function payload(sessionId: string) {
  return {
    readiness: evaluateFinalPreHierarchyReadiness(sessionId, repos()),
    review: getFinalPreHierarchyReview(sessionId, repos()),
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
  try {
    const action = typeof body.action === "string" ? body.action : "generate";
    if (action === "check-readiness") {
      const result = payload(params.id);
      return NextResponse.json(result, { status: result.readiness.ready ? 200 : 409 });
    }
    if (action === "confirm") {
      const review = confirmFinalPreHierarchyReview({
        sessionId: params.id,
        confirmedBy: typeof body.confirmedBy === "string" ? body.confirmedBy : "admin",
        adminNote: typeof body.adminNote === "string" ? body.adminNote : undefined,
      }, repos());
      return NextResponse.json({ ...payload(params.id), review });
    }
    if (action !== "generate") {
      return NextResponse.json({ error: "action must be check-readiness, generate, or confirm" }, { status: 400 });
    }
    const review = createFinalPreHierarchyReview(params.id, repos());
    return NextResponse.json({ ...payload(params.id), review }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.includes("blocked") ? 409 : 400;
    return NextResponse.json({ ...payload(params.id), error: message }, { status });
  }
}
