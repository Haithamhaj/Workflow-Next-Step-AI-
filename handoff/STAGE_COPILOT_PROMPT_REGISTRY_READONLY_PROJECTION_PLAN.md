# Stage Copilot Prompt Registry Read-Only Projection Plan

No-code planning report only. No code, contracts, prompts, PromptSpecs, runtime behavior, UI, APIs, persistence, providers, retrieval, Pass 5 behavior, Pass 6 behavior, proof scripts, or source packages were changed.

Branch: `codex/workspace-shell-sandbox`
Starting commit: `32fac25b7f1eaa0005add2fa8b512d07b587c2b0`

## 1. Executive Summary

The codebase can support a future read-only prompt registry projection helper, but it should be implemented carefully because `packages/prompts/src/index.ts` is not only a static registry. It exports stable constants and default PromptSpec factories, but it also contains prompt compilation, lifecycle mutation, prompt test execution, provider-job creation, Pass 6 Copilot prompt resolution, and runtime-adjacent behavior.

The safest next implementation slice, after this report is accepted, is an additive pure helper in `packages/prompts` that imports Stage Copilot taxonomy types from `@workflow/contracts`, reads only static constants or caller-supplied prompt records, and returns display-safe taxonomy projection records. It must not call existing compile, ensure, create-default, promote, archive, provider-test, Pass 5 assistant, or Pass 6 Copilot functions.

Do not move this helper into `packages/contracts`. Contracts now own the vocabulary and static proof fixtures, but they cannot depend on `packages/prompts` without reversing the current dependency graph. Do not create a new package yet; the helper is small, read-only, and prompt-registry-facing.

Main recommendation:

- Build a read-only projection helper in `packages/prompts` only after explicitly scoping it as a pure projection.
- Use the existing contract taxonomy fields as the output vocabulary.
- Preserve all original prompt keys.
- Classify current copilot-like keys as legacy/current references, not migrated Stage Copilot PromptSpecs.
- Prove that the helper does not compile prompts, call providers, write repositories, mutate lifecycle status, or import app/runtime modules.

## 2. Existing Prompt Registry Shape

Files inspected:

- `packages/prompts/src/index.ts`
- `packages/prompts/package.json`
- `packages/contracts/src/types/stage-copilot.ts`
- `packages/contracts/src/schemas/stage-copilot-profile.schema.json`
- `packages/contracts/src/types/prompt-spec.ts`
- `packages/contracts/src/types/pass6-prompt-workspace.ts`
- `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json`
- `scripts/prove-stage-copilot-foundation-contracts.mjs`
- `scripts/prove-stage-copilot-static-taxonomy-projection.mjs`
- `scripts/prove-pass5-block8-prompt-family.mjs`
- `scripts/prove-pass6-block4-prompt-workspace.mjs`
- `scripts/prove-pass6-block18-copilot.mjs`
- `apps/admin-web/app/prompts/page.tsx`
- `apps/admin-web/app/api/prompts/route.ts`
- `apps/admin-web/app/pass6/prompts/page.tsx`
- `apps/admin-web/app/api/pass6/prompts/route.ts`
- `apps/admin-web/app/workspace/prompts/page.tsx`

`packages/prompts` exports several categories of behavior from one file.

Safe static declarations:

- `PASS3_HIERARCHY_PROMPT_MODULE = "pass3.hierarchy.draft"`
- `PASS3_SOURCE_TRIAGE_PROMPT_MODULE = "pass3.source_hierarchy.triage"`
- `PASS4_TARGETING_ROLLOUT_PROMPT_MODULE = "pass4.targeting_rollout.packet"`
- `PASS5_PROMPT_FAMILY = "pass5_participant_session_prompt_family"`
- `PASS5_BASE_GOVERNANCE_PROMPT_MODULE = "pass5.base_governance"`
- `PASS5_CAPABILITY_PROMPT_NAMES`, including current `admin_assistant_prompt`
- `PASS6_PROMPT_CAPABILITY_KEYS`, including current `pass6_analysis_copilot`
- `PASS6_PROMPT_SECTION_KEYS`

Static/default PromptSpec factories:

- `defaultPass3HierarchyPromptSpec`
- `defaultPass3SourceTriagePromptSpec`
- `defaultPass4TargetingPromptSpec`
- `defaultPass5BaseGovernancePromptSpec`
- `defaultPass5CapabilityPromptSpec`
- `defaultPass6PromptSpec`

