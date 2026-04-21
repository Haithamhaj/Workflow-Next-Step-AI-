import { validateCaseConfiguration, CaseState } from "@workflow/contracts";
import type { CaseConfiguration } from "@workflow/contracts";
import { isValidTransition } from "@workflow/core-state";
import type { Case, CaseRepository } from "@workflow/persistence";

export const CORE_CASE_PACKAGE = "@workflow/core-case" as const;

export type { Case };

export function createCase(
  config: CaseConfiguration,
  repo: CaseRepository
): Case {
  const result = validateCaseConfiguration(config);
  if (!result.ok) {
    throw new Error(
      `Invalid CaseConfiguration: ${JSON.stringify(result.errors)}`
    );
  }

  const existing = repo.findById(config.caseId);
  if (existing !== null) {
    throw new Error(`Case already exists: ${config.caseId}`);
  }

  const c: Case = { ...config, state: CaseState.Created };
  repo.save(c);
  return c;
}

export function loadCase(caseId: string, repo: CaseRepository): Case | null {
  return repo.findById(caseId);
}

export function listCases(repo: CaseRepository): Case[] {
  return repo.findAll();
}

export { isValidTransition };
