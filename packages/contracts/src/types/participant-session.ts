import type { ParticipantSessionState } from "./states.js";

export type ChannelStatus =
  | "not_configured"
  | "contact_data_missing"
  | "channel_selected_pending_dispatch"
  | "email_ready"
  | "email_sent"
  | "email_failed"
  | "telegram_ready"
  | "telegram_link_pending"
  | "telegram_linked"
  | "telegram_message_sent"
  | "telegram_message_received"
  | "telegram_failed"
  | "calendar_ready"
  | "calendar_event_created"
  | "calendar_event_failed"
  | "meeting_scheduled"
  | "meeting_completed_pending_evidence"
  | "manual_intake_ready"
  | "manual_evidence_uploaded"
  | "channel_not_required_manual_path";

export type ParticipationMode =
  | "telegram_bot"
  | "web_session_chatbot"
  | "email_link_delivery"
  | "calendar_meeting"
  | "manual_meeting_or_admin_entered"
  | "uploaded_recording_or_transcript"
  | "manual_whatsapp_link_delivery";

export type RawEvidenceType =
  | "participant_text_narrative"
  | "telegram_message"
  | "email_reply"
  | "meeting_notes_admin_entered"
  | "meeting_transcript_uploaded"
  | "audio_recording_uploaded"
  | "speech_to_text_transcript_raw"
  | "speech_to_text_transcript_approved"
  | "manual_admin_note"
  | "participant_clarification_answer"
  | "participant_boundary_or_unknown_response";

export type CapturedBy = "participant" | "admin" | "system" | "provider";

export type TrustStatus =
  | "raw_unreviewed"
  | "admin_approved"
  | "admin_edited"
  | "rejected_or_needs_retry";

export type ConfidenceLevel = "high" | "medium" | "low";

export type CompletenessStatus =
  | "clear"
  | "partial"
  | "vague"
  | "inferred"
  | "unresolved";

export type AdminReviewStatus =
  | "not_reviewed"
  | "reviewed_accepted"
  | "reviewed_edited"
  | "reviewed_rejected"
  | "review_required";

export type ExtractedItemCreatedFrom =
  | "ai_extraction"
  | "admin_entry"
  | "participant_followup"
  | "system_rule";

export type PossibleUnmappedCategory =
  | "step"
  | "decision"
  | "handoff"
  | "exception"
  | "system"
  | "control"
  | "dependency"
  | "unknown"
  | "boundary_signal"
  | "unclear";

export type ExtractionDefectType =
  | "missing_evidence_anchor"
  | "schema_validation_failed"
  | "unsupported_inference"
  | "low_confidence_mapping"
  | "contradictory_extraction"
  | "content_not_mapped"
  | "transcript_quality_issue"
  | "ambiguous_actor_or_owner"
  | "ambiguous_sequence"
  | "evidence_anchor_dispute";

export type Severity = "low" | "medium" | "high" | "blocking";

export type EvidenceDisputeType =
  | "missing_anchor"
  | "anchor_not_found"
  | "weak_semantic_support"
  | "unsupported_inference"
  | "quote_mismatch"
  | "conflicting_possible_interpretations";

export type EvidenceDisputeRecommendedAction =
  | "admin_review"
  | "regenerate_anchor"
  | "ask_participant_clarification"
  | "downgrade_to_unmapped"
  | "reject_item";

export type EvidenceDisputeAdminDecision =
  | "pending"
  | "accepted_with_edit"
  | "rejected"
  | "converted_to_clarification"
  | "converted_to_unmapped";

export type ClarificationGapType =
  | "missing_step_detail"
  | "vague_decision_rule"
  | "unclear_actor"
  | "unclear_owner"
  | "unclear_sequence"
  | "unclear_handoff"
  | "unclear_system"
  | "unclear_exception"
  | "unclear_control"
  | "boundary_or_unknown"
  | "transcript_uncertainty"
  | "contradiction"
  | "admin_observed_gap";

export type ClarificationPriority = "high" | "medium" | "low";

export type ClarificationStatus =
  | "open"
  | "asked"
  | "answered"
  | "resolved"
  | "partially_resolved"
  | "dismissed_by_admin"
  | "escalated";

export type ClarificationCreatedFrom =
  | "extraction"
  | "question_hint_seed"
  | "admin_entry"
  | "participant_answer_recheck";

export type BoundaryType =
  | "knowledge_gap"
  | "ownership_boundary"
  | "execution_boundary"
  | "visibility_limitation"
  | "upstream_workflow_boundary"
  | "downstream_workflow_boundary"
  | "cross_team_boundary"
  | "outcome_only_knowledge"
  | "tacit_only_practice"
  | "responsibility_disputed"
  | "participant_declined_or_refused";

export type WorkflowArea =
  | "step"
  | "decision"
  | "handoff"
  | "exception"
  | "system"
  | "control"
  | "dependency"
  | "unknown"
  | "general";

export type SuggestedEscalationTarget =
  | "role"
  | "hierarchyNodeId"
  | "externalTeam"
  | "referenceCheck"
  | "adminReview"
  | "none";

