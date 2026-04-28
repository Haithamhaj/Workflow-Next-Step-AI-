# Stage Copilot Prompt Control Simplification Plan

## 1. Executive Summary

The current Stage Copilot foundation is safe from an analysis-engine standpoint, but it has started to model Copilot conversational behavior too structurally. The right correction is not to break the existing contracts now. The right correction is to reframe the current structured fields as compatibility and guard metadata, then add a later, smaller Copilot System Prompt reference/content layer for editable stage-specific custom instructions.

There are two separate prompt systems:

- Capability / Analysis System Prompts: the existing official analysis prompt system in `packages/prompts`. It controls extraction, hierarchy drafting, targeting, clarification, synthesis, evaluation, and package-related capabilities. It already has draft/active/previous/archived lifecycle patterns, compiled previews, tests, and promotion controls in several areas. It must not be simplified, renamed, merged, or affected by Stage Copilot work.
- Stage Copilot System Prompts: a future separate prompt layer for stage-scoped conversational behavior. It controls personality, tone, directness, challenge behavior, explanation style, question-asking style, and recommendation-vs-decision language. It must not run official analysis, mutate records, change gates, alter evidence trust, or change package eligibility.

The minimal correction path is:

1. Leave Capability PromptSpecs untouched.
2. Leave current `StageCopilotProfile` schema intact for compatibility.
3. Treat `conversationalBehaviorProfile` as optional/internal control metadata in future design, not the primary authoring surface.
4. Add later local `packages/stage-copilot` types for `copilotSystemPromptRef` and default system prompt fixtures before persistence or UI.
5. Keep guardrails in `packages/stage-copilot` as hard boundaries that prompt content cannot override.

## 2. Two Prompt Systems Clarification

### A. Capability / Analysis System Prompts

Capability / Analysis System Prompts are the official prompts used by provider-backed stage capabilities and analysis workflows.

They do work such as:

- Source understanding and source-role/scope suggestion.
- Hierarchy drafting and source-to-hierarchy triage.
- Targeting recommendation packets and question-hint seed generation.
- Evidence extraction.
- Clarification question formulation.
- Answer recheck.
- Synthesis.
- Difference interpretation.
- Evaluation.
- Package drafting and optional document support.

Where they live today:

- `packages/prompts/src/index.ts` owns the prompt registry and PromptSpec helper logic.
- Pass 3 uses `StructuredPromptSpec` for hierarchy drafting and source-to-hierarchy triage.
- Pass 4 uses `StructuredPromptSpec` for targeting rollout prompt capability.
- Pass 5 uses `PASS5_PROMPT_FAMILY`, base governance, and capability prompt names including `admin_assistant_prompt`.
- Pass 6 uses `PASS6_PROMPT_CAPABILITY_KEYS`, `Pass6PromptSpec`, structured sections, compiled preview, prompt tests, draft/active/previous/archived lifecycle, and provider-backed test execution.

Current lifecycle/control behavior:

- Draft save and explicit promotion patterns exist for Pass 3, Pass 4, and Pass 6.
- Compiled prompt preview exists for structured PromptSpecs and Pass 6 PromptSpecs.
- Active-vs-draft provider test comparison exists in several Prompt Workspace flows.
- Previous/archived prompt states exist in Pass 6 and related prompt workflows.
- Prompt test results are stored as inspection records and must not become official evidence or package output.

Why they must not be touched:

- They are the official analysis prompt system.
- Changes can alter extraction, clarification, synthesis, evaluation, readiness, package output, or provider behavior.
- Their lifecycle and proof scripts protect production analysis behavior.
- They are not the right place to store Stage Copilot personality/custom-instruction text.

### B. Stage Copilot System Prompts

Stage Copilot System Prompts are a future separate layer for each stage's conversational assistant behavior.

They control:

- Personality and tone.
- Reasoning style.
- Directness.
- How much the Copilot challenges the admin.
- How it explains risks, uncertainty, and missing evidence.
- How it discusses alternatives and what-if scenarios.
- How it asks follow-up questions.
- How it separates recommendation from decision.
- How it stays inside stage boundaries.

They do not control:

- Official analysis execution.
- State transitions.
- Gate approvals.
- Evidence trust.
- Readiness.
- Package eligibility.
- Prompt promotion in the Capability PromptSpec system.
- Provider execution for extraction/synthesis/evaluation/package workflows.

How they relate to stage context:

- The editable Copilot System Prompt tells the assistant how to behave conversationally.
- Stage system context supplies stage purpose, boundaries, contracts, gates, rules, allowed context, and hard restrictions.
- Stage case context supplies current read-only case/stage data references and summaries.
- Guardrails enforce read-only/no-write/no-execution behavior regardless of prompt text.

Why they must not alter analysis behavior:

- They are conversational support instructions, not capability instructions.
- The Copilot can discuss, critique, compare, and explain official outputs, but it cannot become the execution path for creating or changing those outputs.

## 3. Current Over-Modeling Diagnosis

The existing Stage Copilot foundation correctly protects boundaries, but some conversational behavior is over-modeled as enum-driven profile structure.

### `conversationalBehaviorProfile`

Current fields:

- `supportsMultiTurnDiscussion`
- `supportsAdvisoryWhatIfReasoning`
- `supportsChallengeCritique`
- `supportsMethodLensExplanation`
- `separatesRecommendationFromDecision`
- `explanationDepth`
- `challengeLevel`
- `directness`
- `alternativesBehavior`
- `uncertaintyHandling`
- `citationBehavior`

Diagnosis:

- The support booleans are useful as capability/eligibility metadata.
- The style enums are too limited to be the primary behavior-control mechanism.
- Admins should be able to write natural language custom instructions for a stage Copilot.

Recommendation:

- Stay unchanged now for compatibility.
- Treat support booleans as safety/control metadata.
- Treat style enums as optional UI metadata or defaults later.
- Move actual personality, tone, challenge style, answer structure, and reasoning style into editable Copilot System Prompt content.
- Do not make breaking schema changes now.

### `advisoryModePolicy`

Diagnosis:

- This is not over-modeled in the same way. It is a hard safety policy.
- Fields such as `advisoryOnly`, `labelHypotheticals`, and `prohibitedOutcomes` are boundary controls.

Recommendation:

- Keep unchanged.
- Continue enforcing advisory-only behavior in `packages/stage-copilot`.
- Let editable Copilot System Prompt describe how to phrase what-if discussion, but never whether it can mutate official state.

### Refusal policy

Diagnosis:

- Refusal categories are boundary/security metadata.
- The Copilot System Prompt can shape the wording of refusals, but should not decide which categories are refused.

Recommendation:

- Keep unchanged.
- Treat refusal policy as system-controlled guard metadata.
- Add future prompt guidance only for refusal tone and redirect style.

### Citation behavior

Diagnosis:

- Current `citationBehavior` is partly conversational style and partly evidence-safety behavior.

Recommendation:

- Split conceptually later:
  - Evidence/citation requirement remains in `evidenceAccessPolicy`, `retrievalScope`, and audit policy.
  - Citation wording and verbosity moves into Copilot System Prompt.
- Keep schema unchanged now.

### PromptSpec taxonomy fields

Diagnosis:

- `StageCopilotPromptSpecKind`, classifications, legacy mappings, projection status, migrated flags, renameAllowed, and runtimeBehaviorChanged are still useful compatibility metadata.
- The term `Stage Copilot PromptSpec` may be heavier than needed for the simplified model.

Recommendation:

- Keep for now.
- In future docs/UI, label the Stage Copilot item as "Copilot System Prompt" for admins.
- Avoid migrating existing `admin_assistant_prompt`, `pass5.admin_assistant`, or `pass6_analysis_copilot` into the new model until explicitly scoped.

## 4. Correct Simplified Model

Each stage should eventually have:

- `stageKey`
- Editable Copilot System Prompt
- Stage system context
- Stage case context
- Read-only boundary
- Forbidden actions
- Context access strategy
- Audit requirements

Editable Copilot System Prompt controls:

- Personality.
- Tone.
- Reasoning style.
- Challenge behavior.
- Answer structure.
- Follow-up question style.
- How alternatives are discussed.
- How recommendations are phrased.
- How uncertainty is explained.

System/stage context controls:

- Stage details.
- Contracts.
- Rules.
- Gates.
- Allowed context.
- Restricted context.
- Hard safety boundaries.
- No-write restrictions.
- Official action restrictions.
- Evidence access policy.
- Retrieval/data access declarations.
- Audit requirements.

The Copilot runtime should eventually combine:

1. Platform/system safety instructions.
2. Stage system context.
3. Editable Copilot System Prompt.
4. Read-only Stage Copilot context envelope.
5. User/admin message.

The editable Copilot System Prompt is subordinate to platform safety, stage boundaries, and package guards. If it asks for write authority, provider execution, official analysis reruns, or prompt mutation, the guard layer must reject the behavior.

## 5. Prompt Ownership Model

### Option A - Store Copilot System Prompts in `packages/prompts`

What it produces:

- A single prompt package that stores both analysis PromptSpecs and Copilot System Prompts.

Risk level: high.

Compatibility risk:

- High risk of mixing the two systems.
- Admins may confuse analysis prompt edits with Copilot personality edits.
- The package already owns compile/test/provider-adjacent behavior.

Future editability:

- Strong, but too coupled to analysis prompt lifecycle.

Proof strategy:

- Would require strict no-key-rename checks, no Capability PromptSpec mutation checks, no compile/provider execution checks, and separate UI labels.

Recommendation:

- Do not use as the first implementation path.

### Option B - Store Copilot System Prompts in a future Copilot profile store

What it produces:

- A dedicated future persistence layer for Stage Copilot profiles and editable Copilot System Prompts.

Risk level: medium.

Compatibility risk:

- Low for Capability PromptSpecs if kept separate from `packages/prompts`.
- Medium because persistence introduces migration/schema choices.

Future editability:

- Strong.

Proof strategy:

- Prove Copilot prompt writes only affect Copilot profile records, not Capability PromptSpecs or analysis outputs.

Recommendation:

- Good later target, not the immediate next slice.

### Option C - Store Copilot System Prompt content directly in `StageCopilotProfile`

What it produces:

- Profile becomes self-contained with prompt content.

Risk level: medium to high.

Compatibility risk:

- Contract becomes content-heavy.
- System prompts may require lifecycle/audit without being global contracts.
- Frequent prompt edits would churn shared contract/profile records.

Future editability:

- Simple initially, awkward later.

Proof strategy:

- Validate content fields, no write authority, and no Capability PromptSpec references mutated.

Recommendation:

- Avoid as the primary model.

### Option D - Contracts store only prompt references; content lives elsewhere

What it produces:

- `StageCopilotProfile` points to a Copilot System Prompt record/default without embedding full prompt text.

Risk level: low to medium.

Compatibility risk:

- Low if references are clearly separate from Capability PromptSpec refs.

Future editability:

- Strong once a dedicated store exists.

Proof strategy:

- Validate refs, prove content storage is separate, prove Capability PromptSpecs unchanged.

Recommendation:

- Best target model.

### Option E - Static defaults first, persistence later

What it produces:

- Default Copilot System Prompt fixtures or local package definitions per stage, with no persistence or UI yet.

Risk level: low.

Compatibility risk:

- Low if kept in `packages/stage-copilot` and not in `packages/prompts`.

Future editability:

- Limited initially, but can migrate to a profile store later.

Proof strategy:

- Static fixtures only, no provider/runtime behavior, no Capability PromptSpec mutation, no prompt registry import.

Recommendation:

- Safest immediate next implementation path.

## 6. Separation from Capability PromptSpecs

The separation rule should be absolute:

- Capability / Analysis System Prompts live in the existing PromptSpec system.
- Stage Copilot System Prompts live in a separate Copilot-owned profile/default system.
- Capability prompt edits must not change Copilot personality.
- Copilot prompt edits must not change analysis prompts.

Guardrails:

- Do not store Copilot System Prompt content in `PASS6_PROMPT_CAPABILITY_KEYS`.
- Do not add Copilot System Prompt content to `PASS5_PROMPT_FAMILY`.
- Do not rename `admin_assistant_prompt`, `pass5.admin_assistant`, or `pass6_analysis_copilot`.
- Do not treat legacy/current copilot-like prompts as migrated.
- Do not let Copilot prompt control own gates, states, evidence trust, readiness, package eligibility, or provider execution.
- Do not let Copilot prompt content modify draft/active/previous/archived Capability PromptSpec lifecycle.

