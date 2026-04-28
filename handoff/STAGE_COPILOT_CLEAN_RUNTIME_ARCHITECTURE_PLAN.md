# Stage Copilot Clean Runtime Architecture Plan

No-code planning report only. No code, contracts, prompts, Capability PromptSpecs, PromptSpec keys, runtime behavior, UI, APIs, persistence, providers, retrieval, Pass 5 behavior, Pass 6 behavior, synthesis/evaluation/package logic, proof scripts, or source packages were changed.

Branch: `codex/workspace-shell-sandbox`
Requested accepted baseline: `32fac25b7f1eaa0005add2fa8b512d07b587c2b0`
Observed starting HEAD for this report: `ff5ec4c67844eab6f16a3e18f66efffd52ead656`

## 1. Executive Summary

The future Stage Copilot architecture should be built cleanly instead of optimizing around the existing Pass 5 admin assistant or Pass 6 Copilot implementations. Those current assistant-like paths can remain untouched as historical/current references, but they should not define the product model or runtime architecture for the new Stage Copilot family.

The primary rule is to protect the analysis engine. Stage Copilot may discuss, explain, challenge, compare alternatives, and run advisory what-if conversations over stage outputs, but it must not own, execute, mutate, or bypass the official analysis pipeline.

The clean architecture should therefore be isolated:

- New Stage Copilot package/runtime boundary.
- Read-only context assembly over explicit stage-scoped records.
- Stage Copilot PromptSpecs separate from Capability PromptSpecs.
- Advisory what-if reasoning that produces conversation only.
- Routed recommendations that never execute automatically.
- No direct provider execution until a dedicated provider-backed Copilot slice is explicitly scoped.
- No writes into Pass 5/6 analysis repositories from Copilot runtime.
- No changes to Capability PromptSpecs, existing prompt keys, existing provider behavior, or existing proof scripts.

Recommended direction:

- Build the future runtime in a new `packages/stage-copilot` package after the contract/profile/read-model work is accepted.
- Keep `packages/prompts` as owner of Capability PromptSpecs and PromptOps behavior.
- Keep `packages/synthesis-evaluation`, `packages/packages-output`, and `packages/participant-sessions` as owners of official analysis outputs.
- Mount a future shared dock in `/workspace` only after the isolated package can prove non-interference.

## 2. Protected Analysis System

The new Stage Copilot must not mutate, replace, or own these capabilities.

### Protected PromptSpecs and prompt paths

Files inspected:

- `packages/prompts/src/index.ts`
- `packages/contracts/src/types/prompt-spec.ts`
- `packages/contracts/src/types/pass6-prompt-workspace.ts`
- `packages/contracts/src/schemas/prompt-spec.schema.json`
- `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json`

Protected Capability PromptSpecs and prompt families:

- Pass 3 hierarchy drafting:
  - `PASS3_HIERARCHY_PROMPT_MODULE`
  - `pass3.hierarchy.draft`
  - `defaultPass3HierarchyPromptSpec`
  - `compileStructuredPromptSpec`
  - Pass 3 draft/promotion/test functions.

- Pass 3 source-to-hierarchy triage:
  - `PASS3_SOURCE_TRIAGE_PROMPT_MODULE`
  - `pass3.source_hierarchy.triage`
  - `defaultPass3SourceTriagePromptSpec`
  - `compilePass3SourceTriagePromptSpec`.

- Pass 4 targeting:
  - `PASS4_TARGETING_ROLLOUT_PROMPT_MODULE`
  - `pass4.targeting_rollout.packet`
  - `defaultPass4TargetingPromptSpec`
  - `compilePass4TargetingPromptSpec`
  - Pass 4 prompt test behavior.

- Pass 5 prompt family:
  - `PASS5_PROMPT_FAMILY`
  - `PASS5_BASE_GOVERNANCE_PROMPT_MODULE`
  - `pass5_base_governance_prompt`
  - `participant_guidance_prompt`
  - `first_pass_extraction_prompt`
  - `evidence_interpretation_prompt`
  - `clarification_formulation_prompt`
  - `answer_recheck_prompt`
  - `admin_added_question_prompt`
  - Existing `admin_assistant_prompt` should remain untouched, but it is not strategic authority for the future Stage Copilot runtime.

- Pass 6 Prompt Workspace:
  - `PASS6_PROMPT_CAPABILITY_KEYS`
  - `synthesis`
  - `difference_interpretation`
  - `evaluation`
  - `initial_package_drafting`
  - `admin_explanation`
  - `pre_package_inquiry_generation`
  - `optional_draft_document_generation`
  - `visual_narrative_support`
  - Existing `pass6_analysis_copilot` should remain untouched, but it is not strategic authority for the future Stage Copilot runtime.

Protected prompt behaviors:

- Prompt registration and listing.
- PromptSpec creation/defaulting.
- Prompt compilation and compiled previews.
- Draft/active/previous/archived lifecycle.
- Prompt test execution and prompt test persistence.
- Provider-job creation and provider failure recording.
- Existing proof expectations around key names.

