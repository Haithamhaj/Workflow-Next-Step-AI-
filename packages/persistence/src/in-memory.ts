/**
 * Pass 2 Phase 1 — in-memory repositories.
 *
 * Preserved verbatim for Pass 1 consumers (admin-web store singleton) and
 * extended to cover all Pass 2 entities so tests can run without a DB.
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
} from "./entities.js";

class InMemoryCaseRepository implements CaseRepository {
  private readonly store = new Map<string, Case>();
  save(c: Case): void {
    this.store.set(c.caseId, { ...c });
  }
  findById(caseId: string): Case | null {
    return this.store.get(caseId) ?? null;
  }
  findAll(): Case[] {
    return Array.from(this.store.values());
  }
}

class InMemorySourceRepository implements SourceRepository {
  private readonly store: Source[] = [];
  save(s: Source): void {
    this.store.push({ ...s });
  }
  findByCaseId(caseId: string): Source[] {
    return this.store.filter((s) => s.caseId === caseId);
  }
  findAll(): Source[] {
    return [...this.store];
  }
}

class InMemoryIntakeSourceRepository implements IntakeSourceRepository {
  private readonly byId = new Map<string, IntakeSourceRecord>();
  save(r: IntakeSourceRecord): void {
    this.byId.set(r.intakeSourceId, { ...r });
  }
  findById(id: string): IntakeSourceRecord | null {
    return this.byId.get(id) ?? null;
  }
  findByBatchId(batchId: string): IntakeSourceRecord[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.intakeBatchId === batchId,
    );
  }
  findByCaseId(caseId: string): IntakeSourceRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryIntakeBatchRepository implements IntakeBatchRepository {
  private readonly byId = new Map<string, IntakeBatchRecord>();
  save(r: IntakeBatchRecord): void {
    this.byId.set(r.intakeBatchId, { ...r });
  }
  findById(id: string): IntakeBatchRecord | null {
    return this.byId.get(id) ?? null;
  }
  findByCaseId(caseId: string): IntakeBatchRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryIntakeBatchSummaryItemRepository
  implements IntakeBatchSummaryItemRepository
{
  private readonly items: IntakeBatchSummaryItem[] = [];
  save(r: IntakeBatchSummaryItem): void {
    this.items.push({ ...r });
  }
  findByBatchId(batchId: string): IntakeBatchSummaryItem[] {
    return this.items.filter((r) => r.intakeBatchId === batchId);
  }
}

class InMemoryAIIntakeSuggestionRepository
  implements AIIntakeSuggestionRepository
{
  private readonly byId = new Map<string, AIIntakeSuggestion>();
  save(r: AIIntakeSuggestion): void {
    this.byId.set(r.suggestionId, { ...r });
  }
  findById(id: string): AIIntakeSuggestion | null {
    return this.byId.get(id) ?? null;
  }
  findByIntakeSourceId(intakeSourceId: string): AIIntakeSuggestion[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.intakeSourceId === intakeSourceId,
    );
  }
}

class InMemoryAdminIntakeDecisionRepository
  implements AdminIntakeDecisionRepository
{
  private readonly byId = new Map<string, AdminIntakeDecision>();
  save(r: AdminIntakeDecision): void {
    this.byId.set(r.decisionId, { ...r });
  }
  findById(id: string): AdminIntakeDecision | null {
    return this.byId.get(id) ?? null;
  }
  findByIntakeSourceId(intakeSourceId: string): AdminIntakeDecision[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.intakeSourceId === intakeSourceId,
    );
  }
}

class InMemoryStructuredContextRepository
  implements StructuredContextRepository
{
  private readonly byId = new Map<string, StructuredContextRecord>();
  save(r: StructuredContextRecord): void {
    this.byId.set(r.structuredContextId, { ...r });
  }
  findById(id: string): StructuredContextRecord | null {
    return this.byId.get(id) ?? null;
  }
  findByCaseId(caseId: string): StructuredContextRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryStructuredContextFieldEvidenceRepository
  implements StructuredContextFieldEvidenceRepository
{
  private readonly items: StructuredContextFieldEvidence[] = [];
  save(r: StructuredContextFieldEvidence): void {
    this.items.push({ ...r, evidenceRefs: [...r.evidenceRefs] });
  }
  findByStructuredContextId(id: string): StructuredContextFieldEvidence[] {
    return this.items.filter((r) => r.structuredContextId === id);
  }
}

class InMemoryProviderExtractionJobRepository
  implements ProviderExtractionJobRepository
{
  private readonly byId = new Map<string, ProviderExtractionJob>();
  save(r: ProviderExtractionJob): void {
    this.byId.set(r.extractionJobId, { ...r });
  }
  findById(id: string): ProviderExtractionJob | null {
    return this.byId.get(id) ?? null;
  }
  findByIntakeSourceId(intakeSourceId: string): ProviderExtractionJob[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.intakeSourceId === intakeSourceId,
    );
  }
  findByCaseId(caseId: string): ProviderExtractionJob[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryContentChunkRepository implements ContentChunkRepository {
  private readonly byId = new Map<string, ContentChunkRecord>();
  save(r: ContentChunkRecord): void {
    this.byId.set(r.chunkId, { ...r });
  }
  findById(id: string): ContentChunkRecord | null {
    return this.byId.get(id) ?? null;
  }
  findByIntakeSourceId(intakeSourceId: string): ContentChunkRecord[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.intakeSourceId === intakeSourceId,
    );
  }
  findByCaseId(caseId: string): ContentChunkRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryEmbeddingJobRepository implements EmbeddingJobRepository {
  private readonly byId = new Map<string, EmbeddingJobRecord>();
  save(r: EmbeddingJobRecord): void {
    this.byId.set(r.embeddingJobId, { ...r });
  }
  findById(id: string): EmbeddingJobRecord | null {
    return this.byId.get(id) ?? null;
  }
  findByChunkId(chunkId: string): EmbeddingJobRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.chunkId === chunkId);
  }
  findByCaseId(caseId: string): EmbeddingJobRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryWebsiteCrawlPlanRepository
  implements WebsiteCrawlPlanRepository
{
  private readonly byId = new Map<string, WebsiteCrawlPlan>();
  save(r: WebsiteCrawlPlan): void {
    this.byId.set(r.crawlPlanId, { ...r, seedUrls: [...r.seedUrls] });
  }
  findById(id: string): WebsiteCrawlPlan | null {
    return this.byId.get(id) ?? null;
  }
  findByCaseId(caseId: string): WebsiteCrawlPlan[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryWebsiteCrawlCandidatePageRepository
  implements WebsiteCrawlCandidatePageRepository
{
  private readonly byId = new Map<string, WebsiteCrawlCandidatePage>();
  save(r: WebsiteCrawlCandidatePage): void {
    this.byId.set(r.candidatePageId, { ...r });
  }
  findById(id: string): WebsiteCrawlCandidatePage | null {
    return this.byId.get(id) ?? null;
  }
  findByCrawlPlanId(planId: string): WebsiteCrawlCandidatePage[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.crawlPlanId === planId,
    );
  }
}

class InMemoryWebsiteCrawlApprovalRepository
  implements WebsiteCrawlApprovalRepository
{
  private readonly byId = new Map<string, WebsiteCrawlApproval>();
  save(r: WebsiteCrawlApproval): void {
    this.byId.set(r.approvalId, { ...r });
  }
  findById(id: string): WebsiteCrawlApproval | null {
    return this.byId.get(id) ?? null;
  }
  findByCrawlPlanId(planId: string): WebsiteCrawlApproval[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.crawlPlanId === planId,
    );
  }
  findByCandidatePageId(pageId: string): WebsiteCrawlApproval[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.candidatePageId === pageId,
    );
  }
}

class InMemoryWebsiteSiteSummaryRepository
  implements WebsiteSiteSummaryRepository
{
  private readonly byId = new Map<string, WebsiteSiteSummary>();
  save(r: WebsiteSiteSummary): void {
    this.byId.set(r.siteSummaryId, { ...r });
  }
  findById(id: string): WebsiteSiteSummary | null {
    return this.byId.get(id) ?? null;
  }
  findByCrawlPlanId(planId: string): WebsiteSiteSummary[] {
    return Array.from(this.byId.values()).filter(
      (r) => r.crawlPlanId === planId,
    );
  }
  findByCaseId(caseId: string): WebsiteSiteSummary[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

class InMemoryFinalPreHierarchyReviewRepository
  implements FinalPreHierarchyReviewRepository
{
  private readonly byId = new Map<string, FinalPreHierarchyReviewRecord>();
  save(r: FinalPreHierarchyReviewRecord): void {
    this.byId.set(r.reviewId, { ...r });
  }
  findById(id: string): FinalPreHierarchyReviewRecord | null {
    return this.byId.get(id) ?? null;
  }
  findByCaseId(caseId: string): FinalPreHierarchyReviewRecord[] {
    return Array.from(this.byId.values()).filter((r) => r.caseId === caseId);
  }
}

export function createInMemoryStore(): Store {
  return {
    cases: new InMemoryCaseRepository(),
    sources: new InMemorySourceRepository(),
    intakeSources: new InMemoryIntakeSourceRepository(),
    intakeBatches: new InMemoryIntakeBatchRepository(),
    intakeBatchSummaryItems: new InMemoryIntakeBatchSummaryItemRepository(),
    aiIntakeSuggestions: new InMemoryAIIntakeSuggestionRepository(),
    adminIntakeDecisions: new InMemoryAdminIntakeDecisionRepository(),
    structuredContexts: new InMemoryStructuredContextRepository(),
    structuredContextFieldEvidence:
      new InMemoryStructuredContextFieldEvidenceRepository(),
    providerExtractionJobs: new InMemoryProviderExtractionJobRepository(),
    contentChunks: new InMemoryContentChunkRepository(),
    embeddingJobs: new InMemoryEmbeddingJobRepository(),
    websiteCrawlPlans: new InMemoryWebsiteCrawlPlanRepository(),
    websiteCrawlCandidatePages:
      new InMemoryWebsiteCrawlCandidatePageRepository(),
    websiteCrawlApprovals: new InMemoryWebsiteCrawlApprovalRepository(),
    websiteSiteSummaries: new InMemoryWebsiteSiteSummaryRepository(),
    finalPreHierarchyReviews: new InMemoryFinalPreHierarchyReviewRepository(),
  };
}
