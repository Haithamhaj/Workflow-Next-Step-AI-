/**
 * Synthesis + seven-condition evaluation — Pass 6 implementation.
 * Spec refs: §19 (synthesis: common-path + difference blocks + §19.11 output),
 *            §20.3 (seven conditions), §20.4 (five axes), §20.5 (per-axis states),
 *            §20.10 (hybrid outcome: seven conditions "must govern" final outcome;
 *                    axis rubrics are supporting lenses only),
 *            §20.11–20.14 (the four outcomes and their enabling conditions),
 *            §20.19–20.20 (workflow validity vs automation-supportiveness),
 *            §20.21–20.22 (AI-interpreted / admin-routed / rule-guarded model).
 *
 * Architecture constraint: this package must not import from core-state,
 * core-case, or sessions-clarification.
 *
 * Outcome governance (§20.21–§20.22 active model):
 *   1. LLM generates per-condition interpretations at preview time (stored as snapshot).
 *   2. Admin reviews interpretations and confirms/rejects blocking labels.
 *   3. Server enforces: snapshot basis must match submitted payload (integrity).
 *   4. Server enforces: all LLM-blocking conditions require adminBlockingConfirmation.
 *   5. Server enforces: adminNote required when admin rejects a blocking label.
 *   6. Narrow hard-stop: admin-confirmed blocking + incompatible outcome → 400.
 *   Axis states alone do NOT constrain the outcome.
 */

import {
  validateSynthesisRecord,
  validateEvaluationRecord,
  validatePass6ConfigurationProfile,
  validateSynthesisInputBundle,
  validateWorkflowClaim,
  validateWorkflowUnit,
  EvaluationAxisState,
  EvaluationOutcome,
  type Pass6ConfigurationProfile,
  type Pass6LockedGovernanceRule,
  type Pass6PolicySet,
  type SynthesisRecord,
  type SynthesisDifferenceBlock,
  type EvaluationRecord,
  type EvaluationAxes,
  type EvaluationConditions,
  type AnalysisMethodKey,
  type AnalysisMethodUsage,
  type BoundarySignal,
  type ClarificationCandidate,
  type EvidenceAnchor,
  type EvidenceDispute,
  type ExtractedItem,
  type FirstPassExtractionOutput,
  type Pass6PreparedMaterialItem,
  type Pass6Reference,
  type Pass6RoleLayerContext,
  type Pass6SourceBasis,
  type Pass6TruthLensContext,
  type Pass6HandoffCandidate,
  type ParticipantSession,
  type QuestionHintSeed,
  type SynthesisInputBundle,
  type TargetingRolloutPlan,
  type TargetingSourceSignal,
  type UnmappedContentItem,
  type ExtractionDefect,
  type WorkflowClaim,
  type WorkflowClaimStatus,
  type WorkflowClaimType,
  type WorkflowUnit,
  type WorkflowUnitType,
} from "@workflow/contracts";
import type {
  StoredSynthesisRecord,
  StoredEvaluationRecord,
  SynthesisRepository,
  EvaluationRepository,
  InterpretationSnapshotRepository,
  Pass6ConfigurationProfileRepository,
  ParticipantSessionRepository,
  FirstPassExtractionOutputRepository,
  ClarificationCandidateRepository,
  BoundarySignalRepository,
  EvidenceDisputeRepository,
  Pass6HandoffCandidateRepository,
  SynthesisInputBundleRepository,
  TargetingRolloutPlanRepository,
  StoredPass6ConfigurationProfile,
  StoredSynthesisInputBundle,
  StoredWorkflowClaim,
  StoredWorkflowUnit,
  WorkflowClaimRepository,
  WorkflowUnitRepository,
} from "@workflow/persistence";

export const SYNTHESIS_EVALUATION_PACKAGE =
  "@workflow/synthesis-evaluation" as const;

// ---------------------------------------------------------------------------
// Re-exports — consumers should not need to double-import contracts
// ---------------------------------------------------------------------------

export { EvaluationAxisState, EvaluationOutcome } from "@workflow/contracts";
export type {
  SynthesisRecord,
  SynthesisDifferenceBlock,
  EvaluationRecord,
  EvaluationAxes,
  EvaluationConditions,
  ConditionInterpretations,
  ConditionInterpretation,
} from "@workflow/contracts";
export type {
  StoredSynthesisRecord,
  StoredEvaluationRecord,
  SynthesisRepository,
  EvaluationRepository,
  InterpretationSnapshotRepository,
  Pass6ConfigurationProfileRepository,
  ParticipantSessionRepository,
  FirstPassExtractionOutputRepository,
  ClarificationCandidateRepository,
  BoundarySignalRepository,
  EvidenceDisputeRepository,
  Pass6HandoffCandidateRepository,
  SynthesisInputBundleRepository,
  TargetingRolloutPlanRepository,
  StoredPass6ConfigurationProfile,
  StoredSynthesisInputBundle,
  StoredWorkflowClaim,
  StoredWorkflowUnit,
  WorkflowClaimRepository,
  WorkflowUnitRepository,
} from "@workflow/persistence";

export type {
  Pass6ConfigurationProfile,
  Pass6ConfigScope,
  Pass6ConfigStatus,
  Pass6LockedGovernanceRule,
  Pass6PolicySet,
  Pass6MethodConfig,
} from "@workflow/contracts";

// ---------------------------------------------------------------------------
// Outcome types — discriminated unions
// ---------------------------------------------------------------------------

export interface SynthesisOk {
  ok: true;
  synthesis: StoredSynthesisRecord;
}

export interface SynthesisError {
  ok: false;
  error: string;
}

export type SynthesisResult = SynthesisOk | SynthesisError;

export interface EvaluationOk {
  ok: true;
  evaluation: StoredEvaluationRecord;
}

export interface EvaluationError {
  ok: false;
  error: string;
}

export type EvaluationResult = EvaluationOk | EvaluationError;

// ---------------------------------------------------------------------------
// Pass 6A SynthesisInputBundle preparation — Block 6
// ---------------------------------------------------------------------------

export interface BuildSynthesisInputBundleRepositories {
  participantSessions: ParticipantSessionRepository;
  firstPassExtractionOutputs: FirstPassExtractionOutputRepository;
  clarificationCandidates: ClarificationCandidateRepository;
  boundarySignals: BoundarySignalRepository;
  evidenceDisputes: EvidenceDisputeRepository;
  pass6HandoffCandidates: Pass6HandoffCandidateRepository;
  synthesisInputBundles?: SynthesisInputBundleRepository;
  targetingRolloutPlans?: TargetingRolloutPlanRepository;
}

export interface BuildSynthesisInputBundleInput {
  caseId: string;
  bundleId?: string;
  now?: string;
  persist?: boolean;
}

export interface BuildSynthesisInputBundleOk {
  ok: true;
  bundle: SynthesisInputBundle;
}

export interface BuildSynthesisInputBundleError {
  ok: false;
  error: string;
}

export type BuildSynthesisInputBundleResult =
  | BuildSynthesisInputBundleOk
  | BuildSynthesisInputBundleError;

export interface SynthesisInputBundleReviewSummary {
  bundleId: string;
  caseId: string;
  createdAt: string;
  sourcePass5SessionIds: string[];
  sessionCount: number;
  folderCounts: {
    analysis_material: number;
    boundary_role_limit_material: number;
    gap_risk_no_drop_material: number;
    document_source_signal_material: number;
  };
  openRiskCandidateOnlyCount: number;
  adminReviewRecommendedBeforeSynthesis: boolean;
  missingOptionalContextNotes: string[];
  boundaryWarnings: string[];
}

export interface SynthesisInputBundleReviewDetail {
  identity: {
    bundleId: string;
    caseId: string;
    createdAt: string;
    sourcePass5SessionIds: string[];
  };
  preparationSummary: SynthesisInputBundleReviewSummary;
  folders: Pick<
    SynthesisInputBundle,
    | "analysis_material"
    | "boundary_role_limit_material"
    | "gap_risk_no_drop_material"
    | "document_source_signal_material"
  >;
  roleLayerContexts: Pass6RoleLayerContext[];
  truthLensContexts: Pass6TruthLensContext[];
  riskOpenItems: Pass6PreparedMaterialItem[];
  documentSourceSignals: Pass6PreparedMaterialItem[];
  boundaryWarnings: string[];
}

const ACCEPTED_PASS5_EXTRACTION_STATUSES = new Set([
  "completed_clean",
  "completed_with_unmapped",
  "completed_with_defects",
  "completed_with_evidence_disputes",
]);

const RESOLVED_CLARIFICATION_STATUSES = new Set([
  "answered",
  "resolved",
  "partially_resolved",
]);

const OPEN_OR_RISK_CLARIFICATION_STATUSES = new Set([
  "open",
  "asked",
  "partially_resolved",
  "escalated",
]);

const DEFAULT_TRUTH_LENS_CONTEXTS: Pass6TruthLensContext[] = [
  {
    contextId: "truth_lens:execution_evidence",
    lensType: "execution_evidence",
    summary: "Accepted Pass 5 participant/session execution evidence prepared for later synthesis.",
    limitations: ["Preparation only; not final workflow truth."],
  },
  {
    contextId: "truth_lens:oversight_evidence",
    lensType: "oversight_evidence",
    summary: "Accepted Pass 5 oversight or review evidence prepared for later synthesis.",
    limitations: ["Preparation only; does not evaluate oversight completeness."],
  },
  {
    contextId: "truth_lens:approval_control_evidence",
    lensType: "approval_control_evidence",
    summary: "Accepted Pass 5 approval, control, or decision-rule evidence prepared for later synthesis.",
    limitations: ["Preparation only; does not score control sufficiency."],
  },
  {
    contextId: "truth_lens:policy_intent_evidence",
    lensType: "policy_intent_evidence",
    summary: "Policy, SOP, SLA, KPI, or role-document signals carried forward as intent signals.",
    limitations: ["Document/source claims remain signals, not operational truth by default."],
  },
  {
    contextId: "truth_lens:handoff_dependency_evidence",
    lensType: "handoff_dependency_evidence",
    summary: "Accepted Pass 5 handoff and dependency evidence prepared for later synthesis.",
    limitations: ["Preparation only; does not resolve ownership or sequence conflicts."],
  },
  {
    contextId: "truth_lens:document_signal_evidence",
    lensType: "document_signal_evidence",
    summary: "Document/source signals carried forward for later comparison.",
    limitations: ["Document/source signals are not operational truth by default."],
  },
];

