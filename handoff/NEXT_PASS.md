# Next Pass Handoff

## Current Status

Pass 5 — Participant Session Outreach / Narrative-First Clarification is accepted, closed, integrated into `main`, and archived.

Final source branch: `codex/pass5-block0-1-contracts`

Integration method: fast-forward merge into `main`, conflict-free.

The final archive commit is recorded in `handoff/CURRENT_STATE.md`.

Final Pass 5 archive/reference document:

- `handoff/PASS5_FINAL_ARCHIVE_REFERENCE.md`
- safe for later Project Resource upload

## Next Pass

The active pass is Pass 6.

Pass 6 Block 0 is accepted as the documentation-only build readiness gate.

Pass 6 Block 1 — Core Contracts and Schema Seams is accepted.

Pass 6 Block 2 — Persistence and Repository Layer is accepted.

Pass 6 Block 3 — Pass 6 Admin Configuration and Policy Control Layer is accepted.

Pass 6 Block 4 — Pass 6 Prompt Workspace / PromptOps Layer is accepted.

Pass 6 Block 5 — Provider Execution and Prompt Test Harness Foundation is accepted.

Pass 6 Block 6 — 6A SynthesisInputBundle Builder is accepted.

Pass 6 Block 7 — 6A Admin Bundle Review Surface is accepted.

Pass 6 Block 8 — 6B Method Registry and Analysis Policy is accepted.

Pass 6 Block 9 — 6B Workflow Unit and Claim Pipeline is accepted.

Pass 6 Block 10 — 6B Difference Interpretation and Multi-Lens Engine is accepted.

Pass 6 Block 11 — 6B Workflow Assembly and Claim-Basis Map is accepted.

Pass 6 Block 12 — 6B Seven-Condition Evaluation and Workflow Readiness Result is the current completed implementation block pending acceptance.

Technical Decomposition v4 is the active Pass 6 build map.

Build Spec Structure v1 is active.

Older parked Pass 6 / 7 / 8 / 9 block maps are historical only if they conflict with the current Pass 6 live reference, Technical Decomposition v4, the Pass 5 final archive, or the Implementation Handoff Plan.

## Pass 6 Block 0 Acceptance Gate

Block 0 is documentation-only.

- Technical Decomposition v4 is active.
- Build Spec Structure v1 is active.
- Old block maps are historical.
- No source implementation has started.
- Next implementation step after acceptance is Block 1 — Core Contracts and Schema Seams.

## Pass 6 Block 1 Acceptance Gate

Block 1 is contract/schema/type work only.

- Pass 6 core seam contracts are defined in `packages/contracts`.
- Validators and TypeScript types are exported from `@workflow/contracts`.
- `scripts/prove-pass6-block1-contracts.mjs` validates representative good fixtures and rejects invalid required folder, decision, enum, and identity fields.
- No behavior implementation starts in Block 1.
- Next implementation step after acceptance is Block 2 — Persistence and Repository Layer.

## Pass 6 Block 2 Acceptance Gate

Block 2 is persistence/repository work only.

- Pass 6 Block 1 contract records have in-memory repository support.
- Pass 6 Block 1 contract records have SQLite-backed repository support through the existing persistence entry point.
- Repository operations store supplied records only: save, findById, findByCaseId, findAll, and update.
- No analysis, scoring, routing, package eligibility, prompt behavior, visual rendering, Copilot behavior, or Pass 7 mechanics start in Block 2.
- Next implementation step after acceptance is Block 3 — Pass 6 Admin Configuration and Policy Control Layer.

## Pass 6 Block 3 Acceptance Gate

Block 3 is admin-visible configuration and policy control only.

- Pass 6 configuration profiles are versioned and persisted.
- Draft, active, previous, and archived lifecycle states are supported.
- Active-vs-draft comparison is available as structured output.
- Locked governance rules are visible but cannot be edited through admin configuration.
- Admin UI/API surfaces inspect and control configuration only.
- No 6A builder, 6B analysis, scoring execution, readiness routing execution, Pre-6C behavior, 6C generation, Prompt Workspace, provider execution, visual-core integration, Copilot, or Pass 7 mechanics start in Block 3.
- Next implementation step after acceptance is Block 4 — Pass 6 Prompt Workspace / PromptOps Layer.

