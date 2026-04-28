# Stage Copilot Instructions Control Surface Plan

## 1. Executive Summary

The safest first UI surface for Stage Copilot Instructions is a separate workspace page, `/workspace/copilot-instructions`, not an embedded editor inside `/workspace/prompts`.

The codebase already has several prompt-related admin surfaces that clearly belong to the Capability / Analysis PromptSpec system:

- `/prompts` shows the legacy prompt registry.
- `/targeting-rollout/prompts` imports `@workflow/prompts`, compiles Pass 4 targeting PromptSpecs, and exposes draft/active/previous lifecycle controls.
- `/pass6/prompts` imports `@workflow/prompts`, manages Pass 6 capability PromptSpecs, and exposes draft/active/previous prompt lifecycle controls.
- `/workspace/prompts` is currently a guided workspace placeholder that links to advanced PromptOps pages and uses copy that can cover both capability prompts and Copilot answer style.

Stage Copilot Instructions are different. They are editable custom instructions for stage-scoped Copilot conversation behavior only. They must not be presented as PromptSpecs, PromptOps, compiled prompts, prompt tests, or analysis prompt lifecycle controls.

Recommended next implementation: add a new `/workspace/copilot-instructions` page with a focused client control surface backed by the existing `/api/stage-copilot/instructions` route. Add a visible entry point from `/workspace/prompts` only after the separate page exists and is clearly labelled as "Stage Copilot Instructions". Do not import `@workflow/prompts`, do not touch existing PromptSpec surfaces, and do not add runtime/chat behavior.

## 2. Current UI Surface Review

Files inspected:

- `apps/admin-web/app/workspace/prompts/page.tsx`
- `apps/admin-web/app/workspace/_components/WorkspacePlaceholderPage.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceShell.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceNav.tsx`
- `apps/admin-web/app/workspace/_i18n/en.ts`
- `apps/admin-web/app/workspace/_i18n/ar.ts`
- `apps/admin-web/app/api/stage-copilot/instructions/route.ts`
- `apps/admin-web/app/prompts/page.tsx`
- `apps/admin-web/app/targeting-rollout/prompts/page.tsx`
- `apps/admin-web/app/pass6/prompts/page.tsx`
- `apps/admin-web/components/Nav.tsx`
- `packages/stage-copilot/src/system-prompts.ts`
- `packages/stage-copilot/src/editable-system-prompts.ts`

Current prompt-related UI surfaces:

- `/prompts`: legacy prompt registry. It fetches `/api/prompts`, displays prompt records, and links to prompt detail/new screens.
- `/targeting-rollout/prompts`: Pass 4 PromptSpec surface. It imports `ensureActivePass4TargetingPromptSpec`, `listPass4PromptSpecs`, and `compilePass4TargetingPromptSpec` from `@workflow/prompts`. This is explicitly a Capability / Analysis PromptSpec surface.
- `/pass6/prompts`: Pass 6 Prompt Workspace. It imports `PASS6_PROMPT_CAPABILITY_KEYS`, creates default Pass 6 PromptSpecs, compares draft vs active, and exposes promote/clone actions. This is explicitly a Capability / Analysis PromptSpec surface.
- `/workspace/prompts`: a guided workspace placeholder. It currently links to `/prompts`, `/targeting-rollout/prompts`, and `/pass6/prompts`. It does not edit anything yet.

What `/workspace/prompts` currently shows:

- Eyebrow/title: "Prompt Studio".
- Boundary copy: prompts can affect wording, extraction behavior, clarification style, drafting style, explanation style, and Copilot answer style, but must not own gates, package eligibility, release decisions, governance, or evidence trust.
- Future capabilities: active prompt profiles, draft vs active comparison, prompt test results, advanced PromptOps links.
- Advanced links to existing PromptOps surfaces.

Surfaces for Capability / Analysis PromptSpecs:

- `/prompts`
- `/targeting-rollout/prompts`
- `/pass6/prompts`
- related APIs under `/api/prompts`, `/api/targeting-rollout/prompts`, and `/api/pass6/prompts`
- Pass 3 prompt controls embedded in `/api/intake-sessions/[id]/hierarchy`

Surfaces that must not be modified yet:

- Existing PromptSpec management pages and APIs.
- Existing `/workspace/prompts` semantics, unless a later UI slice explicitly adds a clearly separated entry point.
- Existing Pass 4 and Pass 6 prompt pages because they import and manage Capability PromptSpecs.

Safe fit for Stage Copilot Instructions:

- Best first fit: a dedicated `/workspace/copilot-instructions` page under the workspace shell.
- Secondary later fit: a small, clearly labelled link or panel from `/workspace/prompts` to the dedicated page.
- Avoid placing the editor directly in `/workspace/prompts` as the first slice because that page already points to PromptOps and uses generic "Prompt Studio" language.

## 3. Placement Options

Option A - Add a section inside `/workspace/prompts`

- User clarity: medium to low unless heavily labelled. The page already points to Capability PromptSpec surfaces and talks about prompt profiles/tests.
- Implementation complexity: low if added to the placeholder, moderate if converting it to a live client page.
- Confusion risk: high. Users may infer that Stage Copilot Instructions participate in draft/active PromptSpec lifecycle or affect extraction/synthesis/evaluation.
- Visual baseline impact: medium. `/workspace/prompts` currently has a stable placeholder layout.
- Proof/visual acceptance: browser smoke for `/workspace/prompts`, plus source proof that no `@workflow/prompts` import was added.
- Use now: not recommended as the first editor. It is acceptable later as a navigation card only.

Option B - Add a separate page under `/workspace/copilot-instructions`

- User clarity: high. The route name and page title can avoid the overloaded "Prompt Studio" label.
- Implementation complexity: moderate. It needs a new workspace page, i18n labels, client fetch logic, and focused CSS.
- Confusion risk: low if labels consistently say "Stage Copilot Instructions" and "does not change analysis prompts".
- Visual baseline impact: low. Existing workspace pages remain unchanged except for an optional later nav link.
- Proof/visual acceptance: direct route/API proof, source proof for no `@workflow/prompts`, and browser smoke for `/workspace/copilot-instructions` plus existing workspace routes.
- Use now: recommended.

Option C - Add nested pages by stage, such as `/workspace/copilot-instructions/[stageKey]`

- User clarity: high for deep editing, but heavier than needed for the first UI.
- Implementation complexity: medium to high due routing, per-stage loading states, and history detail pages.
- Confusion risk: low.
- Visual baseline impact: low if isolated.
- Proof/visual acceptance: stage route smoke for at least `sources_context` and `analysis_package`, invalid stage behavior, API proof.
- Use now: defer. Start with one page and stage selector; add nested routes only if URLs per stage become useful.

Option D - Add it later inside a full Copilot Studio

- User clarity: potentially high if Copilot Studio becomes the top-level owner of all Copilot configuration.
- Implementation complexity: high because it implies a broader IA and future Copilot runtime surfaces.
- Confusion risk: medium until Copilot Studio boundaries are designed.
- Visual baseline impact: high.
- Proof/visual acceptance: broader visual and behavioral proof.
- Use now: defer. It is a good future destination after the first simple editor proves the model.

Option E - Keep no UI for now

- User clarity: no new risk, but operators cannot edit through the app.
- Implementation complexity: none.
- Confusion risk: none.
- Visual baseline impact: none.
- Proof/visual acceptance: existing API proofs only.
- Use now: acceptable if UI scope is not approved, but it blocks the product goal of operator-editable Copilot instructions.

## 4. Recommended Placement

Build the first control surface at:

`/workspace/copilot-instructions`

Recommended navigation:

- First UI slice may add the route without adding it to primary workspace nav if the operator wants zero nav churn.
- Preferred first usable slice should add a small nav item labelled "Copilot Instructions" or a clear card/link from `/workspace/prompts`.
- If adding to `WorkspaceNav`, place it adjacent to "Prompt Studio" but not under the same label. The nav should make them distinct:
  - "Prompt Studio" = existing prompt/PromptOps orientation and links.
  - "Copilot Instructions" = conversational behavior instructions for Stage Copilots.

Reasoning:

- The existing `/workspace/prompts` label is already overloaded.
- Existing advanced prompt pages are Capability PromptSpec surfaces and import `@workflow/prompts`.
- The API and repository for Stage Copilot Instructions are already separate and deserve a separate UI boundary.
- A dedicated route makes proof easier: the UI should not import `@workflow/prompts`, should only call `/api/stage-copilot/instructions`, and should not touch existing prompt pages.

## 5. UI Information Architecture

The first page should use the workspace shell and show:

- Page title: "Stage Copilot Instructions".
- One-line separation message: "Controls how the Copilot talks, not how analysis runs."
- Stage selector for:
  - Sources & Context
  - Hierarchy
  - Targeting
  - Participant Evidence
  - Analysis / Package
  - Prompt Studio
  - Advanced / Debug
- Current/effective state summary:
  - selected stage
  - source: default or custom
  - version
  - last updated time
  - last updated by
  - change note
- Editable textarea:
  - label: "Custom instructions"
  - initial value: effective prompt text
  - helper text: "These instructions shape conversation only."
- Static default preview:
  - collapsible or side panel
  - label: "Static default"
  - show default prompt text read-only
- History/version list:
  - version
  - source
  - status
  - updatedAt
  - updatedBy
  - changeNote
  - current/superseded badge
- Actions:
  - "Save instructions"
  - "Reset to static default"
  - optional "Restore text from effective" local-only edit reset, not persisted
- Boundary warning:
  - "The Copilot remains read-only. These instructions cannot grant write authority."
- Separation warning:
  - "This does not change extraction, synthesis, evaluation, package drafting, or Capability PromptSpecs."
- Optional fields:
  - `changeNote`: visible and optional.
  - `updatedBy`: hidden/defaulted for now unless the app has a real actor source.

Do not include:

- PromptSpec draft/active/previous/archived lifecycle controls.
- Prompt test runner.
- Compile preview.
- Provider/run buttons.
- Chat preview.
- Analysis rerun buttons.
- Package readiness or eligibility controls.

## 6. Labeling and Copy

Recommended final labels:

- Page title: "Stage Copilot Instructions"
- Short description: "Controls how the Copilot talks, not how analysis runs."
- Stage selector label: "Stage"
- Textarea label: "Custom instructions"
- Current block label: "Current instructions"
- Effective block label: "Effective instructions"
- Default block label: "Static default"
- History label: "Instruction history"
- Save button: "Save instructions"
- Reset button: "Reset to static default"
- Change note label: "Change note"
- Status labels:
  - "Using static default"
  - "Using custom instructions"
  - "Current"
  - "Superseded"

Required separation copy:

- "Stage Copilot Instructions are separate from Capability / Analysis PromptSpecs."
- "Editing this page does not change extraction, clarification, synthesis, evaluation, package drafting, or prompt tests."
- "Instructions cannot grant write authority, approve evidence, change readiness, change package eligibility, call providers, or mutate records."

Avoid:

- "PromptSpec" for this editor.
- "Prompt Studio editor" as the main label.
- "Activate", "Promote", "Archive", "Run test", or "Compile" because those map to the analysis prompt system.
- "System Prompt" as the only visible label. Use "Stage Copilot Instructions" for admins; reserve "System Prompt" for technical metadata or help text.

Arabic label direction:

