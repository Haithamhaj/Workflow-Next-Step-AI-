# Pass 7 — Review / Issue Discussion

## Official pass sequence (do not rescope without operator approval)
- **Pass 6:** Synthesis + Evaluation + Initial Package — **implemented on branch `pass-6-synthesis-evaluation`, pending merge to `main`**
- **Pass 7:** Review / Issue Discussion — this pass
- **Pass 8+:** Final Package, Release, and later flows — not in scope

---

## Goal
Implement the Review / Issue Discussion layer that sits between an initial package (§21) and a final package (§21.13 — not in this pass). This is the spec §22 surface plus the §28.13 `ReviewState` lifecycle: the operator opens a review on an existing initial package, records issues / discussion points against it, transitions the review through its state family, and produces a structured artifact that a later pass (Final Package) will consume.

All work is on a new review branch branched from `main` **after Pass 6 is merged**. Do not start Pass 7 until Pass 6 lands on `main`.

---

## Scope

### Review lifecycle (§22 + §28.13)

- `packages/review` (new domain package — no sibling rename, no dumping into an existing package):
  - `ReviewRecord` type + validator (contracts-owned schema)
  - Functions to open a review against an `initialPackageId`, record issues, transition review states per §28.13
  - Strict forward-only transitions unless §28.13 literally permits back-transitions
  - Must not import `synthesis-evaluation`, `packages-output`, `core-state`, `core-case`, or `sessions-clarification` — operate on contracts types only
- `packages/contracts`:
  - `review-record.schema.json` (Draft-07) + TypeScript type + `validateReviewRecord`
  - Promote `ReviewState` from the existing Pass 2A real union (already enumerated in `packages/contracts/src/types/states.ts` — reuse, do not redefine)
- `packages/persistence`:
  - `StoredReviewRecord` entity extending `ReviewRecord` with `createdAt` and any review-specific timestamps the spec requires
  - `ReviewRepository` interface: `save`, `findById`, `findByInitialPackageId`, `findAll`
  - `InMemoryReviewRepository` implementation
  - Extend `createInMemoryStore()` to include the review repo

### Issue / discussion items (§22 body)

- `ReviewIssue` (or whatever §22 literally names these units) as a nested structure inside the review record, with the exact fields §22 specifies
- Do **not** invent fields. If §22 underspecifies issue shape, record a narrow OQ and surface it before writing the schema.
- Issue severity / status fields follow §22 literal wording only

### Admin UI (`apps/admin-web`)

- Review surface:
  - `app/api/reviews/route.ts` + `app/api/reviews/[id]/route.ts`
  - `app/reviews/page.tsx`, `app/reviews/new/page.tsx`, `app/reviews/[id]/page.tsx`
  - Review detail shows: source initial package link, review state badge, issue list, operator action for state transition
  - Validation error panel keyed `data-testid="validation-errors"`
  - State panel keyed `data-testid="review-state-panel"` with `data-testid="review-state-badge"`
  - Issue list keyed `data-testid="review-issue-list"`

### Validate (branch-local proof)

- `pnpm typecheck` — 0 errors
- Review API: 201 on valid, 400 on invalid (Ajv-derived text), 409 on duplicate, 404 on miss
- `/reviews/new` — DOM proof of `validation-errors` on missing required field
- `/reviews/:id` — DOM proof of state badge, issue list, initial-package back-link
- State-transition endpoint (or form submission) demonstrates both legal and illegal transitions: legal advances state, illegal returns 400 with transition-rule error

### Do not widen scope

- No Final Package UI (§21.13 — later pass)
- No Release flow (§28.15 — later pass)
- No LLM invocation, no real database, no authentication
- No refactors of Pass 6 artifacts unless a genuine contracts-level defect is found; if so, patch narrowly and record in DECISIONS_LOG.md

---

## Dependencies on prior passes

- Pass 1 (contracts scaffold) — accepted on `main`
- Pass 2 (state families, core-state, persistence, core-case, case UI) — accepted on `main` (RolloutState formally deferred)
- Pass 3 (sources-context + source UI) — accepted on `main`
- Pass 4 (prompts + prompt UI) — accepted on `main`
- Pass 5 (sessions-clarification + session UI) — accepted on `main`
- Pass 6 (synthesis + evaluation + initial package) — **pending merge to `main`** from `pass-6-synthesis-evaluation`

Pass 7 implementation begins **after Pass 6 merges**.

---

## Architecture constraints

- Business logic lives in the new `packages/review`, never in `apps/admin-web`
- Contracts owns the review schema and type; `packages/review` re-exports
- `makeValidator<T>` for all payload validation
- `packages/review` does not import other domain packages (operate on contracts types only)
- Spec-literal enum wording for issue status / severity / review-state values — no guessed synonyms, no reordering

---

## Required proof before Pass 7 is implemented-on-branch

1. `pnpm typecheck` — 0 errors
2. Review API: 201 / 400 / 409 / 404 behaviors verified
3. State transition enforcement verified: at least one legal transition succeeds; at least one illegal transition returns 400
4. `/reviews/new` — DOM proof of `validation-errors`
5. `/reviews/:id` — DOM proof of state badge, issue list, initial-package back-link
6. Handoff updated: `CURRENT_STATE.md`, `DECISIONS_LOG.md`, `OPEN_QUESTIONS.md`
7. Work committed to a Pass 7 review branch and pushed to origin
8. Pass 7 is accepted only once the review branch is merged into `main`

---

## Stop conditions (invention-risk gates)

Before touching code, confirm the governance is specified. If any of the following cannot be resolved from the locked reference documents by literal reading, record it as a narrow, concrete entry in `handoff/OPEN_QUESTIONS.md` and surface it to the operator **before** implementing the affected area. Do not invent:

- **Review issue schema (§22)** — if §22 does not literally specify issue fields (id, title, severity, status, origin, resolution), ask before inventing them.
- **§28.13 back-transitions** — if a review state appears only on the right-hand side of the §28.13 transition table, treat it as terminal unless the spec literally permits a back-edge. Open an OQ if ambiguous.
- **Relationship to synthesis re-run (§22 + §19)** — if a review that rejects an initial package is supposed to trigger a new synthesis round, that trigger logic is spec-governance and must be literally read, not invented.
- **Review-to-final-package promotion rule** — Pass 7 must not implement promotion to final package (that is Pass 8+). But the review record must expose a field the later pass can read. If the spec does not literally specify a "ready for final package" flag on the review, ask.

---

## Out of scope for Pass 7 (belongs to later passes)

- Final Package assembly / UI (§21.13)
- Release state transitions (§28.15 ReleaseState flow)
- LLM transport, real database, authentication, CI — unchanged from prior passes
- Any edit to Pass 6 artifacts beyond narrow defect patches
