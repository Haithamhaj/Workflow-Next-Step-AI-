import type { ProviderName } from "@workflow/contracts";

export interface EmbeddingResult {
  provider: ProviderName;
  model: string;
  vectors: number[][];
}

export interface EmbeddingProvider {
  readonly name: ProviderName;
  embedTexts(input: { texts: string[]; model?: string }): Promise<EmbeddingResult>;
}
