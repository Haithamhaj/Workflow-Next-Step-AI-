import {
  createSourcesContextCopilotContextEnvelope,
  summarizeSourcesContextCopilotContext,
} from "./sources-context-context.js";
import type { StageCopilotContextEnvelopeSummary } from "./context-envelope.js";
import {
  answerWdeStageKnowledgeQuestionDeterministically,
  getWdeStageSystemKnowledgeEntry,
} from "./wde-stage-system-knowledge.js";

export type SourcesContextCopilotChatRole = "user" | "assistant";

export interface SourcesContextCopilotChatMessage {
  role: SourcesContextCopilotChatRole;
  content: string;
}

export type SourcesContextCopilotProviderStatus =
  | "provider_success"
  | "provider_failed"
  | "provider_not_configured"
  | "deterministic_fallback";

export interface SourcesContextCopilotChatInput {
  message: string;
  history?: readonly SourcesContextCopilotChatMessage[];
  caseId?: string | null;
  systemInstructions: string;
  instructionSource: "static_default" | "admin_custom";
  instructionVersion: number;
}

export interface SourcesContextCopilotChatContextSummary {
  source: "sources_context_static_context";
  readOnly: true;
  stageKey: "sources_context";
  systemKnowledgeRefCount: number;
  caseContextRefCount: number;
  warningCount: number;
  liveSourceSummaryIncluded: false;
  instructionSource: "static_default" | "admin_custom";
  instructionVersion: number;
}

export interface SourcesContextCopilotTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  raw?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

export interface SourcesContextCopilotChatResponse {
  ok: true;
  stageKey: "sources_context";
  answer: string;
  model: string;
  providerStatus: SourcesContextCopilotProviderStatus;
  contextSummary: SourcesContextCopilotChatContextSummary;
  tokenUsage: SourcesContextCopilotTokenUsage | null;
  tokenUsageUnavailable: boolean;
}

