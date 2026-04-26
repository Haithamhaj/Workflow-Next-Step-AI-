import {
  createInMemoryStore,
  createSQLiteIntakeRepositories,
  type InMemoryStore,
} from "@workflow/persistence";

// Survive Next.js hot-reloads in dev by persisting to globalThis.
declare const globalThis: typeof global & { __workflowStore__?: InMemoryStore };

const intakeRepositories = createSQLiteIntakeRepositories();

export const store: InMemoryStore = globalThis.__workflowStore__ ?? (globalThis.__workflowStore__ = {
  ...createInMemoryStore(),
  intakeSessions: intakeRepositories.intakeSessions,
  intakeSources: intakeRepositories.intakeSources,
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
});
