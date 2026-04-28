# Stage Copilot Foundation Architecture and Build Order Plan

Planning report only. No code, routes, APIs, package contracts, PromptSpecs, data models, providers, UI behavior, or runtime behavior were changed.

Branch: `codex/workspace-shell-sandbox`  
Starting commit: `4e04883cbecdccc61f5ff20d5a2568636f185670`  
Related report: `handoff/WORKSPACE_COPILOT_INVENTORY_AND_INTEGRATION_PLAN.md`  
Current visual baseline: `/workspace` visual gate accepted and committed

## A. Executive Summary

Static help is not sufficient for `/workspace` because the workspace is not a documentation surface. It is an operational control plane over multiple stages of the analysis document engine. Admins need to understand why a recommendation exists, what evidence supports it, which assumptions are uncertain, what can be safely done next, and which stage owns the decision. Static copy can explain the intended flow, but it cannot answer stage-specific questions against the current case, source set, hierarchy, targeting packet, participant evidence, synthesis outputs, readiness blockers, or PromptOps state.

Every workspace stage therefore needs a dedicated Stage Copilot. The target is not one assistant bolted onto the whole workspace. The target is a family of stage-bounded conversational assistants that share a dock shell but load different profiles, context bundles, retrieval rules, refusal policies, and action boundaries. A Sources Copilot should explain source intake and document signals. A Hierarchy Copilot should explain structure and triage uncertainty. A Targeting Copilot should explain rollout planning. A Participant Evidence Copilot should explain session evidence and safe next actions. An Analysis / Package Copilot should explain synthesis, differences, readiness, package limits, and blockers. Prompt Studio and Advanced/Debug need their own admin-facing explanation models.

The shared dock must not become one generic chatbot. A generic chatbot would blur stage authority, mix raw evidence with analysis outputs, confuse recommendations with decisions, and create pressure to answer out-of-stage questions. The shared dock should be a host and router, not a universal brain. It should enforce the active stage profile, stage context bundle, allowed retrieval tools, routed recommendation types, and refusal policy.

The architecture must be cross-stage before piloting Pass 6. Pass 6 is close to the desired model, but starting directly with Pass 6 risks hard-coding package-stage assumptions into the shared dock, prompt registry, context shape, and action model. The foundation should first define the common contracts for Stage Copilot profiles, context bundles, Stage Copilot PromptSpecs, retrieval access, and read/write/action boundaries. After that, Pass 5 or Pass 6 can be piloted without making the rest of the workspace inherit the wrong shape.

Context size requires an original evidence retrieval seam. Summaries are necessary, but summaries alone are not enough. Admins must be able to ask where a recommendation came from, see the original text, inspect what a participant actually said, identify which document snippet supports a claim, and understand why something was treated as a blocker. The right foundation is a structured Stage Context Bundle plus an Original Evidence Retrieval Seam that can retrieve exact source, evidence, answer, transcript, prompt-test, or artifact material on demand without loading the entire case into the prompt.

Recommended target model:

`Shared Copilot Dock UI + Stage-specific Copilot Profiles + Stage-specific Context Bundles + Stage-specific Copilot PromptSpecs + Stage-scoped Original Evidence Retrieval Seam + Strict read/write/action boundaries`

### Conversational product definition

A Stage Copilot is a **stage-scoped conversational decision-support partner**. It is not only a help drawer, answer endpoint, BI explanation layer, or FAQ over stage data. The admin should be able to hold a multi-turn reasoning conversation with the active Stage Copilot, similar to discussing a project with a capable analysis partner, while the Copilot remains strictly scoped to the active workspace stage.

The Copilot must be **discussable, not merely answerable**. It should support follow-up questions, challenge weak assumptions, compare alternatives, explain trade-offs, and reason through advisory what-if scenarios using the active stage's rules, data, evidence, contracts, gates, prompts, and proof logic.

It must support:

- Multi-turn discussion.
- Explanation of recommendations.
- Explanation of why a method/lens was selected.
- Explanation of why another method/lens was not selected.
- Critique/challenge when evidence does not support the admin's assumption.
- Alternative analysis paths.
- What-if scenarios inside the stage boundary.
- Comparison of possible admin choices and likely effects.
- Evidence/source origin explanation.
- Future original text/evidence retrieval through the retrieval seam.
- Discussion of the stage's rules, contracts, gates, PromptSpecs, features, and proof logic.
- Strict refusal of unrelated or out-of-stage questions.

### Not just Q&A

Wrong model:

`question -> answer`

Correct model:

`stage-scoped reasoning conversation`

The Copilot should be able to handle questions such as:

- Why did you choose this recommendation?
- Why was this method selected?
- Why was this blocker treated as blocker and not warning?
- What if we used another method?
- What would change if this workflow boundary changed?
- Can you challenge my interpretation?
- Which evidence is weak?
- Which path would likely produce a stronger result?
- What did the participant/source actually say?
- What data was used and where did it come from?

These questions are conversational and reasoning-oriented. They require the Copilot to combine stage system knowledge with current case data, evidence pointers, and refusal boundaries. They cannot be satisfied by static help text or a single answer template.

## B. Stage Copilot Family Architecture

### Shared Copilot dock / shell

The shared dock is the common workspace host. It owns layout, open/close state, conversation affordances, citations display, route chips, and surfaced recommendations. It should not own stage reasoning, business logic, prompt behavior, or data access policy.

Responsibilities:

- Resolve the active workspace stage.
- Load the matching Stage Copilot profile.
- Display stage identity, limits, citations, and routed recommendations.
- Send messages only through the active stage runtime once a runtime exists.
- Render refusal responses clearly when the question is out of stage.
- Require admin confirmation for any routed action that leaves the chat.

### Stage router

The stage router maps workspace stage state to a single active Stage Copilot profile. It prevents cross-stage context blending.

Responsibilities:

- Map stage keys to Copilot profiles.
- Choose the correct Stage Copilot PromptSpec.
- Choose the correct context bundle assembler.
- Choose the allowed retrieval scopes.
- Choose allowed routed recommendation types.
- Refuse or redirect questions that belong to another stage.

### Stage Copilot profile

A Stage Copilot profile is the declarative contract for a stage assistant.

Profile fields should eventually include:

- Stage key and display name.
- Stage purpose.
- Stage Copilot PromptSpec key.
- Context bundle type.
- Conversational behavior profile reference.
- Challenge level / explanation depth / discussion style policy reference.
- Stage system knowledge reference.
- Stage data context reference.
- Allowed record families.
- Allowed retrieval scopes.
- Retrieval scope reference.
- Refusal policy reference.
- Advisory what-if mode boundary.
- Allowed routed recommendation types.
- Forbidden actions.
- Refusal policy.
- Citation/evidence display requirements.
- Audit/provider-job policy.
- Whether the runtime is static, deterministic, mock, provider-backed, or disabled.

### Stage Copilot PromptSpec

A Stage Copilot PromptSpec controls conversational admin support inside one stage. It is separate from Capability PromptSpecs that perform stage work.

It should define allowed topics and conversational behavior:

- What the Copilot may discuss.
- What context it can read.
- What evidence it can cite or retrieve.
- What it must refuse.
- What it may recommend.
- What navigation/action chips it may expose.
- What requires admin confirmation.
- What must remain advanced/internal.
- Depth of explanation.
- Challenge level.
- Reasoning style.
- Directness.
- Whether it proactively suggests alternatives.
- How it handles uncertainty.
- How it structures trade-offs.
- How it refuses out-of-stage topics.
- How it separates recommendation from decision.
- How it cites or requests original evidence.
- How much it behaves like a critical thinking partner versus a neutral explainer.
- How to explain uncertainty, missing data, and data origin.
- How to avoid becoming a generic chatbot.

