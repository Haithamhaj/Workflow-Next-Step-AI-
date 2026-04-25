# Execution Log

- File Purpose: Implementation-ready live build specification for **Pass 3 — Hierarchy Intake & Approval**.
- Baseline Boundary: Pass 2 — Intake & Context Build Spec is closed, accepted, and archived. This file must not edit, expand, or reopen Pass 2.
- Current Slice: **Pass 3 — Hierarchy Intake & Approval Build Slice**.
- Working Mode: Planning/build-spec reference for coding-agent execution. Not a coding transcript.
- Status: Pass 3 accepted and closed on branch `codex/pass3-final-closure`, commit `4343b7792957ae99964bf1a5cb8ae272453779cc`.
- Last Updated: 2026-04-24.
- Continuity Rule: This document is the single live reference for Pass 3 until explicitly replaced.
- Pass Label Decision: This slice is treated as Pass 3 in the current post-Pass-2 execution path, based on the archived Pass 2 handoff stating that Pass 3 / hierarchy work must begin in a separate build spec.

---

# Pass 3 — Hierarchy Intake & Approval Build Spec

## 1. Accepted Baseline / Archived Work

Pass 2 is accepted and archived under status `pass2_complete_after_all_proofs`.

Final Pass 2 main commit:

`a90f963d4f3a5691638bcebccdf7a33d54eb45db`

Pass 2 ended at final pre-hierarchy review and cleanly handed off to this hierarchy build slice.

Pass 2 included:

- intake/context framing
- company vs department context separation
- optional company context
- optional department documents
- source registration
- website crawl through approved crawler adapter
- document/image/audio/manual note input support
- video excluded
- real Google STT proof
- document/OCR extraction proof
- AI source-role suggestion
- admin source-role decision flow
- structured context formation
- final pre-hierarchy review
- local SQLite-backed persistence
- artifact/chunk/embedding handling
- Section 19 acceptance proof closure

Pass 2 explicitly did **not** include:

- hierarchy intake
- hierarchy draft generation
- hierarchy approval
- source-to-role linking
- participant targeting
- rollout readiness
- participant sessions
- synthesis/evaluation
- final package
- video input

Archive rule:

Pass 2 must not be edited or expanded for hierarchy work. Pass 3 is a separate build spec and implementation slice.

---

## 2. Pass 3 Purpose

The purpose of Pass 3 is to build the governed hierarchy grounding layer that sits between accepted intake/context formation and later participant targeting / rollout.

Hierarchy is not merely an org chart viewer.

It is the operational grounding layer for:

- participant targeting planning
- escalation path interpretation
- role ownership interpretation
- later synthesis grouping
- source-to-role or source-to-node visibility
- workflow boundary clarification
- readiness toward participant targeting

Pass 3 should define how hierarchy information enters the system, how AI drafts a proposed hierarchy, how the admin corrects and approves it, and how that approved hierarchy becomes the structural prerequisite for the next participant-targeting / rollout slice.

---

## 3. Build Principles for Pass 3

### 3.1 Strict Continuity

Do not restart the project.
Do not reinterpret Pass 2.
Do not reopen Pass 2.
Do not move participant targeting, rollout, sessions, synthesis, or workflow analysis into Pass 3.

### 3.2 One Build Slice

Pass 3 owns hierarchy intake and approval only, plus bounded readiness toward Pass 4.

### 3.3 Modular Editability Rule

The system must be built as modular, replaceable blocks.

Each major behavior should be isolated enough that it can be modified later without breaking unrelated system areas.

This applies especially to:

- hierarchy node contract
- reporting relationship model
- grouping taxonomy
- source-to-hierarchy triage
- prompt specifications
- admin correction operations
- readiness snapshot logic
- persistence repositories
- UI/admin surfaces

Implementation implication:

Do not bury hierarchy logic inside admin UI pages.
Do not hard-code prompt behavior inside business logic.
Do not mix Pass 3 readiness with Pass 4 targeting execution.
Do not make source-triage links behave as workflow-truth validation.

### 3.4 Traceability

The system must preserve how the approved hierarchy was formed:

- raw input
- AI draft
- admin corrections
- source-triage suggestions
- approval record
- approved snapshot
- readiness snapshot

### 3.5 No Fake Completion

No AI capability may be claimed unless it works through a real provider-backed path.

No placeholder, mock, or dummy output may be presented as real AI execution.

### 3.6 Admin-Governed Control

AI may suggest. Admin approves, corrects, rejects, or marks for later validation.

Admin approval of the hierarchy is structural approval only. It is not workflow-truth validation.

---

## 4. Approved Pass 3 Scope

Approved scope: **Option 3 — bounded**.

Pass 3 owns:

1. hierarchy intake from pasted text
2. hierarchy intake from uploaded org chart / hierarchy document
3. AI-generated draft hierarchy
4. hierarchy node model
5. role / node grouping model
6. admin correction flow
7. admin approval flow
8. role-first, person-light mapping
9. optional participant-candidate flag only
10. optional source-to-role or source-to-node visibility metadata
11. hierarchy readiness snapshot toward participant targeting
12. clear handoff to Pass 4 / participant-targeting planning

Pass 3 must not own:

- final participant selection
- participant targeting execution
- participant rollout
- invitation sending
- channel delivery
- participant session creation
- workflow analysis
- synthesis/evaluation
- package generation

Boundary rule:

The readiness snapshot may say whether the approved hierarchy is sufficient to move into Pass 4, but it must not perform Pass 4 decisions. Pass 4 remains responsible for participant targeting logic, rollout planning, contact/channel handling, and any targeting-status transitions.

No break with Pass 4 is expected under this bounded interpretation because Pass 3 produces the approved structural input that Pass 4 needs, without consuming Pass 4 responsibilities.

---

## 5. Core Data Concepts

### 5.1 Hierarchy Input

Raw material provided by the admin or uploaded source to describe the department / use-case structure.

Supported input types:

- pasted text hierarchy
- admin-entered role structure
- uploaded org chart or hierarchy document
- uploaded file containing roles / reporting lines / team structure

### 5.2 Hierarchy Draft

AI-generated or admin-created draft structure before approval.

The draft must be correctable.

### 5.3 Approved Hierarchy Snapshot

Immutable snapshot of the hierarchy at approval time.

This snapshot is the structural artifact passed toward Pass 4 planning.

### 5.4 Source-to-Hierarchy Triage Link

A tentative link between an existing source and a hierarchy scope or node.

This is an evidence candidate, not workflow truth.

### 5.5 Readiness Snapshot

A Pass 3 output stating whether the approved hierarchy is structurally sufficient to move toward Pass 4 planning.

It does not select participants.
It does not start rollout.

---

## 6. Hierarchy Intake Model

### 6.1 Text / File-First Intake

The primary intake mode for hierarchy in v1 should be:

- text entry
- pasted textual structure
- uploaded file containing org chart / role structure

Manual drag-and-drop tree construction should not be the required first input mode.

### 6.2 AI Draft Generation

After hierarchy input is provided, the system should generate a draft hierarchy tree that represents where possible:

- roles
- groups
- reporting lines
- major layers
- possible participant grouping
- unclear or missing relationships
- secondary or cross-functional relationships when visible

Draft hierarchy is not final until admin review and approval.

### 6.3 Ambiguity Handling

If reporting lines are unclear, incomplete, contradictory, or weakly inferred, the system must preserve uncertainty rather than invent certainty.

The system may surface admin clarification prompts, but must not block minimal hierarchy creation merely because all enrichment is missing.

---

## 7. Hierarchy Node Contract

Pass 3 must use a **minimum viable hierarchy node contract** with optional enrichment layers.

Reason:

Many real companies may only know the basic reporting shape, such as “Sales Manager → Salesman,” without job descriptions, KPIs, targets, written responsibilities, or formal role documentation.

The hierarchy model must accept this minimal reality instead of blocking the case.

### 7.1 Required Minimum Core

