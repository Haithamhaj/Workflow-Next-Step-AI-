/**
 * Pass 2 Phase 1 — persistence-layer entity aliases and repository interfaces.
 *
 * All 15 Pass 2 contract entities are re-exported from @workflow/contracts and
 * each has a thin repository interface here. Backends (in-memory, sqlite, and
 * later Supabase) implement these interfaces without leaking SQL or
 * vendor-specific types upward.
 */

import type {
  CaseConfiguration,
  CaseState,
  SourceRegistration,
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

// ---------------------------------------------------------------------------
// Existing (Pass 1) entities
// ---------------------------------------------------------------------------

export interface Case {
  caseId: string;
  domain: string;
  mainDepartment: string;
  subDepartment?: string;
  useCaseLabel: string;
  companyProfileRef: string;
  operatorNotes?: string;
  createdAt: string;
  state: CaseState;
}

export interface Source extends SourceRegistration {
  registeredAt: string;
}

export interface CaseRepository {
  save(c: Case): void;
  findById(caseId: string): Case | null;
  findAll(): Case[];
}

export interface SourceRepository {
  save(s: Source): void;
  findByCaseId(caseId: string): Source[];
  findAll(): Source[];
}

// ---------------------------------------------------------------------------
// Pass 2 Phase 1 repository interfaces
// ---------------------------------------------------------------------------

export interface IntakeSourceRepository {
  save(r: IntakeSourceRecord): void;
  findById(intakeSourceId: string): IntakeSourceRecord | null;
  findByBatchId(intakeBatchId: string): IntakeSourceRecord[];
  findByCaseId(caseId: string): IntakeSourceRecord[];
}

export interface IntakeBatchRepository {
  save(r: IntakeBatchRecord): void;
  findById(intakeBatchId: string): IntakeBatchRecord | null;
  findByCaseId(caseId: string): IntakeBatchRecord[];
}

export interface IntakeBatchSummaryItemRepository {
  save(r: IntakeBatchSummaryItem): void;
  findByBatchId(intakeBatchId: string): IntakeBatchSummaryItem[];
}

export interface AIIntakeSuggestionRepository {
  save(r: AIIntakeSuggestion): void;
  findById(suggestionId: string): AIIntakeSuggestion | null;
  findByIntakeSourceId(intakeSourceId: string): AIIntakeSuggestion[];
}

export interface AdminIntakeDecisionRepository {
  save(r: AdminIntakeDecision): void;
  findById(decisionId: string): AdminIntakeDecision | null;
  findByIntakeSourceId(intakeSourceId: string): AdminIntakeDecision[];
}

export interface StructuredContextRepository {
  save(r: StructuredContextRecord): void;
  findById(structuredContextId: string): StructuredContextRecord | null;
  findByCaseId(caseId: string): StructuredContextRecord[];
}

export interface StructuredContextFieldEvidenceRepository {
  save(r: StructuredContextFieldEvidence): void;
  findByStructuredContextId(
    structuredContextId: string,
  ): StructuredContextFieldEvidence[];
}

export interface ProviderExtractionJobRepository {
  save(r: ProviderExtractionJob): void;
  findById(extractionJobId: string): ProviderExtractionJob | null;
  findByIntakeSourceId(intakeSourceId: string): ProviderExtractionJob[];
  findByCaseId(caseId: string): ProviderExtractionJob[];
}

export interface ContentChunkRepository {
  save(r: ContentChunkRecord): void;
  findById(chunkId: string): ContentChunkRecord | null;
  findByIntakeSourceId(intakeSourceId: string): ContentChunkRecord[];
  findByCaseId(caseId: string): ContentChunkRecord[];
}

export interface EmbeddingJobRepository {
  save(r: EmbeddingJobRecord): void;
  findById(embeddingJobId: string): EmbeddingJobRecord | null;
  findByChunkId(chunkId: string): EmbeddingJobRecord[];
  findByCaseId(caseId: string): EmbeddingJobRecord[];
}

export interface WebsiteCrawlPlanRepository {
  save(r: WebsiteCrawlPlan): void;
  findById(crawlPlanId: string): WebsiteCrawlPlan | null;
  findByCaseId(caseId: string): WebsiteCrawlPlan[];
}

export interface WebsiteCrawlCandidatePageRepository {
  save(r: WebsiteCrawlCandidatePage): void;
  findById(candidatePageId: string): WebsiteCrawlCandidatePage | null;
  findByCrawlPlanId(crawlPlanId: string): WebsiteCrawlCandidatePage[];
}

export interface WebsiteCrawlApprovalRepository {
  save(r: WebsiteCrawlApproval): void;
  findById(approvalId: string): WebsiteCrawlApproval | null;
  findByCrawlPlanId(crawlPlanId: string): WebsiteCrawlApproval[];
  findByCandidatePageId(candidatePageId: string): WebsiteCrawlApproval[];
}

export interface WebsiteSiteSummaryRepository {
  save(r: WebsiteSiteSummary): void;
  findById(siteSummaryId: string): WebsiteSiteSummary | null;
  findByCrawlPlanId(crawlPlanId: string): WebsiteSiteSummary[];
  findByCaseId(caseId: string): WebsiteSiteSummary[];
}

export interface FinalPreHierarchyReviewRepository {
  save(r: FinalPreHierarchyReviewRecord): void;
  findById(reviewId: string): FinalPreHierarchyReviewRecord | null;
  findByCaseId(caseId: string): FinalPreHierarchyReviewRecord[];
}

// ---------------------------------------------------------------------------
// Composite store shape — both in-memory and sqlite factories return this
// ---------------------------------------------------------------------------

export interface Store {
  cases: CaseRepository;
  sources: SourceRepository;
  intakeSources: IntakeSourceRepository;
  intakeBatches: IntakeBatchRepository;
  intakeBatchSummaryItems: IntakeBatchSummaryItemRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  adminIntakeDecisions: AdminIntakeDecisionRepository;
  structuredContexts: StructuredContextRepository;
  structuredContextFieldEvidence: StructuredContextFieldEvidenceRepository;
  providerExtractionJobs: ProviderExtractionJobRepository;
  contentChunks: ContentChunkRepository;
  embeddingJobs: EmbeddingJobRepository;
  websiteCrawlPlans: WebsiteCrawlPlanRepository;
  websiteCrawlCandidatePages: WebsiteCrawlCandidatePageRepository;
  websiteCrawlApprovals: WebsiteCrawlApprovalRepository;
  websiteSiteSummaries: WebsiteSiteSummaryRepository;
  finalPreHierarchyReviews: FinalPreHierarchyReviewRepository;
}

// Back-compat alias for Pass 1 consumers
export type InMemoryStore = Store;

// Re-export CaseConfiguration so core-case doesn't double-import contracts
export type { CaseConfiguration };
