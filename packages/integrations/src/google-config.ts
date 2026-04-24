export type ProviderDiagnosticsStatus =
  | "provider_not_configured"
  | "provider_auth_failed"
  | "provider_model_unavailable"
  | "provider_rate_limited"
  | "provider_execution_failed"
  | "provider_success";

export interface GoogleAIProviderConfig {
  provider: "google";
  configured: boolean;
  keyPresent: boolean;
  resolvedModel: string;
  missingFields: string[];
  diagnosticsStatus: ProviderDiagnosticsStatus;
  safeMessage: string;
}

export class GoogleProviderDiagnosticError extends Error {
  readonly diagnosticsStatus: ProviderDiagnosticsStatus;

  constructor(diagnosticsStatus: ProviderDiagnosticsStatus, safeMessage: string) {
    super(`${diagnosticsStatus}: ${safeMessage}`);
    this.name = "GoogleProviderDiagnosticError";
    this.diagnosticsStatus = diagnosticsStatus;
  }
}

const DEFAULT_GOOGLE_AI_MODEL = "gemini-3.1-pro-preview";

export function getEnv(key: string): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.[key];
  } catch {
    return undefined;
  }
}

export function resolveGoogleAIProviderConfig(): GoogleAIProviderConfig {
  const keyPresent = Boolean(getEnv("GOOGLE_AI_API_KEY")?.trim());
  const resolvedModel = getEnv("GOOGLE_AI_MODEL")?.trim() || DEFAULT_GOOGLE_AI_MODEL;
  return {
    provider: "google",
    configured: keyPresent,
    keyPresent,
    resolvedModel,
    missingFields: keyPresent ? [] : ["GOOGLE_AI_API_KEY"],
    diagnosticsStatus: keyPresent ? "provider_success" : "provider_not_configured",
    safeMessage: keyPresent
      ? `Google AI provider configured; model ${resolvedModel}.`
      : `Google AI provider is missing GOOGLE_AI_API_KEY; model would resolve to ${resolvedModel}.`,
  };
}

export function getGoogleAIKeyOrThrow(): string {
  const config = resolveGoogleAIProviderConfig();
  const key = getEnv("GOOGLE_AI_API_KEY")?.trim();
  if (!config.configured || !key) {
    throw new GoogleProviderDiagnosticError(config.diagnosticsStatus, config.safeMessage);
  }
  return key;
}

export function classifyGoogleProviderError(error: unknown): GoogleProviderDiagnosticError {
  if (error instanceof GoogleProviderDiagnosticError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (lower.includes("api key not valid") || lower.includes("permission denied") || lower.includes("unauthenticated") || lower.includes("401") || lower.includes("403")) {
    return new GoogleProviderDiagnosticError("provider_auth_failed", "Google provider authentication failed. Check GOOGLE_AI_API_KEY.");
  }
  if (lower.includes("not found") || lower.includes("model") && (lower.includes("unavailable") || lower.includes("not supported")) || lower.includes("404")) {
    return new GoogleProviderDiagnosticError("provider_model_unavailable", `Google provider model is unavailable. Resolved model: ${resolveGoogleAIProviderConfig().resolvedModel}.`);
  }
  if (lower.includes("rate") || lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("429")) {
    return new GoogleProviderDiagnosticError("provider_rate_limited", "Google provider rate limit or quota was reached.");
  }
  return new GoogleProviderDiagnosticError("provider_execution_failed", "Google provider execution failed before returning a usable result.");
}
