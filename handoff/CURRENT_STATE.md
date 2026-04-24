# Current State

**Accepted baseline: Pass 9 (Package Preview + Release Decision Surface), merged to `main` 2026-04-23, commit `41a8232`.**

Pass 2 (Intake & Context Build) is active on top of the Pass 9 baseline.

Phase 1 status: `phase_proven`.

Phase 2 status: `phase_proven`.

Phase 3 status: `phase_proven`.

Phase 4 status: `phase_proven`.

Overall Pass 2 status: `pass2_not_complete`.

---

## Official pass sequence

- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — accepted on `main` (2026-04-22), commit `a8f3523`
- **Pass 8:** Final Package + Release — accepted on `main` (2026-04-22), commit `3171ad4`
- **Pass 9:** Package Preview + Release Decision Surface — **accepted on `main` (2026-04-23), commit `41a8232`**

---

## What exists (all prior passes unchanged)

All Pass 6–9 packages, routes, and UI surfaces remain unchanged. See git history for full details.

---

## What Pass 2 Phase 1 added

Phase 1 landed the intake foundation only:

- Pass 2 contract entities
- Draft-07 schemas
- validators
- durable SQLite persistence
- local artifact folders
- proof script
- handoff updates

Phase 1 proof reported by the coding agent: `pnpm prove:pass2-phase1` passed 35/35 checks, including validator round-trips, SQLite save/restart round-trips, and write-phase smoke proof.

Next required phase by the live Pass 2 Build Spec:

**Pass 2 Phase 2 — Intake Registration UI and Basic Admin Surfaces**

---

## What Pass 2 Phase 2 added

Phase 2 exposes the durable intake foundation through basic admin surfaces:

- intake/context start and session list page
- company/department primary bucket selection
- source registration for document, website URL, manual note, image, and audio
- manual note save flow as an operator-origin source
- persisted intake source list and status view backed by `packages/persistence` SQLite intake repositories
- persisted batch summary with AI suggestion placeholders marked `not_generated_yet`
- source detail shell showing stored metadata and deferred provider outputs
- explicit deferred responses for provider extraction, structured context generation, website crawling, and hierarchy draft routes
- admin-web uses a thin store helper that calls `createSQLiteIntakeRepositories()` from `@workflow/persistence`; it does not own intake session/source persistence

Phase 2 does not expose video input.

---

## What Pass 2 Phase 3 added

Phase 3 adds provider integration foundations and provider job tracking without starting later flows:

- provider-agnostic extraction, STT, embedding, and intake-suggestion interfaces in `packages/integrations`
- Google extraction/OCR provider path gated by `GOOGLE_AI_API_KEY`
- Google Speech-to-Text provider path gated by `GOOGLE_STT_API_KEY`, with configurable `GOOGLE_STT_MODEL` defaulting to `chirp`
- Google embedding provider path gated by `GOOGLE_AI_API_KEY`, with configurable `GOOGLE_EMBEDDING_MODEL`
- SQLite-backed provider job, embedding job, text artifact, and AI intake suggestion repositories in `packages/persistence`
- source-level provider extraction action and status API
- source-role intake suggestion action and persisted `AIIntakeSuggestion` records
- embedding job API and persisted `EmbeddingJobRecord` records
- provider status API showing configured availability and persisted jobs
- source detail display for provider jobs, artifacts, and source-role intake triage suggestions

Missing provider credentials produce visible failed jobs. They are not converted into success.

Phase 3 does not start website crawling, crawl approval, transcript review UI, structured context generation UI, hierarchy, rollout, synthesis/evaluation, final package, or video.

---

## What Pass 2 Phase 4 added

Phase 4 builds the website crawl flow without starting later Pass 2 phases:

- website URL source integration using existing persisted `website_url` intake sources
- Crawl4AI adapter boundary in `packages/integrations`; missing `CRAWL4AI_URL` now fails visibly instead of returning stub content
- SQLite-backed crawl plan, approval, page-content, site-summary, and content-chunk repositories in `packages/persistence`
- candidate-page discovery orchestration in `packages/sources-context`, including default max pages `20` and admin options `20`, `30`, `40`, `50`
- priority/exclusion classification for homepage, about, services/solutions, departments/teams/org, policies/terms/SLA, contact, projects/case studies/portfolio, clients/customers/partners, and default exclusions/lower priority for login/signup, privacy/cookie, blog/news, careers/jobs, media galleries, query-param duplicates, and likely duplicate language variants
- admin approval/edit flow with persisted `WebsiteCrawlApproval`
- approved crawl execution through the Crawl4AI adapter only, with persisted `ProviderExtractionJob` status
- page-content drill-down shell; page-level crawl content is not shown by default on source detail
- chunk creation and Google embedding-job creation for crawl chunks when Crawl4AI returns content
- provider status shows Crawl4AI runtime config separately from Google embedding config

