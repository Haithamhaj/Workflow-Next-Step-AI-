# Stage Copilot PromptSpec Taxonomy Plan

No-code planning report only. No PromptSpecs, contracts, runtime behavior, UI, APIs, persistence, providers, retrieval, Pass 5 behavior, Pass 6 behavior, proof scripts, or source packages were changed.

Branch: `codex/workspace-shell-sandbox`  
Starting commit: `2912c3b2723bd6a4befe4ed247f8356209752959`

## 1. Executive Summary

The codebase can support Stage Copilot PromptSpec taxonomy separation, but the safest first implementation must be metadata/reference-only. Existing prompt systems already have stable keys, lifecycle behavior, compiled previews, provider-test paths, and proof scripts. Renaming keys or changing current PromptSpec contracts would risk breaking PromptOps, Pass 5 assistant behavior, Pass 6 Copilot behavior, and multiple proof scripts.

The newly added Stage Copilot foundation contract already contains the right first taxonomy hook: `StageCopilotPromptSpecRef.kind` with `capability | stage_copilot`, plus separate `capabilityPromptSpecRefs` and `stageCopilotPromptSpecRefs` on `StageCopilotProfile`. That means the first taxonomy layer should classify existing prompt keys externally through Stage Copilot profile references rather than modifying existing prompt records.

Recommended model:

- Keep existing PromptSpec keys and contracts unchanged.
- Treat taxonomy as additive metadata/reference first.
- Use Stage Copilot profile references to distinguish Capability PromptSpecs from Stage Copilot PromptSpecs.
- Classify `admin_assistant_prompt` / `pass5.admin_assistant` and `pass6_analysis_copilot` as legacy/current copilot-like prompt references.
- Defer adding a `promptSpecKind` field to existing PromptSpec records until PromptOps UI and migration proof are explicitly scoped.

The main compatibility rule is simple: **do not rename or move existing keys**. Taxonomy should sit beside them first, then adapters can normalize display and future behavior.

## 2. Current PromptSpec Inventory

### Structures in use today

Inspected:

- `packages/contracts/src/types/stage-copilot.ts`
- `packages/contracts/src/schemas/stage-copilot-profile.schema.json`
- `packages/contracts/src/types/prompt-spec.ts`
- `packages/contracts/src/schemas/prompt-spec.schema.json`
- `packages/contracts/src/types/pass6-prompt-workspace.ts`
- `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json`
- `packages/prompts/src/index.ts`
- Prompt admin pages under `apps/admin-web/app/prompts`, `apps/admin-web/app/targeting-rollout/prompts`, `apps/admin-web/app/pass6/prompts`, and `apps/admin-web/app/workspace/prompts`

Current prompt structures:

- `StructuredPromptSpec`
  - Defined in `packages/contracts/src/types/prompt-spec.ts`.
  - Fields: `promptSpecId`, `linkedModule`, `purpose`, `status`, `version`, `blocks`, optional input/output contract refs, previous active ref, timestamps.
  - Schema is strict Draft-07 with `additionalProperties: false`.
  - Used for Pass 3, Pass 4, and Pass 5 prompt-family behavior.

- `Pass6PromptSpec`
  - Defined in `packages/contracts/src/types/pass6-prompt-workspace.ts`.
  - Uses `capabilityKey`, structured sections, compiled preview, test case IDs, lifecycle fields, and provider preferences.
  - Schema includes `capabilityKey` enum with `pass6_analysis_copilot` currently included.
  - Used by Pass 6 Prompt Workspace.

- `StageCopilotPromptSpecRef`
  - Defined in `packages/contracts/src/types/stage-copilot.ts`.
  - Uses `kind: "capability" | "stage_copilot"`.
  - This is currently the safest taxonomy home because it does not mutate existing prompt records.

### Lifecycle patterns

Existing lifecycle patterns:

- `draft`
- `active`
- `previous`
- `archived`

These appear in `StructuredPromptSpec`, `Pass6PromptSpec`, schema enums, PromptOps pages, and proof scripts. The taxonomy plan must preserve this lifecycle without changing status names or promotion behavior.

