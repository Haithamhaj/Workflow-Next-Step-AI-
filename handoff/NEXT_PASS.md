# Pass 2 Phase 2 — Providers, Crawling, Transcription, Embeddings

## Goal

Wire the execution layer on top of the Phase 1 contracts + SQLite persistence: provider extraction jobs actually run, website crawls fetch candidate pages, media gets transcribed, and content chunks get embedded. No UI. No hierarchy. No synthesis.

After this phase Pass 2 moves from `pass2_not_complete` toward `phase_proven` for Phase 2 specifically — full Pass 2 acceptance still requires whatever subsequent phases the spec calls out.

---

## Scope

### Build

- **Provider extraction runner** — consumes `ProviderExtractionJob` rows with `status="queued"`, calls the configured provider, writes `ContentChunkRecord` rows + artifact files under `data/extracted/`, updates job status (`running` → `succeeded` | `failed`) with `startedAt`/`completedAt` and error capture.
- **Website crawl worker** — consumes `WebsiteCrawlPlan` + approved `WebsiteCrawlCandidatePage` rows, fetches page bodies into `data/crawls/`, updates page status (`approved` → `fetched` | `fetch_failed`), maintains `WebsiteSiteSummary` counters.
- **Transcription job path** — handles media-type intake sources by dispatching to a transcription provider, output lands in `data/transcripts/`, produces `ContentChunkRecord` rows on the same content-chunk boundary as text extraction.
- **Embedding pipeline** — consumes `EmbeddingJobRecord` rows (`status="queued"`), calls embedding provider, persists vector outputs under `data/embeddings/` referenced by the chunk, updates job status.
- **Provider adapter boundary** — `packages/integrations` gains a small interface per provider family (extraction, transcription, embedding) so Phase 2 can swap real providers for test doubles without touching the runner code.
- **Configuration** — environment-driven provider credentials via `.env` (never committed), read at process start.

### Do not widen scope

- No admin UI for any of these entities (Phase 3+)
- No `FinalPreHierarchyReviewRecord` workflow (that record exists as a contract; no reviewer UX yet)
- No hierarchy construction
- No authentication
- No cross-case or multi-tenant concerns
- Do not modify Phase 1 contracts or schemas; if a field is missing, stop and add it to `handoff/OPEN_QUESTIONS.md`

---

## Dependencies on prior phases

- Pass 1 (scaffolding, contracts base) — complete
- Pass 2A (state families, core-state, core-case, cases admin surface) — complete
- Pass 2B (RolloutState formal deferral) — complete
- **Pass 2 Phase 1 (all 15 Pass 2 contracts + SQLite persistence + artifact storage)** — `phase_proven` (see `CURRENT_STATE.md`)

---

## Required proof before Phase 2 is `phase_proven`

1. `pnpm typecheck` — 0 errors across all packages
2. Queue a `ProviderExtractionJob` for a fixture intake source; runner completes it; `ContentChunkRecord` rows exist; artifact file exists under `data/extracted/<intakeSourceId>/`; job transitions `queued → running → succeeded` with both timestamps set.
3. Queue a `WebsiteCrawlPlan` with one approved candidate page; crawl worker fetches it; page status transitions `approved → fetched`; body file exists under `data/crawls/<crawlPlanId>/`; `WebsiteSiteSummary` counters reflect the fetch.
4. Submit a media intake source; transcription job completes; transcript file exists under `data/transcripts/<intakeSourceId>/`; one or more `ContentChunkRecord` rows reference it.
5. Queue an `EmbeddingJobRecord` for a produced chunk; pipeline completes; embedding artifact persisted under `data/embeddings/<chunkId>/`; job transitions `queued → running → succeeded`.
6. Restart the process mid-batch: unfinished jobs remain `queued`/`running`, finished jobs remain `succeeded` — no data loss, no duplicate writes on re-run.
7. Failure path: induce a provider error on one job; status transitions to `failed` with `error` captured; sibling jobs unaffected.
8. Proof script `scripts/prove-pass2-phase2.mjs` prints `phase_proven` on success; `pass2_not_complete` vocabulary used until all downstream phases are also accepted.

---

## Out of scope — stop signals

If any of these come up during Phase 2, stop and record in `handoff/OPEN_QUESTIONS.md`:

- Any need to change an existing Phase 1 schema field
- Any reviewer/approval UX requirement
- Any hierarchy / session / package / release concern
- Any `RolloutState` value decision
- Any cross-case aggregation
