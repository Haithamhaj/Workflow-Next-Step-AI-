import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  validateParticipantSession,
  validateBoundarySignal,
  validateClarificationCandidate,
  validateEvidenceDispute,
  validateFirstPassExtractionOutput,
  validatePass6HandoffCandidate,
  validateRawEvidenceItem,
  validateSessionAccessToken,
  validateTelegramIdentityBinding,
  validateTargetingRolloutPlan,
  type BoundarySignal,
  type ChannelStatus,
  type ClarificationCandidate,
  type ContactChannel,
  type ContactDataStatus,
  type EvidenceAnchor,
  type EvidenceDispute,
  type ExtractionDefect,
  type ExtractedItem,
  type ExtractionStatus,
  type FirstPassExtractionOutput,
  type ParticipantContactProfile,
  type ParticipantSession,
  type Pass6HandoffAdminDecision,
  type Pass6HandoffCandidate,
  type Pass6HandoffCandidateType,
  type Pass6HandoffCreatedFrom,
  type ParticipationMode,
  type RawEvidenceItem,
  type RawEvidenceType,
  type SequenceMap,
  type SessionAccessToken,
  type SessionAccessTokenChannelType,
  type SessionAccessTokenStatus,
  type TargetCandidate,
  type TargetingRolloutPlan,
  type TargetingRolloutPlanState,
  type TelegramBindingStatus,
  type TelegramIdentityBinding,
  type ConfidenceLevel,
  type MandatoryOrOptional,
} from "@workflow/contracts";
import type {
  BoundarySignalRepository,
  ClarificationCandidateRepository,
  EvidenceDisputeRepository,
  FirstPassExtractionOutputRepository,
  Pass6HandoffCandidateRepository,
  ParticipantSessionRepository,
  ProviderExtractionJobRepository,
  RawEvidenceItemRepository,
  SessionAccessTokenRepository,
  SessionNextActionRepository,
  StoredProviderExtractionJob,
  StructuredPromptSpecRepository,
  TelegramIdentityBindingRepository,
} from "@workflow/persistence";
import {
  PASS5_PROMPT_FAMILY,
  compilePass5Prompt,
  type Pass5PromptInputBundle,
} from "@workflow/prompts";

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

export type WebSessionNarrativeErrorCode =
  | SessionAccessTokenErrorCode
  | "empty_narrative"
  | "missing_audio_artifact"
  | "narrative_already_submitted"
  | "invalid_raw_evidence"
  | "invalid_participant_session";

export interface WebSessionNarrativeError {
  code: WebSessionNarrativeErrorCode;
  message: string;
}

export interface WebSessionNarrativeRepos {
  sessionAccessTokens: SessionAccessTokenRepository;
  participantSessions: ParticipantSessionRepository;
  rawEvidenceItems: RawEvidenceItemRepository;
}

export interface WebSessionNarrativeOptions extends SessionAccessTokenOptions {
  evidenceItemIdFactory?: (session: ParticipantSession) => string;
}

export type WebSessionNarrativeResult =
  | {
      ok: true;
      participantSession: ParticipantSession;
      rawEvidenceItem: RawEvidenceItem;
    }
  | {
      ok: false;
      errors: WebSessionNarrativeError[];
      participantSession?: ParticipantSession;
      existingEvidenceItemId?: string;
    };

function narrativeError(
  code: WebSessionNarrativeErrorCode,
  message: string,
  extras?: {
    participantSession?: ParticipantSession;
    existingEvidenceItemId?: string;
  },
): WebSessionNarrativeResult {
  return {
    ok: false,
    errors: [{ code, message }],
    ...extras,
  };
}

function evidenceItemIdFor(session: ParticipantSession, options?: WebSessionNarrativeOptions): string {
  return options?.evidenceItemIdFactory?.(session) ?? `raw_evidence_${crypto.randomUUID()}`;
}

export function submitWebSessionFirstNarrative(
  raw: string,
  narrativeText: string,
  repos: WebSessionNarrativeRepos,
  options?: WebSessionNarrativeOptions,
): WebSessionNarrativeResult {
  const trimmed = narrativeText.trim();
  if (!trimmed) {
    return narrativeError("empty_narrative", "First narrative text is required.");
  }

  const resolved = resolveSessionAccessToken(raw, repos.sessionAccessTokens, repos.participantSessions, options);
  if (!resolved.ok) {
    return { ok: false, errors: resolved.errors };
  }
  if (resolved.token.channelType !== "web_session_chatbot") {
    return narrativeError("channel_type_mismatch", "Session access token is not a web session token.", {
      participantSession: resolved.participantSession,
    });
  }

  const existingEvidenceItemId =
    resolved.participantSession.firstNarrativeEvidenceId ??
    resolved.participantSession.rawEvidence.firstNarrativeEvidenceId;
  if (existingEvidenceItemId) {
    return narrativeError(
      "narrative_already_submitted",
      "First narrative has already been submitted for this participant session.",
      {
        participantSession: resolved.participantSession,
        existingEvidenceItemId,
      },
    );
  }

  const capturedAt = tokenNow(options);
  const evidenceItem: RawEvidenceItem = {
    evidenceItemId: evidenceItemIdFor(resolved.participantSession, options),
    sessionId: resolved.participantSession.sessionId,
    evidenceType: "participant_text_narrative",
    sourceChannel: "web_session_chatbot",
    rawContent: trimmed,
    language: resolved.participantSession.languagePreference,
    capturedAt,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Captured as the participant's first text narrative through the web session path.",
  };
  const evidenceValidation = validateRawEvidenceItem(evidenceItem);
  if (!evidenceValidation.ok) {
    return narrativeError("invalid_raw_evidence", `Generated RawEvidenceItem failed validation: ${validationMessage(evidenceValidation.errors)}`, {
      participantSession: resolved.participantSession,
    });
  }

  const rawEvidenceItems = [...resolved.participantSession.rawEvidenceItems, evidenceItem];
  const rawEvidenceSectionItems = [...resolved.participantSession.rawEvidence.rawEvidenceItems, evidenceItem];
  const updatedSession: ParticipantSession = {
    ...resolved.participantSession,
    sessionState: "first_narrative_received",
    rawEvidenceItems,
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: evidenceItem.evidenceItemId,
    extractionStatus: "eligible",
    rawEvidence: {
      ...resolved.participantSession.rawEvidence,
      rawEvidenceItems: rawEvidenceSectionItems,
      firstNarrativeEvidenceId: evidenceItem.evidenceItemId,
    },
    analysisProgress: {
      ...resolved.participantSession.analysisProgress,
      firstNarrativeStatus: "received_text",
      extractionStatus: "eligible",
    },
    updatedAt: capturedAt,
  };
  const sessionValidation = validateParticipantSession(updatedSession);
  if (!sessionValidation.ok) {
    return narrativeError("invalid_participant_session", `Updated ParticipantSession failed validation: ${validationMessage(sessionValidation.errors)}`, {
      participantSession: resolved.participantSession,
    });
  }

  repos.rawEvidenceItems.save(evidenceItem);
  repos.participantSessions.save(updatedSession);
  return {
    ok: true,
    participantSession: updatedSession,
    rawEvidenceItem: evidenceItem,
  };
}

export function submitWebSessionFirstNarrativeVoice(
  raw: string,
  input: {
    artifactRef: string;
    originalFileName: string;
  },
  repos: WebSessionNarrativeRepos,
  options?: WebSessionNarrativeOptions,
): WebSessionNarrativeResult {
  const artifactRef = input.artifactRef.trim();
  const originalFileName = input.originalFileName.trim();
  if (!artifactRef) {
    return narrativeError("missing_audio_artifact", "Voice upload requires a stored audio artifact reference.");
  }

  const resolved = resolveSessionAccessToken(raw, repos.sessionAccessTokens, repos.participantSessions, options);
  if (!resolved.ok) {
    return { ok: false, errors: resolved.errors };
  }
  if (resolved.token.channelType !== "web_session_chatbot") {
    return narrativeError("channel_type_mismatch", "Session access token is not a web session token.", {
      participantSession: resolved.participantSession,
    });
  }

  const existingEvidenceItemId =
    resolved.participantSession.firstNarrativeEvidenceId ??
    resolved.participantSession.rawEvidence.firstNarrativeEvidenceId;
  if (existingEvidenceItemId) {
    return narrativeError(
      "narrative_already_submitted",
      "First narrative has already been submitted for this participant session.",
      {
        participantSession: resolved.participantSession,
        existingEvidenceItemId,
      },
    );
  }

  const capturedAt = tokenNow(options);
  const evidenceItem: RawEvidenceItem = {
    evidenceItemId: evidenceItemIdFor(resolved.participantSession, options),
    sessionId: resolved.participantSession.sessionId,
    evidenceType: "audio_recording_uploaded",
    sourceChannel: "web_session_chatbot",
    artifactRef,
    language: resolved.participantSession.languagePreference,
    capturedAt,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: originalFileName || "participant-voice-upload",
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Captured as the participant's first voice narrative through the web session path; transcript processing has not run.",
  };
  const evidenceValidation = validateRawEvidenceItem(evidenceItem);
  if (!evidenceValidation.ok) {
    return narrativeError("invalid_raw_evidence", `Generated RawEvidenceItem failed validation: ${validationMessage(evidenceValidation.errors)}`, {
      participantSession: resolved.participantSession,
    });
  }

  const rawEvidenceItems = [...resolved.participantSession.rawEvidenceItems, evidenceItem];
  const rawEvidenceSectionItems = [...resolved.participantSession.rawEvidence.rawEvidenceItems, evidenceItem];
  const updatedSession: ParticipantSession = {
    ...resolved.participantSession,
    sessionState: "transcript_pending_review",
    rawEvidenceItems,
    firstNarrativeStatus: "received_voice_pending_transcript",
    firstNarrativeEvidenceId: evidenceItem.evidenceItemId,
    extractionStatus: "blocked_evidence_not_approved",
    rawEvidence: {
      ...resolved.participantSession.rawEvidence,
      rawEvidenceItems: rawEvidenceSectionItems,
      firstNarrativeEvidenceId: evidenceItem.evidenceItemId,
    },
    analysisProgress: {
      ...resolved.participantSession.analysisProgress,
      firstNarrativeStatus: "received_voice_pending_transcript",
      extractionStatus: "blocked_evidence_not_approved",
    },
    updatedAt: capturedAt,
  };
  const sessionValidation = validateParticipantSession(updatedSession);
  if (!sessionValidation.ok) {
    return narrativeError("invalid_participant_session", `Updated ParticipantSession failed validation: ${validationMessage(sessionValidation.errors)}`, {
      participantSession: resolved.participantSession,
    });
  }

  repos.rawEvidenceItems.save(evidenceItem);
  repos.participantSessions.save(updatedSession);
  return {
    ok: true,
    participantSession: updatedSession,
    rawEvidenceItem: evidenceItem,
  };
}

export type TelegramUpdatesMode = "polling" | "webhook";

export type TelegramAdapterErrorCode =
  | SessionAccessTokenErrorCode
  | "telegram_config_missing"
  | "telegram_start_token_missing"
  | "telegram_message_text_missing"
  | "telegram_user_missing"
  | "telegram_binding_conflict"
  | "unbound_telegram_user"
  | "narrative_already_submitted"
  | "invalid_raw_evidence"
  | "invalid_participant_session";

export interface TelegramAdapterError {
  code: TelegramAdapterErrorCode;
  message: string;
}

export type TelegramConfigResult =
  | {
      ok: true;
      configured: true;
      botUsername: string;
      updatesMode: TelegramUpdatesMode;
      publicAppUrl: string | null;
      webhookSecretConfigured: boolean;
      tokenConfigured: true;
    }
  | {
      ok: false;
      configured: false;
      missingKeys: string[];
      errors: TelegramAdapterError[];
      tokenConfigured: boolean;
    };

export interface TelegramAdapterRepos extends TelegramBindingRepos {
  rawEvidenceItems: RawEvidenceItemRepository;
}

export interface TelegramAdapterOptions extends TelegramBindingOptions {
  botUsername?: string;
  evidenceItemIdFactory?: (session: ParticipantSession) => string;
}

