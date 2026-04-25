# Pass 4 — Participant Targeting / Rollout Planning Build Spec

## Archive Status

Status: Accepted / Closed / Archived

Final accepted branch: `codex/pass4-targeting-rollout`

Final accepted commit: `14c32adbcd1156ce6e18490468f866e922745e07`

Main integration status: merged to `main` by fast-forward.

Main integration proof:

- `pnpm build:contracts` passed on `main`
- `pnpm typecheck` passed on `main`
- `pnpm build` passed on `main`
- Canonical provider proof on `main` used `/Users/haitham/development/Workflow/.env.local`
- `/api/provider-status` returned `googleAI.configured: true`, `googleAI.keyPresent: true`, `googleAI.diagnosticsStatus: provider_success`, and `googleAI.resolvedModel: gemini-3.1-pro-preview`
- Cross-pass provider regression passed for Pass 2, Pass 3, and Pass 4 using the same canonical Workflow env method.

Boundaries preserved:

- no outreach sent
- no invitations created
- no participant sessions created
- no participant responses collected
- no workflow analysis performed

Pass 5 status: not started.

---

## Execution Log

- File Purpose: Live planning/build-spec reference for Pass 4 — Participant Targeting / Rollout Planning.
- Working Mode: Strict project continuity; one build slice at a time; one live reference file at a time.
- Conversation Status: Planning/specification only. No coding instructions are approved yet.
- Active Local Baseline: Pass 2 — Intake & Context Build Spec is accepted, closed, and archived. Pass 3 — Hierarchy Intake & Approval is accepted, closed, and archived. The current planning slice is Pass 4 — Participant Targeting / Rollout Planning.
- Baseline Alignment Decision: The broader nine-pass skeleton remains a historical/program-level build map. For this conversation, the governing local execution sequence is the post-Pass-2 slice sequence: Pass 2 Intake, Pass 3 Hierarchy, Pass 4 Participant Targeting / Rollout Planning.
- Authority Note: Do not reopen Pass 2 or Pass 3. Use their archived outputs as inputs only.
- Last Updated: 2026-04-25

---

## 1. Proposed Pass 4 Purpose

Pass 4 defines how the system moves from an approved structural hierarchy snapshot into a controlled participant targeting and rollout-planning stage.

Its purpose is not to start participant sessions or analyze workflow reality. Its purpose is to decide:

- who should be asked
- why they should be asked
- in what order they should be approached
- what hierarchy/use-case evidence supports their inclusion
- what admin approvals are required before later rollout execution begins

Pass 4 should create a governed targeting plan that can hand off cleanly to a later participant outreach / rollout execution / session creation slice.

---

## 2. Approved Pass 4 Scope

Approved scope decision:

Pass 4 includes **participant targeting planning + contact/channel readiness metadata + admin-approved rollout plan**, and explicitly stops before actual outreach execution.

Pass 4 owns:

- consume the approved Pass 3 hierarchy snapshot
- verify entry readiness from the prior slice
- use the approved hierarchy as the structural basis for participant targeting
- support hierarchy-aware participant candidate review
- generate role/node-based targeting suggestions
- prioritize selected-department participants first when they are inside the selected use case
- support bottom-up rollout planning logic because frontline/operational participants hold ground-level execution evidence
- allow admin override of the starting layer with an explicit reason
- prepare participant list fields needed for later outreach
- check contact/channel readiness metadata without sending invitations
- identify missing contact/channel data as blocking or non-blocking for later rollout execution
- group target review by level, such as:
  - frontline / operational
  - senior individual contributors
  - supervisors
  - managers
  - external interfaces / other departments only when a specific decision, handoff, approval, or clarification need depends on them
- treat source/hierarchy signals as planning support only, not workflow truth
- require an admin approval gate before moving to later rollout execution
- produce a clear handoff to the next slice: participant outreach / rollout execution / session creation

Pass 4 must stop before:

- actual invitation sending
- channel delivery
- participant response collection
- participant session creation
- participant-facing question preparation
- workflow narrative intake

---

## 3. Proposed Out-of-Scope

Pass 4 should not include unless explicitly approved:

- actual invitation sending
- WhatsApp / Telegram / email delivery
- participant sessions
- participant answers
- workflow analysis
- synthesis/evaluation
- final package generation
- source/reference suitability scoring
- automation-readiness scoring
- full UI redesign
- full visual hierarchy canvas
- full Admin Copilot
- journey dashboard
- Google AI Studio prototype integration

---

## 4. Critical Boundary

Participant targeting is not workflow truth.

Pass 4 may plan participant targeting and rollout order. It must not validate actual operational practice, interpret SOP truth, start sessions, prepare participant questions, or analyze workflow reality.

Hierarchy approval remains structural approval only. Source-to-hierarchy links remain evidence candidates and planning signals, not final workflow evidence.

### 4.1 Operator Clarification — Pass 4 Simplicity Rule

Pass 4 should remain a relatively simple targeting-planning slice.

The main question is:

- who should be asked so the selected department/use case workflow can be reconstructed correctly?

The default target group should come from the selected department and selected use case.

The lower/frontline operational layer is prioritized because these are the people closest to actual execution. They usually know the real steps, exceptions, handoffs, and practical workarounds because they perform the work on the ground.

The admin may still choose to begin from a manager, supervisor, or another layer when there is a practical reason. That reason must be recorded.

Other departments or functions may be included only as targeted external clarification or decision sources when the selected workflow depends on a decision, handoff, approval, or information that sits outside the main department. They should not become default first-round participant groups.

Pass 4 must not prepare the actual participant questions to be asked. Question generation belongs to the later participant session / clarification slice.

However, Pass 4 may preserve source-informed **question hints / clarification seeds** for later Pass 5 use. These are not participant-facing questions and must not be sent directly. They are structured signals derived from documents that may help Pass 5 generate better follow-up questions after the participant gives the first narrative answer.

---

## 5. Initial Gap Checklist

