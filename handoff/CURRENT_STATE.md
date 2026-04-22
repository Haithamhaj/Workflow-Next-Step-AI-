# Current State

**Accepted baseline: Pass 8 (Final Package + Release), merged to `main` 2026-04-22, commit `3171ad4`.**

Prior accepted baseline on `main`: Pass 7 (Review / Issue Discussion), commit `a8f3523`.

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

### Remaining placeholder packages
- `packages/domain-support`
- `packages/shared-utils`

---

## What is proven (Pass 8 — committed 2026-04-22, `e2c3c58`)

| Check | Result |
|---|---|
| `pnpm build:contracts` | succeeds |
| `pnpm typecheck` | 0 errors across all 14 workspace projects |
| `pnpm build` | succeeds; `/final-packages`, `/final-packages/[id]`, `/final-packages/new` appear in Next.js route output |
| `POST /api/final-packages` valid §29.8 payload | HTTP 201 with `StoredFinalPackageRecord` |
| `POST /api/final-packages` duplicate ID | HTTP 409 |
| `GET /api/final-packages` | HTTP 200 JSON array |
| `GET /api/final-packages/:id` | HTTP 200 with stored record |
| `POST /api/final-packages/:id/release` valid (`not_releasable → pending_admin_approval`) | HTTP 200; `packageReleaseState` updated in response |
| `POST /api/final-packages/:id/release` invalid skip (`pending_admin_approval → released`) | HTTP 400 `"Invalid release transition: 'pending_admin_approval' → 'released' is not allowed (§28.16)."` |

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

## What has NOT been built

- Real database persistence
- Authentication / authorization
- Python sidecar
- CI / automated tests
