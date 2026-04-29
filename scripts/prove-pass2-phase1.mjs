#!/usr/bin/env node
/**
 * Pass 2 Phase 1 proof script.
 *
 * Proves:
 *   1. All 15 Pass 2 contract entities round-trip through `makeValidator<T>`.
 *   2. SQLite store opens, creates schema, and writes one record per entity
 *      via the repository boundary (no raw SQL).
 *   3. After close + reopen, every record reads back deep-equal (restart
 *      persistence — data survives process exit).
 *
 * Not a unit-test framework — this is a single runnable report that prints
 * PASS/FAIL per entity and exits non-zero on any mismatch.
 */
import { existsSync, rmSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  validateCaseConfiguration,
  validateSourceRegistration,
  validateIntakeSourceRecord,
  validateIntakeBatchRecord,
  validateIntakeBatchSummaryItem,
  validateAIIntakeSuggestion,
  validateAdminIntakeDecision,
  validateStructuredContextRecord,
  validateStructuredContextFieldEvidence,
  validateProviderExtractionJob,
  validateContentChunkRecord,
  validateEmbeddingJobRecord,
  validateWebsiteCrawlPlan,
  validateWebsiteCrawlCandidatePage,
  validateWebsiteCrawlApproval,
  validateWebsiteSiteSummary,
  validateFinalPreHierarchyReviewRecord,
} from "@workflow/contracts";
import { createSqliteStore } from "@workflow/persistence";

const DB_PATH = new URL("../data/test-pass2.db", import.meta.url).pathname;

if (existsSync(DB_PATH)) rmSync(DB_PATH);

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const tag = ok ? "PASS" : "FAIL";
  console.log(`  [${tag}] ${name}${detail ? `  — ${detail}` : ""}`);
}

// ---------------------------------------------------------------------------
// Fixtures (all 15 Pass 2 contract entities + the 2 Pass 1 entities)
// ---------------------------------------------------------------------------

const caseConfig = {
  companyId: "company-default-local",
  caseId: "case-001",
  domain: "construction",
  mainDepartment: "operations",
  useCaseLabel: "quotation_preparation",
  companyProfileRef: "companies/acme",
  createdAt: "2026-04-24T00:00:00Z",
};

const caseRecord = { ...caseConfig, state: "created" };

const sourceReg = {
  sourceId: "src-001",
  caseId: "case-001",
  uploaderId: "user-001",
  uploadedAt: "2026-04-24T00:00:00Z",
  intakeType: "uploaded_document",
  timingTag: "uploaded_at_case_setup",
  authority: "company_truth",
  processingStatus: "registered_not_processed",
};

const sourceRecord = { ...sourceReg, registeredAt: "2026-04-24T00:00:00Z" };

const intakeBatch = {
  intakeBatchId: "ib-001",
  caseId: "case-001",
  createdBy: "user-001",
  createdAt: "2026-04-24T00:00:00Z",
  batchStatus: "collecting",
};

const intakeSource = {
  intakeSourceId: "is-001",
  intakeBatchId: "ib-001",
  caseId: "case-001",
  submittedBy: "user-001",
  submittedAt: "2026-04-24T00:00:00Z",
  mode: "file_upload",
  intakeStatus: "registered",
};

const summaryItem = {
  intakeBatchId: "ib-001",
  intakeSourceId: "is-001",
  adminDisposition: "pending",
};

const aiSuggestion = {
  suggestionId: "sug-001",
  intakeSourceId: "is-001",
  caseId: "case-001",
  provider: "openai",
  model: "gpt-4",
  promptVersion: "v1",
  generatedAt: "2026-04-24T00:00:00Z",
};

const adminDecision = {
  decisionId: "dec-001",
  intakeSourceId: "is-001",
  caseId: "case-001",
  decidedBy: "admin-001",
  decidedAt: "2026-04-24T00:00:00Z",
  decision: "accept",
};

const structuredContext = {
  structuredContextId: "sc-001",
  caseId: "case-001",
  version: 1,
  status: "draft",
  fieldCount: 0,
  createdAt: "2026-04-24T00:00:00Z",
  updatedAt: "2026-04-24T00:00:00Z",
};

const fieldEvidence = {
  evidenceId: "ev-001",
  structuredContextId: "sc-001",
  caseId: "case-001",
  fieldKey: "company_name",
  evidenceRefs: ["src-001#p1", "src-001#p2"],
  extractedAt: "2026-04-24T00:00:00Z",
};

