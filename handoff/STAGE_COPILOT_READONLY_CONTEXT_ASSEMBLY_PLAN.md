# Stage Copilot Read-Only Context Assembly Plan

## 1. Executive Summary

The Stage Copilot Instructions foundation is ready for the next planning step: read-only context assembly. The next work should define how each stage Copilot receives scoped stage context for discussion without becoming an analysis engine, provider runner, prompt compiler, package generator, or persistence writer.

Recommended architecture: use a hybrid ownership model.

- Stage packages later expose narrow read-only read models for the records and outputs they already own.
- `packages/stage-copilot` normalizes those read models into the existing read-only context envelope and applies boundary guards.
- `apps/admin-web` uses prepared context through future routes or services but does not own analysis truth.

Recommended first pilot: **Prompt Studio Copilot context**. It has high product value, low analysis-engine risk, and can begin with prompt/instruction/taxonomy references without reading participant evidence, rerunning official analysis, or touching package eligibility.

Do not start provider-backed runtime/chat, retrieval, prompt compilation, Capability PromptSpec mutation, Pass 5 behavior changes, or Pass 6 behavior changes as part of context assembly.

## 2. Context Assembly Purpose

Stage Copilot context assembly is the process of collecting and normalizing read-only stage facts, references, summaries, warnings, and audit sources into a conversation-safe context envelope for a future Stage Copilot.

It should be:

- read-only
- stage-scoped
- based on existing records and official outputs
- wrapped in the existing `StageCopilotContextEnvelope`
- safe for explanation, comparison, challenge, and advisory discussion
- auditable back to record IDs, evidence anchors, prompt refs, or stage read models

It is not:

- official analysis execution
- provider execution
- retrieval/search execution
- prompt compilation
- prompt testing
- prompt mutation or promotion
- evidence, transcript, gate, readiness, or package approval
- package generation
- stage transition logic
- persistence write behavior

The current envelope in `packages/stage-copilot/src/context-envelope.ts` already encodes the correct shape: scope refs, system knowledge refs, case context refs, evidence/source refs, prompt refs, blocker/warning summaries, advisory notes, audit refs, declarative data/retrieval strategies, and boundary flags proving no writes, providers, retrieval execution, DB execution, prompt compilation, official analysis rerun, or package eligibility mutation.

## 3. Ownership Model Options

### Option A - Stage packages expose read-only read models, `packages/stage-copilot` wraps/guards them

- Dependency direction: stage packages know their own records and expose read-only projections; `packages/stage-copilot` consumes prepared inputs and returns guarded envelopes.
- Risk level: low to medium.
- Analysis-engine risk: low if read models are narrow and do not call capability functions.
- Proof strategy: fixture read models, no-write repository facades, import scans, before/after repository row checks, existing Pass 5/6 proofs.
- Why use: it keeps analysis truth with its owning stage while enforcing a common Stage Copilot safety shape.

### Option B - `packages/stage-copilot` directly imports stage packages and assembles everything

- Dependency direction: `packages/stage-copilot` imports sources, hierarchy, targeting, participant evidence, synthesis/evaluation, packages-output, and possibly persistence.
- Risk level: high.
- Analysis-engine risk: high because many stage packages expose mutating and provider-backed functions alongside read helpers.
- Proof strategy: heavy import-deny checks, fake repositories that throw on writes, provider-call traps, existing proof stack.
- Why not use now: it would make the safety package own too much and blur the boundary between advisory Copilot context and official stage logic.

### Option C - Admin-web app layer assembles context

- Dependency direction: `apps/admin-web` imports many stage packages/repositories and builds context in route handlers.
- Risk level: high.
- Analysis-engine risk: high because app routes can accidentally become orchestration/business-logic owners.
- Proof strategy: route-level no-write checks, API tests, static import scans, DB table diff checks.
- Why not use now: admin-web should display and route, not own stage truth or context semantics.

### Option D - Context assembly is deferred until runtime

