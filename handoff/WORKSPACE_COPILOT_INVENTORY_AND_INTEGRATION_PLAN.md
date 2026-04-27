# Workspace Copilot Inventory and Integration Plan

Planning report only. No code, routes, APIs, package contracts, prompt specs, data models, providers, UI behavior, or runtime behavior were changed.

Branch: `codex/workspace-shell-sandbox`  
Latest accepted visual commit: `3a26d687471551061c6bfbfeb96da8d7ac4a6c6b`  
Report revision starting commit: `7970fe6d56094b7e9f3174b626458407248fe5cb`

## A. Revised Executive Summary

The target product direction is a **Stage Copilot Family**: every `/workspace` stage should eventually have its own bounded Copilot behavior. The workspace may share one dock/shell UI, but it must not become one generic chatbot that answers across the whole product without stage boundaries.

This report distinguishes three separate layers:

1. **Capability PromptSpecs**
   - These control AI work inside a stage.
   - Examples: source understanding, source-role suggestion, hierarchy drafting, source-to-hierarchy triage, targeting recommendations, question-hint seed generation, evidence extraction, clarification question formulation, answer recheck, synthesis, difference interpretation, evaluation, and package drafting.
   - They are not automatically conversational copilots.

2. **Stage Copilot PromptSpecs**
   - These control conversational admin support inside a specific stage.
   - They define what the stage Copilot may explain, what context it may read, what it must not decide, what actions it may recommend, which links/navigation chips it may expose, what requires admin confirmation, and what must stay advanced/internal.
   - Some current capability prompt families contain assistant-like behavior, but most stages do not yet have explicit Stage Copilot PromptSpecs.

3. **Stage Copilot Runtime**
   - This is the implemented assistant surface: route/API, context bundle, provider job path, UI/dock integration, read/write behavior, routed action recommendations, and state-change boundaries.
   - A Stage Copilot PromptSpec without a runtime is only a profile/specification. A capability PromptSpec without a Stage Copilot PromptSpec is only stage AI work, not an admin-facing copilot.

Current repository state:

- **Passes 2-4** already have meaningful Capability PromptSpecs and AI helper/recommendation behavior, but they should not be treated as "helper-only forever." They are good candidates for future dedicated Stage Copilots: Sources / Context Copilot, Hierarchy Copilot, and Targeting Copilot.
- **Pass 5** is close to the target model today. It has a Pass 5 Admin Assistant / Section Copilot runtime, a context bundle, a prompt family containing `admin_assistant_prompt`, provider-job recording, deterministic fallback, and routed action suggestions.
- **Pass 6** is also close to the target model today. It has a Pass 6 Conversational Copilot runtime, a Pass 6 `pass6_analysis_copilot` PromptSpec/profile, a DB-grounded context bundle, persisted interactions, provider execution through a governed route, and routed action recommendations only.
- **Prompt Studio** has strong PromptOps behavior but should gain its own Prompt Studio Copilot later to explain prompt lifecycle and the difference between Capability PromptSpecs and Stage Copilot PromptSpecs.
- **Pass 7** remains future-only for client/finalization copilot behavior. Current Pass 7-adjacent behavior is a candidate seam only, not a client copilot or finalization assistant.

Recommended product model:

**Shared Copilot Dock UI + Stage-specific Copilot Profiles + Stage-specific Context Bundles + Stage-specific Copilot PromptSpecs + Strict read/write/action boundaries**

The shared dock should behave like a stage-aware host. It should load only the active stage profile/context, enforce stage boundaries, and deep-link to governed admin surfaces. It must not become an unbounded assistant that can mix raw participant evidence, prompt test execution, provider jobs, readiness decisions, package generation, and Pass 7 review mechanics in one generic chat context.

## B. Stage Copilot Family Matrix

