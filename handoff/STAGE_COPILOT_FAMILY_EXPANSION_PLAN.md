# Stage Copilot Family Expansion Plan

## 1. Executive Summary

Prompt Studio Copilot is accepted as the first working Stage Copilot pilot. The next step is to expand the pattern into a complete Stage Copilot family while preserving the core product rule: each Copilot is a scoped conversational assistant, not an action-capable agent.

Recommended expansion approach:

- Keep the Prompt Studio pattern: Stage Copilot Instructions + read-only context envelope + stage knowledge + GPT/OpenAI text response + deterministic fallback + no-tool/no-action proofs.
- Build one stage at a time.
- Keep each stage route scoped and explicit before introducing any generic all-stage abstraction.
- Treat the long-term UI as a **Workspace Stage Copilot Widget** that can be opened anywhere in `/workspace`, auto-detects the current stage, and allows manual stage override.
- Keep existing and future stage-specific Copilot pages as development/proof surfaces, not as the only way users can talk to a Copilot.
- Use stage-specific static context and small read-only fixture/read-model summaries before RAG.
- Do not let `packages/stage-copilot` directly own official analysis truth or import mutating stage execution paths.
- Design every stage registration so Pass 7, Pass 8, Pass 9, and later stages can be added by extending stage metadata, system knowledge, context assembly, routes, proofs, and UI labels without changing the no-tool/no-action product model.

Recommended next Copilot: **Pass 2 Sources / Context Copilot**.

This confirms the operator assumption. Sources / Context is the best next pilot because it is early in the workflow, valuable to admins, and lower risk than Participant Evidence or Analysis / Package if it starts with static stage knowledge plus narrow read-only source/context summaries. It still needs careful boundaries because `packages/sources-context` includes provider-backed and mutating intake functions.

Recommended first implementation slice: **Sources / Context Copilot API-only route with static/read-only context fixture and proof**. After the second stage is proven, add the **Workspace Stage Copilot Widget foundation** so users can talk to the same Copilot system from anywhere without navigating to a dedicated Copilot page.

## 2. Current Prompt Studio Copilot Pattern

The current accepted pattern consists of these pieces:

- Stage Copilot Instructions:
  - editable through `/workspace/copilot-instructions`
  - read by the chat route through `store.stageCopilotSystemPrompts`
  - conversation guidance only
  - separate from Capability / Analysis PromptSpecs

- Context envelope:
  - `packages/stage-copilot/src/context-envelope.ts`
  - enforces read-only boundary flags
  - rejects provider execution, retrieval execution, DB execution, prompt compilation, prompt mutation, official analysis rerun, package eligibility mutation, source-of-truth mutation, and executable content
  - returns summary counts for context refs, prompt refs, warnings, blockers, and audit refs

- Prompt Studio context:
  - `packages/stage-copilot/src/prompt-studio-context.ts`
  - static fixture only
  - Capability / Analysis PromptSpecs represented as references only
  - Stage Copilot Instructions represented as references only
  - WDE stage knowledge represented as system knowledge refs
  - no live PromptSpec registry lookup

- Chat helper:
  - `packages/stage-copilot/src/prompt-studio-chat.ts`
  - validates input
  - builds the provider-facing prompt
  - includes hard no-tool/no-action/no-write boundaries
  - includes current/effective Stage Copilot Instructions
  - includes WDE operational stage cards
  - passes through provider token usage
  - rejects provider output claiming completed action execution
  - provides deterministic fallback

- API route:
  - `apps/admin-web/app/api/stage-copilot/prompt-studio/chat/route.ts`
  - POST JSON only
  - Prompt Studio stage only
  - reads current Prompt Studio Instructions
  - calls existing OpenAI text provider through `providerRegistry.getPromptTextProvider("openai")`
  - returns text-only JSON
  - does not write records or access PromptSpec repositories

- UI:
  - `apps/admin-web/app/workspace/prompt-studio-copilot/page.tsx`
  - simple chat panel
  - local component history only
  - provider status/model/context source display
  - no provider/model selector
  - no apply/save/action buttons

- Proof stack:
  - static context proof
  - chat pilot proof
  - UI proof
  - stage-knowledge/token proof
  - live GPT stage-knowledge proof
  - existing Stage Copilot Instructions, repository, API, and workspace proofs

The reusable safety boundary is strong: the model may explain, discuss, compare, critique, and advise, but it cannot execute any system capability.

## 3. Target Stage Copilot Family

### 1. Pass 2 - Sources / Context Copilot

