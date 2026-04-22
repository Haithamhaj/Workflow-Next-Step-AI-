# Current State

**Pass 6 (Synthesis + Evaluation + Initial Package) implemented on branch `pass-6-synthesis-evaluation`, pending merge to `main`. Prior baseline: Pass 5 accepted on `main` at `d4db2b3`.**

---

## What exists

### Repo root
- pnpm 9.12.0 workspace; `apps/*`, `packages/*`
- Node >= 20 engine constraint
- TypeScript 5.4.5, ESM (`"type": "module"` everywhere), composite builds with project references
- `tsconfig.base.json`: strict, noUncheckedIndexedAccess, resolveJsonModule, Bundler resolution
- Scripts: `dev`, `build`, `build:contracts`, `typecheck`, `clean`
- `.claude/launch.json` — preview server config; `autoPort: true` (server uses assigned port via `PORT` env var)

---

### `packages/contracts` (complete through Pass 6)
- `src/ajv.ts` — Ajv 8 + ajv-formats configured
- `src/validate.ts` — `makeValidator<T>(schema)` returning `ValidationResult<T>`
- `src/schemas/case-configuration.schema.json` — Draft-07 (sec 8.1/8.2)
- `src/schemas/source-registration.schema.json` — Draft-07 (sec 11.3/11.9/11.10)
- `src/schemas/prompt-registration.schema.json` — Draft-07 (§29.9, §30.16)
- `src/schemas/session-creation.schema.json` — Draft-07 (Pass 5)
- `src/schemas/synthesis-record.schema.json` — Draft-07 *(new Pass 6)*
  - Required: `synthesisId`, `caseId`, `commonPath`, `differenceBlocks`, `majorUnresolvedItems`, `closureCandidates`, `escalationCandidates`, `confidenceEvidenceNotes`
  - Optional: `sessionId`
  - `differenceBlocks[]` — each block has the **five literal §19.3 fields**: `where`, `what`, `participantsPerSide`, `whyMatters`, `laterClosurePath` (no invented fields)
- `src/schemas/evaluation-record.schema.json` — Draft-07 *(new Pass 6)*
  - Required: `evaluationId`, `caseId`, `synthesisId`, `axes`, `conditions`, `outcome`, `readinessReasoning`
  - Optional: `confidenceEvidenceNotes`
  - `axes`: the five §20.4 axes, each one of the four §20.5 states (`strong|partial|weak|blocking`)
  - `conditions`: the seven §20.3 conditions as booleans
  - `outcome`: one of the four §20.11–20.14 outcomes, **operator-supplied** per §20.10 (not derived)
- `src/schemas/initial-package-record.schema.json` — Draft-07 *(new Pass 6)*
  - Required: `initialPackageId`, `caseId`, `evaluationId`, `status`, `outward`, `admin`
  - `outward` — §21.3 five mandatory sections + §21.4 optional `documentReferenceImplication`; **no seven-condition checklist field exists on outward (§21.8 structural enforcement)**
  - `admin` — §21.11 layer: `sevenConditionChecklist` (seven booleans), `readinessReasoning`, optional `confidenceEvidenceNotes`, optional `internalReviewPrompts[]`
  - `status` enum: `not_requested|not_applicable_yet|review_recommended|rebuild_recommended|conditional_early_draft_possible` (§21.5)
- `src/types/states.ts` — state family types unchanged
- `src/types/synthesis-record.ts` — `SynthesisRecord`, `SynthesisDifferenceBlock` *(new Pass 6)*
- `src/types/evaluation-record.ts` — `EvaluationRecord`, `EvaluationAxes`, `EvaluationConditions`, `EvaluationAxisState` const, `EvaluationOutcome` const *(new Pass 6)*
- `src/types/initial-package-record.ts` — `InitialPackageRecord`, `InitialPackageOutward`, `InitialPackageAdmin`, `InitialPackageStatus` const *(new Pass 6)*
- `src/index.ts` — exports `validateSynthesisRecord`, `validateEvaluationRecord`, `validateInitialPackageRecord` *(extended Pass 6)*

---

### `packages/core-state` (implemented Pass 2A)
- `CaseStateTransitions`, `isValidTransition`

---

### `packages/persistence` (extended through Pass 6)
- Prior entity types: `Case`, `Source`, `PromptRecord`, `SessionRecord`
- `StoredSynthesisRecord` extends `SynthesisRecord` with `createdAt` *(new Pass 6)*
- `StoredEvaluationRecord` extends `EvaluationRecord` with `createdAt` *(new Pass 6)*
- `StoredInitialPackageRecord` extends `InitialPackageRecord` with `createdAt` *(new Pass 6)*
- `SynthesisRepository` interface: `save`, `findById`, `findByCaseId`, `findAll` *(new Pass 6)*
- `EvaluationRepository` interface: `save`, `findById`, `findByCaseId`, `findBySynthesisId`, `findAll` *(new Pass 6)*
- `InitialPackageRepository` interface: `save`, `findById`, `findByCaseId`, `findByEvaluationId`, `findAll` *(new Pass 6)*
- `InMemorySynthesisRepository`, `InMemoryEvaluationRepository`, `InMemoryInitialPackageRepository` — Map-based *(new Pass 6)*
- `createInMemoryStore()` factory — now includes `synthesis`, `evaluations`, `initialPackages` *(extended Pass 6)*

