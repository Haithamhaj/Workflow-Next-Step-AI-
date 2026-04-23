/**
 * Pass 2 Phase 1 — SQLite repository implementations.
 *
 * Every repo uses prepared statements against column names that mirror the
 * contract field names 1:1. Optional columns are written as NULL and read
 * back as undefined (stripNulls) so round-trips match the contract shape.
 *
 * JSON-shaped columns (string[] like seedUrls and evidenceRefs) are encoded
 * with JSON.stringify at write time and decoded at the repo boundary so
 * callers never see the encoding.
 */

import type {
  IntakeSourceRecord,
  IntakeBatchRecord,
  IntakeBatchSummaryItem,
  AIIntakeSuggestion,
  AdminIntakeDecision,
  StructuredContextRecord,
  StructuredContextFieldEvidence,
  ProviderExtractionJob,
  ContentChunkRecord,
  EmbeddingJobRecord,
  WebsiteCrawlPlan,
  WebsiteCrawlCandidatePage,
  WebsiteCrawlApproval,
  WebsiteSiteSummary,
  FinalPreHierarchyReviewRecord,
} from "@workflow/contracts";

import type {
  Case,
  Source,
  Store,
  CaseRepository,
  SourceRepository,
  IntakeSourceRepository,
  IntakeBatchRepository,
  IntakeBatchSummaryItemRepository,
  AIIntakeSuggestionRepository,
  AdminIntakeDecisionRepository,
  StructuredContextRepository,
  StructuredContextFieldEvidenceRepository,
  ProviderExtractionJobRepository,
  ContentChunkRepository,
  EmbeddingJobRepository,
  WebsiteCrawlPlanRepository,
  WebsiteCrawlCandidatePageRepository,
  WebsiteCrawlApprovalRepository,
  WebsiteSiteSummaryRepository,
  FinalPreHierarchyReviewRepository,
} from "../entities.js";
import { openDatabase, type SqliteDatabase } from "./database.js";

function stripNulls<T>(row: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
    if (v !== null) out[k] = v;
  }
  return out as T;
}

function nullable<T>(v: T | undefined): T | null {
  return v === undefined ? null : v;
}

// ---------------------------------------------------------------------------
// cases
// ---------------------------------------------------------------------------

class SqliteCaseRepository implements CaseRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(c: Case): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO cases
          (caseId, domain, mainDepartment, subDepartment, useCaseLabel,
           companyProfileRef, operatorNotes, createdAt, state)
         VALUES (@caseId, @domain, @mainDepartment, @subDepartment, @useCaseLabel,
                 @companyProfileRef, @operatorNotes, @createdAt, @state)`,
      )
      .run({
        caseId: c.caseId,
        domain: c.domain,
        mainDepartment: c.mainDepartment,
        subDepartment: nullable(c.subDepartment),
        useCaseLabel: c.useCaseLabel,
        companyProfileRef: c.companyProfileRef,
        operatorNotes: nullable(c.operatorNotes),
        createdAt: c.createdAt,
        state: c.state,
      });
  }

  findById(caseId: string): Case | null {
    const row = this.db
      .prepare("SELECT * FROM cases WHERE caseId = ?")
      .get(caseId) as Case | undefined;
    return row ? (stripNulls(row) as Case) : null;
  }

  findAll(): Case[] {
    const rows = this.db.prepare("SELECT * FROM cases").all() as Case[];
    return rows.map((r) => stripNulls(r) as Case);
  }
}

// ---------------------------------------------------------------------------
// sources
// ---------------------------------------------------------------------------

class SqliteSourceRepository implements SourceRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(s: Source): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO sources
          (sourceId, caseId, uploaderId, uploadedAt, displayName, intakeType,
           timingTag, authority, processingStatus, notes, registeredAt)
         VALUES (@sourceId, @caseId, @uploaderId, @uploadedAt, @displayName, @intakeType,
                 @timingTag, @authority, @processingStatus, @notes, @registeredAt)`,
      )
      .run({
        sourceId: s.sourceId,
        caseId: s.caseId,
        uploaderId: s.uploaderId,
        uploadedAt: s.uploadedAt,
        displayName: nullable(s.displayName),
        intakeType: s.intakeType,
        timingTag: s.timingTag,
        authority: s.authority,
        processingStatus: s.processingStatus,
        notes: nullable(s.notes),
        registeredAt: s.registeredAt,
      });
  }

  findByCaseId(caseId: string): Source[] {
    const rows = this.db
      .prepare("SELECT * FROM sources WHERE caseId = ?")
      .all(caseId) as Source[];
    return rows.map((r) => stripNulls(r) as Source);
  }

  findAll(): Source[] {
    const rows = this.db.prepare("SELECT * FROM sources").all() as Source[];
    return rows.map((r) => stripNulls(r) as Source);
  }
}

