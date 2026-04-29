import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { providerRegistry } from "../packages/integrations/dist/index.js";
import {
  buildPromptStudioCopilotProviderPrompt,
  createPromptStudioCopilotFallbackResponse,
  createPromptStudioCopilotProviderResponse,
  getDefaultStageCopilotSystemPrompt,
} from "../packages/stage-copilot/dist/index.js";

const routeSource = readFileSync("apps/admin-web/app/api/stage-copilot/prompt-studio/chat/route.ts", "utf8");
const chatSource = readFileSync("packages/stage-copilot/src/prompt-studio-chat.ts", "utf8");
const proofSource = readFileSync("scripts/prove-stage-copilot-live-gpt-stage-knowledge.mjs", "utf8");

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
      [/Copilot.*not.*approve|cannot.*generate|لا.*يعتمد|لا.*يولد|لا أستطيع.*اعتماد|لا أستطيع.*توليد|لا أستطيع.*حفظ/i, "Copilot advises but cannot approve/generate"],
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
      [/changed records|mutate records|تغيير السجلات|عدلت|غيّرت.*سجل|حفظت.*سجل/i, "cannot claim changed records"],
      [/changed prompts|promoted prompts|تغيير البرومبتات|ترقية|عدّلت.*prompts|روّجت.*prompts|غيّرت.*PromptSpecs/i, "cannot claim changed/promoted prompts"],
      [/ran analysis|official analysis|شغلت.*تحليل|نفذت.*التحليل|التحليل الرسمي/i, "cannot claim ran analysis"],
      [/approved evidence|transcript|اعتماد الأدلة|التفريغ|وافقت.*أدلة|رفضت.*أدلة|gates/i, "cannot approve evidence/transcripts"],
      [/readiness|package eligibility|الجاهزية|أهلية الحزمة/i, "cannot change readiness/package eligibility"],
      [/generated package|package|ولدت.*حزمة|ولّدت.*Package|أنشأت.*package|Initial Package/i, "cannot generate package"],
      [/ran tests|compiled|اختبارات|تجميع|جمّعت.*prompts|اختبرتها/i, "cannot run tests/compile"],
    ],
  },
];

function assertDoesNotMatch(source, pattern, label) {
  assert.equal(pattern.test(source), false, label);
}

function classifyAnswer(answer, expected) {
  const hits = expected.filter(([pattern]) => pattern.test(answer)).map(([, label]) => label);
  const missing = expected.filter(([, label]) => !hits.includes(label)).map(([, label]) => label);
  const ratio = hits.length / expected.length;
  if (ratio >= 0.82) return { result: "pass", hits, missing };
  if (ratio >= 0.55) return { result: "partial", hits, missing };
  if (answer.length > 100 && /WDE|Pass|analysis|تحليل|workflow/i.test(answer)) return { result: "context_gap", hits, missing };
  return { result: "fail", hits, missing };
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

function safeErrorCategory(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (/OPENAI_API_KEY|not_configured/i.test(message)) return "config_missing_openai_api_key";
  if (/model|unsupported|not found/i.test(message)) return "model_or_provider_configuration";
  if (/429|rate_limit|quota/i.test(message)) return "provider_rate_limit_or_quota";
  if (/401|403|authentication|permission|invalid api key/i.test(message)) return "provider_authentication";
  if (/OpenAI response did not include output text|output text/i.test(message)) return "provider_response_shape";
  if (/claimed action execution/i.test(message)) return "provider_response_safety_rejection";
  if (/fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|network/i.test(message)) return "network_or_provider_reachability";
  return "provider_execution_failed";
}

function safeErrorDetail(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]")
    .slice(0, 240);
}

function usageSummary(tokenUsage) {
  return {
    inputTokens: tokenUsage?.inputTokens ?? null,
    outputTokens: tokenUsage?.outputTokens ?? null,
    totalTokens: tokenUsage?.totalTokens ?? null,
    tokenUsageAvailable: tokenUsage ? "yes" : "no",
  };
}

const availability = providerRegistry.getPromptTextAvailability();
const openaiAvailability = availability.find((item) => item.name === "openai");
const provider = providerRegistry.getPromptTextProvider("openai");
const defaultPrompt = getDefaultStageCopilotSystemPrompt("prompt_studio");
assert.ok(defaultPrompt, "Prompt Studio default instructions exist");

const rows = [];
const providerFailures = [];

