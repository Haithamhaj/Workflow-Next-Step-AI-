# Stage Copilot Instructions Track Closure Review

## 1. Executive Summary

The Stage Copilot Instructions track is clean enough to accept as a closed foundation before future Stage Copilot context-assembly or runtime work begins.

The completed path establishes a separate Stage Copilot System Prompt / Instructions control surface without merging it into the existing Capability / Analysis PromptSpec system. It includes contract foundation, local guard packages, static defaults, editable records, in-memory and SQLite persistence, a dedicated repository factory, admin store overlay, no-runtime API route, and a no-runtime workspace UI at `/workspace/copilot-instructions`.

Recommendation: **A. Accept the Stage Copilot Instructions track as closed foundation.**

No blocking patch is required before acceptance. Non-blocking follow-ups should document the Next.js module-resolution workaround, add stronger browser/visual regression coverage later, and defer actor/auth refinement until the admin control surface has real user identity.

## 2. Built Track Summary

The track built the following layers:

- Contracts/foundation:
  - `StageCopilotProfile`
  - stage keys, runtime modes, read/write boundaries, forbidden actions, advisory policies, evidence access policy, audit requirements
  - PromptSpec taxonomy metadata distinguishing `capability`, `stage_copilot`, `legacy_copilot_like`, and `unknown_or_unclassified`
  - static taxonomy projection metadata and schema/proof coverage

- Isolated package:
  - `packages/stage-copilot`
  - pure helpers only; no providers, retrieval, DB access, runtime chat, or official analysis execution

- Boundary guards:
  - no-write/read-only validation
  - provider execution prohibition
  - prompt mutation prohibition
  - analysis record mutation prohibition
  - package eligibility/readiness mutation prohibition
  - routed recommendation safety
  - advisory what-if labeling

- Context envelope:
  - local read-only envelope types and helpers
  - accepts prepared references/summaries only
  - rejects executable content and authority flags for DB/retrieval/provider/prompt/analysis/package mutation

- Static Stage Copilot System Prompt defaults:
  - one default for each current stage:
    - `sources_context`
    - `hierarchy`
    - `targeting`
    - `participant_evidence`
    - `analysis_package`
    - `prompt_studio`
    - `advanced_debug`
  - defaults explicitly state conversation/custom-instruction scope only

- Editable model:
  - local versioned custom-instructions record model
  - `current` / `superseded` status
  - `static_default` / `admin_custom` source
  - reset-to-default semantics
  - authority-claim validation
  - known analysis prompt key rejection

- Persistence:
  - dedicated `StageCopilotSystemPromptRepository`
  - `InMemoryStageCopilotSystemPromptRepository`
  - `SQLiteStageCopilotSystemPromptRepository`
  - dedicated SQLite table: `stage_copilot_system_prompts`
  - one-current-per-stage uniqueness guard
  - history and reset preservation

- Factory and app store:
  - `createSQLiteStageCopilotRepositories(dbPath?)`
  - factory returns only `stageCopilotSystemPrompts`
  - `apps/admin-web/lib/store.ts` overlays only `stageCopilotSystemPrompts`
  - existing intake, PromptSpec, Pass 5, and Pass 6 repositories remain under their existing wiring

- API:
  - `apps/admin-web/app/api/stage-copilot/instructions/route.ts`
  - `GET` list stages/defaults, get current/effective/history by stage
  - `POST` `save-custom`
  - `POST` `reset-to-default`
  - no provider/runtime/prompt-compilation behavior

- Workspace UI:
  - `apps/admin-web/app/workspace/copilot-instructions/page.tsx`
  - separate page from `/workspace/prompts`
  - primary workspace nav entry:
    - English: `Copilot Instructions`
    - Arabic: `تعليمات المساعد`
  - stage selector, textarea, default preview, history, metadata, save/reset, warnings, EN/AR support

## 3. Boundary Verification

The track preserved the requested non-interference boundaries.

Verified preserved:

- No Capability / Analysis PromptSpec mutation.
- No `packages/prompts` behavior change.
- No PromptSpec key rename.
- No `PASS5_PROMPT_FAMILY` change.
- No `PASS6_PROMPT_CAPABILITY_KEYS` change.
- No Pass 5 runtime behavior change.
- No Pass 6 runtime behavior change.
- No synthesis/evaluation/package analysis logic change.
- No provider execution.
- No retrieval/RAG/vector execution.
- No live Copilot runtime/chat.
- No prompt compilation or prompt tests added to the control path.