Changing a Stage Copilot PromptSpec changes conversational support behavior. It does not change underlying business logic.

It must not change:

- State transitions.
- Approval gates.
- Package eligibility.
- Evidence trust.
- Provider execution.
- Official analysis results.
- Source-of-truth records.

### Two knowledge layers per Stage Copilot

Each Stage Copilot needs two knowledge layers and must combine them during discussion.

1. **Stage System Knowledge**
   - Stage purpose.
   - Stage boundaries.
   - Rules.
   - Contracts.
   - Gates.
   - Allowed actions.
   - Forbidden actions.
   - Workflow steps.
   - Feature behavior.
   - Relevant Capability PromptSpecs.
   - Relevant Stage Copilot PromptSpec.
   - Proof/validation logic.

2. **Stage Case Data Context**
   - Current company/case/stage data, scoped to the active stage.
   - Sources.
   - Extraction jobs.
   - Source role/scope suggestions.
   - Hierarchy records.
   - Targeting packets.
   - Question-hint seeds.
   - Participant sessions.
   - Transcripts.
   - Clarification answers.
   - Boundary/dispute signals.
   - Synthesis outputs.
   - Readiness blockers.
   - Package/gate state.
   - Prompt test results where relevant.

Stage System Knowledge tells the Copilot how the stage works. Stage Case Data Context tells it what is true, missing, disputed, or pending in the current case. A useful Stage Copilot conversation requires both layers. Without system knowledge, the Copilot becomes a data summarizer. Without case context, it becomes static help.

### What-if and alternative analysis boundary

The Copilot may discuss hypothetical alternatives inside the active stage boundary. This is part of the product model, not a loophole for writes.

It may discuss:

- Using a different analysis method/lens.
- Interpreting a gap differently.
- Treating a blocker as a warning hypothetically.
- Changing workflow boundary assumptions.
- Choosing a different next admin action.
- Comparing multiple possible routes.

These discussions are advisory only. The Copilot must clearly label them as hypothetical or non-authoritative.

It must not:

- Mutate records.
- Rerun official analysis.
- Change readiness.
- Change package eligibility.
- Rewrite official outputs.
- Approve anything.
- Execute provider actions.

The only exception is a future governed route that explicitly allows a specific action and requires admin confirmation through the appropriate surface.

### Stage context bundle

A Stage Context Bundle is a compact, structured, stage-scoped read model. It gives the Copilot enough current state to answer useful questions and enough IDs/pointers to retrieve original material when needed.

Bundle contents should include:

- Stage summary.
- Current status and blockers.
- Relevant record summaries.
- IDs and evidence anchors.
- Safe display excerpts where allowed.
- Omitted-data markers.
- Source-of-truth links.
- Recommended next-action candidates.
- Access/redaction metadata.

### Stage knowledge map

The stage knowledge map defines what the stage is allowed to know and how record types relate to one another.

Examples:

- Source record -> source text artifact -> source-role suggestion -> hierarchy triage candidate.
- Participant session -> transcript -> extraction output -> clarification candidate -> handoff candidate.
- Synthesis record -> difference interpretation -> evaluation result -> readiness blocker -> package draft.

The knowledge map should be explicit so retrieval can answer "where did this come from?" without giving the Copilot unbounded database access.

### Original evidence retrieval seam

The retrieval seam is a future capability boundary, not an implementation requirement now. It lets a Stage Copilot fetch original material by ID, anchor, or query after the base context bundle has established scope.

It should:

- Accept stage, case, user/admin scope, record type, IDs, anchors, and query intent.
- Return bounded snippets with citations and access metadata.
- Prefer exact record/anchor retrieval when possible.
- Support keyword and semantic retrieval later.
- Log/audit retrieval where raw evidence or participant material is exposed.

### Routed recommendations

Stage Copilots may recommend routed actions, not execute them autonomously. A routed recommendation is a typed suggestion that opens an existing governed surface or preselects a safe filter, section, or review item.

Examples:

- Open source review for a source with extraction failure.
- Open hierarchy triage for an uncertain role.
- Open targeting packet for a contact gap.
- Open participant session evidence review for a disputed answer.
- Open Pass 6 readiness blockers.
- Open Prompt Studio for a specific prompt key.

### Refusal / boundary policy

Every Stage Copilot must refuse unrelated or out-of-stage questions. It may redirect the admin to the correct stage where appropriate.

Refusals should be concise and useful:

- State the active stage boundary.
- Explain what the Copilot can help with.
- Offer a routed link to the correct stage if known.
- Avoid answering the out-of-stage question from memory or general knowledge.

### Audit/provider-job record

Provider-backed Stage Copilot runtimes should record enough audit information to explain what happened without turning chat into business state.

Likely records:

- Interaction ID.
- Stage profile key.
- PromptSpec key/version.
- Context bundle version/hash or persisted bundle snapshot.
- Retrieval calls and evidence IDs where applicable.
- Provider job ID where applicable.
- Routed recommendations returned.
- Refusal category where applicable.

### No-autonomous-write rule

Stage Copilots may explain, retrieve, cite, and recommend. They must not autonomously mutate workflow state. They must not approve gates, approve transcripts, generate packages, run providers directly, promote prompts, create participant sessions, send invitations, resolve review items, or alter records. Writes happen through existing governed UI/actions after explicit admin confirmation.

## C. Stage-by-stage Copilot Model

### 1. Sources / Context - Pass 2

**Stage purpose:** collect, ingest, classify, and prepare source material before hierarchy and targeting work.

**May discuss:**

- Source inventory and ingestion state.
- Extraction, transcription, OCR, text artifact, and provider-job status.
- Source role and scope suggestions.
- Missing source categories.
- Document signal vs workflow truth.
- Why a source is or is not useful for later stages.

**Discussion examples:**

- "Why was this source classified as limited value?"
- "What if we treat this source as context-only?"
- "Which original document text supports this source-role suggestion?"
- "Which source is weakest for hierarchy work and why?"
- "What would change if this source were excluded from the next stage?"

**Must refuse:**

- Final hierarchy decisions.
- Targeting eligibility decisions.
- Participant evidence interpretation.
- Package readiness or synthesis conclusions.
- Generic questions unrelated to source intake/context.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Capability behavior exists for source understanding, extraction/context formation, and source-role/source-scope suggestions.
- Provider-backed ingestion/extraction/OCR/STT behavior may exist through source operations.
- No dedicated Sources Stage Copilot PromptSpec found in the current inventory.
- No dedicated Sources Copilot runtime found.

**Required Stage Copilot PromptSpec:** `sources_context_copilot`.

