import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateFirstPassExtractionOutput } from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import { runFirstPassExtractionForSession } from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";
const dbPath = join(tmpdir(), "workflow-pass5-block14-nested-extraction-governance.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

function participantSession(sessionId) {
  return {
    sessionId,
    caseId: "case-pass5-block14-nested",
    targetingPlanId: "targeting-plan-pass5-block14-nested",
    targetCandidateId: `candidate-${sessionId}`,
    participantContactProfileId: `profile-${sessionId}`,
    participantLabel: "Operations participant",
    participantRoleOrNodeId: "role-operations-participant",
    selectedDepartment: "Operations",
    selectedUseCase: "Order approval",
    languagePreference: "en",
    sessionState: "first_narrative_received",
    channelStatus: "channel_selected_pending_dispatch",
    selectedParticipationMode: "web_session_chatbot",
    sessionContext: {
      sessionId,
      caseId: "case-pass5-block14-nested",
      targetingPlanId: "targeting-plan-pass5-block14-nested",
      targetCandidateId: `candidate-${sessionId}`,
      participantContactProfileId: `profile-${sessionId}`,
      participantLabel: "Operations participant",
      participantRoleOrNodeId: "role-operations-participant",
      selectedDepartment: "Operations",
      selectedUseCase: "Order approval",
      languagePreference: "en",
    },
    channelAccess: {
      selectedParticipationMode: "web_session_chatbot",
      channelStatus: "channel_selected_pending_dispatch",
      sessionAccessTokenId: null,
      telegramBindingId: null,
      dispatchReference: null,
      notes: null,
    },
    rawEvidence: {
      rawEvidenceItems: [],
      firstNarrativeEvidenceId: null,
    },
    analysisProgress: {
      firstNarrativeStatus: "received_text",
      extractionStatus: "eligible",
      clarificationItemIds: [],
      boundarySignalIds: [],
      unresolvedItemIds: [],
      nextActionIds: [],
    },
    rawEvidenceItems: [],
    firstNarrativeStatus: "received_text",
    firstNarrativeEvidenceId: null,
    extractionStatus: "eligible",
    clarificationItems: [],
    boundarySignals: [],
    unresolvedItems: [],
    createdAt: now,
    updatedAt: now,
  };
}

function rawEvidence(sessionId, evidenceItemId) {
  return {
    evidenceItemId,
    sessionId,
    evidenceType: "participant_text_narrative",
    sourceChannel: "web_session_chatbot",
    rawContent: "I check the order. If the price is sensitive, Finance handles the threshold.",
    language: "en",
    capturedAt: now,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Block 14 nested extraction hardening proof evidence.",
  };
}

function extractedItem(evidenceItemId, overrides = {}) {
  return {
    itemId: `step-${evidenceItemId}`,
    label: "Check order",
    description: "The participant checks the order.",
    evidenceAnchors: [{ evidenceItemId, quote: "I check the order", startOffset: 0, endOffset: 17, note: "Provider anchor." }],
    sourceTextSpan: { evidenceItemId, quote: "I check the order", startOffset: 0, endOffset: 17 },
    completenessStatus: "clear",
    confidenceLevel: "high",
    needsClarification: false,
    clarificationReason: "",
    relatedItemIds: [],
    adminReviewStatus: "not_reviewed",
    createdFrom: "ai_extraction",
    ...overrides,
  };
}

function extractionOutput(sessionId, evidenceItemId, itemOverrides = {}) {
  return {
    extractionId: `extraction-${sessionId}`,
    sessionId,
    basisEvidenceItemIds: [evidenceItemId],
    extractionStatus: "completed_clean",
    extractedActors: [],
    extractedSteps: [extractedItem(evidenceItemId, itemOverrides)],
    sequenceMap: {
      orderedItemIds: [`step-${evidenceItemId}`],
      sequenceLinks: [],
      unclearTransitions: [],
      notes: ["Participant-level sequence draft only."],
    },
    extractedDecisionPoints: [],
    extractedHandoffs: [],
    extractedExceptions: [],
    extractedSystems: [],
    extractedControls: [],
    extractedDependencies: [],
    extractedUnknowns: [],
    boundarySignals: [],
    clarificationCandidates: [],
    confidenceNotes: [],
    contradictionNotes: [],
    sourceCoverageSummary: "provider draft before governed source coverage rewrite",
    unmappedContentItems: [],
    extractionDefects: [],
    evidenceDisputes: [],
    createdAt: now,
  };
}

function withoutEvidenceAnchors(sessionId, evidenceItemId) {
  return extractionOutput(sessionId, evidenceItemId, { evidenceAnchors: undefined });
}

function seed(repos, sessionId, evidenceItemId) {
  repos.participantSessions.save(participantSession(sessionId));
  repos.rawEvidenceItems.save(rawEvidence(sessionId, evidenceItemId));
}

function extractionRepos(repos) {
  return {
    participantSessions: repos.participantSessions,
    rawEvidenceItems: repos.rawEvidenceItems,
    firstPassExtractionOutputs: repos.firstPassExtractionOutputs,
    clarificationCandidates: repos.clarificationCandidates,
    boundarySignals: repos.boundarySignals,
    evidenceDisputes: repos.evidenceDisputes,
    providerJobs: repos.providerJobs,
    promptSpecs: repos.structuredPromptSpecs,
  };
}

class NestedRepairProvider {
  constructor(sessionId, evidenceItemId, repairMode) {
    this.name = "google";
    this.calls = [];
    this.sessionId = sessionId;
    this.evidenceItemId = evidenceItemId;
    this.repairMode = repairMode;
  }

  async runPromptText(input) {
    this.calls.push(input.compiledPrompt);
    if (this.calls.length === 1) {
      return {
        provider: "google",
        model: "deterministic-nested-malformed-output",
        text: JSON.stringify(withoutEvidenceAnchors(this.sessionId, this.evidenceItemId)),
      };
    }
    assert.ok(input.compiledPrompt.includes("missing_or_invalid_evidenceAnchors"));
    assert.ok(input.compiledPrompt.includes("Do not invent quotes"));
    const output = this.repairMode === "valid-anchor"
      ? extractionOutput(this.sessionId, this.evidenceItemId)
      : withoutEvidenceAnchors(this.sessionId, this.evidenceItemId);
    return {
      provider: "google",
      model: `deterministic-nested-repair-${this.repairMode}`,
      text: JSON.stringify(output),
    };
  }
}

class EmptyAnchorProvider {
  constructor(sessionId, evidenceItemId) {
    this.name = "google";
    this.calls = [];
    this.sessionId = sessionId;
    this.evidenceItemId = evidenceItemId;
  }

  async runPromptText(input) {
    this.calls.push(input.compiledPrompt);
    return {
      provider: "google",
      model: "deterministic-empty-anchor-output",
      text: JSON.stringify(extractionOutput(this.sessionId, this.evidenceItemId, { evidenceAnchors: [] })),
    };
  }
}

const repos = createSQLiteIntakeRepositories(dbPath);

seed(repos, "session-nested-repair-valid", "evidence-nested-repair-valid");
const validRepairProvider = new NestedRepairProvider("session-nested-repair-valid", "evidence-nested-repair-valid", "valid-anchor");
const validRepair = await runFirstPassExtractionForSession("session-nested-repair-valid", extractionRepos(repos), validRepairProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-nested-repair-valid",
  providerJobIdFactory: () => "provider-job-nested-repair-valid",
});
assert.equal(validRepair.ok, true, validRepair.ok ? "" : JSON.stringify(validRepair.errors));
assert.equal(validRepairProvider.calls.length, 2);
assert.equal(validateFirstPassExtractionOutput(validRepair.createdExtraction).ok, true);
assert.equal(validRepair.createdExtraction.extractedSteps[0].evidenceAnchors.length, 1);
assert.equal(repos.providerJobs.findById("provider-job-nested-repair-valid:repair")?.status, "succeeded");

