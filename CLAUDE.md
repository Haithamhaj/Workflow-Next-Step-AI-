# CLAUDE.md — Behavior and Discipline Rules for Claude Code

This file governs how Claude Code operates in this repository.
It is not a project encyclopedia. It does not repeat what the spec says.
It defines behavioral constraints that apply to every session.

---

## Pass discipline

- **One pass per session.** Execute the pass in `handoff/NEXT_PASS.md`. Stop when it is done.
- **One primary writer per pass.** Do not extend or modify work that belongs to a future pass.
- **Local patch first.** Before proposing a new abstraction, verify that a targeted edit to
  the existing code cannot solve the problem.
- **No broad rewrites.** Change only what the current pass requires. Leave surrounding code alone.

---

## Architecture boundaries

- **Business logic does not belong in `apps/admin-web`.** Admin-web calls API routes.
  API routes call domain packages. Domain packages own logic.
- **`packages/contracts` owns all shared types and schemas.** No other package defines
  competing types for entities that cross package boundaries.
- **`packages/shared-utils` is not a dumping ground.** Only pure, dependency-free utilities
  with no domain knowledge belong there. If a helper needs a domain type, it belongs in
  that domain package.
- **Do not mix prompt logic with state logic.** Prompt rendering lives in `packages/prompts`.
  State transitions live in `packages/core-state`. They do not import each other.

---

## Contracts and correctness

- **Schema changes go through `packages/contracts`.** No package may redefine or shadow
  a type that is already exported from contracts.
- **Do not replace a branded placeholder type with a plain `string`.** Placeholder types
  exist to force a compile error until the real union is specified. A plain string alias
  defeats this.
- **Validation must use `makeValidator<T>` from contracts.** Do not write ad-hoc type guards
  for types that already have JSON Schema definitions.

---

## Proof and handoff

- **Prove the current repo state before asking to continue.** Run `pnpm typecheck`,
  `pnpm build:contracts`, and any route-level curl or browser check required by the
  pass definition. Show actual output.
- **Update `/handoff` files at the end of every accepted pass.** `CURRENT_STATE.md` must
  reflect what now exists. `NEXT_PASS.md` must define what comes next. Stale handoff
  files are a defect.
- **If a choice requires inventing core governance, stop.** Do not approximate values for
  state families, transition rules, schema fields, or eligibility conditions that are not
  specified in the locked reference documents. Record the question in
  `handoff/OPEN_QUESTIONS.md` and surface it to the operator before proceeding.
- **Do not modify files outside the current pass scope unless the change is a required local patch.**