// ---------------------------------------------------------------------------
// intake_sources
// ---------------------------------------------------------------------------

class SqliteIntakeSourceRepository implements IntakeSourceRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(r: IntakeSourceRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO intake_sources
          (intakeSourceId, intakeBatchId, caseId, submittedBy, submittedAt,
           mode, displayName, sourceUrl, mimeType, sizeBytes, storageRef,
           contentRef, intakeStatus, notes)
         VALUES (@intakeSourceId, @intakeBatchId, @caseId, @submittedBy, @submittedAt,
                 @mode, @displayName, @sourceUrl, @mimeType, @sizeBytes, @storageRef,
                 @contentRef, @intakeStatus, @notes)`,
      )
      .run({
        intakeSourceId: r.intakeSourceId,
        intakeBatchId: r.intakeBatchId,
        caseId: r.caseId,
        submittedBy: r.submittedBy,
        submittedAt: r.submittedAt,
        mode: r.mode,
        displayName: nullable(r.displayName),
        sourceUrl: nullable(r.sourceUrl),
        mimeType: nullable(r.mimeType),
        sizeBytes: nullable(r.sizeBytes),
        storageRef: nullable(r.storageRef),
        contentRef: nullable(r.contentRef),
        intakeStatus: r.intakeStatus,
        notes: nullable(r.notes),
      });
  }

  findById(id: string): IntakeSourceRecord | null {
    const row = this.db
      .prepare("SELECT * FROM intake_sources WHERE intakeSourceId = ?")
      .get(id) as IntakeSourceRecord | undefined;
    return row ? (stripNulls(row) as IntakeSourceRecord) : null;
  }

  findByBatchId(batchId: string): IntakeSourceRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM intake_sources WHERE intakeBatchId = ?")
      .all(batchId) as IntakeSourceRecord[];
    return rows.map((r) => stripNulls(r) as IntakeSourceRecord);
  }

  findByCaseId(caseId: string): IntakeSourceRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM intake_sources WHERE caseId = ?")
      .all(caseId) as IntakeSourceRecord[];
    return rows.map((r) => stripNulls(r) as IntakeSourceRecord);
  }
}

// ---------------------------------------------------------------------------
// intake_batches
// ---------------------------------------------------------------------------

class SqliteIntakeBatchRepository implements IntakeBatchRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(r: IntakeBatchRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO intake_batches
          (intakeBatchId, caseId, createdBy, createdAt, batchStatus, label, notes)
         VALUES (@intakeBatchId, @caseId, @createdBy, @createdAt, @batchStatus, @label, @notes)`,
      )
      .run({
        intakeBatchId: r.intakeBatchId,
        caseId: r.caseId,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        batchStatus: r.batchStatus,
        label: nullable(r.label),
        notes: nullable(r.notes),
      });
  }

  findById(id: string): IntakeBatchRecord | null {
    const row = this.db
      .prepare("SELECT * FROM intake_batches WHERE intakeBatchId = ?")
      .get(id) as IntakeBatchRecord | undefined;
    return row ? (stripNulls(row) as IntakeBatchRecord) : null;
  }

  findByCaseId(caseId: string): IntakeBatchRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM intake_batches WHERE caseId = ?")
      .all(caseId) as IntakeBatchRecord[];
    return rows.map((r) => stripNulls(r) as IntakeBatchRecord);
  }
}

// ---------------------------------------------------------------------------
// intake_batch_summary_items
// ---------------------------------------------------------------------------

