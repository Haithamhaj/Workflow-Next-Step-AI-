import assert from "node:assert/strict";

import {
  validateAnalysisScope,
  validateCaseConfiguration,
  validateCaseEntryPacket,
  validateFramingCandidate,
  validateFramingRun,
  validateFramingSource,
  validateOperatorFramingInput,
  validateSourceToCaseLink,
} from "../packages/contracts/dist/index.js";

function assertValidatorExport(name, validator) {
  assert.equal(typeof validator, "function", `${name} should be exported as a validator`);
}

function assertValid(name, validator, value) {
  const result = validator(value);
  assert.equal(
    result.ok,
    true,
    `${name} should validate: ${JSON.stringify(result.errors ?? [])}`,
  );
}

function assertInvalid(name, validator, value) {
  const result = validator(value);
  assert.equal(result.ok, false, `${name} should reject invalid input`);
}

const now = "2026-05-01T00:00:00.000Z";

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
  crossFunctionalScope: ["Sales to scheduling handoff"],
  boundaryRationale: "Continuous workflow from request intake to scheduled service.",
  knownAdjacentCandidateIds: ["candidate-billing"],
};

const framingRun = {
  framingRunId: "framing-run-1",
  companyId: "company-1",
  status: "candidates_ready",
  sourceIds: ["framing-source-1"],
  createdAt: now,
  updatedAt: now,
  title: "Initial company framing",
  operatorGoal: "Find first workflow candidates.",
};

const framingSource = {
  framingSourceId: "framing-source-1",
  companyId: "company-1",
  inputType: "website_url",
  status: "processed",
  sourceVersion: 1,
  createdAt: now,
  updatedAt: now,
  framingRunIds: ["framing-run-1"],
  displayName: "Company website",
  websiteUrl: "https://example.com/services",
  processingJobRefs: ["job-1"],
};

const framingCandidate = {
  candidateId: "candidate-1",
  companyId: "company-1",
  framingRunId: "framing-run-1",
  candidateName: "Quote to scheduled service",
  analysisScope,
  sourceBasisIds: ["framing-source-1"],
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
  unknowns: ["Exact scheduling exception path."],
  createdAt: now,
  updatedAt: now,
};

const knownUseCasePacket = {
  packetId: "packet-known-1",
  companyId: "company-1",
  source: "known_use_case",
  proposedDomain: "Field Services",
  proposedMainDepartment: "Operations",
  proposedUseCaseLabel: "Quote to scheduled service",
  analysisScope,
  includedFramingSourceIds: ["framing-source-1"],
  createdAt: now,
};

const candidatePacket = {
  ...knownUseCasePacket,
  packetId: "packet-candidate-1",
  source: "framing_candidate",
  framingRunId: "framing-run-1",
  candidateId: "candidate-1",
};

const sourceToCaseLink = {
  linkId: "source-case-link-1",
  companyId: "company-1",
  framingSourceId: "framing-source-1",
  caseId: "case-1",
  use: "included_context",
  createdAt: now,
  packetId: "packet-known-1",
  linkRationale: "Company website context supports the promoted case.",
};

const operatorFramingInput = {
  inputId: "operator-input-1",
  companyId: "company-1",
  framingRunId: "framing-run-1",
  inputType: "operator_note",
  text: "Owner says scheduling is the first workflow to analyze.",
  createdBy: "admin",
  createdAt: now,
  linkedCandidateId: "candidate-1",
};

const caseConfiguration = {
  companyId: "company-1",
  caseId: "case-1",
  domain: "Field Services",
  mainDepartment: "Operations",
  useCaseLabel: "Quote to scheduled service",
  companyProfileRef: "framing-source:framing-source-1",
  createdAt: now,
};

[
  ["validateAnalysisScope", validateAnalysisScope],
  ["validateFramingRun", validateFramingRun],
  ["validateFramingSource", validateFramingSource],
  ["validateFramingCandidate", validateFramingCandidate],
  ["validateCaseEntryPacket", validateCaseEntryPacket],
  ["validateSourceToCaseLink", validateSourceToCaseLink],
  ["validateOperatorFramingInput", validateOperatorFramingInput],
].forEach(([name, validator]) => assertValidatorExport(name, validator));

assertValid("valid AnalysisScope", validateAnalysisScope, analysisScope);
assertInvalid("AnalysisScope missing required boundary", validateAnalysisScope, {
  ...analysisScope,
  scopeBoundary: undefined,
});

assertValid("valid FramingRun", validateFramingRun, framingRun);
assertValid("valid FramingSource", validateFramingSource, framingSource);
assertValid("valid FramingCandidate", validateFramingCandidate, framingCandidate);
assertInvalid("FramingCandidate score outside 0-100", validateFramingCandidate, {
  ...framingCandidate,
  scoreSummary: {
    ...framingCandidate.scoreSummary,
    boundaryClarity: 101,
  },
});

assertValid(
  "known_use_case CaseEntryPacket without candidateId",
  validateCaseEntryPacket,
  knownUseCasePacket,
);
assertValid(
  "framing_candidate CaseEntryPacket with candidateId",
  validateCaseEntryPacket,
  candidatePacket,
);
assertInvalid("CaseEntryPacket missing proposedUseCaseLabel", validateCaseEntryPacket, {
  ...knownUseCasePacket,
  proposedUseCaseLabel: undefined,
});

assertValid("valid SourceToCaseLink", validateSourceToCaseLink, sourceToCaseLink);
assertValid("valid OperatorFramingInput", validateOperatorFramingInput, operatorFramingInput);
assertInvalid("OperatorFramingInput empty text", validateOperatorFramingInput, {
  ...operatorFramingInput,
  text: "",
});
assertValid(
  "existing CaseConfiguration remains valid",
  validateCaseConfiguration,
  caseConfiguration,
);

console.log("prove-pass2a-block1-contracts: all checks passed");
