# Workspace Copilot Inventory and Integration Plan

Planning report only. No code, routes, APIs, package contracts, prompt specs, data models, providers, or UI behavior were changed.

Starting branch: `codex/workspace-shell-sandbox`  
Starting commit: `3a26d687471551061c6bfbfeb96da8d7ac4a6c6b`

## A. Executive Summary

The repository already contains two implemented copilot/assistant runtimes:

- **Pass 5 Admin Assistant / Section Copilot**: implemented in `packages/participant-sessions`, surfaced in the participant session detail UI and `/api/participant-sessions/assistant`. It builds bounded Pass 5 context bundles, classifies admin questions, compiles the Pass 5 `admin_assistant_prompt`, records provider jobs, returns deterministic fallback when providers are unavailable, and returns routed action suggestions only.
- **Pass 6 Conversational Copilot**: implemented in `packages/prompts`, surfaced in `/pass6/copilot` and `/api/pass6/copilot`. It builds DB-grounded Pass 6 context bundles, compiles the `pass6_analysis_copilot` PromptSpec, stores interactions, and returns routed action recommendations only.

Passes 2, 3, and 4 have provider-backed helper or recommendation behavior, but they are not copilots:

- **Pass 2** supports intake source-role suggestions, provider extraction jobs, embeddings, note structuring, and structured context formation.
- **Pass 3** supports hierarchy draft generation, source-to-hierarchy triage, manual correction/approval flows, and PromptOps/test records.
- **Pass 4** supports targeting recommendation packets, source-signal interpretation, question-hint seed planning, contact/channel readiness notes, rollout-order reasoning, and PromptOps/test records.

PromptOps exists across several stages:

- General prompt registry under `/prompts`.
- Pass 3/4 structured prompt specs and active-vs-draft comparison tests.
- Pass 5 prompt family with provider job/test support.
- Pass 6 Prompt Workspace with lifecycle controls, compiled previews, provider-backed test execution, active/draft comparison, and archived/previous states.

Planned/future-only assistant behavior is mainly in **Pass 7**. Current Pass 7-adjacent functionality is a candidate seam from Pass 6; it is not a client copilot, not a finalization assistant, and not an issue-discussion engine.

Biggest integration risk: treating existing provider-backed recommendations or prompt test harnesses as if they were workspace copilots. Several surfaces write records or trigger provider jobs even when the user-facing result is "recommendation-only." The `/workspace` shell should not directly expose provider execution, state changes, package generation, readiness decisions, transcript approval, or Pass 7 mechanics.

## B. Stage-by-Stage Matrix

