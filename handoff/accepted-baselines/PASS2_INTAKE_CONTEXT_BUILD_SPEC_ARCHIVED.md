# Archive Header

- Status: Archived / Accepted Baseline
- Final Status: pass2_complete_after_all_proofs
- Final Main Commit: a90f963d4f3a5691638bcebccdf7a33d54eb45db
- Archive Rule: Do not edit for future implementation except archival metadata.
- Next Slice: Hierarchy Intake & Approval Build Slice

---

## Execution Log
- File Purpose: Operational build specification for the intake and context-framing stage.
- Master Plan Link: Supports the post-Pass-9 extension discipline by keeping execution detail outside the Program Master Plan.
- Workstream: Intake / Context groundwork linked to the broader extension program.
- Level: Execution
- In Scope: Company/department intake, source registration, hybrid intake, website crawling, admin review, batch summary, manual/admin notes, external audio-source intake, live admin speech-to-text dictation, structured context formation, primary department handling, use-case timing, pre-hierarchy review, and handoff seam to the later hierarchy build slice.
- Out of Scope: Video intake/analysis, hierarchy implementation, deep workflow analysis, participant session logic, synthesis/evaluation, channel integrations, and final output packaging.
- Depends On: Program Master Plan; existing accepted Pass 1–9 baseline.
- Status: Archived / Accepted Baseline
- Last Updated: 2026-04-24

## Build Execution Status
- Phase 1 Status: phase_proven, based on coding-agent report: `pnpm prove:pass2-phase1` passed 35/35 checks, including validator round-trips, SQLite save/restart round-trips, and write-phase smoke proof.
- Phase 1 Landed: Pass 2 contract entities, Draft-07 schemas, validators, durable SQLite persistence, local artifact folders, proof script, and handoff updates.
- Handoff Sequencing Correction: phase_proven. `NEXT_PASS.md` was corrected to point to Pass 2 Phase 2 — Intake Registration UI and Basic Admin Surfaces before Phase 2 began.
- Phase 2 Status: phase_proven after correction. The app-local file-backed intake metadata store was removed, `apps/admin-web/lib/store.ts` now acts as a thin wrapper over SQLite-backed repositories from `@workflow/persistence`, and source/session/batch records were proven to persist through SQLite-backed storage across restart.
- Phase 2 Landed: intake start/list surfaces, company/department bucket selection, source registration for document/website/manual_note/image/audio, manual note save flow, source status list, batch summary, source detail shell, video rejection, and deferred 501 boundaries for later phases.
- Phase 2 Boundary Proof: providers, crawling, transcription, embeddings, structured-context generation, hierarchy, rollout, synthesis/evaluation, final package, and video input remained unstarted during Phase 2.
- Phase 3 Status: phase_proven. Provider job contracts/types, SQLite-backed provider/embedding/artifact/suggestion persistence, provider orchestration, Google-gated provider foundations, source-role suggestion action, extraction job action, embedding job action, and minimal admin provider-status surfaces were added.
- Phase 3 Proof: build/typecheck passed. Runtime proof created provider jobs for document, image, audio, and website URL. Missing credentials produced visible persisted failed jobs for document/OCR, audio STT, embedding, and source-role suggestion; website URL job was skipped as Phase 4 deferral. Restart proof reloaded persisted provider jobs from SQLite. Source detail labels AI suggestion as source-role intake triage, not deep reference analysis.
- Phase 3 Boundary Proof: website crawl, structured context, hierarchy, transcript review, final package, and video remained deferred/rejected and were not started.
- Overall Pass 2 Status: pass2_not_complete.
- Phase 4 Status: phase_proven with crawler-runtime caveat. Website crawl UI, max page options 20/30/40/50, approval controls, pre-approval guard, execution action, page-content drill-down, crawler failure persistence, and crawl-to-embedding wiring were implemented. Runtime proof showed missing Crawl4AI runtime configuration as a visible configuration failure, not fake success. Google embedding configuration was present with `gemini-embedding-2` and no key/model missing error.
- Phase 4 Runtime Caveat: actual crawl success, page-level content persistence, chunk creation, and crawl-chunk embedding generation still require a real successful crawl through an approved `CrawlerAdapter`. This may be Crawl4AI, Crawlee/Playwright, Firecrawl, or another explicitly approved adapter. This does not block moving through later Pass 2 phases, but it remains required before overall Pass 2 can be called complete.
- Phase 4 Boundary Proof: external audio transcript review UI, structured context generation, hierarchy intake, participant rollout, synthesis/evaluation, final package, and video input remained unstarted.
- Main Integration Status: accepted Phase 1–4 work was merged into `main` with commit `3feff8dd7c88eb9d2cee2048ea058d2a97a8edf1`. Merge proof on `main`: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed. Phase 5 was not started during the merge.
- Pre-Phase-5 Worktree Status: clean. `data/test-pass2.db` was removed as an untracked proof/test database. Current branch is `main` at commit `3feff8dd7c88eb9d2cee2048ea058d2a97a8edf1`. Phase 5 has not started yet.
- Overall Pass 2 Status: pass2_not_complete.
- Phase 5 Status: phase_proven. Real Google Speech-to-Text proof succeeded after local `.env.local` STT config was activated. Provider job `pjob_ca7c410f-a3c6-417e-9b35-1cc2265ff123` succeeded with provider `google_speech_to_text`, job kind `audio_transcription`, source `isrc_phase5_real_audio`, and raw transcript artifact `artifact_7d2d2f25-0cb6-429e-a353-7000839799a0`.
- Phase 5 Proof: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed. Raw transcript appeared as `transcript_ready_for_review` and did not become trusted text before admin approval. Approve-as-is and edit flows created trusted artifacts, chunks, and Google embedding jobs. Reject/mark-retry returned the review state to `transcript_rejected_or_needs_retry` and cleared the current trusted artifact. Restart proof reloaded provider job, raw transcript artifact, review state, chunks, and embedding jobs from SQLite-backed persistence.
- Phase 5 STT Strategy Update: external audio default was changed from `latest_short` to Google Speech-to-Text V1 `latest_long`. `chirp_3` remains available only when explicitly configured through a V2 path; it is not faked as a V1 model. Real V1 transcription succeeded with provider job `pjob_11785a61-8f81-418b-8776-1a3a22f88249`, persisted model `latest_long`, and raw transcript artifact `artifact_9b1bd72b-c636-46ad-a88c-5f130b780c7d`.
- Phase 5 Quality Note: the updated `latest_long` proof returned low-to-moderate confidence (`0.2983227`, average confidence `0.298`). This improves over the earlier `latest_short` proof but remains review-sensitive. It does not block Phase 5 because external audio transcripts require admin review before becoming trusted text, but low-confidence transcripts should remain visibly review-sensitive in the UI.
- Whisper Decision: local Whisper is not included in the current Phase 5 path. Do not add Whisper fallback unless explicitly reopened later.
- Phase 5 Boundary Proof: structured context generation, hierarchy intake, participant rollout, synthesis/evaluation, final package, video input, and Phase 6 remained unstarted.
- Overall Pass 2 Status: pass2_not_complete.
- Main Integration Status After Phase 5: accepted Phase 5 and STT strategy update were merged into `main` by fast-forward from `3feff8dd7c88eb9d2cee2048ea058d2a97a8edf1` to `c93b6cff65808bb0f9ddd2219056214259c19af6`.
- Main Proof After Phase 5 Merge: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed on `main`. `git status --short` was clean. `.env.local` was not committed and no tracked `.env/.env.local` file exists.
- Phase 6 Status: not started.
- Overall Pass 2 Status: pass2_not_complete.
- Phase 6 Status: phase_proven. Department/use-case framing, custom department mapping, context availability decisions, use-case readiness guard, admin-created structured context records, field evidence traceability, SQLite-backed persistence, and admin/API surfaces were implemented and proven.
- Phase 6 Proof: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed. Readiness guard blocked before use case selection. Custom department label remained company-facing while internal mapping decisions were proven across accepted/edited/rejected/unknown. Company and department context statuses were non-blocking. Same-as-department and custom use case selection were proven. Structured context persisted, separated company fields from department/use-case fields, and field evidence linked operator notes, website source, and admin confirmations. Restart proof reloaded records through SQLite-backed persistence.
- Phase 6 Boundary Proof: video remains rejected. Hierarchy route remains deferred. Hierarchy intake/draft generation, source-to-role linking, rollout, synthesis/evaluation, final package, and video were not started. No env files/secrets were committed.
- Phase 6 Correction Note: handoff wording was corrected before Phase 7. `NEXT_PASS.md` now identifies the next phase exactly as Pass 2 Phase 7 — Final Pre-Hierarchy Review, with explicit boundary language excluding hierarchy intake, hierarchy draft generation, source-to-role linking, participant targeting, and rollout readiness. Hierarchy intake begins after Pass 2 in a separate hierarchy build slice.
- Overall Pass 2 Status: pass2_not_complete.
- Phase 7 Status: phase_proven. Final Pre-Hierarchy Review record, SQLite-backed repository, readiness guard, final review API/admin screen, admin confirmation, and handoff updates were implemented and proven.
- Phase 7 Proof: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed. Missing primary/framing, missing use case, and missing structured context correctly blocked with 409. Satisfied Phase 6 data generated final review `final_pre_hierarchy_87653776-1245-4973-b77b-bb244da9bde5`. Review displayed company/department statuses, selected department/use case, source summary, structured context summary, evidence summary, Crawl4AI runtime caveat, and low-confidence transcript note. Admin confirmation persisted and restart proof reloaded the confirmed review from SQLite.
- Phase 7 Boundary Proof: hierarchy draft route remains deferred, video remains rejected, and hierarchy intake/draft generation, source-to-role linking, participant targeting, rollout readiness, synthesis/evaluation, final package, provider/crawl/audio-review expansion, and video were not started.
- Security Proof: `.env.local` and related env files were not tracked; secret scan found no key values.
- Crawler Runtime Caveat Status: resolved. A real website crawl succeeded through approved `fetch_html` CrawlerAdapter using native fetch, same-domain candidate extraction, page text extraction, and the existing crawl approval/persistence flow. Crawl4AI remains adapter-supported when `CRAWL4AI_URL` is configured.
- Crawler Proof: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed. Crawl plan `crawlplan_42243cf3-5e8b-464f-a8b7-4c6df9ada877` preserved default maxPages `20` and options `[20,30,40,50]`. Pre-approval execution blocked with `409`. Approval `crawlapproval_207bed47-dbea-4bf9-8b44-9152733fc76c` persisted. Crawl job `pjob_ce9c55e6-4848-4858-8d5f-28c20a70a665` succeeded. Page count `1`, chunk count `1`, site summary `crawlsummary_bfe20d04-595b-4ab1-9137-cc06f272db03`, embedding job `embedjob_43d5aa65-a089-41c3-9b0b-f8f2b7222964` succeeded with `gemini-embedding-2`. Restart proof succeeded and traceability linked page/chunk/embedding back to source `isrc_crawler_caveat_site` and crawl plan.
- Crawler Boundary Proof: hierarchy route remains deferred. Rollout, synthesis/evaluation, final package, and video were not started. Phase 5 audio logic was not changed. No env files were tracked and no committed key values were found.
- Main Integration Status After Crawler Resolution: crawler-runtime caveat fix was merged into `main` by fast-forward from `c93b6cf` to `44a004c55cd426b414ff735ee53c266550ecb0fa`.
- Main Proof After Crawler Resolution Merge: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed on `main`. `git status --short` was clean. `.env.local` was not committed, tracked env-file check returned nothing, and secret scan found no key values.
- Boundary Proof After Crawler Resolution Merge: hierarchy, rollout, synthesis/evaluation, final package, and video were not started.
- Crawler Runtime Caveat: resolved on `main` through the `fetch_html` CrawlerAdapter.
- Final Section 19 Acceptance Review Status: pass2_not_complete. Final review on `main` commit `44a004c55cd426b414ff735ee53c266550ecb0fa` passed `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build`, but not every Section 19 proof was satisfied.
- Section 19 Missing Proofs: real Google document extraction success; real Google OCR/image extraction success; real AI source-role suggestion success; admin confirm/edit/override/mark-review flow for AI source-role/scope suggestions; live admin dictation through configured STT; manual note structuring through active LLM provider; structured context formation through real active LLM provider path; documented local file/artifact storage locations; documented local DB initialization and development reset commands.
- Section 19 Proven Areas: intake flow, buckets, source kinds, batch/detail views, company/department optionality, use-case requirement, video/hierarchy boundaries, real STT/audio review, crawler adapter proof, chunks/embeddings, durable SQLite persistence, structured context separation/evidence, required admin screens except source-role override, and build quality commands.
- Boundary Confirmation: no hierarchy intake, rollout, synthesis/evaluation, final package, or video work was started.
- Pass 2 Final Status: pass2_complete_after_all_proofs. The acceptance closure patch was finalized and committed on `main` at `a90f963d4f3a5691638bcebccdf7a33d54eb45db`.
- Final Source-Role Vocabulary Status: aligned. `company_overview` is now an explicit `IntakeSourceRole` contract value, included in the `ai-intake-suggestion` schema, normalized by the Google provider, and documented in `handoff/PASS2_LOCAL_PERSISTENCE.md`.
- Final Main Verification: `pnpm build:contracts`, `pnpm typecheck`, and `pnpm build` passed on committed `main`. Secret scan found no obvious Google/API key patterns. `git status --short` was clean.
- Final Handoff Status: `handoff/CURRENT_STATE.md` marks Pass 2 as `pass2_complete_after_all_proofs`. `handoff/NEXT_PASS.md` points to `Hierarchy Intake & Approval Build Slice`.
- Final Boundary Confirmation: no `.env.local`, secrets, or test DB files were committed. No hierarchy, rollout, synthesis/evaluation, final package, or video work was started.
- Next Build Slice: Hierarchy Intake & Approval Build Slice, separate from Pass 2.

