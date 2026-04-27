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

## Pass 6 Block 0 — Build Readiness and Spec Cleanup

- **Technical Decomposition v4 is the active Pass 6 build map** — Pass 6 restarts from the current live reference after the Pass 5 final archive. Older Pass 6 / 7 / 8 / 9 block maps and branch-era records are historical only when they conflict with this active map — LOCKED
- **Build Spec Structure v1 is active** — no v1.1 cleanup is required in Block 0. Future block specs should follow v1 unless the operator explicitly accepts a later structure revision — LOCKED
- **Pass 6 Block 0 is documentation-only** — no contracts, persistence, UI, Prompt Workspace, provider execution, 6A/6B/6C logic, Visual Core integration, Copilot, or Pass 7 mechanics begin in Block 0 — LOCKED
- **Conceptual closure is confirmed for 6A, 6B, Pre-6C Gate, Cross-Department / External Interface Governance, and 6C** — these are planning closure statements only and do not imply implementation exists — FORMALIZED
- **Provider direction preserved for Pass 6 planning** — OpenAI / GPT remains default for text intelligence unless explicitly changed by the operator later; Google remains the direction for STT/OCR and existing accepted Google-backed surfaces; provider success must never be faked — LOCKED
- **Workflow / visual-core boundary is fixed for later Block 17** — WDE owns workflow truth, package eligibility, and WorkflowGraph JSON construction. `workflow-visual-core` owns validation and rendering only. WDE must later implement `buildPackageVisuals(graph)` as a local wrapper over `validateWorkflowGraph`, `toMermaid`, and `toReactFlow`; Block 0 does not implement it — LOCKED

## Pass 6 Block 1 — Core Contracts and Schema Seams

- **Pass 6 core seams live in `packages/contracts` only** — Block 1 adds Draft-07 schemas, hand-mirrored TypeScript types, and validators for the active Pass 6 block map without adding persistence, UI, provider execution, analysis behavior, package generation, visual integration, Copilot behavior, or Pass 7 mechanics — LOCKED
- **`SynthesisInputBundle` preserves accepted Pass 5 outputs for later synthesis without revalidating Pass 5** — the contract requires the four conceptual material folders (`analysis_material`, `boundary_role_limit_material`, `gap_risk_no_drop_material`, `document_source_signal_material`) plus role/layer, truth-lens, and preparation-summary context — LOCKED
- **`WorkflowClaim` remains pre-truth assembly material** — claims carry source/basis, confidence/materiality placeholders, and review statuses, but a claim is explicitly not final workflow truth — LOCKED
- **`WorkflowGraphRecord` is a WDE-side storage/pass-through seam only** — it records graph JSON, Mermaid, React Flow model, and validation errors using visual-core enum values, but does not call or implement `workflow-visual-core` — LOCKED
- **`Pass7ReviewCandidate` is candidate-only** — it carries a source Pass 6 result, reason, linked references, route, and status, but no discussion thread, review action, or final decision mechanics — LOCKED

## Pass 6 Block 2 — Persistence and Repository Layer

- **Pass 6 persistence stores supplied records only** — repositories save, read, list, find by case where available, and update supplied records without deriving workflow claims, readiness decisions, package eligibility, prompt outputs, visuals, Copilot answers, or Pass 7 review mechanics — LOCKED
- **Pass 6 core records use a grouped SQLite payload table** — the persistence layer stores Block 1 record families in `pass6_core_records` keyed by record type and id, with a case-id index where the contract carries `caseId`; this avoids broad bespoke table work while keeping record responsibilities typed at the repository boundary — IMPL-EXTENSION
- **Stored Pass 6 records preserve timestamp fields without becoming contract validators** — persistence record types add or preserve `createdAt` / `updatedAt` where needed, but validation remains owned by `packages/contracts` and no business rules are added at save time — LOCKED

## Pass 6 Block 3 — Admin Configuration and Policy Control Layer