Each hierarchy node must be buildable from very little information.

Required minimum fields:

- `nodeId` — generated by the system
- `label` — visible node label, such as “Sales Manager” or “Salesman”
- `nodeType` — role, group, person_placeholder, external_interface, system_or_queue, or unknown
- `primaryParentNodeId` — nullable for root or unknown parent
- `levelHint` — director, manager, supervisor, senior_individual_contributor, frontline, support, external, system_or_queue, custom, or unknown
- `inUseCaseScope` — yes, no, partial, or unknown
- `sourceBasis` — pasted_text, uploaded_file, admin_entry, ai_inferred, or mixed
- `approvalStatus` — draft, needs_admin_review, corrected_pending_approval, approved

### 7.2 Optional Role Enrichment

The following fields are useful but must not be required:

- job description
- responsibilities
- KPIs
- targets
- visit targets
- authority limits
- approval authority
- decision thresholds
- systems used
- documents linked to the role
- known workflow involvement notes
- escalation notes

### 7.3 Optional Person-Light Mapping

The following may be captured if known, but must not be required for Pass 3:

- person name
- employee ID or internal identifier
- occupant of role
- candidate participant flag
- person-role confidence

The following must remain outside required Pass 3 hierarchy logic:

- email
- phone
- WhatsApp number
- preferred channel
- final participant selection
- targeting status
- invitation status
- session status

These belong naturally to Pass 4 / participant targeting and rollout unless stored only as inert optional metadata.

### 7.4 Completeness Levels

The hierarchy should support graded completeness rather than pass/fail maturity assumptions:

1. `minimal_structure_only` — only role names and basic reporting are known
2. `role_structure_with_people` — role structure plus some person names are known
3. `role_structure_with_responsibilities` — responsibilities or job descriptions are partially known
4. `role_structure_with_operational_signals` — KPIs, targets, systems, approvals, or workflow involvement are known
5. `rich_hierarchy_context` — structure, people, responsibilities, KPIs, documents, and operational signals are available

A minimal hierarchy may still be approvable if it is structurally clear enough to support the next planning step.

---

## 8. Reporting Relationship Model

The hierarchy should use a **primary relationship + optional secondary relationships** model.

### 8.1 Primary Relationship

Each node may have one `primaryParentNodeId` when a main reporting line is known.

If the main reporting line is unknown, `primaryParentNodeId` may remain null or unknown.

### 8.2 Secondary Relationships

Additional relationships may be captured separately without turning the hierarchy into a confusing graph by default.

Optional secondary relationship examples:

- dotted-line manager
- cross-functional responsibility
- shared supervision
- dual reporting
- temporary project reporting
- operational dependency
- approval relationship
- matrix relationship
- external-interface relationship

Each secondary relationship should capture at minimum:

- `relationshipId`
- `fromNodeId`
- `relatedNodeId`
- `relationshipType`
- `relationshipScope`
- `reasonOrNote`
- `confidence`
- `sourceBasis`

Boundary rule:

Secondary relationships support real-world complexity without replacing the primary hierarchy tree.

The default admin view may show the primary hierarchy first and expose secondary/cross-functional relationships as overlays or side notes.

---

## 9. Role-First, Person-Light Model

Pass 3 uses a **Role-first, Person-light** hierarchy model.

This means:

- roles, levels, reporting lines, and grouping are primary
- named people may be mapped when known
- person mapping does not mean participant targeting has started
- contact details and channel handling belong to Pass 4 unless stored only as inert metadata

Examples:

- “Mohammed → Senior Sales → reports to Supervisor A” may be stored
- “Mohammed is selected for rollout” must not be decided in Pass 3
- email / phone / WhatsApp / preferred channel must not be required in Pass 3

---

## 10. Grouping and Layer Taxonomy

Pass 3 should use default grouping categories while allowing custom grouping when the real company structure does not fit cleanly.

Default grouping / layer categories:

- `owner_or_executive` — owner, CEO, GM, business head, executive sponsor
- `director_layer` — director or head-of-function layer
- `manager_layer` — manager or department manager layer
- `supervisor_layer` — supervisor, team lead, coordinator lead, floor lead, shift lead
- `senior_individual_contributor` — senior specialist, senior sales, senior operator, senior officer
- `frontline_operational` — direct execution roles such as salesman, dispatcher, coordinator, agent, clerk, officer
- `support_role` — support roles inside or near the department
- `shared_service_role` — HR, finance, accounting, IT, procurement, legal, or similar shared-service actors when relevant
- `approval_or_control_role` — approval owner, compliance checkpoint, pricing approval, quality control, risk/control owner
- `external_interface` — another department, vendor, client-side actor, partner, or outside dependency
- `system_or_queue_node` — system queue, CRM queue, ticket queue, inbox, shared mailbox, routing bucket, workflow queue
- `committee_or_group` — committee, approval board, review group, weekly meeting group
- `temporary_or_project_role` — temporary assignment, project owner, task force role
- `unknown` — the role/layer is visible but cannot yet be classified
- `custom` — admin-defined grouping label when the default list does not fit

Custom grouping rule:

If `custom` is selected, the admin must be able to enter:

- `customGroupLabel`
- optional `customGroupReason`

Why this matters:

Real company structures may use informal labels, hybrid roles, or local terms that do not fit generic categories.

The system should not force a wrong category merely to satisfy a predefined list.

Boundary rule:

The category helps Pass 4 understand targeting and escalation structure, but it does not by itself select participants or determine rollout order.

---

## 11. Source-to-Hierarchy Relevance Triage

Pass 3 includes light AI-assisted source-to-hierarchy relevance triage.

### 11.1 Purpose

This triage layer helps the admin understand how existing sources may relate to the approved or draft hierarchy without treating those sources as workflow truth.

The system may inspect existing sources and suggest whether each source appears relevant to:

- company-wide context
- department-wide context
- team/unit
- role
- person/occupant
- system/queue
- approval/control node
- external interface
- unknown / needs review

### 11.2 Required Link Fields

Each suggested link must carry at minimum:

- `sourceId`
- `suggestedScope`
- `linkedNodeId` or `linkedScopeLevel`
- `suggestedReason`
- `confidence`
- `evidenceStatus`
- `adminDecision`
- `participantValidationNeeded`
- optional `adminNote`

### 11.3 Evidence Statuses

Allowed evidence statuses:

- `document_claim_only` — source states or implies something, but reality has not confirmed it
- `admin_confirmed_relevance` — admin confirmed the source is relevant to the node/scope
- `participant_validation_needed` — later participant/reality validation is needed
- `participant_confirmed_later` — participant evidence later confirmed the source signal
- `contradicted_by_reality_later` — participant/reality evidence later contradicted the source signal
- `rejected_by_admin` — admin rejected the suggested link
- `scope_changed_by_admin` — admin changed the suggested scope

Important rule:

Source-to-hierarchy links in Pass 3 are **evidence candidates**, not workflow truth.

They may influence later question planning, participant validation needs, and source visibility, but they must not decide actual workflow reality before participant/reality validation.

### 11.4 Department-Wide Source Rule

If a source applies to the department as a whole, it should be linked to the department node or department scope, not forced onto a specific person or role.

Department-wide sources may have inherited visibility for child roles, but inherited visibility does not mean direct proof of each role’s responsibility.

### 11.5 Example

A logistics sales KPI sheet may state that a sales role must complete 20 monthly activities split across visits, calls, online meetings, physical meetings, and reviews.

Pass 3 may suggest linking this KPI sheet to the Sales Department and relevant sales roles as:

- `document_claim_only`
- `participant_validation_needed`

Later participant intake may reveal that the real practice treats all activities as one simplified 20-count target.

That later reality may confirm, modify, or contradict the original source signal.

### 11.6 Admin-AI Discussion Behavior

The admin should be able to discuss triage suggestions with the system, including:

- why a source was linked to a role
- whether the link should be department-wide instead of role-specific
- whether it should require participant validation
- whether the suggestion should be rejected

