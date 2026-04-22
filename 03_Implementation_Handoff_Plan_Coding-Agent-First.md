# Implementation Handoff Plan — Coding-Agent-First

## 1. Handoff Intent

This handoff converts the approved execution logic into a direct implementation path for coding agents.
It tells agents:
- what is being built
- how the repository should be shaped
- how modules should be separated
- how build passes should be sequenced
- what must be validated at each pass
- what authority boundaries must never be crossed

This handoff is explicitly written for a coding-agent-first workflow.

## 2. Official Build Assumptions

- **TypeScript-first repository**
- **GitHub-centered workflow**
- **full-feature admin surface from day one**
- **minimal visual UI treatment**
- **single-admin operationally in v1**, with later structural extensibility for roles
- **Python sidecar is not a day-one dependency**
- **Python sidecar may be added later only if earned by a concrete workload**
- **all major logic remains modular, patchable, and token-efficient**

The UI is full-featured in operational scope, but visually minimal.

## 3. Core Build Principles

### 3.1 Module-first
Implementation is organized around responsibility-bounded modules.

### 3.2 Local repair first
Bugfixes and refinements should normally be possible by opening one module or a nearby bounded group, not the whole repository.

### 3.3 Token-efficient maintenance
Repository shape and file boundaries should help coding agents understand local context without loading the full system every time.

### 3.4 No silent invention
If required behavior is not justified by the execution spec, the coding agent must stop and surface the ambiguity.

### 3.5 Full feature surface, minimal UI polish
All agreed admin features should exist early, but UI polish is deferred.

### 3.6 Shared core, feature-local interaction
Core governance logic stays in shared packages. Admin interaction stays local to features in the admin app.

## 4. Official Repository Shape

```text
apps/
  admin-web/

packages/
  contracts/
  core-state/
  core-case/
  sources-context/
  sessions-clarification/
  synthesis-evaluation/
  packages-output/
  review-issues/
  prompts/
  domain-support/
  integrations/
  persistence/
  shared-utils/
```

The goal is not many micro-packages. The goal is a small number of meaningful package boundaries.

## 5. Package Ownership Map

### 5.1 `apps/admin-web`
Owns:
- admin routes and pages
- forms and action surfaces
- prompt workspace UI
- issue discussion UI
- package preview UI
- case/source/session/package admin navigation

Does not own:
- state machine rules
- workflow reconstruction logic
- contract definitions
- package eligibility logic
- prompt registry truth

### 5.2 `packages/contracts`
Owns:
- JSON Schemas
- TypeScript types
- validation contracts
- shared cross-module interfaces
- seam contracts between packages

Does not own business logic.

### 5.3 `packages/core-state`
Owns:
- state families
- transition rules
- transition guards
- override policy boundaries
- release-state separation
- review-state separation

### 5.4 `packages/core-case`
Owns:
- case lifecycle coordination
- readiness coordination
- rollout coordination
- cross-module case flow

### 5.5 `packages/sources-context`
Owns:
- source intake and registration
- timing tags
- source typing
- company context handling
- functional classification
- reference suitability preparation

### 5.6 `packages/sessions-clarification`
Owns:
- session record lifecycle
- narrative-first capture structure
- extraction updates
- clarification targets
- follow-up persistence
- boundary and unknown markers
- session readiness signals

Does not own cross-participant synthesis.

### 5.7 `packages/synthesis-evaluation`
Owns:
- common-path formation
- difference blocks
- higher-level enrichment
- synthesis outputs
- workflow evaluation against the seven conditions
- readiness outcomes

Does not own session lifecycle.

### 5.8 `packages/packages-output`
Owns:
- Initial Package generation
- Final Package generation
- as-is vs target-state comparison generation
- output shaping logic

### 5.9 `packages/review-issues`
Owns:
- issue briefs
- issue discussion model
- review states
- review actions
- issue grouping
- release approval support objects

### 5.10 `packages/prompts`
Owns:
- prompt registry
- structured prompt specs
- compiled prompt generation
- prompt explainability data
- prompt review packets
- prompt versioning metadata
- overlays and boundary rules

### 5.11 `packages/domain-support`
Owns:
- light base domain packs
- optional deeper packs
- non-authoritative domain-support boundaries
- domain-support metadata

### 5.12 `packages/integrations`
Owns:
- Anthropic adapter
- Ollama adapter
- optional Whisper/OCR/local-model adapters later

These adapters do not own business rules.

### 5.13 `packages/persistence`
Owns:
- repositories
- storage adapters
- audit persistence
- DB models/mappers
- storage abstractions

### 5.14 `packages/shared-utils`
Owns only narrow generic helpers. It must not become a dumping ground.

## 6. Critical Boundary Notes

The following boundaries are non-negotiable:
- current reality vs target state
- review vs release
- package state vs release state
- company truth vs domain support
- session/clarification vs synthesis/evaluation
- prompt logic vs state logic

## 7. Shared Contract Seams

Important seams should be explicit inside `packages/contracts`.

