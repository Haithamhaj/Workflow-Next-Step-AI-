# Pass 6 — Synthesis + Evaluation + Initial Package

## Official pass sequence (do not rescope without operator approval)
- **Pass 6:** Synthesis + Evaluation + Initial Package
- **Pass 7:** Review / Issue Discussion

This file defines Pass 6 as a single cohesive pass covering all three areas. Any attempt to split synthesis out of Pass 6, or to pull review work forward into Pass 6, is an unapproved rescoping of the official sequence.

---

## Goal
Implement the three spec-defined bodies that turn a session's clarified workflow into a reviewable analytical artifact:

1. **Synthesis** (spec §19 — Synthesis Logic) — produce synthesis output from session material.
2. **Evaluation** (spec §20 — Workflow Evaluation Logic) — judge the synthesized workflow against the seven critical completeness conditions and the practical rubric axes, yielding a §20.11–20.14 outcome.
3. **Initial Package** (spec §21 — Initial Workflow Package) — assemble the first outward analytical package using the synthesis output and evaluation judgments.

All three are delivered in this one pass. Admin UI surfaces must exist for each so an operator can observe and act on them.

---

## Scope

### Synthesis (§19)

- `packages/synthesis-evaluation` body — synthesis half:
  - Synthesis record type + validator (contracts owns the schema and type)
  - Function(s) to construct synthesis output from session material, preserving §19.11 required fields
  - Difference-block representation per §19.5+ (temporary structured synthesis objects)
  - Common-path handling per §19.3/§19.4
  - Peer-level synthesis and enrichment behaviour per §19.6–§19.9, subject to governance confirmation (see Stop Conditions)
- `packages/contracts`:
  - `synthesis-record.schema.json` (Draft-07) + TypeScript type
  - `validateSynthesisRecord` exported from `src/index.ts`
- `packages/persistence`:
  - `SynthesisRecord` repository interface and `InMemorySynthesisRepository`
  - Extend `createInMemoryStore()`

### Evaluation (§20)

- `packages/synthesis-evaluation` body — evaluation half:
  - Five §20.4 rubric axes: **Workflow Completeness**, **Sequence Clarity**, **Decision / Exception Clarity**, **Ownership / Handoff Clarity**, **Documentation Strength**
  - Four §20.5 judgment states (per axis): **Strong**, **Partial**, **Weak**, **Blocking**
  - Seven §20.3 critical completeness conditions:
    1. continuity of the core workflow sequence
    2. clarity of how point A leads to point B and how point B leads to point C
    3. completeness of the conditions required to understand or execute a core step
    4. the decision rule or threshold needed for a core branch
    5. the handoff or responsibility needed for a core transition
    6. the control or approval logic required for a core step
    7. the boundary required to understand where the use case actually begins or ends
  - Four §20.11–20.14 derived outcomes: **Ready for Initial Package**, **Needs More Clarification**, **Finalizable with Review**, **Ready for Final Package**
  - Evaluation record type + validator (contracts-owned schema)
  - Classification helpers — must not invent rules beyond what §20 literally specifies
- `packages/contracts`: `evaluation-record.schema.json` + type + `validateEvaluationRecord`
- `packages/persistence`: `EvaluationRecord` repository + in-memory implementation + store factory extension

### Initial Package (§21)

- Initial package assembly body (either inside `packages/packages-output` or a sibling — no new top-level package without justification):
  - Mandatory sections (§21.3) — assembled from synthesis + evaluation inputs
  - Conditional section logic (§21.4)
  - Package-level status field logic (§21.5)
  - Seven-condition visibility rule (§21.8) — conditions are **not** surfaced as a checklist in the outward package (§21.8 is explicit); they remain part of the admin-only judgment layer (§21.11)
  - Analytical document layer (§21.6)
  - UI overview layer (§21.10)
  - Admin-only judgment layer (§21.11)
- `packages/contracts`: `initial-package.schema.json` (Draft-07) + type + validator
- `packages/persistence`: `InitialPackageRecord` repository + in-memory implementation + store factory extension

### Admin UI (`apps/admin-web`)

- Synthesis surface:
  - `app/api/synthesis/route.ts` + `app/api/synthesis/[id]/route.ts`
  - `app/synthesis/page.tsx`, `app/synthesis/new/page.tsx`, `app/synthesis/[id]/page.tsx`
- Evaluation surface:
  - `app/api/evaluations/route.ts` + `app/api/evaluations/[id]/route.ts`
  - `app/evaluations/page.tsx`, `app/evaluations/new/page.tsx`, `app/evaluations/[id]/page.tsx`
  - Outcome badge, axis table, seven-condition admin-only view (§21.11)
- Initial Package surface:
  - `app/api/initial-packages/route.ts` + `app/api/initial-packages/[id]/route.ts`
  - `app/initial-packages/page.tsx`, `app/initial-packages/new/page.tsx`, `app/initial-packages/[id]/page.tsx`
  - Outward view (no seven-condition checklist per §21.8) and admin-only judgment view (§21.11) clearly separated in the DOM
