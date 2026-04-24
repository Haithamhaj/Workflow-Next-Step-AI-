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
  AudioTranscriptReviewRecord,
  ProviderExtractionJob,
  TextArtifactRecord,
  EmbeddingJobRecord,
  AIIntakeSuggestion,
  AdminIntakeDecision,
  DepartmentFramingRecord,
  FinalPreHierarchyReviewRecord,
  StructuredContextRecord,
  ApprovedHierarchySnapshot,
  HierarchyCorrectionEvent,
  HierarchyDraftRecord,
  HierarchyIntakeRecord,
  HierarchyReadinessSnapshot,
  SourceHierarchyTriageJob,
  SourceHierarchyTriageSuggestion,
  StructuredPromptSpec,
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

export interface StoredAudioTranscriptReviewRecord extends AudioTranscriptReviewRecord {}

export interface StoredProviderExtractionJob extends ProviderExtractionJob {}

export interface StoredTextArtifactRecord extends TextArtifactRecord {}

export interface StoredEmbeddingJobRecord extends EmbeddingJobRecord {}

export interface StoredAIIntakeSuggestion extends AIIntakeSuggestion {}

export interface StoredAdminIntakeDecision extends AdminIntakeDecision {}

export interface StoredDepartmentFramingRecord extends DepartmentFramingRecord {}

export interface StoredStructuredContextRecord extends StructuredContextRecord {}

export interface StoredFinalPreHierarchyReviewRecord extends FinalPreHierarchyReviewRecord {}

export interface StoredHierarchyIntakeRecord extends HierarchyIntakeRecord {}

export interface StoredHierarchyDraftRecord extends HierarchyDraftRecord {}

export interface StoredHierarchyCorrectionEvent extends HierarchyCorrectionEvent {}

export interface StoredApprovedHierarchySnapshot extends ApprovedHierarchySnapshot {}

export interface StoredHierarchyReadinessSnapshot extends HierarchyReadinessSnapshot {}

export interface StoredStructuredPromptSpec extends StructuredPromptSpec {}

export interface StoredSourceHierarchyTriageJob extends SourceHierarchyTriageJob {}

export interface StoredSourceHierarchyTriageSuggestion extends SourceHierarchyTriageSuggestion {}

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

export interface AudioTranscriptReviewRepository {
  save(review: StoredAudioTranscriptReviewRecord): void;
  findById(reviewId: string): StoredAudioTranscriptReviewRecord | null;
  findBySourceId(sourceId: string): StoredAudioTranscriptReviewRecord | null;
  findBySessionId(sessionId: string): StoredAudioTranscriptReviewRecord[];
  findAll(): StoredAudioTranscriptReviewRecord[];
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

export interface AdminIntakeDecisionRepository {
  save(decision: StoredAdminIntakeDecision): void;
  findById(decisionId: string): StoredAdminIntakeDecision | null;
  findBySourceId(sourceId: string): StoredAdminIntakeDecision[];
  findBySessionId(sessionId: string): StoredAdminIntakeDecision[];
  findAll(): StoredAdminIntakeDecision[];
}

export interface DepartmentFramingRepository {
  save(record: StoredDepartmentFramingRecord): void;
  findBySessionId(sessionId: string): StoredDepartmentFramingRecord | null;
  findAll(): StoredDepartmentFramingRecord[];
}

export interface StructuredContextRecordRepository {
  save(record: StoredStructuredContextRecord): void;
  findById(structuredContextId: string): StoredStructuredContextRecord | null;
  findBySessionId(sessionId: string): StoredStructuredContextRecord | null;
  findByCaseId(caseId: string): StoredStructuredContextRecord[];
  findAll(): StoredStructuredContextRecord[];
}

export interface FinalPreHierarchyReviewRepository {
  save(record: StoredFinalPreHierarchyReviewRecord): void;
  findById(reviewId: string): StoredFinalPreHierarchyReviewRecord | null;
  findBySessionId(sessionId: string): StoredFinalPreHierarchyReviewRecord | null;
  findByCaseId(caseId: string): StoredFinalPreHierarchyReviewRecord[];
  findAll(): StoredFinalPreHierarchyReviewRecord[];
}

export interface HierarchyIntakeRepository {
  save(record: StoredHierarchyIntakeRecord): void;
  findById(hierarchyIntakeId: string): StoredHierarchyIntakeRecord | null;
  findBySessionId(sessionId: string): StoredHierarchyIntakeRecord | null;
  findByCaseId(caseId: string): StoredHierarchyIntakeRecord[];
  findAll(): StoredHierarchyIntakeRecord[];
}

export interface HierarchyDraftRepository {
  save(record: StoredHierarchyDraftRecord): void;
  findById(hierarchyDraftId: string): StoredHierarchyDraftRecord | null;
  findBySessionId(sessionId: string): StoredHierarchyDraftRecord | null;
  findByCaseId(caseId: string): StoredHierarchyDraftRecord[];
  findAll(): StoredHierarchyDraftRecord[];
}

export interface HierarchyCorrectionEventRepository {
  save(record: StoredHierarchyCorrectionEvent): void;
  findById(correctionId: string): StoredHierarchyCorrectionEvent | null;
  findBySessionId(sessionId: string): StoredHierarchyCorrectionEvent[];
  findByDraftId(hierarchyDraftId: string): StoredHierarchyCorrectionEvent[];
  findAll(): StoredHierarchyCorrectionEvent[];
}

export interface ApprovedHierarchySnapshotRepository {
  save(record: StoredApprovedHierarchySnapshot): void;
  findById(approvedSnapshotId: string): StoredApprovedHierarchySnapshot | null;
  findBySessionId(sessionId: string): StoredApprovedHierarchySnapshot | null;
  findByCaseId(caseId: string): StoredApprovedHierarchySnapshot[];
  findAll(): StoredApprovedHierarchySnapshot[];
}

export interface HierarchyReadinessSnapshotRepository {
  save(record: StoredHierarchyReadinessSnapshot): void;
  findById(readinessSnapshotId: string): StoredHierarchyReadinessSnapshot | null;
  findBySessionId(sessionId: string): StoredHierarchyReadinessSnapshot | null;
  findByCaseId(caseId: string): StoredHierarchyReadinessSnapshot[];
  findAll(): StoredHierarchyReadinessSnapshot[];
}

export interface StructuredPromptSpecRepository {
  save(record: StoredStructuredPromptSpec): void;
  findById(promptSpecId: string): StoredStructuredPromptSpec | null;
  findByLinkedModule(linkedModule: string): StoredStructuredPromptSpec[];
  findActiveByLinkedModule(linkedModule: string): StoredStructuredPromptSpec | null;
  findAll(): StoredStructuredPromptSpec[];
}

export interface SourceHierarchyTriageJobRepository {
  save(record: StoredSourceHierarchyTriageJob): void;
  findById(triageJobId: string): StoredSourceHierarchyTriageJob | null;
  findBySessionId(sessionId: string): StoredSourceHierarchyTriageJob[];
  findLatestBySessionId(sessionId: string): StoredSourceHierarchyTriageJob | null;
  findAll(): StoredSourceHierarchyTriageJob[];
}

export interface SourceHierarchyTriageSuggestionRepository {
  save(record: StoredSourceHierarchyTriageSuggestion): void;
  findById(triageId: string): StoredSourceHierarchyTriageSuggestion | null;
  findBySessionId(sessionId: string): StoredSourceHierarchyTriageSuggestion[];
  findBySourceId(sourceId: string): StoredSourceHierarchyTriageSuggestion[];
  findAll(): StoredSourceHierarchyTriageSuggestion[];
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

class InMemoryAudioTranscriptReviewRepository implements AudioTranscriptReviewRepository {
  private readonly store = new Map<string, StoredAudioTranscriptReviewRecord>();

