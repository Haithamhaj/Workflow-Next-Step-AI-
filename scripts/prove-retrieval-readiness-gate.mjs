#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { strict as assert } from "node:assert";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  caseBelongsToCompany,
  createInMemoryStore,
  findRecordByCompany,
  listRecordsByCompanyAndCase,
} from "../packages/persistence/dist/index.js";
import { createCase, createCompany } from "../packages/core-case/dist/index.js";

const now = "2026-04-30T00:00:00.000Z";

const requiredProofScripts = [
  "scripts/prove-company-case-foundation.mjs",
  "scripts/prove-slice2-repository-guards.mjs",
  "scripts/prove-slice3-source-lineage.mjs",
  "scripts/prove-slice4-participant-evidence-isolation.mjs",
  "scripts/prove-slice5-hierarchy-targeting-isolation.mjs",
  "scripts/prove-slice6-pass6-package-lineage.mjs",
];

const forbiddenApiPaths = [
  "apps/admin-web/app/api/retrieval",
  "apps/admin-web/app/api/rag",
  "apps/admin-web/app/api/vector-search",
  "apps/admin-web/app/api/answer-cards",
  "apps/admin-web/app/api/context-envelope",
];

const pass6PackageScanRoots = [
  "apps/admin-web/app/api/pass6",
  "apps/admin-web/app/pass6",
  "apps/admin-web/app/api/packages",
  "apps/admin-web/app/api/initial-packages",
  "apps/admin-web/app/api/final-packages",
  "apps/admin-web/app/packages",
  "apps/admin-web/app/initial-packages",
  "apps/admin-web/app/final-packages",
];

function company(companyId, displayName) {
  return { companyId, displayName, status: "active", createdAt: now, updatedAt: now };
}

function caseConfig(companyId, caseId) {
  return {
    companyId,
    caseId,
    domain: "operations",
    mainDepartment: "operations",
    useCaseLabel: "retrieval-readiness-gate-proof",
    companyProfileRef: `${companyId}/profile`,
    createdAt: now,
  };
}

function walkFiles(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  const entries = readdirSync(dir);
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...walkFiles(path));
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry)) {
      files.push(path);
    }
  }
  return files;
}

