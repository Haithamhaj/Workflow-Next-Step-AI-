import {
  validateTargetingRecommendationPacket,
  validateTargetingRolloutPlan,
  type ApprovedHierarchySnapshot,
  type ContactChannel,
  type ContactDataStatus,
  type ContactDataSource,
  type HierarchyReadinessSnapshot,
  type ParticipantContactProfile,
  type QuestionHintSeed,
  type TargetCandidate,
  type TargetingProviderStatus,
  type TargetingRecommendationPacket,
  type TargetingRolloutPlan,
  type TargetingRolloutPlanState,
  type TargetingSourceSignal,
  type TargetType,
} from "@workflow/contracts";
import type {
  ApprovedHierarchySnapshotRepository,
  HierarchyReadinessSnapshotRepository,
  IntakeSessionRepository,
  SourceHierarchyTriageSuggestionRepository,
  StructuredPromptSpecRepository,
  TargetingRolloutPlanRepository,
} from "@workflow/persistence";
import {
  compilePass4TargetingPromptSpec,
  ensureActivePass4TargetingPromptSpec,
} from "@workflow/prompts";

export const TARGETING_ROLLOUT_PACKAGE = "@workflow/targeting-rollout" as const;

export type {
  ContactChannel,
  ContactDataSource,
  ContactDataStatus,
  ParticipantContactProfile,
  QuestionHintSeed,
  TargetCandidate,
  TargetingRecommendationPacket,
  TargetingRolloutPlan,
  TargetingRolloutPlanState,
  TargetingSourceSignal,
  TargetType,
} from "@workflow/contracts";

export interface TargetingRolloutRepos {
  intakeSessions: IntakeSessionRepository;
  approvedHierarchySnapshots: ApprovedHierarchySnapshotRepository;
  hierarchyReadinessSnapshots: HierarchyReadinessSnapshotRepository;
  sourceHierarchyTriageSuggestions?: SourceHierarchyTriageSuggestionRepository;
  structuredPromptSpecs: StructuredPromptSpecRepository;
  targetingRolloutPlans: TargetingRolloutPlanRepository;
}

export interface TargetingRecommendationProvider {
  readonly name: "google" | "openai";
  generateTargetingRecommendationPacket(input: {
    compiledPrompt: string;
  }): Promise<{
    packet: Omit<
      TargetingRecommendationPacket,
      | "packetId"
      | "companyId"
      | "caseId"
      | "selectedDepartment"
      | "selectedUseCase"
      | "basisHierarchySnapshotId"
      | "basisReadinessSnapshotId"
      | "generatedByPromptVersionId"
      | "generatedAt"
      | "adminDecisionStatus"
      | "manualFallbackAvailable"
    >;
    provider: "google" | "openai";
    model: string;
    rawText: string;
  }>;
}

