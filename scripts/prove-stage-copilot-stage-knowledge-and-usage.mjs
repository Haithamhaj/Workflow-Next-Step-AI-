import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { providerRegistry } from "../packages/integrations/dist/index.js";
import {
  WDE_ANALYSIS_CORRECTNESS_RULES,
  WDE_GOOD_BAD_ANALYSIS_EXAMPLES,
  buildPromptStudioCopilotProviderPrompt,
  createPromptStudioCopilotContextEnvelope,
  createPromptStudioCopilotFallbackResponse,
  createPromptStudioCopilotProviderResponse,
  getDefaultStageCopilotSystemPrompt,
  listWdeStageSystemKnowledgeEntries,
  summarizeWdeStageSystemKnowledgeForPromptStudio,
} from "../packages/stage-copilot/dist/index.js";

const routeSource = readFileSync("apps/admin-web/app/api/stage-copilot/prompt-studio/chat/route.ts", "utf8");
const chatSource = readFileSync("packages/stage-copilot/src/prompt-studio-chat.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-stage-knowledge-and-usage.mjs", "utf8");

const tests = [
  {
    number: 1,
    question: "اشرح Pass 2 في WDE: ما هدفه، ما أهم مخرجاته، وما الذي لا يجب أن يفعله؟",
    expected: [
      [/sources?\s*\/?\s*context|مصادر|السياق/i, "Sources / Context"],
      [/source registration|تسجيل/i, "source registration"],
      [/source[- ]?role|role suggestion|source[- ]?scope|scope suggestion|دور المصدر|نطاق/i, "source-role/source-scope suggestions"],
      [/structured context|سياق منظم/i, "structured context"],
      [/pre[- ]?hierarchy|قبل.*هيكل|مراجعة/i, "final pre-hierarchy review"],
      [/no hierarchy|not.*hierarchy|لا.*هيكل/i, "no hierarchy work"],
      [/no targeting|not.*targeting|لا.*استهداف|لا.*اختيار/i, "no targeting work"],
      [/no synthesis|not.*synthesis|لا.*توليف/i, "no synthesis work"],
      [/no package|not.*package|لا.*حزمة/i, "no package work"],
      [/Capability.*Analysis.*PromptSpecs|برومبتات التحليل|PromptSpecs/i, "Capability PromptSpecs separate"],
    ],
  },
  {
    number: 2,
    question: "اشرح Pass 3: ما معنى hierarchy approval؟ وهل يعني أن workflow truth تم إثباته؟",
    expected: [
      [/hierarchy intake|hierarchy draft|draft|correction|approval|تصحيح|اعتماد/i, "hierarchy intake/draft/correction/approval"],
      [/approved hierarchy snapshot|snapshot|لقطة/i, "approved hierarchy snapshot"],
      [/source[- ]?to[- ]?hierarchy|triage|candidate|signal|إشارة|مرشح/i, "source-to-hierarchy triage candidate/signal"],
      [/structural|structure|not.*workflow truth|لا.*حقيقة|ليست.*حقيقة/i, "structural not workflow truth"],
      [/no participant targeting|not.*targeting|لا.*استهداف|لا.*مشاركين/i, "no participant targeting"],
      [/no synthesis|not.*synthesis|لا.*توليف/i, "no synthesis"],
      [/no package|not.*package|لا.*حزمة/i, "no package generation"],
    ],
  },
  {
    number: 3,
    question: "اشرح Pass 4: كيف يتم التفكير في targeting؟ وما الفرق بين targeting signal و workflow evidence؟",
    expected: [
      [/participant targeting|rollout planning|استهداف|اختيار المشاركين/i, "participant targeting / rollout planning"],
      [/candidate|contact readiness|rollout plan|مرشح|جاهزية التواصل|خطة/i, "candidates/contact readiness/rollout plan"],
      [/question[- ]?hint|seed|بذور|إشارات الأسئلة/i, "question-hint seeds"],
      [/planning support|signal|not.*workflow truth|ليست.*حقيقة|إشارة/i, "signals are planning support not workflow truth"],
      [/no participant sessions|not.*sessions|لا.*جلسات/i, "no participant sessions"],
      [/no narrative evidence|not.*evidence yet|لا.*أدلة/i, "no narrative evidence yet"],
    ],
  },
  {
    number: 4,
    question: "اشرح Pass 5: ما المقصود narrative-first participant evidence؟ وما هي حدود evidence extraction والclarification؟",
    expected: [
      [/participant sessions|جلسات المشاركين/i, "participant sessions"],
      [/raw evidence|preservation|الحفاظ|الأدلة الخام/i, "raw evidence preservation"],
      [/transcript trust|trust gate|ثقة التفريغ|بوابة/i, "transcript trust gate"],
      [/first[- ]?pass extraction|استخراج/i, "first-pass extraction"],
      [/evidence anchors|anchor|مرجع|مرساة/i, "evidence anchors"],
      [/clarification candidate|clarification|توضيح/i, "clarification candidates"],
      [/answer recheck|recheck|إعادة فحص/i, "answer recheck"],
      [/boundary signal|dispute|defect|no[- ]?drop|إشارة حدود|نزاع|خلل/i, "boundary signals/disputes/defects/no-drop"],
      [/not final workflow truth|ليست.*حقيقة.*نهائية/i, "not final workflow truth"],
      [/no synthesis|not.*synthesis|لا.*توليف/i, "no synthesis"],
      [/no evaluation|not.*evaluation|لا.*تقييم/i, "no evaluation"],
      [/no package|not.*package|لا.*حزمة/i, "no package generation"],
    ],
  },
  {
    number: 5,
    question: "اشرح Pass 6A و6B و6C. ماذا يدخل كل واحد؟ وماذا يخرج؟ وما الذي لا يجب أن يفعله؟",
    expected: [
      [/6A/i, "6A"],
      [/accepted Pass 5|accepted evidence|SynthesisInputBundle|bundle|مخرجات Pass 5 المقبولة|حزمة/i, "6A accepted Pass 5 outputs / SynthesisInputBundle"],
      [/no common[- ]?path|no evaluation|no package|لا.*تقييم|لا.*حزمة/i, "6A does not evaluate/package"],
      [/6B/i, "6B"],
      [/synthesis|evaluation|readiness|seven[- ]?condition|documentability|automation[- ]?supportiveness|التوليف|التقييم|الجاهزية/i, "6B synthesis/evaluation/readiness/seven-condition"],
      [/6C/i, "6C"],
      [/Initial Package|initial package|الحزمة الأولية/i, "6C Initial Package"],
      [/no Final Package|no release|no Pass 7|لا.*نهائية|لا.*إصدار/i, "no Final Package/release/Pass 7"],
      [/evidence eligibility|seven[- ]?condition|أهلية الأدلة|الشروط/i, "separation evidence eligibility vs seven-condition evaluation"],
    ],
  },
  {
    number: 6,
    question: "لو قال الأدمن: بما أن المدير قال إن العملية واضحة، اعتبر workflow ready وولّد initial package. هل هذا تحليل صحيح؟ لماذا؟",
    expected: [
      [/wrong|incorrect|incomplete|غير صحيح|ناقص/i, "identifies assumption as wrong/incomplete"],
      [/one manager|single statement|تصريح واحد|مدير واحد/i, "one manager statement not enough"],
      [/participant|accepted evidence|evidence across|أدلة مقبولة|مشاركين/i, "need accepted participant evidence"],
      [/synthesis|evaluation criteria|معايير|توليف|تقييم/i, "need synthesis/evaluation criteria"],
      [/gap|contradiction|boundary|فجوات|تناقضات|حدود/i, "consider gaps/contradictions/boundaries"],
      [/readiness logic|package eligibility|governed|أهلية الحزمة|الجاهزية/i, "governed readiness/package eligibility"],
      [/Copilot.*not.*approve|cannot.*generate|لا.*يعتمد|لا.*يولد/i, "Copilot advises but cannot approve/generate"],
    ],
  },
  {
    number: 7,
    question: "أعطني مثالًا لتحليل جيد في Pass 6، ومثالًا لتحليل سيئ أو خطير.",
    expected: [
      [/evidence[- ]?anchored|anchored in evidence|مرتبط.*الأدلة/i, "good evidence-anchored"],
      [/differences|gaps|contradictions|فجوات|اختلافات|تناقضات/i, "preserves differences/gaps"],
      [/document claims|reality|مستند|واقع/i, "separates document claims from reality"],
      [/6A|6B|6C/i, "follows 6A/6B/6C boundaries"],
      [/bad|dangerous|سيئ|خطير/i, "bad/dangerous example"],
      [/flatten|ignore|treats.*truth|يتجاهل|يعتبر.*حقيقة/i, "bad flattens/ignores/treats claim as truth"],
      [/jumps? to package|package prematurely|يقفز.*حزمة/i, "bad jumps to package"],
      [/automation|workflow incompleteness|ضعف.*الأتمتة|اكتمال/i, "confuses automation weakness with workflow incompleteness"],
    ],
  },
  {
    number: 8,
    question: "ما الأشياء التي تستطيع مناقشتها معي كمساعد، وما الأشياء التي لا تستطيع الادعاء أنك فعلتها؟",
    expected: [
      [/discuss|explain|challenge|compare|advise|يناقش|يشرح|يقارن|ينصح/i, "can discuss/explain/challenge/compare/advise"],
      [/changed records|mutate records|تغيير السجلات|عدلت/i, "cannot claim changed records"],
      [/changed prompts|promoted prompts|تغيير البرومبتات|ترقية/i, "cannot claim changed/promoted prompts"],
      [/ran analysis|official analysis|شغلت.*تحليل|التحليل الرسمي/i, "cannot claim ran analysis"],
      [/approved evidence|transcript|اعتماد الأدلة|التفريغ/i, "cannot approve evidence/transcripts"],
      [/readiness|package eligibility|الجاهزية|أهلية الحزمة/i, "cannot change readiness/package eligibility"],
      [/generated package|package|ولدت.*حزمة/i, "cannot generate package"],
      [/ran tests|compiled|اختبارات|تجميع/i, "cannot run tests/compile"],
    ],
  },
];