seed(repos, "session-nested-repair-fails", "evidence-nested-repair-fails");
const failedRepairProvider = new NestedRepairProvider("session-nested-repair-fails", "evidence-nested-repair-fails", "still-malformed");
const failedRepair = await runFirstPassExtractionForSession("session-nested-repair-fails", extractionRepos(repos), failedRepairProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-nested-repair-fails",
  providerJobIdFactory: () => "provider-job-nested-repair-fails",
});
assert.equal(failedRepair.ok, false);
assert.equal(failedRepairProvider.calls.length, 2);
assert.equal(failedRepair.errors[0].code, "invalid_provider_extraction_output");
assert.ok(failedRepair.errors[0].message.includes("missing_or_invalid_evidenceAnchors"));
assert.equal(repos.providerJobs.findById("provider-job-nested-repair-fails")?.status, "failed");
assert.equal(repos.providerJobs.findById("provider-job-nested-repair-fails:repair")?.status, "failed");
assert.equal(repos.participantSessions.findById("session-nested-repair-fails")?.extractionStatus, "failed");
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-nested-repair-fails"), null);

seed(repos, "session-empty-anchor-downgrade", "evidence-empty-anchor-downgrade");
const emptyAnchorProvider = new EmptyAnchorProvider("session-empty-anchor-downgrade", "evidence-empty-anchor-downgrade");
const downgraded = await runFirstPassExtractionForSession("session-empty-anchor-downgrade", extractionRepos(repos), emptyAnchorProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-empty-anchor-downgrade",
  providerJobIdFactory: () => "provider-job-empty-anchor-downgrade",
});
assert.equal(downgraded.ok, true, downgraded.ok ? "" : JSON.stringify(downgraded.errors));
assert.equal(emptyAnchorProvider.calls.length, 1);
assert.equal(downgraded.createdExtraction.extractedSteps.length, 0);
assert.equal(downgraded.defects.length > 0, true);
assert.equal(downgraded.defects[0].defectType, "missing_evidence_anchor");
assert.equal(downgraded.createdExtraction.extractionStatus, "completed_with_defects");
assert.equal(repos.providerJobs.findById("provider-job-empty-anchor-downgrade")?.status, "succeeded");

console.log(JSON.stringify({
  ok: true,
  validRepairCalls: validRepairProvider.calls.length,
  failedRepairCalls: failedRepairProvider.calls.length,
  emptyAnchorCalls: emptyAnchorProvider.calls.length,
  failedMainJobStatus: repos.providerJobs.findById("provider-job-nested-repair-fails")?.status,
  failedRepairJobStatus: repos.providerJobs.findById("provider-job-nested-repair-fails:repair")?.status,
  emptyAnchorDowngradedToDefect: downgraded.defects[0].defectType,
  noCleanExtractionAcceptedFromMalformedNestedOutput: repos.firstPassExtractionOutputs.findById("extraction-nested-repair-fails") === null,
}, null, 2));
