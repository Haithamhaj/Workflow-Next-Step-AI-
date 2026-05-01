import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { validateCaseConfiguration } from "../packages/contracts/dist/index.js";

const dbPath = join(mkdtempSync(join(tmpdir(), "workflow-pass2a-block6-")), "case-entry-promotion.sqlite");
const port = 3221;
const baseUrl = `http://127.0.0.1:${port}`;

function cleanupSqlite(path) {
  for (const suffix of ["", "-wal", "-shm"]) {
    const candidate = `${path}${suffix}`;
    if (existsSync(candidate)) rmSync(candidate);
  }
}

function startServer() {
  const child = spawn(
    "pnpm",
    ["--filter", "@workflow/admin-web", "start", "-H", "127.0.0.1", "-p", String(port)],
    {
      cwd: process.cwd(),
      env: { ...process.env, WORKFLOW_INTAKE_SQLITE_PATH: dbPath },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk.toString(); });
  child.stderr.on("data", (chunk) => { output += chunk.toString(); });
  return { child, getOutput: () => output };
}

async function waitForServer(server) {
  const startedAt = Date.now();
  let lastError = "";
  while (Date.now() - startedAt < 30000) {
    try {
      const response = await fetch(`${baseUrl}/company-framing/case-entry-packets/new`);
      if (response.ok) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Timed out waiting for admin server: ${lastError}\n${server.getOutput()}`);
}

async function jsonFetch(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const data = await response.json();
  return { response, data };
}

async function textFetch(path) {
  const response = await fetch(`${baseUrl}${path}`);
  const text = await response.text();
  assert.equal(response.ok, true, `${path} should render: ${response.status} ${text.slice(0, 200)}`);
  return text;
}

const analysisScope = {
  scopeType: "multi_function",
  scopeLabel: "Quote to scheduled service",
  primaryFunctionalAnchor: "Operations",
  participatingFunctions: ["Sales", "Scheduling", "Field Operations"],
  excludedAdjacentScopes: ["Invoicing"],
  scopeBoundary: {
    start: "Customer requests service",
    end: "Technician visit is scheduled",
  },
};

async function createCandidate(candidateId, sourceBasisIds = []) {
  const result = await jsonFetch("/api/company-framing/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidateId,
      companyId: "company-default-local",
      framingRunId: "manual-framing-run",
      candidateName: `Candidate ${candidateId}`,
      analysisScope,
      sourceBasisIds,
      rationale: "Operator-defined candidate for packet promotion proof.",
      risks: [],
      recommendation: "promote",
      status: "selected",
    }),
  });
  assert.equal(result.response.status, 201);
  return result.data;
}

async function createCandidatePacket(packetId, candidateId, proposedDomain = "Field Services") {
  const result = await jsonFetch("/api/company-framing/case-entry-packets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packetId,
      source: "framing_candidate",
      candidateId,
      proposedDomain,
    }),
  });
  assert.equal(result.response.status, 201);
  return result.data;
}

async function promote(packetId, caseId) {
  const result = await jsonFetch(`/api/company-framing/case-entry-packets/${packetId}/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId, promotedBy: "proof" }),
  });
  assert.equal(result.response.status, 201);
  return result.data;
}

cleanupSqlite(dbPath);
const server = startServer();

