import caseConfigurationSchema from "./case-configuration.schema.json" with { type: "json" };
import sourceRegistrationSchema from "./source-registration.schema.json" with { type: "json" };
import promptRegistrationSchema from "./prompt-registration.schema.json" with { type: "json" };
import sessionCreationSchema from "./session-creation.schema.json" with { type: "json" };
import synthesisRecordSchema from "./synthesis-record.schema.json" with { type: "json" };
import evaluationRecordSchema from "./evaluation-record.schema.json" with { type: "json" };
import initialPackageRecordSchema from "./initial-package-record.schema.json" with { type: "json" };
import reviewIssueRecordSchema from "./review-issue-record.schema.json" with { type: "json" };
import finalPackageRecordSchema from "./final-package-record.schema.json" with { type: "json" };
import intakeSessionSchema from "./intake-session.schema.json" with { type: "json" };
import intakeSourceSchema from "./intake-source.schema.json" with { type: "json" };
import websiteCrawlSchema from "./website-crawl.schema.json" with { type: "json" };
import adminIntakeDecisionSchema from "./admin-intake-decision.schema.json" with { type: "json" };
import hierarchyIntakeSchema from "./hierarchy-intake.schema.json" with { type: "json" };
import hierarchyDraftSchema from "./hierarchy-draft.schema.json" with { type: "json" };
import hierarchyCorrectionSchema from "./hierarchy-correction.schema.json" with { type: "json" };
import approvedHierarchySnapshotSchema from "./approved-hierarchy-snapshot.schema.json" with { type: "json" };
import hierarchyReadinessSnapshotSchema from "./hierarchy-readiness-snapshot.schema.json" with { type: "json" };
import promptSpecSchema from "./prompt-spec.schema.json" with { type: "json" };
import pass3PromptTestRunSchema from "./pass3-prompt-test-run.schema.json" with { type: "json" };
import sourceHierarchyTriageJobSchema from "./source-hierarchy-triage-job.schema.json" with { type: "json" };
import sourceHierarchyTriageSuggestionSchema from "./source-hierarchy-triage-suggestion.schema.json" with { type: "json" };
import targetingRolloutPlanSchema from "./targeting-rollout-plan.schema.json" with { type: "json" };
import targetingRecommendationPacketSchema from "./targeting-recommendation-packet.schema.json" with { type: "json" };
import pass4PromptTestRunSchema from "./pass4-prompt-test-run.schema.json" with { type: "json" };
import participantSessionSchema from "./participant-session.schema.json" with { type: "json" };

function pass5Schema(title: string, definitionName: string) {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    title,
    $ref: `#/definitions/${definitionName}`,
    definitions: participantSessionSchema.definitions,
  };
}

const sessionContextSchema = pass5Schema("SessionContext", "sessionContext");
const channelAccessSchema = pass5Schema("ChannelAccess", "channelAccess");
const rawEvidenceItemSchema = pass5Schema("RawEvidenceItem", "rawEvidenceItem");
const analysisProgressSchema = pass5Schema("AnalysisProgress", "analysisProgress");
const sessionAccessTokenSchema = pass5Schema("SessionAccessToken", "sessionAccessToken");
const telegramIdentityBindingSchema = pass5Schema("TelegramIdentityBinding", "telegramIdentityBinding");
const sessionNextActionSchema = pass5Schema("SessionNextAction", "sessionNextAction");
const firstPassExtractionOutputSchema = pass5Schema("FirstPassExtractionOutput", "firstPassExtractionOutput");
const extractedItemSchema = pass5Schema("ExtractedItem", "extractedItem");
const unmappedContentItemSchema = pass5Schema("UnmappedContentItem", "unmappedContentItem");
const extractionDefectSchema = pass5Schema("ExtractionDefect", "extractionDefect");
const evidenceDisputeSchema = pass5Schema("EvidenceDispute", "evidenceDispute");
const clarificationCandidateSchema = pass5Schema("ClarificationCandidate", "clarificationCandidate");
const boundarySignalSchema = pass5Schema("BoundarySignal", "boundarySignal");
const pass6HandoffCandidateSchema = pass5Schema("Pass6HandoffCandidate", "pass6HandoffCandidate");

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
};
