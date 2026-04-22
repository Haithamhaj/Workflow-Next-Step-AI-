/**
 * Initial Package assembly — Pass 6 implementation.
 * Spec refs: §21.3 (five mandatory outward sections),
 *            §21.4 (conditional Document/Reference Implication — operator-
 *            supplied; triggers not invented),
 *            §21.5 (package status enum),
 *            §21.8 (seven-condition checklist must NOT appear in outward),
 *            §21.11 (admin-only judgment layer).
 *
 * Architecture constraint: this package does not derive status or checklist
 * values — both are operator-supplied, matching §21.8/§21.11 separation of
 * outward vs admin concerns. Structural separation is enforced by schema:
 * outward and admin are distinct sub-objects.
 */

import {
  validateInitialPackageRecord,
  InitialPackageStatus,
  type InitialPackageRecord,
  type InitialPackageOutward,
  type InitialPackageAdmin,
} from "@workflow/contracts";
import type {
  StoredInitialPackageRecord,
  InitialPackageRepository,
} from "@workflow/persistence";

export const PACKAGES_OUTPUT_PACKAGE = "@workflow/packages-output" as const;

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export { InitialPackageStatus } from "@workflow/contracts";
export type {
  InitialPackageRecord,
  InitialPackageOutward,
  InitialPackageAdmin,
} from "@workflow/contracts";
export type {
  StoredInitialPackageRecord,
  InitialPackageRepository,
} from "@workflow/persistence";

// ---------------------------------------------------------------------------
// Outcome types
// ---------------------------------------------------------------------------

export interface InitialPackageOk {
  ok: true;
  initialPackage: StoredInitialPackageRecord;
}

export interface InitialPackageError {
  ok: false;
  error: string;
}

export type InitialPackageResult = InitialPackageOk | InitialPackageError;

// ---------------------------------------------------------------------------
// createInitialPackage
// ---------------------------------------------------------------------------

/**
 * Validate an InitialPackageRecord payload, reject duplicate IDs, persist a
 * StoredInitialPackageRecord with server-assigned createdAt.
 *
 * The schema enforces §21.3 (five outward fields required), §21.4 (document
 * reference implication optional at outward level), §21.5 (status enum),
 * §21.8 (outward has no sevenConditionChecklist field — structurally absent),
 * and §21.11 (admin sub-object contains the seven-condition checklist plus
 * readiness reasoning).
 */
export function createInitialPackage(
  payload: unknown,
  repo: InitialPackageRepository,
): InitialPackageResult {
  const result = validateInitialPackageRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return {
      ok: false,
      error: `Invalid InitialPackageRecord: ${messages}`,
    };
  }

  const record: InitialPackageRecord = result.value;

  const existing = repo.findById(record.initialPackageId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Initial package with id '${record.initialPackageId}' already exists.`,
    };
  }

  const stored: StoredInitialPackageRecord = {
    ...record,
    createdAt: new Date().toISOString(),
  };

  repo.save(stored);
  return { ok: true, initialPackage: stored };
}

// ---------------------------------------------------------------------------
// get / list helpers
// ---------------------------------------------------------------------------

export function getInitialPackage(
  initialPackageId: string,
  repo: InitialPackageRepository,
): StoredInitialPackageRecord | null {
  return repo.findById(initialPackageId);
}

export function listInitialPackages(
  repo: InitialPackageRepository,
): StoredInitialPackageRecord[] {
  return repo.findAll();
}

export function listInitialPackagesByCaseId(
  caseId: string,
  repo: InitialPackageRepository,
): StoredInitialPackageRecord[] {
  return repo.findByCaseId(caseId);
}

export function listInitialPackagesByEvaluationId(
  evaluationId: string,
  repo: InitialPackageRepository,
): StoredInitialPackageRecord[] {
  return repo.findByEvaluationId(evaluationId);
}
