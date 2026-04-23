# Program Master Plan

## Workflow Next Step AI — Post-Pass-9 Extension Program

---

## 1. Purpose

This document is the working master plan for all work that comes **after** the accepted baseline built through Pass 9.

Its purpose is to:

* preserve what is already finished
* separate the closed baseline from the still-incomplete product core
* define the major extension workstreams that remain
* establish priority order and dependencies
* preserve deferred tracks so they are not forgotten
* provide the source from which future passes will be derived one by one

This file is not a rewrite of Passes 1–9.
It is the controlled extension plan built on top of them.

---

## 2. Governing Rule

### 2.1 Closed baseline rule

Passes 1–9 are treated as a **closed baseline**.

They are not open implementation buckets anymore.
They are not to be informally reopened or repurposed.

Any work that happens after this point is an **extension program above the accepted baseline**, not a re-entry into the old pass sequence.

### 2.2 Why this rule exists

Without this rule, future work would blur:

* what was already accepted
* what is still missing
* what is a new capability
* what is a correction versus an extension

This would weaken traceability, planning clarity, and later implementation discipline.

### 2.3 Current repository truth behind this rule

The current repository state already records:

* Pass 9 as the accepted baseline on `main`
* no further defined next pass after Pass 9

That means the baseline is closed and the next program must be defined explicitly before new implementation begins.

---

## 3. Current Baseline Snapshot

### 3.1 What is already complete

The accepted baseline already includes:

* core workflow analysis structure
* initial and final package baseline
* review / issue discussion baseline
* release-state separation
* client-facing package preview surface
* package delivery surface on top of accepted package logic

### 3.2 What this baseline means

The system already has a real backbone.
It is no longer just a concept.
It already contains:

* workflow-first logic
* package-first output logic
* human-governed review and release logic
* a visible client-facing delivery surface

### 3.3 What the baseline does **not** mean

The accepted baseline does **not** mean the full product is complete.

The repository still clearly shows unfinished areas such as:

* unresolved governance questions
* incomplete prompt-system maturity
* unbuilt domain-support logic
* unfinished channel-delivery layer
* missing productionization foundations such as real DB/auth/CI

---

## 4. What Is Still Not Finished

The product is **not** complete yet in the following areas:

### 4.1 Governance closure is not finished

Several open implementation questions still exist and directly affect:

* prompt-role semantics
* clarification loop behavior
* enrichment trigger logic
* conditional document-implication automation

These must not remain open forever if the analytical core is to become dependable and extensible.

### 4.2 The analysis kernel is not finished

The system has strong workflow logic, but it still lacks a full operationalized analysis toolkit for:

* terminology handling
* artifact interpretation
* contradiction typing
* threshold interpretation
* ownership and handoff reasoning
* document-direction reasoning

### 4.3 The prompt system is not finished

A prompt registry exists, but a full prompt system does not yet exist.

What is still missing includes:

* domain overlays

* company overlays

* use-case overlays

* structured persona logic by context

* compiled prompt governance

* prompt-chain discipline

* prompt evaluation and review harness

### 4.4 Domain support is not finished

The system direction clearly supports a non-authoritative domain-support layer, but the actual domain-support package is still not built as a real working layer.

### 4.5 Channel delivery is not finished

Channels such as Telegram or other interaction adapters are not yet built as a complete interaction layer.

### 4.6 Productionization is not finished

The system still lacks:

* real database persistence

* authentication / authorization

* CI / automated tests

* broader deployment hardening

---

## 5. Program Philosophy

### 5.1 The next program is core-first

The next program must finish the **core analytical intelligence** before expanding transport and operating layers too early.

### 5.2 The heart of the product is not the channel

Telegram, chat interfaces, and interaction delivery matter.
But they are not the heart of this system.

The heart is:

* governed analysis
* workflow understanding
* terminology interpretation
* clarification logic
* prompt intelligence
* output quality

### 5.3 Transport follows intelligence

If channels are built too early, the product risks becoming:

* interactive but shallow
* usable but analytically weak
* convenient but inconsistent

Therefore the next program must first strengthen the internal core.

### 5.4 Deferred does not mean forgotten

Some tracks will be deferred.
Deferred does **not** mean dropped.
Deferred means:

* recorded
* preserved
* intentionally sequenced later

---

## 6. Core Workstreams