- Stage purpose: help admins understand intake sources, context framing, source roles/scopes, source status/trust, extraction/crawl/STT boundaries, and pre-hierarchy readiness.
- Stage-specific knowledge required:
  - source registration
  - source type/status/trust
  - document/image/audio/manual/website handling
  - OCR/STT/crawl/provider job concepts as internal system capabilities
  - source-role/source-scope suggestions
  - structured context
  - department framing
  - final pre-hierarchy review
  - source claims as signals, not workflow truth
- Stage-specific context required:
  - intake session refs
  - registered source summaries
  - extraction/text artifact refs
  - crawl/session/page refs where present
  - audio transcript review refs where present
  - department framing summary
  - structured context summary
  - final pre-hierarchy review status
- Can discuss:
  - what sources exist and what they can/cannot prove
  - source-role/scope reasoning
  - missing source coverage
  - context risks before hierarchy
  - why extraction/crawl/STT output is not operational truth
- Must not do:
  - register/update sources
  - approve crawls
  - run OCR/STT/crawl/extraction/provider jobs
  - create structured context
  - confirm final pre-hierarchy review
  - start hierarchy, targeting, sessions, synthesis, or packages
- Likely API route: `/api/stage-copilot/sources-context/chat`
- Likely UI placement: `/workspace/sources-copilot` or a shared `/workspace/stage-copilot?stage=sources_context` page, with a nav/link from Sources workspace.
- Proof difficulty: medium.
- Risk level: medium-low if static/read-only first; medium if live source summaries are added.

### 2. Pass 3 - Hierarchy Copilot

- Stage purpose: help admins reason about hierarchy intake, draft/correction/approval, source-to-hierarchy triage, and structural readiness.
- Stage-specific knowledge required:
  - hierarchy intake
  - hierarchy draft
  - node/relationship modeling
  - source-to-hierarchy triage
  - admin corrections
  - approved hierarchy snapshot
  - structural approval versus workflow truth
- Stage-specific context required:
  - hierarchy intake refs
  - draft/node/relationship summaries
  - correction event refs
  - approved snapshot summary
  - source-to-hierarchy triage refs
  - readiness snapshot
- Can discuss:
  - structure, reporting lines, candidate role scopes
  - inferred versus confirmed hierarchy
  - why approval is structural only
  - readiness toward targeting
- Must not do:
  - create/modify hierarchy intakes or drafts
  - run hierarchy draft generation
  - run source-to-hierarchy triage
  - approve structural hierarchy
  - select participants
  - claim workflow truth
- Likely API route: `/api/stage-copilot/hierarchy/chat`
- Likely UI placement: `/workspace/hierarchy-copilot` or shared stage selector page.
- Proof difficulty: medium.
- Risk level: medium because hierarchy package helpers include mutating approval and draft functions.

### 3. Pass 4 - Targeting / Rollout Planning Copilot

- Stage purpose: help admins reason about participant candidates, targeting packets, contact readiness, rollout planning, and question-hint seeds.
- Stage-specific knowledge required:
  - approved hierarchy consumption
  - participant candidates
  - targeting recommendation packet
  - contact/channel readiness
  - rollout order
  - question-hint seeds
  - targeting signals versus workflow evidence
- Stage-specific context required:
  - targeting rollout plan summary
  - candidate summaries
  - contact readiness summaries
  - rollout state/order
  - question-hint seed refs
  - approved hierarchy basis refs
- Can discuss:
  - why a role/candidate may be useful
  - coverage gaps in participant selection
  - contact readiness risks
  - how source signals inform targeting without becoming evidence
- Must not do:
  - create/load targeting plans through write-capable helpers
  - update candidate decisions
  - update contact profiles
  - send outreach
  - create participant sessions
  - treat targeting signals as evidence
- Likely API route: `/api/stage-copilot/targeting/chat`
- Likely UI placement: `/workspace/targeting-copilot` or shared stage selector page.
- Proof difficulty: medium.
- Risk level: medium because `createOrLoadTargetingRolloutPlan` writes when missing and must not be used in read-only context assembly.

### 4. Pass 5 - Participant Evidence Copilot

- Stage purpose: help admins understand participant evidence, raw evidence preservation, transcript trust, extraction, clarification, answer recheck, disputes, boundary signals, and Pass 6 handoff candidates.
- Stage-specific knowledge required:
  - narrative-first evidence
  - participant sessions
  - raw evidence preservation
  - transcript trust gate
  - first-pass extraction
  - evidence anchors
  - clarification candidates/questions/answers
  - answer recheck
  - boundary signals
  - disputes/defects/no-drop
  - participant-level evidence is not final workflow truth
