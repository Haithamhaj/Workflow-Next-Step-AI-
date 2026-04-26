export type Pass6ConfigStatus = "draft" | "active" | "previous" | "archived";
export type Pass6ConfigScope = "global" | "domain" | "department" | "use_case" | "case";

export interface Pass6WeightedFactor {
  factorKey: string;
  label: string;
  weight: number;
  helperText?: string;
}

export interface Pass6ThresholdSetting {
  thresholdKey: string;
  label: string;
  value: number;
  helperText?: string;
}

export interface Pass6MethodConfig {
  methodKey:
    | "bpmn_process_structure"
    | "sipoc_boundary"
    | "triangulation"
    | "espoused_theory_vs_theory_in_use"
    | "raci_responsibility"
    | "ssm_multi_perspective"
    | "apqc_vocabulary";
  label: string;
  active: boolean;
  defaultPreference: "preferred" | "available" | "off_by_default";
  helperText?: string;
}

export interface Pass6SevenConditionDisplay {
  conditionKey:
    | "core_sequence_continuity"
    | "step_to_step_connection"
    | "essential_step_requirements"
    | "decision_rules_thresholds"
    | "handoffs_responsibility"
    | "controls_approvals"
    | "use_case_boundary";
  label: string;
  helperText: string;
  warningThreshold: number;
  blockerThreshold: number;
}

export interface Pass6LockedGovernanceRule {
  ruleId: string;
  label: string;
  description: string;
  locked: true;
}

export interface Pass6PolicySet {
  claimScoringPolicy: {
    weights: Pass6WeightedFactor[];
    adminReviewTriggerThreshold: number;
  };
  materialityPolicy: {
    weights: Pass6WeightedFactor[];
    materialConflictReviewThreshold: number;
  };
  differenceSeverityPolicy: {
    thresholds: Pass6ThresholdSetting[];
    adminReviewTriggerThreshold: number;
  };
  methodRegistryConfig: {
    methods: Pass6MethodConfig[];
    defaultSelectionPreference: string;
  };
  layerFitPolicy: {
    assumptions: string[];
    documentSourceInfluenceWeights: Pass6WeightedFactor[];
  };
  sevenConditionPolicy: {
    conditions: Pass6SevenConditionDisplay[];
    warningVsBlockerThresholds: Pass6ThresholdSetting[];
  };
  readinessRoutingPolicy: {
    warningThreshold: number;
    blockerThreshold: number;
    adminReviewTriggerThreshold: number;
    proceedWithWarningsMessageTemplate: string;
  };
  prePackageGatePolicy: {
    clarificationPriorityThreshold: number;
    reviewDecisionThreshold: number;
  };
  packageOutputPolicy: {
    clientFacingVisibility: string[];
    adminInternalVisibility: string[];
    packageWarningLanguageTemplate: string;
    optionalDraftDocumentEligibilityThreshold: number;
    methodologyReportSections?: string[];
    tableLayoutPreference?: string;
  };
  visualMapPolicy: {
    markerPreferences: string[];
    showWarnings: boolean;
    showUnresolved: boolean;
  };
  promptBehaviorProfile: {
    profileName: string;
    promptWorkspaceOwned: boolean;
    behaviorNotes: string[];
  };
}

export interface Pass6ConfigurationProfile {
  configId: string;
  version: string;
  status: Pass6ConfigStatus;
  scope: Pass6ConfigScope;
  scopeRef?: string;
  changedBy: string;
  changedAt: string;
  changeReason: string;
  effectiveFrom?: string;
  basedOnConfigId?: string;
  activeVsDraftComparisonSummary?: string;
  testResultSummary?: string;
  rollbackReference?: string;
  previousVersionConfigId?: string;
  policies: Pass6PolicySet;
  lockedGovernanceRules: Pass6LockedGovernanceRule[];
}