export interface SourcesContextCopilotProviderOutput {
  text: string;
  provider: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

const pass2KnowledgeEntry = getWdeStageSystemKnowledgeEntry("pass2_sources_context");
if (!pass2KnowledgeEntry) {
  throw new Error("Pass 2 Sources / Context stage-system knowledge is unavailable.");
}
const pass2Knowledge = pass2KnowledgeEntry;

function compactWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function firstSentence(value: string): string {
  const compact = compactWhitespace(value);
  const match = compact.match(/^.*?[.!?](?:\s|$)/);
  return match ? match[0].trim() : compact.slice(0, 180);
}

function unsafeIntent(message: string): boolean {
  return /\b(register|update|delete|mutate|save|approve|confirm|run|execute|crawl|ocr|stt|extract|create|start|generate)\b/i.test(message);
}

function claimsCompletedAction(answer: string): boolean {
  return /\b(I|we)\s+(registered|updated|deleted|saved|approved|confirmed|ran|executed|crawled|extracted|created|started|generated|mutated)\b/i.test(answer);
}

function tokenUsageFromProviderOutput(
  providerOutput: SourcesContextCopilotProviderOutput,
): SourcesContextCopilotTokenUsage | null {
  const usage = providerOutput.usage;
  if (!usage) return null;
  const tokenUsage: SourcesContextCopilotTokenUsage = {};
  if (typeof usage.inputTokens === "number") tokenUsage.inputTokens = usage.inputTokens;
  if (typeof usage.outputTokens === "number") tokenUsage.outputTokens = usage.outputTokens;
  if (typeof usage.totalTokens === "number") tokenUsage.totalTokens = usage.totalTokens;
  if (Object.keys(tokenUsage).length === 0) return null;
  tokenUsage.raw = { ...tokenUsage };
  return tokenUsage;
}

function contextSummaryFrom(
  summary: StageCopilotContextEnvelopeSummary,
  input: SourcesContextCopilotChatInput,
): SourcesContextCopilotChatContextSummary {
  return {
    source: "sources_context_static_context",
    readOnly: true,
    stageKey: "sources_context",
    systemKnowledgeRefCount: summary.systemKnowledgeRefCount,
    caseContextRefCount: summary.caseContextRefCount,
    warningCount: summary.warningCount,
    liveSourceSummaryIncluded: false,
    instructionSource: input.instructionSource,
    instructionVersion: input.instructionVersion,
  };
}

function validateChatInput(input: SourcesContextCopilotChatInput): {
  message: string;
  instructions: string;
} {
  const message = compactWhitespace(input.message);
  const instructions = compactWhitespace(input.systemInstructions);
  if (!message) throw new Error("Sources / Context Copilot chat message is required.");
  if (!instructions) throw new Error("Sources / Context Copilot system instructions are required.");
  return { message, instructions };
}

function summarizePass2ForPrompt(): string {
  return [
    `Label: ${pass2Knowledge.label}`,
    `Purpose: ${pass2Knowledge.purpose}`,
    `Goal: ${pass2Knowledge.goal}`,
    `Inputs: ${pass2Knowledge.inputs.join("; ")}`,
    `Outputs: ${pass2Knowledge.outputs.join("; ")}`,
    `Step-by-step operations: ${pass2Knowledge.stepByStepOperations.join("; ")}`,
    `Contracts/records: ${pass2Knowledge.contractsAndRecords.join("; ")}`,
    `Internal system capabilities: ${pass2Knowledge.internalSystemCapabilities.join("; ")}`,
    "Capability knowledge is descriptive only. The Copilot cannot execute source registration, OCR, STT, website crawl, provider extraction, source-role/source-scope suggestion generation, structured context formation, or final pre-hierarchy review confirmation.",
    `Boundaries: ${pass2Knowledge.boundaries.join("; ")}`,
    `Must not do: ${pass2Knowledge.mustNotDo.join("; ")}`,
    `Wrong interpretations: ${pass2Knowledge.wrongInterpretationExamples.join("; ")}`,
    `Handoff: ${pass2Knowledge.handoffToNextStage}`,
  ].join("\n");
}

function fallbackAnswer(
  input: SourcesContextCopilotChatInput,
  message: string,
  instructions: string,
  reason: string,
): string {
  const historyCount = input.history?.length ?? 0;
  const instructionBasis = firstSentence(instructions);
  const pass2Answer = answerWdeStageKnowledgeQuestionDeterministically(`Pass 2 Sources / Context: ${message}`)
    ?? [
      "Pass 2 Sources / Context builds the intake and context-framing layer before hierarchy.",
      "It registers sources, tracks source type/status/trust, handles document/image/audio/manual/website source concepts, records extraction/OCR/STT/crawl/provider-job outputs as internal capability outputs, supports source-role/source-scope suggestions, forms structured context, records department framing, and prepares final pre-hierarchy review.",
      "It must not treat source claims as workflow truth, approve hierarchy, start targeting, run participant sessions, synthesize/evaluate, or generate packages.",
    ].join(" ");
  const safetyResponse = unsafeIntent(message)
    ? "If you are asking me to register, update, approve, confirm, crawl, run OCR/STT, extract, create structured context, start hierarchy, or generate downstream work, I cannot do that from chat. I can only explain the Sources / Context boundary and help you reason about it."
    : "I can discuss Sources / Context concepts and challenge assumptions without changing any source/context records.";

  return [
    reason,
    "Sources / Context Copilot is a no-tool, no-action conversational assistant. It cannot register or update sources, run OCR, run STT, crawl websites, approve crawl plans, run provider extraction, create structured context, confirm final pre-hierarchy review, or start hierarchy, targeting, participant sessions, synthesis, evaluation, or package generation.",
    `Current Sources / Context Copilot Instructions are used as conversation guidance (${input.instructionSource}, version ${input.instructionVersion}): ${instructionBasis}`,
    "The static Sources / Context context says source claims, extracted text, crawled content, and admin notes are context signals, not confirmed workflow truth.",
    `Static Pass 2 answer: ${pass2Answer}`,
    safetyResponse,
    input.caseId ? `Case scope was supplied for future read-only context use: ${input.caseId}. This API-only slice does not load live source records.` : "No case scope was loaded. This API-only slice uses static read-only context only.",
    `Your question: "${message}"`,
    historyCount > 0
      ? `I received ${historyCount} prior conversation message(s) as request context, but this pilot does not persist conversation history.`
      : "No prior conversation history was provided.",
  ].join("\n\n");
}

export function buildSourcesContextCopilotProviderPrompt(input: SourcesContextCopilotChatInput): string {
  const { message, instructions } = validateChatInput(input);
  const envelope = createSourcesContextCopilotContextEnvelope();
  const summary = summarizeSourcesContextCopilotContext(envelope);
  const pass2Summary = summarizePass2ForPrompt();
  const history = (input.history ?? [])
    .map((item) => `${item.role.toUpperCase()}: ${compactWhitespace(item.content)}`)
    .join("\n");

  return [
    "You are Sources / Context Copilot for Pass 2 of the Workflow Analysis Document Engine (WDE).",
    "Your role is to explain and discuss Sources / Context stage logic using only the read-only context below.",
    "If the provided Sources / Context knowledge does not contain enough detail, say that the knowledge is missing. Do not fill gaps with generic workflow guesses.",
    "When the user's question is Arabic, answer in Arabic and keep exact English WDE anchor terms in parentheses when useful, such as Sources / Context, OCR, STT, source-role/source-scope suggestions, structured context, final pre-hierarchy review, hierarchy, and workflow truth.",
    "",
    "## Hard Boundary",
    "- No tools.",
    "- No actions.",
    "- No routed actions.",
    "- No record mutation.",
    "- Do not claim you registered, updated, deleted, saved, approved, confirmed, ran, executed, crawled, extracted, created, started, generated, or mutated anything.",
    "- Do not register or update sources.",
    "- Do not run OCR, STT, website crawl, provider extraction, or source-role/source-scope suggestion capabilities.",
    "- Do not approve crawl plans.",
    "- Do not create structured context.",
    "- Do not confirm final pre-hierarchy review.",
    "- Do not start hierarchy, targeting, participant sessions, synthesis, evaluation, package eligibility, or package output.",
    "- Distinguish advisory conversation from official Pass 2 source/context operations.",
    "- Answer with text only.",
    "",
    "## Stage Copilot Instructions",
    instructions,
    "",
    "## Static Sources / Context Context Summary",
    "source=sources_context_static_context",
    `stageKey=${summary.stageKey}`,
    `readOnly=${String(summary.readOnly)}`,
    `systemKnowledgeRefCount=${summary.systemKnowledgeRefCount}`,
    `caseContextRefCount=${summary.caseContextRefCount}`,
    `warningCount=${summary.warningCount}`,
    "liveSourceSummaryIncluded=false",
    "Context rule: source claims, extracted text, crawled content, OCR/STT output, provider extraction, and admin notes are context signals, not confirmed workflow truth.",
    input.caseId ? `futureCaseScope=${input.caseId}` : "futureCaseScope=none",
    "",
    "## Pass 2 Sources / Context Stage Knowledge (Read-Only Static Card)",
    pass2Summary,
    "",
    "## Sources / Context Answer Rubric",
    "Answer from the Pass 2 card first. Do not give a generic intake answer when a Pass 2 detail is available.",
    "Cover the relevant categories explicitly: purpose, goal, inputs, outputs, step-by-step operations, contracts/records, internal system capabilities, boundaries, must-not behavior, wrong interpretation examples, and handoff to hierarchy.",
    "When discussing internal capabilities, state that the official system may use source registration, OCR, STT, website crawl, provider jobs, source-role/source-scope suggestions, structured context formation, and final pre-hierarchy review, but this Copilot cannot run or approve any of them.",
    "When discussing source claims, explicitly say they are signals for context and planning, not workflow truth.",
    "When discussing unsafe requests, explain that the Copilot can advise but cannot register/update sources, run processing, approve plans, create structured context, confirm review, or start later passes.",
    "",
    history ? "## Conversation History" : "",
    history,
    history ? "" : "",
    "## Admin Message",
    message,
    "",
    "## Response Instructions",
    "Explain, discuss, compare, challenge assumptions, and advise on Sources / Context stage boundaries. Do not propose executable actions as if you can run them. If asked to change or run anything, say you cannot do that from chat and explain the safe boundary. Prefer concrete Pass 2 details over generic analysis advice.",
  ].filter((line) => line !== "").join("\n");
}

export function createSourcesContextCopilotProviderResponse(
  input: SourcesContextCopilotChatInput,
  providerOutput: SourcesContextCopilotProviderOutput,
): SourcesContextCopilotChatResponse {
  validateChatInput(input);
  const envelope = createSourcesContextCopilotContextEnvelope();
  const summary = summarizeSourcesContextCopilotContext(envelope);
  const answer = compactWhitespace(providerOutput.text);
  if (!answer) throw new Error("Sources / Context Copilot provider response did not include text.");
  if (claimsCompletedAction(answer)) {
    throw new Error("Sources / Context Copilot provider response claimed action execution.");
  }
  const tokenUsage = tokenUsageFromProviderOutput(providerOutput);

  return {
    ok: true,
    stageKey: "sources_context",
    answer,
    model: providerOutput.model,
    providerStatus: "provider_success",
    contextSummary: contextSummaryFrom(summary, input),
    tokenUsage,
    tokenUsageUnavailable: tokenUsage === null,
  };
}

export function createSourcesContextCopilotFallbackResponse(
  input: SourcesContextCopilotChatInput,
  providerStatus: Exclude<SourcesContextCopilotProviderStatus, "provider_success"> = "deterministic_fallback",
  providerMessage = "Provider-backed chat is not configured for this pilot, so this is a deterministic fallback response rather than AI provider output.",
): SourcesContextCopilotChatResponse {
  const { message, instructions } = validateChatInput(input);
  const envelope = createSourcesContextCopilotContextEnvelope();
  const summary = summarizeSourcesContextCopilotContext(envelope);

  return {
    ok: true,
    stageKey: "sources_context",
    answer: fallbackAnswer(input, message, instructions, providerMessage),
    model: "deterministic-sources-context-copilot-v0",
    providerStatus,
    contextSummary: contextSummaryFrom(summary, input),
    tokenUsage: null,
    tokenUsageUnavailable: true,
  };
}

export function createSourcesContextCopilotChatResponse(
  input: SourcesContextCopilotChatInput,
): SourcesContextCopilotChatResponse {
  return createSourcesContextCopilotFallbackResponse(input);
}