## Pass 6 Block 4 Acceptance Gate

Block 4 is Prompt Workspace / PromptOps work only.

- Pass 6 PromptSpecs are structured, versioned, persisted, and admin-visible.
- Draft, active, previous, and archived lifecycle states are supported for PromptSpecs.
- Deterministic compiled prompt preview is available from structured sections.
- Active-vs-draft comparison is available at structured-section level.
- Offline Prompt Workspace test case records can be created and linked to PromptSpecs.
- PromptSpecs may hold provider/model preference references, but no provider execution or production AI calls occur in Block 4.
- PromptSpecs do not own scoring weights, method registry truth, readiness thresholds, package eligibility, review/release decisions, locked governance rules, or state transitions.
- No provider execution, production AI calls, 6A builder, 6B analysis, scoring execution, readiness routing execution, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, or Pass 7 mechanics start in Block 4.
- Next implementation step after acceptance is Block 5 — Provider Execution and Prompt Test Harness Foundation.

## Pass 6 Block 5 Acceptance Gate

Block 5 is provider-backed Prompt Workspace test harness work only.

- Stored Pass 6 PromptSpecs can be tested against stored Prompt Workspace test cases.
- PromptSpecs are compiled deterministically before execution and the compiled prompt snapshot is stored with each result.
- Prompt test execution results are persisted with provider/model, prompt version, test case, input fixture summary, output/failure, timing, and runtime metadata fields.
- Token usage is captured and persisted when providers return it; missing token usage and unavailable cost estimates are represented explicitly with visible reasons.
- Missing provider configuration and provider failures are persisted as visible failed results.
- OpenAI / GPT is the default Pass 6 text test provider unless explicitly changed later by the operator.
- Draft-vs-active provider test comparison is available when both execution results exist.
- Prompt test outputs are inspection records only and do not become 6A evidence, 6B claims, readiness results, Pre-6C inquiries, 6C package content, visual graph data, Copilot state, or Pass 7 candidates.
- No production 6A/6B provider runs, 6A builder, 6B analysis, scoring execution, readiness routing execution, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, or Pass 7 mechanics start in Block 5.
- Next implementation step after acceptance is Block 6 — 6A SynthesisInputBundle Builder.

## Pass 6 Block 6 Acceptance Gate

Block 6 is 6A SynthesisInputBundle preparation only.

- Accepted Pass 5 participant/session outputs can be collected for a case.
- Accepted Pass 5 material is sorted into the four approved `SynthesisInputBundle` folders.
- Role/layer context and conservative truth-lens context are attached where available.
- Open, risk, disputed, defective, low-confidence, unresolved, and candidate-only material is preserved without becoming workflow truth.
- Document/source signals remain signals only and are not operational truth by default.
- The builder trusts Pass 5 processing status and does not redo extraction, evidence validation, transcript approval, or clarification questions.
- No provider calls, 6B claim formation, scoring execution, method registry execution, difference interpretation, workflow assembly, seven-condition evaluation, readiness routing, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, or Pass 7 mechanics start in Block 6.
- Next implementation step after acceptance is Block 7 — 6A Admin Bundle Review Surface.

## Pass 6 Block 7 Acceptance Gate

Block 7 is the 6A admin review surface only.

- Admins can list `SynthesisInputBundle` records.
- Admins can retrieve bundle detail by ID.
- Admins can build a new bundle from eligible accepted Pass 5 outputs without mutating Pass 5 source records.
- Bundle detail displays identity, preparation summary, all four approved folders, role/layer context, truth-lens context, risk/open/candidate-only items, and document/source signals.
- Document/source signals are shown as signals only and not operational truth.
- Boundary warnings state that 6A preparation has occurred but no workflow synthesis, readiness evaluation, or package generation has occurred.
- No approve-as-truth, promote-to-synthesis-truth, claim generation, scoring, readiness, package generation, visual, Copilot, provider, or Pass 7 action is exposed in Block 7.
- Next implementation step after acceptance is Block 8 — 6B Method Registry and Analysis Policy.

## Pass 6 Block 8 Acceptance Gate

Block 8 is method registry and analysis policy only.

