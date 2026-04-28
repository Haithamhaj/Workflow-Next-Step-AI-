import {
  createPromptStudioCopilotContextEnvelope,
  summarizePromptStudioCopilotContext,
} from "./prompt-studio-context.js";
import type { StageCopilotContextEnvelopeSummary } from "./context-envelope.js";

export type PromptStudioCopilotChatRole = "user" | "assistant";

export interface PromptStudioCopilotChatMessage {
  role: PromptStudioCopilotChatRole;
  content: string;
}

export type PromptStudioCopilotProviderStatus =
  | "provider_success"
  | "provider_failed"
  | "provider_not_configured"
  | "deterministic_fallback";

export interface PromptStudioCopilotChatInput {
  message: string;
  history?: readonly PromptStudioCopilotChatMessage[];
  systemInstructions: string;
  instructionSource: "static_default" | "admin_custom";
  instructionVersion: number;
}

export interface PromptStudioCopilotChatContextSummary {
  source: "prompt_studio_static_context";
  readOnly: true;
  stageKey: "prompt_studio";
  promptSpecRefCount: number;
  warningCount: number;
  instructionSource: "static_default" | "admin_custom";
  instructionVersion: number;
}

export interface PromptStudioCopilotChatResponse {
  ok: true;
  stageKey: "prompt_studio";
  answer: string;
  model: string;
  providerStatus: PromptStudioCopilotProviderStatus;
  contextSummary: PromptStudioCopilotChatContextSummary;
}

function compactWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function firstSentence(value: string): string {
  const compact = compactWhitespace(value);
  const match = compact.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : compact.slice(0, 180);
}

function unsafeIntent(message: string): boolean {
  return /\b(change|modify|mutate|save|promote|archive|compile|run|test|execute|approve|reject|generate)\b/i.test(message);
}

function contextSummaryFrom(
  summary: StageCopilotContextEnvelopeSummary,
  input: PromptStudioCopilotChatInput,
): PromptStudioCopilotChatContextSummary {
  return {
    source: "prompt_studio_static_context",
    readOnly: true,
    stageKey: "prompt_studio",
    promptSpecRefCount: summary.promptSpecRefCount,
    warningCount: summary.warningCount,
    instructionSource: input.instructionSource,
    instructionVersion: input.instructionVersion,
  };
}

export function createPromptStudioCopilotChatResponse(
  input: PromptStudioCopilotChatInput,
): PromptStudioCopilotChatResponse {
  const message = compactWhitespace(input.message);
  const instructions = compactWhitespace(input.systemInstructions);
  if (!message) throw new Error("Prompt Studio Copilot chat message is required.");
  if (!instructions) throw new Error("Prompt Studio Copilot system instructions are required.");

  const envelope = createPromptStudioCopilotContextEnvelope();
  const summary = summarizePromptStudioCopilotContext(envelope);
  const historyCount = input.history?.length ?? 0;
  const instructionBasis = firstSentence(instructions);
  const safetyResponse = unsafeIntent(message)
    ? "If you are asking me to change, save, promote, compile, test, approve, reject, execute, or generate something, I cannot do that from chat. I can only explain the boundary and help you think through the risk."
    : "I can discuss the Prompt Studio boundary and help reason about the prompt systems without changing anything.";

  const answer = [
    "Provider-backed chat is not configured for this pilot, so this is a deterministic fallback response rather than AI provider output.",
    "Prompt Studio Copilot is a no-tool, no-action conversational assistant. It cannot mutate records, save prompts, promote PromptSpecs, compile prompts, run prompt tests, call providers, run official analysis, change readiness, change package eligibility, or generate packages.",
    `Current Prompt Studio Copilot Instructions are used as conversation guidance (${input.instructionSource}, version ${input.instructionVersion}): ${instructionBasis}`,
    "The static Prompt Studio context says there are two separate prompt systems: Capability / Analysis PromptSpecs control official analysis behavior, while Stage Copilot Instructions control only how a stage Copilot speaks and reasons.",
    safetyResponse,
    `Your question: "${message}"`,
    historyCount > 0
      ? `I received ${historyCount} prior conversation message(s) as context, but this pilot does not persist conversation history.`
      : "No prior conversation history was provided.",
  ].join("\n\n");

  return {
    ok: true,
    stageKey: "prompt_studio",
    answer,
    model: "deterministic-prompt-studio-copilot-v0",
    providerStatus: "deterministic_fallback",
    contextSummary: contextSummaryFrom(summary, input),
  };
}
