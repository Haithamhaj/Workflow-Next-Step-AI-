import { NextResponse } from "next/server";
import {
  buildPromptStudioCopilotProviderPrompt,
  createPromptStudioCopilotFallbackResponse,
  createPromptStudioCopilotProviderResponse,
  getDefaultStageCopilotSystemPrompt,
  type PromptStudioCopilotChatInput,
  type PromptStudioCopilotChatMessage,
} from "@workflow/stage-copilot";
import { providerRegistry } from "@workflow/integrations";
import { store } from "../../../../../lib/store";

interface PromptStudioCopilotChatRequestBody {
  message?: unknown;
  conversationId?: unknown;
  history?: unknown;
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

function safeHistory(value: unknown): PromptStudioCopilotChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): PromptStudioCopilotChatMessage[] => {
    if (!item || typeof item !== "object") return [];
    const role = (item as { role?: unknown }).role;
    const content = textValue((item as { content?: unknown }).content);
    if ((role !== "user" && role !== "assistant") || !content) return [];
    return [{ role, content }];
  }).slice(-8);
}

function effectivePromptStudioInstructions() {
  const defaultPrompt = getDefaultStageCopilotSystemPrompt("prompt_studio");
  if (!defaultPrompt) {
    throw new Error("Prompt Studio Copilot Instructions default is unavailable.");
  }

  const current = store.stageCopilotSystemPrompts.findCurrentByStage("prompt_studio");
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
  let body: PromptStudioCopilotChatRequestBody;
  try {
    body = await request.json() as PromptStudioCopilotChatRequestBody;
  } catch {
    return jsonError("invalid_json", "Request body must be valid JSON.", 400);
  }

  const message = textValue(body.message);
  if (!message) {
    return jsonError("missing_message", "message is required for Prompt Studio Copilot chat.", 400, "message");
  }

  try {
    const instructions = effectivePromptStudioInstructions();
    const chatInput: PromptStudioCopilotChatInput = {
      message,
      history: safeHistory(body.history),
      systemInstructions: instructions.systemInstructions,
      instructionSource: instructions.instructionSource,
      instructionVersion: instructions.instructionVersion,
    };
    const provider = providerRegistry.getPromptTextProvider("openai");
    if (!provider) {
      const response = createPromptStudioCopilotFallbackResponse(
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
      const compiledPrompt = buildPromptStudioCopilotProviderPrompt(chatInput);
      const providerResult = await provider.runPromptText({ compiledPrompt });
      const response = createPromptStudioCopilotProviderResponse(chatInput, providerResult);
      return NextResponse.json({
        ...response,
        conversationId: textValue(body.conversationId),
      });
    } catch (providerError) {
      const status = providerStatusFromError(providerError);
      const response = createPromptStudioCopilotFallbackResponse(
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
    return jsonError("prompt_studio_copilot_failed", messageText, 500);
  }
}