Admin actions should include at minimum:

- accept link
- reject link
- change scope
- mark as tentative
- require participant validation
- add admin note

Boundary rule:

This is not deep workflow analysis, reference suitability scoring, or final document judgment.

It is a light relevance-triage layer that organizes source signals against the hierarchy for later use.

---

## 12. Admin Correction Flow

Pass 3 must include a real admin correction flow for hierarchy drafts.

The admin must be able to perform at minimum:

- rename node
- add node
- delete node
- move node under another parent
- change group/layer category
- mark node as external interface
- mark node as support/shared-service/cross-functional where appropriate
- add secondary relationship
- remove secondary relationship
- edit relationship type/scope/note
- attach/confirm/reject source link
- change source-link scope
- mark source link as participant-validation-needed
- add admin note
- approve hierarchy

Important rule:

Correction operations must update the current draft hierarchy rather than forcing the admin to re-enter the whole structure.

Audit rule:

Each correction should preserve enough traceability to show:

- what changed
- who changed it
- when it changed
- why when a reason is provided

Boundary rule:

Admin correction may prepare the hierarchy for later participant targeting, but it must not select final participants, send invitations, or create sessions.

---

## 13. Admin Approval Semantics

Admin approval in Pass 3 means:

The admin confirms that the hierarchy is structurally acceptable as the grounding layer for moving toward Pass 4 / participant-targeting planning.

Admin approval does **not** mean:

- all responsibilities are proven true
- all KPIs are operationally real
- all source claims are correct
- written documents match actual practice
- workflow reality has been validated
- participant targeting has been completed
- rollout has started

Approval scope:

Pass 3 approval confirms only that the hierarchy is good enough to support the next planning step, including participant-targeting planning, escalation-path reasoning, and later reality validation.

Reality-validation rule:

Operational truth must be established later by comparing available sources, hierarchy context, and participant/reality evidence.

Source claims remain tentative until checked against real participant input or other accepted reality evidence.

---

## 14. Readiness Snapshot Toward Pass 4

Pass 3 must produce a readiness snapshot after hierarchy approval.

Purpose:

Determine whether the approved hierarchy is structurally sufficient to move toward participant-targeting planning in Pass 4.

The readiness snapshot should check at minimum:

- hierarchy approved
- minimum role structure visible
- selected department represented
- selected use case has at least plausible role/node relevance
- frontline or operational layer visible, if known
- supervisor/manager/escalation layer visible, if known
- primary reporting structure sufficiently clear or explicitly marked unknown
- secondary/cross-functional relationships captured where known
- person-light mapping available if known, but not required
- source-to-hierarchy triage completed or explicitly skipped/not applicable
- blocking structural gaps before participant targeting

Allowed readiness states:

- `ready_for_participant_targeting_planning`
- `ready_with_warnings`
- `not_ready_missing_minimum_hierarchy`
- `not_ready_admin_review_required`

Boundary rule:

Readiness snapshot does not select participants, create rollout order, send invitations, or create sessions.

---

## 15. Required Persistence Records

Pass 3 must durably store the hierarchy process, not only the final approved view.

Required stored records:

- `rawHierarchyInput` — pasted text, uploaded hierarchy file reference, or admin-entered structure
- `aiDraftHierarchy` — the AI-generated draft hierarchy before admin correction
- `hierarchyNodes` — current node records, including minimum core fields and optional enrichment
- `secondaryRelationships` — dotted-line, cross-functional, shared supervision, approval, dependency, or other non-primary relationships
- `personLightMappings` — optional person-to-role/node mappings without making contact data required
- `sourceHierarchyTriageLinks` — suggested and admin-reviewed source-to-scope/source-to-node links
- `adminCorrections` — correction events such as rename, move, add, delete, relationship edit, source-link decision, or note
- `approvedHierarchySnapshot` — immutable snapshot of the hierarchy at approval time
- `hierarchyApprovalRecord` — who approved, when, and approval meaning
- `readinessSnapshot` — readiness toward Pass 4 / participant-targeting planning

Persistence rule:

The system must preserve enough history to understand how the approved hierarchy was formed.

The approved hierarchy should not erase raw input, AI draft, admin corrections, or source-triage decisions.

Boundary rule:

Persistence of person-light mappings does not mean participant targeting has started.

Targeting statuses, invitations, channel delivery, and sessions remain out of Pass 3.

---

## 16. AI Provider and Fallback Rule

Pass 3 AI capabilities must be provider-backed when claimed.

Current active reasoning provider for Pass 3 planning:

- `gemini_3_1_pro_preview`

Provider-agnostic rule:

The implementation should remain provider-agnostic even if Gemini 3.1 Pro Preview is the current active provider.

Business logic must not hard-code one permanent model as the only possible provider.

AI capabilities covered in Pass 3:

- AI draft hierarchy generation
- source-to-hierarchy relevance triage
- admin-facing explanation/discussion around hierarchy and source-link suggestions

Completion rule:

A Pass 3 AI capability may be claimed only if it works through a real provider-backed execution path and the result is persisted and reviewable.

Failure rule:

If the provider is unavailable, misconfigured, rate-limited, or fails, the system must show a visible failure state and allow manual/admin fallback.

Manual fallback may include:

- manually creating hierarchy nodes
- manually correcting hierarchy relationships
- manually mapping sources to nodes/scopes
- manually adding admin notes
- manually approving the hierarchy if the structure is sufficiently clear

No fake completion rule:

Stub-only, placeholder, or dummy AI outputs must not be accepted as proof that the AI capability exists.

Boundary rule:

Manual fallback preserves operational continuity but must not be represented as AI-generated output.

---

## 17. Pass 3 PromptSpec Contract

Pass 3 requires a bounded prompt contract for hierarchy drafting and source-to-hierarchy relevance triage.

Purpose:

The prompt must instruct the active reasoning provider to analyze hierarchy inputs and available sources specifically through the lens of hierarchy grounding, role relevance, source scope, and later participant-validation needs.

It must not behave as a general workflow-analysis prompt.

### 17.1 Prompt Role Definition

The Pass 3 prompt must not be only task instructions.

It must define the AI role clearly.

The role should position the AI as a hierarchy and source-triage assistant for the admin, not as the final workflow analyst.

Example role direction:

“You are a hierarchy-intake and source-relevance triage assistant. Your job is to help the admin convert rough organizational input into a reviewable hierarchy draft and to suggest tentative links between existing sources and hierarchy nodes. You do not validate workflow reality, select participants, run rollout, or treat written documents as actual practice. You preserve uncertainty and ask for admin review where needed.”

### 17.2 Prompt Management Model

Approved editing model:

**Structured PromptSpec Editor + Full Compiled Prompt Preview + Draft Testing**.

This is the default prompt-management model for Pass 3 and should become the general pattern for future system prompts across the product.

The prompt should not be managed primarily as one uncontrolled free-text block.

It should be managed as a structured prompt specification that compiles into the final prompt sent to the active provider.

### 17.3 Universal PromptSpec Sections

Minimum PromptSpec sections:

1. `promptMetadata` — prompt name, pass/slice, capability, domain, provider/model, version, status
2. `roleDefinition` — what the AI is in this capability and what authority it has
3. `missionOrTaskPurpose` — the exact job this prompt is meant to perform
4. `caseContextInputs` — which case fields are injected into the prompt
5. `sourceAndEvidenceRules` — how sources, document claims, evidence status, and reality validation should be treated
6. `operatingInstructions` — the actual analysis or generation instructions
7. `domainTerminologyLens` — domain-specific or terminology guidance when applicable
8. `boundariesAndProhibitions` — what the prompt must not do
9. `uncertaintyAndEscalationRules` — how to handle missing, unclear, contradictory, or low-confidence information
10. `outputContractOrSchema` — required response structure, schema, or field list
11. `examplesOrFewShotCases` — examples of correct and incorrect behavior where useful
12. `adminDiscussionBehavior` — how the AI explains, debates, or offers alternatives to the admin
13. `evaluationChecklist` — how output quality and boundary compliance are judged
14. `testCasesOrGoldenInputs` — reusable test inputs for draft-vs-active comparison
15. `compiledPromptPreview` — final rendered prompt assembled from the sections
16. `versionAndActivationControls` — draft, active, previous, promote, rollback, and diff behavior

