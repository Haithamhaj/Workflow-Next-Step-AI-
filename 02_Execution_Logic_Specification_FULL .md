# Execution Logic Specification — Rebuilt Structure Draft v1

## 1. Build Governance Method

### 1.1 Correctness-Critical-First Rule

This specification must be filled in a correctness-first order rather than a convenience-first order.
The first fill priority is any logic that materially affects whether the system behaves correctly, stops correctly, escalates correctly, or releases outputs correctly.

This includes at minimum:

* fixed vs configurable logic
* case configuration rules
* readiness gates
* review and issue-handling logic
* failure and fallback logic
* state logic
* output eligibility logic

Only after these are sufficiently explicit may lower-risk descriptive or convenience layers be expanded.

### 1.2 No Free Invention by Coding Agents

Coding agents are not allowed to invent:

* new workflow states
* new package eligibility rules
* new blocking logic
* new review triggers
* new release conditions
* new authority boundaries
* new interpretation rules that materially change project behavior

If a required logic element is still unresolved, the agent must stop and surface the ambiguity rather than silently filling it with its own assumptions.

### 1.3 Fixed vs Configurable Logic Rule

Every major logic element in the build must be classified as one of the following:

* locked logic
* admin-configurable logic
* prompt-configurable logic
* deferred logic

No important behavior should remain in an undefined middle state.

### 1.4 Module-First Construction Rule

The build must be implemented through isolated modules by responsibility, not through one monolithic logic body.
Any major behavior should belong to a clear module boundary so it can be reviewed, changed, or replaced with minimal collateral impact.

### 1.5 Traceability-to-Source Rule

Every build-critical rule should be traceable back to:

* the locked main reference
* the build translation notes file
* or both

If later behavior cannot be traced back to an agreed source, it should be treated as unapproved invention rather than valid implementation.

### 1.6 Admin-Control Visibility Rule

Every variable that materially changes system behavior should be visible through a controlled admin-facing configuration surface rather than being buried invisibly in code or prompts.

This applies especially to:

* domain selection
* department selection
* use-case configuration
* prompt behavior families
* follow-up behavior settings
* channel settings when configurable
* release controls where applicable

### 1.7 Change-Isolation and Modular Editability Rule

The build should assume that later changes will happen.
Therefore:

* local changes should remain local whenever possible
* one changed module should not force unnecessary rewrites across unrelated modules
* prompts, configuration, contracts, and state logic should be separable enough for targeted revision

### 1.8 Human-Governed Exception and Issue-Escalation Rule

The system must not assume it can predict every problematic case in advance.
Whenever it cannot resolve an issue with sufficient confidence, and whenever the issue materially affects workflow continuity, completeness, or output eligibility, it must surface the issue to the admin instead of deciding silently.

Such surfaced issues must support:

* explanation
* source diagnosis
* impact visibility
* recommendation
* corrective direction
* admin discussion
* explicit admin action

### 1.9 Phase-Based Build Rule

This specification should be filled and later built in phases:

**Phase 1 — Core Build Kernel**
Fill and stabilize the correctness-critical core first.

**Phase 2 — Full End-to-End Completion**
Complete the broader execution flow once the core rules are stable.

**Phase 3 — Prompt Chain Extraction**
Extract the module-linked and decision-linked prompt chain only after the execution logic is sufficiently stabilized.

## 2. Document Purpose and Scope

### 2.1 Purpose of This Specification

This specification exists to translate the approved project logic into an execution-safe build reference.
Its purpose is to make the system buildable without leaving correctness-critical behavior to silent invention by coding agents, prompts, or ad hoc implementation choices.

In practical terms, this specification defines:

* how the case should be framed and governed
* how sources should enter and affect the case
* how workflow knowledge should be captured, clarified, synthesized, and evaluated
* how packages should be formed, reviewed, and released
* how prompts, states, contracts, and admin controls should remain governed

### 2.2 What This Specification Is Not

This specification is not:

* a market-facing product brief
* a full UI design document
* a technical solution-architecture document for automation implementation
* an API specification
* an RPA design document
* a general brainstorming note

It may inform those later artifacts, but it does not replace them.

### 2.3 Start Boundary

This specification begins at the point where a case is being framed for the system.
That includes:

* company/context intake
* domain, department, and use-case configuration
* source intake and registration
* hierarchy preparation
* readiness and rollout logic

It assumes that the product thesis and strategic direction already exist in the locked main reference.

### 2.4 End Boundary

This specification ends at the point where the execution logic is sufficiently defined for:

* implementation handoff
* coding-agent build usage
* prompt-chain extraction
* downstream build-oriented artifacts

It does not extend into full implementation code, production deployment operations, or later technical automation design.

### 2.5 Included Logic Scope

This specification includes at minimum:

* build-governance rules
* source hierarchy and traceability rules
* modular architecture rules
* case configuration logic
* source registration and classification logic
* hierarchy and rollout logic
* participant session logic
* clarification, synthesis, and evaluation logic
* initial and final package logic
* management inquiry logic
* review, issue-handling, failure, channel, and state logic
* contract, prompt, and change-control logic

### 2.6 Deferred or Excluded Build Concerns

The following are deferred or excluded unless later explicitly added:

* detailed UI mockups and interaction design systems
* production infrastructure specifics
* detailed database schema design beyond contract-level meaning
* automation-execution architecture
* API design for downstream systems
* RPA mapping
* full analytics, KPI, or monitoring architecture
* operational staffing or delivery-process planning for deployment

This keeps the document focused on execution logic rather than implementation sprawl.

## 3. Governing Source Hierarchy

### 3.1 Locked Main Reference as Source of Truth

The locked main reference remains the primary source of truth for:

* project thesis
* output philosophy
* workflow-first operating direction
* human-governed control logic
* reference-to-reality / reality-to-reference direction
* the seven critical completeness conditions
* major package philosophy

When later implementation wording is uncertain, the locked main reference outranks downstream interpretation.

### 3.2 Build Translation Notes as Implementation-Translation Layer

Where build translation notes exist, they serve as an implementation-translation layer between the locked main reference and this execution specification.

Their role is to:

* clarify implementation-oriented meaning
* record local decisions made during execution formalization
* preserve reasoning about buildability when the locked reference is strategically correct but not yet mechanically explicit

Build translation notes do not outrank the locked main reference.

### 3.3 Execution Specification as Formalized Build Layer

This execution specification is the formalized build layer derived from the approved source set.
Its job is to turn approved logic into explicit execution behavior.

It may contain:

* direct restatements of locked logic
* implementation formalizations of locked logic
* explicitly labeled execution extensions where the locked reference did not specify enough mechanical detail

This distinction must remain visible rather than hidden.

### 3.4 Contradiction Handling Rule Between Sources

If a contradiction appears between the locked main reference, build translation notes, and this execution specification, the handling order must be:

1. check whether the execution specification introduced an unjustified implementation assumption
2. check whether the build translation notes clarified rather than contradicted the locked reference
3. resolve in favor of the locked main reference when the conflict touches governed core logic
4. surface the contradiction explicitly rather than silently choosing convenience

### 3.5 Controlled Future Correction Rule

Future correction is allowed, but only through controlled patching.
A correction should preserve traceability to:

* what source logic was being protected
* what section changed
* whether the change was a restatement, formalization, or explicit execution extension

Silent correction without source traceability is not acceptable.

## 4. Traceability System

### 4.1 Reference-Linking Method

Every correctness-relevant rule in this specification should remain traceable to at least one of the following:

* locked main reference
* build translation notes
* explicit implementation decision made during execution formalization

The goal is not citation theater.
The goal is to prevent untracked logic drift.

### 4.2 Section-Link Notation

Section-level traceability should allow a rule, contract, prompt, or later implementation artifact to point back to the relevant section of this execution specification.

This means section numbering and section identity matter operationally, not cosmetically.
If numbering changes later, references must be updated rather than left stale.

### 4.3 Decision-Block Notation

Where a section contains a discrete execution decision, later build work should be able to reference that decision block rather than only the document in general.

This is especially important for:

* state transitions
* package eligibility
* review gates
* prompt-governance assumptions
* document-direction logic
* failure and fallback handling

### 4.4 Prompt-Link Notation

Prompt units and prompt groups should remain traceable not only to their own registry identity, but also to the logic sections that justify them.
This enables later prompt review, refinement, and debugging without relying on memory alone.

### 4.5 Change-Impact Rule

When a section changes, the system or reviewer should assess whether nearby sections, prompts, contracts, or build notes depend on it.
The point is not to trigger a full-document review every time.
The point is to catch direct structural dependencies before drift spreads.

### 4.6 Renumbering and Legacy Reference Note

Because the execution specification may evolve through local patches, section numbering may change over time.
When renumbering occurs, the active numbering in the current execution specification becomes the operative reference set.

If legacy numbering existed in earlier working discussions, build notes, or prompt discussions, those legacy references should be treated as historical only and updated when brought forward into active use.

This note exists to prevent hidden traceability drift after insertion, splitting, or reordering of sections.

### 4.7 Implementation-Extension Labeling Rule

Not every execution detail in this specification comes from the locked main reference in the same way.
For traceability and honesty, later review should distinguish between:

* **locked-source restatement** — directly aligned restatement of already approved source logic
* **implementation formalization** — a more explicit execution rendering of logic already present in principle
* **execution extension** — a new execution-safe addition introduced because the locked reference did not define enough mechanical detail

Execution extensions are allowed only when they do not contradict governed source logic and when they are made visible as extensions rather than disguised as original source text.

## 5. Core Architectural Principles

### 5.1 Workflow-First Principle

The system is workflow-first.
Its first responsibility is to reconstruct, clarify, and stabilize real operational workflow understanding.
It is not a prompt-first toy, a chatbot-first product, or an automation-execution engine.

### 5.2 Operator-Led Principle

The case is operator-led.
The operator/admin frames the case, controls rollout, injects context and evidence, reviews issues, and remains the active owner of major transitions and final approvals.

### 5.3 Human-Governed Principle

The system may interpret, draft, and recommend, but it is not the final authority on high-impact ambiguity, review-sensitive issues, or release decisions.
Human review remains a real control layer, not a decorative fallback.

### 5.4 LLM-First with Rule Gates Principle

The LLM is used where interpretation, drafting, extraction, and structured reasoning are strong fits.
Deterministic rules govern transitions, gates, eligibility, release control, and other correctness-critical behavior.

This principle prevents the model from becoming the silent governor of the system.

### 5.5 Channel-as-Transport-Only Principle

Channels such as WhatsApp, Telegram, web intake, or email are transport/adaptor layers only.
They may carry interaction, but they do not own the product’s core analytical logic or governance logic.

### 5.6 Configurability and Modularity Principle

The system must remain modular and selectively configurable.
Where behavior is intended to vary, that variability should be visible and controlled.
Where behavior is locked, it must not drift through hidden prompt changes, code convenience, or undocumented overrides.

### 5.7 Build-Correctness Principle

Execution logic must be defined clearly enough that builders and coding agents do not need to invent core governance behavior.
The system should be explainable, patchable, and testable in ways that preserve correctness rather than hiding it behind flexible wording.

## 6. Top-Level Build Modules

### 6.1 Reference and Traceability Core

This module area governs:

* source hierarchy interpretation
* traceability rules
* reference-linking behavior
* distinction between locked-source restatement, implementation formalization, and execution extension

It protects the build from silent logic drift.

### 6.2 Admin Configuration Layer

This module area governs:

* domain selection
* department selection
* use-case framing
* admin-visible configurable behavior
* controlled overrides where allowed
* prompt-related admin controls where permitted

It should not absorb locked execution logic.

### 6.3 Ingestion Layer

This module area governs:

* source intake
* source registration
* timing tags
* case-linked source inventory
* extraction-status tracking

Its responsibility is intake discipline, not deeper workflow judgment by itself.

### 6.4 Context and Reference Processing Layer

This module area governs:

* company/context handling
* functional document classification
* context-only vs operational relevance
* reference suitability preparation
* reference-set preparation

It prepares sources for meaningful later use without blind reference assumption.

### 6.5 Hierarchy Layer

This module area governs:

* hierarchy intake
* hierarchy drafting
* hierarchy correction
* hierarchy approval
* participant-position mapping
* escalation path grounding

It is foundational for rollout and synthesis.

### 6.6 Pre-Rollout Readiness Layer

This module area governs:

* readiness checks
* reference readiness
* hierarchy readiness
* targeting readiness
* admin rollout approval gating

It determines whether the case is ready to begin participant interaction.

### 6.7 Participant Session Layer

This module area governs:

* participant session creation
* raw input preservation
* narrative-first capture
* extraction structure
* follow-up layer persistence
* boundary and unknown interpretation
* session status and evidence tracking

### 6.8 Clarification and Escalation Layer

This module area governs:

* ambiguity detection
* clarification-target formation
* participant-friendly question generation
* clarification exhaustion
* hierarchy-based escalation
* unresolved/review/critical-gap routing

### 6.9 Synthesis Layer

This module area governs:

* common-path formation
* difference-block preservation
* same-level comparison
* higher-level enrichment
* structural closure toward dependable workflow understanding

### 6.10 Workflow Evaluation Layer

This module area governs:

* workflow-completeness-first judgment
* use of the rubric axes
* interpretation through the seven critical completeness conditions
* derived outcome states such as initial-package readiness or final-package readiness

### 6.11 Package Generation Layer

This module area governs:

* Initial Workflow Package generation
* management-facing inquiry support for finalization
* Final Workflow and Reference Package generation
* current-state vs target-state separation
* comparison-layer generation where relevant

### 6.12 Review and Release Layer

This module area governs:

* issue surfacing
* admin issue discussion
* review triggers
* controlled final actions
* approval gates
* release-state handling

### 6.13 Prompt Registry and Prompt Chain Layer

This module area governs:

* prompt registry
* prompt explainability
* structured prompt specification
* compiled prompt handling
* prompt-chain dependencies
* admin prompt workspace meaning

It supports both execution and later prompt governance.

## 7. Fixed Logic vs Configurable Logic Split

### 7.1 Locked Logic

Locked logic includes any logic that should not be changed per case by ordinary admin configuration because it defines the core behavior of the system.

This includes at minimum:

* workflow-first operating principle
* operator-led model
* human-governed review and approval model
* channel-as-transport-only principle
* hierarchy-required-before-rollout rule
* reference-required-if-available-before-rollout rule
* recommendation-first / draft-later principle
* target-state output appearing only in the Final Package
* the rule that workflow completeness and sequence continuity govern blocking importance
* the rule that unresolved impactful ambiguity must be surfaced to admin rather than silently decided

### 7.2 Admin-Configurable Logic

Admin-configurable logic includes behavior inputs or settings that may vary by case or by operator choice without changing the project’s core operating model.

This includes at minimum:

* company profile input
* domain selection
* main department selection
* sub-department / functional unit entry where used
* use-case selection, editing, or custom naming
* hierarchy input content and hierarchy corrections
* prompt family or prompt version selection if exposed
* operator notes and local assumptions
* participant targeting choices inside the allowed readiness model

### 7.3 Prompt-Configurable Logic

Prompt-configurable logic includes AI behavior overlays that may affect interpretation style, wording, emphasis, or question framing without changing the fixed control model.

Examples include:

* domain overlays
* role-sensitive questioning overlays
* terminology overlays
* clarification style variants
* tone or wording variants for participant-facing messages

Prompt-configurable logic must not override locked logic such as review gates, release gates, state transitions, or blocking rules.

### 7.4 Deferred from Admin Control in v1

Some logic may remain intentionally outside direct admin control in version one to prevent premature complexity or unsafe behavior drift.

This includes at minimum:

* package state machine design
* core blocking thresholds
* final review trigger logic
* core contradiction severity rules
* core state transition rules
* release-eligibility logic

## 8. Case Configuration Layer

### 8.1 Required Inputs at Case Creation

A case should not be considered validly created in version one unless the following minimum inputs exist:

* company profile file or company-context file
* selected domain from the supported domain list
* selected main department from the supported department list
* selected or custom use-case label

These are the minimum creation inputs only.
They do not imply that the case is ready for participant rollout.

### 8.2 Supported Near-Core Inputs

The system should also support near-core inputs that may not be mandatory at the exact moment of case creation but are expected to become important soon after creation.

These include:

* sub-department or functional unit
* operator notes
* available references
* early hierarchy input
* early participant candidates

### 8.3 Not Required at Case Creation

The following are not required to create the case itself:

* full approved hierarchy
* full participant list
* uploaded references in all situations
* final workflow boundary
* final decision tree
* complete role map

These may be added later before readiness gates are passed.

### 8.4 Single-Department Scope Rule for v1

Version one should assume one main department per case.
The initial case must anchor to one main department rather than allowing open multi-department scope from the beginning.

Cross-department interactions may still appear later as:

* dependencies
* interfaces
* handoff points
* clarification targets

But they should not redefine the initial case creation model into a multi-department case engine in v1.

### 8.5 Later Multi-Department Complexity Rule

Multi-department case construction may be added later as an advanced case type.
That later expansion should not complicate the version-one case creation logic.

## 9. Company Profile and Context Source Handling

### 9.1 Governing Handling Philosophy for v1

Version one should use a **hybrid context-handling philosophy** for company profile and company-context sources.

This means:

* such sources should be treated by default as context-shaping and support sources
* they may materially influence interpretation, use-case framing, terminology understanding, and document-direction reasoning
* they must not automatically become primary workflow references merely because they were uploaded early in the case

This preserves both contextual usefulness and analytical discipline.

### 9.2 Accepted Input Forms

Company profile and broader company-context input may be accepted in forms such as:

* company profile file
* company presentation or deck
* business overview
* service catalog
* capability summary
* company introduction material
* operator-written context note when needed

Version one should remain flexible about input form while preserving clear source registration.

### 9.3 Text Extraction Rule

When a company profile or context source is uploaded, the system should extract usable text and preserve the source as a registered case-linked input.

Extraction should support later use in:

* terminology interpretation
* service-model understanding
* use-case framing
* department-language interpretation
* document-direction reasoning when relevant

Extraction should not by itself imply workflow-reference authority.

### 9.4 Context-Shaping Usage Rule

Company profile and company-context sources should be allowed to shape the case in areas such as:

* understanding what the company actually does
* understanding what services are offered
* interpreting domain-specific terms
* interpreting department-specific or company-specific language
* understanding how the selected use case fits into the broader operating environment
* improving later document-direction reasoning

This role is valuable even when the source contains little or no direct workflow structure.

### 9.5 Non-Default Workflow-Reference Classification Rule

A company profile or company-context source must **not** be treated as a primary workflow reference by default.

It may contribute to context, terminology, and framing, but workflow-reference status must still depend on functional content rather than upload order or document label.

If such a source later appears to contain materially useful workflow logic, its classification should be handled through the functional reclassification logic rather than through assumption.

### 9.6 Impact on Later Interpretation

Even when company context remains non-operational by classification, it may still affect later interpretation materially by helping the system:

* avoid misunderstanding business terms
* understand what a workflow step refers to in that company
* understand whether a use case is commercial, operational, service-level-driven, or policy-driven
* understand what kind of final document direction fits the case better

This influence is supportive, not automatically authoritative.

### 9.7 Boundary-Framing Support Rule

Company context may also help with boundary framing when the selected use case depends partly on understanding the service model or broader operating structure of the company.

However, company context should not override stronger workflow evidence from participant narratives, operational references, or approved clarification unless the admin explicitly directs that correction after review.

### 9.8 Traceability Rule for Context Influence

When company profile or context materially influences a later interpretation, the system should preserve traceability that this influence came from a context-shaping source.

This is especially important when context affects:

* terminology interpretation
* use-case framing
* document-direction reasoning
* service-boundary understanding

The system should not allow context influence to remain invisible when it meaningfully shaped later reasoning.

### 9.9 Informational Domain Support Layer Rule

In addition to company-specific sources, version one may support a **non-authoritative informational domain support layer**.
This layer is not a primary source of truth for the case.
It exists only to improve domain understanding, terminology awareness, artifact interpretation, and question quality.

Its role may include helping the system:

* understand domain language more accurately
* recognize common domain artifacts
* draft more intelligent clarification questions
* better interpret workflow statements inside the selected domain
* notice informational red flags or areas worth asking about

It must not be allowed to:

* determine case judgment
* change blocking decisions
* change package eligibility
* override company reality
* impose thresholds, ownership, or workflow truth from general domain knowledge alone
* produce legal or compliance verdicts by itself

### 9.10 Hybrid Domain-Pack Loading Rule

Version one should use a **hybrid domain-support model**.
This means:

* a light base domain-support pack may load automatically when the domain is selected
* deeper domain-support references may be added optionally on a case-by-case basis when the admin believes they will improve understanding

This keeps domain help available without forcing every case to absorb unnecessary external knowledge.

### 9.11 Domain Support Traceability Rule

If informational domain support materially influenced question drafting, terminology interpretation, or workflow reading support, that influence should remain traceable as domain-support influence rather than as company-truth evidence.

This distinction is important because domain support exists for understanding, not for authoritative judgment.

### 9.12 Build Meaning of This Section

This section establishes that company profile/context handling may be complemented by a non-authoritative domain-support layer.
That layer may help the system become more domain-aware, but it remains informational only and must never override case truth.

## 10. Domain, Department, and Use-Case Configuration Logic

### 10.1 Governing Configuration Philosophy for v1

Version one should use a **guided-configuration model**.
This means the system should not begin from fully unstructured free entry for core case framing.
Instead, it should use controlled configuration lists where core comparability and consistency matter, while still allowing limited controlled flexibility where real cases require it.

### 10.2 Domain Selection Model

The selected domain should come from a predefined supported domain list.
The purpose of this rule is to preserve:

* consistency of domain framing
* stable downstream prompt overlays
* cleaner cross-case comparability
* controlled terminology shaping

The system should not treat free-text domain entry as the default operating model in version one.

### 10.3 Main Department Selection Model

The selected main department should also come from a predefined supported department list.
This is necessary because the selected main department affects:

* use-case framing
* hierarchy interpretation
* participant targeting
* rollout order
* synthesis scope
* later document-direction reasoning

Version one should therefore avoid fully open department naming as the default basis of case structure.

### 10.4 Sub-Department / Functional Unit Handling

The system should support sub-department or functional-unit specification when relevant.
However, this should remain subordinate to the selected main department rather than replacing it.

This allows the case to be more specific when useful while still preserving the version-one rule of one main department per case.

### 10.5 Guided Use-Case Selection Model

Use-case selection in version one should use a **guided department-linked list**.
This means:

* available use cases should be linked to the selected main department
* the system should prefer structured selection over totally open initial entry
* the use-case choice should help shape participant targeting, question framing, and later workflow interpretation

The goal is not to force artificial rigidity.
The goal is to prevent weak case framing at the start.

### 10.6 Edited / Custom Use-Case Behavior

Although the default should be guided structured selection, the system must still support:

* edited use-case labels
* custom use-case entry when needed

This flexibility is important because real cases may not always fit the predefined label exactly.

However, custom or edited use cases must remain traceable.
The system should preserve at minimum:

* whether the use case came from the guided list
* whether it was edited from a guided base
* whether it is fully custom
* the final active use-case label

### 10.7 Controlled Flexibility Rule

Version one should therefore use a hybrid configuration rule:

* domain = predefined list
* main department = predefined list
* sub-department / functional unit = supported where useful
* use case = guided list by department, with edit/custom support

This preserves both control and realism.

### 10.8 Why Free-Form Use-Case Entry Must Not Be the Only Model

If use-case definition is fully free-form from the start, several later layers become weaker, including:

* participant targeting consistency
* hierarchy relevance
* prompt overlay alignment
* synthesis framing
* document-direction reasoning

For that reason, guided structure should remain the default even though custom support exists.

### 10.9 Configuration Traceability Rule

The configuration layer should preserve explicit traceability for the selected framing choices.
At minimum, it should remain visible:

* which domain was selected
* which main department was selected
* whether a sub-department or functional unit was added
* which use case was selected or created
* whether the use case was guided, edited, or custom

This is necessary because later workflow interpretation depends directly on these framing decisions.

### 10.10 Relationship to Domain Support Packs

The selected domain may activate a light base domain-support pack for informational assistance.
This pack should remain supportive only and should not alter the governing truth hierarchy of the case.

Deeper domain-support material may be added later by the admin on a case-specific basis when additional domain understanding is useful.

### 10.11 Build Meaning of This Section

This section formalizes an already-decided configuration rule for version one:

* structured where consistency matters
* flexible where real cases require adaptation
* traceable where later analysis depends on the configuration choice
* optionally supported by light domain-aware informational packs that do not override case truth

## 11. Ingestion and Source Registration Logic

### 11.1 File Intake Registration

Every uploaded file or registered source must enter the case through explicit intake registration rather than informal attachment handling.
The system should preserve at minimum:

* source identity
* upload timing
* uploader identity
* source type
* initial processing status
* case linkage

### 11.2 Source Inventory Registration

All sources must remain registered under the case-level source inventory.
Sources should not become isolated round-owned artifacts that are invisible to later analysis.

This means the source inventory should preserve:

* core setup references
* later supporting evidence
* optional contextual sources
* closure-stage supporting sources when later added

### 11.3 Case-Linked Source Model with Timing Tags

In version one, newly uploaded supporting documents should remain **case-linked** rather than being stored as round-owned documents.
However, the system must preserve timing and purpose tags that show when and why the source entered the case.

At minimum, source timing / purpose tagging should support distinctions such as:

* uploaded_at_case_setup
* uploaded_after_round_1
* uploaded_before_reanalysis
* uploaded_before_round_2
* uploaded_during_gap_closure
* uploaded_for_finalization_support

This model keeps the source inventory architecturally clean while preserving analytical traceability.

### 11.4 Round-One Supporting-Evidence Injection Rule

After round one is completed, the admin may optionally upload additional supporting documents.
These documents are not mandatory by default.
They should be treated as optional supporting evidence that may strengthen later analysis when available.

Examples may include:

* quotation samples
* contract samples
* job descriptions
* responsibility documents
* pricing sheets
* approval examples
* HR forms
* dispatch sheets
* operational templates

If no such documents are uploaded, the system should continue normally.
The absence of post-round supporting documents must not be treated as automatic failure.

### 11.5 Re-Analysis Trigger After Post-Round Upload

If the admin uploads supporting documents after round one, the system should not merely store them passively.
It should trigger re-analysis of the current case using:

* round-one participant outputs
* current extracted workflow understanding
* the newly uploaded sources

This re-analysis should happen before the next important analytical step when the new sources may materially affect:

* threshold interpretation
* approval logic
* ownership understanding
* reference strength
* clarification quality
* round-two targeting
* package quality

### 11.6 No Blind Overwrite Rule

Post-round supporting documents must not blindly overwrite earlier participant narrative understanding.
Instead, they should enter the case as an additional evidence layer.
The system should then evaluate their analytical effect on the existing understanding.

This means the system should distinguish between:

* what was already understood from participant input
* what became stronger, weaker, corrected, or newly visible after supporting evidence entered

### 11.7 File and Source Typing

Each source should be typed at intake level before deeper functional analysis.
Typing may include where applicable:

* uploaded document
* uploaded form
* uploaded template
* uploaded contract sample
* uploaded quotation sample
* uploaded role document
* uploaded workflow-related reference
* uploaded contextual source

This intake typing is preliminary and must not replace later functional classification.

### 11.8 Missing-Source Recording

When relevant expected sources are known to exist but are still absent, the system should be able to record that absence explicitly.
This recording should preserve:

* what source is missing
* why it matters if known
* whether the absence is blocking or non-blocking
* whether the source is part of setup-stage expectation or later optional supporting evidence

### 11.9 Early Extraction Status Tracking

After intake, each source should have an explicit processing status at minimum such as:

* registered_not_processed
* extraction_in_progress
* extracted_pending_classification
* classified_ready_for_use
* limited_value_visible
* requires_admin_review

### 11.10 Informational Domain-Support Source Registration Rule

If deeper optional domain-support material is added to a case, it should still be registered in the case source inventory with explicit distinction from company-truth sources.

At minimum, such material should be marked as:

* informational domain support
* non-authoritative
* supportive for interpretation/question drafting only

This prevents externally gathered domain material from being confused with company reality or internal operational references.

### 11.11 Build Meaning of This Section

This section establishes that source handling in version one is case-centered, traceable, and timing-aware.
It allows the admin to strengthen the case with later uploaded evidence without forcing every useful source to exist at setup time.
At the same time, it prevents later uploads from becoming hidden untracked artifacts.

## 12. Organizational Context and Reference Processing Logic

### 12.1 Governing Classification Philosophy for v1

Version one should use a **functional classification philosophy**.
This means documents must be judged by what they actually do in the case, not by their visible name alone.

This is especially important for organizational-context documents because they may appear non-operational at first glance while still containing useful operational structure in some cases.

### 12.2 Organizational-Context Document Handling

Documents such as the following should be treated **by default** as organizational-context sources:

* company profile
* brochure
* service catalog
* capability deck
* business unit overview
* organizational introduction material
* company presentation

Their default role is to help shape understanding of:

* company context
* service model
* terminology
* domain language
* use-case framing
* broader operating environment

### 12.3 Default Context-Only Rule

The default assumption for these documents in version one should be **context-only support** rather than primary workflow-reference status.

This prevents the system from prematurely treating marketing, profile, or descriptive material as if it were a reliable workflow document.

### 12.4 Functional Reclassification Rule

A document that is context-only by default may be functionally reclassified if it materially contains operational structure relevant to the selected case.

This reclassification is allowed when the document includes content such as:

* workflow sequence
* process stages
* role ownership
* handoff logic
* decision logic
* service-rule structure
* operational boundaries
* step-level descriptions with real analytical value

In such cases, the document should not remain trapped in a context-only category merely because of its visible label.

### 12.5 Declared Label vs Functional Classification

The system must preserve the distinction between:

* declared label
* apparent document family
* actual functional role in the case

For example, a company deck may still remain context-only.
But if part of that same deck includes actual operational process structure, the system may assign a different functional role for analytical purposes.

### 12.6 Mixed-Role Document Handling

Some documents may play more than one useful role.
Version one should therefore allow a document to carry:

* a primary functional classification
* and, when justified, a secondary functional classification

This is preferable to forcing an artificial single-label simplification when the document genuinely serves more than one analytical function.

### 12.7 Organizational Context as Interpretation Support

Even when a document remains context-only, it may still materially improve analysis by helping the system:

* understand service terminology
* understand what the company actually offers
* understand what a selected use case likely means in that company’s environment
* interpret department-specific language
* avoid misreading business terms as generic terms

Context-only does not mean analytically useless.
It means the document is not the primary workflow truth source by default.

### 12.8 Functional Document Classification

Every loaded source that may affect workflow or documentation judgment should pass through functional document classification.
This classification should distinguish where relevant between roles such as:

* organizational context source
* workflow reference
* policy reference
* performance reference
* role/responsibility reference
* questionnaire or intake source
* service-level reference
* work instruction
* process description
* mixed-role source

The classification should remain tied to function, not filename habit.

### 12.9 Declared Label vs Functional Classification Record

The system should preserve both:

* what the document appears to be called
* and what the system functionally judges it to be

This record is important because many companies use loose naming that does not match actual function.

### 12.10 Reference Suitability Preparation

After functional classification, the system should prepare the source for later suitability judgment rather than jumping directly into blind comparison.
This preparation may include identifying:

* what operational scope the document appears to cover
* what roles it appears to apply to
* whether it is comparison-ready
* whether it is too generic
* whether it is supportive only
* whether it helps the reference set even if weak on its own

### 12.11 Reference-Set Judgment Preparation

The system must prepare not only document-level judgment but also later reference-set judgment.
This is because a weak individual document may still contribute useful value inside a broader set, and a strong-looking document may still be incomplete when judged as part of the full case.

Preparation at this stage should therefore preserve:

* document-level role
* likely overlap with other documents
* likely gaps in coverage
* whether the source fills context, workflow, policy, performance, or ownership needs

### 12.12 Reclassification Traceability Rule

If a document is reclassified from default context-only into a more operationally relevant role, the system should preserve traceability for:

* why reclassification occurred
* what specific content justified it
* what new role the document now plays in the case

This avoids hidden classification drift.

### 12.13 Informational Domain-Support Handling Rule

Informational domain-support sources should be processed differently from company-context or company-reference sources.
They may inform:

* terminology understanding
* likely artifact interpretation
* better question drafting
* domain-aware reading support

But they must not be functionally promoted into company workflow truth unless they become paired with approved company-specific evidence.

### 12.14 Build Meaning of This Section

This section establishes that organizational-context documents in version one are treated cautiously but not simplistically.
They are context-only by default, yet they may be reclassified functionally when they materially contain operational value for the selected case.
This preserves both analytical discipline and practical realism.

## 13. Hierarchy Intake and Approval Logic

### 13.1 Text / File-First Hierarchy Intake

The primary intake mode for hierarchy in version one should be:

* text entry
* pasted textual structure
* uploaded file containing an org chart or role structure

The system should not depend on manual drag-and-drop tree construction as the required first input mode.

### 13.2 Draft Hierarchy Generation

After hierarchy input is provided, the system should generate a draft hierarchy tree that represents:

* roles
* reporting lines
* major layers
* possible participant grouping

This draft is not final until admin review and approval occur.

### 13.3 Ambiguity Clarification for Reporting Lines

If reporting lines are unclear, incomplete, or contradictory, the system should surface explicit clarification questions to the admin before rollout.

These clarifications may address:

* who reports to whom
* whether a role is managerial or peer-level
* whether a role belongs inside the selected use case scope
* whether a role should receive participant outreach

### 13.4 Admin Correction Flow

The admin must be able to correct the generated draft hierarchy before rollout begins.
Corrections should update the draft hierarchy rather than requiring full re-entry of all structure.

### 13.5 Admin Approval Rule

Participant rollout must not begin until the hierarchy has been explicitly approved by the admin.
Unapproved hierarchy may support early preparation work, but it must not support actual participant targeting or rollout.

### 13.6 Hierarchy Readiness State Before Rollout

At minimum, hierarchy handling should support the following states:

* not_started
* draft_generated
* clarification_needed
* corrected_pending_approval
* approved_for_rollout

Only **approved_for_rollout** may unlock participant rollout readiness.

## 14. Reference Readiness Logic Before Rollout

### 14.1 Required-if-Available Rule

If relevant reference documents exist, they must be uploaded before participant rollout begins.
The system should not begin participant questioning blindly when useful references are known to exist but have not yet been provided.

### 14.2 No-Reference Confirmation Rule

If no relevant reference documents exist, the case may proceed only after the admin explicitly confirms that no relevant references are available.

This avoids confusing true absence of references with incomplete setup.

### 14.3 Readiness States

Reference readiness should support at minimum:

* not_checked
* references_uploaded
* references_expected_but_missing
* no_references_available_confirmed

### 14.4 Blocking Conditions

Participant rollout must be blocked when:

* references are known or expected to exist but are not yet uploaded
* reference availability remains unclear and has not been explicitly resolved

Participant rollout may proceed when either:

* references_uploaded
* or no_references_available_confirmed

## 15. Pre-Rollout Processing and Readiness Logic

### 15.1 Preloaded Case Context Assembly

Before participant questioning begins, the system should assemble the available case context, including as applicable:

* company profile/context
* selected domain
* selected department
* selected use case
* available references
* hierarchy structure
* operator notes

### 15.2 Context Shaping Before Questioning

This assembled case context should shape:

* terminology handling
* use-case framing
* participant targeting
* first-round question framing
* reference-aware interpretation

### 15.3 Readiness Checks Before Participant Rollout

Before participant rollout, the system must verify at minimum:

* case creation inputs are present
* hierarchy is approved
* references are either uploaded or explicitly confirmed absent
* use-case targeting is sufficiently defined for participant selection

### 15.4 Blocking vs Non-Blocking Pre-Rollout Conditions

Blocking pre-rollout conditions include at minimum:

* missing required case-creation inputs
* unapproved hierarchy
* references expected but missing
* unresolved participant-targeting basis

Non-blocking but visible conditions may include:

* incomplete operator notes
* optional context files not yet uploaded
* minor terminology ambiguity that does not prevent participant targeting

### 15.5 Admin Pre-Rollout Approval Gate

The system should support an explicit admin-controlled pre-rollout approval gate.
Even when readiness conditions are technically satisfied, actual participant rollout should remain an intentional operator-controlled action.

## 16. Participant Targeting and Rollout Logic

### 16.1 Governing Rollout Philosophy for v1

Version one should use a **hybrid hierarchy-aware rollout model**.
This means:

* the default rollout direction should begin from the lower operational layer inside the selected use case
* the rollout should then move upward or laterally only as needed
* the admin may override the default starting point when there is a justified reason
* any such override must remain visible and traceable

This preserves the project’s bottom-up synthesis logic while still allowing practical operator judgment.

### 16.2 Participant Selection Basis

Participant targeting must be based on the approved case structure rather than generic title assumptions alone.
At minimum, participant selection should draw on:

* approved hierarchy
* selected department
* selected use case
* in-scope role relevance
* expected workflow visibility
* current need for closure or clarification

The system should not target participants arbitrarily.
It should target them because they are expected to add useful workflow evidence.

### 16.3 Default Bottom-Up Starting Rule

The default rollout start for version one should be the lower operational layer most directly involved in the selected use case.

Examples may include:

* frontline sales roles for sales onboarding
* dispatch operators for dispatching
* operational coordinators for workflow-heavy service execution
* relevant frontline HR execution roles for HR use cases when appropriate

This default exists because the first synthesis base should normally be grounded in day-to-day execution reality.

### 16.4 Admin Override of Starting Layer

The admin may override the default bottom-up starting point when a clear case-specific reason exists.
Examples may include:

* the team is too small for full bottom-up staging
* the manager is currently the most complete source for the use case
* participant availability constraints require a different opening order
* the case is exploratory and needs fast high-level framing before wider rollout

If the admin overrides the default start layer, the system should preserve at minimum:

* the chosen start layer
* the reason for override
* who approved the override
* when it was applied

### 16.5 Hierarchy-Aware Rollout Order

After the starting layer is selected, rollout should remain hierarchy-aware.
The system should support order patterns such as:

* lower operational layer first
* then peer completion within that layer
* then supervisor enrichment when needed
* then manager enrichment when needed
* then targeted external interface clarification only when materially required

The system should not automatically expand into a broad multi-department rollout unless the case materially requires that later.

### 16.6 First-Round Rollout Conditions

First-round participant rollout may begin only when:

* case creation requirements are satisfied
* hierarchy is approved for rollout
* references are uploaded or explicitly confirmed absent
* participant-targeting basis is sufficiently defined
* admin pre-rollout approval has been given

The system must not begin participant outreach before these conditions are satisfied.

### 16.7 Targeting Scope Rule for v1

Version one should keep participant targeting scoped to the selected main department and selected use case as the primary operating boundary.

Other teams or functions may later appear as:

* dependencies
* handoff points
* escalation targets
* clarification targets

But they should not be treated as default first-round rollout groups.

### 16.8 Channel Independence with Transport Adapters

Participant targeting and rollout logic must remain channel-independent at the core logic level.
The system may use transport adapters such as:

* WhatsApp
* Telegram
* web-based intake
* other approved input channels

But the targeting logic itself must not depend on one messaging platform as the source of truth.

### 16.9 Participant-Facing Rollout Payload

When a participant is targeted for rollout, the participant-facing payload should include at minimum:

* a short explanation of what is needed
* the selected use case being discussed
* what kind of operational explanation is being requested
* permission to answer by voice or text when supported
* reassurance that it is acceptable to say when something is unknown or outside ownership

The rollout payload should not overwhelm the participant with internal system logic.

### 16.10 First-Round Rollout Purpose

The purpose of first-round rollout is to collect the participant’s practical workflow narrative, not to interrogate them with a dense questionnaire.
The first round should primarily aim to capture:

* what they actually do
* where their role starts and ends
* what decisions they face
* what approvals or handoffs appear
* what systems or tools they use

### 16.11 Re-Contact and Later-Round Targeting

Later-round participant targeting should be selective rather than broad by default.
A participant may be re-contacted when one or more of the following is true:

* a materially important clarification target remains linked to their role
* a prior answer created a meaningful unresolved item
* new supporting evidence created a useful clarification opportunity
* a difference block still needs closure from that participant’s perspective
* earlier answers need confirmation after re-analysis

The system should not re-contact participants casually when no material gain is likely.

### 16.12 Targeting Escalation Rule

If a lower-layer participant cannot resolve a materially important point, and the issue remains relevant to workflow completeness, the system should target the next appropriate higher owner or relevant adjacent owner rather than repeatedly cycling the same unclear question back to the same participant.

This escalation must remain consistent with the approved hierarchy and ownership logic.

### 16.13 Participant Targeting Status Visibility

Participant targeting should preserve explicit status visibility at minimum such as:

* not_targeted
* targeted_pending_response
* response_received
* follow_up_targeted
* no_further_targeting_needed
* escalated_to_higher_owner