class SqliteIntakeBatchSummaryItemRepository
  implements IntakeBatchSummaryItemRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: IntakeBatchSummaryItem): void {
    this.db
      .prepare(
        `INSERT INTO intake_batch_summary_items
          (intakeBatchId, intakeSourceId, suggestedRole, suggestedAuthority,
           summary, confidenceScore, adminDisposition)
         VALUES (@intakeBatchId, @intakeSourceId, @suggestedRole, @suggestedAuthority,
                 @summary, @confidenceScore, @adminDisposition)`,
      )
      .run({
        intakeBatchId: r.intakeBatchId,
        intakeSourceId: r.intakeSourceId,
        suggestedRole: nullable(r.suggestedRole),
        suggestedAuthority: nullable(r.suggestedAuthority),
        summary: nullable(r.summary),
        confidenceScore: nullable(r.confidenceScore),
        adminDisposition: r.adminDisposition,
      });
  }

  findByBatchId(batchId: string): IntakeBatchSummaryItem[] {
    const rows = this.db
      .prepare(
        `SELECT intakeBatchId, intakeSourceId, suggestedRole, suggestedAuthority,
                summary, confidenceScore, adminDisposition
         FROM intake_batch_summary_items WHERE intakeBatchId = ?`,
      )
      .all(batchId) as IntakeBatchSummaryItem[];
    return rows.map((r) => stripNulls(r) as IntakeBatchSummaryItem);
  }
}

// ---------------------------------------------------------------------------
// ai_intake_suggestions
// ---------------------------------------------------------------------------

class SqliteAIIntakeSuggestionRepository
  implements AIIntakeSuggestionRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: AIIntakeSuggestion): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO ai_intake_suggestions
          (suggestionId, intakeSourceId, caseId, provider, model, promptVersion,
           generatedAt, suggestedIntakeType, suggestedAuthority, suggestedTimingTag,
           suggestedRole, rationale, confidenceScore, rawJsonRef)
         VALUES (@suggestionId, @intakeSourceId, @caseId, @provider, @model, @promptVersion,
                 @generatedAt, @suggestedIntakeType, @suggestedAuthority, @suggestedTimingTag,
                 @suggestedRole, @rationale, @confidenceScore, @rawJsonRef)`,
      )
      .run({
        suggestionId: r.suggestionId,
        intakeSourceId: r.intakeSourceId,
        caseId: r.caseId,
        provider: r.provider,
        model: r.model,
        promptVersion: r.promptVersion,
        generatedAt: r.generatedAt,
        suggestedIntakeType: nullable(r.suggestedIntakeType),
        suggestedAuthority: nullable(r.suggestedAuthority),
        suggestedTimingTag: nullable(r.suggestedTimingTag),
        suggestedRole: nullable(r.suggestedRole),
        rationale: nullable(r.rationale),
        confidenceScore: nullable(r.confidenceScore),
        rawJsonRef: nullable(r.rawJsonRef),
      });
  }

  findById(id: string): AIIntakeSuggestion | null {
    const row = this.db
      .prepare("SELECT * FROM ai_intake_suggestions WHERE suggestionId = ?")
      .get(id) as AIIntakeSuggestion | undefined;
    return row ? (stripNulls(row) as AIIntakeSuggestion) : null;
  }

  findByIntakeSourceId(intakeSourceId: string): AIIntakeSuggestion[] {
    const rows = this.db
      .prepare("SELECT * FROM ai_intake_suggestions WHERE intakeSourceId = ?")
      .all(intakeSourceId) as AIIntakeSuggestion[];
    return rows.map((r) => stripNulls(r) as AIIntakeSuggestion);
  }
}

// ---------------------------------------------------------------------------
// admin_intake_decisions
// ---------------------------------------------------------------------------

class SqliteAdminIntakeDecisionRepository
  implements AdminIntakeDecisionRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: AdminIntakeDecision): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO admin_intake_decisions
          (decisionId, intakeSourceId, caseId, decidedBy, decidedAt, decision,
           finalIntakeType, finalAuthority, finalTimingTag, reason)
         VALUES (@decisionId, @intakeSourceId, @caseId, @decidedBy, @decidedAt, @decision,
                 @finalIntakeType, @finalAuthority, @finalTimingTag, @reason)`,
      )
      .run({
        decisionId: r.decisionId,
        intakeSourceId: r.intakeSourceId,
        caseId: r.caseId,
        decidedBy: r.decidedBy,
        decidedAt: r.decidedAt,
        decision: r.decision,
        finalIntakeType: nullable(r.finalIntakeType),
        finalAuthority: nullable(r.finalAuthority),
        finalTimingTag: nullable(r.finalTimingTag),
        reason: nullable(r.reason),
      });
  }

  findById(id: string): AdminIntakeDecision | null {
    const row = this.db
      .prepare("SELECT * FROM admin_intake_decisions WHERE decisionId = ?")
      .get(id) as AdminIntakeDecision | undefined;
    return row ? (stripNulls(row) as AdminIntakeDecision) : null;
  }

  findByIntakeSourceId(intakeSourceId: string): AdminIntakeDecision[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM admin_intake_decisions WHERE intakeSourceId = ?",
      )
      .all(intakeSourceId) as AdminIntakeDecision[];
    return rows.map((r) => stripNulls(r) as AdminIntakeDecision);
  }
}