| Stage / Pass | Existing capability name | Type | Current implementation status | Repo files/routes/packages found | Context source used | Provider dependency | Read/write behavior | Safe for `/workspace` now? | Should remain Advanced/Internal? | Recommended workspace representation | Risks/boundaries |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Setup / Case | Case shell and admin navigation context | static helper | Existing admin route/navigation context only; no case copilot found | `apps/admin-web/app`, `apps/admin-web/lib/store.ts` | Store-backed case/session records where pages use them | None found for setup shell | Read-only navigation/page framing | Yes, as navigation/status copy only | No, unless tied to provider execution | Static stage card: "case setup complete / required records" | Do not invent setup readiness logic in UI |
| Sources & Context / Pass 2 | Provider extraction jobs | AI helper, provider job | Implemented | `packages/sources-context/src/provider-jobs.ts`, `apps/admin-web/app/api/intake-sources/[id]/extract/route.ts`, `apps/admin-web/app/api/intake-sources/[id]/transcribe/route.ts`, `apps/admin-web/app/api/provider-jobs/route.ts` | Intake source records, uploaded/source text, provider job records | Extraction provider / STT/OCR depending on route | Triggers provider job; writes provider job and text artifact records | No direct workspace execution | Yes | Read-only status card with link to source review | Provider execution and artifacts must stay in governed source pages |
| Sources & Context / Pass 2 | Source-role and scope suggestions | AI recommendation/helper | Implemented | `packages/sources-context/src/provider-jobs.ts`, `apps/admin-web/app/api/intake-sources/[id]/suggest/route.ts`, `apps/admin-web/app/api/intake-sources/[id]/source-role-decision/route.ts`, `packages/contracts/src/schemas/ai-intake-suggestion.schema.json` | Intake source metadata/text and provider extraction result | Extraction provider classification | Writes `AIIntakeSuggestion`; may update suggested type/scope/confidence/reason | Yes, as read-only summary | Execution and decisions should remain internal/source review | "Source classification suggestions available" card | Suggestions are triage-only, not evidence truth or hierarchy truth |
| Sources & Context / Pass 2 | Manual note structuring and structured context formation | AI helper/static helper | Implemented | `packages/sources-context/src/provider-jobs.ts`, `packages/sources-context/src/context-formation.ts`, `packages/sources-context/src/department-context.ts`, `apps/admin-web/app/api/intake-sources/[id]/structure-note/route.ts` | Manual notes, raw sources, crawl/source summaries | Provider for structuring/context formation when configured | Provider job writes and structured context records | Read-only only | Yes | Link to context review / "context prepared" status | Must not become hierarchy approval or workflow truth |
| Sources & Context / Pass 2 | Batch summaries and final pre-hierarchy review | static helper | Implemented | `apps/admin-web/app/intake-sessions/[id]/batch-summary/page.tsx`, `packages/sources-context/src/final-pre-hierarchy-review.ts` | Intake batch/source records | None | Read-only summary/review records | Yes | No | Static checklist/status section | Avoid adding new readiness computation in workspace |
| Hierarchy / Pass 3 | Hierarchy draft generation | AI recommendation/helper | Implemented as provider-backed draft path; route notes provider-backed generation is deferred in one endpoint and manual foundation route owns approval | `packages/hierarchy-intake/src/index.ts`, `apps/admin-web/app/api/intake-sessions/[id]/hierarchy-draft/route.ts`, `apps/admin-web/app/api/intake-sessions/[id]/hierarchy/route.ts`, `packages/contracts/src/schemas/hierarchy-draft.schema.json` | Structured context, intake session, hierarchy prompt spec | Extraction provider when wired | Recommendation-only draft; approval is admin-controlled state | Read-only summary only | Yes | Workspace card: "hierarchy draft/manual foundation status" | Draft is not approved hierarchy; workspace must not approve structure |
| Hierarchy / Pass 3 | Source-to-hierarchy triage | AI recommendation/helper | Implemented | `packages/hierarchy-intake/src/index.ts`, `apps/admin-web/app/api/intake-sessions/[id]/hierarchy/route.ts`, `packages/contracts/src/schemas/source-hierarchy-triage-job.schema.json`, `packages/contracts/src/schemas/source-hierarchy-triage-suggestion.schema.json` | Intake sources and hierarchy candidate context | Extraction provider `triageSourceHierarchy` when configured | Writes triage job and suggestions; admin can update decisions | Summary only | Yes | "Evidence candidate links" read-only count/status | Triage suggestions are tentative evidence links, not final hierarchy facts |
| Hierarchy / Pass 3 | Hierarchy PromptSpecs and prompt tests | PromptOps | Implemented | `packages/prompts/src/index.ts`, `packages/contracts/src/schemas/pass3-prompt-test-run.schema.json` | Structured PromptSpec records and test fixtures | Prompt text provider for tests | Writes prompt specs/test runs; no workflow truth | Link/status only | Yes | Prompt Studio link and last-test status | Do not run provider tests from `/workspace` |
| Targeting / Pass 4 | Targeting recommendation packet | AI recommendation/helper | Implemented | `packages/prompts/src/index.ts`, `packages/targeting-rollout`, `apps/admin-web/app/api/targeting-rollout/[id]/generate/route.ts`, `apps/admin-web/app/targeting-rollout/[id]/TargetingRolloutPlanClient.tsx`, `packages/contracts/src/schemas/targeting-recommendation-packet.schema.json` | Approved hierarchy, source signals, candidate participants, available channels | Prompt/extraction provider when generating | Writes targeting rollout plan/packet records | Read-only summary only | Yes | "Targeting recommendations ready for admin review" | Must not send invitations or start participant sessions autonomously |
| Targeting / Pass 4 | Source-signal interpretation, question-hint seed generation, channel readiness, rollout-order reasoning | AI recommendation/helper | Implemented inside targeting PromptSpec behavior | `packages/prompts/src/index.ts`, `packages/integrations/src/google-extraction.ts`, `packages/synthesis-evaluation/src/index.ts` carries document question hints forward | Source signals, document-derived hints, channel/contact metadata | Provider for packet generation | Recommendation-only; may persist plan data | Summary only | Yes | Read-only explanation of why targeting has recommendations | Question hints are seeds, not sent questions |
| Targeting / Pass 4 | Targeting PromptOps and comparison tests | PromptOps | Implemented | `packages/prompts/src/index.ts`, `apps/admin-web/app/targeting-rollout/prompts/page.tsx`, `apps/admin-web/app/api/targeting-rollout/prompts/route.ts`, `packages/contracts/src/schemas/pass4-prompt-test-run.schema.json` | Prompt specs and test fixtures | Prompt text provider for tests | Writes prompt draft/active/test run records | Link/status only | Yes | Prompt Studio link | Do not expose provider execution from workspace |
| Participant Evidence / Pass 5 | Admin Assistant / Section Copilot | Copilot / Assistant | Implemented | `packages/participant-sessions/src/index.ts`, `apps/admin-web/app/participant-sessions/[sessionId]/page.tsx`, `apps/admin-web/app/api/participant-sessions/assistant/route.ts`, `scripts/prove-pass5-block12-admin-assistant.mjs`, `scripts/prove-pass5-block12-stage-aware-copilot.mjs` | Participant sessions, tokens metadata, raw evidence, extraction outputs, clarification candidates, boundary signals, disputes, next actions, Pass 6 handoff candidates | Optional first-pass extraction executor/text provider | Builds context; compiles prompt; writes provider job; returns answer and routed suggestions; no direct mutation in answer | Later, as read-only assistant card/dock only | Runtime should remain internal until view-model APIs exist | Read-only route-aware help drawer that links to existing Pass 5 assistant | Raw participant disclosure and provider execution boundaries are high risk |
| Participant Evidence / Pass 5 | Context bundle builder | Assistant support | Implemented | `packages/participant-sessions/src/index.ts` (`buildAdminAssistantContextBundle`) | Pass 5 DB records scoped by current session, selected sessions, case, or targeted records | None for bundle build | Read-only context assembly | Yes, as summarized metadata only | Detailed bundles internal | "Assistant context available" indicator | Do not expose raw evidence outside allowed admin surfaces |
| Participant Evidence / Pass 5 | Routed-action recommendations | AI recommendation/helper | Implemented | `packages/participant-sessions/src/index.ts` (`deriveAssistantRoutedActions`) | Context bundle records and query intent | Provider optional for answer; recommendations deterministic | Recommendation-only; requires admin confirmation | Summary only | Yes | Show labels/links, not execution buttons | Must not auto-create handoff, approve evidence, or send messages |
| Participant Evidence / Pass 5 | Clarification, answer recheck, extraction and boundary support | AI helper/provider job | Implemented | `packages/participant-sessions/src/index.ts`, `apps/admin-web/app/api/participant-sessions/[sessionId]/actions/route.ts`, `scripts/prove-pass5-block14-answer-recheck-governance.mjs` | Clarification candidates, raw answers, participant evidence | Provider for formulation/recheck paths | Writes clarification/recheck/provider-job records depending on route action | No direct workspace execution | Yes | Read-only counters/status and links | These are governed Pass 5 operations, not generic workspace actions |
| Participant Evidence / Pass 5 | Pass 6 handoff candidate from assistant recommendation | AI recommendation plus admin-confirmed write | Implemented | `packages/participant-sessions/src/index.ts`, `apps/admin-web/app/api/participant-sessions/handoff-candidates/route.ts` | Assistant recommendation, session/evidence/boundary/dispute records | None required for write once admin submits | Writes `Pass6HandoffCandidate` after route action | No direct workspace execution | Yes | "handoff candidates pending" link | Workspace must not auto-create candidates from assistant text |
| Participant Evidence / Pass 5 | Pass 5 prompt family and prompt tests | PromptOps | Implemented | `packages/prompts/src/index.ts`, `scripts/prove-pass5-block8-prompt-family.mjs` | Prompt family specs and test fixtures | Provider for prompt tests/execution | Writes provider job/test records | Link/status only | Yes | Prompt Studio linkage | Prompt behavior is governed; no direct workspace test execution |
| Analysis & Package / Pass 6 | Pass 6 Conversational Copilot | Copilot / Assistant | Implemented | `packages/prompts/src/index.ts`, `apps/admin-web/app/pass6/copilot/page.tsx`, `apps/admin-web/app/api/pass6/copilot/route.ts`, `scripts/prove-pass6-block18-copilot.mjs`, `handoff/NEXT_PASS.md` | Synthesis input bundles, workflow units/claims, methods, differences, drafts, readiness, gates, inquiries, interfaces, packages/briefs, visuals, config profiles | Prompt text provider | Builds/persists context bundle; writes interaction record; returns recommendations only | Later, read-only summary/link only | Runtime should remain internal until view-model APIs exist | Workspace "Ask about Pass 6 records" placeholder/link to advanced Copilot | No readiness override, package approval, provider execution from workspace, or Pass 7 mechanics |
| Analysis & Package / Pass 6 | Admin Explanation PromptSpec and methodology/readiness/package reasoning prompts | PromptOps / AI helper | Implemented as PromptSpecs | `packages/prompts/src/index.ts`, `packages/synthesis-evaluation/src/index.ts`, `apps/admin-web/app/pass6/evaluation/page.tsx`, `apps/admin-web/app/pass6/packages/page.tsx` | Stored Pass 6 analysis/package/readiness records | Provider only when prompt tests/runtime use it | Prompt specs/test records; package/evaluation pages are record inspection | Read-only status/explanation only | Yes | Static explanation cards: "why ready/blocked" when view-model exists | Avoid recomputing readiness or package eligibility in UI |
| Analysis & Package / Pass 6 | Synthesis, difference, evaluation, package drafting PromptSpecs | PromptOps / AI helper | Implemented | `packages/prompts/src/index.ts`, `apps/admin-web/app/pass6/prompts/page.tsx`, `apps/admin-web/app/pass6/prompts/[promptSpecId]/page.tsx`, `apps/admin-web/app/api/pass6/prompts/route.ts`, `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json` | Prompt specs, test cases, Pass 6 fixtures | Prompt text provider for tests | Writes prompt spec, test case, and execution result records; tests create no workflow records | Link/status only | Yes | Prompt Studio cards and last-test status | Provider tests must remain Advanced/Internal |
| Analysis & Package / Pass 6 | Copilot behavior profile | Planned in PromptSpec, implemented runtime | Implemented | `packages/prompts/src/index.ts` (`pass6_analysis_copilot` sections) | DB-grounded Pass 6 context bundle | Prompt text provider | Read-only interaction records only | Later, read-only link | Yes | Explain capability and boundaries | Do not present as autonomous agent |
| Future Finalization / Pass 7 | Pass 7 review candidate seam | planned/future only support | Candidate seam implemented; Pass 7 mechanics not implemented | `packages/synthesis-evaluation/src/index.ts`, `apps/admin-web/app/pass6/pass7-candidates/page.tsx`, `apps/admin-web/app/api/pass6/pass7-candidates/route.ts`, `scripts/prove-pass6-block19-pass7-candidate-seam.mjs`, `handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md` | Pass 6 unresolved/review-worthy outputs | None for candidate status updates | Writes/updates candidate seam records; no issue discussion | Read-only count/link only | Yes | "Review candidates exist for later Pass 7" | Must not become Pass 7 client copilot or finalization assistant |
| Future Finalization / Pass 7 | Client-safe/finalization assistant | planned only / absent | Not implemented | `packages/contracts/src/schemas/review-issue-record.schema.json`, `packages/contracts/src/types/review-issues.ts`, `apps/admin-web/app/issues/page.tsx`, handoff docs | Planned review issue records | Not implemented | Absent beyond schema/admin issue page | No | Yes | No workspace runtime; mention future only | No Pass 7 copilot until separately scoped |
| Prompt Studio / PromptOps | General prompt registry | PromptOps | Implemented | `apps/admin-web/app/prompts/page.tsx`, `apps/admin-web/app/prompts/new/page.tsx`, `apps/admin-web/app/prompts/[id]/page.tsx`, `apps/admin-web/app/api/prompts/route.ts`, `apps/admin-web/app/api/prompts/[id]/route.ts`, `packages/prompts/src/index.ts` | Prompt registry records | None for registry itself | Writes prompt registry records | Link only | Yes | Prompt Studio navigation card | Prompt registry is not a copilot |
| Prompt Studio / PromptOps | Pass 3/4/6 prompt workspaces and provider test harnesses | PromptOps | Implemented | `packages/prompts/src/index.ts`, Pass 3/4/6 prompt routes/pages, proof scripts | Prompt specs, test cases, fixtures | Provider for execution tests | Writes prompt/test execution records; no workflow record creation in test harness | Link/status only | Yes | Workspace PromptOps status cards | Do not blur prompt testing with production assistant behavior |
| Advanced/internal provider surfaces | Provider registry and provider diagnostics | internal helper | Implemented | `packages/integrations/src/provider-registry.ts`, `packages/integrations/src/openai-extraction.ts`, `packages/integrations/src/google-extraction.ts`, `packages/integrations/src/google-config.ts`, `apps/admin-web/app/api/provider-status/route.ts` | Environment/provider availability and provider adapters | OpenAI/Google depending on env | Provider execution or diagnostics | Status only | Yes | Provider availability indicator only | Workspace must not run providers directly |

