/**
 * Pass 2 Phase 1 — SQLite DDL.
 *
 * Migration versioning: each migration is applied inside a transaction and
 * its number is stored in `_migrations`. Reset path: delete the DB file; next
 * open() will re-run from version 0.
 *
 * Column names mirror the contract field names 1:1 so repositories can map
 * rows with Object.fromEntries rather than per-field translation. JSON-shaped
 * columns (string[] like seedUrls and evidenceRefs) are TEXT and encoded with
 * JSON.stringify/parse at the repository boundary. Enums are TEXT so values
 * match the contract literals 1:1.
 */

export interface Migration {
  version: number;
  up: string;
}

export const MIGRATIONS: ReadonlyArray<Migration> = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS cases (
        caseId TEXT PRIMARY KEY,
        domain TEXT NOT NULL,
        mainDepartment TEXT NOT NULL,
        subDepartment TEXT,
        useCaseLabel TEXT NOT NULL,
        companyProfileRef TEXT NOT NULL,
        operatorNotes TEXT,
        createdAt TEXT NOT NULL,
        state TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sources (
        sourceId TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        uploaderId TEXT NOT NULL,
        uploadedAt TEXT NOT NULL,
        displayName TEXT,
        intakeType TEXT NOT NULL,
        timingTag TEXT NOT NULL,
        authority TEXT NOT NULL,
        processingStatus TEXT NOT NULL,
        notes TEXT,
        registeredAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sources_caseId ON sources(caseId);

      CREATE TABLE IF NOT EXISTS intake_sources (
        intakeSourceId TEXT PRIMARY KEY,
        intakeBatchId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        submittedBy TEXT NOT NULL,
        submittedAt TEXT NOT NULL,
        mode TEXT NOT NULL,
        displayName TEXT,
        sourceUrl TEXT,
        mimeType TEXT,
        sizeBytes INTEGER,
        storageRef TEXT,
        contentRef TEXT,
        intakeStatus TEXT NOT NULL,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_intake_sources_batch ON intake_sources(intakeBatchId);
      CREATE INDEX IF NOT EXISTS idx_intake_sources_case ON intake_sources(caseId);

      CREATE TABLE IF NOT EXISTS intake_batches (
        intakeBatchId TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        batchStatus TEXT NOT NULL,
        label TEXT,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_intake_batches_case ON intake_batches(caseId);

      CREATE TABLE IF NOT EXISTS intake_batch_summary_items (
        rowId INTEGER PRIMARY KEY AUTOINCREMENT,
        intakeBatchId TEXT NOT NULL,
        intakeSourceId TEXT NOT NULL,
        suggestedRole TEXT,
        suggestedAuthority TEXT,
        summary TEXT,
        confidenceScore REAL,
        adminDisposition TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_intake_batch_summary_batch
        ON intake_batch_summary_items(intakeBatchId);

      CREATE TABLE IF NOT EXISTS ai_intake_suggestions (
        suggestionId TEXT PRIMARY KEY,
        intakeSourceId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        promptVersion TEXT NOT NULL,
        generatedAt TEXT NOT NULL,
        suggestedIntakeType TEXT,
        suggestedAuthority TEXT,
        suggestedTimingTag TEXT,
        suggestedRole TEXT,
        rationale TEXT,
        confidenceScore REAL,
        rawJsonRef TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_ai_intake_suggestions_intakeSource
        ON ai_intake_suggestions(intakeSourceId);

      CREATE TABLE IF NOT EXISTS admin_intake_decisions (
        decisionId TEXT PRIMARY KEY,
        intakeSourceId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        decidedBy TEXT NOT NULL,
        decidedAt TEXT NOT NULL,
        decision TEXT NOT NULL,
        finalIntakeType TEXT,
        finalAuthority TEXT,
        finalTimingTag TEXT,
        reason TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_admin_intake_decisions_intakeSource
        ON admin_intake_decisions(intakeSourceId);

      CREATE TABLE IF NOT EXISTS structured_contexts (
        structuredContextId TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        version INTEGER NOT NULL,
        status TEXT NOT NULL,
        fieldCount INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_structured_contexts_case
        ON structured_contexts(caseId);

      CREATE TABLE IF NOT EXISTS structured_context_field_evidence (
        evidenceId TEXT PRIMARY KEY,
        structuredContextId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        fieldKey TEXT NOT NULL,
        fieldValue TEXT,
        evidenceRefs TEXT NOT NULL,
        confidence REAL,
        extractedAt TEXT NOT NULL,
        sourceProvider TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_scfe_context
        ON structured_context_field_evidence(structuredContextId);

      CREATE TABLE IF NOT EXISTS provider_extraction_jobs (
        extractionJobId TEXT PRIMARY KEY,
        intakeSourceId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT,
        jobType TEXT NOT NULL,
        status TEXT NOT NULL,
        queuedAt TEXT NOT NULL,
        startedAt TEXT,
        completedAt TEXT,
        inputRef TEXT,
        outputRef TEXT,
        errorMessage TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_pej_intakeSource
        ON provider_extraction_jobs(intakeSourceId);
      CREATE INDEX IF NOT EXISTS idx_pej_case
        ON provider_extraction_jobs(caseId);

      CREATE TABLE IF NOT EXISTS content_chunks (
        chunkId TEXT PRIMARY KEY,
        intakeSourceId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        ordinal INTEGER NOT NULL,
        contentRef TEXT NOT NULL,
        tokenCount INTEGER,
        charCount INTEGER,
        sha256 TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_content_chunks_intakeSource
        ON content_chunks(intakeSourceId);
      CREATE INDEX IF NOT EXISTS idx_content_chunks_case
        ON content_chunks(caseId);

      CREATE TABLE IF NOT EXISTS embedding_jobs (
        embeddingJobId TEXT PRIMARY KEY,
        chunkId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        provider TEXT NOT NULL,
        model TEXT NOT NULL,
        status TEXT NOT NULL,
        dimension INTEGER,
        vectorStoreRef TEXT,
        vectorId TEXT,
        queuedAt TEXT NOT NULL,
        completedAt TEXT,
        errorMessage TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_embedding_jobs_chunk
        ON embedding_jobs(chunkId);
      CREATE INDEX IF NOT EXISTS idx_embedding_jobs_case
        ON embedding_jobs(caseId);

      CREATE TABLE IF NOT EXISTS website_crawl_plans (
        crawlPlanId TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        intakeBatchId TEXT,
        seedUrls TEXT NOT NULL,
        maxPages INTEGER NOT NULL,
        maxDepth INTEGER NOT NULL,
        plannedBy TEXT NOT NULL,
        plannedAt TEXT NOT NULL,
        status TEXT NOT NULL,
        notes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_wcp_case ON website_crawl_plans(caseId);

      CREATE TABLE IF NOT EXISTS website_crawl_candidate_pages (
        candidatePageId TEXT PRIMARY KEY,
        crawlPlanId TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        depth INTEGER NOT NULL,
        discoveredAt TEXT NOT NULL,
        previewRef TEXT,
        status TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_wccp_plan
        ON website_crawl_candidate_pages(crawlPlanId);

      CREATE TABLE IF NOT EXISTS website_crawl_approvals (
        approvalId TEXT PRIMARY KEY,
        crawlPlanId TEXT NOT NULL,
        candidatePageId TEXT NOT NULL,
        decidedBy TEXT NOT NULL,
        decidedAt TEXT NOT NULL,
        decision TEXT NOT NULL,
        reason TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_wca_plan ON website_crawl_approvals(crawlPlanId);
      CREATE INDEX IF NOT EXISTS idx_wca_candidate
        ON website_crawl_approvals(candidatePageId);

      CREATE TABLE IF NOT EXISTS website_site_summaries (
        siteSummaryId TEXT PRIMARY KEY,
        crawlPlanId TEXT NOT NULL,
        caseId TEXT NOT NULL,
        siteRootUrl TEXT NOT NULL,
        totalPagesDiscovered INTEGER NOT NULL,
        totalPagesApproved INTEGER NOT NULL,
        totalPagesFetched INTEGER NOT NULL,
        summaryRef TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_wss_plan ON website_site_summaries(crawlPlanId);
      CREATE INDEX IF NOT EXISTS idx_wss_case ON website_site_summaries(caseId);

      CREATE TABLE IF NOT EXISTS final_pre_hierarchy_reviews (
        reviewId TEXT PRIMARY KEY,
        caseId TEXT NOT NULL,
        structuredContextId TEXT,
        useCaseLabel TEXT NOT NULL,
        status TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        reviewNotes TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_fphr_case
        ON final_pre_hierarchy_reviews(caseId);
    `,
  },
];