- All seven required methods/lenses/tools are listed and admin-visible.
- Each method has method ID/key, display name, type, definition, use cases, required inputs, expected outputs, impact mapping, limitations, hard boundaries, active/inactive status, version, and admin-facing description.
- Default method selection rules are represented for process structure, boundary, triangulation, policy-vs-practice, responsibility, multi-perspective, and vocabulary problem types.
- Conditional multi-lens policy is represented without executing analysis.
- Method active/inactive state is configurable through the existing Pass 6 configuration profile.
- Method usage traceability shape supports system-selected and admin-forced markers for later blocks.
- Locked method boundaries are visible and not editable as behavior rules.
- No workflow unit extraction, claim formation, scoring execution, difference interpretation, workflow assembly, seven-condition evaluation, readiness routing, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, Pass 7 mechanics, or provider calls start in Block 8.
- Next implementation step after acceptance is Block 9 — 6B Workflow Unit and Claim Pipeline.

## Pass 6 Block 9 Acceptance Gate

Block 9 is workflow unit and workflow claim pipeline work only.

- A `SynthesisInputBundle` can be transformed into `WorkflowUnit` records.
- Important workflow units can be transformed into typed `WorkflowClaim` records.
- Claims preserve bundle ID, source unit IDs, source context, truth-lens context, and evidence/source basis.
- Document/source signal material remains warning/proposed signal-only material unless later supported by participant evidence.
- Unresolved, disputed, defective, unmapped, low-confidence, and candidate-only material does not become accepted for assembly.
- Advisory confidence/materiality indicators do not approve readiness or package eligibility.
- Claims are not final workflow truth.
- No difference interpretation, workflow assembly, seven-condition evaluation, readiness routing, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, Pass 7 mechanics, or provider calls start in Block 9.
- Next implementation step after acceptance is Block 10 — 6B Difference Interpretation and Multi-Lens Engine.

## Pass 6 Block 10 Acceptance Gate

Block 10 is difference interpretation and method-usage traceability only.

- Workflow claims can be compared into advisory `DifferenceInterpretation` records.
- `AnalysisMethodUsage` records are persisted using registered Block 8 method cards.
- Completion, variant, normative/reality mismatch, and factual conflict classifications are supported.
- Method selection starts with the primary method and uses secondary lenses only for conditional triggers.
- Method usage supports both `system_selected` and `admin_forced` records with suitability/limitation notes.
- Document/source signals remain signals and do not override participant evidence by default.
- Factual conflicts are not auto-resolved or merged into a clean workflow.
- Routes are advisory only and do not create Pass 7 records.
- No workflow assembly, seven-condition evaluation, readiness routing, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, Pass 7 mechanics, or provider calls start in Block 10.
- Next implementation step after acceptance is Block 11 — 6B Workflow Assembly and Claim-Basis Map.

## Pass 6 Block 11 Acceptance Gate

Block 11 is workflow assembly and claim-basis mapping only.

- `WorkflowClaim` and `DifferenceInterpretation` records can be assembled into an `AssembledWorkflowDraft`.
- Accepted claims contribute to draft steps, sequence, decisions, handoffs/responsibility, controls, and systems/tools where appropriate.
- Completion differences enrich workflow understanding without deciding readiness.
- Variant differences remain visible as variants and are not flattened into a fake linear flow.
- Normative/document-vs-reality mismatches remain warning/caveat material.
- Factual conflicts remain unresolved/review-needed and are not auto-resolved.
- Document/source claims remain source signals/caveats unless supported by participant evidence.
- `claimBasisMap` preserves claim, source unit, participant/session/layer, truth-lens, method usage, difference, and evidence/source basis traceability.
- `workflowUnderstandingLevel` is produced as assembly metadata only and does not decide readiness or 6C eligibility.
- No seven-condition evaluation, readiness routing, Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, Pass 7 mechanics, or provider calls start in Block 11.
- Next implementation step after acceptance is Block 12 — 6B Seven-Condition Evaluation and Workflow Readiness Result.

## Pass 6 Block 12 Acceptance Gate

Block 12 is seven-condition evaluation and workflow readiness bridge work only.

