/**
 * Google extraction provider — real Gemini SDK path (§8).
 * Default provider. Uses @google/generative-ai when GOOGLE_AI_API_KEY is set.
 * Fails visibly when credentials/config are missing.
 */

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { ResponseSchema } from "@google/generative-ai";
import type { ProviderName, StructuredContext } from "@workflow/contracts";
import type {
  ExtractionInput,
  ExtractionProvider,
  ExtractionResult,
  ClassificationResult,
  ContextTransformResult,
} from "./extraction-provider.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/** MIME types supported by Gemini inlineData for Phase 3 extraction. */
function isMultimodalMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith("image/") ||
    mimeType.startsWith("audio/")
  );
}

function getApiKey(): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.GOOGLE_AI_API_KEY;
  } catch {
    return undefined;
  }
}

function getApiModel(key: string, fallback: string): string {
  try {
    const value = ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.[key];
    return typeof value === "string" && value.length > 0 ? value : fallback;
  } catch {
    return fallback;
  }
}

const STRUCTURED_CONTEXT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    companyName: { type: SchemaType.STRING },
    companyScopeSummary: { type: SchemaType.STRING },
    domain: { type: SchemaType.STRING },
    subtypeOrOperatingModel: { type: SchemaType.STRING },
    visibleServicesOrProducts: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    mainDepartment: { type: SchemaType.STRING },
    subUnitOrTeam: { type: SchemaType.STRING },
    visibleRoleFamiliesOrOrgSignals: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    keyContextSignalsAndRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    confidenceAndUnknowns: { type: SchemaType.STRING },
  },
  required: [
    "companyName",
    "companyScopeSummary",
    "domain",
    "visibleServicesOrProducts",
    "mainDepartment",
    "visibleRoleFamiliesOrOrgSignals",
    "keyContextSignalsAndRisks",
    "confidenceAndUnknowns",
  ],
};

const CONTEXT_SYSTEM = `You are a company intelligence extraction assistant.
Given raw text about a company (website summaries, notes, documents), extract a structured context.
Rules:
- Only extract information explicitly stated in the text. Do NOT infer or hallucinate.
- If a field cannot be determined, use an empty string (for strings) or empty array (for arrays).
- For confidenceAndUnknowns, honestly state what is known vs. uncertain.
- Be specific, not generic. "A company that does X" is not useful — name the company if mentioned.`;

const CLASSIFY_SYSTEM = `You classify intake sources by type and scope.
Given a source's display name and extracted text, determine:
- suggestedSourceRole: what intake role this source appears to play (e.g. company_overview, org_signal, policy_reference, department_note, audio_transcript, website_url)
- suggestedScope: company_level if it covers the whole organization, department_level if it's specific to a team/unit
- confidenceLevel: high/medium/low based on how clearly the content signals its role
- shortRationale: one-sentence explanation
This is intake triage only. Do not judge reference suitability, workflow truth, or document quality.`;

export class GoogleExtractionProvider implements ExtractionProvider {
  readonly name: ProviderName = "google";

  private getClient(): GoogleGenerativeAI | null {
    const key = getApiKey();
    if (!key) return null;
    return new GoogleGenerativeAI(key);
  }

  async extractText(input: ExtractionInput): Promise<ExtractionResult> {
    const client = this.getClient();
    if (!client) {
      throw new Error("GOOGLE_AI_API_KEY is not configured for Google document/OCR extraction.");
    }

    const modelName = getApiModel("GOOGLE_EXTRACTION_MODEL", "gemini-2.0-flash");
    const model = client.getGenerativeModel({ model: modelName });
    const prompt = "Extract all text content from this Pass 2 intake source. Return only extracted text, no commentary.";
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [{ text: prompt }];
    if (input.binaryData && input.mimeType && isMultimodalMimeType(input.mimeType)) {
      parts.push({ inlineData: { data: arrayBufferToBase64(input.binaryData), mimeType: input.mimeType } });
    } else {
      parts.push({ text: input.content });
    }
    const result = await model.generateContent(parts);
    return {
      text: result.response.text(),
      provider: "google",
      model: modelName,
    };
  }