export type SessionNextActionType =
  | "complete_contact_details"
  | "create_or_copy_session_link"
  | "send_or_share_session_link"
  | "resolve_telegram_binding_review"
  | "wait_for_participant_response"
  | "review_transcript"
  | "approve_or_edit_transcript"
  | "run_first_pass_extraction"
  | "review_extraction_defects"
  | "review_unmapped_content"
  | "ask_next_clarification_question"
  | "review_participant_answer_recheck"
  | "review_boundary_signal"
  | "review_escalation_candidate"
  | "mark_ready_for_later_synthesis_handoff"
  | "pause_session"
  | "close_session_no_response";

export type RelatedPanel =
  | "Session Context"
  | "Channel Access"
  | "Raw Evidence"
  | "Analysis Progress"
  | "Clarification Queue"
  | "Boundary/Escalation";

export type SessionAccessTokenChannelType =
  | "web_session_chatbot"
  | "telegram_bot"
  | "email_link_delivery"
  | "manual_whatsapp_link_delivery";

export type SessionAccessTokenStatus =
  | "active"
  | "expired"
  | "revoked"
  | "bound"
  | "completed"
  | "blocked_review_required";

export type TelegramBindingStatus =
  | "token_bound_unverified"
  | "participant_confirmed_name"
  | "phone_contact_matched"
  | "admin_verified"
  | "mismatch_requires_review"
  | "rejected_or_unlinked";

export type Pass6HandoffCandidateType =
  | "possible_contradiction"
  | "possible_gap"
  | "repeated_uncertainty"
  | "boundary_pattern"
  | "evidence_dispute_for_later_review"
  | "candidate_difference_block"
  | "possible_escalation_need"
  | "admin_observation";

export type MandatoryOrOptional = "mandatory" | "optional";

export type Pass6HandoffAdminDecision =
  | "pending"
  | "accepted_for_pass6"
  | "dismissed"
  | "needs_more_evidence";

export type Pass6HandoffCreatedFrom =
  | "admin_assistant"
  | "admin_entry"
  | "system_rule";

export interface EvidenceAnchor {
  evidenceItemId: string;
  quote?: string;
  startOffset?: number;
  endOffset?: number;
  note?: string;
}

