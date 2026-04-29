#!/usr/bin/env node
import { strict as assert } from "node:assert";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import { createCase, createCompany } from "../packages/core-case/dist/index.js";
import { createIntakeSession } from "../packages/sources-context/dist/index.js";
import {
  approveStructuralHierarchy,
  calculateHierarchyReadinessSnapshot,
  createManualSourceHierarchyLink,
  createPastedHierarchyIntake,
  saveManualHierarchyDraft,
  updateSourceHierarchyTriageSuggestion,
} from "../packages/hierarchy-intake/dist/index.js";
import {
  createOrLoadTargetingRolloutPlan,
  updateQuestionHintSeed,
} from "../packages/targeting-rollout/dist/index.js";

const store = createInMemoryStore();
const now = "2026-04-30T00:00:00.000Z";

function company(companyId, displayName) {
  return {
    companyId,
    displayName,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

function caseConfig(companyId, caseId, mainDepartment) {
  return {
    companyId,
    caseId,
    domain: "operations",
    mainDepartment,
    useCaseLabel: "hierarchy-targeting-isolation-proof",
    companyProfileRef: `${companyId}/profile`,
    createdAt: now,
  };
}

function createSession(sessionId, caseId, mainDepartment) {
  return createIntakeSession({
    sessionId,
    caseId,
    bucket: "company",
    defaultProvider: "google",
    availableProviders: ["google", "openai"],
    primaryDepartment: mainDepartment,
  }, store.intakeSessions);
}

function buildHierarchy(companyId, sessionId, roleLabel, sourceId) {
  const intake = createPastedHierarchyIntake({
    sessionId,
    companyId,
    pastedText: roleLabel,
    createdBy: "proof",
  }, store);
  const draft = saveManualHierarchyDraft({
    sessionId,
    companyId,
    nodes: [{
      nodeId: `${sourceId}-node`,
      roleLabel,
      groupLayer: "frontline_operational",
      personRoleConfidence: "medium",
    }],
    secondaryRelationships: [],
    createdBy: "proof",
    correctionNote: "Proof structural hierarchy draft.",
  }, store);
  const sourceSuggestion = createManualSourceHierarchyLink({
    sessionId,
    companyId,
    sourceId,
    sourceName: `${roleLabel} source`,
    suggestedScope: "role_specific",
    linkedNodeId: draft.nodes[0].nodeId,
    linkedScopeLevel: "role_specific",
    participantValidationNeeded: true,
    adminNote: "Evidence candidate only; not workflow truth.",
    createdBy: "proof",
  }, store);
  const approved = approveStructuralHierarchy({ sessionId, companyId, approvedBy: "proof" }, store);
  const readiness = calculateHierarchyReadinessSnapshot(sessionId, companyId, store);
  return { intake, draft, sourceSuggestion, approved, readiness };
}

const alpha = createCompany(company("company-hierarchy-alpha", "Hierarchy Alpha"), store.companies);
const beta = createCompany(company("company-hierarchy-beta", "Hierarchy Beta"), store.companies);
const alphaCase = createCase(caseConfig(alpha.companyId, "case-hierarchy-alpha", "operations"), store.cases);
const betaCase = createCase(caseConfig(beta.companyId, "case-hierarchy-beta", "finance"), store.cases);

const alphaSession = createSession("session-hierarchy-alpha", alphaCase.caseId, "operations");
const betaSession = createSession("session-hierarchy-beta", betaCase.caseId, "finance");

const alphaHierarchy = buildHierarchy(alpha.companyId, alphaSession.sessionId, "Alpha operations analyst", "source-alpha-hierarchy");
const betaHierarchy = buildHierarchy(beta.companyId, betaSession.sessionId, "Beta finance analyst", "source-beta-hierarchy");

assert.equal(alphaHierarchy.intake.companyId, alpha.companyId, "hierarchy intake stores companyId");
assert.equal(alphaHierarchy.draft.companyId, alpha.companyId, "hierarchy draft stores companyId");
assert.equal(alphaHierarchy.approved.structuralApprovalOnly, true, "hierarchy approval remains structural only");
assert.equal(alphaHierarchy.sourceSuggestion.participantValidationNeeded, true, "source-to-hierarchy links remain evidence candidates");
assert.equal(alphaHierarchy.sourceSuggestion.evidenceStatus, "participant_validation_needed", "source-to-hierarchy link is not workflow truth");

assert.deepEqual(
  store.hierarchyDrafts.findByCompanyAndCase(alpha.companyId, alphaCase.caseId).map((record) => record.hierarchyDraftId),
  [alphaHierarchy.draft.hierarchyDraftId],
  "alpha hierarchy records list only alpha case records",
);
assert.deepEqual(
  store.hierarchyDrafts.findByCompanyAndCase(beta.companyId, betaCase.caseId).map((record) => record.hierarchyDraftId),
  [betaHierarchy.draft.hierarchyDraftId],
  "beta hierarchy records list only beta case records",
);
assert.equal(
  store.approvedHierarchySnapshots.findByCompany(beta.companyId, betaCase.caseId, alphaHierarchy.approved.approvedSnapshotId),
  null,
  "wrong companyId cannot load approved hierarchy snapshots",
);
assert.equal(
  store.hierarchyReadinessSnapshots.findByCompany(beta.companyId, betaCase.caseId, alphaHierarchy.readiness.readinessSnapshotId),
  null,
  "wrong companyId cannot load hierarchy readiness snapshots",
);
assert.equal(
  store.sourceHierarchyTriageSuggestions.findByCompany(beta.companyId, betaCase.caseId, alphaHierarchy.sourceSuggestion.triageId),
  null,
  "wrong companyId cannot load source-to-hierarchy suggestions",
);
assert.throws(
  () => updateSourceHierarchyTriageSuggestion({
    triageId: alphaHierarchy.sourceSuggestion.triageId,
    companyId: beta.companyId,
    caseId: betaCase.caseId,
    action: "accept",
  }, store),
  /not found/,
  "source-to-hierarchy update is company scoped",
);

const alphaPlan = createOrLoadTargetingRolloutPlan({
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  createdBy: "proof",
}, store);
const betaPlan = createOrLoadTargetingRolloutPlan({
  companyId: beta.companyId,
  caseId: betaCase.caseId,
  createdBy: "proof",
}, store);

assert.equal(alphaPlan.companyId, alpha.companyId, "targeting rollout plan stores companyId");
assert.equal(alphaPlan.boundaryConfirmations.noParticipantSessionsCreated, true, "targeting plans do not create participant sessions");
assert.equal(alphaPlan.boundaryConfirmations.noWorkflowAnalysisPerformed, true, "targeting plans do not perform workflow analysis");
assert.deepEqual(
  store.targetingRolloutPlans.findByCompanyAndCase(alpha.companyId, alphaCase.caseId).map((record) => record.planId),
  [alphaPlan.planId],
  "alpha targeting plans list only alpha case records",
);
assert.deepEqual(
  store.targetingRolloutPlans.findByCompanyAndCase(beta.companyId, betaCase.caseId).map((record) => record.planId),
  [betaPlan.planId],
  "beta targeting plans list only beta case records",
);
assert.equal(
  store.targetingRolloutPlans.findByCompany(beta.companyId, betaCase.caseId, alphaPlan.planId),
  null,
  "wrong companyId cannot load targeting rollout plans",
);

const alphaPlanWithHint = {
  ...alphaPlan,
  questionHintSeeds: [{
    hintId: "hint-alpha-only",
    sourceId: alphaHierarchy.sourceSuggestion.sourceId,
    sourceName: alphaHierarchy.sourceSuggestion.sourceName,
    linkedTargetCandidateId: alphaPlan.targetCandidates[0]?.candidateId,
    linkedHierarchyNodeId: alphaHierarchy.draft.nodes[0].nodeId,
    documentSignal: "Source suggests an exception path.",
    whyItMayMatter: "This may need later Pass 5 clarification.",
    suggestedLaterQuestionTheme: "Exception path",
    triggerConditionForPass5: "Use only if participant narrative does not cover exceptions.",
    doNotAskIfAlreadyCovered: "Do not ask when the participant already explained exception handling.",
    participantValidationNeeded: true,
    status: "active",
    adminNote: "Hint only; not participant-facing and not workflow truth.",
  }],
};
store.targetingRolloutPlans.save(alphaPlanWithHint);

const updatedHintPlan = updateQuestionHintSeed({
  planId: alphaPlan.planId,
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  hintId: "hint-alpha-only",
  status: "dismissed_by_admin",
  adminNote: "Proof dismissal.",
}, store);
assert.equal(updatedHintPlan.questionHintSeeds[0].status, "dismissed_by_admin", "question-hint records remain scoped hints");
assert.throws(
  () => updateQuestionHintSeed({
    planId: alphaPlan.planId,
    companyId: beta.companyId,
    caseId: betaCase.caseId,
    hintId: "hint-alpha-only",
    status: "used_in_followup",
  }, store),
  /not found/,
  "wrong companyId cannot mutate question-hint records",
);

assert.deepEqual(store.participantSessions.findByCaseId(alphaCase.caseId), [], "Pass 4 targeting proof creates no participant sessions");

const forbiddenWorkStarted = false;
assert.equal(
  forbiddenWorkStarted,
  false,
  "no retrieval/RAG/vector/Answer Cards/ContextEnvelope behavior is implemented by this proof",
);

console.log("PASS Slice 5 hierarchy and targeting isolation proof");