These targeting statuses should support admin visibility and later analysis control.

### 16.14 Build Meaning of This Section

This section establishes that rollout in version one is not random outreach.
It is a controlled, hierarchy-aware, use-case-scoped targeting process that begins from the operational layer by default, supports justified admin override, and escalates only when workflow completeness truly requires it.

## 17. Participant Session Logic

### 17.1 Governing v1 Session Model

Version one should use a **hybrid participant-session model**.
This means:

* each participant should have one main session record for the selected use case
* the session should begin with open narrative intake rather than a rigid questionnaire
* subordinate clarification rounds should be created only when materially needed
* clarification rounds should remain linked to the main session rather than replacing it

This model preserves both:

* continuity of the participant’s overall workflow narrative
* traceability of important later clarification events

### 17.2 Session Opening Logic

The session should begin with a short participant-facing explanation of what is needed.
The opening should clarify at minimum:

* the selected use case being discussed
* that the participant should explain what actually happens in practice
* that the participant may answer in voice or writing
* that the system may ask later clarification questions only when needed
* that it is acceptable to say when something is unknown, outside ownership, or handled by another person or team

The opening should not begin with a long structured questionnaire.
The first step is open narrative capture.

### 17.3 Input Modalities

The session should support at minimum:

* voice input
* text input
* mixed input across rounds when needed

Input modality must be recorded explicitly in the session record.

### 17.4 Main Narrative-First Capture Rule

The participant should first be invited to explain the workflow in their own words from their practical perspective.
The system should not immediately interrupt the participant with dense questioning unless the input channel itself requires smaller turns.

The purpose of the first narrative is to capture the participant’s natural operational picture, including where possible:

* what starts the work
* what they do first
* what they do next
* what systems they use
* what approvals appear
* what conditions change the path
* what happens when something fails or changes

### 17.5 First-Pass Extraction Behavior

After the initial narrative is received, the system should perform a first-pass extraction of at minimum:

* workflow steps
* sequence
* decision points
* exceptions
* approvals
* handoffs
* systems touched
* dependencies
* unresolved terms
* threshold-like language
* ownership or visibility limits when already stated

This extraction should become the basis for later clarification targeting.

### 17.6 Pre-Clarification Understanding Summary Rule

After the initial narrative is received and first-pass extraction is performed, the system should provide a short participant-facing understanding summary before sending the first clarification question.

This summary exists to confirm that the system understood the participant’s explanation at a basic practical level before asking targeted follow-up.

The summary should be:

* short
* easy to read
* participant-friendly
* limited to the main understood workflow points rather than the full internal extraction structure

At minimum, the summary may include:

* the main steps understood so far
* the main approval or decision point understood so far when relevant
* the main unresolved point that will motivate the next clarification question when useful

The summary should not become a long analytical report.
Its purpose is early understanding confirmation, not full workflow delivery.

### 17.6A Participant Correction Opportunity

Before the first clarification question is asked, the participant should have a natural opportunity to correct major misunderstanding if the short summary is clearly wrong.

This does not require a separate correction workflow in every case, but the session design should support the participant in recognizing and correcting obvious misinterpretation early.

### 17.7 Clarification-Round Creation Rule

A clarification round should be created only when the initial narrative or later response contains a materially useful clarification opportunity.
This includes for example:

* vague or sensitive operational terms
* missing threshold definitions
* unclear approval conditions
* unclear ownership
* unclear handoff logic
* hidden exception logic
* missing start or end conditions for a step
* ambiguous sequence transitions

If no meaningful clarification need exists, the system should not generate unnecessary rounds.

### 17.7 One-Question-at-a-Time Rule

Clarification must happen one question at a time.
The system should not send a dense batch of clarification questions to the participant in a single step.

This rule exists because participants may:

* be unfamiliar with structured AI interaction
* be weak at written explanation
* become overloaded by too many requests at once
* respond better when guided gradually

### 17.8 Required Structure of Each Clarification Question

Every clarification question sent to a participant should include at minimum:

* the question itself
* a short explanation of why the question is being asked
* a simple example of a suitable answer

The explanation should help the participant understand the purpose of the question.
The example should help the participant answer more concretely rather than staying vague.

### 17.9 Participant-Friendly Simplicity Rule

Clarification questions should be participant-friendly.
They should avoid unnecessary internal jargon and should not expose the full internal analysis model directly.

The system may simplify wording while still preserving analytical precision in the background.

### 17.10 Non-Pressure Response Rule

The system should help the participant clarify information without pressuring them into pretending certainty.
If the participant does not know the answer, does not own the step, or does not have enough visibility, the system should make that acceptable.

At minimum, the participant should be supported in saying things such as:

* I do not know
* this is not handled by me
* I am not the owner of this step
* I do not have enough visibility
* this happens before my stage starts
* this happens after my role ends
* another team handles this

### 17.11 Repetition-Limitation Rule

If the participant has already clearly indicated non-knowledge, non-ownership, or another valid workflow boundary for a specific clarification target, the system should not keep repeating the same question to that same participant.

Instead, the system should:

* record the boundary or unknown explicitly
* preserve it as analytical evidence
* route it later into escalation, reference-check, or open-item handling when appropriate

### 17.12 Round Materiality Rule

Not every follow-up needs to become a formally distinct subordinate round.
A subordinate clarification round should be explicitly recorded when the response does one or more of the following:

* materially clarifies an important ambiguity
* adds a missing workflow step
* changes the interpretation of an earlier extracted step
* introduces a meaningful threshold or approval rule
* introduces a non-knowledge or boundary signal with later escalation value
* changes synthesis relevance

### 17.13 Session Context Creation

The main session record must contain at minimum:

* session identity
* linked participant identity
* linked hierarchy node when available
* selected domain
* selected department
* selected use case
* input modality
* session state
* session version

### 17.14 Raw Input Preservation

The session must preserve the participant’s raw source input rather than only the interpreted output.
This includes where applicable:

* raw audio reference
* raw text
* raw transcript
* cleaned transcript
* timestamps
* language

Raw narrative preservation is required for traceability and later review.

### 17.15 Extracted Workflow Structure Layer

The main session must maintain a structured extracted workflow layer that stores at minimum:

* extracted steps
* extracted sequence
* extracted handoffs
* extracted decision points
* extracted exceptions
* extracted controls
* extracted systems
* extracted dependencies
* extracted unknowns

### 17.16 Follow-Up Layer

The session must maintain a distinct follow-up layer that records at minimum:

* each clarification question
* why it was asked
* question type
* helper choices when used
* participant answer
* answer mode
* answer interpretation category
* whether the answer materially changed the session understanding

### 17.17 Boundary and Unknown Interpretation Layer

The session must maintain a distinct boundary and unknown interpretation layer.
This layer should preserve structured interpretations such as:

* knowledge gap
* ownership boundary
* execution boundary
* visibility limitation
* upstream workflow boundary
* downstream workflow boundary
* cross-team boundary
* outcome-only knowledge
* tacit-only practice

### 17.18 Analytical Status Layer

The session must maintain an analytical status layer that indicates at minimum:

* participant workflow version
* unresolved items
* escalation candidates
* reference-check candidates
* current comparison readiness
* current drafting-readiness signal

### 17.19 Confidence and Evidence Layer

The session must maintain a confidence and evidence layer that preserves at minimum:

* evidence-source notes
* explicit vs inferred distinctions
* ambiguity notes
* contradiction notes
* confidence notes
* owner-review-needed points when relevant

### 17.20 Main Session vs Subordinate Round Relationship

The main session is the durable participant record.
Subordinate clarification rounds are linked events under that main session.

The implementation should therefore preserve:

* main-session continuity
* round-level traceability
* ability to see what changed after each material clarification

The system must not flatten all later clarification into one undifferentiated final summary.

## 18. Clarification Trigger Logic

### 18.1 Governing Trigger Philosophy for v1

Version one should use a **clarification-first trigger philosophy** for materially vague or sensitive operational language.
The system should not rely primarily on silent contextual guessing when participant wording may hide a threshold, approval condition, exception rule, ownership distinction, or another operationally important meaning.

This is especially important because participants may use natural human wording that is meaningful conversationally but too ambiguous for dependable workflow reconstruction.

### 18.2 Why Clarification-First Is Preferred

Participants may use terms that feel understandable in ordinary speech but are not operationally precise enough for structured workflow logic.
Examples include language such as:

* high price
* low price
* sensitive pricing
* urgent case
* important client
* special handling
* large volume
* according to the case
* if needed
* if management agrees

The system should therefore prefer clarification over silent interpretation when such wording may affect real operational meaning.

### 18.3 Trigger Detection Scope

A clarification trigger should be created when the narrative contains wording that may materially affect one or more of the following:

* threshold meaning
* approval logic
* decision branching
* exception handling
* ownership boundaries
* handoff rules
* workflow start or end conditions
* sequence continuity
* later workflow dependability

### 18.4 Sensitive / Vague Operational Term Detection

The system should detect terms and phrases that signal underspecified operational meaning.
Detection should include at minimum:

* vague thresholds
* vague approval conditions
* vague exception language
* vague ownership language
* vague urgency or priority language
* vague pricing or commercial conditions
* vague quality or quantity thresholds

### 18.5 Clarification-Target Formation Rule

When a sensitive or vague term is detected, the system should convert it into an explicit clarification target rather than leaving it as a loose narrative phrase.

A clarification target should identify at minimum:

* the ambiguous term or phrase
* why it is operationally important
* what kind of clarity is missing
* what part of the workflow it affects

### 18.6 No Silent Threshold Invention Rule

The system must not silently invent a threshold, approval rule, or decision meaning merely because the surrounding narrative appears partially suggestive.

If the participant says language such as:

* the price is low
* the account is large
* the case is urgent
* management may approve

and no dependable operational definition is yet available, the system should prefer clarification rather than implicit conversion into a fake rule.

### 18.7 One-Question Clarification Delivery Rule

Clarification triggered by vague or sensitive terms must still follow the already-decided participant-session behavior:

* one question at a time
* short explanation of why it is being asked
* simple example of a suitable answer

Trigger logic must not override participant-friendly delivery logic.

### 18.8 Current-Participant Clarification First

The system should first ask the current participant to clarify the detected ambiguity before escalating elsewhere, unless the participant has already clearly indicated that the topic is outside their ownership, visibility, or role boundary.

### 18.9 Participant Non-Knowledge Respect Rule

If the participant cannot define the ambiguous term, cannot provide the threshold, or states that the matter belongs to another owner, the system should not pressure them into guessing.

Instead, it should:

* record the response explicitly
* preserve the issue as unresolved or boundary-linked
* consider escalation or later follow-up when relevant

### 18.10 Hierarchy-Based Clarification Escalation Path

If the ambiguity remains materially important after asking the current participant, and the participant cannot resolve it, the system should escalate clarification upward through the loaded hierarchy where appropriate.

This may include movement such as:

* frontline role to supervisor
* supervisor to manager
* manager to higher owner
* or to another explicit functional owner when the issue belongs outside the current role line

Escalation must remain linked to the approved department structure rather than generic free routing.

### 18.11 Clarification Exhaustion Rule

An ambiguity should be treated as clarification-exhausted only after:

* the current participant was asked when appropriate
* valid non-knowledge or non-ownership was respected when stated
* higher clarification routing was attempted where materially justified
* no sufficient closure was obtained

Only then may the issue move into unresolved, review, or critical-gap handling when relevant.

### 18.12 Materiality Filter After Clarification Attempt

Not every unresolved ambiguity deserves the same downstream treatment.
After clarification attempt, the system should judge whether the remaining ambiguity is:

* non-blocking and visible
* review-relevant
* escalation-worthy
* or critical-gap relevant

This judgment must depend on impact, not on the mere existence of ambiguity.

### 18.13 Trigger Examples for v1

Examples of wording that should normally trigger clarification when operationally relevant include:

* the price is too low
* this customer is strategic
* this order is high volume
* we send it for approval when needed
* if the case is special we handle it differently
* urgent requests go faster
* difficult customers need manager involvement

These examples are illustrative, not exhaustive.

### 18.14 Build Meaning of Clarification Trigger Logic

Clarification Trigger Logic in version one is therefore a controlled repair layer.
Its purpose is to prevent the workflow from being built on vague human shorthand when that shorthand materially affects operational meaning.

It should not behave as an overactive conversation engine.
It should behave as a targeted clarification mechanism that protects workflow correctness.

## 19. Synthesis Logic

### 19.1 Governing v1 Synthesis Decision

Version one should use a **hybrid synthesis model**.
This means:

* when the common path across same-level participants is sufficiently clear, the system should form that common path first
* when a difference materially affects workflow structure, the difference should remain explicitly visible as a temporary difference block rather than being merged away too early

The purpose of synthesis is not employee evaluation.
The purpose is to construct the strongest operationally useful workflow from distributed knowledge.

### 19.2 Peer-Level Common-Path Formation

When participants at the same working level describe broadly similar workflow behavior, the system should identify the strongest shared path first.

This common-path formation should aim to capture at minimum:

* the main step sequence
* the main handoffs
* the core decision points already supported by the shared narratives
* the common systems or tools touched when consistently described

The common path should become the first synthesis base when it is sufficiently supported.

### 19.3 Difference-Block Preservation Rule

When a participant-level difference is materially important, the system must preserve it explicitly rather than forcing immediate merge into the common path.

A preserved difference block should identify at minimum:

* where the difference appears
* what the difference is
* which participants support each side
* why the difference matters
* what later closure path may resolve it

Difference blocks are temporary structured synthesis objects.
They are not yet final contradictions unless later judgment confirms that level of severity.

### 19.4 Material Difference Handling

A same-level difference should be treated as materially important when it affects one or more of the following:

* core sequence continuity
* approval logic
* threshold meaning
* ownership or handoff logic
* exception handling
* workflow start or end boundary
* ability to form a dependable workflow representation

If a difference does not materially affect these areas, it may remain visible as a lower-impact variation without blocking base-path formation.

### 19.5 Non-Material Variation Rule

Not all variation requires preserved branching in synthesis.
If two same-level participants describe small wording differences or low-impact practice variation that does not materially affect workflow closure, the system may:

* keep the common path as primary
* record the variation in notes or lower-impact analysis
* avoid inflating the synthesis into unnecessary parallel branches

### 19.6 Early Merge Restriction Rule

The system must not merge a materially important difference too early merely because most of the surrounding workflow looks similar.

If the unresolved difference affects:

* a core approval step
* a meaningful threshold
* an essential handoff
* a core transition
* a structurally important branch

then that difference must remain visible until closure or explicit review-based acceptance occurs.

### 19.7 Supervisor and Manager Enrichment Logic

When peer-level synthesis leaves a materially important difference unresolved, the system should seek enrichment or closure from higher relevant levels such as:

* supervisor
* manager
* or another relevant owner inside the approved structure

The role of higher-level enrichment is not to erase the lower-level workflow automatically.
Its role is to:

* clarify thresholds
* clarify approvals
* clarify ownership
* clarify exception handling
* close important ambiguity
* support formation of a stronger final workflow

### 19.8 External Dependency and Interface Handling

If a difference points outside the immediate department workflow, the system should treat the outside area initially as:

* dependency
* handoff point
* external interface

It should not automatically expand the synthesis into a multi-department reconstruction unless the issue becomes materially necessary for workflow completion.

### 19.9 Blocking vs Review-Item Difference Rule

After reasonable synthesis and closure attempts, a remaining difference should be treated as a **critical blocker** only when it prevents completion of the workflow’s essential structure.

This includes where the difference still breaks one or more of the following:

* sequence continuity
* a required core transition
* an essential handoff
* an essential decision rule
* an essential approval or control point
* the ability to maintain a sufficiently complete workflow across core points

If the remaining difference does not break essential workflow completion, it should remain visible as a review item or note layer rather than a finalization blocker.

### 19.10 Workflow Completeness as the Governing Synthesis Objective

The governing synthesis objective is workflow completeness and structural usefulness.
The system should not optimize primarily for unanimity.
It should optimize for whether the resulting workflow is complete, coherent, reviewable, and dependable enough for the next stage.

### 19.11 Synthesis Output Structure

At minimum, synthesis output should preserve:

* current synthesized common path
* preserved material difference blocks
* major unresolved items
* closure candidates
* escalation candidates when relevant
* confidence and evidence notes where important

This allows later evaluation and package generation to distinguish between:

* what is already strong
* what is still under closure
* what remains visible but non-blocking

### 19.12 Build Meaning of This Section

This section establishes that synthesis in version one is neither naive averaging nor full parallel preservation of everything.
It is a controlled hybrid process:

* form the common path when justified
* preserve material differences visibly
* close them through hierarchy-aware enrichment when needed
* block only when essential workflow completion is still broken

## 20. Workflow Evaluation Logic

### 20.1 Governing Evaluation Philosophy for v1

Version one should use a **workflow-completeness-first evaluation model**.
The primary purpose of evaluation in this system is not to behave like a technical scoring engine, a risk-rating engine, or a company-performance judgment layer.

The primary purpose is to determine whether the workflow has been reconstructed clearly enough, completely enough, and sequentially enough to support:

* truthful documentation output
* dependable workflow representation
* later automation-readiness support
* later process formalization when needed

This means the system is documentation-first and workflow-first, not weakness-first.

### 20.2 What the Evaluation Is Not Trying to Do

The system in version one is not primarily trying to:

* judge overall business quality
* rate organizational maturity in a broad consulting sense
* score operational risk in a dedicated risk-engine sense
* produce a technical architecture-readiness audit
* act as a compliance-scoring engine

Weaknesses, review notes, and limits may still be visible when relevant, but they are not the governing center of evaluation.

### 20.3 Governing Evaluation Standard

The governing standard must remain anchored to the locked reference’s **seven critical completeness conditions**.
A workflow should not be treated as sufficiently complete unless these conditions are materially satisfied at the level required for dependable documentation output.

The seven governing conditions are:

1. continuity of the core workflow sequence
2. clarity of how point A leads to point B and how point B leads to point C
3. completeness of the conditions required to understand or execute a core step
4. the decision rule or threshold needed for a core branch
5. the handoff or responsibility needed for a core transition
6. the control or approval logic required for a core step
7. the boundary required to understand where the use case actually begins or ends

These seven conditions should govern final judgment more strongly than any cosmetic scoring impression.
If one of them remains materially broken, the workflow should not be treated as fully complete for the system’s main documentation purpose.

### 20.4 Practical Rubric Axes

Version one should still use the already-defined practical axes, but they should be interpreted through the workflow-completeness-first philosophy.

The practical axes are:

1. **Workflow Completeness**
2. **Sequence Clarity**
3. **Decision / Exception Clarity**
4. **Ownership / Handoff Clarity**
5. **Documentation Strength**

These axes exist to support structured judgment.
They must not be treated as cosmetic scoring theater.

### 20.5 Judgment States

Each axis should use the following practical judgment states:

* **Strong**
* **Partial**
* **Weak**
* **Blocking**

These states should be interpreted operationally, not mathematically.

### 20.6 Workflow Completeness as the Highest-Priority Axis

Workflow Completeness should have the highest interpretive priority because the system’s main purpose is to produce a workflow that is structurally complete enough to document truthfully.

In version one, this axis should be interpreted through the seven critical completeness conditions rather than through vague general impressions.
A workflow that appears descriptively rich but still fails one of the seven governing conditions in a material way should not be treated as strongly complete.

A workflow that is weaker in secondary refinement but materially satisfies the seven governing conditions may still be highly valuable for the system’s purpose.

### 20.7 Sequence Continuity as a Governing Outcome Driver

Sequence Clarity should have the next highest practical importance because the workflow must remain followable from one step to the next.

If the workflow cannot be followed coherently across its core points, the system has not yet succeeded in its main documentation mission.

### 20.8 Decision / Exception and Ownership / Handoff as Core Structural Support Axes

Decision / Exception Clarity and Ownership / Handoff Clarity are important because they support whether the workflow can actually function as a dependable operational representation.

Their importance increases sharply when ambiguity in these axes materially affects:

* whether a core step can be understood
* whether a transition can be followed
* whether an approval or ownership boundary is needed for the main path

### 20.9 Documentation Strength as a Supportive but Non-Dominant Axis

Documentation Strength remains important, but it should not dominate the evaluation when the workflow itself has been reconstructed strongly from reality.

This is because the system exists partly to produce stronger documentation even when existing documentation is weak.
Therefore, weak documentation should not by itself collapse workflow evaluation if the workflow reconstruction is otherwise strong enough.

### 20.10 Governing Derived-Outcome Philosophy

