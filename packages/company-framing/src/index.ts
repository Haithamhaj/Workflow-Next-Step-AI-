import { validateFramingSource } from "@workflow/contracts";
import type { FramingSource } from "@workflow/contracts";
import type { FramingSourceRepository, StoredFramingSource } from "@workflow/persistence";

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
