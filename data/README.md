# data/

Local artifact storage for Pass 2. Files here are NOT checked into git (see
`.gitignore`). The folder structure is:

- `uploads/`     — raw intake source uploads, keyed by `intakeSourceId`
- `extracted/`   — provider extraction outputs (structured JSON / text)
- `crawls/`      — fetched website page bodies
- `transcripts/` — media transcription outputs (future phase)
- `embeddings/`  — local vector cache (future phase)

Repositories reference these artifacts by path/URI in `storageRef`,
`contentRef`, `inputRef`, `outputRef`, `previewRef`, and `summaryRef`
fields. Nothing in this folder is load-bearing for schema correctness —
deleting the folder only invalidates those refs.

SQLite database files for local dev/test also live in this folder
(`data/workflow.db`, `data/test-pass2.db`, etc.) and are git-ignored.
