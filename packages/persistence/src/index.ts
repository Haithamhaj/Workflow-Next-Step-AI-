import type {
  CaseConfiguration,
  CaseState,
  SourceRegistration,
  PromptRegistration,
  SessionCreation,
  SessionState,
  ClarificationQuestion,
  SynthesisRecord,
  EvaluationRecord,
  EvaluationConditions,
  EvaluationOutcome,
  ConditionInterpretations,
  InitialPackageRecord,
  ReviewIssueRecord,
  FinalPackageRecord,
  IntakeSession,
  IntakeSource,
  WebsiteCrawlSession,
  WebsiteCrawlPlan,
  WebsiteCrawlApproval,
  CrawledPageContent,
  WebsiteCrawlSiteSummary,
  ContentChunkRecord,
  ProviderExtractionJob,
  TextArtifactRecord,
  EmbeddingJobRecord,
  AIIntakeSuggestion,
} from "@workflow/contracts";

import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const PERSISTENCE_PACKAGE = "@workflow/persistence" as const;

// ---------------------------------------------------------------------------
// Entity types
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

export interface PromptRecord extends PromptRegistration {
  registeredAt: string;
}

/**
 * Persistent session record. Extends the SessionCreation payload with
 * server-assigned fields: createdAt, currentState (tracked per §28.9),
 * and clarificationQuestions (§17.8 structure).
 */
export interface SessionRecord extends SessionCreation {
  createdAt: string;
  currentState: SessionState;
  clarificationQuestions: ClarificationQuestion[];
}

/** Persistent synthesis record (§19.11 payload + createdAt). */
export interface StoredSynthesisRecord extends SynthesisRecord {
  createdAt: string;
}

/** Persistent evaluation record (§20 payload + createdAt + conditionInterpretations). */
export interface StoredEvaluationRecord extends EvaluationRecord {
  createdAt: string;
  conditionInterpretations: ConditionInterpretations;
}

/**
 * Snapshot of the LLM-generated interpretation that the admin reviewed.
 * Stored at preview time; referenced by evaluationSnapshotId on final submit.
 * The basis fields allow the server to verify the submitted evaluation
 * matches exactly what the admin saw.
 */
export interface InterpretationSnapshot {
  snapshotId: string;
  conditionInterpretations: ConditionInterpretations;
  basis: {
    conditions: EvaluationConditions;
    outcome: EvaluationOutcome;
    synthesisContext?: string;
  };
  createdAt: string;
}

export interface InterpretationSnapshotRepository {
  save(snapshot: InterpretationSnapshot): void;
  findById(snapshotId: string): InterpretationSnapshot | null;
}

/** Persistent initial-package record (§21 payload + createdAt). */
export interface StoredInitialPackageRecord extends InitialPackageRecord {
  createdAt: string;
}

/** Persistent review-issue record (Pass 7 payload + timestamps). */
export interface StoredReviewIssueRecord extends ReviewIssueRecord {
  createdAt: string;
  updatedAt: string;
}

/** Persistent final-package record (Pass 8 payload + timestamps). */
export interface StoredFinalPackageRecord extends FinalPackageRecord {
  createdAt: string;
  updatedAt: string;
}

/** Persistent intake-session record (Pass 2 §4). */
export interface StoredIntakeSession extends IntakeSession {
  createdAt: string;
  updatedAt: string;
}

/** Persistent intake-source record (Pass 2 §5). */
export interface StoredIntakeSource extends IntakeSource {
  createdAt: string;
  updatedAt: string;
}

/** Persistent website-crawl-session record (Pass 2 §10). */
export interface StoredWebsiteCrawlSession extends WebsiteCrawlSession {
  createdAt: string;
  updatedAt: string;
}

export interface StoredWebsiteCrawlPlan extends WebsiteCrawlPlan {}

export interface StoredWebsiteCrawlApproval extends WebsiteCrawlApproval {}

export interface StoredCrawledPageContent extends CrawledPageContent {}

export interface StoredWebsiteCrawlSiteSummary extends WebsiteCrawlSiteSummary {}

export interface StoredContentChunkRecord extends ContentChunkRecord {}

export interface StoredProviderExtractionJob extends ProviderExtractionJob {}

export interface StoredTextArtifactRecord extends TextArtifactRecord {}

export interface StoredEmbeddingJobRecord extends EmbeddingJobRecord {}

export interface StoredAIIntakeSuggestion extends AIIntakeSuggestion {}

// ---------------------------------------------------------------------------
// Repository interfaces — backend-agnostic
// ---------------------------------------------------------------------------

export interface CaseRepository {
  save(c: Case): void;
  findById(caseId: string): Case | null;
  findAll(): Case[];
}

export interface SourceRepository {
  save(s: Source): void;
  findById(sourceId: string): Source | null;
  findByCaseId(caseId: string): Source[];
  findAll(): Source[];
}

export interface PromptRepository {
  save(p: PromptRecord): void;
  findById(promptId: string): PromptRecord | null;
  findByRole(role: string): PromptRecord[];
  findAll(): PromptRecord[];
}

export interface SessionRepository {
  save(s: SessionRecord): void;
  findById(sessionId: string): SessionRecord | null;
  findByCaseId(caseId: string): SessionRecord[];
  findAll(): SessionRecord[];
}

export interface SynthesisRepository {
  save(s: StoredSynthesisRecord): void;
  findById(synthesisId: string): StoredSynthesisRecord | null;
  findByCaseId(caseId: string): StoredSynthesisRecord[];
  findAll(): StoredSynthesisRecord[];
}

export interface EvaluationRepository {
  save(e: StoredEvaluationRecord): void;
  findById(evaluationId: string): StoredEvaluationRecord | null;
  findByCaseId(caseId: string): StoredEvaluationRecord[];
  findBySynthesisId(synthesisId: string): StoredEvaluationRecord[];
  findAll(): StoredEvaluationRecord[];
}

export interface InitialPackageRepository {
  save(p: StoredInitialPackageRecord): void;
  findById(initialPackageId: string): StoredInitialPackageRecord | null;
  findByCaseId(caseId: string): StoredInitialPackageRecord[];
  findByEvaluationId(evaluationId: string): StoredInitialPackageRecord[];
  findAll(): StoredInitialPackageRecord[];
}

