# Workflow Analysis Document Engine

Monorepo for the Workflow Analysis Document Engine. This repository is scaffolded
in passes per `03_Implementation_Handoff_Plan_Coding-Agent-First.md`.

**Current state: Pass 1 — repository skeleton, contracts foundation, admin shell routing.**

## Structure

```
apps/
  admin-web/         Next.js admin shell (minimal routes only in Pass 1)
packages/
  contracts/         JSON Schema + Ajv + TS types (seam contracts)
  core-state/        state families, transition rules (Pass 2)
  core-case/         case lifecycle coordination (Pass 2)
  sources-context/   source intake + timing + context handling (Pass 3)
  sessions-clarification/
  synthesis-evaluation/
  packages-output/
  review-issues/
  prompts/
  domain-support/
  integrations/      LLM/provider adapters
  persistence/       repositories + storage
  shared-utils/      narrow generic helpers only
```

## Prerequisites

- Node.js 20+
- pnpm 9+ (`corepack enable`)

## First-time setup

```sh
pnpm install
pnpm build:contracts
pnpm dev
```

Admin shell runs at http://localhost:3000.

## Pass 1 scope

See `03_Implementation_Handoff_Plan_Coding-Agent-First.md` §14.1.
