# Stage Copilot Floating Widget Polish Plan

## 1. Purpose

Polish the existing Workspace Stage Copilot Widget visually only.

This plan is limited to widget placement and shape:

- circular floating trigger
- fixed position that stays visible while scrolling
- right-side placement for English / LTR
- left-side placement for Arabic / RTL
- fixed chat panel that opens from the trigger
- responsive behavior on narrow screens

This plan does not change Copilot behavior, APIs, stage knowledge, provider usage, prompts, persistence, or analysis logic.

## 2. Current State

The widget is mounted in `WorkspaceShell`, so it is broadly available inside `/workspace`.

Current behavior:

- available on workspace pages
- supports `prompt_studio`
- supports `sources_context`
- can switch stage manually
- calls existing stage-specific APIs
- keeps conversation in local component state only
- has no tools, actions, writes, apply controls, save controls, provider selector, or model selector

Current visual issue:

- trigger is rectangular and visually heavy
- it occupies more horizontal space than needed
- placement is tied to the workspace container rather than behaving like a persistent screen-level assistant
- on long pages, the user should always see it while scrolling

## 3. Recommended Visual Model

Use a floating circular trigger.

Desktop / LTR:

- fixed to bottom-right of viewport
- suggested position: `bottom: 24px; right: 24px`

Desktop / RTL:

- fixed to bottom-left of viewport
- suggested position: `bottom: 24px; left: 24px`

Trigger:

- circle, 52-60px diameter
- clear icon or short initials
- accessible label: `Stage Copilot`
- tooltip/title may show active stage
- no long text inside the circle
- active stage can be shown in the opened panel header, not on the trigger

Panel:

- fixed above the trigger
- width around 380-440px on desktop
- max height around `calc(100vh - 120px)`
- scroll internally
- does not push page layout
- remains visible while page scrolls
- closes with an explicit close button

Mobile / narrow screens:

- trigger remains fixed bottom-inline-end according to direction
- panel width should be `calc(100vw - 24px)`
- panel should not overflow viewport
- panel should remain usable with internal scroll

## 4. RTL / LTR Rules

Use the workspace root `dir` value to place the widget.

Rules:

- `dir="ltr"`: trigger and panel align to the right.
- `dir="rtl"`: trigger and panel align to the left.
- panel text direction follows the current workspace language.
- do not flip internal message order manually unless needed.
- stage selector and labels should inherit current direction.

Preferred CSS approach:

- use logical properties where reliable:
  - `inset-block-end`
  - `inset-inline-end`
- override under RTL if the current layout requires explicit left/right:
  - `.workspaceRoot[dir="rtl"] .stageCopilotWidget`

## 5. Interaction Behavior

Closed state:

- only circular trigger is visible.
- trigger stays visible while scrolling.
- trigger does not cover primary workspace content more than necessary.

Open state:

- chat panel appears above the trigger.
- panel shows:
  - active stage
  - detected stage
  - manual stage selector
  - no-tools/no-actions/advisory-only boundary
  - local chat transcript
  - provider status/model/context details
- trigger may remain visible or panel header close button may be enough.

Do not add:

- action buttons
- apply/save-from-Copilot controls
- provider/model controls
- prompt compile/test controls
- record mutation controls
- conversation persistence

## 6. Files Likely Touched

Expected files:

- `apps/admin-web/app/workspace/workspace.module.css`
- optionally `apps/admin-web/app/workspace/_components/WorkspaceStageCopilotWidget.tsx` if trigger markup needs a shorter circular label
- optionally workspace i18n files if accessible label/tooltip text needs adjustment
- `scripts/prove-stage-copilot-workspace-widget.mjs` to add visual/source checks

No API, provider, persistence, prompts, Pass 5, Pass 6, or analysis files should be touched.

## 7. Proof Strategy

Future implementation proof should validate:

- widget trigger is circular or icon-only source/CSS pattern exists
- widget uses fixed positioning
- LTR placement is right side
- RTL placement is left side
- panel is fixed and viewport-bounded
- panel has internal scroll
- widget remains mounted through `WorkspaceShell`
- existing widget stage support still works
- Prompt Studio endpoint remains unchanged
- Sources / Context endpoint remains unchanged
- no tools/actions/write controls are introduced
- no provider/model selector is introduced
- no `@workflow/prompts` import is introduced
- no retrieval/RAG/vector behavior is introduced
- existing workspace pages still render

Suggested browser smoke:

- open `/workspace`
- verify trigger is visible before scrolling
- scroll down and verify trigger remains visible
- switch language to Arabic and verify side changes
- open panel and verify it stays in viewport
- switch stage manually
- send one Prompt Studio message
- send one Sources / Context message

## 8. Acceptance Criteria

Accept the polish when:

- widget trigger is compact and circular
- widget is always visible while scrolling
- LTR uses right-side placement
- RTL uses left-side placement
- panel opens without shifting page layout
- panel does not overflow viewport on desktop or narrow screens
- no Copilot behavior changes
- no API/provider/prompt/persistence/analysis changes
- proof and build pass

## 9. Final Recommendation

Implement this as a small UI/CSS-only slice before expanding additional Copilot stages.

Keep it strictly visual. The separate “Copilot as workspace manual/page-aware assistant” idea should be planned in a different document and should not be mixed into this polish slice.
