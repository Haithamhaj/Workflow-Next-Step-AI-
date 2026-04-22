# Current State

**Pass 5 (Session Lifecycle + Clarification UI) accepted. All proof items satisfied.**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20 engine constraint
- TypeScript 5.4.5, ESM (`"type": "module"` everywhere), composite builds with project references
- `tsconfig.base.json`: strict, noUncheckedIndexedAccess, resolveJsonModule, Bundler resolution
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`
- `.claude/launch.json` — preview server config; `autoPort: true` (server uses assigned port via `PORT` env var)

---

### `packages/contracts` (complete through Pass 5)
- `src/ajv.ts` — Ajv 8 + ajv-formats configured
- `src/validate.ts` — `makeValidator<T>(schema)` returning `ValidationResult<T>`
- `src/schemas/case-configuration.schema.json` — Draft-07 (sec 8.1/8.2)
- `src/schemas/source-registration.schema.json` — Draft-07 (sec 11.3/11.9/11.10)
- `src/schemas/prompt-registration.schema.json` — Draft-07 (§29.9, §30.16)
- `src/schemas/session-creation.schema.json` — Draft-07 *(new Pass 5)*
  - Required: `sessionId`, `caseId`
  - Optional: `participantLabel`, `initialState` (enum of §28.9 SessionState values), `notes`
- `src/types/states.ts` — state family types:
  - `CaseState` (11 values, sec 28.5) — Pass 1
  - `SessionState` (6 values, sec 28.9) — Pass 2A
  - `PackageState` (6 values, sec 28.11) — Pass 2A
  - `ReviewState` (5 values, sec 28.13) — Pass 2A
  - `ReleaseState` (4 values, sec 28.15) — Pass 2A
  - `RolloutState` — **formally deferred** (operator decision, 2026-04-21)
- `src/types/prompt-registration.ts` — `PromptType`, `PromptRole`, `PromptStatus`, `PromptRegistration`
- `src/types/session.ts` — `SessionCreation`, `ClarificationQuestion` *(new Pass 5)*
- `src/index.ts` — exports `validateSessionState`, `validatePackageState`, `validateReviewState`, `validateReleaseState`, `validateSourceRegistration`, `validatePromptRegistration`, `validateSessionCreation` *(extended Pass 5)*

---

### `packages/core-state` (implemented Pass 2A)
- `CaseStateTransitions`: `Record<CaseState, readonly CaseState[]>` per sec 28.6
- `isValidTransition(from: CaseState, to: CaseState): boolean`

---

### `packages/persistence` (patched through Pass 5)
- `Case`, `Source`, `PromptRecord` entity types
- `SessionRecord` entity type — extends `SessionCreation` with `createdAt`, `currentState`, `clarificationQuestions: ClarificationQuestion[]` *(new Pass 5)*
- `CaseRepository`, `SourceRepository`, `PromptRepository` interfaces
- `SessionRepository` interface: `save`, `findById`, `findByCaseId`, `findAll` *(new Pass 5)*
- `InMemoryCaseRepository`, `InMemorySourceRepository`, `InMemoryPromptRepository` (Map-based)
- `InMemorySessionRepository` — Map-based (keyed by `sessionId`, O(1) lookup) *(new Pass 5)*
- `createInMemoryStore()` factory — includes `sessions: SessionRepository` *(extended Pass 5)*

---

### `packages/core-case` (implemented Pass 2A)
- `createCase(config, repo)`, `loadCase(caseId, repo)`, `listCases(repo)`

---

### `packages/sources-context` (implemented Pass 3)
- `registerSource`, `getSource`, `listSources`, `listSourcesByCaseId`
- `isCompanyTruth` / `isDomainSupport` predicates

---

### `packages/prompts` (implemented Pass 4)
- `registerPrompt`, `getPrompt`, `listPrompts`, `listPromptsByRole`
- `isSystemPrompt` / `isUserPrompt` predicates

---

### `packages/sessions-clarification` (implemented Pass 5)
- `SessionStateTransitions: Record<SessionState, readonly SessionState[]>` — §28.10 forward-only; right-hand states have empty transition arrays (see OQ-003)
- `isValidSessionTransition(from, to)` — pure, no I/O
- `createSession(payload, repo)` — validates via `validateSessionCreation`, rejects duplicates, defaults `currentState` to `not_started` when `initialState` omitted, stamps `createdAt`, returns `SessionOutcome` (`{ ok: true, session } | { ok: false, error }`)
- `getSession(sessionId, repo)` — lookup by ID
- `listSessions(repo)` — returns all session records
- `listSessionsByCaseId(caseId, repo)` — filtered list
- `transitionSession(sessionId, toState, repo)` — consults `isValidSessionTransition`, persists updated record, returns outcome
- `addClarificationQuestion(sessionId, question, repo)` — enforces §17.8 (question + explanation + example all non-empty), appends to session
- Re-exports: `SessionState`, `SessionCreation`, `ClarificationQuestion` from contracts; `SessionRecord`, `SessionRepository` from persistence
- Dependencies: `@workflow/contracts`, `@workflow/persistence`
- Architecture constraint observed: does NOT import from `packages/core-state` or `packages/core-case`

---

### `apps/admin-web` (extended through Pass 5)
- `lib/store.ts` — singleton `InMemoryStore` via `globalThis.__workflowStore__`
- `app/api/cases/route.ts` — `GET /api/cases` + `POST /api/cases`
- `app/api/sources/route.ts` + `app/api/sources/[id]/route.ts`
- `app/api/prompts/route.ts` + `app/api/prompts/[id]/route.ts`
- `app/api/sessions/route.ts` — `GET /api/sessions` + `POST /api/sessions` (201/400/409) *(new Pass 5)*
- `app/api/sessions/[id]/route.ts` — `GET /api/sessions/:id` (404 on miss) *(new Pass 5)*
- `app/cases/page.tsx`, `app/cases/new/page.tsx`
- `app/sources/page.tsx`, `app/sources/new/page.tsx`, `app/sources/[id]/page.tsx`
- `app/prompts/page.tsx`, `app/prompts/new/page.tsx`, `app/prompts/[id]/page.tsx`
- `app/sessions/page.tsx` — session list server component; State column renders `StateBadge` *(new Pass 5)*
- `app/sessions/new/page.tsx` — session creation form client component; `data-testid="validation-errors"` error block *(new Pass 5)*
- `app/sessions/[id]/page.tsx` — session detail server component; visually distinct state panel (`data-testid="state-panel"`, §28.9 header, §28.10 footer note); §17.8 clarification questions section *(new Pass 5)*
- `app/sessions/StateBadge.tsx` — color-mapped badge for all 6 §28.9 values *(new Pass 5)*
- `app/globals.css` — `.btn-primary` styles
- `next.config.mjs` — `transpilePackages` includes `@workflow/sessions-clarification` *(extended Pass 5)*

---

### 6 remaining skeleton packages (unchanged)
`synthesis-evaluation`, `packages-output`, `review-issues`, `domain-support`, `integrations`, `shared-utils`

---

## What is proven (Pass 5 accepted)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors across all packages |
| `POST /api/sessions` missing field | HTTP 400, `"Invalid SessionCreation: must have required property ..."` |
| `POST /api/sessions` valid body | HTTP 201, full `SessionRecord` with `createdAt`, `currentState: "not_started"`, `clarificationQuestions: []` |
| `POST /api/sessions` duplicate ID | HTTP 409 |
| `GET /api/sessions` | Returns persisted session list |
| `GET /api/sessions/:id` | Returns single record; 404 on miss |
| `/sessions` page renders | Table with Session ID, Case ID, Participant, State (badge), Clarifications, Created |
| `/sessions/new` missing required field | Validation error panel renders: "Invalid SessionCreation: must have required property 'sessionId'; must have required property 'caseId'" (DOM proof via `data-testid="validation-errors"`) |
| `/sessions/:id` detail page | State classification panel rendered (`data-testid="state-panel"`, §28.9 header, StateBadge, §28.10 footer); metadata grid; §17.8 clarification questions section |
| Prior Pass 4 proof items | All still satisfied |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated in locked reference documents. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec (sec 28.7 describes pillars only). Formally deferred by operator. | 2026-04-21 |
| OQ-003 | Session terminal-state looping: §28.10 does not state whether `follow_up_needed` / `session_partial` may transition back into `extraction_in_progress`. Current Pass 5 encoding is forward-only (empty transition arrays for right-hand states). Operator confirmation required. | 2026-04-22 |

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `contracts/src/types/states.ts` | Indefinite — operator chose formal deferral |
| Synthesis / evaluation logic | `packages/synthesis-evaluation/` | Pass 6 |
| Output package assembly | `packages/packages-output/` | Pass 7 |
| Review issues | `packages/review-issues/` | Pass 7+ |
| 5 remaining package bodies | `packages/*/src/index.ts` | Pass 6-8 |

---

## What has NOT been built

- LLM invocation / transport (Pass 6+)
- Synthesis, evaluation, package generation (Pass 6-7)
- Review issues, release decisions (Pass 7+)
- Real database (all storage resets on server restart)
- Authentication or authorization
- Python sidecar
- CI/CD, tests