# Pass 2 — Intake & Context Build Spec

## Archive Closure Record

- Closure Status: Accepted and archived.
- Final Repository Status: `pass2_complete_after_all_proofs`.
- Final Main Commit: `a90f963d4f3a5691638bcebccdf7a33d54eb45db`.
- Closure Basis: All Section 19 acceptance proofs were satisfied, committed to `main`, and verified with build/typecheck/build proof.
- Final Verification Commands:
  - `pnpm build:contracts` — passed
  - `pnpm typecheck` — passed
  - `pnpm build` — passed
- Final Handoff Files:
  - `handoff/CURRENT_STATE.md` marks Pass 2 as `pass2_complete_after_all_proofs`.
  - `handoff/NEXT_PASS.md` points to `Hierarchy Intake & Approval Build Slice`.
- Final Boundary Confirmation:
  - No hierarchy intake was started.
  - No rollout/participant targeting was started.
  - No synthesis/evaluation was started.
  - No final package work was started.
  - Video remains outside Pass 2.
  - No `.env.local`, secrets, or test DB files were committed.
- Archive Rule: This file is now a historical accepted execution reference. Do not edit it for future implementation except to add archival metadata. Pass 3 / hierarchy work must begin in a separate build spec.

## 1. Purpose

This document contains the executable build decisions for the intake and context-framing stage.
It is intentionally separate from the Program Master Plan.
The master plan stays fixed as the high-level reference.
This file holds the operational rules that can evolve during build.

---

## 2. Scope of This Spec

This spec covers only the early intake and context-framing layer before hierarchy-driven participant rollout and before workflow analysis proper.

Included here:

* company / department intake entry
* source registration
* hybrid intake behavior
* website crawling rules
* admin review surfaces
* batch summary behavior
* manual/admin note handling
* structured context formation
* primary department handling
* use-case timing
* pre-hierarchy review step
* handoff seam to the later hierarchy build slice

Not included here:

* hierarchy intake implementation
* hierarchy draft generation
* hierarchy correction or approval flow
* hierarchy readiness gate
* source-to-role or source-to-node linking
* participant targeting or rollout readiness
* deep workflow analysis
* participant session logic
* synthesis / evaluation
* channel integrations
* final output packaging

### 2.1 Build Boundary / Stop Point

This build slice ends when the system can show a concise final pre-hierarchy review after:

* intake materials have been registered
* AI-assisted batch summary has been produced
* admin decisions or overrides have been captured where needed
* structured context has been formed
* one primary department has been selected by the admin
* one use case has been selected by the admin after context formation

This build slice must not build the hierarchy workflow itself.
The next build slice begins with hierarchy intake, draft hierarchy generation, hierarchy correction, hierarchy approval, source-to-role visibility, and readiness gates for participant targeting.

---

## 3. Governing Principles

1. The master plan remains unchanged and is not the place for build-detail drift.
2. Intake should be AI-assisted but admin-controlled.
3. Extraction and provider usage should remain provider-flexible.
4. Google is the default extraction-facing provider in this stage.
5. OpenAI remains wired and swappable but is not the default extraction provider at this stage.
6. The system should preserve traceability between operator-origin inputs, external sources, and AI-structured interpretations.

---

## 4. Intake Entry Model

### 4.1 Primary intake buckets

At the beginning of intake, the admin must choose one primary bucket:

* Company
* Department

### 4.2 Hybrid intake opening

After selecting Company or Department, intake is hybrid:

* source upload / website / documents if available
* manual context note if needed

The admin is not forced into source-only or note-only entry.

### 4.3 Official input types in this slice

The first intake slice officially supports:

* document upload
* website URL
* manual note
* image
* audio

### 4.4 Company Context vs Department Context Separation

Pass 2 must preserve a clear separation between two different intake contexts.

Company context is not mandatory before department context.
The admin may start with company-level material, department-level material, or both.
If no company-level material is available, the admin may confirm and continue to department intake directly.
The absence of company context should be visible as a non-blocking context gap or warning, not as a hard stop.

1. **Company Context**
   This covers organization-wide material that helps the system understand the company as a whole.
   Examples include:

   * company profile
   * company website
   * company presentation
   * service catalog
   * vision / mission material
   * general capability summary
   * company-wide policies when they apply broadly

2. **Department Context**
   This covers the specific department or function being analyzed in the case, such as HR, IT, Sales, Operations, Finance, Legal, or another selected department.
   Examples include:

   * department-specific SOPs
   * department KPIs
   * department policies
   * department role documents
   * team/unit documents
   * department-specific SLA or service references
   * department workflow notes
   * department-specific uploaded audio/image/document sources

Company context and department context must not be collapsed into one undifferentiated input pool.
The system may use both to form structured context, but it must preserve which signals came from company-level material and which came from department-level material.

The selected primary department is the main analytical anchor for the case.
Company context supports understanding and framing; department context is closer to the workflow area that will later be analyzed.

### 4.4A Company Context Availability Rule

The system must support at least three company-context availability states:

* `company_context_provided`
* `company_context_skipped_by_admin`
* `company_context_pending_or_unknown`

When company context is skipped, the system should allow the admin to continue to department intake.
However, the final pre-hierarchy review must show that company context was skipped or remains unavailable.

Skipping company context does not invalidate the case.
It only reduces company-level framing confidence until later company-level material or notes are added.

### 4.4B Department Context Availability Rule

Department context is not the same as department documents.

A selected department may have:

* uploaded department documents
* department KPIs or performance references
* department policies
* department SOPs or workflow references
* department manual notes
* department audio/image/document sources
* or no department documents at all

The absence of department documents must not block the case by itself.
The admin may confirm that no department documents are currently available and proceed toward the hierarchy build slice.

The system must support at least four department-context availability states:

* `department_context_provided`
* `department_documents_not_available_confirmed`
* `department_context_skipped_by_admin`
* `department_context_pending_or_unknown`

If no department documents or notes are available, the final pre-hierarchy review must show that the next hierarchy slice becomes the primary path for capturing department structure, roles, and later participant targeting basis.

This does not mean hierarchy is implemented inside Pass 2.
It means Pass 2 records that department-document context is unavailable and prepares a clean handoff to hierarchy intake.

### 4.5 Source Role Suggestion Boundary

Pass 2 may use AI to suggest a source role during intake, but this is not deep reference analysis.

The purpose of AI-suggested source role is to help the admin organize incoming material and decide where each source belongs.
It does not decide workflow truth, document quality, reference suitability, or final documentation direction.

Deep reference suitability, workflow comparison, process analysis, and documentation-quality judgment belong to later analysis layers.

---

## 5. Source Registration and Status

### 5.1 Pre-analysis upload visibility

Before deep analysis starts, the system must show a clear intake-status view indicating:

* how many documents/resources were received
* which ones uploaded successfully
* which ones failed or need retry
* the initial bucket they entered under
* the initial pre-analysis status

### 5.2 Minimum status set

The minimum status set is:

* uploaded
* read
* failed
* pending analysis
* needs review

### 5.3 Status Simplicity Rule

Pass 2 should not over-engineer source status modeling.

The admin-facing system only needs to make the practical state of each source clear:

* was it received?
* was it read or extracted?
* did it fail?
* does it need admin review?
* has the admin confirmed, edited, or rejected the AI-suggested source role/scope?

A separate `aiSuggestionStatus` layer is not required in Pass 2.
AI suggestion existence can be inferred from the presence or absence of `AIIntakeSuggestion` records.

The build should preserve only the status information needed for traceability and admin control, without turning intake into a complex state-machine exercise.

---

## 6. Batch Summary First

After intake confirmation, the system must first provide a batch summary of all received inputs.
Only after that may the admin drill down document by document.

### 6.1 Minimum fields shown in the batch summary

For each received document/resource, the batch summary must show at minimum:

* document/resource name
* primary bucket (Company or Department)
* current status
* AI-suggested source role
* AI-suggested scope
* confidence level
* a very short reason for the suggestion

---

## 7. AI-Led but Admin-Controlled Intake

The AI inspects incoming material first and may suggest:

* classification
* scope
* confidence
* short rationale

The admin confirms, edits, or overrides these suggestions.
Documents and context must support flexible attachment scope:

* company-level
* department-level
* team/unit-level
* role-level
* person-level
* shared
* unknown

---

## 8. Provider Architecture

### 8.1 Multi-provider rule

Google tools and OpenAI models must both be available through a provider-agnostic architecture.
Do not hard-code future work to one provider.

### 8.2 Default provider direction for this stage

Google is the default extraction-facing provider because it covers:

* OCR
* document extraction
* speech-to-text for audio
* related ingestion capabilities

OpenAI remains wired and available so it can be swapped in later without architecture change.

### 8.3 Website Crawler Adapter Rule

Website ingestion uses a dedicated crawler adapter layer.

The crawler tool itself is not a strategic requirement.
The requirement is that the selected crawler adapter works correctly end-to-end inside Pass 2.

Approved crawler adapter options may include:

* `crawlee_playwright` as a TypeScript-first local crawler option
* `crawl4ai` as an optional crawler adapter when its runtime/service is configured
* `firecrawl` as an optional managed crawler adapter when its API/configuration is available

Google URL-level tools may be used only as page-level helpers when useful, not as the main crawler layer.

The default local crawler should be whichever approved adapter can be proven end-to-end in the current repository environment with the least runtime friction.
The implementation must remain adapter-based so the crawler can be swapped without changing intake, persistence, review, chunking, embedding, or final review logic.

### 8.4 Full Provider-Backed Build Rule

Pass 2 must be built as a real provider-backed intake and context system within the boundaries of this spec.

This means the build must include working extraction paths for the official input types in this slice:

* document upload
* website URL
* manual note
* image
* audio

The system may still use provider-agnostic interfaces, but those interfaces must be backed by real provider calls where the provider capability is required for this slice.

Stub-only behavior is not acceptable as a completion claim for Pass 2.
A stub may exist only as a local development fallback or test fixture, and it must be visibly labeled as such.

### 8.5 Mandatory Provider Mapping for Pass 2

The default provider mapping for this build slice is:

* documents and OCR-capable images: Google Document AI / Google OCR-capable document extraction path
* image text extraction where needed: Google OCR-capable path
* audio transcription: Google Speech-to-Text path
* website crawling: Crawl4AI default crawler layer
* manual notes: internal AI structuring path through the active LLM provider
* AI source-role suggestion, scope suggestion, rationale, and structured context formation: active LLM provider behind the provider-agnostic interface
* embeddings for extracted/approved text and crawl outputs: Google embedding provider path by default

OpenAI must remain available behind the provider architecture, but Google is the default extraction-facing and embedding-facing provider for this slice.

The implementation should not hard-code a single permanent embedding model name inside business logic. The active Google embedding model should be configurable through provider configuration or environment settings.

### 8.6 Provider Completion Rule

Pass 2 may be called complete only when the provider-backed paths needed for its official input types are proven through real execution evidence.

At minimum, proof must show:

* one real document extraction path
* one real OCR/image extraction path when image is supported
* one real audio transcription path when audio is supported
* one real website crawl path through the crawler layer
* one real manual-note structuring path
* one real AI-suggestion / structured-context generation path
* visible provider job status in the admin surface
* failure handling for at least one provider failure case

Video intake and video analysis are outside the scope of Pass 2.

No provider-backed intelligence should be claimed unless the capability works end-to-end.

---

## 9. Audio Modes Must Stay Separate

Audio must support two distinct modes:

1. **External audio-file intake** — audio files uploaded or imported as company/department intake sources.
2. **Live admin speech-to-text dictation** — the admin speaks to the system to produce transcript text for faster note writing, instructions, or long-form context entry.

These modes stay separate in architecture, status tracking, and UX even if they share providers underneath.

### 9.1 External Audio-File Intake

External audio files are case sources.

They must be registered as `sourceKind = audio` under the selected intake bucket and must follow the same source registration, provider-job tracking, batch summary, AI suggestion, admin review, and structured-context traceability rules as other intake sources.

For this mode, the required path is:

* upload/import audio file
* register it as an intake source
* create a provider transcription job
* produce transcript or extraction output
* show transcription status in the intake/batch surface
* show the transcript to the admin for review before it is allowed to influence structured context
* allow the reviewed or admin-approved transcript to support AI classification, scope suggestion, and structured context formation

### 9.2 External Audio Transcript Review Rule

External audio-file transcripts must be admin-reviewable before they influence structured context formation.

The system should preserve at minimum:

* original audio source reference
* raw transcript produced by the provider
* provider confidence or quality signal when available
* admin-edited transcript when edited
* admin approval status
* timestamp of approval or edit

Minimum transcript review statuses:

* `transcription_pending`
* `transcript_ready_for_review`
* `transcript_edited_by_admin`
* `transcript_approved`
* `transcript_rejected_or_needs_retry`

Only `transcript_approved` or `transcript_edited_by_admin` may be used as trusted text for structured context formation.

A raw unreviewed transcript may be visible as a draft, but it must not be treated as approved case context.

### 9.3 Live Admin Speech-to-Text Dictation

Live admin dictation is not automatically an external company source.

It is an operator-origin input method used to create text faster inside the admin application.
It may be used for:

* manual company context notes
* manual department context notes
* admin comments
* long-form instructions
* clarification or correction notes inside the admin surface

The dictation transcript becomes a case source only when the admin explicitly saves or submits it as a manual note or other supported operator-origin record.

The system must preserve traceability between:

* the admin's spoken input
* the transcript produced by speech-to-text
* any edited text submitted by the admin
* the AI-structured context derived from that submitted text

### 9.4 Speech-to-Text Provider Direction

The preferred speech-to-text path for this stage is Google Speech-to-Text using the strongest available Chirp-family model suitable for the use case and region.

OpenAI Whisper or another OpenAI speech path may remain available as a fallback or swappable provider behind the same provider abstraction.

The system must not treat live dictation transcripts and external audio-source transcripts as the same artifact type, even if both are produced by the same underlying speech provider.

External audio-source transcripts require admin review before use in structured context.
Live admin dictation follows the manual/admin note path and becomes relevant only when the admin saves or submits the dictated text.

---

## 10. Website Intake Rules

### 10.1 Smart crawl scope with admin control

The first website crawl uses smart page selection with a default maximum of 20 pages inside the same domain.
This maximum is admin-configurable from the UI, for example:

* 20
* 30
* 40
* 50

Before crawling starts, the admin must see the candidate pages the crawler identified and explicitly approve the crawl.

This behavior is locked for Pass 2 and should not be reopened unless a real implementation blocker appears.
Website intake in Pass 2 is a full flow, not a URL-only placeholder.

### 10.2 Default priority pages for smart crawl

Priority order:

1. homepage
2. about
3. services / solutions
4. departments / teams / organization
5. policies / terms / SLA-related pages
6. contact
7. projects / case studies / portfolio
8. client list / customers / partners

Blog/news/careers remain lower priority or excluded by default unless the admin chooses them.

### 10.3 Default exclusion rules

Exclude by default before admin approval:

* login / signup pages
* cookie/privacy-only utility pages when they add no operational value
* blog/news archive pages
* careers/jobs pages
* media gallery-only pages
* duplicate URLs created by query parameters
* duplicate language variants when they represent the same content

The admin may re-include excluded pages if needed.

### 10.4 Website output after crawl approval

The default admin-facing output after crawl approval is a site-level summary only.
Detailed page-level extracted content may remain stored internally for retrieval, system use, or later review, but it is not the default visible layer.

### 10.5 Minimum site-level website summary contents

The minimum site-level summary must cover:

1. who the company appears to be
2. what services it appears to provide
3. the visible domain / subtype signal
4. the visible departments / units
5. visible projects / clients / partners when present
6. the most important signals or notes that may affect later analysis

### 10.6 Website Crawl and Embedding Requirement

Approved website crawl output must not remain only as raw extracted page text.

After the approved crawl is completed, the system must:

* preserve site-level summary for admin review
* preserve page-level extracted content internally
* create chunkable text records for retrieval where useful
* generate embeddings for approved crawl outputs through the configured Google embedding provider path
* preserve traceability from embedding/chunk records back to source URL and crawl plan
* avoid showing detailed page-level content by default unless the admin drills down

The embedding layer supports later retrieval and context formation.
It does not perform workflow analysis by itself and must not be treated as proof that reference suitability or workflow comparison has been completed.

---

## 11. Manual / Admin Context Notes

### 11.1 Input modes

Manual company/department context notes may enter as:

* direct typed text
* live speech-to-text transcript from the admin

Both are operator-origin inputs, not external company sources.

### 11.2 Transformation rule

Operator notes do not remain as raw free text only.
The AI may transform them into internal structured context for later use.
If retrieval/search is triggered later from that note, the system must preserve traceability between:

* what the operator originally said
* what the AI structured from it
* what was later retrieved from other sources

---

## 12. Structured Context Model

### 12.1 Minimum structured context fields after AI transformation

* company_name
* company_scope_summary
* domain
* subtype_or_operating_model (if visible)
* visible_services_or_products
* main_department
* sub_unit_or_team (if visible)
* visible_role_families_or_org_signals
* key_context_signals_and_risks
* confidence_and_unknowns

This set is intentionally cross-domain and should work across logistics, HR, legal, IT, medical, and other company shapes without assuming one rigid business model.

### 12.2 Department handling in structured context

Structured context may contain more than one visible department or organizational unit when the sources show them.
However, each case must designate one primary department as the main analytical anchor.

### 12.3 Primary department authority

The primary department is determined by the admin, not auto-selected by the AI.
The AI may surface visible departments or organizational signals, but authority remains with the admin.

---

## 13. Use-Case Timing

The use case is not locked at the beginning.
It is determined after:

* context gathering
* early company/department understanding
* structured context formation
* primary department selection

The admin sets it after seeing enough context rather than locking it too early.

### 13.1 Use Case Is Required Before Final Pre-Hierarchy Review

A selected use case is required before Pass 2 can reach the final pre-hierarchy review.

The system must not hand off to hierarchy intake with only a broad department selected and no use-case boundary.
This is because hierarchy relevance, role targeting, and later participant selection depend on what part of the department is being studied.

### 13.2 Use Case Scope Inside the Department

The selected use case may represent:

* the whole selected department workflow area
* a specific workflow inside the department
* a specific function inside the department
* a specific role group inside the department
* a specific service or operational path owned by the department

Examples:

* Sales as the selected department, with Client Onboarding as the use case
* Sales as the selected department, with Key Account Management as the use case
* HR as the selected department, with Employee Onboarding as the use case
* IT as the selected department, with Access Request Handling as the use case

The department remains the organizational anchor.
The use case defines the analytical boundary inside or around that department.

### 13.3 Department and Use Case Selection Rule

The primary department should be selected from a controlled dropdown list, with an `Other / Custom Department` option.

The dropdown preserves consistency for common departments, while the custom option preserves real company naming when the department name is unusual, local, hybrid, or not represented in the default list.

When `Other / Custom Department` is used, the system must preserve:

* the custom department label as entered by the admin
* the AI-suggested internal department-family mapping when available
* whether the admin accepted, edited, or rejected that suggested mapping
* the final active department label used for the case

The custom department label remains the real company-facing department name.
The internal department-family mapping is only an organizational aid for later configuration, prompt overlays, reporting, and analysis support.
It must not overwrite the company's actual department label.

Minimum internal department-family examples:

* `sales`
* `operations`
* `hr`
* `it`
* `finance`
* `legal`
* `customer_support`
* `procurement`
* `marketing`
* `other_or_unknown`

If the AI suggests a mapping, the admin must be able to accept, edit, reject, or leave it unknown.

The use case belongs under the selected department and may be defined in one of two ways:

1. **Whole Department Use Case**
   The admin may set the use case to the same name as the selected department.
   This means the case studies the selected department as a whole.

2. **Custom Department-Specific Use Case**
   The admin may enter a custom use case that represents a specific part of the selected department.
   This may be a workflow, function, service path, operational segment, or role group inside that department.

Examples:

* Department: `Sales`; Use Case: `Sales` → the whole Sales department is the use case.
* Department: `Sales`; Use Case: `Client Onboarding` → a specific workflow inside Sales.
* Department: `Sales`; Use Case: `Key Account Managers` → a role-group-specific slice inside Sales.
* Department: `HR`; Use Case: `Employee Onboarding` → a specific HR workflow.

The system must preserve whether the selected use case is:

* same-as-department
* custom department-specific
* needs admin review

This gives the admin a simple model: choose the department from the dropdown, then either study the whole department or define the specific slice inside it.

### 13.4 Use Case Boundary Status