// ---------------------------------------------------------------------------
// structured_contexts
// ---------------------------------------------------------------------------

class SqliteStructuredContextRepository implements StructuredContextRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(r: StructuredContextRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO structured_contexts
          (structuredContextId, caseId, version, status, fieldCount,
           createdAt, updatedAt, notes)
         VALUES (@structuredContextId, @caseId, @version, @status, @fieldCount,
                 @createdAt, @updatedAt, @notes)`,
      )
      .run({
        structuredContextId: r.structuredContextId,
        caseId: r.caseId,
        version: r.version,
        status: r.status,
        fieldCount: r.fieldCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        notes: nullable(r.notes),
      });
  }

  findById(id: string): StructuredContextRecord | null {
    const row = this.db
      .prepare(
        "SELECT * FROM structured_contexts WHERE structuredContextId = ?",
      )
      .get(id) as StructuredContextRecord | undefined;
    return row ? (stripNulls(row) as StructuredContextRecord) : null;
  }

  findByCaseId(caseId: string): StructuredContextRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM structured_contexts WHERE caseId = ?")
      .all(caseId) as StructuredContextRecord[];
    return rows.map((r) => stripNulls(r) as StructuredContextRecord);
  }
}

// ---------------------------------------------------------------------------
// structured_context_field_evidence
// ---------------------------------------------------------------------------

interface StructuredContextFieldEvidenceRow {
  evidenceId: string;
  structuredContextId: string;
  caseId: string;
  fieldKey: string;
  fieldValue: string | null;
  evidenceRefs: string;
  confidence: number | null;
  extractedAt: string;
  sourceProvider: string | null;
}

class SqliteStructuredContextFieldEvidenceRepository
  implements StructuredContextFieldEvidenceRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: StructuredContextFieldEvidence): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO structured_context_field_evidence
          (evidenceId, structuredContextId, caseId, fieldKey, fieldValue,
           evidenceRefs, confidence, extractedAt, sourceProvider)
         VALUES (@evidenceId, @structuredContextId, @caseId, @fieldKey, @fieldValue,
                 @evidenceRefs, @confidence, @extractedAt, @sourceProvider)`,
      )
      .run({
        evidenceId: r.evidenceId,
        structuredContextId: r.structuredContextId,
        caseId: r.caseId,
        fieldKey: r.fieldKey,
        fieldValue: nullable(r.fieldValue),
        evidenceRefs: JSON.stringify(r.evidenceRefs),
        confidence: nullable(r.confidence),
        extractedAt: r.extractedAt,
        sourceProvider: nullable(r.sourceProvider),
      });
  }

  findByStructuredContextId(id: string): StructuredContextFieldEvidence[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM structured_context_field_evidence WHERE structuredContextId = ?",
      )
      .all(id) as StructuredContextFieldEvidenceRow[];
    return rows.map((row) => {
      const decoded = {
        ...row,
        evidenceRefs: JSON.parse(row.evidenceRefs) as string[],
      };
      return stripNulls(decoded) as StructuredContextFieldEvidence;
    });
  }
}

// ---------------------------------------------------------------------------
// provider_extraction_jobs
// ---------------------------------------------------------------------------

