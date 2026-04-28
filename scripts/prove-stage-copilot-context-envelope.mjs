import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  assertStageCopilotContextEnvelopeReadOnly,
  createStageCopilotContextEnvelope,
  isStageCopilotContextEnvelopeSafe,
  summarizeStageCopilotContextEnvelope,
} from "../packages/stage-copilot/dist/index.js";

const readonlyBoundaryStatus = Object.freeze({
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

const declarativeDataAccessStrategy = Object.freeze({
  strategyId: "proof-db-anchor-declarative",
  intendedContextModel: "hybrid_db_retrieval",
  allowedModes: ["database_repository_lookup", "evidence_anchor_lookup", "hybrid_database_retrieval_lookup"],
  executionMode: "declarative_only",
  notes: "Declaration only. This proof does not query a database or retrieval index.",
});

const declarativeRetrievalScope = Object.freeze({
  scopeId: "proof-anchor-retrieval-declarative",
  allowedModes: ["direct_id_lookup", "evidence_anchor_lookup", "hybrid_exact_anchor_keyword_lookup"],
  allowedRecordFamilies: ["sources", "prompt_test_results"],
  citationRequired: true,
  auditRequired: true,
  executionMode: "declarative_only",
  notes: "Declaration only. This proof does not execute retrieval.",
});

const summaryOnlyEvidencePolicy = Object.freeze({
  policyId: "proof-summary-only-evidence",
  accessLevel: "summary_only",
  rawEvidenceRequiresAdminScope: true,
  citationRequiredForEvidence: true,
  restrictedEvidenceCategories: ["participant_raw_transcript"],
});

function makePromptStudioEnvelope(overrides = {}) {
  return {
    envelopeId: "prompt-studio-envelope-proof",
    stageKey: "prompt_studio",
    createdAt: "2026-04-28T00:00:00.000Z",
    scopeRefs: [
      { scopeType: "case", scopeId: "case-proof", label: "Proof case" },
      { scopeType: "stage", scopeId: "prompt_studio", label: "Prompt Studio" },
    ],
    systemKnowledgeRefs: [
      {
        refId: "prompt-taxonomy-boundary",
        refType: "stage_rule",
        label: "Prompt taxonomy is read-only in this envelope.",
        sourceRef: "handoff/STAGE_COPILOT_READONLY_CONTEXT_ASSEMBLY_PLAN.md",
      },
    ],
    caseContextRefs: [
      {
        refId: "prompt-test-results-ref",
        family: "prompt_test_results",
        linkedStage: "prompt_studio",
        scope: "selected_records",
        recordType: "prompt_test_result_summary",
      },
    ],
    contextBundleRefs: [
      {
        refId: "prompt-studio-static-context",
        bundleKey: "prompt_studio.static_readonly_context",
        linkedStage: "prompt_studio",
        scope: "stage",
      },
    ],
    dataAccessStrategy: declarativeDataAccessStrategy,
    retrievalScope: declarativeRetrievalScope,
    evidenceSourceRefs: [],
    promptSpecRefs: [
      {
        refId: "unknown-prompt-proof-ref",
        promptSpecKey: "future.unclassified.prompt",
        kind: "unknown_or_unclassified",
        linkedStage: "prompt_studio",
        notes: "Reference only; does not imply runtime behavior.",
      },
    ],
    promptTestReferenceSummaries: [
      {
        refId: "prompt-test-summary-ref",
        promptSpecKey: "future.unclassified.prompt",
        label: "Future unclassified prompt",
        kind: "unknown_or_unclassified",
        status: "unknown",
        runtimeBehaviorChanged: false,
      },
    ],
    blockerWarningSummaries: [
      {
        refId: "prompt-taxonomy-warning",
        severity: "warning",
        label: "Legacy prompt is not migrated",
        reason: "Display should not imply runtime migration.",
        advisoryOnly: true,
      },
    ],
    advisorySafeNotes: [
      {
        noteId: "prompt-change-note",
        label: "Prompt discussion is advisory",
        body: "The envelope can discuss what a prompt change might affect, but cannot mutate PromptSpecs.",
        advisoryOnly: true,
        doesNotMutateOfficialRecords: true,
        doesNotRerunOfficialAnalysis: true,
        doesNotChangeReadiness: true,
        doesNotChangePackageEligibility: true,
        doesNotGeneratePackageOutput: true,
      },
    ],
    auditSourceRefs: [
      {
        refId: "proof-fixture-audit",
        sourceType: "proof_fixture",
        sourceRef: "scripts/prove-stage-copilot-context-envelope.mjs",
      },
    ],
    evidenceAccessPolicy: summaryOnlyEvidencePolicy,
    boundaryStatus: readonlyBoundaryStatus,
    notes: "Static/read-only Prompt Studio context envelope proof.",
    ...overrides,
  };
}

function makeSourcesEnvelope(overrides = {}) {
  return {
    ...makePromptStudioEnvelope({
      envelopeId: "sources-context-envelope-proof",
      stageKey: "sources_context",
      scopeRefs: [
        { scopeType: "case", scopeId: "case-proof", label: "Proof case" },
        { scopeType: "stage", scopeId: "sources_context", label: "Sources / Context" },
      ],
      caseContextRefs: [
        {
          refId: "source-ref-context",
          family: "sources",
          linkedStage: "sources_context",
          scope: "selected_records",
          recordType: "source_reference",
        },
      ],
      contextBundleRefs: [
        {
          refId: "sources-static-context",
          bundleKey: "sources_context.static_readonly_context",
          linkedStage: "sources_context",
          scope: "stage",
        },
      ],
      evidenceSourceRefs: [
        {
          refId: "source-ref-only",
          refType: "source",
          linkedStage: "sources_context",
          sourceId: "source-proof-001",
          summary: "Reference-only source summary; no source text was fetched.",
          access: "reference_only",
        },
      ],
      promptSpecRefs: [],
      promptTestReferenceSummaries: [],
      blockerWarningSummaries: [],
      advisorySafeNotes: [
        {
          noteId: "source-context-note",
          label: "Source context is reference-only",
          body: "The envelope can discuss source refs and summaries, but cannot fetch source text.",
          advisoryOnly: true,
          doesNotMutateOfficialRecords: true,
          doesNotRerunOfficialAnalysis: true,
          doesNotChangeReadiness: true,
          doesNotChangePackageEligibility: true,
          doesNotGeneratePackageOutput: true,
        },
      ],
      notes: "Sources / Context envelope uses source refs only.",
    }),
    ...overrides,
  };
}

function assertOk(result, label) {
  assert.equal(result.ok, true, `${label} should pass`);
  assert.deepEqual(result.violations, [], `${label} should not report violations`);
}

function assertRejected(input, code, label) {
  const result = assertStageCopilotContextEnvelopeReadOnly(input);
  assert.equal(result.ok, false, `${label} should be rejected`);
  assert.ok(result.violations.includes(code), `${label} should include ${code}; got ${result.violations.join(",")}`);
  assert.throws(() => createStageCopilotContextEnvelope(input), /Unsafe Stage Copilot context envelope/);
}

function withBoundaryOverride(base, boundaryOverride) {
  return {
    ...base,
    boundaryStatus: {
      ...base.boundaryStatus,
      ...boundaryOverride,
    },
  };
}

// Valid/safe cases.
const promptStudioInput = makePromptStudioEnvelope();
assertOk(assertStageCopilotContextEnvelopeReadOnly(promptStudioInput), "Prompt Studio static/read-only envelope");
const promptStudioEnvelope = createStageCopilotContextEnvelope(promptStudioInput);
assert.equal(promptStudioEnvelope.stageKey, "prompt_studio");
assert.equal(Object.isFrozen(promptStudioEnvelope), true);
assert.equal(Object.isFrozen(promptStudioEnvelope.scopeRefs), true);

const sourcesEnvelope = createStageCopilotContextEnvelope(makeSourcesEnvelope());
assert.equal(sourcesEnvelope.stageKey, "sources_context");
assert.equal(sourcesEnvelope.evidenceSourceRefs[0].access, "reference_only");

const hybridEnvelope = createStageCopilotContextEnvelope(makeSourcesEnvelope({
  envelopeId: "hybrid-data-access-envelope-proof",
  dataAccessStrategy: {
    ...declarativeDataAccessStrategy,
    intendedContextModel: "hybrid_db_retrieval",
    allowedModes: ["database_repository_lookup", "scoped_record_reference_lookup", "evidence_anchor_lookup"],
    executionMode: "declarative_only",
  },
  retrievalScope: {
    ...declarativeRetrievalScope,
    allowedModes: ["direct_id_lookup", "evidence_anchor_lookup"],
    executionMode: "declarative_only",
  },
}));
assert.equal(hybridEnvelope.dataAccessStrategy.executionMode, "declarative_only");
assert.equal(hybridEnvelope.retrievalScope.executionMode, "declarative_only");

const beforeSummaryInput = JSON.stringify(promptStudioEnvelope);
const summary = summarizeStageCopilotContextEnvelope(promptStudioEnvelope);
const afterSummaryInput = JSON.stringify(promptStudioEnvelope);
assert.equal(afterSummaryInput, beforeSummaryInput, "summary generation must not mutate envelope input");
assert.equal(summary.stageKey, "prompt_studio");
assert.equal(summary.readOnly, true);
assert.equal(summary.promptSpecRefCount, 1);
assert.equal(summary.promptTestReferenceCount, 1);
assert.equal(summary.warningCount, 1);

assert.equal(isStageCopilotContextEnvelopeSafe(promptStudioInput), true);
assert.equal(
  promptStudioEnvelope.promptSpecRefs[0].kind,
  "unknown_or_unclassified",
  "unknown/unclassified prompt refs are allowed as references only",
);

// Invalid/unsafe cases.
assertRejected(
  withBoundaryOverride(promptStudioInput, { writesAllowed: true }),
  "write_authority_not_allowed",
  "write authority",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { providerExecutionAllowed: true }),
  "provider_execution_not_allowed",
  "provider execution capability",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { retrievalExecutionAllowed: true }),
  "retrieval_execution_not_allowed",
  "retrieval execution capability",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { databaseExecutionAllowed: true }),
  "database_execution_not_allowed",
  "database execution capability",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { promptCompilationAllowed: true }),
  "prompt_compilation_not_allowed",
  "prompt compilation capability",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { promptMutationAllowed: true }),
  "prompt_mutation_not_allowed",
  "prompt mutation authority",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { officialAnalysisRerunAllowed: true }),
  "official_analysis_rerun_not_allowed",
  "official analysis rerun authority",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { packageEligibilityMutationAllowed: true }),
  "package_eligibility_mutation_not_allowed",
  "package eligibility mutation authority",
);

