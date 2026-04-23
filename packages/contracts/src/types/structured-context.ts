/**
 * Pass 2 Phase 1 — structured context contracts.
 * Source of truth: src/schemas/structured-context*.schema.json.
 */

export type StructuredContextStatus = "draft" | "active" | "archived";

export interface StructuredContextRecord {
  structuredContextId: string;
  caseId: string;
  version: number;
  status: StructuredContextStatus;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface StructuredContextFieldEvidence {
  evidenceId: string;
  structuredContextId: string;
  caseId: string;
  fieldKey: string;
  fieldValue?: string;
  evidenceRefs: string[];
  confidence?: number;
  extractedAt: string;
  sourceProvider?: string;
}