class SqliteProviderExtractionJobRepository
  implements ProviderExtractionJobRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: ProviderExtractionJob): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO provider_extraction_jobs
          (extractionJobId, intakeSourceId, caseId, provider, model, jobType,
           status, queuedAt, startedAt, completedAt, inputRef, outputRef, errorMessage)
         VALUES (@extractionJobId, @intakeSourceId, @caseId, @provider, @model, @jobType,
                 @status, @queuedAt, @startedAt, @completedAt, @inputRef, @outputRef, @errorMessage)`,
      )
      .run({
        extractionJobId: r.extractionJobId,
        intakeSourceId: r.intakeSourceId,
        caseId: r.caseId,
        provider: r.provider,
        model: nullable(r.model),
        jobType: r.jobType,
        status: r.status,
        queuedAt: r.queuedAt,
        startedAt: nullable(r.startedAt),
        completedAt: nullable(r.completedAt),
        inputRef: nullable(r.inputRef),
        outputRef: nullable(r.outputRef),
        errorMessage: nullable(r.errorMessage),
      });
  }

  findById(id: string): ProviderExtractionJob | null {
    const row = this.db
      .prepare(
        "SELECT * FROM provider_extraction_jobs WHERE extractionJobId = ?",
      )
      .get(id) as ProviderExtractionJob | undefined;
    return row ? (stripNulls(row) as ProviderExtractionJob) : null;
  }

  findByIntakeSourceId(intakeSourceId: string): ProviderExtractionJob[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM provider_extraction_jobs WHERE intakeSourceId = ?",
      )
      .all(intakeSourceId) as ProviderExtractionJob[];
    return rows.map((r) => stripNulls(r) as ProviderExtractionJob);
  }

  findByCaseId(caseId: string): ProviderExtractionJob[] {
    const rows = this.db
      .prepare("SELECT * FROM provider_extraction_jobs WHERE caseId = ?")
      .all(caseId) as ProviderExtractionJob[];
    return rows.map((r) => stripNulls(r) as ProviderExtractionJob);
  }
}

// ---------------------------------------------------------------------------
// content_chunks
// ---------------------------------------------------------------------------

class SqliteContentChunkRepository implements ContentChunkRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(r: ContentChunkRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO content_chunks
          (chunkId, intakeSourceId, caseId, ordinal, contentRef,
           tokenCount, charCount, sha256, createdAt)
         VALUES (@chunkId, @intakeSourceId, @caseId, @ordinal, @contentRef,
                 @tokenCount, @charCount, @sha256, @createdAt)`,
      )
      .run({
        chunkId: r.chunkId,
        intakeSourceId: r.intakeSourceId,
        caseId: r.caseId,
        ordinal: r.ordinal,
        contentRef: r.contentRef,
        tokenCount: nullable(r.tokenCount),
        charCount: nullable(r.charCount),
        sha256: nullable(r.sha256),
        createdAt: r.createdAt,
      });
  }

  findById(id: string): ContentChunkRecord | null {
    const row = this.db
      .prepare("SELECT * FROM content_chunks WHERE chunkId = ?")
      .get(id) as ContentChunkRecord | undefined;
    return row ? (stripNulls(row) as ContentChunkRecord) : null;
  }

  findByIntakeSourceId(intakeSourceId: string): ContentChunkRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM content_chunks WHERE intakeSourceId = ?")
      .all(intakeSourceId) as ContentChunkRecord[];
    return rows.map((r) => stripNulls(r) as ContentChunkRecord);
  }

  findByCaseId(caseId: string): ContentChunkRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM content_chunks WHERE caseId = ?")
      .all(caseId) as ContentChunkRecord[];
    return rows.map((r) => stripNulls(r) as ContentChunkRecord);
  }
}

// ---------------------------------------------------------------------------
// embedding_jobs
// ---------------------------------------------------------------------------

