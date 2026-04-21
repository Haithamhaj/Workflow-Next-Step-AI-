/**
 * Prompt registry — Pass 4 implementation.
 * Spec refs: §29.9 (Prompt Registry Contract), §30.6 (module purposes),
 *            §30.7 (Prompt Unit Definition Rule), §30.16 (Prompt-to-Contract Binding Rule).
 *
 * Architecture constraint: this package must not import from core-state or core-case.
 * Validation uses makeValidator<T> from @workflow/contracts (CLAUDE.md rule).
 */

import {
  validatePromptRegistration,
  type PromptRegistration,
  type PromptRole,
} from "@workflow/contracts";
import type { PromptRecord, PromptRepository } from "@workflow/persistence";

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export type {
  PromptRegistration,
  PromptType,
  PromptRole,
  PromptStatus,
} from "@workflow/contracts";

// ---------------------------------------------------------------------------
// registerPrompt
// ---------------------------------------------------------------------------

export interface RegisterPromptResult {
  ok: true;
  prompt: PromptRecord;
}

export interface RegisterPromptError {
  ok: false;
  error: string;
}

export type RegisterPromptOutcome = RegisterPromptResult | RegisterPromptError;

/**
 * Validate a PromptRegistration payload, check for duplicate ID, and persist.
 * Returns the saved PromptRecord (with registeredAt) on success, or an error.
 */
export function registerPrompt(
  payload: unknown,
  repo: PromptRepository
): RegisterPromptOutcome {
  // Validate against JSON Schema via makeValidator<T>
  const result = validatePromptRegistration(payload);
  if (!result.ok) {
    const messages = result.errors.map((e) => e.message ?? String(e)).join("; ");
    return {
      ok: false,
      error: `Invalid PromptRegistration: ${messages}`,
    };
  }

  const registration: PromptRegistration = result.value;

  // Duplicate-ID check
  const existing = repo.findById(registration.promptId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Prompt with id '${registration.promptId}' is already registered.`,
    };
  }

  const record: PromptRecord = {
    ...registration,
    registeredAt: new Date().toISOString(),
  };

  repo.save(record);
  return { ok: true, prompt: record };
}

// ---------------------------------------------------------------------------
// getPrompt
// ---------------------------------------------------------------------------

/**
 * Lookup a prompt by its promptId. Returns null if not found.
 */
export function getPrompt(
  promptId: string,
  repo: PromptRepository
): PromptRecord | null {
  return repo.findById(promptId);
}

// ---------------------------------------------------------------------------
// listPrompts
// ---------------------------------------------------------------------------

/**
 * Return all registered prompts.
 */
export function listPrompts(repo: PromptRepository): PromptRecord[] {
  return repo.findAll();
}

// ---------------------------------------------------------------------------
// listPromptsByRole
// ---------------------------------------------------------------------------

/**
 * Return prompts filtered by role (e.g. "system" or "user").
 * See OQ-001 in handoff/OPEN_QUESTIONS.md for the open question on role enum values.
 */
export function listPromptsByRole(
  role: PromptRole,
  repo: PromptRepository
): PromptRecord[] {
  return repo.findByRole(role);
}

// ---------------------------------------------------------------------------
// Authority / role classification helpers
// ---------------------------------------------------------------------------

/**
 * True when this prompt occupies the "system" LLM message role.
 * See OQ-001 for open question on whether these are the correct role values.
 */
export function isSystemPrompt(prompt: PromptRecord): boolean {
  return prompt.role === "system";
}

/**
 * True when this prompt occupies the "user" LLM message role.
 * See OQ-001 for open question on whether these are the correct role values.
 */
export function isUserPrompt(prompt: PromptRecord): boolean {
  return prompt.role === "user";
}