The system must support at least the following use-case boundary statuses:

* `use_case_not_selected`
* `use_case_same_as_department`
* `use_case_selected_custom`
* `use_case_needs_admin_review`

Only `use_case_same_as_department` or `use_case_selected_custom` may pass the final pre-hierarchy review.

---

## 14. Final Review Before Hierarchy

After:

* context gathering
* structured context formation
* primary department selection
* use-case selection

the system shows a final concise review screen before moving into hierarchy/org-structure work.

Use-case selection is mandatory before this screen can be considered ready for handoff.

The final pre-hierarchy review must explicitly show:

* company-context availability status
* department-context availability status
* selected primary department
* selected use case and use-case boundary status
* whether the use case is same-as-department or custom department-specific
* whether department documents or notes were provided
* whether the admin confirmed that no department documents are currently available
* unresolved context risks or unknowns
* that hierarchy intake is the next build slice when department structure still needs to be captured

---

## 15. Handoff to Next Build Slice — Hierarchy Intake

Hierarchy intake is not implemented inside this Pass 2 build slice.

Pass 2 only prepares the handoff point by producing a final pre-hierarchy review screen that confirms:

* the current intake set
* the structured context record
* the selected primary department
* the selected use case
* any unresolved context risks or unknowns that may affect hierarchy work

The next build slice should own hierarchy intake and approval logic, including:

* pasted text / written hierarchy structure
* uploaded org-chart or hierarchy document
* AI-generated draft hierarchy
* hierarchy node model
* admin correction flow
* hierarchy approval flow
* source-to-role or source-to-node linking
* readiness gate from hierarchy to participant targeting

This separation prevents Pass 2 from expanding into participant targeting, rollout readiness, or hierarchy-governed analysis before intake and context formation are stable.

---

## 16. Minimal Build Contracts

### 16.1 Contracts-First Rule

Pass 2 is contracts-first.

The coding agent must define the minimal intake/context contracts before wiring UI behavior or API routes around free-form objects.

The goal is not to finalize the full future data model.
The goal is to prevent intake, source registration, AI suggestions, admin overrides, provider jobs, website crawl planning, and structured context from being scattered across UI-only shapes or ad hoc route payloads.

### 16.2 Required Contract Set

Pass 2 must define at minimum the following contracts:

* `IntakeSourceRecord`
* `IntakeBatchRecord`
* `IntakeBatchSummaryItem`
* `AIIntakeSuggestion`
* `AdminIntakeDecision`
* `StructuredContextRecord`
* `StructuredContextFieldEvidence`
* `ProviderExtractionJob`
* `ContentChunkRecord`
* `EmbeddingJobRecord`
* `WebsiteCrawlPlan`
* `WebsiteCrawlCandidatePage`
* `WebsiteCrawlApproval`
* `WebsiteSiteSummary`

These contracts may be minimal in this build slice, but their existence is required before the feature is considered structurally buildable.

### 16.3 `IntakeSourceRecord`

Purpose:
Represents one source or input received during intake.

Minimum fields:

* `sourceId`
* `caseId`
* `sourceName`
* `sourceKind`
* `primaryBucket`
* `initialAttachmentScope`
* `processingStatus`
* `adminReviewStatus`
* `receivedAt`
* `originType`
* `operatorProvided`
* `storageRef` or `contentRef` when applicable
* `metadata`

Allowed `sourceKind` values for this slice:

* `document`
* `website_url`
* `manual_note`
* `image`
* `audio`

Allowed `primaryBucket` values:

* `company`
* `department`

Allowed attachment-scope values:

* `company_level`
* `department_level`
* `team_or_unit_level`
* `role_level`
* `person_level`
* `shared`
* `unknown`

### 16.4 `IntakeBatchRecord`

Purpose:
Groups intake sources processed together for batch review.

Minimum fields:

* `batchId`
* `caseId`
* `createdAt`
* `sourceIds`
* `batchStatus`
* `summaryGeneratedAt`
* `createdBy`

Minimum `batchStatus` values:

* `created`
* `summary_pending`
* `summary_ready`
* `needs_admin_review`
* `confirmed`

### 16.5 `IntakeBatchSummaryItem`

Purpose:
Represents the admin-facing summary row for one received source.

Minimum fields:

* `sourceId`
* `sourceName`
* `primaryBucket`
* `processingStatus`
* `aiSuggestedSourceRole`
* `aiSuggestedScope`
* `confidenceLevel`
* `shortReason`
* `adminReviewStatus`

Minimum suggested source-role values for this slice:

* `company_context`
* `organizational_context`
* `department_context`
* `policy_reference`
* `sop_or_workflow_reference`
* `service_level_or_sla_reference`
* `performance_or_kpi_reference`
* `role_or_responsibility_reference`
* `questionnaire_or_intake_form`
* `website_context`
* `manual_operator_note`
* `audio_transcript_source`
* `image_or_scanned_source`
* `unknown_or_needs_review`

### 16.6 `AIIntakeSuggestion`

Purpose:
Stores the AI-generated suggestion before admin confirmation or override.

Minimum fields:

* `suggestionId`
* `sourceId`
* `suggestedSourceRole`
* `suggestedScope`
* `confidenceLevel`
* `shortRationale`
* `evidenceRefs`
* `createdAt`
* `providerJobId` when applicable

Minimum `confidenceLevel` values:

* `high`
* `medium`
* `low`
* `unknown`

### 16.7 `AdminIntakeDecision`

Purpose:
Stores the admin's final decision after reviewing AI suggestions.

Minimum fields:

* `decisionId`
* `sourceId`
* `confirmedSourceRole`
* `confirmedScope`
* `decisionType`
* `overrideReason` when applicable
* `decidedBy`
* `decidedAt`

Minimum `decisionType` values:

* `confirmed_ai_suggestion`
* `edited_ai_suggestion`
* `overridden_by_admin`
* `marked_needs_review`

### 16.8 `StructuredContextRecord`

Purpose:
Stores the structured context produced after intake review and AI transformation.

Minimum fields:

* `contextId`
* `caseId`
* `companyName`
* `companyScopeSummary`
* `companyContextSummary`
* `companyContextAvailabilityStatus`
* `departmentContextAvailabilityStatus`
* `domain`
* `subtypeOrOperatingModel`
* `visibleServicesOrProducts`
* `visibleCompanyLevelSignals`
* `mainDepartment`
* `selectedUseCase`
* `useCaseBoundaryStatus`
* `useCaseScopeType`
* `departmentContextSummary`
* `subUnitOrTeam`
* `visibleRoleFamiliesOrOrgSignals`
* `departmentSpecificSignalsAndRisks`
* `keyContextSignalsAndRisks`
* `confidenceAndUnknowns`
* `fieldEvidence`
* `createdAt`
* `updatedAt`

The primary department remains admin-confirmed. The AI may suggest visible departments, but it must not auto-select the primary analytical anchor.

The structured context record must preserve the distinction between company-wide context and selected-department context. Company-wide signals may support framing, terminology, and service-model understanding. Department-specific signals are the nearer basis for later workflow analysis and hierarchy preparation.

### 16.9 `StructuredContextFieldEvidence`

Purpose:
Preserves traceability between structured context fields and the sources or operator notes that influenced them.

Minimum fields:

* `fieldName`
* `evidenceType`
* `sourceId` when applicable
* `operatorNoteId` when applicable
* `providerJobId` when applicable
* `supportingSnippetOrNote`
* `confidenceLevel`

Minimum `evidenceType` values:

* `operator_original_note`
* `ai_structured_from_operator_note`
* `extracted_from_uploaded_source`
* `extracted_from_website`
* `contextual_inference`
* `admin_confirmed`

### 16.10 `ProviderExtractionJob`

Purpose:
Tracks extraction, OCR, transcription, or crawl-support work through provider-agnostic job status.

Minimum fields:

* `providerJobId`
* `caseId`
* `sourceId`
* `providerName`
* `jobKind`
* `jobStatus`
* `startedAt`
* `completedAt`
* `errorMessage`
* `outputRef`

Minimum `providerName` values for this stage:

* `google`
* `openai`
* `crawl4ai`
* `manual`
* `stub`

Minimum `jobKind` values:

* `document_text_extraction`
* `ocr`
* `audio_transcription`
* `website_candidate_discovery`
* `website_crawl`
* `manual_note_structuring`
* `embedding_generation`

Minimum `jobStatus` values:

* `queued`
* `running`
* `succeeded`
* `failed`
* `skipped`

### 16.11 `ContentChunkRecord`

Purpose:
Stores chunkable extracted or approved text prepared for retrieval and embedding.

Minimum fields:

* `chunkId`
* `caseId`
* `sourceId`
* `sourceKind`
* `chunkText`
* `chunkIndex`
* `sourceLocator`
* `createdFrom`
* `createdAt`