function assertDoesNotMatch(source, pattern, label) {
  assert.equal(pattern.test(source), false, label);
}

function noActionFields(response) {
  for (const field of [
    "actions",
    "toolCalls",
    "tool_calls",
    "routedActions",
    "executedActions",
    "mutations",
    "writes",
    "recordsChanged",
    "promptChanges",
    "readinessChanged",
    "packageEligibilityChanged",
  ]) {
    assert.equal(Object.hasOwn(response, field), false, `response must not contain ${field}`);
  }
}

function noWriteClaims(answer) {
  assert.doesNotMatch(
    answer,
    /\b(I|we)\s+(changed|saved|promoted|compiled|tested|executed|mutated|updated|approved|rejected|generated)\b/i,
    "answer must not claim it changed/saved/promoted/compiled/tested/executed/mutated/approved/generated anything",
  );
}

function classifyAnswer(answer, expected) {
  const hits = expected.filter(([pattern]) => pattern.test(answer)).map(([, label]) => label);
  const ratio = hits.length / expected.length;
  if (ratio >= 0.82) return { result: "pass", hits, missing: expected.filter(([, label]) => !hits.includes(label)).map(([, label]) => label) };
  if (ratio >= 0.55) return { result: "partial", hits, missing: expected.filter(([, label]) => !hits.includes(label)).map(([, label]) => label) };
  if (answer.length > 100 && /WDE|Pass|analysis|تحليل|workflow/i.test(answer)) {
    return { result: "context_gap", hits, missing: expected.filter(([, label]) => !hits.includes(label)).map(([, label]) => label) };
  }
  return { result: "fail", hits, missing: expected.filter(([, label]) => !hits.includes(label)).map(([, label]) => label) };
}