### Capability prompts today

Current capability PromptSpecs include:

- Pass 3:
  - `pass3.hierarchy.draft`
  - `pass3.source_hierarchy.triage`

- Pass 4:
  - `pass4.targeting_rollout.packet`

- Pass 5 prompt family:
  - `pass5_base_governance_prompt`
  - `participant_guidance_prompt`
  - `first_pass_extraction_prompt`
  - `evidence_interpretation_prompt`
  - `clarification_formulation_prompt`
  - `answer_recheck_prompt`
  - `admin_added_question_prompt`

- Pass 6:
  - `synthesis`
  - `difference_interpretation`
  - `evaluation`
  - `initial_package_drafting`
  - `admin_explanation`
  - `pre_package_inquiry_generation`
  - `optional_draft_document_generation`
  - `visual_narrative_support`

### Copilot-like prompts today

Prompts that behave like Stage Copilot prompts or include Stage Copilot behavior:

- Pass 5:
  - `admin_assistant_prompt`
  - linked module: `pass5.admin_assistant`
  - Current behavior: stage-aware read-only admin/operator copilot for Pass 5 records.

- Pass 6:
  - `pass6_analysis_copilot`
  - Current behavior: read-only Pass 6 conversational Copilot for understanding Pass 6 records and routed action recommendations.

### Ambiguous or mixed cases

- `admin_assistant_prompt` is part of `PASS5_CAPABILITY_PROMPT_NAMES`, but product behavior is closer to Stage Copilot behavior.
- `pass6_analysis_copilot` is part of `PASS6_PROMPT_CAPABILITY_KEYS`, but product behavior is Stage Copilot behavior.
- `admin_explanation` in Pass 6 is a capability prompt that supports explanation output, but it is not the same as a conversational Stage Copilot PromptSpec.
- `pass5_base_governance_prompt` governs Pass 5 capability prompts; it should not be classified as a Stage Copilot PromptSpec even though it includes admin-facing governance language.

## 3. Existing Key Compatibility Map

Keys that must not be renamed:

| Key / constant | Current location | Why it must remain stable |
| --- | --- | --- |
| `PASS3_HIERARCHY_PROMPT_MODULE` / `pass3.hierarchy.draft` | `packages/prompts/src/index.ts` | Used for Pass 3 hierarchy PromptSpec creation, lookup, compilation, admin page behavior, and prompt tests. |
| `PASS3_SOURCE_TRIAGE_PROMPT_MODULE` / `pass3.source_hierarchy.triage` | `packages/prompts/src/index.ts` | Used for Pass 3 source-to-hierarchy triage PromptSpec creation, lookup, compilation, admin page behavior, and prompt tests. |
| `PASS4_TARGETING_ROLLOUT_PROMPT_MODULE` / `pass4.targeting_rollout.packet` | `packages/prompts/src/index.ts` | Used for Pass 4 targeting PromptSpec lookup, compilation, prompt tests, and admin routes. |
| `PASS5_PROMPT_FAMILY` / `pass5_participant_session_prompt_family` | `packages/prompts/src/index.ts`, `packages/participant-sessions/src/index.ts`, scripts | Provider jobs and Pass 5 proof scripts assert this family. |
| `admin_assistant_prompt` | `packages/prompts/src/index.ts`, `packages/participant-sessions/src/index.ts`, scripts | `compilePass5Prompt("admin_assistant_prompt", ...)` is used by Pass 5 assistant runtime and proof scripts. |
| `pass5.admin_assistant` | `packages/prompts/src/index.ts` | Linked module for current Pass 5 admin assistant prompt. |
| `PASS6_PROMPT_CAPABILITY_KEYS` | `packages/prompts/src/index.ts`, `apps/admin-web/app/pass6/prompts/page.tsx`, scripts | Pass 6 Prompt Workspace maps over this list; proof scripts assert key coverage. |
| `pass6_analysis_copilot` | `packages/contracts/src/types/pass6-prompt-workspace.ts`, `packages/prompts/src/index.ts`, route/runtime, scripts | Used by Pass 6 prompt defaults, prompt resolution, Copilot runtime, page, and proof scripts. |

