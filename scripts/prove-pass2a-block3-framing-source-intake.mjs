import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { validateFramingSource } from "../packages/contracts/dist/index.js";
import {
  attachFramingSourceToRun,
  listFramingSourcesForCompany,
  listFramingSourcesForRun,
  registerFramingSource,
  updateFramingSourceStatus,
} from "../packages/company-framing/dist/index.js";
import { createSQLiteIntakeRepositories } from "../packages/persistence/dist/index.js";

function assertOk(name, result) {
  assert.equal(result.ok, true, `${name} should succeed: ${JSON.stringify(result.error ?? null)}`);
  return result.source;
}

function assertFail(name, result, code) {
  assert.equal(result.ok, false, `${name} should fail`);
  assert.equal(result.error.code, code, `${name} should fail with ${code}`);
}

function assertContractValid(name, source) {
  const result = validateFramingSource(source);
  assert.equal(
    result.ok,
    true,
    `${name} should validate as FramingSource: ${JSON.stringify(result.errors ?? [])}`,
  );
}

const dbPath = join(mkdtempSync(join(tmpdir(), "workflow-pass2a-block3-")), "framing-source-intake.sqlite");
const repos = createSQLiteIntakeRepositories(dbPath);
const companyId = "company-1";
const framingRunId = "framing-run-1";
const createdAt = "2026-05-01T00:00:00.000Z";

const manualNote = assertOk(
  "manual_note registration",
  registerFramingSource({
    framingSourceId: "framing-source-note",
    companyId,
    inputType: "manual_note",
    noteText: "Owner says scheduling is the first workflow to inspect.",
    displayName: "Operator note",
    createdAt,
    updatedAt: createdAt,
  }, repos.framingSources),
);

const website = assertOk(
  "website_url registration",
  registerFramingSource({
    framingSourceId: "framing-source-website",
    companyId,
    inputType: "website_url",
    websiteUrl: "https://example.com/services",
    displayName: "Services page",
    createdAt,
    updatedAt: createdAt,
  }, repos.framingSources),
);

const document = assertOk(
  "document metadata registration",
  registerFramingSource({
    framingSourceId: "framing-source-document",
    companyId,
    inputType: "document",
    fileName: "service-catalog.pdf",
    displayName: "Service catalog",
    mimeType: "application/pdf",
    createdAt,
    updatedAt: createdAt,
  }, repos.framingSources),
);

assertFail(
  "manual_note without noteText",
  registerFramingSource({
    companyId,
    inputType: "manual_note",
  }, repos.framingSources),
  "note_text_required",
);

assertFail(
  "website_url without websiteUrl",
  registerFramingSource({
    companyId,
    inputType: "website_url",
  }, repos.framingSources),
  "website_url_required",
);

assertFail(
  "registration with caseId",
  registerFramingSource({
    companyId,
    inputType: "manual_note",
    noteText: "This should fail because it includes a case id.",
    caseId: "case-1",
  }, repos.framingSources),
  "case_id_not_allowed",
);

for (const [name, source] of [
  ["manual_note", manualNote],
  ["website_url", website],
  ["document", document],
]) {
  assert.equal(source.status, "uploaded", `${name} should default status to uploaded`);
  assert.equal(source.sourceVersion, 1, `${name} should default sourceVersion to 1`);
  assert.ok(source.createdAt, `${name} should have createdAt`);
  assert.ok(source.updatedAt, `${name} should have updatedAt`);
  assert.equal("caseId" in source, false, `${name} should not include caseId`);
  assertContractValid(name, source);
}

assert.deepEqual(
  listFramingSourcesForCompany(companyId, repos.framingSources).map((source) => source.framingSourceId),
  ["framing-source-document", "framing-source-note", "framing-source-website"],
  "company list should include registered framing sources",
);

const attached = assertOk(
  "attach source to framing run",
  attachFramingSourceToRun("framing-source-note", framingRunId, repos.framingSources, {
    updatedAt: "2026-05-01T00:01:00.000Z",
  }),
);
assert.deepEqual(attached.framingRunIds, [framingRunId], "attach should add framingRunId");

const attachedAgain = assertOk(
  "attach source to framing run without duplication",
  attachFramingSourceToRun("framing-source-note", framingRunId, repos.framingSources, {
    updatedAt: "2026-05-01T00:02:00.000Z",
  }),
);
assert.deepEqual(attachedAgain.framingRunIds, [framingRunId], "attach should not duplicate framingRunId");

assert.deepEqual(
  listFramingSourcesForRun(framingRunId, repos.framingSources).map((source) => source.framingSourceId),
  ["framing-source-note"],
  "run list should include attached framing source",
);

for (const status of ["processing", "processed", "needs_review"]) {
  const updated = assertOk(
    `update status ${status}`,
    updateFramingSourceStatus("framing-source-note", status, repos.framingSources),
  );
  assert.equal(updated.status, status, `status should update to ${status}`);
  assertContractValid(`updated ${status}`, updated);
}

const failed = assertOk(
  "update status failed",
  updateFramingSourceStatus("framing-source-note", "failed", repos.framingSources, {
    failureReason: "Unsupported upload format for later processing.",
  }),
);
assert.equal(failed.status, "failed", "status should update to failed");
assert.equal(failed.failureReason, "Unsupported upload format for later processing.");
assertContractValid("updated failed", failed);

assert.equal(repos.intakeSources.findAll().length, 0, "framing source intake should not create IntakeSource records");
assert.equal(repos.intakeSessions.findAll().length, 0, "framing source intake should not create intake sessions");

const db = new DatabaseSync(dbPath);
const intakeSourceColumns = db.prepare("PRAGMA table_info(intake_sources)").all();
const intakeSessionColumns = db.prepare("PRAGMA table_info(intake_sessions)").all();
const intakeSourceCaseId = intakeSourceColumns.find((column) => column.name === "case_id");
const intakeSessionCaseId = intakeSessionColumns.find((column) => column.name === "case_id");

assert.equal(intakeSourceCaseId?.notnull, 1, "intake_sources.case_id should remain NOT NULL");
assert.equal(intakeSessionCaseId?.notnull, 1, "intake_sessions.case_id should remain NOT NULL");

console.log("prove-pass2a-block3-framing-source-intake: all checks passed");
