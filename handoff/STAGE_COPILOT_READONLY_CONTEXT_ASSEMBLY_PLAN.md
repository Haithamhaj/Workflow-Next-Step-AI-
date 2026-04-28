# Stage Copilot Read-Only Context Assembly Plan

## 1. Executive Summary

The codebase is ready to plan read-only Stage Copilot context assembly, but not ready to implement a live context assembler that reads repositories directly. The current `@workflow/stage-copilot` package is intentionally small and safe: it imports only Stage Copilot contract types and exposes pure boundary guards for no-write behavior, forbidden action detection, routed recommendation safety, advisory what-if labeling, runtime mode safety, provider execution prohibition, prompt mutation prohibition, analysis record mutation prohibition, and package eligibility mutation prohibition.

The safest next architecture is a hybrid model:

- Stage/domain packages remain the owners of official analysis truth and later expose narrow read-only stage read models.
- `packages/stage-copilot` validates, normalizes, and guards already-scoped context inputs, but does not own official analysis execution, DB access, provider execution, PromptSpecs, retrieval, or business logic.
- Context bundles contain references, summaries, IDs, evidence anchors, and provenance metadata. They do not contain writable repository handles, mutable records with write authority, provider execution paths, prompt mutation authority, or package eligibility authority.

The primary risk is accidental coupling to existing mixed read/write repositories or old Copilot-like runtimes. Many repository interfaces in `packages/persistence` expose both read and write methods, and many stage packages expose capability functions that save records or run providers. Future context assembly must use read-only facades or precomputed read models, not full repositories or capability runtime functions.

The recommended first implementation after this plan is not a stage-specific assembler. It should be a small local type/proof slice in `packages/stage-copilot` for a generic read-only context bundle envelope and boundary checks over deterministic fixtures. Prompt Studio context is the safest first real pilot after that because it can start with prompt/taxonomy metadata and does not need to inspect participant evidence or mutate analysis outputs.

## 2. Context Assembly Definition

A Stage Copilot Context Bundle is a read-only, stage-scoped conversation input package. It gives a future Stage Copilot enough structured information to discuss the active stage as a decision-support partner without becoming the owner of official analysis behavior.

It should include:

- Stage System Knowledge references: stage purpose, boundaries, contracts, gates, allowed actions, forbidden actions, relevant Capability PromptSpecs, relevant Stage Copilot PromptSpec, proof/validation logic, and known workflow steps.
- Stage Case Data Context references: scoped case/company/stage IDs, current stage status, read-only stage state, blockers, warnings, admin-visible decisions, and selected official outputs.
- Relevant prompt references: Capability PromptSpec references and Stage Copilot PromptSpec references as references only.
- Relevant evidence/source references: source IDs, transcript refs, participant answer refs, raw evidence refs, synthesis/evaluation refs, package refs, and evidence anchors.
- Retrieval/data access declarations: future direct ID lookup, evidence-anchor lookup, scoped keyword lookup, hybrid lookup, or semantic/vector lookup declarations only.
- Audit/context source references: which read model, source record, evidence anchor, prompt ref, or stage package produced each summary.

It must not include:

- Full repository objects with `save`, `update`, approval, transition, or provider-run methods.
- Mutable records by reference where the Copilot path can write back.
- Direct provider execution functions.
- Direct official analysis execution functions.
- Prompt compile, prompt test, prompt promotion, or prompt mutation authority.
- Package generation, readiness mutation, package eligibility mutation, or gate approval authority.
- Old Pass 5 or Pass 6 Copilot runtime request/response objects as authoritative future shapes.

The context bundle is conversation input, not business logic. It can support explanation, challenge, alternative discussion, and advisory what-if reasoning, but it cannot change the source-of-truth records it discusses.

## 3. Ownership Options

### Option A - Context assembly inside `packages/stage-copilot`

This would put stage context assemblers directly in the new package.

- Dependency direction: `packages/stage-copilot` would need to import stage packages and possibly persistence interfaces.
- Risk level: high.
- Compatibility risk: high, because the package could drift into owning stage business logic or importing mixed read/write repositories.
- Proof strategy: strict import-deny checks, no-write repository fakes, no provider/import scans, existing Pass 5/6 proof runs.
- Why not use now: it would make the boundary package too powerful too early and increase the chance of coupling to analysis execution paths.

### Option B - Context assembly inside each stage package

Each stage package would expose its own read-only context bundle builder.

