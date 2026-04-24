/**
 * Pass 2 Phase 1 — structured context contracts.
 * Source of truth: src/schemas/structured-context*.schema.json.
 */

export type StructuredContextStatus = "draft" | "active" | "archived";

export type InternalDepartmentFamily =
  | "sales"
  | "operations"
  | "hr"
  | "it"
  | "finance"
  | "legal"
  | "customer_support"
  | "procurement"
  | "marketing"
  | "other_or_unknown";

export type DepartmentMappingDecision = "accepted" | "edited" | "rejected" | "unknown";

export type CompanyContextAvailabilityStatus =
  | "company_context_provided"
  | "company_context_skipped_by_admin"
  | "company_context_pending_or_unknown";

export type DepartmentContextAvailabilityStatus =
  | "department_context_provided"
  | "department_documents_not_available_confirmed"
  | "department_context_skipped_by_admin"
  | "department_context_pending_or_unknown";

export type UseCaseBoundaryStatus =
  | "use_case_not_selected"
  | "use_case_same_as_department"
  | "use_case_selected_custom"
  | "use_case_needs_admin_review";

export type UseCaseScopeType =
  | "department"
  | "workflow"
  | "function"
  | "service_path"
  | "operational_segment"
  | "role_group"
  | "unknown";

export type StructuredContextEvidenceKind =
  | "operator_original_note"
  | "ai_structured_from_operator_note"
  | "extracted_from_uploaded_source"
  | "extracted_from_website"
  | "contextual_inference"
  | "admin_confirmed";

export interface StructuredContextFieldEvidenceRef {
  evidenceId: string;
  kind: StructuredContextEvidenceKind;
  sourceId?: string;
  operatorNoteId?: string;
  providerJobId?: string;
  snippet?: string;
  note?: string;
}

export interface DepartmentFramingRecord {
  framingId: string;
  sessionId: string;
  caseId: string;
  primaryDepartmentSelection: string;
  customDepartmentLabel?: string;
  activeDepartmentLabel: string;
  suggestedInternalFamily?: InternalDepartmentFamily;
  mappingDecision: DepartmentMappingDecision;
  acceptedInternalFamily?: InternalDepartmentFamily;
  mappingRationale?: string;
  companyContextAvailabilityStatus: CompanyContextAvailabilityStatus;
  departmentContextAvailabilityStatus: DepartmentContextAvailabilityStatus;
  useCaseBoundaryStatus: UseCaseBoundaryStatus;
  selectedUseCase?: string;
  useCaseScopeType: UseCaseScopeType;
  createdAt: string;
  updatedAt: string;
}

export interface Phase6StructuredContext {
  companyName: string;
  companyScopeSummary: string;
  companyContextSummary: string;
  companyContextAvailabilityStatus: CompanyContextAvailabilityStatus;
  departmentContextAvailabilityStatus: DepartmentContextAvailabilityStatus;
  domain: string;
  subtypeOrOperatingModel: string;
  visibleServicesOrProducts: string[];
  visibleCompanyLevelSignals: string[];
  mainDepartment: string;
  selectedUseCase: string;
  useCaseBoundaryStatus: UseCaseBoundaryStatus;
  useCaseScopeType: UseCaseScopeType;
  departmentContextSummary: string;
  subUnitOrTeam?: string;
  visibleRoleFamiliesOrOrgSignals: string[];
  departmentSpecificSignalsAndRisks: string[];
  keyContextSignalsAndRisks: string[];
  confidenceAndUnknowns: string;
  fieldEvidence: Record<string, StructuredContextFieldEvidenceRef[]>;
}

export interface StructuredContextRecord {
  structuredContextId: string;
  caseId: string;
  sessionId?: string;
  version: number;
  status: StructuredContextStatus;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  context?: Phase6StructuredContext;
}

export interface StructuredContextFieldEvidence {
  evidenceId: string;
  structuredContextId: string;
  caseId: string;
  fieldKey: string;
  fieldValue?: string;
  evidenceRefs: string[];
  confidence?: number;
  extractedAt: string;
  sourceProvider?: string;
}

export type FinalPreHierarchyReadinessStatus = "blocked" | "ready_for_hierarchy_intake";

export type FinalPreHierarchyConfirmationStatus = "not_confirmed" | "confirmed";

export interface FinalPreHierarchySourceSummaryItem {
  bucket: "company" | "department";
  sourceKind: string;
  count: number;
  sourceIds: string[];
}

export interface FinalPreHierarchyReviewRecord {
  reviewId: string;
  caseId: string;
  intakeSessionId: string;
  createdAt: string;
  updatedAt: string;
  companyContextAvailabilityStatus: CompanyContextAvailabilityStatus;
  departmentContextAvailabilityStatus: DepartmentContextAvailabilityStatus;
  selectedPrimaryDepartment: string;
  customDepartmentLabel?: string;
  internalDepartmentFamilyMapping?: InternalDepartmentFamily;
  mappingDecisionStatus: DepartmentMappingDecision;
  selectedUseCase: string;
  useCaseBoundaryStatus: UseCaseBoundaryStatus;
  useCaseScopeType: UseCaseScopeType;
  sourceSummary: FinalPreHierarchySourceSummaryItem[];
  batchSummaryRef?: string;
  sourceIds: string[];
  structuredContextId: string;
  structuredContextSummary: {
    companyContextSummary: string;
    departmentContextSummary: string;
    selectedUseCase: string;
    evidenceFieldCount: number;
  };
  evidenceSummary: {
    fieldKey: string;
    evidenceCount: number;
    evidenceKinds: StructuredContextEvidenceKind[];
    sourceIds: string[];
  }[];
  unresolvedContextRisks: string[];
  confidenceAndUnknowns: string;
  crawlRuntimeCaveat?: string;
  audioTranscriptConfidenceNotes?: string[];
  nextSliceName: "Hierarchy Intake & Approval Build Slice";
  pass2ReadinessStatus: FinalPreHierarchyReadinessStatus;
  adminConfirmationStatus: FinalPreHierarchyConfirmationStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  adminNote?: string;
}
