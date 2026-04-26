import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  validatePass6PromptTestExecutionResult,
} from "../packages/contracts/dist/index.js";
import { providerRegistry } from "../packages/integrations/dist/index.js";
import { createInMemoryStore } from "../packages/persistence/dist/index.js";
import {
  clonePass6PromptSpecToDraft,
  comparePass6PromptTestExecutions,
  createDefaultPass6PromptSpecs,
  createPass6PromptTestCase,
  promotePass6PromptDraft,
  runPass6PromptWorkspaceTest,
  updatePass6PromptDraftSections,
} from "../packages/prompts/dist/index.js";

const store = createInMemoryStore();
const defaults = createDefaultPass6PromptSpecs(store.pass6PromptSpecs, {
  now: "2026-04-27T03:00:00.000Z",
});
const draft = defaults.find((spec) => spec.capabilityKey === "synthesis");
assert.ok(draft, "synthesis draft exists");

const testCase = createPass6PromptTestCase({
  testCaseId: "pass6-block5-test-case-1",
  promptSpecId: draft.promptSpecId,
  name: "Block 5 harness fixture",
  inputFixture: {
    sampleContext: "Accepted Pass 5 material fixture for Prompt Workspace testing only.",
    expectedBoundary: "Do not create 6A/6B/Pre-6C/6C records.",
  },
  expectedOutputNotes: "Provider output must be inspectable and must not become workflow truth.",
  status: "enabled",
  enabled: true,
  createdAt: "2026-04-27T03:01:00.000Z",
  updatedAt: "2026-04-27T03:01:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
});
assert.equal(testCase.ok, true, "test case created");

const missingProviderResult = await runPass6PromptWorkspaceTest({
  executionId: "pass6-block5-exec-missing-provider",
  promptSpecId: draft.promptSpecId,
  testCaseId: testCase.testCase.testCaseId,
  provider: null,
  providerName: "openai",
  modelName: "unknown",
  now: "2026-04-27T03:02:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
  executions: store.pass6PromptTestExecutionResults,
});
assert.equal(missingProviderResult.status, "failed", "missing provider configuration produces visible failed result");
assert.equal(missingProviderResult.errorCode, "provider_not_configured");
assert.ok(missingProviderResult.compiledPromptSnapshot.includes("Prompt Workspace Test Fixture"), "compiled prompt snapshot is captured");
assert.equal(validatePass6PromptTestExecutionResult(missingProviderResult).ok, true, "execution result validates");
assert.deepEqual(store.pass6PromptTestExecutionResults.findById(missingProviderResult.executionId), missingProviderResult, "execution result is persisted");

const failingProvider = {
  name: "openai",
  async runPromptText() {
    throw new Error("provider_rate_limited: synthetic proof provider failure");
  },
};
const failureResult = await runPass6PromptWorkspaceTest({
  executionId: "pass6-block5-exec-provider-failure",
  promptSpecId: draft.promptSpecId,
  testCaseId: testCase.testCase.testCaseId,
  provider: failingProvider,
  providerName: "openai",
  modelName: "proof-failure-model",
  now: "2026-04-27T03:03:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
  executions: store.pass6PromptTestExecutionResults,
});
assert.equal(failureResult.status, "failed", "provider failure does not fake success");
assert.equal(failureResult.errorCode, "provider_rate_limited");
assert.equal(Boolean(failureResult.outputText), false, "failed provider result has no fake output");

const successProvider = {
  name: "openai",
  async runPromptText() {
    return {
      text: "Proof provider output for Prompt Workspace test only.",
      provider: "openai",
      model: "proof-model",
    };
  },
};
const draftSuccess = await runPass6PromptWorkspaceTest({
  executionId: "pass6-block5-exec-draft-success",
  promptSpecId: draft.promptSpecId,
  testCaseId: testCase.testCase.testCaseId,
  provider: successProvider,
  providerName: "openai",
  modelName: "proof-model",
  now: "2026-04-27T03:04:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
  executions: store.pass6PromptTestExecutionResults,
});
assert.equal(draftSuccess.status, "succeeded", "stored draft PromptSpec can run against stored test case through harness");
assert.equal(draftSuccess.outputText, "Proof provider output for Prompt Workspace test only.");

const promoteOne = promotePass6PromptDraft(draft.promptSpecId, store.pass6PromptSpecs, {
  now: "2026-04-27T03:05:00.000Z",
});
assert.equal(promoteOne.ok, true, "draft promotes to active for comparison proof");
const clone = clonePass6PromptSpecToDraft(draft.promptSpecId, store.pass6PromptSpecs, {
  newPromptSpecId: "pass6-block5-synthesis-draft-v2",
  now: "2026-04-27T03:06:00.000Z",
});
assert.equal(clone.ok, true, "active clones to draft");
const editedSections = structuredClone(clone.draft.sections);
editedSections.evaluationChecklist = "Changed checklist for draft-vs-active provider result comparison.";
assert.equal(updatePass6PromptDraftSections(clone.draft.promptSpecId, editedSections, store.pass6PromptSpecs).ok, true);

