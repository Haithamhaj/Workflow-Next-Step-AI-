export type WdeStageSystemKnowledgeKey =
  | "pass2_sources_context"
  | "pass3_hierarchy"
  | "pass4_targeting"
  | "pass5_participant_evidence"
  | "pass6a_synthesis_input"
  | "pass6b_synthesis_evaluation_readiness"
  | "pass6c_initial_package";

export interface WdeStageSystemKnowledgeEntry {
  key: WdeStageSystemKnowledgeKey;
  label: string;
  purpose: string;
  majorInputs: readonly string[];
  majorOutputs: readonly string[];
  coreConcepts: readonly string[];
  mustNotDo: readonly string[];
  sourceRefs: readonly string[];
}

export interface WdeAnalysisCorrectnessRule {
  ruleId: string;
  label: string;
  guidance: string;
}

export interface WdeAnalysisExample {
  exampleId: string;
  label: string;
  kind: "good" | "bad" | "dangerous_assumption";
  example: string;
  why: string;
}

function freezeArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items]);
}

function freezeEntry(entry: WdeStageSystemKnowledgeEntry): WdeStageSystemKnowledgeEntry {
  return Object.freeze({
    ...entry,
    majorInputs: freezeArray(entry.majorInputs),
    majorOutputs: freezeArray(entry.majorOutputs),
    coreConcepts: freezeArray(entry.coreConcepts),
    mustNotDo: freezeArray(entry.mustNotDo),
    sourceRefs: freezeArray(entry.sourceRefs),
  });
}

