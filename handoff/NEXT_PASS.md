# Pass 2B — resolve RolloutState decision and complete missing closure/proof

## Goal
Close the two gaps that prevented Pass 2 from being accepted.
Do not widen product scope.

---

## Scope

### a) Resolve RolloutState after operator decision
Operator must choose before implementation begins:

**Option A — Enumerate values**
Operator provides the enumerated string values for `RolloutState` (spec §28.7).
Replace the branded placeholder in `contracts/src/types/states.ts` with a real
union, add the matching `const` object, and add `validateRolloutState` to the
contracts public surface.

**Option B — Explicitly defer**
Operator confirms that `RolloutState` values are intentionally unspecified.
Update the placeholder comment to record that decision. Move the item from
OPEN_QUESTIONS to DECISIONS_LOG as a formal deferral. No type change needed.

**Do not proceed until the operator states their choice.**

### b) Update contracts/core-state only as needed
If Option A is chosen: update `contracts` exports and add `validateRolloutState`.
If Option B is chosen: no contracts changes required.
No changes to core-state, persistence, core-case, or any other domain package.

### c) Complete the remaining closure/proof cleanly
Proof item #7 requires a validation error visible in the UI when `/cases/new`
is submitted with a missing required field. Provide one of:
- A screenshot of the rendered error message in the browser
- A `curl` response showing the API 400, paired with a read of the client
  component code confirming the error state is wired to the DOM (citing the
  exact JSX node)

No code changes are required unless the form error display is found to be broken.

### d) Do not widen product scope
No new routes, forms, API endpoints, domain logic, or package bodies.
No Pass 3 work.

---

## Required proof before Pass 2B is considered complete

1. `pnpm typecheck` — 0 errors
2. `RolloutState` placeholder disposed of: replaced with real union (Option A) or formally logged as deferred (Option B)
3. `isValidTransition("created","closed")` returns `false` (carry forward from Pass 2A)
4. `POST /api/cases` valid body → 201 + persisted case (carry forward)
5. `GET /api/cases` → returns that case (carry forward)
6. `/cases` page renders the created case (carry forward)
7. `/cases/new` with a missing required field → validation error text visible in the rendered UI (screenshot or DOM evidence)
