# @workflow/core-state

**Owns** (handoff §5.3): state families, transition rules, transition guards,
override policy boundaries, release-state separation, review-state separation.

**Does not own:** case lifecycle coordination (that's `core-case`), persistence,
UI, or any prompt-governed behavior.

**Pass 1 status:** skeleton only. Transition matrix lands in Pass 2.
