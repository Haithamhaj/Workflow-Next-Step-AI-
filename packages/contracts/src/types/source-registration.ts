/**
 * Hand-mirrored TypeScript type for SourceRegistration.
 * Source of truth is src/schemas/source-registration.schema.json.
 */

export type SourceIntakeType =
  | "uploaded_document"
  | "uploaded_form"
  | "uploaded_template"
  | "uploaded_contract_sample"
  | "uploaded_quotation_sample"
  | "uploaded_role_document"
  | "uploaded_workflow_reference"
  | "uploaded_contextual_source";

export type SourceTimingTag =
  | "uploaded_at_case_setup"
  | "uploaded_after_round_1"
  | "uploaded_before_reanalysis"
  | "uploaded_before_round_2"
  | "uploaded_during_gap_closure"
  | "uploaded_for_finalization_support";

export type SourceAuthority = "company_truth" | "informational_domain_support";

export type SourceProcessingStatus =
  | "registered_not_processed"
  | "extraction_in_progress"
  | "extracted_pending_classification"
  | "classified_ready_for_use"
  | "limited_value_visible"
  | "requires_admin_review";

export interface SourceRegistration {
  sourceId: string;
  caseId: string;
  uploaderId: string;
  uploadedAt: string;
  displayName?: string;
  intakeType: SourceIntakeType;
  timingTag: SourceTimingTag;
  authority: SourceAuthority;
  processingStatus: SourceProcessingStatus;
  notes?: string;
}