| Stage / Pass | Current capability PromptSpecs or prompt families found | Existing AI helper/recommendation capabilities | Existing Stage Copilot PromptSpec? | Existing Copilot runtime? | Existing context bundle? | Current provider dependency | Current read/write behavior | Missing pieces to support dedicated Stage Copilot | Safe `/workspace` representation now | Recommended future Copilot representation | Should remain Advanced/Internal? | Risks/boundaries | Recommended priority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Setup / Case | None found as dedicated prompt family | Admin navigation/case shell only | No; planned if needed | No; planned if useful | No; planned | None found | Read-only page/navigation framing | Case setup copilot profile, setup context bundle, allowed setup checklist view-model | Static setup/help text only | Setup / Case Copilot that explains case setup state, required inputs, and next safe setup links | Most setup actions can stay normal UI; copilot should be helper-only | Do not invent readiness logic or create business state from UI | Low |
| Sources & Context / Pass 2 | Source-role/source-scope suggestion behavior; extraction/context formation prompts through provider adapters | Provider extraction, transcription/OCR, embeddings, source-role suggestions, note structuring, structured context formation, batch/final pre-hierarchy review helpers | No; planned `SourcesContextCopilotPromptSpec` | No; planned | No stage copilot bundle; provider jobs and source records exist | Extraction/STT/OCR/text providers depending on action | Provider jobs and text artifacts may be written; suggestions can update source AI-suggested fields | `SourcesCopilotContextBundle`, stage copilot prompt spec, governed read-only route, redacted source summaries, provider failure summaries | Static source-status and provider-status cards; links to source review | Sources / Context Copilot that explains source status, role/scope suggestions, extraction state, missing source implications, and document signal vs workflow truth | Execution routes stay internal/source pages | No direct extraction/provider execution from workspace; suggestions are triage-only, not evidence truth | High |
| Hierarchy / Pass 3 | `pass3.hierarchy.draft`, `pass3.source_hierarchy.triage`; Pass 3 prompt test records | Hierarchy draft generation, source-to-hierarchy triage, manual link creation/update, admin structural approval flows | No; planned `HierarchyCopilotPromptSpec` | No; planned | No stage copilot bundle; hierarchy and triage records exist | Extraction/text provider for generation/triage/tests when configured | Draft/suggestion records can be written; approval is admin-controlled | `HierarchyCopilotContextBundle`, hierarchy explanation prompt, route-aware link chips, structural approval boundary | Static hierarchy status, triage counts, and links | Hierarchy Copilot that explains draft reasoning, reporting uncertainty, interface/role signals, source-to-role evidence candidates, and why approval is structural only | Generation, triage execution, and approval remain internal | Must not approve hierarchy, convert candidates to truth, or infer reporting lines without records | High |
| Targeting / Pass 4 | `pass4.targeting_rollout.packet`; Pass 4 prompt test records | Targeting recommendation packet, source-signal interpretation, question-hint seed generation, contact/channel readiness notes, rollout-order reasoning | No; planned `TargetingCopilotPromptSpec` | No; planned | No stage copilot bundle; targeting plan/packet records exist | Prompt/text provider for packet generation/tests | Writes targeting rollout plan/packet/test run records; recommendations only | `TargetingCopilotContextBundle`, participant/contact readiness summaries, rollout reasoning explanation profile | Static targeting recommendation status and links | Targeting Copilot that explains why participants were suggested, contact gaps, rollout order, question-hint seeds, and why targeting is planning | Generation and participant/session creation remain internal | Must not send invitations, create sessions autonomously, or treat targeting as workflow truth | High |
| Participant Evidence / Pass 5 | `pass5_participant_session_prompt_family`; `admin_assistant_prompt`; extraction, clarification, answer recheck, admin-added question prompts | Evidence extraction, clarification formulation, answer recheck, boundary/dispute/next-action helpers, handoff candidate support | Yes, partly through Pass 5 `admin_assistant_prompt` | Yes: `runAdminAssistantQuestion`, `/api/participant-sessions/assistant`, participant session panel | Yes: `buildAdminAssistantContextBundle` | Optional first-pass extraction/text provider; deterministic fallback when absent | Builds context; writes provider job; returns answer/recommendations; handoff route can write after admin action | Workspace-safe view-model, disclosure rules for raw evidence, dock wrapper, session/case scoping | Read-only availability/status card and deep link to existing assistant | Participant Evidence Copilot integrated into shared dock after view-model APIs; scoped to session/case and explicit raw evidence policy | Runtime and raw context remain governed until wrapper exists | Raw participant disclosure, transcript trust, evidence approval, participant messaging, and handoff writes must stay controlled | Highest |
| Analysis & Package / Pass 6 | Pass 6 capability specs: `synthesis`, `difference_interpretation`, `evaluation`, `initial_package_drafting`, `admin_explanation`, `pre_package_inquiry_generation`, `optional_draft_document_generation`, `visual_narrative_support`, `pass6_analysis_copilot` | Synthesis, differences, methodology/lenses, readiness, Pre-6C gate, package/brief support, visual narrative support | Yes: `pass6_analysis_copilot` | Yes: `runPass6Copilot`, `/api/pass6/copilot`, `/pass6/copilot` | Yes: `buildPass6CopilotContextBundle` | Prompt text provider through provider registry | Persists context bundle and interaction; routed recommendations only; no workflow records changed by answer | Workspace-safe case view-model, dock wrapper, route/action chip mapping | Read-only summary/link to Pass 6 Copilot and Prompt Workspace | Analysis / Package Copilot in shared dock, scoped to case and Pass 6 records, with no package/readiness authority | Runtime remains governed until workspace wrapper exists | No readiness override, package approval, package eligibility changes, Pass 7 mechanics, or Final Package/release behavior | Highest |
| Prompt Studio / PromptOps | General prompt registry; Pass 3/4/6 prompt workspaces; Pass 5 prompt family; active/draft/previous/archive behavior; provider test harnesses | Prompt lifecycle, compiled previews, prompt tests, active-vs-draft comparisons, provider execution tests | No; planned `PromptStudioCopilotPromptSpec` | No; planned | No stage copilot bundle; prompt specs/test records exist | Provider only for prompt tests | Prompt spec/test records can be written by PromptOps pages; tests create inspection records | Prompt inventory view-model, capability-vs-copilot taxonomy, prompt lifecycle explanations | Static PromptOps links/status only | Prompt Studio Copilot that explains what each prompt controls, what prompt changes cannot control, active/draft behavior, and safe test/activation | Editing/promotion/archive/tests remain advanced/internal | Avoid confusing Capability PromptSpecs with Stage Copilot PromptSpecs; no provider tests from workspace | Medium-high |
| Advanced / Debug | Provider diagnostics, provider jobs, proof scripts, debug routes, store/persistence records | Provider status helpers, provider job inspection, proof/debug context, route meaning | No; optional planned `AdvancedDebugCopilotPromptSpec` | No; optional planned | No; planned debug context bundle only if needed | Provider availability only unless advanced route executes | Read-only diagnostics plus advanced routes that may trigger jobs elsewhere | Debug context bundle, strict operator-only access model, no action execution | Static provider/debug links only | Advanced / Debug Explanation Copilot for operators explaining route meaning, provider jobs, proof files, and where to inspect details | Yes | Must not expose secrets, raw unsafe data, or execute unsafe routes/actions | Medium |
| Future Finalization / Pass 7 | Review issue schema/types; Pass 7 candidate seam from Pass 6; no client copilot prompt found | Pass 7 review candidate seam records from unresolved/review-worthy Pass 6 outputs | No; future-only and not for client copilot yet | No; future-only | No finalization copilot bundle; candidate records exist | None for candidate seam status updates | Candidate seam records can be created/updated; no Pass 7 discussion mechanics | Pass 7 scope decision, issue discussion model, finalization boundary, client-safe data rules | Read-only "future review candidates" count/link only | No workspace/client Copilot until separately scoped; later admin-only Finalization Copilot may explain candidates without release authority | Yes | No Pass 7 client copilot, issue mechanics, final package, final decision, or release behavior | Low until Pass 7 is scoped |