### Protected Pass 5 participant evidence pipeline

Files inspected:

- `packages/participant-sessions/src/index.ts`
- `packages/contracts/src/types/participant-session.ts`
- `packages/persistence/src/index.ts`
- Pass 5 proof scripts under `scripts/prove-pass5-*.mjs`

Protected capabilities:

- Participant session creation from targeting plans.
- Web session access tokens.
- Telegram pairing and Telegram evidence intake.
- Web text and voice narrative submission.
- Raw evidence item creation and trust status.
- Transcript evidence creation, approval, rejection, retry.
- Evidence extraction eligibility.
- First-pass extraction provider path.
- FirstPassExtractionOutput creation.
- Evidence anchor validation and evidence dispute creation.
- Clarification candidate formulation.
- Participant clarification answer capture.
- Answer recheck provider path.
- Boundary signal creation.
- Session next actions.
- Pass 6 handoff candidates.

Protected mutating functions include, but are not limited to:

- `createParticipantSessionsFromTargetingPlan`
- `submitWebSessionFirstNarrative`
- `submitWebSessionFirstNarrativeVoice`
- `handleTelegramTextMessage`
- `createTranscriptEvidenceForReview`
- `approveTranscriptEvidence`
- `rejectTranscriptEvidence`
- `markEvidenceNeedsRetry`
- `runFirstPassExtractionForSession`
- `formulateClarificationQuestion`
- `captureClarificationAnswer`
- `runClarificationAnswerRecheck`
- `addAdminClarificationQuestion`
- `dismissClarificationCandidate`
- `createBoundarySignalFromAnswer`
- `createPass6HandoffCandidateFromAssistantRecommendation`

The new Stage Copilot may read approved summaries and record references from this pipeline later, but it must not call these functions as direct Copilot behavior.

### Protected Pass 6 synthesis/evaluation/package pipeline

Files inspected:

- `packages/synthesis-evaluation/src/index.ts`
- `packages/packages-output/src/index.ts`
- `packages/packages-output/src/final-package.ts`
- `packages/contracts/src/types/pass6-core.ts`
- `packages/contracts/src/types/synthesis-record.ts`
- `packages/contracts/src/types/evaluation-record.ts`
- `packages/contracts/src/types/initial-package-record.ts`
- `packages/contracts/src/types/final-package.ts`
- `packages/persistence/src/index.ts`
- Pass 6 proof scripts under `scripts/prove-pass6-*.mjs`

Protected synthesis/evaluation capabilities:

- `buildSynthesisInputBundleFromPass5`
- `createSynthesisInputBundleForAdminReview`
- `createSynthesis`
- `createDefaultPass6ConfigurationDraft`
- `savePass6ConfigurationProfile`
- `promotePass6ConfigurationDraft`
- `rollbackPass6ConfigurationProfile`
- `resolvePass6MethodRegistryForAdmin`
- `updatePass6MethodActiveStatus`
- `buildWorkflowUnitsAndClaimsFromBundle`
- `interpretWorkflowClaimDifferences`
- `assembleWorkflowDraftFromClaims`
- `evaluateWorkflowReadinessFromDraft`
- `buildPass6MethodologyAnalysisReport`
- `runPre6CGateFromReadiness`
- `registerExternalInterfacesFromPass6Context`
- `createPass7ReviewCandidatesFromPass6Context`
- `createEvaluation`

Protected package/output capabilities:

- `generatePass6Output`
- `createInitialPackage`
- `buildWorkflowGraphFromInitialPackage`
- `buildPackageVisuals`
- `generatePackageVisuals`
- `createFinalPackage`
- `updateFinalPackage`

The new Stage Copilot may explain these outputs and discuss hypotheticals, but it must not call these functions, change their inputs, or write their outputs.

### Protected persistence and provider surfaces

Files inspected:

- `packages/persistence/src/index.ts`
- `packages/integrations/src/index.ts`
- `packages/integrations/src/provider-registry.ts`
- `packages/integrations/src/extraction-provider.ts`
- `packages/integrations/src/google-extraction.ts`
- `packages/integrations/src/openai-extraction.ts`

Protected repositories include:

- Prompt repositories and PromptSpec repositories.
- Provider extraction jobs.
- Structured PromptSpecs and Pass 3/4 prompt test runs.
- Participant sessions, raw evidence, first-pass extraction outputs, clarification candidates, boundary signals, evidence disputes, session next actions, Pass 6 handoff candidates.
- Pass 6 repositories: synthesis input bundles, workflow units, workflow claims, analysis method usages, difference interpretations, assembled workflow drafts, readiness results, pre-package gates, clarification needs, inquiry packets, external interfaces, initial workflow packages, gap closure briefs, draft operational documents, workflow graphs, Pass 7 candidates.
- Existing Pass 6 Copilot context/interaction repositories should remain untouched as legacy/current storage, not the future runtime authority.