Derived decision outcomes should be driven primarily by whether essential workflow structure is sufficiently complete and dependable.

In practice, this means the seven critical completeness conditions from the locked reference govern final outcome interpretation.
The rubric axes are supporting judgment lenses, but the seven completeness conditions remain the stronger structural test.

This means version one should use a **hybrid outcome model**:

* not every weak or even blocking-looking axis should automatically collapse the whole case
* but if the problem materially breaks one or more of the seven governing completeness conditions, then it must govern the final outcome

This prevents the system from becoming either:

* too soft and vague
* or too harsh and score-driven

### 20.11 Ready for Initial Package

The case should be considered **Ready for Initial Package** when:

* the workflow is sufficiently reconstructable in its current form
* essential workflow structure is visible enough to document meaningfully
* remaining issues do not prevent a useful analytical package

This does not require perfection.
It requires enough structured truth to produce a valid first package.

### 20.12 Needs More Clarification

The case should be considered **Needs More Clarification** when:

* the workflow still lacks important structural closure
* one or more unresolved issues still materially affect workflow completeness, sequence continuity, decision clarity, or ownership/handoff clarity
* additional clarification is likely to improve the case materially

This state should be used when the workflow is not yet mature enough for dependable packaging at the intended level.

### 20.13 Finalizable with Review

The case should be considered **Finalizable with Review** when:

* the workflow is sufficiently complete and usable overall
* no remaining issue breaks essential workflow completion
* some visible review items, imperfections, or non-blocking weaknesses remain
* these remaining issues do not justify stopping finalization

This state fits the practical reality that documentation can still be valid and useful even when minor refinement opportunities remain.

### 20.14 Ready for Final Package

The case should be considered **Ready for Final Package** when:

* the workflow is sufficiently complete across its core structure
* sequence is sufficiently stable
* core decision and exception logic are closed enough for the selected use case
* ownership and handoff logic are clear enough for dependable documentation
* final source/reference direction is mature enough for final output
* no remaining blocking issue prevents final package creation

### 20.15 Non-Central Weakness Visibility Rule

The system may still preserve visible non-central weaknesses, review notes, or later-improvement opportunities.
However, these should remain subordinate to the main question:

* is the workflow real, complete, sequential, and documentable enough?

If yes, the case may still progress even if non-central refinement opportunities remain.

### 20.16 Automation-Supportiveness as a Derived Consequence

Automation-supportiveness should remain a derived consequence rather than a separate dominant scoring purpose.

The workflow becomes more automation-supportive when it is:

* complete
* sequential
* clear in decisions
* clear in ownership and handoffs
* stable enough to document dependably

The system does not need a separate heavy automation-readiness score to know this.

### 20.17 Recommendation Intensity as a Derived Consequence

Recommendation intensity should also remain derived.
If the workflow is already structurally strong, recommendations may be lighter and more refinement-oriented.
If the workflow is still incomplete or weak in core structure, recommendations should focus on clarification, closure, and documentation strengthening.

### 20.18 Build Meaning of This Section

This section establishes that evaluation in version one is not an abstract scoring ritual.
It is a practical judgment layer whose main purpose is to decide whether the system has reconstructed the workflow well enough to produce truthful, useful documentation and later support stronger formalization or automation.

### 20.19 Workflow Validity and Automation-Supportiveness Are Separate Judgments

The system may document a workflow as valid — that is, truthfully reconstructed, structurally followable, and package-ready — even when the workflow is not yet fully automation-supportive.

These are two distinct levels of maturity:

* **Workflow validity** — the workflow has been reconstructed clearly enough to be truthfully documented, followed operationally, and packaged for review. This is the primary truth test for documentation output.
* **Automation-supportiveness** — the workflow is structured cleanly enough that a later technical implementation such as automation, RPA, or AI process execution could reliably follow it. This is a derived consequence of workflow maturity, not a prerequisite for documentation output.

A workflow that satisfies the essential documentation standard may still contain structural ambiguities that would need resolution before automation could reliably follow it. That does not make the workflow invalid for documentation output.

**Non-automatable does not mean workflow-incomplete.**

The system produces a valid workflow reality document when the workflow is truthfully reconstructed and documentably complete. Whether that workflow is also ready for automation is a higher-maturity question that the system supports but does not require as a condition for first-package output.

### 20.20 Condition Satisfaction Level vs. Blocking Failure

The seven completeness conditions (§20.3) operate on two distinct levels of failure:

* **Not yet fully satisfied** — the condition has a visible weakness or gap but does not materially block the workflow's core path, documentation output, or essential operational understanding at the intended package level. Non-blocking condition weaknesses are compatible with `ready_for_initial_package` (§20.11) and `finalizable_with_review` (§20.13).
* **Materially broken** — the condition failure blocks essential workflow completion in a way that prevents dependable documentation or operational use. Only a materially broken condition must govern the outcome toward `needs_more_clarification` (§20.12).

The governing test for outcome constraint is whether a condition failure **materially breaks essential workflow completion**, not whether the condition is less than perfectly satisfied.

This distinction is required by the literal wording of §20.11 (remaining issues must not prevent a useful analytical package), §20.13 (no remaining issue must break essential workflow completion), and §20.15 (the case may progress even if non-central refinement opportunities remain).

A mechanical gate that treats any unsatisfied condition boolean as a blocking failure conflicts with these sections and over-constrains the outcome toward `needs_more_clarification` in cases where the workflow is documentably complete at a non-perfect level.

### 20.21 Evaluation Is AI-Interpreted, Admin-Routed, and Rule-Guarded

Pass 6 and later evaluation must operate on three distinct levels and must not be reduced to a binary boolean gate.

* **AI-interpreted** — the system interprets each completeness condition issue, explains its specific impact on the workflow, distinguishes whether that impact affects workflow documentability or only automation-readiness, and proposes concrete action options for the admin to consider. Interpretation is the system's job; decision is the admin's job.
* **Admin-routed** — the admin or operator is the decision authority for meaningful corrective direction. The system presents its interpretation and proposes options; the admin selects the path forward. Outcome selection is not reduced to a deterministic rule because §20.11–20.14 use judgment language ("sufficiently complete," "no remaining issue breaks essential workflow completion") that requires human interpretation and cannot be collapsed into a mechanical pass/fail.
* **Rule-guarded** — deterministic enforcement rules remain valid but only as narrow hard-stop guards for clearly invalid progression states. A hard-stop guard protects against structurally impossible outcomes — for example, a workflow where sequence continuity is materially broken being marked `ready_for_final_package`. It does not gate every non-perfect condition weakness. The narrower the guard, the more it reflects a genuine structural impossibility rather than a judgment call that belongs to the admin.

This three-level model prevents two known failure modes:

* **Too soft** — no governance at all; any outcome is accepted regardless of structural state.
* **Too mechanical** — binary boolean logic blocks progress on any unsatisfied condition, including non-blocking weaknesses that do not affect documentability and should surface as improvement notes rather than workflow failures.

### 20.22 Automation-Related Output Wording

When evaluation surfaces automation-related limitations, the system must use three structurally separate output types:

* **Workflow Reality Output** — what the workflow actually is, how it operates, and where it currently stands. This is valid and complete at the workflow-clarity level even when automation-readiness has not yet been achieved. Its validity is not conditional on automation feasibility.
* **Automation-Supportiveness Assessment** — a derived assessment of which workflow elements are already strong enough to support automation and which would require further formalization or clarification before being reliably automatable. This is a downstream observation, not a primary validity gate.
* **Improvement Targets Before Automation** — specific steps, decision rules, or handoff points that would benefit from clarification if automation is a later goal. These are presented as improvement opportunities and operator-facing recommendations, not as workflow failures.

A limitation identified in the Automation-Supportiveness Assessment or in Improvement Targets Before Automation must not automatically collapse the Workflow Reality Output validity determination. Admin-facing automation limitation notes may coexist with a valid workflow output. Non-blocking automation difficulty surfaces as a recommendation, not as a workflow failure.

## 21. Initial Workflow Package Logic

### 21.1 Governing Role of the Initial Package

The Initial Workflow Package is the first formal workflow/documentation output package produced after sufficient first-round analysis.
Its purpose is to present a truthful, usable, and reviewable representation of the workflow as currently understood.

It is not the final package.
It is not the full internal analysis surface.
It is the first dependable outward-facing analytical package for the selected use case.

### 21.2 Entry Conditions

The Initial Workflow Package may be generated when:

* the workflow is sufficiently reconstructable from current inputs
* the current case is judged ready for initial packaging under the evaluation logic
* no remaining issue prevents a useful first analytical package from being formed

The package does not require final perfection.
It requires enough structural truth to produce a meaningful first output.

### 21.3 Mandatory Sections

The Initial Workflow Package must include the following sections:

1. **Initial Synthesized Workflow**
2. **Workflow Rationale**
3. **Workflow Value / Usefulness Explanation**
4. **Initial Gap Analysis**
5. **Initial Recommendations**

These sections are mandatory in the analytical package structure.

### 21.4 Conditional Section Logic

The package may also include:

6. **Document / Reference Implication**

This section is conditional.
It should appear only when:

* the user or operator requested it
* or the system explicitly activates it because the case already supports an early documentation implication path

Its state must still be tracked even when the section is not outwardly shown.

### 21.5 Package-Level Status Field Logic

The Initial Workflow Package must preserve a package-level status field for the document/reference implication path.
At minimum, this status should support values such as:

* not_requested
* not_applicable_yet
* review_recommended
* rebuild_recommended
* conditional_early_draft_possible

This status is part of package governance even when the related section is not visibly expanded.

### 21.6 Analytical Document Layer

The Initial Workflow Package should exist first as an analytical document layer.
This layer contains the detailed structured package for serious workflow review.
It should preserve the package’s mandatory sections and any active conditional section.

### 21.7 Client- and Stakeholder-Facing Intent of the Initial Package

The Initial Workflow Package shown to ordinary stakeholders should focus on:

* the written workflow
* clear workflow representation
* understandable workflow structure
* supportive documentation output associated with that package when relevant

It should not behave like an admin diagnostic console.
The package should help stakeholders understand the workflow clearly, not overload them with internal judgment mechanics.

### 21.8 Seven-Condition Visibility Rule for the Initial Package

The locked reference’s seven critical completeness conditions should govern how the workflow is judged and formed, but they should **not** be shown as a standard visible diagnostic checklist inside the client- or stakeholder-facing Initial Workflow Package.

Instead:

* these seven conditions should remain visible to the admin as part of the internal judgment and review layer
* the outward-facing Initial Workflow Package should show the workflow and related package content, not the internal completeness-control framework itself

This preserves analytical rigor without burdening the first package with internal control mechanics.

### 21.9 Workflow Rationale Visibility Rule

Workflow Rationale remains a mandatory package section, but its presentation in the outward-facing Initial Workflow Package should remain practical and readable.
It should explain:

* why the workflow was formed this way
* what major evidence shaped it
* what major interpretation limits still matter when relevant

It should not turn into a heavy internal-methodology explanation for ordinary stakeholders.

### 21.10 UI Overview Layer for the Initial Package

The Initial Workflow Package should also have a synchronized UI overview layer.
This layer should help fast understanding and should remain aligned with the analytical package rather than behaving as a separate output.

At minimum, the UI overview layer should support:

* package status / progress
* workflow quick summary
* key gaps
* critical unresolved items
* key recommendations
* document / reference implication status when relevant

### 21.11 Admin-Only Judgment Layer for the Initial Package

The admin should have access to an internal judgment layer linked to the Initial Workflow Package.
This internal layer may include:

* the seven critical completeness conditions and their current status
* package-readiness reasoning
* admin-facing confidence and evidence notes
* internal review prompts or flagged concerns

This layer supports admin decision quality but should not be treated as the ordinary stakeholder-facing package content.

### 21.12 Separation Between Outward Package and Admin Evaluation Layer

The implementation must preserve a clean separation between:

* outward Initial Workflow Package content
* admin-only evaluation and judgment support

This means the package may be generated for stakeholders without exposing the full internal completeness-governance mechanics.

### 21.13 Future Visibility Rule for Final Package UI

If the seven critical completeness conditions are later surfaced to non-admin viewers, the appropriate place is the Final Package UI overview layer rather than the ordinary Initial Workflow Package.

This future visibility should still be presented in a simplified, understandable form rather than as raw internal control language.

### 21.14 Build Meaning of This Section

This section establishes that the Initial Workflow Package is stakeholder-readable and workflow-centered, while the admin retains deeper visibility into the governing completeness logic used to judge the package.

## 22. Gap-Closure and Iteration Logic

### 22.1 Governing Scope of This Section

This section governs **operational gap closure and workflow-closure iteration only**.
It does not govern later management-facing inquiry for finalization support, target-state shaping, or higher-level document-authoring direction.

Those later management-facing inquiries should be handled in a separate section because they differ in:

* purpose
* audience
* channel
* authority level
* relation to final documentation shaping

### 22.2 Critical-Gap Detection Basis

Operational gap closure after the Initial Workflow Package should remain anchored to the seven critical completeness conditions from the locked reference.
Gap closure should focus on unresolved items that still materially affect:

* continuity of the core workflow sequence
* clarity of major transitions
* completeness of conditions needed for core steps
* decision rules or thresholds
* handoff or responsibility for core transitions
* control or approval logic for core steps
* workflow boundary clarity

### 22.3 Targeted Operational Gap-Closure Rule

Gap-closure rounds governed by this section should remain operationally targeted.
Their purpose is to close workflow-relevant gaps that still materially affect workflow completeness or dependable packaging.

They should not expand into broad management inquiry, strategic discussion, or target-state authorship discussion unless those concerns directly affect the unresolved operational gap itself.

### 22.4 Gap-Closure Inputs

Operational gap-closure may use inputs such as:

* current Initial Workflow Package findings
* unresolved workflow items
* participant round-one outputs
* participant clarification history
* post-round supporting evidence added to the case
* re-analysis results after added evidence

### 22.5 Participant-Facing Follow-Up Use

When the unresolved gap still belongs primarily to operational participants, the system may generate targeted later-round participant questions.
These questions should continue following the already-decided participant rules, including:

* one question at a time
* short explanation of why it is being asked
* simple example of a suitable answer
* acceptance of non-knowledge or ownership boundaries when genuine

### 22.6 Re-Analysis Triggers

Operational re-analysis should occur when one or more of the following happens:

* a materially important participant clarification answer is received
* new supporting evidence is added to the case
* a difference block is resolved or materially narrowed
* a higher-level operational owner clarifies a core rule

Re-analysis should update the workflow understanding without silently erasing traceability to prior state.

### 22.7 Gap-Closure Iteration Boundaries

Gap closure should remain controlled.
It should not become an endless general investigation loop.

An additional operational round should be justified only when it is likely to materially improve one or more of the seven critical completeness conditions or materially improve final package quality.

### 22.8 Limited Expansion Rule During Gap Closure

The default behavior of operational gap closure is targeted closure.
However, limited expansion is allowed when a nearby newly revealed issue clearly affects:

* one of the seven critical completeness conditions
* or dependable final package quality

This expansion must remain narrow and justified.
It must not turn operational gap closure into open-ended exploration.

### 22.9 Transition Out of Operational Gap Closure

Operational gap closure under this section ends when one of the following becomes true:

* the workflow is sufficiently closed for final-package progression
* remaining items are non-blocking and may stay visible as review items
* further operational participant questioning is no longer likely to improve the case materially

At that point, the case may move toward finalization readiness, final package preparation, or a separate management-facing inquiry path when higher-level clarification is still needed for final shaping.

### 22.10 Separation from Management Inquiry

Important rule:
The following should **not** be treated as ordinary operational gap-closure questioning under this section:

* company-level vision clarification
* target-state direction for final documentation
* strategic shaping of SOP / policy / SLA intent
* management-level target or direction setting
* higher-level formal document-authoring guidance

These belong to a separate later management-facing inquiry layer.

### 22.11 Build Meaning of This Section

This section establishes that gap closure in version one is a controlled operational closure process.
It closes workflow reality gaps and improves workflow completeness.
It does not absorb the later management-facing finalization inquiry path.

## 23. Management Inquiry and Finalization Support Logic

### 23.1 Governing Scope of This Section

This section governs the **management-facing inquiry path** that may occur after the Initial Workflow Package and after operational gap closure has been materially exhausted or sufficiently advanced.

This section is separate from ordinary participant-facing operational clarification.
Its purpose is not to reconstruct day-to-day workflow detail from frontline participants.
Its purpose is to obtain higher-level clarification, direction, or finalization support from management-level owners when needed.

### 23.2 Why This Section Must Remain Separate

Management-facing inquiry differs from ordinary operational gap closure in:

* audience
* authority level
* communication channel
* purpose
* relation to final documentation shaping
* relation to target-state or formal document direction

Therefore, it must not be collapsed into participant session logic or operational round logic.

### 23.3 Typical Triggers for Management Inquiry

A management-facing inquiry path may be opened when one or more of the following is true:

* operational workflow reconstruction is largely complete but final shaping still needs higher-level direction
* a target-state or final document direction requires management input
* a formal policy, SOP, SLA-supporting reference, or other final document requires managerial intent or positioning
* company-level boundaries, official ownership, or formal document purpose remain unclear
* later-stage clarification is needed that a frontline participant is not expected to answer

### 23.4 Typical Topics of Management Inquiry

Management-facing inquiry may address topics such as:

* official ownership or authority positioning
* purpose of the final document to be produced
* target-state direction where relevant
* company or department intent that materially affects final documentation shape
* management interpretation of document role or purpose
* formal expectations needed for final authoring or final package quality

This inquiry should not be used as a generic substitute for operational workflow questioning.

### 23.5 Management-Facing Document-Direction Recommendation Logic

This section should also support **management-facing recommendation on final document direction**.
The system should not assume that the correct final document type is always the same across domains, departments, or use cases.

Instead, after the workflow is sufficiently understood and the case has reached this later support stage, the system may recommend which documentation form is most appropriate for the case.

Examples may include recommendation toward:

* SOP
* policy
* SLA-supporting reference
* KPI or performance-reference support
* work instruction
* role/responsibility document
* process description or workflow description
* document set rather than a single document

### 23.6 Basis of Document-Direction Recommendation

Document-direction recommendation at this stage should be based on a combination of factors such as:

* the selected domain
* the selected department
* the selected use case
* the nature of the workflow reconstructed
* whether the workflow is primarily operational, policy-driven, service-level-driven, role-driven, or performance-driven
* what the existing document set already covers or fails to cover
* what kind of final package the case appears to justify

The system should not recommend a document type by label habit alone.

### 23.7 Recommendation vs Final Decision Rule

The system may recommend the most suitable document direction, but the final decision remains with the admin or management owner when formal document output is being shaped.

This preserves the project’s operator-led and human-governed model.

### 23.8 Recommendation Output Shape

When a document-direction recommendation is produced, it should explain at minimum:

* the recommended document type or document set
* why this recommendation fits the case
* what problem it solves
* what the alternative weaker fit would be when relevant

The recommendation should remain understandable to management and should support final document-shaping decisions.

### 23.9 Communication Channel Expectation

Management-facing inquiry in version one will often occur through more formal channels than ordinary participant sessions.
Typical channels may include:

* email
* formal written request
* management-facing review interface
* structured admin-mediated outreach

This path should not be assumed to use the same chat-style interaction used for ordinary participant workflow sessions.

### 23.10 Admin-Mediated Control Rule

Management inquiry should remain admin-mediated.
The system may help generate the inquiry content, but the admin remains the owner of whether, when, and to whom the inquiry is sent.

This preserves:

* operator-led control
* audience sensitivity
* appropriateness of escalation
* finalization discipline

### 23.11 Inquiry Package Basis

Management-facing inquiry should be grounded in the case as already analyzed.
It may draw on at minimum:

* the Initial Workflow Package
* unresolved items remaining after operational gap closure
* current workflow synthesis
* currently available references
* later supporting evidence already added to the case
* admin notes and packaging intent when relevant

The inquiry should not be a generic open-ended request when targeted questions are possible.

### 23.12 Targeted Management Inquiry Rule

Management-facing inquiry should remain targeted.
It should ask only for the higher-level clarification or finalization support that is still materially needed.

The system should avoid sending broad vague requests such as “please explain everything.”
Instead, it should generate focused management-facing inquiry items linked to real case needs.

### 23.13 Distinction Between Workflow Closure and Finalization Support

Important rule:
Management inquiry under this section is not the same as participant-focused workflow closure.

* workflow closure asks: what actually happens in practice?
* management inquiry asks: what higher-level clarification or direction is still needed to finalize the workflow and/or formal document output responsibly?

