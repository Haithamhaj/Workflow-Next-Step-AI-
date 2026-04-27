import assert from "node:assert/strict";

import { validateWorkflowClaim, validateWorkflowUnit } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  buildWorkflowUnitsAndClaimsFromBundle,
  createDefaultPass6ConfigurationDraft,
  savePass6ConfigurationProfile,
} from "../packages/synthesis-evaluation/dist/index.js";

const now = "2026-04-27T16:00:00.000Z";
const caseId = "case-pass6-block9-proof";
const bundleId = "bundle-pass6-block9-proof";

const ref = {
  referenceId: "ref-pass5-evidence-1",
  referenceType: "pass5_evidence_anchor",
  sessionId: "session-1",
  evidenceItemId: "evidence-1",
  quote: "Coordinator checks request, sends it to Finance, and Finance approves.",
};

function basis(basisId, basisType, summary, references = [ref]) {
  return { basisId, basisType, summary, references };
}

function material(itemId, itemType, summary, basisType, extra = {}) {
  return {
    itemId,
    itemType,
    summary,
    basis: basis(`basis-${itemId}`, basisType, `${itemType} basis`, extra.references ?? [ref]),
    roleLayerContextIds: extra.roleLayerContextIds ?? ["role-context-1"],
    truthLensContextIds: extra.truthLensContextIds ?? ["truth_lens:execution_evidence"],
    notes: extra.notes,
  };
}

const bundle = {
  bundleId,
  caseId,
  createdAt: now,
  sourcePass5SessionIds: ["session-1"],
  analysis_material: [
    material("step-1", "extracted_step", "Coordinator checks the vendor request.", "extraction"),
    material("sequence-1", "sequence_map", "Coordinator check is followed by Finance handoff.", "extraction", {
      truthLensContextIds: ["truth_lens:execution_evidence"],
    }),
    material("decision-1", "decision_point", "Finance approval is required before onboarding completes.", "extraction", {
      truthLensContextIds: ["truth_lens:approval_control_evidence"],
    }),
    material("handoff-1", "handoff", "Coordinator sends the tax form to Finance.", "extraction", {
      truthLensContextIds: ["truth_lens:handoff_dependency_evidence"],
    }),
    material("control-1", "control", "Finance approval control occurs before completion.", "extraction", {
      truthLensContextIds: ["truth_lens:approval_control_evidence"],
    }),
  ],
  boundary_role_limit_material: [
    material("boundary-1", "boundary_signal", "Finance owns tax validation after handoff.", "boundary_signal", {
      truthLensContextIds: ["truth_lens:handoff_dependency_evidence"],
      notes: "Boundary signal; not a failed answer.",
    }),
  ],
  gap_risk_no_drop_material: [
    material("unmapped-1", "unmapped_content", "Legal may sometimes join but the trigger is unclear.", "pass5_output", {
      notes: "Unmapped unresolved material is not workflow truth.",
    }),
    material("defect-1", "extraction_defect", "Backup owner has low-confidence mapping.", "pass5_output", {
      notes: "Defective low-confidence material requires review.",
    }),
    material("handoff-candidate-1", "pass6_handoff_candidate", "Finance route may vary by vendor type.", "handoff_candidate", {
      truthLensContextIds: ["truth_lens:handoff_dependency_evidence"],
      notes: "Candidate-only handoff material.",
    }),
  ],
  document_source_signal_material: [
    material("source-signal-1", "source_signal", "SOP says Finance validates tax forms.", "source_document", {
      references: [{
        referenceId: "source-policy-1",
        referenceType: "document_source_signal",
        sourceId: "source-1",
        label: "Vendor SOP",
        notes: "Document signal only.",
      }],
      roleLayerContextIds: ["hierarchy:finance"],
      truthLensContextIds: ["truth_lens:document_signal_evidence", "truth_lens:policy_intent_evidence"],
      notes: "Document/source signal carried forward as signal only.",
    }),
  ],
  roleLayerContexts: [
    {
      contextId: "role-context-1",
      participantId: "participant-1",
      sessionId: "session-1",
      targetCandidateId: "target-1",
      participantRole: "Operations Coordinator",
      hierarchyNodeId: "role-operations-coordinator",
      groupingLayerCategory: "role",
      levelHint: "execution_layer",
      inUseCaseScope: true,
      participantTargetType: "role",
    },
    {
      contextId: "hierarchy:finance",
      hierarchyNodeId: "finance",
      participantRole: "Finance",
      groupingLayerCategory: "department",
      inUseCaseScope: true,
    },
  ],
  truthLensContexts: [
    { contextId: "truth_lens:execution_evidence", lensType: "execution_evidence" },
    { contextId: "truth_lens:approval_control_evidence", lensType: "approval_control_evidence" },
    { contextId: "truth_lens:handoff_dependency_evidence", lensType: "handoff_dependency_evidence" },
    { contextId: "truth_lens:document_signal_evidence", lensType: "document_signal_evidence" },
    { contextId: "truth_lens:policy_intent_evidence", lensType: "policy_intent_evidence" },
  ],
  preparationSummary: {
    preparedBy: "system_with_admin_review",
    summary: "Prepared fixture bundle for Block 9 proof.",
    acceptedPass5Only: true,
    doesNotRevalidatePass5: true,
    noDropNotes: [
      "Document/source signals are signals only.",
      "Candidate-only material is not workflow truth.",
    ],
  },
};

