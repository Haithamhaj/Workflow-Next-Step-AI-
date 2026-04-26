import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  validatePass6PromptSpec,
  validatePass6PromptTestCase,
} from "../packages/contracts/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  PASS6_PROMPT_CAPABILITY_KEYS,
  archivePass6PromptSpec,
  clonePass6PromptSpecToDraft,
  comparePass6PromptDraftToActive,
  compilePass6PromptSpec,
  createDefaultPass6PromptSpecs,
  createPass6PromptTestCase,
  listPass6PromptSpecs,
  promotePass6PromptDraft,
  updatePass6PromptDraftSections,
} from "../packages/prompts/dist/index.js";

const store = createInMemoryStore();
const now = "2026-04-27T02:00:00.000Z";

const defaults = createDefaultPass6PromptSpecs(store.pass6PromptSpecs, { now });
assert.equal(defaults.length, 9, "default Pass 6 PromptSpecs are created");
assert.deepEqual(
  defaults.map((spec) => spec.capabilityKey).sort(),
  [...PASS6_PROMPT_CAPABILITY_KEYS].sort(),
  "all nine required capabilities exist",
);
for (const spec of defaults) {
  assert.equal(validatePass6PromptSpec(spec).ok, true, `${spec.capabilityKey} default validates`);
  assert.equal(spec.status, "draft", "default PromptSpecs are drafts");
  assert.ok(spec.compiledPromptPreview.includes("## boundariesAndProhibitions"), "compiled preview includes structured sections");
}

const synthesisDraft = defaults.find((spec) => spec.capabilityKey === "synthesis");
const beforePreview = compilePass6PromptSpec(synthesisDraft);
const editedSections = structuredClone(synthesisDraft.sections);
editedSections.missionOrTaskPurpose = "Edited mission for Block 4 proof. This remains prompt-preview scaffolding only.";
const edit = updatePass6PromptDraftSections(synthesisDraft.promptSpecId, editedSections, store.pass6PromptSpecs, {
  now: "2026-04-27T02:05:00.000Z",
});
assert.equal(edit.ok, true, "draft PromptSpec can be edited");
assert.notEqual(edit.promptSpec.compiledPromptPreview, beforePreview, "compiled prompt preview changes after edit");

const invalidSections = structuredClone(editedSections);
delete invalidSections.outputContract;
const invalidEdit = updatePass6PromptDraftSections(synthesisDraft.promptSpecId, invalidSections, store.pass6PromptSpecs);
assert.equal(invalidEdit.ok, false, "schema-invalid PromptSpec section update is rejected");

const invalidStatus = { ...edit.promptSpec, promptSpecId: "bad-status", status: "published" };
assert.equal(validatePass6PromptSpec(invalidStatus).ok, false, "invalid PromptSpec status is rejected");

const promoteOne = promotePass6PromptDraft(synthesisDraft.promptSpecId, store.pass6PromptSpecs, {
  now: "2026-04-27T02:10:00.000Z",
});
assert.equal(promoteOne.ok, true, "promote draft to active works");
assert.equal(store.pass6PromptSpecs.findActiveByCapability("synthesis").promptSpecId, synthesisDraft.promptSpecId);

const clone = clonePass6PromptSpecToDraft(synthesisDraft.promptSpecId, store.pass6PromptSpecs, {
  newPromptSpecId: "pass6-prompt-synthesis-draft-v2",
  now: "2026-04-27T02:15:00.000Z",
});
assert.equal(clone.ok, true, "active PromptSpec can be cloned to draft");
const secondDraftSections = structuredClone(clone.draft.sections);
secondDraftSections.adminReviewNotes = "Changed admin review notes for active-vs-draft comparison proof.";
const editSecondDraft = updatePass6PromptDraftSections(clone.draft.promptSpecId, secondDraftSections, store.pass6PromptSpecs, {
  now: "2026-04-27T02:20:00.000Z",
});
assert.equal(editSecondDraft.ok, true);

const comparison = comparePass6PromptDraftToActive("synthesis", store.pass6PromptSpecs);
assert.equal(comparison.activePromptSpecId, synthesisDraft.promptSpecId);
assert.equal(comparison.draftPromptSpecId, clone.draft.promptSpecId);
assert.ok(comparison.changedSections.includes("adminReviewNotes"), "draft-vs-active comparison detects section changes");

