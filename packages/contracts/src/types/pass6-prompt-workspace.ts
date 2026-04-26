export type Pass6PromptSpecStatus = "draft" | "active" | "previous" | "archived";

export type Pass6PromptCapabilityKey =
  | "synthesis"
  | "difference_interpretation"
  | "evaluation"
  | "initial_package_drafting"
  | "admin_explanation"
  | "pre_package_inquiry_generation"
  | "optional_draft_document_generation"
  | "visual_narrative_support"
  | "pass6_analysis_copilot";

export type Pass6PromptTestCaseStatus = "draft" | "enabled" | "disabled" | "archived";
export type Pass6PromptTestExecutionStatus = "succeeded" | "failed";

export interface Pass6PromptProviderPreference {
  providerKey?: string;
  modelKey?: string;
  preferenceReason?: string;
}

export interface Pass6PromptStructuredSections {
  roleDefinition: string;
  missionOrTaskPurpose: string;
  caseContextInputs: string;
  sourceAndEvidenceRules: string;
  methodOrPolicyRules: string;
  outputContract: string;
  boundariesAndProhibitions: string;
  adminReviewNotes: string;
  evaluationChecklist: string;
  examplesOrGoldenCases: string;
}

export interface Pass6PromptSpec {
  promptSpecId: string;
  capabilityKey: Pass6PromptCapabilityKey;
  name: string;
  description: string;
  version: string;
  status: Pass6PromptSpecStatus;
  providerPreference?: Pass6PromptProviderPreference;
  linkedPolicyConfigId?: string;
  linkedPolicyConfigVersion?: string;
  sections: Pass6PromptStructuredSections;
  compiledPromptPreview: string;
  testCaseIds: string[];
  previousActivePromptSpecId?: string;
  basedOnPromptSpecId?: string;
  archivedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type Pass6PromptJsonValue =
  | string
  | number
  | boolean
  | null
  | Pass6PromptJsonValue[]
  | { [key: string]: Pass6PromptJsonValue };

export interface Pass6PromptTestCase {
  testCaseId: string;
  promptSpecId: string;
  name: string;
  inputFixture: { [key: string]: Pass6PromptJsonValue };
  expectedOutputNotes: string;
  status: Pass6PromptTestCaseStatus;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Pass6PromptTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface Pass6PromptTestExecutionResult {
  executionId: string;
  promptSpecId: string;
  promptSpecVersion: string;
  promptStatusAtRun: "draft" | "active";
  testCaseId: string;
  providerName: string;
  modelName: string;
  startedAt: string;
  completedAt: string;
  status: Pass6PromptTestExecutionStatus;
  latencyMs?: number;
  inputFixtureSummary: string;
  compiledPromptSnapshot: string;
  outputText?: string;
  outputJson?: Pass6PromptJsonValue;
  errorCode?: string;
  errorMessage?: string;
  tokenUsage?: Pass6PromptTokenUsage;
  costEstimate?: string;
  configProfileId?: string;
  policyReferences?: string[];
  createdRecords: {
    synthesisInputBundleIds: string[];
    workflowClaimIds: string[];
    workflowReadinessResultIds: string[];
    prePackageGateResultIds: string[];
    initialWorkflowPackageIds: string[];
    workflowGraphRecordIds: string[];
    pass7ReviewCandidateIds: string[];
  };
}