const activeResult = await runPass6PromptWorkspaceTest({
  executionId: "pass6-block5-exec-active-success",
  promptSpecId: draft.promptSpecId,
  testCaseId: testCase.testCase.testCaseId,
  provider: successProvider,
  providerName: "openai",
  modelName: "proof-model",
  now: "2026-04-27T03:07:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
  executions: store.pass6PromptTestExecutionResults,
});
const draftResult = await runPass6PromptWorkspaceTest({
  executionId: "pass6-block5-exec-draft-v2-success",
  promptSpecId: clone.draft.promptSpecId,
  testCaseId: testCase.testCase.testCaseId,
  provider: {
    name: "openai",
    async runPromptText() {
      return { text: "Changed draft proof output.", provider: "openai", model: "proof-model" };
    },
  },
  providerName: "openai",
  modelName: "proof-model",
  now: "2026-04-27T03:08:00.000Z",
}, {
  promptSpecs: store.pass6PromptSpecs,
  testCases: store.pass6PromptTestCases,
  executions: store.pass6PromptTestExecutionResults,
});
assert.equal(activeResult.status, "succeeded");
assert.equal(draftResult.status, "succeeded");

const comparison = comparePass6PromptTestExecutions({
  testCaseId: testCase.testCase.testCaseId,
  activePromptSpecId: draft.promptSpecId,
  draftPromptSpecId: clone.draft.promptSpecId,
}, store.pass6PromptTestExecutionResults);
assert.equal(comparison.status, "comparison_available", "draft-vs-active comparison structure works");
assert.equal(comparison.outputChanged, true, "comparison detects changed outputs");

assert.equal(store.synthesisInputBundles.findAll().length, 0, "prompt test result does not create 6A records");
assert.equal(store.workflowClaims.findAll().length, 0, "prompt test result does not create 6B claims");
assert.equal(store.workflowReadinessResults.findAll().length, 0, "prompt test result does not create readiness results");
assert.equal(store.prePackageGateResults.findAll().length, 0, "prompt test result does not create Pre-6C records");
assert.equal(store.initialWorkflowPackages.findAll().length, 0, "prompt test result does not create 6C packages");
assert.equal(store.workflowGraphRecords.findAll().length, 0, "prompt test result does not create visual graph records");
assert.equal(store.pass7ReviewCandidates.findAll().length, 0, "prompt test result does not create Pass 7 candidates");

const availability = providerRegistry.getPromptTextAvailability();
assert.ok(availability.some((item) => item.name === "openai"), "OpenAI is exposed as Pass 6 text provider option");
assert.equal(providerRegistry.resolveDefaultPromptTextProvider(), "openai", "OpenAI is default Pass 6 text test provider");

const apiSource = readFileSync("apps/admin-web/app/api/pass6/prompts/route.ts", "utf8");
const detailSource = readFileSync("apps/admin-web/app/pass6/prompts/[promptSpecId]/page.tsx", "utf8");
const resultDetailSource = readFileSync("apps/admin-web/app/pass6/prompts/results/[executionId]/page.tsx", "utf8");
assert.ok(apiSource.includes("runPass6PromptWorkspaceTest"), "admin API exposes test harness route");
assert.ok(detailSource.includes("Run Test"), "admin detail can run prompt tests");
assert.ok(detailSource.includes("Latest Test Results"), "admin detail shows latest test results");
assert.ok(resultDetailSource.includes("Compiled Prompt Snapshot"), "result detail shows compiled prompt snapshot");
assert.ok(resultDetailSource.includes("Boundary Record Creation"), "result detail shows no downstream record creation");

const forbiddenRuntimeCalls = [
  "createSynthesisInputBundle",
  "runAnalysis",
  "scoreClaim",
  "routeReadiness",
  "generateInitialPackage",
  "buildPackageVisuals",
  "runCopilot",
  "createReviewIssue",
];
for (const source of [apiSource, detailSource, resultDetailSource]) {
  for (const forbidden of forbiddenRuntimeCalls) {
    assert.equal(source.includes(forbidden), false, `Block 5 admin surface must not execute ${forbidden}`);
  }
}

const realProvider = providerRegistry.getPromptTextProvider("openai");
if (realProvider) {
  const realResult = await runPass6PromptWorkspaceTest({
    executionId: "pass6-block5-exec-real-provider",
    promptSpecId: clone.draft.promptSpecId,
    testCaseId: testCase.testCase.testCaseId,
    provider: realProvider,
    providerName: "openai",
    now: "2026-04-27T03:09:00.000Z",
  }, {
    promptSpecs: store.pass6PromptSpecs,
    testCases: store.pass6PromptTestCases,
    executions: store.pass6PromptTestExecutionResults,
  });
  if (realResult.status === "succeeded") {
    console.log("Pass 6 Block 5 real provider success path proved.");
  } else {
    assert.equal(realResult.status, "failed", "real provider failure is persisted visibly");
    assert.ok(realResult.errorMessage, "real provider failure includes diagnostic");
    console.log(`Pass 6 Block 5 real provider success path not proved: ${realResult.errorCode} ${realResult.errorMessage}`);
  }
} else {
  console.log("Pass 6 Block 5 real provider success path not run: OPENAI_API_KEY unavailable.");
}

console.log("Pass 6 Block 5 Prompt Test Harness proof passed.");
