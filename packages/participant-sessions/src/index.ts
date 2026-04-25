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
} from "@workflow/contracts";
import type {
  BoundarySignalRepository,
  ClarificationCandidateRepository,
  EvidenceDisputeRepository,
  FirstPassExtractionOutputRepository,
  ParticipantSessionRepository,
  ProviderExtractionJobRepository,
  RawEvidenceItemRepository,
  SessionAccessTokenRepository,
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
    repos.participantSessions.save({
      ...session,
      extractionStatus: "failed",
      analysisProgress: { ...session.analysisProgress, extractionStatus: "failed" },
      updatedAt: extractionNow(options),
    });
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
  const outputWithIds: FirstPassExtractionOutput = {
    ...candidateOutput,
    extractionId: candidateOutput.extractionId || extractionId(options),
    sessionId: session.sessionId,
    basisEvidenceItemIds: candidateOutput.basisEvidenceItemIds?.length
      ? candidateOutput.basisEvidenceItemIds
      : eligibleEvidence.map((item) => item.evidenceItemId),
    createdAt: candidateOutput.createdAt || extractionNow(options),
  };
  const governed = validateAndGovernExtractionOutput({
    output: outputWithIds,
    session,
    eligibleEvidence,
    options,
  });
  const validation = validateFirstPassExtractionOutput(governed.output);
  if (!validation.ok) {
    const failed = saveProviderJob({
      ...running,
      status: "failed",
      provider: providerName,
      model,
      errorMessage: `schema_validation_failed: ${validationMessage(validation.errors)}`,
      updatedAt: extractionNow(options),
    }, repos);
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