## C. Stage-Specific Desired Copilot Behavior

### Setup / Case Copilot

May discuss:

- What case setup information exists.
- Which setup records or stage prerequisites appear missing once view-model APIs exist.
- Where to go for case setup, source intake, or configuration.

Must not decide:

- Case readiness, package eligibility, workflow truth, or participant targeting.

### Sources / Context Copilot

May discuss:

- Source status and ingestion state.
- Source role and scope suggestions.
- Extraction, transcription, OCR, embedding, and provider job status as explanation only.
- Document signal vs workflow truth.
- Missing source implications.
- Why a provider failure blocks only that helper path, not the whole workspace.

Must not decide:

- Final evidence truth, hierarchy truth, targeting eligibility, participant questions, or package readiness.

### Hierarchy Copilot

May discuss:

- Hierarchy draft reasoning.
- Role/interface signals.
- Uncertain reporting lines.
- Source-to-role/source-to-hierarchy evidence candidates.
- Why hierarchy approval is structural only.
- Which existing admin surface owns correction or approval.

Must not decide:

- Approve structure, convert source candidates to truth, change reporting lines, or run Pass 4 targeting.

### Targeting Copilot

May discuss:

- Why participants were suggested.
- Contact and channel gaps.
- Rollout order logic.
- Source-signal interpretation.
- Question-hint seeds and why they are seeds, not sent questions.
- Why targeting is planning and not workflow truth.