- Dependency direction: future runtime chooses its own context sources.
- Risk level: high.
- Analysis-engine risk: high because runtime pressure can lead to shortcuts, direct repository access, or provider-coupled context fetching.
- Proof strategy: would need runtime tests before the read model is stable.
- Why not use now: context boundaries should be proven before runtime/chat exists.

### Option E - One generic context assembler for all stages

- Dependency direction: a single package/service reads every record family and emits generic envelopes.
- Risk level: medium to high.
- Analysis-engine risk: medium to high because stage-specific truth rules are easy to flatten incorrectly.
- Proof strategy: broad fixture matrix across stages, no-write checks, import scans, existing Pass 2-6 proofs.
- Why not use first: generic assembly will under-model stage-specific risks, especially participant evidence and Pass 6 package eligibility.

## 4. Recommended Ownership Model

Use **Option A** as the long-term ownership model.

Stage packages should later expose small read-only read models because they already own the official records and stage semantics:

- `packages/sources-context` owns source intake, crawl/source material, structured context, department framing, and pre-hierarchy readiness.
- `packages/hierarchy-intake` owns hierarchy intake, drafts, source-to-hierarchy triage, corrections, approved snapshots, and readiness snapshots.
- `packages/targeting-rollout` owns targeting plans, candidate decisions, contact readiness, rollout state, and question-hint seeds.
- `packages/participant-sessions` owns participant sessions, evidence, transcripts, extraction outputs, clarification candidates, answer rechecks, disputes, boundary signals, and Pass 6 handoff candidates.
- `packages/synthesis-evaluation` owns synthesis bundles, workflow units/claims, method usage, differences, assembled drafts, readiness, Pre-6C gates, inquiries, external interfaces, and Pass 7 candidates.
- `packages/packages-output` owns initial/final package records, workflow graphs, visuals, and package output artifacts.
- `packages/prompts` owns Capability / Analysis PromptSpecs, prompt lifecycle, compilation, tests, and prompt registry behavior.

`packages/stage-copilot` should remain the safety/orchestration boundary:

- accept already-scoped read-only data
- normalize it into `StageCopilotContextEnvelope`
- enforce read-only boundary status
- label advisory notes
- reject executable content
- reject implied writes/provider/retrieval/prompt/analysis/package authority

`apps/admin-web` should not own analysis truth. It may later call a route/service that uses read models and stage-copilot guards, but route code should remain thin.

## 5. Stage-by-Stage Context Plan

### A. Sources / Context Copilot

May read:

- intake sessions
- intake sources
- source type/status/trust summaries
- extracted text refs and source snippets
- website crawl plans, page refs, content chunk refs, site summary refs
- audio transcript review refs
- department framing
- structured context records
- final pre-hierarchy review/readiness summaries
- source-role/scope suggestion refs when available

Must not mutate:

- source registrations
- intake/source processing status
- extracted text
- crawl approvals or crawl status
- structured context
- department framing
- pre-hierarchy review confirmation
- provider jobs or extraction jobs

Records/packages involved:

- `packages/sources-context`
- persistence repositories: intake sessions/sources, provider jobs, text artifacts, crawls, chunks, audio transcript reviews, department framing, structured contexts, final pre-hierarchy reviews

Risk level: low to medium.

Primary risk: `packages/sources-context` includes provider-backed and mutating helpers such as provider extraction, crawl approval, source updates, structured context saves, and final review confirmation. Context assembly must consume read-only projections only.

### B. Hierarchy Copilot

May read:

- hierarchy intake refs
- hierarchy draft refs
- hierarchy node and relationship summaries
- correction event refs
- approved hierarchy snapshots
- readiness snapshots
- source-to-hierarchy triage job/suggestion refs
- source evidence status and linked source basis summaries

Must not mutate:

- hierarchy intakes
- manual hierarchy drafts
- correction events
- approved snapshots
- readiness snapshots
- source-to-hierarchy triage suggestions or admin decisions

Records/packages involved:

- `packages/hierarchy-intake`
- persistence repositories: hierarchy intakes, hierarchy drafts, hierarchy corrections, approved hierarchy snapshots, readiness snapshots, source hierarchy triage jobs/suggestions

Risk level: medium.