| Gap ID | Gap | Type | Criticality | Current Status | Why It Matters | Blocking? |
|---|---|---|---:|---|---|---|
| G4-001 | Baseline alignment between skeleton and current execution slices | Conceptual / Governance | 5 | Resolved by operator clarification | The broader nine-stage skeleton is not being reopened; current local execution continues from closed Pass 2 and closed Pass 3 into Pass 4 participant targeting / rollout planning | No |
| G4-002 | Pass 4 scope option not formally selected: planning only vs planning + contact readiness vs admin-approved rollout plan vs actual outreach execution | Operational | 5 | Resolved by operator approval | Approved scope is targeting planning + contact/channel readiness metadata + admin-approved rollout plan, with no sending and no sessions | No |
| G4-003 | Entry condition from Pass 3 needs exact mechanical definition | Operational | 4 | Open | Pass 4 must know what readiness status unlocks targeting planning and what snapshot it consumes | Likely |
| G4-004 | Participant candidate data model not defined | Documentation / Operational | 4 | Open | The system needs to know what fields belong to candidates before contact readiness can be checked | Likely |
| G4-005 | Bottom-up rollout default and override logic need formal stop conditions | Operational | 4 | Open | Without this, the system may target too broadly or allow untraceable admin overrides | Likely |
| G4-006 | External-interface inclusion rule needs operational trigger | Conceptual / Operational | 3 | Partially resolved by operator clarification | Other departments may be included only for targeted decisions/questions tied to the selected workflow, not as default first-round groups | No |
| G4-007 | Provider-backed intelligence boundary not defined for Pass 4 | Operational | 3 | Open | Need to decide whether targeting suggestions are deterministic, LLM-assisted, or both | Not yet |
| G4-008 | Acceptance proofs for Pass 4 not defined | Documentation / Operational | 4 | Open | Coding agent cannot close the pass without objective proof targets | Likely |

---

## 6. First Blocking Question

Question: Should Pass 4 targeting suggestions be AI-assisted through the active reasoning provider, deterministic/rule-based only, or hybrid?

Why it matters: Pass 4 includes role/node-based targeting suggestions. If the system suggests who should be included and why, we must decide whether that suggestion comes from deterministic hierarchy rules only, from provider-backed AI interpretation, or from a hybrid model. This affects contracts, prompt specs, fallback behavior, persistence, test proofs, and the admin review surface.

Example of a good answer:

"Use a hybrid model. Deterministic rules enforce readiness, boundaries, and allowed targeting states. AI may suggest target candidates and reasoning from the approved hierarchy, use case, source-triage signals, and role visibility, but admin approval is required. Provider failure should fall back to manual planning, not block the whole slice."

Alternative answer:

"Use deterministic only for Pass 4. No AI targeting suggestions yet. Admin manually builds the targeting plan from hierarchy nodes."

---

## 8. Current Working Decision State

Baseline authority is resolved for this conversation: continue from accepted Pass 2 and accepted Pass 3 into Pass 4.

Pass 4 scope boundary is resolved: targeting planning + participant contact profile/readiness + admin-approved rollout plan, with no actual sending and no participant sessions.

Do-not-contact simplification is approved: people the admin does not want to contact should be rejected/removed from the approved target list, not carried as do-not-contact participants inside the sendable plan.

Final Targeting Plan Review is approved as the final Pass 4 admin gate before plan approval. It must show targets, order, type, contact readiness, source signals/hints, admin notes, and explicit boundary confirmations: no outreach sent, no invitations created, no sessions created, no responses collected, and no workflow analysis performed.

Persistence simplification is approved: Pass 4 should use one main TargetingRolloutPlan persistence object with embedded sections, not many independent records for packet, candidate decisions, contact profiles, hint seeds, and final review.

Package placement is approved: Pass 4 domain logic should live in a new lightweight `packages/targeting-rollout` package, while contracts stay in `packages/contracts`, storage stays in `packages/persistence`, and UI stays in `apps/admin-web`.

Operator clarification added: Pass 4 should remain simple and should not prepare participant-facing questions.

Source-informed targeting is approved: documents may influence targeting as signals, especially department-specific documents, but they do not prove workflow truth and do not select participants without admin approval.

Pass 3 person/contact carry-forward is approved: if person-light mapping or optional contact details were captured in Pass 3, Pass 4 should prefill them into participant contact profiles for admin review/completion. This carry-forward does not mean outreach or sessions started in Pass 3.

Contact data source traceability is approved: every carried-forward or entered contact field should preserve its source using the approved contactDataSource values.

Question-hint seeds are approved as a Pass 4 support artifact for Pass 5: they are not direct questions and may only guide later follow-up after the participant's first narrative answer.

Pass 4 PromptSpec governance is approved: any AI behavior that interprets documents, suggests targeting candidates, explains targeting reasons, or creates question-hint seeds must be visible/editable/testable by the admin through the same structured PromptSpec + compiled preview + draft testing pattern used in Pass 3.

PromptSpec structure decision is approved: use one central Pass 4 PromptSpec with internal capability sections for targeting suggestions, source-signal interpretation, external clarification source detection, contact/channel readiness metadata, rollout order reasoning, and question-hint seed generation. Do not split into multiple PromptSpecs unless implementation later proves that a local split is necessary.

AI output model is approved: Pass 4 AI produces one unified Targeting Recommendation Packet for admin review. The packet contains target candidates, target groups, rollout order suggestion, source signals, question-hint seeds, contact/channel readiness notes, admin review flags, boundary warnings, and confidence summary. It does not send, create sessions, or approve itself.

Admin candidate decision actions are approved: accept, reject, change target type, change rollout stage/order, mark contact data missing, and add admin note.

Approved Targeting & Rollout Plan state model is approved: draft_from_ai_packet, under_admin_review, approved_ready_for_outreach, approved_with_contact_gaps, needs_rework, rejected.

## 9. Source-Informed Targeting and Question-Hint Seeds

### 9.1 Source-Informed Targeting Rule

Company, department, and role-related documents may influence participant targeting as source signals.

These sources may include:

- company profile
- company overview
- service catalog
- department SOPs
- procedures
- KPIs
- policies
- role/responsibility documents
- forms/templates
- approval references
- system or queue references

Documents may influence targeting when they mention or imply:

- relevant roles
- role responsibilities
- KPIs or targets
- approval authorities
- decision thresholds
- handoffs
- systems or queues
- external departments or interfaces
- people names
- process stages
- exception handling signals

Important rule:

Documents may create targeting signals, increase or reduce targeting priority, flag a participant-validation need, or suggest an external decision/clarification source. They must not be treated as workflow truth and must not select participants automatically without admin approval.

### 9.2 Department Documents Have Stronger Targeting Weight

Department-specific documents usually carry stronger targeting value than generic company profile documents because they are closer to the selected use case and selected department.

Suggested source influence levels:

- approved hierarchy + selected use case: primary targeting basis
- department procedures / SOPs / KPIs / role documents: high targeting influence
- source-to-hierarchy triage links: high but tentative influence
- company profile / website / general overview: contextual influence, usually medium unless it reveals a specific role, department, or external interface
- admin judgment: final decision authority

### 9.3 Question-Hint / Clarification-Seed Rule

Pass 4 may preserve non-final question hints derived from documents.

These hints are not participant-facing questions. They are analytical seeds that Pass 5 may use only after the participant has provided their first narrative answer.

Purpose:

- help Pass 5 notice document-derived topics worth checking
- avoid losing useful signals from SOPs/KPIs/procedures
- help generate better clarification questions later when a participant answer leaves a gap
- avoid asking unnecessary questions if the participant already covers the point in the first answer

### 9.4 Question-Hint Seed Examples

A KPI document may create a hint such as:

- "The KPI sheet mentions 20 monthly activities. If the participant does not explain how activity targets are counted, ask for clarification later."

A procedure may create a hint such as:

- "The procedure mentions manager approval for sensitive pricing. If the participant mentions pricing but not the approval threshold, ask later who approves and under what condition."

A role document may create a hint such as:

- "The role document says the supervisor reviews client readiness. If the participant does not mention supervisor review, ask whether this review happens in practice."

### 9.5 Question-Hint Seed Contract — Approved Minimum Fields

Each question hint seed must preserve at minimum:

- `hintId`
- `sourceId`
- `sourceName`
- `linkedTargetCandidateId` or `linkedHierarchyNodeId`
- `documentSignal`
- `whyItMayMatter`
- `suggestedLaterQuestionTheme`
- `triggerConditionForPass5`
- `doNotAskIfAlreadyCovered` flag
- `participantValidationNeeded` flag
- `status`: active, resolved_by_initial_narrative, used_in_followup, dismissed_by_admin

Approval status:

- Approved by operator.

### 9.6 Boundary Rule

Pass 4 must not turn question hints into fixed questionnaires.

Pass 5 remains narrative-first:

1. participant gives the first explanation
2. system extracts what was answered
3. system checks whether any source-informed hints remain unresolved
4. only then may Pass 5 generate a targeted clarification question if the hint still matters

---

## 10. Pass 4 PromptSpec and Admin Prompt Visibility

### 10.1 Prompt Governance Decision

Because Pass 4 uses AI to interpret documents, extract targeting signals, suggest participant candidates, and preserve question-hint seeds, Pass 4 requires its own bounded PromptSpec system.

Approved model:

**One central Pass 4 PromptSpec with internal capability sections**, following the same structured prompt-management pattern accepted in Pass 3.

Do not split Pass 4 into two separate PromptSpecs unless implementation later proves that one prompt becomes too large, unstable, or hard to test.

Reason:

Pass 4 is one planning capability: participant targeting. Source signals and question-hint seeds are sub-functions that support targeting and later Pass 5 readiness. Keeping them inside one PromptSpec preserves a single role definition, one boundary model, one compiled prompt preview, one active/draft lifecycle, one test comparison path, and easier admin control.

AI behavior in Pass 4 affects targeting suggestions and downstream Pass 5 hints. It must not be hidden inside code or treated as an uncontrolled prompt string.

### 10.2 Pass 4 Prompt Role

The Pass 4 AI role should be bounded as:

"You are a participant-targeting and source-signal planning assistant. Your job is to help the admin identify which people, roles, or external decision/clarification sources should be considered for later participant outreach based on the approved hierarchy, selected department, selected use case, and approved/tentative source signals. You may suggest targeting candidates, rollout order, targeting reasons, validation needs, and non-final question-hint seeds. You must not send invitations, create sessions, prepare participant-facing questions, validate workflow reality, or treat document claims as operational truth. Admin approval is required for all targeting decisions."

### 10.3 Pass 4 Prompt Internal Capability Sections

The central PromptSpec should be organized internally into capability sections so the admin can control each area clearly without managing multiple disconnected prompts.

Recommended internal sections:

1. Role Definition
2. Pass 4 Mission
3. Case Context Inputs
4. Targeting Scope Rules
5. Source-Signal Interpretation Rules
6. Participant Candidate Classification Rules
7. External Decision / Clarification Source Rules
8. Question-Hint Seed Rules
9. Contact / Channel Readiness Metadata Rules
10. Bottom-Up Rollout Order Rules
11. Admin Override and Approval Rules
12. Evidence / Source Truth Boundary Rules
13. Uncertainty and Manual Fallback Rules
14. Prohibitions
15. Output Contract / Schema
16. Admin Discussion Behavior
17. Evaluation Checklist
18. Test Cases / Golden Inputs
19. Compiled Prompt Preview
20. Draft / Active / Previous / Rollback Controls

Admin control principle:

Each internal section should be visible/editable in the UI, and the final compiled prompt should show exactly how the sections are assembled.

### 10.4 Pass 4 Prompt Responsibilities

The Pass 4 prompt may support:

1. interpreting approved hierarchy for targeting relevance
2. identifying core participant candidates inside the selected department/use case
3. identifying enrichment candidates such as supervisor, manager, or senior roles
4. identifying external decision / clarification sources only when a document, hierarchy link, handoff, approval, or dependency suggests a real need
5. reading source-to-hierarchy triage links from Pass 3 as tentative signals
6. reading department-specific documents as stronger targeting signals than generic company context when relevant
7. identifying document-derived targeting signals from SOPs, procedures, KPIs, policies, role documents, forms, templates, systems, queues, and approval references
8. producing targeting reasons in admin-readable language
9. producing participant-validation-needed flags
10. producing question-hint seeds for later Pass 5 use, without turning them into participant-facing questions
11. recommending bottom-up rollout order by default
12. explaining any suggested deviation from bottom-up order
13. preserving uncertainty instead of inventing certainty

### 10.5 Pass 4 Prompt Prohibitions

The Pass 4 prompt must not:

- select final participants without admin approval
- send invitations
- create participant sessions
- generate participant-facing questions
- run workflow analysis
- validate workflow truth
- treat SOPs, KPIs, policies, procedures, or role documents as actual practice
- turn document claims into facts
- expand into all departments by default
- create rollout execution actions
- override deterministic readiness gates
- modify Pass 3 hierarchy approval
- modify Pass 2 source classification decisions silently

### 10.6 Pass 4 Prompt Inputs

Minimum prompt inputs should include:

- `caseId`
- selected company context summary when available
- selected department
- selected use case
- approved hierarchy snapshot
- hierarchy readiness snapshot
- hierarchy nodes and levels
- person-light mappings when available
- source-to-hierarchy triage links
- source roles and scopes from intake
- department documents and document signals
- company profile / overview context signals
- admin notes
- currently selected targeting scope rules
- out-of-scope boundaries

### 10.7 Pass 4 Prompt Outputs

Approved AI output model:

Pass 4 AI should produce one unified **Targeting Recommendation Packet**.

Purpose:

The packet gives the admin one reviewable object that explains who is suggested for targeting, why, in what order, based on which hierarchy/source signals, and what later Pass 5 hints may matter.

The packet must not trigger outreach, create sessions, or treat suggestions as final decisions.

Minimum packet fields:

- `packetId`
- `caseId`
- `selectedDepartment`
- `selectedUseCase`
- `basisHierarchySnapshotId`
- `basisReadinessSnapshotId`
- `generatedByPromptVersionId`
- `providerJobId` or provider execution reference
- `generatedAt`
- `suggestedTargetCandidates[]`
- `targetGroups[]`
- `rolloutOrderSuggestion[]`
- `sourceSignalsUsed[]`
- `questionHintSeeds[]`
- `contactChannelReadinessNotes[]`
- `adminReviewFlags[]`
- `boundaryWarnings[]`
- `confidenceSummary`
- `manualFallbackAvailable`
- `adminDecisionStatus`: pending_review, approved, approved_with_edits, rejected, superseded

Each `suggestedTargetCandidate` should preserve at minimum:

- `candidateId`
- `targetType`: core_participant, enrichment_participant, external_decision_or_clarification_source
- `linkedHierarchyNodeId`
- `roleLabel` or `personLabel` when available
- `suggestedReason`
- `expectedWorkflowVisibility`
- `sourceSignals`
- `participantValidationNeeded`
- `suggestedRolloutStage`
- `contactChannelReadinessStatus`
- `confidence`
- `adminDecision`: pending, accepted, rejected, edited
- optional `adminNote`

### 10.7A Approved Admin Candidate Decision Actions

For each target candidate inside the Targeting Recommendation Packet, the admin may perform only the following decision actions unless later explicitly extended:

1. `accept`
2. `reject`
3. `change_target_type`
4. `change_rollout_stage_or_order`
5. `mark_contact_data_missing`
6. `add_admin_note`

Decision meaning:

- `accept` means the candidate remains in the targeting plan as suggested or with already recorded edits.
- `reject` means the candidate is excluded from the approved targeting plan.
- `change_target_type` allows the admin to reclassify the candidate between core participant, enrichment participant, or external decision / clarification source.
- `change_rollout_stage_or_order` allows the admin to adjust when the candidate should be contacted in the later rollout execution slice.
- `mark_contact_data_missing` records that the candidate may be conceptually valid but lacks contact/channel readiness for later outreach.
- `add_admin_note` records explanation, local context, concern, or approval rationale.

Boundary rule:

Candidate decision actions do not send invitations, create sessions, or collect participant answers.

Admin review rule:

The packet is an AI recommendation object only. Final targeting plan approval remains an admin decision.

### 10.8 Prompt UI / Admin Surfaces

Pass 4 must expose a prompt/admin surface that lets the admin inspect and adjust AI behavior.

Required prompt UI surfaces:

1. Prompt list / registry entry for Pass 4 targeting prompt
2. Prompt detail view
3. Structured PromptSpec fields
4. Full compiled prompt preview
5. Draft prompt editor
6. Test run using the same case context
7. Active vs draft output comparison
8. Boundary compliance indicators where feasible
9. Explicit promote-to-active action
10. Previous active prompt view / rollback reference
11. Prompt execution failure state
12. Admin note explaining why a draft was promoted or rejected

### 10.9 Prompt Testing Requirements

Prompt drafts must be testable before activation.

A test run should compare:

- same approved hierarchy snapshot
- same selected department/use case
- same source signals
- active prompt output
- draft prompt output
- differences in candidate selection
- differences in target type classification
- differences in rollout order recommendation
- differences in question-hint seeds
- boundary violations, if any

Promotion rule:

Saving a draft does not activate it. Activation requires explicit admin promotion.

### 10.10 Provider and Manual Fallback

Pass 4 AI capabilities may be claimed only if provider-backed execution works and is persisted/reviewable.

If the provider fails:

- show visible failure state
- preserve failed provider job or prompt test record
- allow admin/manual targeting plan creation
- do not fake AI output
- do not block the whole planning slice if manual planning can continue

### 10.11 Boundary With Broader Prompt System

Pass 4 should implement or preserve a local prompt-management pattern for its targeting/source-signal prompt.

The broader reusable prompt architecture remains a later prompt-system track. Pass 4 should not expand into a product-wide prompt framework unless explicitly approved.

---

## 11. Approved Targeting & Rollout Plan State Model

### 11.1 Approved Plan Purpose

After the admin reviews the Targeting Recommendation Packet and makes candidate-level decisions, Pass 4 should produce an **Approved Targeting & Rollout Plan** or an explicitly rejected / rework-needed plan state.

This plan is the formal Pass 4 handoff object for the later outreach execution / session creation slice.

It must not send invitations or create sessions by itself.

### 11.2 Approved Plan States

Approved plan states:

1. `draft_from_ai_packet`
2. `under_admin_review`
3. `approved_ready_for_outreach`
4. `approved_with_contact_gaps`
5. `needs_rework`
6. `rejected`

### 11.3 State Meanings

- `draft_from_ai_packet` — AI produced a Targeting Recommendation Packet, but admin review has not started or is not yet complete.
- `under_admin_review` — admin is actively reviewing, editing, accepting, rejecting, or annotating target candidates.
- `approved_ready_for_outreach` — admin approved the targeting and rollout plan, and required contact/channel readiness is sufficient for the later outreach execution slice.
- `approved_with_contact_gaps` — admin approved the targeting logic, but some participants or targets still have missing contact/channel data that must be resolved before outreach execution for those targets.
- `needs_rework` — the packet or plan is not acceptable yet and needs AI regeneration, manual revision, source review, or hierarchy/targeting adjustment before approval.
- `rejected` — admin rejected the targeting packet or plan and does not want to proceed with it.

### 11.4 Transition Rule

Allowed conceptual progression:

- `draft_from_ai_packet` → `under_admin_review`
- `under_admin_review` → `approved_ready_for_outreach`
- `under_admin_review` → `approved_with_contact_gaps`
- `under_admin_review` → `needs_rework`
- `under_admin_review` → `rejected`
- `needs_rework` → `draft_from_ai_packet` after AI regeneration or manual revision
- `approved_with_contact_gaps` → `approved_ready_for_outreach` after required contact/channel gaps are resolved

Boundary rule:

No state transition in Pass 4 may send outreach, create sessions, or collect participant answers.

### 11.5 Minimum Approved Plan Fields

The Approved Targeting & Rollout Plan should preserve at minimum:

- `targetingPlanId`
- `caseId`
- `selectedDepartment`
- `selectedUseCase`
- `basisPacketId`
- `basisHierarchySnapshotId`
- `planState`
- approved target groups
- approved target candidates
- rejected candidates with reasons when provided
- edited target types
- edited rollout order/stages
- participant contact profile readiness summary
- unresolved contact/channel gaps
- external decision / clarification sources included, if any
- admin approval record
- admin notes
- handoff readiness flag for outreach execution
- explicit `noSessionsCreated` flag
- explicit `noOutreachSent` flag

---

## 12. Participant Contact Profile and Flexible Channel Readiness

### 12.1 Contact Profile Decision

Pass 4 should not treat contact/channel readiness as a light note only.

Because Pass 4 is the slice where the admin accepts who should be targeted, it is also the right slice to collect, review, or validate the practical contact profile for the accepted target candidates.

This does not mean Pass 4 sends messages.

It means Pass 4 prepares enough participant contact data so the later outreach execution slice can work without re-opening participant selection.

### 12.2 Why Contact Data Belongs in Pass 4

Pass 3 intentionally kept contact details outside the required hierarchy model.

Pass 4 is where candidate roles become approved target candidates. Therefore, this is the correct point to attach or validate the person-level outreach details needed later.

### 12.3 Flexible Channel Rule

Pass 4 must not hard-code one permanent communication method.

A target candidate may have one or more possible channels, such as:

- WhatsApp
- Telegram
- mobile phone / SMS
- email
- web intake link
- other approved channel later

The system should support multiple channels per person when available.

The admin may choose a preferred channel, but the channel should remain configurable and case/person-specific rather than fixed globally.

### 12.3A Preferred Channel Optional Rule

Selecting a `preferredChannel` is optional in Pass 4.

If more than one channel exists and no preferred channel is selected, the contact profile may carry the status:

- `preferred_channel_not_selected`

This status should not automatically block approval of the targeting plan.

It becomes blocking only when the admin or later outreach execution policy requires a preferred channel before sending.

Rationale:

Pass 4 prepares participant contact profiles and targeting readiness. It does not execute outreach. Therefore, it should preserve available channels and make missing preference visible without forcing premature channel selection.

### 12.3B Pass 3 Person/Contact Carry-Forward Rule

If Pass 3 captured any person-light mapping or optional person/contact details, Pass 4 should carry them forward into the participant contact profile as prefilled data.

This may include:

- person name
- role occupant
- employee ID or internal identifier
- mobile number
- WhatsApp number
- Telegram handle or user ID
- email
- any available person-to-role confidence note
- any admin note captured during hierarchy correction

Important rule:

Contact details captured or visible during Pass 3 remain inert until Pass 4. They must not mean that participant targeting, outreach, invitation sending, or session creation started in Pass 3.

In Pass 4, these carried-forward details should be reviewed, completed, corrected, or confirmed by the admin before the final targeting and rollout plan is approved.

Source traceability:

The participant contact profile must preserve where each contact field came from.

Approved `contactDataSource` values:

- `pass3_person_light_mapping`
- `pass3_uploaded_hierarchy_file`
- `pass3_admin_correction`
- `pass4_manual_entry`
- `pass4_imported_table`
- `document_signal`
- `company_directory`
- `unknown`

Editable contact data rule:

Contact information is operational data and may change at any time. Pass 4 must allow the admin to edit participant names, phone numbers, WhatsApp numbers, Telegram handles, email addresses, preferred channels, and related contact fields at any point while the targeting plan is being prepared or reviewed.

A separate contact-confidence scoring field is not required in Pass 4. The practical requirement is editability, source traceability where useful, and status visibility.

The system should preserve at minimum:

- who changed the contact field
- when it was changed
- what the current value is
- optional source of the current value
- whether the contact profile is ready, partial, or blocked for later outreach

Participant Contact Profiles UI is required in Pass 4 so the admin can review/edit contact data before plan approval.

Preferred channel selection is optional in Pass 4. Missing preferred channel may be visible as preferred_channel_not_selected, but it does not automatically block plan approval unless the admin or later outreach policy requires it.

### 12.4 Minimum Participant Contact Profile Fields

For each accepted or potentially accepted target candidate, Pass 4 should support at minimum:

- `participantId` or generated target-person placeholder
- `displayName`
- `linkedHierarchyNodeId`
- `roleLabel`
- `targetType`
- `employeeId` or internal identifier when available
- `mobileNumber` when available
- `whatsAppNumber` when available
- `telegramHandle` or `telegramUserId` when available
- `email` when available
- `availableChannels[]`
- `preferredChannel` optional
- `fallbackChannels[]` optional
- `channelSelectionReason` optional
- `contactDataSource`: pass3_person_light_mapping, pass3_uploaded_hierarchy_file, pass3_admin_correction, pass4_manual_entry, pass4_imported_table, document_signal, company_directory, unknown
- `contactDataStatus`
- `lastContactDataUpdatedAt`
- `lastContactDataUpdatedBy`
- optional `contactDataSource` per field when useful
- optional `adminNote`

### 12.5 Contact Data Statuses

Suggested contact data statuses:

- `not_entered`
- `partial`
- `ready_for_later_outreach`
- `missing_required_contact_method`
- `multiple_channels_available`
- `preferred_channel_not_selected`
- `blocked_for_later_outreach`

### 12.6 What Pass 4 Must Not Do

Pass 4 must not:

- send WhatsApp messages
- send Telegram messages
- send SMS
- send email
- generate outreach links as active invitations
- create participant sessions
- record participant responses
- mark a participant as contacted

### 12.7 Relationship to Approved Plan States

Contact data can affect whether the final plan is:

- `approved_ready_for_outreach` when accepted targets have sufficient contact readiness for the later execution slice
- `approved_with_contact_gaps` when targeting logic is approved but some contact profiles are incomplete

The plan may still be approved conceptually even if some contact details are missing, but later outreach execution for those specific targets must be blocked until the missing data is resolved.

### 12.8 Participant Contact Profiles UI Surface

Pass 4 must include a clear admin UI surface or section named **Participant Contact Profiles**.

Purpose:

Allow the admin to review, edit, complete, or block the contact information of accepted or potentially accepted target candidates before the final targeting and rollout plan is approved.

Minimum admin capabilities:

- view all accepted / pending target candidates
- view linked hierarchy node / role
- edit participant display name
- edit or add mobile number
- edit or add WhatsApp number
- edit or add Telegram handle or ID
- edit or add email
- add or remove available channels
- choose optional preferred channel
- add fallback channels when useful
- mark contact data as partial or ready
- reject/remove candidate from the approved target list
- add admin note
- see whether the participant is core, enrichment, or external decision / clarification source
- see whether missing contact fields affect plan readiness

Rejected / not-selected participant rule:

If the admin does not want to contact a person, that person should not remain inside the approved outreach-ready candidate list. The admin should reject/remove the candidate from the approved targeting plan rather than carrying a do-not-contact participant inside the sendable list.

Boundary rule:

This UI surface prepares participant contact profiles only. It must not send messages, generate active invitations, create sessions, or record participant responses.

---

## 13. Final Targeting Plan Review

### 13.1 Purpose

Pass 4 must include a final admin review surface named **Final Targeting Plan Review** before the targeting and rollout plan can be approved.

Purpose:

Give the admin one final consolidated view of who will be contacted later, why, in what order, with what contact readiness, and what source signals or hints influenced the plan.

This review is the final Pass 4 gate before handoff to the later outreach execution / session creation slice.

### 13.2 Minimum Review Contents

The Final Targeting Plan Review must show at minimum:

- approved target candidates
- approved target groups
- target type for each candidate: core, enrichment, external decision / clarification source
- linked hierarchy node / role
- targeting reason
- rollout order / stage
- participant contact profile readiness
- missing contact fields, if any
- available channels
- optional preferred channel if selected
- source signals used
- question-hint seeds linked to each target when relevant
- admin edits and notes
- rejected/removed candidates summary when useful
- unresolved contact/channel gaps
- final plan state
- admin approval action

### 13.3 Mandatory Boundary Confirmation

The final review must show explicit boundary confirmations:

- no outreach sent
- no invitations created
- no participant sessions created
- no participant responses collected
- no workflow analysis performed

These confirmations should remain visible so the admin and later coding agent do not confuse Pass 4 approval with outreach execution.

### 13.4 Approval Result

After the final review, the admin may set the plan to one of the approved final states:

- `approved_ready_for_outreach`
- `approved_with_contact_gaps`
- `needs_rework`
- `rejected`

Approval rule:

Only `approved_ready_for_outreach` and `approved_with_contact_gaps` may be handed off to the later outreach execution / session creation slice.

Boundary rule:

Even after approval, Pass 4 does not send, invite, create sessions, or collect answers.

---

## 14. Persistence Model — Simplified

### 14.1 Persistence Decision

Pass 4 does not require many independent persistence records for every sub-object.

Approved direction:

Use one main **Targeting Rollout Plan** persistence object with embedded sections for the related planning data.

Reason:

Pass 4 is a simple targeting-planning slice. Splitting every component into separate persisted records would over-engineer the slice and make implementation heavier than necessary.

### 14.2 Main Persisted Object

Primary persisted object:

- `TargetingRolloutPlan`

It may contain embedded sections such as:

- recommendation packet summary
- target candidates
- admin candidate decisions
- participant contact profiles
- source signals used
- question-hint seeds
- rollout order / stages
- final review summary
- final plan state
- approval metadata
- boundary confirmations

### 14.3 What Should Not Be Split Yet

Do not create separate first-class persistence records unless implementation later proves a need for them:

- `TargetingRecommendationPacket`
- `TargetCandidateDecision`
- `ParticipantContactProfile`
- `QuestionHintSeed`
- `FinalTargetingPlanReviewRecord`

These can remain embedded inside the main `TargetingRolloutPlan` for Pass 4.

### 14.4 Future Split Rule

A later pass may split embedded sections into independent records only if there is a concrete reason, such as:

- repeated edits need audit history at sub-object level
- contact profiles become reusable across cases
- question-hint seeds need lifecycle tracking across Pass 5
- outreach execution requires separate dispatch entities
- performance or query needs require normalization

Until then, keep Pass 4 persistence simple.

---

## 15. Package Placement Decision

### 15.1 Approved Package Placement

Pass 4 targeting and rollout-planning logic should live in a new lightweight package:

- `packages/targeting-rollout`

This package should own the Pass 4 domain logic without becoming a large orchestration layer.

### 15.2 Package Responsibility

`packages/targeting-rollout` owns:

- TargetingRolloutPlan creation/update logic
- target candidate classification support
- admin candidate decision handling
- rollout order planning rules
- contact profile readiness interpretation
- source-informed targeting signal handling
- question-hint seed handling as embedded planning support
- final targeting plan review readiness
- plan state transitions inside Pass 4
- boundary enforcement that Pass 4 does not send outreach, create invitations, create sessions, or analyze workflow

### 15.3 What Stays Outside This Package

- `packages/contracts` owns schemas, shared types, and validators.
- `packages/persistence` owns repository/storage implementation.
- `apps/admin-web` owns UI pages, forms, and admin interaction surfaces.
- `packages/integrations` owns provider adapters.
- `packages/prompts` or the prompt workspace pattern owns prompt registry / prompt versions if implemented as shared infrastructure.
- `packages/sessions-clarification` owns participant sessions later.
- `packages/synthesis-evaluation` owns workflow synthesis/evaluation later.

### 15.4 Why Not Put It Inside core-case

Pass 4 is not only generic case lifecycle logic.

It has its own bounded domain:

- who should be contacted later
- why they are selected
- how they are grouped
- in what order they should be approached
- whether their contact profile is ready
- what source signals and later question-hint seeds are attached

Keeping this in `targeting-rollout` makes the implementation easier for coding agents to inspect, patch, and test without overloading `core-case`.

### 15.5 Lightweight Rule

This package must stay lightweight.

Do not turn it into:

- channel delivery
- participant session logic
- workflow analysis
- broad orchestration engine
- product-wide prompt architecture

It should only own Pass 4 planning logic and handoff readiness.

---

## 16. Admin UI / API Surfaces — Approved Minimal Set

### 16.1 UI Philosophy

Pass 4 UI should be simple, admin-friendly, and focused on helping the operator make a good targeting decision without exposing unnecessary internal complexity.

Any AI-assisted behavior must be visible, reviewable, editable, and testable where it materially affects targeting, source-signal interpretation, rollout order, or question-hint seeds.

The UI should help the admin answer five practical questions:

1. Who is suggested for later outreach?
2. Why are they suggested?
3. Are they core, enrichment, or external clarification sources?
4. Are their contact details ready or missing?
5. Is the final plan ready to hand off to the next slice?

### 16.2 Required Admin UI Surfaces

Approved minimal UI surfaces:

1. **Targeting Plan Overview**
   - Shows case, department, use case, Pass 3 readiness input, current plan state, and next required action.

2. **AI Recommendation Packet Surface**
   - Button/action to generate or regenerate the Targeting Recommendation Packet.
   - Shows provider status, prompt version used, generation time, and failure state if AI fails.
   - Must not fake output when provider fails.

3. **Review Target Candidates**
   - Shows suggested candidates, target type, linked hierarchy node, source signals, targeting reason, rollout stage, and admin actions.
   - Admin actions: accept, reject, change target type, change rollout stage/order, mark contact data missing, add admin note.

4. **Participant Contact Profiles**
   - Allows editing and completing contact details for accepted/pending candidates.
   - Supports multiple channels and optional preferred channel.
   - Allows manual entry, import/table-based completion, and carry-forward data from Pass 3.

5. **Question-Hint Seeds Preview**
   - Shows document-derived hints that may help Pass 5 later.
   - Makes clear these are not participant-facing questions.
   - Allows admin dismissal or note when a hint is irrelevant.

6. **Prompt Workspace / PromptSpec Surface**
   - Same pattern as Pass 3: structured PromptSpec editor, compiled prompt preview, draft testing, active-vs-draft comparison, explicit promotion, previous active view.
   - Should focus only on Pass 4 targeting/source-signal/question-hint behavior.

7. **Final Targeting Plan Review**
   - Final consolidated review before approval.
   - Shows targets, order, type, contact readiness, source signals, hints, admin notes, and boundary confirmations.

### 16.3 Required API / Action Surfaces

Approved minimal API/action capabilities:

- create or load targeting rollout plan for a case
- generate AI Targeting Recommendation Packet
- save AI packet summary into the plan
- update candidate decision
- update candidate target type
- update rollout stage/order
- update participant contact profile
- import/update contact details from table/file where supported
- carry forward Pass 3 person/contact details into contact profiles
- update or dismiss question-hint seed
- save admin notes
- move plan to under admin review
- approve plan as `approved_ready_for_outreach`
- approve plan as `approved_with_contact_gaps`
- mark plan as `needs_rework`
- reject plan
- read final targeting plan review

### 16.4 AI-Organized Behavior Requirement

Any AI behavior in Pass 4 must be organized behind the Pass 4 PromptSpec and must be visible in the admin surface.

AI may support:

- candidate suggestion
- target type classification
- source-signal interpretation
- external clarification source detection
- rollout order suggestion
- question-hint seed generation
- explanation of recommendation reasoning

AI must not:

- approve the plan
- send outreach
- create sessions
- generate direct participant-facing questions
- validate workflow reality
- silently override admin changes

### 16.5 Usability Simplification Rules

To keep Pass 4 usable:

- use one main TargetingRolloutPlan object, not many records
- show AI output as one Targeting Recommendation Packet
- use simple candidate decisions
- keep contact details editable at any time during Pass 4
- make preferred channel optional
- remove rejected candidates from approved target list
- preserve source signals and hints without turning them into questionnaire logic
- show explicit next action on each screen
- show boundary warnings where the user might confuse planning with outreach execution

---

## 17. Pass 4 Acceptance Proof Targets

Pass 4 can be considered implementation-ready only when the coding agent can prove at minimum:

1. Pass 4 consumes an approved Pass 3 hierarchy snapshot and blocks or warns correctly if the required readiness input is missing.
2. `packages/targeting-rollout` exists and owns Pass 4 planning logic.
3. `TargetingRolloutPlan` contract/schema exists with embedded sections for candidates, contact profiles, source signals, question-hint seeds, rollout order, final state, and boundary confirmations.
4. AI Targeting Recommendation Packet generation works through a provider-backed path, or provider failure is visibly persisted with manual fallback.
5. Pass 4 PromptSpec is visible/editable/testable with compiled preview and draft-vs-active comparison using the same governance pattern as Pass 3.
6. Admin can review candidates and perform the approved candidate actions.
7. Admin can edit Participant Contact Profiles.
8. Contact data can carry forward from Pass 3 where available.
9. Preferred channel is optional and does not automatically block approval.
10. Question-hint seeds are stored as later Pass 5 support hints and are not rendered as participant-facing questions.
11. Final Targeting Plan Review shows all required summary fields and boundary confirmations.
12. Plan can end in approved states: `approved_ready_for_outreach` or `approved_with_contact_gaps`.
13. Pass 4 never sends outreach, creates invitations, creates sessions, collects responses, or performs workflow analysis.
14. Build/typecheck proof passes according to repository rules.

---

## 18. Current Readiness Assessment

Pass 4 planning is ready for coding-agent execution and implementation proof review, but final acceptance depends on resolving the AI provider runtime-env proof issue.

No conceptual Pass 4 blocker remains.

### 18.1 AI Provider Runtime / Env Bootstrap Requirement

Operator clarified that the AI provider key and local environment file exist and already worked in Pass 2 and Pass 3.

Therefore, Pass 4 must not be accepted with `provider_not_configured` as a final caveat if the same repo/runtime should already load the key.

Verification result so far:

- Pass 4 packet generation was patched to use `providerRegistry.getExtractionProvider("google")`, matching the Pass 3 provider registry/config path.
- Pass 4 prompt test route was patched to use the same Google provider registry path.
- Manual fallback and visible provider failure behavior remain intact.
- Runtime diagnostics in the coding-agent command environment reported `GOOGLE_AI_API_KEY` as not visible.

Root issue:

The project needs a standard, non-secret local AI proof/runtime bootstrap convention so every future AI-backed pass loads the same local environment consistently.

