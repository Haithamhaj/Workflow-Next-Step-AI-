# Accepted Baselines

This folder records accepted historical baselines used as authority for later WDE passes.
These records normalize archive pointers only. They do not reopen prior passes, rebuild proof
scripts, or change runtime behavior.

Current main authority checked for this normalization:
`669297637d6ef0c3e27a0e0967aa44e77d9ddbd8`

## Baseline Records

| Pass | Accepted status | Authoritative archive file(s) | Accepted/source commit when known | Integrated main-lineage commit when different | Accepted commit ancestor of current main? | Proof script availability | Safe as later-pass authority? |
|---|---|---|---|---|---|---|---|
| Pass 2 | `pass2_complete_after_all_proofs` | `handoff/accepted-baselines/PASS2_INTAKE_CONTEXT_BUILD_SPEC_ARCHIVED.md`; `handoff/PASS2_LOCAL_PERSISTENCE.md` | `a90f963d4f3a5691638bcebccdf7a33d54eb45db` | same | yes | `scripts/prove-pass2-phase1.mjs` is present; later historical proofs are documented in the archive but not all preserved as standalone scripts | yes |
| Pass 3 | accepted and closed | `handoff/PASS3_HIERARCHY_INTAKE_APPROVAL_BUILD_SPEC.md` | `4343b7792957ae99964bf1a5cb8ae272453779cc` | `60ab2be6a11634fa175911dba85498a7286fc6c4` | no for pre-rebase accepted/reference commit; yes for integrated closure commit | no standalone Pass 3 proof scripts found in current `scripts`; proof commands/results are preserved in the handoff spec and history | yes, with archival pointer caveat |
| Pass 4 | `pass4_targeting_rollout_accepted` | `handoff/PASS4_TARGETING_ROLLOUT_BUILD_SPEC.md`; `handoff/CURRENT_STATE.md` | `14c32adbcd1156ce6e18490468f866e922745e07` | same | yes | no standalone Pass 4 proof scripts found in current `scripts`; proof status is preserved in handoff/current-state records | yes |
| Pass 5 | `pass5_participant_session_outreach_accepted` | `handoff/PASS5_FINAL_ARCHIVE_REFERENCE.md`; `handoff/CURRENT_STATE.md`; `handoff/NEXT_PASS.md` | source branch: `88bb9ab094d536b119095d919d38cf2b73b0014c`; final integrated main: `518748da7719b6a62c79a25bc227b1685701a84f` | `518748da7719b6a62c79a25bc227b1685701a84f` | yes | full Pass 5 proof script set is present, including `scripts/prove-pass5-block1-contracts.mjs` through `scripts/prove-pass5-block14-full-live.mjs` and related live/complex-scenario proofs | yes; direct accepted baseline authority for Pass 6 |

## Archival Caveats

- Pass 2 is archived under `handoff/accepted-baselines/` and remains integrated into the
  current main lineage.
- Pass 3 has a rebase pointer caveat:
  `4343b7792957ae99964bf1a5cb8ae272453779cc` is a pre-rebase accepted/reference commit.
  `60ab2be6a11634fa175911dba85498a7286fc6c4` is the rebased/integrated main closure.
  This is an archival pointer caveat, not a Pass 3 rejection.
- Pass 4 accepted commit `14c32adbcd1156ce6e18490468f866e922745e07` is integrated into
  the current main lineage.
- Pass 5 is the direct accepted baseline authority for Pass 6.

## Baseline Chain Status

- `baseline_chain_status: usable_with_archival_caveats`
- `runtime_code_changed: false`
- `passes_reopened: none`
- `next_safe_action: continue_from_current_main`