Primary risk: hierarchy read models must not call helpers that create intakes, save drafts, run provider draft generation, update triage suggestions, or approve structure.

### C. Targeting Copilot

May read:

- targeting rollout plans
- target candidate summaries
- participant contact profile readiness
- rollout order/status
- question-hint seeds
- targeting recommendation packet refs
- source signals used for targeting
- approved hierarchy/readiness refs used as basis

Must not mutate:

- targeting plan creation or state
- candidate admin decisions
- contact profile updates
- question-hint seeds
- participant session creation
- outreach readiness

Records/packages involved:

- `packages/targeting-rollout`
- persistence repositories: targeting rollout plans, approved hierarchy snapshots, hierarchy readiness snapshots, source hierarchy triage suggestions, structured PromptSpecs only as refs

Risk level: medium.

Primary risk: `createOrLoadTargetingRolloutPlan` writes when a plan does not exist. A read-only context pilot must require an existing plan or a separate read-only getter.

### D. Participant Evidence Copilot

May read:

- participant session refs and current state
- selected channel and participation mode summaries
- raw evidence refs
- transcript refs
- first-pass extraction output refs
- extracted item summaries and evidence anchors
- clarification candidates and answers
- answer recheck refs
- boundary signals
- evidence disputes
- session next actions
- Pass 6 handoff candidates

Must not mutate:

- participant sessions
- access tokens
- message dispatch/send state
- Telegram identity bindings
- raw evidence
- transcript approvals/rejections
- extraction outputs
- clarification question formulation
- answer recording/recheck execution
- evidence dispute decisions
- boundary signal creation
- Pass 6 handoff candidate decisions

Records/packages involved:

- `packages/participant-sessions`
- persistence repositories: participant sessions, session tokens, Telegram bindings, raw evidence, first-pass extraction outputs, clarification candidates, boundary signals, evidence disputes, session next actions, Pass 6 handoff candidates
- Capability prompts in `packages/prompts` only as references, not compilation targets

Risk level: high.

Primary risk: this stage has provider-backed prompt compilation and official analysis helpers. Read-only context must discuss existing outputs only and never run extraction, clarification, answer recheck, or evidence approval.

### E. Analysis / Package Copilot

May read:

- Pass 6 handoff candidate refs
- synthesis input bundles
- workflow units
- workflow claims
- analysis method usage
- difference interpretations
- assembled workflow drafts
- readiness results
- Pre-6C gate results
- clarification needs and inquiry packets
- external interface records
- initial workflow packages
- workflow gap closure briefs
- draft operational documents
- workflow graph records
- Pass 7 review candidates

Must not mutate:

- synthesis bundles
- claims/units
- method configuration
- difference interpretations
- assembled drafts
- readiness results
- Pre-6C gates
- inquiry packets
- external interfaces
- package generation
- visuals
- Pass 7 candidates
- final package/release state

Records/packages involved:

- `packages/synthesis-evaluation`
- `packages/packages-output`
- persistence repositories for Pass 6 core records, package records, workflow graphs, and Pass 7 candidates

Risk level: high.

Primary risk: this stage sits nearest readiness and package eligibility. The Copilot may discuss readiness outputs, blockers, caveats, and routing recommendations, but must not rerun readiness, decide package eligibility, or generate packages.

### F. Prompt Studio Copilot

May read:

- Capability / Analysis PromptSpec refs and lifecycle/status metadata
- PromptSpec taxonomy classification refs
- Stage Copilot Instructions defaults/current/history metadata
- prompt test result refs and summaries
- compiled preview refs where already stored/displayed by Prompt Studio
- separation warnings between Capability PromptSpecs and Stage Copilot Instructions

Must not mutate:

- Capability PromptSpecs
- PromptSpec lifecycle status
- prompt promotion/archive
- prompt compilation
- prompt test execution
- Stage Copilot Instructions unless the existing Instructions API is explicitly invoked by the Instructions UI/control surface

Records/packages involved:

- `packages/prompts` for PromptSpec metadata/read-only projection only
- `packages/stage-copilot` for instruction defaults/editable metadata
- `packages/persistence` for prompt repositories and Stage Copilot System Prompt repository