function scanForUnscopedPass6PackageSurfaces() {
  const directReadPattern = /\.(findById|findAll|findByCaseId)\(/;
  const matches = [];

  for (const root of pass6PackageScanRoots) {
    for (const file of walkFiles(root)) {
      const source = readFileSync(file, "utf8");
      if (directReadPattern.test(source)) {
        matches.push(relative(process.cwd(), file));
      }
    }
  }

  return [...new Set(matches)].sort();
}

function runRequiredProofScripts() {
  const passed = [];
  for (const script of requiredProofScripts) {
    assert.equal(existsSync(script), true, `${script} must exist`);
    execFileSync(process.execPath, [script], { stdio: "pipe" });
    passed.push(script);
  }
  return passed;
}

function proveCoreGuardHelpers() {
  const store = createInMemoryStore();
  const alpha = createCompany(company("company-gate-alpha", "Gate Alpha"), store.companies);
  const beta = createCompany(company("company-gate-beta", "Gate Beta"), store.companies);
  const alphaCase = createCase(caseConfig(alpha.companyId, "case-gate-alpha"), store.cases);
  const betaCase = createCase(caseConfig(beta.companyId, "case-gate-beta"), store.cases);

  assert.equal(store.companies.findById(alpha.companyId)?.companyId, alpha.companyId, "CompanyRepository loads companies");
  assert.equal(alphaCase.companyId, alpha.companyId, "Case carries companyId");
  assert.equal(store.cases.findByCompanyAndCase(alpha.companyId, alphaCase.caseId)?.caseId, alphaCase.caseId, "case read is company scoped");
  assert.equal(store.cases.findByCompanyAndCase(beta.companyId, alphaCase.caseId), null, "wrong company cannot load case");
  assert.equal(caseBelongsToCompany(alpha.companyId, alphaCase.caseId, store.cases), true, "case ownership helper accepts correct company");
  assert.equal(caseBelongsToCompany(beta.companyId, alphaCase.caseId, store.cases), false, "case ownership helper rejects wrong company");

  store.sources.save({
    sourceId: "source-gate-alpha",
    caseId: alphaCase.caseId,
    uploaderId: "operator",
    uploadedAt: now,
    displayName: "Alpha scoped source",
    intakeType: "uploaded_contextual_source",
    timingTag: "uploaded_at_case_setup",
    authority: "company_truth",
    processingStatus: "registered_not_processed",
    registeredAt: now,
  });
  store.sources.save({
    sourceId: "source-gate-beta",
    caseId: betaCase.caseId,
    uploaderId: "operator",
    uploadedAt: now,
    displayName: "Beta scoped source",
    intakeType: "uploaded_contextual_source",
    timingTag: "uploaded_at_case_setup",
    authority: "company_truth",
    processingStatus: "registered_not_processed",
    registeredAt: now,
  });

  assert.deepEqual(
    listRecordsByCompanyAndCase(alpha.companyId, alphaCase.caseId, store.cases, store.sources).map((record) => record.sourceId),
    ["source-gate-alpha"],
    "repository guard helper lists only company/case records",
  );
  assert.equal(
    findRecordByCompany(beta.companyId, "source-gate-alpha", store.cases, store.sources),
    null,
    "direct child-id guard helper returns none for wrong company",
  );
}

function proveForbiddenProductionSurfacesWereNotAdded() {
  const existingForbiddenPaths = forbiddenApiPaths.filter((path) => existsSync(path));
  assert.deepEqual(existingForbiddenPaths, [], "no retrieval/RAG/vector/Answer Card/ContextEnvelope APIs were added");
}

const proofScriptsPassed = runRequiredProofScripts();
proveCoreGuardHelpers();
proveForbiddenProductionSurfacesWereNotAdded();

const warnings = [];
if (existsSync("packages/stage-copilot/src/context-envelope.ts")) {
  warnings.push({
    code: "pre_existing_stage_copilot_static_context_envelope",
    detail: "Pre-existing Stage Copilot context-envelope code remains declarative/static and was not created by this readiness gate.",
  });
}

const blockers = [];
const unscopedPass6PackageSurfaces = scanForUnscopedPass6PackageSurfaces();
if (unscopedPass6PackageSurfaces.length > 0) {
  blockers.push({
    code: "old_admin_pass6_package_direct_reads",
    detail: "Remaining old admin Pass 6/package API or page surfaces still contain direct findById/findAll/findByCaseId reads and need explicit company scoping before governed retrieval.",
    count: unscopedPass6PackageSurfaces.length,
    files: unscopedPass6PackageSurfaces,
  });
}

const status = blockers.length > 0 ? "retrieval_not_ready" : warnings.length > 0 ? "retrieval_ready_with_warnings" : "retrieval_ready";
assert.match(status, /^retrieval_(ready|not_ready|ready_with_warnings)$/, "readiness status is explicit");
if (blockers.length > 0) {
  assert.equal(status, "retrieval_not_ready", "blockers must keep retrieval blocked");
}

const result = {
  status,
  checks: {
    requiredProofScriptsPresentAndPassing: proofScriptsPassed,
    companyCaseIsolationPresent: true,
    repositoryGuardHelpersPresent: [
      "caseBelongsToCompany",
      "listRecordsByCompanyAndCase",
      "findRecordByCompany",
    ],
    sourceLineageCoveredBy: "scripts/prove-slice3-source-lineage.mjs",
    participantEvidenceIsolationCoveredBy: "scripts/prove-slice4-participant-evidence-isolation.mjs",
    hierarchyTargetingIsolationCoveredBy: "scripts/prove-slice5-hierarchy-targeting-isolation.mjs",
    pass6PackageLineageCoveredBy: "scripts/prove-slice6-pass6-package-lineage.mjs",
    forbiddenProductionRetrievalSurfacesAbsent: forbiddenApiPaths,
  },
  blockers,
  warnings,
};

console.log(JSON.stringify(result, null, 2));
console.log(`PASS retrieval readiness gate proof (${status})`);
