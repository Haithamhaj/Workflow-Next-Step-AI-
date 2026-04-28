# Stage Copilot Prompt Persistence Plan

## 1. Executive Summary

Editable Stage Copilot System Prompts should be persisted in a dedicated Stage Copilot prompt repository, not in the existing Capability / Analysis PromptSpec storage. The current local model in `packages/stage-copilot` has already proven the core behavior with pure helpers and a proof-only fake repository: one current prompt per stage, custom version saves, superseding previous versions, reset-to-default, history preservation, static default fallback, and rejection of prompt content that claims unsafe authority.

The next durable persistence work should preserve that model while keeping the two prompt systems separate:

- Capability / Analysis System Prompts stay in existing prompt repositories and `packages/prompts`.
- Stage Copilot System Prompts get their own repository interfaces and storage records.
- No prompt compilation, provider calls, PromptSpec lifecycle mutation, or PromptSpec table writes occur when saving Copilot instructions.

Recommended path:

1. Add a dedicated in-memory `StageCopilotSystemPromptRepository` in `packages/persistence` first.
2. Prove it writes only Stage Copilot prompt records and leaves Capability PromptSpec repositories unchanged.
3. Add SQLite storage in a later slice using a separate table, not `structured_prompt_specs`, `pass6_prompt_spec`, or prompt test tables.

## 2. Current Local Editable Model Review

Current local code:

- [editable-system-prompts.ts](/Users/haitham/development/Workflow/packages/stage-copilot/src/editable-system-prompts.ts)
- [system-prompts.ts](/Users/haitham/development/Workflow/packages/stage-copilot/src/system-prompts.ts)
- [prove-stage-copilot-editable-system-prompts.mjs](/Users/haitham/development/Workflow/scripts/prove-stage-copilot-editable-system-prompts.mjs)

What exists now:

- Static Stage Copilot System Prompt defaults for:
  - `sources_context`
  - `hierarchy`
  - `targeting`
  - `participant_evidence`
  - `analysis_package`
  - `prompt_studio`
  - `advanced_debug`
- Local editable record type: `EditableStageCopilotSystemPromptRecord`.
- Local status model: `current | superseded`.
- Local source model: `static_default | admin_custom`.
- Local change reasons: `initial_default | admin_custom_save | reset_to_default`.
- Audit metadata type.
- Pure helpers:
  - `createEditableStageCopilotSystemPromptFromDefault`
  - `createNextStageCopilotSystemPromptVersion`
  - `resetStageCopilotSystemPromptToDefault`
  - `validateEditableStageCopilotSystemPromptRecord`
  - `assertEditableStageCopilotSystemPromptDoesNotClaimAuthority`
  - `getCurrentStageCopilotSystemPrompt`

Behavior already proven:

- Static default can create an editable current record.
- Custom version can be created for each required stage.
- Saving a custom version makes it current.
- Previous current version becomes superseded.
- Version history is preserved.
- Reset-to-default creates a new current version sourced from `static_default`.
- Default fallback works when no custom record exists.
- Records are `stage_copilot_system_prompt`, not Capability PromptSpecs.
- Records preserve `separatesFromCapabilityPromptSpecs: true`.
- Proof-only fake repository changes only fake Copilot prompt records.
- Unsafe authority claims are rejected.

What remains proof-only:

- The fake repository lives only inside the proof script.
- There is no production repository interface.
- There is no in-memory production repository in `packages/persistence`.
- There is no SQLite table or migration.
- There is no app API or UI.
- There is no runtime prompt assembly.

What must remain unchanged:

- `packages/prompts`.
- Capability PromptSpecs.
- PromptSpec keys and families.
- Pass 5 runtime.
- Pass 6 runtime.
- Existing PromptSpec repositories and tables.
- Provider behavior.
- Prompt compilation and prompt tests.

## 3. Persistence Options

### Option A - Dedicated repository in `packages/persistence`

What it produces:

- A new dedicated Stage Copilot System Prompt repository interface.
- In-memory implementation for local/dev/proofs.
- Later SQLite implementation with its own table.
- Durable current/history/reset support for Copilot instructions.

Dependency direction:

- `packages/persistence` imports types from `@workflow/contracts` today and could later import shared contracts if introduced.
- To avoid a dependency cycle, it should not import `@workflow/stage-copilot` directly unless repo conventions allow it. Prefer local stored-record types or shared contracts before persistence implementation.

Risk level: medium.

Compatibility risk:

- Low if separate repository/table names are used.
- Medium if implementers accidentally reuse prompt repositories or app store wiring incorrectly.

Implementation complexity:

- In-memory: low to medium.
- SQLite: medium.

Proof strategy:

- Save/current/history/reset fixture proof.
- Before/after snapshots of `StructuredPromptSpecRepository` and `Pass6PromptSpecRepository`.
- No imports from `packages/prompts`.
- No prompt compilation/provider/test calls.

Why use:

- It matches existing repo architecture for durable storage.
- It can be isolated from Capability PromptSpec storage.
- It supports future UI/API without overloading PromptOps.

### Option B - Keep local/in-memory only for now

What it produces:

- Continue with local helpers and proof-only fake repository.

Dependency direction:

- No new persistence dependency.

Risk level: low.

Compatibility risk:

- Very low.

Implementation complexity:

- None.

Proof strategy:

- Existing editable prompt proof continues to pass.

Why not use as durable model:

- It does not persist operator/admin edits.
- It does not support real control surface behavior.

### Option C - Store in existing PromptSpec repositories

What it produces:

- Copilot instructions stored in `StructuredPromptSpecRepository`, `Pass6PromptSpecRepository`, or prompt registry tables.

Dependency direction:

- Reuses existing prompt persistence and likely `packages/prompts` workflows.

Risk level: high.

Compatibility risk:

- Very high. It mixes the two prompt systems.
- It risks draft/active/previous/archived analysis lifecycle confusion.
- It risks prompt compilation/test/provider behavior becoming associated with Copilot instructions.

Implementation complexity:

- Superficially lower, but proof and product risks are high.

Proof strategy:

- Would need heavy no-cross-write and no-provider guarantees.

Why not use:

- It violates the core product model.
- It risks mutating or confusing official analysis PromptSpecs.

### Option D - Store in a future Stage Copilot profile repository

What it produces:

- Broader persisted Stage Copilot profiles, possibly including prompt text, profile config, boundaries, context refs, and audit.

Dependency direction:

- Future Stage Copilot persistence package/repository would own profiles and prompt records.

Risk level: medium.

Compatibility risk:

- Low for analysis prompts if kept separate.
- Medium because profile records can become too broad and accidentally mix runtime/provider/state configuration.

Implementation complexity:

- Medium to high.

Proof strategy:

- Profile save proof plus prompt-only change proof.
- Boundary fields must remain system-controlled.

Why not first:

- The immediate need is durable editable instructions, not full profile persistence.

### Option E - Store as app-local metadata first

What it produces:

- App-layer metadata map or file-backed/admin-web-local storage.

Dependency direction:

- App owns prompt edits before package/persistence layer.

Risk level: medium to high.

Compatibility risk:

- Medium. App code can blur UI, API, runtime, and storage responsibilities.

Implementation complexity:

- Low initially, high later when migrating.

Proof strategy:

- App route tests and no PromptSpec mutation checks.

Why not use:

- It bypasses package-level safety.
- It makes later durable repository design harder.

## 4. Recommended Persistence Model

Use Option A: a dedicated repository in `packages/persistence`.

Required properties:

- One current prompt per stage.
- Full version history by stage.
- Custom save creates a new current version.
- Previous current becomes superseded.
- Reset-to-default creates a new current version sourced from `static_default`.
- Audit metadata is stored with every version.
- Static defaults remain available as fallback.
- Validation happens before save.
- No writes to Capability PromptSpec repositories.
- No prompt compilation.
- No provider behavior.
- No prompt tests.

Recommended phased model:

1. In-memory repository implementation first.
2. Proof that it is separate from prompt repositories.
3. SQLite implementation later in a separate table.

## 5. Repository Shape

Recommended repository interface behavior:

- `save(record)`
  Saves a validated Stage Copilot System Prompt record. Should reject invalid records before storing.

- `findCurrentByStage(stageKey)`
  Returns the current persisted record for the stage, or `null`.

- `listByStage(stageKey)`
  Returns all versions for a stage, ordered by version or update time.

- `listAll()`
  Useful for admin/debug/proof surfaces.

- `replaceCurrentWithVersion(stageKey, record)` or higher-level service helper
  Marks previous current as superseded and saves the new current record. This can be in `packages/stage-copilot` service helpers or in repository transaction helpers.

- `resetToDefault(stageKey, actor, note)`
  Should likely live in a Stage Copilot service/helper layer, not raw persistence, because it depends on static defaults and validation.

What belongs in `packages/stage-copilot`:

- Editable record semantics.
- Validation helpers.
- Authority claim checks.
- Version transition creation.
- Reset-to-default transition creation.
- Static default fallback logic.

What belongs in `packages/persistence`:

- Stored record type or imported shared record type.
- Repository interface.
- In-memory implementation.
- SQLite implementation later.
- Store wiring only after explicit scope.

What must not belong in `packages/prompts`:

- Stage Copilot System Prompt records.
- Stage Copilot System Prompt repositories.
- Stage Copilot prompt save/reset logic.
- Stage Copilot prompt validation.
- Stage Copilot prompt tests.

## 6. Durable Data Shape

Start from the local model:

- `systemPromptId`
- `stageKey`
- `promptKey`
- `kind`
- `status`
- `version`
- `systemPrompt`
- `source`
- `defaultRefId`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `changeNote`
- `separatesFromCapabilityPromptSpecs`
- `authorityBoundary`

Recommended persistence additions:

- `recordSchemaVersion`: allows later migrations without touching prompt text.
- `supersededAt`: optional, for querying history.
- `supersededBySystemPromptId`: optional, to link version transitions.
- `resetFromSystemPromptId`: optional, for reset audit.
- `operatorScope`: optional later if multi-tenant/operator-specific instructions are required.

Fields not needed now:

- Draft status.
- Active/previous/archived lifecycle.
- Compiled prompt preview.
- Prompt test result refs.
- Provider/model refs.
- Capability key.
- Linked analysis module.

Important durable constraints:

- `kind` must be `stage_copilot_system_prompt`.
- `separatesFromCapabilityPromptSpecs` must be `true`.
- `promptKey` must not equal known analysis prompt keys.
- Only one current record per stage should exist at a time.
- Superseded records must remain readable.

## 7. SQLite and In-Memory Strategy

Implement in-memory first.

Reasons:

- Mirrors existing persistence package pattern.
- Supports fast non-interference proof.
- Avoids DB/table churn before repository semantics are accepted.

Add SQLite later.

SQLite strategy:

- Create a separate table such as `stage_copilot_system_prompts`.
- Store JSON payload plus indexed columns:
  - `id`
  - `stage_key`
  - `status`
  - `version`
  - `prompt_key`
  - `updated_at`
- Add a unique constraint or transactional enforcement for one current per stage.
- Do not touch:
  - `structured_prompt_specs`
  - `pass3_prompt_test_runs`
  - `pass4_prompt_test_runs`
  - Pass 6 prompt core records
  - prompt registry tables

Migration:

- A migration/table creation is required only when SQLite persistence is introduced.
- Do not add SQLite in the first persistence slice unless operator explicitly requests durable DB in the same slice.

## 8. Contract Strategy

Recommended path:

1. Keep local types in `packages/stage-copilot` for the first persistence repository proof if dependency direction allows.
2. If `packages/persistence` cannot import `@workflow/stage-copilot` without an architectural cycle, introduce a small shared contract in `packages/contracts` before production persistence.
3. Add JSON Schema only when records cross package/API/persistence boundaries durably.

Safest first durable path:

- Add shared contracts if needed for dependency direction.
- Otherwise keep persistence stored type structurally aligned with local model and validate via pure Stage Copilot helpers at the service boundary.

Do not:

- Add fields to `StageCopilotProfile` for prompt content now.
- Reuse `StageCopilotPromptSpecRef` as editable prompt content.
- Reuse PromptSpec schemas.

## 9. Separation from Capability PromptSpecs

Persistence must prove:

- No writes to `StructuredPromptSpecRepository`.
- No writes to `Pass6PromptSpecRepository`.
- No writes to `PromptRepository`.
- No changes to `packages/prompts`.
- No changes to PromptSpec keys or prompt family constants.
- No `compileStructuredPromptSpec`.
- No `compilePass5Prompt`.
- No `compilePass6PromptSpec`.
- No provider `runPromptText`.
- No prompt test execution.

Known protected keys/constants:

- `admin_assistant_prompt`
- `pass5.admin_assistant`
- `pass6_analysis_copilot`
- `PASS5_PROMPT_FAMILY`
- `PASS6_PROMPT_CAPABILITY_KEYS`

Recommended proof method:

- Create fake or real in-memory Capability PromptSpec repositories with sentinel records.
- Perform Stage Copilot prompt save/version/reset.
- Assert sentinel records are byte-for-byte unchanged.
- Assert Stage Copilot repo contains only `stage_copilot_system_prompt` records.
- Assert known analysis prompt keys are rejected as Copilot prompt keys.

## 10. Recommended Build Order

### Slice 1 - Persistence repository plan implementation: in-memory only

- Purpose: add dedicated in-memory repository for Stage Copilot System Prompt records.
- Files/packages likely touched: `packages/persistence/src/index.ts`, maybe `packages/stage-copilot` only if dependency-safe helper adaptation is needed, proof script.
- Produces: repository interface, in-memory implementation, proof-only save/version/reset against the real repository interface.
- Must not do: SQLite, app store wiring, UI, API, `packages/prompts`, provider behavior, prompt compilation.
- Proof strategy: save current, supersede previous, list history, reset-to-default, static fallback, no Capability PromptSpec repo mutation.
- Risk level: medium.