function usageSummary(tokenUsage) {
  return {
    inputTokens: tokenUsage?.inputTokens ?? null,
    outputTokens: tokenUsage?.outputTokens ?? null,
    totalTokens: tokenUsage?.totalTokens ?? null,
    tokenUsageAvailable: tokenUsage ? "yes" : "no",
  };
}

const defaultPrompt = getDefaultStageCopilotSystemPrompt("prompt_studio");
assert.ok(defaultPrompt, "Prompt Studio default instructions exist");

const knowledgeEntries = listWdeStageSystemKnowledgeEntries();
const knowledgeKeys = new Set(knowledgeEntries.map((entry) => entry.key));
for (const key of [
  "pass2_sources_context",
  "pass3_hierarchy",
  "pass4_targeting",
  "pass5_participant_evidence",
  "pass6a_synthesis_input",
  "pass6b_synthesis_evaluation_readiness",
  "pass6c_initial_package",
]) {
  assert.ok(knowledgeKeys.has(key), `WDE Stage System Knowledge pack contains ${key}`);
}
assert.ok(WDE_ANALYSIS_CORRECTNESS_RULES.length >= 8, "WDE analysis correctness rules exist");
assert.ok(WDE_GOOD_BAD_ANALYSIS_EXAMPLES.length >= 3, "WDE good/bad analysis examples exist");
assert.ok(
  WDE_ANALYSIS_CORRECTNESS_RULES.some((rule) => /advisory|cannot run tools|mutate records|readiness/i.test(rule.guidance)),
  "analysis correctness rules state Copilot capability awareness is advisory and non-executable",
);
for (const requiredExample of [
  "good_pass6_evidence_anchored",
  "bad_pass6_flattened_truth",
  "dangerous_readiness_assumption",
  "bad_evidence_promotion",
  "bad_document_as_truth",
  "good_pass5_to_6a_handoff",
]) {
  assert.ok(
    WDE_GOOD_BAD_ANALYSIS_EXAMPLES.some((example) => example.exampleId === requiredExample),
    `WDE examples include ${requiredExample}`,
  );
}
assert.match(
  summarizeWdeStageSystemKnowledgeForPromptStudio(),
  /Pass 2[\s\S]*Pass 3[\s\S]*Pass 4[\s\S]*Pass 5[\s\S]*Pass 6A[\s\S]*Pass 6B[\s\S]*Pass 6C/,
  "WDE stage system knowledge summary covers Pass 2 through Pass 6C",
);
assert.match(
  summarizeWdeStageSystemKnowledgeForPromptStudio(),
  /Internal capabilities known but not executable by Copilot/,
  "Prompt Studio compact summary states internal capability knowledge is not execution authority",
);