export interface ReviewIssueRepository {
  save(issue: StoredReviewIssueRecord): void;
  findById(issueId: string): StoredReviewIssueRecord | null;
  findByCaseId(caseId: string): StoredReviewIssueRecord[];
  findByInitialPackageId(initialPackageId: string): StoredReviewIssueRecord[];
  findAll(): StoredReviewIssueRecord[];
}

export interface FinalPackageRepository {
  save(p: StoredFinalPackageRecord): void;
  findById(packageId: string): StoredFinalPackageRecord | null;
  findByCaseId(caseId: string): StoredFinalPackageRecord[];
  findAll(): StoredFinalPackageRecord[];
}

export interface IntakeSessionRepository {
  save(s: StoredIntakeSession): void;
  findById(sessionId: string): StoredIntakeSession | null;
  findByCaseId(caseId: string): StoredIntakeSession[];
  findAll(): StoredIntakeSession[];
}

export interface IntakeSourceRepository {
  save(s: StoredIntakeSource): void;
  findById(sourceId: string): StoredIntakeSource | null;
  findBySessionId(sessionId: string): StoredIntakeSource[];
  findByCaseId(caseId: string): StoredIntakeSource[];
  findAll(): StoredIntakeSource[];
}

export interface WebsiteCrawlRepository {
  save(c: StoredWebsiteCrawlSession): void;
  findById(crawlId: string): StoredWebsiteCrawlSession | null;
  findBySessionId(sessionId: string): StoredWebsiteCrawlSession[];
  findAll(): StoredWebsiteCrawlSession[];
}

export interface WebsiteCrawlPlanRepository {
  save(plan: StoredWebsiteCrawlPlan): void;
  findById(crawlPlanId: string): StoredWebsiteCrawlPlan | null;
  findBySourceId(sourceId: string): StoredWebsiteCrawlPlan[];
  findBySessionId(sessionId: string): StoredWebsiteCrawlPlan[];
  findAll(): StoredWebsiteCrawlPlan[];
}

export interface WebsiteCrawlApprovalRepository {
  save(approval: StoredWebsiteCrawlApproval): void;
  findByCrawlPlanId(crawlPlanId: string): StoredWebsiteCrawlApproval | null;
  findAll(): StoredWebsiteCrawlApproval[];
}

export interface CrawledPageContentRepository {
  save(page: StoredCrawledPageContent): void;
  findByCrawlPlanId(crawlPlanId: string): StoredCrawledPageContent[];
  findBySourceId(sourceId: string): StoredCrawledPageContent[];
  findAll(): StoredCrawledPageContent[];
}

export interface WebsiteCrawlSiteSummaryRepository {
  save(summary: StoredWebsiteCrawlSiteSummary): void;
  findByCrawlPlanId(crawlPlanId: string): StoredWebsiteCrawlSiteSummary | null;
  findAll(): StoredWebsiteCrawlSiteSummary[];
}

export interface ContentChunkRepository {
  save(chunk: StoredContentChunkRecord): void;
  findByCrawlPlanId(crawlPlanId: string): StoredContentChunkRecord[];
  findByPageContentId(pageContentId: string): StoredContentChunkRecord[];
  findBySourceId(sourceId: string): StoredContentChunkRecord[];
  findAll(): StoredContentChunkRecord[];
}

export interface ProviderExtractionJobRepository {
  save(job: StoredProviderExtractionJob): void;
  findById(jobId: string): StoredProviderExtractionJob | null;
  findBySourceId(sourceId: string): StoredProviderExtractionJob[];
  findBySessionId(sessionId: string): StoredProviderExtractionJob[];
  findAll(): StoredProviderExtractionJob[];
}

export interface TextArtifactRepository {
  save(artifact: StoredTextArtifactRecord): void;
  findById(artifactId: string): StoredTextArtifactRecord | null;
  findBySourceId(sourceId: string): StoredTextArtifactRecord[];
  findAll(): StoredTextArtifactRecord[];
}

export interface EmbeddingJobRepository {
  save(job: StoredEmbeddingJobRecord): void;
  findById(embeddingJobId: string): StoredEmbeddingJobRecord | null;
  findBySourceId(sourceId: string): StoredEmbeddingJobRecord[];
  findAll(): StoredEmbeddingJobRecord[];
}

export interface AIIntakeSuggestionRepository {
  save(suggestion: StoredAIIntakeSuggestion): void;
  findById(suggestionId: string): StoredAIIntakeSuggestion | null;
  findBySourceId(sourceId: string): StoredAIIntakeSuggestion[];
  findBySessionId(sessionId: string): StoredAIIntakeSuggestion[];
  findAll(): StoredAIIntakeSuggestion[];
}

// ---------------------------------------------------------------------------
// In-memory implementations
// ---------------------------------------------------------------------------

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

class InMemoryPromptRepository implements PromptRepository {
  private readonly store = new Map<string, PromptRecord>();

  save(p: PromptRecord): void {
    this.store.set(p.promptId, { ...p });
  }

  findById(promptId: string): PromptRecord | null {
    return this.store.get(promptId) ?? null;
  }

  findByRole(role: string): PromptRecord[] {
    return Array.from(this.store.values()).filter((p) => p.role === role);
  }

  findAll(): PromptRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemorySourceRepository implements SourceRepository {
  private readonly store = new Map<string, Source>();

  save(s: Source): void {
    this.store.set(s.sourceId, { ...s });
  }

  findById(sourceId: string): Source | null {
    return this.store.get(sourceId) ?? null;
  }

  findByCaseId(caseId: string): Source[] {
    return Array.from(this.store.values()).filter((s) => s.caseId === caseId);
  }

  findAll(): Source[] {
    return Array.from(this.store.values());
  }
}

class InMemorySessionRepository implements SessionRepository {
  private readonly store = new Map<string, SessionRecord>();