assertRejected(
  withBoundaryOverride(promptStudioInput, { sourceOfTruthMutationAllowed: true }),
  "source_of_truth_mutation_not_allowed",
  "source-of-truth mutation authority",
);

assertRejected(
  withBoundaryOverride(
    {
      ...promptStudioInput,
      evidenceAccessPolicy: {
        ...summaryOnlyEvidencePolicy,
        accessLevel: "admin_approved_raw_evidence",
      },
    },
    { unrestrictedRawEvidenceExecutionAllowed: true },
  ),
  "unrestricted_raw_evidence_execution_not_allowed",
  "unrestricted raw evidence executable access",
);

assertRejected(
  {
    ...promptStudioInput,
    auditSourceRefs: [
      ...promptStudioInput.auditSourceRefs,
      {
        refId: "callback-attempt",
        sourceType: "operator_supplied_summary",
        sourceRef: "callback",
        callback: () => "not allowed",
      },
    ],
  },
  "executable_content_not_allowed",
  "function/callback content",
);

assert.equal(isStageCopilotContextEnvelopeSafe(withBoundaryOverride(promptStudioInput, { writesAllowed: true })), false);

const contextEnvelopeSource = readFileSync("packages/stage-copilot/src/context-envelope.ts", "utf8");
const indexSource = readFileSync("packages/stage-copilot/src/index.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-context-envelope.mjs", "utf8");

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