Current codebase implications:

- `packages/prompts/src/index.ts` contains official capability prompt behavior and provider-adjacent compile/test paths. Future Copilot System Prompt defaults should not be implemented there first.
- `packages/stage-copilot` currently imports only `@workflow/contracts` types and local code. That makes it the safer place for static Copilot System Prompt defaults and references.
- Existing contract taxonomy can keep representing capability refs and stage-copilot refs, but the admin-facing label should be "Copilot System Prompt" rather than "analysis PromptSpec".

## 7. Stage-by-Stage Copilot Prompt Control Model

### Pass 2 / Sources & Context Copilot

Editable Copilot System Prompt controls:

- How skeptical it is about source value.
- How it explains source limitations.
- How directly it challenges unsupported source assumptions.
- How it phrases context-only vs analysis-useful distinctions.

System/stage context provides:

- Source purpose, boundaries, source-role rules, intake/crawl/extraction refs, pre-hierarchy readiness rules, source trust restrictions.

May discuss:

- Why a source is limited value, what context-only means, what evidence supports a source role, what is missing.

Must not mutate:

- Source records, crawl status, extracted text, structured context, pre-hierarchy review, source trust, or source-role suggestions.

### Pass 3 / Hierarchy Copilot

Editable Copilot System Prompt controls:

- How it explains inferred vs confirmed structure.
- How it challenges hierarchy assumptions.
- How it discusses alternatives for reporting lines and external/internal interfaces.

System/stage context provides:

- Hierarchy contracts, source-to-hierarchy triage refs, node/readiness refs, approval boundaries, structural rules.

May discuss:

- Why a role/source link exists, what is inferred, what happens if an interface is treated differently.

Must not mutate:

- Hierarchy drafts, source hierarchy links, triage suggestions, readiness snapshots, or structural approvals.

### Pass 4 / Targeting Copilot

Editable Copilot System Prompt controls:

- How it explains participant recommendation strategy.
- How it compares frontline vs supervisor sequencing.
- How it challenges weak coverage or contact assumptions.

System/stage context provides:

- Targeting rules, candidate refs, contact profile status, question-hint seed refs, rollout boundaries.

May discuss:

- Why a participant was suggested, what question hints came from which source, what sequencing trade-off is safer.

Must not mutate:

- Candidate decisions, contact profiles, question-hint seeds, rollout transitions, or targeting plans.

### Pass 5 / Participant Evidence Copilot

Editable Copilot System Prompt controls:

- How carefully it discusses participant evidence.
- How it challenges admin interpretations.
- How it phrases missing/uncertain evidence and follow-up suggestions.

System/stage context provides:

- Evidence access policy, transcript/evidence refs, clarification rules, extraction/recheck outputs, dispute/boundary refs, handoff rules.

May discuss:

- What a participant actually said, which evidence is disputed, whether a boundary signal is useful, what to ask next and why.

Must not mutate:

- Transcript approvals, evidence approval/rejection, extraction outputs, clarification candidates, clarification answers, rechecks, boundary signals, handoff decisions, or participant messages.

### Pass 6 / Analysis / Package Copilot

Editable Copilot System Prompt controls:

- How it explains method/lens choices.
- How strongly it challenges weak package readiness.
- How it structures what-if analysis and caveat explanation.

System/stage context provides:

- Synthesis/evaluation/package contracts, method registry refs, readiness/gate refs, package refs, advisory-only policy.

May discuss:

- Why a method was selected, why a blocker matters, what would change under a different workflow boundary, what evidence supports a caveat.

Must not mutate:

- Synthesis, difference interpretation, evaluation, readiness, gates, package eligibility, package output, final package release, or Pass 7 review actions.

### Prompt Studio Copilot

Editable Copilot System Prompt controls:

- How it explains prompt-system separation.
- How direct it is about prompt-edit risk.
- How it guides admins through Copilot prompt editing without implying analysis changes.

System/stage context provides:

- Prompt taxonomy, Capability PromptSpec refs, Copilot System Prompt refs, lifecycle boundaries, prompt test result refs.

May discuss:

- Difference between Capability PromptSpecs and Copilot System Prompts, why a prompt test failed, what a Copilot prompt edit changes and does not change.

Must not mutate:

- Capability PromptSpecs, Copilot prompt records unless in a future governed editor, prompt promotion, prompt tests, provider execution, or prompt registry keys.

### Advanced / Debug Copilot

Editable Copilot System Prompt controls:

- How technical and direct the debug explanation is.
- How it separates debug evidence from business truth.
- How it routes admins to owning surfaces.

System/stage context provides:

- Provider job refs, proof refs, route/action ownership refs, debug-only data classifications, audit boundaries.

May discuss:

- What a provider job failure means, which route owns an action, whether a proof output is debug-only or business logic.

Must not mutate:

- Provider jobs, persistence, prompts, analysis outputs, proofs, routes, or source-of-truth records.

## 8. Impact on Existing Contracts

### Fields that should stay

- `stageKey`
- `runtimeMode`
- `capabilityPromptSpecRefs`
- `stageCopilotPromptSpecRefs`
- `contextBundleRefs`
- `systemKnowledgeRefs`
- `caseContextRefs`
- `retrievalScope`
- `contextDataAccessStrategy`
- `refusalPolicy`
- `advisoryModePolicy`
- `routedRecommendationTypes`
- `forbiddenActions`
- `readWriteBoundary`
- `evidenceAccessPolicy`
- `auditRequirements`

These fields represent stage identity, context, safety, read/write boundaries, evidence access, and audit rules. They are still valid in the simplified model.

### Fields that should become optional later

- `conversationalBehaviorProfile`

This should become optional/internal metadata later because the editable Copilot System Prompt should be the primary conversational control surface. For compatibility, leave it required now.

### Fields that should be treated as internal guard metadata

- Support booleans in `conversationalBehaviorProfile`.
- `advisoryModePolicy`.
- `refusalPolicy`.
- `readWriteBoundary`.
- `forbiddenActions`.
- `evidenceAccessPolicy`.
- `retrievalScope`.
- `contextDataAccessStrategy`.

These should not be presented as the main admin authoring surface for Copilot behavior.

### Fields to supplement later

Add later, preferably in a small additive contract or local package slice:

- `copilotSystemPromptRef`
- `copilotSystemPromptContent`
- `copilotSystemPromptStatus`
- `copilotSystemPromptVersion`
- `copilotSystemPromptUpdatedAt`
- `copilotSystemPromptUpdatedBy`

Recommended approach:

- Start with `copilotSystemPromptRef` and static defaults in `packages/stage-copilot`.
- Add content storage only when persistence/editing is explicitly scoped.
- Avoid embedding large prompt text in the shared profile contract until lifecycle/audit requirements are clear.

### Schema simplification timing

Do not simplify the schema now.

Reason:

- Existing proof scripts validate the current required structure.
- Breaking the schema would churn accepted foundation work without adding product behavior.
- The product correction can be represented first by documentation and a future additive `copilotSystemPromptRef`/default layer.

## 9. Impact on `packages/stage-copilot`

The current package still fits the simplified model.

`boundary.ts` should remain safety-focused:

- Read-only boundary enforcement.
- No autonomous write enforcement.
- Forbidden action detection.
- Routed recommendation safety.
- Advisory what-if labeling.
- Runtime mode safety.
- Provider execution prohibition.
- Prompt mutation prohibition.
- Analysis record mutation prohibition.
- Package eligibility/readiness/source-of-truth mutation prohibition.

`context-envelope.ts` should remain context/safety-focused:

- Stage identity.
- Scope refs.
- System knowledge refs.
- Case context refs.
- Data access and retrieval declarations.
- Evidence/source refs.
- Prompt/test refs.
- Blocker/warning summaries.
- Advisory-safe notes.
- Audit refs.
- Boundary status.

What should change later:

- Add Copilot System Prompt reference/default types to `packages/stage-copilot`, not to `packages/prompts`.
- Make clear by naming that these are Copilot custom instructions, not analysis PromptSpecs.
- Keep all helpers pure.
- Do not let prompt content influence boundary checks.

What should not change:

- Do not import stage packages, `packages/prompts`, persistence, integrations, or apps.
- Do not add provider execution.
- Do not add runtime chat.
- Do not add UI/API.
- Do not add retrieval or DB query behavior.

## 10. Future Control Surface

The future admin-facing control surface should be separate from Capability PromptSpec workspaces.

Likely controls:

- Stage selector: Sources & Context, Hierarchy, Targeting, Participant Evidence, Analysis / Package, Prompt Studio, Advanced / Debug.
- Editable Copilot System Prompt editor for the selected stage.
- System-provided stage context preview: stage purpose, boundaries, rules, gates, allowed context, forbidden actions.
- Hard boundary summary: read-only, no autonomous writes, no provider execution, no official analysis reruns, no package eligibility changes.
- Context access summary: allowed read scopes, evidence access level, retrieval/data access declarations.
- Prompt separation banner: "This changes Copilot conversation behavior only. It does not change official analysis prompts."
- Draft/active behavior later if needed.
- Test prompt later if needed, but only against fixture/read-only context and without provider execution until explicitly approved.

What must not be shown as editable in the Copilot control surface:

- Capability PromptSpec body fields.
- Pass 3/4/5/6 prompt family keys.
- Provider execution settings.
- Gate rules.
- Readiness rules.
- Evidence trust rules.
- Package eligibility rules.

## 11. Corrected Build Order

### Slice 1 - Copilot System Prompt reference/default plan implementation

- Purpose: align foundation vocabulary with editable Copilot System Prompts without touching Capability PromptSpecs.
- Files/packages likely touched: `packages/stage-copilot/src/*`, proof script under `scripts/`.
- Produces: local `StageCopilotSystemPromptRef` or similarly named types, static default prompt metadata per stage, and proof that these are separate from Capability PromptSpecs.
- Must not do: modify `packages/prompts`, contracts, PromptSpecs, prompt keys, provider runtime, UI, persistence, or APIs.
- Proof strategy: fixture-only proof, no `@workflow/prompts` import, no capability prompt key mutation, no provider/runtime imports.
- Risk level: low.

### Slice 2 - Optional additive contract ref

- Purpose: add `copilotSystemPromptRef` to `StageCopilotProfile` only if a shared contract boundary is required.
- Files/packages likely touched: `packages/contracts/src/types/stage-copilot.ts`, schema, exports, foundation proof.
- Produces: reference field only, not prompt content storage.
- Must not do: break existing profile fixtures or make Copilot prompt content required.
- Proof strategy: backward-compatible optional field fixtures and invalid fixtures for misusing capability refs as Copilot prompt refs.
- Risk level: medium.

### Slice 3 - Static default Copilot System Prompts

- Purpose: define default stage Copilot custom instructions as static fixtures.
- Files/packages likely touched: `packages/stage-copilot/src/*`, proof script.
- Produces: one default per stage, clearly labeled as conversation behavior only.
- Must not do: compile prompts, call providers, import `packages/prompts`, or create runtime behavior.
- Proof strategy: static content scan for prohibited authority claims; guard checks prove prompt content cannot grant writes.
- Risk level: low.

### Slice 4 - Read-only prompt-control context envelope extension

- Purpose: let future context envelopes reference Copilot System Prompt refs and static defaults.
- Files/packages likely touched: `packages/stage-copilot/src/context-envelope.ts`.
- Produces: prompt-control refs in context envelope summaries.
- Must not do: add Prompt Studio UI or persistence.
- Proof strategy: context proof verifies Copilot prompt refs are reference-only and cannot change Capability PromptSpecs.
- Risk level: low.

### Slice 5 - Future persisted Copilot profile store

- Purpose: support editable Copilot System Prompts.
- Files/packages likely touched: future persistence/contracts/app routes after explicit approval.
- Produces: draft/active or simple versioned Copilot prompt records.
- Must not do: reuse analysis PromptSpec lifecycle without clear separation, mutate `packages/prompts`, or run providers.
- Proof strategy: Copilot prompt edits alter only Copilot prompt records; Capability PromptSpecs remain byte-for-byte unchanged.
- Risk level: medium.

### Slice 6 - Future admin control surface