These factories create contract records but some include timestamps and default compiled prompt previews. They are safer than provider paths, but a taxonomy projection helper should not need to call them initially.

Lifecycle and persistence functions:

- Pass 3/4/5 ensure/list/get functions that read or save `StructuredPromptSpec` records.
- Pass 3/4 draft, promote, and test functions.
- Pass 5 prompt family registration and prompt test job creation.
- Pass 6 create-default, list, update, clone, promote, archive, compare, test-case, and test-execution functions.

These are not safe dependencies for the first taxonomy projection helper because they can create records, update records, compile prompts, or write provider/test records.

Compilation and provider-adjacent paths:

- `compileStructuredPromptSpec`
- `compilePass3SourceTriagePromptSpec`
- `compilePass4TargetingPromptSpec`
- `compilePass5Prompt`
- `compilePass6PromptSpec`
- `createPass5PromptTestJob`
- `runPass6PromptWorkspaceTest`
- `runPass6Copilot`

These must not be used by a read-only taxonomy projection helper.

Runtime-backed or app surfaces:

- `/api/prompts` reads/writes generic `PromptRecord` through `registerPrompt` and `listPrompts`.
- `/pass6/prompts` calls `createDefaultPass6PromptSpecs`, lists records, compares draft/active records, and can promote/clone/archive/run tests through `/api/pass6/prompts`.
- `/workspace/prompts` is a placeholder linking to existing prompt surfaces and does not read taxonomy.

Current Stage Copilot taxonomy support:

- `StageCopilotPromptSpecKind`: `capability`, `stage_copilot`, `legacy_copilot_like`, `unknown_or_unclassified`.
- `StageCopilotPromptSpecClassification` now includes projection status, `migrated: false`, `renameAllowed: false`, `runtimeBehaviorChanged: false`, display labels, optional warnings, and optional legacy mappings.
- The static projection proof validates current keys without importing `packages/prompts`.

## 3. Read-Only Projection Helper Options

### Option A - Helper in `packages/prompts` that reads existing registry constants only

Files likely touched if implemented:

- `packages/prompts/src/index.ts`, or a new internal file exported from it if later allowed.
- A new proof script.
- Possibly no contract changes if it reuses existing Stage Copilot taxonomy types.

What it produces:

- A pure function such as `listStageCopilotPromptTaxonomyProjection()`.
- Display-safe rows or `StageCopilotPromptSpecRef`-compatible records.
- Classification for known Pass 3, Pass 4, Pass 5, and Pass 6 prompt keys.
- Legacy/current classifications for `admin_assistant_prompt`, `pass5.admin_assistant`, and `pass6_analysis_copilot`.
- Unknown/unclassified fallback for supplied external keys if the helper accepts inputs.

Dependency direction:

- Correct. `packages/prompts` already depends on `@workflow/contracts`, so it can import taxonomy types without reversing dependencies.

Risk level:

- Medium-low.

Compatibility risks:

- Low if the helper only reads constants and returns new objects.
- Higher if it calls default factories, repository functions, compile functions, or lifecycle helpers.
- Higher if it changes `PASS5_CAPABILITY_PROMPT_NAMES` or `PASS6_PROMPT_CAPABILITY_KEYS`.

Proof strategy:

- Build `packages/contracts` and `packages/prompts`.
- Run the foundation and static taxonomy projection proofs.
- Add a projection proof that imports only the new helper from `packages/prompts/dist/index.js`.
- Assert current keys are present and unchanged.
- Assert no compiled prompt text is returned.
- Assert no repository/provider/app imports are needed.
- Run existing Pass 5/6 prompt proofs.

Why it should be used next:

- It is the first option that can safely bridge static taxonomy contracts to the actual prompt registry constants.
- It keeps PromptOps runtime behavior unchanged while reducing drift from static fixtures.

Why it should not overreach:

- The helper should not become a PromptOps adapter, API, UI data source, or migration tool in the first slice.

### Option B - Helper in `packages/contracts` using static projection fixtures only

Files likely touched if implemented:

- `packages/contracts/src/types/stage-copilot.ts`
- `packages/contracts/src/schemas/stage-copilot-profile.schema.json`
- Contract proof scripts.

What it produces:

- More static fixture/projection examples.
- No live relationship to prompt registry constants.

Dependency direction:

- Safe but limited. `packages/contracts` cannot import `packages/prompts`.

Risk level:

- Low.

Compatibility risks:

- Low runtime risk, but higher drift risk because static fixture keys can diverge from prompt registry constants.

Proof strategy:

- Validate static fixtures only.
- Assert legacy/current flags and no-rename fields.

Why it should not be used now:

- This has already been done by `scripts/prove-stage-copilot-static-taxonomy-projection.mjs`.
- Repeating contract-only fixtures will not answer the current main question: whether a read-only projection can see actual prompt registry keys safely.

### Option C - New future package for Stage Copilot registry/projection

Files likely touched if implemented:

- New package, for example `packages/stage-copilot`.
- Root workspace/package config.
- Package dependency graph.
- New proof scripts.

What it produces:

- A dedicated home for Stage Copilot projections, profiles, and later runtime adapters.

Dependency direction:

- Could depend on `@workflow/contracts` and possibly `@workflow/prompts`.
- Avoids putting Stage Copilot-specific helpers into `packages/prompts`.

Risk level:

- Medium.

Compatibility risks:

- Adds package/config surface before the helper needs it.
- May become an accidental runtime home too early.
- Increases build/proof scope.

Proof strategy:

- Package build/typecheck.
- Dependency-boundary proof.
- Existing contracts/prompts proofs.

Why it should not be used now:

- The accepted boundary says do not create a new package for the current work stream.
- A pure read-only helper is small enough to prove inside `packages/prompts`.

### Option D - No helper yet; keep only static contract fixtures

Files likely touched if implemented:

- None.

What it produces:

- No additional implementation.

Dependency direction:

- Safe.

Risk level:

- Lowest immediate risk.

Compatibility risks:

- Drift remains. Static taxonomy projection can become stale as PromptSpecs evolve.
- Prompt Studio and future display surfaces still lack a safe bridge to actual prompt keys.

Proof strategy:

- Continue running contract-only proofs.

Why it should not be the final answer:

- The current accepted state already proves static taxonomy. The next useful proof is read-only projection over known prompt registry constants.

## 4. Recommended Location

The first actual read-only helper should live in `packages/prompts`.

Reasons:

- The actual registry constants live in `packages/prompts/src/index.ts`.
- `packages/prompts` already depends on `@workflow/contracts`; importing `StageCopilotPromptSpecKind`, `StageCopilotPromptSpecRef`, or related taxonomy types is consistent with current dependency direction.
- `packages/contracts` must remain registry-agnostic and cannot import prompt constants.
- A new package is premature for a pure read-only projection.
- App routes and UI should not be the first home because they would couple taxonomy to display behavior before the package-level proof exists.

Implementation placement recommendation for a later slice:

- Prefer a small additive helper in `packages/prompts/src/index.ts` if the repo continues to keep prompt package exports in one file.
- If file splitting is explicitly allowed later, create a local `packages/prompts/src/stage-copilot-taxonomy-projection.ts` and re-export from `index.ts`.
- Do not touch `packages/contracts` unless a missing view-model type is discovered and explicitly scoped.
- Do not touch `apps/admin-web` until the helper has proof coverage.

## 5. Safe Helper Contract

A future read-only helper may:

- Read existing exported constants such as `PASS3_HIERARCHY_PROMPT_MODULE`, `PASS3_SOURCE_TRIAGE_PROMPT_MODULE`, `PASS4_TARGETING_ROLLOUT_PROMPT_MODULE`, `PASS5_PROMPT_FAMILY`, `PASS5_CAPABILITY_PROMPT_NAMES`, and `PASS6_PROMPT_CAPABILITY_KEYS`.
- Map prompt keys or linked modules to `StageCopilotPromptSpecKind`.
- Return display-safe projection records using the existing Stage Copilot taxonomy vocabulary.
- Classify capability prompts.
- Classify future native Stage Copilot keys if supplied as static planned refs.
- Classify `admin_assistant_prompt`, `pass5.admin_assistant`, and `pass6_analysis_copilot` as `legacy_copilot_like`.
- Set `migrated: false`, `renameAllowed: false`, and `runtimeBehaviorChanged: false` for every projected current key.
- Preserve original prompt keys and linked modules.
- Optionally accept caller-supplied prompt identifiers and classify unknowns as `unknown_or_unclassified`.

The helper must not:

- Compile prompts.
- Call default PromptSpec factories if the output can be built from constants.
- Create missing prompt records.
- Register prompt records.
- Promote, archive, clone, update, or otherwise mutate PromptSpecs.
- Run prompt tests.
- Call providers.
- Write provider jobs.
- Import `apps/admin-web`.
- Import Pass 5 participant-session runtime.
- Import Pass 6 Copilot runtime routes.
- Touch persistence repositories.
- Start a server.
- Rename, replace, or migrate any prompt key.
- Change `PASS5_PROMPT_FAMILY`, `PASS5_CAPABILITY_PROMPT_NAMES`, `PASS6_PROMPT_CAPABILITY_KEYS`, or current PromptSpec contracts.

Suggested output shape:

- Keep it compatible with existing `StageCopilotPromptSpecRef` and `StageCopilotPromptSpecClassification` instead of inventing a separate runtime view model.
- If a narrower display record is needed later, it should contain only:
  - `promptSpecKey`
  - `linkedModule` when known
  - `kind`
  - `linkedStage`
  - `taxonomyStatus`
  - `projectionStatus`
  - `migrated: false`
  - `renameAllowed: false`
  - `runtimeBehaviorChanged: false`
  - `displayLabel`
  - `displayWarning`
  - `sourceRegistry`
  - `notes`

## 6. Compatibility Map

Keys and constants that must remain untouched:

| Key or constant | Current location | Current dependency |
| --- | --- | --- |
| `PASS3_HIERARCHY_PROMPT_MODULE` | `packages/prompts/src/index.ts` | Pass 3 hierarchy default, lookup, list, draft, promotion, test behavior. |
| `pass3.hierarchy.draft` | `packages/prompts/src/index.ts` | Linked module for Pass 3 hierarchy PromptSpec. |
| `PASS3_SOURCE_TRIAGE_PROMPT_MODULE` | `packages/prompts/src/index.ts` | Pass 3 source-to-hierarchy triage default, lookup, list, draft, promotion, test behavior. |
| `pass3.source_hierarchy.triage` | `packages/prompts/src/index.ts` | Linked module for Pass 3 source triage PromptSpec. |
| `PASS4_TARGETING_ROLLOUT_PROMPT_MODULE` | `packages/prompts/src/index.ts` | Pass 4 targeting PromptSpec list, draft, promotion, and test behavior. |
| `pass4.targeting_rollout.packet` | `packages/prompts/src/index.ts` | Linked module for Pass 4 targeting PromptSpec. |
| `PASS5_PROMPT_FAMILY` | `packages/prompts/src/index.ts`, `packages/participant-sessions/src/index.ts`, scripts | Provider jobs and proofs assert `pass5_participant_session_prompt_family`. |
| `PASS5_CAPABILITY_PROMPT_NAMES` | `packages/prompts/src/index.ts`, scripts | Prompt family registration and proof scripts expect current names. |
| `pass5_base_governance_prompt` | `packages/prompts/src/index.ts` | Base governance PromptSpec for Pass 5 family. |
| `participant_guidance_prompt` | `packages/prompts/src/index.ts` | Pass 5 capability prompt. |
| `first_pass_extraction_prompt` | `packages/prompts/src/index.ts` | Pass 5 capability prompt. |
| `evidence_interpretation_prompt` | `packages/prompts/src/index.ts` | Pass 5 capability prompt. |
| `clarification_formulation_prompt` | `packages/prompts/src/index.ts` | Pass 5 capability prompt. |
| `answer_recheck_prompt` | `packages/prompts/src/index.ts` | Pass 5 capability prompt. |
| `admin_added_question_prompt` | `packages/prompts/src/index.ts` | Pass 5 capability prompt. |
| `admin_assistant_prompt` | `packages/prompts/src/index.ts`, `packages/participant-sessions/src/index.ts`, scripts | Current Pass 5 admin assistant/copilot-like prompt name. Must be classified, not renamed. |
| `pass5.admin_assistant` | `packages/prompts/src/index.ts` | Current linked module for `admin_assistant_prompt`. Must be classified, not renamed. |
| `PASS6_PROMPT_CAPABILITY_KEYS` | `packages/prompts/src/index.ts`, `apps/admin-web/app/pass6/prompts/page.tsx`, scripts | Pass 6 workspace list/comparison/proofs map this list. |
| `synthesis` | `packages/contracts/src/types/pass6-prompt-workspace.ts`, `packages/prompts/src/index.ts` | Pass 6 capability key. |
| `difference_interpretation` | same | Pass 6 capability key. |
| `evaluation` | same | Pass 6 capability key. |
| `initial_package_drafting` | same | Pass 6 capability key. |
| `admin_explanation` | same | Pass 6 capability key, not a Stage Copilot PromptSpec. |
| `pre_package_inquiry_generation` | same | Pass 6 capability key. |
| `optional_draft_document_generation` | same | Pass 6 capability key. |
| `visual_narrative_support` | same | Pass 6 capability key. |
| `pass6_analysis_copilot` | `packages/contracts/src/types/pass6-prompt-workspace.ts`, `packages/prompts/src/index.ts`, Pass 6 Copilot proof/runtime | Current copilot-like Pass 6 prompt key. Must be classified, not renamed. |

