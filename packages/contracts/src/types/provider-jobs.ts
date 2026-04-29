/**
 * Pass 2 Phase 1 — async provider job contracts.
 * Source of truth: src/schemas/provider-extraction-job.schema.json,
 * src/schemas/embedding-job.schema.json.
 *
 * Provider integrations themselves are out of Phase 1 scope. Contracts and
 * persistence exist so later phases can schedule, observe, and reconcile
 * jobs against durable rows.
 */

export type ProviderExtractionJobType =
  | "document_extract"
  | "audio_transcribe"
  | "image_ocr"
  | "web_fetch";

export type ProviderExtractionJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type ProviderVendor =
  | "openai"
  | "anthropic"
  | "mistral"
  | "deepgram"
  | "local"
  | "other";

export type SourceLineageStatus = "active" | "previous" | "superseded" | "stale";

export interface ProviderExtractionJob {
  extractionJobId: string;
  intakeSourceId: string;
  companyId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  provider: ProviderVendor;
  model?: string;
  jobType: ProviderExtractionJobType;
  status: ProviderExtractionJobStatus;
  queuedAt: string;
  startedAt?: string;
  completedAt?: string;
  inputRef?: string;
  outputRef?: string;
  errorMessage?: string;
}

export type EmbeddingJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface EmbeddingJobRecord {
  embeddingJobId: string;
  chunkId: string;
  companyId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  provider: ProviderVendor;
  model: string;
  status: EmbeddingJobStatus;
  dimension?: number;
  vectorStoreRef?: string;
  vectorId?: string;
  queuedAt: string;
  completedAt?: string;
  errorMessage?: string;
}
