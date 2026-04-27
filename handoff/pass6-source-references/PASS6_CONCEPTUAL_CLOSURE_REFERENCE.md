Execution Log:
- File Purpose: Supplemental archive of the Pass 6 conceptual closure / next-pass readiness scope gate reference exported from the planning conversation.
- Source: `/Users/haitham/Downloads/next_pass_readiness_scope_gate_live_reference.md`
- Status: Supplemental archived Pass 6 planning reference
- Authority Level: Supplemental; does not override accepted Pass 6 archive
- Accepted Archive Link: `handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md`
- Last Updated: 2026-04-27

# Next Pass Readiness & Scope Gate — Live Reference

## 1. Current Accepted Baseline

- PASS 5 INTEGRATED AND ARCHIVED.
- Final integrated main commit: `518748da7719b6a62c79a25bc227b1685701a84f`.
- Source branch: `codex/pass5-block0-1-contracts`.
- Final source branch commit: `88bb9ab094d536b119095d919d38cf2b73b0014c`.
- Pass 5 built the participant-session layer for narrative-first clarification and evidence governance.
- Pass 5 outputs participant-level evidence, extraction drafts, clarification outcomes, boundary signals, disputes, defects, unmapped content, next actions, and Pass 6 handoff candidates.
- Pass 5 did not implement Pass 6 synthesis/evaluation, common-path formation, final workflow reconstruction, package generation, WhatsApp API, or automation execution.
- No next implementation pass begins automatically.

## 2. Resource Review Checklist

| Resource | Review Status | Notes |
|---|---:|---|
| `PASS5_FINAL_ARCHIVE_REFERENCE.md` | Pending review | Highest authority for final post-Pass-5 state. |
| `CURRENT_STATE.md` | Pending review | Must be checked against Pass 5 archive for stale references. |
| `NEXT_PASS.md` | Pending review | Must confirm whether next pass is defined or undefined. |
| `PROGRAM_MASTER_PLAN.md` | Pending review | Directional program context only unless consistent with Pass 5 archive. |
| `01_Locked_Main_Reference.md` | Pending review | Governing product logic. |
| `02_Execution_Logic_Specification_FULL.md` | Pending review | Governing execution logic. |
| `03_Implementation_Handoff_Plan_Coding-Agent-First.md` | Pending review | Coding-agent boundary and repository/pass discipline. |
| `pass_2_intake_context_live_reference` | Pending review | Historical context only. |
| `hierarchy_intake_approval_build_spec` | Pending review | Historical Pass 3 context only. |
| `pass_4_participant_targeting_rollout_planning_build_spec` | Pending review | Historical Pass 4 context only. |

## 3. Authority Order

1. `PASS5_FINAL_ARCHIVE_REFERENCE.md` for the final state after Pass 5.
2. `CURRENT_STATE.md` and `NEXT_PASS.md` after archive, only if consistent with Pass 5 archive.
3. `01_Locked_Main_Reference.md` and `02_Execution_Logic_Specification_FULL.md` for governing logic.
4. `PROGRAM_MASTER_PLAN.md` for broader future direction.
5. Pass 2 / Pass 3 / Pass 4 files as historical execution context and inputs, not current-state authority.

## 4. What Pass 5 Delivered

- Participant-session layer.
- Web and Telegram participant intake.
- Raw evidence preservation.
- Transcript trust gate.
- First-pass participant-level extraction.
- JSON/schema/evidence governance.
- One-question-at-a-time clarification queue.
- Participant answer recheck.
- Boundary and escalation signals.
- Admin Session Command Dashboard.
- Stage-aware Admin Assistant / Section Copilot.
- Pass 6 handoff candidates as candidates only.
- Full live proof and complex scenario proof.

## 5. What Pass 5 Did NOT Deliver

- Pass 6 synthesis/evaluation.
- Common-path formation.
- Final workflow reconstruction.
- Package generation.
- WhatsApp API.
- Automation execution design.
- Productionization.

## 6. Candidate Next Pass / Scope Options

Corrected interpretation after operator clarification:

There is no conceptual contradiction between the earlier Pass 1–9 skeleton and the current execution path. The earlier skeleton is the broad product build map. The current Pass 1–5 sequence is the current implementation path for the analytical core / “mind” of the system. Therefore, the next planning target is Pass 6 in the skeleton sense:

**Pass 6 — Synthesis + Evaluation + Initial Package**

Adopted execution decision:

Pass 6 remains one official skeleton pass, but it will be planned and executed internally as three governed sub-slices:

### Pass 6A — Session-to-Synthesis Seam + Synthesis Record

Purpose:

- consume approved Pass 5 participant-session outputs
- normalize eligible participant-level evidence into synthesis-ready inputs
- define and persist case-level synthesis records
- preserve unresolved items, boundary signals, defects, disputes, and unmapped content
- produce common-path / difference-block structure without evaluation or package generation

Must not:

- evaluate readiness
- generate an Initial Package
- create review issues as Pass 7 objects
- treat synthesis as final workflow truth

### Pass 6B — Evaluation + Seven-Condition Interpretation

Purpose:

- evaluate synthesized workflow understanding using the seven-condition model
- distinguish workflow documentability from automation-supportiveness
- use AI-interpreted / admin-routed / rule-guarded evaluation
- determine whether the case can move toward Initial Package, needs more clarification, or needs review routing

Must not:

- collapse any false/weak condition into automatic failure
- treat automation weakness as workflow incompleteness
- bypass admin decision authority on meaningful ambiguity

### Pass 6C — Initial Package Generation + Preview

Purpose:

- generate Initial Workflow Package only when 6B allows it
- keep outward package content separate from admin/internal readiness reasoning
- expose initial package preview in UI
- preserve residual gaps, review recommendations, and later review/package boundaries

Must not:

- generate Final Package
- release anything
- implement Pass 7 discussion flow
- create target-state workflow as final output unless explicitly scoped later

Skeleton definition:

- Build:
  - `synthesis-evaluation`
  - session-to-synthesis seam
  - evaluation outputs
  - initial package generation in `packages-output`
- Expose in UI:
  - synthesis summary view
  - evaluation/readiness view
  - initial package preview
- Validate:
  - seam contracts
  - seven-condition evaluation logic
  - initial package rendering

Pass 6 should be examined as the bridge between:

- Pass 5 outputs: participant-level evidence, extraction drafts, clarification outcomes, boundary signals, unresolved items, disputes/defects/unmapped content, next actions, and Pass 6 handoff candidates.
- Pass 7 inputs: issues requiring review, scoped issue briefs, linked evidence views, discussion threads, and final admin actions.

Working interpretation:

Pass 6 is the first cross-participant reasoning layer. It should not merely store session outputs. It should synthesize participant-level evidence into a case-level workflow understanding, evaluate whether the workflow is sufficiently complete under the seven-condition model, and produce an Initial Workflow Package when justified.

## 7. Gap Checklist

| Gap ID | Gap | Type | Criticality | Current Status | Why It Matters | Blocking? |
|---|---|---|---:|---|---|---|
| Gap ID | Gap | Type | Criticality | Current Status | Why It Matters | Blocking? |
|---|---|---|---:|---|---|---|
| G6-001 | Whether Pass 6 should execute as one blast or internal sub-slices. | Governance / Operational | 5 | Resolved — Pass 6 will be executed as 6A/6B/6C internally. | Pass 6 is too large to safely implement as one uncontrolled coding pass. | No |
| G6-002 | Exact Session-to-Synthesis input bundle from Pass 5 to 6A. | Contract / Operational | 5 | Open | 6A cannot start until we know exactly which Pass 5 records are eligible inputs and how they are normalized. | Yes |
| G6-003 | Eligibility rules for a participant session to enter synthesis. | Governance / Operational | 5 | Open | Prevents untrusted transcripts, incomplete extraction, unresolved defects, or candidate-only data from being promoted into synthesis. | Yes |
| G6-004 | Definition of 6A synthesis outputs and difference-block model. | Contract / Documentation | 4 | Open | Defines what 6A produces and what it must preserve for 6B and 7. | Likely |
| G6-005 | Evaluation model for 6B. | Governance | 5 | Partially resolved by prior decisions; needs implementation-ready wording. | Evaluation must be AI-interpreted, admin-routed, rule-guarded, and must separate workflow validity from automation-supportiveness. | Likely |
| G6-006 | Initial Package eligibility and outward/admin separation for 6C. | Output / Governance | 5 | Open | Prevents 6C from turning into Final Package or leaking internal checklist logic into client-facing output. | Likely |
| G6-007 | Pass 6 to Pass 7 review routing seam. | Operational | 4 | Open | Defines which unresolved issues become Pass 7 review candidates rather than blocking or disappearing. | Likely |
| G6-008 | Acceptance proof stack for 6A/6B/6C. | Documentation / Operational | 4 | Open | Required before any coding-agent prompt can safely close the pass. | Likely |
| G6-009 | Pass 6 PromptSpec architecture. | Prompt Governance | 5 | Resolved — use multiple bounded PromptSpecs: Synthesis, Difference Interpretation, Evaluation, Initial Package Drafting, Admin Explanation. | Prevents one mega-prompt from mixing synthesis, evaluation, document comparison, package drafting, and admin explanation. | No |
| G6-010 | Layer-aware difference interpretation and truth-lens classification. | Conceptual / Operational | 5 | Resolved as design direction; needs contract fields in 6A input bundle. | Participant evidence must be interpreted according to layer and evidence type: execution, oversight, approval/control, policy/intent, handoff/dependency, document signal. | Likely |
| G6-011 | Pass 6 Analysis Copilot architecture. | Prompt Governance / UX | 4 | Resolved — add separate `Pass6AnalysisCopilotPromptSpec`. | Pass 6 needs conversational admin discussion across 6A/6B/6C, not only bounded one-shot capability prompts. | No |
| G6-012 | Pass 6A first internal artifact and accepted-output sorting rule. | Contract / Operational | 5 | Resolved — adopt `SynthesisInputBundle` conceptually as accepted Pass 5 output sorting, not Pass 5 revalidation. | Pass 6A needs a normalized way to organize accepted Pass 5 outputs into analysis material, boundary/role-limit material, gap/risk/no-drop material, and document/source signal material before synthesis. | No |
| G6-013 | Pass 6 block-based construction architecture. | Architecture / Operational | 5 | Resolved — Block 0–14 map approved as planning baseline. | Pass 6 is too large for one coding prompt and must be built in isolated, proofable blocks to support coding agents and future repair without damaging unrelated sections. | No |

## 7A. Pass 6 Design Notes Pending Approval

### A. Document Classification / Evaluation Carry-Forward

Document intake, role suggestion, and source classification started earlier in the system, primarily in the intake/context stage and later source-to-hierarchy/source-signal stages.

Pass 6 should not redo source classification from zero.

Pass 6 should consume prior document/source outputs as contextual and evidentiary inputs, including:

- source role / source classification
- source scope
- source-to-hierarchy/source-to-role signals
- document-derived question hints
- reference/document signals from SOP, SLA, policy, KPI, role documents, procedures, or templates
- admin decisions or overrides related to document/source meaning

Pass 6 may add a synthesis/evaluation-layer interpretation of those documents, such as:

- whether a document claim matches participant reality
- whether the document supports a workflow step, decision rule, exception, handoff, or control
- whether the document creates a gap, contradiction, or question for review
- whether the document is suitable enough to support initial package wording

Boundary:

- Pass 6 must not treat document claims as operational truth by default.
- Pass 6 must not silently modify earlier source classification decisions.
- Pass 6 may flag that a prior classification needs admin review if synthesis exposes a material mismatch.

### B. Pass 6 Prompt System / Prompt Workspace

Adopted decision:

Pass 6 will use multiple bounded PromptSpecs by capability, not one uncontrolled mega-prompt.

Minimum Pass 6 PromptSpecs:

1. **Synthesis PromptSpec**
   - Purpose: build case-level workflow understanding from eligible participant/session evidence.
   - Must not: evaluate readiness, draft packages, or decide final truth without evidence.

2. **Difference Interpretation PromptSpec**
   - Purpose: interpret participant differences as workflow-reconstruction signals.
   - Must distinguish: perspective difference, role-boundary difference, sequence variation, real contradiction, document-vs-reality mismatch, unresolved evidence gap.
   - Must not: evaluate employees or frame differences as performance issues.

3. **Evaluation PromptSpec**
   - Purpose: interpret the synthesized workflow against the seven-condition model.
   - Must preserve: AI-interpreted / admin-routed / rule-guarded evaluation.
   - Must distinguish workflow documentability from automation-supportiveness.

4. **Initial Package Drafting PromptSpec**
   - Purpose: generate Initial Workflow Package content only after evaluation allows it.
   - Must not: generate Final Package, release output, or hide unresolved gaps.

5. **Admin Explanation PromptSpec**
   - Purpose: explain synthesis/evaluation/package reasoning to the admin in a grounded, read-only, evidence-linked way.
   - Must not: write data, change state, approve transitions, or perform Pass 7 issue actions.

Each PromptSpec must support:

- structured sections
- compiled prompt preview
- draft / active / previous lifecycle
- draft testing
- active-vs-draft comparison
- explicit promotion to active
- rollback reference
- admin-visible test results
- provider failure state
- source/contract traceability

Boundary:

- PromptSpecs may interpret, draft, explain, and recommend.
- PromptSpecs must not own state transitions, release decisions, review-state actions, package eligibility rules, or deterministic gates.
- Prompt behavior must remain traceable to Pass 6 contracts and approved scope.

### C. Participant Difference / Conflict Meaning

Participant differences are not primarily for grading employees or proving who is right/wrong.

In Pass 6, differences should be used to reconstruct the best available real workflow.

This means:

- different step order may reflect different role perspectives, not necessarily contradiction
- different descriptions may reveal handoffs, hidden branches, exception paths, or partial visibility
- conflicts should help identify the most plausible workflow reality, not become employee evaluation
- unresolved contradictions should be preserved and routed, not flattened into false certainty
- the goal is current operational truth, not participant scoring

Pass 6 should distinguish at minimum:

- perspective difference
- role-boundary difference
- sequence variation
- real contradiction
- document-vs-reality mismatch
- unresolved evidence gap

### D. Layer-Aware Difference Interpretation

Adopted design direction:

Pass 6 must interpret participant differences through the approved hierarchy / role layer context, not as flat employee-vs-employee disagreement.

Reason:

Different hierarchy layers naturally see different parts of the workflow. A frontline participant may know actual execution steps and exceptions. A supervisor may know review/approval and escalation behavior. A manager/director/executive may know policy intent, ownership, targets, governance, or reporting expectations, but may be farther from day-to-day execution reality.

Therefore, Pass 6 should carry hierarchy metadata into the input bundle and difference interpretation, including where available:

- hierarchy node ID
- role label
- grouping/layer category
- level hint
- reporting relationship
- in-use-case scope
- participant target type from Pass 4 where available
- source-to-hierarchy signals or document links

Difference interpretation should distinguish:

1. **Same-layer peer variation**
   - Difference between participants at the same or similar layer.
   - May indicate local variation, exception path, inconsistent execution, or incomplete capture.

2. **Frontline vs supervisor difference**
   - May reveal execution-vs-oversight mismatch, missing approval detail, or practical workaround unknown to supervisors.

3. **Frontline vs manager/director/executive difference**
   - May reveal policy-intent vs operational-reality mismatch, target-state aspiration, outdated understanding, or reporting abstraction.

4. **Supervisor vs manager/director difference**
   - May reveal escalation/authority ambiguity, KPI interpretation mismatch, or control-layer inconsistency.

5. **Document vs layer-specific reality mismatch**
   - A document may match the manager’s intended process but not frontline practice.
   - Or it may match frontline execution but be unknown to higher layers.

6. **Cross-functional/external-interface difference**
   - May reveal dependency, handoff boundary, upstream/downstream ownership, or external clarification need.

Layer-aware interpretation must not automatically rank higher layers as more correct.

Adopted truth-lens rule:

Every participant evidence item entering Pass 6A should carry a truth-lens classification based on role/layer context.

Minimum truth-lens categories:

- `execution_evidence` — usually strongest from frontline/operational participants for actual steps, tools, exceptions, and workarounds.
- `oversight_evidence` — usually strongest from supervisors/senior roles for review behavior, handoffs, escalation, and quality checks.
- `approval_control_evidence` — usually strongest from managers/control roles for approvals, thresholds, governance, and authority limits.
- `policy_intent_evidence` — usually strongest from directors/executives/policy owners for intended process, accountability model, and governance intent.
- `handoff_dependency_evidence` — usually from adjacent teams, external interfaces, or roles touching upstream/downstream dependencies.
- `document_signal_evidence` — document-derived source signals that may support, conflict with, or require validation against participant reality.

Working rule:

- Lower/frontline layers often carry stronger evidence for actual execution.
- Supervisor/manager layers may carry stronger evidence for approvals, escalation, governance, targets, and intended controls.
- Director/executive layers may carry stronger evidence for policy intent, ownership model, business goal, and governance expectations.
- The most reliable synthesis comes from matching each layer to the type of truth it is most likely to know.

Boundary:

- Pass 6 must not turn layer differences into employee performance evaluation.
- Pass 6 must not assume hierarchy rank equals truth rank.
- Pass 6 must preserve uncertainty when the evidence cannot resolve the difference.
- Pass 6 may route unresolved layer differences to Pass 7 or to targeted follow-up if material.

### E. Pass 6 Analysis Copilot / Conversational Assistant

Adopted decision:

Pass 6 will include a dedicated PromptSpec named:

**`Pass6AnalysisCopilotPromptSpec`**

This Copilot is separate from `Admin Explanation PromptSpec`.

Purpose:

The Pass 6 Copilot is a conversational admin assistant for discussing synthesis, differences, evaluation reasoning, initial package readiness, unresolved gaps, and routing options across 6A / 6B / 6C.

It should behave like a stage-aware analytical companion for the admin, not as a one-shot Q&A endpoint.

It should support conversation such as:

- “Explain why this workflow is not ready for Initial Package.”
- “Where exactly do frontline and manager views differ?”
- “Which gap is blocking and which is only a warning?”
- “What evidence supports this synthesized step?”
- “Is this contradiction real, or just role perspective?”
- “Which questions should go back to participants, management, or Pass 7 review?”
- “What would change if we accept this document as weak reference only?”

Relationship to existing PromptSpecs:

- The five capability PromptSpecs perform bounded work: synthesis, difference interpretation, evaluation, package drafting, and admin explanation.
- `Pass6AnalysisCopilotPromptSpec` discusses and navigates the results of those capabilities with the admin.
- The Copilot may reference outputs from those capabilities but must not silently regenerate or overwrite them.
- The Copilot is a conversational analysis layer, not an execution authority.

Required boundaries:

- DB-grounded / evidence-linked where needed.
- Read-only by default.
- No autonomous writes.
- No hidden shadow state.
- No participant-facing sends.
- No Pass 7 issue actions.
- No package approval.
- No release action.
- No final workflow truth claim without evidence.
- Can recommend routed actions but cannot execute them without explicit admin action.

Prompt governance requirements:

`Pass6AnalysisCopilotPromptSpec` must support:

- structured sections
- compiled prompt preview
- draft / active / previous lifecycle
- draft testing
- active-vs-draft comparison
- explicit promotion to active
- rollback reference
- admin-visible test results
- provider failure state
- source/contract traceability

### F. Pass 6A Synthesis Input Bundle

Adopted decision:

Pass 6A will produce the first internal artifact named:

**`SynthesisInputBundle`**

Naming decision:

Use `SynthesisInputBundle` as the code/contract artifact name because it fits the implementation layer and the Pass 6 skeleton. In admin-facing language, explain it simply as:

**Accepted Pass 5 outputs prepared for synthesis**

Do not reopen naming unless implementation proves the term causes real ambiguity.

Purpose:

`SynthesisInputBundle` is the normalized input artifact that prepares Pass 5 participant-level outputs for Pass 6 cross-participant reasoning.

It is not synthesis yet.
It is not evaluation yet.
It is not an Initial Package yet.

It answers:

- What participant/session evidence is eligible for synthesis?
- What context, hierarchy, and document signals travel with that evidence?
- What must be carried as unresolved, risky, disputed, defective, or non-trusted instead of being promoted into workflow truth?

Minimum bundle contents per participant/session:

1. **Participant/session identity**
   - case ID
   - participant ID
   - session ID
   - target candidate ID when available
   - channel/source path when relevant

2. **Hierarchy and layer metadata**
   - hierarchy node ID
   - role label
   - grouping/layer category
   - level hint
   - reporting relationship where available
   - in-use-case scope
   - participant target type from Pass 4 where available

3. **Trusted evidence only**
   - approved transcript evidence
   - trusted text evidence
   - trusted clarification-answer evidence
   - eligible admin/manual evidence when explicitly approved

4. **First-pass extraction outputs**
   - extracted steps
   - sequence map
   - decision points
   - exceptions
   - handoffs
   - systems/tools
   - controls
   - dependencies
   - extracted unknowns
   - evidence anchors

5. **Clarification outcomes**
   - asked clarification candidates
   - participant answers
   - answer recheck results
   - clarified vs still unresolved status
   - admin-added clarification outcomes when available

6. **Boundary signals and non-ownership signals**
   - knowledge gap
   - ownership boundary
   - execution boundary
   - visibility limitation
   - upstream boundary
   - downstream boundary
   - cross-team boundary
   - outcome-only knowledge
   - tacit-only practice

7. **Unresolved / risk / no-drop preservation items**
   - unresolved items
   - unmapped content
   - extraction defects
   - evidence disputes
   - low-confidence items
   - ineligible evidence references
   - items requiring admin review

8. **Document and source signals**
   - source role / classification carry-forward
   - source-to-hierarchy signals
   - source-to-role or source-to-node links
   - document-derived question hints
   - SOP / SLA / policy / KPI / role-document signals
   - admin decisions or overrides on source meaning

9. **Truth-lens classification**
   - `execution_evidence`
   - `oversight_evidence`
   - `approval_control_evidence`
   - `policy_intent_evidence`
   - `handoff_dependency_evidence`
   - `document_signal_evidence`

10. **Evidence Eligibility Gate**

Adopted decision:

Pass 6A must include an **Evidence Eligibility Gate** before any evidence can support synthesis.

This gate is separate from the seven-condition workflow evaluation model.

- Evidence Eligibility Gate belongs to **6A**.
- Seven-condition workflow evaluation belongs to **6B**.

