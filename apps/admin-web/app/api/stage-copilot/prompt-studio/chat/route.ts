import { NextResponse } from "next/server";
import {
  createPromptStudioCopilotChatResponse,
  getDefaultStageCopilotSystemPrompt,
  type PromptStudioCopilotChatMessage,
} from "@workflow/stage-copilot";
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
    const response = createPromptStudioCopilotChatResponse({
      message,
      history: safeHistory(body.history),
      systemInstructions: instructions.systemInstructions,
      instructionSource: instructions.instructionSource,
      instructionVersion: instructions.instructionVersion,
    });

    return NextResponse.json({
      ...response,
      conversationId: textValue(body.conversationId),
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    return jsonError("prompt_studio_copilot_failed", messageText, 500);
  }
}