- Stage-specific context required:
  - participant session refs
  - raw evidence summaries
  - transcript trust summaries
  - first-pass extraction summaries
  - evidence anchor refs
  - clarification candidate/answer summaries
  - disputes/boundary/no-drop refs
  - Pass 6 handoff candidate summaries
- Can discuss:
  - where evidence is strong or weak
  - what clarification may be needed
  - why a participant narrative is not final truth
  - how no-drop/dispute material should stay visible
- Must not do:
  - create sessions
  - approve transcripts
  - approve/reject evidence
  - run extraction
  - formulate/send clarification questions as system actions
  - record answers
  - run answer recheck
  - generate Pass 6 handoff records
  - synthesize/evaluate/package
- Likely API route: `/api/stage-copilot/participant-evidence/chat`
- Likely UI placement: `/workspace/evidence-copilot` or shared stage selector page.
- Proof difficulty: high.
- Risk level: high because this stage touches evidence trust, raw evidence, transcripts, and official evidence boundaries.

### 5. Pass 6 - Analysis / Package Copilot

- Stage purpose: help admins understand 6A preparation, 6B synthesis/evaluation/readiness, and 6C Initial Package governance.
- Stage-specific knowledge required:
  - 6A SynthesisInputBundle preparation
  - evidence eligibility versus seven-condition evaluation
  - 6B workflow units/claims, difference interpretation, layer-aware analysis, readiness, blockers, warnings
  - workflow documentability versus automation-supportiveness
  - 6C Initial Package/gap brief boundaries
  - Initial Package versus Final Package
- Stage-specific context required:
  - SynthesisInputBundle refs/summaries
  - workflow claim/unit summaries
  - difference interpretation summaries
  - evaluation/readiness summaries
  - blocker/warning/gap summaries
  - pre-6C gate summaries
  - package/gap brief refs where present
- Can discuss:
  - why a case is or is not documentable
  - what evidence supports readiness
  - gaps, caveats, contradictions, and warning logic
  - 6A/6B/6C boundary questions
- Must not do:
  - prepare bundles
  - run synthesis
  - run evaluation
  - change readiness
  - change package eligibility
  - generate packages
  - create visuals
  - start Pass 7 actions
- Likely API route: `/api/stage-copilot/analysis-package/chat`
- Likely UI placement: `/workspace/analysis-copilot` or shared stage selector page.
- Proof difficulty: high.
- Risk level: high because Pass 6 owns official analysis, readiness, and package eligibility.

### 6. Prompt Studio Copilot

- Stage purpose: accepted pilot for discussing prompt-system separation, Stage Copilot Instructions, WDE stage logic, and prompt-edit risk.
- Stage-specific knowledge required: already implemented.
- Stage-specific context required: static Prompt Studio context and WDE Stage System Knowledge Pack.
- Can discuss:
  - two prompt systems
  - Capability / Analysis PromptSpecs versus Stage Copilot Instructions
  - WDE Pass 2-6 stage boundaries
  - bad analysis assumptions
- Must not do:
  - mutate prompts
  - compile prompts
  - run prompt tests
  - promote prompts
  - alter official analysis behavior
- API route: `/api/stage-copilot/prompt-studio/chat`
- UI placement: `/workspace/prompt-studio-copilot`
- Proof difficulty: accepted baseline.
- Risk level: low-to-medium, mostly token cost and live PromptSpec projection risk.

### 7. Advanced / Debug Copilot

- Stage purpose: later diagnostic assistant for proofs, provider jobs, route ownership, build/config status, and operational diagnostics.
- Stage-specific knowledge required:
  - proof stack taxonomy
  - provider job states
  - route/store ownership
  - build/module-resolution notes
  - debug output is not business-authoritative
- Stage-specific context required:
  - proof summaries
  - provider job refs
  - route/build config refs
  - diagnostic summaries
- Can discuss:
  - why a proof failed
  - which layer owns a route/repository
  - safe next debugging step
- Must not do:
  - run provider jobs
  - mutate config
  - change analysis records
  - perform shell/build actions from chat
  - declare business state from debug output
- Likely API route: `/api/stage-copilot/advanced-debug/chat`
- Likely UI placement: `/workspace/advanced-copilot`
- Proof difficulty: medium.
- Risk level: medium due to temptation to add tools/actions.

### Future Pass 7 / Pass 8 / Pass 9 Copilots

The family model must remain open for later workflow stages that are not fully scoped in this plan.

