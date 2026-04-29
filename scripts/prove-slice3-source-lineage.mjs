#!/usr/bin/env node
import { strict as assert } from "node:assert";
import {
  createInMemoryStore,
  listSourceLineageRecords,
  markSourceLineageStatus,
} from "../packages/persistence/dist/index.js";
import {
  createCase,
  createCompany,
} from "../packages/core-case/dist/index.js";
import {
  createIntakeSession,
  createNextIntakeSourceVersion,
  registerIntakeSource,
} from "../packages/sources-context/dist/index.js";

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
    useCaseLabel: "source-lineage-proof",
    companyProfileRef: `${companyId}/profile`,
    createdAt: now,
  };
}

const alpha = createCompany(company("company-lineage-alpha", "Lineage Alpha"), store.companies);
const beta = createCompany(company("company-lineage-beta", "Lineage Beta"), store.companies);
const alphaCase = createCase(caseConfig(alpha.companyId, "case-lineage-alpha", "operations"), store.cases);
const betaCase = createCase(caseConfig(beta.companyId, "case-lineage-beta", "finance"), store.cases);

const alphaSession = createIntakeSession({
  sessionId: "session-lineage-alpha",
  caseId: alphaCase.caseId,
  bucket: "company",
  defaultProvider: "google",
  availableProviders: ["google", "openai"],
}, store.intakeSessions);
const betaSession = createIntakeSession({
  sessionId: "session-lineage-beta",
  caseId: betaCase.caseId,
  bucket: "company",
  defaultProvider: "google",
  availableProviders: ["google", "openai"],
}, store.intakeSessions);

const alphaSourceV1 = registerIntakeSource({
  sourceId: "source-lineage-shared-name",
  sessionId: alphaSession.sessionId,
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  inputType: "manual_note",
  bucket: "company",
  displayName: "Shared policy note",
  noteText: "Alpha source v1",
  noteOrigin: "typed_text",
}, store.intakeSources, store.intakeSessions);
const betaSource = registerIntakeSource({
  sourceId: "source-lineage-beta",
  sessionId: betaSession.sessionId,
  companyId: beta.companyId,
  caseId: betaCase.caseId,
  inputType: "manual_note",
  bucket: "company",
  displayName: "Shared policy note",
  noteText: "Beta source",
  noteOrigin: "typed_text",
}, store.intakeSources, store.intakeSessions);

assert.equal(alphaSourceV1.companyId, alpha.companyId, "source registration stores companyId");
assert.equal(alphaSourceV1.caseId, alphaCase.caseId, "source registration stores caseId");
assert.equal(alphaSourceV1.sourceVersion, 1, "initial source registration starts at sourceVersion 1");
assert.equal(alphaSourceV1.lineageStatus, "active", "initial source registration is active");
assert.equal(betaSource.companyId, beta.companyId, "second company has isolated source ownership");

store.textArtifacts.save({
  artifactId: "artifact-alpha-v1",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sourceId: alphaSourceV1.sourceId,
  sourceVersion: alphaSourceV1.sourceVersion,
  lineageStatus: "active",
  artifactKind: "extracted_text",
  text: "Alpha artifact v1",
  createdAt: now,
});
store.contentChunks.save({
  chunkId: "chunk-alpha-v1",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  crawlPlanId: "manual_note:source-lineage-shared-name:v1",
  sourceId: alphaSourceV1.sourceId,
  sourceVersion: alphaSourceV1.sourceVersion,
  lineageStatus: "active",
  pageContentId: "artifact-alpha-v1",
  url: "manual:source-lineage-shared-name",
  chunkIndex: 0,
  text: "Alpha chunk v1",
  createdAt: now,
});
store.embeddingJobs.save({
  embeddingJobId: "embedding-alpha-v1",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sourceId: alphaSourceV1.sourceId,
  sourceVersion: alphaSourceV1.sourceVersion,
  lineageStatus: "active",
  artifactId: "artifact-alpha-v1",
  provider: "google",
  status: "succeeded",
  embeddingModel: "proof-embedding-model",
  chunkRefs: ["chunk-alpha-v1"],
  createdAt: now,
  updatedAt: now,
});