### 7.1 Session → Synthesis seam
Define normalized contracts such as:
- `SessionForSynthesis`
- `ClarificationOutcome`
- `BoundarySignal`
- `UnresolvedItem`

### 7.2 Synthesis → Evaluation seam
Define contracts such as:
- `SynthesisInputBundle`
- `DifferenceBlock`
- `WorkflowCompletenessSignals`

### 7.3 Evaluation → Package seam
Define contracts such as:
- `InitialPackageInput`
- `FinalPackageInput`
- `ReadinessDecision`
- `ResidualItemSet`

### 7.4 Review / Release seams
Define contracts such as:
- `IssueBrief`
- `IssueDiscussionThread`
- `ReviewAction`
- `ReleaseApprovalRecord`

### 7.5 Prompt Registry / Runtime seam
Define contracts such as:
- `PromptSpec`
- `CompiledPrompt`
- `PromptReviewPacket`
- `PromptExecutionContext`

## 8. Admin Web Feature Surface

The admin web app should expose all agreed operational features from day one, in minimal UI form.

### 8.1 Case management
- create case
- view/edit case framing
- domain/department/use-case setup
- case status visibility

### 8.2 Source management
- upload sources
- classify sources
- inspect source role
- timing tags
- see domain-support vs company-truth distinction

### 8.3 Prompt workspace
- prompt registry list
- prompt detail view
- structured prompt spec view/edit
- compiled prompt preview
- prompt history
- test/review packet support

### 8.4 Session viewer
- participant session list
- raw input/transcript view
- extraction view
- clarification history
- boundary and unresolved markers

### 8.5 Issue discussion
- issue brief viewer
- scoped discussion surface
- linked evidence context view
- final action controls

### 8.6 Package preview
- initial package preview
- final package preview
- as-is vs target-state comparison
- release/readiness status visibility

### 8.7 Admin configuration
- domain selection and management
- department/use-case configuration
- prompt family/version selection where allowed
- lightweight global settings

### 8.8 State and review visibility
- case states
- package states
- review states
- release states
- audit-style event view

## 9. Build Pass Strategy

Build in small passes that always leave the system more inspectable from the admin UI.
No pass should create hidden capability with no inspection path unless it is a tiny internal dependency.

### 9.1 Pass ordering principle
Each pass should:
- build one narrow capability area
- expose that capability to the admin surface quickly
- validate contracts and boundaries immediately
- avoid broad multi-area implementation in one sweep

### 9.2 Pass scope principle
A pass may include a small bundle of directly linked modules only when that bundle is required for meaningful testing.
Otherwise keep scope local.

## 10. Validation Per Pass

Every pass should define validation targets such as:
- contract validation
- transition validation
- package readiness validation
- prompt registry validation
- admin UI inspection validation
- traceability validation

A pass is complete when its intended behavior can be inspected and verified.

## 11. Coding Agent Operating Rules

### 11.1 One primary builder rule
Use one primary writing agent per pass.
Additional agents may review, test, critique, or patch, but should not all write the same pass in parallel.

### 11.2 Reviewer / fixer pattern
Optional roles:
- primary builder
- architecture reviewer
- test / bugfix reviewer
- prompt/skill reviewer

### 11.3 No broad rewrite rule
A coding agent must not rewrite large unrelated areas simply because it found a more elegant pattern.
Patch locally unless structural repair is truly necessary.

### 11.4 Stop rule
The agent must stop and surface ambiguity when:
- a transition rule is unclear
- a package seam is unclear
- a contract is unclear
- a change would cross authority boundaries
- a prompt-governed behavior has no approved registry/contract basis

### 11.5 Assumption reporting rule
Every pass must state:
- what was built
- why this scope was chosen
- assumptions made
- what was intentionally deferred

## 12. GitHub Workflow Rules

### 12.1 Branch strategy
Use pass-scoped branches or PRs rather than broad open-ended branches.

### 12.2 Commit granularity
Commits should be narrow enough that the next agent can understand the change without re-reading the whole repository.

### 12.3 PR expectation
A PR or pass review should state:
- packages changed
- features exposed in admin UI
- contracts touched
- validations performed
- known limitations

### 12.4 Avoiding multi-agent chaos
Do not assign overlapping writing authority to multiple agents on the same pass unless one is explicitly patching after the other.

## 13. Optional Local Model / Tool Extensions

Optional local tools may be added later through `packages/integrations` only, for example:
- Whisper for transcription
- local OCR helpers
- Gemma / Gemini local adapters
- other optional local AI helpers

These tools may assist preprocessing but must not own state transitions, review logic, package eligibility, or workflow truth.

## 14. First Build Sequence

### Pass 1 — Repository Skeleton + Contracts Foundation
Build:
- repo scaffold
- package structure
- base toolchain
- contracts package foundation
- minimal admin shell routing skeleton

Expose in UI:
- shell navigation placeholders
- health/status view

Validate:
- workspace resolution
- contract loading
- app-package imports

### Pass 2 — State Core + Case Core + Minimal Case UI
Build:
- `core-state`
- `core-case` baseline lifecycle
- case configuration contracts
- case creation and case viewer UI