## C. Repository Evidence Map

### apps/admin-web routes/components

- `apps/admin-web/app/workspace/_components/WorkspaceShell.tsx`
- `apps/admin-web/app/workspace/_components/WorkspaceHome.tsx`
- `apps/admin-web/app/workspace/workspace.module.css`
- `apps/admin-web/app/api/provider-status/route.ts`
- `apps/admin-web/app/api/provider-jobs/route.ts`
- `apps/admin-web/app/api/intake-sources/[id]/extract/route.ts`
- `apps/admin-web/app/api/intake-sources/[id]/suggest/route.ts`
- `apps/admin-web/app/api/intake-sources/[id]/transcribe/route.ts`
- `apps/admin-web/app/api/intake-sources/[id]/source-role-decision/route.ts`
- `apps/admin-web/app/api/intake-sources/[id]/structure-note/route.ts`
- `apps/admin-web/app/intake-sessions/[id]/batch-summary/page.tsx`
- `apps/admin-web/app/api/intake-sessions/[id]/hierarchy-draft/route.ts`
- `apps/admin-web/app/api/intake-sessions/[id]/hierarchy/route.ts`
- `apps/admin-web/app/intake-sessions/[id]/hierarchy/HierarchyFoundationClient.tsx`
- `apps/admin-web/app/intake-sessions/[id]/hierarchy/page.tsx`
- `apps/admin-web/app/targeting-rollout/[id]/TargetingRolloutPlanClient.tsx`
- `apps/admin-web/app/targeting-rollout/[id]/page.tsx`
- `apps/admin-web/app/targeting-rollout/page.tsx`
- `apps/admin-web/app/targeting-rollout/prompts/page.tsx`
- `apps/admin-web/app/api/targeting-rollout/[id]/generate/route.ts`
- `apps/admin-web/app/api/targeting-rollout/[id]/route.ts`
- `apps/admin-web/app/api/targeting-rollout/prompts/route.ts`
- `apps/admin-web/app/api/targeting-rollout/route.ts`
- `apps/admin-web/app/participant-sessions/[sessionId]/page.tsx`
- `apps/admin-web/app/api/participant-sessions/assistant/route.ts`
- `apps/admin-web/app/api/participant-sessions/[sessionId]/actions/route.ts`
- `apps/admin-web/app/api/participant-sessions/handoff-candidates/route.ts`
- `apps/admin-web/app/pass6/copilot/page.tsx`
- `apps/admin-web/app/api/pass6/copilot/route.ts`
- `apps/admin-web/app/pass6/prompts/page.tsx`
- `apps/admin-web/app/pass6/prompts/[promptSpecId]/page.tsx`
- `apps/admin-web/app/pass6/prompts/results/[executionId]/page.tsx`
- `apps/admin-web/app/api/pass6/prompts/route.ts`
- `apps/admin-web/app/pass6/pass7-candidates/page.tsx`
- `apps/admin-web/app/pass6/pass7-candidates/[candidateId]/page.tsx`
- `apps/admin-web/app/api/pass6/pass7-candidates/route.ts`
- `apps/admin-web/app/issues/page.tsx`
- `apps/admin-web/lib/store.ts`