The Evidence Eligibility Gate asks:

- Is this participant/session evidence trusted enough to enter synthesis?
- Is the transcript or text approved/trusted?
- Is first-pass extraction present?
- Are evidence anchors preserved?
- Is the item pending admin review?
- Should this item support a synthesis statement or be carried only as open/risk material?

Eligibility status values:

- `eligible_for_synthesis`
- `eligible_with_warnings`
- `not_eligible_untrusted_evidence`
- `not_eligible_missing_extraction`
- `not_eligible_pending_admin_review`
- `carry_as_open_item_only`

Hard rule:

Only trusted/eligible evidence may support synthesis statements.

Non-trusted, disputed, defective, unmapped, or incomplete material must not be promoted into workflow truth. It may be carried as a risk, open item, dispute, defect, unresolved question, or review candidate.

Boundary:

`SynthesisInputBundle` does not create common path.
`SynthesisInputBundle` does not evaluate readiness.
`SynthesisInputBundle` does not apply the seven workflow completeness conditions.
`SynthesisInputBundle` does not generate Initial Package.
`SynthesisInputBundle` does not create Pass 7 issue records.

### F.1 Separation Between 6A Evidence Eligibility and 6B Seven-Condition Evaluation

Adopted distinction:

6A and 6B answer different questions.

6A / Evidence Eligibility asks:

- Is this evidence usable for synthesis?
- Is it trusted, anchored, extracted, and review-cleared enough?
- Should it be used as synthesis support or only carried as an open/risk item?

6B / Seven-Condition Evaluation asks:

- Is the synthesized workflow sufficiently complete?
- Are the core workflow sequence, dependencies, decisions, handoffs, approvals, and boundaries clear enough?
- Does any unresolved issue materially break essential workflow completion?
- Is the workflow documentable, even if not automation-ready?

Rule:

Evidence that fails 6A must not be used to answer 6B workflow completeness conditions as if it were trusted truth.

### F.2 No Pass 5 Revalidation / No Rework Rule

Adopted clarification:

Pass 6A must not redo Pass 5.

Pass 5 is accepted and archived. It already performed:

- raw evidence capture
- transcript trust gate
- first-pass extraction
- JSON/schema/evidence governance
- evidence anchors
- clarification queue
- answer recheck
- boundary signals
- no-drop preservation
- Pass 6 handoff candidates

Therefore, Pass 6A must not re-extract, re-validate, re-ask, or re-approve what Pass 5 already completed.

Correct 6A role:

- consume completed Pass 5 outputs as **accepted Pass 5 outputs**
- read their existing statuses and flags
- group them for cross-participant synthesis
- preserve the accepted/open/risk/candidate distinction already produced by Pass 5
- attach hierarchy/layer and truth-lens context needed for cross-participant interpretation
- avoid promoting any Pass 5 open/risk/candidate-only item into workflow truth

Terminology rule:

Use **accepted Pass 5 output** instead of “trusted evidence” when discussing 6A conceptually.

Meaning:

- “accepted” does not mean the employee’s statement is factually proven true.
- “accepted” means the item came through the completed Pass 5 pipeline and carries its Pass 5 status, anchors, extraction output, clarification result, boundary signal, defect/dispute flag, open-item state, or handoff-candidate state.
- Pass 6A trusts Pass 5’s processing status; it does not certify operational truth.

Simplified working language:

**Pass 6A = putting accepted Pass 5 outputs into the right analysis folders before cross-participant synthesis starts.**

The analysis folders are:

1. **Analysis material**
   - accepted extraction outputs
   - accepted clarification outcomes
   - participant-level steps, decisions, exceptions, handoffs, systems, controls, and dependencies

2. **Boundary / role-limit material**
   - knowledge gaps
   - ownership boundaries
   - execution boundaries
   - visibility limitations
   - upstream/downstream boundaries
   - cross-team boundaries
   - outcome-only knowledge
   - tacit-only practice

3. **Gap / risk / no-drop material**
   - unresolved items
   - unmapped content
   - defects
   - disputes
   - low-confidence items
   - candidate-only items

4. **Document / source signal material**
   - SOP / SLA / policy / KPI / role-document hints
   - source-to-role or source-to-hierarchy signals
   - document claims to compare later against participant reality
   - admin source decisions or overrides

Hard boundary:

If Pass 5 says something is accepted/processed and not flagged as a defect, dispute, unresolved, unmapped, or candidate-only item, 6A does not challenge it unless there is a detected defect or explicit admin correction.

If Pass 5 says something is unresolved, disputed, unmapped, defective, or candidate-only, 6A carries it forward in that state instead of upgrading it into workflow truth.

Technical note:

The term “trusted” may still appear at code/contract level only where it reflects an existing Pass 5 status, such as approved transcript or trusted text artifact. Conceptually, the governing phrase for Pass 6A is **accepted Pass 5 output**.

### F.3 Pass 6A Completion Rule

Adopted simplified rule:

**6A وظيفتها تجهيز وفرز مخرجات Pass 5 للتحليل الجماعي، ولا تبني workflow مشترك، ولا تقيّم اكتمال workflow، ولا تنتج Initial Package.**

Plain meaning:

Pass 6A ends when accepted Pass 5 outputs are prepared for later cross-participant analysis.

Pass 6A does not analyze the full workflow yet.
It only organizes the material so later synthesis can start safely.

### F.3.1 Practical 6A Completion Signs

6A is complete when:

1. Pass 5 outputs were collected.
   - conversations
   - extraction outputs
   - clarification answers
   - boundary signals
   - open gaps
   - document/source hints

2. The outputs were sorted into the four approved folders:
   - analysis material
   - boundary / role-limit material
   - gap / risk / no-drop material
   - document / source signal material

3. The outputs were linked to role/layer context where available.
   - frontline
   - senior individual contributor
   - supervisor
   - manager
   - director / executive
   - external / cross-functional role

4. Open or disputed items kept their status.
   - unresolved stays unresolved
   - dispute stays dispute
   - defect stays defect
   - unmapped content stays no-drop/open material
   - Pass 6 handoff candidate stays candidate, not synthesis result

5. Document/source signals remained signals only.
   - SOP / SLA / policy / KPI / role-document claims are carried forward for later comparison.
   - They are not treated as operational truth.

6. A reviewable `SynthesisInputBundle` exists.
   - In admin-facing language: accepted Pass 5 outputs prepared for synthesis.
   - It is inspectable through admin UI or proof output.
   - It links back to source Pass 5 sessions and related context.

7. 6A stops before any of the following:
   - common-path synthesis
   - final workflow reconstruction
   - seven-condition workflow evaluation
   - readiness decision
   - Initial Package generation
   - Final Package generation
   - Pass 7 issue record creation
   - participant re-contact / sending
   - autonomous Copilot write action

### F.3.2 6A Closure Sentence

Use this as the governing closure sentence:

**6A تنتهي عندما نجهز مخرجات Pass 5 للتحليل، وليس عندما نحللها.**

### F.3.3 Proof Meaning

The later coding proof should show only that:

- Pass 5 outputs were collected.
- The four folders were produced.
- role/layer context was attached where available.
- open/risk/candidate items were not upgraded to workflow truth.
- document signals were not treated as truth.
- `SynthesisInputBundle` is visible/reviewable.
- no synthesis/evaluation/package/Pass 7 behavior was started.

### G. Pass 6 Technical Decomposition Rule — Deferred Until Concept Is Stable

Corrected planning decision:

The block-based construction principle remains valid, but the detailed Block 0–14 map is **not the active planning focus yet**.

Reason:

The operator correctly identified that Pass 6 must first be understood conceptually as a complete stage before it is divided into technical implementation blocks. Technical block design should follow the conceptual design, not lead it.

Therefore, the current active priority is:

1. Clarify the full conceptual role of Pass 6.
2. Define 6A / 6B / 6C in plain operational language.
3. Define what enters each sub-stage and what exits it.
4. Define the analysis tools and reasoning lenses used in 6B.
5. Define what 6C produces and what it must not produce.
6. Only after that, return to technical block decomposition for Codex/Claude implementation.

The later technical decomposition must still optimize for:

- coding-agent comprehension
- local repair
- small proofable commits
- contract-first implementation
- clear admin visibility per capability
- no hidden capability
- no broad rewrites
- no god service
- clear boundaries between 6A / 6B / 6C

Current rule:

Do not refine implementation blocks further until the conceptual design of 6A / 6B / 6C is stable.

The earlier Block 0–14 map below is parked as an early technical draft. It is not final and must be revisited after the full conceptual design of Pass 6 is complete.

### G.1 Parked Draft Technical Block Map

Approved planning baseline for Pass 6 build blocks:

#### Block 0 — Pass 6 Spec Finalization / Readiness Gate

Purpose:

- finalize Pass 6 block map
- freeze 6A/6B/6C boundaries
- confirm package ownership
- confirm no coding begins before scope is approved

Output:

- implementation-ready Pass 6 build spec
- approved stop conditions
- approved proof stack

#### Block 1 — Core Contracts and Seam Types

Purpose:

- add shared contracts for `SynthesisInputBundle`, `SessionForSynthesis`, eligibility status, truth-lens classification, difference categories, and open/risk item carry-forward

Touches:

- `packages/contracts`

Must not:

- implement synthesis logic
- call providers
- create package output

#### Block 2 — Persistence and Repository Layer

Purpose:

- persist Synthesis Input Bundles and later Pass 6 records durably

Touches:

- `packages/persistence`

Must not:

- hide business logic in persistence

#### Block 3 — Synthesis Input Bundle Builder

Purpose:

- consume Pass 5 session outputs and produce `SynthesisInputBundle`
- enforce eligibility states
- preserve open/risk items
- attach hierarchy/layer metadata and truth-lens classifications

Touches:

- `packages/synthesis-evaluation`
- `packages/persistence`
- `packages/contracts`

Must not:

- create common path
- evaluate workflow readiness
- generate package output

#### Block 4 — Admin Synthesis Input Review Surface

Purpose:

- expose bundles, eligibility status, trusted evidence, warnings, and carried open/risk items in admin UI

Touches:

- `apps/admin-web`

Must not:

- create hidden synthesis actions
- allow UI-only state

#### Block 5 — Pass 6 PromptSpec Registry Foundation

Purpose:

- create/manage Pass 6 PromptSpecs:
  - Synthesis
  - Difference Interpretation
  - Evaluation
  - Initial Package Drafting
  - Admin Explanation
  - Pass6AnalysisCopilot

Touches:

- `packages/prompts`
- `apps/admin-web`

Must not:

- run synthesis/evaluation yet unless explicitly scoped in a later block

#### Block 6 — Synthesis Record and Common-Path Formation

Purpose:

- generate/persist first case-level synthesis record
- build common path from eligible evidence
- preserve difference blocks and unresolved layer/document mismatches

Touches:

- `packages/synthesis-evaluation`
- provider job support as needed

Must not:

- evaluate readiness
- generate Initial Package

#### Block 7 — Difference Interpretation Engine

Purpose:

- classify participant differences using layer-aware and truth-lens logic
- distinguish same-layer variation, role-boundary difference, sequence variation, real contradiction, document-vs-reality mismatch, unresolved evidence gap

Touches:

- `packages/synthesis-evaluation`
- relevant PromptSpec/provider path

Must not:

- rank employee performance
- assume hierarchy rank equals truth rank

#### Block 8 — Evaluation Engine / Seven-Condition Model

Purpose:

- evaluate synthesized workflow under the seven-condition model
- preserve workflow validity vs automation-supportiveness distinction
- produce readiness decision / evaluation result

Touches:

- `packages/synthesis-evaluation`
- `packages/contracts`

Must not:

- collapse every weak condition into automatic failure
- generate Initial Package directly

#### Block 9 — Evaluation Admin Review Surface

Purpose:

- expose evaluation/readiness, blocking vs warning issues, evidence links, and recommended route

Touches:

- `apps/admin-web`

Must not:

- perform Pass 7 issue discussion
- approve package/release

#### Block 10 — Initial Package Input and Generation

Purpose:

- generate Initial Package only from allowed evaluation outcome
- preserve outward/admin separation
- carry residual gaps transparently

Touches:

- `packages/packages-output`
- `packages/synthesis-evaluation`
- `packages/contracts`

Must not:

- generate Final Package
- perform release

#### Block 11 — Initial Package Preview Surface

Purpose:

- expose Initial Package preview with evidence/residual gap visibility

Touches:

- `apps/admin-web`

Must not:

- create final package/release controls

#### Block 12 — Pass 6 Analysis Copilot

Purpose:

- implement `Pass6AnalysisCopilotPromptSpec` as conversational, DB-grounded, read-only assistant across 6A/6B/6C

Touches:

- `packages/prompts`
- `packages/synthesis-evaluation`
- `apps/admin-web`

Must not:

- write state autonomously
- execute Pass 7 actions
- approve package/release

#### Block 13 — Pass 6 → Pass 7 Review Routing Candidates

Purpose:

- create review-routing candidates from unresolved issues, real contradictions, blocking gaps, or admin-routed decisions

Touches:

- `packages/synthesis-evaluation`
- seam toward `packages/review-issues`

Must not:

- implement Pass 7 issue discussion mechanics

#### Block 14 — Full Pass 6 Live Proof and Archive Closure

Purpose:

- prove complete Pass 6 behavior end-to-end
- validate contracts, provider-backed paths/failure visibility, admin surfaces, no forbidden expansion, typecheck/build
- update handoff/current-state files after acceptance

Must not:

- start Pass 7 implementation

### G.2 Block Rule

Each block must state:

- what it builds
- what files/packages it may touch
- what it must not do
- what proof closes it
- what remains deferred

Each block must leave the system more inspectable from admin UI or through proof scripts.

No block may introduce hidden capability with no inspection path unless it is a tiny internal dependency.

### H. Block 1 Contract Language — Simplified `SynthesisInputBundle`

Status:

Approved direction; simplified contract language for Block 1 preparation. Not yet a coding prompt.

Purpose:

Block 1 should create the minimal contracts needed for Pass 6A to prepare accepted Pass 5 outputs for later synthesis.

The contract must stay simple. It should not make Pass 6A look like it is re-checking Pass 5.

Admin-facing meaning:

**Accepted Pass 5 outputs prepared for synthesis.**

Code/contract name:

`SynthesisInputBundle`

### H.1 Main Contract

`SynthesisInputBundle` should contain:

1. **Bundle identity**
   - `bundleId`
   - `caseId`
   - `createdAt`
   - `sourcePass5SessionIds`

2. **Analysis material**
   - accepted extracted steps
   - accepted decision points
   - accepted exceptions
   - accepted handoffs
   - accepted systems/tools
   - accepted controls/dependencies
   - accepted clarification outcomes

3. **Boundary / role-limit material**
   - knowledge gaps
   - ownership boundaries
   - execution boundaries
   - visibility limitations
   - upstream/downstream boundaries
   - cross-team boundaries
   - outcome-only knowledge
   - tacit-only practice

4. **Gap / risk / no-drop material**
   - unresolved items
   - unmapped content
   - extraction defects
   - evidence disputes
   - low-confidence items
   - Pass 6 handoff candidates

5. **Document / source signal material**
   - SOP signals
   - SLA signals
   - policy signals
   - KPI signals
   - role-document signals
   - source-to-role signals
   - source-to-hierarchy signals
   - document claims to compare later

6. **Role/layer context**
   - participant ID
   - session ID
   - role label when available
   - hierarchy node when available
   - layer or level hint when available
   - in-use-case scope when available

7. **Truth-lens context**
   - execution evidence
   - oversight evidence
   - approval/control evidence
   - policy/intent evidence
   - handoff/dependency evidence
   - document-signal evidence

8. **Preparation summary**
   - how many sessions were consumed
   - how many items went into each folder
   - whether any open/risk items exist
   - whether any admin review is recommended before synthesis

### H.2 Minimal Supporting Types

Block 1 should define only the types needed to represent the four folders and context.

Suggested minimal types:

- `SynthesisInputBundle`
- `SynthesisAnalysisMaterial`
- `SynthesisBoundaryMaterial`
- `SynthesisGapRiskMaterial`
- `SynthesisDocumentSignalMaterial`
- `SynthesisRoleLayerContext`
- `TruthLensType`
- `SynthesisPreparationSummary`

### H.3 Approved Folder Model

The four folder names are conceptually approved:

1. `analysis_material`
2. `boundary_role_limit_material`
3. `gap_risk_no_drop_material`
4. `document_source_signal_material`

These folders are not final workflow sections.
They are preparation buckets before synthesis.

### H.4 Required Boundary Rules for Block 1

Block 1 contracts must preserve these boundaries:

- accepted Pass 5 outputs are consumed as outputs of Pass 5, not revalidated
- unresolved items remain unresolved
- disputes remain disputes
- defects remain defects
- unmapped content remains no-drop/open material
- Pass 6 handoff candidates remain candidates
- document/source claims remain signals, not operational truth
- role/layer context is used for interpretation, not employee ranking
- truth-lens context classifies type of evidence, not person reliability

### H.5 Explicit Non-Goals for Block 1

Block 1 must not define or implement:

- common-path synthesis
- contradiction resolution
- seven-condition workflow evaluation
- readiness outcome
- Initial Package generation
- Final Package generation
- Pass 7 issue records
- participant follow-up sending
- Copilot behavior
- provider calls

### H.6 Block 1 Proof Meaning

Block 1 is successful only if contracts/types can represent:

- accepted Pass 5 outputs prepared for synthesis
- the four preparation folders
- role/layer context
- truth-lens context
- open/risk/candidate preservation
- document/source signals as signals only

Proof should include:

- contract schema validation where applicable
- TypeScript export checks
- example valid `SynthesisInputBundle`
- example invalid bundle rejected when required identity or folder structure is missing
- confirmation that no synthesis/evaluation/package/review logic was added

### I. Pass 6B Concept — Workflow Analysis and Evaluation

Status:

Conceptual definition in progress. This section defines what 6B receives from 6A, what it does, and what it outputs before any technical block decomposition.

## I.1 Plain Meaning of 6B

6B is the stage where the system starts analyzing the prepared Pass 5 outputs as a whole case.

6A prepares the material.
6B analyzes whether the material can form a coherent workflow understanding.

In simple terms:

**6B = looking at all prepared employee/session evidence together and asking: do we understand the real workflow well enough, what is still unclear, and what should happen next?**

6B does not produce the final package yet.
6B does not run Pass 7 discussion.
6B does not send new questions by itself.

## I.2 What Enters 6B from 6A

6B receives the reviewable `SynthesisInputBundle`, explained for admin users as:

**Accepted Pass 5 outputs prepared for synthesis.**

It includes four material groups:

1. **Analysis material**
   - extracted steps
   - decisions
   - exceptions
   - handoffs
   - systems/tools
   - controls/dependencies
   - accepted clarification outcomes

2. **Boundary / role-limit material**
   - knowledge gaps
   - ownership boundaries
   - execution boundaries
   - visibility limits
   - upstream/downstream limits
   - cross-team boundaries
   - outcome-only knowledge
   - tacit-only practice

3. **Gap / risk / no-drop material**
   - unresolved items
   - unmapped content
   - defects
   - disputes
   - low-confidence items
   - candidate-only items

4. **Document / source signal material**
   - SOP signals
   - SLA signals
   - policy signals
   - KPI signals
   - role-document signals
   - source-to-role or source-to-hierarchy signals
   - document claims to compare later

It also receives:

- participant role/layer context
- truth-lens context
- hierarchy context when available
- use-case context
- department context
- company/source context where relevant

## I.3 What 6B Does

6B performs case-level workflow analysis.

It should answer these questions:

1. **What is the likely real workflow?**
   - What appears to be the common path?
   - What are the main steps?
   - What is the likely order?
   - Where does the workflow start and end?

2. **Where do participant views differ?**
   - Are differences just role perspective?
   - Are they same-layer variation?
   - Are they frontline vs management mismatch?
   - Are they document-vs-reality mismatch?
   - Are they real contradictions?

3. **What does each role/layer seem to know best?**
   - frontline = execution reality
   - supervisor = oversight / escalation / review
   - manager = approvals / controls / targets
   - director/executive = policy intent / governance / ownership model
   - external/cross-functional = handoff / dependency boundaries

4. **What is clear enough?**
   - clear steps
   - clear ownership
   - clear decisions
   - clear handoffs
   - clear controls
   - clear exceptions

5. **What is still unclear?**
   - missing step
   - vague decision condition
   - unclear approval
   - unclear owner
   - unresolved handoff
   - document mismatch
   - boundary not closed

6. **Does the workflow satisfy the seven critical completeness conditions enough for an Initial Package?**
   - This is not a mechanical checklist.
   - A weakness does not automatically block.
   - Only a gap that materially breaks essential workflow understanding should block.

7. **What should happen next?**
   - continue to 6C Initial Package
   - carry warnings into Initial Package
   - request more clarification later
   - route issue candidate toward Pass 7
   - ask manager/department/company-level question later
   - stop because workflow understanding is not ready

## I.3A Layer-Aware Analysis Order in 6B

Adopted conceptual direction:

6B should not merge all participant answers into one workflow immediately.

It should first interpret answers according to the participant’s role/layer in the approved department hierarchy.

Reason:

A frontline employee, supervisor, manager, director, and executive may all describe the same workflow differently because each sees a different layer of reality.

These differences are not automatically contradictions.
They may reveal execution reality, oversight reality, approval/control reality, policy intent, or business-governance view.

### Recommended analysis order

6B should analyze in this order:

1. **Same-layer analysis**
   - Compare participants inside the same or similar layer first.
   - Example: frontline vs frontline, supervisor vs supervisor, manager vs manager.
   - Purpose: find peer-level consistency, local variation, role-level gaps, or inconsistent execution.

2. **Layer-specific synthesis**
   - Build a provisional understanding per layer.
   - Example:
     - frontline execution view
     - supervisor oversight view
     - manager approval/control view
     - director/executive policy-intent view
     - external/cross-functional handoff view

3. **Cross-layer comparison**
   - Compare layer views against each other.
   - Example:
     - frontline reality vs supervisor oversight
     - frontline reality vs manager intended process
     - supervisor escalation view vs manager authority view
     - document claim vs layer-specific reality