---

### `packages/core-case` (Pass 2A), `packages/sources-context` (Pass 3), `packages/prompts` (Pass 4), `packages/sessions-clarification` (Pass 5)
All unchanged.

---

### `packages/synthesis-evaluation` (implemented Pass 6)
- Re-exports `SynthesisRecord`, `SynthesisDifferenceBlock`, `EvaluationRecord`, `EvaluationAxes`, `EvaluationConditions`, `EvaluationAxisState`, `EvaluationOutcome` from contracts; `StoredSynthesisRecord`, `StoredEvaluationRecord`, `SynthesisRepository`, `EvaluationRepository` from persistence
- `createSynthesis(payload, repo)` — validates via `validateSynthesisRecord`, rejects duplicates by `synthesisId`, stamps `createdAt`, returns `SynthesisOutcome`
- `getSynthesis`, `listSynthesis`, `listSynthesisByCaseId`
- `createEvaluation(payload, repo)` — validates via `validateEvaluationRecord`, rejects duplicates by `evaluationId`, stamps `createdAt`, returns `EvaluationOutcomeResult`. **Outcome is taken from the payload unchanged (§20.10 operator-supplied)**; no derivation from axes/conditions
- `getEvaluation`, `listEvaluations`, `listEvaluationsByCaseId`, `listEvaluationsBySynthesisId`
- Dependencies: `@workflow/contracts`, `@workflow/persistence`
- Architecture constraint observed: does NOT import from `core-state`, `core-case`, or `sessions-clarification`

---

### `packages/packages-output` (implemented Pass 6)
- Re-exports `InitialPackageRecord`, `InitialPackageOutward`, `InitialPackageAdmin`, `InitialPackageStatus` from contracts; `StoredInitialPackageRecord`, `InitialPackageRepository` from persistence
- `createInitialPackage(payload, repo)` — validates via `validateInitialPackageRecord`, rejects duplicates by `initialPackageId`, stamps `createdAt`, returns `InitialPackageOutcome`. **Status and seven-condition checklist are both operator-supplied, not derived**
- `getInitialPackage`, `listInitialPackages`, `listInitialPackagesByCaseId`, `listInitialPackagesByEvaluationId`
- Structural §21.8 enforcement: schema gives outward no checklist field; the admin checklist lives on `admin.sevenConditionChecklist`
- Dependencies: `@workflow/contracts`, `@workflow/persistence`

---

### `apps/admin-web` (extended through Pass 6)
- Prior routes and pages (cases, sources, prompts, sessions) unchanged
- `app/api/synthesis/route.ts` — `GET /api/synthesis` + `POST /api/synthesis` (201/400/409) *(new Pass 6)*
- `app/api/synthesis/[id]/route.ts` — `GET /api/synthesis/:id` (404 on miss) *(new Pass 6)*
- `app/api/evaluations/route.ts` + `app/api/evaluations/[id]/route.ts` *(new Pass 6)*
- `app/api/initial-packages/route.ts` + `app/api/initial-packages/[id]/route.ts` *(new Pass 6)*
- `app/synthesis/page.tsx`, `app/synthesis/new/page.tsx`, `app/synthesis/[id]/page.tsx` — list/create/detail with §19.11 required-field rendering on detail *(new Pass 6)*
- `app/evaluations/page.tsx`, `app/evaluations/new/page.tsx`, `app/evaluations/[id]/page.tsx` — detail renders `outcome-panel`, `outcome-badge`, `axis-table`, `seven-condition-admin` *(new Pass 6)*
- `app/initial-packages/page.tsx`, `app/initial-packages/new/page.tsx`, `app/initial-packages/[id]/page.tsx` — detail renders `package-status-panel`, `package-status-badge`, `initial-package-outward` (outward §21.3/§21.4 allow-list, no checklist), `initial-package-admin` (§21.11 with `admin-seven-condition-checklist`) *(new Pass 6)*
- All `/new` forms render `data-testid="validation-errors"` on API 400
- `components/Nav.tsx` — top nav extended with Synthesis, Evaluations, Initial Packages *(extended Pass 6)*
- `next.config.mjs` — `transpilePackages` now includes `@workflow/synthesis-evaluation` and `@workflow/packages-output` *(extended Pass 6)*

---

