# Stage Copilot Instructions API Plan

## 1. Executive Summary

The repository now has enough storage and store wiring to plan a small admin-web API for Stage Copilot Instructions. The route should expose read/save/reset control for Stage Copilot System Prompts only, using `store.stageCopilotSystemPrompts` and helpers from `@workflow/stage-copilot`.

Recommended first API model: one JSON route with `GET` for defaults/current/history and `POST` with an explicit `action` for `save-custom` and `reset-to-default`. This matches existing admin-web route conventions while keeping the surface small and proofable.

The route must not resemble the existing Capability / Analysis PromptSpec routes internally. It must not import `@workflow/prompts`, must not call providers, must not compile prompts, must not run prompt tests, and must not write to PromptSpec repositories or tables. It should be an orchestration layer only:

1. read from `store.stageCopilotSystemPrompts`;
2. get static defaults from `@workflow/stage-copilot`;
3. create version/reset records with `@workflow/stage-copilot`;
4. save through the Stage Copilot repository.

No UI, provider runtime, retrieval, or Copilot chat behavior should be introduced in the API slice.

## 2. Current Store Access Review

Files inspected:
- `apps/admin-web/lib/store.ts`
- route patterns under `apps/admin-web/app/api`
- `packages/stage-copilot/src/system-prompts.ts`
- `packages/stage-copilot/src/editable-system-prompts.ts`
- `packages/persistence/src/index.ts`
- Stage Copilot proof scripts
- PromptSpec API routes for separation-risk review

Current store access:
- `apps/admin-web/lib/store.ts` imports `createSQLiteStageCopilotRepositories`.
- `const stageCopilotRepositories = createSQLiteStageCopilotRepositories();`
- `store.stageCopilotSystemPrompts` is overlaid from `stageCopilotRepositories.stageCopilotSystemPrompts`.
- Existing `structuredPromptSpecs`, `pass6PromptSpecs`, and prompt test repositories remain wired from `createSQLiteIntakeRepositories`.

How routes can access the repository:
- Future routes can import `store` from `apps/admin-web/lib/store.ts`.
- Then use `store.stageCopilotSystemPrompts`.
- They do not need direct SQLite construction.
- They do not need `createSQLiteStageCopilotRepositories`.

Already proven:
- Static defaults exist for all required stages.
- Editable record helpers create current/default/custom/reset versions.
- In-memory and SQLite repositories preserve current/history/reset behavior.
- Admin store overlay uses the dedicated SQLite Stage Copilot repository factory.
- PromptSpec tables are not written by Stage Copilot prompt repository proofs.

Missing:
- No read API for defaults/current/history.
- No save API for custom instructions.
- No reset API.
- No route-level proof for request validation, audit fields, or PromptSpec non-interference.
- No UI.

## 3. API Route Options

### Option A — One Route Per Operation

Route shape:
- `GET /api/stage-copilot/instructions`
- `POST /api/stage-copilot/instructions/save`
- `POST /api/stage-copilot/instructions/reset`

Request/response shape:
- Read route accepts query params such as `stageKey` and `includeHistory`.
- Save route accepts `stageKey`, `systemPrompt`, `changeNote`, `updatedBy`.
- Reset route accepts `stageKey`, `changeNote`, `updatedBy`.

Risk level: medium.

Proof strategy:
- Route proof for each endpoint.
- Source inspection for no PromptSpec imports.
- DB checks for no PromptSpec table writes.

Why use:
- Clear operation boundaries.
- Easy HTTP semantics.

Why not use now:
- Adds multiple files/routes at once.
- More route surface before UI exists.

### Option B — One Route with Action Parameter

Route shape:
- `GET /api/stage-copilot/instructions`
- `POST /api/stage-copilot/instructions`

POST actions:
- `save-custom`
- `reset-to-default`

Request/response shape:
- `GET` returns defaults/current/history depending on query params.
- `POST` dispatches on `action`.

Risk level: low-medium.

Proof strategy:
- One route proof covers read, save, reset, invalid action, invalid authority claim, and PromptSpec non-interference.

Why use:
- Matches existing admin-web patterns such as `pass6/configuration`.
- Keeps the first route slice small.
- Easy to prove no UI/runtime/provider behavior.

Why not use:
- Action-based routes can grow too broad if future behavior is added without discipline.

### Option C — Separate Read-Only Route First, Save/Reset Later

