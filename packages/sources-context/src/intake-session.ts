/**
 * Intake session management — Pass 2 §4.
 * Creates intake sessions, manages lifecycle status, structured context.
 */

import {
  validateIntakeSession,
  validateIntakeSource,
  validateWebsiteCrawlSession,
} from "@workflow/contracts";
import type {
  IntakeBucket,
  ProviderName,
  StructuredContext,
  UseCaseSelection,
  IntakeSession as IntakeSessionContract,
} from "@workflow/contracts";
import type {
  StoredIntakeSession,
  StoredIntakeSource,
  StoredWebsiteCrawlSession,
  IntakeSessionRepository,
  IntakeSourceRepository,
  WebsiteCrawlRepository,
} from "@workflow/persistence";

// ---------------------------------------------------------------------------
// createIntakeSession
// ---------------------------------------------------------------------------

export function createIntakeSession(input: {
  sessionId: string;
  caseId: string;
  bucket: IntakeBucket;
  defaultProvider: ProviderName;
  availableProviders: ProviderName[];
}, repo: IntakeSessionRepository): StoredIntakeSession {
  const now = new Date().toISOString();
  const session: IntakeSessionContract = {
    sessionId: input.sessionId,
    caseId: input.caseId,
    bucket: input.bucket,
    status: "intake_started",
    providerConfig: {
      defaultProvider: input.defaultProvider,
      availableProviders: input.availableProviders,
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = validateIntakeSession(session);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid IntakeSession: ${messages}`);
  }

  const stored: StoredIntakeSession = { ...session, createdAt: now, updatedAt: now };
  repo.save(stored);
  return stored;
}

// ---------------------------------------------------------------------------
// getIntakeSession
// ---------------------------------------------------------------------------

export function getIntakeSession(
  sessionId: string,
  repo: IntakeSessionRepository,
): StoredIntakeSession | null {
  return repo.findById(sessionId);
}

// ---------------------------------------------------------------------------
// listIntakeSessionsByCase
// ---------------------------------------------------------------------------

export function listIntakeSessionsByCase(
  caseId: string,
  repo: IntakeSessionRepository,
): StoredIntakeSession[] {
  return repo.findByCaseId(caseId);
}

// ---------------------------------------------------------------------------
// updateIntakeSessionStatus
// ---------------------------------------------------------------------------

export function updateIntakeSessionStatus(
  sessionId: string,
  status: IntakeSessionContract["status"],
  repo: IntakeSessionRepository,
): StoredIntakeSession {
  const existing = repo.findById(sessionId);
  if (!existing) throw new Error(`Intake session not found: ${sessionId}`);

  const updated: StoredIntakeSession = {
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid status update: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// setStructuredContext — §12
// ---------------------------------------------------------------------------

export function setStructuredContext(
  sessionId: string,
  context: StructuredContext,
  repo: IntakeSessionRepository,
): StoredIntakeSession {
  const existing = repo.findById(sessionId);
  if (!existing) throw new Error(`Intake session not found: ${sessionId}`);

  const updated: StoredIntakeSession = {
    ...existing,
    structuredContext: context,
    status: "context_formed",
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid structured context: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// setPrimaryDepartment — §12.3 (admin authority, NOT AI-selected)
// ---------------------------------------------------------------------------

export function setPrimaryDepartment(
  sessionId: string,
  department: string,
  repo: IntakeSessionRepository,
): StoredIntakeSession {
  const existing = repo.findById(sessionId);
  if (!existing) throw new Error(`Intake session not found: ${sessionId}`);

  const updated: StoredIntakeSession = {
    ...existing,
    primaryDepartment: department,
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid department update: ${messages}`);
  }

  repo.save(updated);
  return updated;
}

// ---------------------------------------------------------------------------
// selectUseCase — §13
// ---------------------------------------------------------------------------

export function selectUseCase(
  sessionId: string,
  useCaseLabel: string,
  repo: IntakeSessionRepository,
): StoredIntakeSession {
  const existing = repo.findById(sessionId);
  if (!existing) throw new Error(`Intake session not found: ${sessionId}`);

  const selection: UseCaseSelection = {
    useCaseLabel,
    selectedAt: new Date().toISOString(),
  };

  const updated: StoredIntakeSession = {
    ...existing,
    useCaseSelection: selection,
    status: "use_case_selected",
    updatedAt: new Date().toISOString(),
  };

  const result = validateIntakeSession(updated);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    throw new Error(`Invalid use-case selection: ${messages}`);
  }

  repo.save(updated);
  return updated;
}