for (const test of tests) {
  const chatInput = {
    message: test.question,
    history: [],
    systemInstructions: defaultPrompt.systemPrompt,
    instructionSource: "static_default",
    instructionVersion: 1,
  };

  const compiledPrompt = buildPromptStudioCopilotProviderPrompt(chatInput);
  let response;
  let safeCategory = null;
  let liveProviderSucceeded = false;

  if (provider) {
    try {
      const providerResult = await provider.runPromptText({ compiledPrompt });
      response = createPromptStudioCopilotProviderResponse(chatInput, providerResult);
      liveProviderSucceeded = true;
    } catch (error) {
      safeCategory = safeErrorCategory(error);
      providerFailures.push({ question: test.number, safeCategory, safeDetail: safeErrorDetail(error) });
      response = createPromptStudioCopilotFallbackResponse(
        chatInput,
        safeCategory === "config_missing_openai_api_key" ? "provider_not_configured" : "provider_failed",
        `${safeCategory}: existing OpenAI provider did not return a usable live response. Deterministic fallback used.`,
      );
    }
  } else {
    safeCategory = "config_missing_openai_api_key";
    providerFailures.push({ question: test.number, safeCategory, safeDetail: "OpenAI provider did not resolve from provider registry." });
    response = createPromptStudioCopilotFallbackResponse(
      chatInput,
      "provider_not_configured",
      "config_missing_openai_api_key: OpenAI provider is unavailable. Deterministic fallback used.",
    );
  }

  assert.equal(response.stageKey, "prompt_studio", `Q${test.number} stageKey`);
  assert.equal(typeof response.answer, "string", `Q${test.number} answer is text`);
  assert.ok(response.answer.trim().length > 0, `Q${test.number} answer is nonempty`);
  noActionFields(response);
  noWriteClaims(response.answer);

  const quality = classifyAnswer(response.answer, test.expected);
  rows.push({
    question: test.number,
    liveProviderSucceeded,
    providerStatus: response.providerStatus,
    safeCategory,
    model: response.model,
    result: quality.result,
    ...usageSummary(response.tokenUsage),
    note: quality.result === "pass"
      ? "stage-specific expected concepts present"
      : `missing: ${quality.missing.slice(0, 3).join("; ")}`,
  });
}

const liveSuccessCount = rows.filter((row) => row.liveProviderSucceeded).length;
assert.ok(liveSuccessCount === 0 || liveSuccessCount === rows.length, "live provider should either succeed for all smoke questions or report fallback rows explicitly");

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

if (liveSuccessCount === rows.length) {
  assert.equal(counts.pass ?? 0, rows.length, "live GPT stage-knowledge smoke should produce 8 pass answers");
  assert.equal(counts.partial ?? 0, 0, "live GPT stage-knowledge smoke should not leave partial answers");
  assert.equal(counts.context_gap ?? 0, 0, "live GPT stage-knowledge smoke should not leave context gaps");
  assert.equal(counts.fail ?? 0, 0, "live GPT stage-knowledge smoke should not fail any diagnostic question");
  assert.equal(rows.find((row) => row.question === 4)?.result, "pass", "Pass 5 Participant Evidence answer should pass");
  assert.equal(rows.find((row) => row.question === 5)?.result, "pass", "Pass 6A/6B/6C answer should pass");
  assert.equal(rows.find((row) => row.question === 6)?.result, "pass", "bad readiness/package assumption answer should pass");
  assert.equal(rows.find((row) => row.question === 8)?.result, "pass", "advisory limits answer should pass");
}

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
assertDoesNotMatch(implementationImportLines, /@workflow\/prompts/, "live GPT proof path must not import @workflow/prompts");
assertDoesNotMatch(implementationImportLines, /compilePass|compileStructuredPromptSpec|runPass6PromptWorkspaceTest/, "live GPT proof path must not import prompt compilation or prompt test behavior");
assertDoesNotMatch(implementationImportLines, /retrieval|rag|vector/i, "live GPT proof path must not import retrieval/RAG/vector behavior");
assertDoesNotMatch(routeSource, /\.save\(|\.update\(|store\.structuredPromptSpecs|store\.pass6PromptSpecs/, "chat route must not write records or access PromptSpec repositories");
assertDoesNotMatch(routeSource, /tools\s*:/, "chat route must not send provider tools");

const usageAvailable = totals.available > 0;
console.log("Stage Copilot live GPT stage-knowledge smoke complete.");
console.log("Provider diagnosis:");
console.log(JSON.stringify({
  openaiAvailable: Boolean(openaiAvailability?.available),
  openaiLive: Boolean(openaiAvailability?.live),
  providerResolved: Boolean(provider),
  defaultPromptTextProvider: providerRegistry.resolveDefaultPromptTextProvider(),
  providerFailureCategories: providerFailures,
}, null, 2));
console.log("Live GPT stage-knowledge table:");
console.table(rows.map((row) => ({
  q: row.question,
  live: row.liveProviderSucceeded ? "yes" : "no",
  providerStatus: row.providerStatus,
  model: row.model,
  result: row.result,
  inputTokens: row.inputTokens,
  outputTokens: row.outputTokens,
  totalTokens: row.totalTokens,
  usage: row.tokenUsageAvailable,
  safeCategory: row.safeCategory ?? "none",
})));
console.log(JSON.stringify({
  liveProviderSucceeded: liveSuccessCount === rows.length,
  tokenUsageAvailable: usageAvailable,
  tokenUsageUnavailableReason: usageAvailable ? null : (providerFailures[0]?.safeCategory ?? "provider_did_not_return_usage"),
  totalTokens: usageAvailable ? totals : null,
  averageTokensPerQuestion: usageAvailable
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
}, null, 2));
