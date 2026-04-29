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
  goal: string;
  inputs: readonly string[];
  outputs: readonly string[];
  stepByStepOperations: readonly string[];
  contractsAndRecords: readonly string[];
  internalSystemCapabilities: readonly string[];
  boundaries: readonly string[];
  majorInputs: readonly string[];
  majorOutputs: readonly string[];
  coreConcepts: readonly string[];
  mustNotDo: readonly string[];
  wrongInterpretationExamples: readonly string[];
  handoffToNextStage: string;
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
    inputs: freezeArray(entry.inputs),
    outputs: freezeArray(entry.outputs),
    stepByStepOperations: freezeArray(entry.stepByStepOperations),
    contractsAndRecords: freezeArray(entry.contractsAndRecords),
    internalSystemCapabilities: freezeArray(entry.internalSystemCapabilities),
    boundaries: freezeArray(entry.boundaries),
    majorInputs: freezeArray(entry.majorInputs),
    majorOutputs: freezeArray(entry.majorOutputs),
    coreConcepts: freezeArray(entry.coreConcepts),
    mustNotDo: freezeArray(entry.mustNotDo),
    wrongInterpretationExamples: freezeArray(entry.wrongInterpretationExamples),
    sourceRefs: freezeArray(entry.sourceRefs),
  });
}