export const WDE_STAGE_SYSTEM_KNOWLEDGE_PACK: readonly WdeStageSystemKnowledgeEntry[] = Object.freeze([
  freezeEntry({
    key: "pass2_sources_context",
    label: "Pass 2 - Sources / Context",
    purpose:
      "Build the intake and context-framing layer before hierarchy, targeting, participant evidence, synthesis, evaluation, or package work.",
    majorInputs: [
      "company and department intake",
      "documents, websites, manual notes, images, and audio sources",
      "admin-selected primary department and use case",
      "provider-backed crawl, OCR, STT, and extraction outputs where applicable",
    ],
    majorOutputs: [
      "registered sources",
      "source-role and source-scope suggestions",
      "admin source-role decisions or overrides",
      "structured context",
      "batch summary",
      "final pre-hierarchy review",
    ],
    coreConcepts: [
      "source registration",
      "source-role/source-scope suggestions",
      "structured context",
      "traceability between operator inputs, external sources, and AI-structured interpretations",
      "provider/crawl/STT/extraction paths are intake support, not workflow proof",
      "final pre-hierarchy review confirms the intake set, context record, department, use case, and unresolved context risks",
    ],
    mustNotDo: [
      "no hierarchy intake, hierarchy draft, hierarchy correction, or hierarchy approval",
      "no source-to-role or source-to-node linking as workflow proof",
      "no participant targeting or rollout readiness",
      "no participant sessions",
      "no synthesis or evaluation",
      "no package generation",
      "no Capability / Analysis PromptSpec mutation by Stage Copilot Instructions",
    ],
    sourceRefs: [
      "handoff/accepted-baselines/PASS2_INTAKE_CONTEXT_BUILD_SPEC_ARCHIVED.md",
      "handoff/PASS2_LOCAL_PERSISTENCE.md",
    ],
  }),
  freezeEntry({
    key: "pass3_hierarchy",
    label: "Pass 3 - Hierarchy",
    purpose:
      "Create the governed hierarchy grounding layer between accepted intake/context and participant targeting planning.",
    majorInputs: [
      "Pass 2 final pre-hierarchy review",
      "pasted hierarchy text",
      "admin-entered role structure",
      "uploaded org chart or hierarchy document",
      "source-to-hierarchy triage signals",
    ],
    majorOutputs: [
      "hierarchy draft",
      "admin corrections",
      "approved hierarchy snapshot",
      "source-to-hierarchy triage links",
      "hierarchy readiness snapshot toward participant targeting",
    ],
    coreConcepts: [
      "hierarchy intake/draft/correction/approval",
      "approved hierarchy snapshot is the structural artifact for Pass 4",
      "source-to-hierarchy triage is a candidate signal, not workflow truth",
      "admin approval of hierarchy is structural approval only",
      "readiness toward targeting does not perform targeting decisions",
    ],
    mustNotDo: [
      "no final participant selection",
      "no participant targeting execution",
      "no participant rollout",
      "no invitation sending or channel delivery",
      "no participant session creation",
      "no workflow analysis",
      "no synthesis/evaluation",
      "no package generation",
    ],
    sourceRefs: ["handoff/PASS3_HIERARCHY_INTAKE_APPROVAL_BUILD_SPEC.md"],
  }),
  freezeEntry({
    key: "pass4_targeting",
    label: "Pass 4 - Targeting / Rollout Planning",
    purpose:
      "Move from an approved hierarchy snapshot into governed participant targeting and rollout planning without starting outreach or workflow evidence collection.",
    majorInputs: [
      "approved Pass 3 hierarchy snapshot",
      "selected department and use case",
      "hierarchy/source planning signals",
      "person-light mapping and contact metadata where available",
    ],
    majorOutputs: [
      "targeting recommendation packet",
      "participant candidates",
      "contact/channel readiness metadata",
      "rollout plan",
      "question-hint seeds for later Pass 5 use",
      "admin-approved targeting and rollout plan",
    ],
    coreConcepts: [
      "participant targeting / rollout planning",
      "frontline operational participants are often prioritized for ground-level execution evidence",
      "contact readiness checks prepare later outreach but do not send invitations",
      "question-hint seeds are planning support, not participant-facing questions",
      "targeting signals are planning support, not workflow evidence or workflow truth",
    ],
    mustNotDo: [
      "no invitation sending",
      "no channel delivery",
      "no participant response collection",
      "no participant session creation",
      "no participant-facing question preparation",
      "no workflow narrative intake",
      "no synthesis/evaluation",
      "no package generation",
    ],
    sourceRefs: ["handoff/PASS4_TARGETING_ROLLOUT_BUILD_SPEC.md"],
  }),
  freezeEntry({
    key: "pass5_participant_evidence",
    label: "Pass 5 - Participant Evidence",
    purpose:
      "Collect narrative-first participant evidence with raw evidence preservation, trust gates, extraction governance, clarification, and answer recheck.",
    majorInputs: [
      "approved targeting/rollout plan",
      "participant sessions",
      "web or Telegram participant narratives",
      "voice/audio transcripts when trusted",
      "admin-added questions and clarification answers",
    ],
    majorOutputs: [
      "raw evidence",
      "transcript trust gate decisions",
      "first-pass extraction outputs",
      "evidence anchors",
      "clarification candidates",
      "answer recheck records",
      "boundary signals",
      "disputes, defects, unmapped/no-drop content",
      "Pass 6 handoff candidates as candidates only",
    ],
    coreConcepts: [
      "narrative-first participant evidence",
      "participant sessions preserve the participant story before analysis",
      "raw evidence preservation comes before extraction",
      "transcript trust gate controls whether transcript content is eligible",
      "first-pass extraction is participant-level and evidence-anchored",
      "clarification candidates and answer recheck improve evidence quality",
      "boundary signals, disputes, defects, and no-drop routing prevent losing risky material",
      "Pass 5 outputs are not final workflow truth",
    ],
    mustNotDo: [
      "no Pass 6 synthesis/evaluation",
      "no common-path formation",
      "no final workflow reconstruction",
      "no package generation",
      "no automation execution design",
      "no treating participant evidence as final workflow truth before synthesis/evaluation",
    ],
    sourceRefs: [
      "handoff/PASS5_FINAL_ARCHIVE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_CONCEPTUAL_CLOSURE_REFERENCE.md",
    ],
  }),
  freezeEntry({
    key: "pass6a_synthesis_input",
    label: "Pass 6A - SynthesisInputBundle",
    purpose:
      "Prepare and sort accepted Pass 5 outputs into a reviewable SynthesisInputBundle before cross-participant synthesis.",
    majorInputs: [
      "accepted Pass 5 participant-session outputs",
      "trusted evidence",
      "evidence anchors",
      "boundary signals",
      "disputes, defects, unmapped/no-drop material",
      "document/source signals",
      "hierarchy/layer/truth-lens context",
    ],
    majorOutputs: [
      "SynthesisInputBundle",
      "analysis material folder",
      "boundary/role-limit material folder",
      "gap/risk/no-drop material folder",
      "document/source signal material folder",
      "preparation summary",
    ],
    coreConcepts: [
      "accepted Pass 5 outputs are organized, not silently revalidated or rewritten",
      "SynthesisInputBundle is accepted Pass 5 outputs prepared for synthesis",
      "evidence eligibility is separate from seven-condition evaluation",
      "unresolved items, boundary signals, defects, disputes, and unmapped content are preserved",
    ],
    mustNotDo: [
      "no 6B common-path synthesis",
      "no seven-condition evaluation",
      "no readiness decision",
      "no Initial Package generation",
      "no Pass 7 records",
      "no treating synthesis input preparation as final workflow truth",
    ],
    sourceRefs: [
      "handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_CONCEPTUAL_CLOSURE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_TECHNICAL_DECOMPOSITION_LIVE_REFERENCE.md",
    ],
  }),
  freezeEntry({
    key: "pass6b_synthesis_evaluation_readiness",
    label: "Pass 6B - Synthesis / Evaluation / Readiness",
    purpose:
      "Synthesize participant evidence into case-level workflow understanding, interpret differences, evaluate seven conditions, and produce governed readiness routing.",
    majorInputs: [
      "SynthesisInputBundle",
      "analysis material",
      "boundary/role-limit material",
      "gap/risk/no-drop material",
      "document/source signal material",
      "method registry and active analysis policy",
    ],
    majorOutputs: [
      "workflow units and claims",
      "difference interpretation",
      "workflow assembly",
      "claim-basis map",
      "seven-condition assessment",
      "Workflow Readiness Result",
      "methodology / analysis report",
      "pre-6C clarification needs",
    ],
    coreConcepts: [
      "synthesis and evaluation are the first cross-participant reasoning layer",
      "document/source claims are signals, not operational truth by default",
      "workflow documentability differs from automation-supportiveness",
      "automation weakness is not the same as workflow incompleteness",
      "readiness uses governed evidence and analysis policy, not one person's assertion",
    ],
    mustNotDo: [
      "no Initial Package generation",
      "no bypassing admin decision authority on meaningful ambiguity",
      "no collapsing every weak condition into automatic failure",
      "no ignoring contradictions, boundaries, gaps, or unresolved evidence",
      "no Pass 7 mechanics",
    ],
    sourceRefs: [
      "handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_CONCEPTUAL_CLOSURE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_TECHNICAL_DECOMPOSITION_LIVE_REFERENCE.md",
    ],
  }),
  freezeEntry({
    key: "pass6c_initial_package",
    label: "Pass 6C - Initial Package",
    purpose:
      "Generate the governed Initial Workflow Package only when 6B readiness and pre-6C gate conditions allow it.",
    majorInputs: [
      "Workflow Readiness Result",
      "pre-6C gate outcome",
      "approved 6B workflow understanding",
      "package eligibility decision",
      "admin proceed-with-warnings approval when applicable",
    ],
    majorOutputs: [
      "Initial Workflow Package when allowed",
      "Workflow Gap Closure Brief when package is not allowed",
      "client-facing package layer",
      "admin/internal traceability layer",
      "residual gaps and review recommendations",
    ],
    coreConcepts: [
      "Initial Package is not Final Package",
      "package eligibility is readiness/gate governed",
      "client-facing package content stays separate from admin/internal reasoning",
      "no package should be generated when readiness forbids it unless valid proceed-with-warnings approval exists",
      "visual outputs must not own analysis, readiness, or eligibility",
    ],
    mustNotDo: [
      "no Final Package or release behavior",
      "no hidden package generation when readiness is insufficient",
      "no Pass 7 issue actions or mechanics",
      "no changing readiness from package drafting",
      "no treating package text as new evidence",
    ],
    sourceRefs: [
      "handoff/PASS6_SYNTHESIS_EVALUATION_INITIAL_PACKAGE_ARCHIVE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_CONCEPTUAL_CLOSURE_REFERENCE.md",
      "handoff/pass6-source-references/PASS6_TECHNICAL_DECOMPOSITION_LIVE_REFERENCE.md",
    ],
  }),
]);