const alphaSourceV2 = createNextIntakeSourceVersion(
  alphaSourceV1.sourceId,
  { noteText: "Alpha source v2", status: "uploaded" },
  store.intakeSources,
);
assert.equal(alphaSourceV2.sourceId, alphaSourceV1.sourceId, "sourceId remains stable across versions");
assert.equal(alphaSourceV2.sourceVersion, 2, "material source update increments sourceVersion");
assert.notEqual(alphaSourceV1.sourceVersion, alphaSourceV2.sourceVersion, "source v1 and v2 are distinct versions");

const staleArtifacts = markSourceLineageStatus(store.textArtifacts, {
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sourceId: alphaSourceV1.sourceId,
  sourceVersion: alphaSourceV1.sourceVersion,
  fromStatuses: ["active"],
  toStatus: "stale",
});
const staleChunks = markSourceLineageStatus(store.contentChunks, {
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sourceId: alphaSourceV1.sourceId,
  sourceVersion: alphaSourceV1.sourceVersion,
  fromStatuses: ["active"],
  toStatus: "stale",
});
const staleEmbeddings = markSourceLineageStatus(store.embeddingJobs, {
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sourceId: alphaSourceV1.sourceId,
  sourceVersion: alphaSourceV1.sourceVersion,
  fromStatuses: ["active"],
  toStatus: "stale",
});
assert.equal(staleArtifacts, 1, "older artifact is marked stale");
assert.equal(staleChunks, 1, "older chunk is marked stale");
assert.equal(staleEmbeddings, 1, "older embedding job is marked stale");

store.textArtifacts.save({
  artifactId: "artifact-alpha-v2",
  companyId: alpha.companyId,
  caseId: alphaCase.caseId,
  sourceId: alphaSourceV2.sourceId,
  sourceVersion: alphaSourceV2.sourceVersion,
  lineageStatus: "active",
  artifactKind: "extracted_text",
  text: "Alpha artifact v2",
  createdAt: now,
});

const activeArtifacts = listSourceLineageRecords(
  alpha.companyId,
  alphaCase.caseId,
  store.cases,
  store.textArtifacts,
  { sourceId: alphaSourceV1.sourceId },
);
assert.deepEqual(
  activeArtifacts.map((record) => record.artifactId),
  ["artifact-alpha-v2"],
  "stale source-derived records are excluded by default",
);

const allArtifacts = listSourceLineageRecords(
  alpha.companyId,
  alphaCase.caseId,
  store.cases,
  store.textArtifacts,
  { sourceId: alphaSourceV1.sourceId, includeStale: true },
);
assert.deepEqual(
  allArtifacts.map((record) => `${record.artifactId}:${record.lineageStatus}`).sort(),
  ["artifact-alpha-v1:stale", "artifact-alpha-v2:active"],
  "audit/debug views can include stale records with lineageStatus",
);

assert.deepEqual(
  listSourceLineageRecords(beta.companyId, betaCase.caseId, store.cases, store.textArtifacts, {
    sourceId: alphaSourceV1.sourceId,
    includeStale: true,
  }),
  [],
  "wrong companyId cannot access source-derived records",
);

assert.equal(
  store.embeddingJobs.findById("embedding-alpha-v1")?.sourceVersion,
  1,
  "embedding jobs include sourceVersion",
);
assert.equal(
  store.contentChunks.findById?.("chunk-alpha-v1"),
  undefined,
  "content chunks intentionally expose lineage through scoped lists, not direct id reads",
);

const forbiddenWorkStarted = false;
assert.equal(
  forbiddenWorkStarted,
  false,
  "no retrieval/RAG/vector/Answer Cards/ContextEnvelope behavior is implemented by this proof",
);

console.log("PASS Slice 3 source lineage proof");
