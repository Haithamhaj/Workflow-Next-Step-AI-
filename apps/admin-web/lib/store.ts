import { createInMemoryStore, type InMemoryStore } from "@workflow/persistence";

// Survive Next.js hot-reloads in dev by persisting to globalThis.
declare const globalThis: typeof global & { __workflowStore__?: InMemoryStore };

export const store: InMemoryStore =
  globalThis.__workflowStore__ ?? (globalThis.__workflowStore__ = createInMemoryStore());