Current proof dependencies:

- `scripts/prove-pass5-block8-prompt-family.mjs` compiles `admin_assistant_prompt` and asserts `PASS5_PROMPT_FAMILY`.
- `scripts/prove-pass6-block4-prompt-workspace.mjs` imports and compares `PASS6_PROMPT_CAPABILITY_KEYS`.
- `scripts/prove-pass6-block18-copilot.mjs` creates and promotes `pass6_analysis_copilot`.
- `scripts/prove-stage-copilot-foundation-contracts.mjs` and `scripts/prove-stage-copilot-static-taxonomy-projection.mjs` validate metadata-only legacy/current mappings.

## 7. Proof Strategy

A future read-only projection implementation should prove:

- Current prompt keys are not renamed.
- `PASS5_PROMPT_FAMILY` is unchanged.
- `PASS5_CAPABILITY_PROMPT_NAMES` still contains the same values, including `admin_assistant_prompt`.
- `PASS6_PROMPT_CAPABILITY_KEYS` still contains the same values, including `pass6_analysis_copilot`.
- The projection marks current keys with `migrated: false`, `renameAllowed: false`, and `runtimeBehaviorChanged: false`.
- `admin_assistant_prompt`, `pass5.admin_assistant`, and `pass6_analysis_copilot` are classified as `legacy_copilot_like`.
- Capability prompts are classified as `capability`.
- Unknown caller-supplied keys become `unknown_or_unclassified`.
- The helper returns new projection objects and does not mutate any input records.
- No compiled prompt text appears in projection output.
- No provider calls occur.
- No persistence writes occur.
- No app/runtime modules are imported.
- Static contract proofs still pass.
- Pass 5 prompt-family proof still passes.
- Pass 6 Prompt Workspace proof still passes.
- Pass 6 Copilot proof still passes if included in scope.

Recommended proof commands for the future implementation slice:

- `pnpm build:contracts`
- `pnpm --filter @workflow/prompts build`
- `node scripts/prove-stage-copilot-foundation-contracts.mjs`
- `node scripts/prove-stage-copilot-static-taxonomy-projection.mjs`
- New read-only projection proof script
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass6-block4-prompt-workspace.mjs`
- `node scripts/prove-pass6-block18-copilot.mjs`
- `pnpm typecheck`

The new projection proof should avoid provider execution, environment variables, servers, database files, and app imports.

## 8. Recommended Implementation Slice

### Slice: Prompt Registry Read-Only Taxonomy Projection Helper

Purpose:

- Add a pure read-only helper that maps current prompt registry constants to Stage Copilot taxonomy projection records.
- Bridge static contract taxonomy to actual prompt keys without changing PromptOps behavior.

Files/packages likely touched:

- `packages/prompts/src/index.ts`, or a new file under `packages/prompts/src/` re-exported from `index.ts` if explicitly allowed.
- New proof script, for example `scripts/prove-stage-copilot-prompt-registry-readonly-projection.mjs`.

What it produces:

- A display-safe projection list for known prompt constants.
- Classification for capability prompts.
- Legacy/current copilot-like classification for `admin_assistant_prompt`, `pass5.admin_assistant`, and `pass6_analysis_copilot`.
- Unknown/unclassified classification for caller-supplied unknown keys if the helper supports that mode.
- No PromptSpec record changes.

What it must not do:

- It must not modify `packages/contracts`.
- It must not modify existing prompt keys.
- It must not change PromptSpec schemas.
- It must not change `PASS5_PROMPT_FAMILY`.
- It must not change `PASS5_CAPABILITY_PROMPT_NAMES`.
- It must not change `PASS6_PROMPT_CAPABILITY_KEYS`.
- It must not compile prompts.
- It must not run prompt tests.
- It must not call providers.
- It must not import app routes.
- It must not touch persistence.
- It must not add UI or APIs.
- It must not create Stage Copilot runtime behavior.

Proof commands:

- `pnpm build:contracts`
- `pnpm --filter @workflow/prompts build`
- `node scripts/prove-stage-copilot-foundation-contracts.mjs`
- `node scripts/prove-stage-copilot-static-taxonomy-projection.mjs`
- New projection proof script
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass6-block4-prompt-workspace.mjs`
- `pnpm typecheck`