Future stages should be added by extending the same stage registration pattern:

- stage key
- Stage Copilot Instructions default
- operational stage knowledge card
- read-only context envelope fixture/read model
- stage-specific chat helper or shared helper configuration
- stage API route
- UI label and widget selector entry
- proof questions and expected concepts
- token baseline
- no-tool/no-action/no-write boundary checks

Pass 7, Pass 8, Pass 9, and later stages must not require a new Copilot architecture. They should become additional members of the same Stage Copilot family.

Until those stages are formally defined, the family should reserve extension points without guessing their behavior. A future stage Copilot may know and discuss the internal system capabilities used by that stage, but knowledge of a capability must never grant execution authority.

## 4. Shared vs Stage-Specific Components

Shared components should include:

- common chat response shape:
  - `ok`
  - `stageKey`
  - `answer`
  - `model`
  - `providerStatus`
  - `contextSummary`
  - `tokenUsage`
  - `tokenUsageUnavailable`

- provider invocation helper, if introduced later:
  - should wrap existing `providerRegistry.getPromptTextProvider("openai")`
  - must not introduce provider tools or a new provider abstraction
  - should handle provider failure/fallback consistently

- hard safety text:
  - no tools
  - no actions
  - no routed actions
  - no writes
  - no official analysis
  - no prompt mutation
  - no readiness/package eligibility mutation
  - no package generation
  - text-only response

- context envelope guard usage:
  - `createStageCopilotContextEnvelope`
  - `assertStageCopilotContextEnvelopeReadOnly`
  - `isStageCopilotContextEnvelopeSafe`
  - `summarizeStageCopilotContextEnvelope`

- provider status handling:
  - `provider_success`
  - `provider_not_configured`
  - `provider_failed`
  - `deterministic_fallback`

- deterministic fallback behavior:
  - explicit fallback label
  - no pretending to be provider output
  - stage-specific static answer where possible

- token usage reporting:
  - pass through real provider usage only
  - never estimate
  - report unavailable when missing

Stage-specific pieces must remain separate:

- stage instructions from Stage Copilot Instructions store
- stage system knowledge cards
- stage-specific context fixture or read model
- stage API route
- stage UI label/copy
- stage proof questions and expected concepts
- stage-specific refusal/guardrail examples
- stage-specific token baselines

Do not prematurely collapse all stages into one generic helper if that weakens the ability to prove boundaries stage by stage.

## 5. Recommended Build Order

### Candidate: Sources / Context Copilot

- Product value: high. Helps admins reason about the earliest workflow layer and source/context readiness.
- Risk: medium-low with static context first, medium with live source summaries.
- Context complexity: moderate.
- Chance of touching analysis behavior: low if no provider jobs/extraction/crawl actions are invoked.
- Token cost expectation: lower than Prompt Studio if the prompt includes only Pass 2 card and source/context boundary rules.
- Proof requirements:
  - Pass 2 knowledge questions
  - source claim versus workflow truth questions
  - no hierarchy/targeting/synthesis/package claims
  - no provider/crawl/OCR/STT execution

Recommendation: build next.

### Candidate: Hierarchy Copilot

- Product value: medium-high.
- Risk: medium.
- Context complexity: moderate.
- Chance of touching analysis behavior: low-to-medium, but hierarchy package has mutating draft/approval helpers.
- Token cost expectation: low-to-moderate.
- Proof requirements:
  - hierarchy approval is structural, not workflow truth
  - source-to-hierarchy triage as candidate/signal
  - no targeting/session/synthesis/package behavior

Recommendation: second or third.

### Candidate: Targeting Copilot

- Product value: medium-high.
- Risk: medium.
- Context complexity: moderate.
- Chance of touching analysis behavior: medium because targeting can easily be confused with participant evidence or outreach.
- Token cost expectation: low-to-moderate.
- Proof requirements:
  - targeting signals versus workflow evidence
  - no outreach
  - no session creation
  - no participant answers

Recommendation: after Sources / Context and likely after Hierarchy.

### Candidate: Participant Evidence Copilot

- Product value: high.
- Risk: high.
- Context complexity: high.
- Chance of touching analysis behavior: high because it sits near transcript trust, evidence approval, extraction, clarification, disputes, and Pass 6 handoff.
- Token cost expectation: medium-to-high.
- Proof requirements:
  - raw evidence preservation
  - transcript trust gate
  - first-pass extraction boundary
  - clarification boundary
  - no evidence/transcript approval
  - no synthesis/evaluation/package

