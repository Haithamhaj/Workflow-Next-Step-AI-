# @workflow/core-case

**Owns** (handoff §5.4): case lifecycle coordination, readiness coordination,
rollout coordination, cross-module case flow.

**Does not own:** state transition rules (those live in `core-state`), source
intake (see `sources-context`), persistence, UI.

**Pass 1 status:** skeleton only. Case lifecycle baseline lands in Pass 2.
