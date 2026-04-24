import type {
  DepartmentFramingRecord,
  FinalPreHierarchyReviewRecord,
  FinalPreHierarchySourceSummaryItem,
  StructuredContextEvidenceKind,
} from "@workflow/contracts";
import type {
  AudioTranscriptReviewRepository,
  ContentChunkRepository,
  DepartmentFramingRepository,
  FinalPreHierarchyReviewRepository,
  IntakeSessionRepository,
  IntakeSourceRepository,
  ProviderExtractionJobRepository,
  StructuredContextRecordRepository,
  WebsiteCrawlPlanRepository,
} from "@workflow/persistence";

export interface FinalPreHierarchyReviewRepos {
  intakeSessions: IntakeSessionRepository;
  intakeSources: IntakeSourceRepository;
  departmentFraming: DepartmentFramingRepository;
  structuredContexts: StructuredContextRecordRepository;
  finalPreHierarchyReviews: FinalPreHierarchyReviewRepository;
  websiteCrawlPlans: WebsiteCrawlPlanRepository;
  audioTranscriptReviews: AudioTranscriptReviewRepository;
  providerJobs: ProviderExtractionJobRepository;
  contentChunks: ContentChunkRepository;
}

export interface FinalPreHierarchyReadiness {
  ready: boolean;
  reasons: string[];
}

function now(): string {
  return new Date().toISOString();
}

function isUseCaseSelected(framing: DepartmentFramingRecord): boolean {
  return (
    (framing.useCaseBoundaryStatus === "use_case_same_as_department" ||
      framing.useCaseBoundaryStatus === "use_case_selected_custom") &&
    Boolean(framing.selectedUseCase?.trim())
  );
}

function sourceSummaryFor(sources: ReturnType<IntakeSourceRepository["findBySessionId"]>): FinalPreHierarchySourceSummaryItem[] {
  const grouped = new Map<string, FinalPreHierarchySourceSummaryItem>();
  for (const source of sources) {
    const key = `${source.bucket}:${source.inputType}`;
    const existing = grouped.get(key) ?? {
      bucket: source.bucket,
      sourceKind: source.inputType,
      count: 0,
      sourceIds: [],
    };
    existing.count += 1;
    existing.sourceIds.push(source.sourceId);
    grouped.set(key, existing);
  }
  return [...grouped.values()].sort((a, b) => `${a.bucket}:${a.sourceKind}`.localeCompare(`${b.bucket}:${b.sourceKind}`));
}

export function evaluateFinalPreHierarchyReadiness(sessionId: string, repos: FinalPreHierarchyReviewRepos): FinalPreHierarchyReadiness {
  const session = repos.intakeSessions.findById(sessionId);
  const framing = repos.departmentFraming.findBySessionId(sessionId);
  const structuredContext = repos.structuredContexts.findBySessionId(sessionId);
  const reasons: string[] = [];

  if (!session) reasons.push(`Intake session not found: ${sessionId}`);
  if (!framing) {
    reasons.push("Primary department and use-case framing has not been saved.");
  } else {
    if (!framing.activeDepartmentLabel.trim()) reasons.push("Primary department is missing.");
    if (!isUseCaseSelected(framing)) reasons.push("Use case must be selected as same-as-department or custom.");
    if (framing.companyContextAvailabilityStatus === "company_context_pending_or_unknown") {
      reasons.push("Company context availability is pending or unknown and must be confirmed before final review.");
    }
    if (framing.departmentContextAvailabilityStatus === "department_context_pending_or_unknown") {
      reasons.push("Department context availability is pending or unknown and must be confirmed before final review.");
    }
  }
  if (!structuredContext?.context) {
    reasons.push("Structured context is missing; generate or save an admin-created structured context before final review.");
  }

  return { ready: reasons.length === 0, reasons };
}

export function getFinalPreHierarchyReview(sessionId: string, repos: FinalPreHierarchyReviewRepos): FinalPreHierarchyReviewRecord | null {
  return repos.finalPreHierarchyReviews.findBySessionId(sessionId);
}

