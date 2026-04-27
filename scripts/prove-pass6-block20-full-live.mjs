import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const requiredProofScripts = Array.from({ length: 19 }, (_, index) =>
  `scripts/prove-pass6-block${index + 1}-${[
    "contracts",
    "persistence",
    "configuration",
    "prompt-workspace",
    "prompt-test-harness",
    "synthesis-input-bundle",
    "bundle-review-surface",
    "method-registry",
    "claim-pipeline",
    "difference-interpretation",
    "workflow-assembly",
    "readiness-result",
    "analysis-report",
    "pre6c-gate",
    "external-interfaces",
    "package-generation",
    "visual-core-integration",
    "copilot",
    "pass7-candidate-seam",
  ][index]}.mjs`
);

for (const scriptPath of requiredProofScripts) {
  assert.equal(existsSync(scriptPath), true, `${scriptPath} must exist`);
}

const adminRoutes = [
  "apps/admin-web/app/pass6/configuration/page.tsx",
  "apps/admin-web/app/pass6/prompts/page.tsx",
  "apps/admin-web/app/pass6/synthesis-input-bundles/page.tsx",
  "apps/admin-web/app/pass6/methods/page.tsx",
  "apps/admin-web/app/pass6/evaluation/page.tsx",
  "apps/admin-web/app/pass6/pre6c-gates/page.tsx",
  "apps/admin-web/app/pass6/interfaces/page.tsx",
  "apps/admin-web/app/pass6/packages/page.tsx",
  "apps/admin-web/app/pass6/packages/[outputId]/visuals/page.tsx",
  "apps/admin-web/app/pass6/copilot/page.tsx",
  "apps/admin-web/app/pass6/pass7-candidates/page.tsx",
];

for (const routePath of adminRoutes) {
  assert.equal(existsSync(routePath), true, `${routePath} must exist`);
}

const apiRoutes = [
  "apps/admin-web/app/api/pass6/configuration/route.ts",
  "apps/admin-web/app/api/pass6/prompts/route.ts",
  "apps/admin-web/app/api/pass6/synthesis-input-bundles/route.ts",
  "apps/admin-web/app/api/pass6/methods/route.ts",
  "apps/admin-web/app/api/pass6/evaluation/route.ts",
  "apps/admin-web/app/api/pass6/pre6c-gates/route.ts",
  "apps/admin-web/app/api/pass6/interfaces/route.ts",
  "apps/admin-web/app/api/pass6/packages/route.ts",
  "apps/admin-web/app/api/pass6/packages/[outputId]/visuals/route.ts",
  "apps/admin-web/app/api/pass6/copilot/route.ts",
  "apps/admin-web/app/api/pass6/pass7-candidates/route.ts",
];

for (const routePath of apiRoutes) {
  assert.equal(existsSync(routePath), true, `${routePath} must exist`);
}

const nextPass = readFileSync("handoff/NEXT_PASS.md", "utf8");
assert.match(nextPass, /Pass 6 is archived\/accepted pending operator acceptance of this Block 20 proof/i);
assert.match(nextPass, /Pass 7 is not started by Block 20/i);
assert.match(nextPass, /next implementation must be explicitly approved by the operator/i);

const archivePath = "handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md";
assert.equal(existsSync(archivePath), true, "Pass 6 archive reference must exist");
const archive = readFileSync(archivePath, "utf8");
for (const blockNumber of Array.from({ length: 21 }, (_, index) => index)) {
  assert.match(archive, new RegExp(`Block ${blockNumber}\\b`), `archive must mention Block ${blockNumber}`);
}

const trackedFiles = execSync("git ls-files", { encoding: "utf8" }).split("\n");
const forbiddenTrackedPatterns = [
  ".env.local",
  "OPENAI_API_KEY=",
  "GOOGLE_API_KEY=",
  "TELEGRAM_BOT_TOKEN=",
];
for (const pattern of forbiddenTrackedPatterns) {
  assert.equal(
    trackedFiles.some((file) => file.includes(pattern)),
    false,
    `tracked files must not include secret-like path or token marker ${pattern}`,
  );
}

console.log("Pass 6 Block 20 full live closure proof passed.");
