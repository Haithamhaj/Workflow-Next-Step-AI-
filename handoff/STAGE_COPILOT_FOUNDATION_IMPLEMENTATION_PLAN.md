# Stage Copilot Foundation Implementation Plan - Code-Aware Review

No-code planning report only. No contracts, APIs, routes, components, packages, PromptSpecs, providers, retrieval, runtime behavior, workspace UI, persistence, or business logic were changed.

Branch: `codex/workspace-shell-sandbox`  
Starting commit: `0dbd96456b3d65955fc48cb3a10f02b43fa2e6df`  
Related reports:

- `handoff/WORKSPACE_COPILOT_INVENTORY_AND_INTEGRATION_PLAN.md`
- `handoff/STAGE_COPILOT_FOUNDATION_ARCHITECTURE_AND_BUILD_ORDER.md`

## A. Executive Summary

The codebase is ready for a **foundation contracts/design slice**, but not for a live shared Copilot runtime. The repository already has mature patterns for contract-first work: TypeScript types in `packages/contracts/src/types`, Draft-07 schemas in `packages/contracts/src/schemas`, validators exported from `packages/contracts/src/index.ts`, proof scripts in `scripts/`, and stage packages that consume contracts without owning global product shape.

What already exists and should be reused:

- `packages/contracts` as the source of truth for cross-package shapes.
- Draft-07 schema conventions with `additionalProperties: false`, required field lists, enum fields, and `makeValidator<T>`.
- Prompt lifecycle patterns: `draft`, `active`, `previous`, `archived`.
- Pass 5 Admin Assistant patterns: bounded context bundle, permission scope, deterministic fallback, provider-job record, no-mutation answer, routed admin action suggestions.
- Pass 6 Copilot patterns: explicit context bundle contract, persisted context/interaction records, read-only boundary, routed recommendations with `executesAutomatically: false`, provider-gated runtime.
- Pass 2-4 capability helper patterns: source-role/source-scope suggestions, structured context, hierarchy draft/triage, targeting recommendation packets, question-hint seeds.
- Workspace shell structure with accepted visual baseline and a clear future insertion surface, but no need to touch it now.

Main risks:

- Duplicating Pass 5/6 assistant types instead of introducing a thin shared foundation.
- Treating existing capability PromptSpecs as Stage Copilot PromptSpecs.
- Putting runtime behavior into `packages/prompts` before the cross-stage profile/context/refusal/retrieval model is stable.
- Starting with Pass 6-specific structures that do not generalize to Sources, Hierarchy, Targeting, Evidence, Prompt Studio, and Advanced/Debug.
- Overbuilding schemas, persistence, retrieval, or UI before the foundation vocabulary is accepted.

What should be built first after this report is accepted:

**Stage Copilot Foundation Contracts / Design Layer in `packages/contracts` only**, with minimal TypeScript + Draft-07 schema artifacts, validator exports, and proof fixtures. It should define the shared vocabulary for stage keys, profiles, runtime modes, references, conversational behavior, advisory mode, retrieval scopes, refusal policy, routed recommendation base shape, forbidden actions, read/write boundaries, and evidence access policy. It must not create runtime behavior.

## B. Codebase Findings By Area

### 1. Contracts

Files/packages inspected:

- `packages/contracts/src/types/prompt-spec.ts`
- `packages/contracts/src/types/provider-jobs.ts`
- `packages/contracts/src/types/participant-session.ts`
- `packages/contracts/src/types/pass6-core.ts`
- `packages/contracts/src/types/index.ts`
- `packages/contracts/src/schemas/prompt-spec.schema.json`
- `packages/contracts/src/schemas/pass6-core.schema.json`
- `packages/contracts/src/schemas/index.ts`
- `packages/contracts/src/validate.ts`
- `packages/contracts/src/index.ts`

Relevant patterns found:

- Contracts use paired TypeScript types and JSON schemas.
- Schemas use Draft-07 `$schema`, local `$id`, strict `additionalProperties: false`, explicit `required`, and string enums.
- Validators are created with `makeValidator<T>(schema)` and exported as `validateX`.
- Schema aggregation happens in `packages/contracts/src/schemas/index.ts`.
- Type aggregation happens in `packages/contracts/src/types/index.ts`.
- Package root exports types, schemas, and validators from `packages/contracts/src/index.ts`.
- Pass 5 nested schemas are exposed by wrapping definitions from `participant-session.schema.json`.
- Pass 6 nested schemas are exposed by wrapping definitions from `pass6-core.schema.json`, including `Pass6CopilotContextBundle` and `Pass6CopilotInteraction`.

Reusable pieces:

- Use `packages/contracts` for cross-stage Stage Copilot foundation contracts.
- Follow the existing type/schema/validator/export pattern.
- Reuse naming style: `StageCopilotProfile`, `StageCopilotRuntimeMode`, `validateStageCopilotProfile`, `stage-copilot-profile.schema.json`.
- Reuse reference-style fields from Pass 6 rather than embedding full records in the foundation.

Risks:

- A large single schema with every future context bundle would overfit too early.
- Reusing `Pass6CopilotContextBundle` directly would make the foundation Pass 6-shaped.
- Moving Pass 5 `AdminAssistantContextBundle` into contracts now would be too broad and risky.

Must not be changed yet:

- Existing Pass 5 participant-session contracts.
- Existing Pass 6 core contracts.
- Existing PromptSpec schemas.
- Existing validators for Pass 3/4/5/6.
- Existing provider job contracts.

### 2. PromptOps / PromptSpecs

Files/packages inspected:

- `packages/prompts/src/index.ts`
- `packages/contracts/src/types/prompt-spec.ts`
- `packages/contracts/src/schemas/prompt-spec.schema.json`
- `packages/contracts/src/types/pass6-prompt-workspace.ts`
- `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json`

Relevant patterns found:

- `packages/prompts` currently centralizes prompt registration, default PromptSpecs, compilation, and prompt test helpers.
- `StructuredPromptSpec` has `linkedModule`, `purpose`, `status`, `version`, editable blocks, `inputContractRef`, and `outputContractRef`.
- Prompt lifecycle is already represented as `draft | active | previous | archived`.
- Pass 3 uses `pass3.hierarchy.draft` and `pass3.source_hierarchy.triage`.
- Pass 4 uses `pass4.targeting_rollout.packet`.
- Pass 5 has a prompt family with a base governance prompt plus capability prompts, including `admin_assistant_prompt`.
- Pass 6 prompt workspace has capability keys including `pass6_analysis_copilot`.
- `pass6_analysis_copilot` is already mixed into the Pass 6 capability-key list, even though product direction now wants an explicit distinction between Capability PromptSpecs and Stage Copilot PromptSpecs.

Reusable pieces:

- Prompt lifecycle/status model.
- Structured section/block style.
- `inputContractRef` / `outputContractRef` reference pattern.
- Existing Pass 5 and Pass 6 copilot-like prompts as later migration inputs.

Risks:

- Adding taxonomy directly to `packages/prompts` first could force runtime behavior before foundation contracts exist.
- Renaming existing capability keys would break PromptOps/proof scripts.
- Treating `admin_assistant_prompt` and `pass6_analysis_copilot` as final shared patterns would hide stage-specific assumptions.

Must not be changed yet:

- Existing PromptSpec keys.
- `PASS6_PROMPT_CAPABILITY_KEYS`.
- `PASS5_PROMPT_FAMILY`.
- Prompt compilation behavior.
- Prompt test/result handling.
- Active/draft/previous/archive behavior.

### 3. Pass 5 Assistant

Files/packages inspected:

- `packages/participant-sessions/src/index.ts`
- `apps/admin-web/app/api/participant-sessions/assistant/route.ts`
- `packages/prompts/src/index.ts`
- `scripts/prove-pass5-block12-admin-assistant.mjs`
- `scripts/prove-pass5-block12-stage-aware-copilot.mjs`
- `scripts/prove-pass5-block14-full-live.mjs`
- `scripts/prove-pass5-complex-scenario-logistics-onboarding.mjs`

Relevant patterns found:

- `AdminAssistantContextBundle` is DB-first and scoped by `current_session`, `selected_sessions`, `case_pass5`, or `targeted_records`.
- The context bundle includes structured records, evidence snippets, retrieved chunks, excluded-record reasons, data freshness, permission scope, and prompt version.
- `classifyAdminAssistantQuestion` explicitly detects bounded intents and out-of-scope/mutating asks.
- `runAdminAssistantQuestion` compiles `admin_assistant_prompt`, records a provider job, and returns deterministic fallback when no provider exists.
- Answer shape includes `routedActionSuggestions`, `references`, `providerStatus`, `providerJobId`, and `noMutationPerformed: true`.
- Routed actions require admin confirmation and name owning areas such as clarification queue, transcript review, evidence review, boundary review, session next action, and Pass 6 handoff candidate review.

Reusable pieces:

- Scope-first context assembly.
- Excluded-record reasons.
- Explicit permission scope.
- Deterministic fallback when provider is absent.
- Provider-job recording for assistant execution attempts.
- `requiresAdminConfirmation: true` routed suggestions.
- Intent classification for refusal/out-of-scope handling.

Risks:

- Pass 5 raw participant evidence rules are stricter than most stages and should not become the universal default without policy fields.
- Pass 5 assistant types currently live in `packages/participant-sessions`, not `packages/contracts`; moving them now would be too invasive.
- Pass 5 provider job kind reuses prompt-test/extraction job infrastructure; do not generalize that into a global Stage Copilot interaction model yet.

Must not be changed yet:

- `runAdminAssistantQuestion`.
- `buildAdminAssistantContextBundle`.
- Pass 5 assistant route.
- Pass 5 provider-job behavior.
- Handoff candidate routes.
- Pass 5 proof scripts.

### 4. Pass 6 Copilot

Files/packages inspected:

- `packages/prompts/src/index.ts`
- `packages/contracts/src/types/pass6-core.ts`
- `packages/contracts/src/schemas/pass6-core.schema.json`
- `packages/persistence/src/index.ts`
- `apps/admin-web/app/api/pass6/copilot/route.ts`
- `apps/admin-web/app/pass6/copilot/page.tsx`
- `scripts/prove-pass6-block18-copilot.mjs`
- `scripts/prove-pass6-block20-full-live.mjs`

Relevant patterns found:

- Pass 6 has `pass6_analysis_copilot` PromptSpec behavior.
- `buildPass6CopilotContextBundle` assembles DB-grounded case context and returns summary, snapshot, references, and persisted bundle when requested.
- `runPass6Copilot` builds context, resolves prompt spec, compiles prompt, recommends routed actions, persists interaction, and enforces read-only boundary.
- `Pass6CopilotContextBundle` and `Pass6CopilotInteraction` are already contract-backed and validator-backed.
- Routed recommendations have explicit action enums, labels, reasons, optional target references, and `executesAutomatically: false`.
- API route exposes `boundary()` with no autonomous writes, no readiness override, no package eligibility change, no package approval, no Final Package generation, and no release behavior.
- Provider registry is env-gated.

Reusable pieces:

- Context bundle reference model.
- Interaction persistence/audit pattern.
- Read-only boundary object.
- Routed recommendation base shape.
- Provider-gated runtime.
- Proof expectations that other blocks must not create Copilot records.

Risks:

- Pass 6 already has persistence and route behavior; the foundation slice must not modify it.
- `pass6_analysis_copilot` currently appears in a capability key list; future taxonomy must normalize it without breaking existing keys.
- Pass 6 case-level scope is not the same as Pass 5 session/evidence scope.

Must not be changed yet:

- `Pass6CopilotContextBundle`.
- `Pass6CopilotInteraction`.
- `runPass6Copilot`.
- `/api/pass6/copilot`.
- `/pass6/copilot`.
- Pass 6 proof scripts.

### 5. Pass 2-4 Helpers

Files/packages inspected:

- `packages/sources-context/src/provider-jobs.ts`
- `packages/sources-context/src/department-context.ts`
- `packages/sources-context/src/final-pre-hierarchy-review.ts`
- `packages/hierarchy-intake/src/index.ts`
- `packages/targeting-rollout/src/index.ts`
- `packages/prompts/src/index.ts`
- `packages/contracts/src/types/intake.ts`
- `packages/contracts/src/types/structured-context.ts`
- `packages/contracts/src/types/hierarchy.ts`
- `packages/contracts/src/types/targeting-rollout.ts`
- `apps/admin-web/app/intake-sources/[id]/page.tsx`
- `apps/admin-web/app/intake-sessions/[id]/hierarchy/page.tsx`
- `apps/admin-web/app/api/intake-sessions/[id]/hierarchy/route.ts`

Relevant patterns found:

- Pass 2 has source-role/source-scope suggestions, provider jobs, structured context generation, source review, and final pre-hierarchy review.
- Pass 3 has hierarchy draft and source-to-hierarchy triage capability prompts and records.
- Pass 4 has targeting recommendation packet behavior and question-hint seed/material flow.
- These are capability helpers and recommendation engines, not conversational Stage Copilots.
- Existing screens and routes own admin decisions and provider execution.

Reusable pieces:

- Record families and IDs for future context bundles.
- Existing Capability PromptSpecs as system knowledge references, not conversational PromptSpecs.
- Provider job/status patterns for future explanation.
- Triage/recommendation records as future routed recommendation targets.

Risks:

- Turning Pass 2-4 helpers into chat runtimes prematurely would blur recommendation vs decision.
- Source document text and participant targeting data need stage-specific exposure policy.
- Pass 2-4 lack explicit Stage Copilot PromptSpecs and context bundles today.

Must not be changed yet:

- Source-role suggestion behavior.
- Structured context generation.
- Hierarchy draft/triage routes.
- Targeting recommendation packet generation.
- Participant/session creation flow.

### 6. Workspace UI

Files/packages inspected:

- `apps/admin-web/app/workspace/page.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceShell.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceHome.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceNav.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceSectionCard.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceVisualSystem.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceBoundaryNote.tsx`
- `apps/admin-web/app/workspace/_i18n/en.ts`
- `apps/admin-web/app/workspace/_i18n/ar.ts`
- Workspace stage pages under `apps/admin-web/app/workspace/*/page.tsx`

Relevant patterns found:

- `/workspace` is a client-driven shell with language toggle, navigation, visual sections, section cards, and links to governed existing surfaces.
- `WorkspaceShell` wraps `WorkspaceNav` and `workspaceMain`.
- `WorkspaceHome` owns static/visual stage composition and links.
- The accepted baseline should remain untouched.

Reusable pieces:

- Later shared dock insertion point is likely inside `WorkspaceShell`, adjacent to `workspaceMain`, after profile/context contracts exist.
- Stage pages provide natural stage keys and future active-stage routing.
- Existing links can become later routed recommendation targets.

Risks:

- Adding any dock now would violate the no-code planning task and risk the accepted visual baseline.
- UI shape should not define contracts; contracts should define what UI can host later.

Must not be changed yet:

- Workspace components.
- Workspace CSS.
- Workspace i18n.
- Workspace routes/pages.

### 7. Persistence / Provider Integrations

Files/packages inspected:

- `packages/persistence/src/index.ts`
- `packages/persistence/README.md`
- `packages/integrations/src/provider-registry.ts`
- `packages/integrations/src/extraction-provider.ts`
- `packages/integrations/src/google-extraction.ts`
- `apps/admin-web/lib/store.ts`

Relevant patterns found:

- Persistence has SQLite and in-memory repository patterns.
- Pass 6 Copilot context bundles and interactions already have repositories.
- Provider integrations are env-gated and expose availability before runtime use.
- Provider jobs already record prompt family/name/version, input refs, output refs, status, and errors for Pass 2/5-like execution paths.

Reusable pieces:

- Future provider-backed Stage Copilot should persist interaction/context/audit records only after contracts and runtime are scoped.
- Future provider-backed runtime should expose provider availability honestly and fail without fake success.
- Existing provider job status language should inform audit design.

Risks:

- Adding persistence now would imply runtime lifecycle decisions before profiles/context/retrieval boundaries are stable.
- Reusing provider extraction jobs for every Stage Copilot may be wrong; Pass 6 has separate interaction persistence.

Must not be changed yet:

- SQLite schema.
- Repository interfaces.
- `store`.
- Provider registry.
- Provider job records.

### 8. Proof Scripts

Files/packages inspected:

- `scripts/prove-pass5-block12-admin-assistant.mjs`
- `scripts/prove-pass5-block12-stage-aware-copilot.mjs`
- `scripts/prove-pass5-block14-full-live.mjs`
- `scripts/prove-pass6-block1-contracts.mjs`
- `scripts/prove-pass6-block18-copilot.mjs`
- `scripts/prove-pass6-block20-full-live.mjs`
- Pass 6 scripts that assert no Copilot records are created by unrelated blocks.

Relevant patterns found:

- Proof scripts are block/slice-specific, use Node assertions, import package APIs, construct fixtures, validate records, and print concise summaries.
- Existing scripts protect no-mutation and no-Copilot-record boundaries.
- Pass 6 contract proof validates `Pass6CopilotContextBundle`.
- Pass 5 assistant proof validates unsupported/out-of-scope intent, no mutation, routed confirmations, and provider-not-configured fallback.

Reusable pieces:

- Add a dedicated Stage Copilot foundation proof script later, e.g. `scripts/prove-stage-copilot-foundation-contracts.mjs`.
- Proof should validate contract fixtures, schema strictness, invalid enum rejection, no runtime imports, and no persistence/provider/UI side effects.

Risks:

- A proof script that imports `apps/admin-web` or runs providers would exceed the foundation slice.
- A proof script that depends on Pass 5/6 runtime would accidentally couple the foundation to existing implementations.

Must not be changed yet:

- Existing proof scripts.
- Live provider proof scripts.
- Visual baseline proof scripts.

## C. Recommended Foundation Slice Scope

The `Stage Copilot Foundation Contracts / Design Layer` should be a minimal cross-stage vocabulary in `packages/contracts`, not a runtime or UI implementation.

Recommended first-slice artifacts:

- `StageCopilotStageKey`
  - Recommended enum: `sources_context`, `hierarchy`, `targeting`, `participant_evidence`, `analysis_package`, `prompt_studio`, `advanced_debug`, `future_finalization`.
  - Include `setup_case` only if product wants setup represented in the same family immediately.

- `StageCopilotRuntimeMode`
  - Recommended enum: `disabled`, `static_profile`, `deterministic_mock`, `provider_backed`.
  - Purpose is declaration only, not runtime activation.

- `StageCopilotPromptSpecRef`
  - Reference shape: prompt key/module, category, status/version optional, linked stage.
  - Must support distinguishing `capability` from `stage_copilot`.

- `StageCopilotContextBundleRef`
  - Reference shape: bundle type key, stage key, case/session scope fields, version.
  - Do not define every future bundle shape yet.

- `StageCopilotSystemKnowledgeRef`
  - Reference to stage rules, contracts, gates, proof logic, feature docs, and relevant capability prompt refs.
  - Keep as metadata/reference now, not a documentation system.

- `StageCopilotCaseContextRef`
  - Reference to stage data families and scope, not full records.

- `StageCopilotRetrievalScope`
  - Stage-scoped retrieval permissions and record families.
  - Represent direct ID and evidence-anchor intent now; no retrieval implementation.

- `StageCopilotRefusalPolicy`
  - Out-of-stage, unrelated, mutation, restricted evidence, provider execution, and business-decision refusal categories.

- `StageCopilotConversationalBehaviorProfile`
  - Enum/reference-controlled behavior fields: explanation depth, challenge level, directness, alternative suggestion behavior, uncertainty handling, citation behavior.
  - Avoid unbounded freeform behavior in the contract; PromptSpec can carry prose.

- `StageCopilotAdvisoryModePolicy`
  - Allows what-if discussion only as labelled advisory analysis; no writes/execution.

- `StageCopilotRoutedRecommendation`
  - Shared base shape inspired by Pass 5/6: action type/key, label, reason, target reference, owning area, requires admin confirmation, executes automatically false.
  - Do not replace Pass 5/6 action types yet.

- `StageCopilotForbiddenAction`
  - Enumerate universal forbidden actions: approve gates, approve transcripts, approve/reject evidence, mutate records, run providers, generate packages, send messages, change readiness/package eligibility, promote prompts, release final package.

- `StageCopilotReadWriteBoundary`
  - Declaration of read scopes, write prohibition, routed recommendation behavior, admin confirmation requirement.

- `StageCopilotEvidenceAccessPolicy`
  - Metadata policy for evidence access levels and restricted raw evidence categories.
  - Keep policy declarative; retrieval implementation waits.

- `StageCopilotProfile`
  - The top-level artifact combining stage key, runtime mode, PromptSpec refs, context refs, system knowledge refs, case context refs, retrieval scope, refusal policy, behavior profile, advisory mode policy, routed recommendation types, forbidden actions, evidence access policy, and audit requirements.

Not recommended for first slice:

- Full `SourcesCopilotContextBundle` / `HierarchyCopilotContextBundle` / etc. schemas.
- Persistence records.
- Runtime request/response APIs.
- Shared dock props.
- Provider executor interfaces.
- Retrieval request/response schemas beyond references/scopes.

## D. Package/File Placement Recommendation

Should the first slice touch `packages/contracts`?

- Yes. This is the safest home for cross-package foundation vocabulary.
- Recommended files:
  - `packages/contracts/src/types/stage-copilot.ts`
  - `packages/contracts/src/schemas/stage-copilot-profile.schema.json`
  - optional separate schemas only if the profile schema becomes too large.
  - exports from `packages/contracts/src/types/index.ts`
  - schema exports from `packages/contracts/src/schemas/index.ts`
  - validator exports from `packages/contracts/src/index.ts`

Should a new package be created?

- No. A new package would be premature and would create ownership ambiguity.

Should this live under `packages/prompts`, `packages/synthesis-evaluation`, or a future package?

- No for the first slice.
- `packages/prompts` should later consume the taxonomy for PromptSpec separation.
- `packages/synthesis-evaluation` is Pass 6 domain logic and should not own cross-stage Copilot foundation.
- A future `packages/stage-copilot` may make sense only after contracts, view-models, and runtime boundaries are proven.

Should persistence be touched now?

- No. Persistence should wait until a runtime or deterministic interaction harness is scoped.

Should workspace UI be touched now?

- No. The accepted `/workspace` visual baseline should remain untouched.

Should proof scripts be added?

- Yes in the implementation slice, but not in this report.
- Recommended proof script: `scripts/prove-stage-copilot-foundation-contracts.mjs`.

## E. Contract/Schema Strategy

Recommended strategy: **TypeScript types plus Draft-07 schema for `StageCopilotProfile` in the first implementation slice**.