### packages/prompts

- `packages/prompts/src/index.ts`
- Pass 3 modules: `pass3.hierarchy.draft`, `pass3.source_hierarchy.triage`
- Pass 4 module: `pass4.targeting_rollout.packet`
- Pass 5 family: `pass5_participant_session_prompt_family`
- Pass 5 prompt names: `participant_guidance_prompt`, `first_pass_extraction_prompt`, `evidence_interpretation_prompt`, `clarification_formulation_prompt`, `answer_recheck_prompt`, `admin_added_question_prompt`, `admin_assistant_prompt`
- Pass 6 capabilities: `synthesis`, `difference_interpretation`, `evaluation`, `initial_package_drafting`, `admin_explanation`, `pre_package_inquiry_generation`, `optional_draft_document_generation`, `visual_narrative_support`, `pass6_analysis_copilot`
- Pass 6 runtime functions: `buildPass6CopilotContextBundle`, `runPass6Copilot`

### packages/integrations

- `packages/integrations/src/provider-registry.ts`
- `packages/integrations/src/extraction-provider.ts`
- `packages/integrations/src/openai-extraction.ts`
- `packages/integrations/src/google-extraction.ts`
- `packages/integrations/src/google-config.ts`

### packages/persistence

- `packages/persistence/src/index.ts`
- Stores observed for provider jobs, AI suggestions, prompt specs, source hierarchy triage jobs/suggestions, prompt test runs, targeting rollout plans, participant sessions, evidence records, Pass 6 prompt/workspace records, Pass 6 copilot bundles/interactions, and Pass 7 review candidates.