Risk level: low to medium.

Primary risk: admin confusion. The context must clearly state whether it is discussing Capability / Analysis PromptSpecs or Stage Copilot Instructions.

### G. Advanced / Debug Copilot

May read:

- proof script refs
- provider job refs/statuses
- debug-only route ownership summaries
- persistence table/repository summaries
- build/module-resolution notes
- non-production diagnostics
- package boundary descriptions

Must not mutate:

- provider jobs
- DB records
- route behavior
- build config
- package code
- prompt records
- analysis outputs

Records/packages involved:

- `packages/persistence`
- app route/source references
- proof scripts as source refs
- provider job repositories as read-only status refs

Risk level: medium.

Primary risk: debug context can become too broad and leak operational authority. Keep it diagnostic and read-only.

## 6. First Context Pilot Recommendation

### Prompt Studio Copilot context

- Product value: high for admin clarity because it explains the two prompt systems and prompt/instruction separation.
- Safety risk: low to medium.
- Dependency complexity: low to medium.
- Proof difficulty: low.
- Analysis behavior impact: low if it reads metadata only and does not compile/test/promote prompts.

### Sources / Context Copilot context

- Product value: high because early-stage source/context discussion is useful.
- Safety risk: medium.
- Dependency complexity: medium.
- Proof difficulty: medium.
- Analysis behavior impact: low to medium if read-only; risk comes from source package provider/update helpers.

### Hierarchy Copilot context

- Product value: medium to high for explaining hierarchy basis and uncertainty.
- Safety risk: medium.
- Dependency complexity: medium.
- Proof difficulty: medium.
- Analysis behavior impact: medium if read-only boundaries are weak because hierarchy approval/readiness are nearby.

### Participant Evidence Copilot context

- Product value: high.
- Safety risk: high.
- Dependency complexity: high.
- Proof difficulty: high.
- Analysis behavior impact: high if boundaries fail because extraction, clarification, evidence trust, and disputes are official analysis surfaces.

### Analysis / Package Copilot context

- Product value: high.
- Safety risk: high.
- Dependency complexity: high.
- Proof difficulty: high.
- Analysis behavior impact: high because readiness, gates, package eligibility, and package output are nearby.

Recommended first pilot: **Prompt Studio Copilot context**.

Reason: it exercises the two-prompt-system separation and Stage Copilot envelope without reading participant evidence or touching official analysis execution. It can start as metadata-only read context over prompt refs, instruction refs, taxonomy classification, and proof/status summaries.

## 7. Minimal Context Shape

The first implementation should produce a `StageCopilotContextEnvelope` or an input that can be passed into `createStageCopilotContextEnvelope`.

Minimal shape:

- `envelopeId`
- `stageKey`
- `createdAt`
- `scopeRefs`
  - case/session/stage/operator refs as applicable
- `systemKnowledgeRefs`
  - stage purpose
  - stage boundary
  - contract refs
  - forbidden action refs
  - Capability PromptSpec refs
  - Stage Copilot Instruction refs
- `caseContextRefs`
  - stage-owned record families relevant to the selected stage
- `contextBundleRefs`
  - prepared read-model refs where available
- `dataAccessStrategy`
  - `executionMode: "declarative_only"`
- `retrievalScope`
  - `executionMode: "declarative_only"`
- `evidenceSourceRefs`
  - source/evidence refs only, stage-dependent
- `promptSpecRefs`
  - Capability PromptSpec refs and Stage Copilot PromptSpec taxonomy refs
- `promptTestReferenceSummaries`
  - prompt test result refs where relevant
- `blockerWarningSummaries`
  - current blockers/warnings as advisory-only summaries
- `advisorySafeNotes`
  - notes that explicitly do not mutate official records, rerun analysis, change readiness/package eligibility, or generate package output
- `auditSourceRefs`
  - read model, record ID, proof fixture, evidence anchor, prompt ref, or operator summary refs
