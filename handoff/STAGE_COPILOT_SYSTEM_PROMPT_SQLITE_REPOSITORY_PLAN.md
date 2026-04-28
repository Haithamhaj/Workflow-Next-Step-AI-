# Stage Copilot System Prompt SQLite Repository Plan

## 1. Executive Summary

The codebase is ready for a durable SQLite-backed Stage Copilot System Prompt repository, but the next implementation must remain narrowly scoped to `packages/persistence` and must not reuse existing PromptSpec repositories or tables.

Current state:
- `packages/stage-copilot` owns static Stage Copilot System Prompt defaults and editable prompt record/version helpers.
- `packages/persistence` now exposes a dedicated `StageCopilotSystemPromptRepository` interface and `InMemoryStageCopilotSystemPromptRepository`.
- The in-memory proof validates current/superseded version behavior, reset-to-default, default fallback, authority validation, and separation from fake Capability / Analysis PromptSpec fixtures.
- SQLite persistence patterns already exist in `packages/persistence/src/index.ts` through `openIntakeDatabase`, lazy `CREATE TABLE IF NOT EXISTS`, JSON `payload` columns, repository-specific indexed columns, and `cloneRecord`/`parseStored` helpers.

Recommended next durable model: add a dedicated SQLite repository backed by one append/history table with `stage_key`, `status`, `version`, and `payload`, plus a uniqueness guard for one current record per stage. This preserves version history, supports reset-to-default, and avoids touching `structured_prompt_specs`, `pass6_core_records`, `SQLiteStructuredPromptSpecRepository`, `SQLitePass6PromptSpecRepository`, or `packages/prompts`.

Do not add UI, API, runtime, provider behavior, retrieval, PromptSpec lifecycle changes, or Capability PromptSpec storage changes in the SQLite slice.

## 2. Current In-Memory Repository Review

Files inspected:
- `packages/persistence/src/index.ts`
- `packages/stage-copilot/src/editable-system-prompts.ts`
- `packages/stage-copilot/src/system-prompts.ts`
- `scripts/prove-stage-copilot-system-prompt-inmemory-repository.mjs`

What exists now:
- `StoredStageCopilotSystemPromptRecord` is persistence-local and structurally aligned with the local editable Stage Copilot System Prompt record.
- `StageCopilotSystemPromptRepository` supports `save`, `findById`, `findCurrentByStage`, `findCurrentByStageOrDefault`, `listHistoryByStage`, and `findAll`.
- `InMemoryStageCopilotSystemPromptRepository` validates records before save, supersedes an existing current record for the same stage, stores cloned records, and returns cloned records.
- `createInMemoryStore()` includes `stageCopilotSystemPrompts`.

Proven behavior:
- Empty repository startup.
- Static default fallback for all required stages.
- Saving a custom prompt creates a current version.
- Saving a second version supersedes the previous current version.
- History is preserved.
- Reset-to-default creates a new current `static_default` version.
- Unsafe authority claims and known analysis prompt keys are rejected.
- Fake Capability / Analysis PromptSpec fixtures are not mutated.

Still non-durable:
- Records are lost on process restart.
- There is no SQLite table, migration/init proof, reload proof, or durable history proof.
- No app store wiring for SQLite Stage Copilot prompt persistence exists yet.

Must remain unchanged:
- `packages/prompts`.
- Capability / Analysis PromptSpecs and prompt keys.
- `StructuredPromptSpecRepository`.
- `Pass6PromptSpecRepository`.
- Pass 5 and Pass 6 analysis/runtime behavior.

## 3. SQLite Storage Options

### Option A — One Append-Or-History Table for All Versions

