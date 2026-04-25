# Next Slice — Pass 4: Participant Targeting / Rollout Planning

## Current status

Pass 3 — Hierarchy Intake & Approval is accepted.

Completion label: `pass3_hierarchy_intake_approval_accepted`

Accepted Pass 3 patch chain:

- Patch 1 — Foundation: `c1ae3bc3cc68917687e28d8e0d15fdebe831ff37`
- Patch 2 — Provider-backed hierarchy draft: `553e0205311eb2adfb032d9c53c38502676fd04c`
- Patch 3 — Source-to-hierarchy relevance triage: `e0310277b5223983ef3816a70b89b1ab6788d50a`
- Patch 3.5 — Provider configuration hardening: `c9a608d40e778a2eef0ca10695c5195a7fa880c4`
- Patch 4 — Prompt draft testing and activation controls: `c54052f3f0ae2b9fc8c18a8f1e117be3910f97a4`
- Patch 4.5 — Visual hierarchy workbench: `f16e1cf1d8a0b742d911a5d7468388fa3355d20e`

## Next separate build slice

**Pass 4 — Participant Targeting / Rollout Planning**

Pass 4 begins after accepted Pass 3. It must consume the approved hierarchy/readiness outputs without reopening Pass 3.

## Boundaries preserved

- Pass 3 creates hierarchy intake, AI draft hierarchy, admin correction, source-to-hierarchy evidence candidates, prompt draft testing, structural approval snapshots, readiness snapshots, and visual hierarchy inspectability.
- Pass 3 readiness status is `ready_for_participant_targeting_planning`.
- Pass 3 readiness does not create participant targeting, rollout order, invitations, participant sessions, workflow analysis, synthesis/evaluation, or package generation.
- Source-to-hierarchy links remain evidence candidates only; they are not workflow truth.
- Admin hierarchy approval remains structural approval only; it does not validate KPIs, SOPs, policies, responsibilities, source claims, or actual operational practice.

## Runtime notes preserved

- Current active reasoning provider for Pass 3 proofs: `gemini-3.1-pro-preview`.
- Provider configuration uses `GOOGLE_AI_API_KEY` and optional `GOOGLE_AI_MODEL`.
- Provider diagnostics expose whether a key is present and the resolved model, never the key value.
- No secret values are recorded in handoff files.

## Do not start without operator approval

- Do not start participant targeting until explicitly approved.
- Do not create rollout order, invitations, participant sessions, workflow analysis, synthesis/evaluation, or package generation as part of Pass 3 closure.

## Hard rules

- One pass/slice per session.
- Local patch first.
- No broad rewrites.
- Business logic stays in domain packages, not in admin-web.
- Schema changes go through `packages/contracts`.
- Prove with required commands and route-level/browser checks before closing the slice.
- Update `CURRENT_STATE.md` and `NEXT_PASS.md` at the end of the accepted slice.