- `boundaryStatus`
  - `readOnly: true`
  - `writesAllowed: false`
  - `providerExecutionAllowed: false`
  - `retrievalExecutionAllowed: false`
  - `databaseExecutionAllowed: false`
  - `promptCompilationAllowed: false`
  - `promptMutationAllowed: false`
  - `officialAnalysisRerunAllowed: false`
  - `packageEligibilityMutationAllowed: false`
  - `sourceOfTruthMutationAllowed: false`
  - `unrestrictedRawEvidenceExecutionAllowed: false`

The envelope should contain summaries and references, not writable handles or executable functions.

## 8. Data Access Strategy

Future data access should happen through explicit read-only seams.

Allowed later:

- read-only repository facades
- stage-owned read model functions
- scoped record IDs
- existing persisted records
- source refs
- evidence anchors
- prompt/test refs
- static Stage Copilot Instruction refs
- future retrieval/search declarations

Not allowed in the first context assembly work:

- live retrieval/RAG/vector search
- provider calls
- prompt compilation
- prompt test execution
- official analysis reruns
- writes to any repository
- mutation-capable repository handles in the envelope

For app usage, admin-web should eventually call a thin route/service that asks the stage owner for a read model, passes the read model through `packages/stage-copilot` normalization/guards, and returns a safe serialized envelope. It should not assemble official truth itself.

## 9. Guard / Safety Model

Future implementation must prove:

- no writes occurred
- no provider calls occurred
- no retrieval execution occurred
- no prompt compilation occurred
- no prompt mutation/promotion occurred
- no official analysis rerun occurred
- no package eligibility/readiness mutation occurred
- no evidence/transcript/gate approval occurred
- no Pass 5 behavior changed
- no Pass 6 behavior changed
- no Capability PromptSpec keys changed
- no `packages/prompts` behavior changed

Required guard layers:

1. Stage read model returns references/summaries only.
2. Stage Copilot context normalization creates `StageCopilotContextEnvelope`.
3. `assertStageCopilotContextEnvelopeReadOnly` rejects unsafe boundary flags, executable content, DB/retrieval execution, prompt compilation, prompt mutation, official analysis rerun, package eligibility mutation, source-of-truth mutation, or unrestricted raw evidence execution.
4. Proof scripts verify before/after persistence state for relevant tables/repositories.
5. Static import checks confirm no provider/prompt compilation/runtime/chat imports are introduced.

## 10. Recommended Build Order

### Slice 1 - Prompt Studio Read-Only Context Plan Closure

- Purpose: confirm exact Prompt Studio context scope and read model inputs before code.
- Files/packages likely touched: handoff docs only.
- Produces: final pilot spec for Prompt Studio context.
- Must not do: code, routes, UI, providers, prompt compilation, prompt mutation.
- Proof strategy: no build required unless code is changed.
- Risk level: low.

### Slice 2 - Prompt Studio Context Fixture Proof

- Purpose: prove a deterministic Prompt Studio context envelope can represent prompt refs, instruction refs, taxonomy refs, warnings, and audit refs.
- Files/packages likely touched: `packages/stage-copilot/src/*` only if local helper types are needed; proof script under `scripts/`.
- Produces: static fixture/proof for Prompt Studio context envelope.
- Must not do: import `packages/prompts`, read repositories, compile prompts, call providers, modify UI/API.
- Proof strategy: envelope safety proof, unknown executable-content rejection, no-write/no-provider/no-prompt-compile assertions.
- Risk level: low.

### Slice 3 - Prompt Studio Stage Read Model Plan

- Purpose: decide whether the first live read model should live in `packages/prompts`, `packages/stage-copilot`, or a narrow adapter.
- Files/packages likely touched: handoff docs only.
- Produces: implementation plan for a read-only Prompt Studio read model.
- Must not do: code or PromptSpec mutation.
- Proof strategy: no build required unless code is changed.
- Risk level: low.

### Slice 4 - Prompt Studio Read-Only Projection Helper