Recommendation: defer until read-only context map rules are stronger.

### Candidate: Analysis / Package Copilot

- Product value: high.
- Risk: high.
- Context complexity: high.
- Chance of touching analysis behavior: high because Pass 6 owns synthesis, readiness, package eligibility, and output generation.
- Token cost expectation: high if full evidence/readiness context is included.
- Proof requirements:
  - 6A/6B/6C separation
  - evidence eligibility versus seven-condition evaluation
  - no readiness mutation
  - no package generation
  - no Final Package/release/Pass 7 actions

Recommendation: defer until after at least one lower-risk non-Prompt-Studio stage proves the family pattern.

Final build-order recommendation:

1. Sources / Context Copilot
2. Hierarchy Copilot
3. Targeting Copilot
4. Participant Evidence Copilot
5. Analysis / Package Copilot
6. Advanced / Debug Copilot later

## 6. Route and UI Strategy

Options:

### Option A - One page per Stage Copilot

- Pros:
  - clearest for users
  - easiest to test each Copilot
  - page copy can be stage-specific
  - simple route-level proofs
- Cons:
  - can duplicate UI code
  - workspace nav may become crowded

### Option B - One shared Stage Copilot page with stage selector

- Pros:
  - single UI shell
  - easier shared history/provider status layout
  - less duplicated component code
- Cons:
  - weaker stage identity
  - higher chance of confusing stages
  - route/state complexity increases
  - harder to prove no cross-stage leakage

### Option C - Stage-specific pages under `/workspace`

- Pros:
  - good compromise with clear URLs:
    - `/workspace/sources-copilot`
    - `/workspace/hierarchy-copilot`
    - `/workspace/targeting-copilot`
    - `/workspace/evidence-copilot`
    - `/workspace/analysis-copilot`
    - `/workspace/prompt-studio-copilot`
  - each can reuse a shared chat component later
  - admins can test each Copilot directly
- Cons:
  - requires nav strategy to avoid crowding

### Option D - Shared chat component reused by each page

- Pros:
  - reduces duplication
  - keeps provider status/fallback/history UI consistent
  - allows stage-specific labels, route URL, and boundary copy as props
- Cons:
  - component must remain dumb UI only
  - must not import stage packages or provider logic

### Option E - Workspace Stage Copilot Widget

- Pros:
  - best user access model: the admin can ask the Copilot from any workspace page
  - can auto-detect the current stage from route/page context
  - can allow explicit manual stage override when the admin wants another stage's perspective
  - avoids forcing users to navigate to a dedicated Copilot page before asking a question
  - keeps the same underlying Stage Copilot routes, instructions, context envelopes, provider path, and safety boundaries
  - scales naturally as Pass 7, Pass 8, Pass 9, and later stages are added
- Cons:
  - higher cross-page UX risk than a dedicated page
  - requires a reliable stage detection map
  - requires strict visible labeling so users know which stage context is active
  - must avoid becoming a global all-knowing assistant
  - must not add action buttons, tools, save/apply controls, provider controls, or workflow mutation affordances

Recommendation:

- Treat the **Workspace Stage Copilot Widget** as the preferred end-user access model.
- Keep **stage-specific API routes** because they are easier to scope, test, and prove.
- Keep stage-specific pages under `/workspace` as development/proof surfaces and optional detailed views.
- Introduce a shared dumb chat component before or with the widget so the dedicated pages and widget share presentation behavior.
- Let the widget:
  - open from any `/workspace` page
  - infer current stage from route context where possible
  - default to the current stage
  - allow manual stage override
  - show the active stage clearly
  - send a clear `stageKey` on every request
  - display provider status, model, token usage if present, context source, and fallback status
  - display the boundary: no tools, no actions, advisory conversation only

Because the user wants to talk to the Copilot without navigating to a specific page, the widget should become the primary UX. However, it should be built after at least one additional non-Prompt-Studio stage route is proven, so the widget can validate stage detection and manual stage switching rather than only wrapping the current Prompt Studio page.

## 7. Context Strategy Before RAG

Before RAG, use:

- static stage system knowledge card
- small static context fixture
- stage-specific read-only summaries when safe
- context envelope boundary flags
- no live retrieval
- no vector DB
- no semantic search
- no broad document loading

For first UI testing, enough context is:

- stage identity and purpose
- stage operational card
- stage-specific boundary warnings
- representative refs or summary-only records
- current Stage Copilot Instructions
- provider response with token usage

For Sources / Context, the first pilot can start with:

- Sources / Context operational stage card
- static fixture containing example source/context refs
- warnings that source claims and extracted text are signals, not workflow truth
- no live source repository reads initially, unless a separate read-only source summary helper is approved

This is sufficient to test the Copilot’s conversational usefulness without touching live source processing.

## 8. Future RAG / Context Map Boundary

A later Stage Context Map + Governed Retrieval / RAG Strategy should define how stage Copilots can receive richer case context safely.

The Stage Copilot family should leave a clean seam for:

- `stageKey`
- `caseId`
- current route/page-derived stage
- manual stage override
- selected stage record IDs
- stage context map ID/version
- read-only retrieval scope
- evidence anchors
- source refs
- context bundle refs
- audit source refs
- token budget mode

Important future boundary:

- retrieval may collect read-only context, but it must not become action execution
- retrieval must be governed by stage/case scope
- evidence anchors must be cited when evidence claims are discussed
- raw evidence access should remain restricted and explicit
- Copilot answers must not mutate official records
- Copilot answers must not approve evidence, transcripts, gates, readiness, or package eligibility

Do not implement RAG in the family expansion slice. Design it separately.

The widget should not require RAG to be useful. Before RAG exists, it can still pass:

- active `stageKey`
- current workspace route
- case/session identifiers where already available
- static stage knowledge
- read-only context fixture or summary refs
- current Stage Copilot Instructions

Later, the same request shape can carry a governed context map reference without changing the no-action conversation model.

## 9. Proof Strategy

Each future Stage Copilot should have proofs for:

- route exists
- route accepts POST JSON only
- route uses the correct stage key
- route reads current/effective Stage Copilot Instructions for that stage
- route uses the stage-specific context envelope
- route uses existing OpenAI provider path
- provider success path returns text-only response
- provider failure/unconfigured path returns explicit deterministic fallback
- token usage is passed through when available
- response has no tool/action/write fields
- provider response claiming action execution is rejected
- UI route renders
- UI includes stage label, message input, provider status, model, context summary, fallback notice
- UI has no apply/save/action/provider/model selector controls
- stage knowledge questions pass
- no tools/actions/write behavior
- no `@workflow/prompts` import unless an explicitly approved read-only projection slice allows it
- no prompt compilation/tests
- no retrieval/RAG/vector imports
- no Pass 5 behavior changes
- no Pass 6 behavior changes
- no analysis mutation
- no readiness/package eligibility mutation
- no package generation

Widget-specific proofs should validate:

- widget renders on representative `/workspace` pages
- widget auto-detects the expected stage from page context
- widget supports manual stage override
- every chat request includes exactly one explicit `stageKey`
- active stage label is visible in English and Arabic where applicable
- widget has no apply/save/run/approve/generate controls
- widget does not expose provider/model controls
- widget does not persist conversations unless a later approved slice adds explicit conversation storage
- widget does not import stage packages, providers, `@workflow/prompts`, prompt compilation, prompt tests, retrieval, or analysis runtime modules
- existing dedicated Copilot pages continue to render

Stage-specific proof question examples:

- Sources / Context:
  - why source claims are not workflow truth
  - what Pass 2 outputs
  - what OCR/STT/crawl/provider jobs do and do not prove
  - what must not happen before hierarchy

- Hierarchy:
  - hierarchy approval as structural only
  - source-to-hierarchy triage as candidate/signal
  - approved snapshot handoff to targeting

- Targeting:
  - targeting signal versus participant evidence
  - contact readiness versus outreach
  - question-hint seed boundaries

- Participant Evidence:
  - narrative-first evidence
  - transcript trust gate
  - extraction/clarification/answer recheck boundaries
  - no final workflow truth

- Analysis / Package:
  - 6A/6B/6C split
  - evidence eligibility versus seven-condition evaluation
  - documentability versus automation-supportiveness
  - Initial Package versus Final Package

## 10. Token Strategy

Avoid repeating the current high token cost by using:

- stage-specific context only
- compact stage cards
- question-aware context selection
- normal mode versus audit mode
- no full WDE knowledge pack unless the question asks cross-stage logic
- short response rubric per stage
- token usage baselines per stage proof

Suggested token modes:

- Normal mode:
  - current stage card
  - adjacent handoff summary
  - global no-action boundary
  - current Stage Copilot Instructions

- Cross-stage mode:
  - current stage card
  - adjacent predecessor/successor cards
  - relevant global correctness rules

- Audit mode:
  - full WDE stage knowledge
  - good/bad examples
  - stricter diagnostic rubric
  - used in proofs or explicit admin audit questions

