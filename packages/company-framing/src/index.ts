import { validateCaseEntryPacket, validateFramingCandidate, validateFramingSource } from "@workflow/contracts";
import type { AnalysisScope, CaseEntryPacket, FramingCandidate, FramingSource } from "@workflow/contracts";
import { createCase } from "@workflow/core-case";
import type {
  Case,
  CaseEntryPacketRepository,
  CaseRepository,
  FramingCandidateRepository,
  FramingSourceRepository,
  StoredCaseEntryPacket,
  StoredFramingCandidate,
  StoredFramingSource,
} from "@workflow/persistence";

export type FramingSourceIntakeErrorCode =
  | "company_id_required"
  | "input_type_required"
  | "case_id_not_allowed"
  | "note_text_required"
  | "website_url_required"
  | "source_label_required"
  | "source_not_found"
  | "invalid_source";

export interface FramingSourceIntakeError {
  code: FramingSourceIntakeErrorCode;
  message: string;
}

export type FramingSourceResult =
  | { ok: true; source: StoredFramingSource }
  | { ok: false; error: FramingSourceIntakeError };

export interface RegisterFramingSourceInput {
  framingSourceId?: string;
  companyId: string;
  inputType: FramingSource["inputType"];
  framingRunIds?: string[];
  displayName?: string;
  fileName?: string;
  mimeType?: string;
  websiteUrl?: string;
  noteText?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateFramingSourceStatusOptions {
  failureReason?: string;
  updatedAt?: string;
}

function failure(code: FramingSourceIntakeErrorCode, message: string): FramingSourceResult {
  return { ok: false, error: { code, message } };
}

function hasNonEmptyText(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function omitUndefined<T extends object>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  ) as T;
}

function createFramingSourceId(): string {
  const randomId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `framing-source-${randomId}`;
}

function validateCandidateSource(source: StoredFramingSource): FramingSourceResult {
  const result = validateFramingSource(source);
  if (!result.ok) {
    const messages = result.errors.map((error) => error.message ?? String(error)).join("; ");
    return failure("invalid_source", `Invalid FramingSource: ${messages}`);
  }
  return { ok: true, source };
}

function assertNoCaseId(input: object): FramingSourceResult | null {
  if ("caseId" in input) {
    return failure("case_id_not_allowed", "FramingSource registration is pre-case and must not include caseId.");
  }
  return null;
}

export function registerFramingSource(
  input: RegisterFramingSourceInput,
  repo: FramingSourceRepository,
): FramingSourceResult {
  const caseIdError = assertNoCaseId(input);
  if (caseIdError) return caseIdError;
  if (!hasNonEmptyText(input.companyId)) {
    return failure("company_id_required", "companyId is required.");
  }
  if (!input.inputType) {
    return failure("input_type_required", "inputType is required.");
  }
  if (input.inputType === "manual_note" && !hasNonEmptyText(input.noteText)) {
    return failure("note_text_required", "manual_note sources require noteText.");
  }
  if (input.inputType === "website_url" && !hasNonEmptyText(input.websiteUrl)) {
    return failure("website_url_required", "website_url sources require websiteUrl.");
  }
  if (
    ["document", "image", "audio"].includes(input.inputType)
    && !hasNonEmptyText(input.fileName)
    && !hasNonEmptyText(input.displayName)
  ) {
    return failure("source_label_required", `${input.inputType} sources require fileName or displayName.`);
  }

  const now = new Date().toISOString();
  const source = omitUndefined<StoredFramingSource>({
    framingSourceId: input.framingSourceId ?? createFramingSourceId(),
    companyId: input.companyId,
    inputType: input.inputType,
    status: "uploaded",
    sourceVersion: 1,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? input.createdAt ?? now,
    framingRunIds: input.framingRunIds,
    displayName: input.displayName,
    fileName: input.fileName,
    mimeType: input.mimeType,
    websiteUrl: input.websiteUrl,
    noteText: input.noteText,
  });

  const validated = validateCandidateSource(source);
  if (!validated.ok) return validated;

  repo.save(validated.source);
  return validated;
}

export function listFramingSourcesForCompany(
  companyId: string,
  repo: FramingSourceRepository,
): StoredFramingSource[] {
  return repo.findByCompanyId(companyId);
}

export function listFramingSourcesForRun(
  framingRunId: string,
  repo: FramingSourceRepository,
): StoredFramingSource[] {
  return repo.findByFramingRunId(framingRunId);
}