**Required Stage Context Bundle:** `SourcesCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Source text by source/text-artifact ID.
- Uploaded document snippets.
- Transcript/OCR snippets for source materials.
- Source-role/source-scope suggestion basis.
- Extraction errors and provider-job messages.
- Source-to-role/source-to-hierarchy signal pointers when relevant.

**Allowed routed recommendations:**

- Open source detail/review.
- Open failed extraction/provider job detail.
- Open source role/scope review.
- Open pre-hierarchy source review.
- Navigate to Hierarchy only as a next-stage recommendation, not as a decision.

**Forbidden actions:**

- Run extraction/OCR/STT/providers directly.
- Change source role/scope.
- Approve source truth.
- Create hierarchy records.
- Start targeting or participant work.

**Data exposure risks:**

- Raw uploaded documents may contain sensitive content.
- Extraction artifacts may be incomplete or wrong.
- Source suggestions are AI signals, not authoritative truth.
- Provider errors may expose internal details if not redacted.

**Can be built first safely:**

- Read-only source status context bundle design.
- Static/deterministic explanation using safe summaries.
- Direct ID lookup design for source text snippets.

**Must wait:**

- Provider-backed conversational runtime.
- Raw document retrieval exposure.
- Any source mutation or provider execution from the dock.

### 2. Hierarchy - Pass 3

**Stage purpose:** draft, review, and approve the workflow hierarchy/structure using source signals and admin judgment.

**May discuss:**

- Hierarchy draft reasoning.
- Role/interface/reporting-line uncertainty.
- Source-to-hierarchy triage candidates.
- Why a suggested structural relation was proposed.
- Why hierarchy approval is structural only.
- What records or source signals are missing.

**Discussion examples:**

- "Why is this role connected to this source?"
- "Is this reporting line inferred or confirmed?"
- "What happens if this interface is treated as external instead of internal?"
- "Can you challenge my interpretation of this role boundary?"
- "Which hierarchy link has the weakest evidence?"

**Must refuse:**

- Targeting rollout decisions.
- Participant evidence conclusions.
- Package readiness decisions.
- Final workflow truth claims outside hierarchy structure.
- Out-of-stage prompt editing/debug questions.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Capability PromptSpecs include `pass3.hierarchy.draft` and `pass3.source_hierarchy.triage`.
- Prompt test records exist for Pass 3 in the current inventory.
- No dedicated Hierarchy Stage Copilot PromptSpec found.
- No dedicated Hierarchy Copilot runtime found.

**Required Stage Copilot PromptSpec:** `hierarchy_copilot`.

**Required Stage Context Bundle:** `HierarchyCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Source-to-hierarchy triage evidence.
- Source text snippets supporting role/interface claims.
- Hierarchy draft rationale.
- Admin approval/correction history.
- Unmapped source signals.

**Allowed routed recommendations:**

- Open hierarchy draft review.
- Open source-to-hierarchy triage.
- Open a specific role/node/interface detail.
- Open source evidence supporting an uncertain link.

**Forbidden actions:**

- Approve hierarchy.
- Edit hierarchy nodes/edges.
- Convert candidate evidence to truth.
- Run Pass 3 generation/triage providers.
- Start targeting based on unapproved structure.

**Data exposure risks:**

- Source text may contain sensitive or misleading partial evidence.
- AI structural suggestions may be overread as truth.
- Unapproved hierarchy can leak into later-stage reasoning if boundaries are weak.

**Can be built first safely:**

- Read-only hierarchy summary bundle.
- Explanation-only Copilot profile.
- Direct lookup for draft/triage IDs.

**Must wait:**

- Live provider-backed hierarchy conversation.
- Any approval/edit action integration.
- Broad raw source retrieval.

### 3. Targeting - Pass 4

**Stage purpose:** recommend participant targeting, rollout order, contact readiness, and question-hint seeds after structure is sufficiently understood.

**May discuss:**

- Why participants or roles were suggested.
- Contact/channel gaps.
- Rollout order reasoning.
- Question-hint seeds and why they are not final questions.
- Source-signal interpretation for targeting.
- Why targeting is planning, not workflow truth.

**Discussion examples:**

- "Why did you suggest this participant?"
- "What if we start with supervisor instead of frontline?"
- "Which question hints came from which source?"
- "Which targeting path would likely produce stronger evidence?"
- "What changes if this contact is unavailable?"

**Must refuse:**

- Sending invitations or contacting participants.
- Participant answer interpretation.
- Pass 6 synthesis/readiness/package conclusions.
- Hierarchy approval.
- PromptOps and provider-debug questions outside targeting.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Capability PromptSpec includes `pass4.targeting_rollout.packet`.
- Pass 4 prompt test records exist in the current inventory.
- Targeting recommendations and question-hint seed generation exist as capability behavior.
- No dedicated Targeting Stage Copilot PromptSpec found.
- No dedicated Targeting Copilot runtime found.

**Required Stage Copilot PromptSpec:** `targeting_copilot`.

**Required Stage Context Bundle:** `TargetingCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Source signals used in targeting packet.
- Hierarchy roles/nodes referenced by targeting.
- Contact/channel readiness evidence.
- Question-hint seed basis.
- Recommendation packet rationale.

**Allowed routed recommendations:**

- Open targeting packet.
- Open participant/contact readiness gaps.
- Open question-hint seed review.
- Open source signal supporting a participant recommendation.

**Forbidden actions:**

- Send invitations.
- Create participant sessions.
- Approve targeting rollout.
- Mark contact readiness.
- Run targeting provider generation.

**Data exposure risks:**

- Contact data and participant identity need careful scoping.
- Question hints can be mistaken for finalized interview questions.
- Targeting signals can be mistaken for workflow truth.

**Can be built first safely:**

- Read-only targeting packet explanation.
- Contact gap summaries.
- Direct lookup for targeting recommendation IDs.

**Must wait:**

- Chat-driven targeting actions.
- Provider-backed generation.
- Participant/session creation from recommendations.

### 4. Participant Evidence - Pass 5

**Stage purpose:** collect, inspect, clarify, recheck, and prepare participant evidence for downstream analysis.

**May discuss:**

- What happened in a participant session.
- Transcript trust and raw evidence status.
- Extraction outputs.
- Clarification candidates.
- Answer rechecks.
- Boundary signals, disputes, defects, unmapped content, and missing evidence.
- Safe next admin actions.
- Handoff candidates as non-final review inputs.

**Discussion examples:**

- "What did this participant actually say?"
- "Which evidence is still disputed?"
- "Is this boundary signal useful or a blocker?"
- "What should I ask next and why?"
- "Can you challenge my interpretation of this answer?"

**Must refuse:**

- Transcript approval.
- Evidence approval/rejection.
- Final workflow truth.
- Participant messaging.
- Pass 6 synthesis/evaluation/package generation.
- Out-of-session raw evidence exposure.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Pass 5 prompt family includes extraction, clarification, answer recheck, admin-added question behavior, and `admin_assistant_prompt`.
- Existing runtime includes `runAdminAssistantQuestion` and `/api/participant-sessions/assistant`.
- Existing context bundle includes `buildAdminAssistantContextBundle`.
- Provider job recording and deterministic fallback exist according to the current inventory.

**Required Stage Copilot PromptSpec:** keep existing admin assistant behavior separated, then formalize as `participant_evidence_copilot`.

**Required Stage Context Bundle:** `EvidenceCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Transcript text by session/time/turn/answer ID.
- Participant answers.
- Clarification answers.
- Raw evidence excerpts.
- Evidence anchors.
- Admin notes.
- Extraction/recheck rationale.
- Handoff candidate basis.

**Allowed routed recommendations:**

- Open participant session evidence review.
- Open transcript approval/review surface.
- Open clarification candidate.
- Open answer recheck detail.
- Open evidence dispute or boundary signal.
- Open handoff candidate review where already supported.

**Forbidden actions:**

- Approve transcripts.
- Approve/reject evidence.
- Message participants.
- Create handoff candidates without explicit admin action.
- Run extraction/recheck providers directly from dock.
- Write Pass 6 synthesis inputs.

**Data exposure risks:**

