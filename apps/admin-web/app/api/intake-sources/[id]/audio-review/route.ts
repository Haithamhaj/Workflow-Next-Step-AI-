import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";
import {
  getOrCreateAudioTranscriptReview,
  saveAudioTranscriptDecision,
} from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

export const dynamic = "force-dynamic";

function repos() {
  return {
    intakeSources: store.intakeSources,
    providerJobs: store.providerJobs,
    textArtifacts: store.textArtifacts,
    embeddingJobs: store.embeddingJobs,
    aiIntakeSuggestions: store.aiIntakeSuggestions,
    audioTranscriptReviews: store.audioTranscriptReviews,
    contentChunks: store.contentChunks,
  };
}

function payload(sourceId: string) {
  const review = getOrCreateAudioTranscriptReview({ sourceId, repos: repos() });
  return {
    review,
    providerJobs: store.providerJobs.findBySourceId(sourceId).filter((job) => job.jobKind === "audio_transcription"),
    rawTranscriptArtifact: review.rawTranscriptArtifactId
      ? store.textArtifacts.findById(review.rawTranscriptArtifactId)
      : null,
    trustedTranscriptArtifact: review.trustedTranscriptArtifactId
      ? store.textArtifacts.findById(review.trustedTranscriptArtifactId)
      : null,
    chunks: store.contentChunks.findBySourceId(sourceId).filter((chunk) => chunk.pageContentId === review.reviewId),
    embeddingJobs: store.embeddingJobs.findBySourceId(sourceId),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    return NextResponse.json(payload(params.id));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as {
    action?: "approve" | "edit" | "reject";
    editedTranscriptText?: string;
    adminNotes?: string;
    rejectionReason?: string;
  };
  if (body.action !== "approve" && body.action !== "edit" && body.action !== "reject") {
    return NextResponse.json({ error: "action must be approve, edit, or reject" }, { status: 400 });
  }
  try {
    const review = await saveAudioTranscriptDecision({
      sourceId: params.id,
      action: body.action,
      editedTranscriptText: body.editedTranscriptText,
      adminNotes: body.adminNotes,
      rejectionReason: body.rejectionReason,
      embeddingProvider: providerRegistry.getEmbeddingProvider(),
      repos: repos(),
    });
    return NextResponse.json({ ...payload(params.id), review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 },
    );
  }
}