export interface TelegramUserIdentity {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

export interface TelegramChatIdentity {
  id: number | string;
}

export interface TelegramMessageInput {
  message?: {
    text?: string;
    chat?: TelegramChatIdentity;
    from?: TelegramUserIdentity;
  };
  text?: string;
  chat?: TelegramChatIdentity;
  from?: TelegramUserIdentity;
}

export type TelegramDeepLinkResult =
  | {
      ok: true;
      deepLink: string;
      rawToken: string;
      token: SessionAccessToken;
    }
  | {
      ok: false;
      errors: TelegramAdapterError[];
    };

export type TelegramStartCommandResult =
  | {
      ok: true;
      participantSession: ParticipantSession;
      binding: TelegramIdentityBinding;
      token: SessionAccessToken;
      guidanceMessage: string;
    }
  | {
      ok: false;
      errors: TelegramAdapterError[];
      guidanceMessage?: string;
    };

export type TelegramTextMessageResult =
  | {
      ok: true;
      participantSession: ParticipantSession;
      binding: TelegramIdentityBinding;
      rawEvidenceItem: RawEvidenceItem;
      replyMessage: string;
    }
  | {
      ok: false;
      errors: TelegramAdapterError[];
      replyMessage?: string;
      existingEvidenceItemId?: string;
    };

function telegramError(code: TelegramAdapterErrorCode, message: string): { ok: false; errors: TelegramAdapterError[] } {
  return { ok: false, errors: [{ code, message }] };
}

export function getTelegramConfig(env: Record<string, string | undefined> = process.env): TelegramConfigResult {
  const missingKeys: string[] = [];
  if (!env.TELEGRAM_BOT_TOKEN) missingKeys.push("TELEGRAM_BOT_TOKEN");
  if (!env.TELEGRAM_BOT_USERNAME) missingKeys.push("TELEGRAM_BOT_USERNAME");
  if (!env.TELEGRAM_UPDATES_MODE) missingKeys.push("TELEGRAM_UPDATES_MODE");
  const mode = env.TELEGRAM_UPDATES_MODE;
  if (mode && mode !== "polling" && mode !== "webhook") missingKeys.push("TELEGRAM_UPDATES_MODE");
  if (missingKeys.length > 0) {
    return {
      ok: false,
      configured: false,
      missingKeys,
      tokenConfigured: Boolean(env.TELEGRAM_BOT_TOKEN),
      errors: [{
        code: "telegram_config_missing",
        message: `Telegram configuration is incomplete: ${missingKeys.join(", ")}.`,
      }],
    };
  }
  return {
    ok: true,
    configured: true,
    botUsername: env.TELEGRAM_BOT_USERNAME!,
    updatesMode: mode as TelegramUpdatesMode,
    publicAppUrl: env.PUBLIC_APP_URL ?? null,
    webhookSecretConfigured: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
    tokenConfigured: true,
  };
}

export function createTelegramDeepLink(
  session: ParticipantSession,
  tokenRepo: SessionAccessTokenRepository,
  options?: TelegramAdapterOptions,
): TelegramDeepLinkResult {
  const config = getTelegramConfig();
  const botUsername = options?.botUsername ?? (config.ok ? config.botUsername : null);
  if (!botUsername) {
    return telegramError("telegram_config_missing", "Telegram bot username is required to create a deep link.");
  }
  const created = createTelegramPairingToken(session, tokenRepo, options);
  if (!created.ok) return { ok: false, errors: created.errors };
  return {
    ok: true,
    deepLink: `https://t.me/${encodeURIComponent(botUsername)}?start=${encodeURIComponent(created.rawToken)}`,
    rawToken: created.rawToken,
    token: created.token,
  };
}

function telegramMessage(input: TelegramMessageInput): NonNullable<TelegramMessageInput["message"]> {
  return input.message ?? {
    text: input.text,
    chat: input.chat,
    from: input.from,
  };
}

function telegramText(input: TelegramMessageInput): string {
  return telegramMessage(input).text?.trim() ?? "";
}

function telegramUser(input: TelegramMessageInput): TelegramUserIdentity | null {
  return telegramMessage(input).from ?? null;
}

function telegramChat(input: TelegramMessageInput): TelegramChatIdentity | null {
  return telegramMessage(input).chat ?? null;
}

function startTokenFrom(input: TelegramMessageInput): string | null {
  const text = telegramText(input);
  const match = text.match(/^\/start(?:@\S+)?(?:\s+(.+))?$/);
  return match?.[1]?.trim() || null;
}

export type ParticipantGuidanceChannel = "telegram" | "web";

export interface ParticipantGuidanceText {
  language: "ar" | "en";
  lines: string[];
  text: string;
}

function guidanceLanguage(session: ParticipantSession): "ar" | "en" {
  return session.languagePreference === "ar" ? "ar" : "en";
}

function guidanceName(session: ParticipantSession, binding?: TelegramIdentityBinding): string {
  return binding?.telegramFirstName?.trim() || session.participantLabel.trim() || "there";
}

export function buildParticipantGuidanceText(
  session: ParticipantSession,
  channel: ParticipantGuidanceChannel,
  binding?: TelegramIdentityBinding,
): ParticipantGuidanceText {
  const language = guidanceLanguage(session);
  const name = guidanceName(session, binding);
  if (language === "ar") {
    const lines = channel === "telegram"
      ? [
          `أهلًا ${name}، شكرًا لتعاونك معنا.`,
          `نحتاج نفهم كيف تتم عملية ${session.selectedUseCase} فعليًا من واقع تجربتك اليومية.`,
          "اشرح ما يحدث عادة من طرفك، ولا تحتاج أن تكون الإجابة مرتبة بشكل مثالي.",
          "إذا كان هناك جزء لا تعرفه، أو ليس من مسؤوليتك، أو يتولاه فريق آخر، قل ذلك بوضوح.",
          "أرسل إجابتك الآن كتابة.",
        ]
      : [
          `نحتاج نفهم كيف تتم عملية ${session.selectedUseCase} فعليًا من واقع تجربتك اليومية.`,
          "اشرح ما يحدث عادة من طرفك، وليس فقط الطريقة المثالية أو الرسمية.",
          "لا تحتاج أن تكون الإجابة مرتبة بشكل مثالي. ابدأ من المكان الأسهل لك.",
          "إذا كان هناك جزء لا تعرفه، أو ليس من مسؤوليتك، أو يتولاه فريق آخر، قل ذلك بوضوح.",
          "يمكنك الإجابة كتابة أو رفع تسجيل صوتي إذا كان متاحًا.",
        ];
    return {
      language,
      lines,
      text: lines.join("\n\n"),
    };
  }
  const lines = channel === "telegram"
    ? [
        `Hi ${name}, thank you for your help.`,
        `We are asking about ${session.selectedUseCase} as it actually happens in daily work.`,
        "Please describe what usually happens from your side. Perfect order is not required.",
        "If something is outside your responsibility, unknown to you, or handled by another team, please say that clearly.",
        "Please send your answer now by text.",
      ]
    : [
        `We are asking you because your perspective helps explain how ${session.selectedUseCase} actually works in ${session.selectedDepartment}.`,
        "Please describe what really happens in practice, including the usual flow, exceptions, handoffs, tools, and decisions you notice.",
        "The order does not need to be perfect. Start wherever it is easiest, and include details that seem practical or important.",
        "It is okay to be uncertain. If something is not your responsibility, is handled by another team, or is outside your visibility, say that clearly.",
        "You can write your answer or upload an audio recording. Audio will be saved for later transcript review.",
      ];
  return {
    language,
    lines,
    text: lines.join("\n\n"),
  };
}

export function buildTelegramParticipantGuidance(
  session: ParticipantSession,
  binding?: TelegramIdentityBinding,
): string {
  return buildParticipantGuidanceText(session, "telegram", binding).text;
}

export function handleTelegramStartCommand(
  updateOrMessage: TelegramMessageInput,
  repos: TelegramAdapterRepos,
  options?: TelegramAdapterOptions,
): TelegramStartCommandResult {
  const token = startTokenFrom(updateOrMessage);
  if (!token) return telegramError("telegram_start_token_missing", "Telegram /start command must include a session pairing token.");
  const user = telegramUser(updateOrMessage);
  const chat = telegramChat(updateOrMessage);
  if (!user || !chat) return telegramError("telegram_user_missing", "Telegram /start command is missing user or chat identity.");

  const bound = bindTelegramIdentityToSession(
    token,
    {
      telegramUserId: String(user.id),
      telegramChatId: String(chat.id),
      telegramUsername: user.username ?? null,
      telegramFirstName: user.first_name ?? null,
      telegramLastName: user.last_name ?? null,
      telegramLanguageCode: user.language_code ?? null,
    },
    repos,
    options,
  );
  if (!bound.ok) return { ok: false, errors: bound.errors };

  const updatedSession: ParticipantSession = {
    ...bound.participantSession,
    channelStatus: "telegram_linked",
    channelAccess: {
      ...bound.participantSession.channelAccess,
      channelStatus: "telegram_linked",
      sessionAccessTokenId: bound.token.accessTokenId,
      telegramBindingId: bound.binding.bindingId,
    },
    updatedAt: tokenNow(options),
  };
  const validation = validateParticipantSession(updatedSession);
  if (!validation.ok) {
    return telegramError("invalid_participant_session", `Updated ParticipantSession failed validation: ${validationMessage(validation.errors)}`);
  }
  repos.participantSessions.save(updatedSession);

  return {
    ok: true,
    participantSession: updatedSession,
    binding: bound.binding,
    token: bound.token,
    guidanceMessage: buildTelegramParticipantGuidance(updatedSession, bound.binding),
  };
}

function activeBindingForTelegramUser(
  telegramUserId: string,
  bindingRepo: TelegramIdentityBindingRepository,
): TelegramIdentityBinding | null {
  return bindingRepo.findByTelegramUserId(telegramUserId).find(
    (binding) => binding.bindingStatus !== "rejected_or_unlinked",
  ) ?? null;
}

function telegramEvidenceItemIdFor(session: ParticipantSession, options?: TelegramAdapterOptions): string {
  return options?.evidenceItemIdFactory?.(session) ?? `raw_evidence_${crypto.randomUUID()}`;
}

export function handleTelegramTextMessage(
  updateOrMessage: TelegramMessageInput,
  repos: TelegramAdapterRepos,
  options?: TelegramAdapterOptions,
): TelegramTextMessageResult {
  const text = telegramText(updateOrMessage);
  if (!text || text.startsWith("/start")) {
    return {
      ...telegramError("telegram_message_text_missing", "Telegram text message is missing participant narrative text."),
      replyMessage: "Please open your session link first, then send your workflow description here.",
    };
  }
  const user = telegramUser(updateOrMessage);
  if (!user) {
    return telegramError("telegram_user_missing", "Telegram message is missing user identity.");
  }
  const binding = activeBindingForTelegramUser(String(user.id), repos.telegramIdentityBindings);
  if (!binding) {
    return {
      ...telegramError("unbound_telegram_user", "Telegram user is not bound to a participant session."),
      replyMessage: "Please start from the session link shared with you before sending your workflow description.",
    };
  }
  const session = repos.participantSessions.findById(binding.participantSessionId);
  if (!session) {
    return telegramError("session_not_found", "Participant session linked to Telegram identity was not found.");
  }
  const existingEvidenceItemId =
    session.firstNarrativeEvidenceId ??
    session.rawEvidence.firstNarrativeEvidenceId;
  if (existingEvidenceItemId) {
    return {
      ok: false,
      errors: [{
        code: "narrative_already_submitted",
        message: "First narrative has already been submitted for this participant session.",
      }],
      existingEvidenceItemId,
      replyMessage: "Your first narrative is already recorded. An admin can reopen the session if another answer is needed.",
    };
  }

  const capturedAt = tokenNow(options);
  const evidenceItem: RawEvidenceItem = {
    evidenceItemId: telegramEvidenceItemIdFor(session, options),
    sessionId: session.sessionId,
    evidenceType: "telegram_message",
    sourceChannel: "telegram_bot",
    rawContent: text,
    language: session.languagePreference || user.language_code || "en",
    capturedAt,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Captured as the participant's first text narrative through the Telegram adapter.",
  };
  const evidenceValidation = validateRawEvidenceItem(evidenceItem);
  if (!evidenceValidation.ok) {
    return telegramError("invalid_raw_evidence", `Generated RawEvidenceItem failed validation: ${validationMessage(evidenceValidation.errors)}`);
  }

  const rawEvidenceItems = [...session.rawEvidenceItems, evidenceItem];
  const rawEvidenceSectionItems = [...session.rawEvidence.rawEvidenceItems, evidenceItem];
  const updatedSession: ParticipantSession = {
    ...session,
    sessionState: "first_narrative_received",
    channelStatus: "telegram_message_received",
    rawEvidenceItems,
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: evidenceItem.evidenceItemId,
    extractionStatus: "eligible",
    channelAccess: {
      ...session.channelAccess,
      channelStatus: "telegram_message_received",
      telegramBindingId: binding.bindingId,
    },
    rawEvidence: {
      ...session.rawEvidence,
      rawEvidenceItems: rawEvidenceSectionItems,
      firstNarrativeEvidenceId: evidenceItem.evidenceItemId,
    },
    analysisProgress: {
      ...session.analysisProgress,
      firstNarrativeStatus: "received_text",
      extractionStatus: "eligible",
    },
    updatedAt: capturedAt,
  };
  const sessionValidation = validateParticipantSession(updatedSession);
  if (!sessionValidation.ok) {
    return telegramError("invalid_participant_session", `Updated ParticipantSession failed validation: ${validationMessage(sessionValidation.errors)}`);
  }

  repos.rawEvidenceItems.save(evidenceItem);
  repos.participantSessions.save(updatedSession);
  return {
    ok: true,
    participantSession: updatedSession,
    binding,
    rawEvidenceItem: evidenceItem,
    replyMessage: "Thank you. Your workflow description was recorded for review.",
  };
}

export type EvidenceEligibilityReasonCode =
  | "direct_participant_text"
  | "approved_transcript"
  | "admin_approved_manual_note"
  | "audio_requires_transcription"
  | "transcript_requires_admin_review"
  | "evidence_rejected_or_needs_retry"
  | "unsupported_evidence_type";

export type EvidenceEligibilityRecommendedAction =
  | "ready_for_extraction"
  | "transcribe_audio"
  | "admin_review_transcript"
  | "retry_or_replace_evidence"
  | "exclude_from_extraction";

export interface RawEvidenceExtractionEligibility {
  eligible: boolean;
  reasonCode: EvidenceEligibilityReasonCode;
  recommendedAction: EvidenceEligibilityRecommendedAction;
}

export interface EvidenceTrustRepos {
  rawEvidenceItems: RawEvidenceItemRepository;
  participantSessions: ParticipantSessionRepository;
}

export interface TranscriptEvidenceForReviewInput {
  evidenceItemId?: string;
  sessionId: string;
  evidenceType: Extract<RawEvidenceType, "speech_to_text_transcript_raw" | "meeting_transcript_uploaded">;
  rawContent: string;
  sourceChannel: ParticipationMode;
  language: string;
  capturedAt?: string;
  capturedBy?: "admin" | "provider" | "system";
  originalFileName?: string | null;
  providerJobId?: string | null;
  notes?: string;
}

export interface EvidenceTrustOptions {
  now?: () => string;
  evidenceItemIdFactory?: (source?: RawEvidenceItem) => string;
  language?: string;
}

export type TranscriptReviewResult =
  | {
      ok: true;
      evidenceItem: RawEvidenceItem;
      participantSession: ParticipantSession | null;
    }
  | {
      ok: false;
      error: string;
    };

export interface ApproveTranscriptEvidenceInput {
  evidenceItemId: string;
  repos: EvidenceTrustRepos;
  editedTranscript?: string;
  language?: string;
  notes?: string;
  options?: EvidenceTrustOptions;
}

export interface EvidenceReadinessSummary {
  hasRawEvidence: boolean;
  hasEligibleEvidence: boolean;
  hasAudioAwaitingTranscript: boolean;
  hasTranscriptPendingReview: boolean;
  hasRejectedEvidence: boolean;
  recommendedSessionState: ParticipantSession["sessionState"];
  recommendedFirstNarrativeStatus: ParticipantSession["firstNarrativeStatus"];
  recommendedExtractionStatus: ParticipantSession["extractionStatus"];
}

const immediateEligibleEvidenceTypes: readonly RawEvidenceType[] = [
  "participant_text_narrative",
  "telegram_message",
  "email_reply",
  "participant_clarification_answer",
  "participant_boundary_or_unknown_response",
];

const transcriptEvidenceTypes: readonly RawEvidenceType[] = [
  "speech_to_text_transcript_raw",
  "meeting_transcript_uploaded",
  "speech_to_text_transcript_approved",
];

function trustNow(options?: EvidenceTrustOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function trustEvidenceItemId(source?: RawEvidenceItem, options?: EvidenceTrustOptions): string {
  return options?.evidenceItemIdFactory?.(source) ?? `raw_evidence_${crypto.randomUUID()}`;
}

function isApprovedTrustStatus(item: RawEvidenceItem): boolean {
  return item.trustStatus === "admin_approved" || item.trustStatus === "admin_edited";
}

function isTranscriptEvidence(item: RawEvidenceItem): boolean {
  return transcriptEvidenceTypes.includes(item.evidenceType);
}

export function getRawEvidenceExtractionEligibility(
  evidenceItem: RawEvidenceItem,
): RawEvidenceExtractionEligibility {
  if (evidenceItem.trustStatus === "rejected_or_needs_retry") {
    return {
      eligible: false,
      reasonCode: "evidence_rejected_or_needs_retry",
      recommendedAction: "retry_or_replace_evidence",
    };
  }
  if (immediateEligibleEvidenceTypes.includes(evidenceItem.evidenceType)) {
    return {
      eligible: true,
      reasonCode: "direct_participant_text",
      recommendedAction: "ready_for_extraction",
    };
  }
  if (evidenceItem.evidenceType === "audio_recording_uploaded") {
    return {
      eligible: false,
      reasonCode: "audio_requires_transcription",
      recommendedAction: "transcribe_audio",
    };
  }
  if (isTranscriptEvidence(evidenceItem)) {
    if (isApprovedTrustStatus(evidenceItem)) {
      return {
        eligible: true,
        reasonCode: "approved_transcript",
        recommendedAction: "ready_for_extraction",
      };
    }
    return {
      eligible: false,
      reasonCode: "transcript_requires_admin_review",
      recommendedAction: "admin_review_transcript",
    };
  }
  if (evidenceItem.evidenceType === "manual_admin_note") {
    if (isApprovedTrustStatus(evidenceItem)) {
      return {
        eligible: true,
        reasonCode: "admin_approved_manual_note",
        recommendedAction: "ready_for_extraction",
      };
    }
    return {
      eligible: false,
      reasonCode: "transcript_requires_admin_review",
      recommendedAction: "admin_review_transcript",
    };
  }
  return {
    eligible: false,
    reasonCode: "unsupported_evidence_type",
    recommendedAction: "exclude_from_extraction",
  };
}

export function listExtractionEligibleEvidenceForSession(
  sessionId: string,
  evidenceRepo: RawEvidenceItemRepository,
): RawEvidenceItem[] {
  return evidenceRepo.findBySessionId(sessionId).filter(
    (item) => getRawEvidenceExtractionEligibility(item).eligible,
  );
}

export function createTranscriptEvidenceForReview(
  input: TranscriptEvidenceForReviewInput,
  evidenceRepo: RawEvidenceItemRepository,
  sessionRepo?: ParticipantSessionRepository,
): RawEvidenceItem {
  const item: RawEvidenceItem = {
    evidenceItemId: input.evidenceItemId ?? `raw_evidence_${crypto.randomUUID()}`,
    sessionId: input.sessionId,
    evidenceType: input.evidenceType,
    sourceChannel: input.sourceChannel,
    rawContent: input.rawContent,
    language: input.language,
    capturedAt: input.capturedAt ?? new Date().toISOString(),
    capturedBy: input.capturedBy ?? (input.providerJobId ? "provider" : "system"),
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: input.originalFileName ?? null,
    providerJobId: input.providerJobId ?? null,
    linkedClarificationItemId: null,
    notes: input.notes ?? "Raw transcript evidence pending admin trust review.",
  };
  const validation = validateRawEvidenceItem(item);
  if (!validation.ok) {
    throw new Error(`Generated RawEvidenceItem failed validation: ${validationMessage(validation.errors)}`);
  }
  evidenceRepo.save(item);
  const session = sessionRepo?.findById(input.sessionId);
  if (session) {
    sessionRepo?.save({
      ...session,
      sessionState: "transcript_pending_review",
      firstNarrativeStatus: session.firstNarrativeStatus === "not_received"
        ? "transcript_pending_review"
        : session.firstNarrativeStatus,
      extractionStatus: "blocked_evidence_not_approved",
      updatedAt: item.capturedAt,
    });
  }
  return item;
}

function markSessionTranscriptApproved(
  session: ParticipantSession,
  evidenceItemId: string,
  updatedAt: string,
): ParticipantSession {
  return {
    ...session,
    sessionState: "first_pass_extraction_ready",
    firstNarrativeStatus: "approved_for_extraction",
    firstNarrativeEvidenceId: session.firstNarrativeEvidenceId ?? evidenceItemId,
    extractionStatus: "eligible",
    rawEvidence: {
      ...session.rawEvidence,
      firstNarrativeEvidenceId: session.rawEvidence.firstNarrativeEvidenceId ?? evidenceItemId,
    },
    analysisProgress: {
      ...session.analysisProgress,
      firstNarrativeStatus: "approved_for_extraction",
      extractionStatus: "eligible",
    },
    updatedAt,
  };
}

function markSessionTranscriptRejected(
  session: ParticipantSession,
  updatedAt: string,
): ParticipantSession {
  return {
    ...session,
    firstNarrativeStatus: "rejected_or_needs_retry",
    extractionStatus: "blocked_evidence_not_approved",
    analysisProgress: {
      ...session.analysisProgress,
      firstNarrativeStatus: "rejected_or_needs_retry",
      extractionStatus: "blocked_evidence_not_approved",
    },
    updatedAt,
  };
}

export function approveTranscriptEvidence(
  evidenceItemIdOrInput: string | ApproveTranscriptEvidenceInput,
  reposArg?: EvidenceTrustRepos,
  optionsArg?: EvidenceTrustOptions,
): TranscriptReviewResult {
  const input = typeof evidenceItemIdOrInput === "string"
    ? {
        evidenceItemId: evidenceItemIdOrInput,
        repos: reposArg!,
        options: optionsArg,
      }
    : evidenceItemIdOrInput;
  if (!input.repos) return { ok: false, error: "Evidence trust repositories are required." };
  const source = input.repos.rawEvidenceItems.findById(input.evidenceItemId);
  if (!source) return { ok: false, error: "Raw evidence item not found." };
  if (!isTranscriptEvidence(source)) {
    return { ok: false, error: "Only transcript-like evidence can be approved through this function." };
  }

  const now = trustNow(input.options);
  const evidenceItem = input.editedTranscript !== undefined
    ? {
        ...source,
        evidenceItemId: trustEvidenceItemId(source, input.options),
        evidenceType: "speech_to_text_transcript_approved" as const,
        rawContent: input.editedTranscript,
        language: input.language ?? input.options?.language ?? source.language,
        trustStatus: "admin_edited" as const,
        capturedAt: now,
        notes: input.notes ?? `Admin-edited approved transcript derived from ${source.evidenceItemId}.`,
      }
    : input.repos.rawEvidenceItems.updateTrustStatus(source.evidenceItemId, {
        trustStatus: "admin_approved",
        confidenceScore: source.confidenceScore,
        linkedClarificationItemId: source.linkedClarificationItemId,
        notes: input.notes ?? source.notes,
      });

  if (!evidenceItem) return { ok: false, error: "Unable to update transcript evidence." };
  if (input.editedTranscript !== undefined) {
    const validation = validateRawEvidenceItem(evidenceItem);
    if (!validation.ok) {
      return { ok: false, error: `Generated approved transcript failed validation: ${validationMessage(validation.errors)}` };
    }
    input.repos.rawEvidenceItems.save(evidenceItem);
  }

  const session = input.repos.participantSessions.findById(source.sessionId);
  const updatedSession = session
    ? markSessionTranscriptApproved(session, evidenceItem.evidenceItemId, now)
    : null;
  if (updatedSession) input.repos.participantSessions.save(updatedSession);
  return {
    ok: true,
    evidenceItem,
    participantSession: updatedSession,
  };
}

export function rejectTranscriptEvidence(
  evidenceItemId: string,
  repos: EvidenceTrustRepos,
  reason?: string,
  options?: EvidenceTrustOptions,
): TranscriptReviewResult {
  const source = repos.rawEvidenceItems.findById(evidenceItemId);
  if (!source) return { ok: false, error: "Raw evidence item not found." };
  const updated = repos.rawEvidenceItems.updateTrustStatus(evidenceItemId, {
    trustStatus: "rejected_or_needs_retry",
    confidenceScore: source.confidenceScore,
    linkedClarificationItemId: source.linkedClarificationItemId,
    notes: reason ? `${source.notes} Rejected: ${reason}` : source.notes,
  });
  if (!updated) return { ok: false, error: "Unable to reject transcript evidence." };
  const session = repos.participantSessions.findById(source.sessionId);
  const updatedSession = session ? markSessionTranscriptRejected(session, trustNow(options)) : null;
  if (updatedSession) repos.participantSessions.save(updatedSession);
  return {
    ok: true,
    evidenceItem: updated,
    participantSession: updatedSession,
  };
}

export function markEvidenceNeedsRetry(
  evidenceItemId: string,
  repos: EvidenceTrustRepos,
  reason?: string,
  options?: EvidenceTrustOptions,
): TranscriptReviewResult {
  return rejectTranscriptEvidence(evidenceItemId, repos, reason ?? "Evidence needs retry.", options);
}

export function deriveSessionEvidenceReadiness(
  session: ParticipantSession,
  evidenceItems: RawEvidenceItem[],
): EvidenceReadinessSummary {
  const items = evidenceItems.filter((item) => item.sessionId === session.sessionId);
  const hasRawEvidence = items.length > 0;
  const hasEligibleEvidence = items.some((item) => getRawEvidenceExtractionEligibility(item).eligible);
  const hasAudioAwaitingTranscript = items.some(
    (item) => item.evidenceType === "audio_recording_uploaded" && item.trustStatus !== "rejected_or_needs_retry",
  );
  const hasTranscriptPendingReview = items.some(
    (item) => isTranscriptEvidence(item) && !isApprovedTrustStatus(item) && item.trustStatus !== "rejected_or_needs_retry",
  );
  const hasRejectedEvidence = items.some((item) => item.trustStatus === "rejected_or_needs_retry");
  if (hasEligibleEvidence) {
    return {
      hasRawEvidence,
      hasEligibleEvidence,
      hasAudioAwaitingTranscript,
      hasTranscriptPendingReview,
      hasRejectedEvidence,
      recommendedSessionState: "first_pass_extraction_ready",
      recommendedFirstNarrativeStatus: "approved_for_extraction",
      recommendedExtractionStatus: "eligible",
    };
  }
  if (hasTranscriptPendingReview) {
    return {
      hasRawEvidence,
      hasEligibleEvidence,
      hasAudioAwaitingTranscript,
      hasTranscriptPendingReview,
      hasRejectedEvidence,
      recommendedSessionState: "transcript_pending_review",
      recommendedFirstNarrativeStatus: "transcript_pending_review",
      recommendedExtractionStatus: "blocked_evidence_not_approved",
    };
  }
  if (hasAudioAwaitingTranscript) {
    return {
      hasRawEvidence,
      hasEligibleEvidence,
      hasAudioAwaitingTranscript,
      hasTranscriptPendingReview,
      hasRejectedEvidence,
      recommendedSessionState: "transcript_pending_review",
      recommendedFirstNarrativeStatus: "received_voice_pending_transcript",
      recommendedExtractionStatus: "blocked_evidence_not_approved",
    };
  }
  if (hasRejectedEvidence) {
    return {
      hasRawEvidence,
      hasEligibleEvidence,
      hasAudioAwaitingTranscript,
      hasTranscriptPendingReview,
      hasRejectedEvidence,
      recommendedSessionState: session.sessionState,
      recommendedFirstNarrativeStatus: "rejected_or_needs_retry",
      recommendedExtractionStatus: "blocked_evidence_not_approved",
    };
  }
  return {
    hasRawEvidence,
    hasEligibleEvidence,
    hasAudioAwaitingTranscript,
    hasTranscriptPendingReview,
    hasRejectedEvidence,
    recommendedSessionState: session.sessionState,
    recommendedFirstNarrativeStatus: session.firstNarrativeStatus,
    recommendedExtractionStatus: session.extractionStatus,
  };
}

export type FirstPassExtractionErrorCode =
  | "session_not_found"
  | "no_eligible_evidence"
  | "provider_not_configured"
  | "provider_execution_failed"
  | "provider_output_not_json"
  | "invalid_provider_extraction_output"
  | "schema_validation_failed"
  | "evidence_anchor_validation_failed"
  | "persistence_failed";

export interface FirstPassExtractionRepos {
  participantSessions: ParticipantSessionRepository;
  rawEvidenceItems: RawEvidenceItemRepository;
  firstPassExtractionOutputs: FirstPassExtractionOutputRepository;
  clarificationCandidates: ClarificationCandidateRepository;
  boundarySignals: BoundarySignalRepository;
  evidenceDisputes: EvidenceDisputeRepository;
  providerJobs: ProviderExtractionJobRepository;
  promptSpecs: StructuredPromptSpecRepository;
}

export interface FirstPassExtractionExecutor {
  readonly name: "google" | "openai";
  runPromptText(input: { compiledPrompt: string }): Promise<{ text: string; provider: "google" | "openai"; model: string }>;
}

export interface FirstPassExtractionOptions {
  now?: () => string;
  extractionIdFactory?: () => string;
  providerJobIdFactory?: () => string;
  defectIdFactory?: () => string;
  disputeIdFactory?: () => string;
}

export type FirstPassExtractionRunResult =
  | {
      ok: true;
      sessionId: string;
      extractionId: string;
      providerJobId: string;
      createdExtraction: FirstPassExtractionOutput;
      createdClarificationCandidates: ClarificationCandidate[];
      createdBoundarySignals: BoundarySignal[];
      defects: ExtractionDefect[];
      evidenceDisputes: EvidenceDispute[];
      unmappedContentItems: FirstPassExtractionOutput["unmappedContentItems"];
      warnings: string[];
      errors: [];
    }
  | {
      ok: false;
      sessionId: string;
      extractionId: null;
      providerJobId: string | null;
      createdExtraction: null;
      createdClarificationCandidates: [];
      createdBoundarySignals: [];
      defects: ExtractionDefect[];
      evidenceDisputes: EvidenceDispute[];
      unmappedContentItems: FirstPassExtractionOutput["unmappedContentItems"];
      warnings: string[];
      errors: { code: FirstPassExtractionErrorCode; message: string }[];
    };

function extractionNow(options?: FirstPassExtractionOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function extractionId(options?: FirstPassExtractionOptions): string {
  return options?.extractionIdFactory?.() ?? `first_pass_extraction_${crypto.randomUUID()}`;
}

function providerJobId(options?: FirstPassExtractionOptions): string {
  return options?.providerJobIdFactory?.() ?? `pass5_extraction_job_${crypto.randomUUID()}`;
}

function defectId(options?: FirstPassExtractionOptions): string {
  return options?.defectIdFactory?.() ?? `extraction_defect_${crypto.randomUUID()}`;
}

function disputeId(options?: FirstPassExtractionOptions): string {
  return options?.disputeIdFactory?.() ?? `evidence_dispute_${crypto.randomUUID()}`;
}

function allExtractedItemSections(output: FirstPassExtractionOutput): Array<{
  section: string;
  items: ExtractedItem[];
}> {
  return [
    { section: "extractedActors", items: output.extractedActors },
    { section: "extractedSteps", items: output.extractedSteps },
    { section: "extractedDecisionPoints", items: output.extractedDecisionPoints },
    { section: "extractedHandoffs", items: output.extractedHandoffs },
    { section: "extractedExceptions", items: output.extractedExceptions },
    { section: "extractedSystems", items: output.extractedSystems },
    { section: "extractedControls", items: output.extractedControls },
    { section: "extractedDependencies", items: output.extractedDependencies },
    { section: "extractedUnknowns", items: output.extractedUnknowns },
  ];
}

const REQUIRED_EXTRACTION_ARRAY_FIELDS = [
  "extractedActors",
  "extractedSteps",
  "extractedDecisionPoints",
  "extractedHandoffs",
  "extractedExceptions",
  "extractedSystems",
  "extractedControls",
  "extractedDependencies",
  "extractedUnknowns",
  "boundarySignals",
  "clarificationCandidates",
  "confidenceNotes",
  "contradictionNotes",
  "unmappedContentItems",
  "extractionDefects",
  "evidenceDisputes",
] as const;

const REQUIRED_SEQUENCE_MAP_ARRAY_FIELDS = [
  "orderedItemIds",
  "sequenceLinks",
  "unclearTransitions",
  "notes",
] as const;

const REQUIRED_EXTRACTED_ITEM_ARRAY_FIELDS = [
  "evidenceAnchors",
  "relatedItemIds",
] as const;

const EXTRACTION_ITEM_SECTION_FIELDS = [
  "extractedActors",
  "extractedSteps",
  "extractedDecisionPoints",
  "extractedHandoffs",
  "extractedExceptions",
  "extractedSystems",
  "extractedControls",
  "extractedDependencies",
  "extractedUnknowns",
] as const;

const REQUIRED_CLARIFICATION_CANDIDATE_ARRAY_FIELDS = [
  "linkedExtractedItemIds",
  "linkedUnmappedItemIds",
  "linkedDefectIds",
  "linkedRawEvidenceItemIds",
] as const;

const REQUIRED_BOUNDARY_SIGNAL_ARRAY_FIELDS = [
  "linkedExtractedItemIds",
  "linkedClarificationCandidateIds",
] as const;

function getRecordValue(record: unknown, field: string): unknown {
  return record && typeof record === "object" ? (record as Record<string, unknown>)[field] : undefined;
}

function recordLabel(record: unknown, fallback: string): string {
  const value = getRecordValue(record, "itemId")
    ?? getRecordValue(record, "candidateId")
    ?? getRecordValue(record, "boundarySignalId")
    ?? fallback;
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function validateRequiredExtractionArrays(output: unknown): string[] {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return ["invalid_provider_extraction_output: output must be a JSON object"];
  }
  const errors: string[] = [];
  for (const field of REQUIRED_EXTRACTION_ARRAY_FIELDS) {
    if (!Array.isArray(getRecordValue(output, field))) {
      errors.push(`invalid_provider_extraction_output: missing_required_array_field ${field}`);
    }
  }
  const sequenceMap = getRecordValue(output, "sequenceMap");
  if (!sequenceMap || typeof sequenceMap !== "object" || Array.isArray(sequenceMap)) {
    errors.push("invalid_provider_extraction_output: missing_required_object_field sequenceMap");
  } else {
    for (const field of REQUIRED_SEQUENCE_MAP_ARRAY_FIELDS) {
      if (!Array.isArray(getRecordValue(sequenceMap, field))) {
        errors.push(`invalid_provider_extraction_output: missing_required_array_field sequenceMap.${field}`);
      }
    }
  }
  for (const section of EXTRACTION_ITEM_SECTION_FIELDS) {
    const items = getRecordValue(output, section);
    if (!Array.isArray(items)) continue;
    items.forEach((item, index) => {
      const label = recordLabel(item, `${section}[${index}]`);
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        errors.push(`invalid_provider_extraction_output: invalid_extracted_item_shape ${section}[${index}] item_must_be_object`);
        return;
      }
      if (typeof getRecordValue(item, "itemId") !== "string" || (getRecordValue(item, "itemId") as string).trim().length === 0) {
        errors.push(`invalid_provider_extraction_output: invalid_extracted_item_shape ${label} missing_itemId`);
      }
      for (const field of REQUIRED_EXTRACTED_ITEM_ARRAY_FIELDS) {
        if (!Array.isArray(getRecordValue(item, field))) {
          const reason = field === "evidenceAnchors" ? "missing_or_invalid_evidenceAnchors" : `missing_or_invalid_${field}`;
          errors.push(`invalid_provider_extraction_output: invalid_extracted_item_shape ${label} ${reason}`);
        }
      }
    });
  }
  const sequenceLinks = getRecordValue(sequenceMap, "sequenceLinks");
  if (Array.isArray(sequenceLinks)) {
    sequenceLinks.forEach((link, index) => {
      const label = `${getRecordValue(link, "fromItemId") ?? "unknown"}->${getRecordValue(link, "toItemId") ?? "unknown"}`;
      if (!link || typeof link !== "object" || Array.isArray(link)) {
        errors.push(`invalid_provider_extraction_output: invalid_sequence_link_shape sequenceLinks[${index}] link_must_be_object`);
        return;
      }
      if (!Array.isArray(getRecordValue(link, "evidenceAnchors"))) {
        errors.push(`invalid_provider_extraction_output: invalid_sequence_link_shape ${label} missing_or_invalid_evidenceAnchors`);
      }
    });
  }
  const clarificationCandidates = getRecordValue(output, "clarificationCandidates");
  if (Array.isArray(clarificationCandidates)) {
    clarificationCandidates.forEach((candidate, index) => {
      const label = recordLabel(candidate, `clarificationCandidates[${index}]`);
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        errors.push(`invalid_provider_extraction_output: invalid_clarification_candidate_shape clarificationCandidates[${index}] candidate_must_be_object`);
        return;
      }
      for (const field of REQUIRED_CLARIFICATION_CANDIDATE_ARRAY_FIELDS) {
        if (!Array.isArray(getRecordValue(candidate, field))) {
          errors.push(`invalid_provider_extraction_output: invalid_clarification_candidate_shape ${label} missing_or_invalid_${field}`);
        }
      }
    });
  }
  const boundarySignals = getRecordValue(output, "boundarySignals");
  if (Array.isArray(boundarySignals)) {
    boundarySignals.forEach((signal, index) => {
      const label = recordLabel(signal, `boundarySignals[${index}]`);
      if (!signal || typeof signal !== "object" || Array.isArray(signal)) {
        errors.push(`invalid_provider_extraction_output: invalid_boundary_signal_shape boundarySignals[${index}] signal_must_be_object`);
        return;
      }
      for (const field of REQUIRED_BOUNDARY_SIGNAL_ARRAY_FIELDS) {
        if (!Array.isArray(getRecordValue(signal, field))) {
          errors.push(`invalid_provider_extraction_output: invalid_boundary_signal_shape ${label} missing_or_invalid_${field}`);
        }
      }
    });
  }
  return errors;
}

function safeStringifyProviderJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const FIRST_PASS_EXTRACTION_REPAIR_CONTRACT_GUIDE = [
  "FirstPassExtractionOutput required top-level fields: extractionId, sessionId, basisEvidenceItemIds[], extractionStatus, extractedActors[], extractedSteps[], sequenceMap, extractedDecisionPoints[], extractedHandoffs[], extractedExceptions[], extractedSystems[], extractedControls[], extractedDependencies[], extractedUnknowns[], boundarySignals[], clarificationCandidates[], confidenceNotes[], contradictionNotes[], sourceCoverageSummary, unmappedContentItems[], extractionDefects[], evidenceDisputes[], createdAt.",
  "Canonical skeleton: {\"extractionId\":\"string\",\"sessionId\":\"string\",\"basisEvidenceItemIds\":[\"evidence-id\"],\"extractionStatus\":\"completed_clean|completed_with_unmapped|completed_with_defects|completed_with_evidence_disputes|failed\",\"extractedActors\":[],\"extractedSteps\":[],\"sequenceMap\":{\"orderedItemIds\":[],\"sequenceLinks\":[],\"unclearTransitions\":[],\"notes\":[]},\"extractedDecisionPoints\":[],\"extractedHandoffs\":[],\"extractedExceptions\":[],\"extractedSystems\":[],\"extractedControls\":[],\"extractedDependencies\":[],\"extractedUnknowns\":[],\"boundarySignals\":[],\"clarificationCandidates\":[],\"confidenceNotes\":[],\"contradictionNotes\":[],\"sourceCoverageSummary\":\"string\",\"unmappedContentItems\":[],\"extractionDefects\":[],\"evidenceDisputes\":[],\"createdAt\":\"ISO timestamp\"}.",
  "Each extracted item requires itemId, label, description, evidenceAnchors[], sourceTextSpan, completenessStatus, confidenceLevel, needsClarification, clarificationReason, relatedItemIds[], adminReviewStatus, createdFrom. Allowed values: completenessStatus clear|partial|vague|inferred|unresolved; confidenceLevel high|medium|low; adminReviewStatus not_reviewed|reviewed_accepted|reviewed_edited|reviewed_rejected|review_required; createdFrom ai_extraction|admin_entry|participant_followup|system_rule.",
  "SequenceMap requires orderedItemIds[], sequenceLinks[], unclearTransitions[], notes[]. Each sequenceLink requires fromItemId, toItemId, relationType, condition, evidenceAnchors[], confidenceLevel. relationType then|conditional|parallel|optional|loop|unknown. Each unclearTransition requires fromItemId, toItemId, reasonUnclear, needsClarification, suggestedClarificationCandidateId.",
  "ClarificationCandidate requires candidateId, sessionId, linkedExtractedItemIds[], linkedUnmappedItemIds[], linkedDefectIds[], linkedRawEvidenceItemIds[], gapType, questionTheme, participantFacingQuestion, whyItMatters, exampleAnswer, priority, askNext, status, createdFrom, adminInstruction, aiFormulated, adminReviewStatus, createdAt, updatedAt.",
  "BoundarySignal requires boundarySignalId, sessionId, boundaryType, participantStatement, linkedEvidenceItemId, linkedExtractedItemIds[], linkedClarificationCandidateIds[], workflowArea, interpretationNote, requiresEscalation, suggestedEscalationTarget, participantSuggestedOwner, escalationReason, shouldStopAskingParticipant, confidenceLevel, createdAt.",
  "UnmappedContentItem requires unmappedItemId, sessionId, evidenceItemId, sourceTextSpan or quote, reasonUnmapped, possibleCategory, confidenceLevel, needsAdminReview, needsParticipantClarification, suggestedClarificationCandidateId, createdAt.",
  "ExtractionDefect requires defectId, defectType, description, affectedOutputSection, affectedItemId, basisEvidenceItemId, severity, recommendedAction, createdAt. EvidenceDispute requires disputeId, sessionId, extractionId, affectedItemId, aiProposedInterpretation, aiProposedEvidenceAnchor, codeValidationIssue, disputeType, severity, recommendedAction, adminDecision, createdAt.",
].join("\n");

type ValidationErrorDetails = {
  instancePath?: string;
  keyword?: string;
  message?: string;
  params?: Record<string, unknown>;
};

function pointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function valueAtJsonPointer(data: unknown, pointer: string): unknown {
  if (!pointer || pointer === "/") return data;
  return pointer
    .split("/")
    .slice(1)
    .reduce<unknown>((current, segment) => {
      if (current === undefined || current === null) return undefined;
      const key = pointerSegment(segment);
      if (Array.isArray(current)) return current[Number(key)];
      if (typeof current === "object") return (current as Record<string, unknown>)[key];
      return undefined;
    }, data);
}

function validationErrorPath(error: ValidationErrorDetails): string {
  const base = error.instancePath && error.instancePath.length > 0 ? error.instancePath : "/";
  const missingProperty = error.keyword === "required" ? error.params?.missingProperty : undefined;
  if (typeof missingProperty === "string" && missingProperty.length > 0) {
    return base === "/" ? `/${missingProperty}` : `${base}/${missingProperty}`;
  }
  const additionalProperty = error.keyword === "additionalProperties" ? error.params?.additionalProperty : undefined;
  if (typeof additionalProperty === "string" && additionalProperty.length > 0) {
    return base === "/" ? `/${additionalProperty}` : `${base}/${additionalProperty}`;
  }
  return base;
}

function safeValueSummary(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Array.isArray(value)) return `array(length=${value.length})`;
  const type = typeof value;
  if (type === "string") {
    const stringValue = value as string;
    const text = stringValue.length > 80 ? `${stringValue.slice(0, 77)}...` : stringValue;
    return `string(${JSON.stringify(text)})`;
  }
  if (type === "number" || type === "boolean") return `${type}(${String(value)})`;
  if (type === "object") return `object(keys=${Object.keys(value as Record<string, unknown>).slice(0, 8).join(",")})`;
  return type;
}