- Raw participant data is sensitive.
- Transcript errors can be mistaken for truth.
- Participant statements may be disputed, private, or out of scope.
- Cross-session leakage must be prevented.

**Can be built first safely:**

- Reuse existing Pass 5 assistant only after the shared foundation exists.
- Add workspace-safe read-only view-model and disclosure rules.
- Integrate as scoped participant/session Copilot, not case-global chatbot.

**Must wait:**

- Broad workspace raw transcript retrieval.
- Any autonomous write/action integration.
- Cross-participant synthesis behavior.

### 5. Analysis / Package - Pass 6

**Stage purpose:** synthesize evidence, interpret differences, evaluate readiness, produce analysis/package support artifacts, and explain blockers and limits.

**May discuss:**

- Synthesis inputs and outputs.
- Difference interpretation.
- Methodology/lenses.
- Seven-condition readiness.
- Blockers vs warnings.
- Pre-6C gate and clarification needs.
- Inquiry packets.
- Package drafting limits.
- Gap closure briefs, optional draft documents, and visual validation context.

**Discussion examples:**

- "Why did you choose this method?"
- "Why is this readiness condition blocked?"
- "What if we proceed with warnings?"
- "Which evidence supports this package caveat?"
- "How would the conclusion change if the workflow boundary changed?"
- "Why was this blocker not treated as a warning?"

**Must refuse:**

- Readiness override.
- Package eligibility changes.
- Package approval or final release.
- Final Package generation.
- Pass 7 issue mechanics.
- Direct participant evidence approval.
- Prompt editing/debug outside scoped explanation.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Capability PromptSpecs include synthesis, difference interpretation, evaluation, initial package drafting, admin explanation, pre-package inquiry generation, optional draft document generation, and visual narrative support.
- Stage Copilot PromptSpec/profile exists as `pass6_analysis_copilot`.
- Runtime exists through `runPass6Copilot`, `/api/pass6/copilot`, and `/pass6/copilot`.
- Context bundle exists as `buildPass6CopilotContextBundle`.
- Interactions/context are persisted and provider execution is governed through the route.
- Routed recommendations are recommendation-only.

**Required Stage Copilot PromptSpec:** existing `pass6_analysis_copilot`, later normalized into the shared Stage Copilot registry.

**Required Stage Context Bundle:** `AnalysisPackageCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Synthesis evidence basis.
- Difference evidence basis.
- Evaluation/readiness basis.
- Blocker source records.
- Inquiry and clarification evidence.
- Package draft source references.
- Visual validation evidence.
- Linked Pass 5 evidence anchors when allowed.

**Allowed routed recommendations:**

- Open Pass 6 synthesis/difference/evaluation sections.
- Open readiness blockers.
- Open Pre-6C clarification/inquiry review.
- Open package draft or brief support.
- Open source evidence basis where allowed.

**Forbidden actions:**

- Approve readiness.
- Override gates.
- Generate final packages.
- Release packages.
- Run synthesis/evaluation/package providers directly from dock.
- Mutate analysis records.

**Data exposure risks:**

- Summaries can hide disputed or weak evidence.
- Package-stage answers may be mistaken for final business decisions.
- Raw participant evidence exposure must remain scoped and justified.
- Pass 7/finalization mechanics must not leak into Pass 6.

**Can be built first safely:**

- After foundation, Pass 6 is a strong real provider-backed pilot because runtime, PromptSpec, context bundle, persistence, and routed recommendation patterns already exist.
- Start with case-scoped read-only dock integration.

**Must wait:**

- Any package generation or readiness mutation from dock.
- Finalization/Pass 7 conversational behavior.
- Broad retrieval without evidence access policy.

### 6. Prompt Studio / PromptOps

**Stage purpose:** manage prompt lifecycle, test prompt behavior, inspect active/draft/previous/archive state, and separate prompt-controlled behavior from product/runtime behavior.

**May discuss:**

- Difference between Capability PromptSpecs and Stage Copilot PromptSpecs.
- What a prompt controls and what it cannot control.
- Active vs draft vs previous vs archived lifecycle.
- Prompt tests and provider failure visibility.
- Why prompt tests are inspection records, not workflow records.
- Safe activation/testing workflow.

**Discussion examples:**

- "What is the difference between Capability PromptSpec and Stage Copilot PromptSpec?"
- "If I change this Copilot prompt, what behavior changes and what does not?"
- "Why did this prompt test fail?"
- "Would changing this prompt alter analysis results or only conversational style?"
- "Which PromptSpec controls this recommendation?"

**Must refuse:**

- Promoting or archiving prompts.
- Running provider tests from chat.
- Editing prompt text.
- Changing runtime behavior, data models, or business logic.
- Explaining raw production evidence unless explicitly scoped through another stage.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Prompt registry and PromptOps behavior exist for active/draft/previous/archive workflows.
- Pass 3, Pass 4, Pass 6 prompt workspaces and Pass 5 prompt family are represented in the current inventory.
- Provider test harnesses exist.
- No dedicated Prompt Studio Stage Copilot PromptSpec found.
- No dedicated Prompt Studio Copilot runtime found.

**Required Stage Copilot PromptSpec:** `prompt_studio_copilot`.

**Required Stage Context Bundle:** `PromptStudioCopilotContextBundle`.

**Required original evidence retrieval needs:**

- PromptSpec versions and metadata.
- Prompt test inputs/outputs where relevant.
- Provider test failure details.
- Capability-to-stage map.
- Stage Copilot PromptSpec-to-profile map.

**Allowed routed recommendations:**

- Open specific prompt spec.
- Open prompt test result.
- Open active/draft comparison.
- Open stage Copilot prompt category.
- Open provider diagnostics for failed tests.

**Forbidden actions:**

- Promote/archive/update prompts.
- Run provider tests.
- Change active prompt version.
- Modify Capability PromptSpecs or Stage Copilot PromptSpecs.
- Treat prompt changes as data model/runtime changes.

**Data exposure risks:**

- Prompt tests may include production-like content.
- Provider outputs may contain sensitive evidence.
- Admins may confuse prompt changes with business logic changes.

**Can be built first safely:**

- Read-only taxonomy/explanation Copilot.
- Prompt inventory context bundle.
- Explicit UI separation of Capability PromptSpecs and Stage Copilot PromptSpecs.

**Must wait:**

- Provider-backed Prompt Studio chat.
- Prompt editing/promoting through chat.
- Raw test output retrieval until redaction policy exists.

### 7. Advanced / Debug

**Stage purpose:** help operators understand provider jobs, diagnostics, routes, proof artifacts, and debug state without executing unsafe operations.

**May discuss:**

- Route meaning.
- Provider job status.
- Provider availability/failure categories.
- Proof/debug context.
- Where to inspect details.
- Which surface owns an operation.

**Discussion examples:**

- "What does this provider job failure mean?"
- "Which route owns this action?"
- "Is this proof output related to business logic or debug only?"
- "Is this failure a provider issue, data issue, or route issue?"
- "Where should I inspect this record next?"

**Must refuse:**

- User/admin workflow decisions.
- Secret exposure.
- Raw participant evidence outside allowed scope.
- Provider execution.
- Unsafe route triggering.
- Generic engineering Q&A unrelated to the current app/debug context.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Provider diagnostics, provider jobs, proof scripts, debug routes, and persistence records exist as advanced/internal surfaces.
- No dedicated Advanced/Debug Stage Copilot PromptSpec found.
- No dedicated Advanced/Debug Copilot runtime found.

**Required Stage Copilot PromptSpec:** `advanced_debug_copilot`.

**Required Stage Context Bundle:** `AdvancedDebugCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Provider job records.
- Provider diagnostics.
- Proof script outputs/references.
- Route registry/documentation.
- Redacted error details.