export const WDE_ANALYSIS_CORRECTNESS_RULES: readonly WdeAnalysisCorrectnessRule[] = Object.freeze([
  Object.freeze({
    ruleId: "document_claims_are_signals",
    label: "Document/source claims are signals.",
    guidance: "Documents, SOPs, policies, and manager claims may guide questions, but they are not operational workflow truth by default.",
  }),
  Object.freeze({
    ruleId: "hierarchy_is_structural",
    label: "Hierarchy approval is structural.",
    guidance: "An approved hierarchy snapshot grounds roles and reporting structure; it does not prove how work actually happens.",
  }),
  Object.freeze({
    ruleId: "targeting_is_planning",
    label: "Targeting signals are planning support.",
    guidance: "Pass 4 targeting signals help decide who to ask; they are not workflow evidence.",
  }),
  Object.freeze({
    ruleId: "participant_evidence_needs_synthesis",
    label: "Participant evidence is not final truth alone.",
    guidance: "Pass 5 evidence remains participant-level until Pass 6 synthesis/evaluation interprets it across sources and layers.",
  }),
  Object.freeze({
    ruleId: "one_manager_statement_insufficient",
    label: "One manager statement is insufficient for readiness.",
    guidance: "Readiness and package eligibility require governed evidence, synthesis, evaluation, gaps, contradictions, and boundary review.",
  }),
  Object.freeze({
    ruleId: "preserve_gaps_and_contradictions",
    label: "Preserve contradictions and gaps.",
    guidance: "Differences, unresolved gaps, boundary signals, disputes, defects, and no-drop material must remain visible instead of being flattened.",
  }),
  Object.freeze({
    ruleId: "documentability_not_automation_supportiveness",
    label: "Documentability differs from automation-supportiveness.",
    guidance: "A workflow can be documentable even when automation support is weak; automation weakness is not workflow incompleteness.",
  }),
  Object.freeze({
    ruleId: "initial_package_not_final_package",
    label: "Initial Package is not Final Package.",
    guidance: "Pass 6C creates an Initial Workflow Package or gap brief under readiness governance; final release belongs later.",
  }),
]);