export interface SourceTextSpan {
  evidenceItemId?: string;
  quote?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface SessionContext {
  sessionId: string;
  caseId: string;
  targetingPlanId: string;
  targetCandidateId: string;
  participantContactProfileId: string;
  participantLabel: string;
  participantRoleOrNodeId: string;
  selectedDepartment: string;
  selectedUseCase: string;
  languagePreference: string;
}

export interface ChannelAccess {
  selectedParticipationMode: ParticipationMode;
  channelStatus: ChannelStatus;
  sessionAccessTokenId: string | null;
  telegramBindingId: string | null;
  dispatchReference: string | null;
  notes: string | null;
}

export interface RawEvidenceItem {
  evidenceItemId: string;
  sessionId: string;
  evidenceType: RawEvidenceType;
  sourceChannel: ParticipationMode;
  rawContent?: string;
  artifactRef?: string;
  language: string;
  capturedAt: string;
  capturedBy: CapturedBy;
  trustStatus: TrustStatus;
  confidenceScore: number;
  originalFileName: string | null;
  providerJobId: string | null;
  linkedClarificationItemId: string | null;
  notes: string;
}

export interface RawEvidence {
  rawEvidenceItems: RawEvidenceItem[];
  firstNarrativeEvidenceId: string | null;
}

export interface AnalysisProgress {
  firstNarrativeStatus: string;
  extractionStatus: string;
  clarificationItemIds: string[];
  boundarySignalIds: string[];
  unresolvedItemIds: string[];
  nextActionIds: string[];
}

export interface SessionAccessToken {
  accessTokenId: string;
  tokenHash?: string;
  secureTokenRef?: string;
  participantSessionId: string;
  channelType: SessionAccessTokenChannelType;
  tokenStatus: SessionAccessTokenStatus;
  expiresAt: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  useCount: number;
  boundChannelIdentityId: string | null;
}

export interface TelegramIdentityBinding {
  bindingId: string;
  participantSessionId: string;
  accessTokenId: string;
  telegramUserId: string;
  telegramChatId: string;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;
  telegramLanguageCode: string | null;
  bindingStatus: TelegramBindingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractedItem {
  itemId: string;
  label: string;
  description: string;
  evidenceAnchors: EvidenceAnchor[];
  sourceTextSpan: SourceTextSpan;
  completenessStatus: CompletenessStatus;
  confidenceLevel: ConfidenceLevel;
  needsClarification: boolean;
  clarificationReason: string;
  relatedItemIds: string[];
  adminReviewStatus: AdminReviewStatus;
  createdFrom: ExtractedItemCreatedFrom;
  basisNote?: string;
}

export interface UnmappedContentItem {
  unmappedItemId: string;
  sessionId: string;
  evidenceItemId: string;
  sourceTextSpan?: SourceTextSpan;
  quote?: string;
  reasonUnmapped: string;
  possibleCategory: PossibleUnmappedCategory;
  confidenceLevel: ConfidenceLevel;
  needsAdminReview: boolean;
  needsParticipantClarification: boolean;
  suggestedClarificationCandidateId: string | null;
  createdAt: string;
}

export interface ExtractionDefect {
  defectId: string;
  defectType: ExtractionDefectType;
  description: string;
  affectedOutputSection: string;
  affectedItemId: string | null;
  basisEvidenceItemId: string | null;
  severity: Severity;
  recommendedAction: string;
  createdAt: string;
}

export interface EvidenceDispute {
  disputeId: string;
  sessionId: string;
  extractionId: string;
  affectedItemId: string;
  aiProposedInterpretation: string;
  aiProposedEvidenceAnchor: EvidenceAnchor;
  codeValidationIssue: string;
  disputeType: EvidenceDisputeType;
  severity: Severity;
  recommendedAction: EvidenceDisputeRecommendedAction;
  adminDecision: EvidenceDisputeAdminDecision;
  createdAt: string;
}

export interface ClarificationCandidate {
  candidateId: string;
  sessionId: string;
  linkedExtractedItemIds: string[];
  linkedUnmappedItemIds: string[];
  linkedDefectIds: string[];
  linkedRawEvidenceItemIds: string[];
  gapType: ClarificationGapType;
  questionTheme: string;
  participantFacingQuestion: string;
  whyItMatters: string;
  exampleAnswer: string;
  priority: ClarificationPriority;
  askNext: boolean;
  status: ClarificationStatus;
  createdFrom: ClarificationCreatedFrom;
  adminInstruction: string;
  aiFormulated: boolean;
  adminReviewStatus: AdminReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoundarySignal {
  boundarySignalId: string;
  sessionId: string;
  boundaryType: BoundaryType;
  participantStatement: string;
  linkedEvidenceItemId: string;
  linkedExtractedItemIds: string[];
  linkedClarificationCandidateIds: string[];
  workflowArea: WorkflowArea;
  interpretationNote: string;
  requiresEscalation: boolean;
  suggestedEscalationTarget: SuggestedEscalationTarget;
  participantSuggestedOwner: string | null;
  escalationReason: string | null;
  shouldStopAskingParticipant: boolean;
  confidenceLevel: ConfidenceLevel;
  createdAt: string;
}

export interface SessionNextAction {
  nextActionId: string;
  sessionId: string;
  actionType: SessionNextActionType;
  label: string;
  reason: string;
  blocking: boolean;
  priority: ClarificationPriority;
  relatedPanel: RelatedPanel;
  relatedItemIds: string[];
  recommendedAdminAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirstPassExtractionOutput {
  extractionId: string;
  sessionId: string;
  basisEvidenceItemIds: string[];
  extractionStatus: string;
  extractedActors: ExtractedItem[];
  extractedSteps: ExtractedItem[];
  sequenceMap: Record<string, unknown>;
  extractedDecisionPoints: ExtractedItem[];
  extractedHandoffs: ExtractedItem[];
  extractedExceptions: ExtractedItem[];
  extractedSystems: ExtractedItem[];
  extractedControls: ExtractedItem[];
  extractedDependencies: ExtractedItem[];
  extractedUnknowns: ExtractedItem[];
  boundarySignals: BoundarySignal[];
  clarificationCandidates: ClarificationCandidate[];
  confidenceNotes: string[];
  contradictionNotes: string[];
  sourceCoverageSummary: string;
  unmappedContentItems: UnmappedContentItem[];
  extractionDefects: ExtractionDefect[];
  evidenceDisputes: EvidenceDispute[];
  createdAt: string;
}

export interface ParticipantSession {
  sessionId: string;
  caseId: string;
  targetingPlanId: string;
  targetCandidateId: string;
  participantContactProfileId: string;
  participantLabel: string;
  participantRoleOrNodeId: string;
  selectedDepartment: string;
  selectedUseCase: string;
  languagePreference: string;
  sessionState: ParticipantSessionState;
  channelStatus: ChannelStatus;
  selectedParticipationMode: ParticipationMode;
  sessionContext: SessionContext;
  channelAccess: ChannelAccess;
  rawEvidence: RawEvidence;
  analysisProgress: AnalysisProgress;
  rawEvidenceItems: RawEvidenceItem[];
  firstNarrativeStatus: string;
  firstNarrativeEvidenceId: string | null;
  extractionStatus: string;
  clarificationItems: ClarificationCandidate[];
  boundarySignals: BoundarySignal[];
  unresolvedItems: UnmappedContentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Pass6HandoffCandidate {
  handoffCandidateId: string;
  caseId: string;
  sessionIds: string[];
  relatedParticipantLabels: string[];
  candidateType: Pass6HandoffCandidateType;
  description: string;
  evidenceRefs: EvidenceAnchor[];
  confidenceLevel: ConfidenceLevel;
  recommendedPass6Use: string;
  mandatoryOrOptional: MandatoryOrOptional;
  adminDecision: Pass6HandoffAdminDecision;
  createdFrom: Pass6HandoffCreatedFrom;
  createdAt: string;
}
