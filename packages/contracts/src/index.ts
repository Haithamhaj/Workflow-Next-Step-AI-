export { ajv, createAjv } from "./ajv.js";
export { makeValidator, type ValidationResult } from "./validate.js";
export * from "./types/index.js";
export {
  caseConfigurationSchema,
  sourceRegistrationSchema,
  promptRegistrationSchema,
  sessionCreationSchema,
  synthesisRecordSchema,
  evaluationRecordSchema,
  initialPackageRecordSchema,
  reviewIssueRecordSchema,
  finalPackageRecordSchema,
  intakeSessionSchema,
  intakeSourceSchema,
  websiteCrawlSchema,
  adminIntakeDecisionSchema,
  hierarchyIntakeSchema,
  hierarchyDraftSchema,
  hierarchyCorrectionSchema,
  approvedHierarchySnapshotSchema,
  hierarchyReadinessSnapshotSchema,
  promptSpecSchema,
  pass3PromptTestRunSchema,
  sourceHierarchyTriageJobSchema,
  sourceHierarchyTriageSuggestionSchema,
  targetingRolloutPlanSchema,
  targetingRecommendationPacketSchema,
  pass4PromptTestRunSchema,
} from "./schemas/index.js";

import { makeValidator } from "./validate.js";
import {
  caseConfigurationSchema,
  sourceRegistrationSchema,
  promptRegistrationSchema,
  sessionCreationSchema,
  synthesisRecordSchema,
  evaluationRecordSchema,
  initialPackageRecordSchema,
  reviewIssueRecordSchema,
  finalPackageRecordSchema,
  intakeSessionSchema,
  intakeSourceSchema,
  websiteCrawlSchema,
  adminIntakeDecisionSchema,
  hierarchyIntakeSchema,
  hierarchyDraftSchema,
  hierarchyCorrectionSchema,
  approvedHierarchySnapshotSchema,
  hierarchyReadinessSnapshotSchema,
  promptSpecSchema,
  pass3PromptTestRunSchema,
  sourceHierarchyTriageJobSchema,
  sourceHierarchyTriageSuggestionSchema,
  targetingRolloutPlanSchema,
  targetingRecommendationPacketSchema,
  pass4PromptTestRunSchema,
} from "./schemas/index.js";
import type { CaseConfiguration } from "./types/case-configuration.js";
import type { SourceRegistration } from "./types/source-registration.js";
import type { PromptRegistration } from "./types/prompt-registration.js";
import type { SessionCreation } from "./types/session-creation.js";
import type { SynthesisRecord } from "./types/synthesis-record.js";
import type { EvaluationRecord } from "./types/evaluation-record.js";
import type { InitialPackageRecord } from "./types/initial-package-record.js";
import type { ReviewIssueRecord } from "./types/review-issues.js";
import type { FinalPackageRecord } from "./types/final-package.js";
import type { IntakeBucket, IntakeInputType, IntakeSourceStatus, AttachmentScope, CrawlPagePriority, CrawlSessionStatus, ProviderName, AudioMode, HierarchyInputMethod, IntakeSession, IntakeSource, WebsiteCrawlSession, AdminIntakeDecision } from "./types/intake.js";
import type { ApprovedHierarchySnapshot, HierarchyCorrectionEvent, HierarchyDraftRecord, HierarchyIntakeRecord, HierarchyReadinessSnapshot, SourceHierarchyTriageJob, SourceHierarchyTriageSuggestion } from "./types/hierarchy.js";
import type { Pass3PromptTestRun, StructuredPromptSpec } from "./types/prompt-spec.js";
import type { Pass4PromptTestRun, TargetingRecommendationPacket, TargetingRolloutPlan } from "./types/targeting-rollout.js";
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

export const validatePromptRegistration =
  makeValidator<PromptRegistration>(promptRegistrationSchema);

export const validateSessionCreation =
  makeValidator<SessionCreation>(sessionCreationSchema);

export const validateSynthesisRecord =
  makeValidator<SynthesisRecord>(synthesisRecordSchema);

export const validateEvaluationRecord =
  makeValidator<EvaluationRecord>(evaluationRecordSchema);

export const validateInitialPackageRecord =
  makeValidator<InitialPackageRecord>(initialPackageRecordSchema);

export const validateReviewIssueRecord =
  makeValidator<ReviewIssueRecord>(reviewIssueRecordSchema);

export const validateFinalPackageRecord =
  makeValidator<FinalPackageRecord>(finalPackageRecordSchema);

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

export const validateIntakeSession =
  makeValidator<IntakeSession>(intakeSessionSchema);

export const validateIntakeSource =
  makeValidator<IntakeSource>(intakeSourceSchema);

export const validateWebsiteCrawlSession =
  makeValidator<WebsiteCrawlSession>(websiteCrawlSchema);

export const validateAdminIntakeDecision =
  makeValidator<AdminIntakeDecision>(adminIntakeDecisionSchema);

export const validateHierarchyIntakeRecord =
  makeValidator<HierarchyIntakeRecord>(hierarchyIntakeSchema);

export const validateHierarchyDraftRecord =
  makeValidator<HierarchyDraftRecord>(hierarchyDraftSchema);

export const validateHierarchyCorrectionEvent =
  makeValidator<HierarchyCorrectionEvent>(hierarchyCorrectionSchema);

export const validateApprovedHierarchySnapshot =
  makeValidator<ApprovedHierarchySnapshot>(approvedHierarchySnapshotSchema);

export const validateHierarchyReadinessSnapshot =
  makeValidator<HierarchyReadinessSnapshot>(hierarchyReadinessSnapshotSchema);

export const validateStructuredPromptSpec =
  makeValidator<StructuredPromptSpec>(promptSpecSchema);

export const validatePass3PromptTestRun =
  makeValidator<Pass3PromptTestRun>(pass3PromptTestRunSchema);

export const validateSourceHierarchyTriageJob =
  makeValidator<SourceHierarchyTriageJob>(sourceHierarchyTriageJobSchema);

export const validateSourceHierarchyTriageSuggestion =
  makeValidator<SourceHierarchyTriageSuggestion>(sourceHierarchyTriageSuggestionSchema);

export const validateTargetingRolloutPlan =
  makeValidator<TargetingRolloutPlan>(targetingRolloutPlanSchema);

export const validateTargetingRecommendationPacket =
  makeValidator<TargetingRecommendationPacket>(targetingRecommendationPacketSchema);

export const validatePass4PromptTestRun =
  makeValidator<Pass4PromptTestRun>(pass4PromptTestRunSchema);
