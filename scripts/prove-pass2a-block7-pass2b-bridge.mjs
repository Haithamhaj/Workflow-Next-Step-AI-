import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = join(mkdtempSync(join(tmpdir(), "workflow-pass2a-block7-")), "pass2b-bridge.sqlite");
const port = 3222;
const baseUrl = `http://127.0.0.1:${port}`;
const companyId = "company-default-local";

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
      const response = await fetch(`${baseUrl}/cases`);
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

function count(db, tableName) {
  return db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
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

  const packet = await jsonFetch("/api/company-framing/case-entry-packets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packetId: "bridge-packet-known",
      source: "known_use_case",
      companyId,
      proposedDomain: "Field Services",
      proposedMainDepartment: "Operations",
      proposedUseCaseLabel: "Bridge scheduling case",
      analysisScope,
      assumptions: ["Operator-created bridge proof packet."],
      unknowns: [],
    }),
  });
  assert.equal(packet.response.status, 201);

  const promoted = await jsonFetch("/api/company-framing/case-entry-packets/bridge-packet-known/promote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caseId: "case-from-packet-bridge", promotedBy: "proof" }),
  });
  assert.equal(promoted.response.status, 201);
  assert.equal(promoted.data.case.caseId, "case-from-packet-bridge");
  assert.equal(promoted.data.case.companyProfileRef, "case-entry-packet:bridge-packet-known");
  assert.equal(promoted.data.packet.createdCaseId, "case-from-packet-bridge");

  const dbAfterPromotion = new DatabaseSync(dbPath);
  assert.equal(count(dbAfterPromotion, "cases"), 1);
  assert.equal(count(dbAfterPromotion, "intake_sessions"), 0);
  assert.equal(count(dbAfterPromotion, "intake_sources"), 0);
  assert.equal(count(dbAfterPromotion, "source_to_case_links"), 0);
  dbAfterPromotion.close();

  const caseList = await jsonFetch(`/api/cases?companyId=${encodeURIComponent(companyId)}`);
  assert.equal(caseList.response.status, 200);
  const promotedCase = caseList.data.find((item) => item.caseId === "case-from-packet-bridge");
  assert.ok(promotedCase, "promoted case should appear in existing case API list");
  assert.equal(promotedCase.domain, "Field Services");
  assert.equal(promotedCase.mainDepartment, "Operations");
  assert.equal(promotedCase.useCaseLabel, "Bridge scheduling case");

  const casesPage = await textFetch(`/cases?companyId=${encodeURIComponent(companyId)}`);
  assert.match(casesPage, /case-from-packet-bridge/);
  assert.match(casesPage, /Bridge scheduling case|Field Services/);

  const packetDetail = await textFetch("/company-framing/case-entry-packets/bridge-packet-known");
  assert.match(packetDetail, /Open formal case list/);
  assert.match(packetDetail, /case-from-packet-bridge/);

  const session = await jsonFetch("/api/intake-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId,
      caseId: "case-from-packet-bridge",
      sessionId: "intake-from-promoted-case",
      bucket: "company",
    }),
  });
  assert.equal(session.response.status, 201);
  assert.equal(session.data.caseId, "case-from-packet-bridge");
  assert.equal(session.data.sessionId, "intake-from-promoted-case");

  const sessionsForCase = await jsonFetch(`/api/intake-sessions?companyId=${encodeURIComponent(companyId)}&caseId=case-from-packet-bridge`);
  assert.equal(sessionsForCase.response.status, 200);
  assert.deepEqual(sessionsForCase.data.map((item) => item.sessionId), ["intake-from-promoted-case"]);

  const readiness = await jsonFetch("/api/intake-sessions/intake-from-promoted-case/final-pre-hierarchy-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "check-readiness" }),
  });
  assert.equal(readiness.response.status, 409);
  assert.equal(readiness.data.readiness.ready, false);
  assert.match(readiness.data.readiness.reasons.join(" "), /Primary department and use-case framing has not been saved/);
  assert.match(readiness.data.readiness.reasons.join(" "), /Structured context is missing/);

  const normalCase = await jsonFetch("/api/cases", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId,
      caseId: "case-normal-path",
      domain: "Field Services",
      mainDepartment: "Operations",
      useCaseLabel: "Normal case-first proof",
      companyProfileRef: "operator-profile-ref",
      createdAt: new Date().toISOString(),
    }),
  });
  assert.equal(normalCase.response.status, 201);
  assert.equal(normalCase.data.caseId, "case-normal-path");

  const normalSession = await jsonFetch("/api/intake-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId,
      caseId: "case-normal-path",
      sessionId: "intake-normal-case",
      bucket: "company",
    }),
  });
  assert.equal(normalSession.response.status, 201);
  assert.equal(normalSession.data.caseId, "case-normal-path");

  const db = new DatabaseSync(dbPath);
  assert.equal(count(db, "cases"), 2);
  assert.equal(count(db, "intake_sessions"), 2);
  assert.equal(count(db, "intake_sources"), 0);
  assert.equal(count(db, "source_to_case_links"), 0);
  assert.equal(count(db, "provider_extraction_jobs"), 0);
  assert.equal(count(db, "participant_sessions"), 0);
  assert.equal(count(db, "pass6_core_records"), 0);
  db.close();

  console.log("prove-pass2a-block7-pass2b-bridge: all checks passed");
} finally {
  server.child.kill("SIGTERM");
}
