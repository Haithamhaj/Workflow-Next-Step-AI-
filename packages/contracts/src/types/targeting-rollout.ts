import type { HierarchyConfidence } from "./hierarchy.js";

export type TargetingRolloutPlanState =
  | "draft_from_ai_packet"
  | "under_admin_review"
  | "approved_ready_for_outreach"
  | "approved_with_contact_gaps"
  | "needs_rework"
  | "rejected";

export type TargetType =
  | "core_participant"
  | "enrichment_participant"
  | "external_decision_or_clarification_source";

export type TargetCandidateAdminDecision = "pending" | "accepted" | "rejected" | "edited";

export type ContactDataSource =
  | "pass3_person_light_mapping"
  | "pass3_uploaded_hierarchy_file"
  | "pass3_admin_correction"
  | "pass4_manual_entry"
  | "pass4_imported_table"
  | "document_signal"
  | "company_directory"
  | "unknown";

export type ContactChannel = "mobile" | "whatsapp" | "telegram" | "email";

export type ContactDataStatus =
  | "not_entered"
  | "partial"
  | "ready_for_later_outreach"
  | "missing_required_contact_method"
  | "multiple_channels_available"
  | "preferred_channel_not_selected"
  | "blocked_for_later_outreach";

export type QuestionHintSeedStatus =
  | "active"
  | "resolved_by_initial_narrative"
  | "used_in_followup"
  | "dismissed_by_admin";

export type TargetingPacketAdminDecisionStatus =
  | "pending_review"
  | "approved"
  | "approved_with_edits"
  | "rejected"
  | "superseded";

export type TargetingProviderStatus =
  | "not_requested"
  | "provider_not_configured"
  | "provider_auth_failed"
  | "provider_model_unavailable"
  | "provider_rate_limited"
  | "provider_execution_failed"
  | "provider_success";

export interface TargetingSourceSignal {
  signalId: string;
  sourceId: string;
  sourceName: string;
  linkedHierarchyNodeId?: string;
  signalType: string;
  documentSignal: string;
  suggestedRelevance: string;
  participantValidationNeeded: boolean;
  confidence: HierarchyConfidence;
  adminNote?: string;
}

export interface QuestionHintSeed {
  hintId: string;
  sourceId: string;
  sourceName: string;
  linkedTargetCandidateId?: string;
  linkedHierarchyNodeId?: string;
  documentSignal: string;
  whyItMayMatter: string;
  suggestedLaterQuestionTheme: string;
  triggerConditionForPass5: string;
  doNotAskIfAlreadyCovered: string;
  participantValidationNeeded: boolean;
  status: QuestionHintSeedStatus;
  adminNote?: string;
}

export interface TargetCandidate {
  candidateId: string;
  targetType: TargetType;
  linkedHierarchyNodeId?: string;
  roleLabel?: string;
  personLabel?: string;
  suggestedReason: string;
  expectedWorkflowVisibility: string;
  sourceSignals: string[];
  participantValidationNeeded: boolean;
  suggestedRolloutStage: number;
  rolloutOrder?: number;
  contactChannelReadinessStatus: ContactDataStatus;
  confidence: HierarchyConfidence;
  adminDecision: TargetCandidateAdminDecision;
  adminNote?: string;
}

export interface TargetGroup {
  groupId: string;
  label: string;
  targetType: TargetType;
  candidateIds: string[];
  rationale: string;
}

export interface RolloutStage {
  stageId: string;
  stageNumber: number;
  label: string;
  candidateIds: string[];
  rationale: string;
}

