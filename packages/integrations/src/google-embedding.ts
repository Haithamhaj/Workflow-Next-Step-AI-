import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProviderName } from "@workflow/contracts";
import type { EmbeddingProvider, EmbeddingResult } from "./embedding-provider.js";

function getEnv(key: string): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.[key];
  } catch {
    return undefined;
  }
}

function requireApiKey(): string {
  const key = getEnv("GOOGLE_AI_API_KEY");
  if (!key) throw new Error("GOOGLE_AI_API_KEY is not configured for Google embeddings.");
  return key;
}

export function defaultGoogleEmbeddingModel(): string {
  return getEnv("GOOGLE_EMBEDDING_MODEL") ?? "gemini-embedding-2";
}

export class GoogleEmbeddingProvider implements EmbeddingProvider {
  readonly name: ProviderName = "google";

  async embedTexts(input: { texts: string[]; model?: string }): Promise<EmbeddingResult> {
    const client = new GoogleGenerativeAI(requireApiKey());
    const modelName = input.model ?? defaultGoogleEmbeddingModel();
    const model = client.getGenerativeModel({ model: modelName });
    const vectors: number[][] = [];
    for (const text of input.texts) {
      const result = await model.embedContent(text);
      vectors.push(result.embedding.values);
    }
    return { provider: "google", model: modelName, vectors };
  }
}