This distinction must remain explicit.

### 23.14 Inquiry Outcomes

A management-facing inquiry may produce outcomes such as:

* clarified ownership positioning
* clarified document purpose
* clarified target-state direction
* clarified management intent for final documentation
* clarified official boundaries or formal expectations
* confirmation that no further management clarification is needed

### 23.15 Relationship to Final Package Readiness

Management-facing inquiry should support final-package readiness when higher-level clarification is still required.
It is not mandatory for every case.

If the case is already sufficiently mature for final packaging without management inquiry, the system may proceed without activating this path.

If the case still needs higher-level finalization support, this section becomes the appropriate controlled inquiry path before or during final-package preparation.

### 23.16 Traceability Note for This Section

This section should be treated as an **implementation formalization and partial execution extension**.
It reflects approved project direction around later-stage management involvement, finalization support, and document-direction reasoning, but it was separated and formalized here more explicitly for execution safety than in the locked main reference itself.

### 23.17 Build Meaning of This Section

This section establishes a separate management-facing inquiry layer for finalization support.
It protects the system from conflating frontline workflow reconstruction with higher-level final document shaping and managerial direction.

## 24. Final Workflow and Reference Package Logic

**Traceability note:** Parts of the final-package structuring in this section are direct restatements of locked project logic, while other parts are implementation formalizations introduced to make current-state workflow reality, target-state workflow, document-direction output, and comparison behavior mechanically buildable without silent invention.

### 24.1 Governing Role of the Final Package

The Final Workflow and Reference Package is the later formal package produced when the case is sufficiently mature for final structured output.
Its purpose is to provide the strongest finalized representation of:

* workflow reality
* final documentation direction or output
* improved or target-state direction when justified
* final comparison and closure visibility where relevant

The Final Package is not merely a more polished Initial Package.
It is the package intended to support final workflow understanding, formalized documentation output, and later operational usefulness.

### 24.2 Entry Conditions

The Final Package may be prepared when:

* operational workflow closure is sufficiently advanced
* any required management-facing inquiry for finalization support has been completed or judged unnecessary
* the workflow is sufficiently complete under the seven critical completeness conditions
* no remaining blocking issue prevents dependable final packaging
* final document direction is mature enough for final output shaping

### 24.3 Final Workflow Reality Logic

The Final Package must include a **Final Workflow Reality** layer.
This layer represents the strongest current-state workflow understanding after operational closure, supporting evidence, management-facing clarification where needed, and final review preparation.

It must remain explicitly grounded in workflow reality rather than being silently replaced by an idealized future design.

### 24.4 Final Source / Reference Output Logic

The Final Package must support a final source/reference output path appropriate to the case.
This may include for example:

* updated source aligned with reality
* rebuilt source draft
* reviewed source replacement candidate
* policy-oriented output
* SOP-oriented output
* SLA-supporting reference output
* work-instruction output
* role/responsibility output
* document-set recommendation or document-set output when one document is not enough

The final documentation form should follow the already-governed document-direction logic rather than defaulting to one document type by habit.

### 24.5 Improved / Target-State Workflow Logic

The Final Package should support an **Improved / Target-State Workflow** layer when justified.
This layer represents the recommended stronger future form of the workflow rather than the current reality layer.

It must remain explicitly separate from Final Workflow Reality.
The system must not merge the current-state workflow and the target-state workflow into one ambiguous output.

### 24.6 Governing Nature of the Improved / Target-State Workflow

In version one, the improved or target-state workflow should use a **hybrid improvement philosophy**.
This means:

* the target state should remain realistically connected to the current operating environment
* it should not become a fantasy workflow disconnected from implementation reality
* stronger improvement is allowed when it is materially necessary for clarity, documentation quality, or later automation-supportiveness

The target state should therefore be:

* practical
* implementable in principle
* more explicit than the current state where needed
* structurally stronger where the current state is too tacit, vague, or unstable

### 24.7 Automation-Supportive Target-State Rule

The improved or target-state workflow should not be improved merely cosmetically.
When this layer is present, it should be improved in ways that make the workflow more supportive of later automation thinking.

This means the target state should aim, where relevant, to improve clarity in areas such as:

* start and end boundaries
* explicit triggers
* input and output clarity
* approval conditions
* thresholds
* ownership
* handoffs
* decision branches
* structured workflow transitions

This does **not** turn the system into a technical automation-architecture engine.
It remains a workflow/documentation system.
But the target state should become more usable for later automation support where justified.

### 24.8 Final Document Output Beyond Workflow Only

The Final Package may include not only a target-state workflow but also a target-state or improved documentation output when justified.
This may include, depending on the case:

* improved SOP
* improved policy
* improved SLA-supporting reference
* improved work instruction
* recommendation document
* structured document set

These outputs should follow the final document-direction decision already supported earlier in the case.

### 24.9 As-Is vs Target-State Comparison Layer

The Final Package should support a comparison layer between:

* current workflow reality
* and improved / target-state workflow

This comparison may help explain:

* what is changing
* why it is changing
* what operational ambiguity is being removed
* what documentation quality is being improved
* what becomes more automation-supportive

The comparison layer may appear as:

* a comparison section in the analytical package
* a comparison artifact
* or a UI overview comparison view

### 24.10 Final Gap Analysis Logic

The Final Package should preserve a final gap layer that distinguishes at minimum between:

* closed items
* non-blocking remaining items
* later review items

The Final Package should not pretend that every case ends in total perfection.
It should preserve truthful residual visibility where useful.

### 24.11 Improvement-Target / Final Recommendations Logic

The Final Package should support final recommendations appropriate to the final maturity of the case.
These may include:

* improvement priorities
* document-strengthening directions
* ownership clarification reminders
* future refinement notes
* automation-supportive strengthening suggestions

These recommendations should remain aligned with the final workflow and final document direction rather than becoming a generic consulting wish list.

### 24.12 UI / Overview Layer Logic

The Final Package should have a strong UI / overview layer that helps non-technical review and decision-making.
At minimum, this overview layer may support:

* high-level workflow overview
* key challenges
* major decision points
* major handoffs
* summary recommendations
* current vs improved state visibility where present
* simplified visibility into why the workflow was formed this way

This is also the appropriate later place where simplified visibility of the governing completeness logic may be surfaced to non-admin viewers when useful.

### 24.13 Final Package Separation Rule

The Final Package must preserve clear separation between:

* current-state workflow reality
* improved / target-state workflow
* final documentation output
* final residual gaps or later review items

This separation is necessary to preserve truthfulness, improvement value, and final package clarity.

### 24.14 Build Meaning of This Section

This section establishes that the Final Package is the place where the system may move beyond current-state workflow reconstruction alone into stronger final documentation and improved target-state workflow output when justified.
However, it must still remain truthful, practical, human-governed, and workflow-centered.

### Implementation Formalization Note (non-governing)

Pass 8 implementation may consume output wording, document naming, section-label normalization, and enterprise-safe presentation language for client-facing surfaces in the Final Package layer. This is an implementation formalization enhancement only — not a new locked-source governing rule. It does not alter:

* package-entry conditions or eligibility rules
* review or release gates or blocking thresholds
* current-state vs target-state separation logic
* governance contracts or state transition semantics

Prompt reinforcement (rewriting or rebuilding prompt-chain logic) belongs to a separate later prompt-rebuild/analysis-improvement track and is outside Pass 8 scope.

## 25. Review, Approval, and Issue-Handling Logic

### 25.1 Governing Review Philosophy for v1

Version one should use a **hybrid admin review and issue-discussion model**.
This means:

* the system should surface structured issues when required
* the admin should be able to discuss the issue interactively with the system
* the discussion must remain scoped to the issue itself and its directly relevant context
* the discussion must still end in an explicit final admin action and resulting state update

This is not a generic free chat layer.
It is a controlled issue-resolution layer.

### 25.2 Flexible Admin-Review Model

The system uses a flexible admin-review model.
The admin is the final operating owner for high-impact judgment points.
The system may proceed automatically when no review trigger is present, but must stop and surface issues when review-trigger conditions are met.

### 25.3 Review Trigger Set

The locked main reference defines a canonical seven-point human-review trigger reference set.
That canonical set remains the primary review-trigger basis for version one.

At minimum, review should be raised for:

* high-impact contradiction
* low-confidence high-impact classification
* Draft v1 readiness decision
* Final Package release
* unresolved core-step ambiguity
* unclear reference suitability when it affects output direction
* boundary ambiguity when it materially affects use-case scope or final output quality
* any surfaced issue that the system cannot resolve with sufficient confidence and that materially affects workflow continuity, completeness, or output eligibility

The final catch-all trigger above should be treated as an **execution-safe extension** for implementation safety.
It should not be confused with the locked source’s canonical seven-point review-trigger reference set itself.

### 25.4 Admin Issue Brief Structure

Every surfaced issue must include a structured issue brief containing at minimum:

* issue title
* what happened
* why it was triggered
* likely source / source diagnosis
* why it matters
* what it affects
* severity / effect level
* system recommendation
* corrective direction

### 25.5 Interactive Admin Issue Discussion Layer in v1

The issue discussion layer in version one is admin-only.
It is not participant-facing and not team-collaboration-facing.

The admin must be able to discuss a specific issue interactively with the system rather than being limited to static approve/reject handling.
The system may:

* explain the issue in clearer terms
* explain why it considers the issue materially important
* suggest possible resolutions
* provide example answer shapes or resolution patterns when useful
* revise its interpretation after receiving admin correction or added context
* regenerate its recommendation within the same issue scope when needed

### 25.6 Scoped Discussion Rule

Issue discussion must remain **scoped to the issue and its directly relevant surrounding context**.
This means the discussion may refer to:

* the issue itself
* directly linked workflow steps
* directly linked prior or next steps when relevant
* linked sources or documents
* linked package sections
* linked decision blocks
* linked review context

The discussion must not drift into unrelated broad project chat.
If a new materially separate issue appears, it should be raised separately or linked as a related issue rather than silently absorbed into the current issue thread.

### 25.7 Contextual Reference Rule Inside Issue Discussion

Within a scoped issue discussion, the admin may ask the system to return to relevant nearby context, such as:

* a document that influenced the issue
* a previous step or next step in the workflow
* a linked package section
* a related clarification answer
* a related source or threshold definition

The system should support this because issue reasoning often depends on surrounding evidence.
However, this contextual return must still remain bounded by the issue’s real relevance.

### 25.8 Hybrid Discussion Behavior Rule

Issue discussion should begin in a structured, guided way.
The system should first present the issue clearly and in a controlled format.

After that, if the admin challenges the interpretation, requests a different angle, adds corrective input, or asks the system to revisit linked context, the discussion may become more flexible within the same scoped issue.

This creates a hybrid discussion model:

* structured at entry
* flexible during issue reasoning
* bounded by scope
* explicit at closure

### 25.9 Admin Correction and Reframing Support

During issue discussion, the admin must be able to:

* disagree with the system’s interpretation
* provide corrected understanding
* propose an alternative reasoning path
* ask for different resolution options
* ask the system to reframe the issue based on corrected context
* request regeneration of the affected recommendation or output path

The system should be able to adapt within the same issue thread rather than forcing a new issue for every interpretive refinement.

### 25.10 Controlled Final Admin Actions

After issue discussion, the admin’s final action must be selected from a controlled action list.
The version-one action set is:

* approve
* override
* request follow-up
* escalate
* keep visible as review item
* unblock
* keep blocked
* regenerate affected output

### 25.11 Optional Short Admin Note

The admin may add a short note when taking the final action.
This note should support traceability and explain the reasoning when useful.

### 25.12 Mandatory Resulting State Update

An issue discussion must not end in undefined limbo.
A resulting state update is mandatory after a final admin action is taken.

### 25.13 Issue Grouping Philosophy for v1

The default issue model in version one should treat issues as individually traceable.
However, when multiple issues clearly arise from the same root cause, decision block, or tightly linked structural problem, the system may support a parent issue with related child issues.

This grouping must not reduce traceability.
Its purpose is to organize related issue handling, not to blur distinct problems.

### 25.14 Discussion Closure Rule

An issue discussion may continue as long as it is materially advancing the understanding or resolution of that same scoped issue.
When the discussion no longer produces meaningful progress, the system should push toward explicit closure through one of the controlled final admin actions.

### 25.15 Draft Approval Gate

Draft v1 must not be released without explicit admin approval.

### 25.16 Final Package Approval Gate

The Final Workflow and Reference Package must not be released without explicit admin approval.

### 25.17 Build Meaning of This Section

This section establishes that version one uses structured issue surfacing plus scoped interactive admin discussion rather than static issue tickets only.
The admin may reason with the system, challenge it, redirect it, and ask it to revisit linked evidence.
But the discussion remains bounded, traceable, and closure-driven.

## 26. Failure and Fallback Logic

### 26.1 Governing Failure Philosophy for v1

Version one should use a **hybrid failure and fallback philosophy**.
This means:

* the system should continue where meaningful progress remains possible
* the system should not collapse into unnecessary stop states for every weakness or interruption
* the system must stop, block, or escalate when failure materially breaks one or more of the seven critical completeness conditions or materially damages package or finalization dependability

This preserves practical progress without allowing structurally unsafe continuation.

### 26.2 Progress-First but Not Blind Rule

The system should prefer continued progress when a failure, weakness, or interruption does not materially damage the workflow’s core structural completeness or the dependability of the next package stage.

However, progress must never become blind continuation.
If the case has crossed from imperfection into structural breakage, the system must surface that reality rather than pretending the flow is still dependable.

### 26.3 Governing Stop / Escalate Threshold

A failure condition should trigger stop, block, or mandatory escalation when it materially affects one or more of the following:

1. continuity of the core workflow sequence
2. clarity of how point A leads to point B and how point B leads to point C
3. completeness of the conditions required to understand or execute a core step
4. the decision rule or threshold needed for a core branch
5. the handoff or responsibility needed for a core transition
6. the control or approval logic required for a core step
7. the boundary required to understand where the use case actually begins or ends

In addition, stop or escalation is required when package eligibility or finalization dependability is materially compromised.

### 26.4 Readiness Failure Cases

If required readiness conditions are not satisfied, the system must not continue silently.
It must surface the blocking reason, explain what is missing, and hold progression at the appropriate pre-rollout or pre-release state.

Readiness failure should remain tied to explicit gating rules rather than vague caution.

### 26.5 Missing-Reference Cases

If references are expected but missing, the system must block rollout and surface the missing-reference issue.
If references do not exist and the admin confirms this explicitly, the system may continue in a reality-first mode with that condition visibly recorded.

Missing references should not be treated as universal failure in all cases.
Their effect depends on whether they are expected, required, or absent by confirmed reality.

### 26.6 Weak-Narrative Cases

If a participant narrative is too weak, too shallow, or too incomplete for dependable extraction, the system should not pretend the session is strong.
Instead it should do one or more of the following depending on severity:

* request targeted follow-up
* mark extracted fields as vague or unresolved
* keep the session as partial rather than complete
* escalate clarification when the missing point is structurally important

A weak narrative alone does not automatically kill the whole case.
Its importance depends on whether the missing information breaks workflow completion or core-step understanding.

### 26.7 No-Response or Delayed-Response Cases

If a targeted participant or management owner does not respond, the system should not immediately collapse the entire case.
Instead, it should assess whether the missing response:

* blocks a core completeness condition
* blocks package eligibility
* blocks management-finalization support materially
* or remains non-blocking at the current stage

Possible handling may include:

* retry or re-contact recommendation
* targeting another justified owner
* continuing with visible unresolved status
* surfacing the case to admin for decision

### 26.8 Incomplete-Hierarchy Cases

If hierarchy is incomplete before rollout, rollout must remain blocked.
If hierarchy problems are discovered after partial rollout has begun, the system should surface the issue to admin and limit further hierarchy-dependent targeting until the structure is corrected or re-approved.

### 26.9 Contradiction Cases

Not all contradictions are equal.
If a contradiction does not materially break workflow completion, it may remain visible as a review item while analysis continues.
If a contradiction materially breaks sequence continuity, core transitions, essential handoffs, core decision logic, or final output dependability, it must be treated as a blocking issue or critical issue depending on severity.

### 26.10 Clarification-Exhausted Cases

If clarification paths have been reasonably exhausted and a materially important ambiguity still remains unresolved, the system should not keep looping the same questioning indefinitely.
Instead, it should route the issue into the correct next state such as:

* visible unresolved item
* review-required item
* escalation target
* critical-gap blocker

The outcome should depend on structural impact, not on the mere fact that clarification ended.

### 26.11 Unresolved-Boundary Cases

If boundary ambiguity remains but does not prevent a useful initial analytical package, the system may proceed with the boundary source clearly marked and the ambiguity kept visible.
If the ambiguity materially affects final workflow dependability or final output quality, it must trigger review and may block finalization.

### 26.12 Channel Failure Cases

If a preferred communication channel fails, becomes unavailable, or proves unsuitable for the current interaction, the system should support fallback to another approved channel when useful.

Channel failure alone should not automatically destroy the case if:

* another allowed channel is available
* admin can redirect the outreach
* the missing communication is not yet structurally blocking

However, if channel failure prevents obtaining materially required input and no adequate fallback exists, the issue must be surfaced as a real blocker or escalation item.

### 26.13 Post-Round Supporting-Evidence Absence

If no optional supporting documents are uploaded after round one, the system should continue normally unless those documents have become materially necessary for:

* one of the seven critical completeness conditions
* package eligibility
* finalization dependability

Optional evidence must remain optional unless the case has reached a point where its absence now causes structural incompleteness.

### 26.14 Management-Inquiry Failure Cases

If a management-facing inquiry does not receive a sufficient answer, the system should assess whether the missing management clarification:

* truly blocks final package formation
* only limits target-state shaping
* only limits final document-direction confidence
* or remains a visible but non-blocking imperfection

The system should not automatically block all finalization merely because management inquiry was attempted.
It should block only when the missing management input is materially necessary for dependable final packaging.

### 26.15 Package-Degradation and Partial-Progress Rules

The system should support partial progress rather than binary all-or-nothing collapse where appropriate.

This means:

* an Initial Workflow Package may still be valid with visible review items and unresolved non-blocking issues
* a Final Package must meet a higher closure standard
* recommendation output may remain valid where draft output is not yet eligible
* current-state workflow may remain publishable internally even when target-state shaping still needs more support

### 26.16 Fallback Routing Rule

When a failure occurs, the system should prefer the lightest valid fallback that preserves truthfulness and governance.
Possible fallback directions may include:

* continue with visible unresolved status
* request targeted follow-up
* escalate to higher owner
* switch communication channel
* downgrade from draft path to recommendation path
* hold finalization while preserving interim outputs
* surface issue to admin for explicit decision

The fallback chosen must match the actual structural impact of the failure.

### 26.17 When the System Must Surface the Case to Admin Instead of Deciding Silently

The system must surface the case to admin rather than deciding silently when:

* it cannot resolve the issue with sufficient confidence
* the issue materially affects workflow continuity
* the issue materially affects workflow completeness
* the issue materially affects output eligibility
* the issue affects a high-impact judgment or release decision
* the issue may require human override, prioritization, or acceptance of residual imperfection

The system is not expected to predict every possible failure in advance.
Its responsibility is to detect meaningful problems, explain them, show their likely source and impact, recommend a corrective direction, and return final judgment authority to the admin when the issue is materially important.

### 26.18 Build Meaning of This Section

This section establishes that failure handling in version one is neither brittle nor permissive.
The system should continue when truth-preserving progress is still possible.
It should stop or escalate when structural completeness, package dependability, or finalization quality would otherwise be compromised.

## 27. Channel and Communication Logic

### 27.1 Governing Channel Philosophy for v1

Version one should treat communication channels as **transport and interaction adapters**, not as the product core.
The core case logic, state progression, review governance, package generation, and final judgment remain channel-independent.

Channels exist to:

* deliver participant-facing prompts
* collect participant input
* support follow-up interaction where allowed
* support management-facing inquiry where appropriate
* return messages to the same underlying case logic

### 27.2 Transport-Only Adapter Rule

Messaging or communication channels must remain transport-only at the architecture level.
This means channels may carry:

* participant explanations
* follow-up questions
* clarification requests
* management-facing inquiry content
* notification or release-related communication when allowed

But they must not own:

* workflow reconstruction logic
* synthesis logic
* package eligibility logic
* review-gate logic
* release-gate logic
* state-governance logic

### 27.3 Channel-Independent Core-State Rule

The same underlying case, session, issue, and package states must remain valid regardless of the external channel used.

This means the system should not treat WhatsApp, Telegram, web intake, or email as separate workflow engines.
They are adapters into the same governed core.

