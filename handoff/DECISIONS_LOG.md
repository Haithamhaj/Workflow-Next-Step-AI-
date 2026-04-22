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
- ~~**Evaluation `outcome` is operator-supplied but constrained by the seven completeness conditions (§20.10)** — §20.10 states the seven conditions "must govern the final outcome." The operator labels the outcome from the four-value enum, but `createEvaluation` enforces: if any `conditions` field is `false` (essential workflow completion is broken), the outcome must be `needs_more_clarification`. Outcomes `ready_for_initial_package` (§20.11), `finalizable_with_review` (§20.13: "no remaining issue breaks essential workflow completion"), and `ready_for_final_package` (§20.14) are all rejected when any condition fails. Axis states (§20.4–20.5) do NOT constrain the outcome — they are "supporting judgment lenses" per §20.10. Full algorithmic derivation is not implemented because §20.11–20.14 use judgment language ("sufficiently complete") that cannot be reduced to a deterministic rule~~ — **SUPERSEDED (2026-04-22)** by the three entries below (boolean semantics, workflow/automation separation, AI-interpreted/admin-routed/rule-guarded model). The mechanical gate `any false → needs_more_clarification` encoded in this entry is the specific implementation that the IMPL-EXTENSION entry requires to be patched. The parts of this entry that remain valid: §20.10 seven conditions do govern the final outcome; axis states are supporting lenses only; §20.11–20.14 use judgment language. The part superseded: the binary boolean gate as the implementation of that governance.
- **Evaluation `outcome` is operator-supplied; seven completeness conditions (§20.10) govern the final outcome — active governance (2026-04-22)** — §20.10 states the seven conditions "must govern the final outcome." The operator labels the outcome from the four-value enum. Axis states (§20.4–20.5) do NOT constrain the outcome — they are "supporting judgment lenses" per §20.10. The governing test is whether a condition failure **materially breaks essential workflow completion** (§20.20), not whether any condition boolean is less than perfectly satisfied. §20.11 explicitly permits `ready_for_initial_package` when remaining issues do not prevent a useful analytical package. §20.13 permits `finalizable_with_review` when no remaining issue breaks essential workflow completion. Only a materially broken condition forces `needs_more_clarification`. The implementation of this governance must follow the AI-interpreted/admin-routed/rule-guarded model (§20.21–§20.22); see entries below — LOCKED
- **Governance: Workflow validity and automation-supportiveness are formally separate maturity levels (2026-04-22)** — Workflow validity (sufficient reconstruction for documentation output) and automation-supportiveness (structural clarity sufficient for later automation execution) are two distinct levels. The system may produce a valid Initial Workflow Package even when the workflow is not yet automation-ready. Non-automatable does not mean workflow-incomplete. §20.19–§20.20 encode this distinction in the spec. The corresponding clarification is also added to §28.7 of `01_Locked_Main_Reference.md` critical-gap section. — LOCKED
- **Consequence for `EvaluationConditions` boolean semantics (2026-04-22)** — The `false` value on a condition boolean encodes "not yet materially satisfied" — not "materially broken." §20.20 explicitly separates these two levels: (a) "not yet fully satisfied" (non-blocking weakness, compatible with `ready_for_initial_package` and `finalizable_with_review`) vs. (b) "materially broken" (blocks essential workflow completion, forces `needs_more_clarification`). The current mechanical gate `any false → needs_more_clarification` treats (a) and (b) identically, which over-constrains the outcome against §20.11 and §20.13. The gate must be patched before Pass 6 is accepted: only a condition failure that **materially breaks essential workflow completion** should force `needs_more_clarification`. Implementation options: (1) add a per-condition `blocking: boolean` field to `EvaluationConditions` in contracts, or (2) remove the mechanical gate and restore pure operator judgment for outcome selection. Operator must choose. — IMPL-EXTENSION (Pass 6 patch required)
- **Governance: Pass 6 evaluation is AI-interpreted, admin-routed, and rule-guarded — not a binary boolean gate (2026-04-22)** — Evaluation must operate on three distinct levels. (1) AI-interpreted: the system interprets each completeness condition issue, explains its specific impact on the workflow, distinguishes whether that impact affects workflow documentability or only automation-readiness, and proposes concrete action options for the admin to consider. Interpretation is the system's job; decision is the admin's job. (2) Admin-routed: the admin or operator is the decision authority for meaningful corrective direction. Outcome selection is not reduced to a deterministic rule because §20.11–20.14 use judgment language that requires human interpretation. (3) Rule-guarded: deterministic enforcement rules remain valid only as narrow hard-stop guards for clearly invalid progression states — not as a gate on every non-perfect condition weakness. Formal consequences: (a) workflow validity and automation-supportiveness must not be collapsed into a single judgment; (b) admin-facing automation limitation notes may coexist with a valid workflow output; (c) non-blocking automation difficulties surface as recommendations, not as workflow failures. §20.21–§20.22 encode this model in the spec. — LOCKED
- **Implementation: §20.21–§20.22 governance via interpretation snapshot pattern (2026-04-22, commit 71d5d80)** — The mechanical gate was replaced with a two-phase snapshot-based model. Phase 1: admin submits conditions + outcome to `POST /api/evaluations/interpret`; server calls LLM (`claude-opus-4-7` via tool_use), stores `InterpretationSnapshot` (including `basis` fields for later integrity verification), returns `{ snapshotId, conditionInterpretations }`. Phase 2: admin reviews interpretations, provides `adminBlockingConfirmations` for each LLM-labelled blocking condition, optionally provides `adminNote`, then submits the final payload referencing `interpretationSnapshotId`. Server enforces basis integrity (conditions + outcome must match snapshot), admin confirmations completeness, adminNote requirement, and the narrow hard-stop (confirmed-blocking + incompatible outcome). `conditionInterpretations` are copied from the snapshot into the stored record — admin cannot modify LLM interpretations. Graceful degradation: LLM failure returns `{}` so evaluation creation is not blocked during development when `ANTHROPIC_API_KEY` is absent. — LOCKED