- Purpose: create the first actual read-only projection over prompt/instruction metadata.
- Files/packages likely touched: likely `packages/prompts` for Capability PromptSpec read-only projection and/or `packages/stage-copilot` for normalization; exact scope should be approved separately.
- Produces: display/context-safe prompt metadata, not compiled prompts.
- Must not do: compile prompts, run tests, promote/archive PromptSpecs, change prompt keys, mutate repositories, call providers.
- Proof strategy: no key rename checks, no repository writes, no provider imports, no compile/test imports, existing Stage Copilot and PromptSpec proofs.
- Risk level: medium.

### Slice 5 - Sources / Context Read-Only Context Plan

- Purpose: define first case/session-scoped source context read model after Prompt Studio is proven.
- Files/packages likely touched: handoff docs only.
- Produces: stage-specific source/context pilot plan.
- Must not do: retrieval, provider extraction, source mutation, structured context mutation.
- Proof strategy: no build required unless code is changed.
- Risk level: medium.

## 11. Proof Strategy

Future implementation should run targeted proof plus existing guard rails:

- context assembly is read-only:
  - use read-only facades or fixture inputs
  - assert no repository write methods are called
  - compare row counts before/after where repositories are involved

- context envelope guards are used:
  - call `createStageCopilotContextEnvelope`
  - prove unsafe boundary flags are rejected
  - prove executable function/callback content is rejected

- no DB writes:
  - temporary DB table diffs for involved repositories
  - no inserts/updates outside expected proof fixtures

- no provider calls:
  - static import scans
  - provider traps/mocks if any provider package could be reachable

- no prompt compilation:
  - static import scans for `compile*Prompt*`
  - no prompt test execution helpers imported

- no prompt mutations:
  - no writes to `structured_prompt_specs`
  - no writes to Pass 6 PromptSpec records
  - no PromptSpec lifecycle status changes

- no official analysis rerun:
  - no calls to extraction, clarification, answer recheck, synthesis, difference interpretation, readiness, gate, package, or visual generation helpers

- no runtime/chat behavior:
  - no chat route, provider-backed endpoint, model selector, stream handler, or runtime transcript persistence

- existing proof stack:
  - Stage Copilot Instructions proof stack should continue to pass.
  - Relevant Pass 5 proof scripts should pass for participant-evidence-adjacent work.
  - Relevant Pass 6 proof scripts should pass for analysis/package-adjacent work.

## 12. Risks, Open Questions, and Required Decisions

Critical risks:

- Accidentally calling a stage capability helper that writes records or runs providers while “assembling context.”
- Passing full repositories or mutable records into the envelope.
- Letting a Copilot discuss readiness/package eligibility in a way that sounds like an official decision.
- Mixing Stage Copilot Instructions with Capability / Analysis PromptSpecs.

Non-critical risks:

- Overly generic context shape may lose stage-specific nuance.
- Too much raw evidence may increase privacy/sensitivity risk.
- Prompt Studio context may still confuse admins if labels do not consistently separate analysis prompts from Copilot instructions.
- Proof burden grows quickly if the first pilot starts with participant evidence or analysis/package context.

Required operator decisions:

- Confirm Prompt Studio Copilot context as the first pilot.
- Decide whether Prompt Studio read-only projection may later live in `packages/prompts` or must remain static in `packages/stage-copilot` first.
- Decide whether first live context API should be route-based or service-only after fixture proof.

Deferred items:

- provider-backed runtime/chat
- retrieval/RAG/vector search
- live semantic search
- participant evidence raw transcript access policy
- runtime message persistence
- routed action execution
- package/release decision support beyond advisory discussion

## 13. Final Recommendation

Proceed with **Prompt Studio Copilot read-only context** as the first pilot, starting with a static fixture/proof slice before any live registry or repository projection.

Keep the ownership model hybrid:

- stage packages own stage-specific read models;
- `packages/stage-copilot` owns envelope normalization and guard enforcement;
- admin-web remains a thin consumer;
- `packages/prompts` remains the owner of Capability / Analysis PromptSpecs and must not be mutated by Copilot context assembly.

Do not build runtime/chat, retrieval, provider execution, prompt compilation, or any Pass 5/6 analysis behavior in the next slice.