- Dependency direction: stage packages depend on their existing domain models and persistence interfaces; `packages/stage-copilot` consumes outputs.
- Risk level: medium.
- Compatibility risk: medium, because stage packages understand their truth but may accidentally reuse mutating capability functions.
- Proof strategy: per-stage read-only tests, repository facades with no write methods, no provider-call assertions, before/after record count checks.
- Why not use alone: it can lead to inconsistent bundle shapes and duplicate Stage Copilot boundary logic across stage packages.

### Option C - Hybrid: stage packages expose read models, `packages/stage-copilot` normalizes

Stage packages expose narrow read-only projections or read-model inputs. `packages/stage-copilot` validates boundary safety, normalizes context envelopes, labels advisory sections, and enforces no-write/no-provider/no-analysis-rerun constraints.

- Dependency direction: stage packages produce data; `packages/stage-copilot` consumes typed read-only inputs and contract refs.
- Risk level: low to medium.
- Compatibility risk: low if the boundary package never imports official capability execution functions or persistence implementations directly.
- Proof strategy: deterministic fixture outputs, import-deny checks, no-write facade checks, boundary guard proof, existing analysis proof scripts.
- Why use: it keeps analysis truth with stage owners while giving Stage Copilot a consistent, isolated context shape.

### Option D - Future API/app layer only

The app/API layer would assemble context directly for a future dock/runtime.

- Dependency direction: app imports many domain packages and repositories.
- Risk level: high.
- Compatibility risk: high, because UI/API code can become the place where business logic and Copilot behavior mix.
- Proof strategy: route-level tests, no-write DB assertions, provider-call mocks, visual/API regression checks.
- Why not use now: it would skip package-level safety and make non-interference harder to prove.

## 4. Recommended Ownership Model

Use Option C.

Stage packages should own stage-specific read truth because they already own the official data and capability outputs:

- `packages/sources-context` owns source/intake/crawl/structured context and pre-hierarchy readiness truth.
- `packages/hierarchy-intake` owns hierarchy intakes, manual drafts, source-to-hierarchy triage suggestions, and hierarchy readiness snapshots.
- `packages/targeting-rollout` owns targeting plans, candidate decisions, participant contact profiles, and question-hint seeds.
- `packages/participant-sessions` owns participant sessions, transcript evidence review, raw evidence, extraction outputs, clarification candidates, answers, rechecks, disputes, boundary signals, and Pass 6 handoff candidates.
- `packages/synthesis-evaluation` owns synthesis input bundles, workflow units/claims, method usage, difference interpretation, assembled workflow drafts, readiness, gates, inquiry packets, external interfaces, and Pass 7 review candidates.
- `packages/packages-output` owns initial package output, final package output, workflow graph output, visuals, and package-related artifacts.
- `packages/prompts` owns PromptSpecs, compile/test/promotion behavior, prompt lifecycle, and prompt workspace behavior.

`packages/stage-copilot` should not import these packages' mutating capability functions directly. Its role should be:

- Define or consume local read-only context envelope types later.
- Validate that the envelope follows Stage Copilot profile boundaries.
- Normalize references into a shared conversation-safe shape.
- Label advisory what-if sections as non-official.
- Reject any context assembly intent that implies writes, provider calls, prompt mutation, official analysis reruns, package generation, readiness changes, or package eligibility changes.

This model avoids duplicating analysis logic and avoids elevating old Copilot-like runtimes into strategic foundations.

## 5. Read-Only Data Source Strategy

Future context assembly should treat all data access as scoped, auditable, and non-executable from the Copilot's perspective.

Safe reference forms:

- DB/repository records: read through narrow facades or precomputed read models, never through full mixed read/write repositories.
- Scoped record IDs: case ID, company ID, source ID, hierarchy node ID, targeting plan ID, participant session ID, evidence ID, clarification candidate ID, synthesis bundle ID, readiness result ID, package ID, prompt spec ID, prompt test result ID.
- Evidence anchors: stable pointers to source text, transcript segments, raw evidence excerpts, answer spans, synthesis claims, difference interpretations, and package caveats.
- Source snippets: short excerpts with source IDs and extraction provenance, not full documents unless a future evidence policy allows raw access.
- Transcript refs: participant/session/transcript segment refs, not approval authority.
- Participant answer refs: answer IDs, question IDs, recheck status, uncertainty markers, and dispute refs.
- Synthesis/evaluation refs: workflow unit IDs, claim IDs, method usage IDs, difference interpretation IDs, readiness result IDs, gate IDs, package caveat refs.
- Prompt/test result refs: prompt spec IDs, lifecycle/status labels, test case/result IDs, and taxonomy classification refs.
- Retrieval/search refs: declarative retrieval scope references only until a retrieval seam is implemented.
- Hybrid data access declarations: profile-level declarations such as DB-only, anchor-based, retrieval-only, hybrid DB plus retrieval, or future semantic lookup.

