import type {
  StageCopilotCaseContextRef,
  StageCopilotContextDataAccessStrategy,
  StageCopilotPromptSpecRef,
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
  type StageCopilotPromptTestReferenceSummary,
} from "./context-envelope.js";
import {
  WDE_ANALYSIS_CORRECTNESS_RULES,
  WDE_GOOD_BAD_ANALYSIS_EXAMPLES,
  listWdeStageSystemKnowledgeEntries,
  summarizeWdeStageSystemKnowledgeForPromptStudio,
} from "./wde-stage-system-knowledge.js";

export const PROMPT_STUDIO_STATIC_CONTEXT_STAGE_KEY = "prompt_studio" as const;

export const PROMPT_STUDIO_STATIC_CONTEXT_BOUNDARY_STATUS: StageCopilotContextEnvelopeBoundaryStatus = Object.freeze({
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

const staticDataAccessStrategy: StageCopilotContextDataAccessStrategy = {
  strategyId: "prompt-studio-static-context-declarative-only",
  intendedContextModel: "db_only",
  allowedModes: ["scoped_record_reference_lookup"],
  executionMode: "declarative_only",
  notes: "Static Prompt Studio context fixture. It declares future scoped record references only and does not query repositories.",
};

const staticRetrievalScope: StageCopilotRetrievalScope = {
  scopeId: "prompt-studio-static-context-no-retrieval",
  allowedModes: ["direct_id_lookup"],
  allowedRecordFamilies: ["prompt_test_results"],
  citationRequired: false,
  auditRequired: true,
  executionMode: "declarative_only",
  notes: "Static fixture only. No retrieval, RAG, vector, keyword, or semantic lookup is executed.",
};

const scopeRefs: readonly StageCopilotContextScopeRef[] = Object.freeze([
  Object.freeze({
    scopeType: "stage",
    scopeId: PROMPT_STUDIO_STATIC_CONTEXT_STAGE_KEY,
    label: "Prompt Studio",
  }),
  Object.freeze({
    scopeType: "operator",
    scopeId: "static_fixture",
    label: "Static fixture context",
  }),
]);

const systemKnowledgeRefs: readonly StageCopilotSystemKnowledgeRef[] = Object.freeze([
  Object.freeze({
    refId: "taxonomy_ref:capability_vs_stage_copilot",
    refType: "stage_rule",
    label: "Two prompt systems remain separate.",
    sourceRef: "handoff/STAGE_COPILOT_READONLY_CONTEXT_ASSEMBLY_PLAN.md",
    notes: "Capability / Analysis PromptSpecs control official analysis. Stage Copilot Instructions control conversation style only.",
  }),
  Object.freeze({
    refId: "stage_copilot_instruction_ref:prompt_studio",
    refType: "stage_copilot_prompt",
    label: "Prompt Studio Copilot Instructions reference",
    sourceRef: "prompt_studio.copilot_system_prompt.default",
    notes: "Reference only. This fixture does not load, save, compile, or execute instructions.",
  }),
  Object.freeze({
    refId: "stage_copilot_instruction_ref:analysis_package",
    refType: "stage_copilot_prompt",
    label: "Analysis / Package Copilot Instructions reference",
    sourceRef: "analysis_package.copilot_system_prompt.default",
    notes: "Reference only. Included to demonstrate cross-stage instruction awareness without runtime behavior.",
  }),
  Object.freeze({
    refId: "warning_ref:copilot_instructions_do_not_change_analysis_prompts",
    refType: "stage_boundary",
    label: "Copilot Instructions do not change analysis prompts.",
    sourceRef: "handoff/STAGE_COPILOT_INSTRUCTIONS_ACCEPTED_FOUNDATION_ARCHIVE.md",
    notes: "Admins may edit Stage Copilot Instructions separately from Capability / Analysis PromptSpecs.",
  }),
  ...listWdeStageSystemKnowledgeEntries().map((entry) => Object.freeze({
    refId: `wde_stage_system_knowledge:${entry.key}`,
    refType: "stage_rule" as const,
    label: entry.label,
    sourceRef: entry.sourceRefs.join("; "),
    notes: `${entry.purpose} Must not: ${entry.mustNotDo.join("; ")}`,
  })),
  ...WDE_ANALYSIS_CORRECTNESS_RULES.map((rule) => Object.freeze({
    refId: `wde_analysis_correctness_rule:${rule.ruleId}`,
    refType: "stage_rule" as const,
    label: rule.label,
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: rule.guidance,
  })),
  ...WDE_GOOD_BAD_ANALYSIS_EXAMPLES.map((example) => Object.freeze({
    refId: `wde_analysis_example:${example.exampleId}`,
    refType: "proof_or_validation_logic" as const,
    label: example.label,
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: `${example.example} ${example.why}`,
  })),
]);

const caseContextRefs: readonly StageCopilotCaseContextRef[] = Object.freeze([
  Object.freeze({
    refId: "prompt_studio:prompt_test_results:static_ref",
    family: "prompt_test_results",
    linkedStage: PROMPT_STUDIO_STATIC_CONTEXT_STAGE_KEY,
    scope: "stage",
    recordType: "static_prompt_test_result_reference",
    notes: "Reference only. No live prompt tests are run by this fixture.",
  }),
]);

const promptSpecRefs: readonly StageCopilotPromptSpecRef[] = Object.freeze([
  Object.freeze({
    refId: "capability_prompt_ref:source_understanding",
    promptSpecKey: "source_understanding",
    kind: "capability",
    linkedStage: "sources_context",
    notes: "Static Capability / Analysis PromptSpec reference only; no live registry lookup.",
  }),
  Object.freeze({
    refId: "capability_prompt_ref:evidence_extraction",
    promptSpecKey: "evidence_extraction",
    kind: "capability",
    linkedStage: "participant_evidence",
    notes: "Static Capability / Analysis PromptSpec reference only; no compile or provider execution.",
  }),
  Object.freeze({
    refId: "capability_prompt_ref:synthesis",
    promptSpecKey: "synthesis",
    kind: "capability",
    linkedStage: "analysis_package",
    notes: "Static Capability / Analysis PromptSpec reference only; no official analysis execution.",
  }),
  Object.freeze({
    refId: "unknown_prompt_ref:future_prompt_studio_surface",
    promptSpecKey: "future.prompt_studio.unclassified",
    kind: "unknown_or_unclassified",
    linkedStage: PROMPT_STUDIO_STATIC_CONTEXT_STAGE_KEY,
    notes: "Unknown/unclassified prompt reference is represented as reference-only metadata.",
  }),
]);

const promptTestReferenceSummaries: readonly StageCopilotPromptTestReferenceSummary[] = Object.freeze([
  Object.freeze({
    refId: "prompt_test_ref:static_capability_preview",
    promptSpecKey: "source_understanding",
    label: "Static capability prompt preview reference",
    kind: "capability",
    status: "unknown",
    runtimeBehaviorChanged: false,
    notes: "Static reference only. No compiled prompt preview is generated here.",
  }),
  Object.freeze({
    refId: "prompt_test_ref:unknown_unclassified",
    promptSpecKey: "future.prompt_studio.unclassified",
    label: "Unknown/unclassified prompt reference",
    kind: "unknown_or_unclassified",
    status: "unknown",
    runtimeBehaviorChanged: false,
    notes: "Demonstrates safe representation of unclassified prompt refs.",
  }),
]);

const blockerWarningSummaries: readonly StageCopilotBlockerWarningSummary[] = Object.freeze([
  Object.freeze({
    refId: "warning_ref:copilot_instruction_edits_are_not_analysis_prompt_edits",
    severity: "warning",
    label: "Copilot Instructions are not analysis PromptSpecs.",
    reason: "Editing Stage Copilot Instructions changes conversation behavior only and does not change extraction, synthesis, evaluation, package drafting, or PromptSpec lifecycle.",
    advisoryOnly: true,
  }),
]);

const advisorySafeNotes: readonly StageCopilotAdvisorySafeNote[] = Object.freeze([
  Object.freeze({
    noteId: "prompt_studio_context_is_static_reference_only",
    label: "Static Prompt Studio context is reference-only.",
    body: "This context can explain prompt-system separation but cannot mutate PromptSpecs, run prompt tests, compile prompts, or change official analysis behavior.",
    advisoryOnly: true,
    doesNotMutateOfficialRecords: true,
    doesNotRerunOfficialAnalysis: true,
    doesNotChangeReadiness: true,
    doesNotChangePackageEligibility: true,
    doesNotGeneratePackageOutput: true,
  }),
  Object.freeze({
    noteId: "wde_stage_system_knowledge_is_static_context",
    label: "WDE Stage System Knowledge Pack is static read-only context.",
    body: summarizeWdeStageSystemKnowledgeForPromptStudio(),
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
    refId: "audit_ref:prompt_studio_static_fixture",
    sourceType: "proof_fixture",
    sourceRef: "packages/stage-copilot/src/prompt-studio-context.ts",
    notes: "Static fixture source. Does not resolve live prompt records.",
  }),
  Object.freeze({
    refId: "audit_ref:readonly_context_plan",
    sourceType: "operator_supplied_summary",
    sourceRef: "handoff/STAGE_COPILOT_READONLY_CONTEXT_ASSEMBLY_PLAN.md",
    notes: "Planning source for Prompt Studio as first read-only context pilot.",
  }),
  Object.freeze({
    refId: "audit_ref:wde_stage_system_knowledge_pack",
    sourceType: "proof_fixture",
    sourceRef: "packages/stage-copilot/src/wde-stage-system-knowledge.ts",
    notes: "Static WDE Pass 2-6 knowledge pack. Does not import or resolve live PromptSpecs.",
  }),
]);

export function createPromptStudioStaticContextFixture(
  overrides: Partial<StageCopilotContextEnvelopeInput> = {},
): StageCopilotContextEnvelopeInput {
  return {
    envelopeId: "prompt_studio_static_context_fixture",
    stageKey: PROMPT_STUDIO_STATIC_CONTEXT_STAGE_KEY,
    createdAt: "2026-04-29T00:00:00.000Z",
    scopeRefs,
    systemKnowledgeRefs,
    caseContextRefs,
    contextBundleRefs: [
      {
        refId: "prompt_studio:static_context_bundle",
        bundleKey: "prompt_studio.static_context_fixture",
        linkedStage: PROMPT_STUDIO_STATIC_CONTEXT_STAGE_KEY,
        scope: "stage",
        notes: "Static fixture bundle only. Not a live read model.",
      },
    ],
    dataAccessStrategy: staticDataAccessStrategy,
    retrievalScope: staticRetrievalScope,
    evidenceSourceRefs: [],
    promptSpecRefs,
    promptTestReferenceSummaries,
    blockerWarningSummaries,
    advisorySafeNotes,
    auditSourceRefs,
    boundaryStatus: PROMPT_STUDIO_STATIC_CONTEXT_BOUNDARY_STATUS,
    notes: "Static Prompt Studio Copilot context fixture for read-only envelope proof.",
    ...overrides,
  };
}

export function createPromptStudioCopilotContextEnvelope(
  overrides: Partial<StageCopilotContextEnvelopeInput> = {},
): StageCopilotContextEnvelope {
  return createStageCopilotContextEnvelope(createPromptStudioStaticContextFixture(overrides));
}

export function summarizePromptStudioCopilotContext(
  envelope: StageCopilotContextEnvelope = createPromptStudioCopilotContextEnvelope(),
): StageCopilotContextEnvelopeSummary {
  return summarizeStageCopilotContextEnvelope(envelope);
}
