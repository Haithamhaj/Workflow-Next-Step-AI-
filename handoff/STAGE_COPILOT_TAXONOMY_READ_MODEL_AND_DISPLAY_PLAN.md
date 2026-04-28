# Stage Copilot Taxonomy Read-Model and Display Plan

No-code planning report only. No code, contracts, prompts, runtime behavior, UI, APIs, persistence, providers, retrieval, Pass 5 behavior, Pass 6 behavior, proof scripts, or source packages were changed.

Branch: `codex/workspace-shell-sandbox`  
Starting commit: `c6c6550267ce27c252eb6612a26e79dc2f2e80ad`

## 1. Executive Summary

The repository now has enough contract vocabulary to represent PromptSpec taxonomy safely, but the first read/display layer should still be read-only and non-runtime. The safest next implementation is a read-only taxonomy projection that combines existing prompt keys with Stage Copilot taxonomy metadata, without changing `packages/prompts`, PromptSpec records, prompt compilation, Pass 5 assistant behavior, Pass 6 Copilot behavior, or Prompt Studio UI behavior.

The recommended source for the first implementation is a small static taxonomy projection in contract/prompt-adjacent code, backed by the accepted Stage Copilot contract vocabulary and current key inventory. It should classify existing keys for display only:

- Capability PromptSpecs.
- Stage Copilot PromptSpecs.
- Legacy/current copilot-like PromptSpecs.
- Unknown/unclassified PromptSpecs.

Do not make Prompt Studio or `/workspace/prompts` imply that legacy/current prompts have already been migrated. `admin_assistant_prompt`, `pass5.admin_assistant`, and `pass6_analysis_copilot` should be labelled as current copilot-like prompt keys that remain unchanged.

## 2. Current Display and Read Surfaces

### Global Prompt Registry

Files inspected:

- `apps/admin-web/app/prompts/page.tsx`
- `apps/admin-web/app/api/prompts/route.ts`
- `apps/admin-web/app/api/prompts/[id]/route.ts`
- `packages/contracts/src/types/prompt-spec.ts`
- `packages/contracts/src/schemas/prompt-spec.schema.json`

Current behavior:

- Displays generic `PromptRecord` rows from `/api/prompts`.
- Columns include prompt ID, name, type, role, module, version, and status.
- It is runtime/API-backed and reads persistence through app API.
- It does not know Stage Copilot taxonomy.

Must not touch yet:

- Prompt registry API.
- Prompt record schema.
- Prompt registration/edit behavior.

### Pass 4 Targeting Prompt Workspace

Files inspected:

- `apps/admin-web/app/targeting-rollout/prompts/page.tsx`
- `apps/admin-web/app/api/targeting-rollout/prompts/route.ts`
- `packages/prompts/src/index.ts`

Current behavior:

- Displays and tests the Pass 4 targeting rollout PromptSpec.
- Uses `pass4.targeting_rollout.packet`.
- Capability prompt only.

Must not touch yet:

- Pass 4 PromptSpec key.
- Prompt test route/provider behavior.

### Pass 6 Prompt Workspace

Files inspected:

- `apps/admin-web/app/pass6/prompts/page.tsx`
- `apps/admin-web/app/pass6/prompts/[promptSpecId]/page.tsx`
- `apps/admin-web/app/api/pass6/prompts/route.ts`
- `packages/contracts/src/types/pass6-prompt-workspace.ts`
- `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json`
- `packages/prompts/src/index.ts`

Current behavior:

- Creates defaults with `createDefaultPass6PromptSpecs`.
- Lists specs with `listPass6PromptSpecs`.
- Builds comparisons by mapping `PASS6_PROMPT_CAPABILITY_KEYS`.
- Labels the first table column as "Capability".
- Includes `pass6_analysis_copilot` inside the current Pass 6 capability-key enum/list.
- Supports promotion, archive, clone-to-draft, prompt tests, compiled prompt snapshots, and provider-gated test execution.

Must not touch yet:

- `PASS6_PROMPT_CAPABILITY_KEYS`.
- `Pass6PromptCapabilityKey`.
- `pass6_analysis_copilot`.
- Pass 6 prompt route behavior.
- Pass 6 compiled preview behavior.

### Pass 5 Prompt Family / Admin Assistant

Files inspected:

- `packages/prompts/src/index.ts`
- `packages/participant-sessions/src/index.ts`
- `scripts/prove-pass5-block8-prompt-family.mjs`
- `scripts/prove-pass5-block12-admin-assistant.mjs`
- `scripts/prove-pass5-block12-stage-aware-copilot.mjs`

Current behavior:

- `PASS5_PROMPT_FAMILY` is `pass5_participant_session_prompt_family`.
- `admin_assistant_prompt` maps to linked module `pass5.admin_assistant`.
- `compilePass5Prompt("admin_assistant_prompt", ...)` is used by Pass 5 assistant runtime.
- Provider jobs record `promptFamily: PASS5_PROMPT_FAMILY` and `promptName: "admin_assistant_prompt"`.

Must not touch yet:

- `PASS5_PROMPT_FAMILY`.
- `admin_assistant_prompt`.
- `pass5.admin_assistant`.
- Pass 5 assistant runtime.

### Workspace Prompt Surface

Files inspected:

- `apps/admin-web/app/workspace/prompts/page.tsx`
- `apps/admin-web/app/workspace/_components/WorkspacePlaceholderPage.tsx`

Current behavior:

- `/workspace/prompts` is a placeholder/static navigation surface.
- It links to `/prompts`, `/targeting-rollout/prompts`, and `/pass6/prompts`.
- It does not read PromptSpecs or taxonomy.

Must not touch yet:

- Workspace UI.
- Workspace visual baseline.
- Workspace Prompt Studio placeholder.

### Proof Scripts Depending on Current Keys

Files inspected:

- `scripts/prove-pass5-block8-prompt-family.mjs`
- `scripts/prove-pass5-block12-admin-assistant.mjs`
- `scripts/prove-pass5-block12-stage-aware-copilot.mjs`
- `scripts/prove-pass6-block4-prompt-workspace.mjs`
- `scripts/prove-pass6-block18-copilot.mjs`
- `scripts/prove-stage-copilot-foundation-contracts.mjs`

Current dependency points:

- Pass 5 proof scripts compile and assert `admin_assistant_prompt` and `PASS5_PROMPT_FAMILY`.
- Pass 6 proof scripts import/compare `PASS6_PROMPT_CAPABILITY_KEYS` and instantiate `pass6_analysis_copilot`.
- Stage Copilot foundation proof now validates metadata-only legacy mappings for `admin_assistant_prompt` and `pass6_analysis_copilot`.

## 3. Safe Read-Model Options

### Option A - Contract-only static taxonomy fixtures

What it produces:

- Static taxonomy fixture(s) using `StageCopilotPromptSpecKind`, `StageCopilotPromptSpecClassification`, and `StageCopilotPromptSpecRef`.
- A canonical list of known prompt keys classified for display.
- No runtime reads.

Files/packages likely touched later:

- `packages/contracts` if fixtures/types are contract-owned.
- Possibly a proof script.

Risk level:

- Low.

Compatibility risk:

- Low. It does not import `packages/prompts` or mutate prompt records.

Proof strategy:

- Validate fixtures against contract schema.
- Assert legacy mappings preserve existing keys.
- Assert unknown/rename/migration claims are rejected.

Why use now:

- Best first implementation if the goal is contract stability and no runtime risk.

Why not sufficient long-term:

- It can drift from actual prompt registry unless later projection checks current keys.

### Option B - Read-only projection from existing prompt registry + StageCopilotProfile refs

What it produces:

- A read-only view model that merges current prompt registry data with taxonomy classifications.
- Display rows such as "Capability", "Stage Copilot", "Legacy/current Copilot-like", and "Unclassified".
- Existing prompt records remain unchanged.

Files/packages likely touched later:

- `packages/prompts` for a pure read-model helper.
- Possibly `packages/contracts` only for shared view-model types if needed.
- Later `apps/admin-web` for display.

Risk level:

- Medium-low.

Compatibility risk:

- Moderate if it imports runtime-heavy prompt functions or changes existing list functions.
- Low if implemented as additive pure projection over supplied arrays/refs.

Proof strategy:

- Unit/proof script passes static prompt records into projection.
- Assert no mutation of input prompt records.
- Assert current keys remain unchanged.
- Assert `admin_assistant_prompt` and `pass6_analysis_copilot` are labelled legacy/current copilot-like.

Why use now:

- Best functional path after static contract fixture is accepted.
- It gives Prompt Studio a safe read model without changing prompt runtime behavior.