**Allowed routed recommendations:**

- Open provider job detail.
- Open provider diagnostics.
- Open proof artifact.
- Open relevant route/debug page.

**Forbidden actions:**

- Execute providers.
- Trigger routes.
- Mutate records.
- Reveal secrets.
- Reveal unrestricted raw participant/source data.

**Data exposure risks:**

- Secrets and environment details.
- Provider payloads containing raw evidence.
- Internal operational routes.
- Debug data outside normal admin scope.

**Can be built first safely:**

- Operator-only static/read-only explanation profile.
- Redacted provider job summaries.

**Must wait:**

- Any action execution.
- Any general debug chatbot.
- Any raw payload retrieval without access policy.

### 8. Future Finalization / Pass 7

**Stage purpose:** future finalization and review mechanics after Pass 6, including candidate review items and eventual finalization workflows once separately scoped.

**May discuss later:**

- Candidate review issues.
- Why an item is only a candidate.
- Which admin review path owns the decision.
- What evidence or Pass 6 basis may need review.

**Future discussion examples:**

- "Why is this only a review candidate?"
- "Which Pass 6 evidence made this item review-worthy?"
- "What would need to be resolved before this could become final?"
- "Which finalization path would be safest if this issue remains disputed?"

**Must refuse now:**

- Client-facing finalization behavior.
- Final Package generation/release.
- Issue discussion mechanics.
- Final decision authority.
- Pass 7-specific business logic not yet scoped.

**Current implemented helpers / PromptSpecs / runtimes, if any:**

- Pass 7-adjacent candidate seam records exist from Pass 6 review-worthy/unresolved outputs in the current inventory.
- No client/finalization Copilot PromptSpec found.
- No Pass 7 Copilot runtime found.

**Required Stage Copilot PromptSpec:** future `pass7_finalization_copilot`, only after Pass 7 is scoped.

**Required Stage Context Bundle:** future `Pass7FinalizationCopilotContextBundle`.

**Required original evidence retrieval needs:**

- Review candidate basis.
- Linked Pass 6 blocker/difference/evaluation evidence.
- Issue/comment history once Pass 7 exists.
- Finalization decision records once defined.

**Allowed routed recommendations:**

- For now, only open future review candidate lists where such records exist.
- Later, open specific review issues after Pass 7 is designed.

**Forbidden actions:**

- Generate/release Final Package.
- Resolve review issues.
- Message clients.
- Mutate finalization state.
- Create a client copilot.

**Data exposure risks:**

- Premature client-facing visibility.
- Finalization authority leakage.
- Mixing candidate review with final decisions.

**Can be built first safely:**

- Read-only count/status of candidate review items.
- Architecture placeholder only.

**Must wait:**

- Any real Pass 7 Copilot.
- Any client-facing behavior.
- Any final package/release functionality.

## D. Stage Context Bundle Requirements

### `SourcesCopilotContextBundle`

Record types needed:

- Source records.
- Intake batches.
- Uploaded document metadata.
- Text artifacts.
- Extraction/OCR/STT/provider jobs.
- Source-role/source-scope suggestions.
- Structured context records.
- Pre-hierarchy source review records.

Summaries needed:

- Source counts by type/status.
- Extraction/transcription readiness.
- Provider failure summary.
- Role/scope suggestion summary.
- Missing or weak source categories.
- Source signal vs workflow truth caveat.

IDs / pointers / evidence anchors needed:

- Source IDs.
- Text artifact IDs.
- Provider job IDs.
- Suggestion IDs.
- Document page/time/offset anchors where available.

Original text references needed:

- Source text snippets by artifact ID.
- Document snippets by page/offset.
- Transcript/OCR snippets where source material is audio/video/image-derived.

Exclude:

- Full raw files by default.
- Provider secrets.
- Participant session evidence.
- Hierarchy/targeting truth beyond linked status pointers.

Stage scope rules:

- Only sources for the active case/workspace.
- Only source records allowed for Pass 2 context.
- Later-stage records may appear only as navigation/status pointers.

View-model APIs needed first:

- Yes. Build source status and redaction view-models before provider-backed chat.

### `HierarchyCopilotContextBundle`

Record types needed:

- Hierarchy drafts.
- Current hierarchy nodes/edges.
- Source-to-hierarchy triage records.
- Admin corrections/approval state.
- Prompt test references where relevant.

Summaries needed:

- Current structure summary.
- Draft status.
- Uncertain roles/interfaces/reporting lines.
- Triage candidate summary.
- Approval boundary explanation.

IDs / pointers / evidence anchors needed:

- Node/edge IDs.
- Draft IDs.
- Triage IDs.
- Source IDs.
- Evidence anchors supporting proposed relationships.

Original text references needed:

- Source snippets supporting hierarchy candidates.
- Draft rationale excerpts.
- Admin decision notes.

Exclude:

- Targeting recommendations.
- Participant evidence.
- Package readiness.
- Raw source text unless retrieved through allowed evidence seam.

Stage scope rules:

- Only active case hierarchy and linked source signals.
- Unapproved structure must be labelled as draft/candidate.

View-model APIs needed first:

- Yes. Build hierarchy summary and triage summary read models.

### `TargetingCopilotContextBundle`

Record types needed:

- Targeting rollout plan.
- Recommendation packet.
- Participant/role/contact/channel readiness records.
- Question-hint seeds.
- Source-signal summaries.
- Approved hierarchy references.

Summaries needed:

- Suggested participants/roles.
- Rollout order.
- Contact gaps.
- Channel readiness.
- Question seed themes.
- Planning-only caveat.

IDs / pointers / evidence anchors needed:

- Targeting packet IDs.
- Participant/contact IDs where applicable.
- Role/node IDs.
- Source signal IDs.
- Question seed IDs.

Original text references needed:

- Source snippets behind targeting recommendations.
- Contact readiness source notes.
- Question seed basis.

Exclude:

- Raw participant session evidence.
- Messaging/send controls.
- Final workflow truth.
- Pass 6 synthesis/package outputs.

Stage scope rules:

- Only active case targeting state.
- Only approved/allowed hierarchy references.
- Recommendations remain planning records.

View-model APIs needed first:

- Yes. Build targeting packet and contact readiness summaries.

### `EvidenceCopilotContextBundle`

Record types needed:

- Participant sessions.
- Session questions/answers.
- Transcript metadata and approval status.
- Raw evidence metadata/snippets where allowed.
- Extraction outputs.
- Clarification candidates and answers.
- Answer rechecks.
- Boundary/dispute/defect/unmapped records.
- Admin notes.
- Handoff candidates.

Summaries needed:

- Session status.
- Transcript trust status.
- Evidence extraction summary.
- Open clarification/recheck items.
- Disputes and uncertain items.
- Safe next actions.
- Disclosure/scope notes.

IDs / pointers / evidence anchors needed:

- Session IDs.
- Question/answer IDs.
- Transcript turn/time anchors.
- Evidence IDs.
- Clarification IDs.
- Recheck IDs.
- Handoff candidate IDs.

Original text references needed:

- Participant answer text.
- Transcript snippets.
- Clarification answers.
- Raw evidence excerpts.
- Admin notes.

Exclude:

- Raw participant evidence outside the active admin/session scope.
- Other participant sessions unless explicitly case-scoped and allowed.
- Pass 6 conclusions as truth.
- Provider secrets.