export function updateFramingSourceStatus(
  sourceId: string,
  status: FramingSource["status"],
  repo: FramingSourceRepository,
  options: UpdateFramingSourceStatusOptions = {},
): FramingSourceResult {
  const existing = repo.findById(sourceId);
  if (!existing) {
    return failure("source_not_found", `FramingSource not found: ${sourceId}`);
  }

  const updated = omitUndefined<StoredFramingSource>({
    ...existing,
    status,
    failureReason: options.failureReason,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  });

  const validated = validateCandidateSource(updated);
  if (!validated.ok) return validated;

  repo.save(validated.source);
  return validated;
}

export function attachFramingSourceToRun(
  sourceId: string,
  framingRunId: string,
  repo: FramingSourceRepository,
  options: { updatedAt?: string } = {},
): FramingSourceResult {
  const existing = repo.findById(sourceId);
  if (!existing) {
    return failure("source_not_found", `FramingSource not found: ${sourceId}`);
  }

  const framingRunIds = existing.framingRunIds ?? [];
  const updated: StoredFramingSource = {
    ...existing,
    framingRunIds: framingRunIds.includes(framingRunId)
      ? framingRunIds
      : [...framingRunIds, framingRunId],
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  };

  const validated = validateCandidateSource(updated);
  if (!validated.ok) return validated;

  repo.save(validated.source);
  return validated;
}

export type FramingCandidateErrorCode =
  | "company_id_required"
  | "framing_run_id_required"
  | "candidate_name_required"
  | "analysis_scope_required"
  | "rationale_required"
  | "recommendation_required"
  | "candidate_not_found"
  | "case_id_not_allowed"
  | "invalid_candidate";

export interface FramingCandidateError {
  code: FramingCandidateErrorCode;
  message: string;
}

export type FramingCandidateResult =
  | { ok: true; candidate: StoredFramingCandidate }
  | { ok: false; error: FramingCandidateError };