Known proof/runtime dependencies:

- `scripts/prove-pass5-block8-prompt-family.mjs` compiles `admin_assistant_prompt` and checks `PASS5_PROMPT_FAMILY`.
- `scripts/prove-pass5-block12-admin-assistant.mjs` and `scripts/prove-pass5-block12-stage-aware-copilot.mjs` validate Pass 5 assistant behavior and no-mutation routing.
- `scripts/prove-pass5-block14-full-live.mjs` and `scripts/prove-pass5-complex-scenario-logistics-onboarding.mjs` report `admin_assistant_prompt` provider job status.
- `scripts/prove-pass6-block4-prompt-workspace.mjs` imports and compares `PASS6_PROMPT_CAPABILITY_KEYS`.
- `scripts/prove-pass6-block18-copilot.mjs` creates/defaults `pass6_analysis_copilot`.
- `packages/prompts/src/index.ts` resolves `pass6_analysis_copilot` inside `runPass6Copilot`.
- `apps/admin-web/app/pass6/prompts/page.tsx` maps `PASS6_PROMPT_CAPABILITY_KEYS` to comparisons.

Compatibility conclusion:

- Existing keys are product/runtime/proof contracts.
- They should be classified, not renamed.
- `admin_assistant_prompt` and `pass6_analysis_copilot` should be treated as legacy/current copilot-like references in the Stage Copilot profile taxonomy until a later migration creates first-class Stage Copilot PromptSpec records.

## 4. Capability PromptSpec Definition

A Capability PromptSpec controls an AI-supported stage capability that produces, drafts, validates, interprets, tests, or recommends stage work. It is part of the stage work pipeline. It may support admin review, but it does not define the conversational personality or multi-turn reasoning behavior of a Stage Copilot.

Capability PromptSpecs can drive:

- Source-role suggestion.
- Source-scope suggestion.
- Structured context generation.
- Hierarchy drafting.
- Source-to-hierarchy triage.
- Targeting recommendation packets.
- Question-hint seed generation.
- Participant guidance.
- Evidence extraction.
- Evidence interpretation.
- Clarification question formulation.
- Answer recheck.
- Admin-added question drafting.
- Synthesis.
- Difference interpretation.
- Evaluation.
- Admin explanation artifact generation.
- Pre-package inquiry generation.
- Initial package drafting.
- Optional draft document generation.
- Visual narrative support.
- Prompt tests and compiled prompt previews.

Capability PromptSpecs may influence outputs that later become records or review materials through governed routes. They must not be confused with Stage Copilot PromptSpecs.

## 5. Stage Copilot PromptSpec Definition

A Stage Copilot PromptSpec controls conversational support behavior for a stage-scoped decision-support partner. It governs how the Copilot talks, challenges, explains, refuses, cites, compares alternatives, and keeps advisory discussion separate from official actions.

It should govern:

- Explanation depth.
- Challenge level.
- Directness.
- Alternatives behavior.
- Advisory what-if reasoning.
- Uncertainty handling.
- Citation/evidence discussion behavior.
- Refusal behavior.
- Routed recommendation wording.
- Recommendation-vs-decision separation.
- How the Copilot discusses methods/lenses.
- How it challenges weak assumptions.
- How it handles multi-turn follow-up within the stage boundary.

It must not own:

- State transitions.
- Gates.
- Package eligibility.
- Evidence trust.
- Provider execution.
- Official analysis results.
- Persistence writes.
- Approval decisions.
- Package generation/release.
- Prompt promotion/archive behavior.

Stage Copilot PromptSpecs are conversational controls. They do not change business logic.

## 6. Ambiguous / Legacy Prompt Cases

### Pass 5 `admin_assistant_prompt`

Current status:

- Exists inside the Pass 5 prompt family and `PASS5_CAPABILITY_PROMPT_NAMES`.
- Compiled by `compilePass5Prompt("admin_assistant_prompt", ...)`.
- Used by `runAdminAssistantQuestion`.
- Provider job records use `promptFamily: PASS5_PROMPT_FAMILY` and `promptName: "admin_assistant_prompt"`.

