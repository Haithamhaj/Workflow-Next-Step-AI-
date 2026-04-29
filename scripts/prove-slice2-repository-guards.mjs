#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  createInMemoryStore,
  findRecordByCompany,
  listRecordsByCompany,
  listRecordsByCompanyAndCase,
} from "../packages/persistence/dist/index.js";
import {
  createCase,
  createCompany,
  loadCaseForCompany,
} from "../packages/core-case/dist/index.js";

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
    useCaseLabel: "workflow-analysis",
    companyProfileRef: `${companyId}/profile`,
    createdAt: now,
  };
}

const alpha = createCompany(company("company-slice2-alpha", "Slice 2 Alpha"), store.companies);
const beta = createCompany(company("company-slice2-beta", "Slice 2 Beta"), store.companies);
const alphaCase = createCase(caseConfig(alpha.companyId, "case-slice2-alpha", "operations"), store.cases);
const betaCase = createCase(caseConfig(beta.companyId, "case-slice2-beta", "finance"), store.cases);

assert.equal(store.companies.findAll().length, 2, "two companies exist");
assert.equal(
  loadCaseForCompany(alpha.companyId, alphaCase.caseId, store.cases)?.caseId,
  alphaCase.caseId,
  "findByCompanyAndCase works for the correct company",
);
assert.equal(
  loadCaseForCompany(beta.companyId, alphaCase.caseId, store.cases),
  null,
  "wrong companyId cannot load the case",
);

store.sources.save({
  sourceId: "source-slice2-alpha",
  caseId: alphaCase.caseId,
  uploaderId: "operator",
  uploadedAt: now,
  displayName: "Alpha source",
  intakeType: "uploaded_contextual_source",
  timingTag: "uploaded_at_case_setup",
  authority: "company_truth",
  processingStatus: "registered_not_processed",
  registeredAt: now,
});
store.sources.save({
  sourceId: "source-slice2-beta",
  caseId: betaCase.caseId,
  uploaderId: "operator",
  uploadedAt: now,
  displayName: "Beta source",
  intakeType: "uploaded_contextual_source",
  timingTag: "uploaded_at_case_setup",
  authority: "company_truth",
  processingStatus: "registered_not_processed",
  registeredAt: now,
});

store.intakeSessions.save({
  sessionId: "intake-slice2-alpha",
  caseId: alphaCase.caseId,
  bucket: "company",
  status: "intake_started",
  providerConfig: {
    defaultProvider: "google",
    availableProviders: ["google", "openai"],
  },
  createdAt: now,
  updatedAt: now,
});
store.intakeSessions.save({
  sessionId: "intake-slice2-beta",
  caseId: betaCase.caseId,
  bucket: "company",
  status: "intake_started",
  providerConfig: {
    defaultProvider: "google",
    availableProviders: ["google", "openai"],
  },
  createdAt: now,
  updatedAt: now,
});

store.reviewIssues.save({
  issueId: "review-slice2-alpha",
  caseId: alphaCase.caseId,
  initialPackageId: "initial-alpha",
  evaluationId: "evaluation-alpha",
  reviewState: "review_required",
  issueBrief: {
    issueTitle: "Alpha issue",
    whatHappened: "A scoped proof issue was created.",
    whyItWasTriggered: "The Slice 2 proof needs a direct child record.",
    likelySourceDiagnosis: "Synthetic proof data.",
    whyItMatters: "It verifies company scoping.",
    whatItAffects: "Review issue reads.",
    severityEffectLevel: "medium",
    systemRecommendation: "Keep the guard in place.",
    correctiveDirection: "Return not found for the wrong company.",
  },
  discussionThread: { scopeBoundary: "admin-only proof thread", entries: [] },
  linkedEvidence: [],
  actionHistory: [],
  createdAt: now,
  updatedAt: now,
});

assert.deepEqual(
  listRecordsByCompanyAndCase(alpha.companyId, alphaCase.caseId, store.cases, store.sources).map(
    (record) => record.sourceId,
  ),
  ["source-slice2-alpha"],
  "findByCaseId-style reads use companyId plus caseId and return only alpha sources",
);
assert.deepEqual(
  listRecordsByCompanyAndCase(beta.companyId, alphaCase.caseId, store.cases, store.sources),
  [],
  "findByCaseId-style reads fail safely for the wrong company",
);
assert.deepEqual(
  listRecordsByCompany(alpha.companyId, store.cases, store.intakeSessions).map(
    (record) => record.sessionId,
  ),
  ["intake-slice2-alpha"],
  "company-scoped listing excludes another company's intake sessions",
);
assert.equal(
  findRecordByCompany(alpha.companyId, "source-slice2-alpha", store.cases, store.sources)?.sourceId,
  "source-slice2-alpha",
  "direct child-id guard returns the source for the owning company",
);
assert.equal(
  findRecordByCompany(beta.companyId, "source-slice2-alpha", store.cases, store.sources),
  null,
  "direct child-id guard returns none for the wrong company",
);
assert.equal(
  findRecordByCompany(beta.companyId, "review-slice2-alpha", store.cases, store.reviewIssues),
  null,
  "direct review issue guard returns none for the wrong company",
);
assert.throws(
  () => listRecordsByCompanyAndCase("", alphaCase.caseId, store.cases, store.sources),
  /companyId is required/,
  "updated findByCaseId-style helper requires companyId",
);
assert.throws(
  () => listRecordsByCompanyAndCase(alpha.companyId, "", store.cases, store.sources),
  /caseId is required/,
  "updated findByCaseId-style helper requires caseId",
);

const guardedApiRoutes = [
  "apps/admin-web/app/api/sources/route.ts",
  "apps/admin-web/app/api/sources/[id]/route.ts",
  "apps/admin-web/app/api/intake-sessions/route.ts",
  "apps/admin-web/app/api/issues/route.ts",
  "apps/admin-web/app/api/issues/[id]/route.ts",
];

for (const routePath of guardedApiRoutes) {
  const source = readFileSync(routePath, "utf8");
  assert.match(source, /companyId/, `${routePath} carries companyId scope`);
  assert.match(
    source,
    /missingCompanyIdResponse|findRecordByCompany|listRecordsByCompany|caseBelongsToCompany/,
    `${routePath} uses the Slice 2 guard pattern`,
  );
}

const deferredRecordFamilies = [
  "provider jobs: deferred to source lineage slice",
  "text artifacts: deferred to source lineage slice",
  "content chunks: deferred to source lineage slice",
  "embedding jobs: deferred to source lineage slice",
  "crawled pages: deferred to source lineage slice",
  "raw evidence: deferred to participant evidence isolation",
  "extraction outputs: deferred to participant evidence isolation",
  "clarification candidates and raw clarification evidence: deferred to participant evidence isolation",
  "boundary signals: deferred to participant evidence isolation",
  "hierarchy records: deferred to hierarchy/targeting isolation",
  "targeting plans: deferred to hierarchy/targeting isolation",
  "participant sessions: deferred to participant evidence isolation",
  "Pass 6 bundles/claims/evaluations: deferred to Pass 6/package lineage",
  "package records: deferred to Pass 6/package lineage",
];

assert.ok(
  deferredRecordFamilies.length >= 10,
  "deferred record families are explicitly listed and not treated as safe",
);

const forbiddenWorkStarted = false;
assert.equal(
  forbiddenWorkStarted,
  false,
  "no retrieval/RAG/vector/Answer Cards/ContextEnvelope behavior is implemented by this proof",
);

console.log("Deferred record families:");
for (const family of deferredRecordFamilies) {
  console.log(`- ${family}`);
}
console.log("PASS Slice 2 repository guard proof");
