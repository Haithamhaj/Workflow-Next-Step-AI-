# START HERE — Mandatory Agent Entry Point

Read every document below in this exact order before writing a single line of code.
Do not skip. Do not reorder. Do not begin implementation until all 8 are read.

---

## Required Reading Order

1. `01_Locked_Main_Reference.md`
2. `02_Execution_Logic_Specification_FULL.md`
3. `03_Implementation_Handoff_Plan_Coding-Agent-First.md`
4. `handoff/CURRENT_STATE.md`
5. `handoff/NEXT_PASS.md`
6. `handoff/DECISIONS_LOG.md`
7. `handoff/REPO_MAP.md`
8. `handoff/OPEN_QUESTIONS.md`

---

## Rules

**One pass only.**
Execute the pass defined in `handoff/NEXT_PASS.md`. Do not begin the subsequent pass.
Stop when the scope of the current pass is complete.

**Do not invent missing governance.**
If a value, rule, transition, or constraint is not specified in the documents above,
do not guess, approximate, or derive it from context. Surface the ambiguity and stop.

**Prove results, not intentions.**
Every required proof item in `handoff/NEXT_PASS.md` must be demonstrated with actual
command output, curl responses, or browser evidence. Stating that something "should work"
or "is implemented" is not proof.

**Update handoff files before ending a pass.**
When a pass is complete, rewrite `handoff/CURRENT_STATE.md` to reflect the new state
and update `handoff/NEXT_PASS.md` for the following pass. Do not end a session with
stale handoff files.

**Stop immediately when ambiguity affects states, contracts, review logic, release logic, or package eligibility.**
If any unresolved question affects state values, state transitions, contract schemas,
review logic, release routing, or package eligibility — stop immediately. Do not
implement a placeholder or approximation. Record the question in `handoff/OPEN_QUESTIONS.md`
and surface it to the operator.