- **Pass 6 admin configuration is separate from locked governance** — admins may adjust thresholds, weights, labels, display preferences, templates, and method activation, but may not edit truth/governance boundaries such as no Pass 5 revalidation, candidate-only items not becoming truth, scores not approving packages, visual renderers not owning truth, and Copilot read-only default — LOCKED
- **Configuration lifecycle is versioned and admin-visible** — profiles support `draft`, `active`, `previous`, and `archived`; promotion moves the prior active profile to previous; rollback creates a new draft from a previous profile instead of mutating history — LOCKED
- **Prompt behavior profile is a reference/config placeholder only in Block 3** — Prompt editing and prompt execution belong to the later Prompt Workspace / PromptOps block, not this configuration block — LOCKED
- **Configuration helpers own lifecycle rules, not admin-web** — admin-web calls thin API routes backed by `@workflow/synthesis-evaluation` helpers; persistence stores supplied profiles only — LOCKED

## Pass 6 Block 4 — Prompt Workspace / PromptOps Layer

- **Pass 6 PromptSpecs are structured Prompt Workspace records, not provider execution units** — PromptSpecs support lifecycle, editable structured sections, deterministic compiled prompt preview, draft-vs-active comparison, provider/model preference references, and offline test case records; Block 4 never calls providers or runs production AI prompts — LOCKED
- **Prompt behavior cannot own governance or policy truth** — PromptSpecs may guide wording, extraction support, explanation, drafting style, and later read-only Copilot responses, but they cannot own scoring weights, method registry truth, readiness thresholds, package eligibility, review/release decisions, locked governance rules, or state transitions — LOCKED
- **Prompt Workspace lifecycle helpers live in `packages/prompts`, not admin-web** — admin-web exposes the Prompt Workspace through thin API and page surfaces; lifecycle, validation, preview, comparison, and test case helper behavior stay in the prompts package while persistence stores supplied records only — LOCKED
- **Prompt Workspace test cases are offline records until Block 5** — test case fixtures and expected-output notes can be stored and linked to PromptSpecs, but provider-backed test execution and output comparison belong to Provider Execution and Prompt Test Harness Foundation — LOCKED

## Pass 6 Block 5 — Provider Execution and Prompt Test Harness Foundation

- **Provider execution in Block 5 is Prompt Workspace testing only** — the harness can run stored test cases against draft/active PromptSpecs and persist results, but outputs remain inspection artifacts and cannot become 6A evidence, 6B claims, readiness results, Pre-6C inquiries, 6C package content, visual graph data, Copilot state, or Pass 7 candidates — LOCKED
- **OpenAI / GPT is the default Pass 6 text test provider** — Google remains the direction for STT/OCR and existing accepted Google-backed surfaces, and Gemini/Google text remains configurable through existing provider patterns, but it is not the silent default for Pass 6 text reasoning — LOCKED
- **Provider failures are first-class persisted results** — missing credentials, provider errors, rate limits, model issues, and runtime failures are stored as failed prompt test execution results with diagnostics; no fake success or placeholder output is allowed — LOCKED
- **Compiled prompt snapshots are stored for traceability** — every Prompt Workspace execution stores the deterministic compiled prompt plus test fixture context used for the run, so later review can inspect exactly what was sent to the provider — LOCKED
- **Provider runtime metadata must be explicit** — token usage is captured and persisted when a provider returns it; if usage is missing, the result stores an explicit unavailable flag and reason. Cost estimates are unavailable until an approved pricing profile exists; no hard-coded real-world pricing is used — LOCKED

## Pass 6 Block 6 — 6A SynthesisInputBundle Builder

- **6A preparation trusts accepted Pass 5 status and does not redo Pass 5** — the builder consumes records already marked ready/accepted by Pass 5 and does not re-extract, revalidate evidence, reapprove transcripts, call providers, or ask clarification questions — LOCKED
- **6A sorts material into the four approved bundle folders only** — accepted extraction and resolved clarification material goes to `analysis_material`; boundaries and role limits go to `boundary_role_limit_material`; unresolved, disputed, defective, low-confidence, unmapped, and candidate-only material goes to `gap_risk_no_drop_material`; document/source signals and question hints go to `document_source_signal_material` — LOCKED
- **6A does not upgrade risky or candidate-only material into workflow truth** — open, disputed, defective, unresolved, low-confidence, and Pass 6 handoff candidate records are preserved for later synthesis/review and remain non-final — LOCKED
- **Document/source signals remain signals only** — SOP/SLA/policy/KPI/role-document hints can be carried forward for later comparison, but 6A does not treat them as operational truth by default — LOCKED
- **6A persistence uses the existing SynthesisInputBundle repository only** — persistence stores the prepared bundle when provided; no business logic is added to persistence and no 6B, Pre-6C, 6C, visual, Copilot, or Pass 7 records are created — LOCKED