export const WDE_GOOD_BAD_ANALYSIS_EXAMPLES: readonly WdeAnalysisExample[] = Object.freeze([
  Object.freeze({
    exampleId: "good_pass6_evidence_anchored",
    label: "Good Pass 6 analysis",
    kind: "good",
    example:
      "Good Pass 6 analysis is evidence-anchored, layer-aware, keeps 6A/6B/6C boundaries clear, preserves differences/gaps/contradictions, and separates document claims from operational reality.",
    why:
      "It respects evidence anchors, no-drop preservation, workflow documentability, automation-supportiveness, and governed readiness before package eligibility.",
  }),
  Object.freeze({
    exampleId: "bad_pass6_flattened_truth",
    label: "Bad Pass 6 analysis",
    kind: "bad",
    example:
      "Bad analysis treats an SOP or manager claim as truth, flattens contradictions, ignores unresolved evidence, jumps to package, or confuses automation weakness with workflow incompleteness.",
    why:
      "It loses evidence provenance, bypasses synthesis/evaluation, and can create a false Initial Package basis.",
  }),
  Object.freeze({
    exampleId: "dangerous_readiness_assumption",
    label: "Bad readiness/package assumption",
    kind: "dangerous_assumption",
    example:
      "The manager said the process is clear, so mark workflow ready and generate the Initial Package.",
    why:
      "One manager statement is not enough. Readiness requires accepted participant evidence, synthesis/evaluation criteria, gap and contradiction review, and governed package eligibility.",
  }),
]);