Reason:

- This matches repository convention.
- A profile is configuration-like and should be schema-validated.
- The foundation should be strict enough to prevent generic chatbot drift, but small enough to avoid runtime behavior.

Validators required:

- `validateStageCopilotProfile`.
- Optional only if split: `validateStageCopilotConversationalBehaviorProfile`, `validateStageCopilotRetrievalScope`, etc. Prefer avoiding too many validators at first.

Fixtures that should exist in proof script:

- Valid Pass 2 Sources profile.
- Valid Pass 5 Participant Evidence profile referencing existing `admin_assistant_prompt` as legacy/current behavior.
- Valid Pass 6 Analysis profile referencing `pass6_analysis_copilot`.
- Invalid profile with unknown stage key.
- Invalid profile with runtime mode `provider_backed` but missing boundary/audit declarations.
- Invalid routed recommendation with `executesAutomatically: true`.
- Invalid profile missing refusal policy.
- Invalid profile that marks autonomous writes as allowed.

Exports to add in future implementation:

- Type exports from `packages/contracts/src/types/index.ts`.
- Schema export from `packages/contracts/src/schemas/index.ts`.
- Root schema/type/validator exports from `packages/contracts/src/index.ts`.

How to preserve strictness without overbuilding runtime:

- Use enums for stage keys, runtime modes, behavior levels, refusal categories, evidence access levels, and forbidden actions.
- Use references for PromptSpecs, context bundles, system knowledge, case context, retrieval scope, and route targets.
- Avoid embedding full stage data.
- Avoid persistence identifiers beyond optional profile IDs/version.

## F. PromptSpec Separation Strategy

Later implementation should distinguish:

- **Capability PromptSpecs**
  - Drive stage work: source-role suggestions, hierarchy drafting, source-to-hierarchy triage, targeting packets, question-hint seeds, evidence extraction, clarification, answer recheck, synthesis, difference interpretation, evaluation, package drafting.
  - These may produce records, drafts, recommendations, or test outputs through governed routes.

- **Stage Copilot PromptSpecs**
  - Control conversational support behavior: depth, challenge, refusal, advisory what-if handling, evidence requests, citation behavior, directness, trade-off structure, and routed recommendation phrasing.
  - These must not own state transitions, gates, package eligibility, evidence trust, provider execution, or official analysis results.

Recommended foundation representation:

- Add `promptSpecKind: "capability" | "stage_copilot"` to Stage Copilot references first, not to existing PromptSpec records yet.
- Add `linkedStage: StageCopilotStageKey`.
- Add `linkedCapabilityKeys?: string[]` for Stage System Knowledge references.

What should not change yet:

- Do not alter existing `StructuredPromptSpec`.
- Do not rename `Pass6PromptCapabilityKey`.
- Do not split `PASS6_PROMPT_CAPABILITY_KEYS`.
- Do not move `admin_assistant_prompt`.
- Do not modify Prompt Studio UI.

## G. Compatibility With Existing Pass 5 And Pass 6 Runtimes

Remain untouched:

- Pass 5 `AdminAssistantContextBundle`, `runAdminAssistantQuestion`, route, provider-job behavior, and proof scripts.
- Pass 6 `Pass6CopilotContextBundle`, `Pass6CopilotInteraction`, `runPass6Copilot`, route, page, persistence, and proof scripts.

Later adapter/normalization needed:

- A Pass 5 adapter can map `AdminAssistantRoutedActionSuggestion` into the shared `StageCopilotRoutedRecommendation` base shape without changing Pass 5 internals.
- A Pass 6 adapter can map `Pass6CopilotRoutedActionRecommendation` into the shared base shape without changing Pass 6 internals.
- Existing Pass 5/6 prompt keys can be referenced as current/legacy Stage Copilot PromptSpec refs until PromptOps taxonomy is updated.
- Existing context bundle IDs can be referenced by `StageCopilotContextBundleRef` without migrating bundle schemas.

How not to break existing proof scripts:

- Do not change existing exported names.
- Do not change existing schema definitions.
- Do not change persistence repositories.
- Add only new exports; do not reorder behavior.
- New proof should be additive and should not import or execute Pass 5/6 runtime functions.

## H. Retrieval Seam Implementation Timing

Represent now:

- Retrieval scopes as stage-scoped declarations.
- Allowed record families.
- Evidence access policy.
- Direct ID lookup as an allowed future retrieval mode.
- Evidence-anchor lookup as an allowed future retrieval mode.
- Whether raw text/snippets are allowed, restricted, or forbidden.
- Citation/audit requirements.

Wait:

- Retrieval APIs.
- Text indexes.
- SQL search.
- Semantic search.
- Vector DB.
- RAG orchestration.
- Original snippet rendering.
- Any provider/tool execution path.

Why direct ID / evidence-anchor lookup should be first later:

- Existing records already carry many IDs and anchors.
- Exact lookup is auditable and easier to scope.
- It answers "show me the original text" better than semantic search.
- It reduces leakage risk because the context bundle can authorize precise IDs.

Why semantic/vector retrieval should not be built now:

- It adds infrastructure and privacy complexity before the contract is stable.
- It weakens explainability if used before exact/anchor lookup.
- Stage-specific evidence exposure rules are not finalized.
- Current task is foundation design, not retrieval implementation.

## I. Proposed Implementation Slices

### 1. Foundation contracts/design layer

Purpose:

- Define the shared Stage Copilot vocabulary.

Files/packages likely touched:

- `packages/contracts/src/types/stage-copilot.ts`
- `packages/contracts/src/schemas/stage-copilot-profile.schema.json`
- `packages/contracts/src/types/index.ts`
- `packages/contracts/src/schemas/index.ts`
- `packages/contracts/src/index.ts`

Produces:

- Types, schema, validator, and exports.

Must not do:

- No runtime, persistence, UI, PromptSpec mutation, providers, retrieval, or business logic.

Proof required:

- `scripts/prove-stage-copilot-foundation-contracts.mjs`.

### 2. Foundation proof fixtures

Purpose:

- Prove valid and invalid profile shapes.

Files/packages likely touched:

- `scripts/prove-stage-copilot-foundation-contracts.mjs`
- Optional fixture file only if proof script becomes too large.

Produces:

- Valid Sources, Pass 5, Pass 6 profiles.
- Invalid strictness cases.

Must not do:

- No app imports, providers, DB writes, or runtime execution.

Proof required:

- Script must assert schemas reject bad stage keys, missing refusal policy, autonomous writes, and auto-executing recommendations.

### 3. Stage Copilot PromptSpec taxonomy

Purpose:

- Make Capability vs Stage Copilot PromptSpecs explicit.

Files/packages likely touched:

- `packages/contracts` first.
- Later `packages/prompts`.
- Later Prompt Studio UI only after scoped.

Produces:

- PromptSpec ref taxonomy and migration plan.

Must not do:

- No existing PromptSpec key renames.
- No PromptOps UI changes in this slice.

Proof required:

- Contract proof plus prompt taxonomy fixture validation.

### 4. Stage context bundle interface/read-model plan

Purpose:

- Define future context bundle references and read-model requirements per stage.

Files/packages likely touched:

- Planning docs first.
- Later `packages/contracts` for references only.
- Later stage packages for actual read models.

Produces:

- Reference shapes and per-stage bundle design.

Must not do:

- No `SourcesCopilotContextBundle` etc. full schemas yet unless separately approved.
- No DB assemblers.

Proof required:

- Static profile fixtures reference expected bundle keys.

### 5. Retrieval seam contract/design

Purpose:

- Define future evidence retrieval permissions and lookup modes.

Files/packages likely touched:

- `packages/contracts` for retrieval scope/evidence policy references.
- Later docs for retrieval behavior.

Produces:

- Direct ID and evidence-anchor lookup modes as declarations.

Must not do:

- No retrieval API, search index, semantic search, or vector DB.

Proof required:

- Profile fixtures prove raw evidence is restricted by default.

### 6. Shared dock shell

Purpose:

- Add UI host later after contracts are accepted.

Files/packages likely touched later:

- `apps/admin-web/app/workspace/_components/WorkspaceShell.tsx`
- `apps/admin-web/app/workspace/workspace.module.css`
- Workspace i18n files.

Produces:

- Stage-aware host shell only.

Must not do:

- No provider chat.
- No runtime.
- No visual baseline changes without explicit gate.

Proof required:

- Visual screenshot/audit gate, after UI is actually scoped.

### 7. Deterministic/mock runtime

Purpose:

- Exercise routing, refusal, advisory what-if labeling, and routed recommendations without provider calls.

Files/packages likely touched later:

- Future runtime package or `packages/prompts` only after placement decision.
- Possibly `apps/admin-web` API only after scoped.

Produces:

- Deterministic responses for fixtures.

Must not do:

- No provider execution.
- No persistence unless explicitly scoped.
- No writes.

Proof required:

- Refusal, no mutation, no provider, routed recommendation confirmation.

### 8. First live pilot

Purpose:

- Validate provider-backed Stage Copilot after foundation is proven.

Files/packages likely touched later:

- Likely Pass 6 adapter first.
- Possibly Pass 5 adapter if participant evidence scoping is selected first.

