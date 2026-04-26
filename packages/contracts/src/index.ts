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
  participantSessionSchema,
  sessionContextSchema,
  channelAccessSchema,
  rawEvidenceItemSchema,
  analysisProgressSchema,
  firstNarrativeStatusSchema,
  extractionStatusSchema,
  sequenceMapSchema,
  sessionAccessTokenSchema,
  telegramIdentityBindingSchema,
  sessionNextActionSchema,
  firstPassExtractionOutputSchema,
  extractedItemSchema,
  unmappedContentItemSchema,
  extractionDefectSchema,
  evidenceDisputeSchema,
  clarificationCandidateSchema,
  boundarySignalSchema,
  pass6HandoffCandidateSchema,
  pass6CoreSchema,
  synthesisInputBundleSchema,
  workflowUnitSchema,
  workflowClaimSchema,
  analysisMethodUsageSchema,
  differenceInterpretationSchema,
  assembledWorkflowDraftSchema,
  sevenConditionAssessmentSchema,
  workflowReadinessResultSchema,
  prePackageGateResultSchema,
  clarificationNeedSchema,
  inquiryPacketSchema,
  initialWorkflowPackageSchema,
  workflowGapClosureBriefSchema,
  draftOperationalDocumentSchema,
  workflowGraphRecordSchema,
  pass6CopilotContextBundleSchema,
  pass7ReviewCandidateSchema,
  pass6ConfigurationSchema,
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
  participantSessionSchema,
  sessionContextSchema,
  channelAccessSchema,
  rawEvidenceItemSchema,
  analysisProgressSchema,
  firstNarrativeStatusSchema,
  extractionStatusSchema,
  sequenceMapSchema,
  sessionAccessTokenSchema,
  telegramIdentityBindingSchema,
  sessionNextActionSchema,
  firstPassExtractionOutputSchema,
  extractedItemSchema,
  unmappedContentItemSchema,
  extractionDefectSchema,
  evidenceDisputeSchema,
  clarificationCandidateSchema,
  boundarySignalSchema,
  pass6HandoffCandidateSchema,
  pass6CoreSchema,
  synthesisInputBundleSchema,
  workflowUnitSchema,
  workflowClaimSchema,
  analysisMethodUsageSchema,
  differenceInterpretationSchema,
  assembledWorkflowDraftSchema,
  sevenConditionAssessmentSchema,
  workflowReadinessResultSchema,
  prePackageGateResultSchema,
  clarificationNeedSchema,
  inquiryPacketSchema,
  initialWorkflowPackageSchema,
  workflowGapClosureBriefSchema,
  draftOperationalDocumentSchema,
  workflowGraphRecordSchema,
  pass6CopilotContextBundleSchema,
  pass7ReviewCandidateSchema,
  pass6ConfigurationSchema,
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
import type {
  AnalysisProgress,
  BoundarySignal,
  ChannelAccess,
  ClarificationCandidate,
  EvidenceDispute,
  ExtractedItem,
  ExtractionStatus,
  ExtractionDefect,
  FirstNarrativeStatus,
  FirstPassExtractionOutput,
  ParticipantSession,
  Pass6HandoffCandidate,
  RawEvidenceItem,
  SequenceMap,
  SessionAccessToken,
  SessionContext,
  SessionNextAction,
  TelegramIdentityBinding,
  UnmappedContentItem,
} from "./types/participant-session.js";
import type {
  AnalysisMethodUsage,
  AssembledWorkflowDraft,
  ClarificationNeed,
  DifferenceInterpretation,
  DraftOperationalDocument,
  InitialWorkflowPackage,
  InquiryPacket,
  Pass6CopilotContextBundle,
  Pass7ReviewCandidate,
  PrePackageGateResult,
  SevenConditionAssessment,
  SynthesisInputBundle,
  WorkflowClaim,
  WorkflowGapClosureBrief,
  WorkflowGraphRecord,
  WorkflowReadinessResult,
  WorkflowUnit,
} from "./types/pass6-core.js";
import type { Pass6ConfigurationProfile } from "./types/pass6-configuration.js";
import {
  SessionState,
  ParticipantSessionState,
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

export const validateParticipantSessionState =
  makeValidator<ParticipantSessionState>({
    type: "string",
    enum: Object.values(ParticipantSessionState),
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

export const validateParticipantSession =
  makeValidator<ParticipantSession>(participantSessionSchema);

export const validateSessionContext =
  makeValidator<SessionContext>(sessionContextSchema);

export const validateChannelAccess =
  makeValidator<ChannelAccess>(channelAccessSchema);

export const validateRawEvidenceItem =
  makeValidator<RawEvidenceItem>(rawEvidenceItemSchema);

export const validateAnalysisProgress =
  makeValidator<AnalysisProgress>(analysisProgressSchema);

export const validateFirstNarrativeStatus =
  makeValidator<FirstNarrativeStatus>(firstNarrativeStatusSchema);

export const validateExtractionStatus =
  makeValidator<ExtractionStatus>(extractionStatusSchema);

export const validateSequenceMap =
  makeValidator<SequenceMap>(sequenceMapSchema);

export const validateSessionAccessToken =
  makeValidator<SessionAccessToken>(sessionAccessTokenSchema);

export const validateTelegramIdentityBinding =
  makeValidator<TelegramIdentityBinding>(telegramIdentityBindingSchema);

export const validateSessionNextAction =
  makeValidator<SessionNextAction>(sessionNextActionSchema);

export const validateFirstPassExtractionOutput =
  makeValidator<FirstPassExtractionOutput>(firstPassExtractionOutputSchema);

export const validateExtractedItem =
  makeValidator<ExtractedItem>(extractedItemSchema);

export const validateUnmappedContentItem =
  makeValidator<UnmappedContentItem>(unmappedContentItemSchema);

export const validateExtractionDefect =
  makeValidator<ExtractionDefect>(extractionDefectSchema);

export const validateEvidenceDispute =
  makeValidator<EvidenceDispute>(evidenceDisputeSchema);

export const validateClarificationCandidate =
  makeValidator<ClarificationCandidate>(clarificationCandidateSchema);

export const validateBoundarySignal =
  makeValidator<BoundarySignal>(boundarySignalSchema);

export const validatePass6HandoffCandidate =
  makeValidator<Pass6HandoffCandidate>(pass6HandoffCandidateSchema);

export const validateSynthesisInputBundle =
  makeValidator<SynthesisInputBundle>(synthesisInputBundleSchema);

export const validateWorkflowUnit =
  makeValidator<WorkflowUnit>(workflowUnitSchema);

export const validateWorkflowClaim =
  makeValidator<WorkflowClaim>(workflowClaimSchema);

export const validateAnalysisMethodUsage =
  makeValidator<AnalysisMethodUsage>(analysisMethodUsageSchema);

export const validateDifferenceInterpretation =
  makeValidator<DifferenceInterpretation>(differenceInterpretationSchema);

export const validateAssembledWorkflowDraft =
  makeValidator<AssembledWorkflowDraft>(assembledWorkflowDraftSchema);

export const validateSevenConditionAssessment =
  makeValidator<SevenConditionAssessment>(sevenConditionAssessmentSchema);

export const validateWorkflowReadinessResult =
  makeValidator<WorkflowReadinessResult>(workflowReadinessResultSchema);

export const validatePrePackageGateResult =
  makeValidator<PrePackageGateResult>(prePackageGateResultSchema);

export const validateClarificationNeed =
  makeValidator<ClarificationNeed>(clarificationNeedSchema);

export const validateInquiryPacket =
  makeValidator<InquiryPacket>(inquiryPacketSchema);

export const validateInitialWorkflowPackage =
  makeValidator<InitialWorkflowPackage>(initialWorkflowPackageSchema);

export const validateWorkflowGapClosureBrief =
  makeValidator<WorkflowGapClosureBrief>(workflowGapClosureBriefSchema);

export const validateDraftOperationalDocument =
  makeValidator<DraftOperationalDocument>(draftOperationalDocumentSchema);

export const validateWorkflowGraphRecord =
  makeValidator<WorkflowGraphRecord>(workflowGraphRecordSchema);

export const validatePass6CopilotContextBundle =
  makeValidator<Pass6CopilotContextBundle>(pass6CopilotContextBundleSchema);

export const validatePass7ReviewCandidate =
  makeValidator<Pass7ReviewCandidate>(pass7ReviewCandidateSchema);

export const validatePass6ConfigurationProfile =
  makeValidator<Pass6ConfigurationProfile>(pass6ConfigurationSchema);
