/**
 * Pass 2A — Company Intake / Candidate Framing contracts.
 *
 * These records support pre-case company material intake and operator-governed
 * candidate framing only. They do not represent workflow truth, participant
 * evidence, automation opportunity, synthesis/evaluation, or package readiness.
 */

export type AnalysisScopeType =
  | "single_function"
  | "multi_function"
  | "company_workflow_scope";

export interface AnalysisScope {
  scopeType: AnalysisScopeType;
  scopeLabel: string;
  primaryFunctionalAnchor: string;
  participatingFunctions: string[];
  excludedAdjacentScopes: string[];
  scopeBoundary: {
    start: string;
    end: string;
  };
  crossFunctionalScope?: string[];
  boundaryRationale?: string;
  knownAdjacentCandidateIds?: string[];
}

export type FramingRunStatus =
  | "draft"
  | "processing"
  | "sources_processed"
  | "candidates_ready"
  | "completed"
  | "failed";

export interface FramingRun {
  framingRunId: string;
  companyId: string;
  status: FramingRunStatus;
  sourceIds: string[];
  createdAt: string;
  updatedAt: string;
  title?: string;
  operatorGoal?: string;
  failureReason?: string;
  notes?: string;
}

export type FramingSourceInputType =
  | "document"
  | "website_url"
  | "manual_note"
  | "image"
  | "audio";

export type FramingSourceStatus =
  | "uploaded"
  | "processing"
  | "processed"
  | "needs_review"
  | "failed"
  | "superseded";

export interface FramingSource {
  framingSourceId: string;
  companyId: string;
  inputType: FramingSourceInputType;
  status: FramingSourceStatus;
  sourceVersion: number;
  createdAt: string;
  updatedAt: string;
  framingRunIds?: string[];
  displayName?: string;
  fileName?: string;
  mimeType?: string;
  websiteUrl?: string;
  noteText?: string;
  operatorInputId?: string;
  extractedTextRef?: string;
  processingJobRefs?: string[];
  failureReason?: string;
}

export type FramingCandidateRecommendation =
  | "promote"
  | "defer"
  | "merge"
  | "split"
  | "reject";

export type FramingCandidateStatus =
  | "draft"
  | "ready_for_review"
  | "selected"
  | "promoted"
  | "dormant"
  | "merged"
  | "rejected";

export interface FramingCandidateScoreSummary {
  boundaryClarity?: number;
  sourceSupport?: number;
  businessRelevance?: number;
  workflowSeparability?: number;
  roleFunctionVisibility?: number;
  ambiguityRisk?: number;
  suitabilityAsFirstCase?: number;
}

export interface FramingCandidate {
  candidateId: string;
  companyId: string;
  framingRunId: string;
  candidateName: string;
  analysisScope: AnalysisScope;
  sourceBasisIds: string[];
  rationale: string;
  risks: string[];
  recommendation: FramingCandidateRecommendation;
  status: FramingCandidateStatus;
  scoreSummary?: FramingCandidateScoreSummary;
  /** Must state that scores are operator decision support only, not workflow truth. */
  scoreMeaning?: string;
  operatorNotes?: string;
  relatedCandidateIds?: string[];
  splitMergeNotes?: string;
  unknowns?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type CaseEntryPacketSource =
  | "known_use_case"
  | "framing_candidate";

export interface CaseEntryPacket {
  packetId: string;
  companyId: string;
  source: CaseEntryPacketSource;
  proposedDomain: string;
  proposedMainDepartment: string;
  proposedUseCaseLabel: string;
  analysisScope: AnalysisScope;
  includedFramingSourceIds: string[];
  createdAt: string;
  framingRunId?: string;
  candidateId?: string;
  contextOnlyFramingSourceIds?: string[];
  excludedFramingSourceIds?: string[];
  assumptions?: string[];
  unknowns?: string[];
  adjacentWorkflowCandidateIds?: string[];
  createdCaseId?: string;
  promotedBy?: string;
  promotedAt?: string;
}

export type SourceToCaseLinkUse =
  | "included_context"
  | "context_only"
  | "derived_case_source";

export interface SourceToCaseLink {
  linkId: string;
  companyId: string;
  framingSourceId: string;
  caseId: string;
  use: SourceToCaseLinkUse;
  createdAt: string;
  packetId?: string;
  derivedIntakeSourceId?: string;
  linkRationale?: string;
}

export type OperatorFramingInputType =
  | "operator_note"
  | "operator_answer"
  | "operator_correction"
  | "operator_instruction";

export interface OperatorFramingInput {
  inputId: string;
  companyId: string;
  framingRunId: string;
  inputType: OperatorFramingInputType;
  text: string;
  createdBy: string;
  createdAt: string;
  linkedCandidateId?: string;
  linkedFramingSourceId?: string;
  supersedesInputId?: string;
}