4. **Difference interpretation**
   - Classify differences as:
     - same-layer variation
     - role-perspective difference
     - sequence variation
     - execution-vs-oversight mismatch
     - policy-intent-vs-operational-reality mismatch
     - document-vs-reality mismatch
     - real contradiction
     - unresolved evidence gap

5. **Workflow assembly**
   - Only after the above should 6B assemble the best current workflow understanding.
   - The assembled workflow should preserve confidence, source/layer basis, variants, and unresolved issues.

### Layer truth-lens rule

6B should match each layer to the type of truth it is more likely to know:

- **Frontline / direct employee**: strongest for actual execution, real steps, tools, workarounds, exceptions, and practical sequence.
- **Senior individual contributor / supervisor**: strongest for review, oversight, escalation, exceptions, handoffs, and quality checks.
- **Manager**: strongest for approvals, authority, targets, controls, responsibility model, and intended departmental operating logic.
- **Director / executive**: strongest for policy intent, business purpose, governance model, department-level objectives, and target-state direction.
- **External / cross-functional actor**: strongest for handoff boundaries, dependencies, upstream/downstream interfaces, and missing ownership points.

### Important boundary

6B must not assume that the higher layer is more correct.

It also must not assume that the frontline layer is always complete.

Instead:

- use frontline evidence to understand actual work
- use supervisor/manager evidence to understand oversight, approvals, and controls
- use director/executive evidence to understand intent, governance, and target direction
- compare them to detect mismatch between reality and intended model

### Manager / upper-layer missing-detail rule

If a manager or upper-layer participant does not mention detailed system steps, this is not automatically a gap.

It may simply reflect the level of abstraction appropriate to that role.

However, if the manager is expected to own a control, approval, target, or policy interpretation and cannot explain it clearly, that may become a meaningful gap.

### Frontline missing-concept rule

If a frontline participant does not explain policy intent, high-level target logic, or department-level governance, this is not automatically a gap.

It may simply be outside their role visibility.

However, if the frontline participant cannot explain the actual steps they perform, tools they use, or handoffs they execute, that may be a meaningful workflow gap.

### Practical conclusion

6B should not ask only: “Who is right?”

It should ask:

**What type of workflow truth is each layer best positioned to reveal, and how do these views combine into the best current workflow understanding?**

## I.3B Missing Analysis Core Before 6B Routing

Operator correction accepted:

Before defining 6B routing decisions or moving to 6C, the core analysis logic of 6B must be clarified.

The unresolved question is not only what 6B outputs.
The unresolved question is:

**On what basis does 6B assemble the workflow when participants give different steps, different sequence, different ownership, or different levels of detail?**

This is a critical conceptual gap.

6B must not simply merge participant answers.
6B must have an explicit workflow assembly logic.

## I.3C Claim-Based Layered Workflow Analysis System

Status:

Adopted as the conceptual methodology for Pass 6B. This is not a short documentation note. It is the internal analytical system that governs how Pass 6B reads participant outputs, compares layers, assembles workflow understanding, scores claims, classifies differences, and supports admin decisions.

Purpose:

Pass 6B needs a configurable analysis system, not a fixed one-off prompt behavior.

This system should work as an internal engine inside Pass 6. It must be structured enough that future changes to claim types, scoring weights, difference categories, materiality rules, admin-review thresholds, or methodology settings can change the analysis results without rewriting the whole product.

Plain meaning:

**Pass 6B does not simply merge employee answers. It runs a governed, configurable analysis method over accepted Pass 5 outputs to assemble the best current workflow understanding.**

### I.3C.1 Governing Methodology

Pass 6B uses:

**Claim-Based Layered Workflow Analysis**

This means:

- the system does not evaluate people
- the system does not assume hierarchy rank equals truth
- the system does not assume frontline is always right for everything
- the system analyzes each workflow claim based on its type, source layer, evidence basis, support, materiality, and relationship to other claims

The core question is:

**What type of workflow truth does this claim represent, how strong is it, and how should it affect the assembled workflow?**

### I.3C.2 Methodological Foundations

This analysis system may be supported by the following methodological lenses:

1. **Espoused Theory vs Theory-in-Use**
   - Used to separate intended process, policy, or management explanation from actual operational practice.
   - Helps interpret manager/director/document claims versus frontline execution claims.

2. **Triangulation**
   - Used to compare claims across participants, layers, documents, and clarification answers.
   - Agreement across sources supports a claim, but does not automatically make it final truth.

3. **BPMN / process-structure logic**
   - Used to reason about activities, sequence, gateways/decisions, handoffs, and lanes.
   - Helps assemble steps into a process structure.

4. **SIPOC boundary logic**
   - Used to reason about suppliers, inputs, process, outputs, customers, start/end boundaries, and trigger/output clarity.

5. **APQC-style process vocabulary support**
   - Used only as a vocabulary and classification support layer.
   - It must not override company reality.

6. **Soft Systems / multi-perspective reasoning**
   - Used to handle multiple valid perspectives without forcing premature single-truth flattening.

These methodologies are support lenses. They are not decorative references and not rigid compliance engines.

### I.3C.3 Configurable Analysis Policy

Pass 6B should contain an explicit configurable policy layer, tentatively named:

**Claim-Based Layered Workflow Assembly Policy**

This policy should control at minimum:

- claim type list
- difference type list
- scoring dimensions
- default weights
- layer-to-claim fit assumptions
- materiality thresholds
- readiness thresholds
- admin-review triggers
- document-vs-reality treatment
- confidence labels
- warning/blocker thresholds

Important rule:

Changes to this policy should change the analysis output in a controlled way.

Examples:

- If claim weights change, claim confidence should change.
- If materiality thresholds change, warning/blocker classification may change.
- If difference categories change, review-routing output may change.
- If document weighting changes, document-supported claims may gain or lose influence.

The system must preserve the policy version used for each analysis run so results remain explainable later.

### I.3C.4 Claim Types

Pass 6B should classify workflow claims into five simple claim types:

1. **Execution Claim**
   - What is done and how it is done?

2. **Sequence Claim**
   - When does it happen? What comes before or after it?

3. **Decision / Rule Claim**
   - What rule, condition, threshold, or decision determines the path?

4. **Ownership Claim**
   - Who owns, performs, receives, approves, or hands off the work?

5. **Boundary Claim**
   - Where does the use case, role, responsibility, or workflow segment start/end?

A claim may touch more than one type, but the system should assign a primary claim type and optional secondary types only when needed.

### I.3C.5 Claim Evaluation Questions

Each claim should be evaluated using five questions:

1. **What type of claim is this?**
   - execution, sequence, decision/rule, ownership, boundary

2. **Is the source close to this type of truth?**
   - Is this participant/layer likely to know this kind of information?

3. **Does it have a Pass 5 evidence anchor?**
   - Was it tied to extracted evidence, clarification answer, boundary signal, or accepted Pass 5 output?

4. **Is it supported by another source?**
   - another participant, another layer, document/source signal, or clarification result

5. **How material is it to the core workflow?**
   - does it affect the main path, a warning, or only a minor detail?

These questions should be implemented as analysis dimensions, not as free-text reasoning only.

### I.3C.6 Scoring Model

Pass 6B may use scoring as decision support.

Scores must not be treated as final truth.

Minimum scoring concepts:

1. **Claim Confidence Score**
   - Indicates how strongly supported a claim is as an input to workflow assembly.
   - It does not prove the claim is true.

2. **Claim Materiality Score**
   - Indicates how important the claim is to understanding the core workflow.
   - A low-confidence/high-materiality claim may require review or clarification.

3. **Difference Severity Score**
   - Indicates whether a difference is a minor warning, visible issue, review candidate, or blocker.

4. **Readiness Recommendation Support**
   - Uses claim confidence, materiality, unresolved blockers, and seven-condition evaluation to support the 6B routing outcome.

Recommended claim confidence dimensions:

- role fit
- directness of involvement
- evidence anchor presence
- corroboration/support
- source/document alignment where applicable

Recommended materiality dimensions:

- effect on main workflow sequence
- effect on ownership/handoff
- effect on decision/approval
- effect on use-case boundary
- effect on Initial Package clarity

Scoring rules and weights should be configurable, not hard-coded forever.

### I.3C.7 Default Layer Fit Logic

Default layer fit should guide analysis but not act as absolute truth.

Suggested defaults:

- **Frontline / direct employee**
  - strongest for execution details, actual tools, practical sequence, workarounds, and real exceptions.

- **Supervisor / senior contributor**
  - strongest for review, oversight, escalation, exception handling, handoffs, and quality checks.

- **Manager**
  - strongest for approvals, authority, targets, ownership model, controls, and formal operating logic.

- **Director / executive**
  - strongest for policy intent, business boundary, governance model, strategic purpose, and department-level objectives.

- **External / cross-functional role**
  - strongest for handoff boundaries, dependencies, upstream/downstream interfaces, and ownership gaps.

Important rule:

Layer fit is a default assumption that can be overridden by evidence, role responsibility, admin review, or case-specific configuration.

### I.3C.8 Difference Types

Pass 6B should classify differences into four simple types:

1. **Completion**
   - One layer adds information that another layer does not see.
   - Not necessarily a problem.

2. **Variant**
   - Different paths exist depending on case type, condition, client type, exception, approval status, or role path.

3. **Normative-Reality Mismatch**
   - A policy, document, manager/director statement, or intended process differs from frontline/operational reality.

4. **Factual Conflict**
   - Two claims directly contradict each other about what actually happens.
   - Requires review, clarification, or admin decision when material.

Difference classification must be visible to the admin.

### I.3C.9 Workflow Assembly Logic

The assembled workflow should be built through a controlled sequence:

1. **Separate claims by layer and type**
   - Do not merge all answers immediately.

2. **Analyze same-layer claims**
   - Identify common claims, variants, role-specific claims, and same-layer conflicts.

3. **Build a provisional execution path**
   - Usually grounded in frontline/direct execution claims for actual steps.
   - Must still account for triggers, upstream conditions, and system events that may come from other layers or sources.

4. **Add oversight and exception logic**
   - Use supervisor/senior-role claims for escalation, exceptions, review, and practical controls.

5. **Add approval, control, and decision logic**
   - Use manager/control-layer claims where appropriate.
   - Validate against frontline reality when possible.

6. **Add boundary and policy-intent context**
   - Use director/executive and document/source claims to define boundaries, governance intent, and target model.

7. **Compare document/source signals**
   - Treat documents as normative/source signals, not reality by default.

8. **Classify differences**
   - completion, variant, normative-reality mismatch, factual conflict.

9. **Assemble current best workflow understanding**
   - Include variants, caveats, unresolved claims, and evidence basis.

10. **Apply seven-condition evaluation**
   - Only after the workflow draft exists.

### I.3C.10 Admin Visibility Requirement

This methodology must be visible and reviewable by the admin.

Pass 6 should not hide the analysis behind a black box.

The admin should be able to see at minimum:

- the assembled workflow draft
- claims supporting each step
- claim type
- participant/layer source
- evidence anchor or Pass 5 source basis
- confidence/materiality indicators
- difference type
- whether a claim is accepted, warning, unresolved, or needs review
- recommended action
- which analysis policy/scoring version was used

Admin view should reduce complexity, not expose every technical detail at once.

Recommended admin sections:

1. **Workflow Assembly View**
   - Shows draft workflow and supporting claims.

2. **Claims Review Panel**
   - Shows important claims, confidence, materiality, source/layer, and evidence basis.

3. **Differences & Mismatches Panel**
   - Shows completion, variant, normative-reality mismatch, and factual conflict.

4. **Decision Needed Panel**
   - Shows only items requiring admin judgment.

5. **Readiness Summary**
   - Shows whether the case can move to Initial Package and why.

### I.3C.11 Configurability and Change-Control

This analysis methodology should be implemented as a configurable internal system within Pass 6, not as scattered prompt text.

The configurable layer should allow later changes to:

- claim types
- difference types
- scoring weights
- scoring thresholds
- claim materiality rules
- layer-fit defaults
- document influence rules
- admin-review triggers
- readiness routing thresholds
- methodology / analysis-lens activation rules
- admin-facing method/tool labels and descriptions

Every analysis run should record:

- methodology/policy version
- scoring version
- prompt version where relevant
- provider/model where relevant
- input bundle version
- timestamp
- selected methodology or analysis lens
- reason the methodology/lens was selected
- whether selection was system-suggested or admin-forced
- admin override reason where applicable

This makes future changes traceable.

### I.3C.11A Method / Tool Selection Traceability

Adopted requirement:

Whenever Pass 6B uses a methodology, lens, or analysis tool, the system must preserve:

- what methodology/tool was selected
- whether it is a methodology, lens, or tool
- why it was selected
- what claim, difference, workflow segment, or evaluation question it was applied to
- what output it produced
- whether it affected confidence, materiality, difference classification, routing, or readiness
- whether the admin requested/forced it
- whether the system considered it suitable or less suitable

Reason:

The admin must be able to understand not only the result, but the analytical path that produced the result.

No Pass 6B result should appear as if it came from generic AI reasoning without stating which analysis method/lens/tool contributed to it.

### I.3C.11B Admin Method and Tool Cards

Adopted admin-surface requirement:

The Pass 6 admin page should include a clear section for **Methodology and Tool Cards**.

Purpose:

The admin must be able to see, understand, test, and optionally request a specific methodology or tool.

Each card should explain:

- name
- type: methodology / lens / tool
- short definition
- what it does
- when it is normally used
- what input it needs
- what output it produces
- what scores or classifications it can affect
- what it must not do
- example use case
- active/inactive status if configurable
- current version

Examples:

- BPMN / Process Structure Lens — methodology/lens for steps, sequence, decisions, handoffs.
- SIPOC Boundary Lens — tool/lens for start, end, input, output, supplier/customer clarity.
- Triangulation Lens — methodology/lens for support across participants, documents, and clarifications.
- Espoused Theory vs Theory-in-Use Lens — methodology/lens for intended process vs actual practice.
- RACI / Responsibility Lens — tool/lens for responsibility, approval, accountability, handoff ownership.
- SSM / Multi-Perspective Lens — methodology/lens for conflicting organizational perspectives.
- APQC Vocabulary Lens — vocabulary/classification support tool for process naming and family alignment.

Admin override rule:

The admin may ask the AI to apply a specific methodology/tool even if the system would not have selected it as the primary lens.

When this happens, the system must:

- allow the request if it does not violate hard boundaries
- mark the method/tool as admin-forced
- show whether the system considers it suitable, partially suitable, or weakly suitable
- explain the risk or limitation of using it
- keep the original system-suggested method if needed for comparison
- record the admin override and reason

Important boundary:

Admin override changes the analytical lens used, but it does not allow the system to invent evidence, treat documents as reality, bypass Pass 5 status, bypass seven-condition evaluation, or bypass admin review for material conflicts.

### I.3C.12 Hard Boundaries

The Claim-Based Layered Workflow Analysis System must not:

- evaluate employees
- treat rank as truth
- treat documents as reality by default
- hide important uncertainty
- invent missing steps to make a clean workflow
- collapse variants into one fake linear process
- use scores as final truth
- bypass admin judgment for material review decisions
- generate Initial Package before 6B routing allows it

### I.3C.13 Current Adoption Statement

Adopted conceptual statement:

**Pass 6B uses a configurable Claim-Based Layered Workflow Analysis System. It classifies claims into five types, evaluates them through confidence and materiality dimensions, classifies differences into four types, assembles the workflow through layer-aware claim logic, and shows the admin clear evidence-linked reasoning. Scores guide decisions but do not replace admin judgment.**

## I.3D Pass 6B Method Registry and Conditional Multi-Lens Analysis Policy

Status:

Adopted as a standalone conceptual policy inside Pass 6B. This section governs how analytical methods, lenses, and tools are selected, combined, exposed to the admin, versioned, and allowed to affect results.

### I.3D.1 Purpose

Pass 6B must not rely on one vague prompt instruction such as “analyze the workflow.”

It must use a governed Method Registry and Analysis Policy that defines:

- what analytical methods/lenses/tools are available
- when each one is normally used
- what each method consumes
- what each method produces
- how each method affects confidence, materiality, difference classification, routing, or readiness
- when additional methods may be triggered
- when method outputs may be merged
- when method outputs must remain separate and be routed to admin review
- how admin-requested methods are handled
- how method/scoring/prompt/provider versions are recorded

Plain meaning:

**Pass 6B uses a configurable analytical toolbox. The system must show which tool was used, why it was used, what it produced, and how it affected the result.**

### I.3D.2 Method Registry

Pass 6B should maintain a registry of analytical methods/lenses/tools.

Each registry item must include:

- method/tool name
- type: methodology / lens / tool / vocabulary support
- short definition
- normal use cases
- required input
- expected output
- scoring or classification impact
- limitations
- hard boundaries
- active/inactive status if configurable
- method version
- admin-facing description

### I.3D.3 Registered Methods / Lenses / Tools

#### 1. BPMN / Process Structure Lens

Type:

- methodology / process-structure lens

Purpose:

- Analyze workflow structure: steps, sequence, decisions, handoffs, lanes, and process continuity.

Use when:

- step order is unclear
- handoff sequence is unclear
- decision/gateway logic affects flow
- multiple participants describe partial flow slices
- workflow needs process-structure interpretation

Produces:

- process structure notes
- step/sequence interpretation
- possible gateway/decision points
- handoff clarity notes
- sequence-confidence contribution

Affects:

- sequence clarity
- handoff clarity
- process continuity
- step-to-step connection

Must not:

- treat a clean process structure as proven reality
- force the workflow into one fake linear flow
- override participant evidence or admin judgment

#### 2. SIPOC Boundary Lens

Type:

- tool / boundary lens

Purpose:

- Clarify workflow boundary, trigger, inputs, outputs, supplier/customer or source/recipient relationships.

Use when:

- start point is unclear
- end point is unclear
- trigger/input is unclear
- output/outcome is unclear
- use-case boundary is disputed

Produces:

- boundary interpretation
- input/output clarity notes
- trigger/output mapping
- use-case scope confidence contribution

Affects:

- boundary clarity
- input/output clarity
- use-case scope confidence

Must not:

- build the full workflow by itself
- expand the use case beyond approved scope
- replace participant reality

#### 3. Triangulation Lens

Type:

- methodology / support lens

Purpose:

- Assess how a claim is supported or challenged across participants, layers, clarifications, documents, and source signals.

Use when:

- a claim needs confidence assessment
- claims conflict or partially align
- a single-source claim may still be role-authoritative
- the system needs support mapping

Produces:

- support map
- corroboration notes
- same-layer and cross-layer support notes
- claim-confidence contribution

Affects:

- claim confidence
- corroboration score
- support map
- disagreement visibility

Must not:

- treat consensus as automatic truth
- treat single-source claims as automatically weak
- ignore role responsibility or direct involvement

#### 4. Espoused Theory vs Theory-in-Use Lens

Type:

- methodology / normative-reality lens

Purpose:

- Separate intended process, policy, or management description from actual operational practice.

Use when:

- document or management view differs from frontline practice
- SOP/policy/target process may not match actual execution
- the system needs to identify policy-vs-reality gap

Produces:

- normative-reality mismatch interpretation
- intended-vs-actual distinction
- review/warning/blocker recommendation contribution

Affects:

- normative-reality mismatch classification
- review routing
- warning/blocker classification
- document-vs-reality interpretation

Must not:

- assume frontline is always right
- assume management/policy is always wrong
- collapse intended process and actual practice into one claim

#### 5. RACI / Responsibility Lens

Type:

- tool / responsibility and ownership lens

Purpose:

- Clarify who performs, owns, approves, receives, is accountable, is consulted, or is informed.

Use when:

- ownership is unclear
- approval authority is unclear
- handoff recipient is unclear
- responsibility shifts between roles or teams
- escalation path is unclear

Produces:

- responsibility interpretation
- ownership/handoff clarity notes
- approval/accountability notes
- ownership-confidence contribution

Affects:

- ownership clarity
- approval clarity
- handoff confidence
- responsibility gap detection

Must not:

- impose formal RACI if the company does not use it
- invent ownership where evidence is missing
- override approved hierarchy or participant evidence

#### 6. SSM / Multi-Perspective Lens

Type:

- methodology / multi-perspective lens

Purpose:

- Handle multiple valid organizational perspectives without prematurely flattening them into one interpretation.

Use when:

- different layers see the workflow differently
- departments disagree about ownership or reality
- problem framing itself differs
- perspective difference may be more important than factual conflict

Produces:

- perspective map
- layer-view interpretation
- complexity notes
- admin-discussion support

Affects:

- perspective complexity
- difference classification
- admin discussion readiness

Must not:

- make every contradiction “just perspective”
- avoid necessary decisions forever
- hide factual conflicts

#### 7. APQC Vocabulary Lens

Type:

- vocabulary / process classification support

Purpose:

- Support process naming, terminology alignment, process-family classification, and cross-case comparability.

Use when:

- process naming is unclear
- use-case label needs vocabulary alignment
- output wording needs consistent process language
- domain/process-family support is useful

Produces:

- vocabulary suggestion
- process-family note
- terminology alignment note

Affects:

- terminology consistency
- process naming
- output wording
- domain-aware interpretation

Must not:

- override company-specific reality
- force the workflow into a generic taxonomy
- decide operational truth

### I.3D.4 Method Selection Policy

Pass 6B must select the analytical method based on the problem type.

Default selection rules:

| Analytical problem | Primary method/lens |
|---|---|
| Step order / process structure / handoff sequence | BPMN / Process Structure Lens |
| Start / end / input / output / trigger / use-case boundary | SIPOC Boundary Lens |
| Claim support / repeated evidence / disagreement support map | Triangulation Lens |
| Policy/document/management view vs frontline practice | Espoused Theory vs Theory-in-Use Lens |
| Ownership / approval / accountability / handoff responsibility | RACI / Responsibility Lens |
| Different layers or departments see different realities | SSM / Multi-Perspective Lens |
| Process naming / terminology / process-family alignment | APQC Vocabulary Lens |

Every method selection must record:

- selected method/tool
- why it was selected
- applied claim/issue/difference/workflow segment
- whether it was primary or secondary
- whether it was system-suggested or admin-forced
- method version
- output summary
- result impact

### I.3D.5 Conditional Multi-Lens Analysis

Pass 6B must not run every method on every claim by default.

Instead, it uses **Conditional Multi-Lens Analysis**.

Rule:

1. Start with the primary method/lens based on the claim/problem type.
2. Check whether the result is clear enough.
3. If clear, stop.
4. If unclear, high-materiality, low-confidence, disputed, document-sensitive, or layer-sensitive, trigger one or more additional lenses.
5. Merge only complementary findings.
6. Use supporting findings to increase confidence.
7. Do not merge conflicting findings.
8. Classify conflicting findings as differences and route them to admin review when material.

Additional-lens trigger examples:

| Trigger | Add lens |
|---|---|
| sequence remains unclear | BPMN |
| boundary remains unclear | SIPOC |
| responsibility remains unclear | RACI |
| claim is important but weakly supported | Triangulation |
| document/management and frontline differ | Espoused Theory vs Theory-in-Use |
| layer perspectives differ materially | SSM |
| terminology/process label is unclear | APQC |

### I.3D.6 Method Result Combination Rules

Method outputs may relate in three ways:

1. **Complementary findings**
   - They explain different parts of the same workflow fact.
   - They may be merged.
   - Example: BPMN says approval precedes sending; RACI says manager owns approval.
   - Merged result: sending happens after manager approval.

2. **Supporting findings**
   - They support the same claim from additional sources or lenses.
   - They may increase claim confidence.
   - Example: frontline says the step exists, supervisor confirms it, SOP also mentions it.

3. **Conflicting findings**
   - They contradict each other or reveal policy-vs-reality mismatch.
   - They must not be merged.
   - They should become Completion / Variant / Normative-Reality Mismatch / Factual Conflict as appropriate.

Hard rule:

**Conflicting method results must not be merged into a fake clean workflow.**

### I.3D.7 Method Impact on Scoring

Method use may affect scores, but scores remain decision-support indicators.

Examples:

| Method | Possible scoring impact |
|---|---|
| BPMN | sequence confidence, handoff clarity |
| SIPOC | boundary clarity, input/output clarity |
| Triangulation | claim confidence, corroboration |
| Espoused vs Theory-in-Use | normative-reality severity, warning/review routing |
| RACI | ownership clarity, approval clarity |
| SSM | perspective complexity, difference interpretation |
| APQC | terminology consistency, output wording consistency |

Suggested method-support concept:

- if one method gives a clear result → normal method support
- if an additional method supports it → increased confidence
- if an additional method conflicts → difference severity may increase
- if a method is admin-forced but weakly suitable → show limitation and do not inflate confidence automatically

### I.3D.8 Admin Method and Tool Cards

The Pass 6 admin page must include **Methodology and Tool Cards**.

Each card should show:

- method/tool name
- type: methodology / lens / tool / vocabulary support
- definition
- what it does
- when it is normally used
- required input
- expected output
- what scores/classifications it affects
- limitations
- what it must not do
- example use case
- active/inactive status if configurable
- current method version

Purpose:

The admin must understand the available analytical tools and be able to request a specific method/tool when needed.

### I.3D.9 Admin-Requested Method Override

The admin may ask the AI/system to apply a specific methodology/tool even if it is not the system’s primary suggested method.

When this happens, the system must:

- allow the request if it does not violate hard boundaries
- mark the method/tool as `admin_forced`
- show whether the method is suitable, partially suitable, or weakly suitable
- explain limitations or risks of using it
- preserve the system-suggested method where useful for comparison
- record the admin override and reason

Admin override may change the analytical lens used.
It must not allow the system to:

- invent evidence
- treat documents as operational reality
- bypass Pass 5 statuses
- bypass seven-condition evaluation
- bypass admin review for material conflicts
- generate Initial Package prematurely

### I.3D.10 Method Selection Traceability

Every analysis result influenced by a method/tool must preserve:

- method/tool used
- method/tool type
- reason selected
- selection source: system / admin-forced
- suitability assessment
- input item analyzed
- output produced
- score/classification/routing impact
- method version
- related prompt version where relevant
- provider/model where relevant

Governing rule:

**No Pass 6B result should appear as generic AI reasoning without a recorded method/lens/tool path when a method materially influenced it.**

### I.3D.11 Boundaries

The Method Registry and Conditional Multi-Lens Analysis Policy must not:

- run every method on every claim by default
- hide method selection from the admin
- merge conflicting outputs
- treat method agreement as absolute truth
- treat document signals as operational reality
- use scoring as final judgment
- override admin decision in material conflicts
- become an academic decoration layer with no practical effect
- become a black box that cannot be configured or reviewed

### I.3D.12 Adoption Statement

Adopted policy statement:

**Pass 6B contains a Method Registry and Conditional Multi-Lens Analysis Policy. The system selects analysis methods such as BPMN, SIPOC, Triangulation, Espoused Theory vs Theory-in-Use, RACI, SSM, and APQC based on the claim/problem type. Additional methods are triggered only when needed. Complementary findings may be merged, supporting findings may raise confidence, and conflicting findings must not be merged. The admin can see method cards, understand why a method was selected, and request a specific method/tool with override traceability. Every material method selection records its version, reason, output, and impact.**

### I.3D.13 Relationship Between Method Registry and PromptSpecs

Adopted requirement:

The Method Registry is not a replacement for prompts, and prompts are not allowed to be the hidden owner of methodology.

Correct relationship:

- **Method Registry / Analysis Policy** defines the available methods, selection rules, boundaries, scoring effects, versions, and admin override behavior.
- **PromptSpecs** instruct the AI how to apply the selected method or lens to a specific claim, difference, workflow segment, or evaluation question.
- **System / capability prompts** must consume the Method Registry and Analysis Policy as governing inputs rather than inventing methods or selection rules inside free text.

In simple terms:

**The registry decides what methods exist and when they may be used. The prompt tells the AI how to use the selected method correctly.**

PromptSpecs affected:

- Synthesis PromptSpec
- Difference Interpretation PromptSpec
- Evaluation PromptSpec
- Initial Package Drafting PromptSpec where relevant
- Admin Explanation PromptSpec
- Pass6AnalysisCopilotPromptSpec

Prompt requirements:

Each relevant PromptSpec must include instructions to:

- read the active Method Registry / Analysis Policy version
- apply only registered/allowed methods unless admin override is explicitly provided
- state which method/lens/tool was used
- explain why it was selected
- distinguish system-selected vs admin-forced method use
- respect method boundaries
- avoid merging conflicting method outputs
- preserve uncertainty and routing recommendations
- return structured output that records method usage and impact

Boundary:

No methodology should live only inside a prompt with no registry/policy representation.

No prompt may silently change:

- claim types
- difference types
- scoring weights
- method selection rules
- readiness thresholds
- admin-review triggers
- document-vs-reality treatment

If a prompt suggests a methodological change, that change must be handled as a policy/configuration update, not as hidden prompt drift.

### I.3D.14 Prompt Governance for Method Use

Pass 6 PromptSpecs must be visible, editable, testable, and versioned.

For method-related behavior, the prompt workspace should show:

- active prompt version
- compiled prompt preview
- which Method Registry version it references
- test cases for method selection
- test cases for admin-forced method use
- test cases for complementary vs conflicting method outputs
- draft vs active comparison
- promotion/rollback history

Important rule:

Changing prompt wording may change how the AI applies a method, but it must not silently change the governing Method Registry or scoring configuration.

Therefore, the system should track separately:

- Method Registry version
- Analysis Policy version
- Scoring Configuration version
- PromptSpec version
- provider/model version

This separation allows the admin to know whether a changed result came from:

- different method selection rules
- different scoring weights
- different prompt wording
- different provider/model behavior
- different input evidence
- admin override

## I.3E Pass 6B Extraction-to-Claim-to-Workflow Pipeline

Status:

Required completion section for Pass 6B. This closes the practical transformation path from accepted Pass 5 outputs into workflow understanding and then into Workflow Readiness Result.

Purpose:

Pass 6B must not jump from conversations and documents directly to a workflow conclusion.

It must follow a clear transformation pipeline:

**Accepted Pass 5 outputs → extracted analysis units → workflow claims → claim comparison → workflow assembly → seven-condition evaluation → Workflow Readiness Result**

Plain meaning:

**6B does not guess the workflow. 6B builds it through traceable steps.**

### I.3E.1 Pipeline Overview

The Pass 6B pipeline has seven stages:

1. **Input Preparation**
   - consume the 6A `SynthesisInputBundle`
   - preserve the four folders: analysis material, boundary/role-limit material, gap/risk/no-drop material, document/source signal material

2. **Unit Identification**
   - identify usable workflow units from accepted Pass 5 outputs

3. **Claim Formation**
   - convert important units into typed workflow claims

4. **Claim Evaluation**
   - evaluate claims using source/layer fit, evidence basis, support, materiality, and method/lens selection

5. **Claim Comparison**
   - compare claims within the same layer, across layers, and against document/source signals

6. **Workflow Assembly**
   - assemble current best workflow understanding with variants, warnings, gaps, and source basis

7. **Readiness Evaluation**
   - apply the seven critical completeness conditions and produce the 6B Workflow Readiness Result

### I.3E.2 Stage 1 — Input Preparation

Input:

- `SynthesisInputBundle`
- accepted Pass 5 outputs
- role/layer context
- truth-lens context
- document/source signals
- gap/risk/no-drop items

Rule:

Pass 6B must consume what 6A prepared. It must not redo Pass 5 or reinterpret raw unprocessed evidence.

Output:

- analysis-ready material grouped by folder and context

### I.3E.3 Stage 2 — Unit Identification

This stage identifies the smallest meaningful workflow units from accepted Pass 5 outputs.

Unit types:

1. **Action / Step Unit**
   - Something a person, team, or system does.
   - Example: “The sales officer enters the client request in CRM.”

2. **Trigger / Input Unit**
   - Something that starts a step or workflow.
   - Example: “After the client accepts the quotation.”

3. **Output / Outcome Unit**
   - The result of a step.
   - Example: “A client onboarding request is created.”

4. **Sequence Signal Unit**
   - A before/after/then/when relationship.
   - Example: “After approval, the case moves to operations.”

5. **Decision / Rule Unit**
   - A condition, threshold, rule, or branch.
   - Example: “If the price is sensitive, manager approval is required.”

6. **Approval / Control Unit**
   - A review, validation, approval, check, or control point.
   - Example: “The supervisor reviews readiness before handoff.”

7. **Handoff Unit**
   - Movement of work, responsibility, information, or case ownership.
   - Example: “Sales sends the case to operations.”

8. **Exception Unit**
   - A non-standard path or special condition.
   - Example: “Urgent clients bypass the normal queue.”

9. **Boundary Unit**
   - Start/end of role, stage, or use case.
   - Example: “This happens after my role ends.”

10. **Information / Context Unit**
   - Useful context that does not itself move the workflow.
   - Example: “We usually use CRM for these cases.”

11. **Unknown / Gap Unit**
   - Missing or unclear information.
   - Example: “It depends, but I am not sure on what.”

Rule:

A unit is not automatically a workflow step. Some units become claims, some become context, some become boundary signals, and some remain gaps.

### I.3E.4 Stage 3 — Claim Formation

Important workflow units are converted into workflow claims.

Approved claim types:

1. **Execution Claim**
   - What is done and how it is done?

2. **Sequence Claim**
   - When does it happen? What comes before or after?

3. **Decision / Rule Claim**
   - What condition, rule, or threshold changes the path?

4. **Ownership Claim**
   - Who performs, owns, approves, receives, or hands off the work?

5. **Boundary Claim**
   - Where does the role, workflow segment, or use case begin/end?

Claim formation rules:

- A claim must link back to accepted Pass 5 output or document/source signal.
- A claim must preserve source participant/layer when available.
- A claim may have one primary type and optional secondary type if necessary.
- A document-only claim must remain marked as document/source signal until reality support exists.
- Boundary signals should not be treated as failed answers; they become boundary/role-limit claims or open items.

Example:

Participant statement:

“After the client accepts the quotation, I enter the request in CRM and send it to operations. If the price is sensitive, I go back to the manager.”

Possible claims:

- Execution Claim: sales enters the request in CRM.
- Sequence Claim: CRM entry happens after client acceptance.
- Ownership Claim: sales hands the case to operations.
- Decision / Rule Claim: sensitive pricing requires manager involvement.

### I.3E.5 Stage 4 — Claim Evaluation

Each claim is evaluated using the approved claim-analysis dimensions:

1. claim type
2. source/layer fit
3. evidence basis from Pass 5
4. support/corroboration
5. materiality to the core workflow
6. relevant method/lens, if needed

The system should produce confidence and materiality indicators.

Important rule:

Scoring supports analysis. It does not prove truth and does not replace admin judgment.

### I.3E.6 Stage 5 — Claim Comparison

Claims must be compared in three directions:

1. **Within the same layer**
   - frontline vs frontline
   - supervisor vs supervisor
   - manager vs manager
   - purpose: detect common claims, variants, same-layer inconsistency, or missing standardization

2. **Across layers**
   - frontline vs supervisor
   - frontline vs manager
   - supervisor vs manager
   - manager vs director/executive
   - purpose: detect completion, oversight additions, approval/control logic, policy-vs-reality mismatch, and factual conflict

3. **Against document/source signals**
   - participant reality vs SOP/SLA/policy/KPI/role-document signals
   - purpose: detect support, mismatch, weak reference, or document-only claims

Difference types:

- Completion
- Variant
- Normative-Reality Mismatch
- Factual Conflict

Rule:

Differences are not automatically problems. They become problems only when material to workflow understanding or package readiness.

### I.3E.7 Stage 6 — Workflow Assembly

The workflow draft is assembled after claim evaluation and comparison.

The assembly should include:

- current best common path
- known variants
- known sequence
- known decisions/rules
- known handoffs
- ownership and role basis
- approvals/controls
- systems/tools
- start/end boundaries
- warnings and caveats
- unresolved claims
- document/source mismatches

Assembly rules:

1. Do not build from one participant narrative alone unless the role is uniquely authoritative and the limitation is visible.
2. Do not flatten variants into one fake linear process.
3. Do not treat document claims as operational truth by default.
4. Do not hide material conflicts.
5. Do not invent missing steps to make the workflow clean.
6. Preserve the claim basis behind every important workflow step.
7. Mark partial or weak areas clearly.

### I.3E.8 Stage 7 — Seven-Condition Evaluation and Readiness Result

After the workflow draft exists, 6B applies the seven critical completeness conditions:

1. core sequence continuity
2. step-to-step connection
3. essential step requirements
4. decision rules / thresholds
5. handoffs / responsibility
6. controls / approvals
7. use-case boundary

Each condition receives one of:

- `clear_enough`
- `warning`
- `materially_broken`
- `unknown`
- `not_applicable`

Then 6B produces the Workflow Readiness Result.

Possible readiness decisions:

- `ready_for_initial_package`
- `ready_for_initial_package_with_warnings`
- `partial_only_not_package_ready`
- `needs_more_clarification_before_package`
- `needs_review_decision_before_package`
- `workflow_exists_but_current_basis_insufficient`

Rule:

6B cannot move to 6C until this readiness result exists.

### I.3E.9 Admin Visibility

The admin must be able to see the pipeline result without reading hidden reasoning.

The admin should see:

- workflow draft
- claims behind each major step
- claim source/layer
- method/lens used where relevant
- confidence/materiality indicators
- differences and mismatches
- seven-condition result
- readiness decision
- what needs admin decision

### I.3E.10 Pipeline Hard Boundaries

The pipeline must not:

- redo Pass 5 extraction
- use unprocessed raw evidence directly
- convert document claims into reality
- evaluate employees
- rank people as reliable/unreliable
- invent missing workflow steps
- hide weak or partial areas
- collapse variants into a fake single path
- produce Initial Package content
- send clarification questions
- run Pass 7 review mechanics

### I.3E.11 Adoption Sentence

**Pass 6B uses an Extraction-to-Claim-to-Workflow Pipeline. It converts accepted Pass 5 outputs into workflow units, converts important units into typed claims, evaluates and compares claims across layers and documents, assembles the current best workflow understanding, applies the seven critical completeness conditions, and produces the Workflow Readiness Result that controls whether 6C may generate an Initial Package.**

## I.4 The Seven-Condition Evaluation in Plain Language

6B uses the seven critical completeness conditions as a workflow-understanding lens.

The point is not to make the workflow perfect.
The point is to decide whether the workflow is complete enough to produce a useful Initial Package.

The seven conditions should ask whether the system understands enough about:

1. **Core sequence continuity**
   - Do we understand how the main workflow moves from beginning to end?

2. **Step-to-step connection**
   - Do we understand how one step leads to the next?

3. **Essential step requirements**
   - Do we understand what is needed for key steps to happen?

4. **Decision rules / thresholds**
   - Do we understand the main decision points, conditions, or thresholds?

5. **Handoffs / responsibility**
   - Do we understand who owns or receives the work at key transitions?

6. **Controls / approvals**
   - Do we understand required approvals, review points, or controls?

7. **Use-case boundary**
   - Do we understand where the selected use case starts and ends?

Important rule:

A condition can be imperfect without blocking the Initial Package.
It blocks only when the missing part materially breaks essential workflow understanding.

## I.5 Workflow Completeness vs Automation-Readiness

6B must separate two ideas:

1. **Workflow documentability / workflow completeness**
   - Can we explain the workflow clearly enough for an Initial Package?

2. **Automation-readiness**
   - Is the workflow structured enough to support later automation?

A workflow may be documentable but not automation-ready.

Therefore:

- non-automatable does not mean workflow-incomplete
- missing automation detail does not automatically block Initial Package
- automation-readiness may become a recommendation or later output, not a Pass 6B blocker by itself

## I.5A Workflow Existence, Completeness Level, and Incomplete Workflow Handling

Adopted correction:

Pass 6B must not output “no workflow” when real work is happening.

If people are doing work, actions are happening, handoffs occur, and outcomes are produced, then a real workflow exists in practice, even if it is undocumented, fragmented, weak, inconsistent, hidden, partially manual, or poorly understood.

Therefore, Pass 6B should not ask:

**Does a workflow exist?**

It should ask:

**What level of understanding and completeness do we currently have for the existing workflow, and what is weak, missing, unclear, or automation-relevant?**

### I.5A.1 Workflow existence rule

The system should assume that an implicit workflow exists whenever there is:

- repeated work activity
- role participation
- handoffs or dependencies
- decisions or actions
- outputs or outcomes
- operational results

The workflow may be:

- undocumented
- partially visible
- inconsistent
- fragmented
- tacit
- manual-heavy
- policy-mismatched
- weakly controlled
- not package-ready yet

But it should not be treated as non-existent.

### I.5A.2 Workflow understanding levels

Pass 6B should classify the current state into one of the following understanding levels:

1. **`partial_workflow_understanding`**
   - Some workflow elements are clear, but essential areas are missing or unclear.
   - The system can show a partial workflow map and gap closure needs.

2. **`reconstructable_workflow_with_gaps`**
   - The workflow can be reconstructed into a useful draft, but it contains warnings, variants, unresolved items, or weak areas.
   - It may support an Initial Package with caveats if the gaps do not materially break essential workflow understanding.

3. **`package_ready_workflow`**
   - The workflow satisfies the seven critical completeness conditions well enough for Initial Package generation.
   - Remaining gaps are non-blocking, documented, and visible.

4. **`workflow_exists_but_not_package_ready`**
   - The workflow exists in reality, but current evidence is too weak, fragmented, contradictory, or incomplete to responsibly generate an Initial Package.
   - The system should produce a partial workflow and gap closure plan, not a fake complete workflow.

### I.5A.3 If workflow is partial or weak

If the workflow is incomplete, Pass 6B should still produce value.

It should output:

- partial workflow map
- known steps
- known decisions
- known handoffs
- known boundaries
- missing steps
- unclear ownership
- unclear sequence
- unclear decision rules
- unclear approvals/controls
- document-vs-reality mismatches
- layer-specific gaps
- gap closure plan
- recommended clarification route
- possible Pass 7 review candidates

The result is not failure.

It is an incomplete workflow reconstruction with clear gap diagnosis.

### I.5A.4 Seven-condition relationship

The seven critical completeness conditions do not determine whether a workflow exists.

They determine whether the current workflow understanding is complete enough for a responsible Initial Package.

A workflow may exist in reality but fail one or more seven-condition checks because our understanding is incomplete.

### I.5A.5 Documentation output when workflow is incomplete

Even when the workflow is incomplete or weak, the system may still produce useful documentation-oriented outputs, as long as they are correctly labeled.

Possible outputs include:

- partial workflow reconstruction
- gap analysis document
- clarification plan
- workflow weakness report
- reference/document mismatch report
- documentation recommendation
- conditional/preliminary documentation draft only if evidence maturity allows it

The system must not present incomplete output as a complete workflow package.

### I.5A.6 Automation-readiness relationship

Automation-readiness is not all-or-nothing.

A workflow may be weak or incomplete overall, while some parts are still analyzable for automation potential.

Pass 6B should allow later automation-readiness interpretation by segment, not only for the whole workflow.

Workflow segments may be classified conceptually as:

1. **Human-only / judgment-heavy**
   - Requires human interpretation, negotiation, judgment, empathy, or contextual decision-making.

2. **AI-assisted human work**
   - Human remains responsible, but AI can support drafting, summarizing, checking, routing, comparing, or recommending.

3. **Automation-ready / rule-based**
   - Clear inputs, rules, outputs, ownership, and system path exist; could later support automation.

4. **Not automation-ready yet**
   - The segment may be important, but conditions, ownership, data, rules, or system boundaries are not clear enough.

Important rule:

Automation-readiness should be segment-based.

The system should not assume the whole workflow is automatable or non-automatable.

### I.5A.7 If workflow is not package-ready

If the workflow exists but is not package-ready, the correct output is not “no workflow.”

The correct output is:

- what workflow is currently visible
- what is missing or weak
- which seven conditions are not sufficiently satisfied
- what can still be documented responsibly
- what cannot yet be documented as complete
- what can be considered for AI-assistance or automation later
- what gaps must close before Initial Package or stronger documentation

### I.5A.8 Admin role in this point

The admin should not be forced to manually invent the workflow.

The admin’s role is to decide how to handle the gap:

- accept a partial workflow as a working view
- approve using a partial workflow with warnings if acceptable
- request more clarification
- mark an issue as non-material
- decide between conflicting interpretations when evidence is insufficient
- route material conflict to Pass 7 review
- stop Initial Package generation until gaps are closed
- allow segment-level automation-readiness notes without claiming full workflow automation readiness

Admin decision should be recorded as a decision layer, not as hidden modification of evidence.

### I.5A.9 Governing rule

