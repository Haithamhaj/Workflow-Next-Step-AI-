# Next Pass — Pass 2 Phase 5

## Official pass sequence

- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — accepted on `main` (2026-04-22)
- **Pass 8:** Final Package + Release — accepted on `main` (2026-04-22), commit `3171ad4`
- **Pass 9:** Package Preview + Release Decision Surface — accepted on `main` (2026-04-23), commit `41a8232`
- **Pass 2 Phase 1:** Intake & Context Build foundation — `phase_proven`
- **Pass 2 Phase 2:** Intake Registration UI and Basic Admin Surfaces — `phase_proven`
- **Pass 2 Phase 3:** Provider Integrations and Provider Job Tracking — `phase_proven`
- **Pass 2 Phase 4:** Website Crawl Flow — `phase_proven`

---

## Status

Overall Pass 2 status: `pass2_not_complete`.

Next implementation phase:

**Pass 2 Phase 5 — External Audio Review Flow**

Do not start Phase 5 without operator approval.

---

## Phase 5 scope

Build next:

- external audio transcript review UI
- admin review of raw provider transcript output
- transcript acceptance/rejection or correction surfaces
- persisted review decision/status for external audio transcript material
- clear boundary that reviewed transcript material supports intake/context only

Stop condition for Phase 5:

- external audio transcript review can open for an audio source with a raw transcript artifact
- admin review state persists across restart
- accepted/corrected transcript remains source-traceable
- raw transcript is not allowed to silently influence structured context without review
- failures and missing provider/runtime conditions remain visible

---

## Explicitly not Phase 5

- Structured context formation belongs to a later phase.
- Hierarchy intake, participant rollout, synthesis/evaluation, final package, and video input remain out of scope.

---

## Hard rules

- One pass per session
- Local patch first
- No broad rewrites
- Business logic stays in domain packages, not in admin-web
- Schema changes go through `packages/contracts`
- Prove with the checks required by the phase definition before closing the phase
- Update `CURRENT_STATE.md` and `NEXT_PASS.md` at the end of the accepted phase