function now(): string {
  return new Date().toISOString();
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function validationMessage(errors: { message?: string }[]): string {
  return errors.map((e) => e.message ?? String(e)).join("; ");
}

function boundaryConfirmations() {
  return {
    noOutreachSent: true,
    noInvitationsCreated: true,
    noParticipantSessionsCreated: true,
    noParticipantResponsesCollected: true,
    noWorkflowAnalysisPerformed: true,
  };
}

function contactChannels(profile: Partial<ParticipantContactProfile>): ContactChannel[] {
  const channels: ContactChannel[] = [];
  if (profile.mobileNumber) channels.push("mobile");
  if (profile.whatsAppNumber) channels.push("whatsapp");
  if (profile.telegramHandle || profile.telegramUserId) channels.push("telegram");
  if (profile.email) channels.push("email");
  return channels;
}

export function deriveContactDataStatus(profile: Partial<ParticipantContactProfile>): ContactDataStatus {
  if (profile.contactDataStatus === "blocked_for_later_outreach") return "blocked_for_later_outreach";
  const channels = profile.availableChannels ?? contactChannels(profile);
  if (channels.length === 0) return "missing_required_contact_method";
  if (channels.length > 1 && !profile.preferredChannel) return "preferred_channel_not_selected";
  if (channels.length > 1) return "multiple_channels_available";
  return "ready_for_later_outreach";
}

function targetTypeForNode(layer: string): TargetType {
  if (layer === "frontline_operational" || layer === "support_role" || layer === "senior_individual_contributor") {
    return "core_participant";
  }
  if (layer === "external_interface" || layer === "shared_service_role" || layer === "approval_or_control_role") {
    return "external_decision_or_clarification_source";
  }
  return "enrichment_participant";
}

function stageForTargetType(targetType: TargetType): number {
  if (targetType === "core_participant") return 1;
  if (targetType === "enrichment_participant") return 2;
  return 3;
}

function profileFromCandidate(candidate: TargetCandidate, snapshot: ApprovedHierarchySnapshot, updatedBy: string): ParticipantContactProfile {
  const node = candidate.linkedHierarchyNodeId
    ? snapshot.nodes.find((item) => item.nodeId === candidate.linkedHierarchyNodeId)
    : undefined;
  const source: ContactDataSource = node?.personName || node?.employeeId || node?.internalIdentifier
    ? "pass3_person_light_mapping"
    : "unknown";
  const timestamp = now();
  const profile: ParticipantContactProfile = {
    participantId: id("target_person"),
    linkedTargetCandidateId: candidate.candidateId,
    displayName: node?.personName ?? candidate.personLabel ?? node?.occupantOfRole ?? candidate.roleLabel ?? "Unassigned participant",
    linkedHierarchyNodeId: candidate.linkedHierarchyNodeId,
    roleLabel: candidate.roleLabel ?? node?.roleLabel ?? "Unknown role",
    targetType: candidate.targetType,
    employeeId: node?.employeeId,
    internalIdentifier: node?.internalIdentifier,
    availableChannels: [],
    contactDataSource: {
      displayName: source,
      employeeId: node?.employeeId ? source : undefined,
      internalIdentifier: node?.internalIdentifier ? source : undefined,
    },
    contactDataStatus: "not_entered",
    lastContactDataUpdatedAt: timestamp,
    lastContactDataUpdatedBy: updatedBy,
  };
  profile.availableChannels = contactChannels(profile);
  profile.contactDataStatus = deriveContactDataStatus(profile);
  return profile;
}

function finalSummary(plan: Pick<TargetingRolloutPlan, "targetCandidates" | "participantContactProfiles">): TargetingRolloutPlan["finalReviewSummary"] {
  const approved = plan.targetCandidates.filter((candidate) => candidate.adminDecision === "accepted" || candidate.adminDecision === "edited");
  const rejected = plan.targetCandidates.filter((candidate) => candidate.adminDecision === "rejected");
  const gaps = plan.participantContactProfiles
    .filter((profile) => profile.contactDataStatus !== "ready_for_later_outreach" && profile.contactDataStatus !== "multiple_channels_available")
    .map((profile) => `${profile.displayName || profile.roleLabel}: ${profile.contactDataStatus}`);
  return {
    approvedCandidateIds: approved.map((candidate) => candidate.candidateId),
    rejectedCandidateIds: rejected.map((candidate) => candidate.candidateId),
    unresolvedContactGaps: gaps,
    adminEditsAndNotes: [
      ...plan.targetCandidates.flatMap((candidate) => candidate.adminNote ? [`${candidate.candidateId}: ${candidate.adminNote}`] : []),
      ...plan.participantContactProfiles.flatMap((profile) => profile.adminNote ? [`${profile.participantId}: ${profile.adminNote}`] : []),
    ],
    readyForLaterOutreachCount: plan.participantContactProfiles.filter((profile) => profile.contactDataStatus === "ready_for_later_outreach" || profile.contactDataStatus === "multiple_channels_available").length,
    contactGapCount: gaps.length,
  };
}

function validatePlan(plan: TargetingRolloutPlan): TargetingRolloutPlan {
  const result = validateTargetingRolloutPlan(plan);
  if (!result.ok) throw new Error(`Invalid TargetingRolloutPlan: ${validationMessage(result.errors)}`);
  return plan;
}

function latestReadinessForCase(companyId: string, caseId: string, repos: TargetingRolloutRepos): HierarchyReadinessSnapshot | null {
  const snapshots = repos.hierarchyReadinessSnapshots.findByCompanyAndCase(companyId, caseId);
  return snapshots[snapshots.length - 1] ?? null;
}

function approvedSnapshotForReadiness(readiness: HierarchyReadinessSnapshot, repos: TargetingRolloutRepos): ApprovedHierarchySnapshot | null {
  if (readiness.approvedSnapshotId) return repos.approvedHierarchySnapshots.findByCompany(readiness.companyId, readiness.caseId, readiness.approvedSnapshotId);
  return repos.approvedHierarchySnapshots.findByCompanyAndCase(readiness.companyId, readiness.caseId).find((snapshot) => snapshot.sessionId === readiness.sessionId) ?? null;
}

export function createOrLoadTargetingRolloutPlan(input: {
  companyId: string;
  caseId: string;
  createdBy?: string;
}, repos: TargetingRolloutRepos): TargetingRolloutPlan {
  const existing = repos.targetingRolloutPlans.findByCompanyAndCase(input.companyId, input.caseId)[0];
  if (existing) return existing;
  const readiness = latestReadinessForCase(input.companyId, input.caseId, repos);
  if (!readiness || readiness.status !== "ready_for_participant_targeting_planning") {
    throw new Error("Pass 4 requires a Pass 3 readiness snapshot with status ready_for_participant_targeting_planning.");
  }
  const snapshot = approvedSnapshotForReadiness(readiness, repos);
  if (!snapshot) throw new Error("Pass 4 requires an approved Pass 3 hierarchy snapshot.");
  const session = repos.intakeSessions.findById(readiness.sessionId);
  const timestamp = now();
  const candidates: TargetCandidate[] = snapshot.nodes.map((node, index) => {
    const targetType = targetTypeForNode(node.groupLayer);
    return {
      candidateId: id("target_candidate"),
      targetType,
      linkedHierarchyNodeId: node.nodeId,
      roleLabel: node.roleLabel,
      personLabel: node.personName ?? node.occupantOfRole,
      suggestedReason: `Carried forward from approved Pass 3 hierarchy as a ${node.groupLayer} role for admin targeting review.`,
      expectedWorkflowVisibility: targetType === "core_participant"
        ? "Likely closest to day-to-day execution, pending admin confirmation."
        : "Likely provides oversight, approvals, thresholds, or clarification, pending admin confirmation.",
      sourceSignals: [],
      participantValidationNeeded: true,
      suggestedRolloutStage: stageForTargetType(targetType),
      rolloutOrder: index + 1,
      contactChannelReadinessStatus: "not_entered",
      confidence: node.personRoleConfidence ?? "unknown",
      adminDecision: "pending",
    };
  });
  const profiles = candidates.map((candidate) => profileFromCandidate(candidate, snapshot, input.createdBy ?? "admin"));
  const plan: TargetingRolloutPlan = {
    planId: id("targeting_plan"),
    companyId: input.companyId,
    caseId: input.caseId,
    sessionId: readiness.sessionId,
    selectedDepartment: session?.primaryDepartment ?? "unknown",
    selectedUseCase: session?.useCaseSelection?.useCaseLabel ?? "unknown",
    basisHierarchySnapshotId: snapshot.approvedSnapshotId,
    basisReadinessSnapshotId: readiness.readinessSnapshotId,
    state: "under_admin_review",
    targetCandidates: candidates,
    adminCandidateDecisions: candidates,
    participantContactProfiles: profiles,
    sourceSignalsUsed: [],
    questionHintSeeds: [],
    rolloutOrder: [1, 2, 3].map((stage) => ({
      stageId: id("rollout_stage"),
      stageNumber: stage,
      label: stage === 1 ? "Core operational participants" : stage === 2 ? "Enrichment and oversight" : "External decision or clarification",
      candidateIds: candidates.filter((candidate) => candidate.suggestedRolloutStage === stage).map((candidate) => candidate.candidateId),
      rationale: "Bottom-up rollout planning suggestion; admin may edit order before approval.",
    })),
    finalReviewSummary: {
      approvedCandidateIds: [],
      rejectedCandidateIds: [],
      unresolvedContactGaps: profiles.map((profile) => `${profile.displayName || profile.roleLabel}: ${profile.contactDataStatus}`),
      adminEditsAndNotes: [],
      readyForLaterOutreachCount: 0,
      contactGapCount: profiles.length,
    },
    finalPlanState: "under_admin_review",
    providerStatus: "not_requested",
    approvalMetadata: {},
    boundaryConfirmations: boundaryConfirmations(),
    manualFallbackAvailable: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  plan.finalReviewSummary = finalSummary(plan);
  repos.targetingRolloutPlans.save(validatePlan(plan));
  return plan;
}

function statusFromError(message: string): Exclude<TargetingProviderStatus, "not_requested" | "provider_success"> {
  if (message.includes("provider_auth_failed")) return "provider_auth_failed";
  if (message.includes("provider_model_unavailable")) return "provider_model_unavailable";
  if (message.includes("provider_rate_limited")) return "provider_rate_limited";
  if (message.includes("provider_not_configured") || message.includes("GOOGLE_AI_API_KEY")) return "provider_not_configured";
  return "provider_execution_failed";
}

export async function generateTargetingRecommendationPacket(input: {
  companyId: string;
  caseId: string;
  provider: TargetingRecommendationProvider | null;
  generatedBy?: string;
}, repos: TargetingRolloutRepos): Promise<TargetingRolloutPlan> {
  const plan = createOrLoadTargetingRolloutPlan({ companyId: input.companyId, caseId: input.caseId, createdBy: input.generatedBy }, repos);
  const snapshot = repos.approvedHierarchySnapshots.findByCompany(plan.companyId, plan.caseId, plan.basisHierarchySnapshotId);
  const readiness = repos.hierarchyReadinessSnapshots.findByCompany(plan.companyId, plan.caseId, plan.basisReadinessSnapshotId);
  if (!snapshot || !readiness) throw new Error("Pass 4 basis hierarchy/readiness data is missing.");
  const sourceSignals = repos.sourceHierarchyTriageSuggestions
    ?.findByCompanyAndCase(plan.companyId, plan.caseId)
    .filter((signal) => signal.sessionId === plan.sessionId) ?? [];
  const promptSpec = ensureActivePass4TargetingPromptSpec(repos.structuredPromptSpecs);
  const compiledPrompt = compilePass4TargetingPromptSpec(promptSpec, {
    caseId: plan.caseId,
    sessionId: plan.sessionId,
    selectedDepartment: plan.selectedDepartment,
    selectedUseCase: plan.selectedUseCase,
    approvedHierarchySnapshotJson: JSON.stringify(snapshot, null, 2),
    hierarchyReadinessSnapshotJson: JSON.stringify(readiness, null, 2),
    sourceSignalsJson: JSON.stringify(sourceSignals, null, 2),
  });

  const timestamp = now();
  if (!input.provider) {
    const failed = {
      ...plan,
      providerStatus: "provider_not_configured" as const,
      providerFailure: {
        message: "provider_not_configured: no provider configured for Pass 4 packet generation.",
        failedAt: timestamp,
      },
      manualFallbackAvailable: true,
      updatedAt: timestamp,
    };
    repos.targetingRolloutPlans.save(validatePlan(failed));
    return failed;
  }

  try {
    const generated = await input.provider.generateTargetingRecommendationPacket({ compiledPrompt });
    const packet: TargetingRecommendationPacket = {
      packetId: id("targeting_packet"),
      companyId: plan.companyId,
      caseId: plan.caseId,
      selectedDepartment: plan.selectedDepartment,
      selectedUseCase: plan.selectedUseCase,
      basisHierarchySnapshotId: plan.basisHierarchySnapshotId,
      basisReadinessSnapshotId: plan.basisReadinessSnapshotId,
      generatedByPromptVersionId: promptSpec.promptSpecId,
      providerExecutionRef: `${generated.provider}:${generated.model}`,
      generatedAt: timestamp,
      suggestedTargetCandidates: generated.packet.suggestedTargetCandidates ?? [],
      targetGroups: generated.packet.targetGroups ?? [],
      rolloutOrderSuggestion: generated.packet.rolloutOrderSuggestion ?? [],
      sourceSignalsUsed: generated.packet.sourceSignalsUsed ?? [],
      questionHintSeeds: generated.packet.questionHintSeeds ?? [],
      contactChannelReadinessNotes: generated.packet.contactChannelReadinessNotes ?? [],
      adminReviewFlags: generated.packet.adminReviewFlags ?? [],
      boundaryWarnings: generated.packet.boundaryWarnings ?? [],
      confidenceSummary: generated.packet.confidenceSummary ?? "Provider generated a packet; admin review is required.",
      manualFallbackAvailable: true,
      adminDecisionStatus: "pending_review",
    };
    const packetResult = validateTargetingRecommendationPacket(packet);
    if (!packetResult.ok) throw new Error(`Invalid TargetingRecommendationPacket: ${validationMessage(packetResult.errors)}`);
    const packetProfiles = packet.suggestedTargetCandidates.map((candidate) => profileFromCandidate(candidate, snapshot, input.generatedBy ?? "admin"));
    const next: TargetingRolloutPlan = {
      ...plan,
      state: "draft_from_ai_packet",
      recommendationPacketSummary: packet,
      targetCandidates: packet.suggestedTargetCandidates,
      adminCandidateDecisions: packet.suggestedTargetCandidates,
      participantContactProfiles: packetProfiles,
      sourceSignalsUsed: packet.sourceSignalsUsed,
      questionHintSeeds: packet.questionHintSeeds,
      rolloutOrder: packet.rolloutOrderSuggestion,
      providerStatus: "provider_success",
      providerFailure: undefined,
      updatedAt: timestamp,
    };
    next.finalReviewSummary = finalSummary(next);
    repos.targetingRolloutPlans.save(validatePlan(next));
    return next;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const failed: TargetingRolloutPlan = {
      ...plan,
      providerStatus: statusFromError(message),
      providerFailure: { message, failedAt: timestamp },
      manualFallbackAvailable: true,
      updatedAt: timestamp,
    };
    repos.targetingRolloutPlans.save(validatePlan(failed));
    return failed;
  }
}

function loadPlan(input: { planId: string; companyId: string; caseId: string }, repos: TargetingRolloutRepos): TargetingRolloutPlan {
  const plan = repos.targetingRolloutPlans.findByCompany(input.companyId, input.caseId, input.planId);
  if (!plan) throw new Error(`Targeting rollout plan not found: ${input.planId}`);
  return plan;
}

export function updateCandidateDecision(input: {
  planId: string;
  companyId: string;
  caseId: string;
  candidateId: string;
  adminDecision?: TargetCandidate["adminDecision"];
  targetType?: TargetType;
  rolloutStage?: number;
  rolloutOrder?: number;
  markContactDataMissing?: boolean;
  adminNote?: string;
}, repos: TargetingRolloutRepos): TargetingRolloutPlan {
  const plan = loadPlan(input, repos);
  const targetCandidates = plan.targetCandidates.map((candidate) => {
    if (candidate.candidateId !== input.candidateId) return candidate;
    return {
      ...candidate,
      adminDecision: input.adminDecision ?? (input.targetType || input.rolloutStage ? "edited" : candidate.adminDecision),
      targetType: input.targetType ?? candidate.targetType,
      suggestedRolloutStage: input.rolloutStage ?? candidate.suggestedRolloutStage,
      rolloutOrder: input.rolloutOrder ?? candidate.rolloutOrder,
      contactChannelReadinessStatus: input.markContactDataMissing ? "missing_required_contact_method" : candidate.contactChannelReadinessStatus,
      adminNote: input.adminNote ?? candidate.adminNote,
    };
  });
  const next: TargetingRolloutPlan = {
    ...plan,
    targetCandidates,
    adminCandidateDecisions: targetCandidates,
    updatedAt: now(),
  };
  next.finalReviewSummary = finalSummary(next);
  repos.targetingRolloutPlans.save(validatePlan(next));
  return next;
}

export function updateParticipantContactProfile(input: {
  planId: string;
  companyId: string;
  caseId: string;
  participantId: string;
  updates: Partial<ParticipantContactProfile>;
  updatedBy?: string;
}, repos: TargetingRolloutRepos): TargetingRolloutPlan {
  const plan = loadPlan(input, repos);
  const timestamp = now();
  const participantContactProfiles = plan.participantContactProfiles.map((profile) => {
    if (profile.participantId !== input.participantId) return profile;
    const next = {
      ...profile,
      ...input.updates,
      contactDataSource: {
        ...profile.contactDataSource,
        ...input.updates.contactDataSource,
      },
      lastContactDataUpdatedAt: timestamp,
      lastContactDataUpdatedBy: input.updatedBy ?? "admin",
    };
    next.availableChannels = input.updates.availableChannels ?? contactChannels(next);
    next.contactDataStatus = input.updates.contactDataStatus ?? deriveContactDataStatus(next);
    return next;
  });
  const next: TargetingRolloutPlan = { ...plan, participantContactProfiles, updatedAt: timestamp };
  next.finalReviewSummary = finalSummary(next);
  repos.targetingRolloutPlans.save(validatePlan(next));
  return next;
}

export function updateQuestionHintSeed(input: {
  planId: string;
  companyId: string;
  caseId: string;
  hintId: string;
  status: QuestionHintSeed["status"];
  adminNote?: string;
}, repos: TargetingRolloutRepos): TargetingRolloutPlan {
  const plan = loadPlan(input, repos);
  const next: TargetingRolloutPlan = {
    ...plan,
    questionHintSeeds: plan.questionHintSeeds.map((hint) => hint.hintId === input.hintId ? { ...hint, status: input.status, adminNote: input.adminNote ?? hint.adminNote } : hint),
    updatedAt: now(),
  };
  repos.targetingRolloutPlans.save(validatePlan(next));
  return next;
}

export function transitionTargetingPlan(input: {
  planId: string;
  companyId: string;
  caseId: string;
  state: TargetingRolloutPlanState;
  adminUser?: string;
  adminNote?: string;
}, repos: TargetingRolloutRepos): TargetingRolloutPlan {
  const plan = loadPlan(input, repos);
  const allowed: Record<TargetingRolloutPlanState, TargetingRolloutPlanState[]> = {
    draft_from_ai_packet: ["under_admin_review"],
    under_admin_review: ["approved_ready_for_outreach", "approved_with_contact_gaps", "needs_rework", "rejected"],
    approved_ready_for_outreach: [],
    approved_with_contact_gaps: ["approved_ready_for_outreach"],
    needs_rework: ["draft_from_ai_packet"],
    rejected: [],
  };
  if (!allowed[plan.state].includes(input.state) && plan.state !== input.state) {
    throw new Error(`Invalid Pass 4 plan transition: ${plan.state} -> ${input.state}`);
  }
  const timestamp = now();
  const approvalMetadata = { ...plan.approvalMetadata };
  if (input.state.startsWith("approved")) {
    approvalMetadata.approvedBy = input.adminUser ?? "admin";
    approvalMetadata.approvedAt = timestamp;
    approvalMetadata.approvalNote = input.adminNote;
  }
  if (input.state === "rejected") {
    approvalMetadata.rejectedBy = input.adminUser ?? "admin";
    approvalMetadata.rejectedAt = timestamp;
  }
  if (input.state === "needs_rework") {
    approvalMetadata.reworkRequestedBy = input.adminUser ?? "admin";
    approvalMetadata.reworkRequestedAt = timestamp;
  }
  const next: TargetingRolloutPlan = {
    ...plan,
    state: input.state,
    finalPlanState: input.state,
    approvalMetadata,
    boundaryConfirmations: boundaryConfirmations(),
    updatedAt: timestamp,
  };
  next.finalReviewSummary = finalSummary(next);
  repos.targetingRolloutPlans.save(validatePlan(next));
  return next;
}