Must not decide:

- Send invitations, create participant sessions, approve rollout, mark readiness, or start participant contact.

### Participant Evidence Copilot

May discuss:

- What happened in a participant session.
- Transcript trust and raw evidence status.
- First-pass extraction outputs.
- Clarification candidates and answer rechecks.
- Boundary signals, disputes, defects, unmapped content, and next safe admin action.
- Pass 6 handoff candidates as non-final review inputs.

Must not decide:

- Transcript approval, evidence approval/rejection, final workflow truth, participant messaging, Pass 6 synthesis/evaluation, package generation, or handoff candidate creation without explicit admin action.

### Analysis / Package Copilot

May discuss:

- Synthesis inputs and outputs.
- Differences and conflicts.
- Methodology/lenses used.
- Seven-condition readiness.
- Blockers vs warnings.
- Pre-6C gate and clarification/inquiry needs.
- Initial Package limits, caveats, gap closure briefs, optional draft documents, and visual validation context.

Must not decide:

- Readiness override, package eligibility change, package approval, Final Package generation, release, or Pass 7 mechanics.

### Prompt Studio Copilot

May discuss:

- The difference between Capability PromptSpecs and Stage Copilot PromptSpecs.
- What each prompt controls.
- What prompt changes cannot control.
- Active vs draft vs previous vs archived behavior.
- Safe testing, provider failure visibility, and activation workflow.
- Why prompt tests are inspection records and not workflow records.

Must not decide:

- Promote/archive prompts, run provider tests, change active prompt behavior, change data models, or execute production AI work.

### Advanced / Debug Copilot

May discuss:

- Raw route meaning.
- Provider job status.
- Provider availability and failure categories.
- Proof/debug context.
- Where to inspect details.
- Which surface owns a given operation.

Must not do:

- Expose secrets, execute providers, trigger routes, mutate records, or reveal raw participant data outside allowed admin surfaces.

### Future Finalization / Pass 7 Copilot

May discuss later, if separately scoped:

- Candidate review issues.
- Why an item is only a candidate.
- Which admin review path might own the decision.

Must not exist yet as:

- A client copilot, final package assistant, issue-discussion engine, release assistant, or final decision authority.

## D. Required Context Bundles Per Stage

| Future context bundle | Likely source records | Summaries needed | Should exclude | Read-only assumptions | Needs view-model APIs first |
| --- | --- | --- | --- | --- | --- |
| `SetupCaseCopilotContextBundle` | Case records, workspace stage metadata, setup/config references | Setup completeness summary, missing setup references, navigation targets | Raw provider outputs, participant raw evidence, package readiness decisions | Read-only explanation only | Yes: case setup summary view-model |
| `SourcesCopilotContextBundle` | Intake sources, intake batches, provider jobs, text artifacts, AI intake suggestions, structured context records, final pre-hierarchy review | Source counts, extraction status, role/scope suggestions, provider failures, missing source categories, document-signal caveats | Raw files/content unless explicitly allowed; provider secrets; hierarchy/targeting truth | Read-only; no provider execution | Yes: source/status redaction view-model |
| `HierarchyCopilotContextBundle` | Hierarchy intake, hierarchy drafts, source hierarchy triage jobs/suggestions, admin decisions, prompt spec refs | Current structural state, draft status, uncertain roles/reporting lines, source candidate links, approval boundary | Raw source content by default; targeting recommendations; participant evidence | Read-only; no approval or correction writes | Yes: hierarchy summary and triage summary view-model |
| `TargetingCopilotContextBundle` | Targeting rollout plans, recommendation packets, source-signal summaries, question-hint seeds, participant/contact/channel readiness records if present | Why suggested, rollout order, contact gaps, question seeds, planning-only caveat | Raw participant session evidence, message sending controls, final workflow truth | Read-only; no invitations/session creation | Yes: targeting plan summary view-model |
| `EvidenceCopilotContextBundle` | Participant sessions, raw evidence metadata/snippets when allowed, extraction outputs, clarification candidates, answer rechecks, boundary signals, evidence disputes, next actions, handoff candidates | Session status, trust status, extraction summary, unresolved items, safe next actions, disclosure notes | Raw evidence outside allowed admin scope; tokens/secrets; Pass 6 truth/package outputs | Read-only by default; routed actions require admin confirmation | Yes: evidence disclosure and scope view-model |
| `AnalysisPackageCopilotContextBundle` | Synthesis input bundles, workflow units/claims, method usages, differences, assembled drafts, readiness results, Pre-6C gates, clarification needs, inquiry packets, packages/briefs, draft docs, visual records, config profiles | 6A/6B/6C status, blockers/warnings, method rationale, readiness caveats, package limits, visual validation | Raw participant evidence unless linked through allowed summaries; Pass 7 mechanics; final release data | Read-only; recommendations only | Yes: case-level Pass 6 summary view-model |
| `PromptStudioCopilotContextBundle` | Prompt registry, structured prompt specs, capability keys, status/lifecycle records, test cases, execution results, provider availability summaries | Capability-vs-copilot prompt map, active/draft state, test outcomes, failure explanations, safe editing boundaries | Prompt secrets, provider credentials, raw production data beyond test fixtures | Read-only explanation; no prompt promotion/test execution | Yes: prompt inventory/status view-model |
| `AdvancedDebugCopilotContextBundle` | Provider jobs, provider diagnostics, proof script references, route registry/docs, selected debug records | Where to inspect, job status/failure class, proof meaning, route ownership | Secrets, unsafe raw data, write tokens, unredacted participant evidence | Read-only operator explanation | Yes: operator-only debug view-model and access policy |
| `Pass7FinalizationCopilotContextBundle` | Future review issues, candidate records, issue briefs, allowed admin-only discussion summaries | Candidate status, why future review is needed, decision path | Client-facing final content, raw participant data, release/package write controls | Future-only, admin-only, read-only at first | Yes: not until Pass 7 is separately scoped |