Unsafe forms:

- Repositories with write methods.
- Capability provider functions.
- Prompt compile/test/promotion functions.
- Stage transition functions.
- Approval functions.
- Package generation functions.
- Old Pass 5/6 Copilot runtime context builders as future authorities.

## 6. Stage-by-Stage Context Needs

### Sources / Context

May read:

- Registered sources, source type/trust/status summaries, intake sessions, intake sources, extracted text refs, crawl session/page refs, crawl content chunk refs, structured context summaries, department framing, primary department/use-case selections, pre-hierarchy readiness/review refs.

Must not mutate:

- Source registration, intake status, extracted text, crawl page approvals, crawl status, structured context, department framing, final pre-hierarchy review confirmation, crawl plan approval, audio transcript review approval.

Official outputs it may discuss:

- Source role/scope suggestions, structured context, available material summaries, pre-hierarchy readiness, limited-value/context-only source rationale.

Risks:

- Source/context package exposes mutating functions such as `updateIntakeSourceStatus`, `updateIntakeSourceExtractedText`, `approveCrawlPages`, `setStructuredContext`, `saveDepartmentFraming`, and `confirmFinalPreHierarchyReview`. Future context assembly must avoid these paths.

### Hierarchy

May read:

- Hierarchy foundation state, pasted/uploaded/manual hierarchy intake refs, hierarchy node refs, source-to-hierarchy triage suggestions, source hierarchy links, readiness snapshots, admin corrections, structural review status.

Must not mutate:

- Pasted/uploaded/manual intake creation, manual draft saves, source hierarchy link creation, triage suggestion updates, structural hierarchy approval.

Official outputs it may discuss:

- Hierarchy drafts, role/source relationships, reporting/interface confidence, inferred vs confirmed structure, readiness blockers.

Risks:

- Functions such as `createPastedHierarchyIntake`, `saveManualHierarchyDraft`, `updateSourceHierarchyTriageSuggestion`, and `approveStructuralHierarchy` must not be reachable from Copilot context assembly.

### Targeting

May read:

- Targeting rollout plan refs, participant candidate summaries, candidate status, contact completeness, question-hint seed refs, targeting recommendation packet refs, rollout state, suggested order/rationale.

Must not mutate:

- Candidate decisions, participant contact profiles, question-hint seeds, targeting plan transitions, rollout plan creation if it writes.

Official outputs it may discuss:

- Targeting recommendations, participant selection rationale, supervisor vs frontline trade-offs, question-hint origin, contact-data gaps.

Risks:

- `createOrLoadTargetingRolloutPlan` may write if a plan is missing. Future read-only assembly should require an existing plan ID or a read-only getter, not create-on-read behavior.

### Participant Evidence

May read:

- Participant session refs, channel/session state, transcript/evidence review refs, raw evidence refs, extraction output refs, clarification candidates, clarification answers, answer recheck refs, boundary signals, evidence disputes, next actions, Pass 6 handoff candidate refs.

Must not mutate:

- Session creation, message submission, Telegram handlers, transcript evidence creation/approval/rejection, extraction execution, clarification formulation, asking/dismissing candidates, answer recording, answer recheck execution, boundary signal creation, Pass 6 handoff candidate creation/decision.

Official outputs it may discuss:

- What the participant actually said, evidence extraction basis, clarification gaps, disputed evidence, boundary signals, handoff readiness, next question rationale.

Risks:

- This stage has the highest write/provider density. `runFirstPassExtractionForSession`, `formulateClarificationQuestion`, and `runClarificationAnswerRecheck` compile prompts, call providers, save provider jobs, and write analysis records. Context assembly must read outputs only.

### Analysis / Package

May read:

- Pass 6 handoff candidate refs, synthesis input bundle refs, workflow units/claims, method usage refs, difference interpretation refs, assembled workflow draft refs, readiness results, pre-package gate refs, inquiry packet refs, external interface refs, initial/final package refs, workflow graph/visual refs, package caveats, Pass 7 candidate refs.

Must not mutate:

- Synthesis input bundle creation, synthesis creation, Pass 6 configuration updates/promotions, method registry changes, workflow unit/claim generation, difference interpretation, draft assembly, readiness evaluation, pre-6C gate execution, external interface registration, Pass 7 candidate creation, evaluation creation, package generation, package visual generation, final package updates.

Official outputs it may discuss:

- Method/lens selection, readiness blockers, warnings, caveats, package eligibility, evidence basis, difference interpretation, workflow boundary effects, advisory what-if alternatives.

Risks:

- This stage is closest to official package authority. Context assembly must not call `buildWorkflowUnitsAndClaimsFromBundle`, `interpretWorkflowClaimDifferences`, `evaluateWorkflowReadinessFromDraft`, `runPre6CGateFromReadiness`, or `generatePass6Output`.

### Prompt Studio

May read:

- PromptSpec refs, taxonomy classification refs, lifecycle/status labels, draft/active/previous/archived refs, prompt test result refs, compiled preview refs if already stored or produced by an existing safe view, Stage Copilot PromptSpec refs, Capability PromptSpec refs.

Must not mutate:

- Prompt drafts, active promotion, archival, rollback, compile/test execution, provider-backed prompt tests, PromptSpec keys, prompt families.

Official outputs it may discuss:

- Difference between Capability PromptSpecs and Stage Copilot PromptSpecs, taxonomy status, why a prompt test failed if result data already exists, what changing a Copilot prompt changes vs does not change.

Risks:

- Prompt compile/test paths in `packages/prompts` are runtime-adjacent and may call providers. Prompt Studio context should start from static taxonomy and stored/test-result references, not live compilation.

### Advanced / Debug

May read:

- Provider job refs, proof output refs, route/action ownership refs, debug-only diagnostics, contract/schema validation refs, audit refs, non-sensitive failure summaries.

Must not mutate:

- Provider jobs, replay behavior, persistence, route execution, official analysis records, proof baselines, prompt/provider settings.

Official outputs it may discuss:

- Whether a failure is provider, persistence, contract, route, or business-logic related; which route owns an action; whether an output is debug-only or domain-authoritative.

Risks:

- Debug context can expose raw sensitive data or accidentally give the Copilot operational authority. It should remain internal and deferred until evidence/security policy is mature.

## 7. Analysis Engine Protection

Future context assembly must not rerun, mutate, approve, transition, or own these analysis flows:

- Source-role and source-scope suggestions.
- Source/context extraction and structured context formation.
- Hierarchy drafting, hierarchy intake creation, source-to-hierarchy triage, and structural hierarchy approval.
- Targeting recommendation packets, participant candidate decisions, contact profile updates, rollout transitions, and question-hint seed updates.
- Evidence extraction, raw evidence review, transcript approval/rejection, clarification question formulation, clarification answer recording, answer recheck, evidence disputes, boundary signals, and Pass 6 handoff decisions.
- Synthesis input bundle creation, synthesis, workflow unit/claim generation, analysis method selection/use, difference interpretation, assembled workflow drafts, readiness evaluation, pre-package gate execution, external interface registration, inquiry packet creation, and evaluation.
- Package drafting/generation, package visuals, workflow graph generation, final package creation/update, Pass 7 candidate creation, and package/release authority.
- Capability PromptSpec creation, compile, test, promotion, archival, rollback, active/draft lifecycle changes, and key/family changes.

The Copilot may explain these outputs and discuss alternatives using read-only references. It must never become the execution path that creates or changes them.

## 8. Context Bundle Contract Strategy

Do not add concrete stage-specific context bundle contracts next.

Recommended next step:

- Add local package-level generic context bundle types in `packages/stage-copilot` only after this report is accepted.
- Keep them small and read-only: bundle ID, stage key, profile ref, system knowledge refs, case context refs, source refs, evidence refs, prompt refs, advisory sections, retrieval/data access declarations, and audit refs.
- Use existing `StageCopilotProfile` contract refs rather than creating `SourcesCopilotContextBundle`, `HierarchyCopilotContextBundle`, `TargetingCopilotContextBundle`, `ParticipantEvidenceCopilotContextBundle`, `AnalysisPackageCopilotContextBundle`, `PromptStudioCopilotContextBundle`, or `AdvancedDebugCopilotContextBundle` schemas now.

Defer:

- Stage-specific context bundle schemas in `packages/contracts`.
- DB/repository assembly implementations.
- Retrieval/search/semantic interfaces.
- Prompt registry live projection.
- UI/API request/response contracts.
- Provider-backed Stage Copilot runtime contracts.

