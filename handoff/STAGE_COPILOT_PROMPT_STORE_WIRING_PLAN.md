# Stage Copilot Prompt Store Wiring Plan

## 1. Executive Summary

The Stage Copilot System Prompt repository is ready for a small store-wiring slice, but it should not be folded into the broad `createSQLiteIntakeRepositories` factory yet.

Current state:
- `StageCopilotSystemPromptRepository` exists in `packages/persistence`.
- `InMemoryStageCopilotSystemPromptRepository` exists and is already included in `createInMemoryStore`.
- `SQLiteStageCopilotSystemPromptRepository` exists and is direct-construction only.
- The dedicated SQLite table `stage_copilot_system_prompts` exists with stage/status/version indexes and a one-current-per-stage partial unique index.
- Proofs validate in-memory behavior, SQLite reload durability, current/history/reset behavior, and no writes to PromptSpec tables.
- `apps/admin-web/lib/store.ts` currently builds a broad app store by spreading `createInMemoryStore()` and overlaying many repositories from `createSQLiteIntakeRepositories()`.

Recommended next wiring model: add a dedicated Stage Copilot repository factory in `packages/persistence`, such as `createStageCopilotRepositories(dbPath?)`, returning only `stageCopilotSystemPrompts`. Then, in a later app-store slice, add a dedicated admin-web accessor or explicit store overlay for that repository. Do not wire it into `createSQLiteIntakeRepositories` first, because that factory currently represents the intake/pass persistence surface and already includes PromptSpec repositories that Stage Copilot prompt storage must stay separate from.

## 2. Current Repository State

Files inspected:
- `packages/persistence/src/index.ts`
- `apps/admin-web/lib/store.ts`
- `apps/admin-web/app/api/pass6/prompts/route.ts`
- `apps/admin-web/app/api/pass6/copilot/route.ts`
- Stage Copilot proof scripts
- PromptSpec-related references in `packages/prompts/src/index.ts`

What exists now:
- `StoredStageCopilotSystemPromptRecord` is persistence-local and aligned to the Stage Copilot editable prompt model.
- `StageCopilotSystemPromptRepository` supports:
  - `save`
  - `findById`
  - `findCurrentByStage`
  - `findCurrentByStageOrDefault`
  - `listHistoryByStage`
  - `findAll`
- `InMemoryStageCopilotSystemPromptRepository` validates records, supersedes prior current records, preserves history, and clones records.
- `SQLiteStageCopilotSystemPromptRepository` uses the dedicated `stage_copilot_system_prompts` table.
- `createInMemoryStore()` already includes `stageCopilotSystemPrompts: new InMemoryStageCopilotSystemPromptRepository()`.

How SQLite is constructed now:
- Direct construction only:
  - `new SQLiteStageCopilotSystemPromptRepository(dbPath)`
- It uses the existing SQLite database initialization path through `openIntakeDatabase(dbPath)`.
- It is not returned by `createSQLiteIntakeRepositories`.
- It is not wired into `apps/admin-web/lib/store.ts`.

Proven behavior:
- Default fallback before persistence.
- Current prompt survives repository reload.
- History survives repository reload.
- Reset-to-default survives repository reload.
- One current prompt per stage.
- Unsafe authority claims and known analysis prompt keys are rejected.
- No writes to `structured_prompt_specs`.
- No writes to Pass 6 PromptSpec records in `pass6_core_records`.
- No `packages/prompts` import in the repository proof.

What remains direct-construction only:
- SQLite access for app/API use.
- Admin-web store access.
- Any future save/reset route.
- Any future UI/control surface.

## 3. Store Wiring Options

### Option A — Wire into `createSQLiteIntakeRepositories`

What it produces:
- Adds `stageCopilotSystemPrompts` to the large SQLite factory used by admin-web.

Dependency direction:
- App imports one existing broad persistence factory.

Coupling risk:
- Medium. The factory already returns Capability / Analysis PromptSpec repositories, including `structuredPromptSpecs` and `pass6PromptSpecs`.
- Adding Stage Copilot System Prompts here may make it look like another PromptSpec-adjacent analysis repository.

Implementation complexity:
- Low.

Proof strategy:
- Extend factory shape proof.
- Verify Stage Copilot rows use only `stage_copilot_system_prompts`.
- Verify existing Pass 5/6 persistence proofs still pass.

Why it should or should not be used now:
- It is convenient but not the safest next step. Use later only if the team accepts that the broad factory is the canonical app persistence surface.

### Option B — Create a Dedicated `createStageCopilotRepositories`

What it produces:
- A focused factory returning:
  - `stageCopilotSystemPrompts: new SQLiteStageCopilotSystemPromptRepository(dbPath)`
- Optionally a typed `StageCopilotPersistenceRepositories` interface.