## Workstream A — Governance Closure

### Purpose

Close the open questions that still affect correctness, interpretation, or controlled progression.

### Why it matters

If these items remain open, later prompt logic, analysis logic, and package logic may be built on unstable assumptions.

### Main scope

This workstream closes or formalizes at minimum:

* prompt role enum direction
* session terminal-state looping behavior
* enrichment trigger logic
* document implication auto-activation logic
* any adjacent unresolved logic that materially affects correctness of analysis or output eligibility

### What it will produce

* explicit decisions
* updated authority files
* reduced ambiguity before further build
* a cleaner foundation for later prompt and analysis work

### What it must not do

* broad UI rewrites
* channel implementation
* productionization work
* speculative new business features

---

## Workstream B — Analysis Kernel & Terminology Toolkit

### Purpose

Turn analysis from a broad concept into a governed, reusable kernel.

### Why it matters

The product’s real value depends on how it interprets workflow reality, references, terminology, thresholds, contradictions, and ownership structure.

### Main scope

This workstream defines and builds at minimum:

* terminology interpretation framework
* domain lexicon model
* company lexicon model
* artifact taxonomy
* contradiction classification logic
* threshold / decision-rule interpretation toolkit
* ownership / handoff analysis lens
* workflow-boundary reasoning layer
* document-direction reasoning layer
* evidence-strength interpretation patterns

### What it will produce

* reusable analysis modules
* clearer interpretation logic
* stronger case-level consistency
* better foundations for follow-up questions, synthesis, evaluation, and document direction

### What it must not do

* replace the core package boundaries
* turn into a generic consulting framework
* become a vague “AI understanding” layer with no operational outputs

---

## Workstream C — Prompt System Architecture

### Purpose

Upgrade the current prompt registry into a real prompt system.

### Why it matters

The system already has prompt-registry foundations, but not a full prompt architecture capable of supporting domain-aware, company-aware, and use-case-aware reasoning safely.

### Main scope

This workstream defines and builds at minimum:

* base persona model
* domain overlays
* company overlays
* use-case overlays
* clarification-style families
* analysis-stage prompt families
* synthesis/evaluation drafting families
* compiled prompt structure
* prompt explainability structure
* prompt review packets
* prompt evaluation harness
* prompt-chain dependency mapping

### What it will produce

* a governed prompt system
* reusable prompt families
* context-aware analytical behavior
* better consistency across domains and companies

### What it must not do

* override locked state/review/release logic
* bury governance decisions in prompt text
* become an uncontrolled personality playground

---

## Workstream D — Channel & Interaction Delivery

### Purpose

Add interaction channels as transport adapters above the governed core.

### Why it matters

The system needs practical communication paths for participants and management, but channels must remain subordinate to core logic.

### Main scope

This workstream may include:

* Telegram transport
* later additional transport adapters where justified
* channel traceability
* inbound/outbound mapping
* participant-safe rendering
* admin-controlled channel selection
* fallback routing across channels when needed

### Main rule

Channels are transport-only.
They must not become alternate logic centers.

### What it will produce

* controlled interaction surfaces
* reusable transport adapters
* better operational usability
* easier participant and management outreach

### What it must not do

* create separate per-channel workflow engines
* own package eligibility or review logic
* alter core analytical judgment through channel behavior

---

## Workstream E — Productization Foundation

### Purpose

Make the system structurally ready for real operational use.

### Why it matters

Even a strong analytical product remains fragile without real persistence, access control, and repeatable validation.

### Main scope

This workstream may include:

* real database persistence
* authentication / authorization
* audit hardening
* CI / automated tests
* deployment discipline
* environment hardening
* future sidecar or local-tool integration when earned

### What it will produce

* stronger reliability
* safer growth
* repeatable verification
* better readiness for real deployment

### What it must not do

* start before the analytical core becomes more mature
* distract from unresolved core intelligence issues
* become a substitute for missing product logic

---

## 7. Deferred but Preserved Tracks

The following tracks are intentionally preserved here so they remain visible for later work.

They are **not** being dropped.

### 7.1 Channels

* Telegram
* later additional transport channels where justified
* email refinements where needed
* participant-vs-management channel policy refinement

### 7.2 Automation-adjacent work

* automation-supportive workflow strengthening
* later automation preparation support
* downstream execution-support artifacts
* future automation-related extensions when earned