- All error panels keyed with `data-testid="validation-errors"`
- State/outcome panels keyed with a stable `data-testid` (e.g. `outcome-panel`, `package-status-panel`)

### Validate (branch-local proof)

- `pnpm typecheck` — 0 errors
- Synthesis, evaluation, and initial package records each round-trip through their API: 201 on valid, 400 on invalid (Ajv-derived text), 409 on duplicate, 404 on miss
- Each of the three list pages renders submitted records
- Each of the three `/new` pages shows DOM validation error on missing required field
- Each detail page shows the spec-mandated panels:
  - Synthesis detail shows §19.11 required fields
  - Evaluation detail shows axis table + seven-condition admin view + outcome
  - Initial Package detail shows outward sections (§21.3, §21.4, §21.5) **and** admin-only judgment layer (§21.11), clearly separated; seven-condition checklist absent from the outward portion (§21.8)

### Do not widen scope

- No Review / Issue Discussion work (that is Pass 7)
- No Final Package UI (§21.13 is explicit: Final Package UI is a later concern)
- No LLM invocation, no real database, no authentication

---

## Dependencies on prior passes

- Pass 1 (contracts scaffold) — complete on `main`
- Pass 2 (state families, core-state, persistence, core-case, case UI) — complete on `main`
- Pass 3 (sources-context + source UI) — complete on `main`
- Pass 4 (prompts package + prompt UI) — complete on `main`
- Pass 5 (sessions-clarification + session UI) — **pending merge to `main`** (branch `pass-5-sessions`). Pass 6 implementation begins once Pass 5 lands on `main`.

---

## Architecture constraints

- Business logic lives in domain packages, not `apps/admin-web`
- Contracts owns every shared type and schema; domain packages re-export, do not redefine
- `makeValidator<T>` for all payload validation
- `packages/synthesis-evaluation` must not import `core-case`, `sessions-clarification`, or `core-state`
- Package-assembly code must not import prompt-rendering code (prompts vs. state/output stay separated per CLAUDE.md)
- Spec-literal enum wording — no guessed synonyms, no reordering

---

## Required proof before Pass 6 is implemented-on-branch

1. `pnpm typecheck` — 0 errors
2. Synthesis API: 201 / 400 / 409 / 404 behaviors verified
3. Evaluation API: 201 / 400 / 409 / 404 behaviors verified
4. Initial Package API: 201 / 400 / 409 / 404 behaviors verified
5. `/synthesis/new`, `/evaluations/new`, `/initial-packages/new` — DOM proof of `data-testid="validation-errors"` on missing required field
6. `/synthesis/:id` — DOM proof of §19.11 required fields rendered
7. `/evaluations/:id` — DOM proof of axis table + seven-condition admin view + outcome badge
8. `/initial-packages/:id` — DOM proof that outward section renders §21.3/§21.4 sections AND admin-only judgment layer (§21.11) AND seven-condition checklist is **absent** from the outward portion (§21.8)
9. Handoff updated: `CURRENT_STATE.md`, `DECISIONS_LOG.md`, `OPEN_QUESTIONS.md`
10. Work committed to a Pass 6 review branch and pushed to origin
11. Pass 6 is accepted only once the review branch is merged into `main`

---

## Stop conditions (invention-risk gates)

Before touching code in each area, confirm the governance is specified. If any of the following cannot be resolved from the locked reference documents by literal reading, record it as a narrow, concrete entry in `handoff/OPEN_QUESTIONS.md` and surface it to the operator **before** implementing the affected area. Do not invent:

- **Difference-block field structure (§19.5+)** — spec calls them "temporary structured synthesis objects" and describes purpose, but the exact persisted field shape may need operator confirmation at implementation time.
- **Common-path support threshold (§19.3/§19.4)** — "sufficiently supported" is qualitative; if a boolean/threshold is needed in the schema, ask.
- **Peer-level enrichment rules (§19.6–§19.9)** — hierarchy of enrichment sources is described but the exact trigger ordering in code may need confirmation.
- **Axis-and-condition → outcome derivation (§20.10)** — spec describes a hybrid outcome philosophy, not a deterministic rule. Pass 6 must either (a) require the operator to supply the outcome explicitly, or (b) implement a rule only if §20.10 or an adjacent locked section states one literally.
- **§21.4 conditional section triggers** — if the conditions for including/excluding a section are not literal, ask.

These gates are part of Pass 6, not grounds to split Pass 6 into smaller passes.

---

## Out of scope for Pass 6 (belongs to Pass 7 or later)

- Review / Issue Discussion surface (Pass 7)
- Final Package UI (§21.13 — later)
- Release decisions (§28.15 state family exists but release flow is later)
- LLM transport, real database, authentication, CI — unchanged from prior passes
