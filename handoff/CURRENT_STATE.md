# Current State

**Accepted baseline: Pass 9 (Package Preview + Release Decision Surface), merged to `main` 2026-04-23, commit `41a8232`.**

Prior accepted baseline on `main`: Pass 8 (Final Package + Release), commit `3171ad4`.

---

## Official pass sequence

- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — accepted on `main` (2026-04-22), commit `a8f3523`
- **Pass 8:** Final Package + Release — accepted on `main` (2026-04-22), commit `3171ad4`
- **Pass 9:** Package Preview + Release Decision Surface — **accepted on `main` (2026-04-23), commit `41a8232`**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20 engine constraint
- TypeScript 5.4.5, ESM (`"type": "module"` everywhere), composite builds with project references
- `tsconfig.base.json`: strict, `noUncheckedIndexedAccess`, `resolveJsonModule`, Bundler resolution
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`

### `packages/contracts` (extended Pass 8)
- All prior passes' schemas/types unchanged
- New Pass 8 schema: `src/schemas/final-package-record.schema.json`
  - `additionalProperties: false` at top level and on `gapLayer`
  - Required top-level: `packageId`, `caseId`, `packageType`, `packageState`, `packageReleaseState`, `packageGeneratedAt`, `finalizationBasis`, `adminApprovalStatus`, `finalWorkflowReality`, `finalSourceOrReferenceOutput`, `finalGapAnalysis`, `improvementTargetsOrFinalRecommendations`, `uiOverviewLayer`, `outputDirection`, `gapLayer`
  - Optional: `improvedOrTargetStateWorkflow`, `initialPackageId`, `evaluationId`
  - `gapLayer`: `closedItems[]`, `nonBlockingRemainingItems[]`, `laterReviewItems[]`
- New Pass 8 types: `src/types/final-package.ts`
  - `AdminApprovalStatus` const enum: `not_approved | approved` (§25.16 — kept separate from `packageReleaseState`)
  - `OutputDirection` const enum: four values (§29.8.4)
  - `FinalPackageGapLayer` interface (§29.8.5)
  - `FinalPackageRecord` interface (§29.8.1–§29.8.5)
- `src/index.ts` exports `validateFinalPackageRecord`, `AdminApprovalStatus`, `OutputDirection`, `FinalPackageGapLayer`, `FinalPackageRecord`

### `packages/core-state` (extended Pass 8)
- All prior pass transitions unchanged
- New `ReleaseStateTransitions` (§28.16): linear `not_releasable → pending_admin_approval → approved_for_release → released`, `pending_admin_approval` cannot be skipped
- New `isValidReleaseTransition(from: ReleaseState, to: ReleaseState): boolean`

### `packages/persistence` (extended Pass 8)
- All prior pass entities/repositories unchanged
- New `StoredFinalPackageRecord extends FinalPackageRecord` with `createdAt`, `updatedAt`
- New `FinalPackageRepository`: `save`, `findById`, `findByCaseId`, `findAll`
- New `InMemoryFinalPackageRepository` (deep-copies `gapLayer` arrays on `save`)
- `createInMemoryStore()` now includes `finalPackages`

### `packages/packages-output` (extended Pass 8)
- Re-exports `AdminApprovalStatus`, `OutputDirection`, `FinalPackageRecord`, `FinalPackageGapLayer` from `@workflow/contracts`
- Re-exports `StoredFinalPackageRecord`, `FinalPackageRepository` from `@workflow/persistence`
- `FinalPackageOk`, `FinalPackageError`, `FinalPackageResult` types
- `createFinalPackage(payload, repo)` — validates with `validateFinalPackageRecord`, rejects duplicates, stamps `createdAt`/`updatedAt`
- `getFinalPackage(packageId, repo)`
- `listFinalPackages(repo)`
- `listFinalPackagesByCaseId(caseId, repo)`
- `updateFinalPackage(packageId, updates, repo)` — strips `createdAt`/`updatedAt` before re-validation (avoids `additionalProperties` rejection), re-validates, updates `updatedAt`

### `apps/admin-web` (extended Pass 8)
- All prior pass surfaces unchanged
- New API routes:
  - `app/api/final-packages/route.ts`: `GET /api/final-packages`, `POST /api/final-packages`
  - `app/api/final-packages/[id]/route.ts`: `GET /api/final-packages/:id`
  - `app/api/final-packages/[id]/release/route.ts`: `POST /api/final-packages/:id/release` — validates `toState`, enforces `isValidReleaseTransition`, returns 400 with §28.16 citation on invalid transition
- New UI pages:
  - `app/final-packages/page.tsx` — list table with `data-testid="final-package-list"`
  - `app/final-packages/new/page.tsx` — creation form (all §29.8 required fields; gap layer one-per-line textareas; checkbox for admin approval; `packageType` hardcoded)
  - `app/final-packages/[id]/page.tsx` — detail server component (metadata, §24.13 structural separation section, §29.8.2 content sections, §29.8.5 gap layer)
  - `app/final-packages/[id]/FinalPackageDetailClient.tsx` — `data-testid="release-state-panel"` with linear next-state buttons and §28.16 note; `data-testid="admin-approval-panel"` read-only with §25.16 note; packageState display; outputDirection display
- `components/Nav.tsx` — added `{ href: "/final-packages", label: "Final packages" }` after `/issues`

### `apps/admin-web` (extended Pass 9 — Package Preview + Release Decision Surface)

Pass 9 is the main client-facing delivery surface of the product. It is a presentation-layer pass over accepted Pass 8 package logic. No new mechanics were introduced.

- **Global shell correction:** `layout.tsx` title/description and `Nav.tsx` heading changed from "Workflow Admin" / "admin shell" to "Workflow" on all pages
- **Package surface library:** `lib/package-surface.ts` — `dedupedTitle()`, `buildPackageListItem()`, `buildPackageDetail()` for list/detail generation; `adminReleaseHref` set to `undefined` (no admin release link on client surface)
- **API aggregation routes:**
  - `app/api/packages/route.ts`: `GET /api/packages` — aggregates initial + final packages into unified list
  - `app/api/packages/[id]/route.ts`: `GET /api/packages/:id` — resolves single package by ID
- **Package list page:** `app/packages/page.tsx` — product-context-strip with domain/department badges, package-summary-row cards, no admin-centric links
- **Package detail page:** `app/packages/[id]/page.tsx` — product-context-strip with domain/department/subDepartment/caseId, overview + workflow tabs
- **Package client view:** `app/packages/[id]/PackageClientView.tsx` — tabs (preview/workflow/comparison/status), "Export package" link, no admin release controls
- **Package download:** `app/packages/[id]/download/route.ts` — JSON download surface
- **CSS:** `globals.css` — package surface classes: `.product-context-strip`, `.package-summary-row`, `.package-overview-card`, `.package-copy-grid`, `.workflow-visual-stack`, `.package-pill`, responsive breakpoints

### Remaining placeholder packages
- `packages/domain-support`
- `packages/shared-utils`

---

## What is proven (Pass 9 — committed 2026-04-23, `41a8232`)

Pass 8 proofs remain valid (see Pass 8 proof table in git history). Pass 9 additional proofs:

| Check | Result |
|---|---|
| `pnpm build:contracts` | succeeds |
| `pnpm typecheck` | 0 errors across all workspace projects |
| `pnpm build` | succeeds |
| `curl /packages` | Renders package list with `<title>Workflow</title>`, `<h1>Workflow</h1>`, `product-context-strip`, `package-summary-row` — zero banned strings |
| `curl /packages/:id` | Renders package detail with product-context-strip, "Export package", package overview — zero banned strings |
| No "Workflow Admin" or "admin shell" wording on any page | Confirmed via curl + rg |
| No new routes beyond surface routes listed above | Confirmed via `git diff --name-only` |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec. Formally deferred by operator. | 2026-04-21 |
| OQ-003 | Session terminal-state looping. Operator confirmation required. | 2026-04-22 |
| OQ-004 | §19.6–§19.9 peer-level enrichment trigger ordering not literal in spec. | 2026-04-22 |
| OQ-005 | §21.4 conditional-section inclusion triggers not literal. | 2026-04-22 |

Pass 8 introduced no new blocking governance questions.

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

## Output formalization direction (adopted 2026-04-22)

Output formalization for client-facing wording, document naming, section-label normalization, and enterprise-safe final deliverable presentation has been adopted as a non-governing enhancement direction. This does not alter mechanics, state logic, package eligibility, review/release gates, or governance contracts. Prompt reinforcement (rewriting or rebuilding prompt-chain logic) is deferred and belongs to a separate later prompt-rebuild/analysis-improvement track.

Pass 9 delivered the main client-facing delivery surface of the product. It is a presentation-layer pass built on accepted Pass 8 package logic and introduced no new mechanics.

## What has NOT been built

- Real database persistence
- Authentication / authorization
- Python sidecar
- CI / automated tests
