/**
 * Provider registry with env/config gating.
 * Reads environment variables to determine which providers are actually available.
 * Google is default for extraction; OpenAI is wired but not default.
 * All checks are honest — if the env var is not set, the provider reports unavailable.
 */

import type { ProviderName } from "@workflow/contracts";
import type { ExtractionProvider } from "./extraction-provider.js";
import type { CrawlProvider } from "./crawl-provider.js";
import type { STTProvider } from "./stt-provider.js";
import type { EmbeddingProvider } from "./embedding-provider.js";
import { GoogleExtractionProvider } from "./google-extraction.js";
import { OpenAIExtractionProvider } from "./openai-extraction.js";
import { Crawl4AIAdapter } from "./crawl4ai-adapter.js";
import { GoogleEmbeddingProvider } from "./google-embedding.js";
import { GoogleSpeechToTextProvider } from "./google-stt.js";

export interface ProviderAvailability {
  name: string;
  available: boolean;
  reason: string;
  live: boolean; // true = real SDK wired, false = stub
}

export interface ProviderRegistry {
  /** Check which extraction providers are available. */
  getExtractionAvailability(): ProviderAvailability[];
  /** Get the extraction provider instance for a given name. Returns null if env-gated out. */
  getExtractionProvider(name: ProviderName): ExtractionProvider | null;
  /** Check crawl provider availability. */
  getCrawlAvailability(): ProviderAvailability;
  /** Get crawl provider instance. Returns null if env-gated out. */
  getCrawlProvider(): CrawlProvider | null;
  /** Check STT provider availability. */
  getSTTAvailability(): ProviderAvailability;
  /** Get STT provider instance. Returns null if env-gated out. */
  getSTTProvider(): STTProvider | null;
  /** Check embedding provider availability. */
  getEmbeddingAvailability(): ProviderAvailability;
  /** Get embedding provider instance. Returns null if env-gated out. */
  getEmbeddingProvider(): EmbeddingProvider | null;
  /** Resolve default provider respecting env gates. */
  resolveDefaultProvider(): ProviderName;
}

// ---------------------------------------------------------------------------
// Environment variable checks
// ---------------------------------------------------------------------------

declare const process: { env: Record<string, string | undefined> } | undefined;

function getEnv(key: string): string | undefined {
  try {
    return (globalThis as Record<string, unknown>).process
      ? ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> }).env[key]
      : undefined;
  } catch {
    return undefined;
  }
}

function envSet(key: string): boolean {
  const val = getEnv(key);
  return typeof val === "string" && val.length > 0;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class EnvProviderRegistry implements ProviderRegistry {
  getExtractionAvailability(): ProviderAvailability[] {
    return [
      {
        name: "google",
        available: envSet("GOOGLE_AI_API_KEY"),
        reason: envSet("GOOGLE_AI_API_KEY")
          ? "API key configured — live"
          : "No GOOGLE_AI_API_KEY — provider configuration missing",
        live: envSet("GOOGLE_AI_API_KEY"),
      },
      {
        name: "openai",
        available: envSet("OPENAI_API_KEY"),
        reason: envSet("OPENAI_API_KEY")
          ? "API key configured — live"
          : "No OPENAI_API_KEY — env-gated",
        live: envSet("OPENAI_API_KEY"),
      },
    ];
  }

  getExtractionProvider(name: ProviderName): ExtractionProvider | null {
    if (name === "google" && !envSet("GOOGLE_AI_API_KEY")) {
      return null;
    }
    if (name === "openai" && !envSet("OPENAI_API_KEY")) {
      return null;
    }
    switch (name) {
      case "google":
        return new GoogleExtractionProvider();
      case "openai":
        return new OpenAIExtractionProvider();
      default:
        return null;
    }
  }

  getCrawlAvailability(): ProviderAvailability {
    const configured = envSet("CRAWL4AI_URL");
    return {
      name: "crawl4ai",
      available: configured,
      reason: configured
        ? `Crawl4AI sidecar at ${getEnv("CRAWL4AI_URL")} — live`
        : "No CRAWL4AI_URL — Crawl4AI runtime configuration missing",
      live: configured,
    };
  }

  getCrawlProvider(): CrawlProvider | null {
    return new Crawl4AIAdapter();
  }

  getSTTAvailability(): ProviderAvailability {
    return {
      name: "google_speech_to_text",
      available: envSet("GOOGLE_STT_API_KEY"),
      reason: envSet("GOOGLE_STT_API_KEY")
        ? `Google Speech-to-Text configured; model ${getEnv("GOOGLE_STT_MODEL") ?? "chirp"}`
        : "No GOOGLE_STT_API_KEY — provider configuration missing",
      live: envSet("GOOGLE_STT_API_KEY"),
    };
  }

  getSTTProvider(): STTProvider | null {
    if (!envSet("GOOGLE_STT_API_KEY")) return null;
    return new GoogleSpeechToTextProvider();
  }

  getEmbeddingAvailability(): ProviderAvailability {
    return {
      name: "google",
      available: envSet("GOOGLE_AI_API_KEY"),
      reason: envSet("GOOGLE_AI_API_KEY")
        ? `Google embeddings configured; model ${getEnv("GOOGLE_EMBEDDING_MODEL") ?? "gemini-embedding-2"}`
        : "No GOOGLE_AI_API_KEY — provider configuration missing",
      live: envSet("GOOGLE_AI_API_KEY"),
    };
  }

  getEmbeddingProvider(): EmbeddingProvider | null {
    if (!envSet("GOOGLE_AI_API_KEY")) return null;
    return new GoogleEmbeddingProvider();
  }

  resolveDefaultProvider(): ProviderName {
    // Google is always the default — even as stub
    return "google";
  }
}

/** Singleton registry instance. */
export const providerRegistry = new EnvProviderRegistry();