The Stage Copilot package imports safe contract types and exports local pure helpers. The API route imports `@workflow/stage-copilot` and app `store`, but does not import `@workflow/prompts`, provider packages, prompt compilation helpers, or prompt test helpers. The UI calls only `/api/stage-copilot/instructions`.

The persistence boundary is narrower than the existing app store boundary: Stage Copilot System Prompt records are stored through a dedicated repository and dedicated table, while existing PromptSpec repositories remain separate.

## 4. Two-Prompt-System Separation Review

The implementation clearly separates the two prompt systems.

Capability / Analysis System Prompts:

- Still live in the existing PromptSpec/prompt family system.
- Continue to own official analysis capabilities such as extraction, clarification, synthesis, evaluation, and package drafting.
- Retain their existing repository and prompt lifecycle surfaces.
- Are not edited by the Stage Copilot Instructions API or UI.

Stage Copilot System Prompts / Instructions:

- Live in `packages/stage-copilot` types/defaults and dedicated Stage Copilot persistence.
- Use kind `stage_copilot_system_prompt`, not `capability`.
- Are presented to admins as conversation/custom-instruction controls.
- Are persisted in `stage_copilot_system_prompts`, not PromptSpec tables.
- Are edited through `/api/stage-copilot/instructions`, not PromptSpec routes.
- Are displayed on `/workspace/copilot-instructions`, not `/workspace/prompts`.

Remaining ambiguity is low. The UI copy repeatedly says the surface changes Copilot conversation behavior only and does not change Capability / Analysis PromptSpecs or official analysis behavior. The main future risk is admin mental-model drift if later UI links this page too tightly to Prompt Studio; keep the separate route and labels.

## 5. Persistence and Storage Review

The persistence foundation is acceptable.

In-memory repository:

- Starts empty.
- Saves Stage Copilot prompt records only.
- Supersedes previous current records by stage.
- Preserves history.
- Returns cloned records.
- Rejects unsafe authority claims and known analysis prompt keys.

SQLite repository:

- Uses dedicated table `stage_copilot_system_prompts`.
- Stores one row per version with JSON payload.
- Has indexes for stage, stage/status, and stage/version.
- Has a partial unique index for one current prompt per stage.
- Saves current records in a transaction and supersedes older current records.
- Reads only from `stage_copilot_system_prompts`.
- Preserves history and reset-to-default records across repository reload.

Factory:

- `createSQLiteStageCopilotRepositories` returns only `stageCopilotSystemPrompts`.
- It does not expose `structuredPromptSpecs`, `pass6PromptSpecs`, prompt test repositories, providers, or analysis repositories.

Admin store overlay:

- Adds only `stageCopilotSystemPrompts` from the dedicated factory.
- Leaves existing repository overlays intact.
- Does not modify `createSQLiteIntakeRepositories`.

Storage risk is acceptable for foundation. The main non-blocking concern is that the table is initialized through the existing SQLite initialization path rather than a formal migration framework. That matches current repo patterns, but should be revisited if a migration system is introduced.

## 6. API Review

`/api/stage-copilot/instructions` is acceptable as a no-runtime control route.

GET behavior:

- No query params returns supported stages/default summary.
- `stageKey` returns default, current, and effective prompt.
- `includeHistory=true` includes version history.
- If no persisted current exists, effective prompt comes from the static default.

POST behavior:

- `save-custom` validates stage, prompt content, authority claims, and creates the next custom version.
- `reset-to-default` validates stage and creates a new current static-default version.
- Previous current records become superseded through repository behavior.
- `changeNote` defaults to `Stage Copilot Instructions custom save.` or `Stage Copilot Instructions reset to static default.`
- `updatedBy` defaults to `admin_operator`.

Guard order is reasonable:

1. Parse query/body.
2. Validate action and stage key against Stage Copilot defaults.
3. Validate required `systemPrompt` for save.
4. Create version/reset through Stage Copilot helpers.
5. Validate editable record.
6. Save through `store.stageCopilotSystemPrompts`.
7. Return JSON result or structured JSON error.

