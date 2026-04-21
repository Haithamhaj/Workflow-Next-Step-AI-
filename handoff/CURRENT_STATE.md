# Current State

**Pass 4 (Prompt Registry + Prompt Workspace UI) accepted. All proof items satisfied.**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20 engine constraint
- TypeScript 5.4.5, ESM (`"type": "module"` everywhere), composite builds with project references
- `tsconfig.base.json`: strict, noUncheckedIndexedAccess, resolveJsonModule, Bundler resolution
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`
- `.claude/launch.json` — preview server config; `autoPort: true` (server uses assigned port via `PORT` env var, assigned 60503 when 3000 is occupied)

---

### `packages/contracts` (complete through Pass 4)
- `src/ajv.ts` — Ajv 8 + ajv-formats configured
- `src/validate.ts` — `makeValidator<T>(schema)` returning `ValidationResult<T>`
- `src/schemas/case-configuration.schema.json` — JSON Schema Draft-07 (sec 8.1/8.2)
- `src/schemas/source-registration.schema.json` — JSON Schema Draft-07 (sec 11.3/11.9/11.10)
- `src/schemas/prompt-registration.schema.json` — JSON Schema Draft-07 (§29.9, §30.16) *(new Pass 4)*
  - Required: `promptId`, `promptName`, `promptType` (enum), `role` (enum), `linkedModule`, `promptPurpose`, `promptVersion`, `status` (enum)
  - Optional: `linkedDecisionBlock`, `inputContractRef`, `outputContractRef`, `sourceSectionLinks`, `notes`
- `src/types/states.ts` — state family types:
  - `CaseState` (11 values, sec 28.5) — filled Pass 1
  - `SessionState` (6 values, sec 28.9) — filled Pass 2A
  - `PackageState` (6 values, sec 28.11) — filled Pass 2A
  - `ReviewState` (5 values, sec 28.13) — filled Pass 2A
  - `ReleaseState` (4 values, sec 28.15) — filled Pass 2A
  - `RolloutState` — **formally deferred** (operator decision, 2026-04-21). Branded placeholder retained with deferral comment. sec 28.7 describes pillars, not enumerated values.
- `src/types/prompt-registration.ts` — `PromptType`, `PromptRole`, `PromptStatus`, `PromptRegistration` *(new Pass 4)*
- `src/index.ts` — exports `validateSessionState`, `validatePackageState`, `validateReviewState`, `validateReleaseState`, `validateSourceRegistration`, `validatePromptRegistration` *(extended Pass 4)*

---

### `packages/core-state` (implemented Pass 2A)
- `CaseStateTransitions`: `Record<CaseState, readonly CaseState[]>` per sec 28.6 full transition matrix
- `isValidTransition(from: CaseState, to: CaseState): boolean` — pure, no I/O

---

### `packages/persistence` (patched through Pass 4)
- `Case` entity type, `Source` entity type
- `PromptRecord` entity type (`extends PromptRegistration { registeredAt: string }`) *(new Pass 4)*
- `CaseRepository` and `SourceRepository` interfaces (backend-agnostic)
  - `SourceRepository` gains `findById(sourceId): Source | null` (local patch, Pass 3)
- `PromptRepository` interface: `save`, `findById`, `findByRole`, `findAll` *(new Pass 4)*
- `InMemoryCaseRepository` — array-based
- `InMemorySourceRepository` — Map-based (keyed by `sourceId`, O(1) lookup, patched Pass 3)
- `InMemoryPromptRepository` — Map-based (keyed by `promptId`, O(1) lookup) *(new Pass 4)*
- `createInMemoryStore()` factory — includes `prompts: PromptRepository` *(extended Pass 4)*

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

### `packages/prompts` (implemented Pass 4)
- `registerPrompt(payload, repo)` — validates via `validatePromptRegistration`, duplicate-checks via `findById`, saves `PromptRecord` with `registeredAt` stamped
- `getPrompt(promptId, repo)` — lookup by ID
- `listPrompts(repo)` — returns all prompt records
- `listPromptsByRole(role, repo)` — filtered list
- `isSystemPrompt(prompt)` / `isUserPrompt(prompt)` — role classification predicates
- Re-exports: `PromptRegistration`, `PromptType`, `PromptRole`, `PromptStatus` from `@workflow/contracts`
- Dependencies: `@workflow/contracts`, `@workflow/persistence`
- Architecture constraint observed: does NOT import from `packages/core-state` or `packages/core-case`

---

### `apps/admin-web` (extended through Pass 4)
- `lib/store.ts` — singleton `InMemoryStore` via `globalThis.__workflowStore__`
- `app/api/cases/route.ts` — `GET /api/cases` + `POST /api/cases`
- `app/api/sources/route.ts` — `GET /api/sources` + `POST /api/sources` (validates, 201/400/409)
- `app/api/sources/[id]/route.ts` — `GET /api/sources/:id` (404 on miss)
- `app/api/prompts/route.ts` — `GET /api/prompts` + `POST /api/prompts` (201/400/409) *(new Pass 4)*
- `app/api/prompts/[id]/route.ts` — `GET /api/prompts/:id` (404 on miss) *(new Pass 4)*
- `app/cases/page.tsx` — case list server component
- `app/cases/new/page.tsx` — case form client component
- `app/sources/page.tsx` — source list server component; authority-colored badges
- `app/sources/new/page.tsx` — source form client component; validation error block
- `app/sources/[id]/page.tsx` — source detail server component; Authority Classification panel
- `app/prompts/page.tsx` — prompt list server component; type (purple), role (blue/green), status badges *(new Pass 4)*
- `app/prompts/new/page.tsx` — prompt registration form client component; `data-testid="validation-errors"` error block *(new Pass 4)*
- `app/prompts/[id]/page.tsx` — prompt detail server component; Role & Type Classification panel (system: blue `#0e0e2a` / user: green `#0e2a0e`); uses `isSystemPrompt`/`isUserPrompt` from `@workflow/prompts`; references §30.7, OQ-001 *(new Pass 4)*
- `app/globals.css` — `.btn-primary` styles
- `next.config.mjs` — `transpilePackages` includes `@workflow/sources-context`, `@workflow/prompts`

