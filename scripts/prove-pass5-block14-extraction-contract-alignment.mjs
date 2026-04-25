import assert from "node:assert/strict";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { validateFirstPassExtractionOutput } from "../packages/contracts/dist/index.js";
import { createInMemoryStore, createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";
import { compilePass5Prompt, registerPass5PromptFamily } from "../packages/prompts/dist/index.js";
import { runFirstPassExtractionForSession } from "../packages/participant-sessions/dist/index.js";

const now = "2026-04-25T00:00:00.000Z";
const dbPath = join(tmpdir(), "workflow-pass5-block14-extraction-contract-alignment.sqlite");
for (const suffix of ["", "-wal", "-shm"]) {
  const path = `${dbPath}${suffix}`;
  if (existsSync(path)) rmSync(path);
}

const promptStore = createInMemoryStore();
registerPass5PromptFamily(promptStore.structuredPromptSpecs, now);
const compiledExtractionPrompt = compilePass5Prompt("first_pass_extraction_prompt", {
  promptName: "first_pass_extraction_prompt",
  caseId: "case-contract-alignment",
  sessionId: "session-contract-alignment",
  languagePreference: "en",
  participantLabel: "Operations participant",
  selectedDepartment: "Operations",
  selectedUseCase: "Order approval",
  evidenceRefs: ["evidence-contract-alignment"],
  rawContent: "EvidenceItemId: evidence-contract-alignment\nRawContent:\nI check the order before Finance approves sensitive pricing.",
}, promptStore.structuredPromptSpecs);

const promptText = compiledExtractionPrompt.compiledPrompt;
for (const requiredText of [
  "All required fields must be present",
  "Required arrays must be present even when empty",
  "Canonical JSON skeleton",
  "extractionId",
  "extractedSteps",
  "sequenceMap",
  "unmappedContentItems",
  "extractionDefects",
  "evidenceDisputes",
  "createdAt",
  "itemId, label, description, evidenceAnchors[], sourceTextSpan, completenessStatus, confidenceLevel, needsClarification, clarificationReason, relatedItemIds[], adminReviewStatus, createdFrom",
  "clear|partial|vague|inferred|unresolved",
  "ai_extraction|admin_entry|participant_followup|system_rule",
  "then|conditional|parallel|optional|loop|unknown",
  "Do not invent evidence IDs",
]) {
  assert.ok(promptText.includes(requiredText), `compiled prompt missing required contract guidance: ${requiredText}`);
}

function participantSession(sessionId) {
  return {
    sessionId,
    caseId: "case-pass5-block14-contract-alignment",
    targetingPlanId: "targeting-plan-pass5-block14-contract-alignment",
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
      caseId: "case-pass5-block14-contract-alignment",
      targetingPlanId: "targeting-plan-pass5-block14-contract-alignment",
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
    rawContent: "I check the order before Finance approves sensitive pricing.",
    language: "en",
    capturedAt: now,
    capturedBy: "participant",
    trustStatus: "raw_unreviewed",
    confidenceScore: 1,
    originalFileName: null,
    providerJobId: null,
    linkedClarificationItemId: null,
    notes: "Block 14 extraction contract alignment evidence.",
  };
}

function extractedItem(evidenceItemId, overrides = {}) {
  return {
    itemId: `step-${evidenceItemId}`,
    label: "Check order",
    description: "The participant checks the order before Finance approval.",
    evidenceAnchors: [{ evidenceItemId, quote: "I check the order", note: "Direct participant statement." }],
    sourceTextSpan: { evidenceItemId, quote: "I check the order" },
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

function schemaInvalidMissingItemFields(sessionId, evidenceItemId) {
  return extractionOutput(sessionId, evidenceItemId, {
    label: undefined,
    description: undefined,
    sourceTextSpan: undefined,
    completenessStatus: undefined,
    confidenceLevel: undefined,
    needsClarification: undefined,
    clarificationReason: undefined,
    adminReviewStatus: undefined,
    createdFrom: undefined,
  });
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

class SchemaRepairProvider {
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
        model: "deterministic-schema-invalid-provider-output",
        text: JSON.stringify(schemaInvalidMissingItemFields(this.sessionId, this.evidenceItemId)),
      };
    }
    assert.ok(input.compiledPrompt.includes("schema_validation_failed"));
    assert.ok(input.compiledPrompt.includes("path=/extractedSteps/0/label"));
    assert.ok(input.compiledPrompt.includes("itemId, label, description, evidenceAnchors[]"));
    assert.ok(input.compiledPrompt.includes("Do not invent evidence anchors"));
    assert.ok(input.compiledPrompt.includes("do not place the item in clean extracted arrays"));
    const output = this.repairMode === "valid"
      ? extractionOutput(this.sessionId, this.evidenceItemId)
      : schemaInvalidMissingItemFields(this.sessionId, this.evidenceItemId);
    return {
      provider: "google",
      model: `deterministic-schema-repair-${this.repairMode}`,
      text: JSON.stringify(output),
    };
  }
}

const repos = createSQLiteIntakeRepositories(dbPath);

seed(repos, "session-schema-repair-valid", "evidence-schema-repair-valid");
const validRepairProvider = new SchemaRepairProvider("session-schema-repair-valid", "evidence-schema-repair-valid", "valid");
const repaired = await runFirstPassExtractionForSession("session-schema-repair-valid", extractionRepos(repos), validRepairProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-schema-repair-valid",
  providerJobIdFactory: () => "provider-job-schema-repair-valid",
});
assert.equal(repaired.ok, true, repaired.ok ? "" : JSON.stringify(repaired.errors));
assert.equal(validRepairProvider.calls.length, 2);
assert.equal(validateFirstPassExtractionOutput(repaired.createdExtraction).ok, true);
assert.equal(repos.providerJobs.findById("provider-job-schema-repair-valid:repair")?.status, "succeeded");