### 17.4 Pass 3 Local PromptSpec Sections

Pass 3 local PromptSpec sections:

1. Role Definition
2. Pass 3 Mission
3. Case Context Inputs
4. Hierarchy Drafting Rules
5. Source-to-Hierarchy Triage Rules
6. Evidence Status Rules
7. Uncertainty Rules
8. Prohibitions
9. Output Schema
10. Admin Discussion Behavior
11. Examples
12. Evaluation Checklist
13. Test Cases
14. Compiled Prompt Preview
15. Draft / Active / Rollback Controls

### 17.5 Prompt Responsibilities

Prompt responsibilities:

1. convert pasted or uploaded hierarchy input into a draft hierarchy
2. identify roles, groups, levels, reporting lines, and unclear relationships
3. preserve uncertainty rather than inventing missing structure
4. detect possible secondary relationships such as dotted-line, shared supervision, cross-functional responsibility, approval dependency, or external interface
5. analyze available sources only for hierarchy relevance signals
6. suggest source links by natural scope: company-wide, department-wide, team/unit, role-specific, person/occupant, system/queue, approval/control node, external interface, or unknown
7. detect useful source signals such as role names, department names, KPIs, targets, responsibilities, approval authority, visit counts, systems, forms, queues, people names, or escalation clues
8. mark every source signal as tentative unless admin or later participant evidence confirms it
9. recommend whether participant validation is needed later
10. explain why each suggested link was proposed in short admin-readable language

### 17.6 Prompt Prohibitions

The prompt must not:

- treat source claims as operational truth
- claim that a KPI, SOP, policy, or document reflects actual practice
- perform workflow reconstruction
- generate participant targeting decisions
- select final participants
- create rollout order
- produce synthesis or evaluation
- infer missing reporting lines as fact when evidence is weak
- force role-specific links when a department-wide link is more appropriate

### 17.7 Required Output Fields for Source Triage

Required output fields for source triage:

- `sourceId`
- `sourceName`
- `suggestedScope`
- `linkedNodeId` or `linkedScopeLevel`
- `signalType`
- `suggestedReason`
- `confidence`
- `evidenceStatus`
- `participantValidationNeeded`
- `adminReviewQuestion`

Allowed signal types:

- `role_name_signal`
- `department_scope_signal`
- `kpi_or_target_signal`
- `responsibility_signal`
- `approval_or_authority_signal`
- `system_or_queue_signal`
- `person_name_signal`
- `cross_functional_signal`
- `external_interface_signal`
- `unclear_scope_signal`

### 17.8 Prompt Visibility and Editability

Any prompt used for Pass 3 AI behavior must be visible to the admin in the UI or prompt workspace.

The admin must be able to inspect and edit the prompt instead of having critical AI behavior hidden inside code.

Full compiled prompt view:

The admin must be able to view the final compiled prompt generated from the structured sections.

Advanced full-text editing may exist, but structured editing remains the safer default.

Editability rule:

Prompt changes must be controlled and traceable.

A prompt edit should create a new prompt version or draft rather than silently overwriting the active prompt without history.

### 17.9 Draft Testing and Promotion

Prompt drafts must be testable before they become active.

The admin should be able to:

1. edit or create a prompt draft
2. run a controlled test using the draft prompt
3. compare the draft output against the current active prompt output
4. inspect differences in result quality, structure, relevance, and boundary compliance
5. keep the draft inactive if it performs worse
6. promote the draft to active only after review
7. preserve the previous active prompt version for rollback or comparison

Minimum comparison view:

- same input / same case context
- active prompt output
- draft prompt output
- visible differences
- boundary-violation flags when possible
- admin note on why the draft was promoted or rejected

Promotion rule:

A draft prompt must not automatically become active merely because it was saved.

Promotion to active must be an explicit admin action.

Rollback rule:

The previously active prompt should remain available for rollback or reference after promotion.

Cross-system note:

This rule should apply to future system prompts beyond Pass 3.

Pass 3 should implement or at least preserve the local version of this pattern for its hierarchy/source-triage prompt, while the full reusable prompt-testing framework belongs to the broader Prompt System Architecture track.

---

## 18. UI / Admin Surfaces

Pass 3 should expose minimal but complete admin surfaces.

Required surfaces:

### 18.1 Hierarchy Intake Surface

Must support:

- pasted hierarchy text
- uploaded hierarchy document / org chart reference
- manual/admin entry
- provider-backed AI draft generation trigger
- visible AI failure state if provider fails
- manual fallback path

### 18.2 Draft Hierarchy Review Surface

Must show:

- draft hierarchy tree
- node list/table
- unknown or weakly inferred nodes
- primary relationships
- secondary relationships
- grouping/layer classification
- person-light mappings when present

### 18.3 Admin Correction Surface

Must support all correction operations listed in Section 12.

### 18.4 Source-to-Hierarchy Triage Surface

Must show:

- source list
- suggested scope
- suggested linked node/scope
- signal type
- reason
- confidence
- evidence status
- participant validation needed flag
- admin decision actions

### 18.5 PromptSpec Surface

Must show:

- structured prompt sections
- active prompt
- draft prompt
- compiled prompt preview
- draft test execution
- active-vs-draft comparison
- explicit promote action
- previous prompt version for rollback/reference

### 18.6 Approval and Readiness Surface

Must show:

- approval action
- approval meaning
- approved snapshot summary
- readiness snapshot toward Pass 4
- warnings or blockers
- explicit non-goals: no targeting / no rollout / no sessions

---

## 19. API / Contract / Persistence Build Expectations

This section describes implementation expectations for the coding agent.

### 19.1 Contracts

Pass 3 should add or extend contracts for:

- hierarchy input
- hierarchy draft
- hierarchy node
- secondary relationship
- person-light mapping
- source-to-hierarchy triage link
- admin correction event
- hierarchy approval record
- approved hierarchy snapshot
- readiness snapshot
- PromptSpec / prompt version record if not already available in current codebase

### 19.2 Domain Package Boundary

Hierarchy business logic should live in an appropriate package, not inside admin-web pages.

If no existing package owns this responsibility, create a bounded package such as:

- `packages/hierarchy-intake`

or equivalent, consistent with current repo architecture.

### 19.3 Persistence

Persistence should follow the accepted local SQLite-backed path already used by the current baseline.

In-memory-only completion is not enough if Pass 3 claims persistence.

### 19.4 Admin Web

Admin-web owns:

- routes
- forms
- tables/views
- action buttons
- prompt workspace UI
- explanation/discussion surfaces

Admin-web must not own core hierarchy rules, readiness rules, or source-triage business logic.

### 19.5 Provider Integration

Provider calls should use the existing provider-agnostic architecture where possible.

Gemini 3.1 Pro Preview is the current active reasoning provider for Pass 3.

Provider failure must be visible and persisted where appropriate.

---

## 20. Acceptance Proofs

### 20.0 Patch 1 Reported Implementation Status

Patch 1 branch reported by coding agent:

`codex/pass3-foundation`

Reported base commit:

`a90f963d4f3a5691638bcebccdf7a33d54eb45db`

Reported Patch 1 scope completed:

- hierarchy contracts/types/schemas
- `packages/hierarchy-intake` domain package
- person-light hierarchy node model without contact/targeting/session fields
- secondary relationship contract
- manual/pasted hierarchy intake
- uploaded-document intake shape
- node validation
- manual draft persistence
- correction events
- structural approval snapshot
- readiness snapshot
- SQLite-backed repositories wired through `createSQLiteIntakeRepositories()`
- PromptSpec contracts/repository shape only
- minimal admin hierarchy page/API for manual intake, draft editing, secondary relationships, structural approval, and readiness

