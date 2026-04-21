# Pass 5 — Session Lifecycle + Clarification UI

## Goal
Implement the sessions-clarification package body and the admin session workspace surface. Sessions are the primary unit of work within a case: they track state, hold clarification questions, and drive the LLM interaction lifecycle. The UI must allow operators to view, inspect, and act on sessions.

---

## Scope

### Build
- `packages/sessions-clarification` package body:
  - `createSession(payload, repo)` — validates payload, saves session record with `createdAt` timestamp
  - `getSession(sessionId, repo)` — lookup by ID
  - `listSessions(repo)` — returns all session records
  - `listSessionsByCaseId(caseId, repo)` — filtered by case
  - `transitionSession(sessionId, toState, repo)` — validates state transition, saves updated record
  - `addClarificationQuestion(sessionId, question, repo)` — appends a clarification question to session
  - Authority/status helpers as needed
- `packages/persistence` patch:
  - Add `SessionRecord` entity type
  - Add `SessionRepository` interface with `save`, `findById`, `findByCaseId`, `findAll`
  - Add `InMemorySessionRepository` (Map-based)
  - Extend `createInMemoryStore()` to include `sessions: SessionRepository`
- `packages/contracts` patch (if session schema does not yet exist):
  - `src/schemas/session-creation.schema.json` — JSON Schema Draft-07
  - `SessionCreation` type + `validateSessionCreation` validator exported from `src/index.ts`
- Admin UI pages in `apps/admin-web`:
  - `app/api/sessions/route.ts` — `GET /api/sessions` + `POST /api/sessions`
  - `app/api/sessions/[id]/route.ts` — `GET /api/sessions/:id`
  - `app/sessions/page.tsx` — session list server component
  - `app/sessions/new/page.tsx` — session creation form client component
  - `app/sessions/[id]/page.tsx` — session detail server component; must display current state and clarification questions visibly

### Validate
- `pnpm typecheck` — 0 errors
- Session records persist and are retrievable by ID and by caseId
- Session state visible in list and detail pages
- `/sessions/new` form submits and creates a session
- Missing required field → validation error visible in rendered UI
- Clarification questions retrievable from session detail

### Do not widen scope
- No LLM invocation (Pass 6+)
- No synthesis or evaluation (Pass 6-7)
- No authentication
- No real database

---

## Dependencies on prior passes
- Pass 1 (contracts scaffold, types, schemas) — complete
- Pass 2 (state families, core-state, persistence, core-case, case UI) — complete
- Pass 3 (sources-context, source API, source UI) — complete
- Pass 4 (prompts package body, prompt API, prompt UI) — complete

---

## Architecture constraints
- Business logic belongs in `packages/sessions-clarification`, not in `apps/admin-web`
- Schema changes go through `packages/contracts` — do not define session types in `sessions-clarification` package
- `makeValidator<T>` must be used for all payload validation
- `packages/sessions-clarification` must not import from `packages/core-case` (case logic is separate)
- State transition validation must use `SessionState` from `packages/contracts` (sec 28.9) — already implemented

---

## Required proof before Pass 5 is considered complete

1. `pnpm typecheck` — 0 errors
2. `POST /api/sessions` valid body → 201 + persisted session record with `createdAt`
3. `GET /api/sessions` → returns that session
4. `/sessions` page renders the registered session with state badge
5. `/sessions/new` with missing required field → validation error visible in rendered UI
6. Session state and caseId stored and retrievable (present in GET response)
7. Session detail page shows state classification in a visually distinct panel

---

## Stop conditions
- If session schema fields (required fields, allowed initial states, clarification question structure) are not specified in the locked reference documents, record the question in `handoff/OPEN_QUESTIONS.md` and surface it to the operator before proceeding. Do not invent governance values.
- `SessionState` values are already specified (sec 28.9) and implemented — use them. Do not redefine.
