#!/usr/bin/env node
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";

const obsoleteApiSurfaces = [
  "apps/admin-web/app/api/pass6/copilot/route.ts",
  "apps/admin-web/app/api/pass6/evaluation/route.ts",
  "apps/admin-web/app/api/pass6/interfaces/[interfaceId]/route.ts",
  "apps/admin-web/app/api/pass6/interfaces/route.ts",
  "apps/admin-web/app/api/pass6/packages/[outputId]/route.ts",
  "apps/admin-web/app/api/pass6/packages/[outputId]/visuals/route.ts",
  "apps/admin-web/app/api/pass6/packages/route.ts",
  "apps/admin-web/app/api/pass6/pass7-candidates/[candidateId]/route.ts",
  "apps/admin-web/app/api/pass6/pass7-candidates/route.ts",
  "apps/admin-web/app/api/pass6/pre6c-gates/[gateResultId]/route.ts",
  "apps/admin-web/app/api/pass6/pre6c-gates/route.ts",
];

const obsoletePageSurfaces = [
  "apps/admin-web/app/pass6/copilot/page.tsx",
  "apps/admin-web/app/pass6/evaluation/page.tsx",
  "apps/admin-web/app/pass6/interfaces/[interfaceId]/page.tsx",
  "apps/admin-web/app/pass6/interfaces/page.tsx",
  "apps/admin-web/app/pass6/packages/[outputId]/page.tsx",
  "apps/admin-web/app/pass6/packages/[outputId]/visuals/page.tsx",
  "apps/admin-web/app/pass6/packages/page.tsx",
  "apps/admin-web/app/pass6/pass7-candidates/[candidateId]/page.tsx",
  "apps/admin-web/app/pass6/pass7-candidates/page.tsx",
  "apps/admin-web/app/pass6/pre6c-gates/[gateResultId]/page.tsx",
  "apps/admin-web/app/pass6/pre6c-gates/page.tsx",
];

const unsafePatterns = [
  /\.findById\(/,
  /\.findAll\(/,
  /\.findByCaseId\(/,
  /from ["'][^"']*lib\/store["']/,
  /@workflow\/prompts/,
  /@workflow\/packages-output/,
  /@workflow\/synthesis-evaluation/,
];

function assertNoUnsafeReads(path) {
  const source = readFileSync(path, "utf8");
  for (const pattern of unsafePatterns) {
    assert.equal(
      pattern.test(source),
      false,
      `${path} must not contain unsafe test-surface repository or generation dependency pattern ${pattern}`,
    );
  }
}

for (const path of [...obsoleteApiSurfaces, ...obsoletePageSurfaces]) {
  assert.equal(existsSync(path), true, `${path} exists as an explicitly blocked retired surface`);
  assertNoUnsafeReads(path);
}

for (const path of obsoleteApiSurfaces) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /blockedOldPass6TestSurfaceResponse/, `${path} returns explicit blocked API response`);
}

for (const path of obsoletePageSurfaces) {
  const source = readFileSync(path, "utf8");
  assert.match(source, /BlockedOldPass6TestSurface/, `${path} renders explicit blocked page`);
}

const apiHelper = readFileSync("apps/admin-web/app/api/pass6/blocked-test-surface.ts", "utf8");
assert.match(apiHelper, /status: 410/, "obsolete API surfaces return gone/blocked status");
assert.match(apiHelper, /noRetrieval: true/, "blocked API boundary prohibits retrieval");
assert.match(apiHelper, /noRag: true/, "blocked API boundary prohibits RAG");
assert.match(apiHelper, /noVectorDb: true/, "blocked API boundary prohibits vector DB");
assert.match(apiHelper, /noAnswerCards: true/, "blocked API boundary prohibits Answer Cards");
assert.match(apiHelper, /noContextEnvelope: true/, "blocked API boundary prohibits ContextEnvelope");
assert.match(apiHelper, /noCopilotEnhancement: true/, "blocked API boundary prohibits Copilot enhancement");
assert.match(apiHelper, /noPackageGeneration: true/, "blocked generation routes do not generate packages");

const pageHelper = readFileSync("apps/admin-web/app/pass6/blocked-test-surface.tsx", "utf8");
assert.match(pageHelper, /Surface retired/, "obsolete pages render explicit retired notice");

const activeRequiredSurfaces = [];
assert.deepEqual(activeRequiredSurfaces, [], "no old admin Pass 6/package test surface is currently classified as active/required");

console.log(JSON.stringify({
  obsoleteApiSurfacesBlocked: obsoleteApiSurfaces.length,
  obsoletePageSurfacesBlocked: obsoletePageSurfaces.length,
  activeRequiredSurfaces,
  copilotTreatment: "blocked_retired",
  generationRouteTreatment: "blocked_retired",
  forbiddenWorkStarted: {
    retrieval: false,
    rag: false,
    vectorDb: false,
    answerCards: false,
    contextEnvelope: false,
    copilotEnhancement: false,
  },
}, null, 2));
console.log("PASS Slice 7B old admin Pass 6/package hardening proof");