seed(repos, "session-schema-repair-fails", "evidence-schema-repair-fails");
const failingRepairProvider = new SchemaRepairProvider("session-schema-repair-fails", "evidence-schema-repair-fails", "invalid");
const failed = await runFirstPassExtractionForSession("session-schema-repair-fails", extractionRepos(repos), failingRepairProvider, {
  now: () => now,
  extractionIdFactory: () => "extraction-schema-repair-fails",
  providerJobIdFactory: () => "provider-job-schema-repair-fails",
});
assert.equal(failed.ok, false);
assert.equal(failingRepairProvider.calls.length, 2);
assert.equal(failed.errors[0].code, "schema_validation_failed");
assert.match(failed.errors[0].message, /path=\/extractedSteps\/0\/label/);
assert.match(failed.errors[0].message, /actual=undefined/);
assert.equal(repos.providerJobs.findById("provider-job-schema-repair-fails")?.status, "failed");
assert.equal(repos.providerJobs.findById("provider-job-schema-repair-fails:repair")?.status, "failed");
assert.equal(repos.participantSessions.findById("session-schema-repair-fails")?.extractionStatus, "failed");
assert.equal(repos.firstPassExtractionOutputs.findById("extraction-schema-repair-fails"), null);

console.log(JSON.stringify({
  ok: true,
  compiledPromptContainsContractSkeleton: promptText.includes("Canonical JSON skeleton"),
  compiledPromptContainsRequiredItemFields: promptText.includes("itemId, label, description, evidenceAnchors[]"),
  schemaRepairCalls: validRepairProvider.calls.length,
  failedSchemaRepairCalls: failingRepairProvider.calls.length,
  failedMainJobStatus: repos.providerJobs.findById("provider-job-schema-repair-fails")?.status,
  failedRepairJobStatus: repos.providerJobs.findById("provider-job-schema-repair-fails:repair")?.status,
  noCleanExtractionAcceptedFromMalformedSchemaOutput: repos.firstPassExtractionOutputs.findById("extraction-schema-repair-fails") === null,
}, null, 2));
