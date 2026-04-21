# Current State

**Pass 3 (Source Intake + Context Handling + Source UI) accepted. All proof items satisfied.**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20 engine constraint
- TypeScript 5.4.5, ESM (`"type": "module"` everywhere), composite builds with project references
- `tsconfig.base.json`: strict, noUncheckedIndexedAccess, resolveJsonModule, Bundler resolution
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`
- `.claude/launch.json` — preview server config for admin-web on port 3000

---

### `packages/contracts` (complete through Pass 2)
- `src/ajv.ts` — Ajv 8 + ajv-formats configured
- `src/validate.ts` — `makeValidator<T>(schema)` returning `ValidationResult<T>`
- `src/schemas/case-configuration.schema.json` — JSON Schema Draft-07 (sec 8.1/8.2)
- `src/schemas/source-registration.schema.json` — JSON Schema Draft-07 (sec 11.3/11.9/11.10)
- `src/types/states.ts` — state family types:
  - `CaseState` (11 values, sec 28.5) — filled Pass 1
  - `SessionState` (6 values, sec 28.9) — filled Pass 2A
  - `PackageState` (6 values, sec 28.11) — filled Pass 2A
  - `ReviewState` (5 values, sec 28.13) — filled Pass 2A
  - `ReleaseState` (4 values, sec 28.15) — filled Pass 2A
  - `RolloutState` — **formally deferred** (operator decision, 2026-04-21). Branded placeholder retained with deferral comment. sec 28.7 describes pillars, not enumerated values.
- `src/index.ts` — exports `validateSessionState`, `validatePackageState`, `validateReviewState`, `validateReleaseState`, `validateSourceRegistration`

---

### `packages/core-state` (implemented Pass 2A)
- `CaseStateTransitions`: `Record<CaseState, readonly CaseState[]>` per sec 28.6 full transition matrix
- `isValidTransition(from: CaseState, to: CaseState): boolean` — pure, no I/O

---

### `packages/persistence` (patched Pass 3)
- `Case` entity type, `Source` entity type
- `CaseRepository` and `SourceRepository` interfaces (backend-agnostic)
  - `SourceRepository` gains `findById(sourceId): Source | null` (local patch, Pass 3)
- `InMemoryCaseRepository` — array-based
- `InMemorySourceRepository` — **Map-based** (keyed by `sourceId`, O(1) lookup, patched Pass 3)
- `createInMemoryStore()` factory

---

### `packages/core-case` (implemented Pass 2A)
- `createCase(config, repo)`, `loadCase(caseId, repo)`, `listCases(repo)`
- Dependencies: `@workflow/contracts`, `@workflow/core-state`, `@workflow/persistence`

---

### `packages/sources-context` (implemented Pass 3)
- `registerSource(payload, repo)` — validates via `validateSourceRegistration`, duplicate-checks via `findById`, saves, returns `Source` with `registeredAt` stamped
- `getSource(sourceId, repo)` — lookup by ID
- `listSources(repo)` — returns all sources
- `listSourcesByCaseId(caseId, repo)` — filtered list
- `isCompanyTruth(source)` / `isDomainSupport(source)` — authority predicates
- Re-exports: `SourceRegistration`, `SourceIntakeType`, `SourceTimingTag`, `SourceAuthority`, `SourceProcessingStatus` from `@workflow/contracts`
- Dependencies: `@workflow/contracts`, `@workflow/persistence`

---

### `apps/admin-web` (extended through Pass 3)
- `lib/store.ts` — singleton `InMemoryStore` via `globalThis.__workflowStore__`
- `app/api/cases/route.ts` — `GET /api/cases` + `POST /api/cases`
- `app/api/sources/route.ts` — `GET /api/sources` + `POST /api/sources` (validates, 201/400/409) *(new Pass 3)*
- `app/api/sources/[id]/route.ts` — `GET /api/sources/:id` (404 on miss) *(new Pass 3)*
- `app/cases/page.tsx` — case list server component
- `app/cases/new/page.tsx` — case form client component
- `app/sources/page.tsx` — source list server component; authority-colored badges *(new Pass 3)*
- `app/sources/new/page.tsx` — source form client component; validation error block *(new Pass 3)*
- `app/sources/[id]/page.tsx` — source detail server component; Authority Classification panel with green (company_truth) / yellow (informational_domain_support) visual distinction per §11.10 *(new Pass 3)*
- `app/globals.css` — `.btn-primary` styles
- `next.config.mjs` — `transpilePackages` includes `@workflow/sources-context`

---

### 8 skeleton packages (unchanged from Pass 1)
`sessions-clarification`, `synthesis-evaluation`, `packages-output`,
`review-issues`, `prompts`, `domain-support`, `integrations`, `shared-utils`

---

## What is proven (Pass 3 accepted)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors across all 14 packages |
| `POST /api/sources` valid body | HTTP 201, full `Source` object in body |
| `GET /api/sources` | Returns persisted source list |
| `/sources` page renders | HTML contains source rows with authority badges |
| `POST /api/sources` missing fields | HTTP 400 + `{"error":"Invalid SourceRegistration: must have required property 'uploaderId'; ..."}` |
| Source typing/timing stored | `intakeType` + `timingTag` present in GET response and detail page |
| `/sources/:id` detail page | Authority Classification panel: `background:#0e2a0e; border:2px solid #3a7a3a` for `company_truth`; badge `✓ company_truth`; explanatory §11.10 text rendered |
| Prior Pass 2 proof items | All still satisfied |

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `contracts/src/types/states.ts` | Indefinite — operator chose formal deferral |
| Prompt registry/workspace | `packages/prompts/src/index.ts` | Pass 4 |
| Session logic | `packages/sessions-clarification/` | Pass 5 |
| 7 non-implemented package bodies | `packages/*/src/index.ts` | Pass 4-7 |

---

## What has NOT been built

- Prompt registry or prompt workspace UI
- Session logic, LLM transport
- Synthesis, evaluation, package generation
- Review issues, release decisions
- Real database (all storage resets on server restart)
- Authentication or authorization
- Python sidecar
- CI/CD, tests