Product interpretation:

- Behavior is Stage Copilot-like: read-only admin/operator copilot, bounded Pass 5 context, routed action suggestions, no mutation.
- Contract classification should reference it as `kind: "stage_copilot"` in a `StageCopilotPromptSpecRef` when used by a Participant Evidence profile.

Migration stance:

- Leave current key and family untouched.
- Do not remove it from `PASS5_CAPABILITY_PROMPT_NAMES` now.
- Later adapter can describe it as "Current Pass 5 assistant prompt, Stage Copilot-like" without moving runtime behavior.

### Pass 6 `pass6_analysis_copilot`

Current status:

- Exists in `Pass6PromptCapabilityKey`.
- Included in `PASS6_PROMPT_CAPABILITY_KEYS`.
- Displayed in Pass 6 Prompt Workspace.
- Used by `resolveCopilotPromptSpec` and `runPass6Copilot`.
- Covered by Pass 6 Copilot proof scripts.

Product interpretation:

- Behavior is Stage Copilot-like: read-only DB-grounded Pass 6 conversational Copilot with routed recommendations.
- Contract classification should reference it as `kind: "stage_copilot"` in an Analysis / Package `StageCopilotProfile`.

Migration stance:

- Leave current key and enum untouched.
- Do not remove it from `PASS6_PROMPT_CAPABILITY_KEYS`.
- Later taxonomy layer can display it under Stage Copilot PromptSpecs while preserving the existing key.

### Pass 6 `admin_explanation`

Current status:

- Pass 6 capability key.
- Produces explanation support material.

Product interpretation:

- It is not a Stage Copilot PromptSpec merely because it explains things.
- It should remain a Capability PromptSpec unless it controls multi-turn conversational behavior.

## 7. Recommended Taxonomy Model

Recommended first model:

- Represent taxonomy through `StageCopilotPromptSpecRef.kind` and profile-level reference lists.
- Do not modify existing PromptSpec record schemas yet.
- Do not add `promptSpecKind` to `StructuredPromptSpec` or `Pass6PromptSpec` in the immediate next slice.
- Do not rename or split existing prompt registries.

Recommended later model:

1. Add a lightweight taxonomy metadata layer that maps existing prompt keys to:
   - `kind: capability | stage_copilot`
   - `stageKey`
   - `currentKey`
   - `displayGroup`
   - `migrationStatus: native | legacy_current | planned`

2. Use that metadata layer in Prompt Studio display before mutating prompt records.

3. Only after Prompt Studio and proofs are stable, consider adding an optional `promptSpecKind` field to future PromptSpec records.

Where should `promptSpecKind` eventually live?

- Short term: only in `StageCopilotPromptSpecRef`.
- Medium term: in a prompt taxonomy metadata/read-model layer.
- Long term: optional field in prompt records only if migration proof shows no breakage.

Safest migration path:

1. Keep existing records unchanged.
2. Add taxonomy metadata/read-model.
3. Show grouped display in Prompt Studio.
4. Add adapters from Stage Copilot profiles to existing prompt keys.
5. Preserve existing compile/promote/test behavior.
6. Only then consider schema changes to prompt records.

## 8. Prompt Studio Visibility Plan

Prompt Studio should eventually show two top-level prompt categories:

1. **Capability PromptSpecs**
   - Label: "Capability PromptSpecs - stage work behavior"
   - Description: "These prompts drive extraction, drafting, targeting, synthesis, evaluation, package drafting, prompt tests, or other stage capabilities. Changing them can affect generated stage artifacts or test outputs through governed routes."

2. **Stage Copilot PromptSpecs**
   - Label: "Stage Copilot PromptSpecs - conversational support behavior"
   - Description: "These prompts control stage-scoped conversation style, explanation depth, challenge behavior, alternatives, what-if discussion, refusal behavior, citation behavior, and routed recommendation wording. They do not change business rules or official records."

Recommended grouping:

- Stage Copilot PromptSpecs grouped by Stage Copilot stage:
  - Sources / Context
  - Hierarchy
  - Targeting
  - Participant Evidence
  - Analysis / Package
  - Prompt Studio
  - Advanced / Debug
  - Future Finalization

- Capability PromptSpecs grouped by stage and capability:
  - Pass 2 source/context capabilities.
  - Pass 3 hierarchy capabilities.
  - Pass 4 targeting capabilities.
  - Pass 5 participant/evidence capabilities.
  - Pass 6 analysis/package capabilities.

Admin-confusion protections:

- Do not label all prompts as "capabilities" once Stage Copilot taxonomy is visible.
- Add explicit copy: "Changing a Stage Copilot PromptSpec changes conversational behavior, not business logic."
- Add explicit copy: "Changing a Capability PromptSpec can affect generated stage work through governed routes."
- Mark `admin_assistant_prompt` and `pass6_analysis_copilot` as "current copilot-like prompt key; not renamed."

What not to do:

- Do not make Prompt Studio imply a Copilot prompt can approve records, run providers, or change gates.
- Do not hide current keys; operators need to see compatibility names.
- Do not mix capability and conversational prompts in one undifferentiated table without category labels.

## 9. Migration and Adapter Plan

### Pass 5 admin assistant prompt

Reference strategy:

- In `StageCopilotProfile` for `participant_evidence`, include:
  - `stageCopilotPromptSpecRefs`: `kind: "stage_copilot"`, `promptSpecKey: "pass5.admin_assistant"` or `admin_assistant_prompt`, with notes that this is current/legacy Pass 5 assistant behavior.
  - `capabilityPromptSpecRefs`: extraction, clarification, answer recheck, participant guidance, evidence interpretation, admin-added question.

Adapter need later:

- A read-model adapter that maps Pass 5 prompt family entries into Stage Copilot taxonomy display without changing `PASS5_PROMPT_FAMILY`.
- A routed recommendation adapter mapping Pass 5 `AdminAssistantRoutedActionSuggestion` into shared `StageCopilotRoutedRecommendation` display if/when shared dock integration is scoped.

### Pass 6 analysis copilot prompt

Reference strategy:

- In `StageCopilotProfile` for `analysis_package`, include:
  - `stageCopilotPromptSpecRefs`: `kind: "stage_copilot"`, `promptSpecKey: "pass6_analysis_copilot"`.
  - `capabilityPromptSpecRefs`: synthesis, difference interpretation, evaluation, initial package drafting, admin explanation, pre-package inquiry generation, optional draft document generation, visual narrative support.

Adapter need later:

- A taxonomy display adapter that can classify `pass6_analysis_copilot` as Stage Copilot while keeping it in existing Pass 6 key enums.
- A compatibility adapter that lets Pass 6 Prompt Workspace continue using `PASS6_PROMPT_CAPABILITY_KEYS` until a broader PromptOps refactor is explicitly approved.

### Legacy/current prompt mapping

Recommended metadata fields later:

- `promptSpecKey`
- `legacyKey`
- `stageKey`
- `taxonomyKind`
- `displayName`
- `sourceRegistry`
- `currentRuntimeOwner`
- `migrationStatus`
- `doNotRename: true`

Initial mapping examples:

- `admin_assistant_prompt` -> `participant_evidence`, `stage_copilot`, `legacy_current`.
- `pass5.admin_assistant` -> `participant_evidence`, `stage_copilot`, `legacy_current`.
- `pass6_analysis_copilot` -> `analysis_package`, `stage_copilot`, `legacy_current`.
- `pass3.hierarchy.draft` -> `hierarchy`, `capability`, `native_current`.
- `pass3.source_hierarchy.triage` -> `hierarchy`, `capability`, `native_current`.
- `pass4.targeting_rollout.packet` -> `targeting`, `capability`, `native_current`.

## 10. Recommended Build Order

### Slice 1: PromptSpec taxonomy metadata plan implementation

Purpose:

- Add an additive metadata/read-model layer that classifies existing prompt keys without changing existing PromptSpec schemas or runtime behavior.

Files/packages likely touched:

- Prefer `packages/contracts` if metadata is contract-level.
- Or `packages/prompts` if metadata is purely registry/display-level.
- No UI in this first taxonomy implementation slice unless separately approved.

Produces:

- Taxonomy types/fixtures mapping current keys to `capability | stage_copilot`.
- Legacy/current labels for Pass 5 and Pass 6 copilot-like prompts.

Must not do:

- No key renames.
- No PromptSpec schema migration.
- No runtime changes.

Proof strategy:

- Validate mapping includes all current known keys.
- Assert `PASS5_PROMPT_FAMILY` and `PASS6_PROMPT_CAPABILITY_KEYS` remain unchanged.

Compatibility risks:

- If implemented in `packages/prompts`, avoid importing app/runtime modules.

### Slice 2: Prompt taxonomy proof script

Purpose:

- Prove classification without behavior changes.

Files/packages likely touched:

- `scripts/prove-stage-copilot-promptspec-taxonomy.mjs`

Produces:

- Assertions for no missing/renamed keys.
- Assertions that `admin_assistant_prompt` and `pass6_analysis_copilot` are classified as stage-copilot legacy/current references.

Must not do:

- No provider calls.
- No DB writes.
- No Pass 5/6 runtime execution.

Proof strategy:

- Import only contracts/prompts constants and taxonomy metadata.
- Run existing Pass 5/6 proofs separately in CI or targeted validation.

Compatibility risks:

- Proof should not depend on local server or app routes.

### Slice 3: Prompt Studio read-model labels

Purpose:

- Make Prompt Studio able to display taxonomy labels without changing prompt records.

Files/packages likely touched:

- `packages/prompts` for read-model helper.
- Later `apps/admin-web` pages after explicit UI scope.

Produces:

- Display grouping data: Capability PromptSpecs vs Stage Copilot PromptSpecs.

Must not do:

- No prompt editing behavior changes.
- No promote/archive behavior changes.
- No compiled preview changes.

Proof strategy:

- Snapshot/listing proof that existing prompt keys appear in expected groups.

Compatibility risks:

- Pass 6 Prompt Workspace currently labels all rows as "Capability"; UI copy must be changed carefully later.

### Slice 4: Prompt Studio UI taxonomy display

Purpose:

- Show both prompt categories clearly in admin UI.

Files/packages likely touched:

- `apps/admin-web/app/pass6/prompts/page.tsx`
- `apps/admin-web/app/prompts/page.tsx`
- `apps/admin-web/app/workspace/prompts/page.tsx`

Produces:

- Grouped display and explanatory labels.

Must not do:

- No runtime changes.
- No key changes.
- No provider execution changes.

Proof strategy:

- Browser/visual verification after scoped UI change.
- Existing prompt proofs must still pass.

Compatibility risks:

- UI language must not imply Stage Copilot prompts can change official analysis behavior.

### Slice 5: Optional future PromptSpec schema evolution

Purpose:

- Consider adding `promptSpecKind` to prompt records only after metadata/display model is proven.

Files/packages likely touched:

- `packages/contracts`
- `packages/prompts`
- Prompt proof scripts.

Produces:

- Optional schema field or new wrapper contract.

Must not do:

- No forced migration of existing records without compatibility path.
- No breaking enum changes.

Proof strategy:

- Backward compatibility fixtures for old records.
- Existing prompt proof scripts.

Compatibility risks:

- Highest-risk slice. Defer until clearly needed.

## 11. Proof Strategy

Later taxonomy implementation should prove:

- Contract/schema fixtures classify prompts as `capability` or `stage_copilot`.
- Existing prompt keys remain unchanged.
- `PASS5_PROMPT_FAMILY` remains unchanged.
- `PASS6_PROMPT_CAPABILITY_KEYS` remains unchanged unless a future explicit migration updates all consumers.
- `admin_assistant_prompt` still compiles through Pass 5 prompt family.
- `pass6_analysis_copilot` still resolves in Pass 6 Copilot runtime.
- Active/draft/previous/archived lifecycle remains unchanged.
- Compiled prompt previews remain unchanged unless explicitly edited by admin.
- Prompt Workspace tests still do not create workflow records.
- Stage Copilot taxonomy metadata does not execute providers.