Why not first if strictest safety is desired:

- It likely touches `packages/prompts`, which should happen only after metadata shape is accepted.

### Option C - Future persisted profile/config read model

What it produces:

- Persisted Stage Copilot profiles or taxonomy configs loaded from a repository.
- Potential admin-configurable profile/taxonomy state.

Files/packages likely touched later:

- `packages/persistence`
- `packages/contracts`
- Admin APIs
- Admin UI

Risk level:

- High for near term.

Compatibility risk:

- High. Persistence implies lifecycle, migration, admin editing, and data ownership decisions.

Proof strategy:

- Repository contract proof.
- Migration fixtures.
- Backward compatibility proof for legacy prompt keys.

Why not use now:

- Too early. The product needs stable read-only classification before persisted configurability.

### Option D - Workspace-only static display mapping

What it produces:

- Static taxonomy labels on `/workspace/prompts`.
- No prompt registry integration.
- Could explain the taxonomy concept without reading records.

Files/packages likely touched later:

- `apps/admin-web/app/workspace/prompts/page.tsx`
- Workspace i18n/static components.

Risk level:

- Medium because `/workspace` visual baseline is accepted and should not be disturbed casually.

Compatibility risk:

- Low for prompt runtime, but moderate for visual/product baseline.

Proof strategy:

- Visual regression/audit.
- Confirm no runtime/API/provider calls.

Why not use now:

- It does not solve Prompt Studio read-model classification.
- It risks touching workspace UI before read-model APIs or product copy are accepted.

## 4. Recommended Read-Model Source

Recommended source sequence:

1. **Contract/static taxonomy fixtures first**
   - Establish a canonical metadata fixture shape.
   - Prove the taxonomy can classify current prompt keys without renaming them.

2. **Read-only projection from existing prompt data + taxonomy refs second**
   - Implement as a pure function that accepts existing prompt records/specs and taxonomy refs.
   - It should not call providers, mutate records, or run prompt tests.

3. **Prompt Studio display third**
   - Use the read-only projection to group and label prompts.
   - Keep existing edit/promote/test behavior unchanged.

4. **Workspace display later**
   - Static overview first, then read-model-backed display only after APIs/view-models are scoped.

Do not use as first source:

- Prompt runtime mutation.
- Persistence.
- Workspace-only mapping.
- Admin-configurable profiles.

## 5. Prompt Studio Display Model

Prompt Studio should eventually display four taxonomy groups.

### Capability PromptSpecs

Suggested admin label:

**Capability PromptSpecs**

Suggested description:

These prompts support stage work such as extraction, drafting, triage, targeting, synthesis, evaluation, or package drafting. Changing them can affect generated stage work through governed routes and tests.

Examples:

- `pass3.hierarchy.draft`
- `pass3.source_hierarchy.triage`
- `pass4.targeting_rollout.packet`
- Pass 5 extraction/clarification/recheck prompts
- Pass 6 synthesis/evaluation/package prompts

### Stage Copilot PromptSpecs

Suggested admin label:

**Stage Copilot PromptSpecs**

Suggested description:

These prompts control stage-scoped conversation behavior: explanation depth, challenge level, alternatives, advisory what-if discussion, refusal behavior, citation behavior, and routed recommendation wording. They do not change official records, gates, or business logic.

Examples:

- Future `sources_context.copilot`
- Future `participant_evidence.copilot`
- Future `analysis_package.copilot`

### Legacy/current Copilot-like Prompts

Suggested admin label:

**Current Copilot-like Prompt Keys**

Suggested description:

These existing keys currently behave like assistant/copilot prompts, but they have not been renamed or migrated. They remain in their current prompt systems for compatibility.

Examples:

- `admin_assistant_prompt`
- `pass5.admin_assistant`
- `pass6_analysis_copilot`

Required warning:

Do not imply these have already migrated to native Stage Copilot PromptSpecs.

### Unknown / Unclassified Prompts

Suggested admin label:

**Unclassified PromptSpecs**

Suggested description:

These prompt keys are visible but do not yet have Stage Copilot taxonomy metadata. They should be reviewed before being displayed as capability or Copilot prompts.

Display requirements:

- Always show original key/module.
- Show taxonomy label separately from lifecycle status.
- Preserve `draft`, `active`, `previous`, `archived`.
- Preserve compiled preview behavior.
- Preserve existing promote/archive/test actions.