export function listWdeStageSystemKnowledgeEntries(): readonly WdeStageSystemKnowledgeEntry[] {
  return WDE_STAGE_SYSTEM_KNOWLEDGE_PACK;
}

export function getWdeStageSystemKnowledgeEntry(
  key: WdeStageSystemKnowledgeKey,
): WdeStageSystemKnowledgeEntry | null {
  return WDE_STAGE_SYSTEM_KNOWLEDGE_PACK.find((entry) => entry.key === key) ?? null;
}

export function summarizeWdeStageSystemKnowledgeForPromptStudio(): string {
  const stageLines = WDE_STAGE_SYSTEM_KNOWLEDGE_PACK.map((entry) => [
    `${entry.label}: ${entry.purpose}`,
    `Outputs: ${entry.majorOutputs.join("; ")}.`,
    `Core concepts: ${entry.coreConcepts.join("; ")}.`,
    `Must not: ${entry.mustNotDo.join("; ")}.`,
  ].join("\n")).join("\n\n");

  const ruleLines = WDE_ANALYSIS_CORRECTNESS_RULES
    .map((rule) => `- ${rule.label} ${rule.guidance}`)
    .join("\n");

  const exampleLines = WDE_GOOD_BAD_ANALYSIS_EXAMPLES
    .map((example) => `- ${example.label}: ${example.example} Why: ${example.why}`)
    .join("\n");

  return [
    "Static WDE Stage System Knowledge Pack. Read-only reference; no runtime execution.",
    stageLines,
    "Analysis correctness rules:",
    ruleLines,
    "Good/bad analysis examples:",
    exampleLines,
  ].join("\n\n");
}