**If real work exists, a workflow exists. Pass 6B does not decide whether a workflow exists; it decides how complete, clear, documentable, and segment-automation-ready the current workflow understanding is. If the workflow is not ready for Initial Package, the output is a partial workflow reconstruction with gap diagnosis and next-step recommendations, not “no workflow.”**

## I.6 What 6B Outputs

6B should produce a workflow evaluation result, not a final package.

In plain language, 6B outputs:

1. **Synthesized workflow understanding**
   - current best understanding of the real workflow
   - common path
   - known variants
   - major role/layer differences

2. **Difference interpretation**
   - which differences are normal role perspectives
   - which are sequence variations
   - which are real contradictions
   - which are document-vs-reality mismatches
   - which remain unresolved

3. **Seven-condition assessment**
   - which conditions are clear enough
   - which have warnings
   - which are materially broken

4. **Open issue routing recommendation**
   - carry as warning
   - ask participant later
   - ask manager/department/company later
   - route as Pass 7 review candidate
   - block Initial Package for now

5. **Initial Package readiness recommendation**
   - ready for Initial Package
   - ready with warnings
   - not ready; needs more clarification
   - not ready; needs review decision

## I.7 What 6B Must Not Do

6B must not:

- redo Pass 5 extraction
- rewrite Pass 5 evidence
- treat documents as operational truth by default
- evaluate employee performance
- assume higher rank means higher truth
- generate Initial Package content directly
- generate Final Package
- release anything
- create Pass 7 discussion threads
- send questions to participants
- start automation design

## I.8 Simple Closure Sentence for 6B

Use this as the governing closure sentence:

**6B تنتهي عندما نعرف هل الصورة المركبة للـ workflow كافية للانتقال إلى Initial Package، أم تحتاج توضيحًا أو مراجعة قبل ذلك.**

## I.9 6B Output & Routing Decisions

Status:

Conceptual routing model approved for definition. This section explains what 6B should output before moving to 6C.

### I.9.1 Plain Meaning

6B is not only an analysis stage. It is also a routing stage.

After analyzing the prepared Pass 5 outputs, layer views, participant differences, document/source signals, and seven workflow completeness conditions, 6B must answer:

**What should happen next?**

The answer determines whether the case moves to 6C Initial Package, carries warnings, needs clarification, needs management/company-level input, or should create a candidate for Pass 7 review.

### I.9.2 Main 6B Decision Outcomes

6B should produce one primary routing outcome:

1. **`ready_for_initial_package`**
   - Meaning: the workflow is understood well enough to move to 6C.
   - Remaining issues, if any, do not materially break essential workflow understanding.

2. **`ready_for_initial_package_with_warnings`**
   - Meaning: the workflow can move to 6C, but 6C must show explicit warnings, assumptions, unresolved points, or document/reality caveats.
   - This is appropriate when the workflow is documentable but not perfect.

3. **`needs_more_clarification_before_package`**
   - Meaning: at least one missing answer materially prevents understanding the core workflow.
   - This may lead to a later participant, supervisor, manager, department, or company-level clarification route.
   - 6B identifies the need; it does not send the question by itself.

4. **`needs_review_decision_before_package`**
   - Meaning: the issue is not merely missing information; it needs admin/management judgment or formal review.
   - Examples: real contradiction, document-vs-reality conflict, unclear authority, conflicting ownership, or policy-practice mismatch.
   - This may become a Pass 7 review candidate.

5. **`not_enough_basis_for_synthesis`**
   - Meaning: the available accepted Pass 5 outputs are not enough to form a responsible workflow understanding.
   - This is stronger than “has warnings”; it means the system should not produce an Initial Package yet.

### I.9.3 What 6B Should Output

6B should output a reviewable analysis result containing:

1. **Current workflow understanding**
   - current best view of the workflow
   - likely common path
   - known variants
   - role/layer basis for major steps
   - confidence/caveat notes in plain language

2. **Layer-aware difference interpretation**
   - same-layer variations
   - frontline vs supervisor differences
   - frontline vs manager/director differences
   - supervisor vs manager differences
   - document-vs-reality mismatches
   - unresolved evidence gaps

3. **Seven-condition assessment**
   - each condition marked as clear enough, warning, materially broken, or not applicable/unknown
   - explanation of why the condition matters
   - whether the issue blocks Initial Package or only creates a warning

4. **Open item routing list**
   - items to carry as warnings
   - items needing participant follow-up later
   - items needing supervisor/manager/department/company clarification later
   - items recommended as Pass 7 review candidates
   - items not material for the current Initial Package

5. **Primary routing outcome**
   - one of the main 6B decision outcomes above

6. **Reason for outcome**
   - short explanation tied to workflow understanding, layer differences, document signals, and seven-condition assessment

### I.9.4 Clarification Routing Types

When 6B says clarification is needed, it should identify the likely route:

- **participant follow-up** — when the missing detail belongs to a specific participant’s actual work.
- **same-layer clarification** — when peers in the same layer conflict or reveal inconsistent execution.
- **supervisor clarification** — when oversight, review, exception handling, or escalation is unclear.
- **manager clarification** — when approvals, authority, targets, ownership, or controls are unclear.
- **department/company-level clarification** — when the gap affects policy, boundary, use-case definition, or department-wide operating model.
- **external/cross-functional clarification** — when the missing piece belongs to another team, dependency, upstream step, downstream step, or external interface.

6B identifies the route. It does not execute outreach.

### I.9.5 Pass 7 Candidate Routing

6B may recommend a Pass 7 review candidate when the issue needs review/discussion/decision rather than simple clarification.

Examples:

- a real contradiction between role layers that materially affects the workflow
- a document-vs-reality mismatch that requires admin judgment
- unclear ownership between teams
- conflicting approval authority
- policy intent conflicts with actual practice
- the system cannot responsibly decide between competing interpretations

Boundary:

6B may create or recommend a review-routing candidate conceptually, but it must not implement Pass 7 discussion mechanics inside 6B.

### I.9.6 Warning vs Blocker Rule

6B must distinguish warning from blocker.

A warning means:

- the issue should be visible
- the issue may affect confidence, improvement recommendations, or later review
- but the workflow is still understandable enough for an Initial Package

A blocker means:

- the issue materially prevents understanding an essential workflow path, ownership, decision, handoff, approval, or boundary
- Initial Package should not be generated until the issue is clarified or reviewed

Important rule:

A weakness is not automatically a blocker.
Only material breakage of essential workflow understanding blocks 6C.

### I.9.7 What 6B Must Not Do

6B must not:

- send clarification questions
- start participant re-contact
- run Pass 7 issue discussion
- approve a management decision
- generate Initial Package content
- generate Final Package content
- release anything
- resolve contradictions by guessing
- treat document claims as truth by default
- evaluate employee performance

### I.9.8 Simple 6B Routing Sentence

Use this as the governing routing sentence:

**6B لا تكتفي بالتحليل؛ 6B تقرر هل نذهب إلى Initial Package، أو نحمل تحذيرات، أو نحتاج توضيحًا، أو نحتاج مراجعة قبل الحزمة.**

## J. Pass 6A / 6B Readiness Review Before 6C

Status:

Readiness review before moving to Pass 6C.

Purpose:

Check whether Pass 6A and Pass 6B are conceptually complete enough to define Pass 6C — Initial Package — without leaving major gaps in evidence handling, workflow assembly, methodology governance, exceptions, contracts, admin visibility, or routing.

### J.1 Current 6A Understanding

6A is conceptually stable.

Adopted rule:

**6A prepares and sorts accepted Pass 5 outputs for group analysis; it does not synthesize workflow, evaluate completeness, or generate Initial Package.**

6A receives accepted Pass 5 outputs and organizes them into four folders:

1. analysis material
2. boundary / role-limit material
3. gap / risk / no-drop material
4. document / source signal material

6A also carries:

- role/layer context
- truth-lens context
- source/document signals
- open/risk/candidate status

6A must not:

- redo Pass 5
- re-extract evidence
- re-approve evidence
- treat unresolved items as truth
- treat document signals as operational truth
- start synthesis/evaluation/package behavior

Readiness judgment:

6A is ready conceptually for later contract translation.

### J.2 Current 6B Understanding

6B is conceptually strong but contains several areas that must remain explicit before 6C.

Adopted direction:

6B analyzes accepted Pass 5 outputs as a whole case using:

- Claim-Based Layered Workflow Analysis System
- Method Registry
- Conditional Multi-Lens Analysis
- claim scoring / materiality support
- layer-aware interpretation
- document-vs-reality handling
- workflow existence and completeness-level classification
- seven-condition workflow evaluation

6B does not ask whether a workflow exists. If real work exists, a workflow exists. 6B asks how complete, clear, documentable, and segment-automation-ready the current workflow understanding is.

Readiness judgment:

6B is conceptually close to ready, but needs a final explicit output object model and governance/routing boundaries before 6C can be safely defined.

### J.3 What Is Strong Enough

The following areas are strong enough to proceed conceptually:

| Area | Judgment | Notes |
|---|---|---|
| 6A boundary | Strong | Clear separation from Pass 5 and from synthesis. |
| accepted Pass 5 output concept | Strong | Avoids revalidation confusion. |
| four-folder sorting model | Strong | Simple enough for admin and technical translation. |
| layer-aware interpretation | Strong | Prevents flat comparison of roles. |
| truth-lens concept | Strong | Good foundation for role-specific evidence interpretation. |
| claim-based analysis | Strong | Better than person/rank-based weighting. |
| method registry | Strong | Makes analysis configurable and explainable. |
| conditional multi-lens analysis | Strong | Avoids running every method on every claim. |
| workflow existence rule | Strong | Prevents false “no workflow” output. |
| segment-based automation-readiness | Strong | Preserves later value even when the full workflow is incomplete. |

### J.4 Remaining Weak Points Before 6C

The following gaps should be handled before defining 6C fully:

| Gap ID | Gap | Criticality | Current Status | Why It Matters | Blocks 6C? |
|---|---|---:|---|---|---|
| G6AB-001 | 6B final output object is not yet explicitly defined. | 5 | Open | 6C needs a clear input from 6B: workflow understanding, readiness result, gaps, warnings, variants, and review candidates. | Yes |
| G6AB-002 | Seven-condition assessment output levels need final labels. | 4 | Open | 6C must know whether each condition is clear, warning, broken, unknown, or not material. | Yes |
| G6AB-003 | Workflow completeness levels need routing behavior. | 4 | Open | partial/reconstructable/package-ready levels must map to what 6C may or may not do. | Yes |
| G6AB-004 | Admin decision points in 6B need clearer boundaries. | 4 | Open | Need to define when admin can approve warnings vs when review/clarification is required. | Likely |
| G6AB-005 | Method Registry governance needs contract representation later. | 4 | Open | If not represented in contracts/config, it may drift into prompts only. | Not for concept; yes for build |
| G6AB-006 | Scoring must remain advisory and versioned. | 4 | Partially handled | Need final rule that scoring cannot auto-approve Initial Package alone. | Likely |
| G6AB-007 | Document-vs-reality exception handling needs explicit categories. | 3 | Partially handled | SOP/SLA/policy conflicts may be warning, review candidate, or blocker depending on materiality. | Not always |
| G6AB-008 | Segment-level automation-readiness should not leak into 6C as final automation design. | 3 | Partially handled | Pass 6 can note automation potential, but must not become automation implementation. | No if bounded |

### J.5 Exceptions That Must Be Explicit

Pass 6A/6B should explicitly handle these exceptions:

1. **Missing layer evidence**
   - Example: no manager input or no frontline input.
   - Handling: workflow may still be partial/reconstructable, but missing layer is recorded as a gap.

2. **Single-source but role-authoritative claim**
   - Example: only one person owns approval.
   - Handling: not automatically weak; score depends on role fit/directness/materiality.

3. **High-consensus but potentially wrong practice**
   - Example: all frontline staff do the same workaround.
   - Handling: strong reality signal, not necessarily compliant or intended.

4. **Document-only claim**
   - Example: SOP says approval happens but no participant confirms.
   - Handling: document signal only unless supported by reality.

5. **Policy/manager claim without execution confirmation**
   - Handling: intended/control claim, not execution reality by default.

6. **Frontline claim about policy intent**
   - Handling: may be useful, but weaker for policy intent unless corroborated.

7. **Variant path mistaken as contradiction**
   - Handling: classify as Variant when condition/case type explains difference.

8. **Same-layer inconsistency**
   - Handling: may indicate local variation, exception, poor standardization, or unresolved factual conflict.

9. **Partial workflow with useful documentation value**
   - Handling: may produce partial reconstruction/gap report, but not full Initial Package unless conditions allow.

10. **Automation-ready segment inside weak workflow**
   - Handling: can be noted segment-by-segment, but not treated as full workflow automation readiness.

### J.6 Governance Rules Needed Before 6C

Before defining 6C, the following governance rules should be explicit:

1. **No auto-package from score alone**
   - Scores support readiness; they do not approve Initial Package automatically.

2. **Admin judgment is required for material factual conflict**
   - AI may classify and recommend, but should not silently decide material conflicts.

3. **Document claims do not override reality by default**
   - Documents are normative/source signals unless reality supports them.

4. **Partial workflow must be labeled as partial**
   - No fake completeness.

5. **Variants must remain visible**
   - Do not flatten conditional paths into one linear flow.

6. **Every workflow step should preserve its basis**
   - claim source, layer/source basis, method used, confidence/materiality where relevant.

7. **Every method/scoring/prompt result must be versioned**
   - To support future changes and traceability.

8. **6B does not execute outreach**
   - It can recommend follow-up routes, but not send questions.

9. **6B does not implement Pass 7**
   - It can recommend or create review candidates later, but not run review discussion mechanics.

10. **Automation-readiness is advisory and segment-based**
   - Not a full automation design output.

### J.7 Contract Families Likely Needed Later

No coding prompt now, but conceptually Pass 6 will likely need contract families for:

1. `SynthesisInputBundle`
   - accepted Pass 5 outputs prepared for synthesis.

2. `WorkflowClaim`
   - claim text/type/source/layer/evidence basis/materiality/confidence.

3. `AnalysisMethodUsage`
   - method selected, reason, applied target, output, impact, version.

4. `DifferenceInterpretation`
   - Completion / Variant / Normative-Reality Mismatch / Factual Conflict.

5. `AssembledWorkflowDraft`
   - current workflow understanding, steps, variants, source basis, caveats.

6. `SevenConditionAssessment`
   - condition-by-condition completeness judgment.

7. `WorkflowReadinessDecision`
   - ready / ready with warnings / needs clarification / needs review / partial only.

8. `GapClosureRecommendation`
   - who/what should clarify the gap and why.

9. `SegmentAutomationReadinessNote`
   - human-only / AI-assisted / automation-ready / not ready yet.

10. `Pass6AnalysisRunMetadata`
   - policy, method, scoring, prompt, provider, input versions.

### J.8 Readiness Judgment Before 6C

Pass 6A is conceptually ready.

Pass 6B is conceptually strong but not fully closed.

Before moving to 6C, the next required item is:

**Define the 6B Final Analysis Output.**

This output should be the formal bridge from 6B to 6C.

It should answer:

- What workflow draft exists?
- What claims support it?
- What variants exist?
- What gaps/warnings remain?
- How did the seven conditions score?
- What is the readiness decision?
- What can 6C safely use?
- What must 6C not use as complete truth?

### J.9 Recommendation

Do not move to 6C yet.

First, define:

**6B Final Analysis Output / Workflow Readiness Result**

Once that is clear, 6C can be defined cleanly as the stage that consumes that result and produces the Initial Package when allowed.

## K. 6B Final Analysis Output / Workflow Readiness Result

Status:

Approved as the required bridge between 6B and 6C.

Purpose:

6B must end with a clear, reviewable output that tells the system and the admin whether the current workflow understanding can move to 6C Initial Package, move with warnings, stay partial, require clarification, or require review.

This output is the formal bridge from analysis to package generation.

Plain meaning:

**6B does not end with “analysis notes.” 6B ends with a Workflow Readiness Result that says what workflow understanding exists, how strong it is, what remains unresolved, and what 6C is allowed or not allowed to use.**

### K.1 Required Sections

The 6B Final Analysis Output should include the following sections:

1. **Workflow Understanding Summary**
   - current best understanding of the workflow
   - whether it is partial, reconstructable with gaps, package-ready, or not package-ready
   - short explanation of the current state

2. **Assembled Workflow Draft**
   - known workflow steps
   - likely sequence
   - known variants
   - known handoffs
   - known decisions/rules
   - known approvals/controls
   - known systems/tools
   - known start/end boundaries

3. **Claim Basis Map**
   - key claims supporting each workflow step or decision
   - claim type
   - source participant/layer
   - evidence basis from Pass 5
   - method/lens used where relevant
   - confidence/materiality indicators where relevant

4. **Layer and Perspective Summary**
   - frontline execution view
   - supervisor oversight/exception view
   - manager approval/control view
   - director/executive policy/boundary view where available
   - external/cross-functional dependency view where available

5. **Difference and Mismatch Log**
   - Completion
   - Variant
   - Normative-Reality Mismatch
   - Factual Conflict
   - unresolved layer differences
   - document-vs-reality mismatches

6. **Seven-Condition Assessment**
   - condition-by-condition status
   - explanation
   - whether each issue is clear, warning, materially broken, unknown, or not applicable
   - whether each issue blocks 6C or only creates warning/caveat

7. **Gap and Risk Register**
   - missing steps
   - unclear sequence
   - unclear ownership
   - unclear decisions/rules
   - unclear approvals/controls
   - unclear boundaries
   - unresolved document/source signals
   - unsupported high-materiality claims
   - open/risk/no-drop items carried from 6A

8. **Clarification and Review Routing Recommendations**
   - participant follow-up recommended
   - same-layer clarification recommended
   - supervisor clarification recommended
   - manager/department/company clarification recommended
   - external/cross-functional clarification recommended
   - Pass 7 review candidate recommended

9. **Segment-Level Automation-Readiness Notes**
   - human-only / judgment-heavy segment
   - AI-assisted human-work segment
   - automation-ready / rule-based segment
   - not automation-ready yet segment
   - important limitation: this is advisory and segment-based, not full automation design

10. **Readiness Decision**
   - one final primary decision from the allowed decision states

11. **Allowed Use for 6C**
   - what 6C may use as package material
   - what 6C may include only as warning/caveat
   - what 6C must not present as complete truth
   - whether 6C is allowed to generate Initial Package

12. **Analysis Metadata**
   - input bundle version
   - method registry version
   - analysis policy version
   - scoring configuration version
   - prompt version
   - provider/model
   - admin overrides
   - timestamp

### K.2 Workflow Understanding Levels

The output should classify workflow understanding as one of:

1. **`partial_workflow_understanding`**
   - Some workflow elements are clear, but essential gaps remain.
   - 6C usually should not generate a full Initial Package unless admin explicitly accepts a very limited/conditional output later.

2. **`reconstructable_workflow_with_gaps`**
   - Workflow can be reconstructed into a useful draft, but with visible gaps, variants, warnings, or unresolved points.
   - 6C may be allowed if gaps do not materially break essential workflow understanding.

3. **`package_ready_workflow`**
   - Workflow satisfies the seven critical completeness conditions well enough for Initial Package.
   - 6C is allowed.

4. **`workflow_exists_but_not_package_ready`**
   - Workflow exists in practice, but current understanding is too weak, fragmented, contradictory, or incomplete to produce responsible Initial Package.
   - 6C is not allowed except possibly for clearly labeled partial/gap documentation if separately approved later.

### K.3 Readiness Decision States

The 6B Final Analysis Output should produce one primary readiness decision:

1. **`ready_for_initial_package`**
   - 6C may generate Initial Package.

2. **`ready_for_initial_package_with_warnings`**
   - 6C may generate Initial Package, but warnings/gaps/caveats must be visible.

3. **`partial_only_not_package_ready`**
   - A partial workflow/gap report is allowed, but full Initial Package is not allowed.

4. **`needs_more_clarification_before_package`**
   - A missing answer materially prevents responsible Initial Package.

5. **`needs_review_decision_before_package`**
   - A material conflict, mismatch, authority issue, or policy/reality decision must be reviewed before Initial Package.

6. **`workflow_exists_but_current_basis_insufficient`**
   - Real workflow exists, but current accepted evidence is insufficient for responsible package generation.

### K.4 Seven-Condition Status Labels

Each of the seven critical completeness conditions should use simple status labels:

- **`clear_enough`** — sufficient for current Initial Package use.
- **`warning`** — weakness exists but does not block Initial Package by itself.
- **`materially_broken`** — blocks Initial Package unless resolved or explicitly reviewed.
- **`unknown`** — insufficient evidence to assess.
- **`not_applicable`** — not relevant to this workflow/use case.

Rule:

Only `materially_broken` or high-materiality `unknown` should block 6C by default.
Warnings must remain visible but should not automatically block.

### K.5 6C Permission Logic

6C is allowed only when readiness decision is:

- `ready_for_initial_package`
- `ready_for_initial_package_with_warnings`

6C is not allowed by default when readiness decision is:

- `partial_only_not_package_ready`
- `needs_more_clarification_before_package`
- `needs_review_decision_before_package`
- `workflow_exists_but_current_basis_insufficient`

Possible future exception:

A separately approved conditional/partial documentation mode may be added later, but it must not be presented as a full Initial Package.

### K.6 What 6C May Use

If 6C is allowed, it may use:

- assembled workflow draft
- accepted current workflow understanding
- variants marked as variants
- warnings marked as warnings
- seven-condition assessment
- gap/risk register
- document/source caveats
- readiness reason
- segment-level automation-readiness notes if clearly advisory

6C must not use as complete truth:

- unresolved claims
- factual conflicts
- normative-reality mismatches requiring review
- document-only claims not supported by reality
- candidate-only handoff items
- disputed or defective items
- partial workflow sections labeled not ready

### K.7 Admin Role

The admin may:

- accept warnings and allow 6C when the workflow is ready with warnings
- block 6C until clarification is completed
- route material conflict to Pass 7 review
- mark an issue non-material
- require additional method/lens analysis
- request re-analysis with different policy/scoring/method configuration

Admin decision must be recorded as a decision layer and must not erase original evidence or AI analysis.

### K.8 Hard Boundaries

The 6B Final Analysis Output must not:

- generate Initial Package content itself
- generate Final Package content
- hide partial/incomplete status
- flatten variants into one fake workflow
- treat scoring as automatic approval
- treat document claims as operational truth
- resolve material conflicts by guessing
- run Pass 7 discussion mechanics
- send questions or outreach
- create automation design

### K.9 Closure Sentence

Use this as the governing closure sentence:

**6B تنتهي عندما تنتج Workflow Readiness Result واضحًا يقول: ما فهمناه من الـ workflow، ما قوته، ما gaps المتبقية، وهل يُسمح لـ 6C أن ينتج Initial Package أم لا.**

## L. Pre-6C Clarification / Management Inquiry Gate

Status:

Adopted conceptual correction before defining 6C.

Purpose:

6C should not be understood as “generate Initial Package immediately.”

Before an Initial Package is produced, the system must check whether the 6B Workflow Readiness Result allows package generation or requires clarification, review, or admin approval to proceed with warnings.

Plain meaning:

**If the workflow is not complete enough, the next output is not automatically an Initial Package. The next output may be a clarification/inquiry package for participants, department, management, or company-level decision makers.**

### L.1 Why this gate is needed

A workflow may exist in reality but remain incomplete in the system’s understanding.

When 6B finds material gaps, unclear sequence, unclear decision rules, unclear ownership, missing approval logic, or document-vs-reality mismatch, the system should help close those gaps before producing a package.

The admin should have two options:

1. **Ask for clarification before package generation**
   - Send questions by email.
   - Prepare meeting inquiry agenda.
   - Ask targeted participants, supervisors, managers, department owners, company owners, or external/cross-functional roles.

2. **Proceed with Initial Package despite warnings**
   - Allowed only when the admin explicitly approves proceeding on the current basis.
   - The package must clearly show warnings, assumptions, caveats, unresolved items, and evidence limitations.

### L.2 When this gate activates

The gate activates when 6B readiness decision is one of:

- `ready_for_initial_package_with_warnings`
- `partial_only_not_package_ready`
- `needs_more_clarification_before_package`
- `needs_review_decision_before_package`
- `workflow_exists_but_current_basis_insufficient`

For `ready_for_initial_package`, the gate may still show optional warnings or recommended checks, but it should not block by default.

### L.3 Clarification / Inquiry Output Types

The system may produce one or more of the following before 6C package generation:

1. **Participant Follow-Up Question Set**
   - For gaps tied to a specific participant’s actual work.

2. **Same-Layer Clarification Set**
   - For peer-level inconsistencies inside the same role/layer.

3. **Supervisor Clarification Set**
   - For oversight, escalation, exception handling, review, or handoff ambiguity.

4. **Manager / Department Inquiry Set**
   - For ownership, approval, targets, controls, authority, or department-wide operating rules.

5. **Company-Level Inquiry Set**
   - For use-case boundary, policy interpretation, company-wide process ownership, or official documentation direction.

6. **External / Cross-Functional Inquiry Set**
   - For upstream/downstream dependencies, cross-team handoffs, external interface, or ownership outside the selected department.

7. **Meeting Agenda Draft**
   - For gaps better handled through discussion rather than individual questions.

8. **Email Draft / Request Packet**
   - For sending structured questions to company, department, management, or specific participant groups.

### L.4 What each clarification item must include

Every clarification or inquiry item should include:

- the question
- who should answer it
- why it matters
- which workflow step/claim/condition it affects
- whether it blocks Initial Package or only affects warning quality
- example of a useful answer
- related evidence/source basis
- recommended channel: email, meeting, participant follow-up, admin review

### L.5 Admin approval options

The admin may choose:

1. **Send / use clarification request**
   - Approve the generated questions or meeting/email draft for use.

2. **Modify clarification request**
   - Edit wording, target, priority, or channel.

3. **Skip clarification and proceed with warnings**
   - Allowed only when the admin accepts that Initial Package will carry visible caveats.

4. **Route to Pass 7 review candidate**
   - When the issue requires decision/discussion rather than simple factual clarification.

5. **Mark as non-material**
   - If the admin determines that the gap does not affect the current Initial Package.

6. **Stop package generation**
   - If the workflow understanding is not responsible enough to package.

### L.6 Relationship to 6C

This gate sits immediately before 6C package generation.

6C may have two internal modes:

1. **Pre-Package Clarification Mode**
   - Generates clarification/inquiry/request material when 6B says the workflow is not ready enough.

2. **Initial Package Generation Mode**
   - Generates the Initial Package only when readiness allows it or admin explicitly approves proceeding with warnings.

Important rule:

A clarification request, email draft, or meeting agenda is not the Initial Package.
It is a pre-package closure artifact.

### L.7 Sending boundary

Pass 6 may generate or prepare clarification request content, but actual sending should remain admin-approved.

If actual email/message sending is implemented later, it must be a controlled admin action with audit trail, not autonomous AI behavior.

### L.8 Governing rule

**Before 6C generates an Initial Package, the system must check whether unresolved gaps require clarification or review. If they do, the system should produce a targeted clarification/inquiry artifact or require explicit admin approval to proceed with warnings.**

## L.9 Pre-6C Clarification / Inquiry Governance and Contract Model

Status:

Adopted as a required governance section for the Pre-6C Gate.

Purpose:

The Pre-6C Gate must not become a generic AI question writer. It must convert specific unresolved 6B gaps into targeted, reviewable, admin-approved inquiry artifacts.

Plain meaning:

**The AI writes questions only from the approved 6B analysis result, not from free imagination.**

### L.9.1 What the gate consumes

The Pre-6C Gate consumes:

- 6B Workflow Readiness Result
- seven-condition assessment
- gap and risk register
- claim basis map
- difference and mismatch log
- clarification/review routing recommendations
- role/layer context
- method/lens results where relevant
- document/source signals
- admin notes or constraints

### L.9.2 What the gate produces

The gate may produce:

- clarification need list
- participant follow-up question set
- same-layer clarification question set
- supervisor inquiry set
- manager/department inquiry set
- company-level inquiry set
- external/cross-functional inquiry set
- email draft / request packet
- meeting agenda draft
- proceed-with-warnings decision request
- Pass 7 review candidate recommendation

### L.9.3 Question generation basis

Every AI-generated clarification question must be grounded in a specific 6B gap or unresolved item.

Each question must be traceable to:

- the gap it is trying to close
- the workflow step, claim, decision, handoff, boundary, approval, or document mismatch it affects
- the relevant seven-condition item if applicable
- the evidence or claim basis from Pass 5/6B
- the role/layer best positioned to answer
- the reason the selected target should answer it
- the effect of the answer on package readiness

Question generation must not be generic.

### L.9.4 Question target selection logic

The AI should decide who should answer based on the gap type:

| Gap type | Likely target |
|---|---|
| unclear actual execution step | participant / frontline role |
| inconsistent same-layer execution | same-layer participants or supervisor |
| unclear exception or escalation | supervisor / senior role |
| unclear approval, threshold, authority, target, ownership | manager / department owner |
| unclear use-case boundary, policy, official documentation direction | department head / company-level owner |
| upstream/downstream dependency or handoff outside selected department | external/cross-functional role |
| material contradiction needing judgment | admin / Pass 7 review candidate |

The AI may recommend a target, but the admin can change it.

### L.9.5 Question type selection

The AI should select the question type based on the gap:

1. **Open question**
   - Use for complex explanation, decision logic, exception detail, or unclear process meaning.

2. **Open question with helper choices**
   - Use when explanation is needed but the recipient may need simple options.

3. **Choice-based question with optional explanation**
   - Use for ownership, boundary, visibility, responsibility, approval status, or route selection.

4. **Meeting agenda item**
   - Use when the issue is better resolved through discussion than one written answer.

5. **Formal email inquiry**
   - Use when the question is company/department-level, requires official confirmation, or needs multiple stakeholders.

### L.9.6 Required structure of every question

Every generated question must include:

- question text
- target recipient / target role
- why this question matters
- related workflow element
- related gap or seven-condition issue
- expected answer type
- example of a useful answer
- whether the answer is blocking or non-blocking for Initial Package
- evidence/source basis
- recommended channel: participant follow-up / email / meeting / admin review
- priority: high / medium / low

### L.9.7 Question quality rules

Generated questions must be:

- specific
- answerable
- tied to one gap only when possible
- written in participant/manager-friendly language
- not overloaded with internal analysis terms
- not leading toward a preferred answer
- not asking the recipient to guess outside their role
- explicit that “I do not know / not my responsibility / another team handles this” is acceptable where relevant

Bad question example:

- “Explain the onboarding process better.”

Good question example:

- “When the client accepts the quotation, who confirms that the case is ready to move from Sales to Operations, and what condition must be met before that handoff happens? This matters because the current workflow shows the handoff but not the approval/ownership condition. A useful answer could be: ‘The Sales Supervisor confirms readiness after price approval and signed quotation are completed.’”

### L.9.8 Admin approval and modification

The AI-generated questions are drafts until admin approval.

The admin may:

- approve question as-is
- edit wording
- change target recipient or target role
- change channel
- merge duplicate questions
- split overloaded questions
- mark as non-material
- dismiss question
- route to Pass 7 review instead
- approve proceeding with warnings instead of asking

No question should be sent automatically.

### L.9.9 Inquiry response handling

New answers from Pre-6C clarification must not go directly into 6C as unprocessed truth.

They should return as new accepted input through the proper intake/session/clarification path, then trigger re-analysis or update of the 6B Workflow Readiness Result.

Rule:

**New answers update the evidence base first; they do not bypass 6B.**

### L.9.10 Likely contract families later

No coding prompt now, but the gate will likely need contract families such as:

- `PrePackageGateResult`
- `ClarificationNeed`
- `ClarificationQuestionItem`
- `InquiryPacket`
- `EmailInquiryDraft`
- `MeetingAgendaDraft`
- `AdminGateDecision`
- `ProceedWithWarningsApproval`
- `InquiryResponseRecord`
- `PrePackageGateAuditEvent`

### L.9.11 Hard boundaries

The Pre-6C Gate must not:

- generate random/general questions
- send questions without admin approval
- turn a question draft into evidence
- bypass Pass 5/6B evidence handling
- bypass 6B readiness result
- convert admin silence into approval
- produce Initial Package content
- run Pass 7 review mechanics
- treat clarification answers as truth before processing

### L.9.12 Governing sentence

**Pre-6C question generation is a governed gap-closure process. The AI generates questions only from specific 6B gaps, explains why each question matters, targets the role most able to answer, and waits for admin approval before use. New answers must return into the evidence/analysis flow before any Initial Package is generated.**

## L.10 Cross-Department / External Interface Governance

Status:

Critical gap identified and adopted for definition before finalizing 6C.

Purpose:

A selected use case may belong primarily to one department, but still depend on another department, external team, shared service, system queue, approval owner, or downstream/upstream function.

This must be handled explicitly because cross-department intersections affect:

- workflow boundaries
- handoffs
- ownership
- approvals
- responsibility gaps
- clarification routing
- SOP / policy / SLA implications
- Initial Package accuracy

Plain meaning:

**The selected department remains the main workflow scope, but cross-department interfaces must be captured as interface nodes, dependencies, handoffs, approval/control points, or clarification targets when they affect the workflow.**

### L.10.1 Scope rule

Cross-department involvement must not automatically expand the case into a full multi-department workflow.

Default rule:

- The selected department/use case remains the primary scope.
- Other departments are captured only where they touch the selected workflow.
- Their internal workflow is not analyzed unless explicitly approved as a new or expanded scope.

Example:

If Sales hands the onboarding case to Operations, Pass 6 should capture the Sales → Operations handoff, required input/output, ownership transfer, and readiness condition.

It should not automatically analyze the full Operations fulfillment workflow unless the operator explicitly expands the scope.

### L.10.2 Cross-department interface types

Pass 6 should classify cross-department intersections as one or more of:

1. **Input Provider**
   - Another team provides information, approval, data, document, or trigger needed by the selected workflow.

2. **Output Receiver**
   - Another team receives the output or case from the selected department.

3. **Handoff Owner**
   - Ownership or responsibility transfers to another team.

4. **Approval / Control Authority**
   - Another team or role approves, reviews, controls, or blocks progress.

5. **Dependency / Support Function**
   - Another team supports the workflow without owning the main process.

6. **Shared System / Queue Interface**
   - Work moves through a shared queue, CRM, ticketing system, inbox, or system status.

7. **Clarification Target**
   - Another team is the best source to clarify an unresolved handoff, dependency, upstream/downstream step, or control.

8. **Out-of-Scope External Process**
   - The other department has an internal workflow that is visible but outside current case scope.

### L.10.3 How Pass 6B should handle intersections

When cross-department involvement appears, Pass 6B should ask:

- Is this other department inside the selected workflow or only touching it?
- What is transferred: information, ownership, approval, document, case, task, system status, or decision?
- Who sends and who receives?
- What condition must be satisfied before the handoff?
- What output is expected by the receiving side?
- Does the selected department know what happens next, or only the outcome?
- Is the other department needed as a clarification target?
- Does this intersection affect any of the seven critical completeness conditions?

### L.10.4 When to include the other department in the workflow

Include the other department in the workflow as an interface when:

- a handoff crosses to/from that department
- approval/control belongs to that department
- a decision depends on that department
- a required input/output comes from that department
- a shared system/queue creates dependency
- the selected workflow cannot be understood without that intersection

Do not include the other department’s full internal workflow unless:

- the admin explicitly expands the case scope
- the missing internal process materially blocks understanding of the selected workflow
- the project creates a separate linked use case for that department

### L.10.5 Hierarchy and targeting relationship

Cross-department actors should not be forced into the selected department hierarchy as normal internal nodes.

Instead, they may be represented as:

- external interface node
- cross-functional node
- approval/control node
- system/queue node
- clarification target
- linked dependency

If the other department must answer a question, the Pre-6C Gate may generate an external/cross-functional inquiry item.

### L.10.6 Document/SOP implications

When generating Initial Package or later SOP/documentation recommendations, cross-department intersections should appear as:

- interface requirements
- handoff conditions
- input/output expectations
- responsibility boundaries
- approval/control points
- escalation path
- open dependency or external clarification need

The SOP should not describe the other department’s internal process unless that process is part of the approved scope.

### L.10.7 Governance boundaries

The system must not:

- silently expand the case into another department
- analyze another department’s internal workflow without approval
- hide cross-department handoffs
- treat unknown external work as if it were known
- force external actors into the selected department tree
- produce SOP content that overclaims responsibility outside the selected scope

### L.10.8 Governing sentence

**Cross-department intersections are captured as interfaces, dependencies, handoffs, controls, or clarification targets. They affect the selected workflow, but they do not automatically expand the case into a full multi-department workflow unless the admin explicitly approves scope expansion.**

### L.10.9 Cross-Department Evidence Inclusion Rule

Adopted clarification:

The system may need evidence from another department when that department owns a material approval, handoff, input, output, dependency, or control point that affects the selected workflow.

This does not mean the other department becomes part of the main workflow scope.

It means the other department contributes **interface evidence**.

### L.10.10 When cross-department contact can be skipped

The system may avoid contacting the other department when:

- the selected department can clearly explain the interface enough for current Initial Package needs
- the external step is non-material to the core workflow
- the external process is only downstream/upstream context and not needed to understand the selected workflow
- the admin accepts documenting the interface as an assumption or warning
- the package clearly labels the external dependency as unvalidated

### L.10.11 When cross-department contact is recommended

The system should recommend contacting the other department when:

- the handoff condition is unclear
- ownership transfer is unclear
- an external approval or control determines whether the workflow can proceed
- the external department’s input/output is required for the selected workflow
- selected-department participants only know the outcome but not the required interface condition
- document/source signals mention an external dependency that participant reality does not confirm
- the missing external information affects one of the seven critical completeness conditions

### L.10.12 When cross-department contact is mandatory before Initial Package

The system should treat cross-department clarification as blocking when the missing external information materially prevents responsible workflow understanding.

Examples:

- approval authority sits outside the selected department and the approval rule is unknown
- the workflow cannot proceed without an external input, but the input condition is unknown
- handoff ownership is disputed between departments
- downstream receiver requirements are unknown and materially affect the selected department’s output
- document says another department owns a control but participants disagree or do not know

In these cases, 6B/Pre-6C Gate should not silently proceed to Initial Package unless the admin explicitly approves proceeding with visible warnings and limitations.

### L.10.13 How cross-department evidence enters the system

Cross-department evidence may enter through:

1. **Planned participant targeting**
   - If the external interface is known early, Pass 4/Pass 5 may include the external role as an external/cross-functional participant target.

2. **Pre-6C clarification / inquiry**
   - If the need appears during 6B, the Pre-6C Gate may generate a targeted question, email draft, or meeting agenda for the external department.

3. **Admin-provided answer or document**
   - Admin may provide an official answer, document, policy, or note from the external department.

All new answers must return into the evidence/analysis flow and trigger re-analysis or update of the 6B Workflow Readiness Result before package generation.

### L.10.14 How cross-department evidence is used in analysis

Cross-department evidence should be used to clarify:

- interface condition
- handoff requirement
- approval/control rule
- required input/output
- ownership boundary
- dependency status
- external validation of a document/source signal

It should not be used to reconstruct the full internal workflow of the other department unless scope expansion is explicitly approved.

### L.10.15 Admin bypass rule

The admin may choose to proceed without contacting the external department when the risk is acceptable.

If so, the system must record:

- what external evidence was missing
- why it matters
- what assumption is being made
- whether it affects the Initial Package
- whether it should remain as warning, caveat, or later review item
- who approved proceeding despite the gap

Boundary:

Admin bypass does not convert unknown external workflow into known workflow.
It only allows the current package to proceed with explicit limitations.

## M. Pass 6C — Initial Package Concept

Status:

Started. This is the first conceptual definition of 6C after closing 6A, 6B, and the Pre-6C Clarification / Inquiry Gate.

Purpose:

Pass 6C is the stage that produces the **Initial Workflow Package** only when the approved 6B Workflow Readiness Result allows it.

6C is not the analysis engine.
6C is not the clarification gate.
6C is not the review/discussion stage.
6C is not the Final Package.

Plain meaning:

**6C turns an approved, sufficiently understood workflow into a clear Initial Package that can be reviewed and used as the first formal workflow output.**

### M.1 Where 6C Starts

6C starts only after:

1. 6A has prepared accepted Pass 5 outputs.
2. 6B has produced a Workflow Readiness Result.
3. The Pre-6C Gate has either:
   - found no blocking clarification need, or
   - completed/handled required clarification, or
   - received explicit admin approval to proceed with warnings.

6C must not start directly from raw Pass 5 outputs, raw conversations, documents, or unresolved gaps.

6C starts from the approved 6B bridge object:

**Workflow Readiness Result**

### M.2 Allowed Entry Conditions

6C may generate an Initial Package only when the 6B readiness decision is one of:

1. **`ready_for_initial_package`**
   - Workflow understanding is sufficient.
   - 6C may generate the Initial Package.

2. **`ready_for_initial_package_with_warnings`**
   - Workflow understanding is sufficient, but caveats/gaps/warnings must be visible.
   - 6C may generate the Initial Package only if warnings are preserved.

3. **Admin-approved proceed-with-warnings**
   - Admin explicitly accepts continuing despite known limitations.
   - 6C must show assumptions, warnings, gaps, and limitations clearly.

6C must not generate a full Initial Package by default when the decision is:

- `partial_only_not_package_ready`
- `needs_more_clarification_before_package`
- `needs_review_decision_before_package`
- `workflow_exists_but_current_basis_insufficient`

### M.3 What Enters 6C

6C consumes only approved outputs from 6B and Pre-6C Gate decisions.

Inputs include:

- Workflow Understanding Summary
- Assembled Workflow Draft
- Claim Basis Map
- Layer and Perspective Summary
- Difference and Mismatch Log
- Seven-Condition Assessment
- Gap and Risk Register
- Clarification and Review Routing Recommendations
- Segment-Level Automation-Readiness Notes where available
- Readiness Decision
- Allowed Use for 6C
- Analysis Metadata
- Admin proceed-with-warnings approval if applicable

### M.4 What 6C Produces

6C produces an **Initial Workflow Package**.

The Initial Package is a first formal workflow output based on current evidence and analysis.

It may include:

1. **Initial Workflow Summary**
   - concise summary of the current workflow understanding

2. **Initial Workflow Map / Narrative**
   - steps
   - sequence
   - handoffs
   - decisions
   - exceptions
   - systems/tools
   - approvals/controls
   - start/end boundaries

3. **Role / Layer View**
   - how each layer contributes to the workflow understanding
   - frontline, supervisor, manager, director/executive, external/cross-functional where available

4. **Variants and Exceptions**
   - known alternate paths
   - condition-based variants
   - exception paths

5. **Evidence and Claim Basis Summary**
   - high-level explanation of what supports the workflow
   - not every raw claim, but enough traceability for review

6. **Gap / Warning / Caveat Section**
   - unresolved non-blocking gaps
   - warnings accepted by admin
   - document-vs-reality caveats
   - assumptions

7. **Seven-Condition Readiness Summary**
   - condition-by-condition summary in user-facing language

8. **Document / Reference Implication Section**
   - whether existing SOP/SLA/policy/reference appears aligned, weak, missing, or needing review
   - recommendation-first, draft-later principle remains active

9. **Initial Recommendations / Next Actions**
   - clarification needed later
   - review needed later
   - documentation improvement suggestion
   - possible later automation-readiness direction at segment level only

10. **Package Metadata**
   - case ID
   - package ID
   - source readiness decision
   - generated timestamp
   - analysis/prompt/method/scoring versions where relevant

### M.5 What Initial Package Means

Initial Package means:

- the system has enough understanding to present a responsible first workflow output
- the output may still contain warnings, gaps, assumptions, and unresolved items
- it is useful for review, discussion, documentation planning, and next-step decision-making

Initial Package does not mean:

- final workflow truth
- final approved SOP
- final policy
- final SLA
- final package
- release-ready output
- automation design
- production implementation plan

### M.6 What 6C Must Not Do

6C must not:

- redo Pass 5 extraction
- redo 6B analysis
- override 6B readiness decision
- hide warnings or gaps
- convert partial workflow into complete workflow
- treat document claims as reality
- resolve material conflicts by guessing
- create Pass 7 issue discussions
- generate Final Package
- release anything
- create automation execution design
- send clarification questions
- bypass admin proceed-with-warnings approval