const extractionJob = {
  extractionJobId: "pej-001",
  intakeSourceId: "is-001",
  caseId: "case-001",
  provider: "openai",
  jobType: "document_extract",
  status: "queued",
  queuedAt: "2026-04-24T00:00:00Z",
};

const contentChunk = {
  chunkId: "ck-001",
  intakeSourceId: "is-001",
  caseId: "case-001",
  ordinal: 0,
  contentRef: "data/extracted/is-001/0.txt",
  createdAt: "2026-04-24T00:00:00Z",
};

const embeddingJob = {
  embeddingJobId: "ej-001",
  chunkId: "ck-001",
  caseId: "case-001",
  provider: "openai",
  model: "text-embedding-3-small",
  status: "queued",
  queuedAt: "2026-04-24T00:00:00Z",
};

const crawlPlan = {
  crawlPlanId: "cp-001",
  caseId: "case-001",
  seedUrls: ["https://example.com", "https://example.com/about"],
  maxPages: 50,
  maxDepth: 2,
  plannedBy: "user-001",
  plannedAt: "2026-04-24T00:00:00Z",
  status: "draft",
};

const candidatePage = {
  candidatePageId: "cpg-001",
  crawlPlanId: "cp-001",
  url: "https://example.com/pricing",
  depth: 1,
  discoveredAt: "2026-04-24T00:00:00Z",
  status: "discovered",
};

const crawlApproval = {
  approvalId: "app-001",
  crawlPlanId: "cp-001",
  candidatePageId: "cpg-001",
  decidedBy: "admin-001",
  decidedAt: "2026-04-24T00:00:00Z",
  decision: "approve",
};

const siteSummary = {
  siteSummaryId: "ss-001",
  crawlPlanId: "cp-001",
  caseId: "case-001",
  siteRootUrl: "https://example.com",
  totalPagesDiscovered: 10,
  totalPagesApproved: 5,
  totalPagesFetched: 3,
  createdAt: "2026-04-24T00:00:00Z",
};

const finalReview = {
  reviewId: "rev-001",
  caseId: "case-001",
  useCaseLabel: "quotation_preparation",
  status: "draft",
  createdBy: "admin-001",
  createdAt: "2026-04-24T00:00:00Z",
  updatedAt: "2026-04-24T00:00:00Z",
};

// ---------------------------------------------------------------------------
// 1. Validator round-trips (via makeValidator<T>)
// ---------------------------------------------------------------------------

console.log("\n[1/3] Validator round-trips (makeValidator<T>):");
const validatorCases = [
  ["CaseConfiguration", validateCaseConfiguration, caseConfig],
  ["SourceRegistration", validateSourceRegistration, sourceReg],
  ["IntakeSourceRecord", validateIntakeSourceRecord, intakeSource],
  ["IntakeBatchRecord", validateIntakeBatchRecord, intakeBatch],
  ["IntakeBatchSummaryItem", validateIntakeBatchSummaryItem, summaryItem],
  ["AIIntakeSuggestion", validateAIIntakeSuggestion, aiSuggestion],
  ["AdminIntakeDecision", validateAdminIntakeDecision, adminDecision],
  ["StructuredContextRecord", validateStructuredContextRecord, structuredContext],
  [
    "StructuredContextFieldEvidence",
    validateStructuredContextFieldEvidence,
    fieldEvidence,
  ],
  ["ProviderExtractionJob", validateProviderExtractionJob, extractionJob],
  ["ContentChunkRecord", validateContentChunkRecord, contentChunk],
  ["EmbeddingJobRecord", validateEmbeddingJobRecord, embeddingJob],
  ["WebsiteCrawlPlan", validateWebsiteCrawlPlan, crawlPlan],
  ["WebsiteCrawlCandidatePage", validateWebsiteCrawlCandidatePage, candidatePage],
  ["WebsiteCrawlApproval", validateWebsiteCrawlApproval, crawlApproval],
  ["WebsiteSiteSummary", validateWebsiteSiteSummary, siteSummary],
  [
    "FinalPreHierarchyReviewRecord",
    validateFinalPreHierarchyReviewRecord,
    finalReview,
  ],
];

for (const [name, validate, fixture] of validatorCases) {
  const result = validate(fixture);
  record(name, result.ok, result.ok ? null : JSON.stringify(result.errors));
}

