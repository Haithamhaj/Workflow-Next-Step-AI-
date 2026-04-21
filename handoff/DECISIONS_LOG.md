# Decisions Log

Format: Decision — Reason — Status
Status: LOCKED | FORMALIZED | IMPL-EXTENSION

---

## Toolchain & repo shape

- **pnpm 9.12.0 workspaces, `apps/*` + `packages/*` layout** — standard monorepo pattern; pnpm chosen for workspace protocol and speed — LOCKED
- **Node ≥ 20 engine constraint** — required by Next.js 14 and modern ESM; LTS baseline — LOCKED
- **TypeScript 5.4.5, ESM (`"type": "module"`), composite projects with project references** — enables incremental builds and strict cross-package type checking without bundler magic — LOCKED
- **`tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess`, `Bundler` moduleResolution** — maximum type safety from day one; harder to add later than to loosen — LOCKED
- **`shared-utils` has zero `@workflow/*` dependencies** — prevents circular dependency chains; domain knowledge must stay in domain packages — LOCKED

## contracts

- **Ajv 8 + ajv-formats for JSON Schema validation** — industry standard, fast, supports Draft-07, formats plugin needed for `date-time` and `uri` — LOCKED
- **JSON Schema Draft-07 for all schemas** — stable, well-supported by Ajv 8 by default; upgrade to Draft 2020-12 is a future option — FORMALIZED
- **Hand-mirrored TypeScript types (not codegen) in Pass 1** — zero tooling overhead for the scaffold pass; acceptable drift risk is low while schemas are small — IMPL-EXTENSION (revisit if schema count grows significantly)
- **`makeValidator<T>(schema)` returns `ValidationResult<T>` discriminated union** — avoids thrown errors from validation; callers must handle both branches — LOCKED
- **`CaseState` fully enumerated in Pass 1 (11 values, §28.5)** — spec §28.5 fully specifies case states; no ambiguity — LOCKED
- **Other 5 state families (`Rollout`, `Session`, `Package`, `Review`, `Release`) deferred to Pass 2** — spec §28 does not fully enumerate their members; deferring avoids guessing — FORMALIZED (must be resolved in Pass 2 before any business logic touches them)
- **Unimplemented state families typed as `_Pass1Placeholder<Tag>` (branded string)** — plain `= string` alias is silently assignable; brand forces a compile-time error if misused before real unions land — LOCKED until replaced in Pass 2

## admin-web

- **Next.js 14 App Router** — current stable; SSR by default, file-system routing, compatible with workspace imports via `transpilePackages` — LOCKED
- **`transpilePackages: ["@workflow/contracts"]` in `next.config.mjs`** — required for Next.js to process ESM workspace packages at build time — LOCKED

## integrations

- **Python sidecar intentionally deferred beyond day one** — no runtime requirement for it in the first passes; adding it later is additive, not structural — LOCKED
- **No LLM transport in Pass 1** — out of scope; `integrations` package is a stub — FORMALIZED (lands in Pass 3)

## Pass 2A partial implementation

- **Pass 2A implemented 4 of 5 state families plus the case/core-state/persistence/admin-cases flow** — `SessionState` (§28.9), `PackageState` (§28.11), `ReviewState` (§28.13), `ReleaseState` (§28.15) filled with real unions and validators; `CaseStateTransitions` + `isValidTransition` implemented; `InMemoryCaseRepository`/`InMemorySourceRepository`/`createInMemoryStore()` implemented; `createCase`/`loadCase`/`listCases` implemented; `/api/cases` GET+POST and `/cases`+`/cases/new` UI wired up — IMPL-EXTENSION
- **Full Pass 2 acceptance withheld** — two gaps prevented acceptance: (1) `RolloutState` remained a branded placeholder because §28.7 does not enumerate its values, leaving proof item #2 ("all 5 placeholder types replaced") unsatisfied; (2) proof item #7 ("validation error visible in UI") was demonstrated only at the API level, not with browser or DOM evidence of the rendered error text. Work is reclassified as Pass 2A. Pass 2B must resolve both gaps before Pass 2 is accepted — FORMALIZED
- **RolloutState formally deferred (operator decision, 2026-04-21)** — spec §28.7 describes rollout readiness through four pillars (hierarchy_status, reference_status, targeting_status, admin_rollout_approval_status), not as an enumerated state family. Operator confirmed that enumerating discrete `RolloutState` string values is intentionally deferred. The branded placeholder type is retained with an updated comment recording the formal deferral. Rollout readiness continues to be evaluated via the four pillars. No code change beyond the deferral comment — LOCKED
- **Pass 2B closed both proof gaps; Pass 2 accepted** — (1) RolloutState formal deferral recorded, resolving proof item #2; (2) `/cases/new` validation error proven visible in rendered UI via DOM evidence (error state block with styled validation errors list wired to API 400 response), resolving proof item #7. Pass 2 is now fully accepted — FORMALIZED

---

## dependency rules

- **Skeleton packages depend on `@workflow/contracts` via `workspace:*`** — all domain types flow from contracts; packages must not define competing types — LOCKED
- **`shared-utils` is the only package with no `@workflow/*` dep** — by design; see shared-utils rule above — LOCKED
