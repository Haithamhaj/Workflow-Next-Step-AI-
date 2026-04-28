import type {
  StageCopilotForbiddenAction,
  StageCopilotProfile,
  StageCopilotRoutedRecommendation,
  StageCopilotRuntimeMode,
} from "@workflow/contracts";

export type StageCopilotBoundaryViolationCode =
  | "autonomous_writes_not_allowed"
  | "write_policy_must_be_no_writes"
  | "routed_recommendations_only_required"
  | "admin_confirmation_required"
  | "forbidden_action"
  | "provider_execution_not_allowed"
  | "prompt_mutation_not_allowed"
  | "analysis_mutation_not_allowed"
  | "package_eligibility_mutation_not_allowed"
  | "readiness_mutation_not_allowed"
  | "official_analysis_rerun_not_allowed"
  | "source_of_truth_mutation_not_allowed"
  | "auto_execution_not_allowed"
  | "missing_admin_confirmation"
  | "provider_backed_runtime_not_allowed"
  | "runtime_mode_not_safe_for_foundation"
  | "advisory_what_if_not_enabled"
  | "advisory_what_if_must_be_advisory_only";

export interface StageCopilotBoundaryCheck {
  ok: boolean;
  violations: StageCopilotBoundaryViolationCode[];
}

export type StageCopilotAnalysisMutationAction =
  | "mutate_analysis_outputs"
  | "rerun_official_analysis";

export type StageCopilotBoundaryAction =
  | StageCopilotForbiddenAction
  | StageCopilotAnalysisMutationAction;

export interface StageCopilotRuntimeIntent {
  requestedActions?: readonly string[];
  writesRecords?: boolean;
  autonomousWriteRequested?: boolean;
  executesAutomatically?: boolean;
  requiresAdminConfirmation?: boolean;
  providerExecutionRequested?: boolean;
  promptMutationRequested?: boolean;
  promptPromotionRequested?: boolean;
  analysisRecordMutationRequested?: boolean;
  officialAnalysisRerunRequested?: boolean;
  packageEligibilityMutationRequested?: boolean;
  readinessMutationRequested?: boolean;
  sourceOfTruthMutationRequested?: boolean;
}

export interface StageCopilotAdvisoryWhatIfLabel {
  advisoryOnly: true;
  label: string;
  scenario: string;
  doesNotMutateOfficialRecords: true;
  doesNotRerunOfficialAnalysis: true;
  doesNotChangeReadiness: true;
  doesNotChangePackageEligibility: true;
  doesNotGeneratePackageOutput: true;
}

export const STAGE_COPILOT_ANALYSIS_MUTATION_ACTIONS: readonly StageCopilotAnalysisMutationAction[] = [
  "mutate_analysis_outputs",
  "rerun_official_analysis",
];

export const STAGE_COPILOT_FORBIDDEN_BOUNDARY_ACTIONS: readonly StageCopilotBoundaryAction[] = [
  "approve_gates",
  "approve_transcripts",
  "approve_reject_evidence",
  "mutate_records",
  "run_providers",
  "generate_packages",
  "send_messages",
  "change_readiness",
  "change_package_eligibility",
  "promote_prompts",
  "release_final_package",
  "execute_pass7_review_actions",
  "alter_source_of_truth_records",
  ...STAGE_COPILOT_ANALYSIS_MUTATION_ACTIONS,
];

const forbiddenActionSet = new Set<string>(STAGE_COPILOT_FORBIDDEN_BOUNDARY_ACTIONS);

function uniqueViolations(violations: StageCopilotBoundaryViolationCode[]): StageCopilotBoundaryCheck {
  return {
    ok: violations.length === 0,
    violations: [...new Set(violations)],
  };
}

function requestedActions(intent: StageCopilotRuntimeIntent): readonly string[] {
  return intent.requestedActions ?? [];
}

function actionViolation(action: string): StageCopilotBoundaryViolationCode {
  if (action === "run_providers") return "provider_execution_not_allowed";
  if (action === "promote_prompts") return "prompt_mutation_not_allowed";
  if (action === "change_readiness") return "readiness_mutation_not_allowed";
  if (action === "change_package_eligibility") return "package_eligibility_mutation_not_allowed";
  if (action === "alter_source_of_truth_records") return "source_of_truth_mutation_not_allowed";
  if (action === "mutate_analysis_outputs") return "analysis_mutation_not_allowed";
  if (action === "rerun_official_analysis") return "official_analysis_rerun_not_allowed";
  return "forbidden_action";
}

export function isStageCopilotForbiddenAction(action: string): action is StageCopilotBoundaryAction {
  return forbiddenActionSet.has(action);
}

