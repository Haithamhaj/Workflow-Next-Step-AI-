# Stage Copilot Editable Prompt Model Plan

## 1. Executive Summary

The codebase is ready to plan editable Stage Copilot System Prompts, but not ready to implement persistence or UI in the same step. The current static defaults in `packages/stage-copilot/src/system-prompts.ts` prove the correct product separation: Stage Copilot System Prompts are conversation/custom-instruction defaults, not Capability / Analysis PromptSpecs, not prompt registry entries, and not runtime/provider execution instructions.

The safest first editable model is a simple versioned custom-instructions model owned by future Stage Copilot storage, not the existing Capability PromptSpec repositories. It should support one current editable Copilot System Prompt per stage, append-only version history, reset-to-default, audit metadata, and boundary validation. It should not start with the full draft/active/previous/archived PromptSpec lifecycle because that lifecycle belongs to official analysis prompts and would make the two prompt systems look similar in the product before the separation is fully protected.

Recommended next implementation after this report:

- Add local Stage Copilot editable prompt record types and pure validation helpers in `packages/stage-copilot`.
- Keep defaults available as fallback.
- Do not add persistence, UI, APIs, providers, PromptOps integration, or contract changes yet.
- Prove editable prompt records are separate from Capability PromptSpecs and cannot claim write, provider, prompt mutation, readiness/package eligibility, or official analysis authority.

## 2. Current Static Defaults Review

Static defaults now exist in [system-prompts.ts](/Users/haitham/development/Workflow/packages/stage-copilot/src/system-prompts.ts).

They cover these required stages:

- `sources_context`
- `hierarchy`
- `targeting`
- `participant_evidence`
- `analysis_package`
- `prompt_studio`
- `advanced_debug`

Each default has:

- `refId`
- `promptKey`
- `stageKey`
- `kind: "stage_copilot_system_prompt"`
- `status: "static_default"`
- `displayName`
- `separatesFromCapabilityPromptSpecs: true`
- `authorityBoundary`
- `systemPrompt`
- notes explaining that future edits must remain separate from Capability / Analysis PromptSpecs

What they prove:

- One safe Copilot System Prompt default exists for each stage.
- Defaults are local to `packages/stage-copilot`.
- Defaults import only `@workflow/contracts` types.
- Defaults are conversation/custom-instruction guidance only.
- Defaults are not Capability PromptSpecs.
- Defaults do not claim write authority, official analysis authority, provider execution, prompt mutation/promotion, readiness mutation, package eligibility mutation, approval authority, or boundary override authority.
- `scripts/prove-stage-copilot-system-prompts.mjs` rejects prompt text or flags that claim unsafe authority.

What they do not provide yet:

- No persistence.
- No editable records.
- No version history.
- No admin identity/audit trail.
- No reset-to-default command.
- No UI or API.
- No runtime prompt assembly.
- No provider-backed chat.
- No integration with context envelopes.

What must remain true when editability is added:

- Static defaults remain available as fallback.
- Editable prompts remain separate from Capability / Analysis PromptSpecs.
- Editable prompt text cannot grant authority that boundary guards deny.
- Edits affect only Copilot prompt records, not analysis prompt records.
- Existing prompt keys such as `admin_assistant_prompt`, `pass5.admin_assistant`, `pass6_analysis_copilot`, `PASS5_PROMPT_FAMILY`, and `PASS6_PROMPT_CAPABILITY_KEYS` remain untouched.

## 3. Editable Prompt Model Options

### Option A - Simple versioned custom-instructions model

What it produces:

- One current Copilot System Prompt record per stage.
- Append-only version records or immutable saved revisions.
- Current pointer by stage.
- Reset-to-default.
- Audit metadata: created/updated by, timestamps, reason/note, default source ref.
- Validation through `packages/stage-copilot` authority checks.

User/admin experience:

- Similar to project/custom instructions.
- Admin selects a stage, edits text, sees hard boundaries, saves.
- Save makes the new text current immediately, or after a simple confirmation.
- Version history allows rollback without a heavyweight PromptSpec lifecycle.