### packages/participant-sessions or equivalent

- `packages/participant-sessions/src/index.ts`
- Key functions: `buildAdminAssistantContextBundle`, `classifyAdminAssistantQuestion`, `runAdminAssistantQuestion`, `formulateClarificationQuestion`, `runClarificationAnswerRecheck`, `createPass6HandoffCandidateFromAssistantRecommendation`.

### packages/synthesis-evaluation

- `packages/synthesis-evaluation/src/index.ts`
- Carries document-derived question hints into 6A source-signal material.
- Contains Pass 6 analysis/readiness/package/visual/Pass 7 candidate seam behavior.

### packages/targeting-rollout

- `packages/targeting-rollout`
- Works with targeting rollout plan records and Pass 4 recommendation packet surfaces.

### packages/hierarchy-intake or equivalent

- `packages/hierarchy-intake/src/index.ts`
- Key behavior: hierarchy draft validation/generation, source-to-hierarchy triage jobs/suggestions, manual link creation, admin updates, structural approval.

### packages/contracts

- `packages/contracts/src/schemas/ai-intake-suggestion.schema.json`
- `packages/contracts/src/schemas/intake-batch-record.schema.json`
- `packages/contracts/src/schemas/intake-batch-summary-item.schema.json`
- `packages/contracts/src/schemas/intake-source-record.schema.json`
- `packages/contracts/src/schemas/hierarchy-draft.schema.json`
- `packages/contracts/src/schemas/source-hierarchy-triage-job.schema.json`
- `packages/contracts/src/schemas/source-hierarchy-triage-suggestion.schema.json`
- `packages/contracts/src/schemas/pass3-prompt-test-run.schema.json`
- `packages/contracts/src/schemas/targeting-recommendation-packet.schema.json`
- `packages/contracts/src/schemas/targeting-rollout-plan.schema.json`
- `packages/contracts/src/schemas/pass4-prompt-test-run.schema.json`
- `packages/contracts/src/schemas/pass6-prompt-workspace.schema.json`
- `packages/contracts/src/schemas/pass6-core.schema.json`
- `packages/contracts/src/schemas/review-issue-record.schema.json`
- `packages/contracts/src/types/hierarchy.ts`
- `packages/contracts/src/types/pass6-core.ts`
- `packages/contracts/src/types/review-issues.ts`

