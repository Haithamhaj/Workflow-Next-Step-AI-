# Pass 2 Local Persistence and Artifact Storage

This document records local development storage for Pass 2 intake/context proofs.

## Local SQLite database

- Default local database path: `apps/admin-web/data/intake-phase2.sqlite`.
- Override path: set `WORKFLOW_INTAKE_SQLITE_PATH=/absolute/path/to/dev.sqlite`.
- The SQLite database is initialized automatically by `packages/persistence` when the admin app or proof scripts open the repositories.
- Development reset: stop the app, then remove only the development database selected by `WORKFLOW_INTAKE_SQLITE_PATH` or the default `apps/admin-web/data/intake-phase2.sqlite`.
- Reset is development-only. Do not use file deletion as a production persistence strategy.
- Future production persistence is expected to use the same repository boundary with a durable database adapter such as Supabase/Postgres.

## Local artifacts

- Uploaded file metadata is stored in SQLite as `IntakeSource` records.
- Uploaded file bytes in the current admin-web implementation are transient process memory for immediate extraction proof use; they are not committed and are not the long-term artifact store.
- Extracted document/OCR text, raw transcripts, trusted transcripts, manual-note structured output, embedding metadata, and crawl summaries are stored as SQLite `TextArtifactRecord` payloads.
- Website crawl plans, approvals, page content, site summaries, chunks, embedding jobs, audio reviews, structured context records, and final pre-hierarchy reviews are stored in SQLite tables managed by `packages/persistence`.
- Embedding vectors are represented by provider output references/artifact metadata in local proof mode; external vector-store storage is a later production adapter concern.

## Git hygiene

- Do not commit `.env.local` or any API key.
- Do not commit local SQLite databases, WAL/SHM files, uploaded source files, transcripts, or generated proof artifacts.
- `data/test-pass2.db` and local proof databases under `/tmp` are proof artifacts only.
- Secrets may be loaded from `.env.local` for proofs, but proof logs and handoff files must include only environment variable names, never secret values.

## Source-role vocabulary

`AIIntakeSuggestion.suggestedSourceRole` is intake triage only. It is not a reference-suitability judgment, workflow analysis, or document-quality score.

Approved Pass 2 AI source-role values:

- `company_overview`
- `company_context`
- `org_signal`
- `policy_reference`
- `department_note`
- `audio_transcript`
- `website_url`
- `general_intake_source`

`company_overview` is intentional and documented. It means the source appears to summarize who the company is or what it does at a company level. Admin decisions may confirm, edit, override, or mark the suggestion for review while preserving the original AI suggestion.