- Page title: "تعليمات مساعد المرحلة"
- Short description: "تتحكم في أسلوب حديث المساعد، وليس في تشغيل التحليل."
- Separation copy: "هذه التعليمات منفصلة عن توجيهات التحليل الرسمية ولا تغيّر الاستخراج أو التوليف أو التقييم أو إعداد الحزمة."

## 7. Interaction Design

Stage selection:

- Default selected stage: first API stage, preferably `sources_context`.
- Use a segmented list or select depending on viewport width.
- On stage change, fetch `GET /api/stage-copilot/instructions?stageKey=...&includeHistory=true`.
- Replace the textarea with effective prompt text for that stage.
- Show whether the selected stage is using static default or persisted current custom instructions.

Default/current/effective display:

- `default`: always read-only baseline from static defaults.
- `current`: persisted current record, or null.
- `effective`: what the Copilot would use later. If `current` is null, effective comes from static default.
- The editor textarea should load from `effective.systemPrompt`, not from raw default only.

Save:

- User edits the textarea and optionally enters a change note.
- Submit JSON:
  - `action: "save-custom"`
  - `stageKey`
  - `systemPrompt`
  - optional `changeNote`
- Let the API default `updatedBy` until auth/actor mapping is decided.
- On success, refresh the stage state including history.

Reset-to-default:

- Confirm with a lightweight confirmation state or modal.
- Submit JSON:
  - `action: "reset-to-default"`
  - `stageKey`
  - optional `changeNote`
- Copy should say reset creates a new current version from the static default and preserves history.

History:

- Show compact rows by default.
- Include version, source, status, updatedAt, updatedBy, and changeNote.
- Do not offer restore-from-history in the first UI slice. That is a later operation that should be explicitly designed.

Validation errors:

- Map API errors to field-level and page-level messages.
- `invalid_stage_key`: page-level, "Unsupported Stage Copilot stage."
- `missing_system_prompt`: textarea-level, "Instructions cannot be empty."
- `invalid_copilot_instructions` or `repository_validation_failed`: textarea-level with translated friendly messages for known violations.

Unsafe authority claims:

- Explain the boundary, not just the validation code.
- Example: "These instructions claim authority to mutate records. Stage Copilots are read-only; remove that authority claim and save again."
- Keep the edited text in the textarea so the admin can fix it.

Change note:

- Make visible and optional in first UI.
- Placeholder: "What changed and why?"
- API default remains available if empty.
- Do not require `updatedBy` in the UI until authentication/actor handling is productized.

## 8. API Usage Plan

Use the existing API exactly as implemented.

Initial page load:

- `GET /api/stage-copilot/instructions`
- Purpose: list supported stages/defaults and current availability.

Selected stage load:

- `GET /api/stage-copilot/instructions?stageKey=sources_context`
- Purpose: load default/current/effective for the selected stage.

History load:

- `GET /api/stage-copilot/instructions?stageKey=sources_context&includeHistory=true`
- Purpose: load full version history when the stage detail is open.
- The first implementation can request history whenever stage changes to avoid a second interaction.

Save custom:

```json
{
  "action": "save-custom",
  "stageKey": "sources_context",
  "systemPrompt": "Custom stage-scoped Copilot instructions...",
  "changeNote": "Clarified challenge style for source boundaries."
}
```

Reset:

```json
{
  "action": "reset-to-default",
  "stageKey": "sources_context",
  "changeNote": "Reset after review."
}
```

Do not add new API behavior for the first UI slice. If the UI needs different response shaping, adapt in the client rather than expanding the route.

## 9. Bilingual / RTL Considerations

The workspace shell already has local `en` and `ar` dictionaries and derives `dir` from language. The control surface should stay inside that workspace-scoped i18n model.

Implementation guidance:

- Add labels to `apps/admin-web/app/workspace/_i18n/en.ts` and `apps/admin-web/app/workspace/_i18n/ar.ts` only in the future UI slice.
- Keep translations local to workspace; do not add global i18n infrastructure.
- Use the existing `WorkspaceShell` language toggle.
- Ensure the stage selector, history list, metadata rows, and action buttons work in both LTR and RTL.
- Textarea content should follow the page direction by default, but prompt content may contain English. Consider `dir="auto"` on textarea/content blocks if mixed Arabic/English text becomes common.
- Avoid fixed-width layouts that break Arabic labels.

