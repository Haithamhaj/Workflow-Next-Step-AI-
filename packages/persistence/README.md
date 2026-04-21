# @workflow/persistence

**Owns** (handoff §5.13): storage adapters and repositories for every
persisted entity — cases, sources, sessions, packages, review issues, prompt
render history, audit trail.

**Does not own:** business logic about *when* to read/write (each domain
package), schema definitions (`contracts`).

**Pass 1 status:** skeleton only. Storage backend selection and repositories
land in Pass 2.