const operationalCoverageCategories = [
  "purpose",
  "goal",
  "inputs",
  "outputs",
  "stepByStepOperations",
  "contractsAndRecords",
  "internalSystemCapabilities",
  "boundaries",
  "mustNotDo",
  "wrongInterpretationExamples",
  "handoffToNextStage",
];

const criticalOperationalCategories = [
  "internalSystemCapabilities",
  "boundaries",
  "mustNotDo",
  "wrongInterpretationExamples",
];

function categoryPresent(entry, category) {
  const value = entry[category];
  if (Array.isArray(value)) return value.length > 0 && value.every((item) => typeof item === "string" && item.trim().length > 0);
  return typeof value === "string" && value.trim().length > 0;
}

const coverageRows = knowledgeEntries.map((entry) => {
  const missing = operationalCoverageCategories.filter((category) => !categoryPresent(entry, category));
  for (const criticalCategory of criticalOperationalCategories) {
    assert.ok(
      !missing.includes(criticalCategory),
      `${entry.label} must not miss critical operational category ${criticalCategory}`,
    );
  }
  assert.ok(
    entry.internalSystemCapabilities.some((capability) => capability.trim().length > 0),
    `${entry.label} declares internal system capabilities`,
  );
  assert.match(
    entry.boundaries.join(" "),
    /does not grant Copilot execution authority|not grant Copilot execution authority|knowledge.*does not grant/i,
    `${entry.label} boundary states capability knowledge does not grant execution authority`,
  );
  assert.ok(
    missing.length <= 1,
    `${entry.label} must score at least 10/11 operational categories; missing: ${missing.join(", ") || "none"}`,
  );
  return {
    stage: entry.label,
    score: `${operationalCoverageCategories.length - missing.length}/${operationalCoverageCategories.length}`,
    missing: missing.join(", ") || "none",
  };
});