// ---------------------------------------------------------------------------
// 2. SQLite write phase
// ---------------------------------------------------------------------------

console.log("\n[2/3] SQLite write phase (opens DB, schema migrates, saves all):");
{
  const store = createSqliteStore(DB_PATH);
  store.cases.save(caseRecord);
  store.sources.save(sourceRecord);
  store.intakeBatches.save(intakeBatch);
  store.intakeSources.save(intakeSource);
  store.intakeBatchSummaryItems.save(summaryItem);
  store.aiIntakeSuggestions.save(aiSuggestion);
  store.adminIntakeDecisions.save(adminDecision);
  store.structuredContexts.save(structuredContext);
  store.structuredContextFieldEvidence.save(fieldEvidence);
  store.providerExtractionJobs.save(extractionJob);
  store.contentChunks.save(contentChunk);
  store.embeddingJobs.save(embeddingJob);
  store.websiteCrawlPlans.save(crawlPlan);
  store.websiteCrawlCandidatePages.save(candidatePage);
  store.websiteCrawlApprovals.save(crawlApproval);
  store.websiteSiteSummaries.save(siteSummary);
  store.finalPreHierarchyReviews.save(finalReview);
  store.close();
  record("all-17-entities-written", true, "close() called");
}

// ---------------------------------------------------------------------------
// 3. Restart — reopen DB in a fresh store and assert data survived
// ---------------------------------------------------------------------------

console.log("\n[3/3] Restart persistence (fresh store on same file):");
{
  const store = createSqliteStore(DB_PATH);

  const checks = [
    ["Case", () => store.cases.findById("case-001"), caseRecord],
    [
      "Source",
      () => store.sources.findByCaseId("case-001")[0],
      sourceRecord,
    ],
    [
      "IntakeBatch",
      () => store.intakeBatches.findById("ib-001"),
      intakeBatch,
    ],
    [
      "IntakeSource",
      () => store.intakeSources.findById("is-001"),
      intakeSource,
    ],
    [
      "IntakeBatchSummaryItem",
      () => store.intakeBatchSummaryItems.findByBatchId("ib-001")[0],
      summaryItem,
    ],
    [
      "AIIntakeSuggestion",
      () => store.aiIntakeSuggestions.findById("sug-001"),
      aiSuggestion,
    ],
    [
      "AdminIntakeDecision",
      () => store.adminIntakeDecisions.findById("dec-001"),
      adminDecision,
    ],
    [
      "StructuredContext",
      () => store.structuredContexts.findById("sc-001"),
      structuredContext,
    ],
    [
      "StructuredContextFieldEvidence",
      () =>
        store.structuredContextFieldEvidence.findByStructuredContextId(
          "sc-001",
        )[0],
      fieldEvidence,
    ],
    [
      "ProviderExtractionJob",
      () => store.providerExtractionJobs.findById("pej-001"),
      extractionJob,
    ],
    [
      "ContentChunk",
      () => store.contentChunks.findById("ck-001"),
      contentChunk,
    ],
    [
      "EmbeddingJob",
      () => store.embeddingJobs.findById("ej-001"),
      embeddingJob,
    ],
    [
      "WebsiteCrawlPlan",
      () => store.websiteCrawlPlans.findById("cp-001"),
      crawlPlan,
    ],
    [
      "WebsiteCrawlCandidatePage",
      () => store.websiteCrawlCandidatePages.findById("cpg-001"),
      candidatePage,
    ],
    [
      "WebsiteCrawlApproval",
      () => store.websiteCrawlApprovals.findById("app-001"),
      crawlApproval,
    ],
    [
      "WebsiteSiteSummary",
      () => store.websiteSiteSummaries.findById("ss-001"),
      siteSummary,
    ],
    [
      "FinalPreHierarchyReview",
      () => store.finalPreHierarchyReviews.findById("rev-001"),
      finalReview,
    ],
  ];

  for (const [name, read, expected] of checks) {
    try {
      const actual = read();
      assert.deepStrictEqual(actual, expected);
      record(name, true, "deepStrictEqual OK");
    } catch (err) {
      record(name, false, err.message.split("\n")[0]);
    }
  }
  store.close();
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const failed = results.filter((r) => !r.ok);
const total = results.length;
const passed = total - failed.length;

console.log(`\n==== Proof summary: ${passed}/${total} checks passed ====`);
if (failed.length > 0) {
  console.error(`\n${failed.length} failure(s):`);
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
console.log("phase_proven");
