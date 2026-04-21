# @workflow/prompts

**Owns** (handoff §5.10): prompt registry, prompt versioning and revision
linkage, rendering of prompt inputs, prompt-input contract validation.

**Does not own:** stage orchestration (each stage package owns when prompts
fire), LLM transport (`integrations`), persistence of historical renders
(`persistence`).

**Pass 1 status:** skeleton only. Registry and rendering land in Pass 4.