Arabic copy should distinguish:

- "تعليمات مساعد المرحلة" for Stage Copilot Instructions.
- "توجيهات التحليل الرسمية" or "Capability / Analysis PromptSpecs" for analysis prompts.
- Do not translate both systems into the same generic "التوجيهات" label without qualification.

## 10. Visual and UX Acceptance Criteria

The future UI is acceptable only if:

- The page title clearly says "Stage Copilot Instructions".
- The first viewport states that the page controls Copilot conversation, not analysis execution.
- The stage selector is visible without scrolling on desktop and mobile.
- The editor clearly shows current/effective/default state.
- Save and reset are visible but not more visually dominant than the separation and boundary warnings.
- Reset copy states that history is preserved.
- Validation errors explain unsafe authority claims in admin-friendly language.
- The page does not use PromptSpec lifecycle language such as promote, active draft, compile, or test.
- `/workspace/prompts` remains visually stable unless deliberately updated with a separate entry point.
- No existing workspace pages regress visually:
  - `/workspace`
  - `/workspace/prompts`
  - `/workspace/hierarchy`
  - `/workspace/analysis`
- RTL and LTR layouts do not overlap, truncate critical labels, or invert the meaning of current/default/history metadata.
- The UI does not imply that a Stage Copilot is live chat-ready.

## 11. Recommended Implementation Slice

Slice name: Stage Copilot Instructions Workspace Page

- Purpose: add a no-runtime, no-chat admin control surface for editing Stage Copilot Instructions through the existing API.
- Files likely touched:
  - `apps/admin-web/app/workspace/copilot-instructions/page.tsx`
  - optional client component under `apps/admin-web/app/workspace/copilot-instructions/`
  - `apps/admin-web/app/workspace/_i18n/en.ts`
  - `apps/admin-web/app/workspace/_i18n/ar.ts`
  - `apps/admin-web/app/workspace/workspace.module.css`
  - optionally `apps/admin-web/app/workspace/_components/WorkspaceNav.tsx`
- What it produces:
  - Stage selector.
  - Effective/custom/default instruction editor.
  - Save/reset actions using `/api/stage-copilot/instructions`.
  - History display.
  - Clear separation and read-only boundary warnings.
- What it must not do:
  - Do not import `@workflow/prompts`.
  - Do not modify PromptSpecs or PromptSpec repositories.
  - Do not call providers.
  - Do not compile prompts.
  - Do not add chat/runtime behavior.
  - Do not modify Pass 5 or Pass 6 behavior.
  - Do not alter API behavior unless a separate API slice is approved.
- Proof strategy:
  - Existing Stage Copilot API proof still passes.
  - Source proof that new UI files do not import `@workflow/prompts`.
  - Source proof that UI calls only `/api/stage-copilot/instructions` for this feature.
  - Save/reset browser or route interaction smoke against the existing API if a dev server proof is in scope.
  - `pnpm typecheck`.
- Visual/browser checks:
  - Desktop and mobile screenshots for `/workspace/copilot-instructions`.
  - Smoke `/workspace`, `/workspace/prompts`, `/workspace/hierarchy`, and `/workspace/analysis`.
  - Check English and Arabic/RTL toggles.
- Risk level: medium, mostly UX clarity and visual regression risk.

Follow-up slice: Workspace Entry Point

- Purpose: add a link from `/workspace/prompts` or workspace nav after the dedicated page is working.
- Files likely touched:
  - `WorkspaceNav.tsx` or `workspace/prompts/page.tsx`
  - workspace i18n files
