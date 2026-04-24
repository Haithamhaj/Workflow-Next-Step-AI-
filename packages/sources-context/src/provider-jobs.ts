import type {
  AIIntakeSuggestion,
  EmbeddingJobRecord,
  IntakeSource,
  ProviderExtractionJob,
  ProviderJobKind,
  TextArtifactRecord,
} from "@workflow/contracts";
import type {
  AIIntakeSuggestionRepository,
  AudioTranscriptReviewRepository,
  EmbeddingJobRepository,
  IntakeSourceRepository,
  ProviderExtractionJobRepository,
  StoredAIIntakeSuggestion,
  StoredEmbeddingJobRecord,
  StoredProviderExtractionJob,
  StoredTextArtifactRecord,
  TextArtifactRepository,
} from "@workflow/persistence";
import type {
  EmbeddingProvider,
  ExtractionProvider,
  STTProvider,
} from "@workflow/integrations";

export interface ProviderJobRepos {
  intakeSources: IntakeSourceRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  audioTranscriptReviews?: AudioTranscriptReviewRepository;
}

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function extractionKind(source: IntakeSource): ProviderJobKind {
  if (source.inputType === "document") return "document_extraction";
  if (source.inputType === "image") return "image_ocr";
  if (source.inputType === "audio") return "audio_transcription";
  if (source.inputType === "website_url") return "website_url_scaffold";
  return "manual_note_suggestion";
}

