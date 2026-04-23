import caseConfigurationSchema from "./case-configuration.schema.json" with { type: "json" };
import sourceRegistrationSchema from "./source-registration.schema.json" with { type: "json" };
import intakeSourceRecordSchema from "./intake-source-record.schema.json" with { type: "json" };
import intakeBatchRecordSchema from "./intake-batch-record.schema.json" with { type: "json" };
import intakeBatchSummaryItemSchema from "./intake-batch-summary-item.schema.json" with { type: "json" };
import aiIntakeSuggestionSchema from "./ai-intake-suggestion.schema.json" with { type: "json" };
import adminIntakeDecisionSchema from "./admin-intake-decision.schema.json" with { type: "json" };
import structuredContextRecordSchema from "./structured-context-record.schema.json" with { type: "json" };
import structuredContextFieldEvidenceSchema from "./structured-context-field-evidence.schema.json" with { type: "json" };
import providerExtractionJobSchema from "./provider-extraction-job.schema.json" with { type: "json" };
import contentChunkRecordSchema from "./content-chunk-record.schema.json" with { type: "json" };
import embeddingJobRecordSchema from "./embedding-job-record.schema.json" with { type: "json" };
import websiteCrawlPlanSchema from "./website-crawl-plan.schema.json" with { type: "json" };
import websiteCrawlCandidatePageSchema from "./website-crawl-candidate-page.schema.json" with { type: "json" };
import websiteCrawlApprovalSchema from "./website-crawl-approval.schema.json" with { type: "json" };
import websiteSiteSummarySchema from "./website-site-summary.schema.json" with { type: "json" };
import finalPreHierarchyReviewSchema from "./final-pre-hierarchy-review.schema.json" with { type: "json" };

export {
  caseConfigurationSchema,
  sourceRegistrationSchema,
  intakeSourceRecordSchema,
  intakeBatchRecordSchema,
  intakeBatchSummaryItemSchema,
  aiIntakeSuggestionSchema,
  adminIntakeDecisionSchema,
  structuredContextRecordSchema,
  structuredContextFieldEvidenceSchema,
  providerExtractionJobSchema,
  contentChunkRecordSchema,
  embeddingJobRecordSchema,
  websiteCrawlPlanSchema,
  websiteCrawlCandidatePageSchema,
  websiteCrawlApprovalSchema,
  websiteSiteSummarySchema,
  finalPreHierarchyReviewSchema,
};
