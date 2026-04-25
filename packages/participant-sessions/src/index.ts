import {
  validateParticipantSession,
  validateTargetingRolloutPlan,
  type ChannelStatus,
  type ContactChannel,
  type ContactDataStatus,
  type ParticipantContactProfile,
  type ParticipantSession,
  type ParticipationMode,
  type TargetCandidate,
  type TargetingRolloutPlan,
  type TargetingRolloutPlanState,
} from "@workflow/contracts";
import type { ParticipantSessionRepository } from "@workflow/persistence";

export const PARTICIPANT_SESSIONS_PACKAGE = "@workflow/participant-sessions" as const;

const allowedSourceStates: readonly TargetingRolloutPlanState[] = [
  "approved_ready_for_outreach",
  "approved_with_contact_gaps",
];

const contactGapStatuses: readonly ContactDataStatus[] = [
  "not_entered",
  "partial",
  "missing_required_contact_method",
  "preferred_channel_not_selected",
  "blocked_for_later_outreach",
];

export interface ParticipantSessionCreationRepos {
  participantSessions: ParticipantSessionRepository;
}

export interface ParticipantSessionCreationOptions {
  now?: () => string;
  idFactory?: (input: {
    targetingPlanId: string;
    targetCandidateId: string;
    participantContactProfileId: string;
  }) => string;
  defaultLanguagePreference?: string;
}

export interface SkippedTargetCandidate {
  targetCandidateId: string;
  reason: string;
}

export interface ParticipantSessionCreationWarning {
  targetCandidateId?: string;
  participantContactProfileId?: string;
  message: string;
}

export interface ParticipantSessionCreationError {
  code: string;
  message: string;
}

export type ParticipantSessionCreationResult =
  | {
      ok: true;
      caseId: string;
      targetingPlanId: string;
      createdSessions: ParticipantSession[];
      blockedSessions: ParticipantSession[];
      skippedCandidates: SkippedTargetCandidate[];
      existingSessions: ParticipantSession[];
      warnings: ParticipantSessionCreationWarning[];
      errors: [];
    }
  | {
      ok: false;
      caseId: string;
      targetingPlanId: string;
      createdSessions: [];
      blockedSessions: [];
      skippedCandidates: SkippedTargetCandidate[];
      existingSessions: ParticipantSession[];
      warnings: ParticipantSessionCreationWarning[];
      errors: ParticipantSessionCreationError[];
    };