Dependency direction:
- App/API can import a Stage Copilot-specific persistence factory from `packages/persistence`.

Coupling risk:
- Low. It keeps Stage Copilot prompt storage visibly separate from Capability PromptSpec repositories.

Implementation complexity:
- Low.

Proof strategy:
- Prove direct factory construction.
- Prove in-memory and SQLite repository behavior remain consistent.
- Prove the factory does not expose or touch PromptSpec repositories.

Why it should or should not be used now:
- Recommended. It is the smallest safe bridge from direct construction to app-ready access without broad store coupling.

### Option C — App/API Direct Construction

What it produces:
- Future app/API routes call `new SQLiteStageCopilotSystemPromptRepository()` directly.

Dependency direction:
- Admin-web depends directly on repository class.

Coupling risk:
- Low for PromptSpecs, but medium for app maintainability because db path handling and singleton/global behavior can drift route by route.

Implementation complexity:
- Low.

Proof strategy:
- Route-level proof or a small app-store proof.
- Verify no PromptSpec imports or provider/runtime behavior.

Why it should or should not be used now:
- Acceptable for scripts/proofs, but not ideal for app access. Use a factory/accessor instead so db path and hot-reload semantics are centralized.

### Option D — Add to Existing App Store Wrapper

What it produces:
- `apps/admin-web/lib/store.ts` overlays `stageCopilotSystemPrompts` with a SQLite repository, similar to existing intake/pass repos.

Dependency direction:
- App store consumes persistence repository directly or via a factory.

Coupling risk:
- Medium if done by importing the class directly.
- Lower if done through a dedicated Stage Copilot factory.

Implementation complexity:
- Low-medium.

Proof strategy:
- Verify `store.stageCopilotSystemPrompts` is SQLite-backed while PromptSpec repositories remain unchanged.
- Verify no UI/API/runtime changes.
- Existing admin-web typecheck.

Why it should or should not be used now:
- Should come after a dedicated Stage Copilot factory exists. The current app store is broad and already mixes in many SQLite repositories; adding another direct class import now would be less clean.

### Option E — Keep Direct Construction Until API/UI Design

What it produces:
- No wiring change.

Dependency direction:
- None.

Coupling risk:
- Lowest now.

Implementation complexity:
- None.

Proof strategy:
- Continue relying on direct-construction SQLite proof.

Why it should or should not be used now:
- Reasonable if no API/control surface is imminent. If the next goal is editable prompt access from admin-web, it delays necessary plumbing.

## 4. Recommended Wiring Model

Recommended sequence:

1. Add a dedicated persistence factory:
   - `StageCopilotPersistenceRepositories`
   - `createStageCopilotRepositories(dbPath?: string)`
   - returns only `stageCopilotSystemPrompts`

2. Add proof for the factory:
   - factory returns a SQLite-backed Stage Copilot prompt repository;
   - save/reload works through the factory;
   - factory does not expose PromptSpec repositories;
   - existing direct SQLite proof still passes.

3. In a later admin-web wiring slice, update `apps/admin-web/lib/store.ts` to use that dedicated factory and overlay only `stageCopilotSystemPrompts`.

Why this model:
- Keeps Stage Copilot prompt storage separate from Capability / Analysis PromptSpec persistence.
- Makes future app/API routes simple: consume `store.stageCopilotSystemPrompts`.
- Avoids putting Stage Copilot prompt storage into the large intake/pass factory prematurely.
- Keeps db path behavior centralized.
- Provides a clean proof boundary before UI/API work.

## 5. In-Memory Store Wiring

Current state:
- `createInMemoryStore()` already includes `stageCopilotSystemPrompts`.
- `InMemoryStore` already has `stageCopilotSystemPrompts: StageCopilotSystemPromptRepository`.

Recommendation:
- Keep the in-memory wiring as-is.
- Do not create a second in-memory Stage Copilot store factory unless future tests need a smaller isolated fixture.
- Future proofs should assert that the in-memory and SQLite repository implementations satisfy the same interface and behavior.

Reasoning:
- The in-memory repository is useful as a fallback/default implementation in the existing app store shape.
- Changing it now would add churn without improving separation.
- The separation risk is mostly on the SQLite/app-store side, not in-memory.

## 6. SQLite Store Wiring

Current state:
- `SQLiteStageCopilotSystemPromptRepository` is exported and direct-construction only.
- `createSQLiteIntakeRepositories()` does not include it.
- `apps/admin-web/lib/store.ts` therefore currently keeps the in-memory `stageCopilotSystemPrompts` from `createInMemoryStore()`.

Recommendation:
- Do not add it to `createSQLiteIntakeRepositories` as the next step.
- Add a dedicated Stage Copilot SQLite factory first:
  - `createStageCopilotRepositories(dbPath?: string)`
  - possibly `createSQLiteStageCopilotRepositories(dbPath?: string)` if naming should be explicit