export interface CreateFramingCandidateInput {
  candidateId?: string;
  companyId: string;
  framingRunId: string;
  candidateName: string;
  analysisScope: AnalysisScope;
  sourceBasisIds?: string[];
  rationale: string;
  risks?: string[];
  recommendation: FramingCandidate["recommendation"];
  status?: FramingCandidate["status"];
  scoreSummary?: FramingCandidate["scoreSummary"];
  scoreMeaning?: string;
  operatorNotes?: string;
  relatedCandidateIds?: string[];
  splitMergeNotes?: string;
  unknowns?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FramingCandidateDecisionUpdate {
  status?: FramingCandidate["status"];
  recommendation?: FramingCandidate["recommendation"];
  operatorNotes?: string;
  splitMergeNotes?: string;
  risks?: string[];
  unknowns?: string[];
  scoreSummary?: FramingCandidate["scoreSummary"];
  scoreMeaning?: string;
  updatedAt?: string;
}

const DEFAULT_SCORE_MEANING =
  "Scores are operator decision support only and do not represent workflow truth, participant evidence, or package readiness.";

function candidateFailure(code: FramingCandidateErrorCode, message: string): FramingCandidateResult {
  return { ok: false, error: { code, message } };
}

function createFramingCandidateId(): string {
  const randomId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `framing-candidate-${randomId}`;
}

function validateCandidate(candidate: StoredFramingCandidate): FramingCandidateResult {
  const result = validateFramingCandidate(candidate);
  if (!result.ok) {
    const messages = result.errors.map((error) => error.message ?? String(error)).join("; ");
    return candidateFailure("invalid_candidate", `Invalid FramingCandidate: ${messages}`);
  }
  return { ok: true, candidate };
}

function assertCandidateHasNoCaseId(input: object): FramingCandidateResult | null {
  if ("caseId" in input || "sessionId" in input) {
    return candidateFailure("case_id_not_allowed", "FramingCandidate is pre-case and must not include caseId or sessionId.");
  }
  return null;
}

export function createFramingCandidate(
  input: CreateFramingCandidateInput,
  repo: FramingCandidateRepository,
): FramingCandidateResult {
  const caseIdError = assertCandidateHasNoCaseId(input);
  if (caseIdError) return caseIdError;
  if (!hasNonEmptyText(input.companyId)) return candidateFailure("company_id_required", "companyId is required.");
  if (!hasNonEmptyText(input.framingRunId)) return candidateFailure("framing_run_id_required", "framingRunId is required.");
  if (!hasNonEmptyText(input.candidateName)) return candidateFailure("candidate_name_required", "candidateName is required.");
  if (!input.analysisScope) return candidateFailure("analysis_scope_required", "analysisScope is required.");
  if (!hasNonEmptyText(input.rationale)) return candidateFailure("rationale_required", "rationale is required.");
  if (!input.recommendation) return candidateFailure("recommendation_required", "recommendation is required.");

  const now = new Date().toISOString();
  const candidate = omitUndefined<StoredFramingCandidate>({
    candidateId: input.candidateId ?? createFramingCandidateId(),
    companyId: input.companyId,
    framingRunId: input.framingRunId,
    candidateName: input.candidateName,
    analysisScope: input.analysisScope,
    sourceBasisIds: input.sourceBasisIds ?? [],
    rationale: input.rationale,
    risks: input.risks ?? [],
    recommendation: input.recommendation,
    status: input.status ?? "draft",
    scoreSummary: input.scoreSummary,
    scoreMeaning: input.scoreSummary ? input.scoreMeaning ?? DEFAULT_SCORE_MEANING : input.scoreMeaning,
    operatorNotes: input.operatorNotes,
    relatedCandidateIds: input.relatedCandidateIds,
    splitMergeNotes: input.splitMergeNotes,
    unknowns: input.unknowns,
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? input.createdAt ?? now,
  });

  const validated = validateCandidate(candidate);
  if (!validated.ok) return validated;

  repo.save(validated.candidate);
  return validated;
}

export function listFramingCandidatesForCompany(
  companyId: string,
  repo: FramingCandidateRepository,
): StoredFramingCandidate[] {
  return repo.findByCompanyId(companyId);
}

export function listFramingCandidatesForRun(
  framingRunId: string,
  repo: FramingCandidateRepository,
): StoredFramingCandidate[] {
  return repo.findByFramingRunId(framingRunId);
}

export function getFramingCandidate(
  candidateId: string,
  repo: FramingCandidateRepository,
): StoredFramingCandidate | null {
  return repo.findById(candidateId);
}

export function updateFramingCandidateDecision(
  candidateId: string,
  updates: FramingCandidateDecisionUpdate,
  repo: FramingCandidateRepository,
): FramingCandidateResult {
  const existing = repo.findById(candidateId);
  if (!existing) return candidateFailure("candidate_not_found", `FramingCandidate not found: ${candidateId}`);

  const updated = omitUndefined<StoredFramingCandidate>({
    ...existing,
    status: updates.status ?? existing.status,
    recommendation: updates.recommendation ?? existing.recommendation,
    operatorNotes: updates.operatorNotes ?? existing.operatorNotes,
    splitMergeNotes: updates.splitMergeNotes ?? existing.splitMergeNotes,
    risks: updates.risks ?? existing.risks,
    unknowns: updates.unknowns ?? existing.unknowns,
    scoreSummary: updates.scoreSummary ?? existing.scoreSummary,
    scoreMeaning: updates.scoreSummary
      ? updates.scoreMeaning ?? existing.scoreMeaning ?? DEFAULT_SCORE_MEANING
      : updates.scoreMeaning ?? existing.scoreMeaning,
    updatedAt: updates.updatedAt ?? new Date().toISOString(),
  });

  const validated = validateCandidate(updated);
  if (!validated.ok) return validated;

  repo.save(validated.candidate);
  return validated;
}

export function updateFramingCandidateAnalysisScope(
  candidateId: string,
  analysisScope: AnalysisScope,
  repo: FramingCandidateRepository,
  options: { updatedAt?: string } = {},
): FramingCandidateResult {
  const existing = repo.findById(candidateId);
  if (!existing) return candidateFailure("candidate_not_found", `FramingCandidate not found: ${candidateId}`);

  const updated = omitUndefined<StoredFramingCandidate>({
    ...existing,
    analysisScope,
    updatedAt: options.updatedAt ?? new Date().toISOString(),
  });

  const validated = validateCandidate(updated);
  if (!validated.ok) return validated;

  repo.save(validated.candidate);
  return validated;
}

export type CaseEntryPacketErrorCode =
  | "company_id_required"
  | "candidate_not_found"
  | "packet_not_found"
  | "packet_already_promoted"
  | "domain_required"
  | "main_department_required"
  | "use_case_label_required"
  | "analysis_scope_required"
  | "invalid_packet"
  | "case_creation_failed";

export interface CaseEntryPacketError {
  code: CaseEntryPacketErrorCode;
  message: string;
}

export type CaseEntryPacketResult =
  | { ok: true; packet: StoredCaseEntryPacket }
  | { ok: false; error: CaseEntryPacketError };

export type CasePromotionResult =
  | { ok: true; case: Case; packet: StoredCaseEntryPacket }
  | { ok: false; error: CaseEntryPacketError };

export interface CreateKnownUseCasePacketInput {
  packetId?: string;
  companyId: string;
  framingRunId?: string;
  proposedDomain: string;
  proposedMainDepartment: string;
  proposedUseCaseLabel: string;
  analysisScope: AnalysisScope;
  includedFramingSourceIds?: string[];
  contextOnlyFramingSourceIds?: string[];
  excludedFramingSourceIds?: string[];
  assumptions?: string[];
  unknowns?: string[];
  adjacentWorkflowCandidateIds?: string[];
  createdAt?: string;
}

export interface CreateCandidateCaseEntryPacketInput {
  packetId?: string;
  candidateId: string;
  proposedDomain?: string;
  proposedMainDepartment?: string;
  proposedUseCaseLabel?: string;
  includedFramingSourceIds?: string[];
  contextOnlyFramingSourceIds?: string[];
  excludedFramingSourceIds?: string[];
  assumptions?: string[];
  unknowns?: string[];
  createdAt?: string;
}

export interface PromoteCaseEntryPacketInput {
  caseId?: string;
  promotedBy?: string;
  createdAt?: string;
  promotedAt?: string;
  companyProfileRef?: string;
}

function packetFailure(code: CaseEntryPacketErrorCode, message: string): CaseEntryPacketResult {
  return { ok: false, error: { code, message } };
}

function promotionFailure(code: CaseEntryPacketErrorCode, message: string): CasePromotionResult {
  return { ok: false, error: { code, message } };
}

function createPacketId(): string {
  const randomId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `case-entry-packet-${randomId}`;
}

function createPromotedCaseId(): string {
  const randomId = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `case-${randomId}`;
}

function validatePacket(packet: StoredCaseEntryPacket): CaseEntryPacketResult {
  const result = validateCaseEntryPacket(packet);
  if (!result.ok) {
    const messages = result.errors.map((error) => error.message ?? String(error)).join("; ");
    return packetFailure("invalid_packet", `Invalid CaseEntryPacket: ${messages}`);
  }
  return { ok: true, packet };
}

export function createKnownUseCasePacket(
  input: CreateKnownUseCasePacketInput,
  repo: CaseEntryPacketRepository,
): CaseEntryPacketResult {
  if (!hasNonEmptyText(input.companyId)) return packetFailure("company_id_required", "companyId is required.");
  if (!hasNonEmptyText(input.proposedDomain)) return packetFailure("domain_required", "proposedDomain is required.");
  if (!hasNonEmptyText(input.proposedMainDepartment)) return packetFailure("main_department_required", "proposedMainDepartment is required.");
  if (!hasNonEmptyText(input.proposedUseCaseLabel)) return packetFailure("use_case_label_required", "proposedUseCaseLabel is required.");
  if (!input.analysisScope) return packetFailure("analysis_scope_required", "analysisScope is required.");

  const packet = omitUndefined<StoredCaseEntryPacket>({
    packetId: input.packetId ?? createPacketId(),
    companyId: input.companyId,
    source: "known_use_case",
    proposedDomain: input.proposedDomain,
    proposedMainDepartment: input.proposedMainDepartment,
    proposedUseCaseLabel: input.proposedUseCaseLabel,
    analysisScope: input.analysisScope,
    includedFramingSourceIds: input.includedFramingSourceIds ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
    framingRunId: input.framingRunId,
    contextOnlyFramingSourceIds: input.contextOnlyFramingSourceIds,
    excludedFramingSourceIds: input.excludedFramingSourceIds,
    assumptions: input.assumptions,
    unknowns: input.unknowns,
    adjacentWorkflowCandidateIds: input.adjacentWorkflowCandidateIds,
  });

  const validated = validatePacket(packet);
  if (!validated.ok) return validated;
  repo.save(validated.packet);
  return validated;
}

export function createCandidateCaseEntryPacket(
  candidateId: string,
  input: Omit<CreateCandidateCaseEntryPacketInput, "candidateId">,
  repos: {
    candidates: FramingCandidateRepository;
    packets: CaseEntryPacketRepository;
  },
): CaseEntryPacketResult {
  const candidate = repos.candidates.findById(candidateId);
  if (!candidate) return packetFailure("candidate_not_found", `FramingCandidate not found: ${candidateId}`);
  const proposedUseCaseLabel = input.proposedUseCaseLabel
    ?? candidate.analysisScope.scopeLabel
    ?? candidate.candidateName;
  const proposedMainDepartment = input.proposedMainDepartment
    ?? candidate.analysisScope.primaryFunctionalAnchor;
  if (!hasNonEmptyText(input.proposedDomain)) return packetFailure("domain_required", "proposedDomain is required.");
  const proposedDomain = input.proposedDomain ?? "";

  const packet = omitUndefined<StoredCaseEntryPacket>({
    packetId: input.packetId ?? createPacketId(),
    companyId: candidate.companyId,
    source: "framing_candidate",
    proposedDomain,
    proposedMainDepartment,
    proposedUseCaseLabel,
    analysisScope: candidate.analysisScope,
    includedFramingSourceIds: input.includedFramingSourceIds ?? candidate.sourceBasisIds ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
    framingRunId: candidate.framingRunId,
    candidateId: candidate.candidateId,
    contextOnlyFramingSourceIds: input.contextOnlyFramingSourceIds,
    excludedFramingSourceIds: input.excludedFramingSourceIds,
    assumptions: input.assumptions,
    unknowns: input.unknowns,
  });

  const validated = validatePacket(packet);
  if (!validated.ok) return validated;
  repos.packets.save(validated.packet);
  return validated;
}

export function getCaseEntryPacket(
  packetId: string,
  repo: CaseEntryPacketRepository,
): StoredCaseEntryPacket | null {
  return repo.findById(packetId);
}

export function listCaseEntryPacketsForCompany(
  companyId: string,
  repo: CaseEntryPacketRepository,
): StoredCaseEntryPacket[] {
  return repo.findByCompanyId(companyId);
}

export function listCaseEntryPacketsForFramingRun(
  framingRunId: string,
  repo: CaseEntryPacketRepository,
): StoredCaseEntryPacket[] {
  return repo.findByFramingRunId(framingRunId);
}

export function promoteCaseEntryPacketToCase(
  packetId: string,
  input: PromoteCaseEntryPacketInput,
  repos: {
    packets: CaseEntryPacketRepository;
    cases: CaseRepository;
    candidates?: FramingCandidateRepository;
  },
): CasePromotionResult {
  const packet = repos.packets.findById(packetId);
  if (!packet) return promotionFailure("packet_not_found", `CaseEntryPacket not found: ${packetId}`);
  if (packet.createdCaseId) return promotionFailure("packet_already_promoted", `CaseEntryPacket already promoted to case: ${packet.createdCaseId}`);

  const now = new Date().toISOString();
  const caseId = input.caseId ?? createPromotedCaseId();
  try {
    const createdCase = createCase(
      {
        companyId: packet.companyId,
        caseId,
        domain: packet.proposedDomain,
        mainDepartment: packet.proposedMainDepartment,
        useCaseLabel: packet.proposedUseCaseLabel,
        companyProfileRef: input.companyProfileRef ?? `case-entry-packet:${packet.packetId}`,
        createdAt: input.createdAt ?? now,
      },
      repos.cases,
    );

    const promotedPacket = omitUndefined<StoredCaseEntryPacket>({
      ...packet,
      createdCaseId: createdCase.caseId,
      promotedBy: input.promotedBy,
      promotedAt: input.promotedAt ?? now,
    });
    const validated = validatePacket(promotedPacket);
    if (!validated.ok) return promotionFailure(validated.error.code, validated.error.message);
    repos.packets.save(validated.packet);

    if (packet.candidateId && repos.candidates) {
      const existingCandidate = repos.candidates.findById(packet.candidateId);
      if (existingCandidate) {
        const candidateUpdate = updateFramingCandidateDecision(
          packet.candidateId,
          { status: "promoted", updatedAt: input.promotedAt ?? now },
          repos.candidates,
        );
        if (!candidateUpdate.ok) {
          return promotionFailure("case_creation_failed", candidateUpdate.error.message);
        }
      }
    }

    return { ok: true, case: createdCase, packet: validated.packet };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return promotionFailure("case_creation_failed", message);
  }
}
