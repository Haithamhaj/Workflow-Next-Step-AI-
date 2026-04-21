/**
 * Hand-mirrored TypeScript type for PromptRegistration.
 * Source of truth is src/schemas/prompt-registration.schema.json.
 * Spec refs: §29.9.1 (registry fields), §30.6 (module purposes), §30.16 (prompt categories).
 * See OQ-001 in handoff/OPEN_QUESTIONS.md for the open question on role enum values.
 */

export type PromptType =
  | "extraction"
  | "classification"
  | "synthesis"
  | "package_section_drafting"
  | "clarification_generation";

/** LLM message-format role. See OQ-001. */
export type PromptRole = "system" | "user";

export type PromptStatus = "active" | "inactive";

export interface PromptRegistration {
  promptId: string;
  promptName: string;
  promptType: PromptType;
  role: PromptRole;
  linkedModule: string;
  linkedDecisionBlock?: string;
  promptPurpose: string;
  inputContractRef?: string;
  outputContractRef?: string;
  sourceSectionLinks?: string[];
  promptVersion: string;
  status: PromptStatus;
  notes?: string;
}