### M.7 Relationship to Pre-6C Gate

Pre-6C Gate handles unresolved clarification or inquiry needs before package generation.

6C consumes the result of that gate.

If the gate says clarification is required and no admin override exists, 6C must not generate the Initial Package.

If the admin chooses to proceed with warnings, 6C may generate the package only with visible caveats.

### M.8 Relationship to Final Package

6C produces Initial Package only.

Final Package belongs to a later stage.

The Initial Package may inform later review/finalization, but it must not include final approval, release, or final document closure semantics.

### M.9 Initial 6C Closure Sentence

Use this as the initial governing sentence:

**6C تنتج Initial Workflow Package فقط عندما تسمح نتيجة 6B بذلك، أو عندما يوافق الأدمن صراحة على المتابعة مع التحذيرات. الحزمة الأولية تعرض الفهم الحالي للـ workflow مع الأدلة، التحذيرات، الفجوات، والحدود، لكنها ليست Final Package ولا حقيقة نهائية مغلقة.**

### M.10 Cross-Department / Interface Implications for Initial Package

Adopted requirement:

After adding cross-department/interface governance, the Initial Package must explicitly show external intersections that affect the selected workflow.

The package should not hide external dependencies, and it should not silently expand the case into another department’s full internal workflow.

### M.10.1 What 6C should include when cross-department intersections exist

If the selected workflow touches another department, role, shared service, external interface, or system queue, 6C should include an **Interface / Dependency Section**.

This section should show:

- external department / role / system / queue involved
- type of intersection:
  - input provider
  - output receiver
  - handoff owner
  - approval/control authority
  - dependency/support function
  - shared system/queue interface
  - clarification target
  - out-of-scope external process
- where the intersection occurs in the workflow
- what is transferred or required
- handoff/input/output condition
- known owner or receiving side
- evidence/source basis
- whether it is confirmed, assumed, unclear, or unvalidated
- whether it affects any of the seven conditions
- whether it is a warning, blocker, or non-material note

### M.10.2 What 6C must not include

6C must not:

- describe the other department’s full internal workflow unless scope expansion was approved
- present unknown external steps as known
- turn an external dependency into selected-department responsibility if evidence does not support it
- hide a material external approval/control point
- convert unresolved cross-department uncertainty into clean workflow language

### M.10.3 Package wording rule

The Initial Package should distinguish:

1. **Known selected-department workflow**
   - what the selected department does and owns.

2. **Known interface point**
   - what crosses to/from another department or system.

3. **Unknown external process**
   - what happens beyond the interface but remains out of scope or unvalidated.

4. **External clarification needed**
   - what must be asked later and who should answer.

### M.10.4 Relationship to SOP / documentation implication

If the package later informs SOP or documentation recommendations, cross-department intersections should appear as:

- handoff requirements
- responsibility boundaries
- input/output expectations
- approval/control interfaces
- escalation points
- external dependencies
- open clarification notes

The SOP/documentation recommendation must not claim ownership or procedure for another department unless that scope has been approved.

### M.11 Revised Initial Package Section List

After cross-department/interface logic, the Initial Package should contain these sections:

1. **Initial Workflow Summary**
   - current workflow understanding and readiness basis.

2. **Workflow Scope and Boundary**
   - selected department/use case boundary, start/end, and what is outside scope.

3. **Initial Workflow Map / Narrative**
   - steps, sequence, handoffs, decisions, exceptions, systems/tools, controls, and boundaries.

4. **Role / Layer View**
   - how frontline, supervisor, manager, director/executive, and external/cross-functional roles contribute to understanding.

5. **Interface / Dependency Section**
   - cross-department, external, shared-service, approval, handoff, or system-queue intersections.

6. **Variants and Exceptions**
   - conditional paths and non-standard cases.

7. **Evidence and Claim Basis Summary**
   - high-level traceability for major workflow steps and decisions.

8. **Difference / Mismatch Summary**
   - Completion, Variant, Normative-Reality Mismatch, Factual Conflict where relevant.

9. **Gap / Warning / Caveat Section**
   - unresolved non-blocking gaps, warnings, assumptions, limitations, and admin-approved proceed-with-warnings items.

10. **Seven-Condition Readiness Summary**
   - plain-language summary of the workflow completeness conditions.

11. **Document / Reference Implication Section**
   - SOP/SLA/policy/reference alignment, weakness, missing reference, or review recommendation.

12. **Segment-Level Automation-Readiness Notes**
   - human-only, AI-assisted, automation-ready, or not-ready-yet segments; advisory only.

13. **Initial Recommendations / Next Actions**
   - clarification, review, documentation improvement, future analysis, or later automation-readiness actions.

14. **Package Metadata**
   - case ID, package ID, readiness decision, analysis versions, method/scoring/prompt versions, generated timestamp, and admin approvals where applicable.

### M.12 Initial Package Quality Rules

6C should follow these quality rules:

- It must be clear enough for admin/client review.
- It must not overstate certainty.
- It must preserve warnings and caveats.
- It must label partial or unvalidated areas.
- It must separate current reality from intended process and document signals.
- It must separate selected-department workflow from external interfaces.
- It must keep Initial Package distinct from Final Package.
- It must make the next action clear.

### M.13 6C Readiness for Further Definition

6C is now conceptually started but not yet fully closed.

Before closing 6C, the next required step is to define:

**Initial Package Output Rules and Package Eligibility Details**

This should clarify:

- what minimum sections are required
- what sections are conditional
- how warnings appear
- how partial/interfaced workflow is labeled
- how admin-approved proceed-with-warnings is shown
- how document/reference implications are worded
- what package states or readiness labels are needed later

## M.14 Initial Package Output Rules and Package Eligibility Details

Status:

Draft for operator review.

Purpose:

Define what 6C is allowed to produce, what it must include, what it may include conditionally, and what blocks package generation.

Plain meaning:

**6C should produce a useful Initial Workflow Package only when the workflow understanding is responsible enough. If the workflow is incomplete, 6C must either show warnings clearly, produce a limited/conditional output if approved, or stop and return to clarification/review.**

### M.14.1 Package eligibility rule

6C may generate an Initial Package only when one of the following is true:

1. **6B readiness decision = `ready_for_initial_package`**
   - Full Initial Package is allowed.

2. **6B readiness decision = `ready_for_initial_package_with_warnings`**
   - Initial Package is allowed only if warnings, gaps, assumptions, variants, and caveats remain visible.

3. **Admin-approved proceed-with-warnings**
   - Initial Package is allowed only after explicit admin approval.
   - The package must clearly state what is incomplete, assumed, or unresolved.

6C must not generate a full Initial Package when:

- workflow is `partial_only_not_package_ready`
- workflow needs clarification before package
- workflow needs review decision before package
- current basis is insufficient
- a materially broken seven-condition item remains unresolved
- material factual conflict remains undecided
- material cross-department interface is required but unknown and not admin-approved as warning

### M.14.2 Required sections in every Initial Package

Every Initial Package must include:

1. **Package Status / Readiness Label**
   - ready
   - ready with warnings
   - admin-approved with warnings

2. **Initial Workflow Summary**
   - short summary of the current workflow understanding.

3. **Workflow Scope and Boundary**
   - selected department/use case
   - start point
   - end point
   - known out-of-scope areas

4. **Initial Workflow Map / Narrative**
   - steps
   - sequence
   - decisions
   - handoffs
   - systems/tools
   - controls/approvals
   - exceptions where known

5. **Evidence / Claim Basis Summary**
   - high-level traceability for important steps and decisions.
   - Must not expose excessive raw internal reasoning.

6. **Seven-Condition Readiness Summary**
   - simple condition-by-condition status.

7. **Gap / Warning / Caveat Section**
   - unresolved non-blocking gaps
   - assumptions
   - admin-approved warnings
   - limitations

8. **Next Actions**
   - clarification, review, documentation improvement, or later finalization steps.

9. **Package Metadata**
   - package ID
   - case ID
   - source readiness decision
   - generated timestamp
   - analysis/prompt/method/scoring versions where relevant

### M.14.3 Conditional sections

The following sections appear only when relevant:

1. **Role / Layer View**
   - Include when layer differences materially shaped the workflow understanding.

2. **Interface / Dependency Section**
   - Include when cross-department, shared-service, external, approval, handoff, or system-queue interfaces affect the workflow.

3. **Variants and Exceptions**
   - Include when there are alternate paths, condition-based branches, or exception flows.

4. **Difference / Mismatch Summary**
   - Include when Completion, Variant, Normative-Reality Mismatch, or Factual Conflict was material to the package.

5. **Document / Reference Implication Section**
   - Include when SOP/SLA/policy/reference sources exist, are missing, are weak, or affect package interpretation.

6. **Segment-Level Automation-Readiness Notes**
   - Include only as advisory segment-level notes.
   - Must not become automation design.

7. **Proceed-With-Warnings Approval Note**
   - Required if admin allowed package generation despite warnings or unresolved non-blocking gaps.

### M.14.4 Package status labels

6C package output should use one of these package status labels:

1. **`initial_package_ready`**
   - Workflow understanding is sufficient.

2. **`initial_package_ready_with_warnings`**
   - Package is useful but must preserve warnings and caveats.

3. **`initial_package_admin_approved_with_limitations`**
   - Package proceeds because admin approved despite known limitations.

4. **`initial_package_blocked`**
   - 6C cannot generate package because readiness does not allow it.

5. **`partial_output_only`**
   - The system may produce a partial reconstruction/gap document if separately approved, but not a full Initial Package.

### M.14.5 Warning and assumption rules

Warnings and assumptions must be visible and specific.

Each warning should state:

- what is unclear or unresolved
- why it matters
- what part of the workflow it affects
- whether it affects one of the seven conditions
- whether admin approved proceeding despite it
- what future clarification or review is recommended

Warnings must not be hidden in metadata only.

### M.14.6 Partial workflow rule

If the workflow is partial but still useful, the package must not present it as complete.

It should label sections clearly as:

- confirmed/current understanding
- partial understanding
- assumed with warning
- unresolved
- out of scope
- external interface unvalidated

### M.14.7 Document / reference implication wording

The Document / Reference Implication section should use careful language.

Allowed wording examples:

- “The available SOP appears aligned with the current workflow understanding in these areas...”
- “The reference appears too generic for detailed operational comparison.”
- “Participant reality suggests a mismatch with the documented process.”
- “A documentation update is recommended before final package.”
- “No sufficient reference was available; this package is based primarily on participant evidence.”

Not allowed:

- “The SOP is wrong” unless confirmed through review.
- “The policy is invalid.”
- “The workflow is final.”
- “This document is ready for implementation” unless later stage approves it.

### M.14.8 Cross-department/interface wording

When external interfaces exist, the package must distinguish:

- selected department responsibility
- external department interface
- unknown external internal process
- validated handoff condition
- unvalidated dependency
- clarification needed

Example wording:

“Sales hands the case to Operations after quotation acceptance. The receiving requirements from Operations are not yet fully validated and should remain as an external-interface clarification item.”

### M.14.9 Proceed-with-warnings governance

If admin chooses to proceed despite warnings, 6C must record:

- who approved
- when approved
- what warnings were accepted
- why proceeding was allowed
- what limitations must appear in the package
- whether follow-up is still recommended

Proceed-with-warnings does not erase gaps.
It only permits package generation with visible limitations.

### M.14.10 What blocks Initial Package

6C must block package generation when:

- no Workflow Readiness Result exists
- 6B decision does not allow package and no valid admin override exists
- core sequence cannot be responsibly described
- use-case boundary is materially unknown
- key ownership/handoff is materially unresolved
- key decision/approval rule is materially broken or unknown
- material factual conflict remains unresolved
- required external interface is material and completely unknown
- Pre-6C Gate requires clarification and admin has not bypassed it

### M.14.11 What 6C must not do

6C must not:

- invent missing steps
- hide unresolved gaps
- present partial workflow as complete
- turn document/source claims into operational truth
- treat admin approval with warnings as evidence closure
- generate Final Package
- release package
- implement automation design
- perform Pass 7 review discussion
- send clarification questions
- modify 6B analysis silently

### M.14.12 6C output closure sentence

Use this as the governing sentence:

**6C تنتج Initial Workflow Package فقط إذا كان مسموحًا بذلك من 6B أو بموافقة الأدمن مع التحذيرات. كل package يجب أن يوضح نطاقه، خطواته، أدلته، تحذيراته، فجواته، وأي تقاطعات خارجية، ولا يجوز أن يعرض partial أو unvalidated workflow كأنه مكتمل.**

## M.15 Simplified 6C Output Model

Status:

Adopted simplification after operator clarification.

Purpose:

6C should not be treated as producing many unrelated outputs. The client/admin experience should be simpler.

6C should produce one main package, with a visual representation and optional draft document output only when requested or evidence maturity allows it.

Plain meaning:

**6C produces one main Initial Workflow Package. Other items are either views, sections, appendices, or optional drafts — not separate core outputs.**

### M.15.1 Primary output — Initial Workflow Package

The primary 6C output is one document:

**Initial Workflow Package**

This document contains the sections previously defined, but they are sections inside one package, not separate outputs.

The package should include:

- summary
- scope and boundary
- workflow narrative
- key steps and sequence
- roles and responsibilities
- handoffs and interfaces
- decisions and approvals
- variants and exceptions
- evidence/claim basis summary
- gaps/warnings/assumptions
- document/reference implications
- next actions
- metadata

The purpose is to give the client/admin a usable initial understanding of the workflow in one coherent package.

### M.15.2 Visual output — Workflow Flowchart / Visual Map

6C should also support a visual representation of the workflow.

This should be treated as a view or companion artifact to the Initial Workflow Package, not a separate analysis result.

It may include:

- flowchart
- swimlane-style view where useful
- step sequence
- decision points
- handoffs
- cross-department/interface points
- warnings or unresolved points marked visually

Rule:

The visual workflow must be generated from the same approved workflow understanding used in the Initial Workflow Package. It must not introduce new logic or hide gaps.

### M.15.3 Optional draft operational document

6C may optionally produce a draft operational document when:

- evidence maturity is sufficient
- admin requests it
- 6B/6C determines that drafting is responsible
- the document type is clear enough

Possible draft types:

- SOP draft
- policy draft
- SLA-supporting reference draft
- work instruction draft
- role/responsibility guidance draft
- questionnaire / inquiry set draft

Important rule:

This optional draft is **not** the final document.

It should be clearly labeled as:

- Draft
- Initial draft
- Pre-review draft
- Based on current workflow understanding
- Subject to review/finalization

### M.15.4 Relationship to later review/finalization

The final approved operational document should not be treated as complete inside 6C.

6C may provide an early draft when useful, but later review/finalization should handle:

- issue discussion
- management decision
- conflict resolution
- final wording
- approval
- release/final package logic

This keeps 6C as initial-package stage, not final-package stage.

### M.15.5 If workflow is not ready

If the workflow is not ready for an Initial Workflow Package, 6C should not create a fake full package.

The system may produce a single alternative document:

**Workflow Gap Closure Brief**

This brief may include:

- what is currently known
- why Initial Package is blocked
- what gaps remain
- who should answer
- what clarification questions are needed
- recommended email/meeting/inquiry route
- whether admin can proceed with warnings

Question packets, email drafts, and meeting agendas may be generated as supporting materials, but they are not the main 6C output.

### M.15.6 Final simplified output set

6C should be understood as having only these output categories:

1. **Initial Workflow Package** — main output when allowed.
2. **Workflow Visual Map / Flowchart** — companion view generated from the package understanding.
3. **Optional Draft Operational Document** — only when requested/allowed; not final.
4. **Workflow Gap Closure Brief** — alternative when Initial Package is not allowed.

Everything else is an internal section, appendix, dashboard view, or supporting artifact.

### M.15.7 Governing sentence

**6C is not a factory of many separate outputs. It produces one main Initial Workflow Package, a visual workflow view, and — only when requested or appropriate — an optional draft operational document. If the workflow is not ready, it produces a Workflow Gap Closure Brief instead of pretending the package is complete.**

## N. Pass 6C Readiness Review

Status:

Conceptual readiness review for 6C after simplifying the output model.

Purpose:

Check whether 6C is conceptually complete enough to close the Pass 6 conceptual design, or whether additional governance, exceptions, output rules, or contract families are needed before returning later to technical decomposition.

### N.1 Current 6C Understanding

6C is the Initial Package stage.

It starts only after:

- 6A prepares accepted Pass 5 outputs.
- 6B produces Workflow Readiness Result.
- Pre-6C Gate is satisfied, bypassed with explicit admin approval, or produces a gap-closure output instead of package.

6C does not directly consume raw conversations, raw documents, or unresolved analysis.

### N.2 Current 6C Output Model

6C has four output categories:

1. **Initial Workflow Package**
   - main output when allowed.

2. **Workflow Visual Map / Flowchart**
   - visual companion generated from the same workflow understanding.

3. **Optional Draft Operational Document**
   - generated only when requested or when evidence maturity allows it.
   - draft only, not final.

4. **Workflow Gap Closure Brief**
   - alternative output when Initial Workflow Package is not allowed.

This output model is now conceptually strong because it avoids turning every section into a separate product output.

### N.3 What Is Strong Enough

| Area | Judgment | Notes |
|---|---|---|
| 6C purpose | Strong | Initial Package stage, not analysis or finalization. |
| entry condition from 6B | Strong | Must consume Workflow Readiness Result. |
| Pre-6C Gate relationship | Strong | Clarification/inquiry before package when needed. |
| output simplification | Strong | One main package + visual + optional draft + gap brief. |
| warnings/gaps handling | Strong | Warnings must remain visible. |
| cross-department/interface handling | Strong | Interfaces shown without automatic scope expansion. |
| Initial vs Final distinction | Strong | 6C is not Final Package. |
| draft operational document boundary | Strong | Draft only, request/eligibility based. |

### N.4 Remaining 6C Weak Points Before Closure

The 6C concept is strong, but a few items should be clarified before declaring 6C closed:

| Gap ID | Gap | Criticality | Current Status | Why It Matters | Blocks conceptual closure? |
|---|---|---:|---|---|---|
| G6C-001 | Eligibility for optional draft operational document needs sharper rule. | 4 | Open | We need to know when 6C may draft SOP/policy/SLA-like outputs and when it must only recommend. | Yes |
| G6C-002 | Difference between Initial Workflow Package and Workflow Gap Closure Brief needs final boundary. | 4 | Open | Prevents partial workflow from being mislabeled as package. | Yes |
| G6C-003 | Client-facing vs admin/internal details need separation. | 4 | Open | Claims, scores, method details may overload the client if shown in full. | Yes |
| G6C-004 | Visual map rules need minimal boundaries. | 3 | Open | Flowchart must not hide gaps or create false sequence. | Likely |
| G6C-005 | Package approval/status states need final conceptual labels. | 3 | Open | Helpful for later contracts/UI. | Not fully blocking, but useful |

### N.5 6C Exceptions That Must Be Explicit

6C should explicitly handle these exceptions:

1. **Ready with warnings**
   - Package can be generated, but warnings must be visible.

2. **Admin-approved limitations**
   - Package can proceed despite limitations only when admin approval is recorded.

3. **Partial workflow**
   - Must become Gap Closure Brief or clearly limited output, not full Initial Workflow Package.

4. **External interface uncertainty**
   - Must be labeled as external/interface gap, not hidden.

5. **Document-only basis**
   - Cannot become operational reality unless validated or clearly labeled.

6. **Optional draft document requested too early**
   - If evidence maturity is insufficient, system should recommend document type/contents instead of drafting full SOP/policy/SLA.

7. **Visual map from incomplete data**
   - Visual must mark partial/unresolved/assumed paths.

### N.6 Governance Rules Needed for 6C Closure

Before closing 6C conceptually, the following rules should be stated clearly:

1. **Initial Package is one coherent document**
   - Sections are inside the package, not separate products.

2. **Client-facing output must be readable**
   - Do not expose all internal method/score details by default.

3. **Admin/internal appendix may carry deeper traceability**
   - Claims, scores, method usage, and detailed gaps can be appendix/dashboard material.

4. **Visual map must match the package understanding**
   - No new logic introduced in the diagram.

5. **Optional operational draft must be conditional**
   - Draft only when requested/allowed and clearly labeled as draft.

6. **Gap Closure Brief is not failure**
   - It is the correct output when package is not responsible.

7. **6C does not finalize or release**
   - Final Package/release belong later.

### N.7 Likely Contract Families Later

No coding prompt now, but 6C will likely need later contract families such as:

- `InitialWorkflowPackage`
- `InitialPackageSection`
- `WorkflowVisualMap`
- `PackageWarning`
- `PackageAssumption`
- `PackageInterfaceNote`
- `OptionalDraftDocumentRequest`
- `DraftOperationalDocument`
- `WorkflowGapClosureBrief`
- `ProceedWithWarningsApproval`
- `InitialPackageMetadata`

### N.8 Readiness Judgment

6C is conceptually well-shaped but should not be considered fully closed until three small but important areas are clarified:

1. optional draft operational document eligibility
2. client-facing vs admin/internal detail separation
3. final boundary between Initial Package and Gap Closure Brief

### N.9 Recommendation

Do not move to technical decomposition yet.

Next required conceptual step:

**Define 6C Output Governance: client-facing package vs admin/internal appendix, optional draft document eligibility, and Gap Closure Brief boundary.**

Once that is complete, 6C can be considered conceptually closed.

## O. 6C Output Governance

Status:

Adopted conceptual closure section for Pass 6C.

Purpose:

This section closes the remaining 6C governance questions:

1. What belongs in the client-facing Initial Workflow Package vs admin/internal appendix.
2. When an optional draft operational document may be generated.
3. When the output should be Initial Workflow Package vs Workflow Gap Closure Brief.

Plain meaning:

**6C must produce a useful, clear client/admin package without exposing unnecessary internal analysis complexity, and without overstating incomplete workflow understanding.**

### O.1 Client-Facing vs Admin/Internal Output Split

6C should separate package content into two layers:

1. **Client-facing / main package layer**
   - Clear, readable, decision-useful output.
   - Focuses on workflow understanding, scope, steps, handoffs, decisions, gaps, warnings, and next actions.

2. **Admin/internal traceability layer**
   - Detailed claims, scores, method usage, prompt/method/scoring versions, and deeper evidence traceability.
   - Accessible in dashboard or appendix when needed.

Rule:

The client-facing package should not expose every claim, score, method detail, or internal reasoning step by default.

It should expose enough evidence basis to be credible, but not so much that the output becomes unreadable.

### O.2 Client-Facing Initial Package Should Include

The client-facing Initial Workflow Package should include:

1. **Executive / Workflow Summary**
   - What workflow was analyzed.
   - What the current understanding is.
   - Whether the package is clean, warning-based, or limitation-based.

2. **Scope and Boundary**
   - selected department / use case
   - start point
   - end point
   - out-of-scope areas
   - cross-department interface boundary where applicable

3. **Workflow Narrative / Map Explanation**
   - main steps
   - sequence
   - handoffs
   - decision points
   - approvals/controls
   - systems/tools
   - exceptions and variants where relevant

4. **Roles and Interfaces**
   - selected-department roles
   - cross-department interfaces
   - external/shared-service/system queue dependencies
   - responsibility boundaries

5. **Key Gaps / Warnings / Assumptions**
   - unresolved but non-blocking issues
   - admin-approved limitations
   - assumptions used
   - what should be clarified later

6. **Reference / Document Implications**
   - whether SOP/SLA/policy/reference is aligned, weak, missing, or mismatched
   - recommendation-first language

7. **Next Actions**
   - clarification
   - review
   - documentation update
   - later finalization
   - later automation-readiness exploration where relevant

8. **Package Status and Metadata**
   - readiness label
   - generated date
   - case ID/package ID
   - high-level basis only

### O.3 Admin/Internal Appendix May Include

The admin/internal appendix or dashboard may include:

- full claim list
- claim types
- claim confidence/materiality scores
- detailed method/lens usage
- selected methodology and why
- scoring configuration version
- prompt version
- provider/model
- Pass 5 source anchors
- difference classification detail
- full seven-condition assessment detail
- admin overrides
- proceed-with-warnings approval trail
- raw gap/risk/no-drop references

Rule:

Admin/internal detail should support audit and control, but should not overload the client-facing package unless explicitly included.

### O.4 Optional Draft Operational Document Eligibility

6C may produce an optional draft operational document only when all required conditions are satisfied.

Possible draft types:

- SOP draft
- policy draft
- SLA-supporting reference draft
- work instruction draft
- role/responsibility guidance draft
- questionnaire / inquiry set draft

### O.4.1 Conditions Required to Generate a Draft

A draft operational document may be generated only when:

1. **Admin requests or approves drafting**
   - The system should not automatically generate SOP/policy/SLA drafts as default output.

2. **Document type is clear enough**
   - SOP, policy, SLA-supporting reference, work instruction, role guide, or questionnaire.

3. **Workflow understanding is sufficient for that document type**
   - Not necessarily complete for every possible purpose, but sufficient for the specific draft.

4. **Evidence maturity supports drafting**
   - Key steps, responsibilities, decisions, boundaries, and assumptions are clear enough for a responsible draft.

5. **Warnings and limitations can be shown clearly**
   - If the draft is conditional, it must be labeled as such.

6. **No material blocker remains unresolved for the document’s purpose**
   - Example: do not draft an SOP if core sequence/ownership is materially broken.

### O.4.2 When to Recommend Instead of Draft

6C should recommend a document instead of drafting it when:

- evidence is too weak
- workflow is partial only
- document type is unclear
- ownership/approval is unresolved
- material document-vs-reality mismatch needs review
- external interface is essential but unknown
- admin has not approved draft creation

Recommended output language:

- “SOP draft is not recommended yet; first clarify ownership and handoff conditions.”
- “A documentation update is recommended, but a full draft should wait until the workflow is reviewed.”
- “A policy review is recommended rather than a policy draft because the authority model is unresolved.”

### O.4.3 Draft Labeling Rule

Any operational document produced in 6C must be clearly labeled as:

- Draft
- Initial draft
- Pre-review draft
- Based on current workflow understanding
- Subject to review/finalization

It must not be labeled as final, approved, released, or implementation-ready.

### O.5 Initial Workflow Package vs Workflow Gap Closure Brief

6C must clearly distinguish between:

1. **Initial Workflow Package**
   - Used when workflow understanding is sufficient for a responsible package.

2. **Workflow Gap Closure Brief**
   - Used when workflow exists, but current understanding is not package-ready.

### O.5.1 Initial Workflow Package Criteria

Use Initial Workflow Package when:

- 6B readiness is `ready_for_initial_package`, or
- 6B readiness is `ready_for_initial_package_with_warnings`, or
- admin explicitly approved proceed-with-warnings

And:

- core sequence can be described responsibly
- scope and boundary are clear enough
- key ownership/handoffs are clear enough
- decision/approval logic is clear enough or visibly caveated
- material conflicts are resolved, reviewed, or explicitly accepted with limitations
- external interfaces are validated or clearly labeled as assumptions/warnings

### O.5.2 Workflow Gap Closure Brief Criteria

Use Workflow Gap Closure Brief when:

- workflow exists but is not package-ready
- core workflow understanding is materially incomplete
- seven-condition assessment has materially broken or high-impact unknown items
- Pre-6C Gate requires clarification and no admin bypass exists
- material factual conflict remains unresolved
- material ownership/decision/boundary gap remains unresolved
- essential external interface is unknown

### O.5.3 Gap Closure Brief Contents

Workflow Gap Closure Brief should include:

- what workflow is currently visible
- why Initial Package is not yet responsible
- which seven conditions are weak/broken/unknown
- what specific gaps remain
- who should answer each gap
- recommended clarification questions
- recommended channel: participant follow-up / email / meeting / admin review
- whether package can proceed with warnings if admin accepts risk
- next step to reach Initial Package readiness

### O.5.4 Naming Rule

The system must not label an output as Initial Workflow Package if it is actually a gap closure brief.

If the output’s main purpose is to ask questions, close gaps, or explain why package is blocked, it should be labeled:

**Workflow Gap Closure Brief**

not Initial Workflow Package.

### O.6 Visual Map Governance

The Workflow Visual Map / Flowchart must be generated from the same approved workflow understanding used by the Initial Workflow Package.

Adopted technical direction:

6C visual output should use a portable visual architecture:

- **Workflow Visual Core** — independent visual graph layer.
- **WorkflowGraph JSON** — canonical graph representation and source of visual truth.
- **Mermaid Adapter** — client/document-friendly renderer.
- **React Flow Adapter** — admin-facing interactive renderer.

The core graph model must live outside `apps/admin-web` and must not depend on Mermaid or React Flow internals.

Plain meaning:

The system should not build workflow visuals directly inside Mermaid or React Flow. It should first build one neutral graph model, then convert it to the required visual format.

### O.6.1 WorkflowGraph JSON role

`WorkflowGraph JSON` should represent the workflow visually in a portable way.

It may include:

- graph ID
- title
- nodes
- edges
- node types
- edge types
- labels
- sequence order
- decision points
- handoffs
- cross-department/interface markers
- warning markers
- unresolved markers
- metadata

This model is the reusable visual source that can later support:

- Mermaid rendering
- React Flow rendering
- JSON export
- SVG/PNG export later
- possible BPMN adapter later if needed
- reuse in other internal projects outside this system

### O.6.2 Mermaid renderer

Mermaid should be the default client-facing and document-friendly renderer.

Use Mermaid for:

- Initial Workflow Package visual map
- exported package diagrams
- simple flowchart output
- readable document visuals

Rule:

Mermaid output must be generated from `WorkflowGraph JSON`, not from separate hidden workflow logic.

### O.6.3 React Flow renderer

React Flow should be the admin-facing interactive renderer.

Use React Flow for:

- admin dashboard visual exploration
- clickable workflow steps
- viewing claims/gaps/warnings behind steps
- inspecting interfaces and dependencies
- possible future manual admin correction or annotation views

Rule:

React Flow may own UI interaction, but it must not own workflow truth or reconstruction logic.

### O.6.4 Portability and Dual-Use Requirement

The visual layer should be reusable outside the current product and usable inside this product.

Adopted correction:

The visual system should start small, but it must be designed for two use cases from day one:

1. **Standalone visual-thinking use**
   - The operator can provide a simple `WorkflowGraph JSON` for any project, idea, pass, workflow, or architecture map.
   - The tool can output Mermaid so the operator can visually understand scope, dependencies, and bloat.

2. **WDE Pass 6C package use**
   - The WDE system can generate `WorkflowGraph JSON` from the approved workflow understanding.
   - The same visual core can render client-facing Mermaid diagrams and later admin-facing React Flow views.

This means the visual system should be small and portable, but not throwaway.

Minimum design requirement:

- `WorkflowGraph JSON` should be generic enough for standalone project maps.
- It should also support workflow-specific fields needed by WDE such as step, decision, handoff, interface, warning, unresolved marker, and package metadata.
- WDE should consume the visual core as a module/package rather than embedding visual logic directly inside admin pages.

The visual core should not own WDE analysis logic.
It only visualizes a graph representation that WDE or the operator provides.

### O.6.5 Direct WDE Integration Rule

Adopted clarification:

The visual system is not only a manual external helper. WDE should use it directly during Pass 6C package generation.

Integration meaning:

When Pass 6C generates an Initial Workflow Package, WDE should:

1. Build the approved workflow understanding from the 6B Workflow Readiness Result.
2. Convert that understanding into `WorkflowGraph JSON`.
3. Pass `WorkflowGraph JSON` to the independent `workflow-visual-core` package/module.
4. Generate Mermaid output for the client-facing package/document.
5. Generate React Flow-compatible model for the admin-facing interactive view.
6. Store or expose the original `WorkflowGraph JSON` for reuse, audit, export, and later regeneration.

The output package may therefore contain:

- `workflowGraphJson` — canonical graph source.
- `workflowMermaid` — client/document diagram representation.
- `workflowReactFlowModel` — admin interactive representation.

Important rule:

The same `WorkflowGraph JSON` must be used for both Mermaid and React Flow. Mermaid and React Flow must not be generated from separate logic paths.

Integration ownership:

- WDE owns workflow understanding, package eligibility, and graph content decision.
- `workflow-visual-core` owns graph validation and visual rendering adapters.
- `apps/admin-web` owns interactive display only.
- The visual library must not own workflow analysis, claims, scoring, readiness, package eligibility, or admin approval logic.

Implementation direction later:

WDE should consume `workflow-visual-core` as an external/local package dependency rather than copying its internals into `apps/admin-web`.

### O.6.6 Visual accuracy rules

The visual map must:

- show sequence clearly
- show decision points
- show handoffs/interfaces
- show variants where relevant
- mark unresolved or assumed paths
- distinguish selected-department workflow from external interfaces
- match the package understanding exactly

It must not:

- introduce steps not present in the package understanding
- hide gaps or warnings
- force partial workflow into a clean linear flow
- show another department’s internal process unless scope expansion was approved
- let Mermaid/React Flow rendering choices alter workflow meaning

### O.7 Proceed-With-Warnings Governance

If admin approves proceeding despite warnings, 6C must show:

- that the package is limitation-based
- what warnings were accepted
- who approved proceeding
- when approval happened
- what remains unresolved
- what future clarification/review is recommended

Proceed-with-warnings does not close the gap.
It only allows a package to be produced with visible limitations.

### O.8 Final 6C Closure Rule

6C can be considered conceptually closed when it follows these rules:

- one main Initial Workflow Package when allowed
- Workflow Gap Closure Brief when not allowed
- visual workflow map as companion view
- optional draft operational document only when requested/eligible
- client-facing content separated from admin/internal detail
- warnings and assumptions visible
- external interfaces visible but scope-controlled
- no Final Package/release behavior
- no hidden package generation when readiness is insufficient

### O.9 Governing Sentence

**6C output governance separates the client-facing package from internal traceability, allows optional operational drafts only when requested and evidence-mature, and uses Workflow Gap Closure Brief instead of Initial Package whenever the workflow exists but is not package-ready.**

## 8. Critical Risks Before Starting Next Pass

- Using stale `CURRENT_STATE.md` / `NEXT_PASS.md` content if they conflict with Pass 5 archive.
- Starting Pass 6 as synthesis/evaluation without a formal readiness/scope gate.
- Treating Pass 5 handoff candidates as already-approved synthesis inputs.
- Allowing coding-agent implementation before scope, stop conditions, contracts, and proofs are defined.
- Reopening closed Pass 5 blocks without a confirmed defect.
- Letting provider defaults drift away from the accepted Pass 5 provider direction.

## 9. Proposed Readiness Gate

Pending resource review. Initial proposed gate should require:

1. Authority reconciliation completed.
2. Current accepted baseline confirmed.
3. Next pass title selected.
4. Next pass scope selected.
5. Explicit out-of-scope list approved.
6. Entry inputs defined.
7. Stop conditions defined.
8. Acceptance proofs defined.
9. Provider/prompt governance defined.
10. Coding-agent prompt approved only after the above.

## 10. Pending Operator Decisions

Resolved:

- Pass 6 is adopted as the next official skeleton pass.
- Pass 6 will be planned conceptually as 6A / 6B / 6C before technical block decomposition resumes.
- Pass 6 will use multiple bounded PromptSpecs: Synthesis, Difference Interpretation, Evaluation, Initial Package Drafting, and Admin Explanation.
- Pass 6 will include a separate conversational `Pass6AnalysisCopilotPromptSpec`.
- Pass 6A will produce `SynthesisInputBundle` as the first internal artifact.
- `SynthesisInputBundle` is the code/contract name; admin-facing wording should explain it as accepted Pass 5 outputs prepared for synthesis.
- Pass 6A will treat inputs conceptually as accepted Pass 5 outputs, not as evidence to be revalidated.
- Pass 6A sorts accepted Pass 5 outputs into four folders: analysis material, boundary/role-limit material, gap/risk/no-drop material, and document/source signal material.
- Pass 6A completion rule is adopted: 6A prepares and sorts Pass 5 outputs for group analysis; it does not build workflow synthesis, evaluate workflow completeness, or generate Initial Package.
- Pass 6A remains distinct from 6B seven-condition workflow evaluation.
- The earlier Block 0–14 map is parked as a technical draft, not the current active planning focus.
- No coding-agent prompt is approved or prepared yet.

Current planning rule:

- Complete and stabilize the full Pass 6 concept first.
- Do not continue refining technical blocks until 6A / 6B / 6C are conceptually clear.
- Only after Pass 6 is fully documented do we return to block-by-block technical implementation planning.
- When implementation starts later, each block will be explained and scoped individually before any coding-agent prompt is written.

Pending:

- Define 6C conceptually as including a pre-package clarification/inquiry gate before Initial Package generation.
- Define what enters 6C from the approved 6B Workflow Readiness Result, what Initial Package means, what it includes, and what it must not include.
- Clean or revise 6A wording later if it remains too technical.
- Keep all work in documentation/design mode until the operator explicitly asks to begin implementation-block prompting.

## 11. Live Change Log

| Version | Date | Change |
|---|---|---|
| v0.1 | 2026-04-26 | Created initial live reference structure and seeded accepted Pass 5 baseline for resource review. |
| v0.2 | 2026-04-26 | Corrected authority interpretation: skeleton is broad product map; current Pass 1–5 is analytical-core implementation path. |
| v0.3 | 2026-04-26 | Adopted Pass 6 as Synthesis + Evaluation + Initial Package, executed internally as 6A/6B/6C. |
| v0.4 | 2026-04-26 | Added Pass 6 design notes: document classification carry-forward, PromptSpec governance requirement, and participant differences as workflow-reconstruction evidence rather than employee evaluation. |
| v0.5 | 2026-04-26 | Adopted multiple bounded PromptSpecs for Pass 6: Synthesis, Difference Interpretation, Evaluation, Initial Package Drafting, and Admin Explanation. |
| v0.6 | 2026-04-26 | Added layer-aware difference interpretation: same-layer vs cross-layer differences, frontline/supervisor/manager/director/executive truth-lens distinctions, and hierarchy metadata requirement in Pass 6A input bundle. |
| v0.7 | 2026-04-26 | Adopted truth-lens classification for Pass 6A evidence and added proposed Pass 6 Analysis Copilot as a separate conversational assistant design question. |
| v0.8 | 2026-04-26 | Adopted `Pass6AnalysisCopilotPromptSpec` as a separate conversational, DB-grounded, read-only Pass 6 Copilot distinct from Admin Explanation PromptSpec. |
| v0.9 | 2026-04-26 | Adopted `SynthesisInputBundle` as Pass 6A first internal artifact, carrying trusted evidence, hierarchy/layer metadata, document signals, truth-lens classification, eligibility status, and open/risk items. |
| v0.10 | 2026-04-26 | Added proposed Pass 6 block-based construction architecture: small proofable blocks from readiness/spec finalization through contracts, persistence, input bundle, prompt specs, synthesis, difference interpretation, evaluation, initial package, Copilot, Pass 7 routing candidates, and archive closure. |
| v0.11 | 2026-04-26 | Approved Pass 6 Block 0–14 map as planning baseline; no coding prompt may cover more than one block unless explicitly approved. |
| v0.12 | 2026-04-26 | Adopted 6A Evidence Eligibility Gate as distinct from 6B seven-condition workflow evaluation; eligibility statuses are approved for `SynthesisInputBundle`. |
| v0.13 | 2026-04-26 | Added draft field-level contract for `SynthesisInputBundle`, including top-level object, participant inputs, evidence eligibility, trusted evidence, truth-lens, extraction refs, boundary signals, document signals, open/risk items, eligibility summary, and explicit non-goals. |
| v0.14 | 2026-04-26 | Clarified that Pass 6A must not redo or revalidate Pass 5; it only organizes accepted Pass 5 outputs into analysis folders before cross-participant synthesis. |
| v0.15 | 2026-04-26 | Corrected terminology: use “accepted Pass 5 output” conceptually instead of “trusted evidence”; accepted means processed/statused by Pass 5, not factually proven true. |
| v0.16 | 2026-04-26 | Adopted 6A accepted-output sorting rule: accepted Pass 5 outputs are organized into analysis material, boundary/role-limit material, gap/risk/no-drop material, and document/source signal material without revalidating Pass 5. |
| v0.17 | 2026-04-26 | Confirmed `SynthesisInputBundle` as the code/contract artifact name, with admin-facing wording explained as accepted Pass 5 outputs prepared for synthesis. |
| v0.18 | 2026-04-26 | Added draft Pass 6A stop conditions: consume accepted Pass 5 outputs, sort into four folders, attach hierarchy/layer/truth-lens context, preserve open/risk items, create reviewable bundle, and stop before synthesis/evaluation/package/review behavior. |
| v0.19 | 2026-04-26 | Replaced heavy stop-condition wording with adopted simplified 6A completion rule: 6A prepares and sorts Pass 5 outputs for group analysis; it does not synthesize workflow, evaluate completeness, or generate Initial Package. |
| v0.20 | 2026-04-26 | Simplified Block 1 contract language for `SynthesisInputBundle`: four preparation folders, role/layer context, truth-lens context, preparation summary, and explicit non-goals. |
| v0.21 | 2026-04-26 | Corrected planning sequence: complete and stabilize full Pass 6 documentation first; do not prepare coding-agent prompts until the operator explicitly moves into block-by-block implementation. |
| v0.22 | 2026-04-26 | Corrected planning focus: technical Block 0–14 map is parked as an early draft; active work returns to conceptual definition of 6A/6B/6C before implementation decomposition. |
| v0.23 | 2026-04-26 | Added 6B Output & Routing Decisions: ready for Initial Package, ready with warnings, needs clarification, needs review decision, or not enough basis for synthesis. |
| v0.24 | 2026-04-26 | Added critical correction: 6B routing cannot be finalized before workflow assembly logic is defined; added draft claim-strength factors, sequence assembly rules, same-layer vs cross-layer difference logic, and workflow claim decision options. |
| v0.25 | 2026-04-26 | Adopted workflow existence rule: if real work exists, a workflow exists. Pass 6B classifies completeness/documentability and may produce partial workflow reconstruction, gap closure plan, and segment-level automation-readiness notes rather than “no workflow.” |
| v0.26 | 2026-04-26 | Added 6B Final Analysis Output / Workflow Readiness Result as the formal bridge from 6B to 6C, including workflow understanding levels, readiness decisions, seven-condition labels, 6C permission logic, allowed use, admin role, and hard boundaries. |
| v0.27 | 2026-04-26 | Approved 6B Final Analysis Output / Workflow Readiness Result as the required bridge from 6B to 6C. |
| v0.28 | 2026-04-26 | Added Pre-6C Clarification / Management Inquiry Gate: before Initial Package generation, unresolved gaps may produce targeted participant/department/company questions, email drafts, or meeting agendas, unless admin explicitly approves proceeding with warnings. |
| v0.29 | 2026-04-26 | Added Pre-6C Clarification / Inquiry Governance and Contract Model, including question generation basis, target selection logic, question types, required question structure, admin approval, response handling, likely contract families, and hard boundaries. |
| v0.30 | 2026-04-26 | Started Pass 6C Initial Package Concept: purpose, entry conditions, inputs from 6B, package contents, meaning, non-goals, relationship to Pre-6C Gate, and separation from Final Package. |
| v0.31 | 2026-04-26 | Added Cross-Department / External Interface Governance: cross-department intersections are captured as interfaces, dependencies, handoffs, controls, or clarification targets without automatically expanding the case scope. |
| v0.32 | 2026-04-26 | Updated 6C Initial Package concept to include Interface / Dependency handling, cross-department boundaries, revised package section list, and quality rules after adding external-interface governance. |
| v0.33 | 2026-04-26 | Added draft Initial Package Output Rules and Package Eligibility Details: required/conditional sections, package status labels, warning/assumption rules, partial workflow labeling, document/reference wording, interface wording, proceed-with-warnings governance, blockers, and non-goals. |
| v0.34 | 2026-04-26 | Simplified 6C output model: one main Initial Workflow Package, companion visual workflow map/flowchart, optional draft operational document when requested/allowed, or Workflow Gap Closure Brief when package is not allowed. |
| v0.35 | 2026-04-26 | Added 6C readiness review: 6C is strong but needs final output governance around optional draft eligibility, client-facing vs admin/internal details, visual map boundaries, and Initial Package vs Gap Closure Brief separation. |
| v0.36 | 2026-04-26 | Added 6C Output Governance: client-facing vs admin/internal split, optional draft document eligibility, Initial Workflow Package vs Workflow Gap Closure Brief criteria, visual map governance, and proceed-with-warnings rules. |
