import type { AudioTranscriptReviewStatus, ContentChunkRecord, TextArtifactRecord } from "@workflow/contracts";
import type {
  AudioTranscriptReviewRepository,
  AIIntakeSuggestionRepository,
  ContentChunkRepository,
  EmbeddingJobRepository,
  IntakeSourceRepository,
  ProviderExtractionJobRepository,
  StoredAudioTranscriptReviewRecord,
  StoredContentChunkRecord,
  StoredTextArtifactRecord,
  TextArtifactRepository,
} from "@workflow/persistence";
import type { EmbeddingProvider, ExtractionProvider, STTProvider } from "@workflow/integrations";
import { runEmbeddingJob, runProviderExtractionJob } from "./provider-jobs.js";

export interface AudioTranscriptReviewRepos {
  intakeSources: IntakeSourceRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  audioTranscriptReviews: AudioTranscriptReviewRepository;
  contentChunks: ContentChunkRepository;
}

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function existingOrCreate(input: {
  sourceId: string;
  repos: AudioTranscriptReviewRepos;
  status?: AudioTranscriptReviewStatus;
}): StoredAudioTranscriptReviewRecord {
  const source = input.repos.intakeSources.findById(input.sourceId);
  if (!source) throw new Error(`Intake source not found: ${input.sourceId}`);
  if (source.inputType !== "audio") {
    throw new Error("External audio transcript review can only be opened for audio intake sources.");
  }
  const existing = input.repos.audioTranscriptReviews.findBySourceId(source.sourceId);
  if (existing) return existing;
  const timestamp = now();
  const review: StoredAudioTranscriptReviewRecord = {
    reviewId: id("audioreview"),
    sourceId: source.sourceId,
    sessionId: source.sessionId,
    caseId: source.caseId,
    status: input.status ?? "transcription_pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.audioTranscriptReviews.save(review);
  return review;
}

function saveTranscriptArtifact(input: {
  sourceId: string;
  jobId?: string;
  companyId?: string;
  caseId?: string;
  sourceVersion?: number;
  kind: TextArtifactRecord["artifactKind"];
  text: string;
  providerConfidence?: number;
  providerQualitySignal?: string;
}, repo: TextArtifactRepository): StoredTextArtifactRecord {
  const artifact: StoredTextArtifactRecord = {
    artifactId: id("artifact"),
    sourceId: input.sourceId,
    jobId: input.jobId,
    companyId: input.companyId,
    caseId: input.caseId,
    sourceVersion: input.sourceVersion,
    lineageStatus: input.sourceVersion ? "active" : undefined,
    artifactKind: input.kind,
    text: input.text,
    providerConfidence: input.providerConfidence,
    providerQualitySignal: input.providerQualitySignal,
    createdAt: now(),
  };
  repo.save(artifact);
  return artifact;
}

function chunkTranscript(source: { companyId: string; caseId: string; sourceId: string; sourceVersion: number }, review: StoredAudioTranscriptReviewRecord, text: string): StoredContentChunkRecord[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const size = 1200;
  const chunks: ContentChunkRecord[] = [];
  for (let start = 0, index = 0; start < trimmed.length; start += size, index += 1) {
    chunks.push({
      chunkId: id("chunk"),
      companyId: source.companyId,
      crawlPlanId: `audio_transcript:${review.reviewId}`,
      sourceId: review.sourceId,
      caseId: source.caseId,
      sourceVersion: source.sourceVersion,
      lineageStatus: "active",
      pageContentId: review.reviewId,
      url: `audio:${review.sourceId}`,
      chunkIndex: index,
      text: trimmed.slice(start, start + size),
      createdAt: now(),
    });
  }
  return chunks;
}

export function getOrCreateAudioTranscriptReview(input: {
  sourceId: string;
  repos: AudioTranscriptReviewRepos;
}): StoredAudioTranscriptReviewRecord {
  return existingOrCreate({ sourceId: input.sourceId, repos: input.repos });
}

export async function startExternalAudioTranscription(input: {
  sourceId: string;
  sttProvider: STTProvider | null;
  extractionProvider: ExtractionProvider | null;
  repos: AudioTranscriptReviewRepos;
  audioBase64?: string;
  mimeType?: string;
}): Promise<{ review: StoredAudioTranscriptReviewRecord; jobId: string; status: string; errorMessage?: string }> {
  const review = existingOrCreate({ sourceId: input.sourceId, repos: input.repos, status: "transcription_pending" });
  const pending: StoredAudioTranscriptReviewRecord = {
    ...review,
    status: "transcription_pending",
    updatedAt: now(),
  };
  input.repos.audioTranscriptReviews.save(pending);
  const job = await runProviderExtractionJob({
    sourceId: input.sourceId,
    extractionProvider: input.extractionProvider,
    sttProvider: input.sttProvider,
    repos: input.repos,
    audioBase64: input.audioBase64,
    mimeType: input.mimeType,
  });
  if (job.status !== "succeeded" || !job.outputRef) {
    const failedReview: StoredAudioTranscriptReviewRecord = {
      ...pending,
      providerJobId: job.jobId,
      status: "transcript_rejected_or_needs_retry",
      adminNotes: "Transcription failed or needs retry before admin review.",
      rejectionReason: job.errorMessage,
      updatedAt: now(),
    };
    input.repos.audioTranscriptReviews.save(failedReview);
    return { review: failedReview, jobId: job.jobId, status: job.status, errorMessage: job.errorMessage };
  }
  const artifact = input.repos.textArtifacts.findById(job.outputRef);
  const readyReview: StoredAudioTranscriptReviewRecord = {
    ...pending,
    providerJobId: job.jobId,
    rawTranscriptArtifactId: job.outputRef,
    rawTranscriptText: artifact?.text,
    providerConfidence: artifact?.providerConfidence,
    providerQualitySignal: artifact?.providerQualitySignal,
    status: "transcript_ready_for_review",
    updatedAt: now(),
  };
  input.repos.audioTranscriptReviews.save(readyReview);
  return { review: readyReview, jobId: job.jobId, status: job.status };
}

export async function saveAudioTranscriptDecision(input: {
  sourceId: string;
  action: "approve" | "edit" | "reject";
  editedTranscriptText?: string;
  adminNotes?: string;
  rejectionReason?: string;
  repos: AudioTranscriptReviewRepos;
  embeddingProvider: EmbeddingProvider | null;
}): Promise<StoredAudioTranscriptReviewRecord> {
  const review = existingOrCreate({ sourceId: input.sourceId, repos: input.repos });
  if (input.action === "reject") {
    const rejected: StoredAudioTranscriptReviewRecord = {
      ...review,
      status: "transcript_rejected_or_needs_retry",
      adminNotes: input.adminNotes,
      rejectionReason: input.rejectionReason ?? "Rejected or marked for retry by admin.",
      trustedTranscriptArtifactId: undefined,
      reviewedAt: now(),
      updatedAt: now(),
    };
    input.repos.audioTranscriptReviews.save(rejected);
    const source = input.repos.intakeSources.findById(review.sourceId);
    if (source) {
      input.repos.intakeSources.save({
        ...source,
        extractedText: undefined,
        status: "needs_review",
        updatedAt: now(),
      });
    }
    return rejected;
  }

  const rawArtifact = review.rawTranscriptArtifactId
    ? input.repos.textArtifacts.findById(review.rawTranscriptArtifactId)
    : null;
  const trustedText = input.action === "edit"
    ? input.editedTranscriptText?.trim()
    : rawArtifact?.text.trim();
  if (!trustedText) {
    throw new Error("No transcript text is available for approval or edit.");
  }

  const source = input.repos.intakeSources.findById(review.sourceId);
  if (!source) {
    throw new Error(`Intake source not found: ${review.sourceId}`);
  }

  const artifact = saveTranscriptArtifact({
    sourceId: review.sourceId,
    jobId: review.providerJobId,
    companyId: source?.companyId,
    caseId: source?.caseId,
    sourceVersion: source?.sourceVersion,
    kind: "extracted_text",
    text: trustedText,
    providerConfidence: review.providerConfidence,
    providerQualitySignal: input.action === "edit" ? "admin_edited_transcript" : review.providerQualitySignal,
  }, input.repos.textArtifacts);

  input.repos.intakeSources.save({
    ...source,
    extractedText: trustedText,
    status: "pending_analysis",
    updatedAt: now(),
  });

  const chunks = chunkTranscript(source, review, trustedText);
  chunks.forEach((chunk) => input.repos.contentChunks.save(chunk));
  for (const chunk of chunks) {
    await runEmbeddingJob({
      embeddingProvider: input.embeddingProvider,
      repos: input.repos,
      sourceId: review.sourceId,
      artifactId: artifact.artifactId,
      sampleText: chunk.text,
      chunkRefs: [chunk.chunkId],
    });
  }

  const trusted: StoredAudioTranscriptReviewRecord = {
    ...review,
    status: input.action === "edit" ? "transcript_edited_by_admin" : "transcript_approved",
    trustedTranscriptArtifactId: artifact.artifactId,
    editedTranscriptText: input.action === "edit" ? trustedText : review.editedTranscriptText,
    adminNotes: input.adminNotes,
    reviewedAt: now(),
    updatedAt: now(),
  };
  input.repos.audioTranscriptReviews.save(trusted);
  return trusted;
}
