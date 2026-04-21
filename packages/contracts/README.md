# @workflow/contracts

**Owns:** JSON Schemas, TypeScript types, Ajv validators, and cross-module seam
contracts. This is the single source of truth for the shape of data that crosses
package boundaries.

**Does not own:** business logic, state transition rules, persistence, UI.

## Pass 1 scope

Only the following are defined here:

- `CaseConfiguration` — minimum creation inputs per spec §8.1.
- `SourceRegistration` — intake registration + timing tags per spec §11.1 / §11.3 / §11.9.
- State family enums — case states (§28.5) plus stub enums for the other families
  named in §28.4. These stubs will be filled in Pass 2.

The seam contracts called out in the handoff plan §7 (session→synthesis,
synthesis→evaluation, evaluation→package, review/release, prompt registry) are
**not** defined in Pass 1. They are added when their consuming packages land.

## Layout

```
src/
  ajv.ts                Ajv instance + format support
  validate.ts           generic validator factory
  schemas/              JSON Schema documents (source of truth)
  types/                hand-written TypeScript types matching the schemas
  index.ts              public surface
```

## Usage

```ts
import { validateCaseConfiguration, CaseState } from "@workflow/contracts";

const result = validateCaseConfiguration(input);
if (!result.ok) console.error(result.errors);
```