export interface ParticipantContactProfile {
  participantId: string;
  linkedTargetCandidateId?: string;
  displayName: string;
  linkedHierarchyNodeId?: string;
  roleLabel: string;
  targetType: TargetType;
  employeeId?: string;
  internalIdentifier?: string;
  mobileNumber?: string;
  whatsAppNumber?: string;
  telegramHandle?: string;
  telegramUserId?: string;
  email?: string;
  availableChannels: ContactChannel[];
  preferredChannel?: ContactChannel;
  fallbackChannels?: ContactChannel[];
  channelSelectionReason?: string;
  contactDataSource: Partial<Record<keyof ParticipantContactProfile, ContactDataSource>>;
  contactDataStatus: ContactDataStatus;
  lastContactDataUpdatedAt: string;
  lastContactDataUpdatedBy: string;
  adminNote?: string;
}

export interface TargetingRecommendationPacket {
  packetId: string;
  companyId: string;
  caseId: string;
  selectedDepartment: string;
  selectedUseCase: string;
  basisHierarchySnapshotId: string;
  basisReadinessSnapshotId: string;
  generatedByPromptVersionId: string;
  providerJobId?: string;
  providerExecutionRef?: string;
  generatedAt: string;
  suggestedTargetCandidates: TargetCandidate[];
  targetGroups: TargetGroup[];
  rolloutOrderSuggestion: RolloutStage[];
  sourceSignalsUsed: TargetingSourceSignal[];
  questionHintSeeds: QuestionHintSeed[];
  contactChannelReadinessNotes: string[];
  adminReviewFlags: string[];
  boundaryWarnings: string[];
  confidenceSummary: string;
  manualFallbackAvailable: boolean;
  adminDecisionStatus: TargetingPacketAdminDecisionStatus;
}

export interface TargetingBoundaryConfirmations {
  noOutreachSent: boolean;
  noInvitationsCreated: boolean;
  noParticipantSessionsCreated: boolean;
  noParticipantResponsesCollected: boolean;
  noWorkflowAnalysisPerformed: boolean;
}

export interface TargetingApprovalMetadata {
  approvedBy?: string;
  approvedAt?: string;
  approvalNote?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  reworkRequestedBy?: string;
  reworkRequestedAt?: string;
}

export interface TargetingRolloutPlan {
  planId: string;
  companyId: string;
  caseId: string;
  sessionId: string;
  selectedDepartment: string;
  selectedUseCase: string;
  basisHierarchySnapshotId: string;
  basisReadinessSnapshotId: string;
  state: TargetingRolloutPlanState;
  recommendationPacketSummary?: TargetingRecommendationPacket;
  targetCandidates: TargetCandidate[];
  adminCandidateDecisions: TargetCandidate[];
  participantContactProfiles: ParticipantContactProfile[];
  sourceSignalsUsed: TargetingSourceSignal[];
  questionHintSeeds: QuestionHintSeed[];
  rolloutOrder: RolloutStage[];
  finalReviewSummary: {
    approvedCandidateIds: string[];
    rejectedCandidateIds: string[];
    unresolvedContactGaps: string[];
    adminEditsAndNotes: string[];
    readyForLaterOutreachCount: number;
    contactGapCount: number;
  };
  finalPlanState: TargetingRolloutPlanState;
  providerStatus: TargetingProviderStatus;
  providerFailure?: {
    message: string;
    failedAt: string;
  };
  approvalMetadata: TargetingApprovalMetadata;
  boundaryConfirmations: TargetingBoundaryConfirmations;
  manualFallbackAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export type Pass4PromptCapability = "targeting_recommendation_packet";

export interface Pass4PromptTestRun {
  testRunId: string;
  promptSpecId: string;
  promptVersionId: string;
  capability: Pass4PromptCapability;
  caseContextUsed: string;
  activePromptOutput?: string;
  draftPromptOutput?: string;
  provider?: "google" | "openai";
  model?: string;
  activePromptVersion: number;
  draftPromptVersion: number;
  comparisonSummary: string;
  boundaryViolationFlags: string[];
  providerStatus: Exclude<TargetingProviderStatus, "not_requested">;
  errorMessage?: string;
  adminNote?: string;
  createdAt: string;
}
