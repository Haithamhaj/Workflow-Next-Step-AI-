# Current State

**Pass 2 (including Pass 2A + Pass 2B) accepted. All proof items satisfied.**

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
- `src/index.ts` — exports `validateSessionState`, `validatePackageState`, `validateReviewState`, `validateReleaseState`

---

### `packages/core-state` (implemented Pass 2A)
- `CaseStateTransitions`: `Record<CaseState, readonly CaseState[]>` per sec 28.6 full transition matrix
- `isValidTransition(from: CaseState, to: CaseState): boolean` — pure, no I/O

---

### `packages/persistence` (implemented Pass 2A)
- `Case` entity type, `Source` entity type
- `CaseRepository` and `SourceRepository` interfaces (backend-agnostic)
- `InMemoryCaseRepository` and `InMemorySourceRepository`
- `createInMemoryStore()` factory

---

### `packages/core-case` (implemented Pass 2A)
- `createCase(config, repo)`, `loadCase(caseId, repo)`, `listCases(repo)`
- Dependencies: `@workflow/contracts`, `@workflow/core-state`, `@workflow/persistence`

---

### `apps/admin-web` (extended Pass 2A)
- `lib/store.ts` — singleton `InMemoryStore` via `globalThis.__workflowStore__`
- `app/api/cases/route.ts` — `GET /api/cases` + `POST /api/cases` (validates, 201 or 400)
- `app/cases/page.tsx` — server component; renders case list
- `app/cases/new/page.tsx` — client component; form with validation error display (error block renders visibly in DOM when API returns 400)
- `app/globals.css` — added `.btn-primary` styles
- `next.config.mjs` — `transpilePackages` extended

---

### 9 skeleton packages (unchanged from Pass 1)
`sources-context`, `sessions-clarification`, `synthesis-evaluation`, `packages-output`,
`review-issues`, `prompts`, `domain-support`, `integrations`, `shared-utils`

---

## What is proven (Pass 2 accepted)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors across all 14 packages |
| `isValidTransition("created","closed")` | `false` (illegal) |
| `isValidTransition("created","context_in_progress")` | `true` (legal) |
| `POST /api/cases` valid body | HTTP 201, `"state":"created"` in body |
| `GET /api/cases` | Returns persisted case list |
| `POST /api/cases` missing fields | HTTP 400 + `{"errors":[...]}` |
| `curl http://localhost:3000/cases` | HTML contains case data |
| `curl http://localhost:3000/cases/new` | HTTP 200, form renders |
| RolloutState disposition | Formally deferred per operator decision; branded placeholder retained |
| `/cases/new` validation error in UI | DOM evidence: styled error block renders validation error text from API 400 response |

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `contracts/src/types/states.ts` | Indefinite — operator chose formal deferral |
| Source intake UI or API | `apps/admin-web/app/sources/` | Pass 3 |
| `sources-context` body | `packages/sources-context/src/index.ts` | Pass 3 |
| 8 remaining admin routes (non-cases) | `apps/admin-web/app/*/page.tsx` | Pass 3+ |
| 9 non-implemented package bodies | `packages/*/src/index.ts` | Pass 3-7 |

---

## What has NOT been built

- Source intake API or UI
- Session logic, prompts, LLM transport
- Synthesis, evaluation, package generation
- Review issues, release decisions
- Real database (all storage resets on server restart)
- Authentication or authorization
- Python sidecar
- CI/CD, tests
