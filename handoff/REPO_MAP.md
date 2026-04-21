# Repo Map — Pass 1 state

## Apps

### `apps/admin-web` (`@workflow/admin-web`)
**Owns:** admin UI shell; all admin-facing routes; Next.js App Router layout and navigation.
**Does not own:** business logic of any kind; data storage; validation rules (those live in `contracts`); state transition enforcement.
**Pass 1 status:** shell only. Dashboard and `/states` import from `contracts`. All other routes are static placeholders.

---

## Packages

### `packages/contracts` (`@workflow/contracts`)
**Owns:** JSON schemas (Draft-07), TypeScript interfaces, Ajv setup, `makeValidator<T>`, ready-to-call validators (`validateCaseConfiguration`, `validateSourceRegistration`), state family enums, cross-package shared types.
**Does not own:** business logic; persistence; LLM calls; UI.
**Pass 1 status:** fully implemented. This is the only non-stub package.

---

### `packages/core-state` (`@workflow/core-state`)
**Owns** (handoff §5.3): state family definitions, transition rules and guards for all state families, allowed-transition maps.
**Does not own:** persistence (who stores the state), case lifecycle coordination, prompt logic.
**Pass 1 status:** stub only (`CORE_STATE_PACKAGE` const). Lands in Pass 2.

---

### `packages/core-case` (`@workflow/core-case`)
**Owns** (handoff §5.4): case lifecycle coordination — creating, loading, advancing a case through its states; orchestrates `core-state` + `persistence`.
**Does not own:** state transition rules themselves (`core-state`), direct storage (`persistence`), source intake (`sources-context`).
**Pass 1 status:** stub only. Lands in Pass 2.

---

### `packages/sources-context` (`@workflow/sources-context`)
**Owns** (handoff §5.5): source intake, timing-tag logic, authority classification, context assembly from registered sources.
**Does not own:** synthesis (`synthesis-evaluation`), package generation (`packages-output`), prompt rendering (`prompts`).
**Pass 1 status:** stub only. Lands in Pass 3.

---

### `packages/sessions-clarification` (`@workflow/sessions-clarification`)
**Owns** (handoff §5.6): clarification session lifecycle, operator follow-up tracking, session state.
**Does not own:** prompt rendering (`prompts`), state transitions (`core-state`), synthesis.
**Pass 1 status:** stub only. Lands in Pass 5.

---

### `packages/synthesis-evaluation` (`@workflow/synthesis-evaluation`)
**Owns** (handoff §5.7): synthesis orchestration, seven-condition evaluation logic.
**Does not own:** prompt content (`prompts`), package generation (`packages-output`), session logic.
**Pass 1 status:** stub only. Lands in Pass 6.

---

### `packages/packages-output` (`@workflow/packages-output`)
**Owns** (handoff §5.8): Initial Package generation, Final Package generation, as-is vs target-state comparison, output shaping.
**Does not own:** review/release decisions (`review-issues` + `core-state`), package eligibility logic (`core-state`).
**Pass 1 status:** stub only. Lands in Pass 6 / 8.

---

### `packages/review-issues` (`@workflow/review-issues`)
**Owns** (handoff §5.9): review issue lifecycle — gap-closure issues, management-inquiry issues, reviewer/operator decisions, release routing.
**Does not own:** state transitions (`core-state`), package contents (`packages-output`), prompt rendering (`prompts`).
**Pass 1 status:** stub only. Lands in Pass 7.

---

### `packages/prompts` (`@workflow/prompts`)
**Owns** (handoff §5.10): prompt registry, versioning, revision linkage, rendering, prompt-input contract validation.
**Does not own:** LLM transport (`integrations`), stage orchestration (each domain package fires its own prompts), persistence of render history (`persistence`).
**Pass 1 status:** stub only. Lands in Pass 4.

---

### `packages/domain-support` (`@workflow/domain-support`)
**Owns** (handoff §5.11): informational/non-company-truth source material, comparative-context shaping, terminology hints. Authority strictly `informational_domain_support`.
**Does not own:** company-truth sources (`sources-context`), evaluation logic (`synthesis-evaluation`), package contents.
**Pass 1 status:** stub only. Lands in Pass 5.

---

### `packages/integrations` (`@workflow/integrations`)
**Owns** (handoff §5.12): adapters to external systems — LLM transport, file storage, Python sidecar (deferred).
**Does not own:** prompt content (`prompts`), persistence of business records (`persistence`), feature logic.
**Pass 1 status:** stub only. LLM transport lands in Pass 3. Python sidecar is deferred beyond day one.

---

### `packages/persistence` (`@workflow/persistence`)
**Owns** (handoff §5.13): storage adapters and repositories for every persisted entity — cases, sources, sessions, packages, review issues, prompt render history, audit trail.
**Does not own:** business logic about when to read/write (each domain package calls the repo), schema definitions (`contracts`).
**Pass 1 status:** stub only. Lands in Pass 2.

---

### `packages/shared-utils` (`@workflow/shared-utils`)
**Owns:** pure, dependency-free cross-cutting utilities — id generation, timestamp helpers, generic `Result` types, small functional helpers.
**Hard rule:** zero imports from any other `@workflow/*` package. If a helper needs a domain type it belongs in that domain package.
**Pass 1 status:** stub only. Utilities added on-demand by later passes.
