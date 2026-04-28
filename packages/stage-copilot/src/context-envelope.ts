import type {
  StageCopilotCaseContextRef,
  StageCopilotContextBundleRef,
  StageCopilotContextDataAccessStrategy,
  StageCopilotEvidenceAccessPolicy,
  StageCopilotPromptSpecRef,
  StageCopilotRetrievalScope,
  StageCopilotStageKey,
  StageCopilotSystemKnowledgeRef,
} from "@workflow/contracts";

export type StageCopilotContextEnvelopeViolationCode =
  | "write_authority_not_allowed"
  | "provider_execution_not_allowed"
  | "retrieval_execution_not_allowed"
  | "database_execution_not_allowed"
  | "prompt_compilation_not_allowed"
  | "prompt_mutation_not_allowed"
  | "official_analysis_rerun_not_allowed"
  | "package_eligibility_mutation_not_allowed"
  | "source_of_truth_mutation_not_allowed"
  | "unrestricted_raw_evidence_execution_not_allowed"
  | "executable_content_not_allowed";

export interface StageCopilotContextEnvelopeCheck {
  ok: boolean;
  violations: StageCopilotContextEnvelopeViolationCode[];
}

export interface StageCopilotContextScopeRef {
  scopeType: "company" | "case" | "stage" | "session" | "participant" | "selected_records" | "operator";
  scopeId: string;
  label?: string;
}

export interface StageCopilotEvidenceSourceRef {
  refId: string;
  refType:
    | "source"
    | "uploaded_document"
    | "transcript"
    | "participant_answer"
    | "clarification_answer"
    | "raw_evidence"
    | "evidence_anchor"
    | "synthesis_output"
    | "evaluation_output"
    | "package_output"
    | "prompt_test_result";
  linkedStage: StageCopilotStageKey;
  sourceId?: string;
  evidenceAnchorId?: string;
  summary?: string;
  access: "reference_only" | "summary_only" | "anchored_restricted";
  notes?: string;
}

export interface StageCopilotPromptTestReferenceSummary {
  refId: string;
  promptSpecKey: string;
  label: string;
  kind: "capability" | "stage_copilot" | "legacy_copilot_like" | "unknown_or_unclassified";
  status?: "draft" | "active" | "previous" | "archived" | "unknown";
  testResultRef?: string;
  runtimeBehaviorChanged: false;
  notes?: string;
}

export interface StageCopilotBlockerWarningSummary {
  refId: string;
  severity: "blocker" | "warning" | "info";
  label: string;
  reason: string;
  sourceRef?: string;
  advisoryOnly: true;
}

export interface StageCopilotAdvisorySafeNote {
  noteId: string;
  label: string;
  body: string;
  advisoryOnly: true;
  doesNotMutateOfficialRecords: true;
  doesNotRerunOfficialAnalysis: true;
  doesNotChangeReadiness: true;
  doesNotChangePackageEligibility: true;
  doesNotGeneratePackageOutput: true;
}

export interface StageCopilotContextAuditSourceRef {
  refId: string;
  sourceType:
    | "stage_profile"
    | "system_knowledge_ref"
    | "case_context_ref"
    | "stage_read_model"
    | "evidence_anchor"
    | "prompt_ref"
    | "proof_fixture"
    | "operator_supplied_summary";
  sourceRef: string;
  notes?: string;
}

export interface StageCopilotContextEnvelopeBoundaryStatus {
  readOnly: true;
  writesAllowed: false;
  providerExecutionAllowed: false;
  retrievalExecutionAllowed: false;
  databaseExecutionAllowed: false;
  promptCompilationAllowed: false;
  promptMutationAllowed: false;
  officialAnalysisRerunAllowed: false;
  packageEligibilityMutationAllowed: false;
  sourceOfTruthMutationAllowed: false;
  unrestrictedRawEvidenceExecutionAllowed: false;
}

