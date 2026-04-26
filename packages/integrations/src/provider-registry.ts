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
import { FetchHtmlCrawlerAdapter } from "./fetch-html-crawler.js";
import { GoogleEmbeddingProvider } from "./google-embedding.js";
import { GoogleSpeechToTextProvider } from "./google-stt.js";
import { getEnv, resolveGoogleAIProviderConfig } from "./google-config.js";

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
  /** Check Pass 6 Prompt Workspace text-test provider availability. */
  getPromptTextAvailability(): ProviderAvailability[];
  /** Get a text provider for Prompt Workspace tests. Returns null if env-gated out. */
  getPromptTextProvider(name?: ProviderName): ExtractionProvider | null;
  /** Resolve Pass 6 text intelligence default provider. */
  resolveDefaultPromptTextProvider(): ProviderName;
}

// ---------------------------------------------------------------------------
// Environment variable checks
// ---------------------------------------------------------------------------

function envSet(key: string): boolean {
  const val = getEnv(key);
  return typeof val === "string" && val.length > 0;
}

function externalSTTModel(): string {
  return getEnv("GOOGLE_STT_EXTERNAL_MODEL") ?? "latest_long";
}

function crawlerAdapterName(): "crawl4ai" | "fetch_html" {
  return getEnv("WORKFLOW_CRAWLER_ADAPTER") === "fetch_html" ? "fetch_html" : "crawl4ai";
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class EnvProviderRegistry implements ProviderRegistry {
  getExtractionAvailability(): ProviderAvailability[] {
    const google = resolveGoogleAIProviderConfig();
    return [
      {
        name: "google",
        available: google.configured,
        reason: google.safeMessage,
        live: google.configured,
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
    if (name === "google" && !resolveGoogleAIProviderConfig().configured) {
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
    const adapter = crawlerAdapterName();
    if (adapter === "fetch_html") {
      return {
        name: "fetch_html",
        available: true,
        reason: "Native fetch_html crawler selected — live bounded adapter",
        live: true,
      };
    }
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
    if (crawlerAdapterName() === "fetch_html") return new FetchHtmlCrawlerAdapter();
    return new Crawl4AIAdapter();
  }

  getSTTAvailability(): ProviderAvailability {
    return {
      name: "google_speech_to_text",
      available: envSet("GOOGLE_STT_API_KEY"),
      reason: envSet("GOOGLE_STT_API_KEY")
        ? `Google Speech-to-Text configured; external audio model ${externalSTTModel()}`
        : "No GOOGLE_STT_API_KEY — provider configuration missing",
      live: envSet("GOOGLE_STT_API_KEY"),
    };
  }

  getSTTProvider(): STTProvider | null {
    if (!envSet("GOOGLE_STT_API_KEY")) return null;
    return new GoogleSpeechToTextProvider();
  }

  getEmbeddingAvailability(): ProviderAvailability {
    const google = resolveGoogleAIProviderConfig();
    return {
      name: "google",
      available: google.configured,
      reason: google.configured
        ? `Google embeddings configured; model ${getEnv("GOOGLE_EMBEDDING_MODEL") ?? "gemini-embedding-2"}`
        : "No GOOGLE_AI_API_KEY — provider configuration missing",
      live: google.configured,
    };
  }

  getEmbeddingProvider(): EmbeddingProvider | null {
    if (!resolveGoogleAIProviderConfig().configured) return null;
    return new GoogleEmbeddingProvider();
  }

  resolveDefaultProvider(): ProviderName {
    // Google is always the default — even as stub
    return "google";
  }

  getPromptTextAvailability(): ProviderAvailability[] {
    return this.getExtractionAvailability().map((availability) =>
      availability.name === "openai"
        ? {
            ...availability,
            reason: availability.available
              ? "OpenAI configured — default Pass 6 text test provider"
              : "No OPENAI_API_KEY — default Pass 6 text test provider unavailable",
          }
        : availability
    );
  }

  getPromptTextProvider(name: ProviderName = this.resolveDefaultPromptTextProvider()): ExtractionProvider | null {
    return this.getExtractionProvider(name);
  }

  resolveDefaultPromptTextProvider(): ProviderName {
    return "openai";
  }
}

/** Singleton registry instance. */
export const providerRegistry = new EnvProviderRegistry();
