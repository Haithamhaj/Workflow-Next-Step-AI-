import { NextResponse } from "next/server";
import {
  buildSourcesContextCopilotProviderPrompt,
  createSourcesContextCopilotFallbackResponse,
  createSourcesContextCopilotProviderResponse,
  getDefaultStageCopilotSystemPrompt,
  type SourcesContextCopilotChatInput,
  type SourcesContextCopilotChatMessage,
} from "@workflow/stage-copilot";
import { providerRegistry } from "@workflow/integrations";
import { store } from "../../../../../lib/store";

interface SourcesContextCopilotChatRequestBody {
  message?: unknown;
  conversationId?: unknown;
  history?: unknown;
  caseId?: unknown;
}

function jsonError(error: string, message: string, status: number, field?: string) {
  return NextResponse.json({
    ok: false,
    error,
    message,
    field,
  }, { status });
}

function textValue(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function safeHistory(value: unknown): SourcesContextCopilotChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): SourcesContextCopilotChatMessage[] => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: unknown }).role;
    const content = textValue((item as { content?: unknown }).content);
    if ((role !== "user" && role !== "assistant") || !content) return [];
    return [{ role, content }];
  }).slice(-8);
}

function effectiveSourcesContextInstructions() {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt("sources_context");
  if (!defaultPrompt) {
    throw new Error("Sources / Context Copilot Instructions default is unavailable.");
  }

  const current = store.stageCopilotSystemPrompts.findCurrentByStage("sources_context");
  return current
    ? {
        systemInstructions: current.systemPrompt,
        instructionSource: current.source,
        instructionVersion: current.version,
      }
    : {
        systemInstructions: defaultPrompt.systemPrompt,
        instructionSource: "static_default" as const,
        instructionVersion: 1,
      };
}

function providerStatusFromError(error: unknown): "provider_not_configured" | "provider_failed" {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("not_configured") || message.includes("OPENAI_API_KEY")
    ? "provider_not_configured"
    : "provider_failed";
}

export async function POST(request: Request) {
  let body: SourcesContextCopilotChatRequestBody;
  try {
    body = await request.json() as SourcesContextCopilotChatRequestBody;
  } catch {
    return jsonError("invalid_json", "Request body must be valid JSON.", 400);
  }

  const message = textValue(body.message);
  if (!message) {
    return jsonError("missing_message", "message is required for Sources / Context Copilot chat.", 400, "message");
  }

  try {
    const instructions = effectiveSourcesContextInstructions();
    const chatInput: SourcesContextCopilotChatInput = {
      message,
      history: safeHistory(body.history),
      caseId: textValue(body.caseId),
      systemInstructions: instructions.systemInstructions,
      instructionSource: instructions.instructionSource,
      instructionVersion: instructions.instructionVersion,
    };
    const provider = providerRegistry.getPromptTextProvider("openai");
    if (!provider) {
      const response = createSourcesContextCopilotFallbackResponse(
        chatInput,
        "provider_not_configured",
        "Provider-backed chat is not configured because the existing OpenAI text provider is unavailable. This is a deterministic fallback response rather than AI provider output.",
      );
      return NextResponse.json({
        ...response,
        conversationId: textValue(body.conversationId),
      });
    }

    try {
      const compiledPrompt = buildSourcesContextCopilotProviderPrompt(chatInput);
      const providerResult = await provider.runPromptText({ compiledPrompt });
      const response = createSourcesContextCopilotProviderResponse(chatInput, providerResult);
      return NextResponse.json({
        ...response,
        conversationId: textValue(body.conversationId),
      });
    } catch (providerError) {
      const status = providerStatusFromError(providerError);
      const response = createSourcesContextCopilotFallbackResponse(
        chatInput,
        status,
        status === "provider_not_configured"
          ? "Provider-backed chat is not configured because the existing OpenAI text provider could not run. This is a deterministic fallback response rather than AI provider output."
          : "Provider-backed chat failed through the existing OpenAI text provider. This is a deterministic fallback response rather than AI provider output.",
      );

      return NextResponse.json({
        ...response,
        conversationId: textValue(body.conversationId),
      });
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    return jsonError("sources_context_copilot_failed", messageText, 500);
  }
}