export interface StageCopilotContextEnvelopeInput {
  envelopeId: string;
  stageKey: StageCopilotStageKey;
  createdAt: string;
  scopeRefs: readonly StageCopilotContextScopeRef[];
  systemKnowledgeRefs?: readonly StageCopilotSystemKnowledgeRef[];
  caseContextRefs?: readonly StageCopilotCaseContextRef[];
  contextBundleRefs?: readonly StageCopilotContextBundleRef[];
  dataAccessStrategy: StageCopilotContextDataAccessStrategy;
  retrievalScope: StageCopilotRetrievalScope;
  evidenceSourceRefs?: readonly StageCopilotEvidenceSourceRef[];
  promptSpecRefs?: readonly StageCopilotPromptSpecRef[];
  promptTestReferenceSummaries?: readonly StageCopilotPromptTestReferenceSummary[];
  blockerWarningSummaries?: readonly StageCopilotBlockerWarningSummary[];
  advisorySafeNotes?: readonly StageCopilotAdvisorySafeNote[];
  auditSourceRefs?: readonly StageCopilotContextAuditSourceRef[];
  evidenceAccessPolicy?: StageCopilotEvidenceAccessPolicy;
  boundaryStatus: StageCopilotContextEnvelopeBoundaryStatus;
  notes?: string;
}

export interface StageCopilotContextEnvelope extends StageCopilotContextEnvelopeInput {
  scopeRefs: readonly StageCopilotContextScopeRef[];
  systemKnowledgeRefs: readonly StageCopilotSystemKnowledgeRef[];
  caseContextRefs: readonly StageCopilotCaseContextRef[];
  contextBundleRefs: readonly StageCopilotContextBundleRef[];
  evidenceSourceRefs: readonly StageCopilotEvidenceSourceRef[];
  promptSpecRefs: readonly StageCopilotPromptSpecRef[];
  promptTestReferenceSummaries: readonly StageCopilotPromptTestReferenceSummary[];
  blockerWarningSummaries: readonly StageCopilotBlockerWarningSummary[];
  advisorySafeNotes: readonly StageCopilotAdvisorySafeNote[];
  auditSourceRefs: readonly StageCopilotContextAuditSourceRef[];
}

export interface StageCopilotContextEnvelopeSummary {
  envelopeId: string;
  stageKey: StageCopilotStageKey;
  scopeRefCount: number;
  systemKnowledgeRefCount: number;
  caseContextRefCount: number;
  contextBundleRefCount: number;
  evidenceSourceRefCount: number;
  promptSpecRefCount: number;
  promptTestReferenceCount: number;
  blockerCount: number;
  warningCount: number;
  advisoryNoteCount: number;
  auditSourceRefCount: number;
  dataAccessExecutionMode: "declarative_only";
  retrievalExecutionMode: "declarative_only";
  readOnly: true;
}

function uniqueViolations(
  violations: StageCopilotContextEnvelopeViolationCode[],
): StageCopilotContextEnvelopeCheck {
  return {
    ok: violations.length === 0,
    violations: [...new Set(violations)],
  };
}

function cloneReadonlyArray<T>(items: readonly T[] | undefined): readonly T[] {
  return Object.freeze([...(items ?? [])]);
}

function hasExecutableContent(value: unknown, seen = new WeakSet<object>()): boolean {
  if (typeof value === "function") return true;
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);

  if (Array.isArray(value)) {
    return value.some((item) => hasExecutableContent(item, seen));
  }

  return Object.values(value).some((item) => hasExecutableContent(item, seen));
}