For Sources / Context, the first target should be materially lower than Prompt Studio’s `53,895` total diagnostic baseline because it should not need all Pass 2-6 cards for every answer.

## 11. Recommended Implementation Slices

### Slice 1 - Sources / Context Copilot Static Context and API-Only Route

- Purpose: prove a second Stage Copilot using the Prompt Studio pattern without UI or live source reads.
- Files/packages likely touched:
  - `packages/stage-copilot/src/sources-context-context.ts`
  - `packages/stage-copilot/src/sources-context-chat.ts`
  - `packages/stage-copilot/src/index.ts`
  - `apps/admin-web/app/api/stage-copilot/sources-context/chat/route.ts`
  - proof script under `scripts/`
- Produces:
  - static/read-only Sources / Context context fixture
  - provider prompt assembly for `sources_context`
  - API route
  - deterministic fallback
  - live GPT proof and token baseline
- Must not do:
  - no UI
  - no live source repository reads
  - no provider job execution
  - no crawl/OCR/STT/extraction execution
  - no source writes
  - no hierarchy/targeting/session/synthesis/package behavior
- Proof strategy:
  - route/source import scans
  - no-write/no-action response checks
  - Pass 2 stage-knowledge questions
  - provider success/fallback
  - token usage table
  - existing Stage Copilot proof stack
- Risk level: medium-low.

This is the strongest first slice.

### Slice 2 - Sources / Context Copilot Workspace UI

- Purpose: make the new Copilot testable in the workspace.
- Files/packages likely touched:
  - `apps/admin-web/app/workspace/sources-copilot/page.tsx`
  - optional shared workspace chat component under `_components`
  - workspace i18n files
  - workspace nav or stage page link
  - UI proof script
- Produces:
  - UI page for Sources / Context Copilot
  - shared no-action chat presentation if useful
- Must not do:
  - no source writes
  - no provider/model selector
  - no action/apply/save controls
  - no prompt/analysis API calls
- Proof strategy:
  - render/source checks
  - no forbidden controls/imports
  - existing API proof still passes
- Risk level: low-to-medium.

### Slice 3 - Shared Stage Copilot Chat UI Component

- Purpose: reduce UI duplication once two pages exist.
- Files/packages likely touched:
  - workspace `_components`
  - existing Prompt Studio Copilot page
  - Sources / Context Copilot page
  - UI proof scripts
- Produces:
  - shared dumb component for message input, transcript, provider status, model, fallback notice, and boundary copy
- Must not do:
  - no provider logic
  - no stage package imports
  - no action controls
  - no persistence
- Proof strategy:
  - both pages render
  - no behavior regressions
  - no forbidden imports/controls
- Risk level: low.

### Slice 4 - Workspace Stage Copilot Widget Foundation

- Purpose: provide the primary access model: one Copilot widget available throughout `/workspace`.
- Files/packages likely touched:
  - workspace shell/layout components
  - workspace `_components`
  - workspace i18n files
  - widget proof script
- Produces:
  - floating or docked Copilot widget
  - active stage indicator
  - current-stage auto-detection map
  - manual stage override selector
  - shared message input/transcript/provider-status UI
  - routing to already-proven stage chat APIs
- Must not do:
  - no new stage behavior
  - no tools
  - no actions
  - no writes
  - no apply/save/run/approve/generate controls
  - no provider/model selector
  - no conversation persistence
  - no RAG/retrieval
  - no direct imports of mutating stage packages
- Proof strategy:
  - widget renders on representative workspace pages
  - current-stage detection works for known routes
  - manual stage override sends the selected `stageKey`
  - widget can call Prompt Studio and Sources / Context routes
  - no forbidden controls/imports
  - existing dedicated Copilot pages still render
- Risk level: medium because it touches shared workspace UI, but low for analysis behavior if it remains a UI consumer only.

### Slice 5 - Sources / Context Read-Only Live Summary Plan

- Purpose: plan live case/source context without RAG.
- Files/packages likely touched:
  - markdown plan only
- Produces:
  - read-only source/context summary model
  - repository read boundaries
  - proof plan
- Must not do:
  - no code
  - no retrieval
  - no source processing
- Proof strategy:
  - future plan identifies no-write/read-only checks
- Risk level: low.

### Slice 6 - Hierarchy Copilot Static Context and API Route

- Purpose: third Copilot after Sources / Context proves family pattern.
- Files/packages likely touched:
  - `packages/stage-copilot`
  - admin API route
  - proof script
