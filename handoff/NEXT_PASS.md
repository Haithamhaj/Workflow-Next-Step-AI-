# Pass 9 — Package Preview + Release Decision Surface

## Official pass sequence
- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — accepted on `main` (2026-04-22)
- **Pass 8:** Final Package + Release — accepted on `main` (2026-04-22), commit `3171ad4`
- **Pass 9:** Package Preview + Release Decision Surface — **active next pass**

---

## Context

Pass 8 built the accepted Final Package record, release-state wiring, and the admin-web surfaces for final package creation, detail, and release-state progression. Pass 9 builds on that accepted package logic only.

Pass 9 is not just an internal package page. It is the main client-facing surface of the product and the final enterprise-facing delivery surface the client sees for the case outcome.

The admin-web already has a `/packages` nav entry (label: "Package preview") pointing at `/packages`. This route does not yet exist. Pass 9 should implement the full client-facing delivery surface system behind that area and its linked views, without altering Pass 8 mechanics.

---

## Goal

Build the unified client-facing delivery surface system for package preview and release decision visibility on top of accepted Pass 8 package logic, without duplicating or replacing Pass 8 final-package surfaces and without introducing new mechanics.

---

## Scope

Pass 9 is a delivery/presentation pass over existing package outputs and existing release/review/package state data. It defines the product's main client-facing delivery surface system.

The surface scope includes:

- main package surface
- preview views
- document download surface
- visual workflow views
- current-state vs target-state comparison views
- status / release visibility views

The surface should behave as a unified client-facing system, not as one narrow landing page only.

The UX shell pattern for Pass 9 is a **Context-First Product Shell**:

1. fixed product shell stays primary
2. client context strip appears directly under the shell
3. main page header is use-case/package-centered
4. first content row is package overview, not a generic client card

This pattern applies across the full client-facing Pass 9 surface.

Pass 9 may present existing package, review, and release visibility more clearly, but it must not introduce:

- new release mechanics
- new package eligibility logic
- new review mechanics
- new analysis logic
- new prompt-chain logic

---

## Stop conditions

- If implementation would require inventing new release mechanics, new package eligibility logic, new review mechanics, new analysis logic, or new prompt-chain logic, stop and surface the specific blocker
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