- **Initial Package structural outward/admin separation (§21.8 + §21.11)** — the schema uses two top-level objects: `outward` (§21.3 five mandatory + §21.4 optional `documentReferenceImplication`) and `admin` (§21.11 `sevenConditionChecklist`, `readinessReasoning`, optional `confidenceEvidenceNotes`, optional `internalReviewPrompts`). The seven-condition checklist has no field on `outward`; it is structurally impossible to leak into outward output. The admin-web detail page also renders them in separate DOM sections (`initial-package-outward` vs `initial-package-admin`) — LOCKED
- **Initial Package `status` is operator-supplied from the §21.5 five-value enum** — `not_requested|not_applicable_yet|review_recommended|rebuild_recommended|conditional_early_draft_possible`. Not derived from evaluation outcome (that would be invented governance). The form requires explicit operator selection — LOCKED
- **`packages/synthesis-evaluation` does not import from `core-state`, `core-case`, or `sessions-clarification`** — CLAUDE.md architecture rule; synthesis/evaluation logic operates on contracts types only. Likewise `packages/packages-output` does not import prompt or state-transition code. Enforced at implementation time, not just at review — LOCKED
- **Contracts owns `SynthesisRecord`, `EvaluationRecord`, and `InitialPackageRecord` types and schemas** — all three are cross-package entities. Domain packages re-export from contracts; none redefine or shadow — LOCKED
- **Persistence adds `StoredSynthesisRecord`, `StoredEvaluationRecord`, `StoredInitialPackageRecord` — each extends the contracts type with `createdAt`** — same pattern used by `StoredCaseRecord`, `StoredSourceRecord`, `StoredPromptRecord`, `StoredSessionRecord`. `createInMemoryStore()` extended to include the three new repos alongside the prior five — LOCKED
- **All three new API routes validate via `validateSynthesisRecord` / `validateEvaluationRecord` / `validateInitialPackageRecord`** — Ajv-derived 400 messages surface directly to the UI's `validation-errors` panel. No hand-written type guards — LOCKED

---

## Pass 7 — Review / Issue Discussion (accepted on `main`, 2026-04-22, merge of `a8f3523`)

> Status: these decisions are baseline-active. Pass 7 was merged into `main` on 2026-04-22 via the linear merge of `codex/pass-7-review-issue-discussion` (`a8f3523`).

- **Pass 7 stayed in the existing `packages/review-issues` package boundary** — repository shape, ownership map, existing skeleton package, and local-patch-first discipline all favored filling the existing package instead of introducing a new sibling package. This preserves the accepted package map without widening scope — IMPL-EXTENSION
- **`ReviewIssueRecord` is the persisted Pass 7 unit** — it contains the literal §25.4 issue brief, scoped discussion thread, linked evidence view model, exact controlled final action set, and an optional release seam object. No separate review wrapper record was introduced in this pass — IMPL-EXTENSION
- **Final admin actions persist the exact §25.10 action and always update `reviewState` to `action_taken`** — this preserves the mandatory state update from §25.12 while keeping the literal §28.14 flow intact (`... -> issue_discussion_active -> action_taken -> review_resolved`) and avoids inventing which actions auto-resolve the review — LOCKED
- **Review resolution stays explicit and separate from final action application** — `action_taken -> review_resolved` happens through the explicit review-state transition path, not through inferred action semantics — LOCKED
- **Issue severity / effect level remains free text** — §25.4 requires the field but does not enumerate allowed values. The contract captures the literal field without inventing a severity enum — LOCKED
- **Linked evidence is modeled as a narrow traceability object** — `label` + `relevance` are required; additional traceability fields (`sourceReference`, `sourceSectionLink`, `decisionBlockLink`, `promptLink`, `sessionId`, `sourceId`) are optional and map directly to the traceability guidance in §25.6–§25.7 and §29.2.3 — IMPL-EXTENSION

---

## dependency rules

- **Skeleton packages depend on `@workflow/contracts` via `workspace:*`** — all domain types flow from contracts; packages must not define competing types — LOCKED
- **`shared-utils` is the only package with no `@workflow/*` dep** — by design; see shared-utils rule above — LOCKED
