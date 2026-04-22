# Pass 8 — Final Package + Release

## Official pass sequence
- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — implemented on branch, pending merge
- **Pass 8:** Final Package + Release — next pass after Pass 7 merges

---

## Goal
Build the Final Package layer that consumes the accepted Pass 6 artifacts plus the Pass 7 review-issue artifacts, while keeping final-package logic separate from release approval logic. This pass begins only after Pass 7 is merged to `main`.

---

## Scope

### Final Package
- `packages/packages-output`
  - final package record type + validator in contracts
  - final package assembly helpers
  - current-state vs target-state separation
  - residual-gaps visibility
- `packages/contracts`
  - final package seam contract(s)
- `packages/persistence`
  - final package repository + in-memory implementation

### Release flow
- `packages/core-state`
  - release-state transition wiring using existing `ReleaseState`
- release approval / release routing should remain structurally separate from package existence

### Admin UI
- final package list / detail / creation or promotion surface
- release approval controls
- clear separation between:
  - final package content
  - release approval state
  - residual items / later review items

---

## Do not widen scope
- No management inquiry implementation unless an authority file explicitly pulls it forward
- No broad refactor of Pass 7 review-issue flows
- No real database, auth, CI, or deployment work

---

## Stop conditions
- If the review-to-final-package promotion rule is not literal, stop and surface it
- If release approval gates are not literal, stop and surface them
- If current-state vs target-state separation would require invented fields, stop and surface it