### Slice 2 - Store wiring for in-memory app store only

- Purpose: make the new repository available in app store construction without UI/API use.
- Files/packages likely touched: `packages/persistence/src/index.ts`.
- Produces: store field for Stage Copilot prompt repository.
- Must not do: use it from routes, UI, runtime, or PromptOps.
- Proof strategy: store initialization proof and existing typecheck.
- Risk level: medium.

### Slice 3 - Shared contract/schema if needed

- Purpose: add durable cross-package record validation if persistence cannot depend on local Stage Copilot types.
- Files/packages likely touched: `packages/contracts`.
- Produces: `StageCopilotSystemPromptRecord` schema/validator.
- Must not do: modify existing PromptSpec schemas or `StageCopilotProfile` required shape.
- Proof strategy: valid/invalid fixtures and backward compatibility.
- Risk level: medium.

### Slice 4 - SQLite repository

- Purpose: durable DB-backed storage.
- Files/packages likely touched: `packages/persistence/src/index.ts`.
- Produces: separate SQLite table and repository.
- Must not do: touch existing prompt tables or prompt repositories.
- Proof strategy: temp SQLite proof, table isolation, current uniqueness, history preservation, reset-to-default.
- Risk level: medium to high.

### Slice 5 - API and control surface planning/implementation

- Purpose: expose durable Copilot instructions for admin editing.
- Files/packages likely touched: app routes/UI after explicit approval.
- Produces: save/reset/list-history actions and control surface.
- Must not do: mix with Capability PromptSpec editor, run providers, compile prompts, or mutate analysis prompts.
- Proof strategy: route/UI tests, no PromptSpec repo writes, no provider imports.
- Risk level: high.

## 11. Proof Strategy

Future implementation should prove:

- Durable save changes only Stage Copilot prompt records.
- Capability PromptSpecs remain unchanged.
- Current/superseded version behavior works.
- Reset-to-default creates an audited current version.
- Static defaults still work as fallback.
- Known analysis prompt keys are rejected.
- `kind: "capability"` is rejected.
- Prompt content unsafe authority claims are rejected.
- No provider/runtime/UI/API behavior is introduced in persistence slices.
- Existing Stage Copilot proofs still pass:
  - foundation contracts
  - static taxonomy projection
  - foundation package
  - context envelope
  - system prompt defaults
  - editable system prompts
- Existing analysis prompt behavior is untouched.

Recommended persistence proof cases:

- In-memory repo initializes empty.
- Current fallback returns static default when repo has no records.
- Save initial default current record.
- Save admin custom v2 and supersede v1.
- Reset to default v3 and supersede v2.
- History returns v1/v2/v3.
- Only one current record exists per stage.
- Attempt to save `admin_assistant_prompt` as prompt key is rejected.
- Attempt to write through `StructuredPromptSpecRepository` or `Pass6PromptSpecRepository` never occurs.

## 12. Risks, Open Questions, and Required Decisions

Critical risks:

- Reusing existing PromptSpec repositories or tables.
- Introducing prompt compilation/test behavior for Copilot instructions.
- Letting a UI surface blur Copilot instructions with analysis PromptSpecs.
- Persisting unsafe prompt content without validation.
- Allowing more than one current record per stage.

Non-critical risks:

- In-memory-first adds one more slice before real SQLite durability.
- Local and persistence types may drift if shared contracts are deferred too long.
- Regex/content validation is helpful but not a complete security model; boundary guards remain authoritative.

Required operator decisions:

- Should the first persistence slice include only the in-memory repository?
- Should `packages/persistence` introduce local stored types or should `packages/contracts` get shared record schemas first?
- Should current uniqueness be enforced in repository logic first, SQLite constraint later, or both?
- Should reset-to-default preserve the previous custom prompt as superseded, as already accepted, in all durable implementations?

Deferred items:

- SQLite storage.
- Migration/table creation.
- App store wiring.
- API routes.
- Admin UI.
- Runtime prompt assembly.
- Provider-backed Copilot.
- Full draft/active lifecycle.

## 13. Final Recommendation

Implement durable persistence in small steps. The next build should add only a dedicated in-memory `StageCopilotSystemPromptRepository` in `packages/persistence`, with proof that save/version/reset touches only Stage Copilot prompt records and leaves Capability PromptSpec repositories unchanged.

Do not reuse existing PromptSpec repositories, prompt tables, `packages/prompts`, prompt compilation, prompt tests, providers, UI, APIs, or runtime behavior. SQLite should come after the in-memory repository proof is accepted.