### 27.4 WhatsApp / Telegram / Web Handling at Logic Level

Version one may support participant-facing operational interaction through channels such as:

* WhatsApp
* Telegram
* web-based intake or voice/text pages
* other approved transport channels

These channels may be used for:

* first-round operational narrative capture
* targeted participant clarification rounds
* selective later-round participant follow-up when appropriate

The choice of channel should not change the governing logic of participant interaction.

### 27.5 Participant-Facing Channel Simplicity Rule

Participant-facing communication should remain simple and accessible.
Regardless of channel, participant communication should preserve the already-decided rules such as:

* short explanation of what is needed
* open narrative first where appropriate
* one clarification question at a time
* short explanation of why the question is being asked
* simple example of a suitable answer
* acceptance of non-knowledge or non-ownership when genuine

The channel must not force exposure of heavy internal system structure to the participant.

### 27.6 Email Usage Philosophy for v1

Version one should use a **hybrid email usage model**.
This means:

* email should be the default channel for management-facing inquiry and later finalization support
* email may also be used exceptionally for participant-facing follow-up when justified
* email must not become the default first-round participant workflow channel when more direct interaction channels are available and suitable

### 27.7 Default Management-Facing Email Rule

Email should be the default communication path for:

* management inquiry
* finalization support requests
* higher-level formal clarification
* targeted document-direction or final shaping inquiries when appropriate

This is because these later inquiries are often more formal, more deliberate, and more suitable for management-level communication than ordinary participant chat-style interaction.

### 27.8 Exceptional Participant Email Use Rule

Email may be used for participant-facing follow-up only in limited justified cases such as:

* the usual chat-style channel is unavailable
* the participant requires a more formal written request
* the admin explicitly chooses email for that participant or case
* the communication needs to carry a more formal supporting request than the normal participant interaction path

This use should remain exceptional rather than default.

### 27.9 Admin-Controlled Channel Selection Rule

The admin should retain controlled authority over which channel is used when more than one channel is available.
The system may support or suggest channel use based on the case stage, but the admin remains the final channel-selection authority where this matters operationally.

### 27.10 Channel Traceability Rule

When a communication event materially affects the case, the system should preserve traceability for at minimum:

* which channel was used
* who was contacted
* what case object it related to where relevant
* when the communication occurred
* whether a response was received
* whether the communication affected session, clarification, inquiry, or finalization progression

This prevents channel usage from becoming an invisible side path outside the case record.

### 27.11 Channel Failure and Fallback Relationship

If a preferred channel fails, becomes unavailable, or is unsuitable for the current interaction, the system should support fallback to another allowed channel without breaking the underlying case logic.

Examples may include:

* moving from chat-style participant interaction to email when necessary
* moving from one messaging adapter to another approved adapter
* shifting management inquiry into a more formal written path

This fallback must remain traceable and admin-visible.

### 27.12 Build Meaning of This Section

This section establishes that channels in version one are controlled interaction paths, not separate logic centers.
They must remain simple for participants, suitable for management where needed, traceable in the case record, and subordinate to the same governed core workflow.

## 28. State Model

### 28.1 Governing State-Transition Philosophy for v1

Version one should use a **hybrid state-transition model**.
This means:

* the system itself must follow explicit state transitions only
* the system must not perform silent state jumps
* the admin may perform limited, traceable overrides in defined cases when justified

This preserves correctness and predictability while still allowing controlled human flexibility.

### 28.2 Why the System Must Remain Transition-Strict

The system should not move between major case states through vague internal judgment alone.
This is especially important because the build includes:

* readiness gates
* operational gap closure
* management-facing inquiry
* package-generation stages
* review gates
* release gates

If the system were allowed to jump freely across these stages, traceability and correctness would weaken quickly.

### 28.3 Admin Override Principle

Admin override is allowed in version one, but it must remain:

* limited
* explicit
* traceable
* reviewable later

Admin override exists to support real operating judgment in exceptional cases.
It does not convert the system into an unstructured manual workflow.

### 28.4 State Families in v1

The system should preserve separate state families rather than collapsing all progression into one label.
At minimum, the model should distinguish between:

* case states
* rollout-readiness states
* session states
* package states
* review states
* release states

A change in one state family must not silently imply a change in another family unless a defined transition rule says so.

### 28.5 Case States

At minimum, case handling should support states such as:

* created
* context_in_progress
* context_ready
* rollout_ready
* rollout_active
* analysis_in_progress
* initial_package_ready
* gap_closure_active
* management_inquiry_active
* final_package_ready
* closed

### 28.6 Explicit Case-State Transition Matrix

The allowed default case-state transitions in version one should be as follows.

#### 28.6.1 created

Allowed next states:

* **context_in_progress**

Who may trigger:

* system
* admin

Minimum condition:

* case record exists with minimum creation inputs

Admin override allowed:

* not normally needed

#### 28.6.2 context_in_progress

Allowed next states:

* **context_ready**
* **closed** (admin only for aborted case)

Who may trigger:

* system for context_ready when readiness conditions are met
* admin for closure/abort

Minimum condition for context_ready:

* case framing inputs are sufficiently present for readiness evaluation

Admin override allowed:

* limited, with traceable reason

#### 28.6.3 context_ready

Allowed next states:

* **rollout_ready**
* **context_in_progress** (admin reopen when context is found insufficient)
* **closed** (admin only)

Who may trigger:

* system for rollout_ready when pre-rollout conditions are satisfied
* admin for reopen or abort

Minimum condition for rollout_ready:

* hierarchy approved
* references uploaded or explicitly confirmed absent
* targeting basis sufficiently defined
* admin rollout approval given

Admin override allowed:

* yes, but only by admin and with traceability

#### 28.6.4 rollout_ready

Allowed next states:

* **rollout_active**
* **context_in_progress** (admin reopen if readiness breaks)
* **closed** (admin only)

Who may trigger:

* system when rollout starts through approved participant targeting
* admin for reopen or abort

Minimum condition for rollout_active:

* first-round targeting begins through an allowed channel or interaction path

Admin override allowed:

* yes, with traceable reason

#### 28.6.5 rollout_active

Allowed next states:

* **analysis_in_progress**
* **rollout_ready** (admin pause/reset before meaningful analysis)
* **closed** (admin only)

Who may trigger:

* system when sufficient participant/session material exists for analytical processing
* admin for pause/reset/abort

Minimum condition for analysis_in_progress:

* participant input exists in a form suitable for extraction and analysis

Admin override allowed:

* limited, with traceability

#### 28.6.6 analysis_in_progress

Allowed next states:

* **initial_package_ready**
* **rollout_active** (admin reopen participant collection)
* **closed** (admin only)

Who may trigger:

* system when the workflow is sufficiently reconstructable for an Initial Workflow Package
* admin for reopen or abort

Minimum condition for initial_package_ready:

* evaluation logic indicates readiness for Initial Package formation
* no blocking issue prevents meaningful first packaging

Admin override allowed:

* yes, but only by admin and with traceability

#### 28.6.7 initial_package_ready

Allowed next states:

* **gap_closure_active**
* **management_inquiry_active**
* **final_package_ready**
* **analysis_in_progress** (admin reopen analysis)
* **closed** (admin only)

Who may trigger:

* system for gap_closure_active when operational closure is still materially needed
* system for management_inquiry_active when higher-level finalization support is materially needed
* system for final_package_ready when final-package conditions are already sufficiently met without further closure
* admin for reopen or abort

Minimum condition for gap_closure_active:

* unresolved operational gaps still materially affect one or more of the seven critical completeness conditions or final package quality

Minimum condition for management_inquiry_active:

* higher-level clarification or document-direction support is materially needed for finalization

Minimum condition for final_package_ready:

* no further operational closure or management inquiry is materially required
* final-package logic is sufficiently satisfied

Admin override allowed:

* yes, limited and traceable

#### 28.6.8 gap_closure_active

Allowed next states:

* **initial_package_ready**
* **management_inquiry_active**
* **final_package_ready**
* **closed** (admin only)

Who may trigger:

* system when targeted closure materially updates the case
* admin for redirect, closure, or abort

Minimum condition for return to initial_package_ready:

* gap-closure work produced meaningful update but the case still belongs in initial-package maturity rather than final readiness

Minimum condition for management_inquiry_active:

* operational closure is sufficiently advanced and remaining needs are management-level rather than participant-level

Minimum condition for final_package_ready:

* operational closure no longer leaves a blocking gap for final packaging

Admin override allowed:

* yes, limited and traceable

#### 28.6.9 management_inquiry_active

Allowed next states:

* **final_package_ready**
* **gap_closure_active** (if the response reveals new operational closure need)
* **initial_package_ready** (admin return to earlier packaging state)
* **closed** (admin only)

Who may trigger:

* system when management-facing clarification sufficiently matures finalization
* admin for redirect or abort

Minimum condition for final_package_ready:

* required management-facing clarification is complete or judged sufficiently unnecessary
* final package no longer lacks materially required higher-level support

Admin override allowed:

* yes, limited and traceable

#### 28.6.10 final_package_ready

Allowed next states:

* **closed**
* **management_inquiry_active** (admin reopen)
* **gap_closure_active** (admin reopen)
* **analysis_in_progress** (admin reopen in exceptional case)

Who may trigger:

* system or admin for closure once release and final handling are complete
* admin for reopen paths only

Minimum condition for closed:

* final package handling is complete and no further active work is intended

Admin override allowed:

* reopen allowed only by admin with strong traceability

#### 28.6.11 closed

Allowed next states:

* no automatic next state
* reopen only by admin override into an explicitly chosen prior state

Who may trigger:

* admin only

Minimum condition:

* explicit admin decision with reason

Admin override allowed:

* this state itself may only be reversed by admin

### 28.7 Rollout Readiness States

Rollout readiness should be tracked separately from general case existence.
At minimum, rollout readiness should reflect:

* hierarchy status
* reference status
* targeting status
* admin rollout approval status

### 28.8 Rollout-Readiness Transition Rule

Rollout-readiness state should not move to a ready/unlocked posture unless all required readiness conditions are satisfied.
If a readiness pillar later breaks, the readiness state may move backward without necessarily erasing the broader case state.

This keeps readiness governance precise.

### 28.9 Session States

Participant sessions should support states such as:

* not_started
* input_received
* extraction_in_progress
* follow_up_needed
* session_partial
* session_ready_for_synthesis

### 28.10 Session-State Transition Rule

A participant session should normally progress in the following direction:

* not_started → input_received → extraction_in_progress → follow_up_needed or session_partial or session_ready_for_synthesis

The exact branch depends on:

* input strength
* unresolved ambiguity
* boundary signals
* whether more participant clarification is materially useful

The system must not treat input_received as automatically equivalent to session_ready_for_synthesis.

### 28.11 Package States

Package states should distinguish at minimum:

* not_started
* initial_package_in_progress
* initial_package_ready
* final_package_blocked
* final_package_in_progress
* final_package_ready

### 28.12 Package-State Transition Rule

The default package-state transitions should be as follows:

* **not_started → initial_package_in_progress → initial_package_ready**
* **initial_package_ready → final_package_in_progress** only when finalization work legitimately begins
* **final_package_in_progress → final_package_ready** when final-package conditions are sufficiently met
* **final_package_in_progress → final_package_blocked** when a material blocker appears
* **final_package_blocked → final_package_in_progress** only after the blocker is resolved or admin explicitly unblocks with traceability

Package states must remain separate from release states.
A package may be ready without yet being released.

### 28.13 Review States

Review handling should distinguish at minimum:

* no_review_needed
* review_required
* issue_discussion_active
* action_taken
* review_resolved

### 28.14 Review-State Transition Rule

The default review-state flow should be:

* no_review_needed → review_required → issue_discussion_active → action_taken → review_resolved

The system may skip issue_discussion_active only when direct admin action occurs without a discussion loop.
However, the review state must still preserve that action was taken and resolved.

### 28.15 Release States

Release states should distinguish whether an output is:

* not_releasable
* pending_admin_approval
* approved_for_release
* released

### 28.16 Release-State Transition Rule

The default release-state flow should be:

* not_releasable → pending_admin_approval → approved_for_release → released

The system must not move directly from not_releasable to released.
The system must not treat package existence as equivalent to release approval.

### 28.17 Explicit Transition Rule

Major case-state movement must happen only through explicitly allowed transitions.
The system must not infer that a convenient shortcut is acceptable unless that shortcut has been explicitly defined in the logic.

This rule applies especially to movement involving:

* rollout activation
* initial package readiness
* gap-closure activation
* management inquiry activation
* final package readiness
* release eligibility
* case closure

### 28.18 System-Forbidden Silent Jump Rule

The system must not silently jump across major stages such as:

* analysis_in_progress to final_package_ready
* initial_package_ready to released
* gap_closure_active to closed
* review_required to released

unless a specific explicit transition path exists and all required conditions are satisfied.

### 28.19 Admin Override Scope Rule

Admin override should be allowed only for defined state-governance situations where human judgment may legitimately accelerate, reopen, or redirect the case.

Typical examples may include:

* moving toward finalization despite non-blocking remaining review items
* reopening a case for further clarification or regeneration
* unblocking a case after direct admin review
* forcing regeneration of an affected package after a resolved issue

Admin override should not mean unlimited free state editing across the whole system.

### 28.20 Admin Override Traceability Requirements

Whenever an admin performs a state-affecting override, the system should preserve at minimum:

* the prior state
* the resulting state
* who performed the override
* when it was performed
* the stated reason
* any linked issue or review context when relevant

### 28.21 State-Transition Relationship to Review and Release

State transitions must remain consistent with review and release governance.
For example:

* a package should not become released merely because it exists
* a review-required state must not be treated as implicitly resolved
* final package readiness is not the same as release approval

The state model must preserve these separations clearly.

### 28.22 Build Meaning of This Section

This section establishes that version one uses explicit, rule-bounded state progression with controlled human override only where justified.
The system remains state-disciplined.
The admin remains the limited exception authority.

## 29. Contracts and Schemas to Be Defined in Fill Phase

### 29.1 Contract Design Rules

All contracts defined in this section must follow the following rules:

* every contract must separate required fields from optional fields
* every status field must use an explicit controlled value set rather than free text
* every review-sensitive decision must preserve traceability to the source that shaped it
* every contract must support later admin visibility where the field materially affects behavior
* optional extensibility is allowed only where it does not weaken correctness-critical validation

### 29.2 Cross-Contract Shared Conventions

The following conventions should be reused across contracts where applicable.

#### 29.2.1 Identifier Fields

Use stable machine IDs for major objects where applicable, such as:

* case_id
* source_id
* hierarchy_node_id
* participant_id
* session_id
* package_id
* prompt_id
* review_item_id

Human-readable labels may exist in parallel, but they must not replace machine identifiers.

#### 29.2.2 Timestamp Fields

Where state progression, review, upload, or release events matter, contracts should support explicit timestamp fields such as:

* created_at
* updated_at
* uploaded_at
* approved_at
* released_at

#### 29.2.3 Traceability Fields

Where a value materially affects interpretation, review, gating, or output direction, the contract should support traceability fields such as:

* source_reference
* source_section_link
* decision_block_link
* prompt_link
* operator_note_reference

#### 29.2.4 Confidence and Completeness Separation Rule

Confidence and completeness must remain separate.

* completeness answers whether a field is sufficiently filled for current use
* confidence answers how strong the system currently considers that field or interpretation

They must not be merged into one generic quality label.

#### 29.2.5 Controlled Status Family Rule

Status families should remain scoped.
For example:

* rollout readiness status must not be mixed with package release status
* session progress status must not be mixed with review resolution status
* document classification must not be mixed with reference suitability

### 29.3 Case Configuration Contract

The Case Configuration Contract defines the minimum structured record for a valid case.
It governs case identity, scope anchoring, early context, and readiness-relevant configuration.

#### 29.3.1 Required Fields

The contract must require at minimum:

* case_id
* company_context_source_present
* selected_domain
* selected_main_department
* selected_use_case_label
* case_created_by
* case_state
* rollout_readiness_state
* created_at

#### 29.3.2 Supported Optional / Near-Core Fields

The contract should support, when available:

* sub_department_or_functional_unit
* company_context_source_ids
* operator_notes
* early_reference_source_ids
* hierarchy_status
* reference_status
* targeting_status
* admin_rollout_approval_status
* use_case_boundary_source
* local_assumptions

#### 29.3.3 Controlled Value Expectations

At minimum, the following fields must use controlled values:

* selected_domain
* selected_main_department
* case_state
* rollout_readiness_state
* hierarchy_status
* reference_status
* admin_rollout_approval_status

#### 29.3.4 Validation Rule

A case must not transition into rollout-ready evaluation unless:

* the required case-creation fields are present
* hierarchy status is valid for rollout processing
* reference status is valid for rollout processing
* targeting basis is sufficiently defined

#### 29.3.5 Practical Output Shape

At minimum, the machine-facing case configuration object should conceptually support a shape such as:

* identity block
* scope block
* context-source block
* readiness block
* operator-input block
* traceability block

### 29.4 Source Registration Contract

The Source Registration Contract defines how every uploaded or registered source is tracked before deeper analysis.
It exists so the system does not treat files as anonymous blobs.

#### 29.4.1 Required Fields

Each source record must require at minimum:

* source_id
* case_id
* source_name
* source_origin_type
* uploaded_by
* uploaded_at
* extraction_status
* declared_label_if_any
* functional_classification_status

#### 29.4.2 Supported Optional Fields

The contract should support when available:

* source_owner
* source_purpose_if_known
* source_recency_if_known
* file_type
* language
* missingness_note
* classification_notes
* functional_primary_classification
* functional_secondary_classification
* reference_suitability_state
* context_only_flag
* workflow_reference_flag
* performance_reference_flag

#### 29.4.3 Controlled Value Expectations

At minimum, the following fields must use controlled values:

* source_origin_type
* extraction_status
* functional_classification_status
* functional_primary_classification when assigned
* reference_suitability_state when assigned

#### 29.4.4 Important Separation Rule

The source contract must preserve the distinction between:

* declared label
* functional classification
* suitability for workflow comparison
* role in the overall reference set

These are related but not interchangeable.

#### 29.4.5 Missing-Source Handling Support

The source registration layer should also support visible placeholder records for expected-but-missing sources when relevant.
Such a record should not pretend the file exists, but should preserve:

* expected source label
* why it is expected
* blocking or non-blocking effect
* current follow-up status

### 29.5 Hierarchy Contract

The Hierarchy Contract defines the approved machine-facing representation of the department tree used for rollout targeting, escalation routing, and synthesis ordering.

#### 29.5.1 Required Hierarchy-Level Fields

The hierarchy object must require at minimum:

* hierarchy_id
* case_id
* hierarchy_status
* generated_from_input_type
* admin_approval_status
* current_version
* created_at
* updated_at

#### 29.5.2 Required Node-Level Fields

Each hierarchy node must require at minimum:

* hierarchy_node_id
* role_label
* parent_node_id_or_root_flag
* hierarchy_level_type_or_rank
* in_use_case_scope_flag
* eligible_for_participant_targeting_flag

#### 29.5.3 Supported Optional Node-Level Fields

The contract should support when available:

* participant_ids_linked
* manager_of_nodes
* supervisor_of_nodes
* role_group_label
* notes_on_ambiguity
* external_interface_flag
* excluded_from_rollout_reason

#### 29.5.4 Controlled Value Expectations

At minimum, controlled values are required for:

* hierarchy_status
* admin_approval_status
* generated_from_input_type
* hierarchy_level_type_or_rank representation standard

#### 29.5.5 Approval and Correction Traceability

The contract must preserve:

* generated draft version
* correction history summary
* current approved version marker
* admin approval event

Implementation may store full correction diffs separately, but the hierarchy contract must still show which version is active.

### 29.6 Participant Session Record Contract

The Participant Session Record Contract is one of the most correctness-critical contracts in the build.
It defines the structured session record used for extraction, clarification, synthesis, and later package generation.

#### 29.6.1 Required Top-Level Layers

The session contract must preserve the following distinct top-level layers:

* session context layer
* raw input layer
* extracted workflow layer
* follow-up layer
* boundary and unknown interpretation layer
* analytical status layer
* confidence and evidence layer

These layers must not be collapsed into one undifferentiated object.

#### 29.6.2 Required Session Context Fields

At minimum:

* session_id
* case_id
* participant_id
* participant_role_label
* linked_hierarchy_node_id
* selected_domain
* selected_use_case_label
* input_modality
* session_state
* session_version

#### 29.6.3 Required Raw Input Fields

At minimum:

* raw_text_input_or_null
* raw_audio_reference_or_null
* raw_transcript_or_null
* cleaned_transcript_or_null
* language
* input_received_at

#### 29.6.4 Required Extracted Workflow Fields

At minimum:

* extracted_steps
* extracted_sequence
* extracted_handoffs
* extracted_decision_points
* extracted_exceptions
* extracted_controls
* extracted_systems
* extracted_dependencies
* extracted_unknowns

#### 29.6.5 Extracted Step Object Minimum Contract

Each extracted step object should support at minimum:

* step_id
* step_name
* actor
* trigger_or_input
* action
* output_or_outcome
* decision_point_if_present
* exception_if_present
* system_or_tool_if_present
* dependency_if_present
* evidence_notes

#### 29.6.6 Step-Field Completeness Status Rule

Important extracted fields should support completeness status using controlled values at minimum:

* clear
* vague
* inferred
* unresolved

These should be assignable at field level where practical, not only at whole-session level.

#### 29.6.7 Follow-Up Layer Minimum Fields

At minimum:

* follow_up_questions
* question_type
* target_gap_type
* helper_choices_if_any
* why_the_question_was_asked
* follow_up_answers
* participant_response_mode
* answer_interpretation_category

#### 29.6.8 Boundary and Unknown Interpretation Minimum Fields

The contract must support explicit structured categories at minimum for:

* knowledge_gap
* ownership_boundary
* execution_boundary
* visibility_limitation
* workflow_boundary_upstream
* workflow_boundary_downstream
* cross_team_boundary
* outcome_only_knowledge
* tacit_only_practice

#### 29.6.9 Analytical Status Minimum Fields

At minimum:

* participant_workflow_version
* unresolved_items
* escalation_candidates
* reference_check_candidates
* comparison_readiness
* drafting_readiness_signal

#### 29.6.10 Confidence and Evidence Minimum Fields

At minimum:

* evidence_sources_in_session
* explicit_vs_inferred_flags
* confidence_notes
* ambiguity_notes
* contradiction_notes
* owner_review_needed_points

#### 29.6.11 Evidence-Type Taxonomy Support

The contract should support evidence-type tagging at minimum for:

* explicit_participant_statement
* participant_followup_confirmation
* contextual_inference
* explicit_non_knowledge_or_boundary_signal
* cross_participant_pattern
* reference_supported_evidence

### 29.7 Initial Package Contract

The Initial Package Contract defines the structured output record for the first analytical package.
It must preserve the already-decided mixed contract model.

#### 29.7.1 Required Top-Level Fields

At minimum:

* package_id
* case_id
* package_type = initial_workflow_package
* package_state
* package_release_state
* package_generated_at
* derived_decision_outcome
* document_reference_implication_status

#### 29.7.2 Mandatory Content Sections

The contract must require the following sections:

* initial_synthesized_workflow
* workflow_rationale
* workflow_value_or_usefulness_explanation
* initial_gap_analysis
* initial_recommendations

#### 29.7.3 Conditional Content Section

The contract should support:

* document_reference_implication

This section is conditional and must not be force-filled when inactive.
Its state must instead be represented through the dedicated package-level status field.

#### 29.7.4 Representation Layers

The contract must distinguish between:

* analytical_document_layer
* ui_overview_layer

These are two synchronized representations of the same package, not two unrelated outputs.

#### 29.7.5 UI Overview Minimum Fields

At minimum:

* package_status_or_progress
* workflow_quick_summary
* key_gaps
* critical_unresolved_items
* key_recommendations
* document_reference_implication_status_when_relevant

#### 29.7.6 Gap Item Minimum Fields

Each major gap item in the initial package should support at minimum:

* gap_id
* gap_title
* why_flagged
* source_signal
* handling_status
* blocking_or_non_blocking
* related_workflow_area

#### 29.7.7 Recommendation Minimum Fields

Each recommendation should support at minimum:

* recommendation_id
* recommendation_text
* reason
* expected_impact
* recommendation_type
* priority_if_used

### 29.8 Final Package Contract

The Final Package Contract defines the structured record for the later formalized package that may support final workflow and final documentation/reference output.

#### 29.8.1 Required Top-Level Fields

At minimum:

* package_id
* case_id
* package_type = final_workflow_and_reference_package
* package_state
* package_release_state
* package_generated_at
* finalization_basis
* admin_approval_status

#### 29.8.2 Required Content Sections

At minimum, the contract must support:

* final_workflow_reality
* final_source_or_reference_output
* final_gap_analysis
* improvement_targets_or_final_recommendations
* ui_overview_layer

#### 29.8.3 Improved / Target-State Placement Rule

If improved or target-state workflow output is present, it must live only inside the Final Package contract and must remain explicitly separated from final workflow reality.

The contract should therefore support distinct fields such as:

* final_workflow_reality
* improved_or_target_state_workflow_optional

These must not be merged.

#### 29.8.4 Final Output Direction Traceability

The contract must preserve why the final source/reference output took its final form, such as:

* updated_source_aligned_with_reality
* rebuilt_source_draft
* reviewed_source_replacement_candidate
* recommendation_only_when_draft_not_eligible

#### 29.8.5 Non-Blocking Residual Visibility Rule

The Final Package contract should preserve non-blocking residual issues visibly rather than pretending total perfection.
The final gap layer should therefore distinguish between:

* closed_items
* non_blocking_remaining_items
* later_review_items

### 29.9 Prompt Registry Contract

The Prompt Registry Contract defines the controlled machine-facing prompt inventory used later in Phase 3.
Even though prompt-chain extraction comes later, the registry contract itself is correctness-relevant now because prompts must not become an untracked hidden layer.

#### 29.9.1 Required Fields

At minimum:

* prompt_id
* prompt_name
* linked_module
* linked_decision_block_if_any
* prompt_purpose
* input_contract_reference
* output_contract_reference
* config_variables_used
* source_section_links
* prompt_version
* active_or_inactive_status

#### 29.9.2 Important Rule

A prompt must not exist as an unregistered hidden behavior unit if it materially affects interpretation, extraction, gating support, synthesis drafting, or output generation.

#### 29.9.3 Registry vs Execution Separation

The registry contract defines prompt identity and control, not runtime orchestration.
Execution order, chaining, and runtime dependency are handled later in the prompt architecture section.

### 29.10 Minimum Validation Expectations Across the Contract Layer

Before implementation proceeds beyond the contract layer, the build should be able to validate at minimum:

* presence of required fields for each contract
* controlled status values
* separation of required distinct layers where mandated
* conditional-section behavior for initial and final package contracts
* traceability field presence for major review-sensitive or output-shaping decisions
* non-merging of as-is workflow reality with improved/target-state workflow

### 29.11 Fill-Phase Boundary Note

This section intentionally defines the contract layer at a build-governing level, not as final JSON Schema syntax.
The next implementation-facing step may translate these contracts into exact machine schemas such as:

* TypeScript interfaces
* JSON Schema
* database entity definitions
* validation-layer contracts

But that translation must preserve the logic fixed here.

## 30. Prompt Architecture

### 30.1 Governing v1 Prompt-Architecture Decision

Version one should use a **bounded hybrid architecture**.
This means the system should be built as:

* a deterministic correctness-critical control kernel
* modular skill / prompt units with explicit contracts
* a constrained orchestrator layer that may select among allowed modules but may not alter locked logic

This is the governing prompt-architecture decision for v1.
The build must not drift into a free-agent model.
The build must also not collapse into a rigid prompt-only structure that ignores the need for controlled orchestration.

### 30.2 Why Pure Agent-First Is Rejected for v1

A pure agent-first architecture is not appropriate for version one because this system contains correctness-critical behavior that must remain tightly controlled.

This includes at minimum:

* state transitions
* blocking logic
* review triggers
* release eligibility
* authority boundaries
* package finalization gates

Allowing a free agent to control these behaviors would weaken:

* traceability
* correctness
* predictability
* auditability
* admin control

Therefore, version one must not use a free-agent architecture as the primary control model.

### 30.3 Why Pure Rigid Prompt-Only Flow Is Also Insufficient

A fully rigid prompt-only flow is also insufficient because the system still requires controlled interpretive flexibility in areas such as:

* narrative extraction
* functional document interpretation
* clarification-target formation
* synthesis drafting
* contradiction surfacing
* recommendation drafting

These tasks benefit from LLM-driven interpretation.
Therefore, the architecture must preserve modular prompt-based intelligence without giving that intelligence uncontrolled authority.

### 30.4 v1 Prompt Architecture Layers

The v1 prompt architecture should be divided into four layers:

1. deterministic control layer
2. modular skill / prompt layer
3. bounded orchestrator layer
4. admin configuration and prompt-control layer

These layers must remain distinct.

### 30.5 Deterministic Control Layer

The deterministic control layer is the correctness-critical kernel of the system.
It is not prompt-owned.
It is rule-owned.

This layer must govern at minimum:

* state transitions
* rollout gates
* blocking rules
* review-trigger enforcement
* package eligibility
* release eligibility
* admin approval requirements
* controlled routing boundaries

The deterministic control layer may consume outputs from prompt-driven modules, but it must not surrender final control of correctness-critical decisions to prompts or to the orchestrator.

### 30.6 Modular Skill / Prompt Layer

The modular skill / prompt layer contains the discrete AI-assisted behavior units of the system.
Each module should exist as a controlled, named prompt unit rather than as hidden prompt logic embedded unpredictably across the system.

Examples of module purposes include:

* company-context interpretation
* functional document classification
* reference suitability assessment drafting
* participant workflow extraction
* clarification question generation
* ambiguity interpretation
* synthesis drafting
* gap analysis drafting
* recommendation drafting
* package-section drafting

Each prompt unit must have:

* a clear purpose
* an input contract
* an output contract
* linked source sections
* allowed config variables
* version identity
* activation status

### 30.7 Prompt Unit Definition Rule

A prompt unit is the minimum controlled AI behavior block used by the system.
A valid prompt unit must not be defined only by raw prompt text.
It must also be defined by its execution role inside the architecture.

At minimum, each prompt unit should be associated with:

* prompt_id
* prompt_name
* linked_module
* purpose
* trigger or caller condition
* required inputs
* expected outputs
* linked reference sections
* config-fed variables
* version
* status

If a prompt materially affects interpretation, extraction, synthesis, or output generation, it must be registered.
Hidden prompt behavior is not acceptable for correctness-relevant logic.

### 30.8 Module-First, Decision-Block-Second Prompt Chaining Rule

Prompt architecture should be organized module-first.
Within a module, prompt chaining may then be organized by decision block or subtask.

This means:

* the first organizing unit is the build module
* the second organizing unit is the internal decision block or sub-function inside that module

The system must not start from one giant orchestration prompt and then try to infer all behavior from it.
It must start from modular prompt units linked to build modules and explicit contracts.

### 30.9 Bounded Orchestrator Layer

The bounded orchestrator layer may decide which allowed module should run next, but only within the boundaries enforced by the deterministic control layer.

Its role is to:

* inspect the current allowed execution context
* choose the next permitted prompt unit or module
* pass the correct inputs and configuration
* receive module outputs
* return outputs to the rule-gated system flow

Its role is not to:

* invent new states
* bypass review gates
* bypass blocking logic
* redefine release eligibility
* change authority boundaries
* create hidden workflow branches
* replace the deterministic kernel

The orchestrator is therefore a constrained dispatcher or planner, not an unrestricted system agent.

### 30.10 Allowed and Forbidden Orchestrator Powers

#### Allowed

The bounded orchestrator may:

* select among already-allowed prompt units
* choose prompt versions from allowed sets when configuration permits
* route work between modules based on current validated state
* trigger non-correctness-critical reprocessing when rules allow it
* request prompt-driven clarification generation where the control layer allows clarification

#### Forbidden

The bounded orchestrator must not:

* mark a blocked case as unblocked by itself
* release Draft v1
* release the Final Package
* suppress a required review trigger
* redefine whether an issue is review-sensitive when that rule is locked
* skip required readiness gates
* create new module types or new prompt units silently
* merge as-is workflow reality with target-state workflow

### 30.11 Admin Configuration and Prompt-Control Layer

The admin configuration and prompt-control layer should expose the parts of prompt behavior that are intentionally configurable without changing locked system logic.

This layer should support controlled modification of items such as:

* domain overlays
* department overlays
* use-case overlays
* terminology overlays
* participant-facing wording style
* clarification style variants
* approved prompt family selection
* approved prompt version selection
* activation or deactivation of non-core prompt variants when supported

This layer must not allow admin edits to silently override:

* locked logic
* review gates
* state logic
* release eligibility
* authority boundaries

### 30.12 Prompt Registry Structure

The system must use a prompt registry rather than scattered unmanaged prompt text.
The prompt registry is the source of truth for prompt identity, linkage, and allowed usage.

At minimum, the prompt registry should preserve:

* prompt identity
* linked module
* linked decision block if applicable
* source-section traceability
* input and output contract links
* allowed config variables
* versioning
* active or inactive status
* override permissions if any

### 30.13 Prompt Dependencies and Execution Order

Prompt execution order must not be left to vague agent intuition.
It must be bounded by:

* current case state
* current readiness state
* module dependency rules
* contract readiness
* deterministic gate conditions

This means that even when the orchestrator selects the next allowed module, the effective execution order still remains rule-bounded rather than fully open-ended.

### 30.14 Prompt Override and Versioning Controls

Prompt override must be controlled.
Version changes must be traceable.
A new prompt version must not silently replace an existing active behavior without explicit registry-level identity and visibility.

At minimum, prompt controls should support:

* prompt_version
* active_or_inactive_status
* superseded_by reference when relevant
* admin-visible change note when changed
* allowed override scope

### 30.15 Prompt-to-Source Traceability Rule

Every prompt unit that materially affects behavior must link back to the source logic that justifies it.
This should include where applicable:

* locked main reference section link
* build translation notes link
* execution specification section link

If a prompt cannot be traced to approved source logic, it should be treated as unapproved behavior.

### 30.16 Prompt-to-Contract Binding Rule

Every prompt unit must bind to explicit contracts rather than loose text assumptions.
This means:

* prompt input fields must be known
* prompt output expectations must be known
* downstream modules must know what they are allowed to consume

This rule is especially important for:

* extraction prompts
* classification prompts
* synthesis prompts
* package-section drafting prompts
* clarification-generation prompts

### 30.17 Future Agent Expansion Rule

Future versions may introduce a more agentic orchestration model.
However, such expansion must be layered on top of the existing bounded hybrid architecture rather than replacing the deterministic correctness-critical kernel.

This means future agent growth may expand:

* planning flexibility
* selective autonomous routing
* broader investigative strategy
* adaptive follow-up strategy

But it must not dissolve:

* locked state logic
* review gates
* release gates
* correctness-critical rule ownership

### 30.18 Practical Build Meaning for v1

In practical build terms, version one should be implemented as:

* a rule-owned kernel
* a registry of modular prompt units
* a constrained orchestrator that calls allowed modules only
* an admin surface that can modify configurable prompt behavior without breaking locked logic

This is the intended architecture for implementation with coding agents such as Codex, Cursor, Claude Code, Antigravity, or similar tools.

## 31. Implementation Modularity and File-Boundary Rules

### 31.1 Governing Separation Decision for v1

Version one should use a **hybrid separation model**.
This means:

* correctness-critical modules require strict separation
* non-critical utilities may be grouped when doing so does not violate logical separation boundaries

This is the governing file-boundary and modularity decision for implementation.

### 31.2 Correctness-Critical Modules Requiring Strict Separation

The following modules or responsibility areas must remain strictly separated in implementation because they materially affect correctness, control, traceability, or release safety:

* state machine logic
* gating and blocking logic
* review and release logic
* contracts and schemas
* prompt registry
* orchestrator boundaries and routing rules
* admin approval enforcement
* package eligibility logic
* traceability and reference-linking core where implemented

Strict separation here means that these responsibilities must not be casually merged into one mixed service, utility layer, or prompt helper file.

### 31.3 Why Strict Separation Is Required for These Areas

These modules require strict separation because silent coupling across them would create high implementation risk, including:

* hidden authority drift
* accidental bypass of gates
* hard-to-detect release errors
* weak traceability
* prompt logic leaking into rule ownership
* coding-agent overreach through convenience refactors

For version one, safety of control boundaries is more important than reducing file count artificially.

### 31.4 Non-Critical Utilities That May Be Grouped

The following kinds of utilities may be grouped when doing so does not weaken logical separation:

* output formatting helpers
* channel adapter helpers
* non-core prompt utilities
* rendering helpers for overview or display formatting
* non-authoritative text transformation helpers
* registry-read utilities that do not own registry policy

Grouping these utilities is acceptable only when the grouping remains implementation-convenient and does not create control ambiguity.

### 31.5 Grouping Boundary Rule

A utility or helper may be grouped with nearby implementation helpers only if all of the following remain true:

* the grouped code does not define or override correctness-critical decisions
* the grouped code does not own state transitions
* the grouped code does not own release approval logic
* the grouped code does not alter locked gating behavior
* the grouped code remains replaceable without forcing structural rewrite of core control modules

If these conditions do not hold, the code must be split back into a stricter module boundary.

### 31.6 Module-Per-Responsibility Rule

Each major build module should have a clearly bounded implementation responsibility.
A module may collaborate with other modules, but it must not absorb their authority.

At minimum, the build should preserve clear implementation boundaries for:

* control kernel
* state model handling
* readiness and gating enforcement
* participant session processing
* clarification and escalation handling
* synthesis
* workflow evaluation
* package generation
* review and issue handling
* release handling
* prompt registry and prompt loading
* admin configuration management

### 31.7 Isolated Change Rule

The implementation should support local change wherever possible.
A change to one module should not require avoidable edits across unrelated modules.

This is especially important for:

* prompt family changes
* contract expansion
* state-machine refinements
* package-section refinements
* admin-surface changes
* channel-adapter changes

If a planned change would force large unrelated edits, that is a signal that the current file boundary or module separation is too weak.

### 31.8 Non-Cascading Modification Goal

The implementation should aim for non-cascading modification.
This means:

* changing prompt wording should not require changing state logic
* changing a display helper should not require changing eligibility logic
* changing an admin-visible configurable prompt family should not require changing release rules
* changing a channel adapter should not require rewriting participant session contracts

Perfect isolation is not always possible, but this should remain the design goal.

### 31.9 File-Boundary Rule for Rule-Owned vs Prompt-Owned Behavior

Rule-owned behavior and prompt-owned behavior must not be buried together in a way that obscures authority.

At minimum:

* rule-owned logic should live in files or modules whose authority is explicit
* prompt-owned behavior should remain linked to the prompt registry and prompt-execution layer
* mixed files that blur rule ownership and prompt wording should be avoided for correctness-critical behavior

This rule is essential to preserve the already-decided LLM-first with rule gates model.

### 31.10 File-Boundary Rule for Orchestrator Ownership

The orchestrator must remain implementation-bounded.
Its code should not own:

* state definitions
* release approvals
* review trigger policy
* locked gating thresholds

It may coordinate allowed execution, but it must call into owned rule modules rather than silently absorbing their logic.

### 31.11 Contracts and Schemas as Independent Build Surfaces

Contracts and schemas should remain an independent implementation surface rather than being hidden inside business-logic modules.

This means the build should preserve distinct ownership for:

* type definitions or interfaces
* schema definitions
* contract validation
* contract evolution notes where maintained

Business logic may depend on contracts, but it should not redefine them opportunistically inside module code.

### 31.12 Prompt Registry as an Independent Build Surface

The prompt registry should remain independent from:

* orchestrator execution code
* admin configuration UI code
* module-specific business logic

This is necessary so prompt identity, traceability, versioning, and activation state remain visible and auditable.

### 31.13 Admin Configuration Surface Boundary Rule

Admin-visible configuration should remain separate from the locked core modules it influences.

This means:

* admin configuration may feed allowed values into modules
* admin configuration may select prompt families or versions where allowed
* admin configuration must not directly rewrite locked control logic inside core modules

The implementation should therefore keep a clean separation between:

* configuration storage and exposure
* controlled configuration application
* locked execution logic

### 31.14 Channel Adapter Boundary Rule

Messaging or channel adapters such as WhatsApp, Telegram, or web intake handlers should remain outside the core control kernel.
They may:

* send and receive participant-facing messages
* transport inputs into the system
* deliver follow-up prompts and collect responses

But they must not become the place where correctness-critical workflow policy is owned.

### 31.15 Package Rendering vs Package Eligibility Separation Rule

The code that renders or formats package output should remain separate from the code that decides whether the package is eligible to exist, be reviewed, or be released.

This means:

* formatting and presentation helpers may be grouped with other output utilities
* package eligibility and release rules must remain in stricter control modules

The system must not confuse "can render" with "may release."

### 31.16 Coding-Agent Safety Meaning

This modularity decision is especially important because the implementation may be developed using coding agents such as Codex, Cursor, Claude Code, Antigravity, or similar systems.

These agents work better when:

* authority boundaries are explicit
* files reflect true responsibility
* contracts are visible
* module ownership is clear

Without these boundaries, coding agents are more likely to merge unrelated concerns for convenience, which would weaken maintainability and correctness.

### 31.17 Practical v1 Build Interpretation

In practical version-one terms, the implementation should follow this rule:

> Correctness-critical modules require strict separation: state machine, gating rules, review and release logic, contracts and schemas, prompt registry, orchestrator boundaries. Non-critical utilities such as output formatting helpers, channel adapter helpers, and non-core prompt utilities may be grouped when doing so does not violate logical separation boundaries.

This is the active file-boundary and modularity rule for v1.

## 32. Agent Build Workflow

### 32.1 Governing Build Philosophy for Coding Agents

Coding agents used for implementation in version one should follow a **hybrid build-discipline model**.
This means:

* the default build behavior should be module-by-module
* a small multi-module bundle may be built together only when the modules are so directly interdependent that isolated construction would prevent meaningful implementation or testing
* any such bundled build must remain justified, explicit, and limited

This prevents both monolithic uncontrolled building and unrealistic over-fragmentation.

### 32.2 How Coding Agents Should Read the Source Set

Before building, a coding agent should treat the source set in the following order of authority:

1. locked main reference
2. build translation notes where applicable
3. execution logic specification
4. approved local patch decisions recorded in the execution specification

If a later implementation move cannot be reconciled with this source hierarchy, the agent must stop and surface the ambiguity rather than silently improvising.

### 32.3 Module-by-Module Default Rule

The default implementation behavior should be to build one responsibility-bounded module at a time.
This is the preferred default because it improves:

* traceability
* testability
* review clarity
* rollback safety
* change isolation

Examples of module-level build units may include:

* state-governance module
* source registration module
* participant session processing module
* clarification module
* synthesis module
* workflow evaluation module
* package generation module
* prompt registry module

### 32.4 Limited Bundle Build Exception Rule

A coding agent may build a small bundle of directly linked modules together only when all of the following are true:

* the modules are immediately interdependent
* meaningful testing would be unrealistic if they were built in isolation
* the bundle remains narrow and clearly bounded
* the bundle does not blur authority between unrelated responsibilities
* the reason for bundling is made explicit

This exception exists for practical implementation realism, not for convenience-driven sprawl.

### 32.5 Examples of Acceptable Small Bundles

Examples of acceptable bundled implementation may include situations such as:

* a state-transition module plus its validation guard layer
* a prompt registry reader plus prompt execution adapter scaffolding
* a package generator plus its contract validator when they cannot be meaningfully exercised apart
* a participant session processor plus immediate extraction persistence layer when separated construction would produce non-testable stubs only

These examples are illustrative, not automatic permission for broad multi-module construction.

### 32.6 Examples of Unacceptable Bundling

The following kinds of bundling should be treated as unsafe or unjustified in version one:

* merging state logic with prompt wording logic
* merging review-gate policy with output rendering helpers
* merging orchestrator routing logic with release approval logic
* merging admin configuration UI concerns with locked rule ownership
* building large cross-cutting system slices merely because they seem faster

These patterns weaken modularity, traceability, and later maintainability.

### 32.7 What Agents Are Not Allowed to Invent

Coding agents are not allowed to invent:

* new workflow states
* new state jumps
* new package eligibility rules
* new review triggers
* new release conditions
* new authority boundaries
* new prompt units that materially affect behavior without registry treatment
* new document-direction rules not grounded in the approved logic
* hidden fallback behavior that changes system governance

If the required behavior is not already justified by the approved sources, the agent must stop and surface the gap.

### 32.8 When Agents Must Stop and Surface Ambiguity

A coding agent must stop and surface ambiguity when:

* a needed transition path is not defined
* a required contract field is unclear
* two approved rules appear to conflict materially
* a build step would require inventing gating logic
* a prompt-dependent behavior has no approved contract or registry identity
* a later implementation move would merge separated authority boundaries

Stopping in these cases is a sign of correct behavior, not failure.

### 32.9 Required Build Output Per Implementation Pass

For each meaningful implementation pass, the coding agent should make explicit at minimum:

* what module or bundle is being built
* why this scope was chosen
* what approved logic it implements
* what assumptions, if any, were required
* what remains intentionally unimplemented in that pass
* how the result should be validated

This keeps build work reviewable and reduces silent scope drift.

### 32.10 Validation Expectation Per Build Pass

Every implementation pass should end with a validation expectation appropriate to the scope built.
This may include:

* contract validation
* state-transition validation
* unit-level logic checks
* bundle-level interaction checks
* prompt-registry loading checks
* package-generation output checks

A pass should not be treated as complete merely because code was written.
It should be treated as complete only when its intended logic can be meaningfully checked.

### 32.11 Patch Discipline Rule

When a coding agent modifies an existing module, it should prefer a local patch rather than a broad rewrite unless one of the following is true:

* the current implementation violates locked architecture boundaries
* the module cannot be corrected without structural repair
* the existing code is too entangled to preserve safely

The burden is on the agent to justify broad rewrite rather than assume it.

### 32.12 Relationship to Prompt Architecture

A coding agent must not treat prompt architecture as a hidden secondary concern.
If a built module materially depends on prompt behavior, the implementation must remain aligned with:

* prompt registry rules
* input/output contract binding
* allowed config variables
* source traceability rules

This prevents prompt-driven behavior from becoming an untracked informal layer.

### 32.13 Relationship to Admin Override and Human Governance

Coding agents must preserve the already-decided human-governed model.
This means implementation must not quietly convert admin override, admin review, or admin approval into fully autonomous system behavior.

Where admin authority exists, it must remain visible and deliberate in the implementation.

### 32.14 Practical Meaning for Codex, Cursor, Claude Code, and Similar Tools

For coding-agent tools such as Codex, Cursor, Claude Code, Antigravity, and similar systems, the practical working rule is:

* default to one clear module at a time
* allow only narrow justified bundles
* never cross authority boundaries casually
* never invent missing governance
* always surface ambiguity instead of guessing

### 32.15 Build Meaning of This Section

This section establishes that coding agents in version one should build with disciplined modular sequencing rather than free-form broad implementation sweeps.
The system may be implemented pragmatically, but not at the expense of authority boundaries, traceability, or correctness.

## 33. Step-by-Step Prompt Chain Plan

### 33.1 Governing Prompt-Chain Philosophy for v1

Version one should use a **hybrid prompt-chain model**.
This means:

* the primary organization of prompts should remain module-based
* the chain must also preserve explicit end-to-end flow visibility across the case lifecycle
* the prompt chain must be reviewable and explainable to the admin, not merely executable by the system

This prevents both prompt sprawl and black-box prompt behavior.

### 33.2 Primary Prompt Grouping by Module

The first organizing principle of the prompt chain should be the build module.
Each major module may have one or more controlled prompt units associated with it.

Examples may include modules such as:

* source and context processing
* participant session processing
* clarification generation
* synthesis
* workflow evaluation
* package generation
* issue discussion
* management inquiry

This module-based grouping preserves modular editability and aligns with the broader architecture of the system.

### 33.3 End-to-End Dependency Flow Across Prompt Groups

Although prompt groups are organized primarily by module, the chain must still preserve explicit dependency flow across the broader case journey.
At minimum, the chain should show how outputs flow across stages such as:

* case framing
* source/context preparation
* participant narrative handling
* clarification
* synthesis
* evaluation
* initial package generation
* operational gap closure
* management inquiry when needed
* final package generation

This ensures that the prompt chain remains understandable as an end-to-end system rather than only as isolated module folders.

### 33.4 Prompt Group Definition Rule

Each prompt group should represent a coherent operational capability inside the chain.
A prompt group may contain multiple prompt units, but those units should remain aligned to one operational purpose area.

A prompt group should not become a catch-all bucket for unrelated tasks.

### 33.5 Prompt Explainability Requirement

Every prompt unit and every prompt group should have an **admin-readable explanation layer** in addition to its execution role.
The system must not treat prompts as opaque hidden instructions only.

The admin should be able to understand at minimum:

* what the prompt does
* why it exists
* when it runs
* what stage it belongs to
* what problem it solves
* what it receives as input
* what it is expected to produce
* what it must not control or decide

### 33.6 Prompt Explanation Record

Each prompt unit should therefore support an explanation record containing at minimum:

* prompt name
* prompt ID
* linked module
* linked stage in the workflow
* purpose
* why this prompt is needed here
* when it should run
* when it should not run
* expected inputs
* expected outputs
* protected boundaries
* related source logic

This explanation record is for admin understanding and later prompt review, not only for execution.

### 33.7 Structured Prompt Specification Layer

The system should not rely only on raw prompt text as the main editable unit.
Version one should support a **structured prompt specification layer** for each prompt or prompt group.

This structured layer may include, where relevant:

* role
* task
* objective
* reasoning style or reasoning mode guidance
* tone or communication style
* domain overlay
* department overlay
* use-case overlay
* domain-support overlay where allowed
* hard guardrails
* examples
* failure patterns to avoid
* output rules

The purpose of this layer is to make prompts more governable, explainable, and reviewable than raw text alone.

### 33.8 Domain-Support Prompt Boundary Rule

If a prompt uses domain-support material, that usage must remain explicitly bounded.
Domain-support input may help the prompt:

* understand terminology
* draft sharper questions
* interpret artifacts more intelligently
* understand common domain patterns

But the prompt must not use domain-support material to:

* determine blocking states
* determine package eligibility
* override company-specific workflow truth
* create authoritative company rules from generic domain knowledge

### 33.9 Compiled Prompt Layer

In addition to the structured specification layer, the system should support a **compiled prompt layer**.
This is the actual executable prompt assembled from:

* locked instruction components
* skill or prompt-group components
* overlays
* stage-specific logic
* case context where allowed
* output constraints

The compiled prompt should remain reviewable by the admin in a dedicated advanced view rather than being hidden completely.

### 33.10 Advanced Raw Prompt Edit Mode

Version one should support an advanced mode in which the admin may review and, when allowed, directly edit the raw or compiled prompt text.

However:

* structured editing should remain the safer default
* raw prompt editing should be treated as an advanced capability
* raw prompt edits must remain traceable
* raw prompt edits must not silently override locked system logic

This preserves flexibility for expert use without making the prompt system unstable by default.

### 33.11 Prompt Review Packet Shape

To support later prompt refinement and discussion, each important prompt or prompt group should be representable as a review packet that may include at minimum:

* prompt name / ID
* module / stage
* purpose
* when it runs
* inputs
* outputs
* structured prompt specification
* current compiled prompt
* sample input
* sample output
* desired output direction
* known problem or weakness
* what must not change
* model used where relevant

This review packet makes later prompt discussion with an AI assistant or human reviewer far more reliable than showing raw prompt text only.

### 33.12 Prompt Change and Review History

The prompt system should preserve change visibility for meaningful prompt edits.
At minimum, it should support:

* version identity
* active or inactive status
* change note
* reason for change
* optional result note when known

The goal is not heavy bureaucracy.
The goal is to make later prompt improvement discussable and auditable.

### 33.13 Skill Relationship Rule

Prompt groups may be linked to reusable **skills**.
A skill in this context should be treated as a reusable capability specification rather than as a single raw prompt string.

A skill may contain multiple structured instruction sections, such as:

* role
* task
* guardrails
* examples
* output rules
* failure handling guidance

However, a skill should still remain focused on a single responsibility area rather than becoming a broad multi-stage system blob.

### 33.14 Skill-to-Prompt Relationship

The relationship should be treated as follows:

* a skill defines a reusable instruction capability
* a compiled prompt may assemble one or more skill-linked instruction components together with overlays and stage logic

This allows reuse without forcing every runtime prompt to be a fixed static block.

### 33.15 Model-Specific Rendering Rule

The canonical meaning of a prompt or skill should remain as model-agnostic as reasonably possible.
However, the compiled prompt may still be rendered differently for different model families when necessary.

This may include differences in:

* formatting style
* example density
* explicitness of constraints
* structure layout

The system should not require the full conceptual meaning of the prompt to be reinvented every time the model changes.

### 33.16 Prompt Groups by Build Module

The prompt chain should remain mappable by module.
At minimum, the system should support identifiable prompt groups for areas such as:

* source/context handling
* participant extraction
* clarification
* synthesis
* workflow evaluation
* initial package drafting
* management inquiry drafting
* final package drafting
* issue discussion support

This grouping supports maintainability and selective improvement.

### 33.17 Dependency Flow Between Prompts

The prompt chain must preserve explicit dependency relationships between prompt groups and prompt units.
This includes clarity about:

* which outputs feed which next prompts
* which prompts require validated contracts first
* which prompts are conditional on state or stage
* which prompts are optional or management-triggered rather than default

Dependency flow should not remain implicit or dependent on memory alone.

### 33.18 Validation Checkpoints Between Prompt Groups

The system should support validation checkpoints between major prompt groups.
These checkpoints may verify at minimum:

* required input availability
* contract readiness
* state eligibility
* review-gate satisfaction where relevant
* output completeness for the next stage

This prevents prompt chaining from becoming a blind handoff process.

### 33.19 Relationship to Later Orchestration Prompt

If a later orchestration-layer prompt or planner exists, it must remain subordinate to the prompt-chain and control rules already defined.
The orchestration layer may select among allowed prompt groups and prompt units, but it must not dissolve:

* registry control
* module boundaries
* contract binding
* state gates
* review gates

### 33.20 Admin Prompt Workspace Meaning

The admin-facing prompt page or workspace should therefore support more than raw prompt storage.
It should support:

* prompt explanation
* structured editing
* compiled prompt review
* change history
* stage and module visibility
* test and result review where supported
* later prompt-discussion readiness

This is especially important because future prompt improvement may happen through iterative discussion with an AI assistant or human reviewer who does not have full live code context.

### 33.21 Build Meaning of This Section

This section establishes that version one uses a prompt chain that is not only executable but also explainable, reviewable, and modularly improvable.
The prompt chain should help the system run correctly, and it should also help the admin understand, refine, and govern prompt behavior over time.

## 34. Change Control for This Specification

### 34.1 Governing Change-Control Philosophy for v1

Version one should use a **hybrid change-control model**.
This means:

* the default assumption is that a change should remain as local as possible
* a wider review should occur only when the change materially affects directly related sections, source traceability, prompt-chain behavior, state logic, or other governance-critical dependencies

This preserves both modular editability and structural discipline.

### 34.2 Local-First Change Rule

The default rule for later modification is **local-first**.
A section should be changed locally without unnecessary ripple edits when the change does not materially alter:

* core operating logic
* source hierarchy
* state transitions
* package eligibility
* review and release governance
* prompt-chain structure
* contract meaning

The system should avoid rewriting broad areas merely because one section changed.

### 34.3 Traceability Review Trigger Rule

A limited traceability review must be triggered when a proposed change materially affects one or more directly related areas such as:

* linked execution logic sections
* source hierarchy interpretation
* prompt registry or prompt-chain dependencies
* state model behavior
* review or release gates
* contract expectations
* document-direction logic
* case configuration or rollout logic that shapes downstream stages

The purpose of this review is not broad re-litigation.
It is to detect and patch direct structural impact before accepting the change.

### 34.4 Limited Impact Review Scope Rule

When traceability review is triggered, the review should remain **limited to the directly affected areas** rather than reopening the whole specification by default.

This means the review should identify:

* what changed
* which nearby sections depend on it
* whether wording, logic, or traceability in those sections now requires update
* whether the change remains compatible with the locked main reference

A triggered traceability review should not become a general restart of the project.

### 34.5 What Requires Local Update Only

The following types of changes will often qualify for local update only when they do not alter dependent logic materially:

* wording clarification inside a section
* additional explanatory detail that does not change behavior
* tighter examples
* non-governing descriptive refinement
* local admin UX explanation text
* non-authoritative documentation notes

These changes may still be logged, but they usually do not require broader structural review.

### 34.6 What Requires Traceability Review

The following kinds of changes should normally trigger traceability review:

* changes to source hierarchy interpretation
* changes to state logic or state-transition behavior
* changes to package-entry or package-finalization conditions
* changes to review-trigger rules
* changes to prompt-chain structure or prompt-governance assumptions
* changes to contract meaning or required fields
* changes to the role of management inquiry, operational gap closure, or final document direction
* changes that may create tension with the locked main reference

### 34.7 What Requires Locked-Reference Review Before Change

A proposed change must be checked explicitly against the locked main reference before acceptance when it appears to affect:

* the project thesis
* workflow-first operating logic
* operator-led or human-governed behavior
* reference-to-reality / reality-to-reference direction
* final output philosophy
* the seven critical completeness conditions
* the rule that messaging channels are transport/adaptor layers only
* the distinction between current workflow reality and improved / target-state workflow

These are governed source-of-truth areas and must not drift silently.

### 34.8 Change Recording Rule

Meaningful changes to this specification should preserve at minimum:

* what changed
* why it changed
* which section was changed
* whether traceability review was required
* whether locked-reference review was required
* what related sections were updated if any

The purpose is practical traceability, not heavy bureaucracy.

### 34.9 Patch Discipline Rule

Changes should be applied as **targeted patches** whenever possible.
Broad rewrites should be avoided unless the current section is too structurally weak or too contradictory to patch safely.

This supports:

* modular maintenance
* cleaner later review
* easier source-to-spec traceability
* safer collaboration with coding agents and future prompt refinement

### 34.10 Build Meaning of This Section

This section establishes that future changes to the execution specification should be modular by default, but never blind to direct structural impact.
The specification should remain editable without becoming unstable.

## 35. Approval Gate

### 35.1 Governing Approval Philosophy for v1

Version one should use a **two-step approval model** for this execution specification.

This means:

* the specification should first be judged for logical completeness and structural sufficiency
* only after that should it be judged for practical readiness for implementation handoff, prompt extraction, or build usage

This prevents false closure based only on readability while implementation-critical gaps still remain.

### 35.2 Stage One — Structure and Logic Approval

The first approval gate should confirm that the execution specification is sufficiently complete at the logic level.
This means at minimum that:

* the major correctness-critical sections are filled
* the system’s governing flow is coherent
* no known unresolved gap remains in a way that breaks the intended operating logic
* the specification is materially aligned with the locked main reference
* the section set is structurally stable enough for downstream use

Stage One approval does **not** yet mean that the specification is automatically ready for implementation handoff.
It only means the logic structure is judged sufficiently complete and internally coherent.

### 35.3 Stage Two — Build-Readiness Approval

The second approval gate should confirm that the specification is ready for practical build use.
This means at minimum that:

* the logic is not only coherent but usable by implementation agents or builders
* the remaining ambiguity level is low enough for safe handoff
* contract, prompt, state, review, and package logic are sufficiently explicit for implementation work
* no unresolved issue remains that would force coding agents to invent core governance behavior
* the prompt-chain and build workflow are ready enough for implementation-oriented use

Stage Two approval is the gate that makes the specification ready for:

* implementation handoff
* coding-agent build usage
* later prompt extraction
* downstream build sequencing

### 35.4 Separation Between the Two Approval Stages

Important rule:
A document may pass Stage One without yet passing Stage Two.

This distinction must remain explicit because a specification may be logically strong while still requiring final tightening before safe implementation.

### 35.5 Admin Approval Authority

The admin remains the final approval authority for both stages.
The system may support the admin by surfacing readiness reasoning, but it must not silently self-approve the specification as complete or implementation-ready.

### 35.6 Readiness Reasoning Visibility

For each approval stage, the system should be able to show the admin at minimum:

* what is already sufficient
* what remains open if anything
* why the current stage may be approved or withheld
* what the next step becomes after approval

This helps the admin distinguish between:

* logical completion
* and true implementation readiness

### 35.7 Relationship to Final Review Pass

Before Stage Two approval is granted, the specification should normally pass through a final structured review against:

* the locked main reference
* internal consistency across sections
* traceability integrity after local patches or renumbering
* absence of major unresolved build-critical contradictions

This review helps prevent build handoff from occurring on top of silent drift or incomplete translation.

### 35.8 Build Meaning of This Section

This section establishes that closure of the execution specification happens in two deliberate steps:

1. logical and structural completion
2. build readiness and handoff readiness

This protects the project from declaring victory too early while still allowing controlled progression toward implementation.