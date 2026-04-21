# Open Questions

These are genuine unresolved implementation questions that must be answered
before or during the pass that first touches the relevant area. Settled
decisions are not listed here — see DECISIONS_LOG.md.

---

## Q1 — RolloutState values are not enumerated in spec §28.7
**Affects:** Pass 2B — blocks acceptance of full Pass 2
**Status:** BLOCKING — operator decision required before Pass 2B begins
**Detail:** Spec §28.7 describes rollout readiness in terms of four pillars
(hierarchy, reference, targeting, admin approval) but never provides a flat
list of string values for `RolloutState`. Four other state families were filled
in Pass 2A from their respective spec sections (§28.9, §28.11, §28.13, §28.15).
`RolloutState` remains a branded placeholder and cannot be used in any business
logic until the operator either supplies the values or formally records a deferral.

**Required operator action before Pass 2B implementation begins:**
Choose one:
- Provide the enumerated `RolloutState` string values → agent fills the type
- Confirm explicit deferral → agent logs the decision and removes the blocker without filling the type

Do not guess. Do not approximate.