function createJob(source: IntakeSource, kind: ProviderJobKind): StoredProviderExtractionJob {
  const timestamp = now();
  return {
    jobId: id("pjob"),
    sourceId: source.sourceId,
    sessionId: source.sessionId,
    caseId: source.caseId,
    provider: kind === "audio_transcription" ? "google_speech_to_text" : "google",
    jobKind: kind,
    status: "queued",
    inputType: source.inputType,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function saveFailure(
  job: StoredProviderExtractionJob,
  repo: ProviderExtractionJobRepository,
  message: string,
): StoredProviderExtractionJob {
  const failed: StoredProviderExtractionJob = {
    ...job,
    status: "failed",
    errorMessage: message,
    updatedAt: now(),
  };
  repo.save(failed);
  return failed;
}

function saveArtifact(input: {
  sourceId: string;
  jobId: string;
  kind: TextArtifactRecord["artifactKind"];
  text: string;
  providerConfidence?: number;
  providerQualitySignal?: string;
}, repo: TextArtifactRepository): StoredTextArtifactRecord {
  const artifact: StoredTextArtifactRecord = {
    artifactId: id("artifact"),
    sourceId: input.sourceId,
    jobId: input.jobId,
    artifactKind: input.kind,
    text: input.text,
    providerConfidence: input.providerConfidence,
    providerQualitySignal: input.providerQualitySignal,
    createdAt: now(),
  };
  repo.save(artifact);
  return artifact;
}

export async function runProviderExtractionJob(input: {
  sourceId: string;
  extractionProvider: ExtractionProvider | null;
  sttProvider: STTProvider | null;
  repos: ProviderJobRepos;
  contentOverride?: string;
  binaryBase64?: string;
  audioBase64?: string;
  mimeType?: string;
}): Promise<StoredProviderExtractionJob> {
  const source = input.repos.intakeSources.findById(input.sourceId);
  if (!source) throw new Error(`Intake source not found: ${input.sourceId}`);

  const kind = extractionKind(source);
  const job = createJob(source, kind);
  input.repos.providerJobs.save(job);

  if (kind === "website_url_scaffold") {
    const skipped: StoredProviderExtractionJob = {
      ...job,
      status: "skipped",
      errorMessage: "Website crawling and candidate discovery are deferred to Phase 4.",
      updatedAt: now(),
    };
    input.repos.providerJobs.save(skipped);
    return skipped;
  }

  const running: StoredProviderExtractionJob = { ...job, status: "running", updatedAt: now() };
  input.repos.providerJobs.save(running);

  try {
    if (kind === "audio_transcription") {
      if (!input.sttProvider) {
        return saveFailure(running, input.repos.providerJobs, "Google Speech-to-Text provider configuration is missing.");
      }
      if (!input.audioBase64) {
        return saveFailure(running, input.repos.providerJobs, "No persisted audio bytes or request audioBase64 were provided.");
      }
      const transcript = await input.sttProvider.transcribe({
        audioData: Uint8Array.from(atob(input.audioBase64), (char) => char.charCodeAt(0)),
        mimeType: input.mimeType ?? source.mimeType ?? "application/octet-stream",
      });
      const artifact = saveArtifact({
        sourceId: source.sourceId,
        jobId: running.jobId,
        kind: "raw_transcript",
        text: transcript.text,
        providerConfidence: transcript.confidence,
        providerQualitySignal: transcript.qualitySignal,
      }, input.repos.textArtifacts);
      const succeeded: StoredProviderExtractionJob = {
        ...running,
        status: "succeeded",
        model: transcript.model ?? transcript.provider,
        outputRef: artifact.artifactId,
        updatedAt: now(),
      };
      input.repos.providerJobs.save(succeeded);
      return succeeded;
    }

    if (!input.extractionProvider) {
      return saveFailure(running, input.repos.providerJobs, "Google extraction/OCR provider configuration is missing.");
    }
    const content = input.contentOverride ?? source.noteText ?? source.websiteUrl ?? source.displayName ?? "";
    const binaryData = input.binaryBase64
      ? Uint8Array.from(atob(input.binaryBase64), (char) => char.charCodeAt(0)).buffer
      : undefined;
    if (!content && !binaryData && (source.inputType === "document" || source.inputType === "image")) {
      return saveFailure(running, input.repos.providerJobs, "No persisted document/image content or request contentOverride was provided.");
    }
    const result = await input.extractionProvider.extractText({
      content,
      mimeType: input.mimeType ?? source.mimeType,
      binaryData,
    });
    const artifact = saveArtifact({
      sourceId: source.sourceId,
      jobId: running.jobId,
      kind: "extracted_text",
      text: result.text,
    }, input.repos.textArtifacts);
    const succeeded: StoredProviderExtractionJob = {
      ...running,
      status: "succeeded",
      model: result.model,
      outputRef: artifact.artifactId,
      updatedAt: now(),
    };
    input.repos.providerJobs.save(succeeded);
    return succeeded;
  } catch (error) {
    return saveFailure(
      running,
      input.repos.providerJobs,
      error instanceof Error ? error.message : String(error),
    );
  }
}

export async function runEmbeddingJob(input: {
  embeddingProvider: EmbeddingProvider | null;
  repos: ProviderJobRepos;
  sourceId?: string;
  artifactId?: string;
  sampleText?: string;
  model?: string;
  chunkRefs?: string[];
}): Promise<StoredEmbeddingJobRecord> {
  const timestamp = now();
  const job: StoredEmbeddingJobRecord = {
    embeddingJobId: id("embedjob"),
    sourceId: input.sourceId,
    artifactId: input.artifactId,
    provider: "google",
    status: "queued",
    embeddingModel: input.model,
    chunkRefs: input.chunkRefs ?? (input.artifactId ? [input.artifactId] : []),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.embeddingJobs.save(job);
  const running: StoredEmbeddingJobRecord = { ...job, status: "running", updatedAt: now() };
  input.repos.embeddingJobs.save(running);

  try {
    if (!input.embeddingProvider) {
      throw new Error("Google embedding provider configuration is missing.");
    }
    const artifactText = input.artifactId ? input.repos.textArtifacts.findById(input.artifactId)?.text : undefined;
    const text = input.sampleText ?? artifactText;
    if (!text) throw new Error("No text or artifact was provided for embedding generation.");
    const result = await input.embeddingProvider.embedTexts({ texts: [text], model: input.model });
    const output = saveArtifact({
      sourceId: input.sourceId ?? "embedding_smoke",
      jobId: running.embeddingJobId,
      kind: "embedding_input",
      text: JSON.stringify({
        model: result.model,
        vectorCount: result.vectors.length,
        dimensions: result.vectors[0]?.length ?? 0,
      }),
    }, input.repos.textArtifacts);
    const succeeded: StoredEmbeddingJobRecord = {
      ...running,
      status: "succeeded",
      embeddingModel: result.model,
      outputRef: output.artifactId,
      updatedAt: now(),
    };
    input.repos.embeddingJobs.save(succeeded);
    return succeeded;
  } catch (error) {
    const failed: StoredEmbeddingJobRecord = {
      ...running,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      updatedAt: now(),
    };
    input.repos.embeddingJobs.save(failed);
    return failed;
  }
}

export async function runAIIntakeSuggestionJob(input: {
  sourceId: string;
  provider: ExtractionProvider | null;
  repos: ProviderJobRepos;
}): Promise<StoredAIIntakeSuggestion> {
  const source = input.repos.intakeSources.findById(input.sourceId);
  if (!source) throw new Error(`Intake source not found: ${input.sourceId}`);
  const timestamp = now();
  const suggestion: StoredAIIntakeSuggestion = {
    suggestionId: id("suggestion"),
    sourceId: source.sourceId,
    sessionId: source.sessionId,
    caseId: source.caseId,
    provider: "google",
    status: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.aiIntakeSuggestions.save(suggestion);
  const running: StoredAIIntakeSuggestion = { ...suggestion, status: "running", updatedAt: now() };
  input.repos.aiIntakeSuggestions.save(running);
  try {
    if (!input.provider) {
      throw new Error("Active LLM provider configuration is missing for intake source-role suggestion.");
    }
    const artifacts = input.repos.textArtifacts.findBySourceId(source.sourceId);
    const audioReview = source.inputType === "audio" && input.repos.audioTranscriptReviews
      ? input.repos.audioTranscriptReviews.findBySourceId(source.sourceId)
      : null;
    const trustedAudioArtifact = audioReview?.trustedTranscriptArtifactId
      ? input.repos.textArtifacts.findById(audioReview.trustedTranscriptArtifactId)
      : null;
    const extractedText = source.inputType === "audio"
      ? trustedAudioArtifact?.text ?? source.displayName ?? ""
      : artifacts.at(-1)?.text ?? source.noteText ?? source.websiteUrl ?? source.displayName ?? "";
    const result = await input.provider.classifySource({
      displayName: source.displayName ?? source.fileName ?? source.websiteUrl ?? source.sourceId,
      extractedText,
      bucket: source.bucket,
    });
    const succeeded: StoredAIIntakeSuggestion = {
      ...running,
      status: "succeeded",
      suggestedSourceRole: result.suggestedSourceRole,
      suggestedScope: result.suggestedScope,
      confidenceLevel: result.confidenceLevel,
      shortRationale: `${result.shortRationale} This is intake triage only, not deep reference analysis.`,
      evidenceRefs: artifacts.map((artifact) => artifact.artifactId).concat(trustedAudioArtifact ? [trustedAudioArtifact.artifactId] : []),
      updatedAt: now(),
    };
    input.repos.aiIntakeSuggestions.save(succeeded);
    input.repos.intakeSources.save({
      ...source,
      aiSuggestedType: result.suggestedSourceRole,
      aiSuggestedScope: result.suggestedScope,
      aiConfidence: result.confidenceLevel,
      aiReason: succeeded.shortRationale,
      updatedAt: now(),
    });
    return succeeded;
  } catch (error) {
    const failed: StoredAIIntakeSuggestion = {
      ...running,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
      updatedAt: now(),
    };
    input.repos.aiIntakeSuggestions.save(failed);
    return failed;
  }
}