const combinedImports = [
  importAndExportLines(contextEnvelopeSource),
  importAndExportLines(indexSource),
  importAndExportLines(proofSource),
].join("\n");

const forbiddenImportPatterns = [
  /@workflow\/prompts/,
  /@workflow\/persistence/,
  /@workflow\/integrations/,
  /apps\/admin-web/,
  /@workflow\/sources-context/,
  /@workflow\/hierarchy-intake/,
  /@workflow\/targeting-rollout/,
  /@workflow\/participant-sessions/,
  /@workflow\/synthesis-evaluation/,
  /@workflow\/packages-output/,
  /runPass6Copilot/,
  /runAdminAssistantQuestion/,
  /compilePass5Prompt/,
  /compilePass6PromptSpec/,
  /providerRegistry/,
  /getPromptTextProvider/,
];

for (const pattern of forbiddenImportPatterns) {
  assert.equal(pattern.test(combinedImports), false, `Context envelope package/proof must not import or execute ${pattern}`);
}

assert.match(contextEnvelopeSource, /from "@workflow\/contracts"/, "context envelope imports contract types only");

console.log("Stage Copilot context envelope proof passed.");
console.log(JSON.stringify({
  validatedSafeCases: [
    "prompt_studio_static_readonly_prompt_refs",
    "sources_context_source_refs_only_no_source_text_fetching",
    "hybrid_data_access_declaration_db_plus_evidence_anchor",
    "summary_generation_does_not_mutate_input",
    "safe_check_passes_for_readonly_declarative_boundary",
    "unknown_unclassified_prompt_refs_allowed_as_references_only",
  ],
  rejectedUnsafeCases: [
    "write_authority",
    "provider_execution_capability",
    "retrieval_execution_capability",
    "database_execution_capability",
    "prompt_compilation_capability",
    "prompt_mutation_authority",
    "official_analysis_rerun_authority",
    "package_eligibility_mutation_authority",
    "source_of_truth_mutation_authority",
    "unrestricted_raw_evidence_executable_access",
    "function_callback_executable_behavior",
  ],
  nonInterference: {
    noStagePackageImport: true,
    noPromptCompileImport: true,
    noProviderIntegrationImport: true,
    noPersistenceImport: true,
    noAdminWebImport: true,
    noPass5RuntimeImport: true,
    noPass6RuntimeImport: true,
  },
}, null, 2));