function mentionsAny(value: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function advisoryLimitParagraph(): string {
  return [
    "Advisory limits: the Stage Copilot can discuss, explain, compare, challenge assumptions, and advise.",
    "It cannot claim it changed records, changed prompts, promoted prompts, ran official analysis, approved evidence/transcripts, changed readiness, changed package eligibility, generated package output, compiled prompts, or ran tests.",
  ].join(" ");
}

export function answerWdeStageKnowledgeQuestionDeterministically(question: string): string | null {
  const normalized = question.trim();
  if (!normalized) return null;

  if (mentionsAny(normalized, [/pass\s*2/i, /مصادر|السياق/])) {
    return [
      "Pass 2 is Sources / Context. Its purpose is source registration and context-framing before analysis.",
      "Important outputs include registered sources, source-role/source-scope suggestions, structured context, batch summary, admin decisions, and final pre-hierarchy review.",
      "Provider/crawl/STT/extraction paths support intake and traceability, but they do not prove workflow truth.",
      "Pass 2 must do no hierarchy work, no targeting work, no synthesis work, and no package work.",
      "Capability / Analysis PromptSpecs remain separate from Stage Copilot Instructions.",
    ].join(" ");
  }

  if (mentionsAny(normalized, [/pass\s*3/i, /hierarchy approval|اعتماد.*hierarchy|هيكل/])) {
    return [
      "Pass 3 is Hierarchy. It covers hierarchy intake, hierarchy draft, admin correction, approval, and an approved hierarchy snapshot.",
      "Source-to-hierarchy triage links are candidate/signal metadata, not workflow truth.",
      "Hierarchy approval means structural approval of roles and reporting context; it does not prove workflow truth.",
      "Pass 3 must do no participant targeting, no participant sessions, no synthesis, no evaluation, and no package generation.",
    ].join(" ");
  }

  if (mentionsAny(normalized, [/pass\s*4/i, /targeting|استهداف/])) {
    return [
      "Pass 4 is participant targeting / rollout planning. It uses the approved hierarchy to plan who should be asked and in what order.",
      "Outputs include participant candidates, contact readiness, rollout plan, targeting recommendation packet, and question-hint seeds.",
      "A targeting signal is planning support; it is not workflow evidence and not workflow truth.",
      "Pass 4 must do no participant sessions, no narrative evidence collection, no participant-facing questions, no synthesis, and no package generation.",
    ].join(" ");
  }

  if (mentionsAny(normalized, [/pass\s*5/i, /narrative|participant evidence|clarification|evidence extraction|الأدلة/])) {
    return [
      "Pass 5 is narrative-first participant evidence. It runs participant sessions and preserves raw evidence before interpretation.",
      "It uses transcript trust gate decisions, first-pass extraction, evidence anchors, clarification candidates, answer recheck, and boundary signals.",
      "Disputes, defects, unmapped/no-drop material, and Pass 6 handoff candidates must be preserved.",
      "Pass 5 evidence is participant-level and not final workflow truth.",
      "Pass 5 must do no synthesis, no evaluation, and no package generation.",
    ].join(" ");
  }

  if (mentionsAny(normalized, [/manager|مدير|workflow ready|initial package|ولّد|جاهز/i])) {
    return [
      "That is wrong or incomplete analysis.",
      "One manager statement or single statement is not enough to mark workflow ready or generate an Initial Package.",
      "The analysis needs accepted participant evidence across relevant outputs, synthesis/evaluation criteria, and review of gaps, contradictions, boundaries, disputes, and defects.",
      "Package eligibility must follow governed readiness logic.",
      "The Copilot can advise and critique the assumption, but cannot approve readiness or generate a package.",
    ].join(" ");
  }

  if (mentionsAny(normalized, [/مثال|example|good|bad|سيئ|خطير/i])) {
    return [
      "Good Pass 6 analysis is evidence-anchored, layer-aware, and follows 6A/6B/6C boundaries.",
      "It preserves differences, gaps, and contradictions, separates document claims from reality, and keeps automation-supportiveness separate from workflow documentability.",
      "Bad or dangerous analysis flattens contradictions, ignores unresolved evidence, treats a document or manager claim as truth, jumps to package prematurely, or confuses automation weakness with workflow incompleteness.",
    ].join(" ");
  }

  if (mentionsAny(normalized, [/تستطيع|لا تستطيع|claim|ادعاء|مساعد/i])) {
    return advisoryLimitParagraph();
  }

  if (mentionsAny(normalized, [/6A|6B|6C|pass\s*6/i, /الحزمة الأولية|initial package|SynthesisInputBundle/i])) {
    return [
      "Pass 6 is Analysis / Package and is split into 6A, 6B, and 6C.",
      "6A consumes accepted Pass 5 outputs and prepares a SynthesisInputBundle: accepted evidence, anchors, boundary signals, gaps, no-drop material, and document/source signals sorted for synthesis. 6A does no common-path synthesis, no evaluation, and no package generation.",
      "6B performs synthesis, difference interpretation, evaluation, readiness, seven-condition interpretation, workflow assembly, and Workflow Readiness Result. It separates evidence eligibility from seven-condition evaluation, and separates workflow documentability from automation-supportiveness.",
      "6C may create the Initial Package only if readiness/package eligibility allows it or governed proceed-with-warnings exists. 6C does no Final Package, no release, and no Pass 7 actions.",
    ].join(" ");
  }

  return [
    "This static WDE Stage System Knowledge Pack can discuss Pass 2 Sources / Context, Pass 3 Hierarchy, Pass 4 Targeting, Pass 5 Participant Evidence, and Pass 6A/6B/6C Analysis / Package boundaries.",
    advisoryLimitParagraph(),
  ].join(" ");
}
