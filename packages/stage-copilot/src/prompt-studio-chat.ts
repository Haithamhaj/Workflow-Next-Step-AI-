import {
  createPromptStudioCopilotContextEnvelope,
  summarizePromptStudioCopilotContext,
} from "./prompt-studio-context.js";
import {
  answerWdeStageKnowledgeQuestionDeterministically,
  summarizeWdeStageSystemKnowledgeForPromptStudio,
} from "./wde-stage-system-knowledge.js";
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

export interface PromptStudioCopilotTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  raw?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface PromptStudioCopilotChatResponse {
  ok: true;
  stageKey: "prompt_studio";
  answer: string;
  model: string;
  providerStatus: PromptStudioCopilotProviderStatus;
  contextSummary: PromptStudioCopilotChatContextSummary;
  tokenUsage: PromptStudioCopilotTokenUsage | null;
  tokenUsageUnavailable: boolean;
}

export interface PromptStudioCopilotProviderOutput {
  text: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
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

function claimsCompletedAction(answer: string): boolean {
  return /\b(I|we)\s+(changed|saved|promoted|compiled|tested|executed|mutated|updated|approved|rejected|generated)\b/i.test(answer);
}

function tokenUsageFromProviderOutput(
  providerOutput: PromptStudioCopilotProviderOutput,
): PromptStudioCopilotTokenUsage | null {
  const usage = providerOutput.usage;
  if (!usage) return null;
  const tokenUsage: PromptStudioCopilotTokenUsage = {};
  if (typeof usage.inputTokens === "number") tokenUsage.inputTokens = usage.inputTokens;
  if (typeof usage.outputTokens === "number") tokenUsage.outputTokens = usage.outputTokens;
  if (typeof usage.totalTokens === "number") tokenUsage.totalTokens = usage.totalTokens;
  if (Object.keys(tokenUsage).length === 0) return null;
  tokenUsage.raw = { ...tokenUsage };
  return tokenUsage;
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

function validateChatInput(input: PromptStudioCopilotChatInput): {
  message: string;
  instructions: string;
} {
  const message = compactWhitespace(input.message);
  const instructions = compactWhitespace(input.systemInstructions);
  if (!message) throw new Error("Prompt Studio Copilot chat message is required.");
  if (!instructions) throw new Error("Prompt Studio Copilot system instructions are required.");
  return { message, instructions };
}

function fallbackAnswer(
  input: PromptStudioCopilotChatInput,
  message: string,
  instructions: string,
  reason: string,
): string {
  const historyCount = input.history?.length ?? 0;
  const instructionBasis = firstSentence(instructions);
  const stageKnowledgeAnswer = answerWdeStageKnowledgeQuestionDeterministically(message);
  const safetyResponse = unsafeIntent(message)
    ? "If you are asking me to change, save, promote, compile, test, approve, reject, execute, or generate something, I cannot do that from chat. I can only explain the boundary and help you think through the risk."
    : "I can discuss the Prompt Studio boundary and help reason about the prompt systems without changing anything.";

  const answer = [
    reason,
    "Prompt Studio Copilot is a no-tool, no-action conversational assistant. It cannot mutate records, save prompts, promote PromptSpecs, compile prompts, run prompt tests, call providers, run official analysis, change readiness, change package eligibility, or generate packages.",
    `Current Prompt Studio Copilot Instructions are used as conversation guidance (${input.instructionSource}, version ${input.instructionVersion}): ${instructionBasis}`,
    "The static Prompt Studio context says there are two separate prompt systems: Capability / Analysis PromptSpecs control official analysis behavior, while Stage Copilot Instructions control only how a stage Copilot speaks and reasons.",
    stageKnowledgeAnswer
      ? `Static WDE stage-system knowledge answer: ${stageKnowledgeAnswer}`
      : "Static WDE stage-system knowledge is available for Pass 2 Sources / Context, Pass 3 Hierarchy, Pass 4 Targeting, Pass 5 Participant Evidence, and Pass 6A/6B/6C Analysis / Package boundaries.",
    safetyResponse,
    `Your question: "${message}"`,
    historyCount > 0
      ? `I received ${historyCount} prior conversation message(s) as context, but this pilot does not persist conversation history.`
      : "No prior conversation history was provided.",
  ].join("\n\n");

  return answer;
}

export function buildPromptStudioCopilotProviderPrompt(input: PromptStudioCopilotChatInput): string {
  const { message, instructions } = validateChatInput(input);
  const envelope = createPromptStudioCopilotContextEnvelope();
  const summary = summarizePromptStudioCopilotContext(envelope);
  const stageKnowledgeSummary = summarizeWdeStageSystemKnowledgeForPromptStudio();
  const history = (input.history ?? [])
    .map((item) => `${item.role.toUpperCase()}: ${compactWhitespace(item.content)}`)
    .join("\n");

  return [
    "You are Prompt Studio Copilot, a scoped conversational assistant.",
    "",
    "## Hard Boundary",
    "- No tools.",
    "- No actions.",
    "- No routed actions.",
    "- No record mutation.",
    "- Do not claim you changed, saved, promoted, compiled, tested, approved, rejected, generated, or executed anything.",
    "- Do not run official analysis.",
    "- Do not change readiness, evidence trust, synthesis, evaluation, package eligibility, or package output.",
    "- Answer with text only.",
    "",
    "## Stage Copilot Instructions",
    instructions,
    "",
    "## Static Prompt Studio Context Summary",
    "source=prompt_studio_static_context",
    `stageKey=${summary.stageKey}`,
    `readOnly=${String(summary.readOnly)}`,
    `promptSpecRefCount=${summary.promptSpecRefCount}`,
    `systemKnowledgeRefCount=${summary.systemKnowledgeRefCount}`,
    `warningCount=${summary.warningCount}`,
    "Context rule: Capability / Analysis PromptSpecs are separate from Stage Copilot Instructions. Copilot Instructions change conversation behavior only.",
    "",
    "## WDE Stage System Knowledge (Read-Only Static Pack)",
    stageKnowledgeSummary,
    "",
    history ? "## Conversation History" : "",
    history,
    history ? "" : "",
    "## Admin Message",
    message,
    "",
    "## Response Instructions",
    "Explain, discuss, compare, challenge assumptions, and advise on prompt-system separation. Do not propose executable actions as if you can run them. If asked to change anything, say you cannot do that from chat and explain the safe boundary.",
  ].filter((line) => line !== "").join("\n");
}

export function createPromptStudioCopilotProviderResponse(
  input: PromptStudioCopilotChatInput,
  providerOutput: PromptStudioCopilotProviderOutput,
): PromptStudioCopilotChatResponse {
  validateChatInput(input);
  const envelope = createPromptStudioCopilotContextEnvelope();
  const summary = summarizePromptStudioCopilotContext(envelope);
  const answer = compactWhitespace(providerOutput.text);
  if (!answer) throw new Error("Prompt Studio Copilot provider response did not include text.");
  if (claimsCompletedAction(answer)) {
    throw new Error("Prompt Studio Copilot provider response claimed action execution.");
  }
  const tokenUsage = tokenUsageFromProviderOutput(providerOutput);

  return {
    ok: true,
    stageKey: "prompt_studio",
    answer,
    model: providerOutput.model,
    providerStatus: "provider_success",
    contextSummary: contextSummaryFrom(summary, input),
    tokenUsage,
    tokenUsageUnavailable: tokenUsage === null,
  };
}

export function createPromptStudioCopilotFallbackResponse(
  input: PromptStudioCopilotChatInput,
  providerStatus: Exclude<PromptStudioCopilotProviderStatus, "provider_success"> = "deterministic_fallback",
  providerMessage = "Provider-backed chat is not configured for this pilot, so this is a deterministic fallback response rather than AI provider output.",
): PromptStudioCopilotChatResponse {
  const { message, instructions } = validateChatInput(input);
  const envelope = createPromptStudioCopilotContextEnvelope();
  const summary = summarizePromptStudioCopilotContext(envelope);

  return {
    ok: true,
    stageKey: "prompt_studio",
    answer: fallbackAnswer(input, message, instructions, providerMessage),
    model: "deterministic-prompt-studio-copilot-v0",
    providerStatus,
    contextSummary: contextSummaryFrom(summary, input),
    tokenUsage: null,
    tokenUsageUnavailable: true,
  };
}

export function createPromptStudioCopilotChatResponse(
  input: PromptStudioCopilotChatInput,
): PromptStudioCopilotChatResponse {
  return createPromptStudioCopilotFallbackResponse(input);
}
