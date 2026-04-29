/**
 * Intake & Context Build types (Pass 2 spec).
 * Covers: intake sessions, intake sources, structured context,
 * website crawl, hierarchy intake, provider configuration.
 */

// ---------------------------------------------------------------------------
// §4 — Intake Entry Model
// ---------------------------------------------------------------------------

export type IntakeBucket = "company" | "department";

export type IntakeInputType =
  | "document"
  | "website_url"
  | "manual_note"
  | "image"
  | "audio"
  | "video";

// ---------------------------------------------------------------------------
// §5 — Source Registration and Status (intake-stage statuses)
// ---------------------------------------------------------------------------

export type IntakeSourceStatus =
  | "uploaded"
  | "stored"
  | "extracting"
  | "read"
  | "failed"
  | "pending_analysis"
  | "needs_review";

// ---------------------------------------------------------------------------
// §6 — Batch Summary
// ---------------------------------------------------------------------------

export type AttachmentScope =
  | "company_level"
  | "department_level"
  | "team_unit_level"
  | "role_level"
  | "person_level"
  | "shared"
  | "unknown";

export interface BatchSummaryItem {
  sourceId: string;
  displayName: string;
  bucket: IntakeBucket;
  status: IntakeSourceStatus;
  aiSuggestedType: string;
  aiSuggestedScope: AttachmentScope;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export type IntakeSourceRole =
  | "company_overview"
  | "company_context"
  | "org_signal"
  | "policy_reference"
  | "department_note"
  | "audio_transcript"
  | "website_url"
  | "general_intake_source";

// ---------------------------------------------------------------------------
// §10 — Website Crawl
// ---------------------------------------------------------------------------

export type CrawlPagePriority =
  | "homepage"
  | "about"
  | "services_solutions"
  | "departments_teams_organization"
  | "policies_terms_sla"
  | "contact"
  | "projects_case_studies_portfolio"
  | "client_list_customers_partners"
  | "blog_news"
  | "careers_jobs"
  | "other";

export interface CrawlCandidatePage {
  url: string;
  title: string;
  priority: CrawlPagePriority;
  excluded: boolean;
  exclusionReason?: string;
}

export type CrawlSessionStatus =
  | "discovering"
  | "awaiting_approval"
  | "approved"
  | "crawling"
  | "completed"
  | "failed";

// ---------------------------------------------------------------------------
// §10.5 — Site-Level Website Summary
// ---------------------------------------------------------------------------

export interface WebsiteSummary {
  companyIdentity: string;
  servicesProvided: string;
  domainSignal: string;
  visibleDepartments: string[];
  visibleProjectsClientsPartners: string[];
  importantSignals: string[];
}

// ---------------------------------------------------------------------------
// §12 — Structured Context Model
// ---------------------------------------------------------------------------

export interface StructuredContext {
  companyName: string;
  companyScopeSummary: string;
  domain: string;
  subtypeOrOperatingModel?: string;
  visibleServicesOrProducts: string[];
  mainDepartment: string;
  subUnitOrTeam?: string;
  visibleRoleFamiliesOrOrgSignals: string[];
  keyContextSignalsAndRisks: string[];
  confidenceAndUnknowns: string;
}

// ---------------------------------------------------------------------------
// §8 — Provider Architecture
// ---------------------------------------------------------------------------

export type ProviderName = "google" | "openai";

export interface ProviderConfig {
  defaultProvider: ProviderName;
  availableProviders: ProviderName[];
}

export type ProviderJobStatus = "queued" | "running" | "succeeded" | "failed" | "skipped";
export type SourceLineageStatus = "active" | "previous" | "superseded" | "stale";

export type ProviderJobKind =
  | "document_extraction"
  | "image_ocr"
  | "audio_transcription"
  | "website_url_scaffold"
  | "website_crawl"
  | "manual_note_suggestion"
  | "source_role_suggestion"
  | "structured_context_generation"
  | "pass5_prompt_test";

export interface ProviderExtractionJob {
  jobId: string;
  sourceId: string;
  sessionId: string;
  caseId: string;
  companyId?: string;
  sourceVersion?: number;
  lineageStatus?: SourceLineageStatus;
  provider: ProviderName | "google_speech_to_text" | "crawl4ai" | "fetch_html";
  jobKind: ProviderJobKind;
  status: ProviderJobStatus;
  inputType: IntakeInputType;
  model?: string;
  outputRef?: string;
  errorMessage?: string;
  promptFamily?: string;
  promptName?: string;
  promptVersionId?: string;
  basePromptVersionId?: string;
  inputBundleRef?: string;
  outputContractRef?: string;
  createdAt: string;
  updatedAt: string;
}

export type WebsiteCrawlPlanStatus =
  | "discovery_pending"
  | "discovery_failed"
  | "awaiting_admin_approval"
  | "approved"
  | "rejected"
  | "crawling"
  | "crawl_failed"
  | "completed";

export interface WebsiteCrawlCandidatePage {
  url: string;
  pageTitle?: string;
  priorityReason: string;
  defaultIncluded: boolean;
  adminIncluded: boolean;
  exclusionReason?: string;
}

export interface WebsiteCrawlPlan {
  crawlPlanId: string;
  companyId: string;
  sourceId: string;
  sessionId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  baseUrl: string;
  maxPages: number;
  status: WebsiteCrawlPlanStatus;
  candidatePages: WebsiteCrawlCandidatePage[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteCrawlApproval {
  approvalId: string;
  companyId: string;
  crawlPlanId: string;
  sourceId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  approvedUrls: string[];
  rejectedUrls: string[];
  createdAt: string;
}

export interface CrawledPageContent {
  pageContentId: string;
  companyId: string;
  crawlPlanId: string;
  sourceId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  url: string;
  pageTitle?: string;
  statusCode: number;
  textContent: string;
  createdAt: string;
}

export interface WebsiteCrawlSiteSummary {
  summaryId: string;
  companyId: string;
  crawlPlanId: string;
  sourceId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  summary: WebsiteSummary;
  createdAt: string;
}

export interface ContentChunkRecord {
  chunkId: string;
  companyId: string;
  crawlPlanId: string;
  sourceId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  pageContentId: string;
  url: string;
  chunkIndex: number;
  text: string;
  createdAt: string;
}

export interface TextArtifactRecord {
  artifactId: string;
  sourceId?: string;
  jobId?: string;
  companyId?: string;
  caseId?: string;
  sourceVersion?: number;
  lineageStatus?: SourceLineageStatus;
  artifactKind: "extracted_text" | "raw_transcript" | "embedding_input";
  text: string;
  providerConfidence?: number;
  providerQualitySignal?: string;
  createdAt: string;
}

export type AudioTranscriptReviewStatus =
  | "transcription_pending"
  | "transcript_ready_for_review"
  | "transcript_edited_by_admin"
  | "transcript_approved"
  | "transcript_rejected_or_needs_retry";

export interface AudioTranscriptReviewRecord {
  reviewId: string;
  sourceId: string;
  sessionId: string;
  caseId: string;
  status: AudioTranscriptReviewStatus;
  providerJobId?: string;
  rawTranscriptArtifactId?: string;
  trustedTranscriptArtifactId?: string;
  rawTranscriptText?: string;
  editedTranscriptText?: string;
  adminNotes?: string;
  rejectionReason?: string;
  providerConfidence?: number;
  providerQualitySignal?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmbeddingJobRecord {
  embeddingJobId: string;
  sourceId?: string;
  artifactId?: string;
  companyId?: string;
  caseId?: string;
  sourceVersion?: number;
  lineageStatus?: SourceLineageStatus;
  provider: ProviderName;
  status: ProviderJobStatus;
  embeddingModel?: string;
  chunkRefs: string[];
  outputRef?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIIntakeSuggestion {
  suggestionId: string;
  sourceId: string;
  sessionId: string;
  caseId: string;
  provider: ProviderName;
  status: ProviderJobStatus;
  suggestedSourceRole?: IntakeSourceRole;
  suggestedScope?: AttachmentScope;
  confidenceLevel?: "high" | "medium" | "low";
  shortRationale?: string;
  evidenceRefs?: string[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminSourceRoleDecisionStatus =
  | "confirmed_ai_suggestion"
  | "edited_ai_suggestion"
  | "overridden_by_admin"
  | "marked_needs_review";

export interface AdminIntakeDecision {
  decisionId: string;
  intakeSourceId: string;
  sessionId: string;
  caseId: string;
  suggestionId?: string;
  decidedBy: string;
  decidedAt: string;
  decision: AdminSourceRoleDecisionStatus;
  finalSourceRole?: string;
  finalScope?: AttachmentScope;
  reason?: string;
  preservesOriginalSuggestion: boolean;
}

// ---------------------------------------------------------------------------
// §9 — Audio Mode Separation
// ---------------------------------------------------------------------------

export type AudioMode = "external_upload" | "live_stt";

// ---------------------------------------------------------------------------
// §11 — Manual Note
// ---------------------------------------------------------------------------

export interface ManualNoteTrace {
  originalText: string;
  structuredOutput: StructuredContext;
  transformedAt: string;
}

// ---------------------------------------------------------------------------
// §13 — Use-Case Selection
// ---------------------------------------------------------------------------

export interface UseCaseSelection {
  useCaseLabel: string;
  selectedAt: string;
}

// ---------------------------------------------------------------------------
// §15 — Hierarchy Intake
// ---------------------------------------------------------------------------

export interface HierarchyNode {
  roleLabel: string;
  personName?: string;
  phone?: string;
  team?: string;
  reportsTo?: string;
  branchOrUnit?: string;
  otherDetails?: string;
}

export type HierarchyInputMethod = "pasted_text" | "uploaded_document";

// ---------------------------------------------------------------------------
// Full entity types (match JSON Schema shapes for validation)
// ---------------------------------------------------------------------------

export interface IntakeSession {
  sessionId: string;
  caseId: string;
  bucket: IntakeBucket;
  status:
    | "intake_started"
    | "sources_received"
    | "batch_summary_ready"
    | "context_formed"
    | "use_case_selected"
    | "pre_hierarchy_review"
    | "hierarchy_started";
  providerConfig: ProviderConfig;
  primaryDepartment?: string;
  useCaseSelection?: UseCaseSelection;
  structuredContext?: StructuredContext;
  createdAt: string;
  updatedAt?: string;
}

export interface IntakeSource {
  sourceId: string;
  sessionId: string;
  companyId: string;
  caseId: string;
  sourceVersion: number;
  lineageStatus: SourceLineageStatus;
  inputType: IntakeInputType;
  bucket: IntakeBucket;
  status: IntakeSourceStatus;
  displayName?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  websiteUrl?: string;
  noteText?: string;
  noteOrigin?: "typed_text" | "live_stt";
  attachmentScope?: AttachmentScope;
  aiSuggestedType?: string;
  aiSuggestedScope?: AttachmentScope;
  aiConfidence?: "high" | "medium" | "low";
  aiReason?: string;
  extractedText?: string;
  adminOverride?: {
    classification?: string;
    scope?: string;
    overriddenAt: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface WebsiteCrawlSession {
  crawlId: string;
  sessionId: string;
  sourceId: string;
  baseUrl: string;
  maxPages: number;
  status: CrawlSessionStatus;
  candidatePages: CrawlCandidatePage[];
  approvedPages?: string[];
  siteSummary?: WebsiteSummary;
  createdAt: string;
  updatedAt?: string;
}