Route shape:
- `GET /api/stage-copilot/instructions`

Risk level: low.

Proof strategy:
- Validate defaults/current/history read behavior.
- No write checks except ensuring no DB mutation.

Why use:
- Safest initial route.

Why not use now:
- Storage save/reset behavior is already proven at repository level.
- A no-UI control route can still safely include save/reset if guarded and proven.

### Option D — No API Yet; UI-Less Service Layer First

Route shape:
- No route.
- App-local service file wraps `store.stageCopilotSystemPrompts`.

Risk level: low.

Proof strategy:
- Service proof with repository fixtures.

Why use:
- Keeps HTTP surface deferred.
- Useful if route auth/actor semantics are unresolved.

Why not use now:
- The requested next product direction is a control route.
- Existing app patterns often keep lightweight orchestration in route files.

## 4. Recommended API Model

Use Option B first: one route with `GET` and `POST action`.

Recommended route:
- `apps/admin-web/app/api/stage-copilot/instructions/route.ts`

Recommended behavior:
- `GET`:
  - list stage defaults;
  - optionally return current/default/history for `stageKey`;
  - never write.
- `POST`:
  - `action: "save-custom"` creates a new current admin-custom version;
  - `action: "reset-to-default"` creates a new current static-default version;
  - always saves through `store.stageCopilotSystemPrompts`;
  - no provider calls;
  - no prompt compilation;
  - no PromptSpec repositories.

Why this is safest:
- Small route surface.
- Compatible with existing admin-web JSON/action patterns.
- Easy to prove with one route source file.
- Keeps audit metadata explicit.
- Does not create UI or runtime behavior.

## 5. Request and Response Shapes

### List Defaults

Request:

```http
GET /api/stage-copilot/instructions
```

Response:

```json
{
  "ok": true,
  "stages": [
    {
      "stageKey": "sources_context",
      "defaultRefId": "sources_context-copilot-system-prompt-default",
      "defaultPromptKey": "sources_context.copilot_system_prompt.default",
      "displayName": "Pass 2 / Sources & Context Copilot System Prompt Default",
      "hasCurrent": true,
      "currentVersion": 2,
      "currentSource": "admin_custom"
    }
  ]
}
```

### Get Current by Stage

Request:

```http
GET /api/stage-copilot/instructions?stageKey=sources_context
```

Response:

```json
{
  "ok": true,
  "stageKey": "sources_context",
  "default": {
    "refId": "sources_context-copilot-system-prompt-default",
    "promptKey": "sources_context.copilot_system_prompt.default",
    "systemPrompt": "..."
  },
  "current": {
    "systemPromptId": "sources_context-copilot-system-prompt-v2",
    "stageKey": "sources_context",
    "promptKey": "sources_context.copilot_system_prompt.custom",
    "kind": "stage_copilot_system_prompt",
    "status": "current",
    "version": 2,
    "systemPrompt": "...",
    "source": "admin_custom",
    "defaultRefId": "sources_context-copilot-system-prompt-default",
    "createdAt": "...",
    "createdBy": "admin_operator",
    "updatedAt": "...",
    "updatedBy": "admin_operator",
    "changeNote": "..."
  },
  "effective": {
    "source": "admin_custom",
    "systemPrompt": "..."
  }
}
```

If no persisted current exists, `current` may be `null` and `effective` should come from the static default.

### List History by Stage

Request:

```http
GET /api/stage-copilot/instructions?stageKey=sources_context&includeHistory=true
```

Response adds:

```json
{
  "history": [
    {
      "systemPromptId": "sources_context-copilot-system-prompt-v1",
      "status": "superseded",
      "version": 1,
      "source": "static_default",
      "updatedAt": "...",
      "updatedBy": "admin_operator",
      "changeNote": "Initialized from static default."
    }
  ]
}
```

### Save Custom Instructions

Request:

```json
{
  "action": "save-custom",
  "stageKey": "sources_context",
  "systemPrompt": "Custom instructions...",
  "changeNote": "Tune Sources Copilot directness.",
  "updatedBy": "admin_operator"
}
```

Response:

```json
{
  "ok": true,
  "stageKey": "sources_context",
  "current": {
    "systemPromptId": "sources_context-copilot-system-prompt-v3",
    "status": "current",
    "version": 3,
    "source": "admin_custom",
    "updatedBy": "admin_operator",
    "changeNote": "Tune Sources Copilot directness."
  },
  "supersededPrevious": {
    "systemPromptId": "sources_context-copilot-system-prompt-v2",
    "status": "superseded",
    "version": 2
  }
}
```