## Pass 6 Block 7 — 6A Admin Bundle Review Surface

- **The 6A admin surface is inspection-only** — admins can list bundles, view bundle detail, and build a new bundle from eligible accepted Pass 5 outputs, but the surface does not expose approve-as-truth, claim generation, scoring, readiness, package, visual, Copilot, provider, or Pass 7 actions — LOCKED
- **Bundle creation from the admin surface calls the Block 6 builder and does not mutate Pass 5 records** — creation stores a new `SynthesisInputBundle` review record only when eligible accepted Pass 5 outputs exist; empty/no-eligible cases return a structured error — LOCKED
- **Risk/open/candidate-only material remains visible but non-final** — unresolved, disputed, defective, unmapped, low-confidence, candidate-only, and admin-review-needed records are shown for review without upgrading them into workflow truth — LOCKED
- **Document/source signals remain visibly signal-only in the admin surface** — the UI and review detail output explicitly state that document/source signals are not operational truth by default — LOCKED
- **Boundary warnings are part of the review surface** — detail output states that 6A preparation has occurred and that no workflow synthesis, workflow readiness evaluation, or package generation has occurred — LOCKED

## Pass 6 Block 8 — 6B Method Registry and Analysis Policy

- **Method registry is metadata and policy only in Block 8** — methods/lenses/tools are defined, versioned, admin-visible, config-resolved, and traceable, but they are not applied to workflow units, claims, differences, drafts, readiness, or packages in this block — LOCKED
- **Default method selection is represented but not executed** — problem-type mappings identify the primary method for later blocks, while Block 8 performs no workflow unit extraction, claim formation, scoring, or difference interpretation — LOCKED
- **Conditional multi-lens policy prevents false clean merges** — complementary findings may be merged later, supporting findings may raise confidence later, and conflicting findings must be routed as differences later instead of being merged into fake clean workflow — LOCKED
- **Method active/inactive state is configurable through Pass 6 configuration profiles** — admins can toggle methods in draft configuration, but locked method boundaries remain visible and not editable as behavior rules — LOCKED
- **Admin-forced methods are traceability scaffold only** — forcing a method is represented for later analysis traceability and does not execute analysis, approve truth, or override locked governance in Block 8 — LOCKED

## Pass 6 Block 9 — 6B Workflow Unit and Claim Pipeline

- **Workflow units are intermediate extraction records, not workflow steps by default** — the pipeline creates units from 6A bundle material while preserving source folder, source basis, role/layer context, and truth-lens context, but unit creation does not assemble a workflow — LOCKED
- **Workflow claims are typed proposed analysis records, not final workflow truth** — claims may be accepted for later assembly only when based on accepted participant extraction material; document-only, unresolved, disputed, defective, low-confidence, and candidate-only material remains warning, unresolved, proposed, or review-needed — LOCKED
- **Document/source signals stay signal-only in claim formation** — document/source material can produce inspectable warning/proposed claims for later comparison, but it is not treated as operational reality by Block 9 — LOCKED
- **Preliminary confidence/materiality indicators are advisory only** — indicators can support later review and traceability but cannot approve readiness, generate package eligibility, resolve conflicts, or replace admin decisions — LOCKED
- **Block 9 persistence stores only units and claims** — no DifferenceInterpretation, workflow draft, readiness result, Pre-6C result, package, visual, Copilot, or Pass 7 record is created by the claim pipeline — LOCKED

## Pass 6 Block 10 — 6B Difference Interpretation and Multi-Lens Engine

