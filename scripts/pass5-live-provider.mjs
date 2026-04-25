import {
  GoogleExtractionProvider,
  OpenAIExtractionProvider,
  resolveGoogleAIProviderConfig,
} from "../packages/integrations/dist/index.js";

function envValue(key) {
  return process.env[key]?.trim();
}

export function resolvePass5LiveProvider(blockedPrefix) {
  const providerName = (envValue("WORKFLOW_PASS5_PROVIDER") ?? envValue("WORKFLOW_EXTRACTION_PROVIDER") ?? "google").toLowerCase();
  if (providerName === "openai") {
    const keyPresent = Boolean(envValue("OPENAI_API_KEY"));
    const model = envValue("OPENAI_MODEL") ?? "gpt-5.4";
    if (!keyPresent) {
      throw new Error(`${blockedPrefix}: OpenAI provider not configured: missing OPENAI_API_KEY; model would resolve to ${model}.`);
    }
    return {
      provider: new OpenAIExtractionProvider(),
      providerConfig: {
        provider: "openai",
        configured: true,
        keyPresent,
        resolvedModel: model,
        safeMessage: `OpenAI provider configured; model ${model}.`,
      },
    };
  }

  const providerConfig = resolveGoogleAIProviderConfig();
  if (!providerConfig.configured) {
    throw new Error(`${blockedPrefix}: Google provider not configured: ${providerConfig.safeMessage}`);
  }
  return {
    provider: new GoogleExtractionProvider(),
    providerConfig,
  };
}
