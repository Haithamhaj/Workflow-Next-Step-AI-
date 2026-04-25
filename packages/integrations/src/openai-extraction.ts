/**
 * OpenAI extraction provider — env-gated stub adapter (§8).
 * Available provider (not default). Returns placeholder results until real SDK is wired.
 * OPENAI_API_KEY must be set for real execution — currently returns honest stub output.
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

function isOpenAIKeySet(): boolean {
  try {
    const val = ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.OPENAI_API_KEY;
    return typeof val === "string" && val.length > 0;
  } catch {
    return false;
  }
}

export class OpenAIExtractionProvider implements ExtractionProvider {
  readonly name: ProviderName = "openai";

  async extractText(input: { content: string; mimeType?: string }): Promise<ExtractionResult> {
    if (!isOpenAIKeySet()) {
      return {
        text: input.content,
        provider: "openai",
        model: "stub-no-api-key",
      };
    }
    // TODO: Wire real OpenAI SDK extraction when prioritized
    return {
      text: input.content,
      provider: "openai",
      model: "stub-pending-real-wiring",
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
        shortRationale: isOpenAIKeySet()
          ? "OpenAI key present but real SDK not yet wired"
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
        confidenceAndUnknowns: isOpenAIKeySet()
          ? "OpenAI key present but real transform not yet wired"
          : "No OPENAI_API_KEY — stub transform",
      },
      provider: "openai",
      model: isOpenAIKeySet() ? "stub-pending-real-wiring" : "stub-no-api-key",
    };
  }

  async generateHierarchyDraft(): Promise<HierarchyDraftGenerationResult> {
    throw new Error("OpenAI hierarchy draft generation is not wired in Pass 3 Patch 2.");
  }

  async generateSourceHierarchyTriage(): Promise<SourceHierarchyTriageGenerationResult> {
    throw new Error("OpenAI source-to-hierarchy triage is not wired in Pass 3 Patch 3.");
  }

  async runPromptText(): Promise<{ text: string; provider: "openai"; model: string }> {
    throw new Error("OpenAI prompt testing is not wired in Pass 3 Patch 4.");
  }
}
