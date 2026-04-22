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

## Pass 5 — Session lifecycle + clarification UI (branch `pass-5-sessions`, pending merge)

> Status: these decisions are recorded against the Pass 5 work on branch `pass-5-sessions`. They become baseline-active only after the branch is merged into `main`. Until merge, they are proposal-scoped.

- **`SessionCreation` schema owns session intake contract; `SessionRecord` (persistence) extends it with `createdAt`, `currentState`, `clarificationQuestions`** — keeps contracts the single source of truth for payload shape; persistence owns the stored-form shape, not the intake shape — LOCKED
- **`ClarificationQuestion` requires `question`, `explanation`, and `example` (all non-empty strings) per §17.8** — literal reading of the spec; missing any of the three is rejected by `addClarificationQuestion` — LOCKED
- **`SessionStateTransitions` encodes §28.10 forward-only; right-hand states (`follow_up_needed`, `session_partial`, `session_ready_for_synthesis`) have empty transition arrays** — safest literal reading; back-transitions from the clarification loop are not invented. Open question OQ-003 surfaces this for operator confirmation — IMPL-EXTENSION (may loosen if OQ-003 resolves)
- **`initialState` on `SessionCreation` is optional; `createSession` defaults to `not_started` when omitted** — §28.10 entry point is explicit; default avoids forcing clients to restate the entry value — LOCKED
- **`transitionSession` consults `isValidSessionTransition` before persisting** — enforces §28.10 at the package boundary; API routes and UI do not re-check — LOCKED
- **`packages/sessions-clarification` does not import from `packages/core-state` or `packages/core-case`** — CLAUDE.md architecture rule; session logic is separate from case logic — LOCKED

---

## Pass 6 — Synthesis + Evaluation + Initial Package (branch `pass-6-synthesis-evaluation`, pending merge)

> Status: these decisions are recorded against the Pass 6 work on branch `pass-6-synthesis-evaluation`. They become baseline-active only after the branch is merged into `main`. Until merge, they are proposal-scoped.

- **Synthesis difference-block has exactly the five literal §19.3 fields (`where`, `what`, `participantsPerSide`, `whyMatters`, `laterClosurePath`)** — literal reading of the spec; no additional fields invented. Future enrichment (§19.6–§19.9 peer-level) is deferred behind OQ-004 — LOCKED
- **`SynthesisRecord` requires `confidenceEvidenceNotes` (not optional) and keeps `sessionId` optional** — §19.11 minimum output treats confidence/evidence notes as required; session linkage is often absent at the synthesis stage — LOCKED
- **Evaluation `outcome` is operator-supplied but constrained by the seven completeness conditions (§20.10)** — §20.10 states the seven conditions "must govern the final outcome." The operator labels the outcome from the four-value enum, but `createEvaluation` enforces: if any `conditions` field is `false` (essential workflow completion is broken), the outcome must be `needs_more_clarification`. Outcomes `ready_for_initial_package` (§20.11), `finalizable_with_review` (§20.13: "no remaining issue breaks essential workflow completion"), and `ready_for_final_package` (§20.14) are all rejected when any condition fails. Axis states (§20.4–20.5) do NOT constrain the outcome — they are "supporting judgment lenses" per §20.10. Full algorithmic derivation is not implemented because §20.11–20.14 use judgment language ("sufficiently complete") that cannot be reduced to a deterministic rule — LOCKED
- **Initial Package structural outward/admin separation (§21.8 + §21.11)** — the schema uses two top-level objects: `outward` (§21.3 five mandatory + §21.4 optional `documentReferenceImplication`) and `admin` (§21.11 `sevenConditionChecklist`, `readinessReasoning`, optional `confidenceEvidenceNotes`, optional `internalReviewPrompts`). The seven-condition checklist has no field on `outward`; it is structurally impossible to leak into outward output. The admin-web detail page also renders them in separate DOM sections (`initial-package-outward` vs `initial-package-admin`) — LOCKED
- **Initial Package `status` is operator-supplied from the §21.5 five-value enum** — `not_requested|not_applicable_yet|review_recommended|rebuild_recommended|conditional_early_draft_possible`. Not derived from evaluation outcome (that would be invented governance). The form requires explicit operator selection — LOCKED
- **`packages/synthesis-evaluation` does not import from `core-state`, `core-case`, or `sessions-clarification`** — CLAUDE.md architecture rule; synthesis/evaluation logic operates on contracts types only. Likewise `packages/packages-output` does not import prompt or state-transition code. Enforced at implementation time, not just at review — LOCKED
- **Contracts owns `SynthesisRecord`, `EvaluationRecord`, and `InitialPackageRecord` types and schemas** — all three are cross-package entities. Domain packages re-export from contracts; none redefine or shadow — LOCKED
- **Persistence adds `StoredSynthesisRecord`, `StoredEvaluationRecord`, `StoredInitialPackageRecord` — each extends the contracts type with `createdAt`** — same pattern used by `StoredCaseRecord`, `StoredSourceRecord`, `StoredPromptRecord`, `StoredSessionRecord`. `createInMemoryStore()` extended to include the three new repos alongside the prior five — LOCKED
- **All three new API routes validate via `validateSynthesisRecord` / `validateEvaluationRecord` / `validateInitialPackageRecord`** — Ajv-derived 400 messages surface directly to the UI's `validation-errors` panel. No hand-written type guards — LOCKED

---

## dependency rules

- **Skeleton packages depend on `@workflow/contracts` via `workspace:*`** — all domain types flow from contracts; packages must not define competing types — LOCKED
- **`shared-utils` is the only package with no `@workflow/*` dep** — by design; see shared-utils rule above — LOCKED