Table shape:
- `stage_copilot_system_prompts`
- `id TEXT PRIMARY KEY`
- `stage_key TEXT NOT NULL`
- `status TEXT NOT NULL`
- `version INTEGER NOT NULL`
- `prompt_key TEXT NOT NULL`
- `source TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- `payload TEXT NOT NULL`
- indexes on `stage_key`, `(stage_key, status)`, `(stage_key, version)`
- unique partial index for one current per stage if supported: `CREATE UNIQUE INDEX ... WHERE status = 'current'`

Query complexity: low. Current lookup is `WHERE stage_key = ? AND status = 'current'`; history is `WHERE stage_key = ? ORDER BY version`.

Reset-to-default behavior: insert a new static-default version as current after superseding the previous current.

History behavior: all versions remain in the same table.

Risk level: low.

Compatibility risk: low if the table name is dedicated and repository code does not touch PromptSpec tables.

Proof strategy: save/reload with a temporary SQLite path; assert one current per stage, history order, reset behavior, default fallback, invalid saves rejected, and no writes to PromptSpec tables.

Use now: yes. This is the best fit for the current simple versioned custom-instructions model.

### Option B — Current Table + History Table

Table shape:
- `stage_copilot_system_prompt_current`
- `stage_copilot_system_prompt_history`

Query complexity: moderate. Writes must update two tables consistently.

Reset-to-default behavior: update current table and append history row.

History behavior: explicit, but duplication risk increases.

Risk level: medium.

Compatibility risk: medium because consistency bugs can appear if current/history updates diverge.

Proof strategy: transaction proof across both tables, reload proof, and corruption checks.

Use now: no. It adds unnecessary coordination for a model that only needs current/superseded status.

### Option C — Table with `stageKey` + `status current/superseded`

Table shape:
- Same as Option A, with explicit `status` values on each record.

Query complexity: low.

Reset-to-default behavior: supersede current and insert new current.

History behavior: natural through status and version.

Risk level: low.

Compatibility risk: low.

Proof strategy: same as Option A.

Use now: yes. This is the same practical model as Option A and should be the recommended implementation.

### Option D — JSON Blob Per Stage

Table shape:
- `stage_key TEXT PRIMARY KEY`
- `payload TEXT NOT NULL` containing current plus full history.

Query complexity: low for current, worse for history integrity and partial inspection.

Reset-to-default behavior: rewrite the blob.

History behavior: preserved inside the blob but harder to query and validate.

Risk level: medium.

Compatibility risk: low for PromptSpecs, but higher for data integrity.

Proof strategy: reload and mutation proof; corruption cases are harder to isolate.

Use now: no. It hides version records and makes one-current/history invariants harder to enforce at the SQLite level.

### Option E — Defer SQLite Until API/UI

Table shape: none.

Query complexity: none.

Reset-to-default behavior: remains in-memory/proof-only.

History behavior: not durable.

Risk level: low short-term, medium product risk.

Compatibility risk: lowest now.

Proof strategy: continue using the existing in-memory proof.

Use now: only if editable prompts will not be exposed soon. Since the accepted direction is durable editable Stage Copilot instructions, defer only if the control surface is also deferred.

## 4. Recommended SQLite Model

Use Option C: a single dedicated table with one row per prompt version and explicit `current`/`superseded` status.

Recommended table name:
- `stage_copilot_system_prompts`

Required invariants:
- One current prompt per stage.
- All previous current records become `superseded`.
- Version history is preserved.
- Reset-to-default is a new current version sourced from `static_default`.
- Default fallback still works when no persisted row exists for a stage.
- Records remain `kind = 'stage_copilot_system_prompt'`.
- `separatesFromCapabilityPromptSpecs` remains true.
- Authority boundary validation runs before every save.
- The repository never writes to PromptSpec tables or repositories.

Implementation style:
- Follow existing `packages/persistence` SQLite conventions: `DatabaseSync`, `openIntakeDatabase`, lazy `CREATE TABLE IF NOT EXISTS`, indexed query columns, JSON payload, and parsed/cloned return records.
- Add the table in `openIntakeDatabase` only when the implementation slice is approved.
- Add `SQLiteStageCopilotSystemPromptRepository implements StageCopilotSystemPromptRepository`.
- Add the SQLite repository to the SQLite store wiring only after the repository proof passes.

## 5. Table and Record Shape

Recommended durable fields:

```text
id TEXT PRIMARY KEY
stage_key TEXT NOT NULL
prompt_key TEXT NOT NULL
kind TEXT NOT NULL
status TEXT NOT NULL
version INTEGER NOT NULL
source TEXT NOT NULL
default_ref_id TEXT NOT NULL
created_at TEXT NOT NULL
created_by TEXT NOT NULL
updated_at TEXT NOT NULL
updated_by TEXT NOT NULL
payload TEXT NOT NULL
```

Indexes:

```text
idx_stage_copilot_system_prompts_stage_key ON stage_copilot_system_prompts(stage_key)
idx_stage_copilot_system_prompts_stage_status ON stage_copilot_system_prompts(stage_key, status)
idx_stage_copilot_system_prompts_stage_version ON stage_copilot_system_prompts(stage_key, version)
```

Recommended uniqueness:

```text
UNIQUE INDEX IF NOT EXISTS idx_stage_copilot_system_prompts_one_current
ON stage_copilot_system_prompts(stage_key)
WHERE status = 'current'
```

Record payload should contain the complete `StoredStageCopilotSystemPromptRecord`, including:
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

Additional SQLite metadata should be limited to query/index columns. Do not add Capability PromptSpec fields, prompt compilation fields, provider fields, or runtime/session fields.

## 6. Repository Behavior

Expected `SQLiteStageCopilotSystemPromptRepository` behavior:

- `save(record)`:
  - validate using the same Stage Copilot System Prompt record validation as the in-memory repository;
  - reject `kind: "capability"`;
  - reject known analysis prompt keys;
  - reject unsafe authority claims;
  - if `record.status === "current"`, supersede the existing current row for that stage before inserting/upserting the new current row;
  - perform supersede + insert in one SQLite transaction;
  - never write to `structured_prompt_specs`, `pass6_core_records`, or prompt-test tables.

- `findById(systemPromptId)`:
  - read only `stage_copilot_system_prompts`;
  - parse payload and return a cloned record.

- `findCurrentByStage(stageKey)`:
  - read `status = 'current'`;
  - return null if no persisted current exists.

- `findCurrentByStageOrDefault(stageKey, fallback)`:
  - return persisted current when present;
  - otherwise clone and return the supplied fallback.

- `listHistoryByStage(stageKey)`:
  - return all records for the stage ordered by `version ASC`.

- `findAll()`:
  - return all records ordered by stage and version.

Reset-to-default should remain an application/helper-level creation of a new `static_default` record. The repository persists that record and supersedes prior current records; it should not synthesize default prompt content itself.

Returned records should be cloned just like the existing in-memory and Pass 6 SQLite repository patterns.

## 7. Migration and Initialization Strategy

Existing pattern:
- `openIntakeDatabase(dbPath)` opens a `DatabaseSync`, sets PRAGMAs, and creates all SQLite tables lazily through `CREATE TABLE IF NOT EXISTS`.
- SQLite repositories call `openIntakeDatabase(dbPath)` in their constructor.
- `createSQLiteIntakeRepositories(dbPath)` wires repository instances.

Recommended initialization:
- Add `stage_copilot_system_prompts` creation to `openIntakeDatabase`.
- Add indexes in the same `db.exec` block.
- Keep the table separate from `structured_prompt_specs` and `pass6_core_records`.
- Do not add an external migration framework in this slice unless the project introduces one broadly later.

Transaction strategy:
- Use an explicit transaction for save-current behavior:
  - update existing current rows for the same `stage_key` to `superseded`;
  - insert/upsert the new current row.
- If Node `DatabaseSync` transaction helper is not already wrapped locally, use existing repository style plus a minimal local transaction pattern in the future implementation.

Restart/reload proof:
- Use a temporary SQLite path under `/tmp`.
- Save records with repository instance A.
- Create repository instance B with the same path.
- Verify current, history, reset, and default fallback.

## 8. Contract Strategy

Do not add shared `packages/contracts` schemas before the SQLite repository slice.

Recommended path:
- Continue using persistence-local stored types already defined in `packages/persistence`.
- Keep those types aligned with `packages/stage-copilot` editable prompt types.
- Reuse validation logic shape from the in-memory repository.
- Add shared contracts or Draft-07 schemas only when external API/control-surface boundaries require stable serialized contracts.

Why not contracts now:
- The durable repository is still an internal persistence concern.
- Adding schemas now risks expanding the public contract surface before API/UI requirements are known.
- Existing Stage Copilot proofs already guard the product boundary at the package and persistence level.

Do not store prompt content in `StageCopilotProfile`; that profile should remain a declarative foundation/profile layer, not the durable custom-instruction history store.

## 9. Separation from Capability PromptSpecs

SQLite implementation must prove:
- no writes to `SQLiteStructuredPromptSpecRepository`;
- no writes to `SQLitePass6PromptSpecRepository`;
- no writes to `structured_prompt_specs`;
- no writes to `pass6_core_records` with `record_type = 'pass6_prompt_spec'`;
- no imports from `packages/prompts`;
- no prompt compilation or prompt test execution;
- no provider calls;
- no mutation of existing PromptSpec keys:
  - `admin_assistant_prompt`
  - `pass5.admin_assistant`
  - `pass6_analysis_copilot`
  - `PASS5_PROMPT_FAMILY`
  - `PASS6_PROMPT_CAPABILITY_KEYS`

The SQLite Stage Copilot repository should be a sibling persistence repository, not a wrapper around PromptSpec persistence. It should accept only `stage_copilot_system_prompt` records and reject any record that tries to use known Capability / Analysis prompt keys.

## 10. Recommended Implementation Slice

### Slice: Stage Copilot System Prompt SQLite Repository

Purpose:
- Add durable SQLite storage for Stage Copilot System Prompt versions while preserving complete separation from Capability / Analysis PromptSpecs.

Files/packages likely touched:
- `packages/persistence/src/index.ts`
- `scripts/prove-stage-copilot-system-prompt-sqlite-repository.mjs`

What it produces:
- `SQLiteStageCopilotSystemPromptRepository implements StageCopilotSystemPromptRepository`
- dedicated `stage_copilot_system_prompts` table and indexes
- optional SQLite store wiring if consistent with `createSQLiteIntakeRepositories`
- proof for reload durability, version history, reset-to-default, fallback, validation, and PromptSpec non-interference

What it must not do:
- no `packages/prompts` imports or changes
- no PromptSpec repository reuse
- no `structured_prompt_specs` writes
- no `pass6_prompt_spec` writes
- no Capability PromptSpec key changes
- no UI/API/runtime/provider/retrieval
- no prompt compilation or prompt tests
- no Pass 5/6 behavior changes

Proof strategy:
- Build persistence and Stage Copilot packages.
- Run existing Stage Copilot proofs.
- Run new SQLite proof with a temporary DB path.
- Inspect proof/source imports for forbidden packages.
- Query SQLite system tables or table contents to verify only `stage_copilot_system_prompts` changed for the proof data.

Risk level: low-medium. The main risk is accidental coupling to existing SQLite prompt tables because everything currently lives in one large persistence file.

## 11. Proof Strategy

Future SQLite proof should validate:

Durability:
- repository starts with no persisted Stage Copilot prompt rows;
- default fallback is available without persistence;
- save custom prompt for `sources_context`;
- recreate repository with same SQLite path;
- current prompt survives reload;
- history survives reload;
- reset-to-default survives reload.

Version invariants:
- one current prompt per stage;
- previous current becomes superseded;
- history is ordered by version;
- all required stages can persist custom prompts.

Safety:
- `kind: "capability"` rejected;
- known analysis prompt keys rejected;
- record mutation claims rejected;
- official analysis claims rejected;
- Capability PromptSpec alteration claims rejected;
- evidence/transcript/gate approval claims rejected;
- readiness/package eligibility mutation claims rejected;
- provider/tool claims rejected;
- boundary override claims rejected.

PromptSpec separation:
- fake Capability PromptSpec fixtures remain unchanged;
- no `packages/prompts` import;
- no Pass 5 or Pass 6 runtime import;
- no provider/integration import;
- no prompt compilation/test import;
- no use of `SQLiteStructuredPromptSpecRepository`;
- no use of `SQLitePass6PromptSpecRepository`;
- no writes to `structured_prompt_specs`;
- no writes to `pass6_core_records` with PromptSpec record types.

Existing proof commands should continue to pass:
- `pnpm build:contracts`
- `node scripts/prove-stage-copilot-foundation-contracts.mjs`
- `node scripts/prove-stage-copilot-static-taxonomy-projection.mjs`
- `node scripts/prove-stage-copilot-foundation-package.mjs`
- `node scripts/prove-stage-copilot-context-envelope.mjs`
- `node scripts/prove-stage-copilot-system-prompts.mjs`
- `node scripts/prove-stage-copilot-editable-system-prompts.mjs`
- `node scripts/prove-stage-copilot-system-prompt-inmemory-repository.mjs`
- new SQLite repository proof
- `pnpm --filter @workflow/persistence build`
- `pnpm --filter @workflow/stage-copilot build`
- `pnpm typecheck`

## 12. Risks, Open Questions, and Required Decisions

Critical risks:
- Accidentally writing Stage Copilot System Prompts into Capability PromptSpec tables.
- Reusing `StructuredPromptSpecRepository` or `Pass6PromptSpecRepository` for convenience.
- Letting prompt content become runtime authority instead of custom-instruction text guarded by boundaries.
- Adding UI/API before durable repository behavior and separation proofs are stable.

Non-critical risks:
- `packages/persistence/src/index.ts` is already large, so adding another SQLite repository increases file size and review burden.
- Existing SQLite setup uses lazy table creation rather than a migration framework; this is consistent but less explicit for production database change review.
- Partial unique indexes should be verified against the Node SQLite version used by the repo.

Required operator decisions:
- Should the SQLite repository be wired into `createSQLiteIntakeRepositories` in the same slice, or only exported for direct construction first?
- Should table creation live in the existing `openIntakeDatabase` function, matching current patterns, or should Stage Copilot prompt storage get a smaller dedicated init helper later?
- Should the first durable repository keep persistence-local types only, or should a shared contract/schema be introduced before API/UI?

Recommended answers:
- Wire it into `createSQLiteIntakeRepositories` only if proof coverage includes store-level access; otherwise direct construction is enough for the first SQLite slice.
- Use `openIntakeDatabase` for the first slice to match existing SQLite conventions.
- Keep persistence-local types for now; add shared contracts later only when API/control-surface boundaries require them.

Deferred items:
- SQLite migrations framework.
- Admin UI for editing Stage Copilot Instructions.
- API routes.
- Provider-backed Copilot runtime.
- Stage Copilot context assembly runtime.
- Retrieval/search/vector behavior.

## 13. Final Recommendation

Implement a dedicated `SQLiteStageCopilotSystemPromptRepository` next, using a single `stage_copilot_system_prompts` table with explicit `current`/`superseded` status and full JSON payload storage. Keep the repository separate from all Capability / Analysis PromptSpec persistence, run validation before every save, and prove reload durability plus non-interference before adding any UI or API.

Do not reuse existing prompt tables or PromptSpec repositories. Do not introduce shared contracts, SQLite migrations, PromptOps changes, or runtime behavior in the first durable storage slice.
