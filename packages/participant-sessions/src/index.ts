import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  validateParticipantSession,
  validateSessionAccessToken,
  validateTelegramIdentityBinding,
  validateTargetingRolloutPlan,
  type ChannelStatus,
  type ContactChannel,
  type ContactDataStatus,
  type ParticipantContactProfile,
  type ParticipantSession,
  type ParticipationMode,
  type SessionAccessToken,
  type SessionAccessTokenChannelType,
  type SessionAccessTokenStatus,
  type TargetCandidate,
  type TargetingRolloutPlan,
  type TargetingRolloutPlanState,
  type TelegramBindingStatus,
  type TelegramIdentityBinding,
} from "@workflow/contracts";
import type {
  ParticipantSessionRepository,
  SessionAccessTokenRepository,
  TelegramIdentityBindingRepository,
} from "@workflow/persistence";

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

export type SessionAccessTokenErrorCode =
  | "token_not_found"
  | "token_expired"
  | "token_revoked"
  | "token_completed"
  | "token_blocked_review_required"
  | "session_not_found"
  | "channel_type_mismatch"
  | "telegram_binding_conflict"
  | "invalid_token";

export interface TokenDomainError {
  code: SessionAccessTokenErrorCode;
  message: string;
}

export interface SessionAccessTokenOptions {
  now?: () => string;
  tokenTtlMs?: number;
  tokenFactory?: () => string;
  accessTokenIdFactory?: () => string;
}

export interface CreatedSessionAccessToken {
  ok: true;
  rawToken: string;
  token: SessionAccessToken;
}

export interface FailedSessionAccessToken {
  ok: false;
  errors: TokenDomainError[];
}

export type CreateSessionAccessTokenResult =
  | CreatedSessionAccessToken
  | FailedSessionAccessToken;

export interface ResolvedSessionAccessToken {
  ok: true;
  token: SessionAccessToken;
  participantSession: ParticipantSession;
}

export type ResolveSessionAccessTokenResult =
  | ResolvedSessionAccessToken
  | FailedSessionAccessToken;

export interface TelegramIdentityInput {
  telegramUserId: string;
  telegramChatId: string;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramLastName: string | null;
  telegramLanguageCode: string | null;
  participantConfirmedName?: boolean;
  adminVerified?: boolean;
  mismatchRequiresReview?: boolean;
}

export interface TelegramBindingRepos {
  sessionAccessTokens: SessionAccessTokenRepository;
  participantSessions: ParticipantSessionRepository;
  telegramIdentityBindings: TelegramIdentityBindingRepository;
}

export interface TelegramBindingOptions extends SessionAccessTokenOptions {
  bindingIdFactory?: () => string;
}

export interface TelegramBindingResult {
  ok: true;
  token: SessionAccessToken;
  participantSession: ParticipantSession;
  binding: TelegramIdentityBinding;
}

export type BindTelegramIdentityResult =
  | TelegramBindingResult
  | FailedSessionAccessToken;

export type TokenLifecycleResult =
  | { ok: true; token: SessionAccessToken }
  | FailedSessionAccessToken;

export type TelegramUnlinkResult =
  | { ok: true; binding: TelegramIdentityBinding }
  | FailedSessionAccessToken;

