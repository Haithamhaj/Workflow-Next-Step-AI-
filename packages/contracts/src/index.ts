export { ajv, createAjv } from "./ajv.js";
export { makeValidator, type ValidationResult } from "./validate.js";
export * from "./types/index.js";
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
} from "./schemas/index.js";

import { makeValidator } from "./validate.js";
import {
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
} from "./schemas/index.js";
import type { CaseConfiguration } from "./types/case-configuration.js";
import type { SourceRegistration } from "./types/source-registration.js";
import type {
  IntakeSourceRecord,
  IntakeBatchRecord,
  IntakeBatchSummaryItem,
  AIIntakeSuggestion,
  AdminIntakeDecision,
} from "./types/intake.js";
import type {
  StructuredContextRecord,
  StructuredContextFieldEvidence,
} from "./types/structured-context.js";
import type {
  ProviderExtractionJob,
  EmbeddingJobRecord,
} from "./types/provider-jobs.js";
import type { ContentChunkRecord } from "./types/content-chunk.js";
import type {
  WebsiteCrawlPlan,
  WebsiteCrawlCandidatePage,
  WebsiteCrawlApproval,
  WebsiteSiteSummary,
} from "./types/website-crawl.js";
import type { FinalPreHierarchyReviewRecord } from "./types/final-pre-hierarchy-review.js";
import {
  SessionState,
  PackageState,
  ReviewState,
  ReleaseState,
} from "./types/states.js";

export const validateCaseConfiguration =
  makeValidator<CaseConfiguration>(caseConfigurationSchema);

export const validateSourceRegistration =
  makeValidator<SourceRegistration>(sourceRegistrationSchema);

export const validateIntakeSourceRecord =
  makeValidator<IntakeSourceRecord>(intakeSourceRecordSchema);

export const validateIntakeBatchRecord =
  makeValidator<IntakeBatchRecord>(intakeBatchRecordSchema);

export const validateIntakeBatchSummaryItem =
  makeValidator<IntakeBatchSummaryItem>(intakeBatchSummaryItemSchema);

export const validateAIIntakeSuggestion =
  makeValidator<AIIntakeSuggestion>(aiIntakeSuggestionSchema);

export const validateAdminIntakeDecision =
  makeValidator<AdminIntakeDecision>(adminIntakeDecisionSchema);

export const validateStructuredContextRecord =
  makeValidator<StructuredContextRecord>(structuredContextRecordSchema);

export const validateStructuredContextFieldEvidence =
  makeValidator<StructuredContextFieldEvidence>(
    structuredContextFieldEvidenceSchema,
  );

export const validateProviderExtractionJob =
  makeValidator<ProviderExtractionJob>(providerExtractionJobSchema);

export const validateContentChunkRecord =
  makeValidator<ContentChunkRecord>(contentChunkRecordSchema);

export const validateEmbeddingJobRecord =
  makeValidator<EmbeddingJobRecord>(embeddingJobRecordSchema);

export const validateWebsiteCrawlPlan =
  makeValidator<WebsiteCrawlPlan>(websiteCrawlPlanSchema);

export const validateWebsiteCrawlCandidatePage =
  makeValidator<WebsiteCrawlCandidatePage>(websiteCrawlCandidatePageSchema);

export const validateWebsiteCrawlApproval =
  makeValidator<WebsiteCrawlApproval>(websiteCrawlApprovalSchema);

export const validateWebsiteSiteSummary =
  makeValidator<WebsiteSiteSummary>(websiteSiteSummarySchema);

export const validateFinalPreHierarchyReviewRecord =
  makeValidator<FinalPreHierarchyReviewRecord>(finalPreHierarchyReviewSchema);

export const validateSessionState = makeValidator<SessionState>({
  type: "string",
  enum: Object.values(SessionState),
});

export const validatePackageState = makeValidator<PackageState>({
  type: "string",
  enum: Object.values(PackageState),
});

export const validateReviewState = makeValidator<ReviewState>({
  type: "string",
  enum: Object.values(ReviewState),
});

export const validateReleaseState = makeValidator<ReleaseState>({
  type: "string",
  enum: Object.values(ReleaseState),
});
