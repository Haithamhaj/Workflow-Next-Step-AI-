# Prompt Studio Copilot Pilot Closure Review

## 1. Executive Summary

The Prompt Studio Copilot pilot is clean enough to accept as the first working Stage Copilot pilot.

It now includes a no-tool/no-action workspace chat UI, a scoped API route, existing GPT/OpenAI provider integration, deterministic fallback behavior, read-only Prompt Studio context, and a static WDE Stage System Knowledge Pack with operational coverage for Pass 2, Pass 3, Pass 4, Pass 5, Pass 6A, Pass 6B, and Pass 6C.

The latest live GPT stage-knowledge diagnostic is the first acceptable closure gate:

- `8/8` pass
- `0` partial
- `0` context gaps
- `0` fail
- Pass 5 Participant Evidence fixed
- no tools, actions, writes, retrieval, prompt mutation, official analysis execution, readiness mutation, package eligibility mutation, or package generation

Recommendation: **A. Accept Prompt Studio Copilot pilot as first working Stage Copilot pilot.**

No required patch is blocking closure. The next recommended step is **token optimization before scaling**, because the current stage-knowledge prompt is effective but relatively heavy.

## 2. Pilot Summary

The pilot includes:

- UI:
  - `/workspace/prompt-studio-copilot`
  - simple chat panel
  - local in-page history only
  - provider status, model, context source, and read-only context summary display
  - English/Arabic labels through workspace-scoped i18n
  - clear no-tools/no-actions/advisory-only copy

- API:
  - `POST /api/stage-copilot/prompt-studio/chat`
  - JSON only
  - Prompt Studio stage only
  - uses current/effective Stage Copilot Instructions for `prompt_studio`
  - uses static Prompt Studio context and WDE Stage System Knowledge
  - calls existing OpenAI text provider when configured
  - returns deterministic fallback when provider is unavailable or fails

- Stage Copilot Instructions:
  - read from the dedicated Stage Copilot Instructions store
  - used only as conversation guidance
  - not mutated by the chat API or UI

- Static Prompt Studio context:
  - created through `createPromptStudioCopilotContextEnvelope`
  - read-only boundary flags
  - reference-only Capability / Analysis PromptSpec refs
  - reference-only Stage Copilot Instruction refs
  - no live PromptSpec registry resolution

- WDE Stage System Knowledge Pack:
  - covers operational stage details for Pass 2, Pass 3, Pass 4, Pass 5, Pass 6A, Pass 6B, and Pass 6C
  - includes purpose, goal, inputs, outputs, operations, records/contracts, internal system capabilities, boundaries, must-not behavior, wrong interpretations, and handoffs
  - includes global analysis correctness rules and good/bad examples

- Provider-backed path:
  - uses the existing OpenAI/GPT provider registry path
  - no new provider abstraction
  - no provider tools
  - token usage passed through when provider returns usage

The pilot remains conversational only. It does not create an action-capable agent.

## 3. Quality Gate Review

The latest live GPT result is acceptable for first pilot closure.

Latest result:

- Provider status: `provider_success`
- Model: `gpt-5.4`
- Stage-knowledge score:
  - pass: `8`
  - partial: `0`
  - context_gap: `0`
  - fail: `0`

The eight diagnostic questions cover:

- Pass 2 Sources / Context
- Pass 3 Hierarchy
- Pass 4 Targeting / Rollout Planning
- Pass 5 Participant Evidence
- Pass 6A / 6B / 6C
- bad readiness/package assumption
- good/bad Pass 6 analysis
- advisory limits

The previous remaining issue, Q4 Pass 5 Participant Evidence completeness, is fixed. The provider-facing prompt now explicitly requires a Pass 5 checklist covering participant sessions, narrative-first evidence, raw evidence preservation, transcript trust gate, first-pass extraction, evidence anchors, clarification candidates, clarification question formulation, answer recording, answer recheck, boundary signals, disputes/defects/no-drop preservation, Pass 6 handoff candidates, not-final-truth, and no synthesis/evaluation/package generation.

This is a strong enough quality gate for the first pilot because it proves the Copilot can explain the stage system in operational detail without claiming authority to run the system.

## 4. Token Baseline Review

Latest live GPT token baseline across the eight diagnostic questions:

- Input tokens: `41,917`
- Output tokens: `11,978`
- Total tokens: `53,895`
- Average total per question: `6,737`

This is acceptable for pilot closure because:

- the pilot is not yet scaled to every stage
- the diagnostic deliberately asks deep stage-knowledge questions
- the prompt includes the full operational stage knowledge card set
- token usage is now measured through provider-reported usage rather than guessed

Optimization is recommended before scaling because the current prompt sends broad operational context for every question, even though the helper prioritizes focused stage cards. A future optimization pass should preserve the quality gate while reducing average input tokens through tighter stage-card selection, question-aware context inclusion, or stage-specific Copilot context packs.

The latest Pass 5 completeness patch kept growth controlled:

- prior tightened baseline total: `51,526`
- latest total: `53,895`
- increase: `2,369` tokens, about `4.6%`
- target was under `5%` if possible

## 5. Boundary Review