Risk level: low to medium.

Compatibility risk:

- Low if implemented outside `packages/prompts`.
- Low if records use new Copilot prompt identifiers and never reuse Capability PromptSpec IDs.

Implementation complexity:

- Moderate when persistence is added.
- Low for a local package types/proof slice.

Proof strategy:

- Static defaults remain available.
- Edited records validate as `stage_copilot_system_prompt`.
- Invalid authority claims are rejected.
- No imports from `packages/prompts`.
- No Capability PromptSpec repository writes.
- Save/edit proof mutates only Copilot prompt records in a future fake repository.

Why use now:

- It matches the operator preference.
- It is enough for editable custom instructions.
- It avoids copying the full analysis PromptSpec lifecycle.
- It keeps the two prompt systems visibly separate.

### Option B - Full draft/active/previous/archived lifecycle similar to analysis PromptSpecs

What it produces:

- Draft Copilot prompt edits.
- Active Copilot prompt.
- Previous/archived versions.
- Promotion controls.
- Possibly prompt preview/test comparisons.

User/admin experience:

- Familiar to existing Prompt Workspace users.
- More governance before changes take effect.

Risk level: medium to high.

Compatibility risk:

- Medium to high because it resembles Capability PromptSpec lifecycle and can confuse admins.
- Risk of accidentally reusing `StructuredPromptSpecRepository` or `Pass6PromptSpecRepository`.

Implementation complexity:

- High.

Proof strategy:

- Strict no-cross-write tests.
- Separate repo/interfaces.
- UI labeling checks.
- Existing PromptSpec proof scripts must still pass.

Why not use now:

- Overbuilt for starter Copilot custom instructions.
- Increases confusion between the two prompt systems.
- Not required until governance needs prove it necessary.

### Option C - Static defaults only for now, no editability yet

What it produces:

- Keep current defaults and guards unchanged.

User/admin experience:

- No admin editability.
- Product remains safe but incomplete.

Risk level: low.

Compatibility risk:

- Very low.

Implementation complexity:

- None.

Proof strategy:

- Existing system prompt proof continues to pass.

Why not use now:

- It does not advance the accepted direction that operators/admins eventually edit stage Copilot custom instructions.
- It is acceptable only if product wants to defer Copilot prompt control entirely.

### Option D - Persisted Copilot profile records with prompt text and audit metadata

What it produces:

- A future `StageCopilotProfile`/record store containing prompt text, stage key, boundary refs, audit metadata, and current/default linkage.

User/admin experience:

- Edits happen inside a broader stage Copilot profile editor.
- Prompt text appears next to stage context/boundary settings.

Risk level: medium.

Compatibility risk:

- Low if kept separate from `packages/prompts`.
- Medium if profile records become too broad and start mixing prompt content with runtime/provider/config behavior.

Implementation complexity:

- Medium to high.

Proof strategy:

- Profile edits cannot alter Capability PromptSpecs.
- Prompt content validation remains pure.
- Boundary fields remain system-controlled.
- Only prompt text/metadata changes in edit operations.

Why not use first:

- Broader profile storage may be more than needed for the first editable prompt slice.
- It can be a later consolidation after simple prompt records prove the model.

### Option E - Store prompt content directly in `StageCopilotProfile`

What it produces:

- `StageCopilotProfile` becomes self-contained with prompt text fields.

User/admin experience:

- Simple to read.
- Prompt and profile appear as one object.

Risk level: medium to high.

Compatibility risk:

- Contract churn and schema churn.
- Large prompt text inside shared profile contracts.
- Harder to version prompt edits separately from profile/boundary changes.

Implementation complexity:

- Medium.

Proof strategy:

- Contract/schema fixtures for prompt content.
- Backward-compatibility fixtures.
- Authority-claim rejection.

Why not use now:

- Current contract is already accepted and proofed.
- Prompt text edit frequency is different from profile/boundary edit frequency.
- Keeping content out of `StageCopilotProfile` preserves cleaner separation.

## 4. Recommended Model

Use Option A first: a simple versioned custom-instructions model.

Recommended record shape later:

- `promptId` or `systemPromptId`
- `stageKey`
- `promptKey`
- `kind: "stage_copilot_system_prompt"`
- `status: "current" | "superseded"`
- `version`
- `systemPrompt`
- `source: "static_default" | "admin_custom"`
- `defaultRefId`
- `createdAt`
- `createdBy`
- `updatedAt`
- `updatedBy`
- `changeNote`
- `authorityBoundary`
- `separatesFromCapabilityPromptSpecs: true`

Behavior:

- Static default exists for every stage.
- If no custom record exists, use the static default.
- Saving custom instructions creates a new version and marks it current.
- Previous versions remain available for view/rollback.
- Reset-to-default creates an audited event or current record pointing back to the default.
- Full draft/active lifecycle is deferred.

Why this is safest:

- Keeps Copilot prompts separate from analysis prompts.
- Allows admin customization with minimal product complexity.
- Preserves auditability.
- Avoids PromptSpec lifecycle confusion.
- Can later grow into draft/active if governance requires it.

## 5. Storage and Persistence Strategy

### `packages/persistence`

Recommendation: eventually yes, but only with dedicated Copilot prompt repositories.

Current observations:

- `packages/persistence` already owns repository interfaces and in-memory/SQLite implementations.
- It has analysis prompt repositories such as `StructuredPromptSpecRepository` and `Pass6PromptSpecRepository`.
- Many repositories expose mixed read/write methods.

Future target:

- Add dedicated records such as `StoredStageCopilotSystemPromptRecord`.
- Add dedicated repositories such as `StageCopilotSystemPromptRepository`.
- Do not reuse `StructuredPromptSpecRepository`.
- Do not reuse `Pass6PromptSpecRepository`.
- Do not store records in PromptSpec tables.

Risk:

- Medium, because adding persistence must avoid touching existing prompt repos and DB tables used by analysis.

### Local `packages/stage-copilot` in-memory/static layer

Recommendation: use first for types/proofs, not durable storage.

What it gives:

- Local editable record types.
- Pure validators.
- Fixture-based fake repositories for proof.
- No dependency on persistence.

Risk:

- Low.

Why first:

- Keeps the next slice small.
- Proves model separation before DB/storage work.

### Future dedicated repository

Recommendation: yes, when persistence is approved.

Preferred design:

- A dedicated repository interface in `packages/persistence`.
- Separate in-memory implementation for proofs.
- Separate SQLite table such as `stage_copilot_system_prompts`.
- No joins or writes to prompt registry tables.

### Reuse prompt persistence

Recommendation: no.

Why:

- It risks mixing the two prompt systems.
- Existing prompt persistence is tied to Capability PromptSpec lifecycle, compiled previews, tests, provider-adjacent behavior, and analysis proof scripts.
- Copilot System Prompts are custom instructions, not official analysis prompts.

### No persistence yet

Recommendation: acceptable for the next local type/proof slice, but not enough for editable product behavior.

## 6. Contract Strategy

Recommended path:

1. Local package types first in `packages/stage-copilot`.
2. Proof fixtures for editable records and version history.
3. Add shared contracts only when persistence/API boundaries require cross-package validation.

Do not add shared contracts immediately.

Reason:

- Current `StageCopilotProfile` is already proofed and accepted.
- Prompt edit records may evolve quickly during the first editable model slice.
- Local types avoid schema churn.

When shared contracts are needed:

- Before app/API routes accept persisted prompt edits.
- Before persistence records are stored durably.
- Before other packages consume editable Copilot prompt records.

Likely future contract/schema:

- `StageCopilotSystemPromptRecord`
- `StageCopilotSystemPromptVersion`
- `StageCopilotSystemPromptStatus`
- `StageCopilotSystemPromptSaveRequest`
- `StageCopilotSystemPromptAuditEvent`

Avoid:

- Adding full prompt content to `StageCopilotProfile` now.
- Reusing `StageCopilotPromptSpecRef` for editable content.
- Naming editable Copilot prompts as `PromptSpec` in admin-facing surfaces.

## 7. Control Surface Strategy

