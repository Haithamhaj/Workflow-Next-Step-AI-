# Next Slice — Hierarchy Intake & Approval Build Slice

## Current status

Pass 2 — Intake & Context Build is complete after all Section 19 proofs.

Completion label: `pass2_complete_after_all_proofs`

Accepted Pass 2 phases:

- **Pass 2 Phase 1:** Intake & Context Build foundation — `phase_proven`
- **Pass 2 Phase 2:** Intake Registration UI and Basic Admin Surfaces — `phase_proven`
- **Pass 2 Phase 3:** Provider Integrations and Provider Job Tracking — `phase_proven`
- **Pass 2 Phase 4:** Website Crawl Flow — `phase_proven`
- **Pass 2 Phase 5:** External Audio Review Flow — `phase_proven`
- **Pass 2 Phase 6:** Department, Custom Mapping, Use Case, and Structured Context — `phase_proven`
- **Pass 2 Phase 7:** Final Pre-Hierarchy Review — `phase_proven`
- **Pass 2 Section 19 Acceptance Closure Patch:** missing proofs closed and accepted locally

## Next separate build slice

**Hierarchy Intake & Approval Build Slice**

This slice begins after Pass 2. It is not part of Pass 2.

## Boundaries preserved

- Hierarchy intake was not implemented in Pass 2.
- Hierarchy draft generation was not implemented in Pass 2.
- Source-to-role linking, participant targeting, rollout readiness, participant sessions, synthesis/evaluation, and final package work were not started by Pass 2.
- Video remains outside Pass 2 and is not exposed as a supported intake input.
- `fetch_html` is the currently proven crawler adapter.
- Crawl4AI remains an optional crawler adapter when configured with `CRAWL4AI_URL`.
- Transcript confidence remains admin-review-sensitive.
- Live dictation is separate from external audio-source transcript review and creates a case source only when saved as manual/operator note.

## Runtime notes preserved

- Google extraction/OCR, source-role suggestion, manual-note structuring, and active-LLM structured context proofs used `gemini-3.1-pro-preview`.
- Google embedding proof used configured model `gemini-embedding-2`.
- STT external uploaded audio default remains Google Speech-to-Text V1 `latest_long`; live dictation proof used short-command model `latest_short`.
- No secret values are recorded in handoff files.

## Do not start without operator approval

- Do not start hierarchy intake until explicitly approved.
- Do not start participant rollout, synthesis/evaluation, final package, or video input.

## Hard rules

- One pass/slice per session
- Local patch first
- No broad rewrites
- Business logic stays in domain packages, not in admin-web
- Schema changes go through `packages/contracts`
- Prove with required commands and route-level checks before closing the slice
- Update `CURRENT_STATE.md` and `NEXT_PASS.md` at the end of the accepted slice