class SqliteEmbeddingJobRepository implements EmbeddingJobRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(r: EmbeddingJobRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO embedding_jobs
          (embeddingJobId, chunkId, caseId, provider, model, status,
           dimension, vectorStoreRef, vectorId, queuedAt, completedAt, errorMessage)
         VALUES (@embeddingJobId, @chunkId, @caseId, @provider, @model, @status,
                 @dimension, @vectorStoreRef, @vectorId, @queuedAt, @completedAt, @errorMessage)`,
      )
      .run({
        embeddingJobId: r.embeddingJobId,
        chunkId: r.chunkId,
        caseId: r.caseId,
        provider: r.provider,
        model: r.model,
        status: r.status,
        dimension: nullable(r.dimension),
        vectorStoreRef: nullable(r.vectorStoreRef),
        vectorId: nullable(r.vectorId),
        queuedAt: r.queuedAt,
        completedAt: nullable(r.completedAt),
        errorMessage: nullable(r.errorMessage),
      });
  }

  findById(id: string): EmbeddingJobRecord | null {
    const row = this.db
      .prepare("SELECT * FROM embedding_jobs WHERE embeddingJobId = ?")
      .get(id) as EmbeddingJobRecord | undefined;
    return row ? (stripNulls(row) as EmbeddingJobRecord) : null;
  }

  findByChunkId(chunkId: string): EmbeddingJobRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM embedding_jobs WHERE chunkId = ?")
      .all(chunkId) as EmbeddingJobRecord[];
    return rows.map((r) => stripNulls(r) as EmbeddingJobRecord);
  }

  findByCaseId(caseId: string): EmbeddingJobRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM embedding_jobs WHERE caseId = ?")
      .all(caseId) as EmbeddingJobRecord[];
    return rows.map((r) => stripNulls(r) as EmbeddingJobRecord);
  }
}

// ---------------------------------------------------------------------------
// website_crawl_plans
// ---------------------------------------------------------------------------

interface WebsiteCrawlPlanRow {
  crawlPlanId: string;
  caseId: string;
  intakeBatchId: string | null;
  seedUrls: string;
  maxPages: number;
  maxDepth: number;
  plannedBy: string;
  plannedAt: string;
  status: WebsiteCrawlPlan["status"];
  notes: string | null;
}

function decodeCrawlPlan(row: WebsiteCrawlPlanRow): WebsiteCrawlPlan {
  const decoded = {
    ...row,
    seedUrls: JSON.parse(row.seedUrls) as string[],
  };
  return stripNulls(decoded) as WebsiteCrawlPlan;
}

class SqliteWebsiteCrawlPlanRepository implements WebsiteCrawlPlanRepository {
  constructor(private readonly db: SqliteDatabase) {}

  save(r: WebsiteCrawlPlan): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO website_crawl_plans
          (crawlPlanId, caseId, intakeBatchId, seedUrls, maxPages, maxDepth,
           plannedBy, plannedAt, status, notes)
         VALUES (@crawlPlanId, @caseId, @intakeBatchId, @seedUrls, @maxPages, @maxDepth,
                 @plannedBy, @plannedAt, @status, @notes)`,
      )
      .run({
        crawlPlanId: r.crawlPlanId,
        caseId: r.caseId,
        intakeBatchId: nullable(r.intakeBatchId),
        seedUrls: JSON.stringify(r.seedUrls),
        maxPages: r.maxPages,
        maxDepth: r.maxDepth,
        plannedBy: r.plannedBy,
        plannedAt: r.plannedAt,
        status: r.status,
        notes: nullable(r.notes),
      });
  }

  findById(id: string): WebsiteCrawlPlan | null {
    const row = this.db
      .prepare("SELECT * FROM website_crawl_plans WHERE crawlPlanId = ?")
      .get(id) as WebsiteCrawlPlanRow | undefined;
    return row ? decodeCrawlPlan(row) : null;
  }

  findByCaseId(caseId: string): WebsiteCrawlPlan[] {
    const rows = this.db
      .prepare("SELECT * FROM website_crawl_plans WHERE caseId = ?")
      .all(caseId) as WebsiteCrawlPlanRow[];
    return rows.map(decodeCrawlPlan);
  }
}

// ---------------------------------------------------------------------------
// website_crawl_candidate_pages
// ---------------------------------------------------------------------------