Produces:

- Shared dock integration for one stage.

Must not do:

- No generic chatbot.
- No cross-stage answering.
- No autonomous writes.

Proof required:

- Existing Pass 6/Pass 5 proof scripts must still pass.
- New Stage Copilot runtime proof must assert boundaries.

## J. Recommended Immediate Next Build Prompt

Use this exact scope after this report is accepted:

> Implement only the Stage Copilot Foundation Contracts / Design Layer in `packages/contracts`.
>
> Add a minimal `stage-copilot` contract with TypeScript types, one Draft-07 schema for `StageCopilotProfile`, validator/export wiring, and a proof script `scripts/prove-stage-copilot-foundation-contracts.mjs`.
>
> The contract must represent stage keys, runtime mode, PromptSpec references, context bundle references, Stage System Knowledge references, Stage Case Data Context references, retrieval scope references, refusal policy, conversational behavior profile, advisory what-if policy, routed recommendation base shape, forbidden actions, read/write boundary, evidence access policy, and audit requirements.
>
> Do not implement runtime behavior, APIs, UI, persistence, providers, retrieval, PromptSpec changes, data model changes, or business logic. Do not modify existing Pass 5 or Pass 6 assistant/Copilot behavior. Additive exports only. Prove valid and invalid profile fixtures, including rejection of autonomous writes and auto-executing routed recommendations.

## K. Open Questions

| Question | Why it matters | Options | Recommended answer | Criticality 1-5 | Blocks implementation? |
| --- | --- | --- | --- | --- | --- |
| Should foundation artifacts be schemas or types first? | The repo usually pairs cross-package contracts with schemas and validators. | Types only, schema only, types + schema | Types + one Draft-07 `StageCopilotProfile` schema in first slice | 5 | Yes |
| Should Stage Copilot foundation live in `packages/contracts` only first? | Placement determines dependency direction and avoids runtime coupling. | `packages/contracts`, new package, `packages/prompts`, `packages/synthesis-evaluation` | `packages/contracts` only first | 5 | Yes |
| Should Stage System Knowledge be a contract now or a later documentation/index layer? | Copilot must know rules/gates/proof logic, but full knowledge indexing is larger than foundation. | Full docs system now, reference contract now, defer entirely | Add `StageCopilotSystemKnowledgeRef` now; build documentation/index layer later | 4 | Yes for profile shape, no for runtime |
| How much conversational behavior profile should be enum-based vs freeform PromptSpec guidance? | Too much enum detail is rigid; too much freeform text weakens proof. | Mostly enum, mostly freeform, hybrid | Hybrid: enum/reference controls for depth/challenge/directness/uncertainty/citation; detailed behavior remains in Stage Copilot PromptSpec | 4 | Yes |
| Should routed recommendations reuse existing action recommendation types from Pass 5/6 or introduce a shared base type? | Existing shapes differ but share confirmation/no-execute concepts. | Reuse Pass 5, reuse Pass 6, introduce base type, defer | Introduce shared base type; later adapters map Pass 5/6 into it | 5 | Yes |
| Should evidence access policy be shared now or deferred until retrieval seam work? | Evidence exposure is a core safety boundary. | Full policy now, reference-only now, defer | Add reference/enum policy now; detailed retrieval enforcement later | 5 | Yes |
| Should `StageCopilotProfile` include full context bundle schemas? | Full schemas would overbuild and lock stage data too early. | Full bundle schemas now, refs only, defer all | Refs only now | 4 | No if refs exist |
| Should Pass 6 `pass6_analysis_copilot` be removed from `PASS6_PROMPT_CAPABILITY_KEYS` now? | Product taxonomy says it is Stage Copilot behavior, but existing code depends on the key. | Rename now, duplicate now, leave and reference as legacy/current | Leave untouched; classify via new Stage Copilot ref later | 5 | Yes for compatibility |
| Should persistence be added for Stage Copilot profiles now? | Persistence implies runtime/config lifecycle decisions. | SQLite now, in-memory now, no persistence | No persistence in foundation slice | 4 | No |
| Should the first proof import Pass 5/6 runtimes? | That would couple foundation to existing runtimes. | Import runtimes, import contracts only, use app routes | Import contracts only | 5 | Yes |

## Final Recommendation

Proceed next with a small additive `packages/contracts` foundation slice. Keep existing Pass 5 and Pass 6 runtimes as examples, not dependencies. Define a shared profile/reference/boundary vocabulary first, prove it with strict fixtures, and defer PromptOps taxonomy changes, workspace UI, persistence, provider-backed runtime, and retrieval until the foundation contract is accepted.
