import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateFirstPassExtractionOutput } from "../packages/contracts/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import { runFirstPassExtractionForSession } from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";
const dbPath = join(tmpdir(), "workflow-pass5-block14-extraction-governance-hardening.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

function participantSession(sessionId) {
  return {
    sessionId,
    caseId: "case-pass5-block14-hardening",
    targetingPlanId: "targeting-plan-pass5-block14-hardening",
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
      caseId: "case-pass5-block14-hardening",
      targetingPlanId: "targeting-plan-pass5-block14-hardening",
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
    notes: "Block 14 extraction hardening proof evidence.",
  };
}

function extractedItem(evidenceItemId) {
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
  };
}

function extractionOutput(sessionId, evidenceItemId) {
  return {
    extractionId: `extraction-${sessionId}`,
    sessionId,
    basisEvidenceItemIds: [evidenceItemId],
    extractionStatus: "completed_clean",
    extractedActors: [],
    extractedSteps: [extractedItem(evidenceItemId)],
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

function malformedWithoutExtractionDefects(sessionId, evidenceItemId) {
  const output = extractionOutput(sessionId, evidenceItemId);
  delete output.extractionDefects;
  return output;
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

class RepairingProvider {
  constructor(sessionId, evidenceItemId) {
    this.name = "google";
    this.calls = [];
    this.sessionId = sessionId;
    this.evidenceItemId = evidenceItemId;
  }

  async runPromptText(input) {
    this.calls.push(input.compiledPrompt);
    if (this.calls.length === 1) {
      return {
        provider: "google",
        model: "deterministic-malformed-provider-output",
        text: JSON.stringify(malformedWithoutExtractionDefects(this.sessionId, this.evidenceItemId)),
      };
    }
    assert.ok(input.compiledPrompt.includes("Repair the JSON to match the required schema."));
    assert.ok(input.compiledPrompt.includes("missing_required_array_field extractionDefects"));
    return {
      provider: "google",
      model: "deterministic-repair-provider-output",
      text: JSON.stringify(extractionOutput(this.sessionId, this.evidenceItemId)),
    };
  }
}

class FailingRepairProvider {
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
      model: "deterministic-failing-repair-provider-output",
      text: JSON.stringify(malformedWithoutExtractionDefects(this.sessionId, this.evidenceItemId)),
    };
  }
}

const repos = createSQLiteIntakeRepositories(dbPath);

seed(repos, "session-repair-succeeds", "evidence-repair-succeeds");
const repairingProvider = new RepairingProvider("session-repair-succeeds", "evidence-repair-succeeds");
const repaired = await runFirstPassExtractionForSession("session-repair-succeeds", extractionRepos(repos), repairingProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-repair-succeeds",
  providerJobIdFactory: () => "provider-job-repair-succeeds",
});
assert.equal(repaired.ok, true, repaired.ok ? "" : JSON.stringify(repaired.errors));
assert.equal(repairingProvider.calls.length, 2);
assert.equal(validateFirstPassExtractionOutput(repaired.createdExtraction).ok, true);
assert.deepEqual(repaired.createdExtraction.extractionDefects, []);
assert.equal(repaired.createdExtraction.extractedSteps[0].label, "Check order");
assert.equal(repos.providerJobs.findById("provider-job-repair-succeeds:repair")?.status, "succeeded");

seed(repos, "session-repair-fails", "evidence-repair-fails");
const failingProvider = new FailingRepairProvider("session-repair-fails", "evidence-repair-fails");
const failed = await runFirstPassExtractionForSession("session-repair-fails", extractionRepos(repos), failingProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-repair-fails",
  providerJobIdFactory: () => "provider-job-repair-fails",
});
assert.equal(failed.ok, false);
assert.equal(failingProvider.calls.length, 2);
assert.equal(failed.errors[0].code, "invalid_provider_extraction_output");
assert.ok(failed.errors[0].message.includes("missing_required_array_field extractionDefects"));
assert.equal(repos.providerJobs.findById("provider-job-repair-fails")?.status, "failed");
assert.equal(repos.providerJobs.findById("provider-job-repair-fails:repair")?.status, "failed");
assert.equal(repos.participantSessions.findById("session-repair-fails")?.extractionStatus, "failed");
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-repair-fails"), null);

console.log(JSON.stringify({
  ok: true,
  repairedProviderCalls: repairingProvider.calls.length,
  failedRepairProviderCalls: failingProvider.calls.length,
  repairedJobStatus: repos.providerJobs.findById("provider-job-repair-succeeds:repair")?.status,
  failedMainJobStatus: repos.providerJobs.findById("provider-job-repair-fails")?.status,
  failedRepairJobStatus: repos.providerJobs.findById("provider-job-repair-fails:repair")?.status,
  noCleanExtractionAcceptedFromMalformedOutput: repos.firstPassExtractionOutputs.findById("extraction-repair-fails") === null,
}, null, 2));