function tokenNow(options?: SessionAccessTokenOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function rawToken(options?: SessionAccessTokenOptions): string {
  return options?.tokenFactory?.() ?? randomBytes(32).toString("base64url");
}

function tokenHash(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function safeHashMatches(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function accessTokenId(options?: SessionAccessTokenOptions): string {
  return options?.accessTokenIdFactory?.() ?? `session_access_token_${crypto.randomUUID()}`;
}

function expiresAt(options?: SessionAccessTokenOptions): string {
  const ttl = options?.tokenTtlMs ?? 1000 * 60 * 60 * 24 * 14;
  return new Date(Date.parse(tokenNow(options)) + ttl).toISOString();
}

function tokenError(code: SessionAccessTokenErrorCode, message: string): FailedSessionAccessToken {
  return { ok: false, errors: [{ code, message }] };
}

function validateStoredToken(token: SessionAccessToken): FailedSessionAccessToken | null {
  const result = validateSessionAccessToken(token);
  if (result.ok) return null;
  return tokenError("invalid_token", `Generated SessionAccessToken failed validation: ${validationMessage(result.errors)}`);
}

function createAccessTokenForChannel(
  session: ParticipantSession,
  tokenRepo: SessionAccessTokenRepository,
  channelType: SessionAccessTokenChannelType,
  options?: SessionAccessTokenOptions,
): CreateSessionAccessTokenResult {
  const sessionValidation = validateParticipantSession(session);
  if (!sessionValidation.ok) {
    return tokenError("session_not_found", `ParticipantSession is invalid: ${validationMessage(sessionValidation.errors)}`);
  }
  const raw = rawToken(options);
  const token: SessionAccessToken = {
    accessTokenId: accessTokenId(options),
    tokenHash: tokenHash(raw),
    participantSessionId: session.sessionId,
    channelType,
    tokenStatus: "active",
    expiresAt: expiresAt(options),
    createdAt: tokenNow(options),
    lastUsedAt: null,
    revokedAt: null,
    revokedReason: null,
    useCount: 0,
    boundChannelIdentityId: null,
  };
  const validation = validateStoredToken(token);
  if (validation) return validation;
  tokenRepo.save(token);
  return { ok: true, rawToken: raw, token };
}

export function createWebSessionAccessToken(
  session: ParticipantSession,
  tokenRepo: SessionAccessTokenRepository,
  options?: SessionAccessTokenOptions,
): CreateSessionAccessTokenResult {
  return createAccessTokenForChannel(session, tokenRepo, "web_session_chatbot", options);
}

export function createTelegramPairingToken(
  session: ParticipantSession,
  tokenRepo: SessionAccessTokenRepository,
  options?: SessionAccessTokenOptions,
): CreateSessionAccessTokenResult {
  return createAccessTokenForChannel(session, tokenRepo, "telegram_bot", options);
}

function findToken(raw: string, tokenRepo: SessionAccessTokenRepository): SessionAccessToken | null {
  if (!raw) return null;
  const hash = tokenHash(raw);
  const direct = tokenRepo.findByTokenHash(hash);
  if (direct) return direct;
  return tokenRepo.findAll().find((token) => token.tokenHash && safeHashMatches(token.tokenHash, hash)) ?? null;
}

function unusableTokenResult(
  token: SessionAccessToken,
  tokenRepo: SessionAccessTokenRepository,
  options?: SessionAccessTokenOptions,
): FailedSessionAccessToken | null {
  const nowMs = Date.parse(tokenNow(options));
  if (Date.parse(token.expiresAt) <= nowMs) {
    tokenRepo.updateTokenUsage(token.accessTokenId, { tokenStatus: "expired" });
    return tokenError("token_expired", "Session access token has expired.");
  }
  if (token.tokenStatus === "expired") return tokenError("token_expired", "Session access token has expired.");
  if (token.tokenStatus === "revoked") return tokenError("token_revoked", "Session access token has been revoked.");
  if (token.tokenStatus === "completed") return tokenError("token_completed", "Session access token is completed.");
  if (token.tokenStatus === "blocked_review_required") {
    return tokenError("token_blocked_review_required", "Session access token requires admin review.");
  }
  return null;
}

export function resolveSessionAccessToken(
  raw: string,
  tokenRepo: SessionAccessTokenRepository,
  sessionRepo: ParticipantSessionRepository,
  options?: SessionAccessTokenOptions,
): ResolveSessionAccessTokenResult {
  const token = findToken(raw, tokenRepo);
  if (!token) return tokenError("token_not_found", "Session access token was not found.");
  const unusable = unusableTokenResult(token, tokenRepo, options);
  if (unusable) return unusable;
  const participantSession = sessionRepo.findById(token.participantSessionId);
  if (!participantSession) return tokenError("session_not_found", "Participant session linked to token was not found.");
  const updated = tokenRepo.updateTokenUsage(token.accessTokenId, {
    lastUsedAt: tokenNow(options),
    useCount: token.useCount + 1,
  }) ?? token;
  return { ok: true, token: updated, participantSession };
}

export function revokeSessionAccessToken(
  accessTokenId: string,
  tokenRepo: SessionAccessTokenRepository,
  reason: string,
  options?: SessionAccessTokenOptions,
): TokenLifecycleResult {
  const token = tokenRepo.findById(accessTokenId);
  if (!token) return tokenError("token_not_found", "Session access token was not found.");
  const updated = tokenRepo.updateTokenUsage(accessTokenId, {
    tokenStatus: "revoked",
    revokedAt: tokenNow(options),
    revokedReason: reason,
  });
  return updated ? { ok: true, token: updated } : tokenError("token_not_found", "Session access token was not found.");
}

export function completeSessionAccessToken(
  accessTokenId: string,
  tokenRepo: SessionAccessTokenRepository,
  options?: SessionAccessTokenOptions,
): TokenLifecycleResult {
  const token = tokenRepo.findById(accessTokenId);
  if (!token) return tokenError("token_not_found", "Session access token was not found.");
  const updated = tokenRepo.updateTokenUsage(accessTokenId, {
    tokenStatus: "completed",
    lastUsedAt: token.lastUsedAt ?? tokenNow(options),
  });
  return updated ? { ok: true, token: updated } : tokenError("token_not_found", "Session access token was not found.");
}

function bindingStatusFor(input: TelegramIdentityInput): TelegramBindingStatus {
  if (input.mismatchRequiresReview) return "mismatch_requires_review";
  if (input.adminVerified) return "admin_verified";
  if (input.participantConfirmedName) return "participant_confirmed_name";
  return "token_bound_unverified";
}

function activeBindingForSession(
  sessionId: string,
  bindingRepo: TelegramIdentityBindingRepository,
): TelegramIdentityBinding | null {
  return bindingRepo.findByParticipantSessionId(sessionId).find(
    (binding) => binding.bindingStatus !== "rejected_or_unlinked",
  ) ?? null;
}

export function bindTelegramIdentityToSession(
  raw: string,
  telegramIdentityInput: TelegramIdentityInput,
  repos: TelegramBindingRepos,
  options?: TelegramBindingOptions,
): BindTelegramIdentityResult {
  const resolved = resolveSessionAccessToken(raw, repos.sessionAccessTokens, repos.participantSessions, options);
  if (!resolved.ok) return resolved;
  if (resolved.token.channelType !== "telegram_bot") {
    return tokenError("channel_type_mismatch", "Session access token is not a Telegram pairing token.");
  }
  const existing = activeBindingForSession(resolved.participantSession.sessionId, repos.telegramIdentityBindings);
  if (existing && existing.telegramUserId !== telegramIdentityInput.telegramUserId) {
    return tokenError("telegram_binding_conflict", "Participant session already has an active Telegram identity binding.");
  }
  const bindingId = existing?.bindingId ?? options?.bindingIdFactory?.() ?? `telegram_binding_${crypto.randomUUID()}`;
  const binding: TelegramIdentityBinding = {
    bindingId,
    participantSessionId: resolved.participantSession.sessionId,
    accessTokenId: resolved.token.accessTokenId,
    telegramUserId: telegramIdentityInput.telegramUserId,
    telegramChatId: telegramIdentityInput.telegramChatId,
    telegramUsername: telegramIdentityInput.telegramUsername,
    telegramFirstName: telegramIdentityInput.telegramFirstName,
    telegramLastName: telegramIdentityInput.telegramLastName,
    telegramLanguageCode: telegramIdentityInput.telegramLanguageCode,
    bindingStatus: bindingStatusFor(telegramIdentityInput),
    createdAt: existing?.createdAt ?? tokenNow(options),
    updatedAt: tokenNow(options),
  };
  const validation = validateTelegramIdentityBinding(binding);
  if (!validation.ok) {
    return tokenError("invalid_token", `Generated TelegramIdentityBinding failed validation: ${validationMessage(validation.errors)}`);
  }
  try {
    repos.telegramIdentityBindings.save(binding);
  } catch (error) {
    return tokenError("telegram_binding_conflict", error instanceof Error ? error.message : String(error));
  }
  const token: SessionAccessToken = {
    ...resolved.token,
    tokenStatus: "bound",
    boundChannelIdentityId: binding.bindingId,
  };
  repos.sessionAccessTokens.save(token);
  return {
    ok: true,
    token,
    participantSession: resolved.participantSession,
    binding,
  };
}

export function unlinkTelegramIdentityBinding(
  bindingId: string,
  bindingRepo: TelegramIdentityBindingRepository,
  _reason?: string,
  options?: SessionAccessTokenOptions,
): TelegramUnlinkResult {
  const existing = bindingRepo.findById(bindingId);
  if (!existing) return tokenError("token_not_found", "Telegram identity binding was not found.");
  const updated = bindingRepo.updateBindingStatus(bindingId, "rejected_or_unlinked", tokenNow(options));
  return updated ? { ok: true, binding: updated } : tokenError("token_not_found", "Telegram identity binding was not found.");
}