function formatDetailedValidationErrors(errors: unknown[] | undefined, data: unknown, phase: string): string {
  if (!errors || errors.length === 0) return `phase=${phase}; no validation error details available`;
  return errors
    .slice(0, 20)
    .map((rawError) => {
      const error = (rawError && typeof rawError === "object" ? rawError : {}) as ValidationErrorDetails;
      const path = validationErrorPath(error);
      const params = error.params ? JSON.stringify(error.params) : "{}";
      return [
        `phase=${phase}`,
        `path=${path}`,
        `keyword=${error.keyword ?? "unknown"}`,
        `message=${error.message ?? "validation failed"}`,
        `params=${params}`,
        `actual=${safeValueSummary(valueAtJsonPointer(data, path))}`,
      ].join(" ");
    })
    .join("; ");
}

function buildExtractionJsonRepairPrompt(input: {
  originalJson: unknown;
  validationErrors: string[];
}): string {
  return [
    "You are repairing a provider JSON response for Pass 5 first-pass extraction.",
    "Repair the JSON to match the required schema. Do not add new workflow facts. Do not invent evidence. Do not invent evidence anchors, quotes, offsets, owners, thresholds, sequence, or workflow facts. Do not invent quotes or offsets. Only restore required structure and preserve existing content. Required arrays must be present; use [] only when the original output had no items for that field.",
    "If a clean extracted item lacks required fields and the fields cannot be restored from existing content, move or downgrade it to extractionDefects or unmappedContentItems. Do not place the item in clean extracted arrays when required fields or evidence support cannot be restored; do not place the item in clean extracted arrays. Every AI-extracted clean item must have valid evidenceAnchors using supplied evidence IDs.",
    "Return strict corrected JSON only. Do not include markdown fences, prose, comments, or explanations.",
    "",
    "Validation errors:",
    input.validationErrors.map((error) => `- ${error}`).join("\n"),
    "",
    "Required contract summary:",
    FIRST_PASS_EXTRACTION_REPAIR_CONTRACT_GUIDE,
    "Nested rule: every normal extracted item must include evidenceAnchors[] and relatedItemIds[]. AI-extracted items must not omit evidence anchors. If no evidence anchor exists, do not place the content in clean extracted arrays; place it in unmappedContentItems or extractionDefects. Every sequenceLink must include evidenceAnchors[]. Clarification candidates and boundary signals must include their required linked-id arrays.",
    "",
    "Original provider JSON:",
    safeStringifyProviderJson(input.originalJson),
  ].join("\n");
}

function extractionFailure(input: {
  sessionId: string;
  providerJobId?: string | null;
  code: FirstPassExtractionErrorCode;
  message: string;
  defects?: ExtractionDefect[];
  disputes?: EvidenceDispute[];
  unmapped?: FirstPassExtractionOutput["unmappedContentItems"];
  warnings?: string[];
}): FirstPassExtractionRunResult {
  return {
    ok: false,
    sessionId: input.sessionId,
    extractionId: null,
    providerJobId: input.providerJobId ?? null,
    createdExtraction: null,
    createdClarificationCandidates: [],
    createdBoundarySignals: [],
    defects: input.defects ?? [],
    evidenceDisputes: input.disputes ?? [],
    unmappedContentItems: input.unmapped ?? [],
    warnings: input.warnings ?? [],
    errors: [{ code: input.code, message: input.message }],
  };
}