function timestamp(options?: ParticipantSessionCreationOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function sessionIdFor(
  plan: TargetingRolloutPlan,
  candidate: TargetCandidate,
  profile: ParticipantContactProfile,
  options?: ParticipantSessionCreationOptions,
): string {
  return options?.idFactory?.({
    targetingPlanId: plan.planId,
    targetCandidateId: candidate.candidateId,
    participantContactProfileId: profile.participantId,
  }) ?? `participant_session_${crypto.randomUUID()}`;
}

function validationMessage(errors: { message?: string }[]): string {
  return errors.map((e) => e.message ?? String(e)).join("; ");
}

function isApprovedCandidate(candidate: TargetCandidate): boolean {
  return candidate.adminDecision === "accepted" || candidate.adminDecision === "edited";
}

function profileForCandidate(
  plan: TargetingRolloutPlan,
  candidate: TargetCandidate,
): ParticipantContactProfile | undefined {
  return plan.participantContactProfiles.find(
    (profile) => profile.linkedTargetCandidateId === candidate.candidateId,
  );
}

function isContactGap(profile: ParticipantContactProfile): boolean {
  return contactGapStatuses.includes(profile.contactDataStatus);
}

function hasChannelEvidence(profile: ParticipantContactProfile, channel: ContactChannel): boolean {
  if (channel === "email") return Boolean(profile.email);
  if (channel === "telegram") return Boolean(profile.telegramHandle || profile.telegramUserId);
  if (channel === "whatsapp") return Boolean(profile.whatsAppNumber);
  if (channel === "mobile") return Boolean(profile.mobileNumber);
  return false;
}

function selectedContactChannel(profile: ParticipantContactProfile): ContactChannel | null {
  if (profile.preferredChannel && hasChannelEvidence(profile, profile.preferredChannel)) {
    return profile.preferredChannel;
  }
  const usable = profile.availableChannels.filter((channel) => hasChannelEvidence(profile, channel));
  if (usable.length === 1) return usable[0] ?? null;
  if (usable.includes("telegram")) return "telegram";
  if (usable.includes("email")) return "email";
  if (usable.includes("whatsapp")) return "whatsapp";
  if (usable.includes("mobile")) return "mobile";
  return null;
}

function participationModeForChannel(
  channel: ContactChannel | null,
  candidate: TargetCandidate,
  profile: ParticipantContactProfile,
  warnings: ParticipantSessionCreationWarning[],
): ParticipationMode {
  if (channel === "telegram") return "telegram_bot";
  if (channel === "email") return "email_link_delivery";
  if (channel === "whatsapp") return "manual_whatsapp_link_delivery";
  if (channel === "mobile") {
    warnings.push({
      targetCandidateId: candidate.candidateId,
      participantContactProfileId: profile.participantId,
      message:
        "Pass 4 selected mobile contact data, but Pass 5 Block 3 has no direct mobile delivery mode; initialized manual meeting/admin-entered mode for later admin handling.",
    });
    return "manual_meeting_or_admin_entered";
  }
  warnings.push({
    targetCandidateId: candidate.candidateId,
    participantContactProfileId: profile.participantId,
    message:
      "No confident channel could be selected from Pass 4 contact data; initialized manual meeting/admin-entered mode for later admin handling.",
  });
  return "manual_meeting_or_admin_entered";
}

function buildParticipantSession(input: {
  plan: TargetingRolloutPlan;
  candidate: TargetCandidate;
  profile: ParticipantContactProfile;
  options?: ParticipantSessionCreationOptions;
  warnings: ParticipantSessionCreationWarning[];
}): ParticipantSession {
  const { plan, candidate, profile, options, warnings } = input;
  const createdAt = timestamp(options);
  const blocked = isContactGap(profile);
  const selectedChannel = selectedContactChannel(profile);
  const selectedParticipationMode = participationModeForChannel(selectedChannel, candidate, profile, warnings);
  const channelStatus: ChannelStatus = blocked
    ? "contact_data_missing"
    : "channel_selected_pending_dispatch";
  const sessionId = sessionIdFor(plan, candidate, profile, options);
  const participantLabel = profile.displayName || candidate.personLabel || candidate.roleLabel || profile.roleLabel;
  const participantRoleOrNodeId =
    profile.linkedHierarchyNodeId ?? candidate.linkedHierarchyNodeId ?? profile.roleLabel;
  const sessionContext = {
    sessionId,
    caseId: plan.caseId,
    targetingPlanId: plan.planId,
    targetCandidateId: candidate.candidateId,
    participantContactProfileId: profile.participantId,
    participantLabel,
    participantRoleOrNodeId,
    selectedDepartment: plan.selectedDepartment,
    selectedUseCase: plan.selectedUseCase,
    languagePreference: options?.defaultLanguagePreference ?? "en",
  };
  const rawEvidenceItems: ParticipantSession["rawEvidenceItems"] = [];
  const clarificationItems: ParticipantSession["clarificationItems"] = [];
  const boundarySignals: ParticipantSession["boundarySignals"] = [];
  const unresolvedItems: ParticipantSession["unresolvedItems"] = [];
  return {
    ...sessionContext,
    sessionState: blocked ? "blocked_contact_gap" : "session_prepared",
    channelStatus,
    selectedParticipationMode,
    sessionContext,
    channelAccess: {
      selectedParticipationMode,
      channelStatus,
      sessionAccessTokenId: null,
      telegramBindingId: null,
      dispatchReference: null,
      notes: selectedChannel ? null : "Channel requires later admin selection.",
    },
    rawEvidence: {
      rawEvidenceItems,
      firstNarrativeEvidenceId: null,
    },
    analysisProgress: {
      firstNarrativeStatus: "not_received",
      extractionStatus: "not_started",
      clarificationItemIds: [],
      boundarySignalIds: [],
      unresolvedItemIds: [],
      nextActionIds: [],
    },
    rawEvidenceItems,
    firstNarrativeStatus: "not_received",
    firstNarrativeEvidenceId: null,
    extractionStatus: "not_started",
    clarificationItems,
    boundarySignals,
    unresolvedItems,
    createdAt,
    updatedAt: createdAt,
  };
}

export function createParticipantSessionsFromTargetingPlan(
  plan: TargetingRolloutPlan,
  repos: ParticipantSessionCreationRepos,
  options?: ParticipantSessionCreationOptions,
): ParticipantSessionCreationResult {
  const planValidation = validateTargetingRolloutPlan(plan);
  if (!planValidation.ok) {
    return {
      ok: false,
      caseId: plan.caseId,
      targetingPlanId: plan.planId,
      createdSessions: [],
      blockedSessions: [],
      skippedCandidates: [],
      existingSessions: [],
      warnings: [],
      errors: [{
        code: "invalid_targeting_plan",
        message: `Invalid TargetingRolloutPlan: ${validationMessage(planValidation.errors)}`,
      }],
    };
  }

  if (!allowedSourceStates.includes(plan.state)) {
    return {
      ok: false,
      caseId: plan.caseId,
      targetingPlanId: plan.planId,
      createdSessions: [],
      blockedSessions: [],
      skippedCandidates: [],
      existingSessions: [],
      warnings: [],
      errors: [{
        code: "targeting_plan_not_approved",
        message: `Pass 5 session creation requires an approved Pass 4 plan; received '${plan.state}'.`,
      }],
    };
  }

  const createdSessions: ParticipantSession[] = [];
  const blockedSessions: ParticipantSession[] = [];
  const skippedCandidates: SkippedTargetCandidate[] = [];
  const existingSessions: ParticipantSession[] = [];
  const warnings: ParticipantSessionCreationWarning[] = [];
  const errors: ParticipantSessionCreationError[] = [];
  const existingForPlan = repos.participantSessions.findByTargetingPlanId(plan.planId);

  for (const candidate of plan.targetCandidates) {
    if (!isApprovedCandidate(candidate)) {
      skippedCandidates.push({
        targetCandidateId: candidate.candidateId,
        reason: `candidate_${candidate.adminDecision}`,
      });
      continue;
    }

    const existing = existingForPlan.find(
      (session) => session.targetCandidateId === candidate.candidateId,
    );
    if (existing) {
      existingSessions.push(existing);
      if (existing.sessionState === "blocked_contact_gap") blockedSessions.push(existing);
      continue;
    }

    const profile = profileForCandidate(plan, candidate);
    if (!profile) {
      skippedCandidates.push({
        targetCandidateId: candidate.candidateId,
        reason: "missing_participant_contact_profile",
      });
      warnings.push({
        targetCandidateId: candidate.candidateId,
        message:
          "Approved target candidate has no linked participant contact profile; no ParticipantSession was created.",
      });
      continue;
    }

    const session = buildParticipantSession({
      plan,
      candidate,
      profile,
      options,
      warnings,
    });
    const sessionValidation = validateParticipantSession(session);
    if (!sessionValidation.ok) {
      errors.push({
        code: "invalid_participant_session",
        message: `Generated ParticipantSession for '${candidate.candidateId}' failed validation: ${validationMessage(sessionValidation.errors)}`,
      });
      continue;
    }

    repos.participantSessions.save(session);
    createdSessions.push(session);
    if (session.sessionState === "blocked_contact_gap") blockedSessions.push(session);
  }

  return {
    ok: errors.length === 0,
    caseId: plan.caseId,
    targetingPlanId: plan.planId,
    createdSessions: errors.length === 0 ? createdSessions : [],
    blockedSessions: errors.length === 0 ? blockedSessions : [],
    skippedCandidates,
    existingSessions,
    warnings,
    errors,
  } as ParticipantSessionCreationResult;
}
