/**
 * Pass 2 Phase 1 — persistence package barrel.
 *
 * Entity types, repository interfaces, and the composite Store shape live in
 * ./entities.js. Two factories satisfy Store: createInMemoryStore (./in-memory)
 * and createSqliteStore (./sqlite/repositories). Pass 1 consumers import
 * `InMemoryStore` and `createInMemoryStore`, which remain exported here.
 */

export const PERSISTENCE_PACKAGE = "@workflow/persistence" as const;

export type {
  Case,
  Source,
  Store,
  InMemoryStore,
  CaseConfiguration,
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

export { createInMemoryStore } from "./in-memory.js";
export { createSqliteStore, type SqliteStore } from "./sqlite/repositories.js";
export {
  openDatabase,
  closeDatabase,
  type SqliteDatabase,
} from "./sqlite/database.js";