- **Difference interpretation is advisory and not workflow assembly** — Block 10 classifies claim relationships as completion, variant, normative/reality mismatch, or factual conflict, but does not build the workflow, decide readiness, or generate package content — LOCKED
- **Method usage must consume registered Block 8 method cards** — every method usage record references the registered method key, method ID/name/version, reason, impact summary, suitability, limitations, and selection source — LOCKED
- **Conditional multi-lens behavior is bounded** — the engine starts with a primary method and adds secondary lenses only for uncertainty, high materiality, low confidence, dispute, document sensitivity, or layer sensitivity; it does not run every method on every claim — LOCKED
- **Documents and hierarchy do not become automatic truth** — document/source signals and higher hierarchy layers can create mismatches or variants, but they do not override participant evidence or determine truth by rank — LOCKED
- **Conflicts are not cleaned up by inference** — factual conflicts and conflicting method findings must remain differences for later clarification/review and must not be merged into a fake clean workflow — LOCKED
- **Block 10 does not create downstream decision records** — no assembled workflow draft, readiness result, Pre-6C result, package, visual, Copilot, or Pass 7 record is created by difference interpretation — LOCKED

## Pass 6 Block 11 — 6B Workflow Assembly and Claim-Basis Map

- **Workflow assembly creates current understanding, not readiness** — Block 11 can produce an `AssembledWorkflowDraft` and workflow understanding level, but it does not evaluate seven conditions, decide readiness, or determine 6C eligibility — LOCKED
- **Accepted claims are the only clean assembly source by default** — warning, unresolved, review-needed, candidate, or document-only claims remain caveats/unresolved/source-signal material unless supported by participant evidence — LOCKED
- **Variants and conflicts remain visible** — variant differences are preserved as variants; normative/document mismatches remain caveats; factual conflicts remain unresolved/review-needed and are not auto-resolved — LOCKED
- **Claim-basis map is required assembly traceability** — assembled elements carry claim IDs, source unit IDs, participant/session/layer context, truth-lens context, method usage IDs, difference IDs, evidence/source basis, confidence, and materiality where available — LOCKED
- **Block 11 persistence stores only assembled draft records** — no readiness result, Pre-6C result, package, visual, Copilot, or Pass 7 record is created by workflow assembly — LOCKED

## Pass 6 Block 12 — 6B Seven-Condition Evaluation and Workflow Readiness Result

- **Seven-condition assessment is the official 6B bridge, not package generation** — Block 12 produces `SevenConditionAssessment` and `WorkflowReadinessResult` records only; it does not create Pre-6C gates, questions, packages, visuals, Copilot state, or Pass 7 records — LOCKED
- **All seven condition keys are exact-map required** — readiness evaluation must populate each required condition exactly once with status, rationale, basis, and `blocksInitialPackage` — LOCKED
- **Warnings and automation weakness are not automatic blockers** — non-blocking warnings and automation-readiness weaknesses remain visible but do not by themselves make workflow documentability incomplete — LOCKED
- **6C permission is explicit and narrow** — `is6CAllowed` is true only for `ready_for_initial_package` and `ready_for_initial_package_with_warnings`; all other readiness decisions block 6C by default — LOCKED
- **Scores and documents do not approve readiness** — confidence, scoring support, consensus, or document/source signals may inform assessment but cannot approve package readiness or turn document claims into operational truth by themselves — LOCKED

## Pass 6 Block 13 — 6B Methodology / Analysis Report and Admin Evaluation Surface

- **Analysis report is a view model, not new analysis truth** — Block 13 renders existing claims, method usage, differences, assembled draft, seven-condition assessment, and readiness results without changing readiness or creating new truth records — LOCKED
- **Report audience is admin/internal only** — the Methodology / Analysis Report is explicitly not the client-facing Initial Workflow Package; 6C later decides what becomes client-facing — LOCKED
- **Admin evaluation surface is read-only for Block 13** — allowed actions are list/view/rebuild deterministic report output from existing records only; no readiness override, package generation, question generation, provider run, or Pass 7 candidate creation is available — LOCKED
- **Decision-needed panel preserves distinctions** — blockers, review-needed conflicts, clarification-needed gaps, and proceedable warnings must remain separately visible rather than collapsed into a single status — LOCKED
- **Block 13 creates no downstream records** — no PrePackageGateResult, InitialWorkflowPackage, WorkflowGapClosureBrief, visual record, Copilot context, or Pass 7 review candidate is created by the report layer — LOCKED

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

## Historical Parked Pass 6 — Synthesis + Evaluation + Initial Package (branch `pass-6-synthesis-evaluation`)

> Status: this older branch-era block map is historical and parked for the current Pass 6 restart. It must not override `PASS5_FINAL_ARCHIVE_REFERENCE.md`, Technical Decomposition v4, Build Spec Structure v1, or the active Pass 6 block map. Entries below are retained as historical context only unless explicitly re-adopted by a later active Pass 6 block.

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

