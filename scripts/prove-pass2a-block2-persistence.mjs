import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  validateCaseEntryPacket,
  validateFramingCandidate,
  validateFramingRun,
  validateFramingSource,
  validateOperatorFramingInput,
  validateSourceToCaseLink,
} from "../packages/contracts/dist/index.js";
import {
  createInMemoryStore,
  createSQLiteIntakeRepositories,
} from "../packages/persistence/dist/index.js";

function assertValid(name, validator, value) {
  const result = validator(value);
  assert.equal(
    result.ok,
    true,
    `${name} should validate before persistence: ${JSON.stringify(result.errors ?? [])}`,
  );
}

function assertRoundTrip(name, actual, expected) {
  assert.deepEqual(actual, expected, `${name} should round trip unchanged`);
}

const now = "2026-05-01T00:00:00.000Z";
const companyId = "company-1";
const framingRunId = "framing-run-1";
const framingSourceId = "framing-source-1";
const candidateId = "candidate-1";
const packetId = "packet-1";
const caseId = "case-1";
const linkId = "source-case-link-1";
const inputId = "operator-input-1";

const analysisScope = {
  scopeType: "multi_function",
  scopeLabel: "Quote to scheduled pest-control service",
  primaryFunctionalAnchor: "Operations",
  participatingFunctions: ["Sales", "Scheduling", "Field Operations"],
  excludedAdjacentScopes: ["Invoicing follow-up"],
  scopeBoundary: {
    start: "Customer requests service",
    end: "Technician visit is scheduled",
  },
  boundaryRationale: "Continuous workflow from request intake to scheduled service.",
};

const framingRun = {
  framingRunId,
  companyId,
  status: "candidates_ready",
  sourceIds: [framingSourceId],
  createdAt: now,
  updatedAt: now,
  title: "Initial company framing",
  operatorGoal: "Find first workflow candidates.",
};

const framingSource = {
  framingSourceId,
  companyId,
  inputType: "website_url",
  status: "processed",
  sourceVersion: 1,
  createdAt: now,
  updatedAt: now,
  framingRunIds: [framingRunId],
  displayName: "Company website",
  websiteUrl: "https://example.com/services",
};

const framingCandidate = {
  candidateId,
  companyId,
  framingRunId,
  candidateName: "Quote to scheduled service",
  analysisScope,
  sourceBasisIds: [framingSourceId],
  rationale: "Visible sales and scheduling stages support a coherent case boundary.",
  risks: ["Billing is adjacent and excluded."],
  recommendation: "promote",
  status: "ready_for_review",
  scoreSummary: {
    boundaryClarity: 82,
    sourceSupport: 76,
    businessRelevance: 88,
    workflowSeparability: 74,
    roleFunctionVisibility: 70,
    ambiguityRisk: 35,
    suitabilityAsFirstCase: 90,
  },
  scoreMeaning: "Scores are operator decision support only and do not represent workflow truth.",
  createdAt: now,
  updatedAt: now,
};

const caseEntryPacket = {
  packetId,
  companyId,
  source: "framing_candidate",
  proposedDomain: "Field Services",
  proposedMainDepartment: "Operations",
  proposedUseCaseLabel: "Quote to scheduled service",
  analysisScope,
  includedFramingSourceIds: [framingSourceId],
  createdAt: now,
  framingRunId,
  candidateId,
  assumptions: ["Operator chose this as the first formal case."],
};

const sourceToCaseLink = {
  linkId,
  companyId,
  framingSourceId,
  caseId,
  use: "included_context",
  createdAt: now,
  packetId,
  linkRationale: "Company website context supports the promoted case.",
};

const operatorFramingInput = {
  inputId,
  companyId,
  framingRunId,
  inputType: "operator_note",
  text: "Owner says scheduling is the first workflow to analyze.",
  createdBy: "admin",
  createdAt: now,
  linkedCandidateId: candidateId,
};

[
  ["FramingRun", validateFramingRun, framingRun],
  ["FramingSource", validateFramingSource, framingSource],
  ["FramingCandidate", validateFramingCandidate, framingCandidate],
  ["CaseEntryPacket", validateCaseEntryPacket, caseEntryPacket],
  ["SourceToCaseLink", validateSourceToCaseLink, sourceToCaseLink],
  ["OperatorFramingInput", validateOperatorFramingInput, operatorFramingInput],
].forEach(([name, validator, value]) => assertValid(name, validator, value));

