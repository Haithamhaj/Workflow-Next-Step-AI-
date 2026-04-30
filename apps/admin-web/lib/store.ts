import {
  createInMemoryStore,
  createSQLiteCoreRepositories,
  createSQLiteIntakeRepositories,
  createSQLiteStageCopilotRepositories,
  ensureDefaultLocalCompany,
  DEFAULT_LOCAL_COMPANY_ID,
  type InMemoryStore,
  type Case,
} from "@workflow/persistence";

// Survive Next.js hot-reloads in dev by persisting to globalThis.
declare const globalThis: typeof global & { __workflowStore__?: InMemoryStore };

const intakeRepositories = createSQLiteIntakeRepositories();
const stageCopilotRepositories = createSQLiteStageCopilotRepositories();
const coreRepositories = createSQLiteCoreRepositories();

function migrateLegacyCasesToSQLite(existing: InMemoryStore | undefined): void {
  if (!existing?.cases) return;
  for (const legacyCase of existing.cases.findAll() as Array<Case & { companyId?: string }>) {
    if (coreRepositories.cases.findById(legacyCase.caseId)) continue;
    coreRepositories.cases.save({
      ...legacyCase,
      companyId: legacyCase.companyId || DEFAULT_LOCAL_COMPANY_ID,
    });
  }
}

ensureDefaultLocalCompany(coreRepositories.companies);
migrateLegacyCasesToSQLite(globalThis.__workflowStore__);

const baseStore = globalThis.__workflowStore__ ?? createInMemoryStore();

export const store: InMemoryStore = (globalThis.__workflowStore__ = {
  ...baseStore,
  companies: coreRepositories.companies,
  cases: coreRepositories.cases,
  stageCopilotSystemPrompts: stageCopilotRepositories.stageCopilotSystemPrompts,
  intakeSessions: intakeRepositories.intakeSessions,
  intakeSources: intakeRepositories.intakeSources,
  framingRuns: intakeRepositories.framingRuns,
  framingSources: intakeRepositories.framingSources,
  framingCandidates: intakeRepositories.framingCandidates,
  caseEntryPackets: intakeRepositories.caseEntryPackets,
  sourceToCaseLinks: intakeRepositories.sourceToCaseLinks,
  operatorFramingInputs: intakeRepositories.operatorFramingInputs,
  providerJobs: intakeRepositories.providerJobs,
  textArtifacts: intakeRepositories.textArtifacts,
  embeddingJobs: intakeRepositories.embeddingJobs,
  aiIntakeSuggestions: intakeRepositories.aiIntakeSuggestions,
  adminIntakeDecisions: intakeRepositories.adminIntakeDecisions,
  websiteCrawlPlans: intakeRepositories.websiteCrawlPlans,
  websiteCrawlApprovals: intakeRepositories.websiteCrawlApprovals,
  crawledPageContents: intakeRepositories.crawledPageContents,
  websiteCrawlSiteSummaries: intakeRepositories.websiteCrawlSiteSummaries,
  contentChunks: intakeRepositories.contentChunks,
  audioTranscriptReviews: intakeRepositories.audioTranscriptReviews,
  departmentFraming: intakeRepositories.departmentFraming,
  structuredContexts: intakeRepositories.structuredContexts,
  finalPreHierarchyReviews: intakeRepositories.finalPreHierarchyReviews,
  hierarchyIntakes: intakeRepositories.hierarchyIntakes,
  hierarchyDrafts: intakeRepositories.hierarchyDrafts,
  hierarchyCorrections: intakeRepositories.hierarchyCorrections,
  approvedHierarchySnapshots: intakeRepositories.approvedHierarchySnapshots,
  hierarchyReadinessSnapshots: intakeRepositories.hierarchyReadinessSnapshots,
  structuredPromptSpecs: intakeRepositories.structuredPromptSpecs,
  sourceHierarchyTriageJobs: intakeRepositories.sourceHierarchyTriageJobs,
  sourceHierarchyTriageSuggestions: intakeRepositories.sourceHierarchyTriageSuggestions,
  pass3PromptTestRuns: intakeRepositories.pass3PromptTestRuns,
  targetingRolloutPlans: intakeRepositories.targetingRolloutPlans,
  pass4PromptTestRuns: intakeRepositories.pass4PromptTestRuns,
  participantSessions: intakeRepositories.participantSessions,
  sessionAccessTokens: intakeRepositories.sessionAccessTokens,
  telegramIdentityBindings: intakeRepositories.telegramIdentityBindings,
  rawEvidenceItems: intakeRepositories.rawEvidenceItems,
  firstPassExtractionOutputs: intakeRepositories.firstPassExtractionOutputs,
  clarificationCandidates: intakeRepositories.clarificationCandidates,
  boundarySignals: intakeRepositories.boundarySignals,
  evidenceDisputes: intakeRepositories.evidenceDisputes,
  sessionNextActions: intakeRepositories.sessionNextActions,
  pass6HandoffCandidates: intakeRepositories.pass6HandoffCandidates,
  pass6ConfigurationProfiles: intakeRepositories.pass6ConfigurationProfiles,
  pass6PromptSpecs: intakeRepositories.pass6PromptSpecs,
  pass6PromptTestCases: intakeRepositories.pass6PromptTestCases,
  pass6PromptTestExecutionResults: intakeRepositories.pass6PromptTestExecutionResults,
  synthesisInputBundles: intakeRepositories.synthesisInputBundles,
  prePackageGateResults: intakeRepositories.prePackageGateResults,
  clarificationNeeds: intakeRepositories.clarificationNeeds,
  inquiryPackets: intakeRepositories.inquiryPackets,
  externalInterfaceRecords: intakeRepositories.externalInterfaceRecords,
  workflowUnits: intakeRepositories.workflowUnits,
  workflowClaims: intakeRepositories.workflowClaims,
  analysisMethodUsages: intakeRepositories.analysisMethodUsages,
  differenceInterpretations: intakeRepositories.differenceInterpretations,
  assembledWorkflowDrafts: intakeRepositories.assembledWorkflowDrafts,
  workflowReadinessResults: intakeRepositories.workflowReadinessResults,
  initialWorkflowPackages: intakeRepositories.initialWorkflowPackages,
  workflowGapClosureBriefs: intakeRepositories.workflowGapClosureBriefs,
  draftOperationalDocuments: intakeRepositories.draftOperationalDocuments,
  workflowGraphRecords: intakeRepositories.workflowGraphRecords,
  pass6CopilotContextBundles: intakeRepositories.pass6CopilotContextBundles,
  pass6CopilotInteractions: intakeRepositories.pass6CopilotInteractions,
  pass7ReviewCandidates: intakeRepositories.pass7ReviewCandidates,
});