### Remaining skeleton packages (unchanged)
`review-issues`, `domain-support`, `integrations`, `shared-utils`

---

## What is proven (Pass 6 — on branch `pass-6-synthesis-evaluation`)

| Check | Result |
|---|---|
| `pnpm typecheck` | 0 errors across all packages |
| `POST /api/synthesis` empty body | HTTP 400, Ajv-derived: `"must have required property 'synthesisId'; ...; must have required property 'confidenceEvidenceNotes'"` |
| `POST /api/synthesis` valid body | HTTP 201, `StoredSynthesisRecord` with `createdAt` (record `synth-001`) |
| `POST /api/synthesis` duplicate `synthesisId` | HTTP 409 |
| `GET /api/synthesis/synth-001` | HTTP 200, full record |
| `GET /api/synthesis/does-not-exist` | HTTP 404 |
| `POST /api/evaluations` empty body | HTTP 400, Ajv-derived (7 required fields listed) |
| `POST /api/evaluations` valid body | HTTP 201, outcome `finalizable_with_review` (record `eval-001`) |
| `POST /api/evaluations` duplicate | HTTP 409 |
| `GET /api/evaluations/eval-001` | HTTP 200 |
| `GET /api/evaluations/does-not-exist` | HTTP 404 |
| `POST /api/initial-packages` empty body | HTTP 400, Ajv-derived (6 required fields listed) |
| `POST /api/initial-packages` valid body | HTTP 201, status `review_recommended` (record `pkg-001`) |
| `POST /api/initial-packages` duplicate | HTTP 409 |
| `GET /api/initial-packages/pkg-001` | HTTP 200 |
| `GET /api/initial-packages/does-not-exist` | HTTP 404 |
| `/synthesis/new`, `/evaluations/new`, `/initial-packages/new` | `data-testid="validation-errors"` rendered on missing required field (DOM proof) |
| `/synthesis/synth-001` | Renders §19.11 output: `commonPath`, each difference block's five §19.3 fields, `majorUnresolvedItems`, `closureCandidates`, `escalationCandidates`, `confidenceEvidenceNotes` |
| `/evaluations/eval-001` | Renders `outcome-panel` + `outcome-badge`, `axis-table` (five axes × state), `seven-condition-admin` (dashed-border §21.11-style admin-only section with all seven conditions ✓/✗) |
| `/initial-packages/pkg-001` | Renders `package-status-panel` + `package-status-badge`; `initial-package-outward` contains §21.3 five sections + optional §21.4; `initial-package-admin` contains `admin-seven-condition-checklist` with ✓/✗ + readiness reasoning; **§21.8 structural separation DOM-verified**: outward slice contains no checklist testid, no "Sequence continuity" label text, no ✓/✗ markers — only the explanatory "checklist absent per §21.8" header |
| Prior Pass 5 proof items | All still satisfied |

---

## Open questions

| ID | Question | Recorded |
|---|---|---|
| OQ-001 | `role` enum values (`system`\|`user`) not explicitly enumerated. Operator confirmation required. | 2026-04-22 |
| OQ-002 | `RolloutState` enum values not in spec. Formally deferred by operator. | 2026-04-21 |
| OQ-003 | Session terminal-state looping. Operator confirmation required. | 2026-04-22 |
| OQ-004 | §19.6–§19.9 peer-level enrichment trigger ordering not literal in spec. Pass 6 did not implement enrichment automation; synthesis records are operator-supplied. Revisit if automated enrichment becomes required. | 2026-04-22 |
| OQ-005 | §21.4 conditional-section inclusion triggers not literal. Pass 6 treats `documentReferenceImplication` as strictly optional and operator-supplied. Revisit if spec or operator specifies a rule. | 2026-04-22 |

---

## What is intentionally placeholder

| Item | Location | Deferred to |
|---|---|---|
| `RolloutState` values | `contracts/src/types/states.ts` | Indefinite — formal deferral |
| Automated synthesis enrichment (§19.6–§19.9) | `packages/synthesis-evaluation/` | Deferred pending OQ-004 |
| §20.10 outcome derivation | `packages/synthesis-evaluation/` | Intentionally not implemented — §20.10 is not a deterministic rule; outcome is operator-supplied |
| §21.4 conditional-section automation | `packages/packages-output/` | Deferred pending OQ-005 |
| Review issues | `packages/review-issues/` | Pass 7 |
| 3 remaining package bodies | `packages/{domain-support,integrations,shared-utils}/src/index.ts` | Pass 7+ |

---

## What has NOT been built

- LLM invocation / transport (Pass 7+)
- Review / Issue Discussion (Pass 7)
- Final Package UI (§21.13 — later)
- Release decisions flow (§28.15 exists as a state family; flow is later)
- Real database (all storage resets on server restart)
- Authentication or authorization
- Python sidecar
- CI/CD, tests
