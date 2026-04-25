/**
 * PromptSpec foundation contracts for later Pass 3 prompt edit/test work.
 * Patch 1 stores shape only; no provider-backed prompt execution is claimed.
 */

export type PromptSpecStatus = "draft" | "active" | "previous" | "archived";

export interface StructuredPromptSpecBlock {
  blockId: string;
  label: string;
  body: string;
  editable: boolean;
}

export interface StructuredPromptSpec {
  promptSpecId: string;
  linkedModule: string;
  purpose: string;
  status: PromptSpecStatus;
  version: number;
  blocks: StructuredPromptSpecBlock[];
  inputContractRef?: string;
  outputContractRef?: string;
  previousActivePromptSpecId?: string;
  createdAt: string;
  updatedAt: string;
}

export type Pass3PromptCapability = "hierarchy_draft" | "source_hierarchy_triage";

export interface Pass3PromptTestRun {
  testRunId: string;
  promptSpecId: string;
  promptVersionId: string;
  capability: Pass3PromptCapability;
  caseContextUsed: string;
  testInput: string;
  activePromptOutput?: string;
  draftPromptOutput?: string;
  provider?: "google" | "openai";
  model?: string;
  activePromptVersion: number;
  draftPromptVersion: number;
  comparisonSummary: string;
  boundaryViolationFlags: string[];
  providerStatus:
    | "provider_not_configured"
    | "provider_auth_failed"
    | "provider_model_unavailable"
    | "provider_rate_limited"
    | "provider_execution_failed"
    | "provider_success";
  errorMessage?: string;
  adminNote?: string;
  createdAt: string;
}
