/**
 * Pass 2 Phase 1 — intake domain contracts.
 * Source of truth: src/schemas/intake-*.schema.json.
 *
 * Scope: intake triage foundation only. Deep reference analysis, website
 * crawling, audio transcription, embeddings, hierarchy, and rollout are
 * handled in later phases.
 */
import type {
  SourceIntakeType,
  SourceTimingTag,
  SourceAuthority,
} from "./source-registration.js";

export type IntakeSourceMode =
  | "file_upload"
  | "url_reference"
  | "pasted_text"
  | "audio_upload";

export type IntakeSourceStatus =
  | "registered"
  | "ai_suggested"
  | "admin_decided_accept"
  | "admin_decided_reject"
  | "processing"
  | "processed"
  | "failed";

export interface IntakeSourceRecord {
  intakeSourceId: string;
  intakeBatchId: string;
  caseId: string;
  submittedBy: string;
  submittedAt: string;
  mode: IntakeSourceMode;
  displayName?: string;
  sourceUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  storageRef?: string;
  contentRef?: string;
  intakeStatus: IntakeSourceStatus;
  notes?: string;
}

export type IntakeBatchStatus =
  | "collecting"
  | "under_triage"
  | "admin_review"
  | "decided"
  | "closed";

export interface IntakeBatchRecord {
  intakeBatchId: string;
  caseId: string;
  createdBy: string;
  createdAt: string;
  batchStatus: IntakeBatchStatus;
  label?: string;
  notes?: string;
}

export type IntakeItemDisposition =
  | "pending"
  | "accepted"
  | "rejected"
  | "deferred";

export interface IntakeBatchSummaryItem {
  intakeBatchId: string;
  intakeSourceId: string;
  suggestedRole?: string;
  suggestedAuthority?: SourceAuthority | "unknown";
  summary?: string;
  confidenceScore?: number;
  adminDisposition: IntakeItemDisposition;
}

export type AIIntakeProvider =
  | "openai"
  | "anthropic"
  | "mistral"
  | "local"
  | "other";

export interface AIIntakeSuggestion {
  suggestionId: string;
  intakeSourceId: string;
  caseId: string;
  provider: AIIntakeProvider;
  model: string;
  promptVersion: string;
  generatedAt: string;
  suggestedIntakeType?: SourceIntakeType;
  suggestedAuthority?: SourceAuthority;
  suggestedTimingTag?: SourceTimingTag;
  suggestedRole?: string;
  rationale?: string;
  confidenceScore?: number;
  rawJsonRef?: string;
}

export type AdminIntakeDecisionKind =
  | "accept"
  | "reject"
  | "defer"
  | "override";

export interface AdminIntakeDecision {
  decisionId: string;
  intakeSourceId: string;
  caseId: string;
  decidedBy: string;
  decidedAt: string;
  decision: AdminIntakeDecisionKind;
  finalIntakeType?: SourceIntakeType;
  finalAuthority?: SourceAuthority;
  finalTimingTag?: SourceTimingTag;
  reason?: string;
}
