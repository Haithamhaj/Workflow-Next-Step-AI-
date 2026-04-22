# Open Questions

These are genuine unresolved implementation questions that must be answered
before or during the pass that first touches the relevant area. Settled
decisions are not listed here — see DECISIONS_LOG.md.

---

## OQ-001 — Prompt Role Enum Values (surfaced Pass 4, 2026-04-22)

**Section affected:** `packages/contracts` — `prompt-registration.schema.json`, `role` field.

**Question:** The locked reference documents (01 and 02) do not explicitly enumerate the allowed values for a `role` field on prompt records. The `02_Execution_Logic_Specification_FULL .md` section 30.16 enumerates prompt *categories* by purpose (extraction, classification, synthesis, package-section-drafting, clarification-generation) but does not define a separate `role` dimension. The NEXT_PASS.md pass definition mentions "Authority/role classification helpers (e.g. `isSystemPrompt`, `isUserPrompt`)" as examples only (using "e.g.").

**Current resolution for Pass 4:** Used the spec's section 30.16 prompt categories as the `promptType` field enum. Used the pass definition's examples (`system`, `user`) as the `role` field enum with the understanding that this is derived from standard LLM message-format terminology (system-prompt vs user-prompt), not a domain-governance enum. Implemented `isSystemPrompt(prompt)` and `isUserPrompt(prompt)` as classification helpers.

**Operator action required:** Confirm whether `role` values should be:
- `system` | `user` (LLM message-format concept — current Pass 4 implementation)
- Some other set of values specific to the workflow domain
- Removed entirely in favour of `promptType` alone

If the answer changes the enum, update `prompt-registration.schema.json` and re-run `pnpm typecheck`.

---

## OQ-003 — Session Terminal-State Looping (surfaced Pass 5, 2026-04-22)

**Section affected:** `packages/sessions-clarification` — `SessionStateTransitions` table; §28.10 transition rule interpretation.

**Question:** Spec §28.10 reads: `not_started → input_received → extraction_in_progress → follow_up_needed or session_partial or session_ready_for_synthesis`. Three states appear only on the right-hand side: `follow_up_needed`, `session_partial`, `session_ready_for_synthesis`. The spec does not state whether any of these may transition back into the extraction loop (e.g. `follow_up_needed → extraction_in_progress` once an answer is received, or `session_partial → extraction_in_progress` when additional input arrives).

**Current resolution for Pass 5:** All three terminal right-hand states encoded with empty transition arrays (`[]`). Forward-only, literal reading of §28.10. `transitionSession` rejects any onward move from these states. This is the safest interpretation and avoids inventing governance.

**Operator action required:** Confirm whether `follow_up_needed` (and/or `session_partial`) should permit transitions back into `extraction_in_progress` when the operator obtains the needed input, or whether sessions in those states are truly terminal and a new session must be created to continue the clarification loop.

If the answer permits back-transitions, update `SessionStateTransitions` in `packages/sessions-clarification/src/index.ts` and re-run typecheck + proofs.

---

## OQ-004 — Peer-level synthesis enrichment trigger ordering (§19.6–§19.9) (surfaced Pass 6, 2026-04-22)

**Section affected:** `packages/synthesis-evaluation` — synthesis construction path; potentially additional fields on `SynthesisRecord` in `packages/contracts`.

**Question:** Spec §19.6–§19.9 describes a hierarchy of enrichment sources (peer-level synthesis, reference material, prior cases) that may augment a synthesis before it is finalized. The spec describes the *purpose* of each enrichment source but does not specify the exact *trigger ordering* in code — i.e. when (if ever) enrichment runs automatically vs. on operator request, and in what order sources are consulted.

**Current resolution for Pass 6:** Synthesis implementation records the §19.11 minimum output (common path, difference blocks with the five literal §19.3 fields, major unresolved items, closure candidates, escalation candidates, confidence/evidence notes, optional session linkage). No automatic enrichment is performed. Enrichment is effectively deferred to operator action (the operator can re-submit a richer synthesis record). No invented trigger rules.

**Operator action required:** Confirm whether Pass 7+ should introduce an automatic enrichment phase (and if so, literal trigger ordering), or whether enrichment remains operator-driven at the form level. If automated, specify which §19.6–§19.9 source runs first and under what condition.

If the answer introduces automated enrichment, update `synthesis-evaluation` construction logic and potentially extend `synthesis-record.schema.json` with enrichment-provenance fields.

---

## OQ-005 — §21.4 conditional section triggers (surfaced Pass 6, 2026-04-22)

**Section affected:** `packages/contracts` — `initial-package-record.schema.json` (`outward.documentReferenceImplication`); `packages/packages-output` — `createInitialPackage` assembly logic.

**Question:** Spec §21.4 describes a conditional outward section ("document / reference implication") that is included when certain conditions are met, but the conditions for inclusion/exclusion are not literally enumerated in the spec. Similarly, §21.4 may imply additional conditional sections beyond document/reference implication that were not made explicit.

**Current resolution for Pass 6:** `outward.documentReferenceImplication` is modeled as a single optional field. The operator decides whether to populate it (the `/initial-packages/new` form shows it as optional). No automatic trigger logic. Any additional §21.4 sections the spec may imply have not been added because their names and shapes are not literal.

**Operator action required:** Confirm (a) whether §21.4 inclusion should be operator-driven (current Pass 6 behavior) or derived from evaluation / synthesis signals via a literal rule, and (b) whether §21.4 implies additional conditional section fields beyond `documentReferenceImplication`. If either changes the shape, extend `initial-package-record.schema.json` and the assembly logic.

---

*Prior resolved items: RolloutState deferral — recorded in DECISIONS_LOG.md.*
