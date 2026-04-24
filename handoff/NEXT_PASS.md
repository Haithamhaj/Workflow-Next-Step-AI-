# Next Pass — Pass 2 Phase 6

## Official pass sequence

- **Pass 2 Phase 1:** Intake & Context Build foundation — `phase_proven`
- **Pass 2 Phase 2:** Intake Registration UI and Basic Admin Surfaces — `phase_proven`
- **Pass 2 Phase 3:** Provider Integrations and Provider Job Tracking — `phase_proven`
- **Pass 2 Phase 4:** Website Crawl Flow — `phase_proven` with runtime caveat
- **Pass 2 Phase 5:** External Audio Review Flow — `phase_proven`

---

## Status

Overall Pass 2 status: `pass2_not_complete`.

Next implementation phase, only after operator approval:

**Pass 2 Phase 6 — Structured Context Generation**

---

## Phase 5 completion proof summary

Real Google Speech-to-Text proof succeeded using local environment config:

- `GOOGLE_STT_API_KEY`
- `GOOGLE_STT_MODEL=latest_short`
- `GOOGLE_STT_LANGUAGE_CODE=en-US`

The key value is not recorded in handoff files.

STT model strategy after correction:

- external uploaded audio defaults to the Google Speech-to-Text V1 endpoint with model `latest_long`
- no recognizer or location is required for the default external-upload path
- V2 `chirp_3` remains an explicit/config-gated path only, not the default
- `latest_short` is not the external-upload default; keep it only for short command/live-dictation scenarios
- confidence remains a provider quality signal only; transcript trust still requires admin approval/edit

Succeeded proof records:

- source: `isrc_phase5_real_audio`
- provider job: `pjob_ca7c410f-a3c6-417e-9b35-1cc2265ff123`
- provider: `google_speech_to_text`
- job kind: `audio_transcription`
- raw transcript artifact: `artifact_7d2d2f25-0cb6-429e-a353-7000839799a0`
- provider confidence: `0.19816941`
- provider quality signal: `average_confidence:0.198`
- model strategy follow-up provider job: `pjob_565fb137-98a5-4653-9729-8072a25a2ba8`
- model strategy follow-up model: `latest_long` because the local proof environment did not have a V2 project id configured

Review boundary was proven:

- raw transcript appeared as ready for review
- raw transcript was not trusted before admin approval
- approve-as-is created trusted text, chunk, and embedding job
- edit created updated trusted text, chunk, and embedding job
- reject/mark retry cleared current trusted transcript state
- restart reloaded review state, provider job, raw artifact, chunks, and embedding jobs from SQLite

---

## Explicitly not next without approval

- Do not start Phase 6 without operator approval.
- Do not start hierarchy intake, participant rollout, synthesis/evaluation, final package, or video input.
- Do not add Whisper, local STT fallback, or a new provider.

---

## Hard rules

- One pass per session
- Local patch first
- No broad rewrites
- Business logic stays in domain packages, not in admin-web
- Schema changes go through `packages/contracts`
- Prove with the checks required by the phase definition before closing the phase
- Update `CURRENT_STATE.md` and `NEXT_PASS.md` at the end of the accepted phase