Future app-store wiring:
- Import the dedicated factory in `apps/admin-web/lib/store.ts`.
- Create `const stageCopilotRepositories = createStageCopilotRepositories();`
- Overlay:
  - `stageCopilotSystemPrompts: stageCopilotRepositories.stageCopilotSystemPrompts`

Do not wire:
- `structuredPromptSpecs`
- `pass6PromptSpecs`
- any prompt test repositories
- any provider/runtime repository

## 7. App Store / Admin Web Considerations

Existing pattern:
- `apps/admin-web/lib/store.ts` exports one global `store`.
- It persists across dev hot reloads through `globalThis.__workflowStore__`.
- It starts with `createInMemoryStore()` and overlays SQLite-backed repositories from `createSQLiteIntakeRepositories()`.

Future route access options:

Through existing `store`:
- Best after dedicated factory wiring exists.
- Future routes can use `store.stageCopilotSystemPrompts`.
- Lowest friction for current app patterns.

Through a dedicated Stage Copilot store accessor:
- Could add `apps/admin-web/lib/stage-copilot-store.ts`.
- Cleaner separation from the broad `store`, but adds a second app-level store pattern.
- Useful if Stage Copilot grows multiple repositories beyond prompts.

Through direct repository construction:
- Acceptable for proofs, less ideal for app routes.
- Risks duplicate db path handling and multiple construction sites.

Through future service layer:
- Best once API save/reset semantics are added.
- Service should compose:
  - Stage Copilot prompt defaults/helpers from `@workflow/stage-copilot`;
  - Stage Copilot prompt repository from `@workflow/persistence`;
  - request actor/timestamp/change-note metadata from the API layer.

Recommendation:
- Next implementation: persistence-level dedicated factory only.
- Later implementation: app store overlay using that factory.
- API/UI should wait until after store wiring proof.

## 8. Audit and User Metadata

Future save/reset operations need:
- `updatedBy`
- `changeNote`
- timestamp
- `source`
- `defaultRefId`

API layer responsibilities:
- Determine authenticated or operator actor ID.
- Capture request timestamp.
- Capture admin-provided `changeNote`.
- Determine operation type:
  - admin custom save
  - reset to default
- Select target stage.

`packages/stage-copilot` responsibilities:
- Build the next editable prompt record.
- Build reset-to-default records.
- Validate that prompt content is conversation/custom-instruction only.
- Preserve separation from Capability PromptSpecs.

Repository responsibilities:
- Validate stored record safety before save.
- Persist records.
- Supersede prior current version.
- Preserve history.
- Return cloned records.

Repository should not:
- infer user identity;
- synthesize prompt content;
- decide admin intent;
- call providers;
- compile prompts;
- mutate Capability PromptSpecs;
- decide official analysis outcomes.

## 9. Separation from Capability PromptSpecs

Future wiring must prove:
- no writes to `StructuredPromptSpecRepository`;
- no writes to `Pass6PromptSpecRepository`;
- no writes to `structured_prompt_specs`;
- no writes to `pass6_core_records` for `pass6_prompt_spec`;
- no import from `packages/prompts`;
- no prompt compilation or prompt test execution;
- no provider calls;
- no analysis prompt lifecycle changes;
- no mutation of prompt keys:
  - `admin_assistant_prompt`
  - `pass5.admin_assistant`
  - `pass6_analysis_copilot`
  - `PASS5_PROMPT_FAMILY`
  - `PASS6_PROMPT_CAPABILITY_KEYS`

The key principle: Stage Copilot System Prompts are custom instructions for conversation behavior. They are not Capability / Analysis PromptSpecs and should not be stored, listed, promoted, archived, compiled, or tested through the analysis PromptSpec system.

## 10. Recommended Implementation Slice

### Slice 1 — Stage Copilot Repository Factory

Purpose:
- Create a dedicated persistence factory for Stage Copilot repositories without app wiring.

Files/packages likely touched:
- `packages/persistence/src/index.ts`
- new proof script under `scripts/`

What it produces:
- `StageCopilotPersistenceRepositories` interface
- `createStageCopilotRepositories(dbPath?: string)` or `createSQLiteStageCopilotRepositories(dbPath?: string)`
- proof that factory-created repository persists/reloads and remains separate from PromptSpecs

What it must not do:
- no `createSQLiteIntakeRepositories` changes
- no admin-web changes
- no UI/API
- no `packages/prompts`
- no PromptSpec table/repository writes

Proof strategy:
- Instantiate factory with a temporary SQLite path.
- Save/reload a Stage Copilot System Prompt.
- Confirm dedicated table rows only.
- Confirm factory object does not include PromptSpec repositories.
- Existing Stage Copilot prompt repository proofs still pass.

Risk level: low.