function safeIdPart(value: string): string {
  return value.trim().replace(/[^A-Za-z0-9:_-]+/g, "_");
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const id = key(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

function roleContextId(sessionId: string): string {
  return `role_layer:${safeIdPart(sessionId)}`;
}

function referencesFromEvidenceAnchors(
  anchors: EvidenceAnchor[],
  sessionId: string,
  referenceType: string,
): Pass6Reference[] {
  return anchors.map((anchor, index) => ({
    referenceId: `${referenceType}:${safeIdPart(sessionId)}:${safeIdPart(anchor.evidenceItemId)}:${index}`,
    referenceType,
    sessionId,
    evidenceItemId: anchor.evidenceItemId,
    quote: anchor.quote,
    notes: anchor.note,
  }));
}

function basisFromExtractionItem(
  output: FirstPassExtractionOutput,
  item: ExtractedItem,
  summary: string,
): Pass6SourceBasis {
  const references = referencesFromEvidenceAnchors(
    item.evidenceAnchors,
    output.sessionId,
    "pass5_evidence_anchor",
  );
  return {
    basisId: `basis:extraction:${safeIdPart(output.extractionId)}:${safeIdPart(item.itemId)}`,
    basisType: "extraction",
    summary,
    references: references.length > 0
      ? references
      : [{
          referenceId: `extraction:${safeIdPart(output.extractionId)}:${safeIdPart(item.itemId)}`,
          referenceType: "pass5_extraction_item",
          sessionId: output.sessionId,
          notes: "Pass 5 extraction item carried forward without revalidation.",
        }],
  };
}

function materialFromExtractionItem(
  output: FirstPassExtractionOutput,
  item: ExtractedItem,
  itemType: string,
  lensContextId: string,
): Pass6PreparedMaterialItem {
  return {
    itemId: `${itemType}:${safeIdPart(output.sessionId)}:${safeIdPart(item.itemId)}`,
    itemType,
    summary: item.description || item.label,
    basis: basisFromExtractionItem(output, item, `${itemType} from accepted Pass 5 extraction output.`),
    roleLayerContextIds: [roleContextId(output.sessionId)],
    truthLensContextIds: [lensContextId],
    notes: "Accepted Pass 5 extraction output prepared for later synthesis; not final workflow truth.",
  };
}

function riskMaterialFromExtractionItem(
  output: FirstPassExtractionOutput,
  item: ExtractedItem,
  reason: string,
): Pass6PreparedMaterialItem {
  return {
    itemId: `gap_risk:${safeIdPart(output.sessionId)}:${safeIdPart(item.itemId)}:${safeIdPart(reason)}`,
    itemType: "open_or_risk_extracted_item",
    summary: `${item.label}: ${reason}`,
    basis: basisFromExtractionItem(output, item, `Open/risk state preserved from Pass 5: ${reason}.`),
    roleLayerContextIds: [roleContextId(output.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: "Open, low-confidence, unresolved, or review-needed material is preserved as no-drop risk material and is not upgraded to workflow truth.",
  };
}

function boundaryMaterial(signal: BoundarySignal): Pass6PreparedMaterialItem {
  return {
    itemId: `boundary_signal:${safeIdPart(signal.sessionId)}:${safeIdPart(signal.boundarySignalId)}`,
    itemType: "boundary_signal",
    summary: signal.participantStatement,
    basis: {
      basisId: `basis:boundary_signal:${safeIdPart(signal.boundarySignalId)}`,
      basisType: "boundary_signal",
      summary: `Pass 5 boundary signal: ${signal.boundaryType}.`,
      references: [{
        referenceId: `boundary_signal:${safeIdPart(signal.boundarySignalId)}`,
        referenceType: "pass5_boundary_signal",
        sessionId: signal.sessionId,
        evidenceItemId: signal.linkedEvidenceItemId,
      }],
    },
    roleLayerContextIds: [roleContextId(signal.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: "Boundary, role limit, or visibility limitation carried forward without resolving workflow truth.",
  };
}

function clarificationMaterial(candidate: ClarificationCandidate): Pass6PreparedMaterialItem {
  const resolved = RESOLVED_CLARIFICATION_STATUSES.has(candidate.status);
  return {
    itemId: `${resolved ? "clarification_outcome" : "clarification_open"}:${safeIdPart(candidate.sessionId)}:${safeIdPart(candidate.candidateId)}`,
    itemType: resolved ? "clarification_outcome" : "open_clarification_need",
    summary: candidate.participantFacingQuestion,
    basis: {
      basisId: `basis:clarification:${safeIdPart(candidate.candidateId)}`,
      basisType: "clarification",
      summary: `Pass 5 clarification status: ${candidate.status}.`,
      references: candidate.linkedRawEvidenceItemIds.map((evidenceItemId, index) => ({
        referenceId: `clarification:${safeIdPart(candidate.candidateId)}:${index}`,
        referenceType: "pass5_clarification_candidate",
        sessionId: candidate.sessionId,
        evidenceItemId,
      })),
    },
    roleLayerContextIds: [roleContextId(candidate.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: resolved
      ? "Accepted Pass 5 clarification outcome prepared for later synthesis."
      : "Open or partial clarification need preserved as no-drop risk material; not re-asked by 6A.",
  };
}

function unmappedMaterial(item: UnmappedContentItem): Pass6PreparedMaterialItem {
  return {
    itemId: `unmapped_content:${safeIdPart(item.sessionId)}:${safeIdPart(item.unmappedItemId)}`,
    itemType: "unmapped_content",
    summary: item.quote || item.reasonUnmapped,
    basis: {
      basisId: `basis:unmapped:${safeIdPart(item.unmappedItemId)}`,
      basisType: "pass5_output",
      summary: `Pass 5 unmapped content: ${item.reasonUnmapped}.`,
      references: [{
        referenceId: `unmapped:${safeIdPart(item.unmappedItemId)}`,
        referenceType: "pass5_unmapped_content",
        sessionId: item.sessionId,
        evidenceItemId: item.evidenceItemId,
        quote: item.quote,
      }],
    },
    roleLayerContextIds: [roleContextId(item.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: "Unmapped content is preserved as no-drop gap/risk material and is not upgraded to workflow truth.",
  };
}

function defectMaterial(defect: ExtractionDefect, output: FirstPassExtractionOutput): Pass6PreparedMaterialItem {
  return {
    itemId: `extraction_defect:${safeIdPart(output.sessionId)}:${safeIdPart(defect.defectId)}`,
    itemType: "extraction_defect",
    summary: defect.description,
    basis: {
      basisId: `basis:defect:${safeIdPart(defect.defectId)}`,
      basisType: "pass5_output",
      summary: `Pass 5 extraction defect: ${defect.defectType}.`,
      references: [{
        referenceId: `defect:${safeIdPart(defect.defectId)}`,
        referenceType: "pass5_extraction_defect",
        sessionId: output.sessionId,
        evidenceItemId: defect.basisEvidenceItemId ?? undefined,
        notes: defect.recommendedAction,
      }],
    },
    roleLayerContextIds: [roleContextId(output.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: "Extraction defect is preserved as no-drop gap/risk material and is not upgraded to workflow truth.",
  };
}

function disputeMaterial(dispute: EvidenceDispute): Pass6PreparedMaterialItem {
  return {
    itemId: `evidence_dispute:${safeIdPart(dispute.sessionId)}:${safeIdPart(dispute.disputeId)}`,
    itemType: "evidence_dispute",
    summary: dispute.aiProposedInterpretation,
    basis: {
      basisId: `basis:dispute:${safeIdPart(dispute.disputeId)}`,
      basisType: "pass5_output",
      summary: `Pass 5 evidence dispute: ${dispute.disputeType}.`,
      references: referencesFromEvidenceAnchors(
        [dispute.aiProposedEvidenceAnchor],
        dispute.sessionId,
        "pass5_evidence_dispute",
      ),
    },
    roleLayerContextIds: [roleContextId(dispute.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: "Evidence dispute is preserved for later review and is not upgraded to workflow truth.",
  };
}

function handoffCandidateMaterial(candidate: Pass6HandoffCandidate): Pass6PreparedMaterialItem {
  return {
    itemId: `handoff_candidate:${safeIdPart(candidate.handoffCandidateId)}`,
    itemType: "pass6_handoff_candidate",
    summary: candidate.description,
    basis: {
      basisId: `basis:handoff_candidate:${safeIdPart(candidate.handoffCandidateId)}`,
      basisType: "handoff_candidate",
      summary: `Pass 6 handoff candidate with admin decision: ${candidate.adminDecision}.`,
      references: candidate.evidenceRefs.flatMap((anchor, index) =>
        candidate.sessionIds.map((sessionId) => ({
          referenceId: `handoff_candidate:${safeIdPart(candidate.handoffCandidateId)}:${safeIdPart(sessionId)}:${index}`,
          referenceType: "pass6_handoff_candidate",
          sessionId,
          evidenceItemId: anchor.evidenceItemId,
          quote: anchor.quote,
          notes: anchor.note,
        })),
      ),
    },
    roleLayerContextIds: candidate.sessionIds.map(roleContextId),
    truthLensContextIds: ["truth_lens:handoff_dependency_evidence"],
    notes: "Candidate-only Pass 6 handoff material is preserved for later synthesis review and is not workflow truth.",
  };
}

function sourceSignalMaterial(signal: TargetingSourceSignal): Pass6PreparedMaterialItem {
  const policyLike = /sop|sla|policy|kpi|role/i.test(`${signal.sourceName} ${signal.documentSignal} ${signal.signalType}`);
  return {
    itemId: `source_signal:${safeIdPart(signal.signalId)}`,
    itemType: "source_signal",
    summary: signal.documentSignal,
    basis: {
      basisId: `basis:source_signal:${safeIdPart(signal.signalId)}`,
      basisType: "source_document",
      summary: `Pass 4/5 source signal: ${signal.signalType}.`,
      references: [{
        referenceId: `source_signal:${safeIdPart(signal.signalId)}`,
        referenceType: "document_source_signal",
        sourceId: signal.sourceId,
        label: signal.sourceName,
        notes: signal.adminNote,
      }],
    },
    roleLayerContextIds: signal.linkedHierarchyNodeId
      ? [`hierarchy:${safeIdPart(signal.linkedHierarchyNodeId)}`]
      : undefined,
    truthLensContextIds: policyLike
      ? ["truth_lens:document_signal_evidence", "truth_lens:policy_intent_evidence"]
      : ["truth_lens:document_signal_evidence"],
    notes: "Document/source signal carried forward as a signal only; not operational truth by default.",
  };
}

function questionHintMaterial(seed: QuestionHintSeed): Pass6PreparedMaterialItem {
  return {
    itemId: `question_hint_seed:${safeIdPart(seed.hintId)}`,
    itemType: "document_question_hint",
    summary: seed.whyItMayMatter,
    basis: {
      basisId: `basis:question_hint_seed:${safeIdPart(seed.hintId)}`,
      basisType: "source_document",
      summary: `Document-derived question hint status: ${seed.status}.`,
      references: [{
        referenceId: `question_hint_seed:${safeIdPart(seed.hintId)}`,
        referenceType: "document_question_hint",
        sourceId: seed.sourceId,
        label: seed.sourceName,
        notes: seed.adminNote,
      }],
    },
    roleLayerContextIds: seed.linkedTargetCandidateId
      ? [`target_candidate:${safeIdPart(seed.linkedTargetCandidateId)}`]
      : undefined,
    truthLensContextIds: ["truth_lens:document_signal_evidence"],
    notes: "Document-derived question hint carried forward as a source signal; 6A does not ask or send questions.",
  };
}

function sequenceMapMaterial(output: FirstPassExtractionOutput): Pass6PreparedMaterialItem | null {
  const hasSequence =
    output.sequenceMap.orderedItemIds.length > 0 ||
    output.sequenceMap.sequenceLinks.length > 0 ||
    output.sequenceMap.unclearTransitions.length > 0;
  if (!hasSequence) return null;

  return {
    itemId: `sequence_map:${safeIdPart(output.sessionId)}:${safeIdPart(output.extractionId)}`,
    itemType: "sequence_map",
    summary: `Pass 5 sequence map with ${output.sequenceMap.orderedItemIds.length} ordered item(s), ${output.sequenceMap.sequenceLinks.length} link(s), and ${output.sequenceMap.unclearTransitions.length} unclear transition(s).`,
    basis: {
      basisId: `basis:sequence_map:${safeIdPart(output.extractionId)}`,
      basisType: "extraction",
      summary: "Accepted Pass 5 sequence map prepared for later synthesis.",
      references: output.basisEvidenceItemIds.map((evidenceItemId, index) => ({
        referenceId: `sequence_map:${safeIdPart(output.extractionId)}:${index}`,
        referenceType: "pass5_sequence_map",
        sessionId: output.sessionId,
        evidenceItemId,
      })),
    },
    roleLayerContextIds: [roleContextId(output.sessionId)],
    truthLensContextIds: ["truth_lens:execution_evidence"],
    notes: "Sequence map is carried forward from Pass 5; 6A does not evaluate workflow completeness.",
  };
}

function roleLayerContextFromSession(
  session: ParticipantSession,
  rolloutPlans: TargetingRolloutPlan[],
): Pass6RoleLayerContext {
  const candidate =
    rolloutPlans
      .flatMap((plan) => [...plan.targetCandidates, ...plan.adminCandidateDecisions])
      .find((item) => item.candidateId === session.targetCandidateId);

  return {
    contextId: roleContextId(session.sessionId),
    participantId: session.participantContactProfileId,
    sessionId: session.sessionId,
    targetCandidateId: session.targetCandidateId,
    participantRole: session.participantRoleOrNodeId,
    hierarchyNodeId: candidate?.linkedHierarchyNodeId ?? session.participantRoleOrNodeId,
    department: session.selectedDepartment,
    selectedUseCase: session.selectedUseCase,
    layer: "pass5_participant_session",
    groupingLayerCategory: candidate?.targetType ?? "participant_session",
    levelHint: candidate?.expectedWorkflowVisibility,
    inUseCaseScope: true,
    participantTargetType: candidate?.targetType,
    authorityScope: "Accepted Pass 5 participant/session output; not final workflow truth.",
    notes: `Participant label: ${session.participantLabel}. 6A preserves Pass 5 status without revalidation.`,
  };
}

function extractionItemRiskReasons(item: ExtractedItem): string[] {
  const reasons: string[] = [];
  if (item.confidenceLevel === "low") reasons.push("low_confidence");
  if (item.needsClarification) reasons.push("needs_clarification");
  if (item.completenessStatus === "unresolved" || item.completenessStatus === "vague") {
    reasons.push(`completeness_${item.completenessStatus}`);
  }
  if (item.adminReviewStatus === "review_required") reasons.push("admin_review_required");
  return reasons;
}

function validationErrorText(errors: readonly { message?: string }[]): string {
  return errors.map((error) => error.message ?? String(error)).join("; ");
}

/**
 * Build the 6A SynthesisInputBundle from already-accepted Pass 5 records.
 * This function sorts and preserves Pass 5 output material only. It does not
 * form claims, score material, evaluate readiness, generate packages, call
 * providers, or revalidate raw evidence.
 */
export function buildSynthesisInputBundleFromPass5(
  input: BuildSynthesisInputBundleInput,
  repos: BuildSynthesisInputBundleRepositories,
): BuildSynthesisInputBundleResult {
  const now = input.now ?? new Date().toISOString();
  const allCaseSessions = repos.participantSessions.findByCaseId(input.caseId);
  const acceptedSessions = allCaseSessions.filter((session) =>
    session.sessionState === "ready_for_later_synthesis_handoff" &&
    ACCEPTED_PASS5_EXTRACTION_STATUSES.has(session.extractionStatus),
  );

  const rolloutPlans = repos.targetingRolloutPlans?.findByCaseId(input.caseId) ?? [];
  const acceptedSessionIds = new Set(acceptedSessions.map((session) => session.sessionId));
  const roleLayerContexts = acceptedSessions.map((session) =>
    roleLayerContextFromSession(session, rolloutPlans),
  );

  const analysisMaterial: Pass6PreparedMaterialItem[] = [];
  const boundaryRoleLimitMaterial: Pass6PreparedMaterialItem[] = [];
  const gapRiskNoDropMaterial: Pass6PreparedMaterialItem[] = [];
  const documentSourceSignalMaterial: Pass6PreparedMaterialItem[] = [];

  for (const session of acceptedSessions) {
    const outputs = repos.firstPassExtractionOutputs
      .findBySessionId(session.sessionId)
      .filter((output) => ACCEPTED_PASS5_EXTRACTION_STATUSES.has(output.extractionStatus));

    for (const output of outputs) {
      const sequenceItem = sequenceMapMaterial(output);
      if (sequenceItem) analysisMaterial.push(sequenceItem);

      for (const item of output.extractedSteps) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "extracted_step", "truth_lens:execution_evidence"));
      }
      for (const item of output.extractedDecisionPoints) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "decision_point", "truth_lens:approval_control_evidence"));
      }
      for (const item of output.extractedHandoffs) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "handoff", "truth_lens:handoff_dependency_evidence"));
      }
      for (const item of output.extractedExceptions) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "exception", "truth_lens:execution_evidence"));
      }
      for (const item of output.extractedSystems) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "system_tool", "truth_lens:execution_evidence"));
      }
      for (const item of output.extractedControls) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "control", "truth_lens:approval_control_evidence"));
      }
      for (const item of output.extractedDependencies) {
        analysisMaterial.push(materialFromExtractionItem(output, item, "dependency", "truth_lens:handoff_dependency_evidence"));
      }

      const extractedItems = [
        ...output.extractedSteps,
        ...output.extractedDecisionPoints,
        ...output.extractedHandoffs,
        ...output.extractedExceptions,
        ...output.extractedSystems,
        ...output.extractedControls,
        ...output.extractedDependencies,
        ...output.extractedUnknowns,
      ];
      for (const item of extractedItems) {
        for (const reason of extractionItemRiskReasons(item)) {
          gapRiskNoDropMaterial.push(riskMaterialFromExtractionItem(output, item, reason));
        }
      }

      for (const signal of output.boundarySignals) {
        boundaryRoleLimitMaterial.push(boundaryMaterial(signal));
      }
      for (const candidate of output.clarificationCandidates) {
        const material = clarificationMaterial(candidate);
        if (RESOLVED_CLARIFICATION_STATUSES.has(candidate.status)) {
          analysisMaterial.push(material);
        }
        if (OPEN_OR_RISK_CLARIFICATION_STATUSES.has(candidate.status)) {
          gapRiskNoDropMaterial.push(material);
        }
      }
      for (const item of output.unmappedContentItems) {
        gapRiskNoDropMaterial.push(unmappedMaterial(item));
      }
      for (const defect of output.extractionDefects) {
        gapRiskNoDropMaterial.push(defectMaterial(defect, output));
      }
      for (const dispute of output.evidenceDisputes) {
        gapRiskNoDropMaterial.push(disputeMaterial(dispute));
      }
    }

    for (const signal of repos.boundarySignals.findBySessionId(session.sessionId)) {
      boundaryRoleLimitMaterial.push(boundaryMaterial(signal));
    }
    for (const candidate of repos.clarificationCandidates.findBySessionId(session.sessionId)) {
      const material = clarificationMaterial(candidate);
      if (RESOLVED_CLARIFICATION_STATUSES.has(candidate.status)) {
        analysisMaterial.push(material);
      }
      if (OPEN_OR_RISK_CLARIFICATION_STATUSES.has(candidate.status)) {
        gapRiskNoDropMaterial.push(material);
      }
    }
    for (const dispute of repos.evidenceDisputes.findBySessionId(session.sessionId)) {
      gapRiskNoDropMaterial.push(disputeMaterial(dispute));
    }
  }

  for (const candidate of repos.pass6HandoffCandidates.findByCaseId(input.caseId)) {
    if (candidate.adminDecision !== "dismissed" && candidate.sessionIds.some((sessionId) => acceptedSessionIds.has(sessionId))) {
      gapRiskNoDropMaterial.push(handoffCandidateMaterial(candidate));
    }
  }

  for (const plan of rolloutPlans) {
    for (const signal of plan.sourceSignalsUsed) {
      documentSourceSignalMaterial.push(sourceSignalMaterial(signal));
    }
    for (const seed of plan.questionHintSeeds) {
      documentSourceSignalMaterial.push(questionHintMaterial(seed));
    }
    if (plan.recommendationPacketSummary) {
      for (const signal of plan.recommendationPacketSummary.sourceSignalsUsed) {
        documentSourceSignalMaterial.push(sourceSignalMaterial(signal));
      }
      for (const seed of plan.recommendationPacketSummary.questionHintSeeds) {
        documentSourceSignalMaterial.push(questionHintMaterial(seed));
      }
    }
  }

  const analysis_material = uniqueBy(analysisMaterial, (item) => item.itemId);
  const boundary_role_limit_material = uniqueBy(boundaryRoleLimitMaterial, (item) => item.itemId);
  const gap_risk_no_drop_material = uniqueBy(gapRiskNoDropMaterial, (item) => item.itemId);
  const document_source_signal_material = uniqueBy(documentSourceSignalMaterial, (item) => item.itemId);

  const missingOptionalContext: string[] = [];
  if (rolloutPlans.length === 0) {
    missingOptionalContext.push("targeting_rollout_plan");
  }
  for (const session of acceptedSessions) {
    if (!session.participantContactProfileId) missingOptionalContext.push(`participant_contact:${session.sessionId}`);
    if (!session.targetCandidateId) missingOptionalContext.push(`target_candidate:${session.sessionId}`);
  }

  const openRiskCandidateOnlyCount =
    gap_risk_no_drop_material.length + boundary_role_limit_material.length;
  const adminReviewRecommended = openRiskCandidateOnlyCount > 0;

  const bundle: SynthesisInputBundle = {
    bundleId: input.bundleId ?? `sib:${safeIdPart(input.caseId)}:${Date.parse(now) || Date.now()}`,
    caseId: input.caseId,
    createdAt: now,
    sourcePass5SessionIds: acceptedSessions.map((session) => session.sessionId),
    analysis_material,
    boundary_role_limit_material,
    gap_risk_no_drop_material,
    document_source_signal_material,
    roleLayerContexts,
    truthLensContexts: DEFAULT_TRUTH_LENS_CONTEXTS,
    preparationSummary: {
      preparedBy: adminReviewRecommended ? "system_with_admin_review" : "system",
      summary: [
        `Prepared ${acceptedSessions.length} accepted Pass 5 session(s) for later synthesis.`,
        `Folders: analysis=${analysis_material.length}, boundary=${boundary_role_limit_material.length}, gapRiskNoDrop=${gap_risk_no_drop_material.length}, documentSourceSignals=${document_source_signal_material.length}.`,
        `Open/risk/candidate-only item count=${openRiskCandidateOnlyCount}.`,
        adminReviewRecommended ? "Admin review is recommended before synthesis." : "No open risk material was detected by preparation sorting.",
        missingOptionalContext.length > 0 ? `Missing optional context: ${uniqueBy(missingOptionalContext, (item) => item).join(", ")}.` : "No optional context gaps noted.",
      ].join(" "),
      acceptedPass5Only: true,
      doesNotRevalidatePass5: true,
      noDropNotes: [
        "6A trusts accepted Pass 5 processing status and does not redo extraction or evidence validation.",
        "Unresolved, disputed, defective, low-confidence, and candidate-only material is preserved without upgrading it to workflow truth.",
        "Document/source signals are preserved as signals only and are not treated as operational truth.",
        `createdAt=${now}`,
      ],
    },
  };

  const validation = validateSynthesisInputBundle(bundle);
  if (!validation.ok) {
    return {
      ok: false,
      error: `Invalid SynthesisInputBundle: ${validationErrorText(validation.errors)}`,
    };
  }

  if (input.persist !== false && repos.synthesisInputBundles) {
    repos.synthesisInputBundles.save({
      ...bundle,
      updatedAt: now,
    });
  }

  return { ok: true, bundle };
}