The future admin-facing surface should be separate from Capability PromptSpec workspaces.

Recommended screen elements:

- Stage selector for:
  - Sources & Context
  - Hierarchy
  - Targeting
  - Participant Evidence
  - Analysis / Package
  - Prompt Studio
  - Advanced / Debug
- Current Copilot System Prompt display.
- Editable custom-instructions textarea.
- Static default preview.
- Reset-to-default action.
- Version/audit metadata:
  - current version
  - last saved by
  - last saved at
  - change note
  - default source ref
- System-provided stage context preview:
  - stage purpose
  - stage boundaries
  - allowed read scopes
  - refusal policy summary
  - evidence access policy summary
- Hard boundary summary:
  - read-only
  - no autonomous writes
  - no provider execution
  - no official analysis rerun
  - no prompt mutation/promotion
  - no readiness/package eligibility mutation
- Warning banner:
  - "This changes Copilot conversation behavior only. It does not change Capability / Analysis PromptSpecs or official analysis behavior."
- Save action.
- Optional later: compare current vs previous version.

Do not show:

- Capability PromptSpec body editor in this surface.
- PromptSpec promotion controls.
- Provider test controls.
- Compiled prompt preview for analysis prompts.
- Readiness/gate rule editors.
- Evidence trust editors.

Future UI placement:

- `/workspace/prompts` can eventually link to a Copilot Instructions area, but it must clearly separate "Capability / Analysis PromptSpecs" from "Stage Copilot System Prompts".
- Existing `/prompts`, `/targeting-rollout/prompts`, and `/pass6/prompts` should remain analysis prompt surfaces unless explicitly redesigned.

## 8. Separation from Capability / Analysis Prompts

Enforcement rules:

- Copilot prompt records use `kind: "stage_copilot_system_prompt"`.
- Capability PromptSpecs remain in existing PromptSpec systems.
- Copilot prompt storage must not write to `StructuredPromptSpecRepository`.
- Copilot prompt storage must not write to `Pass6PromptSpecRepository`.
- Copilot prompt save/edit must not call `compileStructuredPromptSpec`, `compilePass5Prompt`, or `compilePass6PromptSpec`.
- Copilot prompt save/edit must not call provider test functions.
- Copilot prompt save/edit must not change prompt family constants or keys.

Required unchanged keys/constants:

- `admin_assistant_prompt`
- `pass5.admin_assistant`
- `pass6_analysis_copilot`
- `PASS5_PROMPT_FAMILY`
- `PASS6_PROMPT_CAPABILITY_KEYS`

Prompt content cannot grant:

- Write authority.
- Provider execution.
- Tool execution.
- Official analysis execution or rerun.
- Capability PromptSpec mutation.
- Prompt promotion.
- Evidence/transcript/gate approval.
- Readiness mutation.
- Package eligibility mutation.
- Package generation.
- Boundary override.

The guard order should be:

1. Platform/system safety.
2. Stage/system boundary.
3. Stage Copilot guard checks.
4. Editable Copilot System Prompt.
5. Read-only context envelope.
6. Admin message.

Editable prompt text is always subordinate to guardrails.

## 9. Stage-by-Stage Editable Prompt Scope

### Pass 2 / Sources & Context

Controls:

- Tone for explaining source usefulness.
- How directly the Copilot challenges weak source assumptions.
- How it asks for missing source/document context.
- How it discusses context-only handling.

Must not control:

- Source registration.
- Crawl/extraction execution.
- Source trust.
- Structured context writes.
- Source-role/scope suggestions as official outputs.

### Pass 3 / Hierarchy

Controls:

- How hierarchy alternatives are discussed.
- How inferred vs confirmed relationships are explained.
- How source-to-role uncertainty is challenged.

Must not control:

- Hierarchy drafting.
- Triage suggestions.
- Manual hierarchy records.
- Structural approvals.
- Readiness snapshots.

### Pass 4 / Targeting

Controls:

- How participant recommendations are explained.
- How sequencing alternatives are compared.
- How contact gaps and question-hint origins are discussed.

Must not control:

- Targeting recommendation generation.
- Candidate decisions.
- Contact profiles.
- Question-hint seed writes.
- Rollout transitions.

### Pass 5 / Participant Evidence

Controls:

- How carefully the Copilot discusses raw participant statements.
- How it challenges unsupported interpretations.
- How it explains disputes, clarification needs, and safe next questions.

Must not control:

- Evidence extraction.
- Clarification formulation.
- Answer recheck.
- Transcript approval/rejection.
- Evidence approval/rejection.
- Participant messages.
- Pass 6 handoff decisions.

### Pass 6 / Analysis / Package

Controls:

- How method/lens explanations are phrased.
- How strong the challenge is around readiness blockers.
- How what-if discussion is structured.
- How caveats and evidence basis are explained.

Must not control:

- Synthesis.
- Difference interpretation.
- Evaluation.
- Readiness.
- Gates.
- Package eligibility.
- Package generation.
- Final package release.

### Prompt Studio

Controls:

- How prompt-system separation is explained.
- How risks of prompt edits are discussed.
- How the Copilot guides admins without implying analysis behavior changes.

Must not control:

- Capability PromptSpec edits.
- PromptSpec promotion/archive.
- Prompt tests.
- Provider execution.
- Prompt registry keys.

### Advanced / Debug

Controls:

- Technical depth and directness.
- How debug-only data is distinguished from business truth.
- How route/provider/proof issues are explained.

Must not control:

- Provider jobs.
- Persistence.
- Runtime routes.
- Proof baselines.
- Analysis records.
- Source-of-truth records.

## 10. Recommended Build Order

### Slice 1 - Local editable Copilot prompt record types and validators

- Purpose: define the minimal editable model without persistence.
- Files/packages likely touched: `packages/stage-copilot/src/system-prompts.ts` or a new local file, `packages/stage-copilot/src/index.ts`, proof script.
- Produces: local record/version types, pure validation helpers, static default fallback behavior.
- Must not do: persistence, UI, APIs, `packages/prompts`, contracts, providers, runtime chat.
- Proof strategy: valid custom prompt records, invalid authority claims, no `@workflow/prompts` import, defaults remain available.
- Risk level: low.

### Slice 2 - In-memory proof repository local to proof only

- Purpose: prove save/edit/rollback behavior affects only Copilot prompt records.
- Files/packages likely touched: proof script and possibly local helper types.
- Produces: deterministic fake repository proof, not production persistence.
- Must not do: add `packages/persistence` repository yet.
- Proof strategy: before/after snapshots of fake Copilot records and unchanged fake Capability PromptSpec records.
- Risk level: low.

### Slice 3 - Add shared contract only if needed

- Purpose: establish cross-package shape for persisted editable Copilot prompt records.
- Files/packages likely touched: `packages/contracts` only after approval.
- Produces: Draft-07 schema and validator for editable Copilot prompt record.
- Must not do: change `StageCopilotProfile` required fields or PromptSpec schemas.
- Proof strategy: valid/invalid fixtures and backward compatibility.
- Risk level: medium.

### Slice 4 - Dedicated persistence repository

- Purpose: persist editable Copilot System Prompt records.
- Files/packages likely touched: `packages/persistence`.
- Produces: in-memory and SQLite repositories for Copilot prompt records only.
- Must not do: reuse PromptSpec repositories or tables.
- Proof strategy: save/list/current/version/reset proofs; Capability PromptSpec repos unchanged.
- Risk level: medium.

### Slice 5 - Read-only API/control route planning or implementation

- Purpose: expose editable prompt records to future UI.
- Files/packages likely touched: app routes after explicit approval.
- Produces: CRUD for Copilot prompt records only.
- Must not do: provider execution, analysis prompt mutation, runtime chat.
- Proof strategy: route tests, no calls to PromptSpec APIs, no provider imports.
- Risk level: medium.

### Slice 6 - Admin control surface