function saveAll(repos) {
  repos.framingRuns.save(framingRun);
  repos.framingSources.save(framingSource);
  repos.framingCandidates.save(framingCandidate);
  repos.caseEntryPackets.save(caseEntryPacket);
  repos.sourceToCaseLinks.save(sourceToCaseLink);
  repos.operatorFramingInputs.save(operatorFramingInput);
}

function assertAllRoundTrips(prefix, repos) {
  assertRoundTrip(`${prefix} FramingRun`, repos.framingRuns.findById(framingRunId), framingRun);
  assertRoundTrip(`${prefix} FramingSource`, repos.framingSources.findById(framingSourceId), framingSource);
  assertRoundTrip(`${prefix} FramingCandidate`, repos.framingCandidates.findById(candidateId), framingCandidate);
  assertRoundTrip(`${prefix} CaseEntryPacket`, repos.caseEntryPackets.findById(packetId), caseEntryPacket);
  assertRoundTrip(`${prefix} SourceToCaseLink`, repos.sourceToCaseLinks.findById(linkId), sourceToCaseLink);
  assertRoundTrip(`${prefix} OperatorFramingInput`, repos.operatorFramingInputs.findById(inputId), operatorFramingInput);
}

function assertFilters(prefix, repos) {
  assert.deepEqual(
    repos.framingCandidates.findByFramingRunId(framingRunId).map((record) => record.candidateId),
    [candidateId],
    `${prefix} should list candidates by framingRunId`,
  );
  assert.deepEqual(
    repos.framingSources.findByCompanyId(companyId).map((record) => record.framingSourceId),
    [framingSourceId],
    `${prefix} should list sources by companyId`,
  );
  assert.deepEqual(
    repos.caseEntryPackets.findByCompanyId(companyId).map((record) => record.packetId),
    [packetId],
    `${prefix} should list packets by companyId`,
  );
  assert.deepEqual(
    repos.sourceToCaseLinks.findByCaseId(caseId).map((record) => record.linkId),
    [linkId],
    `${prefix} should list source links by caseId`,
  );
  assert.deepEqual(
    repos.operatorFramingInputs.findByFramingRunId(framingRunId).map((record) => record.inputId),
    [inputId],
    `${prefix} should list operator inputs by framingRunId`,
  );
}

const memory = createInMemoryStore();
saveAll(memory);
assertAllRoundTrips("in-memory", memory);
assertFilters("in-memory", memory);

const mutableCandidate = memory.framingCandidates.findById(candidateId);
mutableCandidate.analysisScope.scopeBoundary.start = "MUTATED";
assert.equal(
  memory.framingCandidates.findById(candidateId).analysisScope.scopeBoundary.start,
  analysisScope.scopeBoundary.start,
  "in-memory framing candidates should be returned as cloned records",
);

const dbPath = join(mkdtempSync(join(tmpdir(), "workflow-pass2a-block2-")), "framing.sqlite");
const sqlite = createSQLiteIntakeRepositories(dbPath);
saveAll(sqlite);
assertAllRoundTrips("sqlite", sqlite);
assertFilters("sqlite", sqlite);

const reloaded = createSQLiteIntakeRepositories(dbPath);
assertAllRoundTrips("sqlite reload", reloaded);
assertFilters("sqlite reload", reloaded);

const sqliteMutableCandidate = reloaded.framingCandidates.findById(candidateId);
sqliteMutableCandidate.analysisScope.scopeBoundary.start = "MUTATED";
assert.equal(
  reloaded.framingCandidates.findById(candidateId).analysisScope.scopeBoundary.start,
  analysisScope.scopeBoundary.start,
  "sqlite framing candidates should be returned as cloned records",
);

const db = new DatabaseSync(dbPath);
const intakeSourceColumns = db.prepare("PRAGMA table_info(intake_sources)").all();
const intakeSessionColumns = db.prepare("PRAGMA table_info(intake_sessions)").all();
const intakeSourceCaseId = intakeSourceColumns.find((column) => column.name === "case_id");
const intakeSessionCaseId = intakeSessionColumns.find((column) => column.name === "case_id");

assert.equal(intakeSourceCaseId?.notnull, 1, "intake_sources.case_id should remain NOT NULL");
assert.equal(intakeSessionCaseId?.notnull, 1, "intake_sessions.case_id should remain NOT NULL");
assert.equal(
  intakeSourceColumns.some((column) => column.name === "owner_type" || column.name === "owner_id"),
  false,
  "intake_sources should not be generalized to ownerType/ownerId in Block 2",
);

console.log("prove-pass2a-block2-persistence: all checks passed");
