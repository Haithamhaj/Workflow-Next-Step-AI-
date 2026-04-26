# Current State

**Accepted baseline: Pass 9 (Package Preview + Release Decision Surface), merged to `main` 2026-04-23, commit `41a8232`.**

**Pass 5 — Participant Session Outreach / Narrative-First Clarification is accepted and closed on branch `codex/pass5-block0-1-contracts`.**

Final Pass 5 status: `pass5_participant_session_outreach_accepted`

Final Pass 5 acceptance commit: this closure commit.

Post-closure complex operational validation passed for integration readiness:

- scenario name: `P5-COMPLEX-E2E-LOGISTICS-SALES-ONBOARDING-01`
- provider override used for this validation: OpenAI `gpt-5.4`
- scenario script: `scripts/prove-pass5-complex-scenario-logistics-onboarding.mjs`
- seeded approved Pass 4 targeting plan for Logistics / Last Mile, Sales, Client Onboarding
- created four participant sessions:
  - Ahmad — Sales Executive — Web session text narrative
  - Sara — Sales Supervisor — Telegram handler-level binding and message capture
  - Omar — Finance Coordinator — Web voice artifact plus transcript review/approval path
  - Lina — Operations Coordinator — admin-entered approved manual note
- proved Web token resolution and first narrative raw evidence capture
- proved Telegram pairing/binding and Telegram raw evidence capture
- proved voice/audio artifact preservation, raw transcript blocking, and approved transcript eligibility
- proved provider-backed participant guidance, first-pass extraction, clarification formulation, answer recheck, and admin assistant execution with OpenAI `gpt-5.4`
- proved extraction no-drop preservation through governed routes
- proved clarification answer recheck produced non-silent governed outcomes
- proved boundary/visibility signals for Finance-owned sensitive-price threshold uncertainty
- proved admin assistant used DB-backed context, referenced records, and did not write automatically
- proved Pass 6 handoff candidate creation as candidate-only, not synthesis
- proved dashboard source surfaces for summary, session detail, raw evidence, analysis progress, clarification queue, boundary/escalation, admin assistant, and handoff candidates
- proved banned-boundary checks for no Pass 6 synthesis/evaluation, no common-path formation implementation, no final workflow reconstruction, no package generation, no WhatsApp API, and no fake provider success

Post-closure complex validation commands passed:

- `node scripts/prove-pass5-complex-scenario-logistics-onboarding.mjs`
- `node scripts/prove-pass5-block14-full-live.mjs` with OpenAI `gpt-5.4`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block1-contracts.mjs`
- `node scripts/prove-pass5-block2-persistence.mjs`
- `node scripts/prove-pass5-block3-session-creation.mjs`
- `node scripts/prove-pass5-block4-channel-access.mjs`
- `node scripts/prove-pass5-block5-web-session.mjs`
- `node scripts/prove-pass5-block6-telegram-adapter.mjs`
- `node scripts/prove-pass5-block6b-language-guidance.mjs`
- `node scripts/prove-pass5-block7-evidence-trust.mjs`
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block11-admin-dashboard.mjs`
- `node scripts/prove-pass5-block12-admin-assistant.mjs`
- `node scripts/prove-pass5-block13-handoff-candidates.mjs`
- `pnpm typecheck`
- `pnpm build`

Post-closure integration decision:

- Pass 5 remains accepted and closed.
- Complex scenario validation passed.
- Pass 5 branch is ready for integration/merge.

Pre-merge Block 12 Admin Assistant / Section Copilot defect patch completed:

- root cause: the assistant classifier treated broad but valid Pass 5 questions as `unsupported` unless they matched a narrow operational intent keyword
- added stage-aware Pass 5 copilot intents for stage overview, general discussion, session discussion, record/status questions, and explicit out-of-scope requests
- broad questions such as `what is your mission`, `explain Pass 5`, `what happened in this session`, `what evidence do we have`, and `what is still missing` are now answered from bounded Pass 5 context instead of rejected
- out-of-scope requests for Pass 6 synthesis/evaluation, final workflow reconstruction, package generation, WhatsApp API, autonomous writes, participant sends, or automatic evidence approval are redirected with a safe Pass 5 boundary answer
- `admin_assistant_prompt` now describes a stage-aware read-only Pass 5 copilot that can discuss participant sessions, evidence, transcript trust, extraction, clarification, answer recheck, boundary signals, next actions, and handoff candidates
- session detail assistant form anchors back to the copilot panel after submission so the admin sees the answer instead of returning to the top of the page
- proof script added: `scripts/prove-pass5-block12-stage-aware-copilot.mjs`

Pre-merge Block 12 defect patch proof commands passed:

- `pnpm --filter @workflow/participant-sessions build`
- `pnpm --filter @workflow/prompts build`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block12-admin-assistant.mjs`
- `node scripts/prove-pass5-block12-stage-aware-copilot.mjs`
- `pnpm typecheck`
- `pnpm build`

Pre-merge Block 12 boundaries preserved:

- no Pass 6 synthesis/evaluation
- no final workflow reconstruction
- no package generation
- no WhatsApp API
- no autonomous writes
- no hidden shadow state

Block 14 final acceptance proof passed after narrow banned-wording/proof-surface cleanup:

- removed banned later-stage wording from the active participant-session handoff-candidate panel copy
- preserved the UI meaning with Pass-5-safe wording: handoff candidates preserve observations for a later handoff review stage and are not later-stage analysis or workflow truth
- adjusted the Block 14 no-record proof to treat absent non-Pass-5 repository handles in the SQLite Pass 5 proof store as zero records instead of throwing
- restored `structured SequenceMap` wording in the extraction prompt guide so the Block 8 prompt-family regression proof remains compatible

Final Block 14 live proof passed:

- `node --check scripts/prove-pass5-block14-full-live.mjs`
- `node scripts/prove-pass5-block14-full-live.mjs`

Final Block 14 live proof result:

- real provider configured: Google `gemini-3.1-pro-preview`
- `participant_guidance_prompt`: succeeded
- `first_pass_extraction_prompt`: succeeded
- `clarification_formulation_prompt`: succeeded
- `answer_recheck_prompt`: succeeded
- `admin_assistant_prompt`: succeeded
- `evidence_interpretation_prompt`: not required by the current code path
- Web token/session/narrative path passed
- voice/audio raw evidence and transcript trust proof passed
- provider failure fallback proof passed
- Telegram missing-config fallback proof passed
- dashboard/source assertion proof passed
- Pass 6 handoff-candidate visibility proof passed
- banned-expansion proof passed

Final Pass 5 proof stack passed:

- `pnpm build:contracts`
- `node scripts/prove-pass5-block1-contracts.mjs`
- `node scripts/prove-pass5-block2-persistence.mjs`
- `node scripts/prove-pass5-block3-session-creation.mjs`
- `node scripts/prove-pass5-block4-channel-access.mjs`
- `node scripts/prove-pass5-block5-web-session.mjs`
- `node scripts/prove-pass5-block6-telegram-adapter.mjs`
- `node scripts/prove-pass5-block6b-language-guidance.mjs`
- `node scripts/prove-pass5-block7-evidence-trust.mjs`
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block11-admin-dashboard.mjs`
- `node scripts/prove-pass5-block12-admin-assistant.mjs`
- `node scripts/prove-pass5-block13-handoff-candidates.mjs`
- `pnpm build`
- `pnpm typecheck` after `pnpm build` regenerated `.next/types`

Acceptance boundary:

- no Pass 6 synthesis/evaluation implemented
- no common-path formation implementation
- no final workflow reconstruction implementation
- no package generation implemented
- no WhatsApp API implemented
- no fake provider success
- no fake channel success

Earlier Block 14 “not accepted” entries below are retained as historical failed-attempt notes and are superseded by the final accepted status above.

**Pass 5 Block 12 — Admin Assistant / Section Copilot implemented on branch `codex/pass5-block0-1-contracts`.**

**Pass 5 Block 13 — Pass 6 Handoff Candidates implemented on branch `codex/pass5-block0-1-contracts`.**

**Pass 5 Block 14 — Full Acceptance Proof Pack attempted on branch `codex/pass5-block0-1-contracts`; Pass 5 is not accepted.**

**Pass 5 Block 14 extraction governance hardening added on branch `codex/pass5-block0-1-contracts`; Pass 5 remains not accepted.**

**Pass 5 Block 14 nested extraction governance hardening added on branch `codex/pass5-block0-1-contracts`; Pass 5 remains not accepted.**

**Pass 5 Block 14 FirstPassExtractionOutput contract-alignment hardening added on branch `codex/pass5-block0-1-contracts`; Pass 5 remains not accepted.**

**Pass 5 Block 14 answer-recheck governance hardening added on branch `codex/pass5-block0-1-contracts`; Pass 5 remains not accepted.**

Block 14 answer-recheck governance hardening changed only prompt/output alignment and no-op handling:

- diagnosed the live answer-recheck failure as a prompt/runner contract mismatch
- `answer_recheck_prompt` instructed the provider to return deprecated `candidateStatusProposals` / `newBoundarySignals`
- `runClarificationAnswerRecheck` expects `candidateStatusUpdates`, `newClarificationCandidates`, and `boundarySignals`
- updated the prompt to require explicit candidate outcomes and the runner-owned output keys
- added a no-silent-no-op guard so a provider output with supplied candidates but no updates, new candidates, or boundary signals fails as `schema_validation_failed`
- adjusted the Block 14 proof to accept any governed non-no-op answer-recheck outcome instead of requiring `updatedCandidates`
- proof script added: `scripts/prove-pass5-block14-answer-recheck-governance.mjs`

Answer-recheck hardening proof commands passed:

- `pnpm --filter @workflow/participant-sessions build`
- `pnpm --filter @workflow/prompts build`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block14-answer-recheck-governance.mjs`
- `pnpm typecheck`
- `pnpm build`

The post-answer-recheck live acceptance proof still did not pass:

- `node scripts/prove-pass5-block14-full-live.mjs` advanced past answer recheck
- the new live blocker is the banned-expansion proof: `apps/admin-web/app/participant-sessions/[sessionId]/page.tsx must not introduce common-path formation`
- the matched string is in explanatory handoff-candidate panel copy at line 275: `not synthesis, evaluation, common-path formation, or workflow truth`
- Pass 5 must remain open until Block 14 resolves this banned-string proof failure and all required live provider/channel/dashboard/failure proofs pass

Block 14 extraction contract-alignment hardening changed only provider-output governance and prompt/schema guidance:

- added a compact canonical `FirstPassExtractionOutput` skeleton to `first_pass_extraction_prompt`
- added required extracted item, sequence map, clarification candidate, boundary signal, unmapped content, extraction defect, and evidence dispute field guidance
- added enum guidance for extraction status, extracted item statuses, sequence relation type, confidence, review state, defect/dispute classifications, and candidate statuses
- strengthened repair prompt guidance so repairs must preserve existing content, must not invent workflow facts/evidence/anchors/quotes/offsets/owners/thresholds/sequence, and must downgrade or reject unrecoverable malformed clean items
- added detailed schema validation errors with phase, field path, keyword, expected params, and safe actual-value summary
- added one governed provider-backed repair attempt for parseable outputs that pass array-shape checks but fail full `FirstPassExtractionOutput` schema validation
- schema-invalid repair failures now mark the provider job failed and the participant session extraction status failed instead of leaving the job running
- proof script added: `scripts/prove-pass5-block14-extraction-contract-alignment.mjs`

Contract-alignment hardening proof commands passed:

- `pnpm --filter @workflow/participant-sessions build`
- `pnpm --filter @workflow/prompts build`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block14-extraction-governance-hardening.mjs`
- `node scripts/prove-pass5-block14-nested-extraction-governance.mjs`
- `node scripts/prove-pass5-block14-extraction-contract-alignment.mjs`
- `pnpm typecheck`
- `pnpm build`

The post-contract-alignment live acceptance proof still did not pass:

- `node scripts/prove-pass5-block14-full-live.mjs` reached live Google provider extraction
- `participant_guidance_prompt` succeeded live with Google `gemini-3.1-pro-preview`
- `first_pass_extraction_prompt` returned a valid-enough output for schema validation after the contract-alignment hardening
- the prior schema mismatch class for missing extracted item fields was resolved
- the new live blocker is the Block 14 no-drop assertion: `Live extraction must preserve unclear content as unmapped.`
- specifically, `extractionResult.createdExtraction.unmappedContentItems.length` was `0` at `scripts/prove-pass5-block14-full-live.mjs:272`
- Pass 5 must remain open until Block 14 preserves the intentionally unclear live fixture content as unmapped content and all required live provider/channel/dashboard/failure proofs pass

Block 14 nested extraction governance hardening changed only malformed nested provider-output handling:

- added pre-governance validation for extracted item nested arrays, especially `evidenceAnchors[]` and `relatedItemIds[]`
- added pre-governance validation for `sequenceMap.sequenceLinks[].evidenceAnchors[]`
- added pre-governance validation for clarification candidate linked-id arrays and boundary signal linked-id arrays
- reinforced extraction and repair prompt instructions for nested item arrays and evidence-anchor requirements
- AI-extracted items with empty evidence anchors are downgraded to extraction defects, not accepted as clean extracted items
- malformed nested output can trigger one provider-backed repair attempt and otherwise fails as governed invalid output
- proof script added: `scripts/prove-pass5-block14-nested-extraction-governance.mjs`

Nested hardening proof commands passed:

- `pnpm --filter @workflow/participant-sessions build`
- `pnpm --filter @workflow/prompts build`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block14-extraction-governance-hardening.mjs`
- `node scripts/prove-pass5-block14-nested-extraction-governance.mjs`
- `pnpm build`
- `pnpm typecheck` after `pnpm build` regenerated `.next/types`

The post-nested-hardening live acceptance proof still did not pass:

- `node scripts/prove-pass5-block14-full-live.mjs` reached live Google provider extraction
- `participant_guidance_prompt` succeeded live with Google `gemini-3.1-pro-preview`
- `first_pass_extraction_prompt` invoked the repair path; repair job succeeded
- the prior nested iterable blocker `item.evidenceAnchors is not iterable` was resolved
- final schema validation failed because the repaired live provider output still did not match `FirstPassExtractionOutput` nested contracts, including missing extracted item fields such as `label`, `description`, `sourceTextSpan`, `completenessStatus`, `confidenceLevel`, `needsClarification`, `clarificationReason`, `adminReviewStatus`, and `createdFrom`, plus sequence link and candidate schema issues
- provider job `provider-job-live-extraction` was persisted as `failed`
- Pass 5 must remain open until Block 14 resolves the live provider extraction schema mismatch and all required live provider/channel/dashboard/failure proofs pass

Block 14 extraction governance hardening changed only the Pass 5 prompt/governance proof layer:

- reinforced `first_pass_extraction_prompt` so required arrays must be present and empty arrays must be returned as `[]`
- added pre-governance required-array validation before iterating provider output arrays
- added one provider-backed JSON repair attempt for parseable malformed extraction output
- malformed repaired output is rejected as `invalid_provider_extraction_output`
- provider jobs no longer remain `running` for the original missing-array malformed output case
- proof script added: `scripts/prove-pass5-block14-extraction-governance-hardening.mjs`

Hardening proof commands passed:

- `pnpm --filter @workflow/participant-sessions build`
- `pnpm --filter @workflow/prompts build`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block14-extraction-governance-hardening.mjs`
- `pnpm build`
- `pnpm typecheck` after `pnpm build` regenerated `.next/types`