### Slice 2 — Admin Store Overlay

Purpose:
- Wire the dedicated Stage Copilot repository into admin-web store access.

Files/packages likely touched:
- `apps/admin-web/lib/store.ts`
- possibly one proof script

What it produces:
- `store.stageCopilotSystemPrompts` becomes SQLite-backed in admin-web.

What it must not do:
- no route/UI/API behavior
- no prompt editing endpoint
- no provider/runtime
- no PromptSpec repository changes

Proof strategy:
- Import admin store in a proof-safe way if feasible, or source-inspect wiring.
- Verify no `packages/prompts` import in Stage Copilot store wiring.
- Verify existing repository proofs pass.
- Run typecheck.

Risk level: medium because admin-web store touches broad app state.

### Slice 3 — Read-Only API Probe

Purpose:
- Add a future read-only endpoint or internal service to list current/default Stage Copilot prompt records.

Files/packages likely touched:
- `apps/admin-web/app/api/...`
- possibly app-local service file

What it produces:
- Read-only access for future UI.

What it must not do:
- no save/reset
- no provider/runtime
- no PromptSpec edits

Proof strategy:
- Route proof with no DB writes except setup.
- Confirm no PromptSpec repository writes.

Risk level: medium.

### Slice 4 — Save/Reset API

Purpose:
- Persist editable Stage Copilot Instructions with audit metadata.

Files/packages likely touched:
- admin-web route/service
- `packages/stage-copilot` helpers only if gaps are found

What it produces:
- Save custom prompt.
- Reset to default.

What it must not do:
- no UI unless separately scoped
- no Capability PromptSpec mutation
- no prompt compilation
- no provider/runtime

Proof strategy:
- Save/reset route proof.
- Actor/changeNote/timestamp proof.
- PromptSpec non-interference proof.

Risk level: medium-high.

## 11. Proof Strategy

Future wiring proof should validate:
- app/store or factory can access the Stage Copilot prompt repository;
- in-memory and SQLite variants satisfy the same repository interface;
- default fallback works;
- save/reload works;
- reset/history behavior remains unchanged;
- existing Stage Copilot repository proofs still pass;
- factory/store wiring does not expose or use `StructuredPromptSpecRepository`;
- factory/store wiring does not expose or use `Pass6PromptSpecRepository` for Stage Copilot prompts;
- no writes occur to PromptSpec tables;
- `packages/prompts` is not imported by Stage Copilot prompt storage wiring;
- no prompt compilation or prompt test execution;
- no provider calls;
- no UI/API/runtime/retrieval introduced in the wiring slice.

Recommended command set for the first factory slice:
- `pnpm build:contracts`
- all existing Stage Copilot prompt/storage proofs
- new factory proof
- `pnpm --filter @workflow/persistence build`
- `pnpm --filter @workflow/stage-copilot build`
- `pnpm typecheck`

## 12. Risks, Open Questions, and Required Decisions

Critical risks:
- Accidentally treating Stage Copilot System Prompts as Capability PromptSpecs.
- Adding the repository to a broad factory and later having routes confuse `stageCopilotSystemPrompts` with `structuredPromptSpecs` or `pass6PromptSpecs`.
- Building API/UI save behavior before the store boundary is proven.
- Letting prompt text grant authority that guardrails reject.

Non-critical risks:
- More factory functions in `packages/persistence` may feel redundant.
- App store already has a broad shape, so a dedicated factory plus later overlay adds one more construction step.
- Direct construction remains useful in proofs, so both paths must stay consistent.

Required operator decisions:
- Should the next slice add a dedicated Stage Copilot factory only, or also wire admin-web store?
- Should the factory be named `createStageCopilotRepositories` or `createSQLiteStageCopilotRepositories`?
- Should future admin-web use the global `store` or a separate Stage Copilot accessor?

Recommended answers:
- Add the dedicated factory only next.
- Prefer `createStageCopilotRepositories` if it returns the production/default SQLite implementation; use `createSQLiteStageCopilotRepositories` if the codebase wants explicit backend naming.
- Use the existing global `store` later for route simplicity, but only after the dedicated factory is proven.

Deferred items:
- UI editor.
- Save/reset API.
- Auth/actor integration.
- Provider-backed Copilot runtime.
- Context assembly/retrieval.
- Prompt Studio display integration.

## 13. Final Recommendation

Build a dedicated Stage Copilot repository factory next, not broad app wiring. Keep `createSQLiteIntakeRepositories` unchanged for now, and prove that the new factory exposes only Stage Copilot prompt storage and never touches Capability / Analysis PromptSpec repositories or tables.

After that factory proof is accepted, wire `apps/admin-web/lib/store.ts` to overlay `stageCopilotSystemPrompts` from the dedicated factory. API/UI save/reset behavior should come after store wiring is proven.