### 7.3 Skills layer

The earlier discussion around “skills” is preserved as a later extension path.

At this stage, it should be treated as a later structured capability layer that may sit on top of:

* governed analysis logic
* domain-specific interpretation
* prompt system maturity
* explicit capability boundaries

Skills should not be built before the underlying analytical and prompt core is strong enough to support them safely.

### 7.4 Additional integrations

* local model helpers
* auxiliary preprocessing tools
* future adapter expansion
* optional specialized tooling

These remain secondary to the core program.

---

## 8. Priority Order

The official priority order for the extension program is:

### Priority 1

**Governance Closure**

### Priority 2

**Analysis Kernel & Terminology Toolkit**

### Priority 3

**Prompt System Architecture**

### Priority 4

**Channel & Interaction Delivery**

### Priority 5

**Productization Foundation**

### Why this order is correct

This order protects the product from growing outward before its inner logic is stable enough.

In practical terms:

* first close ambiguity
* then strengthen analysis
* then strengthen prompts
* then expose channels
* then harden for broader use

---

## 9. Dependency Map

### 9.1 Governance Closure dependencies

Depends on:

* current baseline only

Unblocks:

* Analysis Kernel
* Prompt System Architecture

### 9.2 Analysis Kernel dependencies

Depends on:

* Governance Closure

Unblocks:

* Prompt System Architecture
* better channel behavior later
* better document direction and package quality

### 9.3 Prompt System Architecture dependencies

Depends on:

* Governance Closure
* Analysis Kernel

Unblocks:

* Channel Delivery
* Skills track
* better domain/company adaptation

### 9.4 Channel Delivery dependencies

Depends on:

* stable enough prompt and analysis core

Unblocks:

* practical operational rollout
* easier participant and management interaction

### 9.5 Productization dependencies

Depends on:

* sufficiently mature core and interaction model

Unblocks:

* deployment confidence
* operational reliability
* broader real-world rollout

---

## 10. What Starts Now

The work that starts now is:

# Workstream A — Governance Closure

This is the first extension workstream after the closed Pass 1–9 baseline.

### Why it starts first

Because unresolved correctness-level questions must be settled before further core expansion is safe.

### Immediate next implementation translation

The first future implementation pass derived from this master plan should be:

**Pass 10 — Governance Closure**

Its scope should be limited to:

* resolving the currently open correctness-relevant questions
* recording the resulting decisions cleanly
* updating authority files accordingly
* not widening into prompt implementation, channel work, or productization

---

## 11. What Explicitly Does Not Start Now

The following do **not** start now:

* Telegram implementation
* multi-channel expansion
* automation implementation mapping
* skills implementation
* broad productization work
* real DB/auth/CI implementation
* speculative feature growth outside the core workstreams

This is deliberate.
The current step is core-first, not breadth-first.

---

## 12. Rules for Deriving Future Passes

### 12.1 One pass at a time

Future passes must remain narrow and inspectable.

### 12.2 No reopening of baseline passes

Passes 1–9 are closed baseline.
Future passes must be extension passes above them.

### 12.3 One workstream at a time unless tightly coupled

Do not bundle multiple large workstreams into one pass.

### 12.4 Passes must come from this plan

No new pass should start unless it can be traced back to one of the workstreams or preserved tracks defined here.

### 12.5 Deferred tracks must remain visible

If a track is deferred, it should stay visible in this master plan rather than disappearing into memory.

---

## 13. Success Definition for This Extension Program

This extension program is succeeding when:

* the remaining governance ambiguity is closed
* the analytical core becomes sharper and more reusable
* the prompt system becomes governed and context-aware
* channels are added without becoming logic owners
* productionization happens on top of a stronger core, not instead of it
* deferred tracks remain visible and intentionally sequenced
* future passes remain derived, controlled, and traceable

---

## 14. Practical Program Summary

The baseline system is already real.
What remains is not random leftover work.
What remains is the finishing of the true product heart.

That heart is:

* governed analysis
* terminology intelligence
* prompt architecture
* controlled interaction delivery
* later production hardening

The correct sequence is therefore:

1. close ambiguity
2. strengthen analytical intelligence
3. strengthen prompt intelligence
4. add channels
5. harden the product

This document is the master reference for that sequence.