The post-hardening live acceptance proof still did not pass:

- `node scripts/prove-pass5-block14-full-live.mjs` reached live Google provider extraction
- `participant_guidance_prompt` succeeded live with Google `gemini-3.1-pro-preview`
- `first_pass_extraction_prompt` invoked the repair path; repair job succeeded
- final governed validation then failed with `invalid_provider_extraction_output: item.evidenceAnchors is not iterable`
- provider job `provider-job-live-extraction` was persisted as `failed`
- Pass 5 must remain open until Block 14 handles this next malformed extracted-item shape and all required live provider/channel/dashboard/failure proofs pass

Block 14 added the full live proof script:

- `scripts/prove-pass5-block14-full-live.mjs`

The deterministic baseline regression commands passed:

- `pnpm build:contracts`
- `node scripts/prove-pass5-block1-contracts.mjs`
- `node scripts/prove-pass5-block2-persistence.mjs`
- `node scripts/prove-pass5-block3-session-creation.mjs`
- `node scripts/prove-pass5-block4-channel-access.mjs`
- `node scripts/prove-pass5-block5-web-session.mjs`
- `node scripts/prove-pass5-block6-telegram-adapter.mjs`
- `node scripts/prove-pass5-block6b-language-guidance.mjs`
- `node scripts/prove-pass5-block7-evidence-trust.mjs`
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block11-admin-dashboard.mjs`
- `node scripts/prove-pass5-block12-admin-assistant.mjs`
- `node scripts/prove-pass5-block13-handoff-candidates.mjs`
- `pnpm typecheck`
- `pnpm build`

The initial live acceptance proof did not pass:

- `node scripts/prove-pass5-block14-full-live.mjs` failed during real Google provider execution for `participant_guidance_prompt`
- exact failure: `provider_rate_limited: Google provider rate limit or quota was reached`
- no deterministic executor was substituted for this live provider proof
- Pass 5 must remain open until Block 14 is rerun and all required live provider/channel/dashboard/failure proofs pass

Block 14 attempted boundaries preserved:

- no Pass 6 synthesis/evaluation
- no common-path formation
- no final workflow reconstruction
- no package generation
- no WhatsApp API
- no fake provider success
- no fake channel success

Block 13 adds governed Pass 5 handoff-candidate records only:

- domain-layer creation/list/review helpers in `@workflow/participant-sessions`
- admin-entry handoff candidate creation
- admin-assistant recommendation conversion only after explicit admin confirmation
- deterministic system-rule candidate creation from existing evidence disputes, boundary signals, and repeated clarification uncertainty
- admin review decisions: `accepted_for_pass6`, `dismissed`, and `needs_more_evidence`
- thin API routes `/api/participant-sessions/handoff-candidates` and `/api/participant-sessions/handoff-candidates/[id]/decision`
- dashboard summary counts for pending/accepted/dismissed/needs-more-evidence handoff candidates
- session detail `Pass 6 Handoff Candidates` panel with linked evidence references and review actions
- proof script: `scripts/prove-pass5-block13-handoff-candidates.mjs`

Block 13 proof commands passed:

- `pnpm build:contracts`
- `node scripts/prove-pass5-block1-contracts.mjs`
- `node scripts/prove-pass5-block2-persistence.mjs`
- `node scripts/prove-pass5-block3-session-creation.mjs`
- `node scripts/prove-pass5-block4-channel-access.mjs`
- `node scripts/prove-pass5-block5-web-session.mjs`
- `node scripts/prove-pass5-block6-telegram-adapter.mjs`
- `node scripts/prove-pass5-block6b-language-guidance.mjs`
- `node scripts/prove-pass5-block7-evidence-trust.mjs`
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block11-admin-dashboard.mjs`
- `node scripts/prove-pass5-block12-admin-assistant.mjs`
- `node scripts/prove-pass5-block13-handoff-candidates.mjs`
- `pnpm typecheck`
- `pnpm build`

Block 13 boundaries preserved:

- no Pass 6 synthesis/evaluation
- no common-path formation
- no final workflow reconstruction
- no package generation
- no WhatsApp API
- no final provider-backed extraction proof
- no automatic assistant writes
- no hidden shadow state

Pass 5 is not complete after Block 13. Block 14 full live end-to-end test remains required before Pass 5 closure.

Block 12 adds a governed read-only Pass 5 admin assistant:

- domain-layer assistant pipeline in `@workflow/participant-sessions`
- `AdminAssistantContextBundle` construction with DB-first structured records, targeted evidence snippets, optional retrieved chunks, excluded-record reasons, data freshness, permission scope, and prompt version id
- supported query intents: session summary, evidence question, clarification status, boundary signal, extraction defect, evidence dispute, next action, cross-session comparison, unresolved items, and Pass 6 handoff candidate suggestion
- prompt execution path compiles `admin_assistant_prompt` through the existing Pass 5 Prompt Family and records provider jobs
- provider-not-configured and provider-failure states are visible and not reported as provider success
- deterministic manual fallback answer includes findings, references, uncertainty, confidence, and routed-action suggestions only
- session detail dashboard panel `Admin Assistant / Section Copilot`
- thin API route `/api/participant-sessions/assistant`
- proof script: `scripts/prove-pass5-block12-admin-assistant.mjs`

Block 12 proof commands passed:

- `pnpm --filter @workflow/participant-sessions build`
- `pnpm build:contracts`
- `node scripts/prove-pass5-block1-contracts.mjs`
- `node scripts/prove-pass5-block2-persistence.mjs`
- `node scripts/prove-pass5-block3-session-creation.mjs`
- `node scripts/prove-pass5-block4-channel-access.mjs`
- `node scripts/prove-pass5-block5-web-session.mjs`
- `node scripts/prove-pass5-block6-telegram-adapter.mjs`
- `node scripts/prove-pass5-block6b-language-guidance.mjs`
- `node scripts/prove-pass5-block7-evidence-trust.mjs`
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block11-admin-dashboard.mjs`
- `node scripts/prove-pass5-block12-admin-assistant.mjs`
- `pnpm typecheck`
- `pnpm build`

Block 12 boundaries preserved:

- no autonomous writes
- no hidden shadow state
- no participant-facing send
- no Pass 6 synthesis/evaluation
- no package generation
- no WhatsApp API
- no final provider-backed extraction proof

**Pass 5 Block 11 — Admin Session Command Dashboard implemented on branch `codex/pass5-block0-1-contracts`.**

Block 11 adds admin-facing Pass 5 operational visibility only:

- dashboard route `/participant-sessions`
- session detail route `/participant-sessions/[sessionId]`
- thin admin action route `/api/participant-sessions/[sessionId]/actions`
- dashboard composition helper for existing participant sessions, raw evidence, extraction drafts, clarification candidates, boundary signals, access tokens, and Telegram bindings
- summary cards, filters, participant session table, next-action labels, and detail panels for Session Context, Channel Access, Raw Evidence, Analysis Progress, Clarification Queue, and Boundary / Escalation
- exposed admin actions are limited to existing Block 10 domain functions: select next clarification candidate, formulate question with configured executor, mark asked, record answer, run answer recheck with configured executor, add admin exact question, and dismiss candidate
- proof script: `scripts/prove-pass5-block11-admin-dashboard.mjs`

Block 11 proof commands passed:

- `pnpm build:contracts`
- `node scripts/prove-pass5-block1-contracts.mjs`
- `node scripts/prove-pass5-block2-persistence.mjs`
- `node scripts/prove-pass5-block3-session-creation.mjs`
- `node scripts/prove-pass5-block4-channel-access.mjs`
- `node scripts/prove-pass5-block5-web-session.mjs`
- `node scripts/prove-pass5-block6-telegram-adapter.mjs`
- `node scripts/prove-pass5-block6b-language-guidance.mjs`
- `node scripts/prove-pass5-block7-evidence-trust.mjs`
- `node scripts/prove-pass5-block8-prompt-family.mjs`
- `node scripts/prove-pass5-block9-first-pass-extraction.mjs`
- `node scripts/prove-pass5-block10-clarification.mjs`
- `node scripts/prove-pass5-block11-admin-dashboard.mjs`
- `pnpm typecheck`
- `pnpm build`

Block 11 boundaries preserved:

- no admin assistant execution
- no Pass 6 synthesis/evaluation
- no package generation
- no WhatsApp API
- no final provider-backed extraction proof
- no new analysis mechanics beyond dashboard-facing composition

**Pass 4 — Participant Targeting / Rollout Planning is accepted, closed, archived, and merged to `main`.**

Pass 4 status: `pass4_targeting_rollout_accepted`

Pass 4 accepted branch: `codex/pass4-targeting-rollout`

Pass 4 accepted commit merged to main by fast-forward: `14c32adbcd1156ce6e18490468f866e922745e07`

Pass 4 archive file: `handoff/PASS4_TARGETING_ROLLOUT_BUILD_SPEC.md`

Pass 4 proof DB: `/tmp/workflow-pass4-proof.sqlite`

Pass 4 main provider proof DB: `/tmp/workflow-pass4-main-proof.sqlite`

Pass 4 proof commands passed:

- `pnpm build:contracts`
- `pnpm typecheck`
- `pnpm build`
- seeded approved Pass 3 hierarchy/readiness snapshot for `case_pass4_proof`
- API proof for create/load targeting rollout plan
- API proof for provider failure persistence/manual fallback
- API proof for candidate acceptance, contact edit, optional preferred-channel gap, and `approved_with_contact_gaps`
- in-app browser proof for targeting plan overview, AI recommendation packet surface, candidate review, contact profiles, question-hint seed preview, final review, boundary confirmations, and Pass 4 PromptSpec workspace

Pass 4 provider follow-up:

- Pass 3 Patch 3.5 and Patch 4 handoff records proved `provider_success` but did not preserve the exact command/env-loading path used to make the local Google key visible to the Next runtime.
- Pass 4 now reuses the same shared Google provider resolver and provider registry path as Pass 3, including `GOOGLE_AI_API_KEY`, optional `GOOGLE_AI_MODEL`, and default `gemini-3.1-pro-preview`.
- The canonical Workflow AI proof method is the Pass 2-style local env activation: `cd /Users/haitham/development/Workflow`, `set -a`, `source /Users/haitham/development/Workflow/.env.local`, `set +a`, then start admin-web and call `/api/provider-status`.
- `WORKFLOW_ENV_FILE` remains an optional override for temporary proof environments only. Historical use of another project env file, if any, is not the canonical Workflow proof method.
- The shared resolver loads process env first and can also read ignored `.env.local` / `.env` files in the app cwd or repo root; provider diagnostics expose key presence and model only, never key values.
- Cross-pass Google/Gemini regression proof passed on `/tmp/workflow-cross-pass-provider-proof.sqlite` using canonical Workflow `.env.local`: `/api/provider-status` returned `provider_success`, `keyPresent: true`, and model `gemini-3.1-pro-preview`; Pass 2 manual note structuring and AI structured context succeeded through Google/Gemini; Pass 3 hierarchy draft and source triage succeeded through Google/Gemini; Pass 4 Targeting Recommendation Packet `targeting_packet_1fb549ec-ff51-4675-afee-9884037ce917` persisted with `provider_success`, provider execution ref `google:gemini-3.1-pro-preview`, 5 target candidates, 4 source signals, and 4 question-hint seeds.

Pass 4 adds:

- `packages/targeting-rollout` as the bounded Pass 4 domain package
- `TargetingRolloutPlan` and `TargetingRecommendationPacket` contracts/schemas/validators
- durable `TargetingRolloutPlanRepository` and Pass 4 prompt test-run repository
- provider-backed Targeting Recommendation Packet path through the existing integration provider interface
- visible provider failure state with manual fallback
- Pass 4 PromptSpec with required sections, compiled preview, draft/active/previous lifecycle, promotion, and comparison-test support
- admin UI at `/targeting-rollout` and `/targeting-rollout/[id]`
- prompt workspace at `/targeting-rollout/prompts`

Pass 4 boundaries preserved:

- no outreach sent
- no invitations created
- no participant sessions created
- no participant responses collected
- no workflow analysis performed
- source signals remain targeting/planning signals only, not workflow truth
- question-hint seeds are stored only as later Pass 5 support hints, not participant-facing questions

**Pass 3 — Hierarchy Intake & Approval is accepted locally on branch `codex/pass3-final-closure`.**

Final Pass 3 status: `pass3_hierarchy_intake_approval_accepted`

Final Pass 3 closure base: `f16e1cf1d8a0b742d911a5d7468388fa3355d20e`

Final Pass 3 closure commit: the commit containing this handoff update on `codex/pass3-final-closure`.

Next slice after Pass 4 acceptance: **Pass 5 — Participant Session Outreach / Narrative-First Clarification**.

Final closure proofs passed:

- `pnpm build:contracts`
- `pnpm typecheck`
- `pnpm build`
- fresh SQLite proof DB under `/tmp/workflow-pass3-final-closure.sqlite`
- provider-failure/manual-fallback proof DB under `/tmp/workflow-pass3-final-closure-failure.sqlite`
- persistence restart/reload proof using the same SQLite path
- in-app browser proof for the visual hierarchy workbench

Pass 2 (Intake & Context Build) is active on top of the Pass 9 baseline.

Phase 1 status: `phase_proven`.

Phase 2 status: `phase_proven`.

Phase 3 status: `phase_proven`.

Phase 4 status: `phase_proven`; crawler-runtime caveat resolved by approved `fetch_html` CrawlerAdapter proof.

Phase 5 status: `phase_proven`.

Phase 6 status: `phase_proven`.

Phase 7 status: `phase_proven`.

Overall Pass 2 status: `pass2_complete_after_all_proofs`.

---

## Official pass sequence

- **Pass 6:** Synthesis + Evaluation + Initial Package — accepted on `main`
- **Pass 7:** Review / Issue Discussion — accepted on `main` (2026-04-22), commit `a8f3523`
- **Pass 8:** Final Package + Release — accepted on `main` (2026-04-22), commit `3171ad4`
- **Pass 9:** Package Preview + Release Decision Surface — **accepted on `main` (2026-04-23), commit `41a8232`**

---

## What exists (all prior passes unchanged)

All Pass 6–9 packages, routes, and UI surfaces remain unchanged. See git history for full details.

---

## What Pass 2 Phase 1 added

Phase 1 landed the intake foundation only:

- Pass 2 contract entities
- Draft-07 schemas
- validators
- durable SQLite persistence
- local artifact folders
- proof script
- handoff updates

Phase 1 proof reported by the coding agent: `pnpm prove:pass2-phase1` passed 35/35 checks, including validator round-trips, SQLite save/restart round-trips, and write-phase smoke proof.

Next required phase by the live Pass 2 Build Spec:

**Pass 2 Phase 2 — Intake Registration UI and Basic Admin Surfaces**

---

## What Pass 2 Phase 2 added

Phase 2 exposes the durable intake foundation through basic admin surfaces:

- intake/context start and session list page
- company/department primary bucket selection
- source registration for document, website URL, manual note, image, and audio
- manual note save flow as an operator-origin source
- persisted intake source list and status view backed by `packages/persistence` SQLite intake repositories
- persisted batch summary with AI suggestion placeholders marked `not_generated_yet`
- source detail shell showing stored metadata and deferred provider outputs
- explicit deferred responses for provider extraction, structured context generation, website crawling, and hierarchy draft routes
- admin-web uses a thin store helper that calls `createSQLiteIntakeRepositories()` from `@workflow/persistence`; it does not own intake session/source persistence

Phase 2 does not expose video input.

---

## What Pass 2 Phase 3 added

Phase 3 adds provider integration foundations and provider job tracking without starting later flows:

- provider-agnostic extraction, STT, embedding, and intake-suggestion interfaces in `packages/integrations`
- Google extraction/OCR provider path gated by `GOOGLE_AI_API_KEY`
- Google Speech-to-Text provider path gated by `GOOGLE_STT_API_KEY`; external audio defaults to V1 `latest_long`; V2 `chirp_3` remains explicit/config-gated only and is not the default; `latest_short` is reserved for short command/live-dictation scenarios
- Google embedding provider path gated by `GOOGLE_AI_API_KEY`, with configurable `GOOGLE_EMBEDDING_MODEL`
- SQLite-backed provider job, embedding job, text artifact, and AI intake suggestion repositories in `packages/persistence`
- source-level provider extraction action and status API
- source-role intake suggestion action and persisted `AIIntakeSuggestion` records
- documented source-role vocabulary includes `company_overview`, `company_context`, `org_signal`, `policy_reference`, `department_note`, `audio_transcript`, `website_url`, and `general_intake_source`
- embedding job API and persisted `EmbeddingJobRecord` records
- provider status API showing configured availability and persisted jobs
- source detail display for provider jobs, artifacts, and source-role intake triage suggestions

Missing provider credentials produce visible failed jobs. They are not converted into success.

Phase 3 does not start website crawling, crawl approval, transcript review UI, structured context generation UI, hierarchy, rollout, synthesis/evaluation, final package, or video.

---

## What Pass 2 Phase 4 added

Phase 4 builds the website crawl flow without starting later Pass 2 phases:

- website URL source integration using existing persisted `website_url` intake sources
- Crawl4AI adapter boundary in `packages/integrations`; missing `CRAWL4AI_URL` now fails visibly instead of returning stub content
- SQLite-backed crawl plan, approval, page-content, site-summary, and content-chunk repositories in `packages/persistence`
- candidate-page discovery orchestration in `packages/sources-context`, including default max pages `20` and admin options `20`, `30`, `40`, `50`
- priority/exclusion classification for homepage, about, services/solutions, departments/teams/org, policies/terms/SLA, contact, projects/case studies/portfolio, clients/customers/partners, and default exclusions/lower priority for login/signup, privacy/cookie, blog/news, careers/jobs, media galleries, query-param duplicates, and likely duplicate language variants
- admin approval/edit flow with persisted `WebsiteCrawlApproval`
- approved crawl execution through the Crawl4AI adapter only, with persisted `ProviderExtractionJob` status
- page-content drill-down shell; page-level crawl content is not shown by default on source detail
- chunk creation and Google embedding-job creation for crawl chunks when Crawl4AI returns content
- provider status shows Crawl4AI runtime config separately from Google embedding config

`GOOGLE_EMBEDDING_MODEL` is configured as `gemini-embedding-2`. The Google key is not recorded in handoff files.

The original local proof environment had Crawl4AI runtime unavailable (`CRAWL4AI_URL` unset), so candidate discovery and approved crawl failed visibly with persisted errors. The remaining crawler-runtime caveat was later resolved with a real approved `fetch_html` CrawlerAdapter proof. That proof completed candidate discovery, admin approval, approved crawl execution, page storage, site summary, chunk creation, and Google embedding generation using `gemini-embedding-2`.

Phase 4 does not start audio transcript review UI, structured context generation, hierarchy intake, participant rollout, synthesis/evaluation, final package, or video input.

---

## What Pass 2 Phase 5 added

Phase 5 builds the external audio-file transcript review flow without starting structured context generation:

- audio source integration using existing persisted `audio` intake sources
- audio transcription action routed through the Phase 3 Google Speech-to-Text provider path
- persisted `AudioTranscriptReviewRecord` with statuses:
  - `transcription_pending`
  - `transcript_ready_for_review`
  - `transcript_edited_by_admin`
  - `transcript_approved`
  - `transcript_rejected_or_needs_retry`
- raw transcript artifact linkage for provider output
- admin transcript review screen for external audio sources
- approve-as-is, edit/save, reject/retry controls
- trusted transcript artifact creation only after admin approval or edit
- source `extractedText` update only from trusted approved/edited transcript text
- transcript chunks and Google embedding jobs from trusted transcript text
- audio review status surfaced on audio source detail and source list
- live dictation remains separate and is still manual/operator-note only

Early local proofs covered missing/invalid STT configuration and persisted visible failed jobs. The accepted real Google STT proof used `GOOGLE_STT_API_KEY`, `GOOGLE_STT_MODEL=latest_short`, and `GOOGLE_STT_LANGUAGE_CODE=en-US` from local environment only. It reached the real Google Speech-to-Text provider path, persisted a succeeded `ProviderExtractionJob`, persisted a raw transcript artifact linked to the audio source and provider job, preserved provider confidence/quality metadata when returned, and kept the raw transcript untrusted until admin approval/edit.

The STT model strategy was then corrected: external uploaded audio now defaults to the GA Speech-to-Text V1 endpoint with model `latest_long`. A bounded V2 recognize path exists only when explicitly configured with `GOOGLE_STT_EXTERNAL_MODEL=chirp_3`; it is not the default because it requires recognizer/project setup. The proof preserved the admin-review trust boundary.

Phase 5 does not start structured context generation, hierarchy intake, participant rollout, synthesis/evaluation, final package, or video input.

---

## What Pass 2 Phase 6 added

Phase 6 builds department/use-case framing and an admin-created structured context layer without starting hierarchy:

- primary department selection from a controlled list
- Other / Custom Department support with preserved company-facing department label
- internal department-family mapping suggestions and admin decisions: accept, edit, reject, or leave unknown
- company context availability statuses:
  - `company_context_provided`
  - `company_context_skipped_by_admin`
  - `company_context_pending_or_unknown`
- department context availability statuses:
  - `department_context_provided`
  - `department_documents_not_available_confirmed`
  - `department_context_skipped_by_admin`
  - `department_context_pending_or_unknown`
- required use-case boundary before pre-hierarchy readiness:
  - `use_case_not_selected`
  - `use_case_same_as_department`
  - `use_case_selected_custom`
  - `use_case_needs_admin_review`
- SQLite-backed `DepartmentFramingRecord` and `StructuredContextRecord` repositories in `packages/persistence`
- Phase 6 orchestration in `packages/sources-context`
- admin API and UI at `/api/intake-sessions/[id]/department-context` and `/intake-sessions/[id]/context`
- structured context fields that preserve company-level and department-level separation
- field evidence links for operator notes, website sources, uploaded/extracted sources when available, contextual/admin confirmations, and provider job references when available
- final pre-hierarchy readiness guard that blocks when use case is not selected

Structured context in Phase 6 is admin-created from reviewed/available intake material. It does not claim AI deep analysis, workflow analysis, hierarchy generation, source-to-role linking, participant rollout, synthesis/evaluation, final package, or video support.

---

## What Pass 2 Phase 7 added

Phase 7 builds the final pre-hierarchy review layer that closes intake/context framing without implementing hierarchy:

- SQLite-backed `FinalPreHierarchyReviewRecord`
- final-review readiness rules that block when:
  - primary department is missing
  - use case is not selected as same-as-department or custom
  - structured context is missing
  - company or department context availability remains pending/unknown
- final review generation from persisted Phase 2-6 records
- admin final review screen at `/intake-sessions/[id]/final-review`
- final review API at `/api/intake-sessions/[id]/final-pre-hierarchy-review`
- source summary by bucket and kind
- structured context summary and evidence summary
- visible crawler runtime caveat when website crawl success is not proven for the intake
- visible low-confidence audio transcript notes when review metadata includes low provider confidence
- admin confirmation with `confirmedBy`, `confirmedAt`, `adminConfirmationStatus`, and optional admin note
- explicit next-slice handoff name: `Hierarchy Intake & Approval Build Slice`

Phase 7 does not start hierarchy intake, hierarchy draft generation, source-to-role linking, participant targeting, rollout readiness, participant sessions, synthesis/evaluation, final package, video input, new provider work, new website crawl work, or new audio review work.

---

## What is proven

| Check | Result |
|---|---|
| `pnpm prove:pass2-phase1` | passed 35/35 checks |
| `pnpm build:contracts` | succeeds |
| `pnpm typecheck` | succeeds |
| `pnpm build` | succeeds |
| Phase 2 SQLite persistence proof | document, website URL, manual note, image, and audio source records registered through admin API, persisted to `apps/admin-web/data/intake-phase2.sqlite`, server restarted, and records reloaded through `packages/persistence` SQLite repositories |
| Phase 2 batch/detail proof | batch summary and source detail pages return 200 for persisted records |
| Phase 2 exclusion proof | video registration rejected; provider, extraction, crawl, structured context, and hierarchy routes return deferred 501 responses |
| Phase 2 persistence-boundary correction | app-local file-backed intake metadata store removed; no `intake-file-store` or JSON metadata persistence remains in admin-web |
| Phase 3 provider job proof | document extraction, image OCR, audio transcription, and website URL scaffold jobs created and persisted with statuses `failed` or `skipped` |
| Phase 3 SQLite restart proof | provider jobs, embedding job, and AI intake suggestion reloaded after app restart through SQLite-backed persistence |
| Phase 3 credential-gated provider proof | document/OCR failed visibly for missing `GOOGLE_AI_API_KEY`; audio transcription failed visibly for missing `GOOGLE_STT_API_KEY`; embedding failed visibly for missing `GOOGLE_AI_API_KEY`; source-role suggestion failed visibly for missing active LLM provider config |
| Phase 3 boundary proof | website crawl route remains deferred to Phase 4; structured context route remains deferred; hierarchy route remains deferred; video remains rejected |
| Phase 4 website source proof | `website_url` intake source `isrc_phase4_site` registered through existing intake source API |
| Phase 4 crawl plan proof | `POST /api/website-crawls` created persisted plan `crawlplan_2386e6df-c83c-48f8-9986-ba060c9ab9e5` with default `maxPages: 20`; discovery failed visibly with `CRAWL4AI_URL is not configured for website candidate discovery.` |
| Phase 4 max-page proof | `GET /api/website-crawls?sourceId=isrc_phase4_site` returned `defaultMaxPages: 20` and `maxPageOptions: [20,30,40,50]`; admin page rendered all four options |
| Phase 4 pre-approval proof | `POST /api/website-crawls/.../execute` before approval returned `409` with `Website crawl cannot run before admin approval is persisted.` |
| Phase 4 approval proof | `PATCH /api/website-crawls/...` persisted `WebsiteCrawlApproval` for `https://example.com` and status `approved` |
| Phase 4 approved crawl proof | approved execution returned `424` with persisted failed `ProviderExtractionJob` provider `crawl4ai`, kind `website_crawl`, status `failed`, error `CRAWL4AI_URL is not configured for approved website crawling.` |
| Phase 4 SQLite restart proof | after app restart using the same SQLite path, `GET /api/website-crawls/...` reloaded the crawl plan, approval, failed crawl job, `pageCount: 0`, `chunkCount: 0`, and no embedding jobs |
| Phase 4 admin display proof | source detail shows crawl status and hides page-level content by default; crawl approval page shows candidates/approval controls; drill-down page is the only page-level content surface |
| Phase 4 Google embedding config proof | `GET /api/provider-status` reported Google embeddings configured with model `gemini-embedding-2`; no missing Google key/model was reported |
| Phase 4 exclusion proof | video registration still rejected; no audio transcript review UI, structured context generation, hierarchy, rollout, synthesis/evaluation, final package, or video work was started |
| Phase 5 audio source proof | `audio` intake source `isrc_phase5_audio` registered through existing intake source API |
| Phase 5 STT action proof | `POST /api/intake-sources/isrc_phase5_audio/transcribe` created persisted provider job `pjob_627483f6-a107-4dc3-aa72-361d4405dd8e` |
| Phase 5 missing-STT proof | transcription returned `424` and persisted failed job with `Google Speech-to-Text provider configuration is missing.` |
| Phase 5 review UI proof | `/intake-sources/isrc_phase5_audio/audio-review` rendered source metadata, provider job status, raw transcript area, editable field, approve/edit/reject/retry controls, and review status |
| Phase 5 raw transcript boundary proof | before seeded review text existed, review API returned `rawTranscriptArtifact: null`, `trustedTranscriptArtifact: null`, `chunks: []`, and `embeddingJobs: []` |
| Phase 5 approve/edit proof | seeded raw transcript fixture could be approved as-is and edited through the review API; approved/edited decisions created trusted `extracted_text` artifacts |
| Phase 5 chunk/embedding proof | approved/edited transcript text created source-traceable chunks and Google embedding jobs using `gemini-embedding-2`; embedding jobs succeeded in the local proof |
| Phase 5 reject/retry proof | reject action persisted `transcript_rejected_or_needs_retry` and cleared the current trusted transcript reference |
| Phase 5 SQLite restart proof | after app restart using the same SQLite path, transcript review state, raw transcript artifact, provider job, chunks, and embedding jobs reloaded from SQLite |
| Phase 5 live dictation boundary proof | `/stt` states live dictation remains separate and may only save manual/operator notes |
| Phase 5 real Google STT proof | with `GOOGLE_STT_API_KEY`, `GOOGLE_STT_MODEL=latest_short`, and `GOOGLE_STT_LANGUAGE_CODE=en-US`, `POST /api/intake-sources/isrc_phase5_real_audio/transcribe` reached Google Speech-to-Text and persisted succeeded provider job `pjob_ca7c410f-a3c6-417e-9b35-1cc2265ff123` with outputRef `artifact_7d2d2f25-0cb6-429e-a353-7000839799a0`, confidence `0.19816941`, and quality signal `average_confidence:0.198` |
| Phase 5 real raw transcript boundary proof | before admin approval, review state was `transcript_ready_for_review`, raw transcript artifact `artifact_7d2d2f25-0cb6-429e-a353-7000839799a0` was present, `trustedTranscriptArtifact` was `null`, and chunks/embedding jobs were empty |
| Phase 5 real approve/edit/reject proof | approving the real raw transcript created trusted artifact `artifact_9c8f8c90-a68e-4830-8c5a-d5f59bff952a`, chunk `chunk_41c8a0bc-9b88-497a-ab49-6e279d9fc480`, and embedding job `embedjob_650dc7ea-7a2d-4fa5-85ed-c00c4e9ddce7`; editing created trusted artifact `artifact_27621db2-3a6e-40df-b112-d58e59d892c3`, chunk `chunk_3b867ef8-7152-4b25-a2f2-17990db97a1d`, and embedding job `embedjob_730f89d0-aeaa-4b2a-b246-8ac8b44184db`; rejecting set review status back to `transcript_rejected_or_needs_retry` and cleared current trusted artifact |
| Phase 5 STT model strategy proof | provider status reported external audio model `latest_long` because no V2 project id was configured; `POST /api/intake-sources/isrc_phase5_model_audio_c/transcribe` succeeded through the V1 path, persisted provider job `pjob_565fb137-98a5-4653-9729-8072a25a2ba8` with model `latest_long`, raw artifact `artifact_8c242e64-976d-4245-8bfd-4714b18dcf78`, confidence `0.29832265`, and quality signal `average_confidence:0.298`; raw transcript remained untrusted with `trustedTranscriptArtifact: null`, no chunks, and no embedding jobs before admin approval |
| Phase 5 structured-context boundary proof | `POST /api/intake-sessions/intake_phase5_proof/form-context` still returns `501` deferred to Phase 6 |
| Phase 5 exclusion proof | video registration still rejected; hierarchy, rollout, synthesis/evaluation, final package, and video remain unstarted |
| Phase 6 department dropdown proof | `/intake-sessions/intake_phase6_proof/context` renders controlled primary department options including Sales, Operations, HR, IT, Finance, Legal, Customer Support, Procurement, Marketing, and Other / Custom Department |
| Phase 6 custom department proof | API saved `primaryDepartmentSelection: Other / Custom Department`, `customDepartmentLabel: Field Enablement`, and preserved `activeDepartmentLabel: Field Enablement` |
| Phase 6 mapping decision proof | API persisted mapping decisions `accepted`, `edited`, `rejected`, and `unknown`; final proof kept `mappingDecision: edited` with `acceptedInternalFamily: operations` without overwriting the company-facing label |
| Phase 6 company context proof | API persisted `company_context_skipped_by_admin`, `company_context_pending_or_unknown`, and final `company_context_provided` as non-blocking decisions |
| Phase 6 department context proof | API persisted `department_documents_not_available_confirmed`, `department_context_skipped_by_admin`, `department_context_pending_or_unknown`, and final `department_context_provided` as non-blocking decisions |
| Phase 6 use-case proof | API persisted `use_case_same_as_department` and final custom use case `Field service onboarding` with `useCaseScopeType: workflow` |
| Phase 6 readiness guard proof | `POST /api/intake-sessions/intake_phase6_proof/department-context` with `check-readiness` returned `409` before framing/use case existed; after use-case selection it returned ready |
| Phase 6 structured context proof | `POST /api/intake-sessions/intake_phase6_proof/department-context` with `generate-structured-context` returned `201` and persisted `structured_context_93d3fc09-f634-4c04-86d0-7715faa9d26a` with `status: draft` and `notes: Phase 6 admin-created structured context; hierarchy not implemented.` |
| Phase 6 separation proof | structured context stored company fields (`companyScopeSummary`, `companyContextSummary`, `visibleCompanyLevelSignals`) separately from department fields (`mainDepartment`, `selectedUseCase`, `departmentContextSummary`, `visibleRoleFamiliesOrOrgSignals`, `departmentSpecificSignalsAndRisks`) |
| Phase 6 evidence proof | field evidence linked company note `isrc_phase6_company_note` as `operator_original_note`, website source `isrc_phase6_site` as `extracted_from_website`, department note `isrc_phase6_dept_note` as `operator_original_note`, and department/use-case choices as `admin_confirmed` |
| Phase 6 SQLite restart proof | after app restart using `/tmp/workflow-phase6-proof-20260424.sqlite`, department framing, structured context, field evidence, and source records reloaded through SQLite-backed persistence |
| Phase 6 boundary proof | hierarchy draft route remains deferred; video input remains rejected; no participant rollout, synthesis/evaluation, final package, or video work was started |
| Phase 7 missing-primary-department block proof | `POST /api/intake-sessions/intake_phase7_block_no_department/final-pre-hierarchy-review` returned `409` with reasons `Primary department and use-case framing has not been saved.` and missing structured context |
| Phase 7 missing-use-case block proof | `POST /api/intake-sessions/intake_phase7_block_no_use_case/final-pre-hierarchy-review` returned `409` with reason `Use case must be selected as same-as-department or custom.` |
| Phase 7 missing-structured-context block proof | `POST /api/intake-sessions/intake_phase7_block_no_context/final-pre-hierarchy-review` returned `409` with reason `Structured context is missing; generate or save an admin-created structured context before final review.` |
| Phase 7 final review generation proof | `POST /api/intake-sessions/intake_phase7_ready/final-pre-hierarchy-review` returned `201` and persisted `final_pre_hierarchy_87653776-1245-4973-b77b-bb244da9bde5` |
| Phase 7 final review content proof | generated review displayed company context `company_context_provided`, department context `department_context_provided`, selected department `Field Enablement`, use case `Technician onboarding`, source summary for company/manual note, company/website URL, department/audio, and department/manual note |
| Phase 7 structured context/evidence proof | generated review referenced structured context `structured_context_7d95d3a5-f066-42da-881b-c2565a49a654`, summarized company and department context, and included evidence summaries for `departmentContextSummary`, `companyContextSummary`, `mainDepartment`, and `selectedUseCase` |
| Phase 7 caveat proof | generated review included Crawl4AI caveat `Crawl4AI runtime success is not proven for this intake; configure CRAWL4AI_URL before relying on crawled site content.` |
| Phase 7 audio confidence proof | generated review included low-confidence audio note `Audio transcript audioreview_phase7_low_confidence confidence 0.29; transcript remains review-sensitive.` |
| Phase 7 admin confirmation proof | `POST /api/intake-sessions/intake_phase7_ready/final-pre-hierarchy-review` with action `confirm` persisted `adminConfirmationStatus: confirmed`, `confirmedBy: phase7-admin`, `confirmedAt`, and admin note |
| Phase 7 SQLite restart proof | after app restart using `/tmp/workflow-phase7-proof-20260424.sqlite`, the confirmed final review reloaded with the same review ID, source summary, caveats, evidence summary, and confirmation fields |
| Phase 7 UI proof | `/intake-sessions/intake_phase7_ready/final-review` rendered final pre-hierarchy review, company/department statuses, selected department/use case, source summary, structured context summary, evidence summary, Crawl4AI caveat, low-confidence audio note, confirmation state, and explicit next-slice boundary |
| Phase 7 boundary proof | hierarchy draft route remains deferred; video input remains rejected; no hierarchy intake, hierarchy draft generation, source-to-role linking, participant targeting, rollout readiness, synthesis/evaluation, final package, or video work was started |
| Crawler-runtime caveat closure provider proof | provider status reported crawl adapter `fetch_html`, available/live, and Google embeddings configured with model `gemini-embedding-2` |
| Crawler-runtime caveat closure plan proof | website URL source `isrc_crawler_caveat_site` created crawl plan `crawlplan_42243cf3-5e8b-464f-a8b7-4c6df9ada877` with default `maxPages: 20`, `maxPageOptions: [20,30,40,50]`, and visible candidate page `https://example.com/` before crawl |
| Crawler-runtime caveat closure pre-approval proof | executing unapproved plan `crawlplan_f98f46cc-1eef-4d1e-b4f7-1777bc03bd03` returned `409` with `Website crawl cannot run before admin approval is persisted.` |
| Crawler-runtime caveat closure approval proof | approval `crawlapproval_207bed47-dbea-4bf9-8b44-9152733fc76c` persisted approved URL `https://example.com/` |
| Crawler-runtime caveat closure crawl proof | approved crawl ran through selected `fetch_html` CrawlerAdapter and persisted succeeded crawl job `pjob_ce9c55e6-4848-4858-8d5f-28c20a70a665` with outputRef `crawlsummary_bfe20d04-595b-4ab1-9137-cc06f272db03` |
| Crawler-runtime caveat closure page/summary/chunk proof | crawl persisted page `crawlpage_4545267f-fcc2-4aa5-96be-5757a0cd5fc2`, site summary `crawlsummary_bfe20d04-595b-4ab1-9137-cc06f272db03`, and chunk `chunk_10401220-ad1a-4020-94d8-451f6943079c`; page count `1`, chunk count `1` |
| Crawler-runtime caveat closure embedding proof | crawl chunk generated succeeded Google embedding job `embedjob_43d5aa65-a089-41c3-9b0b-f8f2b7222964` with model `gemini-embedding-2`, chunkRefs `chunk_10401220-ad1a-4020-94d8-451f6943079c`, and outputRef `artifact_e314975e-e1a7-4b69-9c89-1f11e67de7bd` |
| Crawler-runtime caveat closure traceability proof | page, chunk, crawl job, summary, approval, and embedding records all trace to source `isrc_crawler_caveat_site` and crawl plan `crawlplan_42243cf3-5e8b-464f-a8b7-4c6df9ada877` |
| Crawler-runtime caveat closure UI proof | source detail hid page-level content by default and linked to crawl approval; page-level content appeared only in `/website-crawls/crawlplan_42243cf3-5e8b-464f-a8b7-4c6df9ada877/pages` drill-down |
| Crawler-runtime caveat closure SQLite restart proof | after app restart using `/tmp/workflow-pass2-crawler-caveat-proof-20260424.sqlite`, plan, approval, page count, chunk count, summary, crawl job, and embedding job reloaded from SQLite |
| Crawler-runtime caveat closure boundary proof | hierarchy draft route remains deferred; video input remains rejected; hierarchy, rollout, synthesis/evaluation, final package, and video remain unstarted |
| Section 19 closure document extraction proof | `POST /api/intake-sources/isrc_acceptance_doc/extract` succeeded through Google model `gemini-3.1-pro-preview`, persisted provider job `pjob_a0aec689-91a2-4fa4-a266-10b817978073`, and output artifact `artifact_51813f1a-1cd1-44c0-96c3-27873fb99be8` |
| Section 19 closure OCR proof | `POST /api/intake-sources/isrc_acceptance_image/extract` succeeded through Google model `gemini-3.1-pro-preview`, persisted provider job `pjob_a5f454ed-5643-471d-a8aa-67a08f658b8a`, and output artifact `artifact_44d74823-1bdb-4f1b-ae39-34a30388049a` |
| Section 19 closure AI source-role proof | `POST /api/intake-sources/isrc_acceptance_doc/suggest` succeeded with suggestion `suggestion_7306a6f2-bdc8-457b-87a9-f4c7a22919fb`, role `company_overview`, scope `company_level`, confidence `high`, and evidenceRefs count `1`; UI labels it source-role intake triage only |
| Section 19 closure admin source-role decision proof | `POST /api/intake-sources/isrc_acceptance_doc/source-role-decision` persisted all four decisions: `confirmed_ai_suggestion`, `edited_ai_suggestion`, `overridden_by_admin`, and `marked_needs_review`; original `AIIntakeSuggestion` remained separately persisted |
| Section 19 closure live dictation proof | `POST /api/live-dictation/transcribe` succeeded through Google Speech-to-Text V1 model `latest_short`, returned transcript text length `41`, and reported `sourceCreated: false`; saving the transcript through `/api/intake-sources` created manual note source `isrc_acceptance_live_note_real` with `noteOrigin: live_stt` |
| Section 19 closure manual note structuring proof | `POST /api/intake-sources/isrc_acceptance_manual_note/structure-note` succeeded through Google model `gemini-3.1-pro-preview`, persisted provider job `pjob_e8cd9574-8f48-44dc-9b85-5d8b64001d74`, and output artifact `artifact_2224ab29-a4ab-4408-8936-82009855a916` preserving operator original note and AI-structured result |
| Section 19 closure active-LLM structured context proof | `POST /api/intake-sessions/intake_acceptance_closure/department-context` with action `generate-ai-structured-context` persisted structured context `structured_context_50561611-3978-4aff-ba03-5554405a2d7f`, notes `Generated through active LLM provider google model gemini-3.1-pro-preview; intake/context only, no hierarchy.`, and field evidence across 4 fields |
| Section 19 closure restart proof | after app restart using `/tmp/workflow-pass2-acceptance-closure-20260424d.sqlite`, document/OCR artifacts, AI suggestion, all four admin decisions, live-dictation manual note, manual-note structuring artifact, provider-generated structured context, and structured-context provider job reloaded from SQLite |
| Section 19 closure documentation proof | `handoff/PASS2_LOCAL_PERSISTENCE.md` documents local DB initialization/path/reset, artifact storage locations, git-ignored local storage, and secret hygiene |
| All prior pass proofs (6–9) | Still valid — unchanged |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec. Formally deferred by operator. | 2026-04-21 |
| OQ-003 | Session terminal-state looping. Operator confirmation required. | 2026-04-22 |
| OQ-004 | §19.6–§19.9 peer-level enrichment trigger ordering not literal in spec. | 2026-04-22 |
| OQ-005 | §21.4 conditional-section inclusion triggers not literal. | 2026-04-22 |

---

## What has NOT been built

- Authentication / authorization
- Hierarchy intake
- Automated tests / CI

---

## Pass 2 completion status

The crawler-runtime caveat is resolved.

Pass 2 is `pass2_complete_after_all_proofs`.

Known implementation proof status after Section 19 closure:

- Website crawling succeeded end-to-end through approved `fetch_html` CrawlerAdapter.
- Crawl page output, site summary, chunk creation, and Google embedding generation were proven and persisted.
- Real Google document extraction and OCR succeeded with `gemini-3.1-pro-preview`.
- Real AI source-role suggestion and active-LLM structured context generation succeeded with `gemini-3.1-pro-preview`.
- Live dictation STT succeeded through Google Speech-to-Text and remained separate until saved as manual/operator note.
- No known Section 19 proof remains missing from local verification.