export function createFinalPreHierarchyReview(sessionId: string, repos: FinalPreHierarchyReviewRepos): FinalPreHierarchyReviewRecord {
  const session = repos.intakeSessions.findById(sessionId);
  if (!session) throw new Error(`Intake session not found: ${sessionId}`);

  const framing = repos.departmentFraming.findBySessionId(sessionId);
  const structuredContext = repos.structuredContexts.findBySessionId(sessionId);
  const readiness = evaluateFinalPreHierarchyReadiness(sessionId, repos);
  if (!readiness.ready || !framing || !structuredContext?.context) {
    throw new Error(`Final pre-hierarchy review is blocked: ${readiness.reasons.join(" ")}`);
  }

  const sources = repos.intakeSources.findBySessionId(sessionId);
  const sourceIds = sources.map((source) => source.sourceId);
  const existing = repos.finalPreHierarchyReviews.findBySessionId(sessionId);
  const crawlPlans = repos.websiteCrawlPlans.findBySessionId(sessionId);
  const crawlSucceeded = crawlPlans.some((plan) => plan.status === "completed");
  const hasWebsiteSource = sources.some((source) => source.inputType === "website_url");
  const failedCrawl = crawlPlans.find((plan) => plan.status === "discovery_failed" || plan.status === "crawl_failed");
  const audioReviews = repos.audioTranscriptReviews.findAll().filter((review) => review.sessionId === sessionId);

  const evidenceSummary = Object.entries(structuredContext.context.fieldEvidence ?? {}).map(([fieldKey, evidenceRefs]) => ({
    fieldKey,
    evidenceCount: evidenceRefs.length,
    evidenceKinds: [...new Set(evidenceRefs.map((item) => item.kind))] as StructuredContextEvidenceKind[],
    sourceIds: [...new Set(evidenceRefs.flatMap((item) => item.sourceId ? [item.sourceId] : []))],
  }));

  const unresolvedContextRisks = [
    ...structuredContext.context.keyContextSignalsAndRisks,
    framing.mappingDecision === "unknown" ? "Internal department family mapping remains unknown." : undefined,
    framing.companyContextAvailabilityStatus === "company_context_skipped_by_admin" ? "Company context was skipped by admin." : undefined,
    framing.departmentContextAvailabilityStatus === "department_documents_not_available_confirmed" ? "Department documents were confirmed unavailable." : undefined,
    framing.departmentContextAvailabilityStatus === "department_context_skipped_by_admin" ? "Department context was skipped by admin." : undefined,
  ].filter((item): item is string => Boolean(item));

  const lowConfidenceAudioNotes = audioReviews
    .filter((review) => typeof review.providerConfidence === "number" && review.providerConfidence < 0.5)
    .map((review) => `Audio transcript ${review.reviewId} confidence ${review.providerConfidence}; transcript remains review-sensitive.`);

  const record: FinalPreHierarchyReviewRecord = {
    reviewId: existing?.reviewId ?? `final_pre_hierarchy_${crypto.randomUUID()}`,
    caseId: session.caseId,
    intakeSessionId: session.sessionId,
    createdAt: existing?.createdAt ?? now(),
    updatedAt: now(),
    companyContextAvailabilityStatus: framing.companyContextAvailabilityStatus,
    departmentContextAvailabilityStatus: framing.departmentContextAvailabilityStatus,
    selectedPrimaryDepartment: framing.activeDepartmentLabel,
    customDepartmentLabel: framing.customDepartmentLabel,
    internalDepartmentFamilyMapping: framing.acceptedInternalFamily,
    mappingDecisionStatus: framing.mappingDecision,
    selectedUseCase: framing.selectedUseCase ?? "",
    useCaseBoundaryStatus: framing.useCaseBoundaryStatus,
    useCaseScopeType: framing.useCaseScopeType,
    sourceSummary: sourceSummaryFor(sources),
    batchSummaryRef: `intake-session:${session.sessionId}:batch-summary`,
    sourceIds,
    structuredContextId: structuredContext.structuredContextId,
    structuredContextSummary: {
      companyContextSummary: structuredContext.context.companyContextSummary,
      departmentContextSummary: structuredContext.context.departmentContextSummary,
      selectedUseCase: structuredContext.context.selectedUseCase,
      evidenceFieldCount: evidenceSummary.length,
    },
    evidenceSummary,
    unresolvedContextRisks,
    confidenceAndUnknowns: structuredContext.context.confidenceAndUnknowns,
    crawlRuntimeCaveat: hasWebsiteSource && !crawlSucceeded
      ? failedCrawl?.errorMessage ?? "Crawl4AI runtime success is not proven for this intake; configure CRAWL4AI_URL before relying on crawled site content."
      : undefined,
    audioTranscriptConfidenceNotes: lowConfidenceAudioNotes.length ? lowConfidenceAudioNotes : undefined,
    nextSliceName: "Hierarchy Intake & Approval Build Slice",
    pass2ReadinessStatus: "ready_for_hierarchy_intake",
    adminConfirmationStatus: existing?.adminConfirmationStatus ?? "not_confirmed",
    confirmedBy: existing?.confirmedBy,
    confirmedAt: existing?.confirmedAt,
    adminNote: existing?.adminNote,
  };
  repos.finalPreHierarchyReviews.save(record);
  return record;
}

export function confirmFinalPreHierarchyReview(input: {
  sessionId: string;
  confirmedBy: string;
  adminNote?: string;
}, repos: FinalPreHierarchyReviewRepos): FinalPreHierarchyReviewRecord {
  const existing = repos.finalPreHierarchyReviews.findBySessionId(input.sessionId);
  if (!existing) throw new Error("Final pre-hierarchy review must be generated before confirmation.");

  const record: FinalPreHierarchyReviewRecord = {
    ...existing,
    adminConfirmationStatus: "confirmed",
    confirmedBy: input.confirmedBy.trim() || "admin",
    confirmedAt: now(),
    adminNote: input.adminNote?.trim() || undefined,
    updatedAt: now(),
  };
  repos.finalPreHierarchyReviews.save(record);
  return record;
}