### scripts/proof files

- `scripts/prove-pass5-block8-prompt-family.mjs`
- `scripts/prove-pass5-block12-admin-assistant.mjs`
- `scripts/prove-pass5-block12-stage-aware-copilot.mjs`
- `scripts/prove-pass5-block14-answer-recheck-governance.mjs`
- `scripts/prove-pass6-block6-synthesis-input-bundle.mjs`
- `scripts/prove-pass6-block7-bundle-review-surface.mjs`
- `scripts/prove-pass6-block8-method-registry.mjs`
- `scripts/prove-pass6-block11-workflow-assembly.mjs`
- `scripts/prove-pass6-block12-readiness-result.mjs`
- `scripts/prove-pass6-block14-pre6c-gate.mjs`
- `scripts/prove-pass6-block15-external-interfaces.mjs`
- `scripts/prove-pass6-block16-package-generation.mjs`
- `scripts/prove-pass6-block18-copilot.mjs`
- `scripts/prove-pass6-block19-pass7-candidate-seam.mjs`

### handoff/planning references

- `handoff/NEXT_PASS.md`
- `handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md`
- `handoff/pass6-source-references/PASS6_CONCEPTUAL_CLOSURE_REFERENCE.md`
- `handoff/pass6-source-references/PASS6_TECHNICAL_DECOMPOSITION_LIVE_REFERENCE.md`
- `handoff/OPEN_QUESTIONS.md`