---

### 7 skeleton packages (unchanged from Pass 1)
`sessions-clarification`, `synthesis-evaluation`, `packages-output`,
`review-issues`, `domain-support`, `integrations`, `shared-utils`

---

## What is proven (Pass 4 accepted)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors across all packages |
| `POST /api/prompts` valid body | HTTP 201, full `PromptRecord` with `registeredAt` in body |
| `GET /api/prompts` | Returns persisted prompt list |
| `/prompts` page renders | Table with ID, Name, Type, Role, Module, Version, Status columns and both test prompts |
| `/prompts/new` missing required field | Validation errors block renders: "Invalid PromptRegistration: must have required property 'promptId'; ..." |
| Prompt role/type stored and retrievable | `role` + `promptType` present in GET /api/prompts/:id response |
| `/prompts/:id` detail page | Role & Type Classification panel rendered with correct blue/green theme, badges, and §30.7 explanatory text |
| Prior Pass 3 proof items | All still satisfied |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated in locked reference documents. Values derived from NEXT_PASS.md examples. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec (sec 28.7 describes pillars only). Formally deferred by operator. | 2026-04-21 |

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `contracts/src/types/states.ts` | Indefinite — operator chose formal deferral |
| Session logic | `packages/sessions-clarification/` | Pass 5 |
| 6 non-implemented package bodies | `packages/*/src/index.ts` | Pass 5-7 |

---

## What has NOT been built

- Session logic, clarification flows, LLM transport
- Synthesis, evaluation, package generation
- Review issues, release decisions
- Real database (all storage resets on server restart)
- Authentication or authorization
- Python sidecar
- CI/CD, tests