Reported intentional deferrals:

- Gemini hierarchy generation
- provider-backed hierarchy AI draft
- source-to-hierarchy AI triage
- prompt draft testing UI/execution
- participant targeting
- rollout order
- sessions
- workflow analysis
- synthesis/evaluation
- package generation

Reported proofs passed:

- `pnpm build:contracts`
- `pnpm build`
- `pnpm typecheck`
- domain/SQLite proof against `/tmp/workflow-pass3-foundation-proof.sqlite`
- persisted intake/nodes/secondary relationship/approval snapshot/readiness snapshot
- reload/reopen SQLite persistence proof
- route/UI proof for `/intake-sessions/intake_pass3_proof/hierarchy`
- boundary scan showing no provider hierarchy generation, targeting, rollout, sessions, workflow analysis, synthesis/evaluation, or package generation

Current status:

Patch 1 is **verified acceptable in scope**, but should not be treated as fully accepted until the minor readiness-state naming correction is applied, proofs rerun, and the patch is committed.

Verification packet received:

- current branch: `codex/pass3-foundation`
- current commit: `a90f963d4f3a5691638bcebccdf7a33d54eb45db`
- patch changes are still uncommitted working-tree changes
- `pnpm build:contracts` passed
- `pnpm build` passed
- `pnpm typecheck` passed
- SQLite/domain proof passed
- approved snapshot immutability proof passed
- hierarchy page curl proof passed
- hierarchy API curl proof passed
- route-level POST proof passed
- no env files, secrets, test DB files, or `.claude/worktrees` committed
- no generated/test files remain untracked beyond intended source files

Minor correction required before commit:

The readiness value reported as `ready_for_pass4` should be renamed to the approved explicit state `ready_for_participant_targeting_planning` to avoid ambiguity with rollout execution. The behavior is correct, but the state label should match the Pass 3 spec.


Pass 3 may be accepted only when the following are proven:

### 20.0F Patch 4.5 Acceptance Record

Patch 4.5 is **accepted**.

Final Patch 4.5 branch:

`codex/pass3-visual-hierarchy`

Final Patch 4.5 commit:

`f16e1cf1d8a0b742d911a5d7468388fa3355d20e`

Patch 4.5 scope accepted:

- visual hierarchy workbench on the Pass 3 hierarchy page
- tree rendering from existing flat hierarchy nodes
- expand/collapse controls
- click-to-select node details panel with existing edit/save flow
- node badges for layer, scope, person-light data, secondary relationships, source signals, uncertainty, and participant-validation-needed
- Arabic-first labels/help text for the hierarchy page sections
- context/status strip for case/company/department, hierarchy status, and readiness

Final verification:

- `git status --short`: clean
- `pnpm build:contracts` passed
- `pnpm typecheck` passed
- `pnpm build` passed
- browser verified workbench renders at `/intake-sessions/pass3_ui_review_demo_session/hierarchy`
- Arabic-first labels verified: `شجرة القسم`, `تفاصيل الدور`, `العلاقات الثانوية`, `مصادر مرتبطة`, `اعتماد هيكلي فقط`
- role cards rendered, including `Sales Manager`
- source-signal and participant-validation badges shown on linked node
- secondary relationship badges visible
- clicking `Sales Manager` shows selected node details/actions
- expand/collapse works
- AI hierarchy draft regression passed with `ai_draft_succeeded`, model `gemini-3.1-pro-preview`
- source triage regression passed with `ai_triage_succeeded`, model `gemini-3.1-pro-preview`
- prompt testing regression passed with `provider_success`, model `gemini-3.1-pro-preview`
- structural approval snapshot created
- readiness status remained `ready_for_participant_targeting_planning`
- no env files, secrets, or test DB files were committed
- ignored `.claude/worktrees/` remained uncommitted
- no participant targeting, rollout, sessions, workflow analysis, reference suitability scoring, synthesis/evaluation, or package generation was added

Patch 4.5 accepted boundary:

Patch 4.5 is a focused visual inspectability refinement. It did not implement full product redesign, full localization/i18n, product-wide overview dashboard, copilot, Pass 4 execution, or workflow analysis.

### 20.0E Patch 4 Acceptance Record

Patch 4 is **accepted**.

Final Patch 4 branch:

`codex/pass3-prompt-testing`

Final Patch 4 commit:

`c54052f3f0ae2b9fc8c18a8f1e117be3910f97a4`

Patch 4 scope accepted:

- Pass 3 prompt lifecycle states: `draft`, `active`, `previous`, `archived`
- prompt draft save/edit API
- active-vs-draft compiled prompt preview
- provider-backed same-input prompt comparison test
- persisted prompt test-run records
- explicit draft promotion preserving previous active prompt
- admin UI for prompt draft testing, comparison, promotion, and version records

Final verification:

- `git status --short`: clean
- `pnpm build:contracts` passed
- `pnpm typecheck` passed
- `pnpm build` passed
- active hierarchy PromptSpec visible
- active source triage PromptSpec visible
- hierarchy draft saved as `draft` without changing active prompt
- source triage draft saved as `draft`
- compiled active and draft previews rendered in admin UI
- prompt version records rendered in admin UI
- live Gemini prompt test run persisted: `pass3_prompt_test_4e1eddc4-ccca-40f0-bbeb-321d179e235d`
- provider/model: `google` / `gemini-3.1-pro-preview`
- prompt test status: `provider_success`
- active output persisted
- draft output persisted
- boundary flags: `0`
- draft promoted explicitly through `promote-prompt-draft`
- promoted prompt status: `active`
- previous prompt status: `previous`
- previous active prompt remains stored and viewable
- missing-key prompt test returned HTTP `424`
- failure run persisted: `pass3_prompt_test_5c9cef51-5456-4ae8-a2f7-a3537ddf6fa7`
- provider status: `provider_not_configured`
- no fake active or draft outputs persisted
- failure visible in admin page
- existing hierarchy draft AI still succeeded after Patch 4
- existing source-to-hierarchy triage AI still succeeded after Patch 4
- no env files, secrets, or test DB files were committed
- ignored `.claude/worktrees/` remained untracked/ignored and was not committed
- no participant targeting, rollout, sessions, workflow analysis, reference suitability scoring, synthesis/evaluation, or package generation was added

Patch 4 accepted boundary:

Patch 4 is limited to local Pass 3 prompt lifecycle/testing. It does not implement broad cross-system prompt architecture or any Pass 4 execution behavior.

### 20.0D Patch 3.5 Acceptance Record

Patch 3.5 is **accepted**.

Final Patch 3.5 branch:

`codex/pass3-provider-config`

Final Patch 3.5 commit:

`c9a608d40e778a2eef0ca10695c5195a7fa880c4`

Patch 3.5 scope accepted:

- centralized Google AI provider resolver
- safe provider diagnostics through `/api/provider-status`
- official `GOOGLE_AI_API_KEY` resolution
- configurable `GOOGLE_AI_MODEL` resolution
- default model fallback: `gemini-3.1-pro-preview`
- Pass 3 hierarchy draft and source triage paths now use resolved model
- failure classification statuses: `provider_not_configured`, `provider_auth_failed`, `provider_model_unavailable`, `provider_rate_limited`, `provider_execution_failed`, `provider_success`
- safe `.env.example` committed without secrets

Final verification:

- `git status --short`: clean
- `pnpm build:contracts` passed
- `pnpm typecheck` passed
- `pnpm build` passed
- resolver diagnostics proof passed
- live Gemini hierarchy proof passed
- live Gemini source triage proof passed
- no-key provider failure/manual fallback route proof passed
- missing key returned `provider_not_configured`, `keyPresent: false`, default model `gemini-3.1-pro-preview`
- key-present diagnostic returned `provider_success`, `keyPresent: true`, with no key value printed
- `GOOGLE_AI_MODEL` absent defaulted to `gemini-3.1-pro-preview`
- `GOOGLE_AI_MODEL=custom-proof-model` override was honored
- hierarchy draft persisted `ai_draft_succeeded` with provider `google`, model `gemini-3.1-pro-preview`
- source triage persisted `ai_triage_succeeded` with provider `google`, model `gemini-3.1-pro-preview`
- source triage generated `kpi_or_target_signal` with `document_claim_only`
- hierarchy draft failure persisted `ai_draft_failed` with `provider_not_configured`
- source triage failure persisted `ai_triage_failed` with `provider_not_configured`
- manual fallback still persisted after provider failure
- no secret values, env files, or test DB files were committed; only safe `.env.example` was committed
- no prompt testing, participant targeting, rollout, sessions, workflow analysis, synthesis/evaluation, or package generation was added

Patch 3.5 accepted boundary:

This patch hardened shared provider configuration only. It did not add a new analytical capability or move into prompt testing.

### 20.0C Patch 3 Acceptance Record

Patch 3 is **accepted**.

Final Patch 3 branch:

`codex/pass3-source-triage`

Final Patch 3 commit:

`e0310277b5223983ef3816a70b89b1ab6788d50a`

Patch 3 scope accepted:

- provider-backed source-to-hierarchy relevance triage
- visible source triage PromptSpec
- compiled source triage prompt preview
- persistent triage jobs and suggestions
- admin review actions for source-link suggestions
- provider failure state
- manual source-link fallback after provider failure

Final verification:

- `git status --short`: clean
- `pnpm build:contracts` passed
- `pnpm typecheck` passed
- `pnpm build` passed
- live route proof with Gemini passed
- provider failure route proof without credentials passed
- boundary scan found only prohibitions/boundary text, no forbidden implementation
- model used: `gemini-3.1-pro-preview`
- live proof sources: `Sales KPI Activity Sheet`, `Sales Department Policy`
- persisted triage job status: `ai_triage_succeeded`, provider `google`, 4 suggestions
- signals included `approval_or_authority_signal`, `responsibility_signal`, `kpi_or_target_signal`, `department_scope_signal`
- admin hierarchy page rendered Source-to-Hierarchy Triage, evidence-candidate boundary text, compiled prompt preview, and suggestions
- provider failure path returned HTTP `424` and persisted `ai_triage_failed`
- manual fallback source link persisted after provider failure with `participant_validation_needed`
- accept action persisted `admin_confirmed_relevance` / `accepted_link`
- reject action persisted `rejected_by_admin` / `rejected_link`
- scope change from `role_specific` to `department_wide` persisted `scope_changed_by_admin`
- participant validation mark persisted `participant_validation_needed`
- admin note persisted
- no secrets, env files, or test DB files were committed
- no participant targeting, rollout, sessions, workflow analysis, reference suitability scoring, synthesis/evaluation, or package generation was added

Patch 3 accepted boundary:

Source-to-hierarchy links remain evidence candidates only. They are not workflow truth and do not validate SOPs, KPIs, policies, responsibilities, or actual practice.

### 20.0B Patch 2 Acceptance Record

Patch 2 is **accepted**.

Final Patch 2 branch:

`codex/pass3-ai-draft`

Final Patch 2 commit:

`553e0205311eb2adfb032d9c53c38502676fd04c`

Patch 2 scope accepted:

- provider-backed hierarchy draft domain path
- Gemini-backed hierarchy draft generation through `gemini-3.1-pro-preview`
- visible active Pass 3 StructuredPromptSpec
- compiled PromptSpec preview
- admin route/UI action for `generate-ai-draft`
- persisted AI draft success/failure states
- provider failure state visible and persisted
- manual fallback remains available after provider failure
- AI draft remains editable through admin correction flow

Follow-up correction included:

- Gemini output normalization when `primaryParentNodeId` is `unknown` or points to a non-existent node
- uncertainty is preserved instead of failing validation

Final verification:

- `git status --short`: clean
- real Gemini call succeeded through `gemini-3.1-pro-preview`
- live proof input used a realistic sales hierarchy with uncertain communicator reporting lines
- generated 13 hierarchy nodes
- primary parent relationship example confirmed: `sm_1 -> sd_1`
- warnings/uncertainties preserved for unclear reporting lines
- raw provider output persisted
- compiled PromptSpec persisted
- domain proof persisted AI draft `hierarchy_draft_ecbfe65c-f470-4c81-aadc-7d53d225c1d7` with status `ai_draft_succeeded`, provider `google`, model `gemini-3.1-pro-preview`
- route/UI proof persisted AI draft `hierarchy_draft_96b9bb2a-6c2b-4d9d-b71b-47b9d032e3d1` with status `ai_draft_succeeded`, provider `google`, model `gemini-3.1-pro-preview`
- hierarchy page rendered Provider Draft surface, `ai_draft_succeeded`, live draft id, and Compiled Prompt Preview
- manual correction after real AI draft persisted successfully
- provider failure path still persisted `ai_draft_failed`
- manual fallback still worked after provider failure
- no fake/stub AI output was used
- no env files, secrets, or test DB files were committed
- no participant targeting, rollout, sessions, source-to-hierarchy triage, prompt draft testing, workflow analysis, synthesis/evaluation, or package generation was added

Patch 2 accepted boundary:

Patch 2 proves real provider-backed AI hierarchy drafting only. Source-to-hierarchy AI triage and prompt draft testing/comparison remain deferred.

### 20.0A Patch 1 Acceptance Record

Patch 1 is **accepted**.

Final Patch 1 commit:

`c1ae3bc3cc68917687e28d8e0d15fdebe831ff37`

Accepted branch:

`codex/pass3-foundation`

Final verification:

- `git status --short`: clean
- 24 files changed, 1797 insertions, 9 deletions
- `pnpm build:contracts` passed
- `pnpm typecheck` passed
- `pnpm build` passed
- SQLite/domain proof passed with readiness `ready_for_participant_targeting_planning`
- approved snapshot immutability proof passed
- route/UI proof passed and rendered `ready_for_participant_targeting_planning`
- no `ready_for_pass4` occurrences remain
- no Pass 4 execution, rollout, sessions, workflow analysis, synthesis/evaluation, or package generation was added

Patch 1 accepted scope:

- hierarchy contracts/schemas
- `@workflow/hierarchy-intake` foundation package
- SQLite repositories
- admin hierarchy API/UI foundation
- structural approval snapshot
- readiness snapshot toward participant-targeting planning
- PromptSpec contracts/repository shape only

Patch 1 remains foundation-only. Provider-backed Gemini execution, source-to-hierarchy AI triage, prompt draft testing UI/execution, and full prompt comparison remain deferred to later patches.

### 20.1 Functional Proofs

- pasted hierarchy input works
- uploaded hierarchy document input works
- provider-backed AI draft hierarchy generation works
- admin correction flow works
- secondary relationships work
- person-light mapping works
- AI-assisted source-to-hierarchy triage works
- admin can reject, change, confirm, or mark source links for participant validation
- admin discussion/explanation around hierarchy and source-link suggestions works at least minimally
- approval creates an immutable approved hierarchy snapshot
- readiness snapshot toward Pass 4 is generated
- stored records persist across restart or reload through the accepted persistence path

### 20.2 Prompt Proofs

- Pass 3 prompt text is visible to the admin
- Pass 3 prompt is managed through a Structured PromptSpec editor
- Pass 3 provides a full compiled prompt preview
- Pass 3 prompt can be edited through a controlled/traceable prompt version or draft mechanism
- prompt draft can be tested without becoming active
- active prompt output can be compared against draft prompt output on the same input/context
- draft-to-active promotion requires explicit admin action
- previous active prompt version remains available for rollback/reference

### 20.3 Boundary Proofs

- Pass 3 does not create final participant selections
- Pass 3 does not send invitations
- Pass 3 does not create participant sessions
- Pass 3 does not begin rollout
- Pass 3 does not perform workflow analysis
- Pass 3 does not perform synthesis/evaluation
- Pass 3 does not generate packages