const store = createInMemoryStore();
const config = createDefaultPass6ConfigurationDraft({
  configId: "pass6-block9-config",
  changedBy: "proof",
  changeReason: "Block 9 proof config.",
  now,
});
const savedConfig = savePass6ConfigurationProfile(config, store.pass6ConfigurationProfiles);
assert.equal(savedConfig.ok, true, savedConfig.ok ? "" : savedConfig.error);

const result = buildWorkflowUnitsAndClaimsFromBundle({
  bundle,
  now,
  configurationProfile: config,
}, {
  workflowUnits: store.workflowUnits,
  workflowClaims: store.workflowClaims,
});

assert.equal(result.ok, true, result.ok ? "" : result.error);
assert.ok(result.units.length >= 10, "representative SynthesisInputBundle should convert into WorkflowUnit records");
assert.ok(result.claims.length >= 8, "important WorkflowUnit records should convert into WorkflowClaim records");
assert.ok(result.policyRefs.some((refId) => refId.includes("pass6-block9-config")), "policy references should be preserved");

for (const unit of result.units) {
  const { createdAt, updatedAt, ...contractUnit } = unit;
  assert.ok(createdAt && updatedAt, "stored WorkflowUnit should carry persistence timestamps");
  const validation = validateWorkflowUnit(contractUnit);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
}
for (const claim of result.claims) {
  const { createdAt, updatedAt, ...contractClaim } = claim;
  assert.ok(createdAt && updatedAt, "stored WorkflowClaim should carry persistence timestamps");
  const validation = validateWorkflowClaim(contractClaim);
  assert.equal(validation.ok, true, JSON.stringify(validation.errors ?? []));
  assert.equal(claim.bundleId, bundleId, "claims should carry bundleId");
  assert.ok(claim.unitIds.length > 0, "claims should preserve source unit IDs");
}

const stepUnit = result.units.find((unit) => unit.basis.basisId.includes("step-1"));
assert.equal(stepUnit?.unitType, "action_step", "action/step material should create action_step units");
const sequenceUnit = result.units.find((unit) => unit.basis.basisId.includes("sequence-1"));
assert.equal(sequenceUnit?.unitType, "sequence_signal", "sequence material should create sequence_signal units");
const decisionUnit = result.units.find((unit) => unit.basis.basisId.includes("decision-1"));
assert.equal(decisionUnit?.unitType, "decision_rule", "decision material should create decision_rule units");
const handoffUnit = result.units.find((unit) => unit.basis.basisId.includes("handoff-1"));
assert.equal(handoffUnit?.unitType, "handoff", "handoff material should create handoff units");
const boundaryUnit = result.units.find((unit) => unit.basis.basisId.includes("boundary-1"));
assert.equal(boundaryUnit?.unitType, "boundary", "boundary material should create boundary units");
const unmappedUnit = result.units.find((unit) => unit.basis.basisId.includes("unmapped-1"));
assert.equal(unmappedUnit?.unitType, "unknown_gap", "unmapped material should create unknown_gap units");
const documentUnit = result.units.find((unit) => unit.basis.basisId.includes("source-signal-1"));
assert.equal(documentUnit?.unitType, "information_context", "document/source signal material should remain information_context");
assert.ok(documentUnit?.notes?.includes("signal-only"), "document/source unit should remain signal-only");

