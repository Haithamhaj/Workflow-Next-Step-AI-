# Pass 6 — Workflow Evaluation (§20) + Evaluation UI

## Goal
Implement the evaluation surface per spec §20 (Workflow Evaluation Logic). Each case produces an `EvaluationRecord` that holds:
- the five §20.4 rubric axes, each carrying one §20.5 judgment state
- the seven §20.3 critical completeness conditions, each carrying a satisfied/unsatisfied marker + an optional note
- a derived §20.11–20.14 outcome

The admin UI must let operators create, view, and inspect evaluation records attached to a case.

Synthesis (§19, difference blocks, common path, peer-level synthesis) is **explicitly out of scope** for Pass 6 and lands in Pass 7. Evaluation is the narrower, fully-enumerated slice and is implemented first.

---

## Scope

### Build — `packages/contracts`
- `src/schemas/evaluation-record.schema.json` — JSON Schema Draft-07
  - Required: `evaluationId`, `caseId`, `axisJudgments`, `completenessConditions`, `outcome`
  - `axisJudgments`: object keyed by the five §20.4 axes, each valued by one §20.5 state
  - `completenessConditions`: array of 7 entries keyed by §20.3 condition ordinal (1–7), each with `satisfied: boolean` and optional `note: string`
  - `outcome`: one of the four §20.11–20.14 enum strings
- `src/types/evaluation-record.ts`:
  - `JudgmentState` — enum of exactly `strong`, `partial`, `weak`, `blocking` (§20.5)
  - `RubricAxis` — enum of exactly `workflow_completeness`, `sequence_clarity`, `decision_exception_clarity`, `ownership_handoff_clarity`, `documentation_strength` (§20.4)
  - `EvaluationOutcome` — enum of exactly `ready_for_initial_package`, `needs_more_clarification`, `finalizable_with_review`, `ready_for_final_package` (§20.11–20.14)
  - `CompletenessConditionId` — numeric literal union `1 | 2 | 3 | 4 | 5 | 6 | 7`
  - `EvaluationRecord` type
- `src/index.ts` — export `validateEvaluationRecord` via `makeValidator<EvaluationRecord>`
- String enum values derived **literally** from the spec wording — no invention

### Build — `packages/persistence`
- `EvaluationRecord` re-export from contracts (no type redefinition)
- `EvaluationRepository` interface: `save`, `findById`, `findByCaseId`, `findAll`
- `InMemoryEvaluationRepository` (Map-based, keyed by `evaluationId`)
- Extend `createInMemoryStore()` to include `evaluations: EvaluationRepository`

### Build — `packages/synthesis-evaluation` body
(The package is named `synthesis-evaluation` but Pass 6 fills only the evaluation half. Synthesis helpers remain skeleton for Pass 7.)
- `createEvaluation(payload, repo)` — validates via `validateEvaluationRecord`, rejects duplicate IDs, returns `EvaluationOutcome` result
- `getEvaluation(evaluationId, repo)` — lookup by ID
- `listEvaluations(repo)`
- `listEvaluationsByCaseId(caseId, repo)`
- `isBlockingAxis(state: JudgmentState)` predicate — true for `blocking`
- `conditionIsSatisfied(record, id: CompletenessConditionId)` predicate
- Re-exports: `JudgmentState`, `RubricAxis`, `EvaluationOutcome`, `CompletenessConditionId`, `EvaluationRecord`, `EvaluationRepository`
- Architecture constraints:
  - does NOT import from `packages/core-case`, `packages/sessions-clarification`, or `packages/core-state`
  - does NOT compute the outcome itself — the `outcome` field is supplied by the caller. Pass 6 is a persistence + classification surface, not a scoring engine. If an operator later requests automated outcome derivation, it is a Pass 7+ concern and must be scoped separately. **Stop condition:** do not invent a rule that maps axis states + condition marks to outcomes unless the spec explicitly states one. §20.3/§20.10 describe *philosophy* ("seven conditions govern final outcome interpretation") but do not specify a deterministic mapping.

