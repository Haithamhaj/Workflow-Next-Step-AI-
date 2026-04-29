#!/usr/bin/env node
import { existsSync, rmSync } from "node:fs";
import { strict as assert } from "node:assert";
import {
  DEFAULT_LOCAL_COMPANY_ID,
  createDefaultLocalCompany,
  createSQLiteCoreRepositories,
  ensureDefaultLocalCompany,
} from "@workflow/persistence";
import {
  createCase,
  createCompany,
  listCases,
  loadCaseForCompany,
} from "../packages/core-case/dist/index.js";

const dbPath = "/tmp/workflow-company-case-foundation-proof.sqlite";
if (existsSync(dbPath)) rmSync(dbPath);

const repos = createSQLiteCoreRepositories(dbPath);
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

const alpha = createCompany(company("company-alpha", "Alpha Company"), repos.companies);
const beta = createCompany(company("company-beta", "Beta Company"), repos.companies);
assert.equal(repos.companies.findAll().length, 2, "two companies are stored");

assert.throws(
  () => createCompany(company("company-alpha", "Duplicate Alpha"), repos.companies),
  /Company already exists/,
  "duplicate companyId is rejected",
);

const caseA = createCase(caseConfig(alpha.companyId, "case-company-alpha", "operations"), repos.cases);
const caseB = createCase(caseConfig(beta.companyId, "case-company-beta", "finance"), repos.cases);

assert.equal(caseA.companyId, alpha.companyId, "case A is owned by company alpha");
assert.equal(caseB.companyId, beta.companyId, "case B is owned by company beta");
assert.deepEqual(
  listCases(repos.cases, alpha.companyId).map((record) => record.caseId),
  ["case-company-alpha"],
  "listing alpha cases excludes beta cases",
);
assert.deepEqual(
  listCases(repos.cases, beta.companyId).map((record) => record.caseId),
  ["case-company-beta"],
  "listing beta cases excludes alpha cases",
);
assert.equal(
  loadCaseForCompany(beta.companyId, caseA.caseId, repos.cases),
  null,
  "loading alpha case with beta companyId returns none",
);
assert.equal(
  loadCaseForCompany(alpha.companyId, caseA.caseId, repos.cases)?.caseId,
  caseA.caseId,
  "loading alpha case with alpha companyId succeeds",
);

const defaultCompany = ensureDefaultLocalCompany(repos.companies, now);
assert.equal(defaultCompany.companyId, DEFAULT_LOCAL_COMPANY_ID, "default local company is created");
assert.equal(
  ensureDefaultLocalCompany(repos.companies, now).companyId,
  DEFAULT_LOCAL_COMPANY_ID,
  "default local company ensure path is idempotent",
);

const defaultCase = createCase(
  caseConfig(createDefaultLocalCompany(now).companyId, "case-default-local", "support"),
  repos.cases,
);
assert.equal(defaultCase.companyId, DEFAULT_LOCAL_COMPANY_ID, "default local case attaches to default company");
assert.deepEqual(
  listCases(repos.cases, DEFAULT_LOCAL_COMPANY_ID).map((record) => record.caseId),
  ["case-default-local"],
  "default company scoped listing works",
);

console.log("PASS company/case foundation proof");
