# Pass 4 — Prompt Registry + Prompt Workspace UI

## Goal
Implement the prompt registry package body and the admin prompt workspace surface. Prompts are typed, versioned, and tagged records that can be registered, retrieved, and listed. The UI must surface prompt content in a way that allows operators to inspect and verify what is being used.

---

## Scope

### Build
- `packages/prompts` package body:
  - `registerPrompt(payload, repo)` — validates payload, saves prompt record with `registeredAt` timestamp
  - `getPrompt(promptId, repo)` — lookup by ID
  - `listPrompts(repo)` — returns all prompt records
  - `listPromptsByRole(role, repo)` — filtered list
  - Authority/role classification helpers (e.g. `isSystemPrompt`, `isUserPrompt`)
- `packages/persistence` patch:
  - Add `PromptRecord` entity type
  - Add `PromptRepository` interface with `save`, `findById`, `findByRole`, `findAll`
  - Add `InMemoryPromptRepository` (Map-based)
  - Extend `createInMemoryStore()` to include `prompts: PromptRepository`
- `packages/contracts` patch (if prompt schema does not yet exist):
  - `src/schemas/prompt-registration.schema.json` — JSON Schema Draft-07
  - `PromptRegistration` type + `validatePromptRegistration` validator exported from `src/index.ts`
- Source admin UI pages in `apps/admin-web`:
  - `app/api/prompts/route.ts` — `GET /api/prompts` + `POST /api/prompts`
  - `app/api/prompts/[id]/route.ts` — `GET /api/prompts/:id`
  - `app/prompts/page.tsx` — prompt list server component
  - `app/prompts/new/page.tsx` — prompt registration form client component
  - `app/prompts/[id]/page.tsx` — prompt detail server component; must display role/type classification visibly

### Validate
- `pnpm typecheck` — 0 errors
- Prompt records persist and are retrievable
- Prompt role/type classification visible in detail page
- `/prompts` page renders registered prompts
- `/prompts/new` form submits and creates a prompt
- Missing required field → validation error visible in rendered UI

### Do not widen scope
- No session logic (Pass 5)
- No synthesis or evaluation (Pass 6-7)
- No LLM invocation
- No authentication

---

## Dependencies on prior passes
- Pass 1 (contracts scaffold, types, schemas) — complete
- Pass 2 (state families, core-state, persistence, core-case, case UI) — complete
- Pass 3 (sources-context, source API, source UI) — complete

---

## Architecture constraints
- Business logic belongs in `packages/prompts`, not in `apps/admin-web`
- Schema changes go through `packages/contracts` — do not define prompt types in `prompts` package
- `makeValidator<T>` must be used for all payload validation
- `packages/prompts` must not import from `packages/core-state` or `packages/core-case`

---

## Required proof before Pass 4 is considered complete

1. `pnpm typecheck` — 0 errors
2. `POST /api/prompts` valid body → 201 + persisted prompt record
3. `GET /api/prompts` → returns that prompt
4. `/prompts` page renders the registered prompt
5. `/prompts/new` with missing required field → validation error visible in rendered UI
6. Prompt role/type stored and retrievable (present in GET response)
7. Prompt detail page shows role/type classification in a visually distinct panel

---

## Stop conditions
- If the prompt schema fields (role values, type values, etc.) are not specified in the locked reference documents, record the question in `handoff/OPEN_QUESTIONS.md` and surface it to the operator before proceeding. Do not invent governance values.
