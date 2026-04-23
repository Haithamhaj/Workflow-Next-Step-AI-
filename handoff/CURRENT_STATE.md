# Current State

**Pass 2 Phase 1 proven. `pass2_not_complete` — Phase 2 (providers, crawling, transcription, embeddings) not yet built.**

Status vocabulary for Pass 2: `phase_draft` / `phase_partially_proven` / `phase_proven` / `pass2_not_complete`.

- Phase 1 (contracts + local database + persistence + artifact storage): **`phase_proven`**
- Phase 2 (providers, crawling, transcription, embeddings): **`phase_draft`** (not started)
- Pass 2 overall: **`pass2_not_complete`**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20; TypeScript 5.4.5 strict, `noUncheckedIndexedAccess`; ESM everywhere; composite project references
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`, `prove:pass2-phase1`
- Root `devDependencies`: `@workflow/contracts`, `@workflow/persistence` (workspace links for `scripts/*.mjs`)
- `.claude/launch.json` — preview server config for admin-web on port 3000

---

### `packages/contracts` (Pass 2 entities complete)

All 15 Pass 2 contract entities added as Draft-07 JSON schemas + TypeScript types + Ajv validators via `makeValidator<T>`:

| Entity | Validator |
|---|---|
| `CaseConfiguration` | `validateCaseConfiguration` (Pass 1) |
| `SourceRegistration` | `validateSourceRegistration` (Pass 1) |
| `IntakeSourceRecord` | `validateIntakeSourceRecord` |
| `IntakeBatchRecord` | `validateIntakeBatchRecord` |
| `IntakeBatchSummaryItem` | `validateIntakeBatchSummaryItem` |
| `AIIntakeSuggestion` | `validateAIIntakeSuggestion` |
| `AdminIntakeDecision` | `validateAdminIntakeDecision` |
| `StructuredContextRecord` | `validateStructuredContextRecord` |
| `StructuredContextFieldEvidence` | `validateStructuredContextFieldEvidence` |
| `ProviderExtractionJob` | `validateProviderExtractionJob` |
| `ContentChunkRecord` | `validateContentChunkRecord` |
| `EmbeddingJobRecord` | `validateEmbeddingJobRecord` |
| `WebsiteCrawlPlan` | `validateWebsiteCrawlPlan` |
| `WebsiteCrawlCandidatePage` | `validateWebsiteCrawlCandidatePage` |
| `WebsiteCrawlApproval` | `validateWebsiteCrawlApproval` |
| `WebsiteSiteSummary` | `validateWebsiteSiteSummary` |
| `FinalPreHierarchyReviewRecord` | `validateFinalPreHierarchyReviewRecord` |

State families (unchanged): `CaseState`, `SessionState`, `PackageState`, `ReviewState`, `ReleaseState`. `RolloutState` remains formally deferred (operator decision, 2026-04-21).

---

### `packages/persistence` (SQLite + in-memory)

- `src/entities.ts` — all 17 repo interfaces + composite `Store` shape
- `src/in-memory.ts` — `createInMemoryStore(): Store` (used by admin-web for Pass 2A cases UI)
- `src/sqlite/database.ts` — `openDatabase(dbPath)`: parent `mkdir`, `better-sqlite3` open, WAL journal + foreign keys, migration runner tracked in `_migrations` table, per-version transactions
- `src/sqlite/schema.ts` — 17 DDL tables mirroring contract fields 1:1. Array columns (`seedUrls`, `evidenceRefs`) stored as TEXT JSON at the repo boundary
- `src/sqlite/repositories.ts` — all 17 repositories with `save` / `findById` / list-by-parent accessors; `undefined ↔ NULL` handled via `nullable` + `stripNulls`
- `createSqliteStore(dbPath): SqliteStore` — durable adapter; same interface as `InMemoryStore` so consumers are backend-agnostic
- Back-compat: `InMemoryStore = Store` type alias retained for Pass 1 admin-web singleton

### `packages/core-state`, `packages/core-case` (unchanged from Pass 2A)

- `CaseStateTransitions` matrix + `isValidTransition`
- `createCase` / `loadCase` / `listCases`

---

### `apps/admin-web` (unchanged from Pass 2A)

- `/cases` list + `/cases/new` form, `GET` + `POST /api/cases` backed by the `InMemoryStore` singleton
- No Pass 2 Phase 1 UI added; Phase 1 is a contracts-and-storage pass only

---

### `data/` (artifact storage)

- `data/README.md` documents the layout
- Subfolders (all git-ignored, kept via `.gitkeep`): `uploads/`, `extracted/`, `crawls/`, `transcripts/`, `embeddings/`
- SQLite database files also live here (`data/workflow.db`, `data/test-pass2.db`)
- `.gitignore` updated: `data/**` ignored, with `README.md` and `*/.gitkeep` re-included

---

## What is proven (Pass 2 Phase 1)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors across all workspace packages |
| `pnpm build:contracts` | clean emit |
| Validator round-trip for all 17 contract entities (Pass 1 + Pass 2) | 17/17 PASS |
| SQLite store opens, schema migrates, writes one record per entity via repo boundary | PASS |
| Close DB, re-open in a fresh `createSqliteStore`, read every record, `deepStrictEqual` to original | 17/17 PASS |
| Proof script total | 35/35 checks passed → `phase_proven` |

Proof script: [scripts/prove-pass2-phase1.mjs](scripts/prove-pass2-phase1.mjs). Run with `pnpm prove:pass2-phase1`.

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `packages/contracts/src/types/states.ts` | Indefinite — operator formally deferred |
| Provider integrations (OpenAI, transcription) | — | Pass 2 Phase 2 |
| Website crawl execution (fetch, parse, robots) | — | Pass 2 Phase 2 |
| Embedding generation pipeline | — | Pass 2 Phase 2 |
| Hierarchy, rollout, synthesis/evaluation | — | Pass 3+ |
| UI surfaces for intake, structured context, crawls, review | `apps/admin-web/app/**` | Pass 3+ |

---

## What has NOT been built

- Any provider call (no OpenAI, no transcription, no embeddings)
- Any real website fetch or crawl worker
- Any UI for the 15 Pass 2 entities (contracts + storage only)
- Hierarchy, session, package, review, release logic
- Authentication, CI/CD, tests