## Historical Parked Pass 7 — Review / Issue Discussion

> Status: these entries belong to an older parked pass map. They are historical only for the current Pass 6 restart unless explicitly re-adopted by a later active block.

- **Pass 7 stayed in the existing `packages/review-issues` package boundary** — repository shape, ownership map, existing skeleton package, and local-patch-first discipline all favored filling the existing package instead of introducing a new sibling package. This preserves the accepted package map without widening scope — IMPL-EXTENSION
- **`ReviewIssueRecord` is the persisted Pass 7 unit** — it contains the literal §25.4 issue brief, scoped discussion thread, linked evidence view model, exact controlled final action set, and an optional release seam object. No separate review wrapper record was introduced in this pass — IMPL-EXTENSION
- **Final admin actions persist the exact §25.10 action and always update `reviewState` to `action_taken`** — this preserves the mandatory state update from §25.12 while keeping the literal §28.14 flow intact (`... -> issue_discussion_active -> action_taken -> review_resolved`) and avoids inventing which actions auto-resolve the review — LOCKED
- **Review resolution stays explicit and separate from final action application** — `action_taken -> review_resolved` happens through the explicit review-state transition path, not through inferred action semantics — LOCKED
- **Issue severity / effect level remains free text** — §25.4 requires the field but does not enumerate allowed values. The contract captures the literal field without inventing a severity enum — LOCKED
- **Linked evidence is modeled as a narrow traceability object** — `label` + `relevance` are required; additional traceability fields (`sourceReference`, `sourceSectionLink`, `decisionBlockLink`, `promptLink`, `sessionId`, `sourceId`) are optional and map directly to the traceability guidance in §25.6–§25.7 and §29.2.3 — IMPL-EXTENSION

---

## Output Formalization (adopted 2026-04-22, pre-Pass 8)

- **Output formalization adopted as non-governing enhancement; prompt reinforcement deferred** — enterprise-facing wording refinement, targeted document naming, section-label normalization, and final deliverable presentation are documentation-first improvements that do not require mechanics changes. Adopted as a non-governing enhancement layer. Pass 8 may consume output wording/naming/presentation improvements on client-facing surfaces (`packages/packages-output`, `apps/admin-web` output surfaces). Prompt reinforcement (rewriting or rebuilding prompt-chain logic) belongs to a separate later prompt-rebuild/analysis-improvement track and is outside Pass 8 scope. This decision does not alter state logic, package-entry conditions, review/release gates, blocking thresholds, or governance contracts — FORMALIZED

---

## Historical Parked Pass 9 — Package Preview + Release Decision Surface

> Status: these entries belong to an older parked pass map. They are historical only for the current Pass 6 restart unless explicitly re-adopted by a later active block.

- **Pass 9 is a presentation-layer pass only** — it builds the client-facing delivery surface on top of accepted Pass 8 package logic. No new mechanics, state transitions, contracts, release logic, review logic, analysis logic, or prompt-chain logic were introduced — LOCKED
- **Global shell reads "Workflow" on all pages** — `layout.tsx` title/description and `Nav.tsx` heading changed from "Workflow Admin" / "admin shell" to "Workflow". No admin-centric wording remains on client-facing surfaces — LOCKED
- **`lib/package-surface.ts` owns surface generation** — `dedupedTitle()` prevents word duplication in generated titles; `buildPackageListItem()` and `buildPackageDetail()` generate list and detail view models consumed by page components. Surface logic stays in admin-web, not in domain packages — IMPL-EXTENSION
- **Package aggregation via existing API routes** — `/api/packages` and `/api/packages/:id` aggregate initial + final packages from existing repositories. No new persistence or domain logic added — IMPL-EXTENSION
- **No next pass (Pass 10) is defined in any authority file** — operator must define next pass scope before any further implementation pass begins — FORMALIZED

---

## dependency rules

- **Skeleton packages depend on `@workflow/contracts` via `workspace:*`** — all domain types flow from contracts; packages must not define competing types — LOCKED
- **`shared-utils` is the only package with no `@workflow/*` dep** — by design; see shared-utils rule above — LOCKED