Reason:

The repository already has broad, mixed read/write persistence interfaces and many mutating capability functions. A generic local envelope plus proof fixtures lets the team prove no-write/non-interference before connecting real stage data.

## 9. First Context Assembly Pilot Recommendation

### Prompt Studio Copilot context

- Value: medium to high. It explains PromptSpec taxonomy, lifecycle, current vs legacy/copilot-like classification, and prompt test result refs.
- Risk to analysis engine: low if it avoids compile/test/promotion.
- Dependencies: existing Stage Copilot taxonomy fixtures and prompt metadata refs.
- Proof difficulty: low to medium.
- Recommendation: first real context assembly pilot after generic context envelope proof.

### Sources / Context Copilot context

- Value: high. It helps admins understand source value, source roles, document origin, and pre-hierarchy readiness.
- Risk to analysis engine: medium because source/intake/crawl packages expose write and approval functions.
- Dependencies: read-only source/intake/crawl/structured context projections.
- Proof difficulty: medium.
- Recommendation: second pilot after read-only facade pattern is proven.

### Participant Evidence Copilot context

- Value: very high. It can explain what participants actually said, evidence gaps, disputes, and clarifications.
- Risk to analysis engine: high because extraction/clarification/recheck functions call providers and write records.
- Dependencies: evidence access policy, anchored evidence refs, raw evidence restrictions, read-only participant session projections.
- Proof difficulty: high.
- Recommendation: defer until source/context and generic evidence-anchor patterns are proven.

### Analysis / Package Copilot context

- Value: very high. It can explain method/lens choices, readiness blockers, package caveats, and what-if alternatives.
- Risk to analysis engine: highest because this stage is close to official package generation and eligibility.
- Dependencies: mature read-only Pass 6 projections, strict advisory labeling, no package authority proof, evidence/citation strategy.
- Proof difficulty: high.
- Recommendation: defer until read-only context and advisory-only proofs are strong.

## 10. Recommended Build Order

### Slice 1 - Generic read-only context envelope in `packages/stage-copilot`

- Purpose: define a small local envelope for context refs and advisory sections.
- Files/packages likely touched: `packages/stage-copilot/src/*`, proof script under `scripts/`.
- Produces: generic local context types and pure validation helpers.
- Must not do: DB access, retrieval, APIs, providers, PromptSpec changes, stage-specific schemas.
- Proof strategy: deterministic fixtures, frozen inputs, no-write/no-provider/no-analysis-rerun checks.
- Risk level: low.

### Slice 2 - Context boundary proof fixtures

- Purpose: prove unsafe context inputs are rejected.
- Files/packages likely touched: `packages/stage-copilot/src/*`, `scripts/prove-stage-copilot-readonly-context-boundary.mjs`.
- Produces: proof for no repository write handles, no execution intents, no prompt mutation authority, no package eligibility authority.
- Must not do: import stage packages or persistence.
- Proof strategy: fixture-only proof plus import summary.
- Risk level: low.

### Slice 3 - Prompt Studio static context pilot

- Purpose: assemble a read-only Prompt Studio context from static taxonomy and prompt refs.
- Files/packages likely touched: likely `packages/stage-copilot` first; possibly contracts only if a later operator decision requires shared schemas.
- Produces: display/conversation-safe prompt taxonomy context.
- Must not do: import `packages/prompts` compile/test functions, promote prompts, modify PromptSpecs, run providers.
- Proof strategy: key preservation, no compile/provider imports, legacy/current labels, unknown/unclassified labels.
- Risk level: low to medium.

### Slice 4 - Sources / Context read-model plan or facade

- Purpose: define a narrow read-only source/context projection owned by `packages/sources-context`.
- Files/packages likely touched: future `packages/sources-context` read-model files and `packages/stage-copilot` normalization.
- Produces: source/intake/crawl/structured-context refs and summaries.
- Must not do: crawl, extract, approve pages, set structured context, confirm reviews.
- Proof strategy: read-only facade tests, before/after repository snapshots, no provider calls.
- Risk level: medium.

### Slice 5 - Stage package read-model interface pattern

- Purpose: repeat a consistent read-only facade pattern for hierarchy, targeting, participant evidence, and analysis/package stages.
- Files/packages likely touched: relevant stage packages plus `packages/stage-copilot`.
- Produces: stage-owned projections that can be normalized without sharing write authority.
- Must not do: execute capability functions or mutate records.
- Proof strategy: per-stage import-deny and no-write proofs.
- Risk level: medium.