### Reset to Default

Request:

```json
{
  "action": "reset-to-default",
  "stageKey": "sources_context",
  "changeNote": "Reset after prompt review.",
  "updatedBy": "admin_operator"
}
```

Response:

```json
{
  "ok": true,
  "stageKey": "sources_context",
  "current": {
    "status": "current",
    "version": 4,
    "source": "static_default",
    "defaultRefId": "sources_context-copilot-system-prompt-default"
  }
}
```

### Validation Error Shape

Recommended error:

```json
{
  "ok": false,
  "error": "invalid_stage_key",
  "message": "Unsupported Stage Copilot stageKey.",
  "field": "stageKey",
  "violations": []
}
```

For authority validation:

```json
{
  "ok": false,
  "error": "invalid_copilot_instructions",
  "message": "Stage Copilot Instructions cannot claim authority to mutate records.",
  "field": "systemPrompt",
  "violations": ["claims_write_authority"]
}
```

## 6. Actor and Audit Strategy

Needed values:
- `updatedBy`
- timestamp
- `changeNote`
- operation type
- `source`
- `defaultRefId`

Recommended first route behavior:
- `updatedBy`: accept optional string in request body; default to `"admin_operator"` until production auth is scoped.
- timestamp: route creates `const now = new Date().toISOString()`.
- `changeNote`: require non-empty for save/reset, or default to a precise operation note:
  - save: `"Stage Copilot Instructions custom save."`
  - reset: `"Stage Copilot Instructions reset to static default."`
- operation type:
  - save creates `source: "admin_custom"` through `createNextStageCopilotSystemPromptVersion`.
  - reset creates `source: "static_default"` through `resetStageCopilotSystemPromptToDefault`.
- `defaultRefId`: comes from the static default/helper-generated records.

Do not fake production auth. Use a clearly named placeholder actor and keep the route shaped so replacing it with real auth later is straightforward.

## 7. Validation and Guard Order

Recommended route order:

1. Parse JSON body or query params.
2. Validate `stageKey`:
   - must have a static default from `getDefaultStageCopilotSystemPrompt(stageKey)`;
   - reject `future_finalization` until defaults/support exist.
3. Validate body shape:
   - action is supported;
   - `systemPrompt` required for save;
   - `changeNote` string if provided;
   - `updatedBy` string if provided.
4. Resolve current record:
   - `store.stageCopilotSystemPrompts.findCurrentByStage(stageKey)`.
5. Resolve fallback/default:
   - `createEditableStageCopilotSystemPromptFromDefault(...)` if no current exists.
6. For save:
   - create next version with `createNextStageCopilotSystemPromptVersion`.
   - helper validation rejects unsafe content.
7. For reset:
   - call `resetStageCopilotSystemPromptToDefault`.
8. Save only `transition.current` through `store.stageCopilotSystemPrompts`.
   - repository supersedes prior current.
9. Return safe response:
   - include record metadata and prompt content;
   - include violations on failure;
   - do not expose unrelated store data.

Repository validation remains a second guard layer. Route validation should improve error clarity, but repository validation remains authoritative for persistence.

## 8. Separation from Capability PromptSpecs

The route must prove:
- no import from `@workflow/prompts`;
- no import from `@workflow/integrations`;
- no provider registry access;
- no `store.structuredPromptSpecs` access;
- no `store.pass6PromptSpecs` access;
- no `store.pass6PromptTestCases` or `store.pass6PromptTestExecutionResults` access;
- no prompt compile/test calls;
- no mutation of PromptSpec keys;
- no draft/active/previous/archived analysis prompt lifecycle changes;
- no writes to `structured_prompt_specs`;
- no writes to `pass6_core_records` with `record_type = 'pass6_prompt_spec'`.

The route should import only:
- `NextResponse` from `next/server`;
- Stage Copilot default/editable helpers from `@workflow/stage-copilot`;
- `store` from `apps/admin-web/lib/store`.

## 9. Recommended Implementation Slice

### Slice: Stage Copilot Instructions API Route

Purpose:
- Add the first no-UI read/save/reset API for Stage Copilot Instructions.

