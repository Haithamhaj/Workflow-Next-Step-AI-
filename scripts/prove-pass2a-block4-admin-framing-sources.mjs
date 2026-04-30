import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const dbPath = join(mkdtempSync(join(tmpdir(), "workflow-pass2a-block4-")), "admin-framing-sources.sqlite");
const port = 3219;
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
      const response = await fetch(`${baseUrl}/company-framing/sources/new`);
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

cleanupSqlite(dbPath);
const server = startServer();

try {
  await waitForServer(server);

  const manual = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      framingSourceId: "admin-framing-source-note",
      companyId: "company-default-local",
      inputType: "manual_note",
      displayName: "Admin note",
      noteText: "The owner wants to discover candidate workflows before case creation.",
    }),
  });
  assert.equal(manual.response.status, 201);
  assert.equal(manual.data.caseId, undefined);
  assert.equal(manual.data.status, "uploaded");
  assert.equal(manual.data.sourceVersion, 1);

  const website = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      framingSourceId: "admin-framing-source-website",
      companyId: "company-default-local",
      inputType: "website_url",
      displayName: "Services page",
      websiteUrl: "https://example.com/services",
    }),
  });
  assert.equal(website.response.status, 201);
  assert.equal(website.data.caseId, undefined);

  const document = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      framingSourceId: "admin-framing-source-document",
      companyId: "company-default-local",
      inputType: "document",
      displayName: "Service catalog",
      fileName: "service-catalog.pdf",
      mimeType: "application/pdf",
    }),
  });
  assert.equal(document.response.status, 201);
  assert.equal(document.data.caseId, undefined);

  const invalidManual = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      inputType: "manual_note",
    }),
  });
  assert.equal(invalidManual.response.status, 400);
  assert.equal(invalidManual.data.code, "note_text_required");

  const invalidWebsite = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      inputType: "website_url",
    }),
  });
  assert.equal(invalidWebsite.response.status, 400);
  assert.equal(invalidWebsite.data.code, "website_url_required");

  const rejectedCaseId = await jsonFetch("/api/company-framing/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      companyId: "company-default-local",
      inputType: "manual_note",
      noteText: "Should reject case linkage.",
      caseId: "case-1",
    }),
  });
  assert.equal(rejectedCaseId.response.status, 400);

  const list = await jsonFetch("/api/company-framing/sources?companyId=company-default-local");
  assert.equal(list.response.status, 200);
  assert.deepEqual(
    list.data.map((source) => source.framingSourceId).sort(),
    ["admin-framing-source-document", "admin-framing-source-note", "admin-framing-source-website"],
  );

  const detail = await jsonFetch("/api/company-framing/sources/admin-framing-source-note");
  assert.equal(detail.response.status, 200);
  assert.equal(detail.data.framingSourceId, "admin-framing-source-note");
  assert.equal(detail.data.caseId, undefined);

  const needsReview = await jsonFetch("/api/company-framing/sources/admin-framing-source-note/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "needs_review" }),
  });
  assert.equal(needsReview.response.status, 200);
  assert.equal(needsReview.data.status, "needs_review");

  const failed = await jsonFetch("/api/company-framing/sources/admin-framing-source-note/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "failed", failureReason: "Manual admin status test." }),
  });
  assert.equal(failed.response.status, 200);
  assert.equal(failed.data.status, "failed");
  assert.equal(failed.data.failureReason, "Manual admin status test.");

  const listPage = await textFetch("/company-framing/sources");
  assert.match(listPage, /data-testid="framing-source-list"/);
  assert.match(listPage, /admin-framing-source-note/);
  assert.match(listPage, /pre-case materials used for candidate framing/);

  const createPage = await textFetch("/company-framing/sources/new");
  assert.match(createPage, /data-testid="framing-source-create-form"/);
  assert.match(createPage, /data-testid="framing-source-no-caseid-note"/);
  assert.doesNotMatch(createPage, /name="caseId"/);
  assert.doesNotMatch(createPage, /name="sessionId"/);

  const detailPage = await textFetch("/company-framing/sources/admin-framing-source-note");
  assert.match(detailPage, /data-testid="framing-source-detail"/);
  assert.match(detailPage, /pre-case source/i);
  assert.match(detailPage, /not participant evidence/i);
  assert.match(detailPage, /not workflow truth/i);
  assert.match(detailPage, /No caseId exists/);

  const db = new DatabaseSync(dbPath);
  const caseCount = db.prepare("SELECT COUNT(*) AS count FROM cases").get().count;
  const sessionCount = db.prepare("SELECT COUNT(*) AS count FROM intake_sessions").get().count;
  const intakeSourceCount = db.prepare("SELECT COUNT(*) AS count FROM intake_sources").get().count;
  const providerJobCount = db.prepare("SELECT COUNT(*) AS count FROM provider_extraction_jobs").get().count;
  const candidateCount = db.prepare("SELECT COUNT(*) AS count FROM framing_candidates").get().count;
  const packetCount = db.prepare("SELECT COUNT(*) AS count FROM case_entry_packets").get().count;
  const intakeSourceColumns = db.prepare("PRAGMA table_info(intake_sources)").all();
  const intakeSessionColumns = db.prepare("PRAGMA table_info(intake_sessions)").all();

  assert.equal(caseCount, 0, "admin framing source workspace should not create cases");
  assert.equal(sessionCount, 0, "admin framing source workspace should not create intake sessions");
  assert.equal(intakeSourceCount, 0, "admin framing source workspace should not create IntakeSource records");
  assert.equal(providerJobCount, 0, "admin framing source workspace should not create provider jobs");
  assert.equal(candidateCount, 0, "admin framing source workspace should not create candidates");
  assert.equal(packetCount, 0, "admin framing source workspace should not create packets");
  assert.equal(intakeSourceColumns.find((column) => column.name === "case_id")?.notnull, 1);
  assert.equal(intakeSessionColumns.find((column) => column.name === "case_id")?.notnull, 1);

  console.log("prove-pass2a-block4-admin-framing-sources: all checks passed");
} finally {
  server.child.kill("SIGTERM");
}
