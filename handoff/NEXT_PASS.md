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

The next pass is Pass 6, but implementation does not start until Pass 6 Block 0 is accepted.

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