## D. Workspace Integration Recommendation

Surface now as static/help text:

- Stage boundary cards explaining what each stage can and cannot do.
- Counts/status links for source suggestions, hierarchy triage suggestions, targeting recommendations, Pass 5 assistant availability, Pass 6 copilot availability, prompt workspace areas, and Pass 7 candidate seam records.
- Provider availability as read-only status only.
- Existing accepted dashboard sections should remain sectioned and visual-only.

Surface later as read-only assistant:

- A route-aware workspace help drawer that can explain the current page/stage using static stage metadata first.
- A read-only Pass 5 assistant entry point that links into existing participant session assistant context, once view-model APIs define exactly which participant/evidence records are visible.
- A read-only Pass 6 assistant entry point that links into existing Pass 6 Copilot, once case-level Pass 6 view-model APIs exist.

Must wait for real data/view-model APIs:

- Stage cards that summarize live readiness, blockers, warnings, source counts, recommendation status, provider job failures, active prompt versions, or unresolved review candidates.
- Any cross-stage assistant context in `/workspace`.
- Any safe "recommended next action" list that references live records.

Must remain Advanced/Internal:

- Provider execution routes and prompt test harnesses.
- Prompt editing, promotion, archive, active/draft comparison, and provider-backed prompt tests.
- Source extraction/OCR/STT/embedding execution.
- Hierarchy draft generation and source-to-hierarchy triage execution.
- Targeting recommendation generation.
- Pass 5 clarification/recheck execution.
- Pass 6 Copilot runtime until a read-only workspace wrapper is scoped.
- Pass 7 candidate status changes.

Must never become autonomous:

- Gate approvals.
- Transcript/evidence approval or rejection.
- Participant sending or channel dispatch.
- Readiness recalculation/override.
- Package eligibility change, package approval, Final Package generation, or release.
- Pass 7 discussion/issue mechanics.
- Business logic embedded in workspace UI.

## E. Recommended Staged Plan

1. **Workspace assistant placeholder / dock shell**
   - Add a static, route-aware placeholder only.
   - It should explain stage boundaries and link to existing admin surfaces.
   - It should not call providers, build live context bundles, or write records.

2. **Read-only context cards**
   - Add card slots for "source suggestions", "hierarchy triage", "targeting recommendations", "Pass 5 assistant", "Pass 6 copilot", and "PromptOps".
   - Initially populate from static/manual labels or existing page links only.
   - Later replace with view-model API data.

3. **Route-aware help drawer**
   - Build a non-provider help drawer keyed by workspace route/stage.
   - It can describe current boundaries, allowed actions, and where to go next.
   - It should not ingest raw participant data.

4. **Integration with existing Pass 5 Admin Assistant**
   - Add a read-only entry/link after view-model APIs define session/case scope and raw evidence disclosure rules.
   - Workspace should show assistant availability and maybe latest provider status, not run arbitrary Pass 5 assistant questions first.

5. **Future Pass 6 Analysis Copilot**
   - Add a Pass 6 Copilot entry/link after case-level Pass 6 context view-models exist.
   - Keep runtime in `/pass6/copilot` or an internal route until workspace ownership and boundaries are explicit.

6. **Prompt Studio linkage**
   - Surface prompt areas as links and status summaries.
   - Do not run provider tests or promote/archive prompts from `/workspace`.

7. **View-model API dependency**
   - Any live workspace assistant or context card needs explicit view-model APIs that flatten allowed data, redact raw participant details when needed, and carry boundary metadata.
   - Without those APIs, workspace should remain static/help-only.

## F. Hard Boundaries

