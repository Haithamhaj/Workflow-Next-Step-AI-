/**
 * PromptSpec foundation contracts for later Pass 3 prompt edit/test work.
 * Patch 1 stores shape only; no provider-backed prompt execution is claimed.
 */

export type PromptSpecStatus = "draft" | "active" | "archived";

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
