import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { validatePass6ConfigurationProfile } from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  archivePass6ConfigurationProfile,
  compareActiveVsDraftPass6Configuration,
  createDefaultPass6ConfigurationDraft,
  findActivePass6ConfigurationProfile,
  listPass6ConfigurationProfiles,
  promotePass6ConfigurationDraft,
  rollbackPass6ConfigurationProfile,
  savePass6ConfigurationProfile,
  updatePass6ConfigurationDraft,
} from "../packages/synthesis-evaluation/dist/index.js";

const store = createInMemoryStore();
const repo = store.pass6ConfigurationProfiles;
const now = "2026-04-27T01:00:00.000Z";

const draft = createDefaultPass6ConfigurationDraft({
  configId: "pass6-config-draft-1",
  changedBy: "admin",
  changeReason: "Create default draft for Block 3 proof.",
  now,
});

assert.equal(validatePass6ConfigurationProfile(draft).ok, true, "default draft validates");
assert.equal(savePass6ConfigurationProfile(draft, repo).ok, true, "default draft saves");
assert.deepEqual(repo.findById(draft.configId), draft, "saved config reloads");
assert.equal(listPass6ConfigurationProfiles(repo).length, 1, "config list includes draft");

const invalidStatus = { ...draft, configId: "bad-status", status: "published" };
assert.equal(validatePass6ConfigurationProfile(invalidStatus).ok, false, "invalid status rejected");

const invalidScope = { ...draft, configId: "bad-scope", scope: "team" };
assert.equal(validatePass6ConfigurationProfile(invalidScope).ok, false, "invalid scope rejected");

const invalidWeight = structuredClone(draft);
invalidWeight.configId = "bad-weight";
invalidWeight.policies.claimScoringPolicy.weights[0].weight = 1.5;
assert.equal(validatePass6ConfigurationProfile(invalidWeight).ok, false, "invalid weight rejected");

const lockedEdit = updatePass6ConfigurationDraft(draft.configId, {
  lockedGovernanceRules: [],
  changedBy: "admin",
  changeReason: "Attempt to edit locked rules.",
  now,
}, repo);
assert.equal(lockedEdit.ok, false, "locked governance rule edit rejected");

const editedPolicies = structuredClone(draft.policies);
editedPolicies.claimScoringPolicy.weights[0].weight = 0.4;
editedPolicies.claimScoringPolicy.weights[1].weight = 0.2;
const uiPolicyJson = JSON.stringify(editedPolicies, null, 2);
assert.deepEqual(JSON.parse(uiPolicyJson), editedPolicies, "admin JSON textarea payload parses");
const editedDraft = updatePass6ConfigurationDraft(draft.configId, {
  policies: JSON.parse(uiPolicyJson),
  changedBy: "admin",
  changeReason: "Tune scoring weights through admin JSON editor.",
  now: "2026-04-27T01:05:00.000Z",
}, repo);
assert.equal(editedDraft.ok, true, "editable scoring weights persist");
assert.equal(repo.findById(draft.configId).policies.claimScoringPolicy.weights[0].weight, 0.4);
assert.equal(
  repo.findById(draft.configId).changeReason,
  "Tune scoring weights through admin JSON editor.",
  "UI/API edit path metadata persists",
);

assert.throws(
  () => JSON.parse("{not valid json"),
  /JSON/,
  "invalid JSON textarea payload is rejected before save",
);

const schemaInvalidPolicies = structuredClone(editedPolicies);
schemaInvalidPolicies.claimScoringPolicy.weights[0].weight = 2;
const schemaInvalidProfile = {
  ...repo.findById(draft.configId),
  policies: schemaInvalidPolicies,
};
assert.equal(validatePass6ConfigurationProfile(schemaInvalidProfile).ok, false, "schema-invalid policy payload is rejected");

