# Pass 9 — Package Preview + Release Decision Surface

## Official pass sequence
- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — accepted on `main` (2026-04-22)
- **Pass 8:** Final Package + Release — accepted on branch `claude/blissful-bardeen-371869` (2026-04-22)
- **Pass 9:** Package Preview + Release Decision Surface — **active next pass**

---

## Context

Pass 8 built the Final Package record, three API routes, and the admin-web surfaces for creation, detail, and release-state progression. The release panel in admin-web provides linear one-step transitions per §28.16.

The admin-web already has a `/packages` nav entry (label: "Package preview") pointing at `/packages`. This route does not yet exist. Pass 9 should implement it, along with any remaining release-decision surface that was not covered by Pass 8.

---

## Goal

Build the Package Preview surface and any release-decision controls that are defined in the spec but not yet implemented, without duplicating or replacing the Pass 8 final-package surfaces.

---

## Scope

Determine from the spec documents what the `/packages` (Package preview) surface is supposed to show. Likely candidates:

- A unified view of initial packages + final packages for a given case, showing package-type, state, release state, and admin-approval status side-by-side
- Cross-package navigation and linkage (initial → final, final → evaluation back-links)
- Any release-readiness checklist view defined in the spec (e.g., release eligibility conditions that must be satisfied before `approved_for_release`)

Before coding, identify the literal spec section(s) that define the Package Preview surface. If the spec does not literally define it, record the question in `handoff/OPEN_QUESTIONS.md` and surface it to the operator before coding.

---

## Stop conditions

- If the Package Preview spec section is not literal, stop and surface OQ-new
- If release eligibility conditions (beyond linear transition gating) are defined in the spec but not implemented, surface as a new open question
- No broad rewrites of Pass 8 surfaces
- No prompt reinforcement, no management inquiry, no mechanics drift

---

## Hard rules (inherited from CLAUDE.md)

- One pass per session
- Local patch first
- No broad rewrites
- Business logic stays in domain packages, not in admin-web
- Schema changes go through `packages/contracts`
- Prove with `pnpm typecheck`, `pnpm build`, and curl/browser before closing the pass
- Update `CURRENT_STATE.md` and `NEXT_PASS.md` at the end of the accepted pass