function reviewSummaryForBundle(bundle: SynthesisInputBundle): SynthesisInputBundleReviewSummary {
  const folderCounts = {
    analysis_material: bundle.analysis_material.length,
    boundary_role_limit_material: bundle.boundary_role_limit_material.length,
    gap_risk_no_drop_material: bundle.gap_risk_no_drop_material.length,
    document_source_signal_material: bundle.document_source_signal_material.length,
  };
  const missingOptionalContextNotes = bundle.preparationSummary.summary
    .split(".")
    .map((part) => part.trim())
    .filter((part) => part.toLowerCase().startsWith("missing optional context"));
  const openRiskCandidateOnlyCount =
    bundle.gap_risk_no_drop_material.length + bundle.boundary_role_limit_material.length;

  return {
    bundleId: bundle.bundleId,
    caseId: bundle.caseId,
    createdAt: bundle.createdAt,
    sourcePass5SessionIds: bundle.sourcePass5SessionIds,
    sessionCount: bundle.sourcePass5SessionIds.length,
    folderCounts,
    openRiskCandidateOnlyCount,
    adminReviewRecommendedBeforeSynthesis:
      bundle.preparationSummary.preparedBy === "system_with_admin_review" ||
      openRiskCandidateOnlyCount > 0,
    missingOptionalContextNotes,
    boundaryWarnings: [
      "6A prepares accepted Pass 5 material only.",
      "No workflow synthesis has occurred.",
      "No workflow readiness evaluation has occurred.",
      "No package generation has occurred.",
      "Risk, disputed, defective, unresolved, low-confidence, and candidate-only material is not workflow truth.",
      "Document/source signals are signals only and are not operational truth by default.",
    ],
  };
}