export function assertStageCopilotContextEnvelopeReadOnly(
  envelope: StageCopilotContextEnvelopeInput,
): StageCopilotContextEnvelopeCheck {
  const violations: StageCopilotContextEnvelopeViolationCode[] = [];
  const boundary = envelope.boundaryStatus;

  if (boundary.readOnly !== true || boundary.writesAllowed !== false) {
    violations.push("write_authority_not_allowed");
  }
  if (boundary.providerExecutionAllowed !== false) violations.push("provider_execution_not_allowed");
  if (boundary.retrievalExecutionAllowed !== false) violations.push("retrieval_execution_not_allowed");
  if (boundary.databaseExecutionAllowed !== false) violations.push("database_execution_not_allowed");
  if (boundary.promptCompilationAllowed !== false) violations.push("prompt_compilation_not_allowed");
  if (boundary.promptMutationAllowed !== false) violations.push("prompt_mutation_not_allowed");
  if (boundary.officialAnalysisRerunAllowed !== false) violations.push("official_analysis_rerun_not_allowed");
  if (boundary.packageEligibilityMutationAllowed !== false) {
    violations.push("package_eligibility_mutation_not_allowed");
  }
  if (boundary.sourceOfTruthMutationAllowed !== false) violations.push("source_of_truth_mutation_not_allowed");
  if (boundary.unrestrictedRawEvidenceExecutionAllowed !== false) {
    violations.push("unrestricted_raw_evidence_execution_not_allowed");
  }

  if (envelope.dataAccessStrategy.executionMode !== "declarative_only") {
    violations.push("database_execution_not_allowed");
  }
  if (envelope.retrievalScope.executionMode !== "declarative_only") {
    violations.push("retrieval_execution_not_allowed");
  }
  if (
    envelope.evidenceAccessPolicy?.accessLevel === "admin_approved_raw_evidence" &&
    boundary.unrestrictedRawEvidenceExecutionAllowed !== false
  ) {
    violations.push("unrestricted_raw_evidence_execution_not_allowed");
  }
  if (hasExecutableContent(envelope)) violations.push("executable_content_not_allowed");

  return uniqueViolations(violations);
}

export function createStageCopilotContextEnvelope(
  input: StageCopilotContextEnvelopeInput,
): StageCopilotContextEnvelope {
  const check = assertStageCopilotContextEnvelopeReadOnly(input);
  if (!check.ok) {
    throw new Error(`Unsafe Stage Copilot context envelope: ${check.violations.join(", ")}`);
  }

  return Object.freeze({
    ...input,
    scopeRefs: cloneReadonlyArray(input.scopeRefs),
    systemKnowledgeRefs: cloneReadonlyArray(input.systemKnowledgeRefs),
    caseContextRefs: cloneReadonlyArray(input.caseContextRefs),
    contextBundleRefs: cloneReadonlyArray(input.contextBundleRefs),
    evidenceSourceRefs: cloneReadonlyArray(input.evidenceSourceRefs),
    promptSpecRefs: cloneReadonlyArray(input.promptSpecRefs),
    promptTestReferenceSummaries: cloneReadonlyArray(input.promptTestReferenceSummaries),
    blockerWarningSummaries: cloneReadonlyArray(input.blockerWarningSummaries),
    advisorySafeNotes: cloneReadonlyArray(input.advisorySafeNotes),
    auditSourceRefs: cloneReadonlyArray(input.auditSourceRefs),
  });
}

export function isStageCopilotContextEnvelopeSafe(
  envelope: StageCopilotContextEnvelopeInput,
): boolean {
  return assertStageCopilotContextEnvelopeReadOnly(envelope).ok;
}

export function summarizeStageCopilotContextEnvelope(
  envelope: StageCopilotContextEnvelope,
): StageCopilotContextEnvelopeSummary {
  return {
    envelopeId: envelope.envelopeId,
    stageKey: envelope.stageKey,
    scopeRefCount: envelope.scopeRefs.length,
    systemKnowledgeRefCount: envelope.systemKnowledgeRefs.length,
    caseContextRefCount: envelope.caseContextRefs.length,
    contextBundleRefCount: envelope.contextBundleRefs.length,
    evidenceSourceRefCount: envelope.evidenceSourceRefs.length,
    promptSpecRefCount: envelope.promptSpecRefs.length,
    promptTestReferenceCount: envelope.promptTestReferenceSummaries.length,
    blockerCount: envelope.blockerWarningSummaries.filter((item) => item.severity === "blocker").length,
    warningCount: envelope.blockerWarningSummaries.filter((item) => item.severity === "warning").length,
    advisoryNoteCount: envelope.advisorySafeNotes.length,
    auditSourceRefCount: envelope.auditSourceRefs.length,
    dataAccessExecutionMode: envelope.dataAccessStrategy.executionMode,
    retrievalExecutionMode: envelope.retrievalScope.executionMode,
    readOnly: true,
  };
}