## E. Recommended Integration Roadmap

1. **Static stage-help drawer using the Stage Copilot Family taxonomy**
   - Use static text and route/stage metadata only.
   - Explain each stage's future Copilot role and hard boundaries.
   - No provider calls, no context bundle, no source data reads beyond existing static shell props.

2. **View-model-backed context cards per workspace stage**
   - Add read-only cards for source status, hierarchy triage, targeting recommendations, evidence status, Pass 6 readiness/package status, PromptOps status, and Pass 7 candidates.
   - Each card must come from a governed view-model API before live data is shown in workspace.

3. **Shared Copilot dock shell with no live provider execution**
   - Build the shared dock as a host only.
   - It should load a stage profile and static/context-card summaries, but it should not ask a provider yet.
   - It should show safe links/navigation chips to existing governed surfaces.

4. **Integrate existing Pass 5 Admin Assistant read-only capability**
   - First live candidate because Pass 5 already has runtime, context bundle, prompt family, fallback, provider job path, and routed recommendations.
   - Workspace integration must use explicit session/case scoping and raw evidence disclosure rules.

5. **Integrate existing Pass 6 Analysis Copilot read-only capability**
   - Second live candidate because Pass 6 already has `pass6_analysis_copilot`, context bundle, runtime, persisted interactions, and boundaries.
   - Workspace integration should remain read-only and case-scoped.

6. **Add dedicated Stage Copilot PromptSpecs for Sources, Hierarchy, Targeting, Prompt Studio, and Advanced**
   - Do not reuse Capability PromptSpecs as conversational Copilot specs.
   - Each spec should define explanation scope, readable context, prohibited decisions, allowed recommendation types, link chips, and advanced/internal exclusions.

7. **Add stage-specific context bundles**
   - Implement one bounded context bundle per Stage Copilot.
   - Use redacted summaries and view-model APIs before provider runtime.

8. **Only then consider provider-backed conversational runtime per stage**
   - Add runtimes stage-by-stage.
   - Each runtime must use a governed route, persisted provider/job/interactions where appropriate, explicit read-only boundaries, and no autonomous writes.

## F. Hard Boundaries

- No autonomous writes.
- No approval gates.
- No transcript approval.
- No evidence approval or rejection.
- No package generation.
- No provider execution directly from workspace UI without governed route.
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
- No confusion between Capability PromptSpecs and Stage Copilot PromptSpecs.
- No generic all-product chatbot that can mix stage contexts without explicit stage profile and context boundaries.

## G. Open Questions