Recommended proof commands later:

- Existing Pass 5 prompt family proof.
- Existing Pass 5 assistant proof.
- Existing Pass 6 prompt workspace proof.
- Existing Pass 6 Copilot proof.
- New taxonomy proof script that imports taxonomy metadata and constants only.

Do not use proof scripts to:

- Start servers.
- Run live providers.
- Mutate prompt records.
- Rename keys.
- Exercise shared dock or Stage Copilot runtime.

## 12. Risks, Open Questions, and Required Decisions

| Question / Risk | Why it matters | Options | Recommended answer | Criticality | Blocks implementation? |
| --- | --- | --- | --- | --- | --- |
| Should taxonomy be metadata/reference-only first? | Avoids breaking stable prompt records and proof scripts. | Metadata first, prompt schema first, UI first | Metadata/reference first | 5 | Yes |
| Should existing PromptSpec contracts gain `promptSpecKind` now? | Schema changes can break existing records and UI assumptions. | Add now, optional later, never | Defer; use `StageCopilotPromptSpecRef.kind` now | 5 | Yes |
| Should `pass6_analysis_copilot` be removed from `PASS6_PROMPT_CAPABILITY_KEYS`? | Existing runtime/page/proof depends on it. | Remove now, duplicate, leave | Leave untouched; classify externally | 5 | Yes |
| Should `admin_assistant_prompt` be removed from Pass 5 capability prompt list? | Pass 5 runtime and proofs compile it by name. | Remove now, duplicate, leave | Leave untouched; classify externally | 5 | Yes |
| Should Prompt Studio show legacy/current copilot-like prompts under Stage Copilot group? | Admins need product clarity without breaking keys. | Hide, duplicate display, grouped with compatibility label | Group with compatibility label | 4 | No, but important before UI |
| Should `admin_explanation` be Stage Copilot? | It explains outputs but does not control conversation. | Classify as capability, classify as copilot, ambiguous | Keep as capability | 4 | No |
| Where should taxonomy metadata live? | Determines dependency direction. | `packages/contracts`, `packages/prompts`, docs only | Contracts for stable shape; prompts for registry/display mapping | 4 | Yes for next implementation |
| How to handle future native Stage Copilot PromptSpecs? | Need a path from legacy/current keys to native stage-copilot prompts. | New keys later, reuse old keys forever, schema migration | New native keys later, with adapters and compatibility labels | 3 | No |
| Should Prompt Studio support filtering by stage and kind? | Prevents admin confusion. | No filter, kind only, stage + kind | Stage + kind | 3 | No |

Required operator decisions before implementation:

- Confirm taxonomy first slice should be metadata/read-model only.
- Decide whether taxonomy shape belongs first in `packages/contracts` or `packages/prompts`.
- Confirm `pass6_analysis_copilot` and `admin_assistant_prompt` remain untouched and are displayed as legacy/current copilot-like references.

## 13. Final Recommendation

Implement PromptSpec taxonomy separation as an additive metadata/reference layer first. Do not modify existing PromptSpec records, prompt keys, prompt family constants, Pass 6 capability enum, runtime code, proof scripts, or Prompt Studio UI in the first taxonomy slice.

Use the Stage Copilot foundation contract as the source of the product split:

- `kind: "capability"` for stage work prompts.
- `kind: "stage_copilot"` for conversational support prompts.

Classify current copilot-like prompts externally:

- Pass 5 `admin_assistant_prompt` / `pass5.admin_assistant` -> Participant Evidence Stage Copilot reference, legacy/current.
- Pass 6 `pass6_analysis_copilot` -> Analysis / Package Stage Copilot reference, legacy/current.

The safest next implementation is a no-runtime taxonomy metadata/proof slice that proves classification and key stability before any Prompt Studio UI or PromptSpec schema changes.
