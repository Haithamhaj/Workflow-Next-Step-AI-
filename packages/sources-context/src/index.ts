/**
 * packages/sources-context — Source intake, registration, timing tags,
 * authority classification, and company context handling.
 *
 * Spec refs: §11.1–11.11, §12.1–12.6
 *
 * Business rules live here. The API route in admin-web calls these functions
 * and passes a SourceRepository obtained from the store singleton.
 */

import { validateSourceRegistration } from "@workflow/contracts";
import type { SourceRegistration } from "@workflow/contracts";
import type { Source, SourceRepository } from "@workflow/persistence";

export const SOURCES_CONTEXT_PACKAGE = "@workflow/sources-context" as const;

// ---------------------------------------------------------------------------
// Re-export authority values so callers need not import contracts directly.
// ---------------------------------------------------------------------------

export type { SourceRegistration } from "@workflow/contracts";
export type {
  SourceIntakeType,
  SourceTimingTag,
  SourceAuthority,
  SourceProcessingStatus,
} from "@workflow/contracts";

// ---------------------------------------------------------------------------
// Pass 2 — Intake & Context Build domain logic
// ---------------------------------------------------------------------------

export {
  createIntakeSession,
  getIntakeSession,
  listIntakeSessionsByCase,
  updateIntakeSessionStatus,
  setStructuredContext,
  setPrimaryDepartment,
  selectUseCase,
} from "./intake-session.js";

export {
  registerIntakeSource,
  getIntakeSource,
  listIntakeSourcesBySession,
  updateIntakeSourceStatus,
  updateIntakeSourceExtractedText,
  buildBatchSummary,
} from "./intake-source.js";

export {
  createCrawlSession,
  getCrawlSession,
  setDiscoveredPages,
  approveCrawlPages,
  setCrawlStatus,
  setSiteSummary,
} from "./intake-crawl.js";

export {
  formStructuredContext,
  parseHierarchyDraft,
} from "./context-formation.js";
export type {
  ContextTransformProvider,
  ContextFormationResult,
  HierarchyDraftResult,
} from "./context-formation.js";

export {
  runProviderExtractionJob,
  runEmbeddingJob,
  runAIIntakeSuggestionJob,
} from "./provider-jobs.js";
export type { ProviderJobRepos } from "./provider-jobs.js";

export {
  createWebsiteCrawlPlan,
  approveWebsiteCrawlPlan,
  runApprovedWebsiteCrawl,
  DEFAULT_WEBSITE_CRAWL_MAX_PAGES,
  WEBSITE_CRAWL_MAX_PAGE_OPTIONS,
} from "./website-crawl-flow.js";
export type { WebsiteCrawlFlowRepos } from "./website-crawl-flow.js";

export {
  getOrCreateAudioTranscriptReview,
  startExternalAudioTranscription,
  saveAudioTranscriptDecision,
} from "./audio-review.js";
export type { AudioTranscriptReviewRepos } from "./audio-review.js";

// ---------------------------------------------------------------------------
// registerSource
// Validates the incoming payload against the SourceRegistration contract,
// then writes a Source record (with registeredAt timestamp) to the repo.
// Returns the persisted Source on success, or throws with a validation message.
// ---------------------------------------------------------------------------

export function registerSource(
  payload: unknown,
  repo: SourceRepository
): Source {
  const result = validateSourceRegistration(payload);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid SourceRegistration: ${messages}`);
  }

  const reg: SourceRegistration = result.value;

  // Duplicate guard — idempotent IDs are not allowed (§11.1)
  const existing = repo.findById(reg.sourceId);
  if (existing !== null) {
    throw new Error(`Source already registered: ${reg.sourceId}`);
  }

  const source: Source = {
    ...reg,
    registeredAt: new Date().toISOString(),
  };

  repo.save(source);
  return source;
}

// ---------------------------------------------------------------------------
// getSource — retrieve a single source by ID
// ---------------------------------------------------------------------------

export function getSource(
  sourceId: string,
  repo: SourceRepository
): Source | null {
  return repo.findById(sourceId);
}

// ---------------------------------------------------------------------------
// listSources — all sources across all cases
// ---------------------------------------------------------------------------

export function listSources(repo: SourceRepository): Source[] {
  return repo.findAll();
}

// ---------------------------------------------------------------------------
// listSourcesByCaseId — sources scoped to one case
// Preserves case-linked source model (§11.2, §11.3)
// ---------------------------------------------------------------------------

export function listSourcesByCaseId(
  caseId: string,
  repo: SourceRepository
): Source[] {
  return repo.findByCaseId(caseId);
}

// ---------------------------------------------------------------------------
// isCompanyTruth / isDomainSupport — authority helpers
// Distinguishes company-truth sources from informational domain-support (§11.10)
// ---------------------------------------------------------------------------

export function isCompanyTruth(source: Source): boolean {
  return source.authority === "company_truth";
}

export function isDomainSupport(source: Source): boolean {
  return source.authority === "informational_domain_support";
}
