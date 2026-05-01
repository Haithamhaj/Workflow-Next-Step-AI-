# Pass 2A / Pass 2B Intake-Context Enhancement — Core Entry Correction

## Final Status

Accepted, archived, and closed on branch `codex/workspace-shell-sandbox` as of May 1, 2026.

This slice is pending merge if applicable. The final implementation commit in the slice is:

- Block 7 final commit: `e3cf37df5b1e2f3f691ab0e1b38ccfd1a6697d97`

## Core Capability Proven

The simplified entry correction is now implemented and proven:

```text
operator-defined case / known use case
→ CaseEntryPacket
→ formal caseId
→ existing Pass 2B intake-session flow
```

```text
FramingCandidate
→ CaseEntryPacket
→ formal caseId
→ existing Pass 2B intake-session flow
```

The core entry problem is solved without requiring documents, AI, source lineage, or downstream pass changes.

Proven capabilities:

- A company/framing source can exist before `caseId`.
- An operator can create a framing candidate before `caseId`.
- An operator can create a `CaseEntryPacket` from a known case or a framing candidate.
- A `CaseEntryPacket` can promote into a formal `caseId`.
- A promoted case enters the existing Pass 2B intake-session flow.
- The current normal case-first path still works.

## Completed Blocks

### Block 1 — Contracts

- Commit: `5bff95da010058da70287df9443dc519500cc012`
- Summary:
  - Added contract-layer definitions and validators for `AnalysisScope`, `FramingRun`, `FramingSource`, `FramingCandidate`, `CaseEntryPacket`, `SourceToCaseLink`, and `OperatorFramingInput`.
  - Kept existing `CaseConfiguration` behavior unchanged.
- Proof script:
  - `scripts/prove-pass2a-block1-contracts.mjs`

### Block 2 — Persistence

- Commit: `36001d2c78072bd778b4f087bc1472114b966eb7`
- Summary:
  - Added persistence repositories and SQLite/in-memory support for Pass 2A framing records.
  - Preserved existing case-bound `intake_sessions` and `intake_sources` semantics.
- Proof script:
  - `scripts/prove-pass2a-block2-persistence.mjs`

### Block 3 — Framing Source Intake

- Commit: `16fcf5d16c0f92d82e858ece1e1c75e095266e37`
- Summary:
  - Added `@workflow/company-framing`.
  - Added narrow domain helpers for registering `FramingSource` records before `caseId`.
  - Supported manual note, website URL metadata, document metadata, image metadata, and audio metadata without provider execution.
- Proof script:
  - `scripts/prove-pass2a-block3-framing-source-intake.mjs`

### Block 4 — Admin Framing Source Workspace

- Commit: `66b41696377161806e0b704e1f3c1cc2140d30db`
- Summary:
  - Added admin APIs and pages for creating, listing, inspecting, and status-updating `FramingSource` records.
  - Preserved the pre-case boundary: no `caseId`, no intake session, no case-bound `IntakeSource`, and no provider processing.
- Proof script:
  - `scripts/prove-pass2a-block4-admin-framing-sources.mjs`

### Block 5 — Manual Framing Candidate Workspace

- Commit: `ce9275dab32fd9af00402bed5c3185a951e2da90`
- Summary:
  - Added manual/operator creation, listing, inspection, and decision update for `FramingCandidate` records.
  - Carried `AnalysisScope`, source-basis IDs, rationale, risks, recommendation, status, and decision-support scoring.
  - Kept candidates non-truth and pre-case only.
- Proof script:
  - `scripts/prove-pass2a-block5-framing-candidates.mjs`

### Block 6 — CaseEntryPacket + Formal Case Creation

- Commit: `640aa7ce8a39f9d64e26b3681b7847327e0c6088`
- Summary:
  - Added `CaseEntryPacket` creation from known/operator-defined cases and from `FramingCandidate` records.
  - Added promotion from `CaseEntryPacket` into formal `CaseConfiguration` / `caseId`.
  - Confirmed documents are optional and source links are not required.
  - Used traceable `companyProfileRef` values in the form `case-entry-packet:<packetId>` when no document profile reference exists.
- Proof script:
  - `scripts/prove-pass2a-block6-case-entry-promotion.mjs`

### Block 7 — Pass 2B Bridge Smoke Proof

- Commit: `e3cf37df5b1e2f3f691ab0e1b38ccfd1a6697d97`
- Summary:
  - Proved a promoted case appears in existing case listing/API surfaces.
  - Proved an existing Pass 2B intake session can be created for a promoted `caseId`.
  - Proved promotion alone does not create intake sessions or case-bound sources.
  - Added a small visibility link from promoted packet detail to the existing case list.
- Proof script:
  - `scripts/prove-pass2a-block7-pass2b-bridge.mjs`

## Proof Stack

The closure proof stack for this slice is:

```bash
pnpm build:contracts
pnpm --filter @workflow/persistence build
pnpm --filter @workflow/company-framing build
pnpm typecheck
pnpm build
node scripts/prove-pass2a-block1-contracts.mjs
node scripts/prove-pass2a-block2-persistence.mjs
node scripts/prove-pass2a-block3-framing-source-intake.mjs
node scripts/prove-pass2a-block4-admin-framing-sources.mjs
node scripts/prove-pass2a-block5-framing-candidates.mjs
node scripts/prove-pass2a-block6-case-entry-promotion.mjs
node scripts/prove-pass2a-block7-pass2b-bridge.mjs
```

## Boundaries Intentionally Not Built

This slice intentionally did not build:

- AI candidate generation.
- OCR/STT/extraction for pre-case sources.
- Provider jobs.
- `SourceToCaseLink` behavior beyond persistence.
- Automatic derivative `IntakeSource` creation.
- Automatic intake session creation during promotion.
- Participant evidence.
- Pass 6 synthesis/evaluation.
- Package generation.
- RAG/retrieval.
- Automation.
- Pass 3/4/5/6 behavior changes.

## Simplified Operating Rule

- Documents are optional.
- AI is optional.
- Sources are optional.
- The operator can create a case without documents.
- Every approved proposed case becomes its own `caseId`.
- After `caseId` exists, the normal pipeline continues.

## Future Optional Blocks

Future blocks are optional and should be opened only when explicitly requested by the operator:

- `SourceToCaseLink` / lineage when sources are used.
- Pre-case provider/OCR/STT/extraction.
- AI Framing Analysis from documents and operator prompt.
- Interactive Framing Discussion Copilot.
- `AnalysisScope` awareness in Pass 3/4/5/6 if cross-functional cases require it.
- A better dedicated formal case detail route if needed.

## Current Recommendation

Stop here for this slice unless the operator explicitly opens one of the future optional blocks.

The accepted entry correction is now complete:

```text
operator / known case / framing candidate
→ CaseEntryPacket
→ formal caseId
→ existing Pass 2B intake-session flow
```

This is the smallest working solution for company-level intake/context entry without forcing documents, AI, source linkage, or downstream pass changes.