const testCase = createPass6PromptTestCase({
  testCaseId: "pass6-prompt-test-1",
  promptSpecId: clone.draft.promptSpecId,
  name: "Synthesis sample fixture",
  inputFixture: {
    sampleContext: "Accepted Pass 5 output fixture for prompt preview only.",
    providerExecutionExpected: false,
  },
  expectedOutputNotes: "Expected prompt output should preserve governance boundaries.",
  status: "enabled",
  enabled: true,
  createdAt: "2026-04-27T02:25:00.000Z",
  updatedAt: "2026-04-27T02:25:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
});
assert.equal(testCase.ok, true, "test case record can be created and linked");
assert.equal(validatePass6PromptTestCase(testCase.testCase).ok, true);
assert.ok(store.pass6PromptSpecs.findById(clone.draft.promptSpecId).testCaseIds.includes("pass6-prompt-test-1"));

const promoteTwo = promotePass6PromptDraft(clone.draft.promptSpecId, store.pass6PromptSpecs, {
  now: "2026-04-27T02:30:00.000Z",
});
assert.equal(promoteTwo.ok, true, "edited draft can be promoted");
assert.equal(promoteTwo.previous.promptSpecId, synthesisDraft.promptSpecId, "previous active moves to previous");
assert.equal(store.pass6PromptSpecs.findById(synthesisDraft.promptSpecId).status, "previous");
assert.equal(store.pass6PromptSpecs.findActiveByCapability("synthesis").promptSpecId, clone.draft.promptSpecId);

const archive = archivePass6PromptSpec(synthesisDraft.promptSpecId, store.pass6PromptSpecs, {
  reason: "Archive previous PromptSpec in proof.",
  now: "2026-04-27T02:35:00.000Z",
});
assert.equal(archive.ok, true, "non-active PromptSpec can be archived");

assert.ok(listPass6PromptSpecs(store.pass6PromptSpecs).length >= 9, "PromptSpec list returns workspace records");

const promptPackageSource = readFileSync("packages/prompts/src/index.ts", "utf8");
const pass6PromptSource = promptPackageSource.slice(promptPackageSource.indexOf("Pass 6 Prompt Workspace / PromptOps"));
const apiSource = readFileSync("apps/admin-web/app/api/pass6/prompts/route.ts", "utf8");
const listPageSource = readFileSync("apps/admin-web/app/pass6/prompts/page.tsx", "utf8");
const detailPageSource = readFileSync("apps/admin-web/app/pass6/prompts/[promptSpecId]/page.tsx", "utf8");

assert.ok(listPageSource.includes("/pass6/prompts"), "admin list route exists");
assert.ok(detailPageSource.includes("Structured Section Editor"), "admin detail exposes structured section editor");
assert.ok(detailPageSource.includes("Compiled Prompt Preview"), "admin detail exposes compiled prompt preview");
assert.ok(detailPageSource.includes("Draft vs Active Comparison"), "admin detail exposes comparison");
assert.ok(detailPageSource.includes("Test Cases"), "admin detail exposes test case surface");
assert.ok(apiSource.includes("sectionsJson"), "admin UI and API share JSON section edit path");
assert.ok(apiSource.includes("Invalid prompt section JSON"), "invalid JSON creates visible structured error");

const providerForbidden = [
  "provider.runPromptText",
  "executeProvider",
  "runProductionPrompt",
  "OpenAI(",
  "GoogleGenerativeAI",
];
for (const source of [pass6PromptSource, apiSource, listPageSource, detailPageSource]) {
  for (const forbidden of providerForbidden) {
    assert.equal(source.includes(forbidden), false, `Block 4 Prompt Workspace must not call provider path ${forbidden}`);
  }
}

const behaviorForbidden = [
  "createSynthesisInputBundle",
  "runAnalysis",
  "scoreClaim",
  "routeReadiness",
  "generateInitialPackage",
  "buildPackageVisuals",
  "runCopilot",
  "createReviewIssue",
];
for (const source of [apiSource, listPageSource, detailPageSource]) {
  for (const forbidden of behaviorForbidden) {
    assert.equal(source.includes(forbidden), false, `Block 4 admin surface must not execute ${forbidden}`);
  }
}

console.log("Pass 6 Block 4 Prompt Workspace proof passed.");