- No autonomous writes.
- No gate approval.
- No transcript approval.
- No evidence approval or rejection.
- No package generation.
- No provider execution directly from workspace UI.
- No Pass 7 client copilot.
- No raw participant disclosure outside allowed admin surfaces.
- No business logic in UI.
- No readiness recalculation.
- No readiness override.
- No package eligibility changes.
- No package approval.
- No participant-facing sends.
- No WhatsApp/Telegram/email/message dispatch.
- No prompt promotion, prompt archive, or prompt test execution from the workspace shell.
- No source extraction, hierarchy generation, targeting generation, clarification recheck, or Copilot runtime execution from `/workspace` until separately scoped.

## G. Open Questions

| Question | Why it matters | Suggested answer/options | Criticality 1-5 | Blocks next implementation? |
| --- | --- | --- | --- | --- |
| Should `/workspace` ever execute assistant/provider calls directly, or only deep-link to governed advanced pages? | Direct execution creates provider, data exposure, and write-boundary risk. | Suggested answer: deep-link only for the next slice; add direct runtime later only after view-model APIs and boundary tests. | 5 | No for static placeholder; yes for live assistant |
| What is the allowed data envelope for workspace-level assistant context? | Workspace is cross-stage and may accidentally mix raw participant evidence with summary-only pages. | Define per-stage view-models with redaction and boundary metadata. | 5 | Yes for live context cards |
| Can raw participant evidence snippets appear in `/workspace`? | Pass 5 assistant can include snippets, but workspace may be a broader dashboard. | Suggested answer: no raw snippets in workspace; link to participant session detail. | 5 | Yes for Pass 5 assistant embedding |
| Should the language-aware workspace shell include a help dock in both Arabic and English now? | The visual gate is accepted; adding a dock can reintroduce layout pressure. | Suggested answer: static compact dock/header affordance only after design review, no live assistant panel yet. | 3 | No |
| Which stages count as "safe for workspace" when only static placeholders exist? | Prevents accidental exposure of internal provider/test surfaces. | Suggested answer: all stages can have static cards; only Pass 5/6 can mention real assistant runtimes as links. | 4 | No |
| Should PromptOps be shown as Copilot-like capability? | PromptOps is related but not user-facing assistance. | Suggested answer: label as PromptOps only, not Copilot. | 4 | No |
| Where should routed action recommendations be rendered? | Recommendations can be confused with executable actions. | Suggested answer: render only inside owning advanced surface, or as read-only labels with explicit "requires admin confirmation". | 5 | Yes for recommendation UI |
| How should Pass 7 be represented before implementation? | Pass 7 candidate seam exists, but full Pass 7 does not. | Suggested answer: show "future review candidates" only; no assistant/chat/finalization language. | 5 | No |
| Are provider availability/failure statuses safe to show in workspace? | They are useful but can imply execution controls. | Suggested answer: show status only with no run buttons. | 3 | No |
| Should case setup get its own assistant, or remain static? | No setup copilot was found; adding one would be new behavior. | Suggested answer: static setup checklist only until separately scoped. | 3 | No |

## Classification Summary

- Implemented Copilot / Assistant behavior: Pass 5 Admin Assistant / Section Copilot; Pass 6 Conversational Copilot.
- Implemented AI recommendation/helper behavior that is not a Copilot: Pass 2 source-role suggestions/extraction helpers; Pass 3 hierarchy draft and source-to-hierarchy triage; Pass 4 targeting recommendation packet and source-signal/question-hint reasoning; Pass 5 clarification/answer recheck/handoff support.
- Implemented PromptOps / Prompt Workspace behavior: general prompt registry, Pass 3/4 prompt specs/tests, Pass 5 prompt family/test jobs, Pass 6 Prompt Workspace/test harness.
- Planned but not implemented Copilot behavior: Pass 7 client/finalization assistant; any workspace-level assistant runtime.
- Safe UI-only workspace placeholder possibility: static stage help, read-only links, provider status summaries, stage boundary cards, prompt workspace links.
- Unsafe/deferred behavior: direct provider execution, prompt tests, prompt promotion, gate approval, transcript/evidence approval, package generation, readiness override, participant messaging, Pass 7 mechanics.
- Absent / not found: Setup/Case copilot; true workspace-wide Copilot runtime; Pass 7 client copilot/finalization assistant.