const executionClaim = result.claims.find((claim) => claim.unitIds.includes(stepUnit.unitId));
assert.equal(executionClaim?.primaryClaimType, "execution_claim", "action units should create execution claims");
assert.equal(executionClaim?.status, "accepted_for_assembly", "accepted participant extraction may be accepted for later assembly without being final truth");
const sequenceClaim = result.claims.find((claim) => claim.unitIds.includes(sequenceUnit.unitId));
assert.equal(sequenceClaim?.primaryClaimType, "sequence_claim", "sequence units should create sequence claims");
const decisionClaim = result.claims.find((claim) => claim.unitIds.includes(decisionUnit.unitId));
assert.equal(decisionClaim?.primaryClaimType, "decision_rule_claim", "decision units should create decision rule claims");
const handoffClaim = result.claims.find((claim) => claim.unitIds.includes(handoffUnit.unitId));
assert.equal(handoffClaim?.primaryClaimType, "ownership_claim", "handoff units should create ownership claims");
const boundaryClaim = result.claims.find((claim) => claim.unitIds.includes(boundaryUnit.unitId));
assert.equal(boundaryClaim?.primaryClaimType, "boundary_claim", "boundary units should create boundary claims");

assert.deepEqual(executionClaim.sourceParticipantIds, ["participant-1"], "claims should preserve participant context");
assert.deepEqual(executionClaim.sourceSessionIds, ["session-1"], "claims should preserve session context");
assert.deepEqual(executionClaim.sourceLayerContextIds, ["role-context-1"], "claims should preserve role/layer context");
assert.ok(executionClaim.truthLensContextIds.includes("truth_lens:execution_evidence"), "claims should preserve truth-lens context");

const documentClaim = result.claims.find((claim) => claim.unitIds.includes(documentUnit.unitId));
assert.ok(documentClaim, "document/source unit should create an inspectable warning claim");
assert.equal(documentClaim.primaryClaimType, "boundary_claim");
assert.notEqual(documentClaim.status, "accepted_for_assembly", "document-only claim must not be accepted for assembly");
assert.ok(["warning", "unresolved", "proposed"].includes(documentClaim.status), "document-only claim should remain warning/unresolved/proposed");
assert.equal(documentClaim.confidence, "unknown", "document-only claim confidence should not imply operational truth");
assert.ok(documentClaim.normalizedStatement.includes("document/source signal only"), "document-only claim should state signal-only basis");

const candidateClaim = result.claims.find((claim) => claim.claimId.includes("handoff-candidate-1"));
assert.ok(candidateClaim, "candidate-only material should be visible as a claim candidate");
assert.notEqual(candidateClaim.status, "accepted_for_assembly", "candidate-only material must not become accepted_for_assembly");
assert.equal(candidateClaim.status, "review_needed", "candidate-only material should require review");

assert.ok(result.claims.every((claim) => claim.confidence), "claims should carry advisory confidence indicators");
assert.ok(result.claims.every((claim) => claim.materiality), "claims should carry advisory materiality indicators");
assert.equal(store.workflowUnits.findAll().length, result.units.length, "WorkflowUnit records should persist");
assert.equal(store.workflowClaims.findAll().length, result.claims.length, "WorkflowClaim records should persist");

assert.equal(store.differenceInterpretations.findAll().length, 0, "Block 9 must not create DifferenceInterpretation records");
assert.equal(store.assembledWorkflowDrafts.findAll().length, 0, "Block 9 must not assemble workflows");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "Block 9 must not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "Block 9 must not create Pre-6C results");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "Block 9 must not create package records");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "Block 9 must not create visual records");
assert.equal(store.pass6CopilotContextBundles.findAll().length, 0, "Block 9 must not create Copilot records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "Block 9 must not create Pass 7 records");

console.log("Pass 6 Block 9 claim pipeline proof passed.");