Files/packages likely touched:
- `apps/admin-web/app/api/stage-copilot/instructions/route.ts`
- `scripts/prove-stage-copilot-instructions-api.mjs`

Routes to add:
- `GET /api/stage-copilot/instructions`
- `POST /api/stage-copilot/instructions`

What it produces:
- read defaults/current/history;
- save custom instructions;
- reset to default;
- JSON responses only;
- route-level validation and proof.

What it must not do:
- no UI;
- no provider/runtime;
- no retrieval;
- no prompt compilation/tests;
- no `@workflow/prompts`;
- no PromptSpec repository writes;
- no Pass 5/6 runtime changes.

Proof strategy:
- Source-inspect route imports and store access.
- Exercise helper/repository path through `store.stageCopilotSystemPrompts` or a controlled same-path route-equivalent setup.
- Verify save creates current version and supersedes previous.
- Verify reset creates static-default current.
- Verify invalid authority claims reject.
- Query SQLite tables to confirm only `stage_copilot_system_prompts` receives rows.

Risk level: medium. The route adds a write surface, but the write is limited to Stage Copilot Instructions and guarded by existing helper and repository validation.

## 10. Proof Strategy

Future API proof should validate:

Read behavior:
- list defaults/stages returns all supported stages;
- get current by stage returns persisted current when present;
- get current by stage returns default/effective default when no persisted current exists;
- history returns ordered versions.

Save behavior:
- save custom creates a new current version;
- previous current becomes superseded;
- custom prompt content is persisted;
- audit fields are captured.

Reset behavior:
- reset creates a new current version;
- source becomes `static_default`;
- previous current becomes superseded;
- history is preserved.

Invalid/safety cases:
- invalid `stageKey` rejected;
- missing `systemPrompt` rejected for save;
- unsupported action rejected;
- prompt claiming record mutation rejected;
- prompt claiming official analysis execution rejected;
- prompt claiming Capability PromptSpec alteration rejected;
- prompt claiming provider/tool execution rejected;
- prompt claiming readiness/package eligibility mutation rejected.

PromptSpec separation:
- route does not import `@workflow/prompts`;
- route does not import providers/integrations;
- route does not access `store.structuredPromptSpecs`;
- route does not access `store.pass6PromptSpecs`;
- route does not call prompt compile/test functions;
- no writes to `structured_prompt_specs`;
- no writes to Pass 6 PromptSpec records;
- existing Stage Copilot proofs still pass.

Suggested required commands for implementation:
- `pnpm build:contracts`
- all existing Stage Copilot proofs
- new instructions API proof
- `pnpm --filter @workflow/stage-copilot build`
- `pnpm --filter @workflow/persistence build`
- `pnpm typecheck`

## 11. Risks, Open Questions, and Required Decisions

Critical risks:
- Accidentally importing `@workflow/prompts` because nearby prompt routes use it.
- Accidentally writing Copilot instructions into PromptSpec repositories.
- Letting `systemPrompt` text grant authority beyond guardrails.
- Adding provider-backed Copilot runtime behavior to the control route.

Non-critical risks:
- Action-based route may grow too broad later.
- Auth is not yet scoped, so `updatedBy` starts as a placeholder/operator field.
- No UI means manual API usage until the control surface is built.

Required operator decisions:
- Should `changeNote` be required for save/reset, or defaulted when missing?
- Should the first route support form posts, or JSON only?
- Should `updatedBy` be accepted from request body in this slice, or hardcoded to `admin_operator` until auth exists?

Recommended answers:
- Default `changeNote` if missing for first API slice, but include it in responses.
- JSON only for the first no-UI API slice.
- Accept optional `updatedBy`, default to `admin_operator`, and document that production auth will replace it.

Deferred items:
- Admin UI/editor.
- Real auth actor integration.
- Route-level rate limiting or permissions.
- Stage Copilot runtime/chat.
- Context assembly.
- Provider execution.
- Retrieval/search.

## 12. Final Recommendation

Build one JSON route at `apps/admin-web/app/api/stage-copilot/instructions/route.ts` with `GET` for defaults/current/history and `POST` actions for `save-custom` and `reset-to-default`. Keep it strictly on `store.stageCopilotSystemPrompts` and `@workflow/stage-copilot` helpers. Do not import `@workflow/prompts`, do not call providers, do not compile/test prompts, and do not touch Capability / Analysis PromptSpec repositories.