- Purpose: let admins edit stage Copilot System Prompts.
- Files/packages likely touched: app/UI/API after explicit approval.
- Produces: separate Copilot prompt editor with boundary preview.
- Must not do: edit Capability PromptSpecs or imply analysis behavior changes.
- Proof strategy: UI route tests, no analysis prompt API calls, visual baseline, no provider calls.
- Risk level: medium to high.

## 12. Proof Strategy

Later implementation should prove:

- Copilot System Prompt edits do not alter Capability PromptSpecs.
- `packages/prompts` files and exports remain unchanged unless explicitly scoped.
- Existing keys remain unchanged:
  - `admin_assistant_prompt`
  - `pass5.admin_assistant`
  - `pass6_analysis_copilot`
  - `PASS5_PROMPT_FAMILY`
  - `PASS6_PROMPT_CAPABILITY_KEYS`
- Stage Copilot remains read-only.
- Safety guards reject forbidden actions even if prompt content says otherwise.
- Prompt content cannot grant write authority, provider execution, retrieval execution, DB execution, official analysis reruns, prompt promotion, readiness mutation, package eligibility mutation, or package generation.
- Stage context remains system-controlled and separate from editable behavior instructions.
- No provider/runtime/UI behavior is accidentally introduced in contract/package slices.
- Existing analysis proof scripts still pass when relevant.
- Existing Stage Copilot proofs still pass:
  - foundation contracts proof
  - static taxonomy projection proof
  - foundation package proof
  - context envelope proof

Recommended proof cases for the next slice:

- Valid: static Copilot System Prompt ref per stage.
- Valid: Copilot prompt content controls tone/challenge/answer structure only.
- Valid: profile can reference Copilot System Prompt separately from capability refs.
- Invalid: Copilot System Prompt claims it may mutate records.
- Invalid: Copilot System Prompt claims it may run providers.
- Invalid: Copilot System Prompt claims it may change readiness/package eligibility.
- Invalid: Copilot System Prompt is stored as or mapped to a Capability PromptSpec key.
- Invalid: Copilot System Prompt edit attempts to rename existing prompt keys.

## 13. Risks, Open Questions, and Required Decisions

Critical risks:

- Mixing Stage Copilot System Prompts into the existing Capability PromptSpec registry too early.
- Letting Copilot prompt edits appear to change analysis behavior.
- Treating `pass6_analysis_copilot` as the future architecture authority.
- Making `conversationalBehaviorProfile` the admin's primary authoring surface instead of natural-language Copilot custom instructions.
- Allowing prompt text to override hard read-only/no-execution boundaries.

Non-critical risks:

- Keeping redundant structured style metadata for a few slices.
- Admin UI labeling confusion between "PromptSpec" and "Copilot System Prompt".
- Over-building draft/active lifecycle for Copilot prompts before simple editability needs are clear.

Operator decisions needed:

- Should the next implementation add local `StageCopilotSystemPromptRef`/default types in `packages/stage-copilot` before any contract changes?
- Should Copilot System Prompts eventually have draft/active lifecycle, or a simpler versioned custom-instructions model?
- Should static defaults be authored as one prompt per stage immediately, or start with one Prompt Studio default first?
- Should admin-facing terminology be "Copilot System Prompt", "Copilot Instructions", or "Stage Copilot Instructions"?

Deferred items:

- Persistence for editable Copilot prompts.
- Prompt Studio UI for Copilot prompt editing.
- Provider-backed Copilot runtime.
- Runtime prompt assembly.
- Stage-specific context assemblers.
- Retrieval/search.
- Migration or deprecation of old copilot-like prompts.

## 14. Final Recommendation

Do not simplify or touch the Capability / Analysis System Prompt system. It is the official analysis prompt layer and must remain protected.

Keep the current Stage Copilot contracts and proofs unchanged for now. Treat the existing structured conversational fields as compatibility and safety metadata, not the main product control surface.

The next implementation slice should be a small local `packages/stage-copilot` addition for Copilot System Prompt references and static default custom-instruction fixtures per stage. It should prove that Copilot System Prompts are separate from Capability PromptSpecs, cannot mutate analysis behavior, and cannot override read-only/no-execution boundaries.

Do not implement persistence, UI, runtime chat, provider execution, retrieval, or any PromptSpec changes in that next slice.