### 20.4 Build Proofs

- `pnpm build:contracts` passes
- `pnpm typecheck` passes
- `pnpm build` passes

---

## 21. Explicit Non-Goals

Pass 3 must not implement:

- participant targeting execution
- participant selection finalization
- participant contact validation
- channel delivery
- WhatsApp / Telegram / email rollout
- participant sessions
- narrative intake
- clarification rounds
- workflow reconstruction
- reference suitability scoring
- synthesis/evaluation
- initial or final package generation
- automation-readiness scoring
- production auth/roles beyond minimal admin boundary if already required by current app patterns
- broad UI redesign or polish

---

## 22. Decisions Log

| Decision ID | Decision | Reason | Status |
|---|---|---|---|
| H-DEC-001 | Treat this slice as **Pass 3 — Hierarchy Intake & Approval Build Slice**. | Archived Pass 2 explicitly states that Pass 3 / hierarchy work must begin in a separate build spec, while Pass 2 itself closed all intake/context work and excluded hierarchy. | Recorded |
| H-DEC-002 | Adopt a **Role-first, Person-light** hierarchy model. | Pass 3 must ground roles, levels, reporting lines, and grouping first. Named people may be mapped as occupants/candidate participants when known, but email, phone, channel preference, final participant selection, invitation, and targeting status belong to the later participant-targeting / rollout slice unless stored only as optional inert metadata. | Locked for Pass 3 planning |
| H-DEC-003 | Approve **Option 3 bounded** as Pass 3 scope. | This creates a complete hierarchy-to-readiness bridge without stealing Pass 4 responsibilities. Pass 3 may produce a readiness snapshot toward participant targeting, but it must not select participants, execute targeting, send invitations, create sessions, or change targeting statuses. | Locked for Pass 3 planning |
| H-DEC-004 | Use **minimum core + optional enrichment layers** for hierarchy nodes. | The system must work for companies with only basic role/reporting information and also benefit from richer inputs when available. Job descriptions, responsibilities, KPIs, targets, visit counts, systems, documents, and authority details are valuable but optional. | Locked for Pass 3 planning |
| H-DEC-005 | Use **primary parent + optional secondary relationships** for reporting lines. | Real companies may have direct reporting, dual reporting, dotted-line relationships, matrix responsibility, cross-functional work, or operational dependencies. Pass 3 should preserve this complexity without forcing every node into a rigid single-parent model or turning the primary hierarchy into an unreadable graph. | Locked for Pass 3 planning |
| H-DEC-006 | Use default grouping categories plus `custom`. | The system needs useful default grouping for targeting/escalation readiness, but real companies may have informal, hybrid, local, or unusual role structures. `customGroupLabel` and optional `customGroupReason` prevent forced misclassification. | Locked for Pass 3 planning |
| H-DEC-007 | Add **AI-assisted Source-to-Hierarchy Relevance Triage** to Pass 3. | Existing sources may contain department-wide, role-specific, KPI, responsibility, approval, system, or person-related signals. These signals should help the admin understand source relevance, but they remain tentative evidence candidates and must not become workflow truth before participant/reality validation. | Locked for Pass 3 planning |
| H-DEC-008 | Record the need for a broader **domain-aware Admin Copilot** across later slices, but do not build the full copilot in Pass 3. | The admin needs a system-aware discussion partner across hierarchy, targeting, intake, synthesis, and document output. In Pass 3 this appears only as triage discussion support; full copilot architecture belongs to the later prompt/system-guide architecture track. | Recorded / Later-slice dependency |
| H-DEC-009 | Approve required admin correction operations for hierarchy draft. | Pass 3 must allow real correction of the AI-generated hierarchy draft before approval, including node edits, relationship edits, source-link decisions, validation flags, and admin notes, without forcing full re-entry. | Locked for Pass 3 planning |
| H-DEC-010 | Define admin approval as **structural approval for next-step readiness**, not workflow-truth validation. | Approval confirms the hierarchy is acceptable as a grounding layer for Pass 4 planning. It does not validate source claims, KPIs, responsibilities, or actual workflow practice; those remain subject to participant/reality validation later. | Locked for Pass 3 planning |
| H-DEC-011 | Store the full Pass 3 hierarchy process, not only the final approved hierarchy. | Raw input, AI draft, nodes, relationships, person-light mappings, source triage links, admin corrections, approval record, approved snapshot, and readiness snapshot must be preserved for traceability and later Pass 4 use. | Locked for Pass 3 planning |
| H-DEC-012 | Require provider-backed AI capabilities when claimed; use Gemini 3.1 Pro Preview as the current active reasoning provider. | Pass 3 AI draft generation, source-to-hierarchy triage, and admin explanation/discussion must use a real provider-backed execution path when claimed. If the provider fails or is unavailable, the system must show a visible failure and allow manual/admin fallback without pretending AI succeeded. | Locked for Pass 3 planning |
| H-DEC-013 | Require a bounded **Pass 3 AI Prompt Contract**. | The hierarchy and source-triage AI must be instructed to analyze sources through hierarchy relevance, role scope, KPI/target/responsibility/approval/system/person signals, and participant-validation needs. It must not treat source claims as workflow truth or perform workflow analysis. | Locked for Pass 3 planning |
| H-DEC-013A | Pass 3 prompts must include role definition and be visible/editable to the admin. | Prompt behavior must not be hidden inside code. The admin needs to see, review, and modify the role definition, task instructions, boundaries, output requirements, and uncertainty rules. Edits should be versioned or traceable, not silent overwrites. | Locked for Pass 3 planning |
| H-DEC-013B | Prompt drafts must be testable and comparable before activation. | The admin must be able to edit a draft prompt, test it against the same input/context, compare its output with the current active prompt, then explicitly promote it to active or keep/reject it. This supports model updates, provider changes, prompt refinement, and rollback safety. | Locked for Pass 3 planning / Cross-system prompt requirement |
| H-DEC-013C | Adopt **Structured PromptSpec Editor + Full Compiled Prompt Preview + Draft Testing** as the prompt-management model. | Structured prompt sections improve validation, testing, comparison, versioning, rollback, schema binding, and safer admin control. Full compiled prompt preview preserves transparency. This pattern should apply to Pass 3 and future system prompts across the product. | Locked for Pass 3 planning / Cross-system prompt requirement |
| H-DEC-014 | Approve minimum Pass 3 acceptance proofs. | Acceptance requires working hierarchy input, provider-backed AI draft, admin correction, secondary relationships, person-light mapping, source triage, admin source-link decisions, immutable approval snapshot, readiness snapshot, persistence proof, no rollout/session/workflow-analysis leakage, and build/typecheck/build proof. | Locked for Pass 3 planning |
| H-DEC-016 | Accept current visual hierarchy workbench as **Minimum Visual Inspectability** for Pass 3 closure. | The UI is not the final desired UX, but it is sufficient to inspect hierarchy structure, badges, relationships, source signals, approval, and readiness. Broader visual redesign, full Arabic UX, overview dashboard, and Admin Copilot are deferred. | Locked for Pass 3 closure |
| H-DEC-015 | Add **Patch 3.5 — Provider Configuration Hardening** before prompt draft testing. | Provider configuration will be reused across hierarchy drafting, source triage, prompt testing, sessions, synthesis, and package drafting. Centralizing env/model resolution and safe diagnostics prevents repeated confusion when credentials exist but are not visible to a given runtime. | Locked for Pass 3 execution sequencing |

---

## 23. Gap Checklist

