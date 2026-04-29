/**
 * Hand-mirrored TypeScript type for CaseConfiguration.
 * Source of truth is src/schemas/case-configuration.schema.json.
 */
export interface CaseConfiguration {
  companyId: string;
  caseId: string;
  domain: string;
  mainDepartment: string;
  subDepartment?: string;
  useCaseLabel: string;
  companyProfileRef: string;
  operatorNotes?: string;
  createdAt: string;
}
