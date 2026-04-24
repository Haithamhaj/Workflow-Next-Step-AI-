import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ProviderName } from "@workflow/contracts";
import type { EmbeddingProvider, EmbeddingResult } from "./embedding-provider.js";
import { getEnv, getGoogleAIKeyOrThrow } from "./google-config.js";

export function defaultGoogleEmbeddingModel(): string {
  return getEnv("GOOGLE_EMBEDDING_MODEL") ?? "gemini-embedding-2";
}

export class GoogleEmbeddingProvider implements EmbeddingProvider {
  readonly name: ProviderName = "google";

  async embedTexts(input: { texts: string[]; model?: string }): Promise<EmbeddingResult> {
    const client = new GoogleGenerativeAI(getGoogleAIKeyOrThrow());
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
