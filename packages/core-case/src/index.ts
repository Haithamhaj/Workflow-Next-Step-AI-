import { validateCaseConfiguration, validateCompany, CaseState } from "@workflow/contracts";
import type { CaseConfiguration, Company } from "@workflow/contracts";
import { isValidTransition } from "@workflow/core-state";
import type { Case, CaseRepository, CompanyRepository } from "@workflow/persistence";

export const CORE_CASE_PACKAGE = "@workflow/core-case" as const;

export type { Case };

export function createCompany(company: Company, repo: CompanyRepository): Company {
  const result = validateCompany(company);
  if (!result.ok) {
    throw new Error(`Invalid Company: ${JSON.stringify(result.errors)}`);
  }
  repo.save(result.value);
  return result.value;
}

export function loadCompany(companyId: string, repo: CompanyRepository): Company | null {
  return repo.findById(companyId);
}

export function listCompanies(repo: CompanyRepository): Company[] {
  return repo.findAll();
}

export function listActiveCompanies(repo: CompanyRepository): Company[] {
  return repo.findActive();
}

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

export function loadCaseForCompany(
  companyId: string,
  caseId: string,
  repo: CaseRepository,
): Case | null {
  return repo.findByCompanyAndCase(companyId, caseId);
}

export function listCases(repo: CaseRepository, companyId?: string): Case[] {
  return companyId ? repo.findByCompanyId(companyId) : repo.findAll();
}

export { isValidTransition };