The API does not import `@workflow/prompts`, does not access `store.structuredPromptSpecs` or `store.pass6PromptSpecs`, and does not call providers, prompt compilers, or prompt tests.

Remaining non-blocking concern: actor identity is placeholder-based. This is acceptable for foundation, but future auth integration should replace `admin_operator` with a real actor source.

## 7. UI Review

`/workspace/copilot-instructions` is acceptable as the first no-runtime UI.

Strengths:

- Separate page from `/workspace/prompts`, reducing confusion with Capability / Analysis PromptSpecs.
- Primary nav entry is clear in English and Arabic.
- Required separation copy is present.
- Boundary warning states the page changes Copilot conversation behavior only.
- Stage selector includes all accepted stages.
- UI shows effective instructions, editable textarea, static default preview, metadata, history, save, reset, and optional change note.
- No live chat surface, no “Ask Copilot” flow, no provider/model controls, and no run/test prompt controls.
- Arabic/English labels exist and the page uses workspace direction handling.

Risks:

- Reset-to-default currently appears as a regular action button without a confirmation step. Acceptable for foundation because history is preserved, but a confirmation affordance is a useful UX follow-up.
- The UI shows technical terms like `Capability / Analysis PromptSpecs`; this is accurate for admins but may need friendlier explanatory copy later.
- Proof coverage checks source/static renderability and route/API behavior; a future visual browser regression suite should cover layout, RTL, and error states more deeply.

No UI patch is required before closure.

## 8. Build and Module Resolution Review

The build/module resolution workaround is acceptable but should be documented as technical debt.

Current state:

- `apps/admin-web/package.json` declares `@workflow/stage-copilot` as a workspace dependency.
- `apps/admin-web/tsconfig.json` includes a project reference to `../../packages/stage-copilot`.
- `apps/admin-web/next.config.mjs` intentionally removes `@workflow/stage-copilot` from `transpilePackages`.
- `apps/admin-web/next.config.mjs` adds a webpack alias:
  - `@workflow/stage-copilot` -> `../../packages/stage-copilot/dist/index.js`

Why it exists:

- Next was resolving the workspace package source at `packages/stage-copilot/src/index.ts`.
- The package source uses ESM `.js` import specifiers.
- Next build failed when forced back to source resolution.
- Resolving to the built ESM package output makes `next build` pass.

Assessment:

- Acceptable for this closure because it is package-resolution only and all builds/proofs passed.
- It introduces an ordering requirement: `@workflow/stage-copilot` must be built before admin-web production build.
- The root build currently satisfies this, but the workaround should be documented.
- A cleaner monorepo-wide package resolution pattern should be considered later so app packages do not need one-off webpack aliases to built `dist`.

## 9. Proof Coverage Review

Stage Copilot proof scripts now cover:

- Foundation contracts:
  - `scripts/prove-stage-copilot-foundation-contracts.mjs`
- Static taxonomy projection:
  - `scripts/prove-stage-copilot-static-taxonomy-projection.mjs`
- Foundation package boundary guards:
  - `scripts/prove-stage-copilot-foundation-package.mjs`
- Context envelope:
  - `scripts/prove-stage-copilot-context-envelope.mjs`
- Static system prompt defaults:
  - `scripts/prove-stage-copilot-system-prompts.mjs`
- Editable prompt model:
  - `scripts/prove-stage-copilot-editable-system-prompts.mjs`
- In-memory repository:
  - `scripts/prove-stage-copilot-system-prompt-inmemory-repository.mjs`
- SQLite repository:
  - `scripts/prove-stage-copilot-system-prompt-sqlite-repository.mjs`
- SQLite factory:
  - `scripts/prove-stage-copilot-sqlite-repository-factory.mjs`
- Admin store overlay:
  - `scripts/prove-stage-copilot-admin-store-overlay.mjs`
- API route:
  - `scripts/prove-stage-copilot-instructions-api.mjs`
- Workspace UI:
  - `scripts/prove-stage-copilot-instructions-workspace-page.mjs`

Coverage is sufficient for foundation acceptance:

- Valid/invalid contracts are covered.
- Boundary guard rejection is covered.
- Editable version/reset/default semantics are covered.
- In-memory and SQLite persistence are covered.
- Factory and store overlay separation are covered.
- API read/save/reset behavior is covered.
- UI source-level separation and route presence are covered.
- PromptSpec table non-interference is covered in repository/API/store proofs.

Proof gaps are non-blocking:

- No full browser screenshot/pixel regression suite for `/workspace/copilot-instructions`.
- No auth/actor integration proof because auth is not yet in scope.
- No concurrent write stress proof beyond SQLite one-current transaction/index behavior.
- No migration/reload proof across future schema revisions.

## 10. Open Risks and Technical Debt

Critical risks:

- None identified that should block accepting this foundation.

Non-critical risks:

- Next.js build relies on a one-off webpack alias to built `@workflow/stage-copilot` output.
- Admin actor metadata is placeholder-based (`admin_operator`) until auth is integrated.
- Reset action could benefit from confirmation in a future UX patch.
- UI proof is not a deep visual/RTL regression test.
- Stage Copilot prompt content validation is a safety layer, not a complete security boundary; runtime guards must remain authoritative later.

Technical debt:

- Document the module-resolution workaround and expected build order.
- Consider a consistent workspace-package build/resolution strategy for Next apps.
- Consider shared UI copy guidance for “Capability / Analysis PromptSpecs” so admins understand the separation without needing internal vocabulary.

Naming risks:

- “Prompt Studio Copilot” and `/workspace/prompts` can still be mentally close. Keeping `/workspace/copilot-instructions` separate mitigates this.
- “System Prompt” is technically accurate, while “Instructions” is clearer for admins. Continue using “Stage Copilot Instructions” in UI.

Future runtime risks:

- A future runtime must not treat prompt content as authority.
- A future runtime must continue routing all write/action requests through boundary guards and governed app surfaces.
- Context assembly should remain read-only and should not import old Pass 5/6 copilot-like runtime behavior.

## 11. Acceptance Recommendation

Recommendation: **A. Accept the Stage Copilot Instructions track as closed foundation.**

Required patches before acceptance: **none.**

Non-blocking follow-up patches:

- Document the `@workflow/stage-copilot` Next build alias and the requirement that package builds precede admin-web build.
- Add a future visual/browser smoke suite for `/workspace/copilot-instructions` in English and Arabic.
- Add confirmation UX for reset-to-default if desired.
- Replace placeholder `updatedBy` with authenticated actor metadata when auth is in scope.

## 12. Next-Step Recommendation

After closure, do not jump directly to provider-backed runtime or chat behavior.

Recommended next sequence:

1. Update handoff/archive state in a separate no-code handoff slice.
2. Plan the first read-only Stage Copilot context assembly pilot.
3. Implement context assembly as read-only references/summaries only.
4. Only after context assembly is proven, plan a non-provider deterministic interaction shell if still needed.
5. Defer provider-backed runtime until boundary, context, API, and UI acceptance criteria are explicit.

Best first pilot direction: **read-only context assembly planning**, likely starting with Sources / Context or Prompt Studio because these have lower risk than Analysis / Package and do not need to discuss final package eligibility as deeply.

## 13. Archive / Handoff Update Recommendations

If accepted, update handoff state in a separate task:

- `CURRENT_STATE` or equivalent project state file:
  - mark Stage Copilot Instructions control path as accepted foundation.
- `NEXT_PASS` or equivalent next-work file:
  - set next recommended work to read-only Stage Copilot context assembly planning.
- `DECISIONS_LOG`:
  - record two-prompt-system separation.
  - record dedicated Stage Copilot Instructions persistence.
  - record `/workspace/copilot-instructions` as separate from `/workspace/prompts`.
  - record Next build alias as accepted local workaround/technical debt.
- Optional archive file:
  - summarize proof commands and final accepted commit for the Stage Copilot Instructions track.

Do not modify those files as part of this closure review.

## 14. Final Judgment

The Stage Copilot Instructions track is bounded, code-aware, and ready to be treated as accepted foundation.

It gives operators a durable, no-runtime control path for stage-specific Copilot conversation instructions while keeping official analysis prompts, PromptSpec repositories, Pass 5, Pass 6, providers, retrieval, and analysis logic separate.

Proceed with closure and archive/handoff updates. Future work should start with read-only context assembly planning, not provider-backed runtime.