- An `AssembledWorkflowDraft` can be evaluated into a `SevenConditionAssessment`.
- All seven condition keys are evaluated exactly once using the object-map contract.
- Each condition includes status, rationale, basis, and `blocksInitialPackage`.
- A `WorkflowReadinessResult` is produced with readiness decision, gap/risk summary, `allowedUseFor6C`, routing recommendations, analysis metadata, and `is6CAllowed`.
- 6C is allowed only for `ready_for_initial_package` or `ready_for_initial_package_with_warnings`.
- Non-blocking warnings and automation-readiness weaknesses do not automatically block workflow documentability.
- Material factual conflicts require review decision; missing essential detail requires clarification; materially broken sequence/boundary blocks 6C by default.
- Document/source claims do not make a condition clear by default unless supported by participant/reality basis.
- No Pre-6C behavior, 6C generation, visual-core integration, Copilot runtime behavior, Pass 7 mechanics, or provider calls start in Block 12.
- Next implementation step after acceptance is Block 13 — 6B Methodology / Analysis Report and Admin Evaluation Surface.

## Active Pass 6 Block Map

0. Pass 6 Build Readiness and Spec Cleanup.
1. Core Contracts and Schema Seams.
2. Persistence and Repository Layer.
3. Pass 6 Admin Configuration and Policy Control Layer.
4. Pass 6 Prompt Workspace / PromptOps Layer.
5. Provider Execution and Prompt Test Harness Foundation.
6. 6A SynthesisInputBundle Builder.
7. 6A Admin Bundle Review Surface.
8. 6B Method Registry and Analysis Policy.
9. 6B Workflow Unit and Claim Pipeline.
10. 6B Difference Interpretation and Multi-Lens Engine.
11. 6B Workflow Assembly and Claim-Basis Map.
12. 6B Seven-Condition Evaluation and Workflow Readiness Result.
13. 6B Methodology / Analysis Report and Admin Evaluation Surface.
14. Pre-6C Gap Closure, Inquiry Gate, and Question Generation.
15. Cross-Department / External Interface Handling.
16. 6C Output Governance and Package Generation.
17. Visual Core Integration.
18. Pass 6 Conversational Copilot.
19. Pass 7 Candidate Seam.
20. Full Pass 6 Live Proof and Archive Closure.

## Conceptual Closure Confirmed

- 6A is conceptually closed.
- 6B is conceptually closed.
- Pre-6C Gate is conceptually closed.
- Cross-Department / External Interface Governance is conceptually closed.
- 6C is conceptually closed.
- Visual Core integration is technically defined enough for later Block 17.

These statements are planning/handoff closure only. They do not mean contracts, persistence, UI, prompts, provider execution, analysis logic, visual integration, Copilot, or Pass 7 mechanics have been implemented.

## Provider Direction To Preserve

Text intelligence and prompt execution:

- default provider: OpenAI / GPT
- default model example: `gpt-5.4`
- applies to participant guidance, first-pass extraction, clarification formulation, answer recheck, Admin Assistant / Section Copilot, and complex scenario validation

Google remains the provider direction for:

- voice / speech-to-text
- image and OCR-style capabilities
- earlier Google-backed surfaces where already accepted

Gemini text provider may remain configurable, but it is not the default for Pass 5 or next-stage text reasoning unless the operator explicitly changes that direction later.

Embeddings keep the existing provider direction unless explicitly changed later.

No real provider keys, Telegram bot tokens, or local `.env.local` values are recorded here.

## Workflow / Visual-Core Boundary For Block 17

- WDE owns workflow truth, package eligibility, and WorkflowGraph JSON construction.
- `workflow-visual-core` owns validation and rendering only.
- WDE must implement `buildPackageVisuals(graph)` later as a local wrapper using `validateWorkflowGraph`, `toMermaid`, and `toReactFlow`.
- Do not implement this in Block 0.

## Boundaries

- Do not implement contracts in Block 0.
- Do not implement persistence in Block 0.
- Do not implement UI in Block 0.
- Do not implement Prompt Workspace in Block 0.
- Do not implement provider execution in Block 0.
- Do not implement 6A, 6B, Pre-6C, 6C, Visual Core, Copilot, or Pass 7 behavior in Block 0.
- Do not fake provider success.
- Do not commit `.env.local` or secrets.