Expose in UI:
- create case
- view case framing
- state visibility

Validate:
- state transition guards
- case lifecycle persistence
- admin inspection of state

### Pass 3 — Source Intake + Context Handling + Source UI
Build:
- `sources-context`
- source registration logic
- source typing/timing tags
- company context handling
- domain-support registration boundary

Expose in UI:
- upload sources
- source list
- source detail view
- context/domain-support distinction visibility

Validate:
- source inventory updates
- timing tags
- classification storage

### Pass 4 — Prompt Registry + Prompt Workspace
Build:
- `prompts` baseline
- structured prompt spec model
- compiled prompt preview support
- prompt explanation record

Expose in UI:
- prompt registry list
- prompt detail page
- structured prompt fields
- compiled prompt preview

Validate:
- prompt spec load/save
- registry integrity
- explainability fields visible

### Pass 5 — Participant Session + Clarification UI
Build:
- `sessions-clarification`
- session contracts
- extraction storage model
- clarification object model

Expose in UI:
- session viewer
- raw input view
- extraction view
- clarification history view

Validate:
- session lifecycle
- clarification objects
- boundary signal persistence

### Pass 6 — Synthesis + Evaluation + Initial Package
Build:
- `synthesis-evaluation`
- session-to-synthesis seam
- evaluation outputs
- initial package generation in `packages-output`

Expose in UI:
- synthesis summary view
- evaluation/readiness view
- initial package preview

Validate:
- seam contracts
- seven-condition evaluation logic
- initial package rendering

### Pass 7 — Review / Issue Discussion
Build:
- `review-issues`
- issue brief model
- discussion thread model
- action handling

Expose in UI:
- issue list
- issue detail
- discussion surface
- action controls

Validate:
- review-state flow
- action result persistence
- linked evidence views

### Pass 8 — Final Package + Release
Build:
- `FinalPackageRecord` type + validator in contracts (literal §29.8 fields)
- final package assembly helpers in `packages/packages-output`
- current-state vs target-state separation per §24.13
- residual-gaps visibility
- release-state transition wiring in `packages/core-state` using existing `ReleaseState`
- final package repository + in-memory implementation in `packages/persistence`

Expose in UI:
- final package list / detail / creation surface
- release approval controls
- clear separation between final package content, release approval state, and residual items

Validate:
- final package contract fields (all literal from §29.8)
- release approval gate (§25.16 explicit admin approval required)
- current-state vs target-state structural separation
- release-state transition enforcement

### Pass 9 — Integrations and Optional Local Helpers
Build:
- Anthropic adapter
- Ollama adapter
- optional local helper adapters as needed

Expose in UI:
- provider status/config visibility where useful

Validate:
- adapter wiring
- boundary safety
- no governance leakage into integrations

## 15. Done Criteria for Initial Build

The initial build is successful when:
- all agreed admin features exist in minimal UI form
- all critical core packages exist and are wired
- state transitions are enforced
- source handling is inspectable
- prompt registry is inspectable and editable in structured form
- session/clarification/synthesis/evaluation flow is inspectable
- initial and final package previews exist
- issue discussion exists
- review/release separation is visible
- no major governance behavior is hidden in uncontrolled places

## 16. Known Guardrails

Coding agents must not:
- merge state logic into UI pages
- bury review or release logic inside prompt execution helpers
- let domain-support material affect blocking or package eligibility
- merge session lifecycle with synthesis ownership
- move persistence decisions into shared-utils
- create large “god services” that absorb multiple package responsibilities
- over-polish UI early at the expense of feature completeness and inspection value

### Output Formalization Boundary

Output formalization (client-facing wording, document naming, section-label normalization, enterprise-safe presentation) is a non-governing enhancement layer. It is safe to apply to:
- `packages/packages-output` — output assembly and wording
- `apps/admin-web` output surfaces — package preview rendering

It must NOT be applied to:
- `packages/core-state` — state transition logic
- `packages/core-case` — case lifecycle rules
- review-state or release-state logic
- package-entry conditions or eligibility rules
- governance contracts in `packages/contracts`

Prompt reinforcement belongs to a separate later prompt-rebuild/analysis-improvement track — not to output formalization work and not to Pass 8.

## 17. Interface Risk Notes

### 17.1 `sessions-clarification` ↔ `synthesis-evaluation`
These two areas are closely linked in the execution spec.
Do **not** solve this by merging both packages.
Solve it through:
- explicit shared contracts in `packages/contracts`
- strict ownership boundaries
- normalized session output for synthesis
- normalized synthesis output for evaluation

### 17.2 Why they remain separate
- `sessions-clarification` owns participant-local evidence and follow-up lifecycle
- `synthesis-evaluation` owns cross-participant interpretation and workflow judgment

Merging them reduces short-term friction but increases long-term token cost, repair complexity, and authority blur.

### 17.3 What a coding agent must watch here
If a pass changes:
- clarification outcome structure
- unresolved item structure
- boundary signal structure
- synthesis input assumptions

then the agent must inspect the seam contracts before patching implementation.