export function summarizeSynthesisInputBundleForReview(
  bundle: SynthesisInputBundle,
): SynthesisInputBundleReviewSummary {
  return reviewSummaryForBundle(bundle);
}

export function getSynthesisInputBundleReviewDetail(
  bundle: SynthesisInputBundle,
): SynthesisInputBundleReviewDetail {
  const preparationSummary = reviewSummaryForBundle(bundle);
  return {
    identity: {
      bundleId: bundle.bundleId,
      caseId: bundle.caseId,
      createdAt: bundle.createdAt,
      sourcePass5SessionIds: bundle.sourcePass5SessionIds,
    },
    preparationSummary,
    folders: {
      analysis_material: bundle.analysis_material,
      boundary_role_limit_material: bundle.boundary_role_limit_material,
      gap_risk_no_drop_material: bundle.gap_risk_no_drop_material,
      document_source_signal_material: bundle.document_source_signal_material,
    },
    roleLayerContexts: bundle.roleLayerContexts,
    truthLensContexts: bundle.truthLensContexts,
    riskOpenItems: bundle.gap_risk_no_drop_material,
    documentSourceSignals: bundle.document_source_signal_material,
    boundaryWarnings: preparationSummary.boundaryWarnings,
  };
}

export function listSynthesisInputBundlesForReview(
  repo: SynthesisInputBundleRepository,
): StoredSynthesisInputBundle[] {
  return repo.findAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findSynthesisInputBundleForReview(
  bundleId: string,
  repo: SynthesisInputBundleRepository,
): StoredSynthesisInputBundle | null {
  return repo.findById(bundleId);
}

export function createSynthesisInputBundleForAdminReview(
  input: Omit<BuildSynthesisInputBundleInput, "persist">,
  repos: BuildSynthesisInputBundleRepositories & { synthesisInputBundles: SynthesisInputBundleRepository },
): BuildSynthesisInputBundleResult {
  const result = buildSynthesisInputBundleFromPass5(
    {
      ...input,
      persist: false,
    },
    repos,
  );
  if (!result.ok) return result;
  if (result.bundle.sourcePass5SessionIds.length === 0) {
    return {
      ok: false,
      error: `No eligible accepted Pass 5 outputs found for case '${input.caseId}'.`,
    };
  }
  repos.synthesisInputBundles.save({
    ...result.bundle,
    updatedAt: input.now ?? result.bundle.createdAt,
  });
  return result;
}

// ---------------------------------------------------------------------------
// Synthesis — §19
// ---------------------------------------------------------------------------

/**
 * Validate a SynthesisRecord payload, reject duplicate IDs, persist a
 * StoredSynthesisRecord with server-assigned createdAt. §19.3 difference-block
 * structure and §19.11 minimum output fields are enforced by the schema.
 */
export function createSynthesis(
  payload: unknown,
  repo: SynthesisRepository,
): SynthesisResult {
  const result = validateSynthesisRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return {
      ok: false,
      error: `Invalid SynthesisRecord: ${messages}`,
    };
  }

  const record: SynthesisRecord = result.value;

  const existing = repo.findById(record.synthesisId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Synthesis with id '${record.synthesisId}' already exists.`,
    };
  }

  const stored: StoredSynthesisRecord = {
    ...record,
    createdAt: new Date().toISOString(),
  };

  repo.save(stored);
  return { ok: true, synthesis: stored };
}

export function getSynthesis(
  synthesisId: string,
  repo: SynthesisRepository,
): StoredSynthesisRecord | null {
  return repo.findById(synthesisId);
}

export function listSynthesis(
  repo: SynthesisRepository,
): StoredSynthesisRecord[] {
  return repo.findAll();
}

export function listSynthesisByCaseId(
  caseId: string,
  repo: SynthesisRepository,
): StoredSynthesisRecord[] {
  return repo.findByCaseId(caseId);
}

// ---------------------------------------------------------------------------
// Pass 6 configuration and policy control — Block 3
// ---------------------------------------------------------------------------

export const PASS6_LOCKED_GOVERNANCE_RULES: readonly Pass6LockedGovernanceRule[] = [
  {
    ruleId: "pass6a_no_pass5_revalidation",
    label: "Pass 6A does not redo Pass 5",
    description: "Synthesis input preparation consumes accepted Pass 5 outputs only and does not revalidate Pass 5.",
    locked: true,
  },
  {
    ruleId: "document_source_claims_are_signals",
    label: "Document/source claims are signals",
    description: "Document and source claims are signals, not operational truth by default.",
    locked: true,
  },
  {
    ruleId: "candidate_items_not_truth",
    label: "Candidate items are not workflow truth",
    description: "Unresolved, disputed, defective, and candidate-only items are not upgraded into workflow truth by configuration.",
    locked: true,
  },
  {
    ruleId: "scores_do_not_approve_packages",
    label: "Scores do not approve packages",
    description: "Scores and thresholds can surface review needs but cannot approve packages automatically.",
    locked: true,
  },
  {
    ruleId: "material_conflicts_require_review",
    label: "Material conflicts require handling",
    description: "Material conflicts require admin or review handling and cannot be suppressed through admin config.",
    locked: true,
  },
  {
    ruleId: "six_c_requires_readiness_or_warning_approval",
    label: "6C package generation is readiness-bound",
    description: "6C cannot generate a full Initial Package unless readiness allows it or admin explicitly proceeds with warnings.",
    locked: true,
  },
  {
    ruleId: "visual_renderers_do_not_own_truth",
    label: "Visual renderers do not own workflow truth",
    description: "Visual renderers validate and render; WDE owns workflow truth and graph construction.",
    locked: true,
  },
  {
    ruleId: "copilot_read_only_default",
    label: "Copilot is read-only by default",
    description: "Pass 6 Copilot context is read-only by default and has no write authority.",
    locked: true,
  },
] as const;

function defaultPolicies(): Pass6PolicySet {
  return {
    claimScoringPolicy: {
      weights: [
        { factorKey: "evidence_strength", label: "Evidence strength", weight: 0.35 },
        { factorKey: "source_agreement", label: "Source agreement", weight: 0.25 },
        { factorKey: "role_authority_fit", label: "Role authority fit", weight: 0.2 },
        { factorKey: "recency_context", label: "Recency/context fit", weight: 0.2 },
      ],
      adminReviewTriggerThreshold: 0.45,
    },
    materialityPolicy: {
      weights: [
        { factorKey: "customer_impact", label: "Customer impact", weight: 0.3 },
        { factorKey: "control_or_compliance_impact", label: "Control or compliance impact", weight: 0.3 },
        { factorKey: "handoff_impact", label: "Handoff impact", weight: 0.2 },
        { factorKey: "frequency", label: "Frequency", weight: 0.2 },
      ],
      materialConflictReviewThreshold: 0.65,
    },
    differenceSeverityPolicy: {
      thresholds: [
        { thresholdKey: "warning", label: "Warning threshold", value: 0.4 },
        { thresholdKey: "blocker", label: "Blocker threshold", value: 0.75 },
      ],
      adminReviewTriggerThreshold: 0.6,
    },
    methodRegistryConfig: {
      defaultSelectionPreference: "Use active preferred methods when relevant; do not force every method.",
      methods: [
        { methodKey: "bpmn_process_structure", label: "BPMN / Process Structure Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "sipoc_boundary", label: "SIPOC Boundary Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "triangulation", label: "Triangulation Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "espoused_theory_vs_theory_in_use", label: "Espoused Theory vs Theory-in-Use Lens", active: true, defaultPreference: "available" },
        { methodKey: "raci_responsibility", label: "RACI / Responsibility Lens", active: true, defaultPreference: "preferred" },
        { methodKey: "ssm_multi_perspective", label: "SSM / Multi-Perspective Lens", active: true, defaultPreference: "available" },
        { methodKey: "apqc_vocabulary", label: "APQC Vocabulary Lens", active: true, defaultPreference: "available" },
      ],
    },
    layerFitPolicy: {
      assumptions: [
        "Participant statements are strongest for work the participant performs or directly observes.",
        "Manager statements may clarify policy and boundaries but do not erase participant-level variants.",
      ],
      documentSourceInfluenceWeights: [
        { factorKey: "approved_policy", label: "Approved policy/source document", weight: 0.35 },
        { factorKey: "participant_narrative", label: "Participant narrative", weight: 0.4 },
        { factorKey: "admin_note", label: "Admin note", weight: 0.25 },
      ],
    },
    sevenConditionPolicy: {
      conditions: [
        { conditionKey: "core_sequence_continuity", label: "Core sequence continuity", helperText: "Can the core sequence be followed?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "step_to_step_connection", label: "Step-to-step connection", helperText: "Are transitions sufficiently connected?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "essential_step_requirements", label: "Essential step requirements", helperText: "Are required inputs and outputs clear enough?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "decision_rules_thresholds", label: "Decision rules and thresholds", helperText: "Are decision rules clear enough for package use?", warningThreshold: 0.4, blockerThreshold: 0.7 },
        { conditionKey: "handoffs_responsibility", label: "Handoffs and responsibility", helperText: "Are owners and handoffs clear enough?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "controls_approvals", label: "Controls and approvals", helperText: "Are control and approval points clear enough?", warningThreshold: 0.45, blockerThreshold: 0.75 },
        { conditionKey: "use_case_boundary", label: "Use-case boundary", helperText: "Is the workflow boundary clear enough?", warningThreshold: 0.4, blockerThreshold: 0.7 },
      ],
      warningVsBlockerThresholds: [
        { thresholdKey: "warning_default", label: "Warning default", value: 0.45 },
        { thresholdKey: "blocker_default", label: "Blocker default", value: 0.75 },
      ],
    },
    readinessRoutingPolicy: {
      warningThreshold: 0.45,
      blockerThreshold: 0.75,
      adminReviewTriggerThreshold: 0.6,
      proceedWithWarningsMessageTemplate: "Proceed with warnings only when admin accepts the stated limitations.",
    },
    prePackageGatePolicy: {
      clarificationPriorityThreshold: 0.6,
      reviewDecisionThreshold: 0.7,
    },
    packageOutputPolicy: {
      clientFacingVisibility: ["current_workflow", "warnings", "interfaces"],
      adminInternalVisibility: ["claim_basis", "method_usage", "condition_assessment", "unresolved_items"],
      packageWarningLanguageTemplate: "This package contains known limitations: {{warnings}}",
      optionalDraftDocumentEligibilityThreshold: 0.8,
      methodologyReportSections: ["method_usage", "evidence_basis", "condition_summary"],
      tableLayoutPreference: "compact_admin_review",
    },
    visualMapPolicy: {
      markerPreferences: ["warning_badge", "unresolved_marker", "external_interface_marker"],
      showWarnings: true,
      showUnresolved: true,
    },
    promptBehaviorProfile: {
      profileName: "default-prompt-behavior-placeholder",
      promptWorkspaceOwned: true,
      behaviorNotes: ["Prompt behavior is visible here as a profile reference; prompt editing belongs to the later Prompt Workspace block."],
    },
  };
}

function validateProfile(profile: Pass6ConfigurationProfile): { ok: true } | { ok: false; error: string } {
  const result = validatePass6ConfigurationProfile(profile);
  if (!result.ok) {
    return { ok: false, error: result.errors.map((error) => error.message ?? String(error)).join("; ") };
  }
  return { ok: true };
}

export function createDefaultPass6ConfigurationDraft(input: {
  configId?: string;
  changedBy: string;
  changeReason: string;
  now?: string;
  basedOnConfigId?: string;
  policies?: Pass6PolicySet;
}): StoredPass6ConfigurationProfile {
  const now = input.now ?? new Date().toISOString();
  return {
    configId: input.configId ?? `pass6-config-${Date.now()}`,
    version: "1.0.0",
    status: "draft",
    scope: "global",
    changedBy: input.changedBy,
    changedAt: now,
    changeReason: input.changeReason,
    basedOnConfigId: input.basedOnConfigId,
    policies: input.policies ?? defaultPolicies(),
    lockedGovernanceRules: PASS6_LOCKED_GOVERNANCE_RULES.map((rule) => ({ ...rule })),
  };
}

export function savePass6ConfigurationProfile(
  profile: Pass6ConfigurationProfile,
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const validation = validateProfile(profile);
  if (!validation.ok) return validation;
  repo.save(profile);
  return { ok: true, profile };
}

export function listPass6ConfigurationProfiles(
  repo: Pass6ConfigurationProfileRepository,
): StoredPass6ConfigurationProfile[] {
  return repo.findAll();
}

export function findActivePass6ConfigurationProfile(
  repo: Pass6ConfigurationProfileRepository,
): StoredPass6ConfigurationProfile | null {
  return repo.findActive("global", "");
}

export function compareActiveVsDraftPass6Configuration(
  repo: Pass6ConfigurationProfileRepository,
): { activeConfigId: string | null; draftConfigId: string | null; changedSections: string[]; summary: string } {
  const active = repo.findActive("global", "");
  const draft = repo.findDrafts()[0] ?? null;
  if (!active || !draft) {
    return { activeConfigId: active?.configId ?? null, draftConfigId: draft?.configId ?? null, changedSections: [], summary: "Active and draft profiles are not both available." };
  }
  const changedSections = Object.keys(draft.policies).filter((key) =>
    JSON.stringify(draft.policies[key as keyof Pass6PolicySet]) !== JSON.stringify(active.policies[key as keyof Pass6PolicySet])
  );
  return {
    activeConfigId: active.configId,
    draftConfigId: draft.configId,
    changedSections,
    summary: changedSections.length === 0 ? "No policy section differences." : `${changedSections.length} policy section(s) differ.`,
  };
}

export function updatePass6ConfigurationDraft(
  configId: string,
  updates: {
    policies?: Pass6PolicySet;
    lockedGovernanceRules?: Pass6LockedGovernanceRule[];
    changedBy: string;
    changeReason: string;
    now?: string;
  },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  if (updates.lockedGovernanceRules !== undefined) {
    return { ok: false, error: "Locked governance rules are visible but not editable through Pass 6 admin configuration." };
  }
  const existing = repo.findById(configId);
  if (!existing) return { ok: false, error: `Config '${configId}' not found.` };
  if (existing.status !== "draft") return { ok: false, error: "Only draft config profiles can be edited." };
  const updated: StoredPass6ConfigurationProfile = {
    ...existing,
    policies: updates.policies ?? existing.policies,
    changedBy: updates.changedBy,
    changedAt: updates.now ?? new Date().toISOString(),
    changeReason: updates.changeReason,
    lockedGovernanceRules: PASS6_LOCKED_GOVERNANCE_RULES.map((rule) => ({ ...rule })),
  };
  return savePass6ConfigurationProfile(updated, repo);
}

export function promotePass6ConfigurationDraft(
  draftConfigId: string,
  input: { changedBy: string; changeReason: string; now?: string },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; active: StoredPass6ConfigurationProfile; previous: StoredPass6ConfigurationProfile | null } | { ok: false; error: string } {
  const draft = repo.findById(draftConfigId);
  if (!draft) return { ok: false, error: `Draft config '${draftConfigId}' not found.` };
  if (draft.status !== "draft") return { ok: false, error: "Only draft config profiles can be promoted." };
  const now = input.now ?? new Date().toISOString();
  const currentActive = repo.findActive(draft.scope, draft.scopeRef ?? "");
  let previous: StoredPass6ConfigurationProfile | null = null;
  if (currentActive) {
    previous = {
      ...currentActive,
      status: "previous",
      changedBy: input.changedBy,
      changedAt: now,
      changeReason: `Superseded by ${draft.configId}. ${input.changeReason}`,
      previousVersionConfigId: currentActive.previousVersionConfigId,
    };
    repo.save(previous);
  }
  const active: StoredPass6ConfigurationProfile = {
    ...draft,
    status: "active",
    changedBy: input.changedBy,
    changedAt: now,
    changeReason: input.changeReason,
    previousVersionConfigId: previous?.configId,
    effectiveFrom: now,
    lockedGovernanceRules: PASS6_LOCKED_GOVERNANCE_RULES.map((rule) => ({ ...rule })),
  };
  repo.save(active);
  return { ok: true, active, previous };
}

export function archivePass6ConfigurationProfile(
  configId: string,
  input: { changedBy: string; changeReason: string; now?: string },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const existing = repo.findById(configId);
  if (!existing) return { ok: false, error: `Config '${configId}' not found.` };
  if (existing.status === "active") return { ok: false, error: "Active config must be superseded before archive." };
  const archived = { ...existing, status: "archived" as const, changedBy: input.changedBy, changedAt: input.now ?? new Date().toISOString(), changeReason: input.changeReason };
  repo.save(archived);
  return { ok: true, profile: archived };
}

export function rollbackPass6ConfigurationProfile(
  previousConfigId: string,
  input: { newConfigId: string; changedBy: string; changeReason: string; now?: string },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; draft: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const previous = repo.findById(previousConfigId);
  if (!previous) return { ok: false, error: `Rollback source '${previousConfigId}' not found.` };
  const draft = createDefaultPass6ConfigurationDraft({
    configId: input.newConfigId,
    changedBy: input.changedBy,
    changeReason: input.changeReason,
    now: input.now,
    basedOnConfigId: previous.configId,
    policies: previous.policies,
  });
  const stored = { ...draft, rollbackReference: previous.configId };
  repo.save(stored);
  return { ok: true, draft: stored };
}

// ---------------------------------------------------------------------------
// Pass 6B Method Registry and Analysis Policy — Block 8
// ---------------------------------------------------------------------------

export type Pass6AnalysisMethodType =
  | "methodology"
  | "lens"
  | "tool"
  | "vocabulary_support";

export type Pass6MethodProblemType =
  | "step_order_process_structure_handoff_sequence"
  | "start_end_input_output_trigger_use_case_boundary"
  | "claim_support_repeated_evidence_disagreement_support_map"
  | "policy_document_management_view_vs_frontline_practice"
  | "ownership_approval_accountability_handoff_responsibility"
  | "different_layers_or_departments_see_different_realities"
  | "process_naming_terminology_process_family_alignment";

export interface Pass6MethodRegistryItem {
  methodId: string;
  methodKey: AnalysisMethodKey;
  displayName: string;
  methodType: Pass6AnalysisMethodType;
  shortDefinition: string;
  normalUseCases: string[];
  requiredInputs: string[];
  expectedOutputs: string[];
  scoringOrClassificationImpact: string[];
  limitations: string[];
  hardBoundaries: string[];
  active: boolean;
  methodVersion: string;
  adminFacingDescription: string;
  defaultPreference: "preferred" | "available" | "off_by_default";
}

export interface Pass6MethodSelectionRule {
  ruleId: string;
  problemType: Pass6MethodProblemType;
  problemSignals: string[];
  primaryMethodKey: AnalysisMethodKey;
  rationale: string;
}

export interface Pass6ConditionalMultiLensPolicy {
  policyId: string;
  steps: string[];
  additionalLensTriggers: string[];
  complementaryFindingHandling: string;
  supportingFindingHandling: string;
  conflictingFindingHandling: string;
  hardBoundaries: string[];
}

export interface Pass6MethodRegistryAdminView {
  configProfileId: string | null;
  methods: Pass6MethodRegistryItem[];
  defaultSelectionRules: Pass6MethodSelectionRule[];
  conditionalMultiLensPolicy: Pass6ConditionalMultiLensPolicy;
  lockedBoundaries: string[];
  adminForcedMethodRule: string;
  traceabilityShape: {
    systemSelectedExample: AnalysisMethodUsage;
    adminForcedExample: AnalysisMethodUsage;
  };
}

const METHOD_LOCKED_BOUNDARIES = [
  "Methods cannot invent evidence.",
  "Methods cannot override Pass 5 status.",
  "Methods cannot treat document claims as operational truth by default.",
  "Methods cannot approve readiness alone.",
  "Methods cannot rank employees or evaluate employee performance.",
  "Methods cannot override admin decision for material conflicts.",
  "Methods cannot run every method on every claim by default.",
  "Methods cannot hide method selection from admin inspection.",
  "Methods cannot merge conflicting outputs into a fake clean workflow.",
];

const PASS6_METHOD_REGISTRY_BASE: readonly Omit<Pass6MethodRegistryItem, "active" | "defaultPreference">[] = [
  {
    methodId: "method-bpmn-process-structure-v1",
    methodKey: "bpmn_process_structure",
    displayName: "BPMN / Process Structure Lens",
    methodType: "lens",
    shortDefinition: "Inspects step order, sequence, handoffs, decisions, and process structure.",
    normalUseCases: ["step order", "process structure", "handoff sequence", "decision placement"],
    requiredInputs: ["workflow units or claims with action/sequence/handoff signals", "evidence/source basis references"],
    expectedOutputs: ["process-structure classification", "sequence and transition notes", "structural caveats"],
    scoringOrClassificationImpact: ["may affect workflow unit classification later", "may inform sequence clarity later"],
    limitations: ["Does not prove evidence truth.", "Does not generate BPMN diagrams in Block 8."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when the problem is about ordering steps, handoffs, decisions, and process structure.",
  },
  {
    methodId: "method-sipoc-boundary-v1",
    methodKey: "sipoc_boundary",
    displayName: "SIPOC Boundary Lens",
    methodType: "lens",
    shortDefinition: "Frames suppliers, inputs, process, outputs, customers, triggers, and use-case boundaries.",
    normalUseCases: ["start/end boundary", "input/output", "trigger", "use-case boundary"],
    requiredInputs: ["boundary material", "trigger/input/output signals", "role or layer context"],
    expectedOutputs: ["boundary classification", "input/output notes", "scope caveats"],
    scoringOrClassificationImpact: ["may affect boundary classification later", "may surface use-case scope risk later"],
    limitations: ["Does not resolve disputed boundaries by itself."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when the problem is about where the workflow starts, ends, and what inputs or outputs define scope.",
  },
  {
    methodId: "method-triangulation-v1",
    methodKey: "triangulation",
    displayName: "Triangulation Lens",
    methodType: "methodology",
    shortDefinition: "Compares support, repetition, gaps, and disagreements across evidence sources.",
    normalUseCases: ["claim support", "repeated evidence", "disagreement map", "source corroboration"],
    requiredInputs: ["evidence/source basis references", "role/layer context", "candidate claim or unit references later"],
    expectedOutputs: ["support map", "agreement/disagreement notes", "confidence-support caveats"],
    scoringOrClassificationImpact: ["may support confidence later", "may flag disagreement later"],
    limitations: ["Does not upgrade unsupported material into truth."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when the problem is whether multiple sources support, contradict, or leave gaps around a claim.",
  },
  {
    methodId: "method-espoused-theory-vs-theory-in-use-v1",
    methodKey: "espoused_theory_vs_theory_in_use",
    displayName: "Espoused Theory vs Theory-in-Use Lens",
    methodType: "lens",
    shortDefinition: "Separates stated policy or management intent from frontline described practice.",
    normalUseCases: ["policy versus practice", "document view versus frontline practice", "management view mismatch"],
    requiredInputs: ["document/source signals", "participant practice evidence", "role/layer context"],
    expectedOutputs: ["normative/reality comparison notes", "document-sensitivity caveats"],
    scoringOrClassificationImpact: ["may flag normative-reality mismatch later", "may trigger difference handling later"],
    limitations: ["Document claims remain signals unless supported by operational evidence."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when documents, policies, or management descriptions may differ from frontline practice.",
  },
  {
    methodId: "method-raci-responsibility-v1",
    methodKey: "raci_responsibility",
    displayName: "RACI / Responsibility Lens",
    methodType: "tool",
    shortDefinition: "Inspects responsibility, accountability, consultation, information flow, handoffs, and approvals.",
    normalUseCases: ["ownership", "approval", "accountability", "handoff responsibility"],
    requiredInputs: ["role/layer context", "handoff or approval signals", "evidence basis references"],
    expectedOutputs: ["responsibility classification", "ownership caveats", "handoff responsibility notes"],
    scoringOrClassificationImpact: ["may affect ownership classification later", "may flag approval responsibility risks later"],
    limitations: ["Does not assign employee performance responsibility."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when the question is who owns, approves, performs, or receives a workflow handoff.",
  },
  {
    methodId: "method-ssm-multi-perspective-v1",
    methodKey: "ssm_multi_perspective",
    displayName: "SSM / Multi-Perspective Lens",
    methodType: "methodology",
    shortDefinition: "Preserves different stakeholder/layer realities without forcing them into one clean account.",
    normalUseCases: ["layer-sensitive disagreements", "cross-department variants", "different realities by role"],
    requiredInputs: ["role/layer context", "differences or candidate conflicts later", "source basis references"],
    expectedOutputs: ["perspective map", "layer-sensitive caveats", "unmerged conflict notes"],
    scoringOrClassificationImpact: ["may trigger difference routing later", "may prevent false merge later"],
    limitations: ["Does not choose the winning reality without admin/review basis."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when different departments, layers, or roles describe materially different versions of reality.",
  },
  {
    methodId: "method-apqc-vocabulary-v1",
    methodKey: "apqc_vocabulary",
    displayName: "APQC Vocabulary Lens",
    methodType: "vocabulary_support",
    shortDefinition: "Supports process naming, terminology normalization, and process-family alignment.",
    normalUseCases: ["process naming", "terminology", "process-family alignment", "label normalization"],
    requiredInputs: ["candidate workflow/process labels", "domain or department context", "source vocabulary hints"],
    expectedOutputs: ["terminology suggestions", "process-family alignment notes", "label caveats"],
    scoringOrClassificationImpact: ["may affect naming support later", "must not affect truth by itself"],
    limitations: ["Vocabulary support cannot determine operational truth."],
    hardBoundaries: METHOD_LOCKED_BOUNDARIES,
    methodVersion: "1.0.0",
    adminFacingDescription: "Use when the problem is naming, terminology, or process family alignment, not evidence truth.",
  },
] as const;

const PASS6_DEFAULT_METHOD_SELECTION_RULES: readonly Pass6MethodSelectionRule[] = [
  {
    ruleId: "select-bpmn-for-process-structure",
    problemType: "step_order_process_structure_handoff_sequence",
    problemSignals: ["step order", "process structure", "handoff sequence"],
    primaryMethodKey: "bpmn_process_structure",
    rationale: "Sequence and handoff structure are best inspected first through the BPMN / Process Structure Lens.",
  },
  {
    ruleId: "select-sipoc-for-boundary",
    problemType: "start_end_input_output_trigger_use_case_boundary",
    problemSignals: ["start", "end", "input", "output", "trigger", "use-case boundary"],
    primaryMethodKey: "sipoc_boundary",
    rationale: "Boundary, input, output, and trigger questions are best framed through SIPOC.",
  },
  {
    ruleId: "select-triangulation-for-support",
    problemType: "claim_support_repeated_evidence_disagreement_support_map",
    problemSignals: ["claim support", "repeated evidence", "disagreement support map"],
    primaryMethodKey: "triangulation",
    rationale: "Support and disagreement questions require source comparison.",
  },
  {
    ruleId: "select-espoused-for-policy-practice",
    problemType: "policy_document_management_view_vs_frontline_practice",
    problemSignals: ["policy", "document", "management view", "frontline practice"],
    primaryMethodKey: "espoused_theory_vs_theory_in_use",
    rationale: "Normative/document descriptions must be separated from described in-use practice.",
  },
  {
    ruleId: "select-raci-for-responsibility",
    problemType: "ownership_approval_accountability_handoff_responsibility",
    problemSignals: ["ownership", "approval", "accountability", "handoff responsibility"],
    primaryMethodKey: "raci_responsibility",
    rationale: "Responsibility and approval questions are best inspected through RACI.",
  },
  {
    ruleId: "select-ssm-for-layer-sensitive-reality",
    problemType: "different_layers_or_departments_see_different_realities",
    problemSignals: ["different layers", "different departments", "different realities"],
    primaryMethodKey: "ssm_multi_perspective",
    rationale: "Layer-sensitive realities should be preserved instead of flattened.",
  },
  {
    ruleId: "select-apqc-for-vocabulary",
    problemType: "process_naming_terminology_process_family_alignment",
    problemSignals: ["process naming", "terminology", "process-family alignment"],
    primaryMethodKey: "apqc_vocabulary",
    rationale: "Vocabulary and process-family support belongs to APQC vocabulary support.",
  },
] as const;

export const PASS6_CONDITIONAL_MULTI_LENS_POLICY: Pass6ConditionalMultiLensPolicy = {
  policyId: "pass6-conditional-multi-lens-v1",
  steps: [
    "Start with the primary method selected by problem type.",
    "Consider additional lenses only when a trigger is present.",
    "Record method usage traceability for later analysis; do not execute claim analysis in Block 8.",
  ],
  additionalLensTriggers: [
    "unclear result",
    "high materiality",
    "low confidence",
    "disputed evidence",
    "document-sensitive material",
    "layer-sensitive material",
  ],
  complementaryFindingHandling: "Complementary findings may be merged later only when they do not conflict.",
  supportingFindingHandling: "Supporting findings may raise confidence later when traceability and policy allow it.",
  conflictingFindingHandling: "Conflicting findings must not be merged and must be routed as differences later.",
  hardBoundaries: METHOD_LOCKED_BOUNDARIES,
};

function configMethodMap(profile: Pass6ConfigurationProfile | null): Map<AnalysisMethodKey, { active: boolean; defaultPreference: "preferred" | "available" | "off_by_default" }> {
  const map = new Map<AnalysisMethodKey, { active: boolean; defaultPreference: "preferred" | "available" | "off_by_default" }>();
  for (const method of profile?.policies.methodRegistryConfig.methods ?? []) {
    map.set(method.methodKey, {
      active: method.active,
      defaultPreference: method.defaultPreference,
    });
  }
  return map;
}

function preferredMethodConfigProfile(
  repo: Pass6ConfigurationProfileRepository,
): StoredPass6ConfigurationProfile | null {
  return repo.findActive("global", "") ?? repo.findDrafts()[0] ?? repo.findAll()[0] ?? null;
}

function traceabilityExamples(): Pass6MethodRegistryAdminView["traceabilityShape"] {
  const systemSelectedExample: AnalysisMethodUsage = {
    methodUsageId: "method-usage-template-system",
    methodId: "method-bpmn-process-structure-v1",
    methodKey: "bpmn_process_structure",
    methodName: "BPMN / Process Structure Lens",
    methodType: "process_structure_lens",
    version: "1.0.0",
    selectionReason: "Selected by default method-selection policy for step order / process structure.",
    selectionSource: "system_selected",
    methodRole: "primary",
    appliedToType: "workflow_unit",
    appliedToId: "later-target-id",
    outputSummary: "Traceability template only; Block 8 does not execute method analysis.",
    impact: {
      affectedIds: [],
      impactSummary: "No impact calculated in Block 8.",
      changedRouting: false,
      changedReadiness: false,
    },
    suitabilityAssessment: {
      suitable: true,
      notes: "Suitability will be assessed by later 6B analysis blocks.",
      limitations: ["Template only; not a real method execution record."],
    },
  };
  const adminForcedExample: AnalysisMethodUsage = {
    ...systemSelectedExample,
    methodUsageId: "method-usage-template-admin-forced",
    methodId: "method-raci-responsibility-v1",
    methodKey: "raci_responsibility",
    methodName: "RACI / Responsibility Lens",
    methodType: "responsibility_lens",
    selectionReason: "Admin forced method for responsibility review.",
    selectionSource: "admin_forced",
    methodRole: "admin_forced",
  };
  return { systemSelectedExample, adminForcedExample };
}

export function resolvePass6MethodRegistryForAdmin(
  repo?: Pass6ConfigurationProfileRepository,
): Pass6MethodRegistryAdminView {
  const profile = repo ? preferredMethodConfigProfile(repo) : null;
  const configuredMethods = configMethodMap(profile);
  const methods = PASS6_METHOD_REGISTRY_BASE.map((method) => {
    const config = configuredMethods.get(method.methodKey);
    return {
      ...method,
      active: config?.active ?? true,
      defaultPreference: config?.defaultPreference ?? "available",
    };
  });
  return {
    configProfileId: profile?.configId ?? null,
    methods,
    defaultSelectionRules: PASS6_DEFAULT_METHOD_SELECTION_RULES.map((rule) => ({ ...rule, problemSignals: [...rule.problemSignals] })),
    conditionalMultiLensPolicy: {
      ...PASS6_CONDITIONAL_MULTI_LENS_POLICY,
      steps: [...PASS6_CONDITIONAL_MULTI_LENS_POLICY.steps],
      additionalLensTriggers: [...PASS6_CONDITIONAL_MULTI_LENS_POLICY.additionalLensTriggers],
      hardBoundaries: [...PASS6_CONDITIONAL_MULTI_LENS_POLICY.hardBoundaries],
    },
    lockedBoundaries: [...METHOD_LOCKED_BOUNDARIES],
    adminForcedMethodRule: "Admins may force a method for later analysis traceability, but forcing a method does not execute analysis, approve truth, or override locked governance.",
    traceabilityShape: traceabilityExamples(),
  };
}

export function findPass6MethodRegistryItem(
  methodKey: AnalysisMethodKey,
  repo?: Pass6ConfigurationProfileRepository,
): Pass6MethodRegistryItem | null {
  return resolvePass6MethodRegistryForAdmin(repo).methods.find((method) => method.methodKey === methodKey) ?? null;
}

export function updatePass6MethodActiveStatus(
  input: {
    configId: string;
    methodKey: AnalysisMethodKey;
    active: boolean;
    changedBy: string;
    changeReason: string;
    now?: string;
  },
  repo: Pass6ConfigurationProfileRepository,
): { ok: true; profile: StoredPass6ConfigurationProfile } | { ok: false; error: string } {
  const profile = repo.findById(input.configId);
  if (!profile) return { ok: false, error: `Config '${input.configId}' not found.` };
  if (profile.status !== "draft") return { ok: false, error: "Only draft config profiles can change method active/inactive status." };
  const methodExists = PASS6_METHOD_REGISTRY_BASE.some((method) => method.methodKey === input.methodKey);
  if (!methodExists) return { ok: false, error: `Unknown Pass 6 method '${input.methodKey}'.` };
  const found = profile.policies.methodRegistryConfig.methods.some((method) => method.methodKey === input.methodKey);
  const methods = found
    ? profile.policies.methodRegistryConfig.methods.map((method) =>
        method.methodKey === input.methodKey ? { ...method, active: input.active } : method,
      )
    : [
        ...profile.policies.methodRegistryConfig.methods,
        {
          methodKey: input.methodKey,
          label: findPass6MethodRegistryItem(input.methodKey)?.displayName ?? input.methodKey,
          active: input.active,
          defaultPreference: "available" as const,
        },
      ];
  return updatePass6ConfigurationDraft(input.configId, {
    policies: {
      ...profile.policies,
      methodRegistryConfig: {
        ...profile.policies.methodRegistryConfig,
        methods,
      },
    },
    changedBy: input.changedBy,
    changeReason: input.changeReason,
    now: input.now,
  }, repo);
}

// ---------------------------------------------------------------------------
// Pass 6B Workflow Unit and Claim Pipeline — Block 9
// ---------------------------------------------------------------------------

export interface BuildWorkflowUnitsAndClaimsInput {
  bundle: SynthesisInputBundle;
  now?: string;
  persist?: boolean;
  configurationProfile?: Pass6ConfigurationProfile | null;
}

export interface BuildWorkflowUnitsAndClaimsRepositories {
  workflowUnits?: WorkflowUnitRepository;
  workflowClaims?: WorkflowClaimRepository;
}

export interface BuildWorkflowUnitsAndClaimsOk {
  ok: true;
  units: StoredWorkflowUnit[];
  claims: StoredWorkflowClaim[];
  policyRefs: string[];
}

export interface BuildWorkflowUnitsAndClaimsError {
  ok: false;
  error: string;
}

export type BuildWorkflowUnitsAndClaimsResult =
  | BuildWorkflowUnitsAndClaimsOk
  | BuildWorkflowUnitsAndClaimsError;

function unitTypeForMaterial(item: Pass6PreparedMaterialItem): WorkflowUnitType {
  const type = item.itemType;
  if (type.includes("sequence")) return "sequence_signal";
  if (type.includes("decision")) return "decision_rule";
  if (type.includes("approval") || type.includes("control")) return "approval_control";
  if (type.includes("handoff") || type.includes("dependency")) return "handoff";
  if (type.includes("exception")) return "exception";
  if (type.includes("boundary")) return "boundary";
  if (type.includes("unmapped") || type.includes("defect") || type.includes("dispute") || type.includes("unknown") || type.includes("clarification_open")) {
    return "unknown_gap";
  }
  if (type.includes("source") || type.includes("document") || type.includes("question_hint")) return "information_context";
  if (type.includes("trigger") || type.includes("input")) return "trigger_input";
  if (type.includes("output") || type.includes("outcome")) return "output_outcome";
  return "action_step";
}

function claimTypeForUnit(unit: WorkflowUnit, material: Pass6PreparedMaterialItem): WorkflowClaimType | null {
  if (unit.unitType === "action_step" || unit.unitType === "exception") return "execution_claim";
  if (unit.unitType === "sequence_signal") return "sequence_claim";
  if (unit.unitType === "decision_rule" || unit.unitType === "approval_control") return "decision_rule_claim";
  if (unit.unitType === "handoff") return "ownership_claim";
  if (unit.unitType === "boundary") return "boundary_claim";
  if (unit.unitType === "information_context" && material.basis.basisType === "source_document") return "boundary_claim";
  if (unit.unitType === "unknown_gap") return "boundary_claim";
  return null;
}

function claimStatusForMaterial(material: Pass6PreparedMaterialItem, folderName: string): WorkflowClaimStatus {
  if (folderName === "analysis_material") {
    return material.basis.basisType === "source_document" ? "warning" : "accepted_for_assembly";
  }
  if (folderName === "document_source_signal_material") return "warning";
  if (folderName === "gap_risk_no_drop_material") {
    if (material.itemType.includes("handoff_candidate") || material.itemType.includes("dispute") || material.itemType.includes("defect")) {
      return "review_needed";
    }
    return "unresolved";
  }
  if (folderName === "boundary_role_limit_material") return "proposed";
  return "proposed";
}

function confidenceForMaterial(material: Pass6PreparedMaterialItem, folderName: string): WorkflowClaim["confidence"] {
  const text = `${material.summary} ${material.notes ?? ""} ${material.basis.summary ?? ""}`.toLowerCase();
  if (folderName === "gap_risk_no_drop_material") return "low";
  if (folderName === "document_source_signal_material") return "unknown";
  if (text.includes("low-confidence") || text.includes("low_confidence") || text.includes("unresolved") || text.includes("dispute")) return "low";
  if (text.includes("accepted") || text.includes("resolved")) return "medium";
  return "medium";
}

function materialityForUnit(unit: WorkflowUnit, material: Pass6PreparedMaterialItem): WorkflowClaim["materiality"] {
  const text = `${unit.unitText} ${material.notes ?? ""} ${material.basis.summary ?? ""}`.toLowerCase();
  if (text.includes("approval") || text.includes("control") || text.includes("handoff") || text.includes("boundary") || text.includes("dispute")) return "high";
  if (text.includes("document") || text.includes("source signal")) return "medium";
  return "medium";
}

function combinedBasis(bundle: SynthesisInputBundle, material: Pass6PreparedMaterialItem): Pass6SourceBasis {
  return {
    ...material.basis,
    references: [
      {
        referenceId: `bundle:${safeIdPart(bundle.bundleId)}:${safeIdPart(material.itemId)}`,
        referenceType: "synthesis_input_bundle_item",
        label: material.itemType,
        notes: "Workflow unit/claim basis from 6A SynthesisInputBundle; not final workflow truth.",
      },
      ...material.basis.references,
    ],
  };
}

function sourceContextForMaterial(bundle: SynthesisInputBundle, material: Pass6PreparedMaterialItem): {
  sourceParticipantIds: string[];
  sourceSessionIds: string[];
  sourceLayerContextIds: string[];
} {
  const sourceLayerContextIds = material.roleLayerContextIds ?? [];
  const contexts = bundle.roleLayerContexts.filter((context) => sourceLayerContextIds.includes(context.contextId));
  return {
    sourceParticipantIds: uniqueBy(contexts.map((context) => context.participantId).filter((value): value is string => Boolean(value)), (value) => value),
    sourceSessionIds: uniqueBy([
      ...contexts.map((context) => context.sessionId).filter((value): value is string => Boolean(value)),
      ...material.basis.references.map((reference) => reference.sessionId).filter((value): value is string => Boolean(value)),
    ], (value) => value),
    sourceLayerContextIds,
  };
}

function materialEntries(bundle: SynthesisInputBundle): Array<{ folderName: string; material: Pass6PreparedMaterialItem }> {
  return [
    ...bundle.analysis_material.map((material) => ({ folderName: "analysis_material", material })),
    ...bundle.boundary_role_limit_material.map((material) => ({ folderName: "boundary_role_limit_material", material })),
    ...bundle.gap_risk_no_drop_material.map((material) => ({ folderName: "gap_risk_no_drop_material", material })),
    ...bundle.document_source_signal_material.map((material) => ({ folderName: "document_source_signal_material", material })),
  ];
}

function policyRefsForPipeline(profile?: Pass6ConfigurationProfile | null): string[] {
  if (!profile) return ["pass6-claim-pipeline:no-active-config-profile"];
  return [
    `pass6-config:${profile.configId}`,
    `claimScoringPolicy:${profile.version}`,
    `materialityPolicy:${profile.version}`,
  ];
}

function validatePipelineRecord<T>(
  name: string,
  validation: { ok: true; value: T } | { ok: false; errors: readonly { message?: string }[] },
): { ok: true } | { ok: false; error: string } {
  if (validation.ok) return { ok: true };
  return { ok: false, error: `Invalid ${name}: ${validationErrorText(validation.errors)}` };
}

export function buildWorkflowUnitsAndClaimsFromBundle(
  input: BuildWorkflowUnitsAndClaimsInput,
  repos: BuildWorkflowUnitsAndClaimsRepositories = {},
): BuildWorkflowUnitsAndClaimsResult {
  const now = input.now ?? new Date().toISOString();
  const bundleValidation = validateSynthesisInputBundle(input.bundle);
  if (!bundleValidation.ok) {
    return { ok: false, error: `Invalid SynthesisInputBundle: ${validationErrorText(bundleValidation.errors)}` };
  }

  const units: StoredWorkflowUnit[] = [];
  const claims: StoredWorkflowClaim[] = [];

  for (const { folderName, material } of materialEntries(input.bundle)) {
    const unitType = unitTypeForMaterial(material);
    const unitBase: WorkflowUnit = {
      unitId: `unit:${safeIdPart(input.bundle.bundleId)}:${safeIdPart(material.itemId)}`,
      caseId: input.bundle.caseId,
      bundleId: input.bundle.bundleId,
      unitType,
      unitText: material.summary,
      roleLayerContextId: material.roleLayerContextIds?.[0],
      basis: combinedBasis(input.bundle, material),
      notes: [
        `sourceFolder=${folderName}`,
        "WorkflowUnit is not automatically a workflow step.",
        material.basis.basisType === "source_document" ? "Document/source unit remains signal-only unless later supported by participant evidence." : undefined,
        folderName === "gap_risk_no_drop_material" ? "Open/risk/candidate-only material is preserved without truth upgrade." : undefined,
        material.notes,
      ].filter(Boolean).join(" "),
    };
    const unitValidation = validatePipelineRecord("WorkflowUnit", validateWorkflowUnit(unitBase));
    if (!unitValidation.ok) return unitValidation;
    const unit: StoredWorkflowUnit = {
      ...unitBase,
      createdAt: now,
      updatedAt: now,
    };
    units.push(unit);

    const primaryClaimType = claimTypeForUnit(unit, material);
    if (!primaryClaimType) continue;

    const sourceContext = sourceContextForMaterial(input.bundle, material);
    const claimStatus = claimStatusForMaterial(material, folderName);
    const claimBase: WorkflowClaim = {
      claimId: `claim:${safeIdPart(input.bundle.bundleId)}:${safeIdPart(material.itemId)}`,
      caseId: input.bundle.caseId,
      bundleId: input.bundle.bundleId,
      primaryClaimType,
      claimText: material.summary,
      normalizedStatement: [
        material.summary,
        material.basis.basisType === "source_document" ? "(document/source signal only)" : "",
        folderName === "gap_risk_no_drop_material" ? "(open/risk material, not accepted truth)" : "",
      ].filter(Boolean).join(" "),
      sourceParticipantIds: sourceContext.sourceParticipantIds,
      sourceSessionIds: sourceContext.sourceSessionIds,
      sourceLayerContextIds: sourceContext.sourceLayerContextIds,
      truthLensContextIds: material.truthLensContextIds ?? [],
      unitIds: [unit.unitId],
      basis: unit.basis,
      confidence: confidenceForMaterial(material, folderName),
      materiality: materialityForUnit(unit, material),
      status: claimStatus,
    };
    const claimValidation = validatePipelineRecord("WorkflowClaim", validateWorkflowClaim(claimBase));
    if (!claimValidation.ok) return claimValidation;
    const claim: StoredWorkflowClaim = {
      ...claimBase,
      createdAt: now,
      updatedAt: now,
    };
    claims.push(claim);
  }

  if (input.persist !== false) {
    for (const unit of units) repos.workflowUnits?.save(unit);
    for (const claim of claims) repos.workflowClaims?.save(claim);
  }

  return {
    ok: true,
    units,
    claims,
    policyRefs: policyRefsForPipeline(input.configurationProfile),
  };
}

// ---------------------------------------------------------------------------
// Evaluation — §20
// ---------------------------------------------------------------------------

/**
 * Validate an EvaluationRecord payload, verify snapshot integrity, enforce
 * admin blocking confirmations, apply narrow hard-stop, then persist.
 *
 * §20.21–§20.22 AI-interpreted / admin-routed / rule-guarded model:
 *   1. Schema validation (Ajv).
 *   2. Snapshot lookup — interpretationSnapshotId must exist.
 *   3. Basis integrity — submitted conditions + outcome must match snapshot.basis.
 *   4. For each condition the LLM labelled workflow-blocking, admin must supply
 *      adminBlockingConfirmations[key] (true or false).
 *   5. adminNote required when any blocking label is rejected (false).
 *   6. Narrow hard-stop: admin-confirmed blocking + incompatible outcome → 400.
 *   7. Duplicate check.
 *   8. Persist with conditionInterpretations copied from snapshot.
 */
export function createEvaluation(
  payload: unknown,
  repo: EvaluationRepository,
  snapshotRepo: InterpretationSnapshotRepository,
): EvaluationResult {
  const result = validateEvaluationRecord(payload);
  if (!result.ok) {
    const messages = result.errors
      .map((e) => e.message ?? String(e))
      .join("; ");
    return { ok: false, error: `Invalid EvaluationRecord: ${messages}` };
  }

  const record: EvaluationRecord = result.value;

  // Step 2: snapshot lookup
  const snapshot = snapshotRepo.findById(record.interpretationSnapshotId);
  if (snapshot === null) {
    return {
      ok: false,
      error: `Interpretation snapshot '${record.interpretationSnapshotId}' not found. Submit the conditions via /api/evaluations/interpret before creating an evaluation.`,
    };
  }

  // Step 3: basis integrity — submitted payload must match what the admin reviewed
  const basisConditionsMatch =
    JSON.stringify(snapshot.basis.conditions) ===
    JSON.stringify(record.conditions);
  if (!basisConditionsMatch) {
    return {
      ok: false,
      error:
        "Snapshot integrity failure: the submitted conditions do not match the conditions in the interpretation snapshot. Re-run the analysis before submitting.",
    };
  }
  if (snapshot.basis.outcome !== record.outcome) {
    return {
      ok: false,
      error:
        "Snapshot integrity failure: the submitted outcome does not match the outcome in the interpretation snapshot. Re-run the analysis before submitting.",
    };
  }

  // Step 4: admin must confirm/reject each condition labelled blocking by the LLM
  const blockingKeys = (
    Object.keys(snapshot.conditionInterpretations) as (keyof EvaluationConditions)[]
  ).filter(
    (k) => snapshot.conditionInterpretations[k]?.workflowEffect === "blocking",
  );

  for (const key of blockingKeys) {
    if (record.adminBlockingConfirmations?.[key] === undefined) {
      return {
        ok: false,
        error: `§20.22: the LLM labelled condition '${key}' as workflow-blocking. adminBlockingConfirmations.${key} must be true (confirmed blocking) or false (label rejected).`,
      };
    }
  }

  // Step 5: adminNote required when any blocking label is rejected
  const anyRejected = blockingKeys.some(
    (k) => record.adminBlockingConfirmations?.[k] === false,
  );
  if (anyRejected && !record.adminNote?.trim()) {
    return {
      ok: false,
      error:
        "adminNote is required when rejecting a blocking label — provide a brief explanation for traceability.",
    };
  }

  // Step 6: narrow hard-stop — admin-confirmed blocking + incompatible outcome
  const INCOMPATIBLE_WITH_CONFIRMED_BLOCKING = [
    EvaluationOutcome.ReadyForInitialPackage,
    EvaluationOutcome.FinalizableWithReview,
    EvaluationOutcome.ReadyForFinalPackage,
  ] as const;

  const anyConfirmed = blockingKeys.some(
    (k) => record.adminBlockingConfirmations?.[k] === true,
  );
  if (
    anyConfirmed &&
    (INCOMPATIBLE_WITH_CONFIRMED_BLOCKING as readonly string[]).includes(
      record.outcome,
    )
  ) {
    return {
      ok: false,
      error:
        "§20.22 hard-stop: at least one condition is admin-confirmed as workflow-blocking. The outcome must be needs_more_clarification while a materially blocking condition remains unresolved.",
    };
  }

  // Step 7: duplicate check
  const existing = repo.findById(record.evaluationId);
  if (existing !== null) {
    return {
      ok: false,
      error: `Evaluation with id '${record.evaluationId}' already exists.`,
    };
  }

  // Step 8: persist with interpretations from the snapshot
  const stored: StoredEvaluationRecord = {
    ...record,
    createdAt: new Date().toISOString(),
    conditionInterpretations: snapshot.conditionInterpretations,
  };

  repo.save(stored);
  return { ok: true, evaluation: stored };
}

export function getEvaluation(
  evaluationId: string,
  repo: EvaluationRepository,
): StoredEvaluationRecord | null {
  return repo.findById(evaluationId);
}

export function listEvaluations(
  repo: EvaluationRepository,
): StoredEvaluationRecord[] {
  return repo.findAll();
}

export function listEvaluationsByCaseId(
  caseId: string,
  repo: EvaluationRepository,
): StoredEvaluationRecord[] {
  return repo.findByCaseId(caseId);
}

export function listEvaluationsBySynthesisId(
  synthesisId: string,
  repo: EvaluationRepository,
): StoredEvaluationRecord[] {
  return repo.findBySynthesisId(synthesisId);
}