### Slice 6 - Evidence anchor and retrieval seam design

- Purpose: define how original text/evidence can be referenced and retrieved later.
- Files/packages likely touched: planning/contracts only at first, then stage packages when approved.
- Produces: anchor/ref strategy, not retrieval execution.
- Must not do: keyword search, vector search, RAG, DB/retrieval APIs.
- Proof strategy: anchor fixtures and access-policy validation.
- Risk level: medium.

### Slice 7 - Shared dock/API/runtime after package proofs

- Purpose: connect context bundles to a future Stage Copilot conversation surface.
- Files/packages likely touched: app/API/UI packages after explicit approval.
- Produces: runtime integration.
- Must not do initially: provider-backed chat without context/refusal/action boundaries.
- Proof strategy: visual baseline, route no-write tests, provider gating, audit validation.
- Risk level: high.

## 11. Proof Strategy

Future context assembly proof should establish non-interference before any provider-backed Copilot is built.

Required proof classes:

- Read-only behavior: context assembly uses immutable fixtures or read-only facades; no `save`, `update`, approval, transition, promotion, or package generation methods are available.
- No DB writes: before/after record counts or write-method spies for any future in-memory repository proof.
- No provider calls: provider registry/integration imports are absent, and provider-call fakes are not invoked.
- No prompt compilation: prompt compile/test/promotion functions are not imported or called.
- No prompt mutation: PromptSpec keys/families/lifecycle records remain unchanged.
- No official analysis reruns: protected functions for extraction, clarification, answer recheck, synthesis, difference interpretation, evaluation, readiness, and package drafting are not imported or called.
- No old runtime imports: future proofs should reject imports from old Pass 5 assistant and Pass 6 Copilot runtime paths.
- Boundary guard use: `@workflow/stage-copilot` guards are applied to profile/read-write/action/recommendation inputs.
- Deterministic fixture output: same input refs produce same context envelope without side effects.
- Existing proofs still pass: contracts proof, static taxonomy proof, Stage Copilot foundation package proof, and relevant Pass 5/Pass 6 analysis proofs.
- Import summary: proof scripts should visibly state imports are limited to contracts, the stage-copilot package, and deterministic fixtures for the slice under test.

## 12. Risks, Open Questions, and Required Decisions

Critical risks:

- Passing full mixed read/write repositories into context assembly.
- Reusing old Pass 5 admin assistant or Pass 6 Copilot context builders as future architecture authority.
- Calling create/load functions that write when data is missing.
- Letting advisory what-if output change readiness, package eligibility, official analysis results, or package output.
- Allowing context assembly to compile prompts, run prompt tests, or call providers.
- Exposing restricted raw participant data before evidence access policy and anchors are implemented.

Non-critical risks:

- Duplicating summary logic across stage packages before a common envelope exists.
- Creating too many stage-specific schemas before the first read-only proof.
- Over-labeling legacy prompt or Copilot references as migrated/runtime-ready.

Required operator decisions:

- Whether the next implementation should define generic local context envelope types in `packages/stage-copilot` before any stage package read model work.
- Whether Prompt Studio context is accepted as the first real read-only context pilot.
- Whether stage packages should expose read-only facades directly, or whether the app layer should provide pre-scoped data to stage-copilot helpers.
- Which evidence classes require summary-only access vs anchored/raw access in future participant and analysis contexts.

Deferred items:

- Retrieval/search implementation.
- Vector/semantic retrieval.
- Stage-specific context bundle schemas.
- Provider-backed Stage Copilot runtime.
- Shared dock UI.
- APIs and persistence for Copilot interactions.
- Old Copilot runtime migration or deprecation.

## 13. Final Recommendation

Build the next slice as a small `packages/stage-copilot` generic read-only context envelope and fixture proof. It should prove context bundles can carry stage system knowledge refs, case data refs, prompt refs, evidence refs, retrieval/data access declarations, and advisory sections while rejecting write authority, provider execution, prompt mutation, official analysis reruns, package eligibility changes, and package generation.

Do not start with Pass 5 or Pass 6 context assembly. Do not import old Copilot runtimes. Do not connect DB repositories, retrieval, providers, APIs, or UI yet.

After the generic envelope proof, pilot read-only context assembly with Prompt Studio context first, then Sources / Context. Defer Participant Evidence and Analysis / Package contexts until the read-only facade pattern, evidence-anchor policy, and advisory-only boundaries are proven.