try {
  await waitForServer(server);

  const knownPacket = await jsonFetch("/api/company-framing/case-entry-packets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packetId: "packet-known-no-docs",
      source: "known_use_case",
      companyId: "company-default-local",
      proposedDomain: "Field Services",
      proposedMainDepartment: "Operations",
      proposedUseCaseLabel: "Known scheduling case",
      analysisScope,
      assumptions: ["Operator already knows the first formal case."],
      unknowns: [],
    }),
  });
  assert.equal(knownPacket.response.status, 201);
  assert.equal(knownPacket.data.source, "known_use_case");
  assert.equal(knownPacket.data.candidateId, undefined);
  assert.deepEqual(knownPacket.data.includedFramingSourceIds, []);

  const invalidKnown = await jsonFetch("/api/company-framing/case-entry-packets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "known_use_case",
      companyId: "company-default-local",
      proposedDomain: "Field Services",
      proposedMainDepartment: "Operations",
      proposedUseCaseLabel: "",
      analysisScope,
    }),
  });
  assert.equal(invalidKnown.response.status, 400);
  assert.equal(invalidKnown.data.code, "use_case_label_required");

  const invalidCandidatePacket = await jsonFetch("/api/company-framing/case-entry-packets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "framing_candidate", proposedDomain: "Field Services" }),
  });
  assert.equal(invalidCandidatePacket.response.status, 400);

  const candidateNoSources = await createCandidate("candidate-no-sources", []);
  const packetNoSources = await createCandidatePacket("packet-candidate-no-sources", candidateNoSources.candidateId);
  assert.equal(packetNoSources.candidateId, "candidate-no-sources");
  assert.deepEqual(packetNoSources.includedFramingSourceIds, []);

  const source = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      framingSourceId: "packet-source-1",
      companyId: "company-default-local",
      inputType: "manual_note",
      noteText: "Source basis for selected candidate.",
    }),
  });
  assert.equal(source.response.status, 201);
  const candidateWithSources = await createCandidate("candidate-with-sources", ["packet-source-1"]);
  const packetWithSources = await createCandidatePacket("packet-candidate-with-sources", candidateWithSources.candidateId);
  assert.deepEqual(packetWithSources.includedFramingSourceIds, ["packet-source-1"]);

  const list = await jsonFetch("/api/company-framing/case-entry-packets?companyId=company-default-local");
  assert.equal(list.response.status, 200);
  assert.deepEqual(
    list.data.map((packet) => packet.packetId).sort(),
    ["packet-candidate-no-sources", "packet-candidate-with-sources", "packet-known-no-docs"],
  );

  const detail = await jsonFetch("/api/company-framing/case-entry-packets/packet-known-no-docs");
  assert.equal(detail.response.status, 200);
  assert.equal(detail.data.packetId, "packet-known-no-docs");

  const promotedKnown = await promote("packet-known-no-docs", "case-known-no-docs");
  assert.equal(promotedKnown.case.caseId, "case-known-no-docs");
  assert.equal(promotedKnown.packet.createdCaseId, "case-known-no-docs");

  const promotedCandidateNoSources = await promote("packet-candidate-no-sources", "case-candidate-no-sources");
  assert.equal(promotedCandidateNoSources.case.caseId, "case-candidate-no-sources");

  const promotedCandidateWithSources = await promote("packet-candidate-with-sources", "case-candidate-with-sources");
  assert.equal(promotedCandidateWithSources.case.caseId, "case-candidate-with-sources");
  assert.notEqual(promotedCandidateNoSources.case.caseId, promotedCandidateWithSources.case.caseId);

  for (const createdCase of [promotedKnown.case, promotedCandidateNoSources.case, promotedCandidateWithSources.case]) {
    const { state: _state, ...caseConfig } = createdCase;
    const validation = validateCaseConfiguration(caseConfig);
    assert.equal(validation.ok, true, `created case should validate as CaseConfiguration: ${JSON.stringify(validation.errors ?? [])}`);
    assert.match(caseConfig.companyProfileRef, /^case-entry-packet:/);
  }

  const promotedCandidateDetail = await jsonFetch("/api/company-framing/candidates/candidate-with-sources");
  assert.equal(promotedCandidateDetail.data.status, "promoted");

  const listPage = await textFetch("/company-framing/case-entry-packets");
  assert.match(listPage, /data-testid="case-entry-packet-list"/);
  assert.match(listPage, /proposed cases waiting for formal case creation/);

  const createPage = await textFetch("/company-framing/case-entry-packets/new");
  assert.match(createPage, /data-testid="case-entry-packet-create-form"/);
  assert.match(createPage, /data-testid="case-entry-packet-no-session-note"/);
  assert.match(createPage, /data-testid="case-entry-packet-no-source-required-note"/);
  assert.doesNotMatch(createPage, /name="sessionId"/);

  const detailPage = await textFetch("/company-framing/case-entry-packets/packet-candidate-with-sources");
  assert.match(detailPage, /data-testid="case-entry-packet-detail"/);
  assert.match(detailPage, /Promotion creates only the formal case record/);
  assert.match(detailPage, /does not create an intake session/i);

  const db = new DatabaseSync(dbPath);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM cases").get().count, 3);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM intake_sessions").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM intake_sources").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM source_to_case_links").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM provider_extraction_jobs").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM participant_sessions").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM pass6_core_records").get().count, 0);

  console.log("prove-pass2a-block6-case-entry-promotion: all checks passed");
} finally {
  server.child.kill("SIGTERM");
}