  save(s: SessionRecord): void {
    this.store.set(s.sessionId, {
      ...s,
      clarificationQuestions: [...s.clarificationQuestions],
    });
  }

  findById(sessionId: string): SessionRecord | null {
    return this.store.get(sessionId) ?? null;
  }

  findByCaseId(caseId: string): SessionRecord[] {
    return Array.from(this.store.values()).filter((s) => s.caseId === caseId);
  }

  findAll(): SessionRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemorySynthesisRepository implements SynthesisRepository {
  private readonly store = new Map<string, StoredSynthesisRecord>();

  save(s: StoredSynthesisRecord): void {
    this.store.set(s.synthesisId, {
      ...s,
      differenceBlocks: s.differenceBlocks.map((b) => ({ ...b })),
      majorUnresolvedItems: [...s.majorUnresolvedItems],
      closureCandidates: [...s.closureCandidates],
      escalationCandidates: [...s.escalationCandidates],
    });
  }

  findById(synthesisId: string): StoredSynthesisRecord | null {
    return this.store.get(synthesisId) ?? null;
  }

  findByCaseId(caseId: string): StoredSynthesisRecord[] {
    return Array.from(this.store.values()).filter((s) => s.caseId === caseId);
  }

  findAll(): StoredSynthesisRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryEvaluationRepository implements EvaluationRepository {
  private readonly store = new Map<string, StoredEvaluationRecord>();

  save(e: StoredEvaluationRecord): void {
    this.store.set(e.evaluationId, {
      ...e,
      axes: { ...e.axes },
      conditions: { ...e.conditions },
    });
  }

  findById(evaluationId: string): StoredEvaluationRecord | null {
    return this.store.get(evaluationId) ?? null;
  }

  findByCaseId(caseId: string): StoredEvaluationRecord[] {
    return Array.from(this.store.values()).filter((e) => e.caseId === caseId);
  }

  findBySynthesisId(synthesisId: string): StoredEvaluationRecord[] {
    return Array.from(this.store.values()).filter(
      (e) => e.synthesisId === synthesisId,
    );
  }

  findAll(): StoredEvaluationRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryInitialPackageRepository implements InitialPackageRepository {
  private readonly store = new Map<string, StoredInitialPackageRecord>();

  save(p: StoredInitialPackageRecord): void {
    this.store.set(p.initialPackageId, {
      ...p,
      outward: { ...p.outward },
      admin: {
        ...p.admin,
        sevenConditionChecklist: { ...p.admin.sevenConditionChecklist },
        internalReviewPrompts: p.admin.internalReviewPrompts
          ? [...p.admin.internalReviewPrompts]
          : undefined,
      },
    });
  }

  findById(initialPackageId: string): StoredInitialPackageRecord | null {
    return this.store.get(initialPackageId) ?? null;
  }

  findByCaseId(caseId: string): StoredInitialPackageRecord[] {
    return Array.from(this.store.values()).filter((p) => p.caseId === caseId);
  }

  findByEvaluationId(evaluationId: string): StoredInitialPackageRecord[] {
    return Array.from(this.store.values()).filter(
      (p) => p.evaluationId === evaluationId,
    );
  }

  findAll(): StoredInitialPackageRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryFinalPackageRepository implements FinalPackageRepository {
  private readonly store = new Map<string, StoredFinalPackageRecord>();

  save(p: StoredFinalPackageRecord): void {
    this.store.set(p.packageId, {
      ...p,
      gapLayer: {
        ...p.gapLayer,
        closedItems: [...p.gapLayer.closedItems],
        nonBlockingRemainingItems: [...p.gapLayer.nonBlockingRemainingItems],
        laterReviewItems: [...p.gapLayer.laterReviewItems],
      },
    });
  }

  findById(packageId: string): StoredFinalPackageRecord | null {
    return this.store.get(packageId) ?? null;
  }

  findByCaseId(caseId: string): StoredFinalPackageRecord[] {
    return Array.from(this.store.values()).filter((p) => p.caseId === caseId);
  }

  findAll(): StoredFinalPackageRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryInterpretationSnapshotRepository
  implements InterpretationSnapshotRepository
{
  private readonly store = new Map<string, InterpretationSnapshot>();

  save(snapshot: InterpretationSnapshot): void {
    this.store.set(snapshot.snapshotId, { ...snapshot });
  }

  findById(snapshotId: string): InterpretationSnapshot | null {
    return this.store.get(snapshotId) ?? null;
  }
}

class InMemoryReviewIssueRepository implements ReviewIssueRepository {
  private readonly store = new Map<string, StoredReviewIssueRecord>();

  save(issue: StoredReviewIssueRecord): void {
    this.store.set(issue.issueId, {
      ...issue,
      issueBrief: { ...issue.issueBrief },
      discussionThread: {
        ...issue.discussionThread,
        entries: issue.discussionThread.entries.map((entry) => ({ ...entry })),
      },
      linkedEvidence: issue.linkedEvidence.map((entry) => ({ ...entry })),
      actionHistory: issue.actionHistory.map((action) => ({ ...action })),
      releaseApprovalRecord: issue.releaseApprovalRecord
        ? { ...issue.releaseApprovalRecord }
        : undefined,
    });
  }

  findById(issueId: string): StoredReviewIssueRecord | null {
    return this.store.get(issueId) ?? null;
  }

  findByCaseId(caseId: string): StoredReviewIssueRecord[] {
    return Array.from(this.store.values()).filter((issue) => issue.caseId === caseId);
  }

  findByInitialPackageId(initialPackageId: string): StoredReviewIssueRecord[] {
    return Array.from(this.store.values()).filter(
      (issue) => issue.initialPackageId === initialPackageId,
    );
  }

  findAll(): StoredReviewIssueRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryIntakeSessionRepository implements IntakeSessionRepository {
  private readonly store = new Map<string, StoredIntakeSession>();

  save(s: StoredIntakeSession): void {
    this.store.set(s.sessionId, { ...s });
  }

  findById(sessionId: string): StoredIntakeSession | null {
    return this.store.get(sessionId) ?? null;
  }

  findByCaseId(caseId: string): StoredIntakeSession[] {
    return Array.from(this.store.values()).filter((s) => s.caseId === caseId);
  }

  findAll(): StoredIntakeSession[] {
    return Array.from(this.store.values());
  }
}

class InMemoryIntakeSourceRepository implements IntakeSourceRepository {
  private readonly store = new Map<string, StoredIntakeSource>();

  save(s: StoredIntakeSource): void {
    this.store.set(s.sourceId, { ...s });
  }

  findById(sourceId: string): StoredIntakeSource | null {
    return this.store.get(sourceId) ?? null;
  }

  findBySessionId(sessionId: string): StoredIntakeSource[] {
    return Array.from(this.store.values()).filter((s) => s.sessionId === sessionId);
  }

  findByCaseId(caseId: string): StoredIntakeSource[] {
    return Array.from(this.store.values()).filter((s) => s.caseId === caseId);
  }

  findAll(): StoredIntakeSource[] {
    return Array.from(this.store.values());
  }
}

class InMemoryWebsiteCrawlRepository implements WebsiteCrawlRepository {
  private readonly store = new Map<string, StoredWebsiteCrawlSession>();

  save(c: StoredWebsiteCrawlSession): void {
    this.store.set(c.crawlId, {
      ...c,
      candidatePages: c.candidatePages.map((p) => ({ ...p })),
      approvedPages: c.approvedPages ? [...c.approvedPages] : undefined,
    });
  }

  findById(crawlId: string): StoredWebsiteCrawlSession | null {
    return this.store.get(crawlId) ?? null;
  }

  findBySessionId(sessionId: string): StoredWebsiteCrawlSession[] {
    return Array.from(this.store.values()).filter((c) => c.sessionId === sessionId);
  }

  findAll(): StoredWebsiteCrawlSession[] {
    return Array.from(this.store.values());
  }
}

class InMemoryWebsiteCrawlPlanRepository implements WebsiteCrawlPlanRepository {
  private readonly store = new Map<string, StoredWebsiteCrawlPlan>();

  save(plan: StoredWebsiteCrawlPlan): void {
    this.store.set(plan.crawlPlanId, {
      ...plan,
      candidatePages: plan.candidatePages.map((page) => ({ ...page })),
    });
  }

  findById(crawlPlanId: string): StoredWebsiteCrawlPlan | null {
    return this.store.get(crawlPlanId) ?? null;
  }

  findBySourceId(sourceId: string): StoredWebsiteCrawlPlan[] {
    return Array.from(this.store.values()).filter((plan) => plan.sourceId === sourceId);
  }

  findBySessionId(sessionId: string): StoredWebsiteCrawlPlan[] {
    return Array.from(this.store.values()).filter((plan) => plan.sessionId === sessionId);
  }

  findAll(): StoredWebsiteCrawlPlan[] {
    return Array.from(this.store.values());
  }
}

class InMemoryWebsiteCrawlApprovalRepository implements WebsiteCrawlApprovalRepository {
  private readonly store = new Map<string, StoredWebsiteCrawlApproval>();

  save(approval: StoredWebsiteCrawlApproval): void {
    this.store.set(approval.crawlPlanId, {
      ...approval,
      approvedUrls: [...approval.approvedUrls],
      rejectedUrls: [...approval.rejectedUrls],
    });
  }

  findByCrawlPlanId(crawlPlanId: string): StoredWebsiteCrawlApproval | null {
    return this.store.get(crawlPlanId) ?? null;
  }

  findAll(): StoredWebsiteCrawlApproval[] {
    return Array.from(this.store.values());
  }
}

class InMemoryCrawledPageContentRepository implements CrawledPageContentRepository {
  private readonly store = new Map<string, StoredCrawledPageContent>();

  save(page: StoredCrawledPageContent): void {
    this.store.set(page.pageContentId, { ...page });
  }

  findByCrawlPlanId(crawlPlanId: string): StoredCrawledPageContent[] {
    return Array.from(this.store.values()).filter((page) => page.crawlPlanId === crawlPlanId);
  }

  findBySourceId(sourceId: string): StoredCrawledPageContent[] {
    return Array.from(this.store.values()).filter((page) => page.sourceId === sourceId);
  }

  findAll(): StoredCrawledPageContent[] {
    return Array.from(this.store.values());
  }
}

class InMemoryWebsiteCrawlSiteSummaryRepository implements WebsiteCrawlSiteSummaryRepository {
  private readonly store = new Map<string, StoredWebsiteCrawlSiteSummary>();

  save(summary: StoredWebsiteCrawlSiteSummary): void {
    this.store.set(summary.crawlPlanId, { ...summary, summary: { ...summary.summary } });
  }

  findByCrawlPlanId(crawlPlanId: string): StoredWebsiteCrawlSiteSummary | null {
    return this.store.get(crawlPlanId) ?? null;
  }

  findAll(): StoredWebsiteCrawlSiteSummary[] {
    return Array.from(this.store.values());
  }
}

class InMemoryContentChunkRepository implements ContentChunkRepository {
  private readonly store = new Map<string, StoredContentChunkRecord>();

  save(chunk: StoredContentChunkRecord): void {
    this.store.set(chunk.chunkId, { ...chunk });
  }

  findByCrawlPlanId(crawlPlanId: string): StoredContentChunkRecord[] {
    return Array.from(this.store.values()).filter((chunk) => chunk.crawlPlanId === crawlPlanId);
  }

  findByPageContentId(pageContentId: string): StoredContentChunkRecord[] {
    return Array.from(this.store.values()).filter((chunk) => chunk.pageContentId === pageContentId);
  }

  findBySourceId(sourceId: string): StoredContentChunkRecord[] {
    return Array.from(this.store.values()).filter((chunk) => chunk.sourceId === sourceId);
  }

  findAll(): StoredContentChunkRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryProviderExtractionJobRepository implements ProviderExtractionJobRepository {
  private readonly store = new Map<string, StoredProviderExtractionJob>();

  save(job: StoredProviderExtractionJob): void {
    this.store.set(job.jobId, { ...job });
  }

  findById(jobId: string): StoredProviderExtractionJob | null {
    return this.store.get(jobId) ?? null;
  }

  findBySourceId(sourceId: string): StoredProviderExtractionJob[] {
    return Array.from(this.store.values()).filter((job) => job.sourceId === sourceId);
  }

  findBySessionId(sessionId: string): StoredProviderExtractionJob[] {
    return Array.from(this.store.values()).filter((job) => job.sessionId === sessionId);
  }

  findAll(): StoredProviderExtractionJob[] {
    return Array.from(this.store.values());
  }
}

class InMemoryTextArtifactRepository implements TextArtifactRepository {
  private readonly store = new Map<string, StoredTextArtifactRecord>();

  save(artifact: StoredTextArtifactRecord): void {
    this.store.set(artifact.artifactId, { ...artifact });
  }

  findById(artifactId: string): StoredTextArtifactRecord | null {
    return this.store.get(artifactId) ?? null;
  }

  findBySourceId(sourceId: string): StoredTextArtifactRecord[] {
    return Array.from(this.store.values()).filter((artifact) => artifact.sourceId === sourceId);
  }

  findAll(): StoredTextArtifactRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryEmbeddingJobRepository implements EmbeddingJobRepository {
  private readonly store = new Map<string, StoredEmbeddingJobRecord>();

  save(job: StoredEmbeddingJobRecord): void {
    this.store.set(job.embeddingJobId, { ...job, chunkRefs: [...job.chunkRefs] });
  }

  findById(embeddingJobId: string): StoredEmbeddingJobRecord | null {
    return this.store.get(embeddingJobId) ?? null;
  }

  findBySourceId(sourceId: string): StoredEmbeddingJobRecord[] {
    return Array.from(this.store.values()).filter((job) => job.sourceId === sourceId);
  }

  findAll(): StoredEmbeddingJobRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryAIIntakeSuggestionRepository implements AIIntakeSuggestionRepository {
  private readonly store = new Map<string, StoredAIIntakeSuggestion>();

  save(suggestion: StoredAIIntakeSuggestion): void {
    this.store.set(suggestion.suggestionId, { ...suggestion });
  }

  findById(suggestionId: string): StoredAIIntakeSuggestion | null {
    return this.store.get(suggestionId) ?? null;
  }

  findBySourceId(sourceId: string): StoredAIIntakeSuggestion[] {
    return Array.from(this.store.values()).filter((suggestion) => suggestion.sourceId === sourceId);
  }

  findBySessionId(sessionId: string): StoredAIIntakeSuggestion[] {
    return Array.from(this.store.values()).filter((suggestion) => suggestion.sessionId === sessionId);
  }

  findAll(): StoredAIIntakeSuggestion[] {
    return Array.from(this.store.values());
  }
}

// ---------------------------------------------------------------------------
// SQLite intake implementations — durable Phase 1 foundation
// ---------------------------------------------------------------------------

interface IntakeRecordRow {
  id: string;
  case_id?: string;
  session_id?: string;
  payload: string;
}

function intakeSqlitePath(dbPath?: string): string {
  if (dbPath) return dbPath;
  if (process.env.WORKFLOW_INTAKE_SQLITE_PATH) return process.env.WORKFLOW_INTAKE_SQLITE_PATH;
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return join(tmpdir(), `workflow-intake-build-${process.pid}.sqlite`);
  }
  return join(process.cwd(), "data", "intake-phase2.sqlite");
}

function openIntakeDatabase(dbPath?: string): DatabaseSync {
  const path = intakeSqlitePath(dbPath);
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS intake_sessions (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS intake_sources (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_intake_sessions_case_id ON intake_sessions(case_id);
    CREATE INDEX IF NOT EXISTS idx_intake_sources_session_id ON intake_sources(session_id);
    CREATE INDEX IF NOT EXISTS idx_intake_sources_case_id ON intake_sources(case_id);
    CREATE TABLE IF NOT EXISTS provider_extraction_jobs (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS text_artifacts (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS embedding_jobs (
      id TEXT PRIMARY KEY,
      source_id TEXT,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ai_intake_suggestions (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS website_crawl_plans (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS website_crawl_approvals (
      id TEXT PRIMARY KEY,
      crawl_plan_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS crawled_page_contents (
      id TEXT PRIMARY KEY,
      crawl_plan_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS website_crawl_site_summaries (
      id TEXT PRIMARY KEY,
      crawl_plan_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS content_chunks (
      id TEXT PRIMARY KEY,
      crawl_plan_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      page_content_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_provider_jobs_source_id ON provider_extraction_jobs(source_id);
    CREATE INDEX IF NOT EXISTS idx_provider_jobs_session_id ON provider_extraction_jobs(session_id);
    CREATE INDEX IF NOT EXISTS idx_text_artifacts_source_id ON text_artifacts(source_id);
    CREATE INDEX IF NOT EXISTS idx_embedding_jobs_source_id ON embedding_jobs(source_id);
    CREATE INDEX IF NOT EXISTS idx_ai_suggestions_source_id ON ai_intake_suggestions(source_id);
    CREATE INDEX IF NOT EXISTS idx_ai_suggestions_session_id ON ai_intake_suggestions(session_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_plans_source_id ON website_crawl_plans(source_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_plans_session_id ON website_crawl_plans(session_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_approvals_plan_id ON website_crawl_approvals(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_crawled_pages_plan_id ON crawled_page_contents(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_crawled_pages_source_id ON crawled_page_contents(source_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_summaries_plan_id ON website_crawl_site_summaries(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_content_chunks_plan_id ON content_chunks(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_content_chunks_page_id ON content_chunks(page_content_id);
    CREATE INDEX IF NOT EXISTS idx_content_chunks_source_id ON content_chunks(source_id);
  `);
  return db;
}

function parseStored<T>(row: unknown): T | null {
  if (!row || typeof row !== "object") return null;
  const payload = (row as IntakeRecordRow).payload;
  if (typeof payload !== "string") return null;
  return JSON.parse(payload) as T;
}

function parseStoredList<T>(rows: unknown[]): T[] {
  return rows.flatMap((row) => {
    const parsed = parseStored<T>(row);
    return parsed ? [parsed] : [];
  });
}

export class SQLiteIntakeSessionRepository implements IntakeSessionRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(session: StoredIntakeSession): void {
    this.db.prepare(
      "INSERT INTO intake_sessions (id, case_id, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET case_id = excluded.case_id, payload = excluded.payload",
    ).run(session.sessionId, session.caseId, JSON.stringify(session));
  }

  findById(sessionId: string): StoredIntakeSession | null {
    const row = this.db.prepare("SELECT payload FROM intake_sessions WHERE id = ?").get(sessionId);
    return parseStored<StoredIntakeSession>(row);
  }

  findByCaseId(caseId: string): StoredIntakeSession[] {
    const rows = this.db.prepare("SELECT payload FROM intake_sessions WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredIntakeSession>(rows);
  }

  findAll(): StoredIntakeSession[] {
    const rows = this.db.prepare("SELECT payload FROM intake_sessions ORDER BY id").all();
    return parseStoredList<StoredIntakeSession>(rows);
  }
}

export class SQLiteIntakeSourceRepository implements IntakeSourceRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(source: StoredIntakeSource): void {
    this.db.prepare(
      "INSERT INTO intake_sources (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(source.sourceId, source.sessionId, source.caseId, JSON.stringify(source));
  }

  findById(sourceId: string): StoredIntakeSource | null {
    const row = this.db.prepare("SELECT payload FROM intake_sources WHERE id = ?").get(sourceId);
    return parseStored<StoredIntakeSource>(row);
  }

  findBySessionId(sessionId: string): StoredIntakeSource[] {
    const rows = this.db.prepare("SELECT payload FROM intake_sources WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredIntakeSource>(rows);
  }

  findByCaseId(caseId: string): StoredIntakeSource[] {
    const rows = this.db.prepare("SELECT payload FROM intake_sources WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredIntakeSource>(rows);
  }

  findAll(): StoredIntakeSource[] {
    const rows = this.db.prepare("SELECT payload FROM intake_sources ORDER BY id").all();
    return parseStoredList<StoredIntakeSource>(rows);
  }
}

export class SQLiteProviderExtractionJobRepository implements ProviderExtractionJobRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(job: StoredProviderExtractionJob): void {
    this.db.prepare(
      "INSERT INTO provider_extraction_jobs (id, source_id, session_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, session_id = excluded.session_id, payload = excluded.payload",
    ).run(job.jobId, job.sourceId, job.sessionId, JSON.stringify(job));
  }

  findById(jobId: string): StoredProviderExtractionJob | null {
    const row = this.db.prepare("SELECT payload FROM provider_extraction_jobs WHERE id = ?").get(jobId);
    return parseStored<StoredProviderExtractionJob>(row);
  }

  findBySourceId(sourceId: string): StoredProviderExtractionJob[] {
    const rows = this.db.prepare("SELECT payload FROM provider_extraction_jobs WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredProviderExtractionJob>(rows);
  }

  findBySessionId(sessionId: string): StoredProviderExtractionJob[] {
    const rows = this.db.prepare("SELECT payload FROM provider_extraction_jobs WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredProviderExtractionJob>(rows);
  }

  findAll(): StoredProviderExtractionJob[] {
    const rows = this.db.prepare("SELECT payload FROM provider_extraction_jobs ORDER BY id").all();
    return parseStoredList<StoredProviderExtractionJob>(rows);
  }
}

export class SQLiteTextArtifactRepository implements TextArtifactRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(artifact: StoredTextArtifactRecord): void {
    this.db.prepare(
      "INSERT INTO text_artifacts (id, source_id, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, payload = excluded.payload",
    ).run(artifact.artifactId, artifact.sourceId ?? null, JSON.stringify(artifact));
  }

  findById(artifactId: string): StoredTextArtifactRecord | null {
    const row = this.db.prepare("SELECT payload FROM text_artifacts WHERE id = ?").get(artifactId);
    return parseStored<StoredTextArtifactRecord>(row);
  }

  findBySourceId(sourceId: string): StoredTextArtifactRecord[] {
    const rows = this.db.prepare("SELECT payload FROM text_artifacts WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredTextArtifactRecord>(rows);
  }

  findAll(): StoredTextArtifactRecord[] {
    const rows = this.db.prepare("SELECT payload FROM text_artifacts ORDER BY id").all();
    return parseStoredList<StoredTextArtifactRecord>(rows);
  }
}

export class SQLiteEmbeddingJobRepository implements EmbeddingJobRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(job: StoredEmbeddingJobRecord): void {
    this.db.prepare(
      "INSERT INTO embedding_jobs (id, source_id, payload) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, payload = excluded.payload",
    ).run(job.embeddingJobId, job.sourceId ?? null, JSON.stringify(job));
  }

  findById(embeddingJobId: string): StoredEmbeddingJobRecord | null {
    const row = this.db.prepare("SELECT payload FROM embedding_jobs WHERE id = ?").get(embeddingJobId);
    return parseStored<StoredEmbeddingJobRecord>(row);
  }

  findBySourceId(sourceId: string): StoredEmbeddingJobRecord[] {
    const rows = this.db.prepare("SELECT payload FROM embedding_jobs WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredEmbeddingJobRecord>(rows);
  }

  findAll(): StoredEmbeddingJobRecord[] {
    const rows = this.db.prepare("SELECT payload FROM embedding_jobs ORDER BY id").all();
    return parseStoredList<StoredEmbeddingJobRecord>(rows);
  }
}

export class SQLiteAIIntakeSuggestionRepository implements AIIntakeSuggestionRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(suggestion: StoredAIIntakeSuggestion): void {
    this.db.prepare(
      "INSERT INTO ai_intake_suggestions (id, source_id, session_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, session_id = excluded.session_id, payload = excluded.payload",
    ).run(suggestion.suggestionId, suggestion.sourceId, suggestion.sessionId, JSON.stringify(suggestion));
  }

  findById(suggestionId: string): StoredAIIntakeSuggestion | null {
    const row = this.db.prepare("SELECT payload FROM ai_intake_suggestions WHERE id = ?").get(suggestionId);
    return parseStored<StoredAIIntakeSuggestion>(row);
  }

  findBySourceId(sourceId: string): StoredAIIntakeSuggestion[] {
    const rows = this.db.prepare("SELECT payload FROM ai_intake_suggestions WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredAIIntakeSuggestion>(rows);
  }

  findBySessionId(sessionId: string): StoredAIIntakeSuggestion[] {
    const rows = this.db.prepare("SELECT payload FROM ai_intake_suggestions WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredAIIntakeSuggestion>(rows);
  }

  findAll(): StoredAIIntakeSuggestion[] {
    const rows = this.db.prepare("SELECT payload FROM ai_intake_suggestions ORDER BY id").all();
    return parseStoredList<StoredAIIntakeSuggestion>(rows);
  }
}

export class SQLiteWebsiteCrawlPlanRepository implements WebsiteCrawlPlanRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(plan: StoredWebsiteCrawlPlan): void {
    this.db.prepare(
      "INSERT INTO website_crawl_plans (id, source_id, session_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, session_id = excluded.session_id, payload = excluded.payload",
    ).run(plan.crawlPlanId, plan.sourceId, plan.sessionId, JSON.stringify(plan));
  }

  findById(crawlPlanId: string): StoredWebsiteCrawlPlan | null {
    const row = this.db.prepare("SELECT payload FROM website_crawl_plans WHERE id = ?").get(crawlPlanId);
    return parseStored<StoredWebsiteCrawlPlan>(row);
  }

  findBySourceId(sourceId: string): StoredWebsiteCrawlPlan[] {
    const rows = this.db.prepare("SELECT payload FROM website_crawl_plans WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredWebsiteCrawlPlan>(rows);
  }

  findBySessionId(sessionId: string): StoredWebsiteCrawlPlan[] {
    const rows = this.db.prepare("SELECT payload FROM website_crawl_plans WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredWebsiteCrawlPlan>(rows);
  }

  findAll(): StoredWebsiteCrawlPlan[] {
    const rows = this.db.prepare("SELECT payload FROM website_crawl_plans ORDER BY id").all();
    return parseStoredList<StoredWebsiteCrawlPlan>(rows);
  }
}

export class SQLiteWebsiteCrawlApprovalRepository implements WebsiteCrawlApprovalRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(approval: StoredWebsiteCrawlApproval): void {
    this.db.prepare(
      "INSERT INTO website_crawl_approvals (id, crawl_plan_id, source_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET crawl_plan_id = excluded.crawl_plan_id, source_id = excluded.source_id, payload = excluded.payload",
    ).run(approval.approvalId, approval.crawlPlanId, approval.sourceId, JSON.stringify(approval));
  }

  findByCrawlPlanId(crawlPlanId: string): StoredWebsiteCrawlApproval | null {
    const row = this.db.prepare("SELECT payload FROM website_crawl_approvals WHERE crawl_plan_id = ? ORDER BY id DESC LIMIT 1").get(crawlPlanId);
    return parseStored<StoredWebsiteCrawlApproval>(row);
  }

  findAll(): StoredWebsiteCrawlApproval[] {
    const rows = this.db.prepare("SELECT payload FROM website_crawl_approvals ORDER BY id").all();
    return parseStoredList<StoredWebsiteCrawlApproval>(rows);
  }
}

export class SQLiteCrawledPageContentRepository implements CrawledPageContentRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(page: StoredCrawledPageContent): void {
    this.db.prepare(
      "INSERT INTO crawled_page_contents (id, crawl_plan_id, source_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET crawl_plan_id = excluded.crawl_plan_id, source_id = excluded.source_id, payload = excluded.payload",
    ).run(page.pageContentId, page.crawlPlanId, page.sourceId, JSON.stringify(page));
  }

  findByCrawlPlanId(crawlPlanId: string): StoredCrawledPageContent[] {
    const rows = this.db.prepare("SELECT payload FROM crawled_page_contents WHERE crawl_plan_id = ? ORDER BY id").all(crawlPlanId);
    return parseStoredList<StoredCrawledPageContent>(rows);
  }

  findBySourceId(sourceId: string): StoredCrawledPageContent[] {
    const rows = this.db.prepare("SELECT payload FROM crawled_page_contents WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredCrawledPageContent>(rows);
  }

  findAll(): StoredCrawledPageContent[] {
    const rows = this.db.prepare("SELECT payload FROM crawled_page_contents ORDER BY id").all();
    return parseStoredList<StoredCrawledPageContent>(rows);
  }
}

export class SQLiteWebsiteCrawlSiteSummaryRepository implements WebsiteCrawlSiteSummaryRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(summary: StoredWebsiteCrawlSiteSummary): void {
    this.db.prepare(
      "INSERT INTO website_crawl_site_summaries (id, crawl_plan_id, source_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET crawl_plan_id = excluded.crawl_plan_id, source_id = excluded.source_id, payload = excluded.payload",
    ).run(summary.summaryId, summary.crawlPlanId, summary.sourceId, JSON.stringify(summary));
  }

  findByCrawlPlanId(crawlPlanId: string): StoredWebsiteCrawlSiteSummary | null {
    const row = this.db.prepare("SELECT payload FROM website_crawl_site_summaries WHERE crawl_plan_id = ? ORDER BY id DESC LIMIT 1").get(crawlPlanId);
    return parseStored<StoredWebsiteCrawlSiteSummary>(row);
  }

  findAll(): StoredWebsiteCrawlSiteSummary[] {
    const rows = this.db.prepare("SELECT payload FROM website_crawl_site_summaries ORDER BY id").all();
    return parseStoredList<StoredWebsiteCrawlSiteSummary>(rows);
  }
}

export class SQLiteContentChunkRepository implements ContentChunkRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(chunk: StoredContentChunkRecord): void {
    this.db.prepare(
      "INSERT INTO content_chunks (id, crawl_plan_id, source_id, page_content_id, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET crawl_plan_id = excluded.crawl_plan_id, source_id = excluded.source_id, page_content_id = excluded.page_content_id, payload = excluded.payload",
    ).run(chunk.chunkId, chunk.crawlPlanId, chunk.sourceId, chunk.pageContentId, JSON.stringify(chunk));
  }

  findByCrawlPlanId(crawlPlanId: string): StoredContentChunkRecord[] {
    const rows = this.db.prepare("SELECT payload FROM content_chunks WHERE crawl_plan_id = ? ORDER BY page_content_id, id").all(crawlPlanId);
    return parseStoredList<StoredContentChunkRecord>(rows);
  }

  findByPageContentId(pageContentId: string): StoredContentChunkRecord[] {
    const rows = this.db.prepare("SELECT payload FROM content_chunks WHERE page_content_id = ? ORDER BY id").all(pageContentId);
    return parseStoredList<StoredContentChunkRecord>(rows);
  }

  findBySourceId(sourceId: string): StoredContentChunkRecord[] {
    const rows = this.db.prepare("SELECT payload FROM content_chunks WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredContentChunkRecord>(rows);
  }

  findAll(): StoredContentChunkRecord[] {
    const rows = this.db.prepare("SELECT payload FROM content_chunks ORDER BY id").all();
    return parseStoredList<StoredContentChunkRecord>(rows);
  }
}

export function createSQLiteIntakeRepositories(dbPath?: string): {
  intakeSessions: IntakeSessionRepository;
  intakeSources: IntakeSourceRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  websiteCrawlPlans: WebsiteCrawlPlanRepository;
  websiteCrawlApprovals: WebsiteCrawlApprovalRepository;
  crawledPageContents: CrawledPageContentRepository;
  websiteCrawlSiteSummaries: WebsiteCrawlSiteSummaryRepository;
  contentChunks: ContentChunkRepository;
} {
  return {
    intakeSessions: new SQLiteIntakeSessionRepository(dbPath),
    intakeSources: new SQLiteIntakeSourceRepository(dbPath),
    providerJobs: new SQLiteProviderExtractionJobRepository(dbPath),
    textArtifacts: new SQLiteTextArtifactRepository(dbPath),
    embeddingJobs: new SQLiteEmbeddingJobRepository(dbPath),
    aiIntakeSuggestions: new SQLiteAIIntakeSuggestionRepository(dbPath),
    websiteCrawlPlans: new SQLiteWebsiteCrawlPlanRepository(dbPath),
    websiteCrawlApprovals: new SQLiteWebsiteCrawlApprovalRepository(dbPath),
    crawledPageContents: new SQLiteCrawledPageContentRepository(dbPath),
    websiteCrawlSiteSummaries: new SQLiteWebsiteCrawlSiteSummaryRepository(dbPath),
    contentChunks: new SQLiteContentChunkRepository(dbPath),
  };
}

export function getDefaultIntakeSqlitePath(): string {
  return intakeSqlitePath();
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export interface InMemoryStore {
  cases: CaseRepository;
  sources: SourceRepository;
  prompts: PromptRepository;
  sessions: SessionRepository;
  synthesis: SynthesisRepository;
  evaluations: EvaluationRepository;
  initialPackages: InitialPackageRepository;
  snapshots: InterpretationSnapshotRepository;
  reviewIssues: ReviewIssueRepository;
  finalPackages: FinalPackageRepository;
  intakeSessions: IntakeSessionRepository;
  intakeSources: IntakeSourceRepository;
  websiteCrawls: WebsiteCrawlRepository;
  websiteCrawlPlans: WebsiteCrawlPlanRepository;
  websiteCrawlApprovals: WebsiteCrawlApprovalRepository;
  crawledPageContents: CrawledPageContentRepository;
  websiteCrawlSiteSummaries: WebsiteCrawlSiteSummaryRepository;
  contentChunks: ContentChunkRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  /** Raw file bytes keyed by sourceId. In-memory only — no persistence. */
  fileStore: Map<string, { bytes: ArrayBuffer; mimeType: string }>;
}

export function createInMemoryStore(): InMemoryStore {
  return {
    cases: new InMemoryCaseRepository(),
    sources: new InMemorySourceRepository(),
    prompts: new InMemoryPromptRepository(),
    sessions: new InMemorySessionRepository(),
    synthesis: new InMemorySynthesisRepository(),
    evaluations: new InMemoryEvaluationRepository(),
    initialPackages: new InMemoryInitialPackageRepository(),
    snapshots: new InMemoryInterpretationSnapshotRepository(),
    reviewIssues: new InMemoryReviewIssueRepository(),
    finalPackages: new InMemoryFinalPackageRepository(),
    intakeSessions: new InMemoryIntakeSessionRepository(),
    intakeSources: new InMemoryIntakeSourceRepository(),
    websiteCrawls: new InMemoryWebsiteCrawlRepository(),
    websiteCrawlPlans: new InMemoryWebsiteCrawlPlanRepository(),
    websiteCrawlApprovals: new InMemoryWebsiteCrawlApprovalRepository(),
    crawledPageContents: new InMemoryCrawledPageContentRepository(),
    websiteCrawlSiteSummaries: new InMemoryWebsiteCrawlSiteSummaryRepository(),
    contentChunks: new InMemoryContentChunkRepository(),
    providerJobs: new InMemoryProviderExtractionJobRepository(),
    textArtifacts: new InMemoryTextArtifactRepository(),
    embeddingJobs: new InMemoryEmbeddingJobRepository(),
    aiIntakeSuggestions: new InMemoryAIIntakeSuggestionRepository(),
    fileStore: new Map(),
  };
}

// Re-export for use by domain packages without double-importing contracts
export type {
  AIIntakeSuggestion,
  CaseConfiguration,
  ConditionInterpretations,
  EmbeddingJobRecord,
  FinalPackageRecord,
  IntakeSession,
  IntakeSource,
  ProviderExtractionJob,
  TextArtifactRecord,
  WebsiteCrawlApproval,
  WebsiteCrawlPlan,
  CrawledPageContent,
  WebsiteCrawlSiteSummary,
  ContentChunkRecord,
  WebsiteCrawlSession,
};