| Gap ID | Gap Area | Status |
|---|---|---|
| H-GAP-001 | Slice Scope | Resolved — Option 3 bounded |
| H-GAP-002 | Hierarchy Node Contract | Resolved — minimum core + optional enrichment layers |
| H-GAP-003 | Reporting Line Model | Resolved — primary parent plus optional secondary/cross-functional relationships |
| H-GAP-004 | Role vs Person Boundary | Resolved — Role-first, Person-light |
| H-GAP-005 | Grouping Logic | Resolved — default categories plus custom group label |
| H-GAP-006 | Source Visibility | Resolved — AI-assisted source-to-hierarchy relevance triage, tentative only |
| H-GAP-007 | Admin Correction UX | Resolved — required correction operations approved |
| H-GAP-008 | Approval Semantics | Resolved — structural approval for Pass 4 readiness, not workflow-truth validation |
| H-GAP-009 | Readiness Gate | Resolved — owns readiness snapshot only, not targeting decisions |
| H-GAP-010 | Persistence | Resolved — required Pass 3 persistence records approved |
| H-GAP-011 | Acceptance Proofs | Resolved — minimum Pass 3 acceptance proofs approved |
| H-GAP-012 | AI Provider Role | Resolved — provider-backed when claimed, Gemini 3.1 Pro Preview as current active reasoning provider, manual fallback if unavailable |
| H-GAP-013 | Pass 3 AI Prompt Contract | Resolved — bounded Pass 3 prompt contract required |

---

## 24. Deferred / Later-Slice Items

### 24.0 Immediate Next Patch Candidate

Recommended next step after accepted Patch 4.5:

**Pass 3 Final Closure / Acceptance Review**

Operator visual review decision:

The current visual hierarchy workbench is accepted as **Minimum Visual Inspectability** for Pass 3 closure.

Meaning:

- the current UI is good enough to inspect and close Pass 3
- it is not the final desired UX
- full visual hierarchy canvas, richer interaction, full Arabic UX, journey overview dashboard, and Admin Copilot are deferred to later UI/Copilot tracks
- do not reopen Pass 3 for broad UI redesign before final closure

Final closure should verify the full accepted Pass 3 chain:

- Patch 1 foundation
- Patch 2 Gemini hierarchy draft
- Patch 3 source-to-hierarchy triage
- Patch 3.5 provider configuration hardening
- Patch 4 prompt testing and activation controls
- Patch 4.5 visual hierarchy workbench

Purpose:

Run a final end-to-end Pass 3 acceptance review across all accepted Patch 1, Patch 2, Patch 3, Patch 3.5, and Patch 4 capabilities before calling Pass 3 complete.

Final closure should verify:

- pasted hierarchy intake
- uploaded hierarchy document/reference intake path
- Gemini-backed hierarchy draft generation
- manual fallback after provider failure
- admin correction flow
- secondary relationships
- person-light mapping
- source-to-hierarchy relevance triage
- admin source-link decisions
- provider config diagnostics
- prompt draft testing and active-vs-draft comparison
- explicit prompt promotion and previous-active preservation
- structural approval snapshot immutability
- readiness snapshot `ready_for_participant_targeting_planning`
- SQLite persistence/reload across all Pass 3 records
- no Pass 4 execution, participant targeting, rollout, sessions, workflow analysis, synthesis/evaluation, or package generation
- final build/typecheck/build proof

If final closure passes, update handoff/current-state files to mark Pass 3 accepted and define the next slice as Pass 4 — Participant Targeting / Rollout Planning.

Prior candidate completed:

**Pass 3 Patch 4 — Prompt Draft Testing, Comparison, and Activation Controls**

Proposed Patch 4 should include only:

- editable PromptSpec draft for Pass 3 hierarchy draft prompt and source-triage prompt
- active prompt vs draft prompt separation
- compiled prompt preview for active and draft versions
- controlled test run using the same input/context against active and draft prompts
- active-vs-draft comparison view
- explicit draft-to-active promotion action
- previous active prompt retained for rollback/reference
- traceable prompt version records and test-run records
- provider failure state for prompt test execution
- no source-triage expansion beyond already accepted Patch 3 behavior

Patch 4 must not include:

- participant targeting
- rollout
- invitations
- sessions
- workflow analysis
- reference suitability scoring
- synthesis/evaluation
- package generation
- broad cross-system prompt architecture beyond what Pass 3 needs locally

### 24.0A Deferred UX / Copilot Track

The following UI/Copilot improvements are intentionally deferred beyond Pass 3 closure:

- full visual hierarchy canvas with richer interaction
- pan/zoom graph-style hierarchy experience
- cleaner client-presentable node-card design
- full Arabic UX/localization layer
- journey overview dashboard across all workflow steps
- cross-slice Admin Copilot
- page-level guided explanations and contextual help across the whole product
- product-wide design system refinement

Pass 3 closes with minimum visual inspectability, not final product UX.

The following are intentionally not part of Pass 3 but should remain visible:

- Pass 4 participant targeting and rollout planning
- final participant selection
- contact/channel validation
- invitation sending
- participant sessions
- participant-facing payloads
- actual workflow narrative intake
- clarification rounds
- workflow reconstruction
- synthesis/evaluation
- package generation
- full cross-slice Admin Copilot architecture
- full prompt-system architecture track
- domain overlays and prompt evaluation harness beyond local Pass 3 needs
- production auth / roles / CI unless separately scoped

---

## 25. Final Pass 3 Closure Record

Final Pass 3 status:

`pass3_hierarchy_intake_approval_accepted`

Final closure branch:

`codex/pass3-final-closure`

Final closure commit:

`4343b7792957ae99964bf1a5cb8ae272453779cc`

Files changed in closure commit:

- `handoff/CURRENT_STATE.md`
- `handoff/NEXT_PASS.md`

Final closure proofs:

- `pnpm build:contracts` passed
- `pnpm typecheck` passed
- `pnpm build` passed
- API closure proof passed on `/tmp/workflow-pass3-final-closure.sqlite`
- provider-failure/manual-fallback proof passed on `/tmp/workflow-pass3-final-closure-failure.sqlite`
- restart/reload persistence proof passed
- in-app browser visual hierarchy proof passed

Accepted Pass 3 capabilities:

- pasted hierarchy intake
- uploaded hierarchy reference intake
- Gemini-backed hierarchy draft generation
- persisted AI draft
- provider-failure manual fallback
- admin correction flow
- secondary relationships
- person-light mapping
- source-to-hierarchy relevance triage
- source-link admin actions: accept, reject, change scope, mark participant-validation-needed, add note
- safe provider diagnostics
- prompt testing
- active-vs-draft prompt comparison
- explicit prompt promotion
- previous active prompt storage/viewability
- immutable structural approval snapshot
- readiness status `ready_for_participant_targeting_planning`
- visual hierarchy workbench with Arabic-first labels, node cards, badges, source/validation indicators, secondary relationship indicators, click-to-select details, and expand/collapse controls

Final boundary proof:

- no participant targeting was added
- no rollout order was added
- no invitations were added
- no participant sessions were added
- no workflow analysis was added
- no reference suitability scoring was added
- no synthesis/evaluation was added
- no package generation was added
- source links remain evidence candidates only
- hierarchy approval remains structural approval only

Persistence/reload proof:

After app restart on the same SQLite DB, the system reloaded:

- hierarchy intake
- uploaded reference intake
- hierarchy nodes
- secondary relationships
- person-light mapping
- source triage jobs/suggestions/admin decisions
- prompt specs/versions/test runs
- approval snapshot
- readiness snapshot
- visual workbench state

Next slice recorded:

`Pass 4 — Participant Targeting / Rollout Planning`

Important boundary:

Pass 4 has been recorded only. No Pass 4 implementation was added during Pass 3 closure.

---

## 26. Deferred UX / Copilot Track

The following remain intentionally deferred beyond Pass 3:

- full visual hierarchy canvas with richer interaction
- pan/zoom graph-style hierarchy experience
- client-presentable hierarchy design
- full Arabic UX/localization layer
- journey overview dashboard across all workflow steps
- cross-slice Admin Copilot
- page-level guided explanations and contextual help across the whole product
- product-wide design system refinement

Pass 3 closes with minimum visual inspectability, not final product UX.

