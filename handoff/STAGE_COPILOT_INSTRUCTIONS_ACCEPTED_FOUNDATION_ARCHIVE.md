# Stage Copilot Instructions Accepted Foundation Archive

## Purpose

This archive records the accepted foundation for Stage Copilot Instructions after closure review.

Stage Copilot Instructions are the separate stage-specific custom-instruction layer for future Stage Copilots. They control conversation/personality/style only. They do not control official analysis capabilities and do not modify Capability / Analysis PromptSpecs.

## Accepted Status

Status: accepted closed foundation.

- Final accepted closure commit: `a54dc14dc2390e71d1032623a16941bf8f931a73`.
- Implementation final UI commit: `1d574386132ca8bddf71b72ddef3eb900c255d76`.
- Closure review: `handoff/STAGE_COPILOT_INSTRUCTIONS_TRACK_CLOSURE_REVIEW.md`.
- Required patches before acceptance: none.

## Critical Product Decision

There are two separate prompt systems.

System 1 — Capability / Analysis System Prompts:

- Existing official analysis prompt system.
- Controls extraction, clarification, synthesis, evaluation, package drafting, and related official analysis capabilities.
- Must remain untouched and separate.

System 2 — Stage Copilot System Prompts / Stage Copilot Instructions:

- Separate future layer for stage-specific Copilot conversation/personality/custom instructions.
- Controls how the Copilot speaks, reasons, challenges, and discusses.
- Does not run official analysis.
- Does not modify Capability PromptSpecs.
- Does not alter readiness, evidence trust, synthesis, evaluation, package eligibility, or package output.

## Built Foundation

Accepted areas built:

- Stage Copilot foundation contracts/design layer.
- Isolated `packages/stage-copilot` package.
- No-write/read-only/advisory boundary guards.
- Read-only context envelope types and helpers.
- Static Stage Copilot System Prompt defaults for:
  - `sources_context`
  - `hierarchy`
  - `targeting`
  - `participant_evidence`
  - `analysis_package`
  - `prompt_studio`
  - `advanced_debug`
- Editable local Stage Copilot System Prompt model.
- In-memory Stage Copilot System Prompt repository.
- SQLite Stage Copilot System Prompt repository.
- Dedicated SQLite table: `stage_copilot_system_prompts`.
- Dedicated SQLite factory: `createSQLiteStageCopilotRepositories(dbPath?)`.
- Admin store overlay: `store.stageCopilotSystemPrompts`.
- API route: `/api/stage-copilot/instructions`.
- Workspace UI route: `/workspace/copilot-instructions`.
- Closure review report.

## Boundaries Preserved

The accepted foundation did not build or change:

- live Stage Copilot runtime/chat
- provider execution
- retrieval/RAG/vector search
- context assembly
- prompt compilation
- prompt tests
- Capability / Analysis PromptSpecs
- PromptSpec keys
- `PASS5_PROMPT_FAMILY`
- `PASS6_PROMPT_CAPABILITY_KEYS`
- Pass 5 runtime behavior
- Pass 6 runtime behavior
- synthesis/evaluation/package analysis logic
- readiness behavior
- package eligibility behavior
- package output behavior

## Proof Stack Summary

The track added or used focused proofs for:

- Stage Copilot foundation contracts.
- Static taxonomy projection.
- Foundation package boundary guards.
- Read-only context envelope.
- Static system prompt defaults.
- Editable system prompt model.
- In-memory repository behavior.
- SQLite repository durability and one-current-per-stage behavior.
- SQLite repository factory separation.
- Admin store overlay.
- Instructions API read/save/reset behavior.
- Workspace UI presence and source-level non-runtime separation.

The final implementation slice also passed:

- `pnpm build:contracts`
- all Stage Copilot proof scripts
- `pnpm --filter @workflow/stage-copilot build`
- `pnpm --filter @workflow/persistence build`
- `pnpm typecheck`
- `pnpm build`

## Accepted Technical Debt

Non-blocking follow-ups:

- Document the Next.js module-resolution workaround for `@workflow/stage-copilot`.
- Add deeper visual/RTL regression coverage later if needed.
- Consider reset-to-default confirmation UX later.
- Replace placeholder actor metadata (`admin_operator`) when auth is in scope.

Build/module-resolution note:

- `apps/admin-web` declares `@workflow/stage-copilot` as a workspace dependency.
- `apps/admin-web/next.config.mjs` keeps `@workflow/stage-copilot` out of `transpilePackages`.
- `apps/admin-web/next.config.mjs` aliases `@workflow/stage-copilot` to built `packages/stage-copilot/dist/index.js`.
- This is accepted as a local package-resolution workaround and technical debt until a cleaner monorepo-wide pattern is adopted.

## Next Recommended Work

Next recommended work:

**Stage Copilot Read-Only Context Assembly Planning**

Constraints for next work:

- Do not jump directly to provider-backed runtime/chat.
- Do not build retrieval yet.
- Do not mutate Capability / Analysis PromptSpecs.
- Do not change Pass 5 or Pass 6 analysis behavior.
- Do not change readiness, package eligibility, synthesis, evaluation, package drafting, provider behavior, or persistence semantics.
- Start with planning read-only context assembly.
- Candidate low-risk pilots: Prompt Studio Copilot context or Sources / Context Copilot context.

## Final Archive Judgment

The Stage Copilot Instructions track is accepted as a bounded no-runtime foundation. It is safe to treat this control path as closed before future Stage Copilot context assembly or runtime work begins.