- Produces:
  - hierarchy context fixture
  - hierarchy route
  - live GPT proof
- Must not do:
  - no hierarchy draft/approval/triage writes
  - no targeting/session/synthesis/package behavior
- Proof strategy:
  - hierarchy-specific diagnostic questions
  - source-to-hierarchy as signal/candidate
  - structural approval only
- Risk level: medium.

### Future Slice Template - Pass 7 / Pass 8 / Pass 9 Copilot

- Purpose: add a later stage Copilot once the corresponding stage is formally defined.
- Files/packages likely touched:
  - `packages/stage-copilot` stage knowledge/context/chat helper
  - stage-specific API route
  - widget stage registry/selector metadata
  - optional dedicated workspace page
  - proof scripts
- Produces:
  - stage instructions/default coverage
  - operational stage knowledge
  - read-only context envelope
  - text-only provider/fallback chat
  - widget availability
- Must not do:
  - no tools/actions/writes
  - no official stage execution
  - no provider-backed analysis capability execution
  - no gate/readiness/package/evidence mutation
- Proof strategy:
  - 11-category stage knowledge coverage
  - stage-specific diagnostic questions
  - widget stage selection and route proof
  - no forbidden imports/writes/actions
- Risk level: depends on the future stage; classify at planning time.

## 12. Risks, Open Questions, and Required Decisions

Critical risks:

- Accidentally turning a Copilot into an action-capable agent by adding tools, routed actions, or write paths.
- Directly importing stage packages in a way that calls mutating helpers.
- Blurring Stage Copilot Instructions with Capability / Analysis PromptSpecs.
- Letting Pass 5/Pass 6 Copilots approve evidence, readiness, or package eligibility.

Non-critical risks:

- Token cost if every Copilot receives the full WDE knowledge pack.
- Workspace nav clutter as Copilot pages expand; the widget reduces this risk but needs clear stage labeling.
- Static context may feel shallow before live read-only summaries exist.
- No conversation persistence limits real workflow continuity.
- Live GPT quality can vary; strict proof gates should remain.
- Current-stage auto-detection can be wrong if route-to-stage mapping is incomplete.
- Manual stage override may confuse users unless the active stage is always visible.

Operator decisions needed:

- Should each Copilot have a visible nav item, or should Copilots be grouped under a Copilot hub?
- Should first Sources / Context slice be API-only, or API+UI in one slice?
- Should the Workspace Stage Copilot Widget be introduced immediately after Sources / Context API proof, or after Sources / Context UI proof?
- Should dedicated per-stage Copilot pages remain visible after the widget exists, or become developer/proof surfaces only?
- Should token optimization happen before the next Copilot, or as part of each Copilot’s first implementation?
- When should live Prompt Studio PromptSpec read-only projection be prioritized?
- What token budget is acceptable per stage in normal mode?
- What route/page map should define current stage detection?
- What formal stage keys should be reserved for Pass 7, Pass 8, Pass 9 once those stages are named?

Deferred items:

- Stage Context Map + Governed Retrieval / RAG Strategy
- conversation persistence
- live read-only PromptSpec projection
- live read-only source/context projections
- shared all-stage route factory
- shared Workspace Stage Copilot Widget host
- Pass 7 / Pass 8 / Pass 9 Copilot definitions
- Advanced / Debug Copilot

## 13. Final Recommendation

Accept the Prompt Studio pattern as the base for the Stage Copilot family, but expand conservatively.

Build next:

1. **Sources / Context Copilot API-only route with static/read-only context fixture and proof**
2. Sources / Context Copilot workspace UI
3. Shared dumb chat UI component
4. Workspace Stage Copilot Widget foundation
5. Sources / Context live read-only summary planning
6. Hierarchy Copilot static context/API

Keep each Copilot:

- scoped to one stage
- powered by its own Stage Copilot Instructions
- grounded in stage-specific system knowledge
- wrapped in read-only context envelope guards
- provider-backed for text only
- deterministic fallback capable
- no tools
- no actions
- no writes
- no official analysis execution

The long-term UX should not require users to navigate to a dedicated Copilot page. The accepted direction is a **Workspace Stage Copilot Widget** that is available anywhere in the workflow, detects the current stage, allows manual stage override, and routes to the same underlying Stage Copilot system.

Sources / Context is the right next pilot, provided the first slice does not execute source-processing capabilities or read live source repositories until a separate read-only context model is proven. Pass 7, Pass 8, Pass 9, and later stages should be added through the same family pattern when their stage contracts, knowledge, and boundaries are defined.