The pilot preserves the Stage Copilot boundary.

Verified:

- no tools
- no actions
- no routed actions
- no writes from chat
- no Stage Copilot Instructions mutation from chat
- no Capability / Analysis PromptSpec mutation
- no PromptSpec key mutation
- no `@workflow/prompts` import in the pilot path
- no prompt compilation
- no prompt tests
- no retrieval/RAG/vector search
- no conversation persistence
- no Pass 5 behavior change
- no Pass 6 behavior change
- no readiness mutation
- no package eligibility mutation
- no package generation
- no analysis logic change
- no provider framework change

The API route reads current Prompt Studio Instructions, assembles a provider prompt, calls the existing OpenAI text provider, and returns text. The route does not save records, update records, access `store.structuredPromptSpecs`, access `store.pass6PromptSpecs`, or pass provider tools.

The helper rejects provider responses that claim completed action execution through direct first-person action claims such as changed, saved, promoted, compiled, tested, executed, mutated, updated, approved, rejected, or generated.

## 6. UI Review

The UI is acceptable for pilot closure.

Route:

- `/workspace/prompt-studio-copilot`

Behavior:

- simple chat panel
- textarea input
- posts to `/api/stage-copilot/prompt-studio/chat`
- displays returned answer text
- displays provider status
- displays model
- displays context source and read-only state
- shows fallback notice when provider is unavailable or fails
- keeps history only in component state

Boundaries:

- no apply controls
- no save-from-Copilot controls
- no provider/model selector
- no prompt test/compile controls
- no action buttons
- no conversation persistence
- no calls to prompt or analysis APIs

UX risks:

- The page is intentionally minimal and works for pilot validation, but it is not yet a full production conversation surface.
- Long answers can be dense; future formatting could improve scanability.
- No conversation persistence means browser refresh loses context. This is acceptable by design for the first pilot.
- The UI does not display token usage yet. That is acceptable for pilot closure because token measurement is covered by proof, not user workflow.

## 7. API / Provider Review

The API/provider path is acceptable for first pilot closure.

Route scope:

- Prompt Studio only
- POST JSON only
- no generic all-stage Copilot route

Provider path:

- uses `providerRegistry.getPromptTextProvider("openai")`
- calls `provider.runPromptText({ compiledPrompt })`
- does not invent a new provider abstraction
- does not add new dependencies
- does not expose provider settings in UI
- does not send tool definitions

Prompt assembly:

- hard boundary: no tools, no actions, no writes, no official analysis, no readiness/package mutation
- current/effective Stage Copilot Instructions
- static Prompt Studio context summary
- WDE operational stage cards
- stage-logic answer rubric
- admin message and optional history

Fallback behavior:

- if provider is unavailable, returns deterministic fallback with `provider_not_configured`
- if provider fails, returns deterministic fallback with `provider_failed`
- fallback does not pretend to be provider output
- fallback uses static stage knowledge where applicable

Reporting:

- `providerStatus`
- `model`
- `contextSummary`
- `tokenUsage`
- `tokenUsageUnavailable`

Safety:

- provider text is checked for direct claims of completed actions
- response remains text-only
- no action execution fields are returned

## 8. Context Review

The current context is enough for the Prompt Studio pilot.

Prompt Studio static context:

- wraps references in the Stage Copilot read-only context envelope
- includes PromptSpec refs as references only
- includes Stage Copilot Instruction refs as references only
- includes warnings that Copilot Instructions do not change analysis prompts
- includes WDE stage system knowledge refs
- rejects write/provider/retrieval/DB/prompt/analysis/package authority through envelope guards

WDE Stage System Knowledge Pack:

- operational coverage is `11/11` for:
  - Pass 2 Sources / Context
  - Pass 3 Hierarchy
  - Pass 4 Targeting / Rollout Planning
  - Pass 5 Participant Evidence
  - Pass 6A SynthesisInputBundle
  - Pass 6B Synthesis / Evaluation / Readiness
  - Pass 6C Initial Package

It includes:

- analysis correctness rules
- good/bad analysis examples
- internal system capability descriptions as knowledge only
- explicit statements that knowledge of a capability does not grant execution authority

Live PromptSpec registry projection remains deferred. That is the right boundary for this pilot. Prompt Studio can discuss the two prompt systems and WDE stage logic without reading or mutating live Capability / Analysis PromptSpecs.

## 9. Remaining Risks and Technical Debt

Critical risks:

- None blocking first pilot closure.

Non-critical risks:

- Token cost is high enough to optimize before scaling to multiple Stage Copilots.
- Live LLM output can vary run to run; current proof enforces a strict 8/8 gate, but future model/provider changes could affect quality.
- The context is static; it cannot yet answer questions about live PromptSpec records, live prompt tests, or current prompt registry state.
- No conversation persistence; the UI keeps local state only.
- No retrieval by design; the Copilot cannot inspect documents, evidence, or live records.
- No action tools by design; admins may ask for actions, but the Copilot must refuse or explain boundaries.
- Token usage is shown in proofs/API response but not surfaced in the workspace UI.
- The existing Next.js module-resolution workaround for `@workflow/stage-copilot` remains technical debt from the broader Stage Copilot track.

