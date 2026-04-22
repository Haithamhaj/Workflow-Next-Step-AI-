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

*Prior resolved items: RolloutState deferral — recorded in DECISIONS_LOG.md.*
