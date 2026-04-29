import type {
  StageCopilotCaseContextRef,
  StageCopilotContextDataAccessStrategy,
  StageCopilotRetrievalScope,
  StageCopilotSystemKnowledgeRef,
} from "@workflow/contracts";
import {
  createStageCopilotContextEnvelope,
  summarizeStageCopilotContextEnvelope,
  type StageCopilotAdvisorySafeNote,
  type StageCopilotBlockerWarningSummary,
  type StageCopilotContextAuditSourceRef,
  type StageCopilotContextEnvelope,
  type StageCopilotContextEnvelopeBoundaryStatus,
  type StageCopilotContextEnvelopeInput,
  type StageCopilotContextEnvelopeSummary,
  type StageCopilotContextScopeRef,
} from "./context-envelope.js";
import {
  getWdeStageSystemKnowledgeEntry,
  WDE_ANALYSIS_CORRECTNESS_RULES,
} from "./wde-stage-system-knowledge.js";

export const SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY = "sources_context" as const;

export const SOURCES_CONTEXT_STATIC_CONTEXT_BOUNDARY_STATUS: StageCopilotContextEnvelopeBoundaryStatus = Object.freeze({
  readOnly: true,
  writesAllowed: false,
  providerExecutionAllowed: false,
  retrievalExecutionAllowed: false,
  databaseExecutionAllowed: false,
  promptCompilationAllowed: false,
  promptMutationAllowed: false,
  officialAnalysisRerunAllowed: false,
  packageEligibilityMutationAllowed: false,
  sourceOfTruthMutationAllowed: false,
  unrestrictedRawEvidenceExecutionAllowed: false,
});

const pass2KnowledgeEntry = getWdeStageSystemKnowledgeEntry("pass2_sources_context");
if (!pass2KnowledgeEntry) {
  throw new Error("Pass 2 Sources / Context stage-system knowledge is unavailable.");
}
const pass2Knowledge = pass2KnowledgeEntry;

const staticDataAccessStrategy: StageCopilotContextDataAccessStrategy = {
  strategyId: "sources-context-static-context-declarative-only",
  intendedContextModel: "db_only",
  allowedModes: ["scoped_record_reference_lookup"],
  executionMode: "declarative_only",
  notes: "Static Sources / Context Copilot context fixture. It declares future read-only refs only and does not query source repositories.",
};

const staticRetrievalScope: StageCopilotRetrievalScope = {
  scopeId: "sources-context-static-context-no-retrieval",
  allowedModes: ["direct_id_lookup"],
  allowedRecordFamilies: ["sources", "extraction_jobs", "source_role_scope_suggestions", "provider_jobs"],
  citationRequired: false,
  auditRequired: true,
  executionMode: "declarative_only",
  notes: "Static fixture only. No retrieval, RAG, vector, keyword, crawl, OCR, STT, provider extraction, or semantic lookup is executed.",
};

const scopeRefs: readonly StageCopilotContextScopeRef[] = Object.freeze([
  Object.freeze({
    scopeType: "stage",
    scopeId: SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY,
    label: "Pass 2 / Sources & Context",
  }),
  Object.freeze({
    scopeType: "operator",
    scopeId: "static_fixture",
    label: "Static fixture context",
  }),
]);

const systemKnowledgeRefs: readonly StageCopilotSystemKnowledgeRef[] = Object.freeze([
  Object.freeze({
    refId: "wde_stage_system_knowledge:pass2_sources_context",
    refType: "stage_rule",
    label: pass2Knowledge.label,
    sourceRef: pass2Knowledge.sourceRefs.join("; "),
    notes: `${pass2Knowledge.purpose} Goal: ${pass2Knowledge.goal}`,
  }),
  Object.freeze({
    refId: "sources_context_capability_ref:source_registration",
    refType: "stage_rule",
    label: "Source registration is an official Pass 2 capability, not a Copilot action.",
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: "The Copilot may explain source registration concepts but cannot register, update, delete, or approve source records.",
  }),
  Object.freeze({
    refId: "sources_context_capability_ref:ocr_stt_crawl_provider_jobs",
    refType: "stage_rule",
    label: "OCR, STT, crawl, and provider extraction are internal system capabilities only.",
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: "The Copilot may describe these capabilities and their boundaries but cannot run them or approve their plans/results.",
  }),
  Object.freeze({
    refId: "sources_context_capability_ref:source_role_scope_suggestions",
    refType: "stage_rule",
    label: "Source-role/source-scope suggestions are official capability outputs, not Copilot actions.",
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: "The Copilot may discuss how to interpret suggestions but cannot generate or save new official suggestions.",
  }),
  Object.freeze({
    refId: "sources_context_boundary_ref:source_claims_are_signals",
    refType: "stage_boundary",
    label: "Source claims are signals, not workflow truth.",
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: "Documents, websites, transcripts, extracted text, and admin notes can support context, but they do not prove actual operating reality by themselves.",
  }),
  ...WDE_ANALYSIS_CORRECTNESS_RULES
    .filter((rule) => [
      "document_claims_are_signals",
      "hierarchy_is_structural",
      "targeting_is_planning",
    ].includes(rule.ruleId))
    .map((rule) => Object.freeze({
      refId: `sources_context_correctness_rule:${rule.ruleId}`,
      refType: "stage_rule" as const,
      label: rule.label,
      sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
      notes: rule.guidance,
    })),
]);