`GOOGLE_EMBEDDING_MODEL` is configured as `gemini-embedding-2`. The Google key is not recorded in handoff files.

In the local proof environment, Crawl4AI runtime was intentionally unavailable (`CRAWL4AI_URL` unset), so candidate discovery and approved crawl failed visibly with persisted errors. Because no crawl pages were produced, no crawl chunks or crawl-chunk embedding jobs were created in that proof run.

Phase 4 does not start audio transcript review UI, structured context generation, hierarchy intake, participant rollout, synthesis/evaluation, final package, or video input.

---

## What is proven

| Check | Result |
|---|---|
| `pnpm prove:pass2-phase1` | passed 35/35 checks |
| `pnpm build:contracts` | succeeds |
| `pnpm typecheck` | succeeds |
| `pnpm build` | succeeds |
| Phase 2 SQLite persistence proof | document, website URL, manual note, image, and audio source records registered through admin API, persisted to `apps/admin-web/data/intake-phase2.sqlite`, server restarted, and records reloaded through `packages/persistence` SQLite repositories |
| Phase 2 batch/detail proof | batch summary and source detail pages return 200 for persisted records |
| Phase 2 exclusion proof | video registration rejected; provider, extraction, crawl, structured context, and hierarchy routes return deferred 501 responses |
| Phase 2 persistence-boundary correction | app-local file-backed intake metadata store removed; no `intake-file-store` or JSON metadata persistence remains in admin-web |
| Phase 3 provider job proof | document extraction, image OCR, audio transcription, and website URL scaffold jobs created and persisted with statuses `failed` or `skipped` |
| Phase 3 SQLite restart proof | provider jobs, embedding job, and AI intake suggestion reloaded after app restart through SQLite-backed persistence |
| Phase 3 credential-gated provider proof | document/OCR failed visibly for missing `GOOGLE_AI_API_KEY`; audio transcription failed visibly for missing `GOOGLE_STT_API_KEY`; embedding failed visibly for missing `GOOGLE_AI_API_KEY`; source-role suggestion failed visibly for missing active LLM provider config |
| Phase 3 boundary proof | website crawl route remains deferred to Phase 4; structured context route remains deferred; hierarchy route remains deferred; video remains rejected |
| Phase 4 website source proof | `website_url` intake source `isrc_phase4_site` registered through existing intake source API |
| Phase 4 crawl plan proof | `POST /api/website-crawls` created persisted plan `crawlplan_2386e6df-c83c-48f8-9986-ba060c9ab9e5` with default `maxPages: 20`; discovery failed visibly with `CRAWL4AI_URL is not configured for website candidate discovery.` |
| Phase 4 max-page proof | `GET /api/website-crawls?sourceId=isrc_phase4_site` returned `defaultMaxPages: 20` and `maxPageOptions: [20,30,40,50]`; admin page rendered all four options |
| Phase 4 pre-approval proof | `POST /api/website-crawls/.../execute` before approval returned `409` with `Website crawl cannot run before admin approval is persisted.` |
| Phase 4 approval proof | `PATCH /api/website-crawls/...` persisted `WebsiteCrawlApproval` for `https://example.com` and status `approved` |
| Phase 4 approved crawl proof | approved execution returned `424` with persisted failed `ProviderExtractionJob` provider `crawl4ai`, kind `website_crawl`, status `failed`, error `CRAWL4AI_URL is not configured for approved website crawling.` |
| Phase 4 SQLite restart proof | after app restart using the same SQLite path, `GET /api/website-crawls/...` reloaded the crawl plan, approval, failed crawl job, `pageCount: 0`, `chunkCount: 0`, and no embedding jobs |
| Phase 4 admin display proof | source detail shows crawl status and hides page-level content by default; crawl approval page shows candidates/approval controls; drill-down page is the only page-level content surface |
| Phase 4 Google embedding config proof | `GET /api/provider-status` reported Google embeddings configured with model `gemini-embedding-2`; no missing Google key/model was reported |
| Phase 4 exclusion proof | video registration still rejected; no audio transcript review UI, structured context generation, hierarchy, rollout, synthesis/evaluation, final package, or video work was started |
| All prior pass proofs (6–9) | Still valid — unchanged |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec. Formally deferred by operator. | 2026-04-21 |
| OQ-003 | Session terminal-state looping. Operator confirmation required. | 2026-04-22 |
| OQ-004 | §19.6–§19.9 peer-level enrichment trigger ordering not literal in spec. | 2026-04-22 |
| OQ-005 | §21.4 conditional-section inclusion triggers not literal. | 2026-04-22 |

---

## What has NOT been built

- Authentication / authorization
- Phase 5 External Audio Review Flow
- Structured context generation
- Hierarchy intake
- Automated tests / CI
