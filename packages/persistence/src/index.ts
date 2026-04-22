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
} from "@workflow/contracts";

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
  };
}

// Re-export for use by domain packages without double-importing contracts
export type { CaseConfiguration, ConditionInterpretations, FinalPackageRecord };