const promptStudioEnvelope = createPromptStudioCopilotContextEnvelope();
const promptStudioKnowledgeRefIds = promptStudioEnvelope.systemKnowledgeRefs.map((ref) => ref.refId);
assert.ok(
  promptStudioKnowledgeRefIds.some((refId) => refId === "wde_stage_system_knowledge:pass2_sources_context"),
  "Prompt Studio context includes WDE stage-knowledge refs",
);

const provider = providerRegistry.getPromptTextProvider("openai");
const rows = [];
const contextGaps = new Map();

for (const test of tests) {
  const chatInput = {
    message: test.question,
    history: [],
    systemInstructions: defaultPrompt.systemPrompt,
    instructionSource: "static_default",
    instructionVersion: 1,
  };

  const assembledPrompt = buildPromptStudioCopilotProviderPrompt(chatInput);
  assert.match(
    assembledPrompt,
    /WDE Stage System Knowledge \(Read-Only Static Pack\)[\s\S]*Pass 2[\s\S]*Pass 6C/,
    `Q${test.number} provider prompt includes WDE stage knowledge context`,
  );

  let response;
  if (provider) {
    try {
      const providerResult = await provider.runPromptText({ compiledPrompt: assembledPrompt });
      response = createPromptStudioCopilotProviderResponse(chatInput, providerResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("not_configured") || message.includes("OPENAI_API_KEY")
        ? "provider_not_configured"
        : "provider_failed";
      response = createPromptStudioCopilotFallbackResponse(
        chatInput,
        status,
        `${status}: existing OpenAI text provider did not return a usable stage-knowledge response. Deterministic fallback used.`,
      );
    }
  } else {
    response = createPromptStudioCopilotFallbackResponse(
      chatInput,
      "provider_not_configured",
      "provider_not_configured: existing OpenAI text provider is unavailable. Deterministic fallback used.",
    );
  }

  assert.equal(response.stageKey, "prompt_studio", `Q${test.number} stageKey`);
  assert.equal(typeof response.answer, "string", `Q${test.number} answer is text`);
  assert.ok(response.answer.trim().length > 0, `Q${test.number} answer is nonempty`);
  assert.equal(typeof response.providerStatus, "string", `Q${test.number} providerStatus`);
  assert.equal(typeof response.model, "string", `Q${test.number} model`);
  assert.equal(response.contextSummary.source, "prompt_studio_static_context", `Q${test.number} static context source`);
  assert.equal(response.contextSummary.readOnly, true, `Q${test.number} context readOnly`);
  assert.ok("tokenUsage" in response, `Q${test.number} tokenUsage field present`);
  assert.ok("tokenUsageUnavailable" in response, `Q${test.number} tokenUsageUnavailable field present`);
  if (response.tokenUsage === null) assert.equal(response.tokenUsageUnavailable, true, `Q${test.number} null usage marked unavailable`);
  if (response.tokenUsage) assert.equal(response.tokenUsageUnavailable, false, `Q${test.number} usage marked available`);
  noActionFields(response);
  noWriteClaims(response.answer);

  const quality = classifyAnswer(response.answer, test.expected);
  if (quality.result === "context_gap") {
    contextGaps.set(test.number, quality.missing);
  }

  rows.push({
    question: test.number,
    providerStatus: response.providerStatus,
    model: response.model,
    result: quality.result,
    ...usageSummary(response.tokenUsage),
    note: quality.result === "pass"
      ? "stage-specific expected concepts present"
      : quality.result === "partial"
        ? `missing: ${quality.missing.slice(0, 3).join("; ")}`
        : quality.result === "context_gap"
          ? `context gap: ${quality.missing.slice(0, 3).join("; ")}`
          : `failed: ${quality.missing.slice(0, 3).join("; ")}`,
  });
}

const totals = rows.reduce((acc, row) => {
  if (typeof row.inputTokens === "number") acc.inputTokens += row.inputTokens;
  if (typeof row.outputTokens === "number") acc.outputTokens += row.outputTokens;
  if (typeof row.totalTokens === "number") acc.totalTokens += row.totalTokens;
  if (row.tokenUsageAvailable === "yes") acc.available += 1;
  return acc;
}, { inputTokens: 0, outputTokens: 0, totalTokens: 0, available: 0 });

const counts = rows.reduce((acc, row) => {
  acc[row.result] = (acc[row.result] ?? 0) + 1;
  return acc;
}, {});

function resultFor(questionNumber) {
  const row = rows.find((item) => item.question === questionNumber);
  assert.ok(row, `Q${questionNumber} result exists`);
  return row.result;
}

function assertPassOrPartial(questionNumber, label) {
  assert.ok(
    ["pass", "partial"].includes(resultFor(questionNumber)),
    `${label} must be pass or partial after WDE Stage System Knowledge pack integration`,
  );
}

function assertPass(questionNumber, label) {
  assert.equal(
    resultFor(questionNumber),
    "pass",
    `${label} must pass after WDE Stage System Knowledge pack integration`,
  );
}

assertPassOrPartial(1, "Pass 2 knowledge answer");
assertPassOrPartial(2, "Pass 3 knowledge answer");
assertPassOrPartial(3, "Pass 4 knowledge answer");
assertPassOrPartial(4, "Pass 5 knowledge answer");
assertPassOrPartial(5, "Pass 6A/6B/6C knowledge answer");
assertPass(6, "Bad readiness/package assumption answer");
assertPassOrPartial(7, "Good/bad analysis answer");
assertPass(8, "Advisory limits answer");

function importAndExportLines(source) {
  return source
    .split("\n")
    .filter((line) => /^\s*(import|export)\s/.test(line))
    .join("\n");
}

const implementationImportLines = [
  importAndExportLines(routeSource),
  importAndExportLines(chatSource),
  importAndExportLines(proofSource),
].join("\n");
assertDoesNotMatch(implementationImportLines, /@workflow\/prompts/, "stage-knowledge proof path must not import @workflow/prompts");
assertDoesNotMatch(implementationImportLines, /compilePass|compileStructuredPromptSpec|runPass6PromptWorkspaceTest/, "stage-knowledge proof path must not import prompt compilation or prompt test behavior");
assertDoesNotMatch(implementationImportLines, /retrieval|rag|vector/i, "stage-knowledge proof path must not import retrieval/RAG/vector behavior");
assertDoesNotMatch(routeSource, /\.save\(|\.update\(|store\.structuredPromptSpecs|store\.pass6PromptSpecs/, "chat route must not write records or access PromptSpec repositories");
assertDoesNotMatch(routeSource, /tools\s*:/, "chat route must not send provider tools");

const usageAvailable = totals.available > 0;

console.log("Stage Copilot stage-knowledge and token usage proof complete.");
console.log("Operational coverage table:");
console.table(coverageRows);
console.log("Summary table:");
console.table(rows.map((row) => ({
  q: row.question,
  providerStatus: row.providerStatus,
  model: row.model,
  result: row.result,
  inputTokens: row.inputTokens,
  outputTokens: row.outputTokens,
  totalTokens: row.totalTokens,
  usage: row.tokenUsageAvailable,
  note: row.note,
})));
console.log(JSON.stringify({
  providerConfigured: Boolean(provider),
  tokenUsageAvailable: usageAvailable,
  totalTokens: usageAvailable ? totals : null,
  averageTokensPerAnswer: usageAvailable
    ? {
        inputTokens: Math.round(totals.inputTokens / totals.available),
        outputTokens: Math.round(totals.outputTokens / totals.available),
        totalTokens: Math.round(totals.totalTokens / totals.available),
      }
    : null,
  stageKnowledgeScore: {
    pass: counts.pass ?? 0,
    partial: counts.partial ?? 0,
    fail: counts.fail ?? 0,
    context_gap: counts.context_gap ?? 0,
    total: rows.length,
  },
  operationalCoverage: coverageRows,
  contextGaps: Object.fromEntries(contextGaps),
}, null, 2));
