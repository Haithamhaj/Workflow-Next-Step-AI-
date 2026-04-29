/**
 * Intake source registration — Pass 2 §5, §6.
 * Registers individual sources within an intake session,
 * tracks status, and builds batch summaries.
 */

import { validateIntakeSource } from "@workflow/contracts";
import type {
  IntakeInputType,
  IntakeBucket,
  IntakeSource as IntakeSourceContract,
  BatchSummaryItem,
} from "@workflow/contracts";
import type {
  StoredIntakeSource,
  IntakeSourceRepository,
  IntakeSessionRepository,
} from "@workflow/persistence";

// ---------------------------------------------------------------------------
// registerIntakeSource
// ---------------------------------------------------------------------------

export function registerIntakeSource(input: {
  sourceId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  inputType: IntakeInputType;
  bucket: IntakeBucket;
  displayName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  websiteUrl?: string;
  noteText?: string;
  noteOrigin?: "typed_text" | "live_stt";
}, sourceRepo: IntakeSourceRepository, sessionRepo: IntakeSessionRepository): StoredIntakeSource {
  // Verify session exists
  const session = sessionRepo.findById(input.sessionId);
  if (!session) throw new Error(`Intake session not found: ${input.sessionId}`);
  if (input.inputType === "video") {
    throw new Error("Video input is outside Pass 2 Phase 2 scope.");
  }

  const now = new Date().toISOString();
  const source: IntakeSourceContract = {
    sourceId: input.sourceId,
    sessionId: input.sessionId,
    companyId: input.companyId,
    caseId: input.caseId,
    sourceVersion: 1,
    lineageStatus: "active",
    inputType: input.inputType,
    bucket: input.bucket,
    status: "uploaded",
    displayName: input.displayName,
    fileName: input.fileName,
    fileSize: input.fileSize,
    mimeType: input.mimeType,
    websiteUrl: input.websiteUrl,
    noteText: input.noteText,
    noteOrigin: input.noteOrigin,
    createdAt: now,
    updatedAt: now,
  };

  const result = validateIntakeSource(source);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid IntakeSource: ${messages}`);
  }

  const stored: StoredIntakeSource = { ...source, createdAt: now, updatedAt: now };
  sourceRepo.save(stored);

  // Advance session status to sources_received if still at intake_started
  if (session.status === "intake_started") {
    session.status = "sources_received";
    session.updatedAt = now;
    sessionRepo.save(session);
  }

  return stored;
}

// ---------------------------------------------------------------------------
// getIntakeSource
// ---------------------------------------------------------------------------

export function getIntakeSource(
  sourceId: string,
  repo: IntakeSourceRepository,
): StoredIntakeSource | null {
  return repo.findById(sourceId);
}

// ---------------------------------------------------------------------------
// listIntakeSourcesBySession
// ---------------------------------------------------------------------------

export function listIntakeSourcesBySession(
  sessionId: string,
  repo: IntakeSourceRepository,
): StoredIntakeSource[] {
  return repo.findBySessionId(sessionId);
}

// ---------------------------------------------------------------------------
// updateIntakeSourceStatus
// ---------------------------------------------------------------------------

export function updateIntakeSourceStatus(
  sourceId: string,
  status: IntakeSourceContract["status"],
  repo: IntakeSourceRepository,
): StoredIntakeSource {
  const existing = repo.findById(sourceId);
  if (!existing) throw new Error(`Intake source not found: ${sourceId}`);

  const updated: StoredIntakeSource = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSource(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid source status update: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// updateIntakeSourceExtractedText
// ---------------------------------------------------------------------------

export function updateIntakeSourceExtractedText(
  sourceId: string,
  extractedText: string,
  status: IntakeSourceContract["status"],
  repo: IntakeSourceRepository,
): StoredIntakeSource {
  const existing = repo.findById(sourceId);
  if (!existing) throw new Error(`Intake source not found: ${sourceId}`);

  const updated: StoredIntakeSource = {
    ...existing,
    extractedText,
    status,
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSource(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid source update: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

export function createNextIntakeSourceVersion(
  sourceId: string,
  updates: Partial<Pick<StoredIntakeSource, "displayName" | "fileName" | "fileSize" | "mimeType" | "websiteUrl" | "noteText" | "noteOrigin" | "extractedText" | "status">>,
  repo: IntakeSourceRepository,
): StoredIntakeSource {
  const existing = repo.findById(sourceId);
  if (!existing) throw new Error(`Intake source not found: ${sourceId}`);

  const updated: StoredIntakeSource = {
    ...existing,
    ...updates,
    sourceVersion: existing.sourceVersion + 1,
    lineageStatus: "active",
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSource(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid source version update: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// buildBatchSummary — §6
// Produces a BatchSummaryItem[] from all sources in a session.
// ---------------------------------------------------------------------------

export function buildBatchSummary(
  sessionId: string,
  repo: IntakeSourceRepository,
): BatchSummaryItem[] {
  const sources = repo.findBySessionId(sessionId);
  return sources.map((s) => ({
    sourceId: s.sourceId,
    displayName: s.displayName ?? s.fileName ?? s.websiteUrl ?? s.sourceId,
    bucket: s.bucket,
    status: s.status,
    aiSuggestedType: s.aiSuggestedType ?? "not_generated_yet",
    aiSuggestedScope: s.aiSuggestedScope ?? "unknown",
    confidence: s.aiConfidence ?? "low",
    reason: s.aiReason ?? "AI suggestion not generated in Phase 2.",
  }));
}