Minimum `createdFrom` values:

* `document_extraction`
* `website_crawl`
* `audio_transcript_approved`
* `manual_note_submitted`
* `image_ocr`

### 16.12 `EmbeddingJobRecord`

Purpose:
Tracks embedding generation for approved or usable extracted text.

Minimum fields:

* `embeddingJobId`
* `caseId`
* `sourceId`
* `chunkIds`
* `providerName`
* `embeddingModel`
* `jobStatus`
* `vectorStoreRef`
* `startedAt`
* `completedAt`
* `errorMessage`

Embedding generation must preserve source traceability.
Embeddings support retrieval and later context use, but they do not represent analysis completion.

### 16.13 `WebsiteCrawlPlan`

Purpose:
Stores the crawler's proposed plan before admin approval.

Minimum fields:

* `crawlPlanId`
* `caseId`
* `sourceId`
* `rootUrl`
* `maxPages`
* `candidatePages`
* `excludedPages`
* `createdAt`
* `approvalStatus`

Minimum `approvalStatus` values:

* `pending_admin_approval`
* `approved`
* `rejected`
* `edited_by_admin`

### 16.14 `WebsiteCrawlCandidatePage`

Purpose:
Represents one page proposed by the crawler for inclusion or exclusion.

Minimum fields:

* `url`
* `pageTitle`
* `priorityReason`
* `defaultIncluded`
* `adminIncluded`
* `exclusionReason` when applicable

### 16.15 `WebsiteCrawlApproval`

Purpose:
Records the admin's crawl approval decision.

Minimum fields:

* `approvalId`
* `crawlPlanId`
* `approvedMaxPages`
* `approvedUrls`
* `excludedUrls`
* `decisionType`
* `decidedBy`
* `decidedAt`

### 16.16 `WebsiteSiteSummary`

Purpose:
Stores the default admin-facing site-level summary produced after approved crawl execution.

Minimum fields:

* `summaryId`
* `caseId`
* `sourceId`
* `companyIdentitySummary`
* `visibleServicesSummary`
* `domainOrSubtypeSignals`
* `visibleDepartmentsOrUnits`
* `visibleProjectsClientsPartners`
* `importantSignalsAndNotes`
* `pageRefsUsed`
* `confidenceAndUnknowns`

### 16.17 Contract Placement Rule

Build-critical shared shapes should live in `packages/contracts`.
Runtime creation, update, and retrieval behavior should live in the appropriate domain package or persistence layer, not directly inside admin UI components.

### 16.18 Build Boundary for Contracts

These contracts are the minimum buildable foundation for Pass 2.

For this build slice, real provider-backed extraction is required for the official input types that Pass 2 claims to support.
The contracts do not by themselves prove provider-backed capability; they only define the stable structures required to wire, inspect, and govern those capabilities.

Pass 2 completion requires both:

* the required contracts; and
* real provider-backed execution evidence for the supported input types inside this slice.

The contracts do not imply production storage, deep workflow analysis, participant rollout, synthesis/evaluation, hierarchy approval, or final packaging is complete.
Those capabilities remain outside Pass 2 unless separately scoped and proven end-to-end.

## 17. Storage and Persistence Architecture

### 17.1 Local-First Database Rule

Pass 2 must use a real database-backed persistence layer.

The default build target for this slice is **local-first storage** suitable for running on the operator's machine during active build and testing.

The recommended default is:

* SQLite or equivalent lightweight local SQL database for structured metadata
* local filesystem/object-folder storage for uploaded files and raw extracted artifacts
* database-backed references linking metadata to stored file/content artifacts
* replaceable adapters so the same logical persistence layer can later move to Supabase/Postgres/object storage without rewriting Pass 2 business logic

This means Pass 2 must not rely on in-memory-only storage for completion.
In-memory storage may exist only as a test fixture or temporary dev helper, not as the accepted implementation path.

### 17.2 Persistence Boundary Rule

Persistence logic must not live inside admin UI components.

The build should preserve a clean boundary between:

* contracts in `packages/contracts`
* persistence repositories/adapters in `packages/persistence`
* intake/context domain logic in the relevant package
* provider integrations in `packages/integrations`
* admin pages/routes in `apps/admin-web`

The admin app may call API routes or server actions, but it must not become the owner of source storage, embedding storage, crawl records, or provider job state.

### 17.3 Required Structured Database Records

The database layer must support at minimum the following logical records:

* cases or case references needed to attach intake data
* intake sources
* intake batches
* AI intake suggestions
* admin intake decisions
* provider extraction jobs
* uploaded file metadata
* extracted text artifacts
* approved audio transcripts
* website crawl plans
* website candidate pages
* website crawl approvals
* website site summaries
* page-level crawl content records
* content chunks
* embedding jobs
* vector-store references
* structured context records
* structured context field evidence records
* final pre-hierarchy review records

These may be implemented as tables or equivalent repository-backed records, but they must be queryable and durable across app restarts.

### 17.4 File and Artifact Storage Rule

Uploaded files and large raw artifacts should not be stored directly inside ordinary metadata rows unless the selected database design explicitly supports that safely.

The default local build should use a storage folder such as:

* `data/uploads/`
* `data/extracted/`
* `data/crawls/`
* `data/transcripts/`
* `data/embeddings/` when needed for local vector artifacts

Database rows should store stable references such as:

* `storageRef`
* `contentRef`
* `outputRef`
* `vectorStoreRef`

The system must preserve enough metadata to trace each stored artifact back to:

* case
* source
* provider job when applicable
* admin decision when applicable
* crawl plan when applicable

### 17.5 Extracted Text Storage Rule

Every successful extraction path must produce a durable extracted-text artifact or equivalent text record.

This applies to:

* document text extraction
* image OCR
* approved audio transcripts
* website crawled page content
* submitted manual notes
* submitted live-dictation notes

Raw extracted text and admin-approved text must remain distinguishable when review is required.

External audio transcripts must not become trusted structured-context input until the admin review rule is satisfied.

### 17.6 Chunking and Embedding Storage Rule

Approved or usable extracted text should be converted into chunk records when retrieval or embedding is useful.

Each chunk must preserve at minimum:

* source linkage
* chunk order
* source locator when available
* creation basis
* text content or content reference

Embedding jobs must preserve:

* provider name
* embedding model
* related chunk IDs
* job status
* vector storage reference
* error message when failed

Embeddings are support infrastructure for retrieval and context formation.
They are not evidence that workflow analysis, document suitability analysis, or final judgment has been completed.

### 17.7 Local Vector Store Direction

For the local-first build, vector storage may use:

* SQLite-compatible vector extension when available
* local vector index files linked through `vectorStoreRef`
* or a replaceable vector-store adapter backed by the local database and filesystem

The implementation must keep vector storage behind an adapter boundary so it can later be replaced by Supabase/Postgres vector support or another production vector store.

### 17.8 Migration and Reset Rule

The local database must be created through an explicit migration or schema-initialization path.

The coding agent must provide a safe local reset or seed command for development only.
This reset path must not be confused with production behavior.

At minimum, the build should document:

* how to initialize the local database
* where local files/artifacts are stored
* how to reset local development data
* which environment variables or config values control database and storage paths

### 17.9 Supabase/Postgres Future Compatibility

Supabase/Postgres may be used later, but Pass 2 should not require production Supabase unless explicitly configured.

The persistence design should avoid choices that make later Supabase/Postgres migration difficult.

At minimum:

* records should use stable IDs
* timestamps should be explicit
* JSON fields should be used deliberately, not as a dumping ground
* file/object references should stay abstract rather than hard-coded to local-only paths
* vector storage should remain adapter-backed

### 17.10 Storage Completion Rule

Pass 2 may not be called complete if its intake records, provider jobs, extracted content, crawl outputs, transcripts, chunks, embeddings, and structured context disappear after app restart.

Completion requires durable local persistence for the Pass 2 scope.

## 18. Implementation Target Map

### 18.1 Expected Package Areas

Pass 2 implementation should primarily touch:

* `packages/contracts` — shared schemas and TypeScript types for intake/context contracts
* `packages/persistence` — durable local repositories, local database adapter, file/artifact references, and vector-store references
* `packages/sources-context` — intake registration, source-role suggestion handling, structured context formation support, source/batch orchestration
* `packages/integrations` — Google extraction/STT/OCR/embedding adapters, Crawl4AI adapter, OpenAI swappable provider boundary when used
* `apps/admin-web` — admin UI routes, forms, batch summary, crawl approval, transcript review, structured context review, final pre-hierarchy review

Pass 2 should not move core business logic into admin UI pages.

### 18.2 Expected Admin Surfaces

Pass 2 must expose at minimum:

* intake start page
* company/department bucket selection
* source upload / URL / manual note entry surface
* live admin dictation entry surface where implemented
* intake upload/status view
* batch summary view
* source detail/drill-down view
* website candidate-page approval view
* website site-level summary view
* external audio transcript review view
* admin source-role/scope confirmation or override view
* structured context review view
* primary department selection / custom department mapping view
* use-case selection view
* final pre-hierarchy review view

### 18.3 Expected API or Server Action Capabilities

The implementation must support server-side capabilities equivalent to:

* create intake batch
* register intake source
* upload file source
* register website URL source
* register manual note
* save live dictation as manual note when used
* start provider extraction job
* read provider job status
* generate or retrieve AI source-role suggestion
* save admin intake decision
* discover website candidate pages
* approve or edit crawl plan
* run approved website crawl
* produce website site-level summary
* store extracted page-level content
* create content chunks
* run embedding generation
* review and approve external audio transcript
* create or update structured context
* select primary department
* save custom department mapping decision
* select use case
* generate final pre-hierarchy review

Route names may be implementation-specific, but these capabilities must exist and must not be hidden in UI-only state.

### 18.4 Environment and Provider Configuration

The implementation must document the required environment/configuration values for:

* local database path
* local artifact storage root
* Google extraction credentials/config
* Google Speech-to-Text configuration
* Google embedding provider configuration
* Crawl4AI service or runtime configuration
* OpenAI fallback/swap configuration when enabled
* provider timeout/retry settings where implemented

No secret values should be committed into the repository.

### 18.5 Crawl4AI Runtime Boundary

Because the repository is TypeScript-first, Crawl4AI should be accessed through a clearly bounded integration adapter.

Acceptable runtime shapes include:

* calling a configured Crawl4AI service endpoint
* invoking a controlled local crawler command through an integration wrapper
* using a dedicated sidecar/service boundary when chosen

Admin UI and domain logic must not depend directly on Crawl4AI internals.

### 18.6 Failure and Retry Behavior

Provider-backed full build does not mean every provider call always succeeds.

The system must show failures clearly and preserve failed job records.

At minimum:

* failed extraction jobs must be visible
* failed crawl jobs must be visible
* failed embedding jobs must be visible
* failed audio transcription must be visible
* retry should be available where reasonable
* no failed provider path may be silently converted into success

## 19. Pass 2 Acceptance Proofs / Done Criteria

### 19.1 Completion Standard

Pass 2 is complete only when the intake and context-framing system works end-to-end within the boundaries of this spec.

Completion requires:

* durable local database-backed persistence
* real provider-backed extraction where this spec requires it
* real website crawling through the approved crawler path
* real embedding generation through the configured Google embedding provider path
* admin-visible review and override surfaces
* clear final pre-hierarchy review
* proof that video and hierarchy implementation remain outside this slice

Contracts, UI shells, placeholder routes, or stub-only provider paths are not sufficient to call Pass 2 complete.

### 19.2 Required Functional Proofs

The accepted implementation must prove at minimum:

1. The admin can start an intake/context flow for a case.
2. Company context can be provided through source upload, website, manual note, image, or audio where applicable.
3. Company context can also be skipped by the admin without blocking the case.
4. Department context can be provided through source upload, website, manual note, image, audio, KPI, policy, SOP, SLA/reference, or other supported source.
5. Department documents can be confirmed unavailable without blocking the case.
6. The system preserves separate company-context and department-context availability statuses.
7. The admin can select a primary department from a dropdown list.
8. The admin can use `Other / Custom Department` when the company uses a non-standard department name.
9. The system can suggest an internal department-family mapping for a custom department.
10. The admin can accept, edit, reject, or leave unknown the suggested internal department-family mapping.
11. The admin can define the use case as same-as-department.
12. The admin can define a custom use case inside the selected department.
13. The system blocks final pre-hierarchy handoff until a valid use case is selected.
14. The system can register each supported source kind: document, website URL, manual note, image, and audio.
15. Video input is not available in Pass 2.
16. Hierarchy intake, hierarchy approval, participant targeting, and rollout readiness are not implemented in Pass 2.
17. The system can produce an AI-suggested source role and scope for intake organization.
18. The system must label this as source-role suggestion, not deep reference analysis.
19. The admin can confirm, edit, override, or mark for review the AI-suggested source role/scope.
20. The system can produce a batch summary before source-by-source drill-down.
21. The batch summary shows source name, bucket, status, AI-suggested source role, suggested scope, confidence, short reason, and admin review state.
22. The admin can drill down into an individual source detail view.

### 19.3 Required Provider and Extraction Proofs

The accepted implementation must prove at minimum:

1. A real document extraction path works through the configured Google extraction path.
2. A real OCR/image extraction path works through the configured Google OCR-capable path.
3. A real audio transcription path works through the configured Google Speech-to-Text path.
4. External audio-file transcript output is shown to the admin for review before structured context use.
5. External audio-file transcript can be approved, edited, rejected, or marked for retry.
6. Live admin dictation produces transcript text through the configured speech-to-text path.
7. Live dictation becomes a case source only when the admin saves/submits it as a manual note or equivalent operator-origin record.
8. Manual notes can be structured by the active LLM provider.
9. AI source-role suggestion and structured context formation run through a real active LLM provider path.
10. Provider jobs are visible with status and failure information.
11. At least one provider failure case is visible in the admin surface and is not silently converted into success.
12. Retry or clear recovery behavior exists where reasonable.

### 19.4 Required Website Crawl Proofs

The accepted implementation must prove at minimum:

1. The admin can register a website URL source.
2. The system can discover candidate pages for crawl.
3. The default smart crawl maximum is 20 pages.
4. The admin can configure crawl maximum using the approved options such as 20, 30, 40, or 50.
5. The admin sees candidate pages before crawling starts.
6. The admin can approve, reject, or edit the crawl plan.
7. Excluded/default-low-priority pages are visible or traceable.
8. Approved crawl runs through the Crawl4AI crawler layer.
9. The system produces a site-level website summary.
10. Page-level extracted content is stored internally.
11. Page-level details are not shown by default unless the admin drills down.
12. Website crawl output can support structured context formation without being treated as workflow analysis.

### 19.5 Required Chunking and Embedding Proofs

The accepted implementation must prove at minimum:

1. Extracted or approved usable text can be converted into durable content chunks.
2. Chunk records preserve source linkage, chunk order, creation basis, and source locator where available.
3. Embedding jobs can be created for approved or usable chunks.
4. Embeddings are generated through the configured Google embedding provider path by default.
5. Embedding model configuration is not hard-coded into business logic.
6. Embedding jobs preserve provider name, model, chunk IDs, status, vector-store reference, and errors.
7. Embedding/chunk records remain traceable to the original source, provider job, crawl plan, or admin-approved transcript where applicable.
8. Embeddings are treated as retrieval/context infrastructure only, not as proof of workflow analysis completion.

### 19.6 Required Storage and Persistence Proofs

The accepted implementation must prove at minimum:

1. Pass 2 uses durable local database-backed persistence, not in-memory-only storage.
2. Uploaded file metadata persists across app restart.
3. Intake sources persist across app restart.
4. Intake batches persist across app restart.
5. AI intake suggestions persist across app restart.
6. Admin intake decisions persist across app restart.
7. Provider extraction jobs persist across app restart.
8. Extracted text artifacts or references persist across app restart.
9. Approved audio transcripts persist across app restart.
10. Website crawl plans, candidate pages, approvals, and site summaries persist across app restart.
11. Page-level crawl content persists across app restart.
12. Content chunks and embedding job references persist across app restart.
13. Structured context records and field evidence persist across app restart.
14. Final pre-hierarchy review records persist across app restart.
15. Local file/artifact storage locations are documented.
16. Local database initialization and development reset commands are documented.
17. The persistence layer remains adapter-backed and compatible with later Supabase/Postgres migration.

### 19.7 Required Structured Context Proofs

The accepted implementation must prove at minimum:

1. Structured context can be generated after intake review.
2. Structured context separates company-level signals from department-level signals.
3. Structured context stores company-context availability status.
4. Structured context stores department-context availability status.
5. Structured context stores selected primary department.
6. Structured context stores selected use case.
7. Structured context stores use-case boundary status and scope type.
8. Structured context stores confidence and unknowns.
9. Structured context field evidence links context fields back to sources, operator notes, provider jobs, or admin confirmations.
10. The primary department remains admin-confirmed and is not auto-selected by AI.
11. The use case remains admin-selected and is not silently inferred as final by AI.

### 19.8 Required Admin UI Proofs

The accepted implementation must expose and prove at minimum:

1. intake start page
2. company/department bucket selection
3. source upload / URL / manual note entry surface
4. live admin dictation entry surface when implemented
5. intake upload/status view
6. batch summary view
7. source detail/drill-down view
8. website candidate-page approval view
9. website site-level summary view
10. external audio transcript review view
11. admin source-role/scope confirmation or override view
12. structured context review view
13. primary department selection / custom department mapping view
14. use-case selection view
15. final pre-hierarchy review view

### 19.9 Required Build and Quality Proofs

The accepted implementation must pass at minimum:

* `pnpm build:contracts`
* `pnpm typecheck`
* `pnpm build`
* database migration or initialization command proof
* local restart persistence proof
* curl or browser proof for the main Pass 2 pages/routes
* proof that no Pass 2 UI claims hierarchy, participant rollout, synthesis, evaluation, final package, or video analysis as completed

### 19.10 Non-Completion Conditions

Pass 2 must not be called complete if any of the following is true:

* source data disappears after app restart
* extraction paths are stub-only while the UI claims real extraction
* website crawl is URL-only without candidate-page approval and Crawl4AI-backed crawl
* embeddings are not generated for approved/usable crawl or extracted text where required
* audio transcript can influence structured context before admin review
* company and department context are collapsed into one untraceable pool
* use case is missing at final pre-hierarchy review
* hierarchy intake or rollout readiness is silently mixed into Pass 2
* video is still exposed as a supported Pass 2 input
* admin cannot review or override AI source-role/scope suggestions
* provider failures are hidden or converted into success

## 20. Pass 2 Internal Implementation Sequence

### 20.1 Why This Sequence Exists

Pass 2 is a full build slice, but it must not be executed as one uncontrolled coding blast.

The coding agent must build the full Pass 2 scope through ordered internal phases.
This does not defer required Pass 2 capabilities to later project passes.
It only sequences the work inside Pass 2 so contracts, storage, providers, UI, and proofs do not become tangled.

The agent must not call Pass 2 complete until all phases and acceptance proofs are satisfied.

### 20.2 Phase 1 — Contracts, Local Database, Persistence, and Artifact Storage

Build first:

* all required Pass 2 contracts in `packages/contracts`
* durable local database schema/migrations or initialization path
* local filesystem/artifact storage folders
* persistence repositories/adapters in `packages/persistence`
* intake source records
* intake batch records
* AI intake suggestion records
* admin intake decision records
* provider extraction job records
* uploaded file metadata records
* extracted text artifact records
* website crawl records
* transcript records
* content chunk records
* embedding job records
* structured context records
* structured context field evidence records
* final pre-hierarchy review records

Stop condition for Phase 1:

* contracts build cleanly
* local DB initializes successfully
* repositories persist and reload data across restart or equivalent proof
* no admin UI claims provider-backed completion yet

### 20.3 Phase 2 — Intake Registration UI and Basic Admin Surfaces

Build next:

* intake start page
* company/department bucket selection
* source registration for document, website URL, manual note, image, and audio
* status view for received sources
* batch summary view using persisted records
* source detail/drill-down shell
* manual note save flow
* live dictation save-as-note boundary where implemented

Stop condition for Phase 2:

* admin can register supported sources
* records persist after reload/restart
* batch summary shows source records from the database
* video is not exposed
* hierarchy is not exposed as implemented

### 20.4 Phase 3 — Provider Integrations and Provider Job Tracking

Build next:

* Google document extraction path
* Google OCR/image extraction path
* Google Speech-to-Text path for audio
* Google embedding provider path
* active LLM provider path for source-role suggestion and structured-context drafting
* provider job creation and status tracking
* failure capture and visible failure state
* retry or recovery behavior where reasonable

Stop condition for Phase 3:

* at least one real document extraction proof exists
* at least one real image/OCR extraction proof exists
* at least one real audio transcription proof exists
* at least one real AI source-role suggestion proof exists
* at least one real embedding-generation proof exists
* failed provider job is visible and not converted into success

### 20.5 Phase 4 — Website Crawl Flow

Build next:

* website URL registration
* Crawl4AI adapter boundary
* candidate-page discovery
* default max pages = 20
* admin-configurable max page options such as 20, 30, 40, 50
* candidate-page approval/edit/reject view
* approved crawl execution through Crawl4AI
* site-level summary
* page-level extracted content storage
* chunk creation from approved crawl output
* embedding generation for crawl chunks

Stop condition for Phase 4:

* candidate pages are shown before crawl
* admin approval is required before crawl
* approved crawl runs through the crawler layer
* site-level summary is visible
* page-level content is stored internally
* chunks and embeddings are generated and traceable

### 20.6 Phase 5 — External Audio Review Flow

Build next:

* external audio upload/import
* transcription provider job
* raw transcript storage
* transcript review screen
* edit / approve / reject / retry behavior
* approved transcript storage
* approved transcript chunking and embedding when useful
* approved transcript eligibility for structured context

Stop condition for Phase 5:

* raw external audio transcript is visible as draft only
* raw transcript cannot influence structured context before admin approval or edit
* approved/edited transcript can support source-role suggestion and structured context
* transcript review state persists

### 20.7 Phase 6 — Department, Custom Mapping, Use Case, and Structured Context

Build next:

* primary department dropdown
* Other / Custom Department option
* AI-suggested internal department-family mapping
* admin accept/edit/reject/unknown mapping decision
* use case same-as-department option
* custom department-specific use case entry
* use-case required guard before final pre-hierarchy review
* structured context formation from approved/reviewed source material
* company-context vs department-context separation
* field-level evidence traceability

Stop condition for Phase 6:

* primary department is admin-selected
* custom department label remains company-facing truth
* internal mapping does not overwrite the custom label
* use case is selected before final review
* structured context separates company and department signals
* structured context has evidence traceability

### 20.8 Phase 7 — Final Pre-Hierarchy Review and Acceptance Proof Package

Build last:

* final pre-hierarchy review screen
* company-context availability status
* department-context availability status
* selected primary department
* selected use case and boundary status
* source summary and review status
* unresolved context risks or unknowns
* explicit handoff to next hierarchy build slice
* proof that hierarchy intake is not implemented inside Pass 2
* proof that video is not supported in Pass 2
* acceptance proof output or checklist for the operator

Stop condition for Phase 7:

* final pre-hierarchy review works end-to-end
* all required acceptance proofs in Section 19 are satisfied
* build/typecheck pass
* no fake completion wording appears in the implementation notes or UI

### 20.9 Agent Progression Rule

The coding agent must not jump ahead across phases when a prior phase lacks proof.

If a phase is partially complete, the agent must report:

* what was built
* what was proven
* what failed
* what remains inside the same phase
* whether any acceptance proof is still missing

The agent must not move unresolved provider, storage, or contract gaps into vague later work unless the operator explicitly changes scope.

### 20.10 Completion Language Rule

The agent may use only the following completion labels:

* `phase_draft`
* `phase_partially_proven`
* `phase_proven`
* `pass2_not_complete`
* `pass2_complete_after_all_proofs`

The agent must not say “complete,” “done,” “finished,” or “fully implemented” for Pass 2 unless all Section 19 acceptance proofs are satisfied.

### 20.11 Main Branch Integration Rule

The repository's `main` branch should remain the operational source of truth after accepted work is proven.

Implementation work may happen on phase-scoped branches, but accepted phase work should be merged back into `main` after:

* the phase is proven
* required build/typecheck/proof commands pass
* handoff files are updated
* no out-of-scope capability was introduced
* the operator accepts the phase status

The agent should not leave proven work stranded on disconnected working branches.
The agent should also not work directly on `main` in a way that bypasses phase proof discipline.

The correct pattern is:

1. build on a phase-scoped branch
2. prove the phase
3. update handoff files
4. operator accepts the phase
5. merge or fast-forward the accepted phase into `main`
6. continue the next phase from updated `main`

If a phase is only `phase_partially_proven`, it must not be merged to `main` as accepted work unless the operator explicitly decides to merge a partial checkpoint.

## 21. Pending Areas Not Yet Finalized in This Spec

The following are intentionally not finalized yet in this document and should be handled next within Pass 2:

* minimal build contracts for intake, batch summary, provider jobs, structured context, and website crawl planning
* provider-backed extraction, crawling, and embedding implementation evidence
* website crawl contract and approval object
* structured context evidence traceability
* early domain pack activation boundary
* preliminary classification criteria by document type

The following are intentionally deferred to the next hierarchy build slice:

* exact draft-hierarchy construction behavior from weak inputs
* hierarchy approval flow details
* linking sources to roles/nodes
* readiness gate from hierarchy to participant targeting
* source-to-role visibility rules

---

## 22. Practical Build Intent

This spec is the operational build companion for the master plan.
The master plan remains stable.
This file is the place where executable intake decisions continue to evolve.