Required durable fix:

1. Define the canonical local env file location for admin-web AI proofs.
2. Ensure local proof commands start the Next/API runtime from the correct directory or explicitly load the same env file using a shared loader.
3. Do not commit secrets or `.env.local`.
4. Add/update `.env.example` or documentation with required variable names only.
5. Add a proof command or documented runbook that checks `/api/provider-status` returns `provider_success` before AI-backed pass proof.
6. Re-run Pass 4 AI packet generation after the env bootstrap is fixed.

Pass 4 final closure requirements were satisfied:

- `/api/provider-status` returned `keyPresent: true` and `diagnosticsStatus: provider_success` without printing the key.
- Cross-pass provider regression proof confirmed Pass 2, Pass 3, and Pass 4 all work using the canonical Workflow env method based on `/Users/haitham/development/Workflow/.env.local`.
- Pass 3 works with the canonical Workflow env method, not only with the historical external `AI-Coach-Mastery/.env` workaround.
- Pass 4 AI Targeting Recommendation Packet generation succeeded and persisted a packet.
- Manual fallback and visible provider failure remain preserved.
- No outreach, invitations, sessions, participant responses, or workflow analysis occurred.

Acceptance status:

Pass 4 is accepted based on cross-pass provider regression proof and real Pass 4 Gemini packet generation.

Accepted proof commit:

- `14c32adbcd1156ce6e18490468f866e922745e07`

Final accepted status:

- `pass4_targeting_rollout_accepted`

Acceptance basis:

- Canonical Workflow env method confirmed through `/Users/haitham/development/Workflow/.env.local`.
- `/api/provider-status` returned `provider_success`, `keyPresent: true`, and model `gemini-3.1-pro-preview`.
- Pass 2 provider regression succeeded through Google/Gemini provider.
- Pass 3 provider regression succeeded through the same Workflow `.env.local` method.
- Pass 4 Targeting Recommendation Packet succeeded with real provider execution.
- Pass 4 generated and persisted a packet with 5 candidates, 4 source signals, and 4 question-hint seeds.
- Manual fallback remains available.
- Boundary confirmations remain true: no outreach, no invitations, no participant sessions, no participant responses, and no workflow analysis.
- Build proof passed: `pnpm build:contracts`, `pnpm typecheck`, `pnpm build`.
- Git status was clean.
- No secrets were printed or committed.
- Pass 5 was not started.

Latest env-bootstrap patch:

- Commit: `43c84756da51420e7a8133dbd5616a2d92532c43`
- Changed files:
  - `handoff/CURRENT_STATE.md`
  - `handoff/NEXT_PASS.md`
  - `packages/integrations/src/google-config.ts`
  - `packages/integrations/src/node-builtins.d.ts`

New documented proof convention:

```bash
WORKFLOW_ENV_FILE=/absolute/path/to/ignored.env WORKFLOW_INTAKE_SQLITE_PATH=/tmp/workflow-provider-proof.sqlite pnpm --filter @workflow/admin-web start -H 127.0.0.1 -p 3144
curl -sS http://127.0.0.1:3144/api/provider-status
```

Current result in coding-agent runtime:

- `provider_not_configured`
- `keyPresent: false`
- `GOOGLE_AI_API_KEY`, `GEMINI_API_KEY`, and `GOOGLE_API_KEY` are not visible to that runtime.

Interpretation:

The bootstrap convention is now documented and centrally wired, but real provider success is still not proven. Final Pass 4 closure requires running the provider proof with the actual ignored local env file that contains the Google/Gemini key, without committing or printing secrets.

Cross-pass env-loading inconsistency discovered:

Pass 2 actual env-loading method, recovered from the prior Pass 2 conversation:

- Actual key file used in Pass 2: `/Users/haitham/development/Workflow/.env.local`
- Key variable name used in Pass 2: `GOOGLE_AI_API_KEY`
- Pass 2 loaded it through shell sourcing:

```bash
set -a
source /Users/haitham/development/Workflow/.env.local
set +a
pnpm --filter @workflow/admin-web start -H 127.0.0.1 -p 3113
```

Pass 3 actual env-loading method, recovered from the prior Pass 3 closure conversation:

- Actual key file used in Pass 3: `/Users/haitham/development/AI-Coach-Mastery/.env`
- Pass 3 loaded it through shell sourcing and alias mapping:

```bash
set -a
source /Users/haitham/development/AI-Coach-Mastery/.env
set +a
export GOOGLE_AI_API_KEY="${GOOGLE_AI_API_KEY:-${GEMINI_API_KEY:-${GOOGLE_API_KEY:-}}}"
export GOOGLE_AI_MODEL="${GOOGLE_AI_MODEL:-gemini-3.1-pro-preview}"
export WORKFLOW_INTAKE_SQLITE_PATH=/tmp/workflow-pass3-final-closure.sqlite
pnpm --filter @workflow/admin-web start -H 127.0.0.1 -p 3134
```

Implication:

The provider proof problem is not only a Pass 4 issue. Pass 2 and Pass 3 used different local env-loading sources. Pass 4 exposed a cross-pass reproducibility gap. Before final closure, the project should standardize one canonical env-loading method for AI-backed local proofs.

Approved canonical direction:

Use `/Users/haitham/development/Workflow/.env.local` as the primary Workflow project env file for AI-backed local proofs, because Pass 2 used it directly under the official `GOOGLE_AI_API_KEY` name.

Required correction sequence:

1. First verify the Pass 2 method:

```bash
cd /Users/haitham/development/Workflow
set -a
source /Users/haitham/development/Workflow/.env.local
set +a
pnpm --filter @workflow/admin-web start -H 127.0.0.1 -p 3113
```

Then call `/api/provider-status` and require `provider_success` with `keyPresent: true`.

2. After the Pass 2-style provider proof succeeds, run Pass 4 AI packet generation using the same canonical env-loading method.

3. Re-check or document Pass 3 against the same canonical method. If Pass 3 previously used `/Users/haitham/development/AI-Coach-Mastery/.env`, record that as a historical temporary workaround, not the canonical Workflow proof method.

4. Document the canonical proof process clearly so all future AI-backed passes use the same method.

External env files may be allowed only through an explicit override such as `WORKFLOW_ENV_FILE`, with documented alias mapping into `GOOGLE_AI_API_KEY`, but they must not replace the Workflow project `.env.local` as the primary local proof method.