- What it produces: discoverability without merging Copilot Instructions into PromptOps.
- What it must not do: do not embed PromptSpec controls in the Copilot Instructions page.
- Proof strategy: visual smoke and source import checks.
- Risk level: low to medium depending on nav changes.

Deferred slice: History Restore / Diff

- Purpose: allow restoring an older instruction version or comparing current/default/custom.
- Files likely touched: UI page and possibly API if restore is not modeled as save-custom.
- What it produces: better operator control after basic edit/reset.
- What it must not do: do not introduce PromptSpec lifecycle terms.
- Proof strategy: route/API proof for version semantics and visual proof.
- Risk level: medium.

## 12. Proof Strategy

Future implementation should prove:

- Existing command set still passes:
  - Stage Copilot foundation proofs.
  - Stage Copilot prompt repository proofs.
  - Stage Copilot Instructions API proof.
  - `pnpm --filter @workflow/stage-copilot build`.
  - `pnpm --filter @workflow/persistence build`.
  - `pnpm typecheck`.
- New UI source does not import:
  - `@workflow/prompts`
  - Pass 5 runtime functions
  - Pass 6 runtime functions
  - provider/integration packages
  - prompt compilation/test helpers
- UI save/reset affects only `/api/stage-copilot/instructions`.
- API proof confirms no rows are written to `structured_prompt_specs` or Pass 6 PromptSpec records.
- Visual/browser smoke covers:
  - `/workspace/copilot-instructions`
  - `/workspace`
  - `/workspace/prompts`
  - `/workspace/hierarchy`
  - `/workspace/analysis`
- The page displays boundary copy in both English and Arabic.
- Unsafe authority claim errors are visible and do not clear the user's textarea.
- No runtime/chat/provider/retrieval behavior appears in the UI.

## 13. Risks, Open Questions, and Required Decisions

Critical risks:

- Naming confusion: "Prompt Studio" and "Stage Copilot Instructions" can collapse into one mental model if placed on the same page too early.
- Lifecycle confusion: users may expect draft/active/promotion behavior if the UI resembles Pass 4/Pass 6 PromptSpec pages.
- Authority confusion: admins may believe prompt text can override read-only/no-write guardrails unless warnings are first-class.
- Runtime readiness confusion: an editor could imply a live Copilot exists even though no chat/runtime has been built.

Non-critical risks:

- Workspace nav crowding if a new primary nav item is added.
- Bilingual text length may require CSS adjustments.
- History list may become dense if many saves occur.
- `updatedBy` default is currently an operator placeholder until authentication/user attribution is designed.

Required operator decisions:

- Should `/workspace/copilot-instructions` be added to the primary workspace nav in the first UI slice, or should it be reachable only through `/workspace/prompts` initially?
- Should `changeNote` be optional visible input, required visible input, or hidden/defaulted in the first UI?
- Should history be always shown or collapsed by default?
- Should the first UI include a local "discard unsaved edits" action?

Deferred items:

- Full Copilot Studio.
- Per-stage nested instruction URLs.
- History restore/diff.
- Real actor/auth attribution.
- Live Copilot chat/runtime.
- Prompt tests for Stage Copilot Instructions.
- Any integration with Capability / Analysis PromptSpec lifecycle.

## 14. Final Recommendation

Implement the first Stage Copilot Instructions control surface as a dedicated `/workspace/copilot-instructions` page backed by the existing API. Keep it visually and semantically separate from `/workspace/prompts`, `/prompts`, `/targeting-rollout/prompts`, and `/pass6/prompts`.

Use the admin-facing label "Stage Copilot Instructions" and the repeated explanation "Controls how the Copilot talks, not how analysis runs." The first implementation should provide stage selection, effective/current/default prompt display, an editable custom-instructions textarea, optional change note, save, reset-to-default, history, and hard boundary warnings.

Do not build chat, provider execution, retrieval, prompt compilation, PromptSpec lifecycle controls, or any connection to Capability / Analysis PromptSpecs in this UI slice.