| Question | Why it matters | Suggested answer/options | Criticality 1-5 | Blocks next implementation? |
| --- | --- | --- | --- | --- |
| Should the first workspace Copilot step be static stage-help drawer or view-model-backed context cards? | A static drawer is safer and faster; context cards require APIs and data disclosure rules. | Suggested answer: static stage-help drawer first, then view-model cards. | 5 | No for static drawer; yes for live data |
| Should Stage Copilot PromptSpecs be created before or after the shared dock shell? | PromptSpecs clarify behavior, but the dock shell can start as a non-provider host. | Suggested answer: create static taxonomy/dock first, then add Stage Copilot PromptSpecs before any provider-backed runtime. | 4 | No for shell; yes for live copilot |
| Should Pass 2-4 Stage Copilots be read-only explanation-only first? | They have helpers/recommendations but no copilot runtime; jumping to action-capable runtime is risky. | Suggested answer: yes, explanation-only first with links to governed source/hierarchy/targeting pages. | 5 | Yes for Pass 2-4 live assistants |
| How should Prompt Studio expose Capability PromptSpecs vs Copilot PromptSpecs without confusing admins? | Admins must know whether a prompt controls AI work or conversational support. | Suggested answer: separate tabs/labels: "Capability prompts" and "Stage Copilot prompts"; include explicit "does not control" notes. | 5 | Yes for Prompt Studio Copilot |
| Which existing Pass 5/6 assistant endpoints are safe to surface first? | Existing endpoints already run provider paths and may expose raw context. | Suggested answer: surface links/status first; direct calls only through scoped view-model wrappers. Pass 5 current-session assistant and Pass 6 case copilot are first candidates. | 5 | Yes for live integration |
| What data must never be exposed through workspace Copilot answers? | Prevents cross-stage disclosure and accidental raw evidence leaks. | Suggested answer: secrets, provider credentials, raw participant data outside allowed admin scope, access tokens/hashes, unredacted files, private channel identifiers, final client/release content before approval. | 5 | Yes |
| Should `/workspace` ever execute assistant/provider calls directly, or only through governed stage routes? | Direct execution bypasses the stage-specific runtime boundary model. | Suggested answer: only through governed stage routes or wrappers that preserve route ownership and logging. | 5 | Yes for live runtime |
| How should routed action recommendations appear in the shared dock? | Recommendations can be mistaken for executable actions. | Suggested answer: render as read-only chips with destination links and "requires admin confirmation"; no execution buttons at first. | 4 | No for static; yes for action UI |
| Can raw participant evidence snippets appear in the shared dock? | Pass 5 assistant may include snippets, but workspace is broader than session detail. | Suggested answer: default no; show metadata and deep link to participant session detail unless an explicit allowed admin scope is active. | 5 | Yes for Pass 5 dock |
| How should Pass 7 be represented before implementation? | Candidate seam exists, but full review/finalization mechanics do not. | Suggested answer: show only "future review candidates"; no chat/finalization/client copilot wording. | 5 | No |
| Should Advanced / Debug get a Copilot at all? | Debug helpers can expose unsafe routes or provider internals. | Suggested answer: optional operator-only explanation copilot after access policy and redaction rules exist. | 3 | No |
| How should Arabic/RTL stage Copilot behavior be handled? | Workspace visual stability is accepted; a dock could reintroduce pressure. | Suggested answer: use the same shared dock shell with stage profile labels localized; avoid wide panels until responsive audits pass. | 3 | No |

## Repository Evidence Map

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

## Classification Summary

- Implemented Stage Copilot runtime today: Pass 5 Participant Evidence Copilot behavior; Pass 6 Analysis / Package Copilot behavior.
- Implemented Capability PromptSpecs/helpers that should later receive Stage Copilots: Pass 2 Sources / Context, Pass 3 Hierarchy, Pass 4 Targeting, Prompt Studio / PromptOps.
- Planned Stage Copilot PromptSpecs: Setup / Case, Sources / Context, Hierarchy, Targeting, Prompt Studio, Advanced / Debug, and future Pass 7 if separately scoped.
- Safe UI-only workspace placeholder possibility: static stage-help drawer, read-only stage cards, provider status summaries, prompt workspace links, deep links to governed assistant pages.
- Unsafe/deferred behavior: direct provider execution, prompt tests, prompt promotion, source extraction, hierarchy generation, targeting generation, clarification recheck, gate approval, transcript/evidence approval, package generation, readiness override, participant messaging, Pass 7 mechanics, and generic unbounded chatbot behavior.