## 6. Workspace Display Model

`/workspace/prompts` should eventually show taxonomy, but not as a live Copilot or prompt editor.

What can be static now:

- A plain explanation that Prompt Studio has two future categories: Capability PromptSpecs and Stage Copilot PromptSpecs.
- Links to existing prompt surfaces.
- Boundary copy that Stage Copilot PromptSpecs control conversation behavior, not business logic.

What should wait:

- Read-model-backed prompt lists.
- Stage Copilot profile state.
- Prompt taxonomy filters.
- Any shared dock integration.

What must remain advanced/internal:

- Prompt promotion/archive actions.
- Provider prompt tests.
- Raw prompt test outputs containing sensitive case data.
- Legacy/current migration controls.

What must not be shown as runtime-ready:

- Do not show future Stage Copilot PromptSpecs as live if they are only planned refs.
- Do not show `admin_assistant_prompt` or `pass6_analysis_copilot` as migrated native Stage Copilot PromptSpecs.
- Do not imply `/workspace/prompts` can run providers or alter prompt behavior.

## 7. Profile Source Strategy

Potential sources:

- Code fixtures.
- Contract test fixtures.
- Handoff/docs only.
- Prompt registry metadata.
- Persisted profiles.
- Admin-configurable profiles.

Recommended first source:

**Code/contract fixtures plus read-only projection metadata.**

Why:

- It is reviewable and proofable.
- It does not require persistence.
- It does not mutate current PromptSpec records.
- It can reference existing keys exactly as they are.

Recommended next source after fixture proof:

**Read-only projection from existing prompt records/specs and taxonomy refs.**

Defer:

- Persisted profiles.
- Admin-configurable profiles.
- Prompt registry schema migration.
- Workspace/API-backed profile reads.

## 8. Compatibility Requirements

Must remain untouched:

- `admin_assistant_prompt`
- `pass5.admin_assistant`
- `pass6_analysis_copilot`
- `PASS5_PROMPT_FAMILY`
- `PASS6_PROMPT_CAPABILITY_KEYS`
- `StructuredPromptSpec`
- `Pass6PromptSpec`
- Existing prompt compilation.
- Existing prompt promotion/archive/test behavior.
- Existing compiled prompt previews.
- Existing proof scripts.
- Pass 5 assistant runtime.
- Pass 6 Copilot runtime.
- Prompt Studio UI until explicitly scoped.
- `/workspace` UI until explicitly scoped.

Compatibility rules:

- Taxonomy may classify existing keys, not rename them.
- Legacy/current copilot-like prompts must be labelled as legacy/current.
- Unknown prompts must remain visible but unclassified.
- Read-model projection must be pure and read-only.
- No provider/test/runtime behavior should run while producing taxonomy display.

## 9. Recommended Implementation Slices

### Slice 1: Static Taxonomy Fixture / Projection Shape

Purpose:

- Establish the canonical list of known prompt keys and taxonomy labels.

Files/packages likely touched:

- `packages/contracts` or `packages/prompts`, depending on ownership decision.
- A proof script.

Produces:

- Static metadata for current prompt keys.
- `legacy_copilot_like` labels for Pass 5/6 current copilot-like keys.

Must not do:

- No prompt runtime changes.
- No UI.
- No persistence.

Proof strategy:

- Assert keys are preserved exactly.
- Assert unknown taxonomy kinds are rejected.
- Assert legacy mappings do not rename keys.

Compatibility risks:

- Low if kept static and additive.

### Slice 2: Pure Read-Only Taxonomy Projection Helper

Purpose:

- Project existing prompt records/specs into taxonomy display rows.

Files/packages likely touched:

- Likely `packages/prompts` as an additive helper, or `packages/contracts` if only shape.

Produces:

- Rows with original key, display label, taxonomy kind, lifecycle status, source registry, and migration status.

Must not do:

- No provider calls.
- No DB writes.
- No prompt mutation.
- No runtime imports.

Proof strategy:

- Pass fixture prompt records into helper.
- Assert input objects are unchanged.
- Assert legacy/current prompts are labelled correctly.

Compatibility risks:

- Medium-low. Keep helper pure and isolated.

### Slice 3: Prompt Studio Read-Only Display Integration

Purpose:

- Show taxonomy groups in Prompt Studio.

Files/packages likely touched:

- `apps/admin-web/app/prompts/page.tsx`
- `apps/admin-web/app/pass6/prompts/page.tsx`
- possibly Prompt Studio detail pages.

Produces:

- Grouped labels and admin-safe descriptions.

Must not do:

- No edit/promote/test behavior changes.
- No key renames.
- No provider execution changes.

Proof strategy:

- Existing prompt proof scripts.
- Browser/visual check if UI changes.

Compatibility risks:

- Medium. UI copy must avoid implying migration.

### Slice 4: Workspace Static Prompt Taxonomy Overview

Purpose:

- Explain taxonomy at `/workspace/prompts` without live read model.

Files/packages likely touched:

- Workspace prompt page and i18n/static components.

Produces:

- Static overview and links only.

Must not do:

- No prompt lists from runtime data.
- No provider/test controls.
- No shared dock.

Proof strategy:

- Workspace visual gate.
- Confirm no API/runtime calls.

Compatibility risks:

- Medium because `/workspace` visual baseline is accepted.

### Slice 5: Future Persisted Profile/Config Read Model

Purpose:

- Persist Stage Copilot profile/taxonomy configuration after the static/projection model is proven.

Files/packages likely touched:

- `packages/persistence`
- APIs
- Admin UI

Produces:

- Managed profile/taxonomy configuration.

Must not do:

- Do not implement before read-only projection is proven.

Proof strategy:

- Migration fixtures.
- Backward compatibility tests.

Compatibility risks:

- High. Defer.

## 10. Proof Strategy

Future implementation should prove:

- Prompt keys were not renamed.
- `packages/prompts` runtime behavior was not changed.
- Taxonomy projection is read-only.
- `admin_assistant_prompt`, `pass5.admin_assistant`, and `pass6_analysis_copilot` remain legacy/current labels.
- Unknown/unclassified prompts remain visible and are not mislabelled.
- No provider behavior was introduced.
- No persistence was introduced.
- Existing Pass 5 prompt family proof still passes.
- Existing Pass 5 assistant proof still passes where relevant.
- Existing Pass 6 Prompt Workspace proof still passes.
- Existing Pass 6 Copilot proof still passes where relevant.
- `/workspace` visual baseline is unaffected if UI is not touched.

Recommended proof checks later:

- Static taxonomy fixture proof.
- Pure projection proof with frozen input fixtures.
- No-key-rename assertions.
- Legacy/current label assertions.
- Existing proof scripts as compatibility checks.

Do not include in proof:

- Live providers.
- DB writes.
- Server start.
- UI mutation.
- Runtime chat execution.

## 11. Risks, Open Questions, and Required Decisions

### Critical risks

- Accidentally changing `PASS6_PROMPT_CAPABILITY_KEYS` while trying to display `pass6_analysis_copilot` as Stage Copilot.
- Relabelling `admin_assistant_prompt` as fully migrated instead of legacy/current.
- Introducing projection helper behavior that compiles prompts or runs provider tests.
- Adding Prompt Studio UI changes before read-model proof.
- Touching `/workspace` before visual baseline planning.

### Non-critical risks

- Static taxonomy fixtures can drift from current prompt keys.
- Admin labels may need iteration to avoid confusion.
- Unknown/unclassified prompts may initially look incomplete.

### Required operator decisions

- Should the first projection helper live in `packages/contracts` as static fixtures or `packages/prompts` as a pure read-model helper?
- Should Prompt Studio UI wait until the projection helper has its own proof script?
- Should `/workspace/prompts` remain static until an API/read-model exists?
- What exact admin labels should be used for "legacy/current copilot-like" prompts?

### Deferred

- Persisted Stage Copilot profiles.
- Admin-configurable taxonomy.
- PromptSpec schema migration.
- Prompt Studio UI changes.
- Workspace UI changes.
- Runtime adapters.
- Provider-backed Copilot behavior.

## 12. Final Recommendation

Build a static, contract-aligned taxonomy fixture/projection proof first. Then add a pure read-only projection helper that can classify existing prompt records without mutating them. Only after that should Prompt Studio display be updated.

Do not start with UI, persistence, PromptSpec schema migration, or runtime adapters. The next implementation should prove one thing only: current prompt keys can be read and labelled as Capability, Stage Copilot, legacy/current copilot-like, or unknown/unclassified without changing prompt runtime behavior.
