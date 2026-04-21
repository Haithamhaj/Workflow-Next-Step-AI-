# Pass 2B — Definition

## Goal
Close the two gaps that prevented Pass 2 from being accepted:
1. Resolve `RolloutState` (operator must supply values or explicitly defer the type)
2. Produce clean proof for all 7 Pass 2 proof items, including browser-visible validation error in `/cases/new`

Do not widen product scope. Do not start Pass 3 work.

---

## Scope

### 1. RolloutState — resolve after operator decision
Two acceptable outcomes; operator chooses one before implementation begins:

**Option A — Enumerate values**
If the operator provides the enumerated string values for `RolloutState` (per spec §28.7),
replace the branded placeholder in `contracts/src/types/states.ts` with a real union,
add the matching `const` object, and add `validateRolloutState` to the contracts public surface.
No other changes needed.

**Option B — Explicitly defer**
If the operator confirms that `RolloutState` values are intentionally not specified at this time,
update the placeholder comment to record that decision and move the item from OPEN_QUESTIONS
to DECISIONS_LOG as a formal deferral. No type change needed.

**Do not proceed with either option until the operator states their choice.**

### 2. Complete the remaining proof
Proof item #7 requires that a validation error be **visible in the UI** when `/cases/new` is
submitted with a missing required field. The Pass 2A session only showed the API-level 400
response. For Pass 2B, provide one of:
- A screenshot of the rendered error message in the browser
- A `curl` response showing the API 400, paired with a read of the client component code
  confirming the error state is wired to the DOM (citing the exact JSX node)

No code changes are required for item #7 unless the form error display is found to be broken.

### 3. No other changes
- Do not modify any domain package beyond what option A or B above requires
- Do not add any new routes, forms, or API endpoints
- Do not start Pass 3 source intake work

---

## Explicitly out of scope for Pass 2B

- Source intake UI or API (Pass 3)
- Any new product feature
- Rollout state business logic (even if option A is chosen; values only, no logic)
- Real database
- Session logic, prompts, LLM, synthesis, review, release

---

## Required proof before Pass 2B is considered complete (and Pass 2 accepted)

1. `pnpm typecheck` — 0 errors
2. All 5 placeholder types disposed of: either replaced with real unions (option A) or formally logged as deferred decisions (option B) — no branded placeholder may remain without an explicit operator-approved decision record
3. `isValidTransition` returns `false` for at least one illegal transition (carry forward from Pass 2A — already proven; re-confirm output)
4. `POST /api/cases` valid body → 201 + persisted case (carry forward)
5. `GET /api/cases` → returns that case (carry forward)
6. `/cases` page renders the created case (carry forward)
7. `/cases/new` with a missing required field → **validation error text is visible in the rendered UI** (screenshot or DOM evidence citing the JSX error node)