Stage scope rules:

- Session/case scoping must be explicit.
- Raw evidence exposure must be justified and citeable.
- Unapproved transcript/evidence must be labelled as unapproved.

View-model APIs needed first:

- Yes. Build evidence disclosure and scope read models before dock integration.

### `AnalysisPackageCopilotContextBundle`

Record types needed:

- Synthesis inputs/outputs.
- Workflow units/claims.
- Difference interpretations.
- Evaluation/readiness results.
- Method/lens usage records.
- Pre-6C gate records.
- Clarification/inquiry packets.
- Initial package drafts/briefs.
- Optional draft document records.
- Visual narrative/validation records.
- Config/profile references.

Summaries needed:

- 6A/6B/6C status.
- Blockers vs warnings.
- Evidence coverage.
- Methodology rationale.
- Difference/conflict summary.
- Readiness caveats.
- Package limits.
- Next safe actions.

IDs / pointers / evidence anchors needed:

- Synthesis IDs.
- Difference IDs.
- Evaluation IDs.
- Readiness condition IDs.
- Blocker IDs.
- Inquiry IDs.
- Package draft IDs.
- Linked evidence anchors.

Original text references needed:

- Evidence basis for synthesis/difference/evaluation.
- Linked Pass 5 excerpts where allowed.
- Source snippets behind package claims.
- Prompt/test outputs where relevant to explanation.

Exclude:

- Final Package/release mechanics.
- Pass 7 issue mechanics until scoped.
- Raw participant evidence unless allowed by active admin scope.
- Any write controls.

Stage scope rules:

- Case-scoped Pass 6 records only.
- All readiness/package statements must be labelled as explanatory, not authoritative actions.

View-model APIs needed first:

- Yes for shared dock integration, though existing Pass 6 context bundle can inform the shape.

### `PromptStudioCopilotContextBundle`

Record types needed:

- Prompt registry entries.
- Capability PromptSpecs.
- Stage Copilot PromptSpecs.
- Prompt lifecycle records.
- Prompt test cases/runs/results.
- Provider availability/test diagnostics.

Summaries needed:

- Capability-vs-Copilot prompt map.
- Active/draft/previous/archive status.
- Prompt ownership by stage.
- Test results and failure categories.
- Safe editing/activation boundaries.

IDs / pointers / evidence anchors needed:

- PromptSpec keys/versions.
- Test run IDs.
- Provider job IDs.
- Stage profile keys.

Original text references needed:

- Prompt excerpts where safe.
- Test input/output excerpts where safe.
- Provider error snippets after redaction.

Exclude:

- Provider credentials/secrets.
- Production raw evidence unless used in a permitted test fixture.
- Prompt mutation controls.

Stage scope rules:

- Prompt Studio may explain prompts across stages but must keep Capability PromptSpecs and Stage Copilot PromptSpecs distinct.
- It must not answer production evidence questions except by redirecting to the relevant stage Copilot.

View-model APIs needed first:

- Yes. Build prompt inventory/status read model before provider-backed chat.

### `AdvancedDebugCopilotContextBundle`

Record types needed:

- Provider jobs.
- Provider diagnostics.
- Route/debug registry references.
- Proof script references/results.
- Selected persistence/debug records.

Summaries needed:

- Provider health.
- Job status/failure class.
- Route ownership.
- Proof artifact meaning.
- Where to inspect details.

IDs / pointers / evidence anchors needed:

- Provider job IDs.
- Diagnostic IDs.
- Route IDs.
- Proof artifact paths/IDs.

Original text references needed:

- Redacted provider errors.
- Redacted job payload summaries.
- Proof output snippets.

Exclude:

- Secrets.
- Raw provider payloads by default.
- Unredacted participant/source evidence.
- Any executable controls.

Stage scope rules:

- Operator-only.
- Read-only.
- Explicit redaction required.

View-model APIs needed first:

- Yes. Build operator-only debug read model and access policy.

## E. Original Evidence Retrieval Seam

Do not implement retrieval now. Design the seam first.

Future Copilots need to retrieve original material without stuffing every source, transcript, answer, extraction, synthesis basis, prompt test output, and admin note into the initial prompt. The base Stage Context Bundle should provide summaries and pointers. The retrieval seam should fetch exact bounded material only when the admin asks for evidence, origin, original wording, or rationale.

Must support future retrieval of:

- Source text.
- Uploaded document snippets.
- Transcript text.
- Participant answers.
- Clarification answers.
- Raw evidence excerpts.
- Evidence anchors.
- Admin notes.
- Source-to-role/source-to-hierarchy signals.
- Targeting question-hint seeds.
- Synthesis/difference/evaluation evidence basis.
- Prompt/test outputs where relevant.

### Retrieval approach comparison

**Direct lookup by evidence/source/artifact IDs**

- Strengths: deterministic, auditable, easiest to secure, best for "show me the original text behind this citation."
- Weaknesses: requires the context bundle to carry good IDs and anchors; not enough for exploratory questions.
- Recommended role: first implementation mechanism.

**Evidence-anchor lookup**

- Strengths: precise citation retrieval by page, offset, timestamp, answer ID, section, or claim anchor.
- Weaknesses: depends on consistent anchor creation and preservation across stages.
- Recommended role: first-class seam concept, paired with direct ID lookup.

**Keyword search**

- Strengths: simple exploratory search over source/transcript/evidence text; can be implemented with SQLite/Postgres text indexes.
- Weaknesses: misses synonyms and intent; may return too much without stage filtering.
- Recommended role: second step after direct/anchor lookup.

**Semantic search**

- Strengths: useful for conceptual recall and broad evidence discovery.
- Weaknesses: adds embedding/index complexity, cost, refresh policy, security scope, and explainability risk.
- Recommended role: later, only after exact/keyword retrieval shows a real limitation.

**Hybrid exact + keyword + semantic retrieval**

- Strengths: best long-term balance; exact citations for anchored claims, keyword for auditability, semantic for exploratory questions.
- Weaknesses: higher complexity and requires strong result ranking/redaction rules.
- Recommended role: long-term target.

**SQLite/Postgres text indexes**

- Strengths: pragmatic, local to existing persistence, easier to govern and audit, enough for keyword and exact lookup.
- Weaknesses: less powerful than vector retrieval for concept search.
- Recommended role: preferred early storage/search path.

**Vector database later if needed**

- Strengths: scalable semantic retrieval.
- Weaknesses: new infra, new privacy/indexing concerns, versioning burden, and harder evidence guarantees.
- Recommended role: defer until exact and text-index search are insufficient.

### Recommended future strategy

Use:

`Structured Stage Context Bundle + Original Evidence Retrieval Seam + Hybrid retrieval later when needed`

Build order for retrieval:

1. Direct lookup by scoped IDs and anchors.
2. Evidence-anchor lookup with stable citation metadata.
3. Stage-scoped keyword search using SQLite/Postgres text indexes.
4. Hybrid retrieval combining exact/anchor/keyword.
5. Semantic/vector retrieval only if a specific stage needs conceptual recall that keyword/exact lookup cannot handle.

Summaries alone are not enough. The admin must be able to ask:

- Where did this come from?
- Show me the original text.
- What did the participant actually say?
- What document snippet supports this?
- Why was this treated as a blocker?

The Copilot should answer these with citations, original snippets, and stage-bound caveats, not by paraphrasing from memory.

## F. PromptSpec Separation Model

Prompt Studio should eventually expose two distinct prompt categories:

1. **Capability PromptSpecs**
   - Drive stage work.
   - Produce recommendations, drafts, evaluations, extractions, interpretations, tests, and packages.
   - Changing these can affect AI-generated stage artifacts.

2. **Stage Copilot PromptSpecs**
   - Control conversational admin support inside a stage.
   - Define allowed discussion, context access, refusal policy, routed recommendations, and confirmation boundaries.
   - Changing these affects how the Copilot explains and assists; it should not change the underlying analysis/generation behavior.

Admins must not confuse changing analysis behavior with changing conversational explanation behavior. Prompt Studio should label, group, filter, and explain these prompt families separately.

| Stage | Likely Capability PromptSpecs | Likely Stage Copilot PromptSpec |
| --- | --- | --- |
| Sources / Context - Pass 2 | Source understanding, source-role suggestion, source-scope suggestion, extraction/context formation, structured context formation, pre-hierarchy review helpers | `sources_context_copilot` |
| Hierarchy - Pass 3 | `pass3.hierarchy.draft`, `pass3.source_hierarchy.triage` | `hierarchy_copilot` |
| Targeting - Pass 4 | `pass4.targeting_rollout.packet`, targeting recommendations, question-hint seed generation | `targeting_copilot` |
| Participant Evidence - Pass 5 | Evidence extraction, clarification question formulation, answer recheck, admin-added question prompt, boundary/dispute helpers, handoff candidate support | `participant_evidence_copilot` / existing `admin_assistant_prompt` normalized |
| Analysis / Package - Pass 6 | Synthesis, difference interpretation, evaluation, admin explanation, pre-package inquiry generation, initial package drafting, optional draft document generation, visual narrative support | Existing `pass6_analysis_copilot` normalized |
| Prompt Studio / PromptOps | Prompt test/evaluation helpers where applicable | `prompt_studio_copilot` |
| Advanced / Debug | Provider diagnostics/test helper prompts where applicable | `advanced_debug_copilot` |
| Future Finalization / Pass 7 | Future issue extraction, review interpretation, finalization drafting, client-safe review helpers once scoped | Future `pass7_finalization_copilot` |

## G. Read/Write/Action Boundary Model

Universal rules:

- Copilot may explain stage state.
- Copilot may cite/retrieve evidence through allowed stage-scoped retrieval.
- Copilot may identify missing, uncertain, disputed, or weak items.
- Copilot may recommend routed actions.
- Copilot may navigate/open sections through safe route chips.
- Copilot may suggest admin review paths.
- Copilot may not approve gates.
- Copilot may not approve transcripts.
- Copilot may not approve/reject evidence.
- Copilot may not generate packages.
- Copilot may not run providers directly.
- Copilot may not mutate records.
- Copilot may not create participant sessions.
- Copilot may not send invitations/messages.
- Copilot may not promote/archive/update prompts.
- Copilot may not resolve finalization/review issues.
- Copilot may not expose restricted raw participant data outside allowed admin scope.
- Copilot may not answer unrelated or out-of-stage questions.
- Copilot must distinguish recommendation, candidate, draft, approved record, and final decision.
- Copilot must require explicit admin confirmation through existing governed UI for any write/action.

## H. Build Order Plan

Do not start with live provider chat. Build the foundation first.

Before any foundation contracts are implemented, the design must account for:

- Conversational behavior controls.
- Stage System Knowledge references.
- Stage Case Data Context references.
- What-if/advisory analysis behavior.
- Refusal policy.
- Future retrieval of original evidence.
- Clear separation between prompt-controlled discussion style and governed domain behavior.

The first implementation slice after this report should still not build live Copilot. It should be the **Stage Copilot Foundation Contracts / Design Layer**.

1. **Contract/design layer for Stage Copilot profiles and context bundle shapes**
   - Define stage keys, profile fields, prompt keys, conversational behavior profile references, challenge level/explanation depth/discussion style policy references, Stage System Knowledge references, Stage Case Data Context references, allowed record families, retrieval scope references, refusal policy references, advisory what-if mode boundaries, routed recommendation types, forbidden actions, and audit policy.
   - Output should be architecture/contracts first, not UI or providers.

2. **Stage context bundle read-model planning**
   - Define `SourcesCopilotContextBundle`, `HierarchyCopilotContextBundle`, `TargetingCopilotContextBundle`, `EvidenceCopilotContextBundle`, `AnalysisPackageCopilotContextBundle`, `PromptStudioCopilotContextBundle`, and `AdvancedDebugCopilotContextBundle`.
   - Identify required view-model APIs, stage system knowledge inputs, stage case data context inputs, evidence anchors, and redaction rules before implementation.

3. **Original evidence retrieval seam design**
   - Specify direct ID lookup, evidence-anchor lookup, stage-scoped keyword search, and future hybrid retrieval behavior.
   - Define citation, original text retrieval, redaction, audit, and scope requirements.

4. **Shared Copilot dock UI shell**
   - Build as a host only.
   - No provider chat yet.
   - It should route by stage profile and display static/deterministic stage information.
   - It should be designed to host multi-turn reasoning conversations later, but should not fake a live assistant.

5. **Stage Copilot PromptSpec registry**
   - Add explicit Stage Copilot PromptSpec categories separate from Capability PromptSpecs.
   - Prompt Studio should show the distinction clearly.
   - Stage Copilot PromptSpecs must include conversational behavior controls, not only topic allowlists.

6. **Read-only non-provider mock runtime or deterministic response harness if needed**
   - Use deterministic responses to verify dock/profile/context/refusal/routed recommendation behavior.
   - Keep it read-only and auditable.
   - Include deterministic examples for challenge behavior, trade-off explanation, advisory what-if handling, and out-of-stage refusal.

7. **First real provider-backed pilot**
   - Pilot only after contracts, context bundle shape, retrieval seam design, prompt registry, dock shell, and read/write boundaries are in place.

8. **Existing Pass 5 assistant integration**
   - Integrate the existing Pass 5 assistant through the shared dock only after workspace-safe view-models and raw evidence disclosure rules are ready.
   - Preserve session/case scoping and no-autonomous-write behavior.

9. **Pass 6 Analysis Copilot integration**
   - Integrate existing Pass 6 `pass6_analysis_copilot` through the shared dock using case-scoped context and routed recommendations only.
   - Preserve no readiness/package authority.

10. **Pass 2-4 read-only explanation Copilots**
   - Add Sources, Hierarchy, and Targeting explanation Copilots as read-only first.
   - Use structured summaries and exact/anchor retrieval before live provider chat.

11. **Prompt Studio Copilot**
   - Add read-only PromptOps explanation Copilot to teach the Capability vs Stage Copilot PromptSpec separation and prompt lifecycle.

12. **Advanced/Debug Copilot**
   - Add operator-only read-only Debug Copilot last, with strict redaction and no action execution.

### Recommended first real pilot after foundation

The strongest first real provider-backed pilot after the foundation is ready is **Pass 6 Analysis / Package Copilot**.

Reason:

- It already has a dedicated `pass6_analysis_copilot` PromptSpec/profile.
- It already has a runtime, route, context bundle, persisted interactions, provider execution path, and routed action recommendation pattern.
- Its value is high because admins naturally ask "why is this a blocker?", "where did this readiness result come from?", "what changed between evidence and package?", and "what should I review next?"
- It exercises the most important foundation concepts: context bundles, evidence basis retrieval, routed recommendations, no-autonomous-write boundaries, and refusal of package/finalization authority.