  async classifySource(input: {
    displayName: string;
    extractedText: string;
    bucket: string;
  }): Promise<ClassificationResult> {
    const client = this.getClient();
    if (!client) {
      throw new Error("GOOGLE_AI_API_KEY is not configured for AI intake source-role suggestions.");
    }

    const modelName = getApiModel("GOOGLE_SUGGESTION_MODEL", "gemini-2.0-flash");
    const model = client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const result = await model.generateContent([
      { text: CLASSIFY_SYSTEM },
      { text: `Display name: ${input.displayName}\nBucket: ${input.bucket}\nExtracted text (first 2000 chars):\n${input.extractedText.slice(0, 2000)}` },
    ]);
    const parsed = JSON.parse(result.response.text()) as {
      suggestedSourceRole?: string;
      suggestedType?: string;
      suggestedScope?: string;
      confidenceLevel?: string;
      confidence?: string;
      shortRationale?: string;
      reason?: string;
    };
    return {
      suggestedSourceRole: parsed.suggestedSourceRole ?? parsed.suggestedType ?? "general_intake_source",
      suggestedScope: (parsed.suggestedScope === "company_level" || parsed.suggestedScope === "department_level")
        ? parsed.suggestedScope
        : input.bucket === "company" ? "company_level" : "department_level",
      confidenceLevel: (parsed.confidenceLevel === "high" || parsed.confidenceLevel === "medium" || parsed.confidenceLevel === "low")
        ? parsed.confidenceLevel
        : (parsed.confidence === "high" || parsed.confidence === "medium" || parsed.confidence === "low") ? parsed.confidence : "low",
      shortRationale: parsed.shortRationale ?? parsed.reason ?? "Generated by Google Gemini for intake triage only.",
    };
  }

  async transformToStructuredContext(input: {
    rawText: string;
    bucket: string;
    domain?: string;
  }): Promise<ContextTransformResult> {
    const client = this.getClient();
    if (!client) {
      throw new Error("GOOGLE_AI_API_KEY is not configured for structured context generation.");
    }

    try {
      const model = client.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: STRUCTURED_CONTEXT_SCHEMA,
        },
      });

      const userPrompt = `Bucket: ${input.bucket}${input.domain ? `\nDomain hint: ${input.domain}` : ""}

Raw source text:
${input.rawText.slice(0, 8000)}`;

      const result = await model.generateContent([
        { text: CONTEXT_SYSTEM },
        { text: userPrompt },
      ]);

      const parsed = JSON.parse(result.response.text()) as StructuredContext;

      // Validate required fields are present
      const context: StructuredContext = {
        companyName: parsed.companyName ?? "",
        companyScopeSummary: parsed.companyScopeSummary ?? "",
        domain: parsed.domain ?? input.domain ?? "unknown",
        subtypeOrOperatingModel: parsed.subtypeOrOperatingModel || undefined,
        visibleServicesOrProducts: Array.isArray(parsed.visibleServicesOrProducts) ? parsed.visibleServicesOrProducts : [],
        mainDepartment: parsed.mainDepartment ?? "",
        subUnitOrTeam: parsed.subUnitOrTeam || undefined,
        visibleRoleFamiliesOrOrgSignals: Array.isArray(parsed.visibleRoleFamiliesOrOrgSignals) ? parsed.visibleRoleFamiliesOrOrgSignals : [],
        keyContextSignalsAndRisks: Array.isArray(parsed.keyContextSignalsAndRisks) ? parsed.keyContextSignalsAndRisks : [],
        confidenceAndUnknowns: parsed.confidenceAndUnknowns ?? "Extracted by Google Gemini — review recommended",
      };

      return {
        structuredContext: context,
        provider: "google",
        model: "gemini-2.0-flash",
      };
    } catch {
      return {
        structuredContext: {
          companyName: "",
          companyScopeSummary: input.rawText.slice(0, 200),
          domain: input.domain ?? "unknown",
          visibleServicesOrProducts: [],
          mainDepartment: "",
          visibleRoleFamiliesOrOrgSignals: [],
          keyContextSignalsAndRisks: [],
          confidenceAndUnknowns: "Google API call failed — no extraction performed. Error during Gemini invocation.",
        },
        provider: "google",
        model: "stub-api-failed",
      };
    }
  }
}
