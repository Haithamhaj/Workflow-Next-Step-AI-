# @workflow/integrations

**Owns** (handoff §5.12): adapters to external systems — LLM transport, file
storage, Python sidecar (deferred per Pass 1 scope), any third-party service
clients.

**Does not own:** prompt content (`prompts`), persistence of business records
(`persistence`), feature logic (each domain package).

**Pass 1 status:** skeleton only. LLM transport lands in Pass 3. Python sidecar
is intentionally deferred beyond day one.
