/**
 * Top-level company identity for multi-company isolation.
 */
export type CompanyStatus = "active" | "archived";

export interface Company {
  companyId: string;
  displayName: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
  externalRef?: string;
  notes?: string;
}
