# Pass 3 — Source Intake + Context Handling + Source UI

## Goal
Implement source registration, context handling, and the admin source UI surface.

---

## Scope

### Build
- `sources-context` package body — source registration logic, source typing/timing tags, company context handling, domain-support registration boundary
- Source registration API routes in `admin-web` (`/api/sources` GET + POST)
- Source admin UI pages (`/sources` list, `/sources/new` form, `/sources/[id]` detail)
- Context/domain-support distinction visibility

### Validate
- `pnpm typecheck` — 0 errors
- Source inventory updates persist correctly
- Timing tags applied and stored
- Classification storage works
- `/sources` page renders registered sources
- `/sources/new` form submits and creates a source

### Do not widen scope
- No session logic (Pass 5)
- No prompt registry (Pass 4)
- No synthesis or evaluation (Pass 6-7)
- No authentication

---

## Dependencies on prior passes
- Pass 1 (contracts scaffold, types, schemas) — complete
- Pass 2 (state families, core-state, persistence, core-case, case UI) — complete
- Pass 2B (RolloutState deferral, proof closure) — complete

## Required proof before Pass 3 is considered complete

1. `pnpm typecheck` — 0 errors
2. `POST /api/sources` valid body -> 201 + persisted source
3. `GET /api/sources` -> returns that source
4. `/sources` page renders the registered source
5. `/sources/new` with missing required field -> validation error visible in rendered UI
6. Source typing/timing tags stored and retrievable
7. Context vs domain-support classification visible in source detail