Protected provider behavior:

- `providerRegistry`
- `getPromptTextProvider`
- `resolveDefaultPromptTextProvider`
- Google/OpenAI extraction and prompt text provider behavior.
- STT, crawl, and embedding providers.

New Stage Copilot runtime must not call providers until a provider-backed Copilot slice is explicitly scoped and proven separately.

### Protected proof scripts

Representative proof scripts that must keep passing when later Stage Copilot work starts:

- `scripts/prove-pass2-phase1.mjs`
- `scripts/prove-pass5-block1-contracts.mjs`
- `scripts/prove-pass5-block2-persistence.mjs`
- `scripts/prove-pass5-block7-evidence-trust.mjs`
- `scripts/prove-pass5-block8-prompt-family.mjs`
- `scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `scripts/prove-pass5-block10-clarification.mjs`
- `scripts/prove-pass5-block12-admin-assistant.mjs`
- `scripts/prove-pass5-block12-stage-aware-copilot.mjs`
- `scripts/prove-pass5-block13-handoff-candidates.mjs`
- `scripts/prove-pass5-block14-answer-recheck-governance.mjs`
- `scripts/prove-pass5-block14-extraction-contract-alignment.mjs`
- `scripts/prove-pass5-block14-extraction-governance-hardening.mjs`
- `scripts/prove-pass5-block14-nested-extraction-governance.mjs`
- `scripts/prove-pass6-block1-contracts.mjs`
- `scripts/prove-pass6-block2-persistence.mjs`
- `scripts/prove-pass6-block4-prompt-workspace.mjs`
- `scripts/prove-pass6-block5-prompt-test-harness.mjs`
- `scripts/prove-pass6-block6-synthesis-input-bundle.mjs`
- `scripts/prove-pass6-block8-method-registry.mjs`
- `scripts/prove-pass6-block9-claim-pipeline.mjs`
- `scripts/prove-pass6-block10-difference-interpretation.mjs`
- `scripts/prove-pass6-block11-workflow-assembly.mjs`
- `scripts/prove-pass6-block12-readiness-result.mjs`
- `scripts/prove-pass6-block13-analysis-report.mjs`
- `scripts/prove-pass6-block14-pre6c-gate.mjs`
- `scripts/prove-pass6-block16-package-generation.mjs`
- `scripts/prove-pass6-block17-visual-core-integration.mjs`
- `scripts/prove-pass6-block19-pass7-candidate-seam.mjs`
- `scripts/prove-stage-copilot-foundation-contracts.mjs`
- `scripts/prove-stage-copilot-static-taxonomy-projection.mjs`

Existing live-provider proofs should not be required for every Stage Copilot slice unless the slice explicitly touches provider-backed behavior.

## 3. Existing Copilot/Assistant Components to Ignore, Leave Untouched, or Deprecate Later

The following current components are useful as references but should not define the future product architecture.

### Pass 5 admin assistant

Existing components:

- `admin_assistant_prompt`
- linked module `pass5.admin_assistant`
- `classifyAdminAssistantQuestion`
- `buildAdminAssistantContextBundle`
- `runAdminAssistantQuestion`
- related proof scripts.

Recommended stance:

- Leave untouched.
- Do not generalize blindly.
- Do not use as the future Stage Copilot runtime base.
- Later, classify it as legacy/current copilot-like behavior and optionally deprecate it once the new Participant Evidence Copilot exists.

Reason:

- It mixes bounded context assembly, provider-job recording, deterministic fallback, routed recommendations, and Pass 5-specific behavior inside the participant-sessions package.
- It was useful for Pass 5, but the future architecture needs a stage-family runtime with stricter isolation from analysis writes.

### Pass 6 Copilot

Existing components:

- `pass6_analysis_copilot`
- `runPass6Copilot`
- `buildPass6CopilotContextBundle`
- `pass6CopilotContextBundles`
- `pass6CopilotInteractions`
- `/api/pass6/copilot`
- `scripts/prove-pass6-block18-copilot.mjs`

Recommended stance:

- Leave untouched.
- Do not reuse as the future runtime base.
- Do not delete or migrate now.
- Later, classify it as legacy/current copilot-like behavior and replace with a clean Analysis / Package Stage Copilot when ready.

Reason:

- It lives in `packages/prompts`, near PromptOps and Pass 6 prompt behavior.
- It persists interactions into existing Pass 6 Copilot repositories.
- It is not the desired shared Stage Copilot runtime architecture.

### Workspace prompt/static surfaces

Existing components:

- `/workspace/prompts`
- `/workspace` shell.

Recommended stance:

- Use only as future host context.
- Do not attach a dock until runtime isolation and context boundaries are proven.

## 4. Clean Stage Copilot Architecture

The clean architecture should be a new family of components, not a refactor of existing assistant-like paths.

### Core objects

Stage Copilot Profile:

- Declares stage key, runtime mode, PromptSpec references, context bundle references, system knowledge references, case data references, retrieval scope, refusal policy, conversational behavior profile, advisory mode policy, routed recommendation types, forbidden actions, read/write boundary, evidence access policy, and audit requirements.
- Already represented in `packages/contracts/src/types/stage-copilot.ts`.
- Should remain a declaration until runtime slices are scoped.

Stage Copilot PromptSpec:

- Controls conversational behavior, not analysis behavior.
- Defines explanation depth, challenge level, directness, advisory what-if behavior, uncertainty handling, citation/evidence discussion behavior, refusal wording, routed recommendation wording, and recommendation-vs-decision separation.
- Must not change official analysis outputs, gates, evidence trust, package eligibility, or provider execution.

Capability PromptSpecs:

- Remain owned by current analysis packages and PromptOps.
- Run or support extraction, clarification, answer recheck, synthesis, difference interpretation, evaluation, package drafting, targeting recommendations, and other stage capabilities.
- The new Copilot may reference their metadata for explanation, but must not mutate or execute them directly.

Stage System Knowledge:

- Read-only references to stage purpose, boundaries, contracts, gates, allowed/forbidden actions, workflow steps, relevant Capability PromptSpecs, Stage Copilot PromptSpecs, validation rules, and proof logic.
- Should begin as static references or documentation-backed metadata.
- Should not become an execution engine.

Stage Case Data Context:

- Read-only pointers to current case/stage records.
- Should include record IDs, summaries, state/gate status, evidence anchors, provenance pointers, and exclusions.
- Should not embed unrestricted raw evidence by default.

Stage Context Bundle:

- A bounded, assembled read model for one stage conversation turn or session.
- Should include stage system knowledge references plus case data context references.
- Should be immutable for the request.
- Should record what it read once audit is scoped.

Advisory what-if layer:

- Allows hypothetical discussion such as “what if this blocker were only a warning” or “what if another method/lens were used.”
- Produces advisory text and optionally routed recommendations only.
- Must label hypotheticals.
- Must not update readiness, package eligibility, method selections, analysis records, or official outputs.

Read-only analysis context access:

- Reads official analysis outputs as facts or references.
- Does not recompute, rerun, repair, or overwrite official records.
- Calls no provider by default.

Routed recommendations:

- Suggestions to inspect, navigate, review, or start governed actions elsewhere.
- Must require admin confirmation.
- Must execute automatically never.
- Must identify owning area.

Refusal policy:

- Refuse unrelated, out-of-stage, mutation, provider execution, evidence approval, prompt promotion, package release, and business decision authority requests.
- Redirect to owning stage when safe.

No-write boundary:

- No autonomous writes.
- No direct mutation of analysis records.
- No prompt mutation.
- No package generation or release.
- No provider calls until explicitly scoped.

Future retrieval seam:

- Declarative access to direct ID lookup, evidence-anchor lookup, stage-scoped keyword lookup, hybrid exact/anchor/keyword lookup, and future semantic/vector lookup.
- Retrieval is not implemented by this plan.

Future shared dock host:

- `/workspace` can host a shared dock later.
- Dock should route by active stage and load a stage profile.
- Dock should not own business logic.

## 5. Non-Interference Model

The Stage Copilot can discuss analysis outputs without owning them by treating all official records as read-only evidence, not as mutable working state.

Allowed:

- Explain what a record says.
- Explain why an official analysis output appears to have been produced, using recorded inputs and rules.
- Compare possible interpretations.
- Challenge unsupported admin assumptions.
- Identify missing, weak, disputed, or uncertain evidence.
- Discuss what a different route might imply.
- Recommend a governed action, such as inspect a record, review an evidence dispute, rerun a stage through its existing admin route, or open a prompt workspace.

Forbidden:

- Rerun official analysis directly.
- Change readiness.
- Change evaluation.
- Change package eligibility.
- Change synthesis outputs.
- Change difference interpretations.
- Change package drafts.
- Mutate evidence trust or transcript approval.
- Mutate prompts or promote PromptSpecs.
- Write provider jobs.
- Write Pass 5/6 records.
- Bypass domain gates.
- Convert advisory what-if output into official state.

Implementation consequence:

- The future runtime should receive read-only repository interfaces or preassembled context, not full mutable repositories.
- No `save`, `update`, `updateTrustStatus`, `updateReviewState`, `updateExtractionStatus`, `promote`, `archive`, `generate`, or `runProvider` capability should be reachable from the runtime boundary.
- A separate governed action router may be introduced later, but it must require admin confirmation and delegate to existing stage-owned routes.

## 6. Official Analysis vs Advisory Discussion

Official analysis execution:

- Runs through existing stage-owned functions, routes, repositories, providers, contracts, validators, and proof scripts.
- Creates or updates official records.
- Owns readiness, evaluation, package eligibility, package outputs, evidence trust, prompt promotion, and provider-job status.

Advisory conversation:

- Uses Stage Copilot PromptSpecs and read-only context.
- Explains, challenges, compares, and summarizes.
- May discuss methods/lenses and alternatives.
- Does not create official records.

What-if simulation:

- Conversational and labelled hypothetical.
- May say “if treated as warning, likely consequences are...”
- Must not alter the actual blocker/warning status.
- Must not imply official eligibility changed.

Routed recommendations:

- Structured suggestions that point to an owning stage/action.
- Require admin confirmation.
- Do not execute automatically.
- Do not bypass existing admin routes or gates.

Governed future actions:

- Later action routes may allow an admin to trigger existing official capabilities.
- They must be outside the Copilot reasoning loop.
- They must preserve existing validators, proof scripts, audit, and provider behavior.

## 7. Data and Context Access Model

The future Stage Copilot should support multiple context access strategies, but they should be introduced in layers.

Recommended future order:

1. Scoped record references and direct repository lookup.
2. Evidence-anchor lookup.
3. Stage-scoped keyword lookup.
4. Hybrid exact + anchor + keyword lookup.
5. Semantic/vector lookup only if later justified by evidence scale and precision needs.

DB/repository lookup:

- Best first source for stage summaries, IDs, statuses, readiness, package state, prompt metadata, and proof references.
- Must be wrapped in read-only repository facades or context assemblers.

Scoped record references:

- Best default exchange format between UI/runtime/context.
- Keeps prompt context bounded and auditable.

Evidence anchors:

- Required for questions like “what did the participant actually say?” or “which snippet supports this blocker?”
- Must respect evidence access policy.

Retrieval/search:

- Useful once original evidence/text exceeds prompt size.
- Should be stage-scoped and cite record IDs/anchors.

Hybrid context:

- Recommended long-term: structured bundle first, retrieval seam second.
- The Copilot receives summaries and pointers first, then retrieves original material only when needed.

Semantic/vector:

- Future optional only.
- Not required for initial clean runtime.
- Must not be introduced before direct/anchor/keyword retrieval proves insufficient.

Current plan:

- Do not implement DB access, retrieval, search, or vector logic now.
- Represent access strategies declaratively and design future read-only assemblers.

## 8. Stage-by-Stage Copilot Strategy

### Sources / Context

May discuss:

- Source purpose, source role/scope suggestions, extraction jobs, crawl/site summaries, content chunks, source limitations, context-only treatment, and missing source signals.

Must not own:

- Source registration.
- Crawl execution.
- Provider extraction.
- Source-role decisions.
- Source-of-truth updates.
- Embedding jobs.

Safe first behavior:

- Read-only explanation and evidence/source-origin discussion.

### Hierarchy

May discuss:

- Draft hierarchy, source-to-hierarchy triage, reporting-line confidence, inferred vs confirmed structure, corrections, readiness snapshots, and effects of treating an interface differently.

Must not own:

- Hierarchy draft generation.
- Correction event writes.
- Approved hierarchy snapshots.
- Readiness changes.
- Prompt tests.

Safe first behavior:

- Explain hierarchy records and uncertainty without generating or approving hierarchy.

### Targeting

May discuss:

- Targeting recommendation packets, participant choices, role coverage, question-hint seeds, ordering alternatives, and missing target coverage.

Must not own:

- Targeting packet generation.
- Participant session creation.
- Prompt tests.
- Question-hint seed mutation.

Safe first behavior:

- Explain why participants/questions were suggested and compare outreach paths.

### Participant Evidence

May discuss:

- Participant sessions, raw evidence metadata, approved transcripts, first-pass extraction outputs, clarification candidates, answers, evidence disputes, boundary signals, extraction defects, unmapped content, and handoff candidates.

Must not own:

- Evidence trust approval/rejection.
- Transcript approval.
- First-pass extraction.
- Clarification formulation.
- Answer recheck.
- Boundary signal writes.
- Handoff candidate writes.
- Participant messaging.

Safe first behavior:

- Read-only discussion over session/evidence/extraction status.
- High value but requires strict raw evidence policy.

### Analysis / Package

May discuss:

- Synthesis input bundles, workflow units/claims, method registry, difference interpretations, assembled drafts, readiness blockers/warnings, Pre-6C gates, external interfaces, package caveats, initial package outputs, visuals, and package eligibility rationale.

Must not own:

- Synthesis.
- Difference interpretation.
- Workflow assembly.
- Readiness evaluation.
- Pre-6C gates.
- Package drafting.
- Package generation.
- Visual generation.
- Final package release.

Safe first behavior:

- Explain existing records only.
- Strong value after outputs exist, but high risk if it is allowed near package eligibility or generation.

### Prompt Studio

May discuss:

- Difference between Capability PromptSpecs and Stage Copilot PromptSpecs, prompt lifecycle, compiled previews, test results, taxonomy labels, and why a prompt test failed.

Must not own:

- Prompt edits.
- Prompt promotion.
- Prompt archive.
- Prompt test execution.
- Provider execution.
- Prompt key migration.

Safe first behavior:

- Read-only taxonomy and lifecycle explanation.
- Low risk if no prompt mutation exists.

### Advanced / Debug

May discuss:

- Provider job failures, proof output meaning, route ownership, record provenance, debug-only vs business logic records, and operational boundaries.

Must not own:

- Provider retries.
- DB repair.
- Record edits.
- Proof execution.
- Production debug actions.

Safe first behavior:

- Internal/admin-only explanation with heavy refusal boundaries.

## 9. Runtime Isolation Strategy

### Option A - Build runtime inside `packages/prompts`

Pros:

- Existing prompt/provider utilities are nearby.
- Existing Pass 5/6 assistant-like code lives there or depends on it.

Cons:

- High risk of coupling Stage Copilot to Capability PromptSpecs, PromptOps, compile paths, provider tests, and legacy Copilot behavior.
- Violates the clean-from-scratch direction.

Recommendation:

- Do not use for the clean runtime.
- `packages/prompts` may continue to own Capability PromptSpecs and taxonomy projection helpers only.

### Option B - Build runtime inside existing Pass 5/6 packages

Pros:

- Stage-specific data is nearby.

Cons:

- High risk of writing participant evidence or Pass 6 analysis records.
- Encourages stage-specific assistant duplication.
- Makes cross-stage shared dock/runtime harder.

Recommendation:

- Do not use for the shared Stage Copilot runtime.

### Option C - Build runtime in `apps/admin-web` API routes first

Pros:

- Fast to wire to `/workspace`.

Cons:

- Couples product behavior to UI/API before package boundaries are proven.
- Makes non-interference harder to prove.
- Risks importing mutable stores and provider registry directly.

Recommendation:

- Defer until package-level runtime boundaries are proven.

### Option D - New `packages/stage-copilot`

Pros:

- Clean isolation from PromptOps and analysis packages.
- Can depend on `@workflow/contracts`.
- Can define read-only context assembler interfaces without owning persistence.
- Can expose pure runtime contracts and boundary checks.
- Easier to prove no direct writes/provider calls.

Cons:

- Requires new package setup.
- Needs careful dependency boundaries.

Recommendation:

- Best long-term runtime home.
- First implementation should be small and read-only: profile loading/validation, deterministic boundary classification, context input shape, and non-interference proof.

### Option E - `packages/contracts` only

Pros:

- Safest for vocabulary.

Cons:

- Cannot host runtime.
- Should not import prompt or persistence packages.

Recommendation:

- Keep contracts as vocabulary only.

Recommended isolation:

- `packages/stage-copilot` owns future clean runtime orchestration and read-only boundary checks.
- `packages/contracts` owns shared types/schemas.
- `packages/prompts` owns Capability PromptSpecs and Stage Copilot PromptSpec records only when explicitly scoped.
- `packages/participant-sessions`, `packages/synthesis-evaluation`, and `packages/packages-output` own official analysis.
- `apps/admin-web` hosts API/UI after package proofs pass.

## 10. First Pilot Recommendation

The first pilot should be Prompt Studio Copilot or Sources / Context Copilot, not Analysis / Package Copilot and not a reuse of the old Pass 6 Copilot.

### Sources / Context Copilot

Value:

- Helps explain source roles, context-only treatment, extraction coverage, and missing source evidence.

Risk:

- Low to medium.

Dependency on analysis outputs:

- Low. Mostly Pass 2 records and source/context metadata.

Chance of breaking existing system:

- Low if read-only.

Proof difficulty:

- Moderate. Must prove no crawl/provider/source decision mutation.

Assessment:

- Strong first product pilot if the team wants stage value over PromptOps/admin value.

### Hierarchy Copilot

Value:

- Useful for explaining inferred vs confirmed hierarchy and source-to-role relationships.

Risk:

- Medium.

Dependency on analysis outputs:

- Medium. Depends on hierarchy draft/correction/readiness records.

Chance of breaking existing system:

- Medium if it gets near approval/readiness.

Proof difficulty:

- Moderate to high.

Assessment:

- Good second or third pilot after read-only context and refusal boundaries are proven.

### Participant Evidence Copilot

Value:

- High. Admins need to ask what participants said, which evidence is disputed, and what to ask next.

Risk:

- High. Raw participant data, transcript trust, clarification status, answer recheck, and evidence approval are sensitive.

Dependency on analysis outputs:

- High for Pass 5 pipeline records.

Chance of breaking existing system:

- Medium to high if not isolated.

Proof difficulty:

- High. Must prove no evidence/trust/session/clarification mutation.

Assessment:

- Valuable but not first unless evidence access policy and retrieval boundaries are already proven.

### Analysis / Package Copilot

Value:

- High for explaining methods, blockers, readiness, package caveats, and alternatives.

Risk:

- Highest. It sits closest to readiness, evaluation, package eligibility, and package generation.

Dependency on analysis outputs:

- Very high.

Chance of breaking existing system:

- High if built before isolation.

Proof difficulty:

- High. Must prove no synthesis/evaluation/package mutation and no provider calls.

Assessment:

- Do not choose as first clean runtime pilot.

### Prompt Studio Copilot

Value:

- Explains Capability vs Stage Copilot PromptSpecs, lifecycle, taxonomy, prompt tests, and failure meaning.

Risk:

- Low if read-only.

Dependency on analysis outputs:

- Low. Depends on prompt metadata and test records, not official workflow analysis.

Chance of breaking existing system:

- Low if prompt mutation/promotion/test execution is forbidden.

Proof difficulty:

- Low to moderate.

Assessment:

- Safest first pilot after runtime foundation, especially if the goal is to prove clean runtime isolation before touching stage analysis data.

Recommendation:

- First technical pilot: Prompt Studio Copilot, read-only, no provider at first.
- First stage/product pilot after that: Sources / Context Copilot.
- Defer Participant Evidence and Analysis / Package until evidence access, retrieval seam, and no-write proofs are stronger.

## 11. Recommended Build Order

### Slice 1 - Clean Runtime Package Boundary Plan/Scaffold

Purpose:

- Create the future runtime home without runtime behavior.

Files/packages likely touched:

- New `packages/stage-copilot` only if explicitly approved later.
- Workspace package config.

Produces:

- Package boundary and dependency rules.

Must not do:

- No provider calls.
- No DB access.
- No UI.
- No APIs.
- No analysis package imports.

Proof strategy:

- Build/typecheck.
- Dependency-boundary proof showing no imports from `apps/admin-web`, `packages/integrations`, or mutable analysis modules.

Risk level:

- Low to medium.

### Slice 2 - Runtime Boundary Types and Pure Guards

Purpose:

- Define local runtime guard helpers for no-write/no-provider/no-direct-action behavior using existing contracts.

Files/packages likely touched:

- `packages/stage-copilot`.

Produces:

- Pure functions that classify requests as allowed discussion, refusal, or routed recommendation.

Must not do:

- No chat API.
- No providers.
- No persistence writes.
- No context assembly from DB.

Proof strategy:

- Invalid mutation/provider/package/prompt-promotion requests are refused.
- Advisory what-if is labelled and remains non-executable.

Risk level:

- Low.

### Slice 3 - Read-Only Context Bundle Interface

Purpose:

- Define interface for preassembled context input, not implementation of DB/retrieval.

Files/packages likely touched:

- `packages/stage-copilot`.
- Possibly `packages/contracts` only if shared schema is explicitly needed.

Produces:

- Stage-scoped input shape: system knowledge refs, case data refs, record summaries, evidence anchors, exclusions.

Must not do:

- No repository lookup.
- No retrieval/search/vector.
- No stage-specific bundle schemas.

Proof strategy:

- Context accepted only as immutable input.
- Unknown stage/out-of-scope records rejected or excluded.

Risk level:

- Low.

### Slice 4 - Deterministic Non-Provider Harness

Purpose:

- Prove conversation boundary behavior without live providers.

Files/packages likely touched:

- `packages/stage-copilot`.
- New proof script.

Produces:

- Deterministic responses for boundary/refusal/recommendation cases.

Must not do:

- No generic chatbot.
- No provider.
- No DB.
- No UI.

Proof strategy:

- No writes before/after.
- Mutation requests refused.
- What-if output remains advisory.

Risk level:

- Low.

### Slice 5 - Prompt Studio Copilot Pilot

Purpose:

- First real read-only product pilot over prompt taxonomy/lifecycle metadata.

Files/packages likely touched:

- `packages/stage-copilot`
- Possibly `packages/prompts` read-only projection helper.
- API/UI only after package proof.

Produces:

- Prompt taxonomy and lifecycle explanation.

Must not do:

- No prompt edits.
- No prompt promotion.
- No prompt tests.
- No provider calls.

Proof strategy:

- Capability PromptSpecs unchanged.
- Prompt keys unchanged.
- No repository writes.
- Existing prompt proofs pass.

Risk level:

- Low to medium.

### Slice 6 - Sources / Context Copilot Pilot

Purpose:

- First stage-scoped product Copilot over low-risk source/context records.

Files/packages likely touched:

- `packages/stage-copilot`
- Read-only context assembler package or app adapter later.
- UI/API only after package proof.

Produces:

- Source/context explanation and safe routed recommendations.

Must not do:

- No crawl execution.
- No extraction provider calls.
- No source-role decision writes.

Proof strategy:

- Source records unchanged.
- Provider jobs unchanged.
- Existing Pass 2 proof passes.

Risk level:

- Medium.

### Slice 7 - Participant Evidence and Analysis / Package Pilots

Purpose:

- Add high-value stage copilots after safety is established.

Files/packages likely touched:

- `packages/stage-copilot`
- Read-only context assemblers.
- APIs/UI after proofs.

Produces:

- Evidence and analysis explanation with strict evidence/readiness/package boundaries.

Must not do:

- No evidence approval.
- No answer recheck.
- No synthesis/evaluation/package writes.

Proof strategy:

- Full Pass 5 and Pass 6 non-interference proof subset.
- Snapshot counts/hashes before and after Copilot calls.

Risk level:

- High.

## 12. Proof Strategy

Future implementation must prove non-interference before any UI or provider-backed runtime.

Core proof requirements:

- Existing analysis proof scripts still pass.
- Capability PromptSpecs unchanged.
- Existing PromptSpec keys unchanged.
- No provider calls from Copilot runtime unless explicitly scoped.
- No DB writes.
- No state transitions.
- No prompt mutation.
- No package eligibility mutation.
- No Pass 5 evidence/session/extraction/clarification mutation.
- No Pass 6 synthesis/evaluation/package/readiness mutation.
- No existing Pass 5/6 assistant runtime changes.
- Runtime boundary proof rejects forbidden requests.
- Advisory-only what-if proof labels hypotheticals and produces no official records.
- Routed recommendations require admin confirmation and execute automatically never.

Recommended proof mechanics:

- Static source scan for forbidden imports in `packages/stage-copilot`.
- Repository spy/fake with throwing `save`/`update` methods for runtime proofs.
- Before/after record counts for protected repositories.
- Before/after key lists for Capability PromptSpecs.
- Explicit assertions that provider registry is not imported.
- Explicit assertions that app routes are not imported.
- Existing contract proofs:
  - `pnpm build:contracts`
  - `node scripts/prove-stage-copilot-foundation-contracts.mjs`
  - `node scripts/prove-stage-copilot-static-taxonomy-projection.mjs`

Suggested non-live proof subset for early runtime slices:

- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block14-answer-recheck-governance.mjs`
- `node scripts/prove-pass6-block4-prompt-workspace.mjs`
- `node scripts/prove-pass6-block6-synthesis-input-bundle.mjs`
- `node scripts/prove-pass6-block10-difference-interpretation.mjs`
- `node scripts/prove-pass6-block12-readiness-result.mjs`
- `node scripts/prove-pass6-block14-pre6c-gate.mjs`
- `node scripts/prove-pass6-block16-package-generation.mjs`
- `pnpm typecheck`

