import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = join(mkdtempSync(join(tmpdir(), "workflow-pass2a-block5-")), "admin-framing-candidates.sqlite");
const port = 3220;
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
      const response = await fetch(`${baseUrl}/company-framing/candidates/new`);
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

cleanupSqlite(dbPath);
const server = startServer();

try {
  await waitForServer(server);

  const source = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      framingSourceId: "candidate-source-1",
      companyId: "company-default-local",
      inputType: "manual_note",
      displayName: "Operator discovery note",
      noteText: "Sales and scheduling appear to form one continuous candidate workflow.",
    }),
  });
  assert.equal(source.response.status, 201);

  const candidate = await jsonFetch("/api/company-framing/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidateId: "manual-candidate-1",
      companyId: "company-default-local",
      framingRunId: "manual-framing-run",
      candidateName: "Quote to scheduled service",
      analysisScope,
      sourceBasisIds: ["candidate-source-1"],
      rationale: "Operator sees a continuous path from service request to scheduled visit.",
      risks: ["Billing may be adjacent."],
      recommendation: "defer",
      status: "ready_for_review",
      scoreSummary: {
        boundaryClarity: 82,
        sourceSupport: 74,
        businessRelevance: 90,
        workflowSeparability: 76,
        roleFunctionVisibility: 80,
        ambiguityRisk: 35,
        suitabilityAsFirstCase: 88,
      },
    }),
  });
  assert.equal(candidate.response.status, 201);
  assert.equal(candidate.data.caseId, undefined);
  assert.equal(candidate.data.analysisScope.scopeBoundary.start, analysisScope.scopeBoundary.start);
  assert.deepEqual(candidate.data.sourceBasisIds, ["candidate-source-1"]);
  assert.match(candidate.data.scoreMeaning, /operator decision support only/);

  const missingName = await jsonFetch("/api/company-framing/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      framingRunId: "manual-framing-run",
      candidateName: "",
      analysisScope,
      rationale: "Missing name should fail.",
      recommendation: "defer",
    }),
  });
  assert.equal(missingName.response.status, 400);
  assert.equal(missingName.data.code, "candidate_name_required");

  const missingBoundary = await jsonFetch("/api/company-framing/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      framingRunId: "manual-framing-run",
      candidateName: "Invalid boundary",
      analysisScope: { ...analysisScope, scopeBoundary: { start: "", end: "" } },
      rationale: "Boundary should fail.",
      recommendation: "defer",
    }),
  });
  assert.equal(missingBoundary.response.status, 400);
  assert.equal(missingBoundary.data.code, "invalid_candidate");

  const invalidScore = await jsonFetch("/api/company-framing/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      framingRunId: "manual-framing-run",
      candidateName: "Invalid score",
      analysisScope,
      rationale: "Score should fail.",
      recommendation: "defer",
      scoreSummary: { boundaryClarity: 101 },
    }),
  });
  assert.equal(invalidScore.response.status, 400);
  assert.equal(invalidScore.data.code, "invalid_candidate");

  const rejectedCaseId = await jsonFetch("/api/company-framing/candidates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      framingRunId: "manual-framing-run",
      candidateName: "Reject case id",
      analysisScope,
      rationale: "Should reject case linkage.",
      recommendation: "defer",
      caseId: "case-1",
    }),
  });
  assert.equal(rejectedCaseId.response.status, 400);

  const list = await jsonFetch("/api/company-framing/candidates?companyId=company-default-local");
  assert.equal(list.response.status, 200);
  assert.deepEqual(list.data.map((item) => item.candidateId), ["manual-candidate-1"]);

  const detail = await jsonFetch("/api/company-framing/candidates/manual-candidate-1");
  assert.equal(detail.response.status, 200);
  assert.equal(detail.data.candidateId, "manual-candidate-1");

  const decision = await jsonFetch("/api/company-framing/candidates/manual-candidate-1/decision", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "selected",
      recommendation: "promote",
      operatorNotes: "Operator selected for later promotion, but Block 5 does not promote.",
    }),
  });
  assert.equal(decision.response.status, 200);
  assert.equal(decision.data.status, "selected");
  assert.equal(decision.data.recommendation, "promote");
  assert.match(decision.data.operatorNotes, /does not promote/);

  const listPage = await textFetch("/company-framing/candidates");
  assert.match(listPage, /data-testid="framing-candidate-list"/);
  assert.match(listPage, /manual-candidate-1/);
  assert.match(listPage, /pre-case workflow\/use-case options for operator review/);

  const createPage = await textFetch("/company-framing/candidates/new");
  assert.match(createPage, /data-testid="framing-candidate-create-form"/);
  assert.match(createPage, /data-testid="framing-candidate-no-caseid-note"/);
  assert.match(createPage, /data-testid="framing-candidate-no-promotion-note"/);
  assert.doesNotMatch(createPage, /name="caseId"/);
  assert.doesNotMatch(createPage, /name="sessionId"/);
  assert.doesNotMatch(createPage, /Promote candidate/);

  const detailPage = await textFetch("/company-framing/candidates/manual-candidate-1");
  assert.match(detailPage, /data-testid="framing-candidate-detail"/);
  assert.match(detailPage, /not workflow truth/i);
  assert.match(detailPage, /not participant evidence/i);
  assert.match(detailPage, /not package-ready/i);
  assert.match(detailPage, /data-testid="framing-candidate-no-promotion-note"/);
  assert.doesNotMatch(detailPage, /Promote candidate/);

  const db = new DatabaseSync(dbPath);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM cases").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM intake_sessions").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM intake_sources").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM case_entry_packets").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM source_to_case_links").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM provider_extraction_jobs").get().count, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM framing_candidates").get().count, 1);

  console.log("prove-pass2a-block5-framing-candidates: all checks passed");
} finally {
  server.child.kill("SIGTERM");
}
