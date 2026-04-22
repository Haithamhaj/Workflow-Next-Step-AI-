# Current State

**Accepted baseline on `main`: Pass 6 (Synthesis + Evaluation + Initial Package), current `origin/main` commit `fb1168f`. Pass 7 is implemented on branch `codex/pass-7-review-issue-discussion` and is ready for review, not accepted.**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20 engine constraint
- TypeScript 5.4.5, ESM (`"type": "module"` everywhere), composite builds with project references
- `tsconfig.base.json`: strict, `noUncheckedIndexedAccess`, `resolveJsonModule`, Bundler resolution
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`

### `packages/contracts` (complete through Pass 7 on branch)
- Prior Pass 6 schemas/types unchanged
- New Pass 7 schema: `src/schemas/review-issue-record.schema.json`
  - Required: `issueId`, `caseId`, `initialPackageId`, `evaluationId`, `reviewState`, `issueBrief`, `discussionThread`, `linkedEvidence`, `actionHistory`
  - Optional: `synthesisId`, `releaseApprovalRecord`
  - `issueBrief` mirrors the literal §25.4 minimum fields
  - `discussionThread` contains `scopeBoundary`, ordered `entries[]`, optional `closureSummary`
  - `actionHistory[]` uses the exact controlled action set from §25.10
- New Pass 7 types: `src/types/review-issues.ts`
  - `IssueBrief`
  - `IssueDiscussionEntry`
  - `IssueDiscussionThread`
  - `IssueEvidenceLink`
  - `ReviewAction`
  - `ReleaseApprovalRecord`
  - `ReviewIssueRecord`
- `src/index.ts` exports `validateReviewIssueRecord`

### `packages/core-state` (extended through Pass 7 on branch)
- Prior Pass 2A `CaseStateTransitions` unchanged
- New `ReviewStateTransitions` per §28.14:
  - `no_review_needed -> review_required`
  - `review_required -> issue_discussion_active | action_taken | review_resolved`
  - `issue_discussion_active -> action_taken | review_resolved`
  - `action_taken -> review_resolved`
- New `isValidReviewTransition(from, to)`

### `packages/persistence` (extended through Pass 7 on branch)
- Prior Pass 6 entities/repositories unchanged
- New `StoredReviewIssueRecord` extends `ReviewIssueRecord` with `createdAt`, `updatedAt`
- New `ReviewIssueRepository`:
  - `save`
  - `findById`
  - `findByCaseId`
  - `findByInitialPackageId`
  - `findAll`
- New `InMemoryReviewIssueRepository`
- `createInMemoryStore()` now includes `reviewIssues`

### `packages/review-issues` (implemented Pass 7 on branch)
- Re-exports Pass 7 seam contracts from `@workflow/contracts`
- Re-exports `StoredReviewIssueRecord` / `ReviewIssueRepository` from persistence
- `createReviewIssue(payload, repo)` — validates via `validateReviewIssueRecord`, rejects duplicate IDs, stamps `createdAt` / `updatedAt`
- `getReviewIssue`, `listReviewIssues`, `listReviewIssuesByInitialPackageId`
- `transitionReviewIssue(issueId, toState, repo)` — validates via `isValidReviewTransition`
- `addDiscussionEntry(issueId, { entryId, authorType, message }, repo)` — appends a stamped discussion entry and preserves scoped discussion behavior
- `applyReviewAction(issueId, { actionId, actionType, actor, note }, repo)` — persists the exact §25.10 action and performs the mandatory resulting review-state update to `action_taken`
- Dependencies: `@workflow/contracts`, `@workflow/core-state`, `@workflow/persistence`

### `packages/synthesis-evaluation`, `packages/packages-output`, `packages/core-case`, `packages/sources-context`, `packages/prompts`, `packages/sessions-clarification`
- Pass 6 and earlier behavior unchanged

### `apps/admin-web` (extended through Pass 7 on branch)
- Prior Pass 6 surfaces unchanged
- `app/api/issues/route.ts`
  - `GET /api/issues`
  - `POST /api/issues`
- `app/api/issues/[id]/route.ts`
  - `GET /api/issues/:id`
- `app/api/issues/[id]/discussion/route.ts`
  - `POST /api/issues/:id/discussion`
- `app/api/issues/[id]/actions/route.ts`
  - `POST /api/issues/:id/actions`
- `app/api/issues/[id]/transition/route.ts`
  - `POST /api/issues/:id/transition`
- `app/issues/page.tsx`
  - issue list table with `data-testid="review-issue-list"`
- `app/issues/new/page.tsx`
  - issue creation form with §25.4 fields, discussion scope boundary, linked evidence input
  - renders `data-testid="validation-errors"` on API 400
- `app/issues/[id]/page.tsx`
  - issue detail page with initial-package/evaluation/synthesis back-links
- `app/issues/[id]/IssueDetailClient.tsx`
  - `data-testid="review-state-panel"`
  - `data-testid="review-state-badge"`
  - issue brief view
  - linked evidence view
  - discussion surface
  - action controls using the exact §25.10 set
  - explicit review-state transition form
  - action history
- `apps/admin-web/package.json` and `next.config.mjs` include `@workflow/review-issues`
- `apps/admin-web/tsconfig.json` references `../../packages/review-issues`

### Remaining placeholder packages
- `packages/domain-support`
- `packages/shared-utils`

---

## What is proven (Pass 7 — branch `codex/pass-7-review-issue-discussion`)

| Check | Result |
|---|---|
| `pnpm build:contracts` | succeeds |
| `pnpm typecheck` | 0 errors across all 14 workspace projects |
| `pnpm build` | succeeds, including `next build` for `apps/admin-web` |
| `POST /api/issues` empty body | HTTP 400 with Ajv-derived required-field list |
| `POST /api/issues` valid payload | HTTP 201 with `StoredReviewIssueRecord` |
| `POST /api/issues` duplicate ID | HTTP 409 |
| `GET /api/issues/does-not-exist` | HTTP 404 |
| `POST /api/issues/:id/transition` legal | HTTP 200 (`review_required -> issue_discussion_active`) |
| `POST /api/issues/:id/transition` illegal | HTTP 400 transition-rule error |
| `POST /api/issues/:id/discussion` during active discussion | HTTP 200 and persisted entry in `discussionThread.entries[]` |
| `POST /api/issues/:id/actions` | HTTP 200 and persisted `actionHistory[]` entry with resulting `reviewState: "action_taken"` |
| `/issues` | rendered HTML contains `data-testid="review-issue-list"` and seeded issue rows |
| `/issues/:id` | rendered HTML contains `review-state-panel`, `review-state-badge`, initial-package back-link, discussion surface, linked evidence, and action controls |
| `/issues/new` | rendered HTML contains the new issue form, scope boundary input, and linked evidence input; validation panel is wired in client code via `data-testid="validation-errors"` and proven through API 400 behavior |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec. Formally deferred by operator. | 2026-04-21 |
| OQ-003 | Session terminal-state looping. Operator confirmation required. | 2026-04-22 |
| OQ-004 | §19.6–§19.9 peer-level enrichment trigger ordering not literal in spec. | 2026-04-22 |
| OQ-005 | §21.4 conditional-section inclusion triggers not literal. | 2026-04-22 |

Pass 7 introduced no new blocking governance questions.

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `packages/contracts/src/types/states.ts` | Indefinite — formal deferral |
| Automated synthesis enrichment (§19.6–§19.9) | `packages/synthesis-evaluation/` | Deferred pending OQ-004 |
| §20.10 outcome derivation | `packages/synthesis-evaluation/` | Intentionally not implemented — outcome remains operator-supplied |
| §21.4 conditional-section automation | `packages/packages-output/` | Deferred pending OQ-005 |
| `packages/domain-support` body | `packages/domain-support/src/index.ts` | Later pass |
| `packages/shared-utils` body | `packages/shared-utils/src/index.ts` | Later pass |

---

## What has NOT been built

- Final Package assembly / UI
- Release decision flow beyond the seam object
- Real database persistence
- Authentication / authorization
- Python sidecar
- CI / automated tests