Pass 5 is also strong and may be the first integration target if the product wants to validate participant-session scoping before case-level analysis. However, Pass 5 carries higher raw participant disclosure risk. Pass 6 is the cleaner first foundation validation as long as raw evidence retrieval is gated and case-scoped.

## I. Open Questions

| Question | Why it matters | Options | Recommended answer | Criticality 1-5 | Blocks implementation? |
| --- | --- | --- | --- | --- | --- |
| Which stage should be the first real conversational pilot after foundation? | The first pilot will shape runtime, audit, retrieval, and routed action patterns. | Pass 5, Pass 6, Pass 2 read-only, Prompt Studio read-only | Pass 6 after foundation; Pass 5 immediately after or before only if participant disclosure policy is ready | 5 | Yes for provider-backed pilot; no for foundation design |
| Should Stage Copilot PromptSpecs be created before the shared dock runtime? | Without specs, the dock can drift into generic chatbot behavior. | Specs first, dock first, parallel | Create profile/PromptSpec contracts before runtime; implement minimal registry before provider chat | 5 | Yes for live provider chat |
| Should context bundles be built as view-model APIs first? | Context bundles need stable, redacted, stage-scoped data. | Direct DB assemblers, view-model APIs first, hybrid | Plan and build view-model APIs/read models first for workspace surfaces; existing Pass 5/6 bundles can inform shapes | 5 | Yes for broad workspace integration |
| What retrieval mechanism should be implemented first: direct ID lookup, keyword search, semantic search, or hybrid? | Retrieval affects evidence trust, privacy, cost, and explainability. | Direct ID, anchor lookup, keyword, semantic, hybrid | Direct ID + evidence-anchor lookup first; stage-scoped keyword next; hybrid later; semantic/vector only if needed | 5 | Yes for original evidence retrieval implementation; no for current planning |
| What raw evidence must never be exposed through Copilot? | Prevents leakage of sensitive participant/source/provider data. | Block all raw evidence, allow stage-scoped evidence, allow admin-scoped evidence with audit | Never expose secrets, credentials, unrestricted provider payloads, cross-case data, out-of-scope participant data, or client/finalization data before scoped; expose raw evidence only through allowed stage/admin scope with citations/audit | 5 | Yes for raw retrieval/provider chat |
| Should Pass 2-4 Copilots start as read-only explanation only? | These stages have capability helpers but lack copilot runtime/boundaries. | Read-only first, provider-backed immediately, no copilot | Yes, start as read-only explanation with routed links and exact retrieval; add provider chat later | 4 | No for foundation; yes for Pass 2-4 live chat |
| How should Prompt Studio separate Capability PromptSpecs from Stage Copilot PromptSpecs? | Admins must know whether they are changing stage work or conversational explanation. | Single list with tags, separate tabs/groups, separate registries | Separate categories/groups and filters, shared metadata shape, explicit descriptions of what each prompt controls and cannot control | 4 | No for first dock shell; yes before Prompt Studio Copilot |
| Should the shared dock support cross-stage questions? | Cross-stage answers can blur data scope and authority. | Always no, limited redirects, full cross-stage assistant | Refuse out-of-stage answers and offer routed navigation to the proper stage; no cross-stage synthesis unless a future explicit supervisor profile is designed | 5 | Yes for runtime policy |
| Should retrieval calls be audited? | Evidence retrieval may expose raw participant/source material. | Audit all, audit raw only, no audit | Audit raw evidence retrieval and provider-backed interactions; at minimum log IDs/scopes, not full sensitive payloads unless already governed | 4 | Yes for raw evidence retrieval |
| Can Stage Copilots recommend actions that write state? | Recommendations are useful, but writes need governance. | No recommendations, routed recommendations, autonomous actions | Allow typed routed recommendations that open governed UI; no autonomous writes | 5 | Yes for action model |
| How should challenge level and explanation depth be configured per stage? | A useful thinking partner should challenge weak assumptions without overstepping stage authority or sounding like a decision-maker. | Fixed product default, per-stage profile, admin-adjustable setting, PromptSpec-only behavior | Use per-stage profile defaults controlled by Stage Copilot PromptSpecs; do not expose admin-adjustable challenge levels until behavior is proven | 4 | Yes for foundation profile design |
| How should Stage System Knowledge be versioned? | Copilot explanations of gates, contracts, proof logic, and feature behavior must match the product version. | Static prose, code-derived docs, versioned knowledge map, PromptSpec-only text | Use a versioned Stage System Knowledge reference per profile; do not rely only on freeform prompt text | 4 | Yes before provider-backed production runtime |
| How should advisory what-if analysis be labelled? | Hypotheticals are valuable but can be mistaken for official analysis results. | No what-if mode, plain text caveats, explicit advisory labels, separate mode | Allow what-if discussion with explicit advisory labels and no writes; consider a visible mode later | 5 | Yes for runtime response policy |

## J. Final Recommendation

Build the Stage Copilot foundation only after the conversational product model is reflected in the foundation design. The foundation must be designed for stage-scoped reasoning conversation, not static help or answer lookup.

Build next:

1. The Stage Copilot foundation contracts: profiles, conversational behavior controls, Stage System Knowledge references, Stage Case Data Context references, PromptSpec categories, context bundle shapes, retrieval seam contract, advisory what-if boundary, routed recommendation model, and read/write/refusal policy.
2. The stage context bundle/read-model plan, including stage system knowledge inputs, case data context inputs, redaction, original evidence retrieval pointers, and evidence anchor requirements.
3. The shared dock shell as a stage-aware host with no provider chat, designed to support multi-turn reasoning later.
4. A deterministic/mock read-only harness to validate profile routing, refusals, citations, routed recommendations, challenge behavior, trade-off explanations, and advisory what-if handling.
5. The first real provider-backed pilot after the above foundation, recommended as Pass 6 Analysis / Package Copilot.

Do not build yet:

- Static-only help as a substitute for Copilot.
- A generic workspace chatbot.
- Live provider chat before profile/context/retrieval/action boundaries.
- Provider-backed runtime before context/retrieval/refusal/action boundaries.
- New APIs/routes/components for Copilot runtime before the shared architecture is clear.
- Any autonomous write behavior.
- Any retrieval/RAG/vector DB implementation.
- Any PromptSpec changes.
- Any data model changes.
- Any Pass 7/client/finalization Copilot.
- A Pass 6-only model that cannot generalize to Pass 2-5.

Why:

- The product direction is a cross-stage Stage Copilot family.
- The intended product behavior is a discussable, stage-scoped thinking partner, not Q&A over data.
- Pass 6 and Pass 5 are useful existing patterns, but they should plug into a shared architecture rather than define it alone.
- Original evidence retrieval is essential, but it must be designed as a governed seam before implementation.
- Separating Capability PromptSpecs from Stage Copilot PromptSpecs prevents admins from confusing analysis behavior with conversational support behavior.
- Stage Copilot PromptSpecs should control conversational support behavior, not business rules, gates, state transitions, provider execution, or source-of-truth records.

Risk if ignored:

- The shared dock becomes a generic chatbot.
- Static help gets mistaken for the intended Copilot product.
- The Copilot can answer isolated questions but cannot support real admin reasoning.
- Stage authority and data boundaries blur.
- Raw participant/source evidence can leak across stages.
- Copilot recommendations may be mistaken for business decisions.
- PromptOps becomes confusing and unsafe.
- Pass 6 assumptions may distort Pass 2-5 and future Pass 7 Copilots.
- Later retrieval/RAG work may become expensive to retrofit because IDs, anchors, and evidence basis were not designed up front.