function createExtractionProviderJob(input: {
  session: ParticipantSession;
  promptBundle: Pass5PromptInputBundle;
  provider: FirstPassExtractionExecutor | null;
  promptVersionId: string;
  basePromptVersionId: string;
  outputContractRef?: string;
  repos: FirstPassExtractionRepos;
  options?: FirstPassExtractionOptions;
}): StoredProviderExtractionJob {
  const timestamp = extractionNow(input.options);
  const job: StoredProviderExtractionJob = {
    jobId: providerJobId(input.options),
    sourceId: input.promptBundle.contentRef ?? input.session.sessionId,
    sessionId: input.session.sessionId,
    caseId: input.session.caseId,
    provider: input.provider?.name ?? "google",
    jobKind: "pass5_prompt_test",
    status: "queued",
    inputType: "manual_note",
    promptFamily: PASS5_PROMPT_FAMILY,
    promptName: "first_pass_extraction_prompt",
    promptVersionId: input.promptVersionId,
    basePromptVersionId: input.basePromptVersionId,
    inputBundleRef: JSON.stringify({
      promptName: input.promptBundle.promptName,
      caseId: input.promptBundle.caseId,
      sessionId: input.promptBundle.sessionId,
      languagePreference: input.promptBundle.languagePreference,
      evidenceRefs: input.promptBundle.evidenceRefs ?? [],
      contentRef: input.promptBundle.contentRef,
      hasRawContent: Boolean(input.promptBundle.rawContent),
    }),
    outputContractRef: input.outputContractRef ?? "FirstPassExtractionOutput",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.providerJobs.save(job);
  return job;
}

function saveProviderJob(job: StoredProviderExtractionJob, repos: FirstPassExtractionRepos): StoredProviderExtractionJob {
  repos.providerJobs.save(job);
  return job;
}

function markExtractionSessionFailed(
  session: ParticipantSession,
  repos: FirstPassExtractionRepos,
  options?: FirstPassExtractionOptions,
): void {
  repos.participantSessions.save({
    ...session,
    extractionStatus: "failed",
    analysisProgress: { ...session.analysisProgress, extractionStatus: "failed" },
    updatedAt: extractionNow(options),
  });
}

function createEvidenceAnchorDefect(input: {
  item: ExtractedItem;
  section: string;
  basisEvidenceItemId: string | null;
  description: string;
  options?: FirstPassExtractionOptions;
}): ExtractionDefect {
  return {
    defectId: defectId(input.options),
    defectType: "missing_evidence_anchor",
    description: input.description,
    affectedOutputSection: input.section,
    affectedItemId: input.item.itemId,
    basisEvidenceItemId: input.basisEvidenceItemId,
    severity: "high",
    recommendedAction: "admin_review",
    createdAt: extractionNow(input.options),
  };
}

function createEvidenceAnchorDispute(input: {
  session: ParticipantSession;
  extractionId: string;
  item: ExtractedItem;
  anchor: EvidenceAnchor;
  issue: string;
  options?: FirstPassExtractionOptions;
}): EvidenceDispute {
  return {
    disputeId: disputeId(input.options),
    sessionId: input.session.sessionId,
    extractionId: input.extractionId,
    affectedItemId: input.item.itemId,
    aiProposedInterpretation: input.item.description,
    aiProposedEvidenceAnchor: input.anchor,
    codeValidationIssue: input.issue,
    disputeType: "anchor_not_found",
    severity: "high",
    recommendedAction: "admin_review",
    adminDecision: "pending",
    createdAt: extractionNow(input.options),
  };
}

function buildSourceCoverageSummary(input: {
  evidenceIds: string[];
  fullContentProcessed: boolean;
  mappedCount: number;
  unmappedCount: number;
  defectCount: number;
  disputeCount: number;
  clean: boolean;
}): string {
  return [
    `processedEvidenceItemIds=${input.evidenceIds.join(",")}`,
    `fullContentProcessed=${input.fullContentProcessed}`,
    `mappedItemCount=${input.mappedCount}`,
    `unmappedContentCount=${input.unmappedCount}`,
    `extractionDefectCount=${input.defectCount}`,
    `evidenceDisputeCount=${input.disputeCount}`,
    `reviewSensitivity=${input.clean ? "clean" : "review_sensitive"}`,
  ].join("; ");
}

function validateAndGovernExtractionOutput(input: {
  output: FirstPassExtractionOutput;
  session: ParticipantSession;
  eligibleEvidence: RawEvidenceItem[];
  options?: FirstPassExtractionOptions;
}): { output: FirstPassExtractionOutput; defects: ExtractionDefect[]; disputes: EvidenceDispute[]; warnings: string[] } {
  const knownEvidenceIds = new Set(input.eligibleEvidence.map((item) => item.evidenceItemId));
  const defects = [...input.output.extractionDefects];
  const disputes = [...input.output.evidenceDisputes];
  const warnings: string[] = [];

  const retainedSections = allExtractedItemSections(input.output).map(({ section, items }) => {
    const retained: ExtractedItem[] = [];
    for (const item of items) {
      if (item.createdFrom === "ai_extraction" && item.evidenceAnchors.length === 0) {
        defects.push(createEvidenceAnchorDefect({
          item,
          section,
          basisEvidenceItemId: input.output.basisEvidenceItemIds[0] ?? null,
          description: `AI-extracted item ${item.itemId} had no evidence anchor and was not accepted as a clean extracted item.`,
          options: input.options,
        }));
        warnings.push(`Removed unsupported AI item without evidence anchor: ${item.itemId}`);
        continue;
      }
      if ((item.createdFrom === "admin_entry" || item.createdFrom === "system_rule")
        && item.evidenceAnchors.length === 0
        && (!item.basisNote || item.basisNote.trim().length === 0)) {
        defects.push(createEvidenceAnchorDefect({
          item,
          section,
          basisEvidenceItemId: null,
          description: `Non-participant item ${item.itemId} had no evidence anchor and no basis note.`,
          options: input.options,
        }));
        warnings.push(`Removed item without evidence anchor or basis note: ${item.itemId}`);
        continue;
      }
      for (const anchor of item.evidenceAnchors) {
        if (!knownEvidenceIds.has(anchor.evidenceItemId)) {
          disputes.push(createEvidenceAnchorDispute({
            session: input.session,
            extractionId: input.output.extractionId,
            item,
            anchor,
            issue: `Evidence anchor ${anchor.evidenceItemId} is not an eligible evidence item for this participant session.`,
            options: input.options,
          }));
        }
      }
      retained.push(item);
    }
    return { section, items: retained };
  });
  for (const link of input.output.sequenceMap.sequenceLinks) {
    for (const anchor of link.evidenceAnchors) {
      if (!knownEvidenceIds.has(anchor.evidenceItemId)) {
        disputes.push({
          disputeId: disputeId(input.options),
          sessionId: input.session.sessionId,
          extractionId: input.output.extractionId,
          affectedItemId: `${link.fromItemId}->${link.toItemId}`,
          aiProposedInterpretation: `Sequence relation ${link.relationType} from ${link.fromItemId} to ${link.toItemId}.`,
          aiProposedEvidenceAnchor: anchor,
          codeValidationIssue: `Sequence evidence anchor ${anchor.evidenceItemId} is not an eligible evidence item for this participant session.`,
          disputeType: "anchor_not_found",
          severity: "high",
          recommendedAction: "admin_review",
          adminDecision: "pending",
          createdAt: extractionNow(input.options),
        });
      }
    }
  }

  const sectionMap = Object.fromEntries(retainedSections.map((entry) => [entry.section, entry.items])) as Record<string, ExtractedItem[]>;
  const mappedCount = retainedSections.reduce((sum, entry) => sum + entry.items.length, 0);
  const finalDefects = defects;
  const finalDisputes = disputes;
  const clean = input.output.unmappedContentItems.length === 0 && finalDefects.length === 0 && finalDisputes.length === 0;
  const extractionStatus: ExtractionStatus = finalDisputes.length > 0
    ? "completed_with_evidence_disputes"
    : finalDefects.length > 0
      ? "completed_with_defects"
      : input.output.unmappedContentItems.length > 0
        ? "completed_with_unmapped"
        : "completed_clean";
  const filteredBasisEvidenceItemIds = input.output.basisEvidenceItemIds.filter((id) => knownEvidenceIds.has(id));
  const output: FirstPassExtractionOutput = {
    ...input.output,
    basisEvidenceItemIds: filteredBasisEvidenceItemIds.length > 0
      ? filteredBasisEvidenceItemIds
      : input.eligibleEvidence.map((item) => item.evidenceItemId),
    extractionStatus,
    extractedActors: sectionMap.extractedActors ?? [],
    extractedSteps: sectionMap.extractedSteps ?? [],
    extractedDecisionPoints: sectionMap.extractedDecisionPoints ?? [],
    extractedHandoffs: sectionMap.extractedHandoffs ?? [],
    extractedExceptions: sectionMap.extractedExceptions ?? [],
    extractedSystems: sectionMap.extractedSystems ?? [],
    extractedControls: sectionMap.extractedControls ?? [],
    extractedDependencies: sectionMap.extractedDependencies ?? [],
    extractedUnknowns: sectionMap.extractedUnknowns ?? [],
    extractionDefects: finalDefects,
    evidenceDisputes: finalDisputes,
    sourceCoverageSummary: buildSourceCoverageSummary({
      evidenceIds: input.eligibleEvidence.map((item) => item.evidenceItemId),
      fullContentProcessed: true,
      mappedCount,
      unmappedCount: input.output.unmappedContentItems.length,
      defectCount: finalDefects.length,
      disputeCount: finalDisputes.length,
      clean,
    }),
  };
  return { output, defects: finalDefects, disputes: finalDisputes, warnings };
}

function parseExtractionOutput(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return JSON.parse(fenced ? fenced[1] ?? "" : trimmed);
}

function buildFirstPassExtractionPromptInput(session: ParticipantSession, eligibleEvidence: RawEvidenceItem[]): Pass5PromptInputBundle {
  const evidenceText = eligibleEvidence.map((item) => [
    `EvidenceItemId: ${item.evidenceItemId}`,
    `EvidenceType: ${item.evidenceType}`,
    `TrustStatus: ${item.trustStatus}`,
    `Language: ${item.language}`,
    `CapturedAt: ${item.capturedAt}`,
    `RawContent:`,
    item.rawContent ?? `[artifactRef: ${item.artifactRef ?? "none"}]`,
  ].join("\n")).join("\n\n---\n\n");
  return {
    promptName: "first_pass_extraction_prompt",
    caseId: session.caseId,
    sessionId: session.sessionId,
    languagePreference: session.languagePreference,
    channel: session.selectedParticipationMode === "telegram_bot" ? "telegram_bot"
      : session.selectedParticipationMode === "web_session_chatbot" ? "web_session_chatbot"
        : undefined,
    participantLabel: session.participantLabel,
    selectedDepartment: session.selectedDepartment,
    selectedUseCase: session.selectedUseCase,
    evidenceRefs: eligibleEvidence.map((item) => item.evidenceItemId),
    rawContent: [
      `Participant role/node: ${session.participantRoleOrNodeId}`,
      "Full eligible participant evidence follows. Process the full content before structuring.",
      evidenceText,
    ].join("\n\n"),
    contentRef: `participant-session:${session.sessionId}:eligible-evidence`,
  };
}

function updateSessionAfterExtraction(
  session: ParticipantSession,
  extraction: FirstPassExtractionOutput,
  createdClarificationCandidates: ClarificationCandidate[],
  createdBoundarySignals: BoundarySignal[],
  updatedAt: string,
): ParticipantSession {
  const sessionState = extraction.clarificationCandidates.length > 0 ? "clarification_needed" : "first_pass_extraction_ready";
  return {
    ...session,
    sessionState,
    extractionStatus: extraction.extractionStatus,
    clarificationItems: [...session.clarificationItems, ...createdClarificationCandidates],
    boundarySignals: [...session.boundarySignals, ...createdBoundarySignals],
    unresolvedItems: [...session.unresolvedItems, ...extraction.unmappedContentItems],
    analysisProgress: {
      ...session.analysisProgress,
      extractionStatus: extraction.extractionStatus,
      clarificationItemIds: [
        ...new Set([
          ...session.analysisProgress.clarificationItemIds,
          ...createdClarificationCandidates.map((candidate) => candidate.candidateId),
        ]),
      ],
      boundarySignalIds: [
        ...new Set([
          ...session.analysisProgress.boundarySignalIds,
          ...createdBoundarySignals.map((signal) => signal.boundarySignalId),
        ]),
      ],
      unresolvedItemIds: [
        ...new Set([
          ...session.analysisProgress.unresolvedItemIds,
          ...extraction.unmappedContentItems.map((item) => item.unmappedItemId),
        ]),
      ],
    },
    updatedAt,
  };
}

export async function runFirstPassExtractionForSession(
  sessionId: string,
  repos: FirstPassExtractionRepos,
  providerOrExecutor: FirstPassExtractionExecutor | null,
  options?: FirstPassExtractionOptions,
): Promise<FirstPassExtractionRunResult> {
  const session = repos.participantSessions.findById(sessionId);
  if (!session) {
    return extractionFailure({
      sessionId,
      code: "session_not_found",
      message: `ParticipantSession not found: ${sessionId}`,
    });
  }

  const eligibleEvidence = listExtractionEligibleEvidenceForSession(sessionId, repos.rawEvidenceItems);
  if (eligibleEvidence.length === 0) {
    return extractionFailure({
      sessionId,
      code: "no_eligible_evidence",
      message: "No extraction-eligible raw evidence exists for this participant session.",
    });
  }

  const promptBundle = buildFirstPassExtractionPromptInput(session, eligibleEvidence);
  const compiled = compilePass5Prompt("first_pass_extraction_prompt", promptBundle, repos.promptSpecs);
  const queuedJob = createExtractionProviderJob({
    session,
    promptBundle,
    provider: providerOrExecutor,
    promptVersionId: compiled.promptSpec.promptSpecId,
    basePromptVersionId: compiled.basePromptSpec.promptSpecId,
    outputContractRef: compiled.promptSpec.outputContractRef,
    repos,
    options,
  });

  if (!providerOrExecutor) {
    const failed = saveProviderJob({
      ...queuedJob,
      status: "failed",
      errorMessage: "provider_not_configured: no provider was supplied for first-pass extraction.",
      updatedAt: extractionNow(options),
    }, repos);
    return extractionFailure({
      sessionId,
      providerJobId: failed.jobId,
      code: "provider_not_configured",
      message: failed.errorMessage ?? "provider_not_configured",
    });
  }

  const running = saveProviderJob({
    ...queuedJob,
    status: "running",
    updatedAt: extractionNow(options),
  }, repos);

  let providerText: string;
  let providerName: "google" | "openai";
  let model: string;
  try {
    const result = await providerOrExecutor.runPromptText({ compiledPrompt: compiled.compiledPrompt });
    providerText = result.text;
    providerName = result.provider;
    model = result.model;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = saveProviderJob({
      ...running,
      status: "failed",
      errorMessage: message,
      updatedAt: extractionNow(options),
    }, repos);
    markExtractionSessionFailed(session, repos, options);
    return extractionFailure({
      sessionId,
      providerJobId: failed.jobId,
      code: "provider_execution_failed",
      message,
    });
  }

  let parsed: unknown;
  try {
    parsed = parseExtractionOutput(providerText);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = saveProviderJob({
      ...running,
      status: "failed",
      provider: providerName,
      model,
      errorMessage: `provider_output_not_json: ${message}`,
      updatedAt: extractionNow(options),
    }, repos);
    return extractionFailure({
      sessionId,
      providerJobId: failed.jobId,
      code: "provider_output_not_json",
      message: failed.errorMessage ?? "provider_output_not_json",
    });
  }

  const candidateOutput = parsed as FirstPassExtractionOutput;
  let outputWithIds: FirstPassExtractionOutput = {
    ...candidateOutput,
    extractionId: candidateOutput.extractionId || extractionId(options),
    sessionId: session.sessionId,
    basisEvidenceItemIds: candidateOutput.basisEvidenceItemIds?.length
      ? candidateOutput.basisEvidenceItemIds
      : eligibleEvidence.map((item) => item.evidenceItemId),
    createdAt: candidateOutput.createdAt || extractionNow(options),
  };
  let repairAttempted = false;
  const initialShapeErrors = validateRequiredExtractionArrays(outputWithIds);
  if (initialShapeErrors.length > 0) {
    repairAttempted = true;
    const repairJob: StoredProviderExtractionJob = {
      ...running,
      jobId: `${running.jobId}:repair`,
      status: "running",
      provider: providerName,
      model,
      inputBundleRef: JSON.stringify({
        sessionId,
        promptName: "first_pass_extraction_prompt",
        repairOfProviderJobId: running.jobId,
        validationErrors: initialShapeErrors,
      }),
      updatedAt: extractionNow(options),
    };
    repos.providerJobs.save(repairJob);
    try {
      const repairResult = await providerOrExecutor.runPromptText({
        compiledPrompt: buildExtractionJsonRepairPrompt({
          originalJson: outputWithIds,
          validationErrors: initialShapeErrors,
        }),
      });
      const repairedParsed = parseExtractionOutput(repairResult.text) as FirstPassExtractionOutput;
      const repairedOutput: FirstPassExtractionOutput = {
        ...repairedParsed,
        extractionId: repairedParsed.extractionId || outputWithIds.extractionId,
        sessionId: session.sessionId,
        basisEvidenceItemIds: repairedParsed.basisEvidenceItemIds?.length
          ? repairedParsed.basisEvidenceItemIds
          : outputWithIds.basisEvidenceItemIds,
        createdAt: repairedParsed.createdAt || outputWithIds.createdAt,
      };
      const repairedShapeErrors = validateRequiredExtractionArrays(repairedOutput);
      if (repairedShapeErrors.length > 0) {
        const message = `invalid_provider_extraction_output: repair_failed ${repairedShapeErrors.join("; ")}`;
        saveProviderJob({
          ...repairJob,
          status: "failed",
          provider: repairResult.provider,
          model: repairResult.model,
          errorMessage: message,
          updatedAt: extractionNow(options),
        }, repos);
        const failed = saveProviderJob({
          ...running,
          status: "failed",
          provider: providerName,
          model,
          errorMessage: message,
          updatedAt: extractionNow(options),
        }, repos);
        markExtractionSessionFailed(session, repos, options);
        return extractionFailure({
          sessionId,
          providerJobId: failed.jobId,
          code: "invalid_provider_extraction_output",
          message,
          warnings: repairedShapeErrors,
        });
      }
      outputWithIds = repairedOutput;
      saveProviderJob({
        ...repairJob,
        status: "succeeded",
        provider: repairResult.provider,
        model: repairResult.model,
        outputRef: `first_pass_extraction_repair_output_length:${repairResult.text.length}`,
        updatedAt: extractionNow(options),
      }, repos);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorMessage = `invalid_provider_extraction_output: repair_failed ${message}`;
      saveProviderJob({
        ...repairJob,
        status: "failed",
        provider: providerName,
        model,
        errorMessage,
        updatedAt: extractionNow(options),
      }, repos);
      const failed = saveProviderJob({
        ...running,
        status: "failed",
        provider: providerName,
        model,
        errorMessage,
        updatedAt: extractionNow(options),
      }, repos);
      markExtractionSessionFailed(session, repos, options);
      return extractionFailure({
        sessionId,
        providerJobId: failed.jobId,
        code: "invalid_provider_extraction_output",
        message: errorMessage,
        warnings: initialShapeErrors,
      });
    }
  }
  let governed: { output: FirstPassExtractionOutput; defects: ExtractionDefect[]; disputes: EvidenceDispute[]; warnings: string[] };
  try {
    governed = validateAndGovernExtractionOutput({
      output: outputWithIds,
      session,
      eligibleEvidence,
      options,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = saveProviderJob({
      ...running,
      status: "failed",
      provider: providerName,
      model,
      errorMessage: `invalid_provider_extraction_output: ${message}`,
      updatedAt: extractionNow(options),
    }, repos);
    markExtractionSessionFailed(session, repos, options);
    return extractionFailure({
      sessionId,
      providerJobId: failed.jobId,
      code: "invalid_provider_extraction_output",
      message: failed.errorMessage ?? "invalid_provider_extraction_output",
    });
  }
  const validation = validateFirstPassExtractionOutput(governed.output);
  if (!validation.ok) {
    const detailedValidationErrors = formatDetailedValidationErrors(
      validation.errors,
      governed.output,
      repairAttempted ? "after_repair" : "before_repair",
    );
    if (!repairAttempted) {
      repairAttempted = true;
      const repairJob: StoredProviderExtractionJob = {
        ...running,
        jobId: `${running.jobId}:repair`,
        status: "running",
        provider: providerName,
        model,
        inputBundleRef: JSON.stringify({
          sessionId,
          promptName: "first_pass_extraction_prompt",
          repairOfProviderJobId: running.jobId,
          validationErrors: detailedValidationErrors.split("; "),
        }),
        updatedAt: extractionNow(options),
      };
      repos.providerJobs.save(repairJob);
      try {
        const repairResult = await providerOrExecutor.runPromptText({
          compiledPrompt: buildExtractionJsonRepairPrompt({
            originalJson: outputWithIds,
            validationErrors: [`schema_validation_failed: ${detailedValidationErrors}`],
          }),
        });
        const repairedParsed = parseExtractionOutput(repairResult.text) as FirstPassExtractionOutput;
        const repairedOutput: FirstPassExtractionOutput = {
          ...repairedParsed,
          extractionId: repairedParsed.extractionId || outputWithIds.extractionId,
          sessionId: session.sessionId,
          basisEvidenceItemIds: repairedParsed.basisEvidenceItemIds?.length
            ? repairedParsed.basisEvidenceItemIds
            : outputWithIds.basisEvidenceItemIds,
          createdAt: repairedParsed.createdAt || outputWithIds.createdAt,
        };
        const repairedShapeErrors = validateRequiredExtractionArrays(repairedOutput);
        if (repairedShapeErrors.length > 0) {
          const message = `invalid_provider_extraction_output: repair_failed ${repairedShapeErrors.join("; ")}`;
          saveProviderJob({
            ...repairJob,
            status: "failed",
            provider: repairResult.provider,
            model: repairResult.model,
            errorMessage: message,
            updatedAt: extractionNow(options),
          }, repos);
          const failed = saveProviderJob({
            ...running,
            status: "failed",
            provider: providerName,
            model,
            errorMessage: message,
            updatedAt: extractionNow(options),
          }, repos);
          markExtractionSessionFailed(session, repos, options);
          return extractionFailure({
            sessionId,
            providerJobId: failed.jobId,
            code: "invalid_provider_extraction_output",
            message,
            defects: governed.defects,
            disputes: governed.disputes,
            unmapped: governed.output.unmappedContentItems,
            warnings: [...governed.warnings, ...repairedShapeErrors],
          });
        }
        let repairedGoverned: { output: FirstPassExtractionOutput; defects: ExtractionDefect[]; disputes: EvidenceDispute[]; warnings: string[] };
        try {
          repairedGoverned = validateAndGovernExtractionOutput({
            output: repairedOutput,
            session,
            eligibleEvidence,
            options,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const errorMessage = `invalid_provider_extraction_output: repair_failed ${message}`;
          saveProviderJob({
            ...repairJob,
            status: "failed",
            provider: repairResult.provider,
            model: repairResult.model,
            errorMessage,
            updatedAt: extractionNow(options),
          }, repos);
          const failed = saveProviderJob({
            ...running,
            status: "failed",
            provider: providerName,
            model,
            errorMessage,
            updatedAt: extractionNow(options),
          }, repos);
          markExtractionSessionFailed(session, repos, options);
          return extractionFailure({
            sessionId,
            providerJobId: failed.jobId,
            code: "invalid_provider_extraction_output",
            message: errorMessage,
            defects: governed.defects,
            disputes: governed.disputes,
            unmapped: governed.output.unmappedContentItems,
            warnings: governed.warnings,
          });
        }
        const repairedValidation = validateFirstPassExtractionOutput(repairedGoverned.output);
        if (!repairedValidation.ok) {
          const repairedDetailedErrors = formatDetailedValidationErrors(
            repairedValidation.errors,
            repairedGoverned.output,
            "after_repair",
          );
          const message = `schema_validation_failed: repair_failed ${repairedDetailedErrors}`;
          saveProviderJob({
            ...repairJob,
            status: "failed",
            provider: repairResult.provider,
            model: repairResult.model,
            errorMessage: message,
            updatedAt: extractionNow(options),
          }, repos);
          const failed = saveProviderJob({
            ...running,
            status: "failed",
            provider: providerName,
            model,
            errorMessage: message,
            updatedAt: extractionNow(options),
          }, repos);
          markExtractionSessionFailed(session, repos, options);
          return extractionFailure({
            sessionId,
            providerJobId: failed.jobId,
            code: "schema_validation_failed",
            message,
            defects: repairedGoverned.defects,
            disputes: repairedGoverned.disputes,
            unmapped: repairedGoverned.output.unmappedContentItems,
            warnings: repairedGoverned.warnings,
          });
        }
        outputWithIds = repairedOutput;
        governed = repairedGoverned;
        saveProviderJob({
          ...repairJob,
          status: "succeeded",
          provider: repairResult.provider,
          model: repairResult.model,
          outputRef: `first_pass_extraction_schema_repair_output_length:${repairResult.text.length}`,
          updatedAt: extractionNow(options),
        }, repos);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const errorMessage = `schema_validation_failed: repair_failed ${message}`;
        saveProviderJob({
          ...repairJob,
          status: "failed",
          provider: providerName,
          model,
          errorMessage,
          updatedAt: extractionNow(options),
        }, repos);
        const failed = saveProviderJob({
          ...running,
          status: "failed",
          provider: providerName,
          model,
          errorMessage,
          updatedAt: extractionNow(options),
        }, repos);
        markExtractionSessionFailed(session, repos, options);
        return extractionFailure({
          sessionId,
          providerJobId: failed.jobId,
          code: "schema_validation_failed",
          message: errorMessage,
          defects: governed.defects,
          disputes: governed.disputes,
          unmapped: governed.output.unmappedContentItems,
          warnings: governed.warnings,
        });
      }
    } else {
    const failed = saveProviderJob({
      ...running,
      status: "failed",
      provider: providerName,
      model,
      errorMessage: `schema_validation_failed: ${detailedValidationErrors}`,
      updatedAt: extractionNow(options),
    }, repos);
    markExtractionSessionFailed(session, repos, options);
    return extractionFailure({
      sessionId,
      providerJobId: failed.jobId,
      code: "schema_validation_failed",
      message: failed.errorMessage ?? "schema_validation_failed",
      defects: governed.defects,
      disputes: governed.disputes,
      unmapped: governed.output.unmappedContentItems,
      warnings: governed.warnings,
    });
    }
  }

  for (const candidate of governed.output.clarificationCandidates) {
    const result = validateClarificationCandidate(candidate);
    if (!result.ok) {
      return extractionFailure({
        sessionId,
        providerJobId: running.jobId,
        code: "schema_validation_failed",
        message: `ClarificationCandidate validation failed: ${validationMessage(result.errors)}`,
        defects: governed.defects,
        disputes: governed.disputes,
        unmapped: governed.output.unmappedContentItems,
        warnings: governed.warnings,
      });
    }
  }
  for (const signal of governed.output.boundarySignals) {
    const result = validateBoundarySignal(signal);
    if (!result.ok) {
      return extractionFailure({
        sessionId,
        providerJobId: running.jobId,
        code: "schema_validation_failed",
        message: `BoundarySignal validation failed: ${validationMessage(result.errors)}`,
        defects: governed.defects,
        disputes: governed.disputes,
        unmapped: governed.output.unmappedContentItems,
        warnings: governed.warnings,
      });
    }
  }
  for (const dispute of governed.output.evidenceDisputes) {
    const result = validateEvidenceDispute(dispute);
    if (!result.ok) {
      return extractionFailure({
        sessionId,
        providerJobId: running.jobId,
        code: "schema_validation_failed",
        message: `EvidenceDispute validation failed: ${validationMessage(result.errors)}`,
        defects: governed.defects,
        disputes: governed.disputes,
        unmapped: governed.output.unmappedContentItems,
        warnings: governed.warnings,
      });
    }
  }

  try {
    repos.firstPassExtractionOutputs.save(governed.output);
    for (const candidate of governed.output.clarificationCandidates) repos.clarificationCandidates.save(candidate);
    for (const signal of governed.output.boundarySignals) repos.boundarySignals.save(signal);
    for (const dispute of governed.output.evidenceDisputes) repos.evidenceDisputes.save(dispute);
    repos.participantSessions.save(updateSessionAfterExtraction(
      session,
      governed.output,
      governed.output.clarificationCandidates,
      governed.output.boundarySignals,
      extractionNow(options),
    ));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = saveProviderJob({
      ...running,
      status: "failed",
      provider: providerName,
      model,
      errorMessage: `persistence_failed: ${message}`,
      updatedAt: extractionNow(options),
    }, repos);
    return extractionFailure({
      sessionId,
      providerJobId: failed.jobId,
      code: "persistence_failed",
      message: failed.errorMessage ?? "persistence_failed",
      defects: governed.defects,
      disputes: governed.disputes,
      unmapped: governed.output.unmappedContentItems,
      warnings: governed.warnings,
    });
  }

  const succeeded = saveProviderJob({
    ...running,
    status: "succeeded",
    provider: providerName,
    model,
    outputRef: governed.output.extractionId,
    updatedAt: extractionNow(options),
  }, repos);

  return {
    ok: true,
    sessionId,
    extractionId: governed.output.extractionId,
    providerJobId: succeeded.jobId,
    createdExtraction: governed.output,
    createdClarificationCandidates: governed.output.clarificationCandidates,
    createdBoundarySignals: governed.output.boundarySignals,
    defects: governed.defects,
    evidenceDisputes: governed.disputes,
    unmappedContentItems: governed.output.unmappedContentItems,
    warnings: governed.warnings,
    errors: [],
  };
}

export type ClarificationErrorCode =
  | "session_not_found"
  | "candidate_not_found"
  | "no_open_candidates"
  | "active_question_already_exists"
  | "candidate_not_ready"
  | "candidate_already_resolved"
  | "answer_evidence_not_found"
  | "provider_not_configured"
  | "provider_execution_failed"
  | "provider_output_not_json"
  | "schema_validation_failed"
  | "persistence_failed";

export interface ClarificationRepos {
  participantSessions: ParticipantSessionRepository;
  rawEvidenceItems: RawEvidenceItemRepository;
  clarificationCandidates: ClarificationCandidateRepository;
  boundarySignals: BoundarySignalRepository;
  providerJobs: ProviderExtractionJobRepository;
  promptSpecs: StructuredPromptSpecRepository;
}

export interface ClarificationOptions {
  now?: () => string;
  evidenceItemIdFactory?: () => string;
  candidateIdFactory?: () => string;
  boundarySignalIdFactory?: () => string;
  providerJobIdFactory?: () => string;
}

export type ClarificationResult<T> =
  | { ok: true; value: T; warnings: string[]; errors: [] }
  | { ok: false; value: null; warnings: string[]; errors: { code: ClarificationErrorCode; message: string }[] };

export interface ClarificationSelection {
  candidate: ClarificationCandidate;
  activeQuestionAlreadyAsked: boolean;
}

export interface RecordClarificationAnswerInput {
  sessionId: string;
  candidateId: string;
  answerText: string;
  sourceChannel?: ParticipationMode;
  language?: string;
  capturedAt?: string;
  capturedBy?: "participant" | "admin";
}

export interface AnswerRecheckStatusUpdate {
  candidateId: string;
  status: "resolved" | "partially_resolved" | "open" | "escalated" | "dismissed_by_admin";
  reason: string;
}

export interface AnswerRecheckPayload {
  candidateStatusUpdates: AnswerRecheckStatusUpdate[];
  newClarificationCandidates?: Partial<ClarificationCandidate>[];
  boundarySignals?: Partial<BoundarySignal>[];
}

export interface AnswerRecheckResult {
  updatedCandidates: ClarificationCandidate[];
  createdCandidates: ClarificationCandidate[];
  createdBoundarySignals: BoundarySignal[];
  providerJobId: string;
}

export interface AdminClarificationCandidateInput {
  sessionId: string;
  questionTheme: string;
  exactQuestion?: string;
  instruction?: string;
  whyItMatters?: string;
  exampleAnswer?: string;
  gapType?: ClarificationCandidate["gapType"];
  priority?: ClarificationCandidate["priority"];
  askNext?: boolean;
  linkedRawEvidenceItemIds?: string[];
  linkedExtractedItemIds?: string[];
  linkedUnmappedItemIds?: string[];
  linkedDefectIds?: string[];
}

function clarificationNow(options?: ClarificationOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function clarificationProviderJobId(options?: ClarificationOptions): string {
  return options?.providerJobIdFactory?.() ?? `pass5_clarification_job_${crypto.randomUUID()}`;
}

function clarificationCandidateId(options?: ClarificationOptions): string {
  return options?.candidateIdFactory?.() ?? `clarification_candidate_${crypto.randomUUID()}`;
}

function clarificationEvidenceItemId(options?: ClarificationOptions): string {
  return options?.evidenceItemIdFactory?.() ?? `raw_evidence_${crypto.randomUUID()}`;
}

function clarificationBoundarySignalId(options?: ClarificationOptions): string {
  return options?.boundarySignalIdFactory?.() ?? `boundary_signal_${crypto.randomUUID()}`;
}

function clarificationFailure<T>(
  code: ClarificationErrorCode,
  message: string,
  warnings: string[] = [],
): ClarificationResult<T> {
  return { ok: false, value: null, warnings, errors: [{ code, message }] };
}

function priorityScore(priority: ClarificationCandidate["priority"]): number {
  return priority === "high" ? 3 : priority === "medium" ? 2 : 1;
}

function gapTypeScore(gapType: ClarificationCandidate["gapType"]): number {
  if (gapType === "contradiction" || gapType === "boundary_or_unknown") return 4;
  if (gapType === "unclear_sequence" || gapType === "unclear_handoff") return 3;
  if (gapType === "unclear_actor" || gapType === "unclear_owner") return 2;
  return 1;
}

function saveClarificationProviderJob(input: {
  session: ParticipantSession;
  promptName: "clarification_formulation_prompt" | "answer_recheck_prompt" | "admin_added_question_prompt";
  promptVersionId: string;
  basePromptVersionId: string;
  outputContractRef?: string;
  provider: FirstPassExtractionExecutor | null;
  repos: ClarificationRepos;
  options?: ClarificationOptions;
  status?: StoredProviderExtractionJob["status"];
  errorMessage?: string;
  outputRef?: string;
}): StoredProviderExtractionJob {
  const timestamp = clarificationNow(input.options);
  const job: StoredProviderExtractionJob = {
    jobId: clarificationProviderJobId(input.options),
    sourceId: input.session.sessionId,
    sessionId: input.session.sessionId,
    caseId: input.session.caseId,
    provider: input.provider?.name ?? "google",
    jobKind: "pass5_prompt_test",
    status: input.status ?? "queued",
    inputType: "manual_note",
    promptFamily: PASS5_PROMPT_FAMILY,
    promptName: input.promptName,
    promptVersionId: input.promptVersionId,
    basePromptVersionId: input.basePromptVersionId,
    inputBundleRef: `participant-session:${input.session.sessionId}:clarification`,
    outputContractRef: input.outputContractRef,
    outputRef: input.outputRef,
    errorMessage: input.errorMessage,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.providerJobs.save(job);
  return job;
}

function parseJsonObject(text: string): Record<string, unknown> {
  const parsed = parseExtractionOutput(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Provider output must be a JSON object.");
  return parsed as Record<string, unknown>;
}

function updateClarificationSessionState(
  sessionId: string,
  repos: ClarificationRepos,
  sessionState: ParticipantSession["sessionState"],
  updatedAt: string,
): ParticipantSession | null {
  const session = repos.participantSessions.findById(sessionId);
  if (!session) return null;
  const updated: ParticipantSession = { ...session, sessionState, updatedAt };
  repos.participantSessions.save(updated);
  return updated;
}

export function listOpenClarificationCandidates(
  sessionId: string,
  repos: Pick<ClarificationRepos, "clarificationCandidates">,
): ClarificationCandidate[] {
  return repos.clarificationCandidates.findBySessionId(sessionId)
    .filter((candidate) => candidate.status === "open" || candidate.status === "partially_resolved");
}

export function selectNextClarificationCandidate(
  sessionId: string,
  repos: Pick<ClarificationRepos, "participantSessions" | "clarificationCandidates">,
): ClarificationResult<ClarificationSelection> {
  const session = repos.participantSessions.findById(sessionId);
  if (!session) return clarificationFailure("session_not_found", `ParticipantSession not found: ${sessionId}`);
  const candidates = repos.clarificationCandidates.findBySessionId(sessionId);
  const asked = candidates.find((candidate) => candidate.status === "asked");
  if (asked) return { ok: true, value: { candidate: asked, activeQuestionAlreadyAsked: true }, warnings: [], errors: [] };
  const selectable = candidates.filter((candidate) => candidate.status === "open" || candidate.status === "partially_resolved");
  if (selectable.length === 0) return clarificationFailure("no_open_candidates", "No open clarification candidates are available.");
  selectable.sort((a, b) => {
    const askNext = Number(b.askNext) - Number(a.askNext);
    if (askNext !== 0) return askNext;
    const priority = priorityScore(b.priority) - priorityScore(a.priority);
    if (priority !== 0) return priority;
    const gap = gapTypeScore(b.gapType) - gapTypeScore(a.gapType);
    if (gap !== 0) return gap;
    const links = (
      b.linkedDefectIds.length + b.linkedUnmappedItemIds.length + b.linkedRawEvidenceItemIds.length
    ) - (
      a.linkedDefectIds.length + a.linkedUnmappedItemIds.length + a.linkedRawEvidenceItemIds.length
    );
    if (links !== 0) return links;
    return a.createdAt.localeCompare(b.createdAt);
  });
  return { ok: true, value: { candidate: selectable[0]!, activeQuestionAlreadyAsked: false }, warnings: [], errors: [] };
}

export async function formulateClarificationQuestion(
  candidateId: string,
  repos: ClarificationRepos,
  executor: FirstPassExtractionExecutor | null,
  options?: ClarificationOptions,
): Promise<ClarificationResult<{ candidate: ClarificationCandidate; providerJobId: string }>> {
  const candidate = repos.clarificationCandidates.findById(candidateId);
  if (!candidate) return clarificationFailure("candidate_not_found", `ClarificationCandidate not found: ${candidateId}`);
  const session = repos.participantSessions.findById(candidate.sessionId);
  if (!session) return clarificationFailure("session_not_found", `ParticipantSession not found: ${candidate.sessionId}`);
  const compiled = compilePass5Prompt("clarification_formulation_prompt", {
    promptName: "clarification_formulation_prompt",
    caseId: session.caseId,
    sessionId: session.sessionId,
    languagePreference: session.languagePreference,
    participantLabel: session.participantLabel,
    selectedDepartment: session.selectedDepartment,
    selectedUseCase: session.selectedUseCase,
    evidenceRefs: candidate.linkedRawEvidenceItemIds,
    adminInstruction: JSON.stringify(candidate),
  }, repos.promptSpecs);
  const queued = saveClarificationProviderJob({
    session,
    promptName: "clarification_formulation_prompt",
    promptVersionId: compiled.promptSpec.promptSpecId,
    basePromptVersionId: compiled.basePromptSpec.promptSpecId,
    outputContractRef: compiled.promptSpec.outputContractRef,
    provider: executor,
    repos,
    options,
  });
  if (!executor) {
    const failed = { ...queued, status: "failed" as const, errorMessage: "provider_not_configured: no provider supplied for clarification formulation.", updatedAt: clarificationNow(options) };
    repos.providerJobs.save(failed);
    return clarificationFailure("provider_not_configured", failed.errorMessage, []);
  }
  try {
    const result = await executor.runPromptText({ compiledPrompt: compiled.compiledPrompt });
    const payload = parseJsonObject(result.text);
    const updated: ClarificationCandidate = {
      ...candidate,
      participantFacingQuestion: String(payload.participantFacingQuestion ?? candidate.participantFacingQuestion),
      whyItMatters: String(payload.whyItMatters ?? candidate.whyItMatters),
      exampleAnswer: String(payload.exampleAnswer ?? candidate.exampleAnswer),
      aiFormulated: true,
      adminReviewStatus: "review_required",
      updatedAt: clarificationNow(options),
    };
    const validation = validateClarificationCandidate(updated);
    if (!validation.ok) return clarificationFailure("schema_validation_failed", `ClarificationCandidate validation failed: ${validationMessage(validation.errors)}`);
    repos.clarificationCandidates.save(updated);
    const succeeded = { ...queued, status: "succeeded" as const, provider: result.provider, model: result.model, outputRef: updated.candidateId, updatedAt: clarificationNow(options) };
    repos.providerJobs.save(succeeded);
    return { ok: true, value: { candidate: updated, providerJobId: succeeded.jobId }, warnings: [], errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = { ...queued, status: "failed" as const, errorMessage: message, updatedAt: clarificationNow(options) };
    repos.providerJobs.save(failed);
    return clarificationFailure(message.includes("JSON") ? "provider_output_not_json" : "provider_execution_failed", message);
  }
}

export function markClarificationCandidateAsked(
  candidateId: string,
  repos: ClarificationRepos,
  options?: ClarificationOptions,
): ClarificationResult<ClarificationCandidate> {
  const candidate = repos.clarificationCandidates.findById(candidateId);
  if (!candidate) return clarificationFailure("candidate_not_found", `ClarificationCandidate not found: ${candidateId}`);
  if (candidate.status === "resolved" || candidate.status === "dismissed_by_admin") {
    return clarificationFailure("candidate_already_resolved", `Candidate ${candidateId} is not actionable.`);
  }
  const active = repos.clarificationCandidates.findBySessionId(candidate.sessionId)
    .find((other) => other.status === "asked" && other.candidateId !== candidateId);
  if (active) return clarificationFailure("active_question_already_exists", `Candidate ${active.candidateId} is already asked.`);
  const updated: ClarificationCandidate = { ...candidate, status: "asked", updatedAt: clarificationNow(options) };
  repos.clarificationCandidates.save(updated);
  updateClarificationSessionState(candidate.sessionId, repos, "clarification_in_progress", updated.updatedAt);
  return { ok: true, value: updated, warnings: [], errors: [] };
}

export function recordClarificationAnswer(
  input: RecordClarificationAnswerInput,
  repos: ClarificationRepos,
  options?: ClarificationOptions,
): ClarificationResult<RawEvidenceItem> {
  const session = repos.participantSessions.findById(input.sessionId);
  if (!session) return clarificationFailure("session_not_found", `ParticipantSession not found: ${input.sessionId}`);
  const candidate = repos.clarificationCandidates.findById(input.candidateId);
  if (!candidate) return clarificationFailure("candidate_not_found", `ClarificationCandidate not found: ${input.candidateId}`);
  if (candidate.sessionId !== input.sessionId) return clarificationFailure("candidate_not_ready", "Candidate does not belong to the session.");
  const capturedAt = input.capturedAt ?? clarificationNow(options);
  const evidenceItem: RawEvidenceItem = {
    evidenceItemId: clarificationEvidenceItemId(options),
    sessionId: input.sessionId,
    evidenceType: "participant_clarification_answer",
    sourceChannel: input.sourceChannel ?? session.selectedParticipationMode,
    rawContent: input.answerText,
    language: input.language ?? session.languagePreference,
    capturedAt,
    capturedBy: input.capturedBy ?? "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: candidate.candidateId,
    notes: `Clarification answer for ${candidate.candidateId}.`,
  };
  const validation = validateRawEvidenceItem(evidenceItem);
  if (!validation.ok) return clarificationFailure("schema_validation_failed", `RawEvidenceItem validation failed: ${validationMessage(validation.errors)}`);
  repos.rawEvidenceItems.save(evidenceItem);
  repos.clarificationCandidates.save({ ...candidate, status: "answered", askNext: false, updatedAt: capturedAt });
  return { ok: true, value: evidenceItem, warnings: [], errors: [] };
}

function normalizeCandidateStatus(value: unknown): AnswerRecheckStatusUpdate["status"] {
  return value === "resolved" || value === "partially_resolved" || value === "open" || value === "escalated" || value === "dismissed_by_admin"
    ? value
    : "open";
}

function defaultBoundarySignalFromAnswer(input: {
  session: ParticipantSession;
  evidenceItem: RawEvidenceItem;
  candidate: ClarificationCandidate;
  partial?: Partial<BoundarySignal>;
  options?: ClarificationOptions;
}): BoundarySignal {
  return {
    boundarySignalId: input.partial?.boundarySignalId ?? clarificationBoundarySignalId(input.options),
    sessionId: input.session.sessionId,
    boundaryType: input.partial?.boundaryType ?? "knowledge_gap",
    participantStatement: input.partial?.participantStatement ?? input.evidenceItem.rawContent ?? "",
    linkedEvidenceItemId: input.evidenceItem.evidenceItemId,
    linkedExtractedItemIds: input.partial?.linkedExtractedItemIds ?? input.candidate.linkedExtractedItemIds,
    linkedClarificationCandidateIds: input.partial?.linkedClarificationCandidateIds ?? [input.candidate.candidateId],
    workflowArea: input.partial?.workflowArea ?? "unknown",
    interpretationNote: input.partial?.interpretationNote ?? "Boundary signal identified during answer recheck.",
    requiresEscalation: input.partial?.requiresEscalation ?? false,
    suggestedEscalationTarget: input.partial?.suggestedEscalationTarget ?? "none",
    participantSuggestedOwner: input.partial?.participantSuggestedOwner ?? null,
    escalationReason: input.partial?.escalationReason ?? null,
    shouldStopAskingParticipant: input.partial?.shouldStopAskingParticipant ?? true,
    confidenceLevel: input.partial?.confidenceLevel ?? "medium",
    createdAt: input.partial?.createdAt ?? clarificationNow(input.options),
  };
}

export async function runClarificationAnswerRecheck(
  sessionId: string,
  answerEvidenceId: string,
  repos: ClarificationRepos,
  executor: FirstPassExtractionExecutor | null,
  options?: ClarificationOptions,
): Promise<ClarificationResult<AnswerRecheckResult>> {
  const session = repos.participantSessions.findById(sessionId);
  if (!session) return clarificationFailure("session_not_found", `ParticipantSession not found: ${sessionId}`);
  const answerEvidence = repos.rawEvidenceItems.findById(answerEvidenceId);
  if (!answerEvidence) return clarificationFailure("answer_evidence_not_found", `Answer evidence not found: ${answerEvidenceId}`);
  const candidates = repos.clarificationCandidates.findBySessionId(sessionId).filter((candidate) =>
    candidate.status === "open"
    || candidate.status === "asked"
    || candidate.status === "partially_resolved"
    || candidate.candidateId === answerEvidence.linkedClarificationItemId
  );
  const compiled = compilePass5Prompt("answer_recheck_prompt", {
    promptName: "answer_recheck_prompt",
    caseId: session.caseId,
    sessionId,
    languagePreference: session.languagePreference,
    participantLabel: session.participantLabel,
    selectedDepartment: session.selectedDepartment,
    selectedUseCase: session.selectedUseCase,
    evidenceRefs: [answerEvidenceId],
    rawContent: answerEvidence.rawContent ?? "",
    adminInstruction: JSON.stringify({ candidates }),
  }, repos.promptSpecs);
  const queued = saveClarificationProviderJob({
    session,
    promptName: "answer_recheck_prompt",
    promptVersionId: compiled.promptSpec.promptSpecId,
    basePromptVersionId: compiled.basePromptSpec.promptSpecId,
    outputContractRef: compiled.promptSpec.outputContractRef,
    provider: executor,
    repos,
    options,
  });
  if (!executor) {
    const failed = { ...queued, status: "failed" as const, errorMessage: "provider_not_configured: no provider supplied for answer recheck.", updatedAt: clarificationNow(options) };
    repos.providerJobs.save(failed);
    return clarificationFailure("provider_not_configured", failed.errorMessage);
  }
  try {
    const result = await executor.runPromptText({ compiledPrompt: compiled.compiledPrompt });
    const payload = parseJsonObject(result.text) as unknown as AnswerRecheckPayload;
    const updatedCandidates: ClarificationCandidate[] = [];
    for (const update of payload.candidateStatusUpdates ?? []) {
      const candidate = repos.clarificationCandidates.findById(update.candidateId);
      if (!candidate || candidate.sessionId !== sessionId) continue;
      const status = normalizeCandidateStatus(update.status);
      const updated: ClarificationCandidate = {
        ...candidate,
        status,
        askNext: status === "open" || status === "partially_resolved",
        adminInstruction: update.reason || candidate.adminInstruction,
        updatedAt: clarificationNow(options),
      };
      repos.clarificationCandidates.save(updated);
      updatedCandidates.push(updated);
    }
    const createdCandidates: ClarificationCandidate[] = [];
    for (const partial of payload.newClarificationCandidates ?? []) {
      const candidate = buildAdminClarificationCandidate(session, {
        sessionId,
        questionTheme: partial.questionTheme ?? "Follow-up clarification",
        exactQuestion: partial.participantFacingQuestion,
        whyItMatters: partial.whyItMatters,
        exampleAnswer: partial.exampleAnswer,
        gapType: partial.gapType,
        priority: partial.priority,
        askNext: partial.askNext,
        linkedRawEvidenceItemIds: [answerEvidenceId],
        linkedExtractedItemIds: partial.linkedExtractedItemIds,
        linkedUnmappedItemIds: partial.linkedUnmappedItemIds,
        linkedDefectIds: partial.linkedDefectIds,
      }, "participant_answer_recheck", true, options);
      repos.clarificationCandidates.save(candidate);
      createdCandidates.push(candidate);
    }
    const activeCandidate = repos.clarificationCandidates.findById(answerEvidence.linkedClarificationItemId ?? "") ?? candidates[0];
    const createdBoundarySignals: BoundarySignal[] = [];
    for (const partial of payload.boundarySignals ?? []) {
      if (!activeCandidate) continue;
      const signal = defaultBoundarySignalFromAnswer({ session, evidenceItem: answerEvidence, candidate: activeCandidate, partial, options });
      const validation = validateBoundarySignal(signal);
      if (!validation.ok) return clarificationFailure("schema_validation_failed", `BoundarySignal validation failed: ${validationMessage(validation.errors)}`);
      repos.boundarySignals.save(signal);
      createdBoundarySignals.push(signal);
    }
    if (candidates.length > 0 && updatedCandidates.length === 0 && createdCandidates.length === 0 && createdBoundarySignals.length === 0) {
      const failed = {
        ...queued,
        status: "failed" as const,
        provider: result.provider,
        model: result.model,
        errorMessage: "schema_validation_failed: answer recheck provider output produced no governed outcome for supplied candidates.",
        updatedAt: clarificationNow(options),
      };
      repos.providerJobs.save(failed);
      return clarificationFailure(
        "schema_validation_failed",
        failed.errorMessage,
      );
    }
    const remaining = repos.clarificationCandidates.findBySessionId(sessionId)
      .filter((candidate) => candidate.status === "open" || candidate.status === "partially_resolved" || candidate.status === "asked");
    updateClarificationSessionState(
      sessionId,
      repos,
      remaining.length > 0 ? "clarification_needed" : "first_pass_extraction_ready",
      clarificationNow(options),
    );
    const succeeded = { ...queued, status: "succeeded" as const, provider: result.provider, model: result.model, outputRef: answerEvidenceId, updatedAt: clarificationNow(options) };
    repos.providerJobs.save(succeeded);
    return {
      ok: true,
      value: { updatedCandidates, createdCandidates, createdBoundarySignals, providerJobId: succeeded.jobId },
      warnings: [],
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = { ...queued, status: "failed" as const, errorMessage: message, updatedAt: clarificationNow(options) };
    repos.providerJobs.save(failed);
    return clarificationFailure(message.includes("JSON") ? "provider_output_not_json" : "provider_execution_failed", message);
  }
}

function buildAdminClarificationCandidate(
  session: ParticipantSession,
  input: AdminClarificationCandidateInput,
  createdFrom: ClarificationCandidate["createdFrom"],
  aiFormulated: boolean,
  options?: ClarificationOptions,
): ClarificationCandidate {
  const timestamp = clarificationNow(options);
  return {
    candidateId: clarificationCandidateId(options),
    sessionId: session.sessionId,
    linkedExtractedItemIds: input.linkedExtractedItemIds ?? [],
    linkedUnmappedItemIds: input.linkedUnmappedItemIds ?? [],
    linkedDefectIds: input.linkedDefectIds ?? [],
    linkedRawEvidenceItemIds: input.linkedRawEvidenceItemIds ?? [],
    gapType: input.gapType ?? "admin_observed_gap",
    questionTheme: input.questionTheme,
    participantFacingQuestion: input.exactQuestion ?? input.instruction ?? input.questionTheme,
    whyItMatters: input.whyItMatters ?? "This helps clarify the participant-level workflow draft.",
    exampleAnswer: input.exampleAnswer ?? "A short practical answer is enough.",
    priority: input.priority ?? "medium",
    askNext: input.askNext ?? false,
    status: "open",
    createdFrom,
    adminInstruction: input.instruction ?? input.exactQuestion ?? input.questionTheme,
    aiFormulated,
    adminReviewStatus: "review_required",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function addAdminClarificationCandidate(
  input: AdminClarificationCandidateInput,
  repos: ClarificationRepos,
  executor?: FirstPassExtractionExecutor | null,
  options?: ClarificationOptions,
): Promise<ClarificationResult<ClarificationCandidate>> {
  const session = repos.participantSessions.findById(input.sessionId);
  if (!session) return clarificationFailure("session_not_found", `ParticipantSession not found: ${input.sessionId}`);
  if (input.exactQuestion) {
    const candidate = buildAdminClarificationCandidate(session, input, "admin_entry", false, options);
    const validation = validateClarificationCandidate(candidate);
    if (!validation.ok) return clarificationFailure("schema_validation_failed", `ClarificationCandidate validation failed: ${validationMessage(validation.errors)}`);
    repos.clarificationCandidates.save(candidate);
    return { ok: true, value: candidate, warnings: [], errors: [] };
  }
  if (!executor) return clarificationFailure("provider_not_configured", "provider_not_configured: no provider supplied for admin-added question formulation.");
  const compiled = compilePass5Prompt("admin_added_question_prompt", {
    promptName: "admin_added_question_prompt",
    caseId: session.caseId,
    sessionId: session.sessionId,
    languagePreference: session.languagePreference,
    participantLabel: session.participantLabel,
    selectedDepartment: session.selectedDepartment,
    selectedUseCase: session.selectedUseCase,
    adminInstruction: input.instruction ?? input.questionTheme,
  }, repos.promptSpecs);
  const queued = saveClarificationProviderJob({
    session,
    promptName: "admin_added_question_prompt",
    promptVersionId: compiled.promptSpec.promptSpecId,
    basePromptVersionId: compiled.basePromptSpec.promptSpecId,
    outputContractRef: compiled.promptSpec.outputContractRef,
    provider: executor,
    repos,
    options,
  });
  try {
    const result = await executor.runPromptText({ compiledPrompt: compiled.compiledPrompt });
    const payload = parseJsonObject(result.text);
    const candidate = buildAdminClarificationCandidate(session, {
      ...input,
      exactQuestion: String(payload.participantFacingQuestion ?? input.questionTheme),
      whyItMatters: String(payload.whyItMatters ?? input.whyItMatters ?? ""),
      exampleAnswer: String(payload.exampleAnswer ?? input.exampleAnswer ?? ""),
    }, "admin_entry", true, options);
    const validation = validateClarificationCandidate(candidate);
    if (!validation.ok) return clarificationFailure("schema_validation_failed", `ClarificationCandidate validation failed: ${validationMessage(validation.errors)}`);
    repos.clarificationCandidates.save(candidate);
    repos.providerJobs.save({ ...queued, status: "succeeded", provider: result.provider, model: result.model, outputRef: candidate.candidateId, updatedAt: clarificationNow(options) });
    return { ok: true, value: candidate, warnings: [], errors: [] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    repos.providerJobs.save({ ...queued, status: "failed", errorMessage: message, updatedAt: clarificationNow(options) });
    return clarificationFailure(message.includes("JSON") ? "provider_output_not_json" : "provider_execution_failed", message);
  }
}

export function dismissClarificationCandidate(
  candidateId: string,
  repos: ClarificationRepos,
  reason?: string,
  options?: ClarificationOptions,
): ClarificationResult<ClarificationCandidate> {
  const candidate = repos.clarificationCandidates.findById(candidateId);
  if (!candidate) return clarificationFailure("candidate_not_found", `ClarificationCandidate not found: ${candidateId}`);
  const updated: ClarificationCandidate = {
    ...candidate,
    status: "dismissed_by_admin",
    adminInstruction: reason ?? candidate.adminInstruction,
    updatedAt: clarificationNow(options),
  };
  repos.clarificationCandidates.save(updated);
  return { ok: true, value: updated, warnings: [], errors: [] };
}

export function createBoundarySignalFromAnswer(
  input: {
    sessionId: string;
    answerEvidenceId: string;
    candidateId: string;
    boundaryType?: BoundarySignal["boundaryType"];
    participantSuggestedOwner?: string | null;
    requiresEscalation?: boolean;
    suggestedEscalationTarget?: BoundarySignal["suggestedEscalationTarget"];
    escalationReason?: string | null;
    shouldStopAskingParticipant?: boolean;
  },
  repos: ClarificationRepos,
  options?: ClarificationOptions,
): ClarificationResult<BoundarySignal> {
  const session = repos.participantSessions.findById(input.sessionId);
  if (!session) return clarificationFailure("session_not_found", `ParticipantSession not found: ${input.sessionId}`);
  const answerEvidence = repos.rawEvidenceItems.findById(input.answerEvidenceId);
  if (!answerEvidence) return clarificationFailure("answer_evidence_not_found", `Answer evidence not found: ${input.answerEvidenceId}`);
  const candidate = repos.clarificationCandidates.findById(input.candidateId);
  if (!candidate) return clarificationFailure("candidate_not_found", `ClarificationCandidate not found: ${input.candidateId}`);
  const signal = defaultBoundarySignalFromAnswer({
    session,
    evidenceItem: answerEvidence,
    candidate,
    partial: {
      boundaryType: input.boundaryType ?? "knowledge_gap",
      participantSuggestedOwner: input.participantSuggestedOwner ?? null,
      requiresEscalation: input.requiresEscalation ?? false,
      suggestedEscalationTarget: input.suggestedEscalationTarget ?? "none",
      escalationReason: input.escalationReason ?? null,
      shouldStopAskingParticipant: input.shouldStopAskingParticipant ?? true,
    },
    options,
  });
  const validation = validateBoundarySignal(signal);
  if (!validation.ok) return clarificationFailure("schema_validation_failed", `BoundarySignal validation failed: ${validationMessage(validation.errors)}`);
  repos.boundarySignals.save(signal);
  if (signal.shouldStopAskingParticipant) {
    repos.clarificationCandidates.save({
      ...candidate,
      status: "escalated",
      askNext: false,
      updatedAt: clarificationNow(options),
    });
  }
  return { ok: true, value: signal, warnings: [], errors: [] };
}

export type AdminAssistantScope = "current_session" | "selected_sessions" | "case_pass5" | "targeted_records";

export type AdminAssistantQueryIntent =
  | "pass5_stage_overview"
  | "pass5_general_discussion"
  | "pass5_session_discussion"
  | "pass5_record_question"
  | "pass5_status_question"
  | "session_summary"
  | "evidence_question"
  | "clarification_status_question"
  | "boundary_signal_question"
  | "extraction_defect_question"
  | "evidence_dispute_question"
  | "next_action_question"
  | "cross_session_comparison"
  | "unresolved_items_question"
  | "pass6_handoff_candidate_suggestion"
  | "out_of_scope_request"
  | "unsupported";

export interface AdminAssistantStructuredRecord {
  recordType: string;
  recordId: string;
  sessionId?: string;
  label: string;
  data: unknown;
}

export interface AdminAssistantEvidenceSnippet {
  evidenceItemId: string;
  sessionId: string;
  evidenceType: RawEvidenceItem["evidenceType"];
  sourceChannel: RawEvidenceItem["sourceChannel"];
  trustStatus: RawEvidenceItem["trustStatus"];
  capturedAt: string;
  quote: string;
}

export interface AdminAssistantRetrievedChunk {
  chunkId: string;
  sourceRef: string;
  text: string;
}

export interface AdminAssistantExcludedRecordReason {
  recordType: string;
  recordId?: string;
  reason: string;
}

export interface AdminAssistantContextBundle {
  questionId: string;
  caseId: string;
  scope: AdminAssistantScope;
  requestedByAdminId: string;
  queryIntent: AdminAssistantQueryIntent;
  structuredRecords: AdminAssistantStructuredRecord[];
  evidenceSnippets: AdminAssistantEvidenceSnippet[];
  retrievedChunks: AdminAssistantRetrievedChunk[];
  excludedRecordsReason: AdminAssistantExcludedRecordReason[];
  dataFreshnessTimestamp: string;
  permissionScope: "pass5_admin_read_only";
  promptVersionId: string;
}

export interface AdminAssistantRoutedActionSuggestion {
  actionType: string;
  owningArea:
    | "clarification_queue"
    | "transcript_review"
    | "evidence_review"
    | "boundary_review"
    | "session_next_action"
    | "pass6_handoff_candidate_review"
    | "manual_review";
  label: string;
  reason: string;
  draftPayload?: unknown;
  requiresAdminConfirmation: true;
}

export interface AdminAssistantAnswer {
  conciseFinding: string;
  evidenceBasis: string[];
  confidenceLevel: "high" | "medium" | "low";
  whatRemainsUncertain: string[];
  recommendedAdminAction: string | null;
  routedActionSuggestions: AdminAssistantRoutedActionSuggestion[];
  references: string[];
  providerStatus: "not_configured" | "failed" | "succeeded";
  providerJobId: string;
  providerOutputText?: string;
  noMutationPerformed: true;
}

export interface AdminAssistantQuestionInput {
  question: string;
  scope: AdminAssistantScope;
  caseId?: string;
  sessionId?: string;
  selectedSessionIds?: string[];
  requestedByAdminId?: string;
}

export interface AdminAssistantRepos {
  participantSessions: ParticipantSessionRepository;
  sessionAccessTokens: SessionAccessTokenRepository;
  telegramIdentityBindings: TelegramIdentityBindingRepository;
  rawEvidenceItems: RawEvidenceItemRepository;
  firstPassExtractionOutputs: FirstPassExtractionOutputRepository;
  clarificationCandidates: ClarificationCandidateRepository;
  boundarySignals: BoundarySignalRepository;
  evidenceDisputes: EvidenceDisputeRepository;
  sessionNextActions: SessionNextActionRepository;
  pass6HandoffCandidates: Pass6HandoffCandidateRepository;
  providerJobs: ProviderExtractionJobRepository;
  promptSpecs: StructuredPromptSpecRepository;
}

export interface AdminAssistantOptions {
  now?: () => string;
  questionIdFactory?: () => string;
  providerJobIdFactory?: () => string;
  maxEvidenceSnippets?: number;
}

export type AdminAssistantResult =
  | {
      ok: true;
      questionId: string;
      intent: AdminAssistantQueryIntent;
      contextBundle: AdminAssistantContextBundle;
      compiledPrompt: string;
      answer: AdminAssistantAnswer;
      warnings: string[];
      errors: [];
    }
  | {
      ok: false;
      questionId: string;
      intent: AdminAssistantQueryIntent;
      contextBundle: AdminAssistantContextBundle | null;
      compiledPrompt: string | null;
      answer: AdminAssistantAnswer | null;
      warnings: string[];
      errors: { code: "unsupported_intent" | "session_not_found" | "case_not_found" | "provider_execution_failed"; message: string }[];
    };

function assistantNow(options?: AdminAssistantOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function assistantQuestionId(options?: AdminAssistantOptions): string {
  return options?.questionIdFactory?.() ?? `admin_assistant_question_${crypto.randomUUID()}`;
}

function assistantProviderJobId(options?: AdminAssistantOptions): string {
  return options?.providerJobIdFactory?.() ?? `pass5_admin_assistant_job_${crypto.randomUUID()}`;
}

function normalizeQuestion(question: string): string {
  return question.toLowerCase();
}

export function classifyAdminAssistantQuestion(question: string): AdminAssistantQueryIntent {
  const q = normalizeQuestion(question);
  const asksForPass6HandoffCandidate = (q.includes("pass 6") || q.includes("later")) && (q.includes("handoff") || q.includes("candidate") || q.includes("review"));
  if (q.includes("compare") || q.includes("across session") || q.includes("between participants")) return "cross_session_comparison";
  const asksForBannedExecution = (
    q.includes("run pass 6")
    || q.includes("perform pass 6")
    || q.includes("pass 6 synthesis")
    || q.includes("synthesis/evaluation")
    || q.includes("final workflow")
    || q.includes("workflow reconstruction")
    || q.includes("common path")
    || q.includes("generate package")
    || q.includes("create package")
    || q.includes("final package")
    || q.includes("client deliverable")
    || q.includes("whatsapp")
    || q.includes("send participant")
    || q.includes("message participant")
    || q.includes("approve transcript")
    || q.includes("approve evidence")
    || q.includes("reject evidence")
    || q.includes("mutate")
    || q.includes("write automatically")
  );
  if (asksForBannedExecution && !asksForPass6HandoffCandidate) return "out_of_scope_request";
  if (q.includes("mission") || q.includes("what can you help") || q.includes("what do you do") || q.includes("your scope")) return "pass5_stage_overview";
  if (q.includes("explain pass 5") || q.includes("this stage") || q.includes("stage 5") || q.includes("pass 5")) return "pass5_general_discussion";
  if (q.includes("what happened") || q.includes("current session") || q.includes("this session") || q.includes("what did") || q.includes("answers came back")) return "pass5_session_discussion";
  if (q.includes("unresolved") || q.includes("unmapped") || q.includes("gap") || q.includes("still missing") || q.includes("blocked") || q.includes("missing")) return "unresolved_items_question";
  if (asksForPass6HandoffCandidate || q.includes("later synthesis")) return "pass6_handoff_candidate_suggestion";
  if (q.includes("dispute")) return "evidence_dispute_question";
  if (q.includes("defect") || q.includes("failed extraction")) return "extraction_defect_question";
  if (q.includes("boundary") || q.includes("escalat") || q.includes("not responsible") || q.includes("unknown")) return "boundary_signal_question";
  if (q.includes("clarification") || q.includes("question")) return "clarification_status_question";
  if (q.includes("next action") || q.includes("next step") || q.includes("what should") || q.includes("what next")) return "next_action_question";
  if (q.includes("evidence") || q.includes("transcript") || q.includes("narrative") || q.includes("said")) return "evidence_question";
  if (q.includes("record") || q.includes("status field") || q.includes("raw evidence") || q.includes("extraction produced")) return "pass5_record_question";
  if (q.includes("summary") || q.includes("summarize") || q.includes("status")) return "session_summary";
  return "unsupported";
}

function makeRecord(recordType: string, recordId: string, label: string, data: unknown, sessionId?: string): AdminAssistantStructuredRecord {
  return { recordType, recordId, label, data, sessionId };
}

function snippetText(text: string, question: string, maxLength = 360): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  const terms = normalizeQuestion(question).split(/\W+/).filter((term) => term.length > 4);
  const lower = cleaned.toLowerCase();
  const index = terms.map((term) => lower.indexOf(term)).find((position) => position >= 0) ?? 0;
  const start = Math.max(0, index - 80);
  return `${start > 0 ? "..." : ""}${cleaned.slice(start, start + maxLength)}${start + maxLength < cleaned.length ? "..." : ""}`;
}

function redactedTokenSummary(token: SessionAccessToken): Record<string, unknown> {
  return {
    accessTokenId: token.accessTokenId,
    participantSessionId: token.participantSessionId,
    channelType: token.channelType,
    tokenStatus: token.tokenStatus,
    expiresAt: token.expiresAt,
    lastUsedAt: token.lastUsedAt,
    revokedAt: token.revokedAt,
    revokedReason: token.revokedReason,
    useCount: token.useCount,
    boundChannelIdentityId: token.boundChannelIdentityId,
    tokenHash: "redacted",
  };
}

function summarizeExtraction(output: FirstPassExtractionOutput): Record<string, unknown> {
  return {
    extractionId: output.extractionId,
    sessionId: output.sessionId,
    extractionStatus: output.extractionStatus,
    basisEvidenceItemIds: output.basisEvidenceItemIds,
    extractedActorCount: output.extractedActors.length,
    extractedStepCount: output.extractedSteps.length,
    extractedDecisionCount: output.extractedDecisionPoints.length,
    extractedHandoffCount: output.extractedHandoffs.length,
    sequenceMap: {
      orderedItemIds: output.sequenceMap.orderedItemIds,
      sequenceLinkCount: output.sequenceMap.sequenceLinks.length,
      unclearTransitionCount: output.sequenceMap.unclearTransitions.length,
      notes: output.sequenceMap.notes,
    },
    unmappedContentItems: output.unmappedContentItems,
    extractionDefects: output.extractionDefects,
    evidenceDisputes: output.evidenceDisputes,
    confidenceNotes: output.confidenceNotes,
    contradictionNotes: output.contradictionNotes,
    sourceCoverageSummary: output.sourceCoverageSummary,
  };
}

function sessionsForAssistant(input: AdminAssistantQuestionInput, repos: AdminAssistantRepos): {
  sessions: ParticipantSession[];
  excluded: AdminAssistantExcludedRecordReason[];
  caseId: string | null;
} {
  const excluded: AdminAssistantExcludedRecordReason[] = [];
  if (input.scope === "current_session") {
    const session = input.sessionId ? repos.participantSessions.findById(input.sessionId) : null;
    return { sessions: session ? [session] : [], excluded, caseId: session?.caseId ?? input.caseId ?? null };
  }
  if (input.scope === "selected_sessions") {
    const selectedIds = new Set(input.selectedSessionIds ?? []);
    const sessions = [...selectedIds].map((id) => repos.participantSessions.findById(id)).filter((session): session is ParticipantSession => Boolean(session));
    for (const session of repos.participantSessions.findAll()) {
      if (!selectedIds.has(session.sessionId)) excluded.push({ recordType: "ParticipantSession", recordId: session.sessionId, reason: "Not included in selected session scope." });
    }
    return { sessions, excluded, caseId: sessions[0]?.caseId ?? input.caseId ?? null };
  }
  if (input.scope === "case_pass5") {
    const caseId = input.caseId ?? (input.sessionId ? repos.participantSessions.findById(input.sessionId)?.caseId : undefined);
    if (!caseId) return { sessions: [], excluded, caseId: null };
    const sessions = repos.participantSessions.findByCaseId(caseId);
    for (const session of repos.participantSessions.findAll()) {
      if (session.caseId !== caseId) excluded.push({ recordType: "ParticipantSession", recordId: session.sessionId, reason: `Different caseId ${session.caseId} excluded from case scope ${caseId}.` });
    }
    return { sessions, excluded, caseId };
  }
  const sessionIds = new Set(input.selectedSessionIds ?? (input.sessionId ? [input.sessionId] : []));
  const sessions = [...sessionIds].map((id) => repos.participantSessions.findById(id)).filter((session): session is ParticipantSession => Boolean(session));
  return { sessions, excluded, caseId: input.caseId ?? sessions[0]?.caseId ?? null };
}

function shouldIncludeEvidenceSnippet(intent: AdminAssistantQueryIntent, evidence: RawEvidenceItem, question: string): boolean {
  if (
    intent === "evidence_question"
    || intent === "session_summary"
    || intent === "cross_session_comparison"
    || intent === "pass5_session_discussion"
    || intent === "pass5_record_question"
    || intent === "pass5_status_question"
    || intent === "unresolved_items_question"
    || intent === "next_action_question"
  ) return true;
  if (intent === "clarification_status_question") return evidence.evidenceType === "participant_clarification_answer";
  const raw = evidence.rawContent?.toLowerCase() ?? "";
  return normalizeQuestion(question).split(/\W+/).some((term) => term.length > 4 && raw.includes(term));
}

export function buildAdminAssistantContextBundle(
  input: AdminAssistantQuestionInput,
  repos: AdminAssistantRepos,
  options?: AdminAssistantOptions,
): AdminAssistantContextBundle | null {
  const intent = classifyAdminAssistantQuestion(input.question);
  const scoped = sessionsForAssistant(input, repos);
  if (!scoped.caseId || scoped.sessions.length === 0) return null;
  const questionId = assistantQuestionId(options);
  const structuredRecords: AdminAssistantStructuredRecord[] = [];
  const evidenceSnippets: AdminAssistantEvidenceSnippet[] = [];
  const retrievedChunks: AdminAssistantRetrievedChunk[] = [];
  const excludedRecordsReason: AdminAssistantExcludedRecordReason[] = [...scoped.excluded];
  const maxEvidenceSnippets = options?.maxEvidenceSnippets ?? 8;

  for (const session of scoped.sessions) {
    structuredRecords.push(makeRecord("ParticipantSession", session.sessionId, session.participantLabel, session, session.sessionId));
    for (const token of repos.sessionAccessTokens.findByParticipantSessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("SessionAccessToken", token.accessTokenId, "Redacted access token metadata", redactedTokenSummary(token), session.sessionId));
    }
    for (const binding of repos.telegramIdentityBindings.findByParticipantSessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("TelegramIdentityBinding", binding.bindingId, binding.bindingStatus, binding, session.sessionId));
    }
    const evidenceItems = repos.rawEvidenceItems.findBySessionId(session.sessionId);
    for (const evidence of evidenceItems) {
      structuredRecords.push(makeRecord("RawEvidenceItem", evidence.evidenceItemId, `${evidence.evidenceType} / ${evidence.trustStatus}`, {
        evidenceItemId: evidence.evidenceItemId,
        sessionId: evidence.sessionId,
        evidenceType: evidence.evidenceType,
        sourceChannel: evidence.sourceChannel,
        language: evidence.language,
        capturedAt: evidence.capturedAt,
        capturedBy: evidence.capturedBy,
        trustStatus: evidence.trustStatus,
        originalFileName: evidence.originalFileName,
        providerJobId: evidence.providerJobId,
        linkedClarificationItemId: evidence.linkedClarificationItemId,
        hasRawContent: Boolean(evidence.rawContent),
        artifactRef: evidence.artifactRef,
        notes: evidence.notes,
      }, session.sessionId));
      if (evidence.rawContent && evidenceSnippets.length < maxEvidenceSnippets && shouldIncludeEvidenceSnippet(intent, evidence, input.question)) {
        evidenceSnippets.push({
          evidenceItemId: evidence.evidenceItemId,
          sessionId: evidence.sessionId,
          evidenceType: evidence.evidenceType,
          sourceChannel: evidence.sourceChannel,
          trustStatus: evidence.trustStatus,
          capturedAt: evidence.capturedAt,
          quote: snippetText(evidence.rawContent, input.question),
        });
      }
      if (evidence.rawContent && evidence.rawContent.length > 1200 && evidenceSnippets.length < maxEvidenceSnippets) {
        retrievedChunks.push({
          chunkId: `raw-evidence-snippet:${evidence.evidenceItemId}:0`,
          sourceRef: evidence.evidenceItemId,
          text: snippetText(evidence.rawContent, input.question, 600),
        });
      }
    }
    for (const output of repos.firstPassExtractionOutputs.findBySessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("FirstPassExtractionOutput", output.extractionId, output.extractionStatus, summarizeExtraction(output), session.sessionId));
    }
    for (const candidate of repos.clarificationCandidates.findBySessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("ClarificationCandidate", candidate.candidateId, `${candidate.status} / ${candidate.priority}`, candidate, session.sessionId));
    }
    for (const signal of repos.boundarySignals.findBySessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("BoundarySignal", signal.boundarySignalId, signal.boundaryType, signal, session.sessionId));
    }
    for (const dispute of repos.evidenceDisputes.findBySessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("EvidenceDispute", dispute.disputeId, dispute.disputeType, dispute, session.sessionId));
    }
    for (const action of repos.sessionNextActions.findBySessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("SessionNextAction", action.nextActionId, action.actionType, action, session.sessionId));
    }
    for (const handoff of repos.pass6HandoffCandidates.findBySessionId(session.sessionId)) {
      structuredRecords.push(makeRecord("Pass6HandoffCandidate", handoff.handoffCandidateId, handoff.candidateType, handoff, session.sessionId));
    }
  }

  if (intent === "unsupported") {
    excludedRecordsReason.push({ recordType: "AdminAssistantQuery", reason: "Unsupported question intent; only bounded Pass 5 operational questions are answered." });
  }

  return {
    questionId,
    caseId: scoped.caseId,
    scope: input.scope,
    requestedByAdminId: input.requestedByAdminId ?? "admin_operator",
    queryIntent: intent,
    structuredRecords,
    evidenceSnippets,
    retrievedChunks,
    excludedRecordsReason,
    dataFreshnessTimestamp: assistantNow(options),
    permissionScope: "pass5_admin_read_only",
    promptVersionId: "pending_compile",
  };
}

function recordIds(records: AdminAssistantStructuredRecord[], type: string): string[] {
  return records.filter((record) => record.recordType === type).map((record) => record.recordId);
}

function deriveAssistantRoutedActions(bundle: AdminAssistantContextBundle): AdminAssistantRoutedActionSuggestion[] {
  const actions: AdminAssistantRoutedActionSuggestion[] = [];
  const candidateIds = recordIds(bundle.structuredRecords, "ClarificationCandidate");
  const disputeIds = recordIds(bundle.structuredRecords, "EvidenceDispute");
  const boundaryIds = recordIds(bundle.structuredRecords, "BoundarySignal");
  const extractionIds = recordIds(bundle.structuredRecords, "FirstPassExtractionOutput");
  if (bundle.queryIntent === "clarification_status_question" && candidateIds.length > 0) {
    actions.push({
      actionType: "review_clarification_queue",
      owningArea: "clarification_queue",
      label: "Review clarification queue",
      reason: "Open or historical clarification candidates are present in the bounded context.",
      draftPayload: { candidateIds },
      requiresAdminConfirmation: true,
    });
  }
  if (bundle.queryIntent === "evidence_dispute_question" && disputeIds.length > 0) {
    actions.push({
      actionType: "review_evidence_dispute",
      owningArea: "evidence_review",
      label: "Review evidence dispute",
      reason: "Evidence dispute records require admin review before any later synthesis use.",
      draftPayload: { disputeIds },
      requiresAdminConfirmation: true,
    });
  }
  if (bundle.queryIntent === "boundary_signal_question" && boundaryIds.length > 0) {
    actions.push({
      actionType: "review_boundary_signal",
      owningArea: "boundary_review",
      label: "Review boundary signal",
      reason: "Boundary signals indicate possible ownership, visibility, or escalation limits.",
      draftPayload: { boundaryIds },
      requiresAdminConfirmation: true,
    });
  }
  if (bundle.queryIntent === "pass6_handoff_candidate_suggestion") {
    actions.push({
      actionType: "draft_pass6_handoff_candidate",
      owningArea: "pass6_handoff_candidate_review",
      label: "Draft later Pass 6 handoff candidate",
      reason: "This is only a candidate recommendation for later review, not synthesis output.",
      draftPayload: { extractionIds, sessionIds: recordIds(bundle.structuredRecords, "ParticipantSession") },
      requiresAdminConfirmation: true,
    });
  }
  if (bundle.queryIntent === "out_of_scope_request") {
    actions.push({
      actionType: "manual_review",
      owningArea: "manual_review",
      label: "Use a Pass 5-safe route",
      reason: "The request asks for a later-stage or mutating action. The copilot can explain Pass 5 records and suggest a routed review path only.",
      requiresAdminConfirmation: true,
    });
  }
  if (actions.length === 0) {
    actions.push({
      actionType: "manual_review",
      owningArea: "manual_review",
      label: "Manual admin review",
      reason: "No safe direct routed action was inferred from the bounded context.",
      requiresAdminConfirmation: true,
    });
  }
  return actions;
}

function buildDeterministicAssistantAnswer(input: {
  question: string;
  bundle: AdminAssistantContextBundle;
  providerStatus: AdminAssistantAnswer["providerStatus"];
  providerJobId: string;
  providerOutputText?: string;
}): AdminAssistantAnswer {
  const sessionRecords = input.bundle.structuredRecords.filter((record) => record.recordType === "ParticipantSession");
  const evidenceRefs = input.bundle.evidenceSnippets.map((snippet) => snippet.evidenceItemId);
  const defectCount = input.bundle.structuredRecords
    .filter((record) => record.recordType === "FirstPassExtractionOutput")
    .reduce((sum, record) => {
      const data = record.data as { extractionDefects?: unknown[] };
      return sum + (Array.isArray(data.extractionDefects) ? data.extractionDefects.length : 0);
    }, 0);
  const disputeCount = recordIds(input.bundle.structuredRecords, "EvidenceDispute").length
    + input.bundle.structuredRecords
      .filter((record) => record.recordType === "FirstPassExtractionOutput")
      .reduce((sum, record) => {
        const data = record.data as { evidenceDisputes?: unknown[] };
        return sum + (Array.isArray(data.evidenceDisputes) ? data.evidenceDisputes.length : 0);
      }, 0);
  const openCandidates = input.bundle.structuredRecords.filter((record) => {
    if (record.recordType !== "ClarificationCandidate") return false;
    const data = record.data as ClarificationCandidate;
    return data.status === "open" || data.status === "asked" || data.status === "partially_resolved";
  });
  const boundaryCount = recordIds(input.bundle.structuredRecords, "BoundarySignal").length;
  const baseScopeSummary = `Scope contains ${sessionRecords.length} participant session(s), ${input.bundle.evidenceSnippets.length} evidence snippet(s), ${openCandidates.length} actionable clarification candidate(s), ${boundaryCount} boundary signal(s), ${defectCount} extraction defect(s), and ${disputeCount} evidence dispute(s).`;
  const nextActionRecords = input.bundle.structuredRecords.filter((record) => record.recordType === "SessionNextAction");
  const handoffRecords = input.bundle.structuredRecords.filter((record) => record.recordType === "Pass6HandoffCandidate");
  let finding = [`Intent: ${input.bundle.queryIntent}.`, baseScopeSummary].join(" ");
  if (input.bundle.queryIntent === "pass5_stage_overview") {
    finding = [
      "I am the read-only Pass 5 Section Copilot.",
      "My mission is to help the admin understand participant sessions, raw evidence, transcript trust, first-pass extraction, clarification queues, answer rechecks, boundary signals, next actions, and later handoff candidates.",
      "I use bounded DB-first context when records are needed and recommend routed admin actions only. This copilot does not mutate records or send participant messages.",
      "I do not perform Pass 6 synthesis/evaluation, final workflow reconstruction, package generation, or WhatsApp API work.",
      baseScopeSummary,
    ].join(" ");
  } else if (input.bundle.queryIntent === "pass5_general_discussion") {
    finding = [
      "Pass 5 is the participant-session intake and governance stage.",
      "It captures raw participant evidence, gates transcript trust, runs governed first-pass participant-level extraction, manages clarification candidates and answer rechecks, records boundary signals, supports dashboard review, and preserves handoff candidates for later review.",
      "It does not decide final workflow truth or run later-stage synthesis.",
      baseScopeSummary,
    ].join(" ");
  } else if (input.bundle.queryIntent === "pass5_session_discussion" || input.bundle.queryIntent === "session_summary") {
    const labels = sessionRecords.map((record) => record.label).join(", ") || "the current participant session";
    finding = `For ${labels}, the bounded context shows the current Pass 5 session records and supporting evidence. ${baseScopeSummary}`;
  } else if (input.bundle.queryIntent === "evidence_question" || input.bundle.queryIntent === "pass5_record_question") {
    finding = `The bounded context includes ${input.bundle.evidenceSnippets.length} evidence snippet(s) and ${recordIds(input.bundle.structuredRecords, "RawEvidenceItem").length} raw evidence metadata record(s). ${baseScopeSummary}`;
  } else if (input.bundle.queryIntent === "next_action_question" || input.bundle.queryIntent === "unresolved_items_question" || input.bundle.queryIntent === "pass5_status_question") {
    const nextActions = nextActionRecords.map((record) => record.label).join(", ") || "manual admin review";
    finding = `The visible next action path is: ${nextActions}. Open clarification, boundary, defect, dispute, and unmapped records should be reviewed through their owning Pass 5 panels. ${baseScopeSummary}`;
  } else if (input.bundle.queryIntent === "pass6_handoff_candidate_suggestion") {
    finding = `Pass 5 can preserve later-review handoff candidates only. It currently has ${handoffRecords.length} candidate record(s) in scope; any new candidate must be admin-confirmed and remains non-final. ${baseScopeSummary}`;
  } else if (input.bundle.queryIntent === "out_of_scope_request") {
    finding = "That request is outside the Pass 5 copilot boundary. I can explain the current Pass 5 records, show what Pass 5 prepared for later review, or suggest a routed admin action, but I cannot run Pass 6 synthesis/evaluation, reconstruct the final workflow, generate packages, send participant messages, or approve/reject evidence automatically.";
  }
  const uncertainty: string[] = [];
  if (input.bundle.promptVersionId === "provider_not_configured") uncertainty.push("Provider execution was not configured; this is deterministic manual fallback, not AI success.");
  if (input.bundle.evidenceSnippets.length === 0) uncertainty.push("No raw evidence snippet was included in the bounded context.");
  if (input.bundle.excludedRecordsReason.length > 0) uncertainty.push("Some records were excluded by scope; inspect excludedRecordsReason in the context bundle.");
  return {
    conciseFinding: input.providerOutputText ? `Provider response received for bounded Pass 5 context. Deterministic summary: ${finding}` : finding,
    evidenceBasis: [
      ...sessionRecords.map((record) => `${record.recordId}: ${record.label}`),
      ...evidenceRefs.map((id) => `RawEvidenceItem:${id}`),
    ],
    confidenceLevel: input.bundle.evidenceSnippets.length > 0 || sessionRecords.length > 0 ? "medium" : "low",
    whatRemainsUncertain: uncertainty,
    recommendedAdminAction: deriveAssistantRoutedActions(input.bundle)[0]?.label ?? "Manual admin review",
    routedActionSuggestions: deriveAssistantRoutedActions(input.bundle),
    references: input.bundle.structuredRecords.map((record) => `${record.recordType}:${record.recordId}`),
    providerStatus: input.providerStatus,
    providerJobId: input.providerJobId,
    providerOutputText: input.providerOutputText,
    noMutationPerformed: true,
  };
}

function saveAdminAssistantProviderJob(input: {
  bundle: AdminAssistantContextBundle;
  promptVersionId: string;
  basePromptVersionId: string;
  outputContractRef?: string;
  provider: FirstPassExtractionExecutor | null;
  repos: Pick<AdminAssistantRepos, "providerJobs">;
  options?: AdminAssistantOptions;
  status?: StoredProviderExtractionJob["status"];
  errorMessage?: string;
  outputRef?: string;
}): StoredProviderExtractionJob {
  const timestamp = assistantNow(input.options);
  const job: StoredProviderExtractionJob = {
    jobId: assistantProviderJobId(input.options),
    sourceId: input.bundle.questionId,
    sessionId: input.bundle.structuredRecords.find((record) => record.sessionId)?.sessionId ?? input.bundle.caseId,
    caseId: input.bundle.caseId,
    provider: input.provider?.name ?? "google",
    jobKind: "pass5_prompt_test",
    status: input.status ?? "queued",
    inputType: "manual_note",
    promptFamily: PASS5_PROMPT_FAMILY,
    promptName: "admin_assistant_prompt",
    promptVersionId: input.promptVersionId,
    basePromptVersionId: input.basePromptVersionId,
    inputBundleRef: JSON.stringify({
      questionId: input.bundle.questionId,
      caseId: input.bundle.caseId,
      scope: input.bundle.scope,
      queryIntent: input.bundle.queryIntent,
      structuredRecordCount: input.bundle.structuredRecords.length,
      evidenceSnippetCount: input.bundle.evidenceSnippets.length,
      retrievedChunkCount: input.bundle.retrievedChunks.length,
    }),
    outputContractRef: input.outputContractRef,
    outputRef: input.outputRef,
    errorMessage: input.errorMessage,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  input.repos.providerJobs.save(job);
  return job;
}

export async function runAdminAssistantQuestion(
  input: AdminAssistantQuestionInput,
  repos: AdminAssistantRepos,
  executor: FirstPassExtractionExecutor | null,
  options?: AdminAssistantOptions,
): Promise<AdminAssistantResult> {
  const intent = classifyAdminAssistantQuestion(input.question);
  const emptyQuestionId = assistantQuestionId(options);
  if (intent === "unsupported") {
    const bundle = buildAdminAssistantContextBundle(input, repos, { ...options, questionIdFactory: () => emptyQuestionId });
    return {
      ok: false,
      questionId: emptyQuestionId,
      intent,
      contextBundle: bundle,
      compiledPrompt: null,
      answer: null,
      warnings: ["Unsupported admin assistant question intent."],
      errors: [{ code: "unsupported_intent", message: "Unsupported Pass 5 admin assistant question. Use session, evidence, clarification, boundary, defect, dispute, next action, comparison, unresolved item, or later handoff questions." }],
    };
  }
  const bundle = buildAdminAssistantContextBundle(input, repos, { ...options, questionIdFactory: () => emptyQuestionId });
  if (!bundle) {
    return {
      ok: false,
      questionId: emptyQuestionId,
      intent,
      contextBundle: null,
      compiledPrompt: null,
      answer: null,
      warnings: [],
      errors: [{ code: input.sessionId ? "session_not_found" : "case_not_found", message: "No participant-session records matched the requested assistant scope." }],
    };
  }
  const compiled = compilePass5Prompt("admin_assistant_prompt", {
    promptName: "admin_assistant_prompt",
    caseId: bundle.caseId,
    sessionId: input.sessionId,
    languagePreference: undefined,
    evidenceRefs: bundle.evidenceSnippets.map((snippet) => snippet.evidenceItemId),
    adminInstruction: input.question,
    rawContent: JSON.stringify(bundle),
    contentRef: `admin-assistant-context-bundle:${bundle.questionId}`,
    contextBundleRef: bundle.questionId,
  }, repos.promptSpecs);
  const compiledBundle: AdminAssistantContextBundle = {
    ...bundle,
    promptVersionId: compiled.promptSpec.promptSpecId,
  };
  const queued = saveAdminAssistantProviderJob({
    bundle: compiledBundle,
    promptVersionId: compiled.promptSpec.promptSpecId,
    basePromptVersionId: compiled.basePromptSpec.promptSpecId,
    outputContractRef: compiled.promptSpec.outputContractRef,
    provider: executor,
    repos,
    options,
  });
  if (!executor) {
    const failed = {
      ...queued,
      status: "failed" as const,
      errorMessage: "provider_not_configured: no provider supplied for Pass 5 admin assistant.",
      updatedAt: assistantNow(options),
    };
    repos.providerJobs.save(failed);
    const fallbackBundle = { ...compiledBundle, promptVersionId: "provider_not_configured" };
    return {
      ok: true,
      questionId: fallbackBundle.questionId,
      intent,
      contextBundle: fallbackBundle,
      compiledPrompt: compiled.compiledPrompt,
      answer: buildDeterministicAssistantAnswer({
        question: input.question,
        bundle: fallbackBundle,
        providerStatus: "not_configured",
        providerJobId: failed.jobId,
      }),
      warnings: ["Provider not configured; returned deterministic manual fallback. No mutation performed."],
      errors: [],
    };
  }
  const running = { ...queued, status: "running" as const, updatedAt: assistantNow(options) };
  repos.providerJobs.save(running);
  try {
    const providerOutput = await executor.runPromptText({ compiledPrompt: compiled.compiledPrompt });
    const succeeded = {
      ...running,
      status: "succeeded" as const,
      provider: providerOutput.provider,
      model: providerOutput.model,
      outputRef: `admin_assistant_output_length:${providerOutput.text.length}`,
      updatedAt: assistantNow(options),
    };
    repos.providerJobs.save(succeeded);
    return {
      ok: true,
      questionId: compiledBundle.questionId,
      intent,
      contextBundle: compiledBundle,
      compiledPrompt: compiled.compiledPrompt,
      answer: buildDeterministicAssistantAnswer({
        question: input.question,
        bundle: compiledBundle,
        providerStatus: "succeeded",
        providerJobId: succeeded.jobId,
        providerOutputText: providerOutput.text,
      }),
      warnings: ["Provider output was returned as assistant text only; no records were mutated."],
      errors: [],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed = { ...running, status: "failed" as const, errorMessage: message, updatedAt: assistantNow(options) };
    repos.providerJobs.save(failed);
    return {
      ok: false,
      questionId: compiledBundle.questionId,
      intent,
      contextBundle: compiledBundle,
      compiledPrompt: compiled.compiledPrompt,
      answer: buildDeterministicAssistantAnswer({
        question: input.question,
        bundle: compiledBundle,
        providerStatus: "failed",
        providerJobId: failed.jobId,
      }),
      warnings: ["Provider execution failed; deterministic manual fallback is present for inspection only. No mutation performed."],
      errors: [{ code: "provider_execution_failed", message }],
    };
  }
}

export interface Pass6HandoffCandidateRepos {
  participantSessions: ParticipantSessionRepository;
  pass6HandoffCandidates: Pass6HandoffCandidateRepository;
  evidenceDisputes?: EvidenceDisputeRepository;
  boundarySignals?: BoundarySignalRepository;
  clarificationCandidates?: ClarificationCandidateRepository;
  firstPassExtractionOutputs?: FirstPassExtractionOutputRepository;
}

export interface Pass6HandoffCandidateOptions {
  now?: () => string;
  handoffCandidateIdFactory?: () => string;
}

export interface Pass6HandoffCandidateInput {
  caseId: string;
  sessionIds: string[];
  candidateType: Pass6HandoffCandidateType;
  description: string;
  evidenceRefs: EvidenceAnchor[];
  confidenceLevel?: ConfidenceLevel;
  recommendedPass6Use: string;
  mandatoryOrOptional?: MandatoryOrOptional;
  createdFrom: Pass6HandoffCreatedFrom;
}

export type Pass6HandoffCandidateResult =
  | { ok: true; value: Pass6HandoffCandidate; warnings: string[]; errors: [] }
  | { ok: false; value: null; warnings: string[]; errors: { code: "candidate_not_found" | "source_not_found" | "schema_validation_failed"; message: string }[] };

function handoffNow(options?: Pass6HandoffCandidateOptions): string {
  return options?.now?.() ?? new Date().toISOString();
}

function handoffCandidateId(options?: Pass6HandoffCandidateOptions): string {
  return options?.handoffCandidateIdFactory?.() ?? `pass6_handoff_candidate_${crypto.randomUUID()}`;
}

function handoffFailure(
  code: "candidate_not_found" | "source_not_found" | "schema_validation_failed",
  message: string,
): Pass6HandoffCandidateResult {
  return { ok: false, value: null, warnings: [], errors: [{ code, message }] };
}

function participantLabelsForSessions(sessionIds: string[], repos: Pick<Pass6HandoffCandidateRepos, "participantSessions">): string[] {
  return sessionIds.map((sessionId) => repos.participantSessions.findById(sessionId)?.participantLabel ?? sessionId);
}

function savePass6HandoffCandidate(
  candidate: Pass6HandoffCandidate,
  repos: Pick<Pass6HandoffCandidateRepos, "pass6HandoffCandidates">,
): Pass6HandoffCandidateResult {
  const validation = validatePass6HandoffCandidate(candidate);
  if (!validation.ok) {
    return handoffFailure("schema_validation_failed", `Pass6HandoffCandidate validation failed: ${validationMessage(validation.errors)}`);
  }
  repos.pass6HandoffCandidates.save(candidate);
  return { ok: true, value: candidate, warnings: [], errors: [] };
}

export function listPass6HandoffCandidatesByCase(
  caseId: string,
  repos: Pick<Pass6HandoffCandidateRepos, "pass6HandoffCandidates">,
): Pass6HandoffCandidate[] {
  return repos.pass6HandoffCandidates.findByCaseId(caseId);
}

export function listPass6HandoffCandidatesBySession(
  sessionId: string,
  repos: Pick<Pass6HandoffCandidateRepos, "pass6HandoffCandidates">,
): Pass6HandoffCandidate[] {
  return repos.pass6HandoffCandidates.findBySessionId(sessionId);
}

export function createPass6HandoffCandidate(
  input: Pass6HandoffCandidateInput,
  repos: Pass6HandoffCandidateRepos,
  options?: Pass6HandoffCandidateOptions,
): Pass6HandoffCandidateResult {
  const candidate: Pass6HandoffCandidate = {
    handoffCandidateId: handoffCandidateId(options),
    caseId: input.caseId,
    sessionIds: [...new Set(input.sessionIds)],
    relatedParticipantLabels: participantLabelsForSessions([...new Set(input.sessionIds)], repos),
    candidateType: input.candidateType,
    description: input.description,
    evidenceRefs: input.evidenceRefs,
    confidenceLevel: input.confidenceLevel ?? "medium",
    recommendedPass6Use: input.recommendedPass6Use,
    mandatoryOrOptional: input.mandatoryOrOptional ?? "optional",
    adminDecision: "pending",
    createdFrom: input.createdFrom,
    createdAt: handoffNow(options),
  };
  return savePass6HandoffCandidate(candidate, repos);
}

export function createPass6HandoffCandidateFromAdminEntry(
  input: Omit<Pass6HandoffCandidateInput, "createdFrom">,
  repos: Pass6HandoffCandidateRepos,
  options?: Pass6HandoffCandidateOptions,
): Pass6HandoffCandidateResult {
  return createPass6HandoffCandidate({ ...input, createdFrom: "admin_entry" }, repos, options);
}

export function createPass6HandoffCandidateFromAssistantRecommendation(
  input: Omit<Pass6HandoffCandidateInput, "createdFrom">,
  repos: Pass6HandoffCandidateRepos,
  options?: Pass6HandoffCandidateOptions,
): Pass6HandoffCandidateResult {
  return createPass6HandoffCandidate({ ...input, createdFrom: "admin_assistant" }, repos, options);
}

export function createPass6HandoffCandidateFromEvidenceDispute(
  disputeId: string,
  repos: Pass6HandoffCandidateRepos,
  options?: Pass6HandoffCandidateOptions,
): Pass6HandoffCandidateResult {
  const dispute = repos.evidenceDisputes?.findById(disputeId);
  if (!dispute) return handoffFailure("source_not_found", `EvidenceDispute not found: ${disputeId}`);
  const session = repos.participantSessions.findById(dispute.sessionId);
  const caseId = session?.caseId ?? "unknown_case";
  return createPass6HandoffCandidate({
    caseId,
    sessionIds: [dispute.sessionId],
    candidateType: "evidence_dispute_for_later_review",
    description: `Evidence dispute ${dispute.disputeId}: ${dispute.codeValidationIssue}`,
    evidenceRefs: [{
      evidenceItemId: dispute.aiProposedEvidenceAnchor.evidenceItemId,
      quote: dispute.aiProposedEvidenceAnchor.quote,
      note: `evidenceDisputeId=${dispute.disputeId}; affectedItemId=${dispute.affectedItemId}`,
    }],
    confidenceLevel: dispute.severity === "high" || dispute.severity === "blocking" ? "high" : "medium",
    recommendedPass6Use: "Review before later cross-participant synthesis; do not treat disputed interpretation as final truth.",
    mandatoryOrOptional: dispute.severity === "high" || dispute.severity === "blocking" ? "mandatory" : "optional",
    createdFrom: "system_rule",
  }, repos, options);
}

export function createPass6HandoffCandidateFromBoundarySignal(
  boundarySignalId: string,
  repos: Pass6HandoffCandidateRepos,
  options?: Pass6HandoffCandidateOptions,
): Pass6HandoffCandidateResult {
  const signal = repos.boundarySignals?.findById(boundarySignalId);
  if (!signal) return handoffFailure("source_not_found", `BoundarySignal not found: ${boundarySignalId}`);
  const session = repos.participantSessions.findById(signal.sessionId);
  const candidateType: Pass6HandoffCandidateType = signal.requiresEscalation ? "possible_escalation_need" : "boundary_pattern";
  return createPass6HandoffCandidate({
    caseId: session?.caseId ?? "unknown_case",
    sessionIds: [signal.sessionId],
    candidateType,
    description: `Boundary signal ${signal.boundarySignalId}: ${signal.participantStatement}`,
    evidenceRefs: [{
      evidenceItemId: signal.linkedEvidenceItemId,
      note: `boundarySignalId=${signal.boundarySignalId}; boundaryType=${signal.boundaryType}; escalationTarget=${signal.suggestedEscalationTarget}`,
    }],
    confidenceLevel: signal.confidenceLevel,
    recommendedPass6Use: "Preserve participant boundary/ownership signal for later review; do not resolve ownership inside Pass 5.",
    mandatoryOrOptional: signal.requiresEscalation ? "mandatory" : "optional",
    createdFrom: "system_rule",
  }, repos, options);
}

export function createRepeatedUncertaintyHandoffCandidateForSession(
  sessionId: string,
  repos: Pass6HandoffCandidateRepos,
  options?: Pass6HandoffCandidateOptions,
): Pass6HandoffCandidateResult {
  const session = repos.participantSessions.findById(sessionId);
  if (!session) return handoffFailure("source_not_found", `ParticipantSession not found: ${sessionId}`);
  const candidates = repos.clarificationCandidates?.findBySessionId(sessionId)
    .filter((candidate) => candidate.status === "open" || candidate.status === "partially_resolved" || candidate.status === "escalated") ?? [];
  if (candidates.length < 2) {
    return handoffFailure("source_not_found", "Repeated uncertainty candidate requires at least two unresolved/partial/escalated clarification candidates.");
  }
  return createPass6HandoffCandidate({
    caseId: session.caseId,
    sessionIds: [sessionId],
    candidateType: "repeated_uncertainty",
    description: `Session ${sessionId} has ${candidates.length} unresolved or partially resolved clarification candidates.`,
    evidenceRefs: candidates.flatMap((candidate) => candidate.linkedRawEvidenceItemIds.length > 0
      ? candidate.linkedRawEvidenceItemIds.map((evidenceItemId) => ({ evidenceItemId, note: `clarificationCandidateId=${candidate.candidateId}` }))
      : [{ evidenceItemId: "missing_evidence_ref", note: `clarificationCandidateId=${candidate.candidateId}; evidence missing or weak` }]),
    confidenceLevel: "medium",
    recommendedPass6Use: "Review repeated uncertainty later; this is not a final gap conclusion.",
    mandatoryOrOptional: "optional",
    createdFrom: "system_rule",
  }, repos, options);
}

export function updatePass6HandoffCandidateAdminDecision(
  handoffCandidateId: string,
  adminDecision: Pass6HandoffAdminDecision,
  repos: Pick<Pass6HandoffCandidateRepos, "pass6HandoffCandidates">,
): Pass6HandoffCandidateResult {
  const updated = repos.pass6HandoffCandidates.updateAdminDecision(handoffCandidateId, adminDecision);
  if (!updated) return handoffFailure("candidate_not_found", `Pass6HandoffCandidate not found: ${handoffCandidateId}`);
  return { ok: true, value: updated, warnings: [], errors: [] };
}