Live provider proofs should remain out of scope unless a future slice explicitly touches provider-backed behavior.

## 13. Risks, Open Questions, and Required Decisions

Critical risks:

- Accidentally building the new runtime inside `packages/prompts` and coupling it to Capability PromptSpecs.
- Letting advisory what-if outputs appear as official analysis results.
- Giving Copilot mutable repositories or provider registry access.
- Reusing Pass 6 Copilot as architecture and inheriting package/readiness coupling.
- Reusing Pass 5 admin assistant as architecture and inheriting evidence/session mutation proximity.
- Letting routed recommendations execute without admin confirmation.
- Exposing raw participant evidence too broadly.

Non-critical risks:

- New package adds monorepo overhead.
- First pilot may feel less impressive if it is deterministic/read-only.
- Static stage system knowledge may need maintenance until a formal knowledge index exists.
- Prompt Studio Copilot may be safer but less directly valuable than Participant Evidence or Analysis / Package.

Required operator decisions:

- Approve or reject a new `packages/stage-copilot` runtime package.
- Choose first pilot: safest Prompt Studio Copilot vs more product-visible Sources / Context Copilot.
- Decide whether Stage Copilot interactions should eventually persist in a new repository separate from old Pass 6 Copilot interaction records.
- Decide what raw participant evidence classes are never exposed through Copilot.
- Decide when provider-backed chat is allowed.
- Decide whether any future routed actions can ever call existing stage-owned mutations, and what admin confirmation/audit is required.

Deferred:

- Shared dock UI.
- API routes.
- Provider-backed chat.
- Retrieval/search/vector.
- Stage-specific context bundle schemas.
- Persistence for new Stage Copilot sessions/interactions.
- Migration/deprecation of Pass 5 admin assistant.
- Migration/deprecation of Pass 6 Copilot.

## 14. Final Recommendation

Build the future Stage Copilot runtime cleanly and separately from existing assistant-like implementations. Preserve the existing Pass 5 admin assistant and Pass 6 Copilot as untouched legacy/current references, but do not reuse them as the architecture.

The next implementation after planning should be a small, isolated `packages/stage-copilot` foundation slice with pure boundary guards and no provider, DB, UI, API, persistence, retrieval, or analysis-package writes. The first pilot should be Prompt Studio Copilot if maximum non-interference is the priority, followed by Sources / Context Copilot as the first real stage product pilot.

Do not start with Analysis / Package Copilot. It is valuable, but it is closest to readiness, evaluation, package eligibility, and package generation, so it should wait until the no-write runtime boundary and read-only context model are proven.