### Build — `apps/admin-web`
- `app/api/evaluations/route.ts` — `GET /api/evaluations` + `POST /api/evaluations`
- `app/api/evaluations/[id]/route.ts` — `GET /api/evaluations/:id` (404 on miss)
- `app/evaluations/page.tsx` — list server component; columns include Evaluation ID, Case ID, Outcome (badge), Blocking count (# axes at `blocking`)
- `app/evaluations/new/page.tsx` — client component; form with the 5 axis dropdowns, 7 condition checkbox+note rows, and outcome dropdown; `data-testid="validation-errors"` error panel
- `app/evaluations/[id]/page.tsx` — server component; visually distinct panel (`data-testid="outcome-panel"`) showing outcome + §20.11–20.14 header; axis table; seven-condition table with §20.3 labels
- `app/evaluations/OutcomeBadge.tsx` — color-mapped badge for all 4 outcomes
- `next.config.mjs` — `transpilePackages` already includes `@workflow/synthesis-evaluation`

### Validate
- `pnpm typecheck` — 0 errors
- `POST /api/evaluations` missing required field → HTTP 400 with Ajv error text
- `POST /api/evaluations` valid body → HTTP 201 + persisted `EvaluationRecord`
- `POST /api/evaluations` duplicate `evaluationId` → HTTP 409
- `GET /api/evaluations` → returns persisted list
- `GET /api/evaluations/:id` → returns record; 404 on miss
- `/evaluations` list page renders the record with an outcome badge and blocking-count column
- `/evaluations/new` with missing required field → validation error visible in rendered DOM (`data-testid="validation-errors"`)
- `/evaluations/:id` detail page renders the outcome panel with §20.11–20.14 header, axis table, and all seven §20.3 conditions

### Do not widen scope
- No synthesis logic (§19) — difference blocks, common-path detection, peer-level synthesis all land in Pass 7
- No automatic outcome derivation — operator supplies the outcome
- No seven-condition visibility propagation into the Initial Package (§21.8) — that is a Pass 7+ concern once package assembly exists
- No LLM invocation
- No real database
- No authentication

---

## Dependencies on prior passes
- Pass 1 (contracts scaffold) — complete
- Pass 2 (state families, core-state, persistence, core-case, case UI) — complete
- Pass 3 (sources-context) — complete
- Pass 4 (prompts package + UI) — complete
- Pass 5 (sessions-clarification + session UI) — complete

Evaluation records reference `caseId` (not `sessionId`) because §20 frames evaluation at the case level. If the operator later wants session-level evaluation surfaces, that is a future pass — do not add a `sessionId` field speculatively.

---

## Architecture constraints
- Business logic belongs in `packages/synthesis-evaluation`, not in `apps/admin-web`
- All evaluation types and schemas live in `packages/contracts`; `synthesis-evaluation` re-exports, does not redefine
- `makeValidator<T>` for all payload validation
- `packages/synthesis-evaluation` must not import from `core-case`, `sessions-clarification`, or `core-state`
- Enum values must match spec wording literally — if wording is ambiguous, record the question in `handoff/OPEN_QUESTIONS.md` and stop

---

## Required proof before Pass 6 is accepted

1. `pnpm typecheck` — 0 errors across all packages
2. `POST /api/evaluations` missing field → 400 with validator-derived error text
3. `POST /api/evaluations` valid body → 201 + persisted record retrievable via `GET /api/evaluations/:id`
4. `POST /api/evaluations` duplicate ID → 409
5. `/evaluations` list page renders submitted record with outcome badge and blocking-count column
6. `/evaluations/new` missing-field submit → validation error DOM proof (`data-testid="validation-errors"`)
7. `/evaluations/:id` detail page DOM proof: outcome panel + axis table + seven-condition table all present
8. Handoff updated: `CURRENT_STATE.md`, `DECISIONS_LOG.md`, `OPEN_QUESTIONS.md` reflect Pass 6 outcome
9. Commit pushed to `origin`

---

## Stop conditions

- If the mapping from axis judgments + seven-condition marks to an outcome is not explicitly specified in the locked reference documents, **do not invent one**. Pass 6 requires the operator to supply the outcome. Record the absence as an open question if automated derivation is requested.
- If any §20.3, §20.4, §20.5, or §20.11–20.14 enum value wording is ambiguous (e.g. hyphenation, case, plural form), record the question in `handoff/OPEN_QUESTIONS.md` before picking a canonical string.
- Synthesis (§19) governance — difference-block shape, common-path detection threshold, peer-level enrichment rules — is **Pass 7** scope. Do not pull it into Pass 6 even if refactoring makes it tempting.