Future runtime risks:

- Expanding beyond Prompt Studio may invite direct imports of stage packages or repositories. Future stage pilots should preserve the read-only read-model approach and avoid making Copilot routes own analysis truth.
- Sources / Context and Participant Evidence pilots will carry higher risk because they sit closer to source material, provider-backed intake, raw evidence, transcripts, and evidence trust decisions.

## 10. Acceptance Recommendation

Recommendation: **A. Accept Prompt Studio Copilot pilot as first working Stage Copilot pilot.**

Required patches before acceptance: none.

Acceptance basis:

- UI exists and is scoped.
- API exists and is scoped.
- Existing GPT/OpenAI provider path works.
- Deterministic fallback exists.
- Static context is read-only.
- WDE Stage System Knowledge Pack covers Pass 2 through Pass 6C.
- Live GPT diagnostic is `8/8` pass.
- Token usage is measured.
- No tools/actions/writes/retrieval/prompt mutation/analysis execution were added.

## 11. Next-Step Options

### Option A - Token optimization before scaling

- Value: reduces cost and latency before cloning the pattern into additional Stage Copilots.
- Risk: low if treated as provider-facing prompt/context shaping only.
- Why now: the pilot is accepted but the prompt is broad; scaling this unchanged to more stages would compound cost.
- Why later: if immediate product value requires a second pilot, optimization can wait, but it should not be deferred indefinitely.

### Option B - Start Sources / Context Copilot pilot

- Value: likely high because Sources / Context is an early operator workflow and can help explain intake/source boundaries.
- Risk: medium because sources context touches crawl, OCR, STT, extraction, source status, and provider jobs.
- Why now: it is a natural next stage pilot after Prompt Studio.
- Why later: read-only source context must be carefully scoped so the Copilot does not become an intake/extraction runner.

### Option C - Add live Prompt Studio read-only registry projection

- Value: lets Prompt Studio Copilot discuss live prompt inventory, prompt tests, and PromptSpec references.
- Risk: medium because it is close to the Capability / Analysis PromptSpec system and could confuse read-only projection with prompt management.
- Why now: improves Prompt Studio usefulness.
- Why later: acceptance of the first pilot does not require live prompt registry access, and separation risk should be handled with a dedicated plan.

### Option D - Add conversation persistence

- Value: improves operator continuity and reviewability.
- Risk: medium because it introduces storage, retention, actor metadata, and potentially sensitive content handling.
- Why now: useful for real admin usage.
- Why later: not needed to validate no-tool Stage Copilot behavior, and persistence should be designed deliberately.

### Option E - Pause and archive pilot

- Value: preserves a clean accepted baseline before more Stage Copilot work.
- Risk: low.
- Why now: useful if the team wants a formal handoff before expanding.
- Why later: more work is already unblocked, but archive documentation should still be updated.

## 12. Recommended Next Step

Recommended next step: **Option A - Token optimization before scaling.**

The pilot is accepted, but the current baseline of `53,895` total tokens across eight diagnostic questions is expensive enough that scaling should not copy the prompt unchanged. The next slice should be a no-behavior-change provider-context optimization pass that preserves the strict `8/8` live quality gate while reducing input tokens.

After token optimization, the next best product pilot is likely **Sources / Context Copilot**, but it should begin with a no-code/read-only planning slice because that stage is closer to provider-backed source processing and source-of-truth risks.

## 13. Handoff Update Recommendations

If accepted, update:

- `handoff/CURRENT_STATE.md`
  - Record Prompt Studio Copilot pilot accepted as first working Stage Copilot pilot.
  - Record final accepted commit.
  - Record latest token baseline.
  - Record live GPT diagnostic `8/8` pass.
  - Record no tools/actions/writes/retrieval/prompt mutation/analysis execution.

- `handoff/NEXT_PASS.md`
  - Set next recommended work to Prompt Studio Copilot token optimization before scaling.
  - Note Sources / Context Copilot as the likely next stage pilot after optimization.

- `handoff/DECISIONS_LOG.md`
  - Record that Stage Copilot remains no-tool/no-action/no-write.
  - Record that Prompt Studio Copilot uses static WDE Stage System Knowledge for this pilot.
  - Record that live PromptSpec registry projection remains deferred.
  - Record latest token baseline and quality gate.

- Optional archive file:
  - `handoff/PROMPT_STUDIO_COPILOT_ACCEPTED_PILOT_ARCHIVE.md`
  - Include scope, files/areas, proofs, token baseline, boundaries, and recommended next work.

Do not update those files as part of this closure review task.

## 14. Final Judgment

Accept the Prompt Studio Copilot pilot as the first working Stage Copilot pilot.

The pilot proves the intended Stage Copilot runtime model:

- stage-specific instructions
- read-only stage system knowledge
- read-only stage context
- admin/user message
- model text response

It also proves what the model is not:

- not an action-capable agent
- not a tool runner
- not a writer
- not a prompt mutator
- not an official analysis executor
- not a readiness/package eligibility authority

The next work should optimize provider-facing context/token usage before expanding this pattern to additional stages.