export function assertStageCopilotReadOnlyBoundary(
  profile: Pick<StageCopilotProfile, "readWriteBoundary">,
  intent: StageCopilotRuntimeIntent = {},
): StageCopilotBoundaryCheck {
  const violations: StageCopilotBoundaryViolationCode[] = [];
  const boundary = profile.readWriteBoundary;

  if (boundary.writePolicy !== "no_writes") violations.push("write_policy_must_be_no_writes");
  if (boundary.autonomousWritesAllowed !== false || boundary.noAutonomousWrites !== true) {
    violations.push("autonomous_writes_not_allowed");
  }
  if (boundary.routedRecommendationsOnly !== true) violations.push("routed_recommendations_only_required");
  if (boundary.adminConfirmationRequired !== true) violations.push("admin_confirmation_required");

  if (intent.writesRecords || intent.autonomousWriteRequested) violations.push("autonomous_writes_not_allowed");
  if (intent.executesAutomatically) violations.push("auto_execution_not_allowed");
  if (intent.requiresAdminConfirmation === false) violations.push("missing_admin_confirmation");

  for (const action of requestedActions(intent)) {
    if (isStageCopilotForbiddenAction(action)) violations.push(actionViolation(action));
  }

  return uniqueViolations(violations);
}

export function assertStageCopilotNoProviderExecution(intent: StageCopilotRuntimeIntent = {}): StageCopilotBoundaryCheck {
  const violations: StageCopilotBoundaryViolationCode[] = [];
  if (intent.providerExecutionRequested) violations.push("provider_execution_not_allowed");
  if (requestedActions(intent).some((action) => action === "run_providers")) {
    violations.push("provider_execution_not_allowed");
  }
  return uniqueViolations(violations);
}

export function assertStageCopilotNoAnalysisMutation(intent: StageCopilotRuntimeIntent = {}): StageCopilotBoundaryCheck {
  const violations: StageCopilotBoundaryViolationCode[] = [];

  if (intent.promptMutationRequested || intent.promptPromotionRequested) violations.push("prompt_mutation_not_allowed");
  if (intent.analysisRecordMutationRequested) violations.push("analysis_mutation_not_allowed");
  if (intent.officialAnalysisRerunRequested) violations.push("official_analysis_rerun_not_allowed");
  if (intent.packageEligibilityMutationRequested) violations.push("package_eligibility_mutation_not_allowed");
  if (intent.readinessMutationRequested) violations.push("readiness_mutation_not_allowed");
  if (intent.sourceOfTruthMutationRequested) violations.push("source_of_truth_mutation_not_allowed");

  for (const action of requestedActions(intent)) {
    if (isStageCopilotForbiddenAction(action)) violations.push(actionViolation(action));
  }

  return uniqueViolations(violations);
}

export function validateStageCopilotRoutedRecommendationSafety(
  recommendation: StageCopilotRoutedRecommendation | {
    actionKey?: string;
    requiresAdminConfirmation?: boolean;
    executesAutomatically?: boolean;
  },
): StageCopilotBoundaryCheck {
  const violations: StageCopilotBoundaryViolationCode[] = [];

  if (recommendation.requiresAdminConfirmation !== true) violations.push("missing_admin_confirmation");
  if (recommendation.executesAutomatically !== false) violations.push("auto_execution_not_allowed");

  const actionKey = recommendation.actionKey;
  if (typeof actionKey === "string" && isStageCopilotForbiddenAction(actionKey)) {
    violations.push(actionViolation(actionKey));
  }

  return uniqueViolations(violations);
}

export function labelStageCopilotAdvisoryWhatIf(
  profile: Pick<StageCopilotProfile, "advisoryModePolicy">,
  scenario: string,
): StageCopilotAdvisoryWhatIfLabel | StageCopilotBoundaryCheck {
  if (!profile.advisoryModePolicy.advisoryWhatIfAllowed) {
    return uniqueViolations(["advisory_what_if_not_enabled"]);
  }
  if (profile.advisoryModePolicy.advisoryOnly !== true) {
    return uniqueViolations(["advisory_what_if_must_be_advisory_only"]);
  }

  return {
    advisoryOnly: true,
    label: "Advisory what-if only: this discussion does not change official workflow records.",
    scenario,
    doesNotMutateOfficialRecords: true,
    doesNotRerunOfficialAnalysis: true,
    doesNotChangeReadiness: true,
    doesNotChangePackageEligibility: true,
    doesNotGeneratePackageOutput: true,
  };
}

export function assertStageCopilotRuntimeModeSafeForFoundation(
  runtimeMode: StageCopilotRuntimeMode,
  intent: StageCopilotRuntimeIntent = {},
): StageCopilotBoundaryCheck {
  const violations: StageCopilotBoundaryViolationCode[] = [];

  if (runtimeMode === "provider_backed") violations.push("provider_backed_runtime_not_allowed");
  if (runtimeMode === "deterministic_mock") {
    if (intent.writesRecords || intent.autonomousWriteRequested || intent.executesAutomatically) {
      violations.push("runtime_mode_not_safe_for_foundation");
    }
    if (intent.providerExecutionRequested) violations.push("provider_execution_not_allowed");
  }

  return uniqueViolations(violations);
}