export const WDE_STAGE_SYSTEM_KNOWLEDGE_PACK: readonly WdeStageSystemKnowledgeEntry[] = Object.freeze([
  freezeEntry({
    key: "pass2_sources_context",
    label: "Pass 2 - Sources / Context",
    purpose:
      "Build the intake and context-framing layer before hierarchy, targeting, participant evidence, synthesis, evaluation, or package work.",
    goal:
      "Produce an accepted, traceable source/context basis that can be safely handed to hierarchy intake without claiming workflow truth.",
    inputs: [
      "company and department intake",
      "document, image, audio, manual note, and website sources",
      "admin-selected primary department and use case",
      "crawler, OCR, STT, extraction, and provider-job results where applicable",
    ],
    outputs: [
      "registered source records",
      "source type/status/trust summaries",
      "source-role and source-scope suggestions",
      "structured context record",
      "department framing and selected use case",
      "final pre-hierarchy review",
    ],
    stepByStepOperations: [
      "create intake session and capture company/department framing",
      "register each source with source kind, status, provenance, and admin notes",
      "handle documents, images, audio, manual notes, and websites through the approved intake path",
      "track extraction, OCR, STT, crawl, and provider jobs as internal capability outputs",
      "generate source-role/source-scope suggestions for admin review",
      "form structured context and batch summary from accepted intake material",
      "record admin decisions, overrides, selected primary department, and selected use case",
      "present final pre-hierarchy review with unresolved risks before handoff",
    ],
    contractsAndRecords: [
      "IntakeSession",
      "IntakeSource",
      "SourceRoleScopeSuggestion",
      "ProviderJob",
      "WebsiteCrawl",
      "AudioTranscriptReview",
      "StructuredContext",
      "FinalPreHierarchyReview",
    ],
    internalSystemCapabilities: [
      "source registration",
      "document extraction",
      "image OCR",
      "audio STT",
      "website crawl execution",
      "provider job tracking",
      "source-role/source-scope suggestion",
      "structured context formation",
      "batch summary generation",
    ],
    boundaries: [
      "intake/context only",
      "admin-controlled source decisions",
      "provider extraction supports context but does not prove operation truth",
      "knowledge of crawl/OCR/STT/extraction capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "treating a source claim as workflow truth",
      "treating extracted document text as confirmed operational reality",
      "assuming a department SOP proves actual participant behavior",
      "starting hierarchy approval or targeting from incomplete source context",
    ],
    handoffToNextStage:
      "Hands accepted source/context basis, department framing, selected use case, and unresolved context risks into Pass 3 hierarchy intake.",
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
    goal:
      "Produce an admin-approved structural hierarchy snapshot and readiness basis for targeting without validating workflow truth.",
    inputs: [
      "Pass 2 final pre-hierarchy review",
      "pasted hierarchy text",
      "admin-entered role structure",
      "uploaded org chart or hierarchy document",
      "source-to-hierarchy triage signals",
    ],
    outputs: [
      "hierarchy draft",
      "node and relationship model",
      "admin correction record",
      "approved hierarchy snapshot",
      "source-to-hierarchy triage links",
      "readiness snapshot toward targeting",
    ],
    stepByStepOperations: [
      "collect hierarchy input from text, admin entry, or uploaded org/hierarchy source",
      "generate or accept a hierarchy draft",
      "model hierarchy nodes, reporting relationships, groupings, and role/person-light fields",
      "triage sources to possible hierarchy nodes or scopes as candidate signals",
      "let admin correct nodes, relationships, labels, and grouping",
      "record approval and freeze the approved hierarchy snapshot",
      "produce a readiness snapshot for Pass 4 targeting",
    ],
    contractsAndRecords: [
      "HierarchyInput",
      "HierarchyDraft",
      "HierarchyNode",
      "HierarchyRelationship",
      "SourceToHierarchyTriageLink",
      "HierarchyCorrection",
      "ApprovedHierarchySnapshot",
      "HierarchyReadinessSnapshot",
    ],
    internalSystemCapabilities: [
      "hierarchy draft generation",
      "source-to-hierarchy triage suggestion",
      "hierarchy readiness snapshot creation",
      "admin correction application",
      "approved snapshot creation",
    ],
    boundaries: [
      "structural approval only",
      "source-to-hierarchy triage is candidate/signal metadata",
      "readiness toward targeting does not perform targeting",
      "knowledge of draft/triage/readiness capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "treating hierarchy approval as evidence the workflow is correct",
      "treating a source-to-hierarchy link as workflow evidence",
      "using hierarchy readiness as participant targeting approval",
      "assuming reporting lines prove actual handoffs or execution sequence",
    ],
    handoffToNextStage:
      "Hands the approved hierarchy snapshot, source-to-hierarchy signals, and targeting readiness status into Pass 4 targeting/rollout planning.",
    sourceRefs: ["handoff/PASS3_HIERARCHY_INTAKE_APPROVAL_BUILD_SPEC.md"],
  }),
  freezeEntry({
    key: "pass4_targeting",
    label: "Pass 4 - Targeting / Rollout Planning",
    purpose:
      "Move from an approved hierarchy snapshot into governed participant targeting and rollout planning without starting outreach or workflow evidence collection.",
    goal:
      "Create an admin-reviewed plan for who should be asked, why, and in what order, while preserving contact readiness and question-hint seeds for later sessions.",
    inputs: [
      "approved Pass 3 hierarchy snapshot",
      "selected department and use case",
      "hierarchy/source planning signals",
      "person-light mapping and contact metadata where available",
    ],
    outputs: [
      "targeting recommendation packet",
      "participant candidates and target groups",
      "contact/channel readiness notes",
      "rollout plan and order",
      "question-hint seeds",
      "approved targeting/rollout plan",
    ],
    stepByStepOperations: [
      "consume the approved hierarchy snapshot and entry readiness from Pass 3",
      "identify role/node-based participant candidates",
      "interpret source and hierarchy signals as planning support",
      "generate a targeting recommendation packet",
      "review contact and channel readiness without sending anything",
      "create rollout order and admin review flags",
      "preserve source-informed question-hint seeds for later Pass 5 use",
      "record admin decisions and approve or rework the targeting/rollout plan",
    ],
    contractsAndRecords: [
      "TargetingRolloutPlan",
      "TargetingRecommendationPacket",
      "ParticipantCandidate",
      "TargetGroup",
      "ContactReadiness",
      "RolloutPlan",
      "QuestionHintSeed",
      "AdminCandidateDecision",
    ],
    internalSystemCapabilities: [
      "targeting packet generation",
      "source-signal interpretation",
      "external clarification source detection",
      "contact/channel readiness metadata generation",
      "rollout order reasoning",
      "question-hint seed generation",
    ],
    boundaries: [
      "planning only",
      "admin approval required before later rollout execution",
      "targeting signals are not workflow evidence",
      "question-hint seeds are not participant-facing questions",
      "knowledge of targeting/question-hint capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "treating a targeting signal as participant evidence",
      "treating a candidate recommendation as admin-approved selection",
      "sending outreach or creating sessions inside Pass 4",
      "using question-hint seeds as participant-facing questions",
    ],
    handoffToNextStage:
      "Hands the approved targeting/rollout plan, participant candidates, contact readiness, rollout order, and question-hint seeds into Pass 5 participant sessions.",
    sourceRefs: ["handoff/PASS4_TARGETING_ROLLOUT_BUILD_SPEC.md"],
  }),
  freezeEntry({
    key: "pass5_participant_evidence",
    label: "Pass 5 - Participant Evidence",
    purpose:
      "Collect narrative-first participant evidence with raw evidence preservation, trust gates, extraction governance, clarification, and answer recheck.",
    goal:
      "Produce governed participant-level evidence and reviewable handoff candidates without collapsing narratives into final workflow truth.",
    inputs: [
      "approved targeting/rollout plan",
      "participant sessions",
      "web or Telegram participant narratives",
      "voice/audio transcripts when trusted",
      "admin-added questions",
      "clarification answers",
      "question-hint seeds from Pass 4 where useful",
    ],
    outputs: [
      "raw evidence records",
      "transcript trust gate decisions",
      "first-pass extraction results",
      "evidence anchors",
      "clarification candidates and formulated questions",
      "answer records and answer recheck results",
      "boundary signals, disputes, defects, and no-drop records",
      "Pass 6 handoff candidates",
    ],
    stepByStepOperations: [
      "create participant session from approved targeting plan",
      "capture narrative-first participant evidence through web, Telegram, or voice path",
      "preserve raw evidence before extraction or interpretation",
      "apply transcript trust gate before transcript-derived extraction",
      "run first-pass participant-level extraction over eligible evidence",
      "attach evidence anchors and route defects/disputes/unmapped content through no-drop preservation",
      "generate clarification candidates and formulate one-question-at-a-time clarification where needed",
      "record clarification answers as raw evidence",
      "run answer recheck and update boundary signals when needed",
      "prepare Pass 6 handoff candidates as candidates only",
    ],
    contractsAndRecords: [
      "ParticipantSession",
      "RawEvidence",
      "TranscriptTrustGate",
      "ParticipantEvidenceExtraction",
      "EvidenceAnchor",
      "ClarificationCandidate",
      "ClarificationQuestion",
      "ClarificationAnswer",
      "AnswerRecheck",
      "BoundarySignal",
      "EvidenceDispute",
      "ExtractionDefect",
      "NoDropContent",
      "Pass6HandoffCandidate",
    ],
    internalSystemCapabilities: [
      "participant evidence extraction",
      "clarification question formulation",
      "answer recheck",
      "boundary signal generation",
      "handoff candidate generation",
      "transcript trust evaluation",
      "evidence anchor validation",
      "no-drop routing",
    ],
    boundaries: [
      "participant-level evidence only",
      "raw evidence and anchors remain traceable",
      "clarification improves evidence quality but does not finalize truth",
      "handoff candidates are candidates, not synthesis",
      "knowledge of extraction/clarification/recheck capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "treating one participant narrative as final workflow truth",
      "ignoring disputed, defective, unmapped, or no-drop content",
      "treating a clarification answer as complete synthesis",
      "promoting Pass 6 handoff candidates directly into package content",
    ],
    handoffToNextStage:
      "Hands accepted participant outputs, anchors, boundary signals, disputes, defects, no-drop material, and handoff candidates into Pass 6A preparation.",
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
    goal:
      "Normalize and organize accepted Pass 5 material into synthesis-ready folders while preserving eligibility, layer, truth-lens, and risk context.",
    inputs: [
      "accepted Pass 5 participant-session outputs",
      "trusted evidence and anchors",
      "boundary signals",
      "disputes, defects, unmapped/no-drop material",
      "document/source signals",
      "hierarchy, layer, and truth-lens metadata",
    ],
    outputs: [
      "SynthesisInputBundle",
      "analysis material folder",
      "boundary/role-limit material folder",
      "gap/risk/no-drop material folder",
      "document/source signal material folder",
      "eligibility summary and preparation summary",
    ],
    stepByStepOperations: [
      "consume accepted Pass 5 outputs without silently revalidating or rewriting them",
      "apply evidence eligibility gate for synthesis preparation",
      "attach hierarchy/layer/truth-lens metadata",
      "sort accepted outputs into analysis material",
      "sort boundary and role-limit material separately",
      "sort gap/risk/no-drop material without dropping unresolved content",
      "sort document/source signals as signals rather than truth",
      "produce a reviewable SynthesisInputBundle and stop before 6B analysis",
    ],
    contractsAndRecords: [
      "SynthesisInputBundle",
      "SynthesisParticipantInput",
      "EvidenceEligibilityStatus",
      "TrustedEvidenceRef",
      "TruthLensContext",
      "BoundarySignalRef",
      "DocumentSignalRef",
      "OpenRiskItem",
      "PreparationSummary",
    ],
    internalSystemCapabilities: [
      "SynthesisInputBundle builder",
      "evidence eligibility gate",
      "accepted-output sorting rule",
      "truth-lens/layer metadata preparation",
      "no-drop/gap preservation",
      "admin bundle review surface",
    ],
    boundaries: [
      "preparation only",
      "evidence eligibility is not seven-condition evaluation",
      "accepted Pass 5 outputs are organized, not rewritten",
      "knowledge of bundle-building capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "promoting disputed or unmapped material into workflow truth",
      "treating candidate-only handoff items as accepted evidence",
      "using 6A evidence eligibility as readiness approval",
      "building common-path synthesis inside the preparation step",
    ],
    handoffToNextStage:
      "Hands the reviewable SynthesisInputBundle into Pass 6B synthesis, difference interpretation, evaluation, and readiness.",
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
    goal:
      "Build a defensible case-level workflow understanding and readiness result from the SynthesisInputBundle without generating package output.",
    inputs: [
      "SynthesisInputBundle",
      "analysis material",
      "boundary/role-limit material",
      "gap/risk/no-drop material",
      "document/source signal material",
      "method registry and active analysis policy",
    ],
    outputs: [
      "workflow units and claims",
      "difference interpretation",
      "layer-aware interpretation",
      "workflow assembly and claim-basis map",
      "seven-condition evaluation",
      "Workflow Readiness Result",
      "methodology / analysis report",
      "pre-6C clarification needs",
    ],
    stepByStepOperations: [
      "convert 6A material into workflow units and typed claims",
      "interpret differences across participants, layers, and truth lenses",
      "assemble a case-level workflow understanding with claim-basis traceability",
      "apply method/lens usage from the method registry and analysis policy",
      "evaluate the seven conditions",
      "separate workflow documentability from automation-supportiveness",
      "produce readiness, blocker, warning, and review/gap routing logic",
      "surface methodology and analysis report for admin review",
    ],
    contractsAndRecords: [
      "WorkflowUnit",
      "WorkflowClaim",
      "DifferenceInterpretation",
      "ClaimBasisMap",
      "WorkflowAssembly",
      "SevenConditionAssessment",
      "WorkflowReadinessResult",
      "Pass6MethodRegistry",
      "Pass6AnalysisPolicy",
      "MethodologyReport",
      "Pre6CClarificationNeed",
    ],
    internalSystemCapabilities: [
      "workflow unit and claim pipeline",
      "difference interpretation engine",
      "multi-lens/layer-aware interpretation",
      "workflow assembly",
      "claim-basis map generation",
      "seven-condition evaluation",
      "readiness result generation",
      "methodology / analysis report generation",
      "pre-6C gap closure need detection",
    ],
    boundaries: [
      "analysis/evaluation only",
      "readiness is governed and traceable",
      "package eligibility is prepared for 6C but package output is not created here",
      "knowledge of analysis/evaluation capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "treating one manager statement as enough for readiness",
      "flattening contradictions across participants or layers",
      "confusing automation weakness with workflow incompleteness",
      "ignoring unresolved gaps, boundaries, or no-drop material",
      "jumping to Initial Package before 6C eligibility",
    ],
    handoffToNextStage:
      "Hands Workflow Readiness Result, evaluation details, blockers, warnings, and pre-6C gap needs into Pass 6C or review/gap handling.",
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
    goal:
      "Produce the correct governed output: Initial Workflow Package when allowed, or gap/review output when not ready, without final release.",
    inputs: [
      "Workflow Readiness Result",
      "pre-6C gate outcome",
      "approved 6B workflow understanding",
      "package eligibility decision",
      "admin proceed-with-warnings approval when applicable",
    ],
    outputs: [
      "Initial Workflow Package preview when allowed",
      "Workflow Gap Closure Brief when not ready",
      "client-facing package section",
      "admin/internal traceability section",
      "residual gaps and caveats",
      "workflow graph or visual output where relevant",
    ],
    stepByStepOperations: [
      "check 6B readiness and pre-6C gate outcome",
      "determine whether Initial Package, proceed-with-warnings, or gap brief is appropriate",
      "generate client-facing package content only when allowed",
      "keep admin/internal readiness reasoning separate from outward package content",
      "preserve residual gaps, caveats, limitations, and review recommendations",
      "produce workflow graph/visual outputs from approved understanding where relevant",
      "stop before Final Package, release, or Pass 7 discussion flow",
    ],
    contractsAndRecords: [
      "InitialWorkflowPackage",
      "WorkflowGapClosureBrief",
      "PackageEligibilityDecision",
      "Pre6CGateResult",
      "ProceedWithWarningsApproval",
      "InitialPackageOutwardSection",
      "InitialPackageAdminSection",
      "WorkflowGraph",
      "VisualOutputRecord",
    ],
    internalSystemCapabilities: [
      "Initial Package drafting",
      "Workflow Gap Closure Brief generation",
      "package eligibility enforcement",
      "client/admin section separation",
      "workflow graph/visual output generation",
      "residual gap/caveat preservation",
    ],
    boundaries: [
      "Initial Package only",
      "readiness and package eligibility govern output",
      "client-facing content is separated from admin/internal reasoning",
      "visual outputs do not own workflow analysis or eligibility",
      "knowledge of package/visual capabilities does not grant Copilot execution authority",
    ],
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
    wrongInterpretationExamples: [
      "presenting Initial Package as Final Package",
      "hiding blockers, caveats, or unresolved gaps",
      "generating package output when readiness forbids it",
      "letting a visual map overwrite evidence or analysis",
      "starting Pass 7 discussion or release behavior inside 6C",
    ],
    handoffToNextStage:
      "Hands Initial Package preview, gap brief, residual caveats, visuals, or review-worthy outputs toward later review/finalization only when separately scoped.",
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
  Object.freeze({
    ruleId: "copilot_is_advisory_only",
    label: "Copilot discussion is advisory only.",
    guidance: "The Stage Copilot may know stage capabilities and discuss them, but it cannot run tools, execute official analysis, mutate records, or change readiness/package eligibility.",
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
  Object.freeze({
    exampleId: "bad_evidence_promotion",
    label: "Bad evidence promotion",
    kind: "bad",
    example:
      "A disputed or unmapped Pass 5 item is promoted directly into the synthesized workflow because it sounds plausible.",
    why:
      "Disputed, defective, candidate-only, or no-drop material must be preserved and reviewed; it cannot become workflow truth without governed synthesis/evaluation.",
  }),
  Object.freeze({
    exampleId: "bad_document_as_truth",
    label: "Bad document-as-truth assumption",
    kind: "dangerous_assumption",
    example:
      "The SOP says approvals happen in two steps, so the actual operation is treated as proven without participant evidence.",
    why:
      "Document/source claims are signals. Actual operation requires participant evidence, anchors, synthesis, and contradiction/gap review.",
  }),
  Object.freeze({
    exampleId: "good_pass5_to_6a_handoff",
    label: "Good Pass 5 to 6A handoff",
    kind: "good",
    example:
      "Accepted Pass 5 outputs enter 6A with evidence anchors, transcript trust status, boundary signals, disputes, defects, no-drop material, and document/source signals intact.",
    why:
      "The handoff preserves provenance and risk context, allowing 6A to prepare the SynthesisInputBundle without revalidating or overwriting Pass 5.",
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
    `${entry.label}: ${entry.purpose} Goal: ${entry.goal}`,
    `Inputs: ${entry.inputs.join("; ")}.`,
    `Outputs: ${entry.outputs.join("; ")}.`,
    `Operations: ${entry.stepByStepOperations.slice(0, 5).join("; ")}.`,
    `Records: ${entry.contractsAndRecords.join("; ")}.`,
    `Internal capabilities known but not executable by Copilot: ${entry.internalSystemCapabilities.join("; ")}.`,
    `Boundaries: ${entry.boundaries.join("; ")}.`,
    `Must not: ${entry.mustNotDo.join("; ")}.`,
    `Wrong interpretations: ${entry.wrongInterpretationExamples.join("; ")}.`,
    `Handoff: ${entry.handoffToNextStage}`,
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

function compactOperationalList(items: readonly string[]): string {
  return items.map((item) => item.replace(/\s+/g, " ").trim()).join(" | ");
}

function stageFocusScore(entry: WdeStageSystemKnowledgeEntry, focusText: string): number {
  const normalized = focusText.toLowerCase();
  if (!normalized) return 0;
  const stageMatchers: Record<WdeStageSystemKnowledgeKey, readonly RegExp[]> = {
    pass2_sources_context: [/pass\s*2/i, /sources?\s*\/?\s*context/i, /مصادر|السياق/],
    pass3_hierarchy: [/pass\s*3/i, /hierarchy/i, /هيكل|اعتماد.*hierarchy/],
    pass4_targeting: [/pass\s*4/i, /targeting|rollout/i, /استهداف|اختيار المشاركين/],
    pass5_participant_evidence: [/pass\s*5/i, /participant evidence|narrative|clarification|extraction/i, /الأدلة|توضيح|استخراج/],
    pass6a_synthesis_input: [/6A/i, /SynthesisInputBundle/i, /حزمة/],
    pass6b_synthesis_evaluation_readiness: [/6B/i, /synthesis|evaluation|readiness|seven[- ]?condition/i, /توليف|تقييم|جاهزية/],
    pass6c_initial_package: [/6C/i, /Initial Package|package eligibility/i, /الحزمة الأولية|أهلية الحزمة/],
  };
  return stageMatchers[entry.key].reduce((score, pattern) => score + (pattern.test(normalized) ? 1 : 0), 0);
}

export function summarizeWdeOperationalStageCardsForPromptStudio(
  focusText = "",
): string {
  const entries = [...WDE_STAGE_SYSTEM_KNOWLEDGE_PACK].sort((a, b) => {
    const scoreDelta = stageFocusScore(b, focusText) - stageFocusScore(a, focusText);
    if (scoreDelta !== 0) return scoreDelta;
    return WDE_STAGE_SYSTEM_KNOWLEDGE_PACK.indexOf(a) - WDE_STAGE_SYSTEM_KNOWLEDGE_PACK.indexOf(b);
  });

  const stageCards = entries.map((entry) => [
    `### ${entry.label} (${entry.key})`,
    `purpose: ${entry.purpose}`,
    `goal: ${entry.goal}`,
    `inputs: ${compactOperationalList(entry.inputs)}`,
    `outputs: ${compactOperationalList(entry.outputs)}`,
    `stepByStepOperations: ${compactOperationalList(entry.stepByStepOperations)}`,
    `contractsAndRecords: ${compactOperationalList(entry.contractsAndRecords)}`,
    `internalSystemCapabilities: ${compactOperationalList(entry.internalSystemCapabilities)}. Knowledge only; Copilot cannot run these capabilities.`,
    `boundaries: ${compactOperationalList(entry.boundaries)}`,
    `mustNotDo: ${compactOperationalList(entry.mustNotDo)}`,
    `wrongInterpretationExamples: ${compactOperationalList(entry.wrongInterpretationExamples)}`,
    `handoffToNextStage: ${entry.handoffToNextStage}`,
  ].join("\n")).join("\n\n");

  const rules = WDE_ANALYSIS_CORRECTNESS_RULES
    .map((rule) => `- ${rule.label} ${rule.guidance}`)
    .join("\n");

  const examples = WDE_GOOD_BAD_ANALYSIS_EXAMPLES
    .map((example) => `- ${example.label} (${example.kind}): ${example.example} Why: ${example.why}`)
    .join("\n");

  return [
    "Use these compact structured cards as the authoritative stage-system knowledge for conversational answers.",
    "Each card includes the required 11 categories: purpose, goal, inputs, outputs, stepByStepOperations, contractsAndRecords, internalSystemCapabilities, boundaries, mustNotDo, wrongInterpretationExamples, handoffToNextStage.",
    "Knowledge of internalSystemCapabilities is descriptive only and never grants execution authority.",
    stageCards,
    "### Global analysis correctness rules",
    rules,
    "### Good/bad analysis examples",
    examples,
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