  save(review: StoredAudioTranscriptReviewRecord): void {
    this.store.set(review.reviewId, { ...review });
  }

  findById(reviewId: string): StoredAudioTranscriptReviewRecord | null {
    return this.store.get(reviewId) ?? null;
  }

  findBySourceId(sourceId: string): StoredAudioTranscriptReviewRecord | null {
    return Array.from(this.store.values()).find((review) => review.sourceId === sourceId) ?? null;
  }

  findBySessionId(sessionId: string): StoredAudioTranscriptReviewRecord[] {
    return Array.from(this.store.values()).filter((review) => review.sessionId === sessionId);
  }

  findAll(): StoredAudioTranscriptReviewRecord[] {
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

class InMemoryAdminIntakeDecisionRepository implements AdminIntakeDecisionRepository {
  private readonly store = new Map<string, StoredAdminIntakeDecision>();

  save(decision: StoredAdminIntakeDecision): void {
    this.store.set(decision.decisionId, { ...decision });
  }

  findById(decisionId: string): StoredAdminIntakeDecision | null {
    return this.store.get(decisionId) ?? null;
  }

  findBySourceId(sourceId: string): StoredAdminIntakeDecision[] {
    return Array.from(this.store.values()).filter((decision) => decision.intakeSourceId === sourceId);
  }

  findBySessionId(sessionId: string): StoredAdminIntakeDecision[] {
    return Array.from(this.store.values()).filter((decision) => decision.sessionId === sessionId);
  }

  findAll(): StoredAdminIntakeDecision[] {
    return Array.from(this.store.values());
  }
}

class InMemoryDepartmentFramingRepository implements DepartmentFramingRepository {
  private readonly store = new Map<string, StoredDepartmentFramingRecord>();

  save(record: StoredDepartmentFramingRecord): void {
    this.store.set(record.sessionId, { ...record });
  }

  findBySessionId(sessionId: string): StoredDepartmentFramingRecord | null {
    return this.store.get(sessionId) ?? null;
  }

  findAll(): StoredDepartmentFramingRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryStructuredContextRecordRepository implements StructuredContextRecordRepository {
  private readonly store = new Map<string, StoredStructuredContextRecord>();

  save(record: StoredStructuredContextRecord): void {
    this.store.set(record.structuredContextId, { ...record });
  }

  findById(structuredContextId: string): StoredStructuredContextRecord | null {
    return this.store.get(structuredContextId) ?? null;
  }

  findBySessionId(sessionId: string): StoredStructuredContextRecord | null {
    return Array.from(this.store.values()).find((record) => record.sessionId === sessionId) ?? null;
  }

  findByCaseId(caseId: string): StoredStructuredContextRecord[] {
    return Array.from(this.store.values()).filter((record) => record.caseId === caseId);
  }

  findAll(): StoredStructuredContextRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryFinalPreHierarchyReviewRepository implements FinalPreHierarchyReviewRepository {
  private readonly store = new Map<string, StoredFinalPreHierarchyReviewRecord>();

  save(record: StoredFinalPreHierarchyReviewRecord): void {
    this.store.set(record.reviewId, { ...record });
  }

  findById(reviewId: string): StoredFinalPreHierarchyReviewRecord | null {
    return this.store.get(reviewId) ?? null;
  }

  findBySessionId(sessionId: string): StoredFinalPreHierarchyReviewRecord | null {
    return Array.from(this.store.values()).find((record) => record.intakeSessionId === sessionId) ?? null;
  }

  findByCaseId(caseId: string): StoredFinalPreHierarchyReviewRecord[] {
    return Array.from(this.store.values()).filter((record) => record.caseId === caseId);
  }

  findAll(): StoredFinalPreHierarchyReviewRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryHierarchyIntakeRepository implements HierarchyIntakeRepository {
  private readonly store = new Map<string, StoredHierarchyIntakeRecord>();

  save(record: StoredHierarchyIntakeRecord): void {
    this.store.set(record.hierarchyIntakeId, { ...record });
  }

  findById(hierarchyIntakeId: string): StoredHierarchyIntakeRecord | null {
    return this.store.get(hierarchyIntakeId) ?? null;
  }

  findBySessionId(sessionId: string): StoredHierarchyIntakeRecord | null {
    return Array.from(this.store.values()).find((record) => record.sessionId === sessionId) ?? null;
  }

  findByCaseId(caseId: string): StoredHierarchyIntakeRecord[] {
    return Array.from(this.store.values()).filter((record) => record.caseId === caseId);
  }

  findAll(): StoredHierarchyIntakeRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryHierarchyDraftRepository implements HierarchyDraftRepository {
  private readonly store = new Map<string, StoredHierarchyDraftRecord>();

  save(record: StoredHierarchyDraftRecord): void {
    this.store.set(record.hierarchyDraftId, {
      ...record,
      nodes: record.nodes.map((node) => ({ ...node })),
      secondaryRelationships: record.secondaryRelationships.map((relationship) => ({ ...relationship })),
    });
  }

  findById(hierarchyDraftId: string): StoredHierarchyDraftRecord | null {
    return this.store.get(hierarchyDraftId) ?? null;
  }

  findBySessionId(sessionId: string): StoredHierarchyDraftRecord | null {
    return Array.from(this.store.values()).find((record) => record.sessionId === sessionId) ?? null;
  }

  findByCaseId(caseId: string): StoredHierarchyDraftRecord[] {
    return Array.from(this.store.values()).filter((record) => record.caseId === caseId);
  }

  findAll(): StoredHierarchyDraftRecord[] {
    return Array.from(this.store.values());
  }
}

class InMemoryHierarchyCorrectionEventRepository implements HierarchyCorrectionEventRepository {
  private readonly store = new Map<string, StoredHierarchyCorrectionEvent>();

  save(record: StoredHierarchyCorrectionEvent): void {
    this.store.set(record.correctionId, {
      ...record,
      nodes: record.nodes.map((node) => ({ ...node })),
      secondaryRelationships: record.secondaryRelationships.map((relationship) => ({ ...relationship })),
    });
  }

  findById(correctionId: string): StoredHierarchyCorrectionEvent | null {
    return this.store.get(correctionId) ?? null;
  }

  findBySessionId(sessionId: string): StoredHierarchyCorrectionEvent[] {
    return Array.from(this.store.values()).filter((record) => record.sessionId === sessionId);
  }

  findByDraftId(hierarchyDraftId: string): StoredHierarchyCorrectionEvent[] {
    return Array.from(this.store.values()).filter((record) => record.hierarchyDraftId === hierarchyDraftId);
  }

  findAll(): StoredHierarchyCorrectionEvent[] {
    return Array.from(this.store.values());
  }
}

class InMemoryApprovedHierarchySnapshotRepository implements ApprovedHierarchySnapshotRepository {
  private readonly store = new Map<string, StoredApprovedHierarchySnapshot>();

  save(record: StoredApprovedHierarchySnapshot): void {
    if (this.store.has(record.approvedSnapshotId)) return;
    this.store.set(record.approvedSnapshotId, {
      ...record,
      nodes: record.nodes.map((node) => ({ ...node })),
      secondaryRelationships: record.secondaryRelationships.map((relationship) => ({ ...relationship })),
    });
  }

  findById(approvedSnapshotId: string): StoredApprovedHierarchySnapshot | null {
    return this.store.get(approvedSnapshotId) ?? null;
  }

  findBySessionId(sessionId: string): StoredApprovedHierarchySnapshot | null {
    return Array.from(this.store.values()).find((record) => record.sessionId === sessionId) ?? null;
  }

  findByCaseId(caseId: string): StoredApprovedHierarchySnapshot[] {
    return Array.from(this.store.values()).filter((record) => record.caseId === caseId);
  }

  findAll(): StoredApprovedHierarchySnapshot[] {
    return Array.from(this.store.values());
  }
}

class InMemoryHierarchyReadinessSnapshotRepository implements HierarchyReadinessSnapshotRepository {
  private readonly store = new Map<string, StoredHierarchyReadinessSnapshot>();

  save(record: StoredHierarchyReadinessSnapshot): void {
    this.store.set(record.readinessSnapshotId, { ...record, reasons: [...record.reasons] });
  }

  findById(readinessSnapshotId: string): StoredHierarchyReadinessSnapshot | null {
    return this.store.get(readinessSnapshotId) ?? null;
  }

  findBySessionId(sessionId: string): StoredHierarchyReadinessSnapshot | null {
    const records = Array.from(this.store.values()).filter((record) => record.sessionId === sessionId);
    return records[records.length - 1] ?? null;
  }

  findByCaseId(caseId: string): StoredHierarchyReadinessSnapshot[] {
    return Array.from(this.store.values()).filter((record) => record.caseId === caseId);
  }

  findAll(): StoredHierarchyReadinessSnapshot[] {
    return Array.from(this.store.values());
  }
}

class InMemoryStructuredPromptSpecRepository implements StructuredPromptSpecRepository {
  private readonly store = new Map<string, StoredStructuredPromptSpec>();

  save(record: StoredStructuredPromptSpec): void {
    this.store.set(record.promptSpecId, { ...record, blocks: record.blocks.map((block) => ({ ...block })) });
  }

  findById(promptSpecId: string): StoredStructuredPromptSpec | null {
    return this.store.get(promptSpecId) ?? null;
  }

  findByLinkedModule(linkedModule: string): StoredStructuredPromptSpec[] {
    return Array.from(this.store.values()).filter((record) => record.linkedModule === linkedModule);
  }

  findActiveByLinkedModule(linkedModule: string): StoredStructuredPromptSpec | null {
    return this.findByLinkedModule(linkedModule).find((record) => record.status === "active") ?? null;
  }

  findAll(): StoredStructuredPromptSpec[] {
    return Array.from(this.store.values());
  }
}

class InMemorySourceHierarchyTriageJobRepository implements SourceHierarchyTriageJobRepository {
  private readonly store = new Map<string, StoredSourceHierarchyTriageJob>();

  save(record: StoredSourceHierarchyTriageJob): void {
    this.store.set(record.triageJobId, { ...record });
  }

  findById(triageJobId: string): StoredSourceHierarchyTriageJob | null {
    return this.store.get(triageJobId) ?? null;
  }

  findBySessionId(sessionId: string): StoredSourceHierarchyTriageJob[] {
    return Array.from(this.store.values()).filter((record) => record.sessionId === sessionId);
  }

  findLatestBySessionId(sessionId: string): StoredSourceHierarchyTriageJob | null {
    const records = this.findBySessionId(sessionId);
    return records[records.length - 1] ?? null;
  }

  findAll(): StoredSourceHierarchyTriageJob[] {
    return Array.from(this.store.values());
  }
}

class InMemorySourceHierarchyTriageSuggestionRepository implements SourceHierarchyTriageSuggestionRepository {
  private readonly store = new Map<string, StoredSourceHierarchyTriageSuggestion>();

  save(record: StoredSourceHierarchyTriageSuggestion): void {
    this.store.set(record.triageId, { ...record });
  }

  findById(triageId: string): StoredSourceHierarchyTriageSuggestion | null {
    return this.store.get(triageId) ?? null;
  }

  findBySessionId(sessionId: string): StoredSourceHierarchyTriageSuggestion[] {
    return Array.from(this.store.values()).filter((record) => record.sessionId === sessionId);
  }

  findBySourceId(sourceId: string): StoredSourceHierarchyTriageSuggestion[] {
    return Array.from(this.store.values()).filter((record) => record.sourceId === sourceId);
  }

  findAll(): StoredSourceHierarchyTriageSuggestion[] {
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
    CREATE TABLE IF NOT EXISTS admin_intake_decisions (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
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
    CREATE TABLE IF NOT EXISTS audio_transcript_reviews (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS department_framing_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS structured_context_records (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS final_pre_hierarchy_reviews (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hierarchy_intakes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hierarchy_drafts (
      id TEXT PRIMARY KEY,
      intake_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hierarchy_corrections (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS approved_hierarchy_snapshots (
      id TEXT PRIMARY KEY,
      draft_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hierarchy_readiness_snapshots (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS structured_prompt_specs (
      id TEXT PRIMARY KEY,
      linked_module TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS source_hierarchy_triage_jobs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS source_hierarchy_triage_suggestions (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_provider_jobs_source_id ON provider_extraction_jobs(source_id);
    CREATE INDEX IF NOT EXISTS idx_provider_jobs_session_id ON provider_extraction_jobs(session_id);
    CREATE INDEX IF NOT EXISTS idx_text_artifacts_source_id ON text_artifacts(source_id);
    CREATE INDEX IF NOT EXISTS idx_embedding_jobs_source_id ON embedding_jobs(source_id);
    CREATE INDEX IF NOT EXISTS idx_ai_suggestions_source_id ON ai_intake_suggestions(source_id);
    CREATE INDEX IF NOT EXISTS idx_ai_suggestions_session_id ON ai_intake_suggestions(session_id);
    CREATE INDEX IF NOT EXISTS idx_admin_decisions_source_id ON admin_intake_decisions(source_id);
    CREATE INDEX IF NOT EXISTS idx_admin_decisions_session_id ON admin_intake_decisions(session_id);
    CREATE INDEX IF NOT EXISTS idx_admin_decisions_case_id ON admin_intake_decisions(case_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_plans_source_id ON website_crawl_plans(source_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_plans_session_id ON website_crawl_plans(session_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_approvals_plan_id ON website_crawl_approvals(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_crawled_pages_plan_id ON crawled_page_contents(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_crawled_pages_source_id ON crawled_page_contents(source_id);
    CREATE INDEX IF NOT EXISTS idx_crawl_summaries_plan_id ON website_crawl_site_summaries(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_content_chunks_plan_id ON content_chunks(crawl_plan_id);
    CREATE INDEX IF NOT EXISTS idx_content_chunks_page_id ON content_chunks(page_content_id);
    CREATE INDEX IF NOT EXISTS idx_content_chunks_source_id ON content_chunks(source_id);
    CREATE INDEX IF NOT EXISTS idx_audio_transcript_reviews_source_id ON audio_transcript_reviews(source_id);
    CREATE INDEX IF NOT EXISTS idx_audio_transcript_reviews_session_id ON audio_transcript_reviews(session_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_department_framing_session_id ON department_framing_records(session_id);
    CREATE INDEX IF NOT EXISTS idx_structured_context_session_id ON structured_context_records(session_id);
    CREATE INDEX IF NOT EXISTS idx_structured_context_case_id ON structured_context_records(case_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_final_pre_hierarchy_reviews_session_id ON final_pre_hierarchy_reviews(session_id);
    CREATE INDEX IF NOT EXISTS idx_final_pre_hierarchy_reviews_case_id ON final_pre_hierarchy_reviews(case_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hierarchy_intakes_session_id ON hierarchy_intakes(session_id);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_intakes_case_id ON hierarchy_intakes(case_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hierarchy_drafts_session_id ON hierarchy_drafts(session_id);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_drafts_case_id ON hierarchy_drafts(case_id);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_corrections_session_id ON hierarchy_corrections(session_id);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_corrections_draft_id ON hierarchy_corrections(draft_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_approved_hierarchy_session_id ON approved_hierarchy_snapshots(session_id);
    CREATE INDEX IF NOT EXISTS idx_approved_hierarchy_case_id ON approved_hierarchy_snapshots(case_id);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_readiness_session_id ON hierarchy_readiness_snapshots(session_id);
    CREATE INDEX IF NOT EXISTS idx_hierarchy_readiness_case_id ON hierarchy_readiness_snapshots(case_id);
    CREATE INDEX IF NOT EXISTS idx_prompt_specs_linked_module ON structured_prompt_specs(linked_module);
    CREATE INDEX IF NOT EXISTS idx_prompt_specs_status ON structured_prompt_specs(status);
    CREATE INDEX IF NOT EXISTS idx_source_hierarchy_triage_jobs_session_id ON source_hierarchy_triage_jobs(session_id);
    CREATE INDEX IF NOT EXISTS idx_source_hierarchy_triage_suggestions_source_id ON source_hierarchy_triage_suggestions(source_id);
    CREATE INDEX IF NOT EXISTS idx_source_hierarchy_triage_suggestions_session_id ON source_hierarchy_triage_suggestions(session_id);
    CREATE INDEX IF NOT EXISTS idx_source_hierarchy_triage_suggestions_case_id ON source_hierarchy_triage_suggestions(case_id);
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

export class SQLiteAdminIntakeDecisionRepository implements AdminIntakeDecisionRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(decision: StoredAdminIntakeDecision): void {
    this.db.prepare(
      "INSERT INTO admin_intake_decisions (id, source_id, session_id, case_id, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(decision.decisionId, decision.intakeSourceId, decision.sessionId, decision.caseId, JSON.stringify(decision));
  }

  findById(decisionId: string): StoredAdminIntakeDecision | null {
    const row = this.db.prepare("SELECT payload FROM admin_intake_decisions WHERE id = ?").get(decisionId);
    return parseStored<StoredAdminIntakeDecision>(row);
  }

  findBySourceId(sourceId: string): StoredAdminIntakeDecision[] {
    const rows = this.db.prepare("SELECT payload FROM admin_intake_decisions WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredAdminIntakeDecision>(rows);
  }

  findBySessionId(sessionId: string): StoredAdminIntakeDecision[] {
    const rows = this.db.prepare("SELECT payload FROM admin_intake_decisions WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredAdminIntakeDecision>(rows);
  }

  findAll(): StoredAdminIntakeDecision[] {
    const rows = this.db.prepare("SELECT payload FROM admin_intake_decisions ORDER BY id").all();
    return parseStoredList<StoredAdminIntakeDecision>(rows);
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

export class SQLiteAudioTranscriptReviewRepository implements AudioTranscriptReviewRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(review: StoredAudioTranscriptReviewRecord): void {
    this.db.prepare(
      "INSERT INTO audio_transcript_reviews (id, source_id, session_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, session_id = excluded.session_id, payload = excluded.payload",
    ).run(review.reviewId, review.sourceId, review.sessionId, JSON.stringify(review));
  }

  findById(reviewId: string): StoredAudioTranscriptReviewRecord | null {
    const row = this.db.prepare("SELECT payload FROM audio_transcript_reviews WHERE id = ?").get(reviewId);
    return parseStored<StoredAudioTranscriptReviewRecord>(row);
  }

  findBySourceId(sourceId: string): StoredAudioTranscriptReviewRecord | null {
    const row = this.db.prepare("SELECT payload FROM audio_transcript_reviews WHERE source_id = ? ORDER BY id DESC LIMIT 1").get(sourceId);
    return parseStored<StoredAudioTranscriptReviewRecord>(row);
  }

  findBySessionId(sessionId: string): StoredAudioTranscriptReviewRecord[] {
    const rows = this.db.prepare("SELECT payload FROM audio_transcript_reviews WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredAudioTranscriptReviewRecord>(rows);
  }

  findAll(): StoredAudioTranscriptReviewRecord[] {
    const rows = this.db.prepare("SELECT payload FROM audio_transcript_reviews ORDER BY id").all();
    return parseStoredList<StoredAudioTranscriptReviewRecord>(rows);
  }
}

export class SQLiteDepartmentFramingRepository implements DepartmentFramingRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredDepartmentFramingRecord): void {
    this.db.prepare(
      "INSERT INTO department_framing_records (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.framingId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findBySessionId(sessionId: string): StoredDepartmentFramingRecord | null {
    const row = this.db.prepare("SELECT payload FROM department_framing_records WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredDepartmentFramingRecord>(row);
  }

  findAll(): StoredDepartmentFramingRecord[] {
    const rows = this.db.prepare("SELECT payload FROM department_framing_records ORDER BY id").all();
    return parseStoredList<StoredDepartmentFramingRecord>(rows);
  }
}

export class SQLiteStructuredContextRecordRepository implements StructuredContextRecordRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredStructuredContextRecord): void {
    this.db.prepare(
      "INSERT INTO structured_context_records (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.structuredContextId, record.sessionId ?? "", record.caseId, JSON.stringify(record));
  }

  findById(structuredContextId: string): StoredStructuredContextRecord | null {
    const row = this.db.prepare("SELECT payload FROM structured_context_records WHERE id = ?").get(structuredContextId);
    return parseStored<StoredStructuredContextRecord>(row);
  }

  findBySessionId(sessionId: string): StoredStructuredContextRecord | null {
    const row = this.db.prepare("SELECT payload FROM structured_context_records WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredStructuredContextRecord>(row);
  }

  findByCaseId(caseId: string): StoredStructuredContextRecord[] {
    const rows = this.db.prepare("SELECT payload FROM structured_context_records WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredStructuredContextRecord>(rows);
  }

  findAll(): StoredStructuredContextRecord[] {
    const rows = this.db.prepare("SELECT payload FROM structured_context_records ORDER BY id").all();
    return parseStoredList<StoredStructuredContextRecord>(rows);
  }
}

export class SQLiteFinalPreHierarchyReviewRepository implements FinalPreHierarchyReviewRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredFinalPreHierarchyReviewRecord): void {
    this.db.prepare(
      "INSERT INTO final_pre_hierarchy_reviews (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.reviewId, record.intakeSessionId, record.caseId, JSON.stringify(record));
  }

  findById(reviewId: string): StoredFinalPreHierarchyReviewRecord | null {
    const row = this.db.prepare("SELECT payload FROM final_pre_hierarchy_reviews WHERE id = ?").get(reviewId);
    return parseStored<StoredFinalPreHierarchyReviewRecord>(row);
  }

  findBySessionId(sessionId: string): StoredFinalPreHierarchyReviewRecord | null {
    const row = this.db.prepare("SELECT payload FROM final_pre_hierarchy_reviews WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredFinalPreHierarchyReviewRecord>(row);
  }

  findByCaseId(caseId: string): StoredFinalPreHierarchyReviewRecord[] {
    const rows = this.db.prepare("SELECT payload FROM final_pre_hierarchy_reviews WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredFinalPreHierarchyReviewRecord>(rows);
  }

  findAll(): StoredFinalPreHierarchyReviewRecord[] {
    const rows = this.db.prepare("SELECT payload FROM final_pre_hierarchy_reviews ORDER BY id").all();
    return parseStoredList<StoredFinalPreHierarchyReviewRecord>(rows);
  }
}

export class SQLiteHierarchyIntakeRepository implements HierarchyIntakeRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredHierarchyIntakeRecord): void {
    this.db.prepare(
      "INSERT INTO hierarchy_intakes (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.hierarchyIntakeId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(hierarchyIntakeId: string): StoredHierarchyIntakeRecord | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_intakes WHERE id = ?").get(hierarchyIntakeId);
    return parseStored<StoredHierarchyIntakeRecord>(row);
  }

  findBySessionId(sessionId: string): StoredHierarchyIntakeRecord | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_intakes WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredHierarchyIntakeRecord>(row);
  }

  findByCaseId(caseId: string): StoredHierarchyIntakeRecord[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_intakes WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredHierarchyIntakeRecord>(rows);
  }

  findAll(): StoredHierarchyIntakeRecord[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_intakes ORDER BY id").all();
    return parseStoredList<StoredHierarchyIntakeRecord>(rows);
  }
}

export class SQLiteHierarchyDraftRepository implements HierarchyDraftRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredHierarchyDraftRecord): void {
    this.db.prepare(
      "INSERT INTO hierarchy_drafts (id, intake_id, session_id, case_id, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET intake_id = excluded.intake_id, session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.hierarchyDraftId, record.hierarchyIntakeId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(hierarchyDraftId: string): StoredHierarchyDraftRecord | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_drafts WHERE id = ?").get(hierarchyDraftId);
    return parseStored<StoredHierarchyDraftRecord>(row);
  }

  findBySessionId(sessionId: string): StoredHierarchyDraftRecord | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_drafts WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredHierarchyDraftRecord>(row);
  }

  findByCaseId(caseId: string): StoredHierarchyDraftRecord[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_drafts WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredHierarchyDraftRecord>(rows);
  }

  findAll(): StoredHierarchyDraftRecord[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_drafts ORDER BY id").all();
    return parseStoredList<StoredHierarchyDraftRecord>(rows);
  }
}

export class SQLiteHierarchyCorrectionEventRepository implements HierarchyCorrectionEventRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredHierarchyCorrectionEvent): void {
    this.db.prepare(
      "INSERT INTO hierarchy_corrections (id, draft_id, session_id, case_id, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET draft_id = excluded.draft_id, session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.correctionId, record.hierarchyDraftId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(correctionId: string): StoredHierarchyCorrectionEvent | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_corrections WHERE id = ?").get(correctionId);
    return parseStored<StoredHierarchyCorrectionEvent>(row);
  }

  findBySessionId(sessionId: string): StoredHierarchyCorrectionEvent[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_corrections WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredHierarchyCorrectionEvent>(rows);
  }

  findByDraftId(hierarchyDraftId: string): StoredHierarchyCorrectionEvent[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_corrections WHERE draft_id = ? ORDER BY id").all(hierarchyDraftId);
    return parseStoredList<StoredHierarchyCorrectionEvent>(rows);
  }

  findAll(): StoredHierarchyCorrectionEvent[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_corrections ORDER BY id").all();
    return parseStoredList<StoredHierarchyCorrectionEvent>(rows);
  }
}

export class SQLiteApprovedHierarchySnapshotRepository implements ApprovedHierarchySnapshotRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredApprovedHierarchySnapshot): void {
    this.db.prepare(
      "INSERT INTO approved_hierarchy_snapshots (id, draft_id, session_id, case_id, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING",
    ).run(record.approvedSnapshotId, record.hierarchyDraftId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(approvedSnapshotId: string): StoredApprovedHierarchySnapshot | null {
    const row = this.db.prepare("SELECT payload FROM approved_hierarchy_snapshots WHERE id = ?").get(approvedSnapshotId);
    return parseStored<StoredApprovedHierarchySnapshot>(row);
  }

  findBySessionId(sessionId: string): StoredApprovedHierarchySnapshot | null {
    const row = this.db.prepare("SELECT payload FROM approved_hierarchy_snapshots WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredApprovedHierarchySnapshot>(row);
  }

  findByCaseId(caseId: string): StoredApprovedHierarchySnapshot[] {
    const rows = this.db.prepare("SELECT payload FROM approved_hierarchy_snapshots WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredApprovedHierarchySnapshot>(rows);
  }

  findAll(): StoredApprovedHierarchySnapshot[] {
    const rows = this.db.prepare("SELECT payload FROM approved_hierarchy_snapshots ORDER BY id").all();
    return parseStoredList<StoredApprovedHierarchySnapshot>(rows);
  }
}

export class SQLiteHierarchyReadinessSnapshotRepository implements HierarchyReadinessSnapshotRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredHierarchyReadinessSnapshot): void {
    this.db.prepare(
      "INSERT INTO hierarchy_readiness_snapshots (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.readinessSnapshotId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(readinessSnapshotId: string): StoredHierarchyReadinessSnapshot | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_readiness_snapshots WHERE id = ?").get(readinessSnapshotId);
    return parseStored<StoredHierarchyReadinessSnapshot>(row);
  }

  findBySessionId(sessionId: string): StoredHierarchyReadinessSnapshot | null {
    const row = this.db.prepare("SELECT payload FROM hierarchy_readiness_snapshots WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredHierarchyReadinessSnapshot>(row);
  }

  findByCaseId(caseId: string): StoredHierarchyReadinessSnapshot[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_readiness_snapshots WHERE case_id = ? ORDER BY id").all(caseId);
    return parseStoredList<StoredHierarchyReadinessSnapshot>(rows);
  }

  findAll(): StoredHierarchyReadinessSnapshot[] {
    const rows = this.db.prepare("SELECT payload FROM hierarchy_readiness_snapshots ORDER BY id").all();
    return parseStoredList<StoredHierarchyReadinessSnapshot>(rows);
  }
}

export class SQLiteStructuredPromptSpecRepository implements StructuredPromptSpecRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredStructuredPromptSpec): void {
    this.db.prepare(
      "INSERT INTO structured_prompt_specs (id, linked_module, status, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET linked_module = excluded.linked_module, status = excluded.status, payload = excluded.payload",
    ).run(record.promptSpecId, record.linkedModule, record.status, JSON.stringify(record));
  }

  findById(promptSpecId: string): StoredStructuredPromptSpec | null {
    const row = this.db.prepare("SELECT payload FROM structured_prompt_specs WHERE id = ?").get(promptSpecId);
    return parseStored<StoredStructuredPromptSpec>(row);
  }

  findByLinkedModule(linkedModule: string): StoredStructuredPromptSpec[] {
    const rows = this.db.prepare("SELECT payload FROM structured_prompt_specs WHERE linked_module = ? ORDER BY id").all(linkedModule);
    return parseStoredList<StoredStructuredPromptSpec>(rows);
  }

  findActiveByLinkedModule(linkedModule: string): StoredStructuredPromptSpec | null {
    const row = this.db.prepare("SELECT payload FROM structured_prompt_specs WHERE linked_module = ? AND status = 'active' ORDER BY id DESC LIMIT 1").get(linkedModule);
    return parseStored<StoredStructuredPromptSpec>(row);
  }

  findAll(): StoredStructuredPromptSpec[] {
    const rows = this.db.prepare("SELECT payload FROM structured_prompt_specs ORDER BY id").all();
    return parseStoredList<StoredStructuredPromptSpec>(rows);
  }
}

export class SQLiteSourceHierarchyTriageJobRepository implements SourceHierarchyTriageJobRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredSourceHierarchyTriageJob): void {
    this.db.prepare(
      "INSERT INTO source_hierarchy_triage_jobs (id, session_id, case_id, payload) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.triageJobId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(triageJobId: string): StoredSourceHierarchyTriageJob | null {
    const row = this.db.prepare("SELECT payload FROM source_hierarchy_triage_jobs WHERE id = ?").get(triageJobId);
    return parseStored<StoredSourceHierarchyTriageJob>(row);
  }

  findBySessionId(sessionId: string): StoredSourceHierarchyTriageJob[] {
    const rows = this.db.prepare("SELECT payload FROM source_hierarchy_triage_jobs WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredSourceHierarchyTriageJob>(rows);
  }

  findLatestBySessionId(sessionId: string): StoredSourceHierarchyTriageJob | null {
    const row = this.db.prepare("SELECT payload FROM source_hierarchy_triage_jobs WHERE session_id = ? ORDER BY id DESC LIMIT 1").get(sessionId);
    return parseStored<StoredSourceHierarchyTriageJob>(row);
  }

  findAll(): StoredSourceHierarchyTriageJob[] {
    const rows = this.db.prepare("SELECT payload FROM source_hierarchy_triage_jobs ORDER BY id").all();
    return parseStoredList<StoredSourceHierarchyTriageJob>(rows);
  }
}

export class SQLiteSourceHierarchyTriageSuggestionRepository implements SourceHierarchyTriageSuggestionRepository {
  private readonly db: DatabaseSync;

  constructor(dbPath?: string) {
    this.db = openIntakeDatabase(dbPath);
  }

  save(record: StoredSourceHierarchyTriageSuggestion): void {
    this.db.prepare(
      "INSERT INTO source_hierarchy_triage_suggestions (id, source_id, session_id, case_id, payload) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET source_id = excluded.source_id, session_id = excluded.session_id, case_id = excluded.case_id, payload = excluded.payload",
    ).run(record.triageId, record.sourceId, record.sessionId, record.caseId, JSON.stringify(record));
  }

  findById(triageId: string): StoredSourceHierarchyTriageSuggestion | null {
    const row = this.db.prepare("SELECT payload FROM source_hierarchy_triage_suggestions WHERE id = ?").get(triageId);
    return parseStored<StoredSourceHierarchyTriageSuggestion>(row);
  }

  findBySessionId(sessionId: string): StoredSourceHierarchyTriageSuggestion[] {
    const rows = this.db.prepare("SELECT payload FROM source_hierarchy_triage_suggestions WHERE session_id = ? ORDER BY id").all(sessionId);
    return parseStoredList<StoredSourceHierarchyTriageSuggestion>(rows);
  }

  findBySourceId(sourceId: string): StoredSourceHierarchyTriageSuggestion[] {
    const rows = this.db.prepare("SELECT payload FROM source_hierarchy_triage_suggestions WHERE source_id = ? ORDER BY id").all(sourceId);
    return parseStoredList<StoredSourceHierarchyTriageSuggestion>(rows);
  }

  findAll(): StoredSourceHierarchyTriageSuggestion[] {
    const rows = this.db.prepare("SELECT payload FROM source_hierarchy_triage_suggestions ORDER BY id").all();
    return parseStoredList<StoredSourceHierarchyTriageSuggestion>(rows);
  }
}

export function createSQLiteIntakeRepositories(dbPath?: string): {
  intakeSessions: IntakeSessionRepository;
  intakeSources: IntakeSourceRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  adminIntakeDecisions: AdminIntakeDecisionRepository;
  websiteCrawlPlans: WebsiteCrawlPlanRepository;
  websiteCrawlApprovals: WebsiteCrawlApprovalRepository;
  crawledPageContents: CrawledPageContentRepository;
  websiteCrawlSiteSummaries: WebsiteCrawlSiteSummaryRepository;
  contentChunks: ContentChunkRepository;
  audioTranscriptReviews: AudioTranscriptReviewRepository;
  departmentFraming: DepartmentFramingRepository;
  structuredContexts: StructuredContextRecordRepository;
  finalPreHierarchyReviews: FinalPreHierarchyReviewRepository;
  hierarchyIntakes: HierarchyIntakeRepository;
  hierarchyDrafts: HierarchyDraftRepository;
  hierarchyCorrections: HierarchyCorrectionEventRepository;
  approvedHierarchySnapshots: ApprovedHierarchySnapshotRepository;
  hierarchyReadinessSnapshots: HierarchyReadinessSnapshotRepository;
  structuredPromptSpecs: StructuredPromptSpecRepository;
  sourceHierarchyTriageJobs: SourceHierarchyTriageJobRepository;
  sourceHierarchyTriageSuggestions: SourceHierarchyTriageSuggestionRepository;
} {
  return {
    intakeSessions: new SQLiteIntakeSessionRepository(dbPath),
    intakeSources: new SQLiteIntakeSourceRepository(dbPath),
    providerJobs: new SQLiteProviderExtractionJobRepository(dbPath),
    textArtifacts: new SQLiteTextArtifactRepository(dbPath),
    embeddingJobs: new SQLiteEmbeddingJobRepository(dbPath),
    aiIntakeSuggestions: new SQLiteAIIntakeSuggestionRepository(dbPath),
    adminIntakeDecisions: new SQLiteAdminIntakeDecisionRepository(dbPath),
    websiteCrawlPlans: new SQLiteWebsiteCrawlPlanRepository(dbPath),
    websiteCrawlApprovals: new SQLiteWebsiteCrawlApprovalRepository(dbPath),
    crawledPageContents: new SQLiteCrawledPageContentRepository(dbPath),
    websiteCrawlSiteSummaries: new SQLiteWebsiteCrawlSiteSummaryRepository(dbPath),
    contentChunks: new SQLiteContentChunkRepository(dbPath),
    audioTranscriptReviews: new SQLiteAudioTranscriptReviewRepository(dbPath),
    departmentFraming: new SQLiteDepartmentFramingRepository(dbPath),
    structuredContexts: new SQLiteStructuredContextRecordRepository(dbPath),
    finalPreHierarchyReviews: new SQLiteFinalPreHierarchyReviewRepository(dbPath),
    hierarchyIntakes: new SQLiteHierarchyIntakeRepository(dbPath),
    hierarchyDrafts: new SQLiteHierarchyDraftRepository(dbPath),
    hierarchyCorrections: new SQLiteHierarchyCorrectionEventRepository(dbPath),
    approvedHierarchySnapshots: new SQLiteApprovedHierarchySnapshotRepository(dbPath),
    hierarchyReadinessSnapshots: new SQLiteHierarchyReadinessSnapshotRepository(dbPath),
    structuredPromptSpecs: new SQLiteStructuredPromptSpecRepository(dbPath),
    sourceHierarchyTriageJobs: new SQLiteSourceHierarchyTriageJobRepository(dbPath),
    sourceHierarchyTriageSuggestions: new SQLiteSourceHierarchyTriageSuggestionRepository(dbPath),
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
  audioTranscriptReviews: AudioTranscriptReviewRepository;
  providerJobs: ProviderExtractionJobRepository;
  textArtifacts: TextArtifactRepository;
  embeddingJobs: EmbeddingJobRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  adminIntakeDecisions: AdminIntakeDecisionRepository;
  departmentFraming: DepartmentFramingRepository;
  structuredContexts: StructuredContextRecordRepository;
  finalPreHierarchyReviews: FinalPreHierarchyReviewRepository;
  hierarchyIntakes: HierarchyIntakeRepository;
  hierarchyDrafts: HierarchyDraftRepository;
  hierarchyCorrections: HierarchyCorrectionEventRepository;
  approvedHierarchySnapshots: ApprovedHierarchySnapshotRepository;
  hierarchyReadinessSnapshots: HierarchyReadinessSnapshotRepository;
  structuredPromptSpecs: StructuredPromptSpecRepository;
  sourceHierarchyTriageJobs: SourceHierarchyTriageJobRepository;
  sourceHierarchyTriageSuggestions: SourceHierarchyTriageSuggestionRepository;
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
    audioTranscriptReviews: new InMemoryAudioTranscriptReviewRepository(),
    providerJobs: new InMemoryProviderExtractionJobRepository(),
    textArtifacts: new InMemoryTextArtifactRepository(),
    embeddingJobs: new InMemoryEmbeddingJobRepository(),
    aiIntakeSuggestions: new InMemoryAIIntakeSuggestionRepository(),
    adminIntakeDecisions: new InMemoryAdminIntakeDecisionRepository(),
    departmentFraming: new InMemoryDepartmentFramingRepository(),
    structuredContexts: new InMemoryStructuredContextRecordRepository(),
    finalPreHierarchyReviews: new InMemoryFinalPreHierarchyReviewRepository(),
    hierarchyIntakes: new InMemoryHierarchyIntakeRepository(),
    hierarchyDrafts: new InMemoryHierarchyDraftRepository(),
    hierarchyCorrections: new InMemoryHierarchyCorrectionEventRepository(),
    approvedHierarchySnapshots: new InMemoryApprovedHierarchySnapshotRepository(),
    hierarchyReadinessSnapshots: new InMemoryHierarchyReadinessSnapshotRepository(),
    structuredPromptSpecs: new InMemoryStructuredPromptSpecRepository(),
    sourceHierarchyTriageJobs: new InMemorySourceHierarchyTriageJobRepository(),
    sourceHierarchyTriageSuggestions: new InMemorySourceHierarchyTriageSuggestionRepository(),
    fileStore: new Map(),
  };
}

// Re-export for use by domain packages without double-importing contracts
export type {
  AIIntakeSuggestion,
  AdminIntakeDecision,
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
  AudioTranscriptReviewRecord,
  ApprovedHierarchySnapshot,
  HierarchyCorrectionEvent,
  HierarchyDraftRecord,
  HierarchyIntakeRecord,
  HierarchyReadinessSnapshot,
  SourceHierarchyTriageJob,
  SourceHierarchyTriageSuggestion,
  StructuredPromptSpec,
  WebsiteCrawlSession,
};