Rollback risk:

- Low if additive and isolated.
- Moderate if implemented inside `packages/prompts/src/index.ts` near runtime functions and accidentally calls lifecycle/compile helpers.
- Very low if the helper is pure data mapping with no repository argument.

### Deferred Slice: Prompt Studio Display Consumption

Purpose:

- Show taxonomy labels in Prompt Studio or Prompt Workspace after package-level projection proof exists.

Files/packages likely touched:

- `apps/admin-web/app/prompts`
- `apps/admin-web/app/pass6/prompts`
- Possibly `/workspace/prompts`

What it produces:

- Display grouping for Capability, Stage Copilot, Legacy/current Copilot-like, and Unclassified prompts.

What it must not do:

- Must not imply legacy prompts have migrated.
- Must not alter prompt runtime behavior.
- Must not change visual baseline without explicit visual proof.

Proof commands:

- Existing prompt proofs.
- UI/route proof if scoped.
- Workspace visual proof only if `/workspace` is touched.

Rollback risk:

- Medium because it touches UI and may affect accepted visual surfaces.

### Deferred Slice: Persisted Stage Copilot Profile/Prompt Taxonomy Source

Purpose:

- Store profile/config declarations once display and runtime use cases are clear.

Files/packages likely touched:

- `packages/contracts`
- `packages/persistence`
- Admin APIs/UI

What it produces:

- Persisted taxonomy/profile records.

What it must not do:

- Must not arrive before read-only projection semantics are stable.

Proof commands:

- Contract, persistence, migration, and compatibility proofs.

Rollback risk:

- High relative to the current slice because persistence implies migration and data ownership decisions.

## 9. Risks, Open Questions, and Required Decisions

Critical risks:

- Accidentally calling `createDefaultPass6PromptSpecs`, `ensureActivePass5PromptSpec`, or similar helpers would create or save records while pretending to be read-only.
- Importing app routes or Pass 5/6 runtime paths would couple taxonomy display to runtime behavior.
- Treating `pass6_analysis_copilot` as a fully migrated `stage_copilot` PromptSpec would misrepresent current state.
- Changing `PASS6_PROMPT_CAPABILITY_KEYS` would break Pass 6 Prompt Workspace and proof expectations.
- Changing `PASS5_CAPABILITY_PROMPT_NAMES` would risk Pass 5 prompt family registration and proof behavior.

Non-critical risks:

- A helper in `packages/prompts/src/index.ts` adds more surface to an already large file.
- Static classification labels may need copy refinement before admin UI display.
- Unknown/unclassified handling may need stronger policy before external prompt keys are exposed to admins.

Required operator decisions:

- Should the later helper be added directly to `packages/prompts/src/index.ts`, or is a new internal `packages/prompts/src/stage-copilot-taxonomy-projection.ts` file acceptable?
- Should the first helper output full `StageCopilotPromptSpecRef` records or a slimmer display projection record?
- Should `pass5.admin_assistant` be represented as a separate row, or only as legacy mapping metadata under `admin_assistant_prompt`?
- Should the proof include `scripts/prove-pass6-block18-copilot.mjs`, or is Pass 6 Prompt Workspace proof enough for the first helper?

Deferred items:

- Prompt Studio UI grouping.
- `/workspace/prompts` taxonomy display.
- Persisted profile/config source.
- Runtime Stage Copilot adapters.
- Stage Copilot PromptSpec migration.
- Any provider-backed or retrieval-backed Copilot behavior.

## 10. Final Recommendation

Proceed next with a narrow additive `packages/prompts` read-only projection helper, but only as a pure data projection over existing prompt constants and caller-supplied keys. Do not place it in `packages/contracts`, do not create a new package yet, and do not touch Prompt Studio or `/workspace` UI in the first implementation slice.

The helper should preserve current prompt keys exactly, classify current copilot-like prompts as legacy/current references, and return taxonomy metadata that is display-safe but not runtime-active. The proof should demonstrate no prompt compilation, no provider execution, no persistence writes, no runtime imports, and continued compatibility with existing Pass 5 and Pass 6 prompt proofs.
