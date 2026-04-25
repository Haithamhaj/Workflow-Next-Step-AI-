# Next Slice — Pass 5: Participant Session Outreach / Narrative-First Clarification

## Current status

Pass 4 — Participant Targeting / Rollout Planning is accepted, closed, archived, and merged to `main`.

Completion label: `pass4_targeting_rollout_accepted`

Pass 5 status: not started.

Pass 5 must not be started in this pass. Start it only in a new, explicitly scoped Pass 5 conversation.

Accepted Pass 3 patch chain:

- Patch 1 — Foundation: `c1ae3bc3cc68917687e28d8e0d15fdebe831ff37`
- Patch 2 — Provider-backed hierarchy draft: `553e0205311eb2adfb032d9c53c38502676fd04c`
- Patch 3 — Source-to-hierarchy relevance triage: `e0310277b5223983ef3816a70b89b1ab6788d50a`
- Patch 3.5 — Provider configuration hardening: `c9a608d40e778a2eef0ca10695c5195a7fa880c4`
- Patch 4 — Prompt draft testing and activation controls: `c54052f3f0ae2b9fc8c18a8f1e117be3910f97a4`
- Patch 4.5 — Visual hierarchy workbench: `f16e1cf1d8a0b742d911a5d7468388fa3355d20e`

## Accepted Pass 4 surface

- `packages/targeting-rollout` owns Pass 4 planning/domain logic.
- `TargetingRolloutPlan` is the main persisted object and embeds packet summary, candidates, admin decisions, contact profiles, source signals, question-hint seeds, rollout order, final review, state, approval metadata, and boundary confirmations.
- Pass 4 consumes approved Pass 3 hierarchy/readiness snapshots and blocks when readiness is missing.
- Provider-backed packet generation uses the existing integration provider interface; failures are persisted visibly with manual fallback.
- Admin can accept/reject/edit candidates, edit contact profiles, dismiss hint seeds, and approve as `approved_ready_for_outreach` or `approved_with_contact_gaps`.
- Preferred channel remains optional; multiple channels without a preferred channel create `preferred_channel_not_selected` but do not automatically block approval.
- PromptSpec governance exists at `/targeting-rollout/prompts`.

## Next separate build slice

**Pass 5 — Participant Session Outreach / Narrative-First Clarification**

Pass 5 begins after accepted Pass 4. It must consume approved Pass 4 targeting/rollout plans without reopening Pass 2, Pass 3, or Pass 4.

Outreach/session creation begins only inside Pass 5 scope. Workflow analysis remains out unless explicitly scoped later.

## Boundaries preserved

- Pass 3 creates hierarchy intake, AI draft hierarchy, admin correction, source-to-hierarchy evidence candidates, prompt draft testing, structural approval snapshots, readiness snapshots, and visual hierarchy inspectability.
- Pass 4 creates admin-reviewed participant targeting and rollout planning only.
- Pass 4 approved states are `approved_ready_for_outreach` and `approved_with_contact_gaps`.
- Pass 4 does not send outreach, create invitations, create participant sessions, collect participant responses, perform workflow analysis, synthesis/evaluation, or package generation.
- Source-to-hierarchy links remain evidence candidates only; they are not workflow truth.
- Admin hierarchy approval remains structural approval only; it does not validate KPIs, SOPs, policies, responsibilities, source claims, or actual operational practice.
- Pass 4 question-hint seeds are analytical Pass 5 inputs only. Pass 5 must remain narrative-first: participant first narrative, extraction of covered items, unresolved hint check, then optional targeted clarification only if still relevant.

## Runtime notes preserved

- Current active reasoning provider for Pass 3 proofs: `gemini-3.1-pro-preview`.
- Provider configuration uses `GOOGLE_AI_API_KEY` and optional `GOOGLE_AI_MODEL`.
- Provider diagnostics expose whether a key is present and the resolved model, never the key value.
- No secret values are recorded in handoff files.
- Patch 3.5 and Patch 4 recorded provider-success outcomes but did not record the exact local command or secret-loading path used for those proofs. Canonical Workflow AI proof convention going forward:
  - canonical ignored env file: `/Users/haitham/development/Workflow/.env.local`;
  - canonical key: `GOOGLE_AI_API_KEY`;
  - start the admin runtime with `cd /Users/haitham/development/Workflow && set -a && source /Users/haitham/development/Workflow/.env.local && set +a && pnpm --filter @workflow/admin-web start -H 127.0.0.1 -p 3113`;
  - verify with `curl -sS http://127.0.0.1:3113/api/provider-status`.
- `WORKFLOW_ENV_FILE` is an optional override for temporary proof environments only. If Pass 3 ever used another project env file such as `/Users/haitham/development/AI-Coach-Mastery/.env`, record that as a historical temporary workaround, not the canonical Workflow proof method.
- The shared Google resolver loads `GOOGLE_AI_API_KEY` and `GOOGLE_AI_MODEL` from the process env first, then from `WORKFLOW_ENV_FILE` when explicitly supplied, then from ignored `.env.local` / `.env` files in the app cwd or repo root. It does not log or expose key values.
- Required safe provider proof fields are `googleAI.provider: google`, `googleAI.keyPresent: true`, `googleAI.diagnosticsStatus: provider_success`, and `googleAI.resolvedModel: gemini-3.1-pro-preview` unless `GOOGLE_AI_MODEL` is intentionally configured.
- Future AI-backed passes must run `/api/provider-status` and get `provider_success` with `keyPresent: true` before claiming live provider-backed success. Provider fallback/manual paths may still be proven separately, but they do not satisfy live AI proof.
- Cross-pass regression result before Pass 4 acceptance: Pass 2, Pass 3, and Pass 4 all used the canonical Workflow `.env.local` method and resolved Google/Gemini through the shared provider configuration. Pass 4 packet proof persisted `targeting_packet_1fb549ec-ff51-4675-afee-9884037ce917` with provider execution ref `google:gemini-3.1-pro-preview` and non-empty candidates/source hints.

## Do not start without operator approval

- Do not start participant outreach or session creation until explicitly approved.
- Do not send WhatsApp, Telegram, SMS, or email as part of Pass 4.
- Do not generate active invitation links as part of Pass 4.
- Do not treat Pass 4 question-hint seeds as participant-facing questions.

## Hard rules

- One pass/slice per session.
- Local patch first.
- No broad rewrites.
- Business logic stays in domain packages, not in admin-web.
- Schema changes go through `packages/contracts`.
- Prove with required commands and route-level/browser checks before closing the slice.
- Update `CURRENT_STATE.md` and `NEXT_PASS.md` at the end of the accepted slice.