class SqliteWebsiteCrawlCandidatePageRepository
  implements WebsiteCrawlCandidatePageRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: WebsiteCrawlCandidatePage): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO website_crawl_candidate_pages
          (candidatePageId, crawlPlanId, url, title, depth, discoveredAt, previewRef, status)
         VALUES (@candidatePageId, @crawlPlanId, @url, @title, @depth, @discoveredAt, @previewRef, @status)`,
      )
      .run({
        candidatePageId: r.candidatePageId,
        crawlPlanId: r.crawlPlanId,
        url: r.url,
        title: nullable(r.title),
        depth: r.depth,
        discoveredAt: r.discoveredAt,
        previewRef: nullable(r.previewRef),
        status: r.status,
      });
  }

  findById(id: string): WebsiteCrawlCandidatePage | null {
    const row = this.db
      .prepare(
        "SELECT * FROM website_crawl_candidate_pages WHERE candidatePageId = ?",
      )
      .get(id) as WebsiteCrawlCandidatePage | undefined;
    return row ? (stripNulls(row) as WebsiteCrawlCandidatePage) : null;
  }

  findByCrawlPlanId(planId: string): WebsiteCrawlCandidatePage[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM website_crawl_candidate_pages WHERE crawlPlanId = ?",
      )
      .all(planId) as WebsiteCrawlCandidatePage[];
    return rows.map((r) => stripNulls(r) as WebsiteCrawlCandidatePage);
  }
}

// ---------------------------------------------------------------------------
// website_crawl_approvals
// ---------------------------------------------------------------------------

class SqliteWebsiteCrawlApprovalRepository
  implements WebsiteCrawlApprovalRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: WebsiteCrawlApproval): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO website_crawl_approvals
          (approvalId, crawlPlanId, candidatePageId, decidedBy, decidedAt, decision, reason)
         VALUES (@approvalId, @crawlPlanId, @candidatePageId, @decidedBy, @decidedAt, @decision, @reason)`,
      )
      .run({
        approvalId: r.approvalId,
        crawlPlanId: r.crawlPlanId,
        candidatePageId: r.candidatePageId,
        decidedBy: r.decidedBy,
        decidedAt: r.decidedAt,
        decision: r.decision,
        reason: nullable(r.reason),
      });
  }

  findById(id: string): WebsiteCrawlApproval | null {
    const row = this.db
      .prepare("SELECT * FROM website_crawl_approvals WHERE approvalId = ?")
      .get(id) as WebsiteCrawlApproval | undefined;
    return row ? (stripNulls(row) as WebsiteCrawlApproval) : null;
  }

  findByCrawlPlanId(planId: string): WebsiteCrawlApproval[] {
    const rows = this.db
      .prepare("SELECT * FROM website_crawl_approvals WHERE crawlPlanId = ?")
      .all(planId) as WebsiteCrawlApproval[];
    return rows.map((r) => stripNulls(r) as WebsiteCrawlApproval);
  }

  findByCandidatePageId(pageId: string): WebsiteCrawlApproval[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM website_crawl_approvals WHERE candidatePageId = ?",
      )
      .all(pageId) as WebsiteCrawlApproval[];
    return rows.map((r) => stripNulls(r) as WebsiteCrawlApproval);
  }
}

// ---------------------------------------------------------------------------
// website_site_summaries
// ---------------------------------------------------------------------------

