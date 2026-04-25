import { existsSync, readFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

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
let localEnvLoaded = false;

function processEnv(): Record<string, string | undefined> | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined>; cwd?: () => string } | undefined)?.env;
  } catch {
    return undefined;
  }
}

function currentWorkingDirectory(): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { cwd?: () => string } | undefined)?.cwd?.();
  } catch {
    return undefined;
  }
}

function parseEnvValue(value: string): string {
  const trimmed = value.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  const commentIndex = trimmed.indexOf(" #");
  return commentIndex >= 0 ? trimmed.slice(0, commentIndex).trimEnd() : trimmed;
}

function loadEnvFile(path: string, env: Record<string, string | undefined>): void {
  if (!existsSync(path)) return;
  const body = readFileSync(path, "utf8");
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const withoutExport = line.startsWith("export ") ? line.slice("export ".length).trimStart() : line;
    const equals = withoutExport.indexOf("=");
    if (equals <= 0) continue;
    const key = withoutExport.slice(0, equals).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    if (env[key] !== undefined) continue;
    env[key] = parseEnvValue(withoutExport.slice(equals + 1));
  }
}

function loadLocalEnvFiles(): void {
  if (localEnvLoaded) return;
  localEnvLoaded = true;
  const env = processEnv();
  if (!env) return;

  const cwd = currentWorkingDirectory();
  const roots = new Set<string>();
  if (cwd) {
    roots.add(cwd);
    if (basename(cwd) === "admin-web") roots.add(resolve(cwd, "../.."));
  }
  if (env.INIT_CWD) roots.add(env.INIT_CWD);
  if (env.WORKFLOW_REPO_ROOT) roots.add(env.WORKFLOW_REPO_ROOT);

  const files = new Set<string>();
  if (env.WORKFLOW_ENV_FILE) files.add(env.WORKFLOW_ENV_FILE);
  for (const root of roots) {
    files.add(join(root, ".env.local"));
    files.add(join(root, ".env"));
  }

  for (const file of files) loadEnvFile(file, env);
}

export function getEnv(key: string): string | undefined {
  loadLocalEnvFiles();
  try {
    return processEnv()?.[key];
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
