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

*Prior resolved items: RolloutState deferral — recorded in DECISIONS_LOG.md.*