const caseContextRefs: readonly StageCopilotCaseContextRef[] = Object.freeze([
  Object.freeze({
    refId: "sources_context:source_registration:static_ref",
    family: "sources",
    linkedStage: SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY,
    scope: "stage",
    recordType: "static_source_registration_reference",
    notes: "Reference only. No source record is read, registered, updated, or deleted by this fixture.",
  }),
  Object.freeze({
    refId: "sources_context:structured_context:static_ref",
    family: "sources",
    linkedStage: SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY,
    scope: "stage",
    recordType: "static_structured_context_reference",
    notes: "Reference only. No structured context record is created or confirmed by this fixture.",
  }),
  Object.freeze({
    refId: "sources_context:pre_hierarchy_review:static_ref",
    family: "sources",
    linkedStage: SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY,
    scope: "stage",
    recordType: "static_final_pre_hierarchy_review_reference",
    notes: "Reference only. No final pre-hierarchy review is confirmed by this fixture.",
  }),
]);

const blockerWarningSummaries: readonly StageCopilotBlockerWarningSummary[] = Object.freeze([
  Object.freeze({
    refId: "warning_ref:sources_context_copilot_is_advisory_only",
    severity: "warning",
    label: "Sources / Context Copilot is advisory only.",
    reason: "The Copilot can explain source/context boundaries but cannot register sources, run source processing, create structured context, confirm review, or start later workflow passes.",
    advisoryOnly: true,
  }),
  Object.freeze({
    refId: "warning_ref:source_claims_do_not_prove_workflow_truth",
    severity: "warning",
    label: "Source claims are not workflow truth.",
    reason: "Pass 2 context material can frame later analysis, but actual workflow truth requires governed downstream evidence and synthesis.",
    advisoryOnly: true,
  }),
]);

const advisorySafeNotes: readonly StageCopilotAdvisorySafeNote[] = Object.freeze([
  Object.freeze({
    noteId: "sources_context_static_fixture_is_reference_only",
    label: "Static Sources / Context context is reference-only.",
    body: "This context can explain source registration, source type/status/trust, document/image/audio/manual/website handling, OCR/STT/crawl/provider job boundaries, source-role/source-scope suggestions, structured context, department framing, final pre-hierarchy review, and handoff to hierarchy. It cannot execute any of those capabilities.",
    advisoryOnly: true,
    doesNotMutateOfficialRecords: true,
    doesNotRerunOfficialAnalysis: true,
    doesNotChangeReadiness: true,
    doesNotChangePackageEligibility: true,
    doesNotGeneratePackageOutput: true,
  }),
]);

const auditSourceRefs: readonly StageCopilotContextAuditSourceRef[] = Object.freeze([
  Object.freeze({
    refId: "audit_ref:sources_context_static_fixture",
    sourceType: "proof_fixture",
    sourceRef: "packages/stage-copilot/src/sources-context-context.ts",
    notes: "Static fixture source. Does not query source repositories or execute Pass 2 capabilities.",
  }),
  Object.freeze({
    refId: "audit_ref:wde_pass2_stage_system_knowledge",
    sourceType: "proof_fixture",
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: "Static Pass 2 Sources / Context operational knowledge.",
  }),
]);

export function createSourcesContextStaticContextFixture(
  overrides: Partial<StageCopilotContextEnvelopeInput> = {},
): StageCopilotContextEnvelopeInput {
  return {
    envelopeId: "sources_context_static_context_fixture",
    stageKey: SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY,
    createdAt: "2026-04-29T00:00:00.000Z",
    scopeRefs,
    systemKnowledgeRefs,
    caseContextRefs,
    contextBundleRefs: [
      {
        refId: "sources_context:static_context_bundle",
        bundleKey: "sources_context.static_context_fixture",
        linkedStage: SOURCES_CONTEXT_STATIC_CONTEXT_STAGE_KEY,
        scope: "stage",
        notes: "Static fixture bundle only. Not a live source/context read model.",
      },
    ],
    dataAccessStrategy: staticDataAccessStrategy,
    retrievalScope: staticRetrievalScope,
    evidenceSourceRefs: [],
    promptSpecRefs: [],
    promptTestReferenceSummaries: [],
    blockerWarningSummaries,
    advisorySafeNotes,
    auditSourceRefs,
    boundaryStatus: SOURCES_CONTEXT_STATIC_CONTEXT_BOUNDARY_STATUS,
    notes: "Static Sources / Context Copilot context fixture for read-only API proof.",
    ...overrides,
  };
}

export function createSourcesContextCopilotContextEnvelope(
  overrides: Partial<StageCopilotContextEnvelopeInput> = {},
): StageCopilotContextEnvelope {
  return createStageCopilotContextEnvelope(createSourcesContextStaticContextFixture(overrides));
}

export function summarizeSourcesContextCopilotContext(
  envelope: StageCopilotContextEnvelope = createSourcesContextCopilotContextEnvelope(),
): StageCopilotContextEnvelopeSummary {
  return summarizeStageCopilotContextEnvelope(envelope);
}