class SqliteWebsiteSiteSummaryRepository
  implements WebsiteSiteSummaryRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: WebsiteSiteSummary): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO website_site_summaries
          (siteSummaryId, crawlPlanId, caseId, siteRootUrl,
           totalPagesDiscovered, totalPagesApproved, totalPagesFetched,
           summaryRef, createdAt)
         VALUES (@siteSummaryId, @crawlPlanId, @caseId, @siteRootUrl,
                 @totalPagesDiscovered, @totalPagesApproved, @totalPagesFetched,
                 @summaryRef, @createdAt)`,
      )
      .run({
        siteSummaryId: r.siteSummaryId,
        crawlPlanId: r.crawlPlanId,
        caseId: r.caseId,
        siteRootUrl: r.siteRootUrl,
        totalPagesDiscovered: r.totalPagesDiscovered,
        totalPagesApproved: r.totalPagesApproved,
        totalPagesFetched: r.totalPagesFetched,
        summaryRef: nullable(r.summaryRef),
        createdAt: r.createdAt,
      });
  }

  findById(id: string): WebsiteSiteSummary | null {
    const row = this.db
      .prepare("SELECT * FROM website_site_summaries WHERE siteSummaryId = ?")
      .get(id) as WebsiteSiteSummary | undefined;
    return row ? (stripNulls(row) as WebsiteSiteSummary) : null;
  }

  findByCrawlPlanId(planId: string): WebsiteSiteSummary[] {
    const rows = this.db
      .prepare("SELECT * FROM website_site_summaries WHERE crawlPlanId = ?")
      .all(planId) as WebsiteSiteSummary[];
    return rows.map((r) => stripNulls(r) as WebsiteSiteSummary);
  }

  findByCaseId(caseId: string): WebsiteSiteSummary[] {
    const rows = this.db
      .prepare("SELECT * FROM website_site_summaries WHERE caseId = ?")
      .all(caseId) as WebsiteSiteSummary[];
    return rows.map((r) => stripNulls(r) as WebsiteSiteSummary);
  }
}

// ---------------------------------------------------------------------------
// final_pre_hierarchy_reviews
// ---------------------------------------------------------------------------

class SqliteFinalPreHierarchyReviewRepository
  implements FinalPreHierarchyReviewRepository
{
  constructor(private readonly db: SqliteDatabase) {}

  save(r: FinalPreHierarchyReviewRecord): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO final_pre_hierarchy_reviews
          (reviewId, caseId, structuredContextId, useCaseLabel, status,
           createdBy, createdAt, updatedAt, reviewNotes)
         VALUES (@reviewId, @caseId, @structuredContextId, @useCaseLabel, @status,
                 @createdBy, @createdAt, @updatedAt, @reviewNotes)`,
      )
      .run({
        reviewId: r.reviewId,
        caseId: r.caseId,
        structuredContextId: nullable(r.structuredContextId),
        useCaseLabel: r.useCaseLabel,
        status: r.status,
        createdBy: r.createdBy,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        reviewNotes: nullable(r.reviewNotes),
      });
  }

  findById(id: string): FinalPreHierarchyReviewRecord | null {
    const row = this.db
      .prepare(
        "SELECT * FROM final_pre_hierarchy_reviews WHERE reviewId = ?",
      )
      .get(id) as FinalPreHierarchyReviewRecord | undefined;
    return row ? (stripNulls(row) as FinalPreHierarchyReviewRecord) : null;
  }

  findByCaseId(caseId: string): FinalPreHierarchyReviewRecord[] {
    const rows = this.db
      .prepare("SELECT * FROM final_pre_hierarchy_reviews WHERE caseId = ?")
      .all(caseId) as FinalPreHierarchyReviewRecord[];
    return rows.map((r) => stripNulls(r) as FinalPreHierarchyReviewRecord);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface SqliteStore extends Store {
  readonly db: SqliteDatabase;
  close(): void;
}

export function createSqliteStore(dbPath: string): SqliteStore {
  const db = openDatabase(dbPath);
  return {
    db,
    close: () => db.close(),
    cases: new SqliteCaseRepository(db),
    sources: new SqliteSourceRepository(db),
    intakeSources: new SqliteIntakeSourceRepository(db),
    intakeBatches: new SqliteIntakeBatchRepository(db),
    intakeBatchSummaryItems: new SqliteIntakeBatchSummaryItemRepository(db),
    aiIntakeSuggestions: new SqliteAIIntakeSuggestionRepository(db),
    adminIntakeDecisions: new SqliteAdminIntakeDecisionRepository(db),
    structuredContexts: new SqliteStructuredContextRepository(db),
    structuredContextFieldEvidence:
      new SqliteStructuredContextFieldEvidenceRepository(db),
    providerExtractionJobs: new SqliteProviderExtractionJobRepository(db),
    contentChunks: new SqliteContentChunkRepository(db),
    embeddingJobs: new SqliteEmbeddingJobRepository(db),
    websiteCrawlPlans: new SqliteWebsiteCrawlPlanRepository(db),
    websiteCrawlCandidatePages: new SqliteWebsiteCrawlCandidatePageRepository(
      db,
    ),
    websiteCrawlApprovals: new SqliteWebsiteCrawlApprovalRepository(db),
    websiteSiteSummaries: new SqliteWebsiteSiteSummaryRepository(db),
    finalPreHierarchyReviews: new SqliteFinalPreHierarchyReviewRepository(db),
  };
}
