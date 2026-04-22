import {
  validateFinalPackageRecord,
  type FinalPackageRecord,
  AdminApprovalStatus,
  OutputDirection,
} from "@workflow/contracts";
import type {
  StoredFinalPackageRecord,
  FinalPackageRepository,
} from "@workflow/persistence";

export { AdminApprovalStatus, OutputDirection } from "@workflow/contracts";
export type {
  FinalPackageRecord,
  FinalPackageGapLayer,
} from "@workflow/contracts";
export type {
  StoredFinalPackageRecord,
  FinalPackageRepository,
} from "@workflow/persistence";

export interface FinalPackageOk {
  ok: true;
  finalPackage: StoredFinalPackageRecord;
}

export interface FinalPackageError {
  ok: false;
  error: string;
}

export type FinalPackageResult = FinalPackageOk | FinalPackageError;

export function createFinalPackage(
  payload: unknown,
  repo: FinalPackageRepository,
): FinalPackageResult {
  const result = validateFinalPackageRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return {
      ok: false,
      error: `Invalid FinalPackageRecord: ${messages}`,
    };
  }

  const record: FinalPackageRecord = result.value;

  const existing = repo.findById(record.packageId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Final package with id '${record.packageId}' already exists.`,
    };
  }

  const now = new Date().toISOString();
  const stored: StoredFinalPackageRecord = {
    ...record,
    createdAt: now,
    updatedAt: now,
  };

  repo.save(stored);
  return { ok: true, finalPackage: stored };
}

export function getFinalPackage(
  packageId: string,
  repo: FinalPackageRepository,
): StoredFinalPackageRecord | null {
  return repo.findById(packageId);
}

export function listFinalPackages(
  repo: FinalPackageRepository,
): StoredFinalPackageRecord[] {
  return repo.findAll();
}

export function listFinalPackagesByCaseId(
  caseId: string,
  repo: FinalPackageRepository,
): StoredFinalPackageRecord[] {
  return repo.findByCaseId(caseId);
}

export function updateFinalPackage(
  packageId: string,
  updates: Partial<FinalPackageRecord>,
  repo: FinalPackageRepository,
): FinalPackageResult {
  const existing = repo.findById(packageId);
  if (existing === null) {
    return { ok: false, error: `Final package '${packageId}' not found.` };
  }

  const { createdAt: _c, updatedAt: _u, ...existingRecord } = existing;
  const merged = { ...existingRecord, ...updates };
  const result = validateFinalPackageRecord(merged);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return { ok: false, error: `Invalid update: ${messages}` };
  }

  const updated: StoredFinalPackageRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  repo.save(updated);
  return { ok: true, finalPackage: updated };
}
