/**
 * OpenAI extraction provider — env-gated live prompt adapter.
 * Available provider (not default). OPENAI_API_KEY must be set for real execution.
 */

import type { ProviderName } from "@workflow/contracts";
import type {
  ExtractionProvider,
  ExtractionResult,
  ClassificationResult,
  ContextTransformResult,
  HierarchyDraftGenerationResult,
  SourceHierarchyTriageGenerationResult,
} from "./extraction-provider.js";
import { getEnv } from "./google-config.js";

function openAIKey(): string | null {
  return getEnv("OPENAI_API_KEY")?.trim() || null;
}

function openAIModel(): string {
  return getEnv("OPENAI_MODEL")?.trim() || "gpt-5.4";
}

function classifyOpenAIError(error: unknown): Error {
  if (error instanceof Error) return new Error(`openai_provider_execution_failed: ${error.message}`);
  return new Error(`openai_provider_execution_failed: ${String(error)}`);
}

function extractResponseText(parsed: unknown): string {
  const response = parsed as {
    output_text?: string;
    output?: {
      content?: {
        type?: string;
        text?: string;
      }[];
    }[];
  };
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text;
  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((part) => typeof part.text === "string" ? part.text : "")
    .join("")
    .trim();
  if (!text) throw new Error("OpenAI response did not include output text.");
  return text;
}

export class OpenAIExtractionProvider implements ExtractionProvider {
  readonly name: ProviderName = "openai";

  async extractText(input: { content: string; mimeType?: string }): Promise<ExtractionResult> {
    if (!openAIKey()) {
      return {
        text: input.content,
        provider: "openai",
        model: "stub-no-api-key",
      };
    }
    return {
      text: input.content,
      provider: "openai",
      model: openAIModel(),
    };
  }

  async classifySource(input: {
    displayName: string;
    extractedText: string;
    bucket: string;
  }): Promise<ClassificationResult> {
      return {
        suggestedSourceRole: "general_intake_source",
        suggestedScope: input.bucket === "company" ? "company_level" : "department_level",
        confidenceLevel: "low",
        shortRationale: openAIKey()
          ? "OpenAI key present; classification path remains deterministic low-confidence fallback"
          : "No OPENAI_API_KEY — stub classification",
      };
  }

  async transformToStructuredContext(input: {
    rawText: string;
    bucket: string;
    domain?: string;
  }): Promise<ContextTransformResult> {
    return {
      structuredContext: {
        companyName: "",
        companyScopeSummary: input.rawText.slice(0, 200),
        domain: input.domain ?? "unknown",
        visibleServicesOrProducts: [],
        mainDepartment: "",
        visibleRoleFamiliesOrOrgSignals: [],
        keyContextSignalsAndRisks: [],
        confidenceAndUnknowns: openAIKey()
          ? "OpenAI key present but real transform not yet wired"
          : "No OPENAI_API_KEY — stub transform",
      },
      provider: "openai",
      model: openAIKey() ? openAIModel() : "stub-no-api-key",
    };
  }

  async generateHierarchyDraft(): Promise<HierarchyDraftGenerationResult> {
    throw new Error("OpenAI hierarchy draft generation is not wired in Pass 3 Patch 2.");
  }

  async generateSourceHierarchyTriage(): Promise<SourceHierarchyTriageGenerationResult> {
    throw new Error("OpenAI source-to-hierarchy triage is not wired in Pass 3 Patch 3.");
  }

  async runPromptText(input: { compiledPrompt: string }): Promise<{ text: string; provider: "openai"; model: string }> {
    const key = openAIKey();
    if (!key) throw new Error("openai_provider_not_configured: OPENAI_API_KEY is missing.");
    const model = openAIModel();
    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          authorization: `Bearer ${key}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: input.compiledPrompt,
        }),
      });
      const body = await response.text();
      if (!response.ok) {
        let safeMessage = body.slice(0, 500);
        try {
          const parsed = JSON.parse(body) as { error?: { type?: string; code?: string; message?: string } };
          safeMessage = [
            parsed.error?.type ? `type=${parsed.error.type}` : null,
            parsed.error?.code ? `code=${parsed.error.code}` : null,
            parsed.error?.message ? `message=${parsed.error.message}` : null,
          ].filter(Boolean).join("; ") || safeMessage;
        } catch {
          // Keep sanitized body preview.
        }
        throw new Error(`OpenAI request failed: HTTP ${response.status} ${response.statusText}; ${safeMessage}`);
      }
      return {
        text: extractResponseText(JSON.parse(body)),
        provider: "openai",
        model,
      };
    } catch (error) {
      throw classifyOpenAIError(error);
    }
  }
}