- Purpose: allow editing custom instructions per stage.
- Files/packages likely touched: `apps/admin-web`.
- Produces: stage selector, textarea, boundary summary, version metadata, reset-to-default.
- Must not do: merge with Capability PromptSpec editor or affect visual baseline without approval.
- Proof strategy: UI tests/visual gate, no PromptSpec mutation, no provider calls.
- Risk level: medium to high.

### Slice 7 - Runtime prompt assembly

- Purpose: use editable Copilot prompt as one input to future Stage Copilot runtime.
- Files/packages likely touched: future runtime package/app API after explicit approval.
- Produces: assembly order with system/stage guardrails above custom instructions.
- Must not do: bypass guards or run official analysis.
- Proof strategy: prompt content cannot override boundary guards; no write/provider execution from conversation alone.
- Risk level: high.

## 11. Proof Strategy

Future implementation should prove:

- Static defaults remain available for every required stage.
- Editable records are `stage_copilot_system_prompt`, not Capability PromptSpecs.
- Editable records use separate keys from analysis PromptSpec keys.
- `packages/prompts` is not imported or mutated in local/persistence slices.
- `StructuredPromptSpecRepository` and `Pass6PromptSpecRepository` are untouched.
- Capability PromptSpec constants remain unchanged.
- Prompt save/edit affects only Copilot prompt records.
- Prompt content cannot override boundary guards.
- Authority claim validation rejects:
  - record mutation
  - provider/tool execution
  - official analysis execution/rerun
  - Capability PromptSpec alteration
  - prompt promotion
  - evidence/transcript/gate approval
  - readiness mutation
  - package eligibility mutation
  - boundary override
- No runtime/provider/UI behavior is introduced unless explicitly scoped.
- Existing Stage Copilot proofs still pass:
  - foundation contracts proof
  - static taxonomy proof
  - foundation package proof
  - context envelope proof
  - system prompt defaults proof
- Existing analysis proof scripts still pass where relevant.

Suggested next proof cases:

- Valid: custom current record for each stage.
- Valid: default fallback when no custom record exists.
- Valid: saving a new custom version supersedes previous current record in a fake local repository.
- Valid: reset-to-default restores default reference without deleting history.
- Invalid: custom record uses `kind: "capability"`.
- Invalid: custom record uses a known analysis prompt key.
- Invalid: custom prompt text claims unsafe authority.
- Invalid: save attempts to mutate Capability PromptSpec fixtures.

## 12. Risks, Open Questions, and Required Decisions

Critical risks:

- Reusing Capability PromptSpec persistence for Copilot System Prompts.
- Naming/editing Copilot prompts in a way that looks like analysis PromptSpecs.
- Allowing prompt text to override guardrails.
- Introducing provider-backed runtime or prompt tests too early.
- Adding UI that edits analysis prompts and Copilot prompts in the same form.

Non-critical risks:

- Simple versioned model may later need draft/active governance.
- Static defaults may be too generic for product-quality personality.
- Regex authority checks are useful guards but not complete semantic safety; they must be paired with runtime boundary guards.

Required operator decisions:

- Confirm simple versioned custom-instructions model as first editable model.
- Decide whether first editable proof should include a local fake repository.
- Decide naming: "Copilot System Prompt", "Stage Copilot Instructions", or "Copilot Custom Instructions".
- Decide whether save should make a version current immediately or require a confirmation step.
- Decide whether reset-to-default creates a new version or clears the custom current pointer.

Deferred items:

- Durable persistence.
- Shared contracts/schemas.
- Admin UI.
- APIs.
- Runtime prompt assembly.
- Provider-backed chat.
- Prompt tests for Copilot System Prompts.
- Full draft/active lifecycle.

## 13. Final Recommendation

Build the next slice as local editable Copilot System Prompt record types and pure validators in `packages/stage-copilot`. Include fixture proof for current custom records, version history, default fallback, reset-to-default semantics, and rejection of unsafe authority claims.

Do not touch `packages/prompts`, Capability PromptSpecs, PromptSpec keys, Pass 5, Pass 6, persistence, UI, APIs, providers, retrieval, or runtime chat in the next slice.

After the local editable model is proven, add a dedicated Copilot prompt persistence repository. Do not reuse analysis PromptSpec storage.