const promoteOne = promotePass6ConfigurationDraft(draft.configId, {
  changedBy: "admin",
  changeReason: "Promote first active config.",
  now: "2026-04-27T01:10:00.000Z",
}, repo);
assert.equal(promoteOne.ok, true, "draft promotes to active");
assert.equal(findActivePass6ConfigurationProfile(repo).configId, draft.configId, "active config resolves");

const secondDraft = createDefaultPass6ConfigurationDraft({
  configId: "pass6-config-draft-2",
  changedBy: "admin",
  changeReason: "Second draft for comparison.",
  now: "2026-04-27T01:15:00.000Z",
  basedOnConfigId: draft.configId,
});
secondDraft.policies.packageOutputPolicy.packageWarningLanguageTemplate = "Warning template changed: {{warnings}}";
assert.equal(savePass6ConfigurationProfile(secondDraft, repo).ok, true);

const comparison = compareActiveVsDraftPass6Configuration(repo);
assert.equal(comparison.activeConfigId, draft.configId);
assert.equal(comparison.draftConfigId, secondDraft.configId);
assert.ok(comparison.changedSections.includes("packageOutputPolicy"), "comparison names changed policy section");

const promoteTwo = promotePass6ConfigurationDraft(secondDraft.configId, {
  changedBy: "admin",
  changeReason: "Promote second config.",
  now: "2026-04-27T01:20:00.000Z",
}, repo);
assert.equal(promoteTwo.ok, true, "second draft promotes");
assert.equal(repo.findById(draft.configId).status, "previous", "previous active becomes previous");
assert.equal(findActivePass6ConfigurationProfile(repo).configId, secondDraft.configId);

const rollback = rollbackPass6ConfigurationProfile(draft.configId, {
  newConfigId: "pass6-config-rollback-1",
  changedBy: "admin",
  changeReason: "Create rollback draft.",
  now: "2026-04-27T01:25:00.000Z",
}, repo);
assert.equal(rollback.ok, true, "rollback creates draft");
assert.equal(rollback.draft.status, "draft");
assert.equal(rollback.draft.rollbackReference, draft.configId);

const archive = archivePass6ConfigurationProfile(rollback.draft.configId, {
  changedBy: "admin",
  changeReason: "Archive unused rollback draft.",
  now: "2026-04-27T01:30:00.000Z",
}, repo);
assert.equal(archive.ok, true, "archive non-active config");
assert.equal(repo.findById(rollback.draft.configId).status, "archived");

const apiSource = readFileSync("apps/admin-web/app/api/pass6/configuration/route.ts", "utf8");
const pageSource = readFileSync("apps/admin-web/app/pass6/configuration/page.tsx", "utf8");
assert.ok(apiSource.includes("updatePass6ConfigurationDraft"), "API uses package helper for update");
assert.ok(apiSource.includes("policiesJson"), "API accepts the same policy JSON field used by the admin page");
assert.ok(apiSource.includes("Invalid policy JSON"), "API returns visible invalid JSON error");
assert.ok(pageSource.includes("Locked Governance Rules"), "admin page exposes locked governance rules");
assert.ok(pageSource.includes("Claim Confidence Weights"), "admin page exposes scoring weights");
assert.ok(pageSource.includes("Active vs Draft"), "admin page exposes comparison panel");
assert.ok(pageSource.includes("Draft Policy JSON Editor"), "admin page exposes nested policy JSON editor");
assert.ok(pageSource.includes("name=\"policiesJson\""), "admin page posts policy JSON through form field");
assert.ok(pageSource.includes("Save Draft Policy JSON"), "admin page exposes save action for draft policy JSON");

const forbiddenRuntimeCalls = [
  "createSynthesisInputBundle",
  "runAnalysis",
  "executeProvider",
  "generateInitialPackage",
  "buildPackageVisuals",
  "createReviewIssue",
];
for (const source of [apiSource, pageSource]) {
  for (const forbidden of forbiddenRuntimeCalls) {
    assert.equal(source.includes(forbidden), false, `Block 3 must not call ${forbidden}`);
  }
}

console.log("Pass 6 Block 3 configuration proof passed.");
