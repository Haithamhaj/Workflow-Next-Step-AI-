/**
 * Pass 2 Phase 1 — content chunk contracts.
 * Source of truth: src/schemas/content-chunk.schema.json.
 *
 * Chunking and embedding pipelines are not built in Phase 1. The row shape
 * is defined so later phases can write chunks durably.
 */

export interface ContentChunkRecord {
  chunkId: string;
  intakeSourceId: string;
  caseId: string;
  ordinal: number;
  contentRef: string;
  tokenCount?: number;
  charCount?: number;
  sha256?: string;
  createdAt: string;
}
