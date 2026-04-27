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
  validateAnalysisMethodUsage,
  validateAssembledWorkflowDraft,
  validateDifferenceInterpretation,
  validateClarificationNeed,
  validateInquiryPacket,
  validatePrePackageGateResult,
  validateSevenConditionAssessment,
  validateWorkflowReadinessResult,
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
  type AssembledWorkflowDraft,
  type ClaimBasisEntry,
  type ClarificationNeed,
  type DifferenceInterpretation,
  type GateDecision,
  type InquiryPacket,
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
  type PrePackageGateResult,
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
  type WorkflowElement,
  type WorkflowReadinessDecision,
  type WorkflowReadinessResult,
  type SevenConditionAssessment,
  type SevenConditionAssessmentItem,
  type SevenConditionKey,
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
  StoredAnalysisMethodUsage,
  StoredAssembledWorkflowDraft,
  StoredDifferenceInterpretation,
  StoredWorkflowReadinessResult,
  StoredPrePackageGateResult,
  StoredClarificationNeed,
  StoredInquiryPacket,
  AnalysisMethodUsageRepository,
  AssembledWorkflowDraftRepository,
  ClarificationNeedRepository,
  DifferenceInterpretationRepository,
  InquiryPacketRepository,
  PrePackageGateResultRepository,
  WorkflowReadinessResultRepository,
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
  StoredAnalysisMethodUsage,
  StoredAssembledWorkflowDraft,
  StoredDifferenceInterpretation,
  StoredWorkflowReadinessResult,
  StoredPrePackageGateResult,
  StoredClarificationNeed,
  StoredInquiryPacket,
  AnalysisMethodUsageRepository,
  AssembledWorkflowDraftRepository,
  ClarificationNeedRepository,
  DifferenceInterpretationRepository,
  InquiryPacketRepository,
  PrePackageGateResultRepository,
  WorkflowReadinessResultRepository,
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
  exampleUseCase: string;
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

const PASS6_METHOD_REGISTRY_BASE: readonly Omit<Pass6MethodRegistryItem, "active" | "defaultPreference" | "exampleUseCase">[] = [
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
      exampleUseCase: `${method.displayName}: ${method.normalUseCases[0]}.`,
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
// Pass 6B Difference Interpretation and Multi-Lens Engine — Block 10
// ---------------------------------------------------------------------------

export interface AdminForcedDifferenceMethodInput {
  methodKey: AnalysisMethodKey;
  reason: string;
  appliedToClaimIds: string[];
  suitability: "suitable" | "partially_suitable" | "weakly_suitable";
  limitationsOrRisks: string[];
  preserveSystemSuggestedMethod: boolean;
}

export interface InterpretWorkflowClaimDifferencesInput {
  caseId: string;
  claims: WorkflowClaim[];
  now?: string;
  persist?: boolean;
  configRepo?: Pass6ConfigurationProfileRepository;
  adminForcedMethods?: AdminForcedDifferenceMethodInput[];
}

export interface InterpretWorkflowClaimDifferencesRepositories {
  differenceInterpretations?: DifferenceInterpretationRepository;
  analysisMethodUsages?: AnalysisMethodUsageRepository;
}

export interface InterpretWorkflowClaimDifferencesOk {
  ok: true;
  differences: StoredDifferenceInterpretation[];
  methodUsages: StoredAnalysisMethodUsage[];
  methodRegistry: Pass6MethodRegistryAdminView;
}

export type InterpretWorkflowClaimDifferencesResult =
  | InterpretWorkflowClaimDifferencesOk
  | { ok: false; error: string };

type DifferenceRoute = DifferenceInterpretation["recommendedRoute"];

function methodUsageType(methodKey: AnalysisMethodKey): AnalysisMethodUsage["methodType"] {
  if (methodKey === "bpmn_process_structure") return "process_structure_lens";
  if (methodKey === "sipoc_boundary") return "boundary_lens";
  if (methodKey === "triangulation") return "evidence_lens";
  if (methodKey === "espoused_theory_vs_theory_in_use") return "practice_reality_lens";
  if (methodKey === "raci_responsibility") return "responsibility_lens";
  if (methodKey === "ssm_multi_perspective") return "multi_perspective_lens";
  return "vocabulary_lens";
}

function claimText(claim: WorkflowClaim): string {
  return `${claim.normalizedStatement} ${claim.claimText ?? ""}`.toLowerCase();
}

function claimIsDocumentSignal(claim: WorkflowClaim): boolean {
  return claim.basis.basisType === "source_document" ||
    claim.truthLensContextIds?.some((id) => id.includes("document_signal") || id.includes("policy_intent")) === true ||
    claimText(claim).includes("document/source signal");
}

function layerKey(claim: WorkflowClaim): string {
  return claim.sourceLayerContextIds?.join("|") || claim.sourceSessionIds?.join("|") || "unknown_layer";
}

function hasLayerSignal(claim: WorkflowClaim, signal: string): boolean {
  return `${claim.sourceLayerContextIds?.join(" ") ?? ""} ${claim.sourceParticipantIds?.join(" ") ?? ""} ${claim.sourceSessionIds?.join(" ") ?? ""}`.toLowerCase().includes(signal);
}

function isCrossLayer(a: WorkflowClaim, b: WorkflowClaim): boolean {
  return layerKey(a) !== layerKey(b);
}

function directContradiction(a: WorkflowClaim, b: WorkflowClaim): boolean {
  const left = claimText(a);
  const right = claimText(b);
  const negators = ["does not", "do not", "never", "no ", "not required", "not approve", "without approval"];
  const leftNeg = negators.some((term) => left.includes(term));
  const rightNeg = negators.some((term) => right.includes(term));
  const sharedTerms = ["finance", "approval", "approve", "handoff", "tax", "manager", "legal", "required"]
    .filter((term) => left.includes(term) && right.includes(term));
  return leftNeg !== rightNeg && sharedTerms.length >= 2;
}

function variantSignal(a: WorkflowClaim, b: WorkflowClaim): boolean {
  const text = `${claimText(a)} ${claimText(b)}`;
  return ["if ", "when ", "unless", "variant", "domestic", "international", "vendor type", "sometimes", "alternate"].some((term) => text.includes(term));
}

function materialityForDifference(a: WorkflowClaim, b: WorkflowClaim): DifferenceInterpretation["materiality"] {
  if (a.materiality === "high" || b.materiality === "high") return "high";
  if (a.materiality === "low" && b.materiality === "low") return "low";
  return "medium";
}

function routeForDifference(type: DifferenceInterpretation["differenceType"], materiality: DifferenceInterpretation["materiality"]): DifferenceRoute {
  if (type === "completion") return "carry_as_completion";
  if (type === "variant") return "carry_as_variant";
  if (type === "normative_reality_mismatch") return materiality === "high" ? "review_candidate" : "warning";
  return materiality === "high" ? "blocker_candidate" : "clarification_needed";
}

function primaryMethodForDifference(
  type: DifferenceInterpretation["differenceType"],
  a: WorkflowClaim,
  b: WorkflowClaim,
): AnalysisMethodKey {
  const text = `${claimText(a)} ${claimText(b)}`;
  if (type === "normative_reality_mismatch") return "espoused_theory_vs_theory_in_use";
  if (isCrossLayer(a, b)) return "ssm_multi_perspective";
  if (type === "factual_conflict") return "triangulation";
  if (a.primaryClaimType === "boundary_claim" || b.primaryClaimType === "boundary_claim") return "sipoc_boundary";
  if (a.primaryClaimType === "ownership_claim" || b.primaryClaimType === "ownership_claim" || text.includes("approval") || text.includes("owner")) return "raci_responsibility";
  if (a.primaryClaimType === "sequence_claim" || b.primaryClaimType === "sequence_claim" || text.includes("handoff")) return "bpmn_process_structure";
  return "triangulation";
}

function secondaryMethodsForDifference(
  primary: AnalysisMethodKey,
  type: DifferenceInterpretation["differenceType"],
  a: WorkflowClaim,
  b: WorkflowClaim,
): AnalysisMethodKey[] {
  const methods: AnalysisMethodKey[] = [];
  const text = `${claimText(a)} ${claimText(b)}`;
  const highOrLow = a.materiality === "high" || b.materiality === "high" || a.confidence === "low" || b.confidence === "low";
  const disputed = a.status === "review_needed" || b.status === "review_needed" || text.includes("dispute");
  if ((highOrLow || disputed) && primary !== "triangulation") methods.push("triangulation");
  if ((claimIsDocumentSignal(a) || claimIsDocumentSignal(b)) && primary !== "espoused_theory_vs_theory_in_use") methods.push("espoused_theory_vs_theory_in_use");
  if (isCrossLayer(a, b) && primary !== "ssm_multi_perspective") methods.push("ssm_multi_perspective");
  if ((a.primaryClaimType === "ownership_claim" || b.primaryClaimType === "ownership_claim" || text.includes("approval")) && primary !== "raci_responsibility") methods.push("raci_responsibility");
  return uniqueBy(methods, (method) => method);
}

function classifyDifference(a: WorkflowClaim, b: WorkflowClaim): DifferenceInterpretation["differenceType"] | null {
  if (claimIsDocumentSignal(a) !== claimIsDocumentSignal(b) && directContradiction(a, b)) return "normative_reality_mismatch";
  if (directContradiction(a, b)) return "factual_conflict";
  if (variantSignal(a, b)) return "variant";
  if (isCrossLayer(a, b) && (hasLayerSignal(a, "frontline") || hasLayerSignal(a, "supervisor") || hasLayerSignal(a, "manager") || hasLayerSignal(b, "frontline") || hasLayerSignal(b, "supervisor") || hasLayerSignal(b, "manager"))) return "variant";
  if (layerKey(a) === layerKey(b) && a.claimId !== b.claimId && a.primaryClaimType !== b.primaryClaimType) return "completion";
  return null;
}

function registeredMethodOrError(methodKey: AnalysisMethodKey, registry: Pass6MethodRegistryAdminView): Pass6MethodRegistryItem {
  const method = registry.methods.find((item) => item.methodKey === methodKey);
  if (!method) throw new Error(`Registered Pass 6 method '${methodKey}' not found.`);
  return method;
}

function createMethodUsage(
  input: {
    method: Pass6MethodRegistryItem;
    methodRole: AnalysisMethodUsage["methodRole"];
    reason: string;
    appliedToId: string;
    affectedIds: string[];
    outputSummary: string;
    impactSummary: string;
    selectionSource?: AnalysisMethodUsage["selectionSource"];
    suitable?: boolean;
    suitabilityNotes?: string;
    limitations?: string[];
    now: string;
  },
): StoredAnalysisMethodUsage {
  const base: AnalysisMethodUsage = {
    methodUsageId: `method_usage:${safeIdPart(input.appliedToId)}:${safeIdPart(input.method.methodKey)}:${safeIdPart(input.methodRole ?? "primary")}`,
    methodId: input.method.methodId,
    methodKey: input.method.methodKey,
    methodName: input.method.displayName,
    methodType: methodUsageType(input.method.methodKey),
    version: input.method.methodVersion,
    selectionReason: input.reason,
    selectionSource: input.selectionSource ?? "system_selected",
    methodRole: input.methodRole,
    appliedToType: "difference",
    appliedToId: input.appliedToId,
    outputSummary: input.outputSummary,
    impact: {
      affectedIds: input.affectedIds,
      impactSummary: input.impactSummary,
      changedRouting: false,
      changedReadiness: false,
    },
    suitabilityAssessment: {
      suitable: input.suitable ?? input.method.active,
      notes: input.suitabilityNotes ?? (input.method.active ? "Registered method is active and suitable for advisory interpretation." : "Registered method is inactive; usage is traceability-only."),
      limitations: input.limitations ?? input.method.limitations,
    },
  };
  const validation = validatePipelineRecord("AnalysisMethodUsage", validateAnalysisMethodUsage(base));
  if (!validation.ok) throw new Error(validation.error);
  return { ...base, createdAt: input.now, updatedAt: input.now };
}

function createDifference(
  input: {
    caseId: string;
    claims: [WorkflowClaim, WorkflowClaim];
    differenceType: DifferenceInterpretation["differenceType"];
    methodUsageIds: string[];
    now: string;
  },
): StoredDifferenceInterpretation {
  const [a, b] = input.claims;
  const materiality = materialityForDifference(a, b);
  const base: DifferenceInterpretation = {
    differenceId: `difference:${safeIdPart(a.claimId)}:${safeIdPart(b.claimId)}:${input.differenceType}`,
    caseId: input.caseId,
    involvedClaimIds: [a.claimId, b.claimId],
    involvedLayers: uniqueBy([...(a.sourceLayerContextIds ?? []), ...(b.sourceLayerContextIds ?? [])], (value) => value),
    involvedRoles: uniqueBy([...(a.sourceParticipantIds ?? []), ...(b.sourceParticipantIds ?? [])], (value) => value),
    differenceType: input.differenceType,
    materiality,
    recommendedRoute: routeForDifference(input.differenceType, materiality),
    explanation: [
      `Advisory ${input.differenceType} between claims ${a.claimId} and ${b.claimId}.`,
      "This is not employee evaluation, not readiness, and not final workflow truth.",
      input.differenceType === "factual_conflict" ? "Factual conflict is not auto-resolved or merged into a clean workflow." : undefined,
      input.differenceType === "normative_reality_mismatch" ? "Document/source signal does not override participant evidence by default." : undefined,
    ].filter(Boolean).join(" "),
    methodUsageIds: input.methodUsageIds,
    notPerformanceEvaluation: true,
  };
  const validation = validatePipelineRecord("DifferenceInterpretation", validateDifferenceInterpretation(base));
  if (!validation.ok) throw new Error(validation.error);
  return { ...base, createdAt: input.now, updatedAt: input.now };
}

export function interpretWorkflowClaimDifferences(
  input: InterpretWorkflowClaimDifferencesInput,
  repos: InterpretWorkflowClaimDifferencesRepositories = {},
): InterpretWorkflowClaimDifferencesResult {
  const now = input.now ?? new Date().toISOString();
  const registry = resolvePass6MethodRegistryForAdmin(input.configRepo);
  const differences: StoredDifferenceInterpretation[] = [];
  const methodUsages: StoredAnalysisMethodUsage[] = [];
  const seen = new Set<string>();

  try {
    for (let i = 0; i < input.claims.length; i += 1) {
      for (let j = i + 1; j < input.claims.length; j += 1) {
        const a = input.claims[i];
        const b = input.claims[j];
        if (!a || !b) continue;
        if (a.caseId !== input.caseId || b.caseId !== input.caseId) continue;
        const differenceType = classifyDifference(a, b);
        if (!differenceType) continue;
        const differenceId = `difference:${safeIdPart(a.claimId)}:${safeIdPart(b.claimId)}:${differenceType}`;
        if (seen.has(differenceId)) continue;
        seen.add(differenceId);

        const primaryMethodKey = primaryMethodForDifference(differenceType, a, b);
        const selectedMethods = [
          { methodKey: primaryMethodKey, methodRole: "primary" as const },
          ...secondaryMethodsForDifference(primaryMethodKey, differenceType, a, b).map((methodKey) => ({ methodKey, methodRole: "secondary" as const })),
        ];

        const usageIds: string[] = [];
        for (const selected of selectedMethods) {
          const method = registeredMethodOrError(selected.methodKey, registry);
          const usage = createMethodUsage({
            method,
            methodRole: selected.methodRole,
            reason: `${method.displayName} selected for ${differenceType} using registered Block 8 method card.`,
            appliedToId: differenceId,
            affectedIds: [a.claimId, b.claimId],
            outputSummary: `${method.displayName} produced advisory ${differenceType} interpretation only.`,
            impactSummary: "Creates DifferenceInterpretation traceability only; does not assemble workflow or decide readiness.",
            limitations: [
              ...method.limitations,
              "Conflicting findings must not be merged into a fake clean workflow.",
              "Route is advisory only.",
            ],
            now,
          });
          methodUsages.push(usage);
          usageIds.push(usage.methodUsageId);
        }

        differences.push(createDifference({
          caseId: input.caseId,
          claims: [a, b],
          differenceType,
          methodUsageIds: usageIds,
          now,
        }));
      }
    }

    for (const forced of input.adminForcedMethods ?? []) {
      const method = registeredMethodOrError(forced.methodKey, registry);
      const suitabilityNotes = `Admin-forced method requested: ${forced.reason}. Suitability=${forced.suitability}. ${forced.preserveSystemSuggestedMethod ? "System-suggested method is preserved for comparison." : "No system-suggested method preservation requested."}`;
      methodUsages.push(createMethodUsage({
        method,
        methodRole: "admin_forced",
        reason: forced.reason,
        appliedToId: `admin_forced:${safeIdPart(forced.appliedToClaimIds.join("_") || forced.methodKey)}`,
        affectedIds: forced.appliedToClaimIds,
        outputSummary: "Admin-forced method usage represented for traceability only; no method execution resolves truth.",
        impactSummary: "Records admin-forced method suitability and limitations without creating workflow assembly or readiness.",
        selectionSource: "admin_forced",
        suitable: forced.suitability !== "weakly_suitable",
        suitabilityNotes,
        limitations: forced.limitationsOrRisks,
        now,
      }));
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }

  if (input.persist !== false) {
    for (const usage of methodUsages) repos.analysisMethodUsages?.save(usage);
    for (const difference of differences) repos.differenceInterpretations?.save(difference);
  }

  return { ok: true, differences, methodUsages, methodRegistry: registry };
}

// ---------------------------------------------------------------------------
// Pass 6B Workflow Assembly and Claim-Basis Map — Block 11
// ---------------------------------------------------------------------------

export interface AssembleWorkflowDraftInput {
  caseId: string;
  basedOnBundleId: string;
  claims: WorkflowClaim[];
  differences?: DifferenceInterpretation[];
  methodUsages?: AnalysisMethodUsage[];
  draftId?: string;
  now?: string;
  createdBy?: string;
  persist?: boolean;
}

export interface AssembleWorkflowDraftRepositories {
  assembledWorkflowDrafts?: AssembledWorkflowDraftRepository;
}

export interface AssembleWorkflowDraftOk {
  ok: true;
  draft: StoredAssembledWorkflowDraft;
}

export type AssembleWorkflowDraftResult =
  | AssembleWorkflowDraftOk
  | { ok: false; error: string };

function claimIsAcceptedForAssembly(claim: WorkflowClaim): boolean {
  return claim.status === "accepted_for_assembly";
}

function workflowElementId(prefix: string, claim: WorkflowClaim): string {
  return `${prefix}:${safeIdPart(claim.claimId)}`;
}

function workflowElementFromClaim(prefix: string, claim: WorkflowClaim, description?: string): WorkflowElement {
  return {
    elementId: workflowElementId(prefix, claim),
    label: claim.normalizedStatement,
    description,
    claimIds: [claim.claimId],
    basis: claim.basis,
  };
}

function claimHasParticipantEvidence(claim: WorkflowClaim): boolean {
  return !claimIsDocumentSignal(claim) && (claim.sourceParticipantIds?.length ?? 0) > 0;
}

function participantSupportedDocumentClaim(documentClaim: WorkflowClaim, claims: WorkflowClaim[]): boolean {
  const documentText = claimText(documentClaim);
  const importantTerms = ["approval", "approve", "handoff", "finance", "manager", "sales", "operations", "tax", "request"]
    .filter((term) => documentText.includes(term));
  return claims.some((claim) =>
    claim.claimId !== documentClaim.claimId &&
    claimIsAcceptedForAssembly(claim) &&
    claimHasParticipantEvidence(claim) &&
    claim.primaryClaimType === documentClaim.primaryClaimType &&
    importantTerms.filter((term) => claimText(claim).includes(term)).length >= Math.min(2, importantTerms.length)
  );
}

function differenceIdsForClaim(claimId: string, differences: DifferenceInterpretation[]): string[] {
  return differences
    .filter((difference) => difference.involvedClaimIds.includes(claimId))
    .map((difference) => difference.differenceId);
}

function methodUsageIdsForClaim(claimId: string, differences: DifferenceInterpretation[]): string[] {
  return uniqueBy(
    differences
      .filter((difference) => difference.involvedClaimIds.includes(claimId))
      .flatMap((difference) => difference.methodUsageIds ?? []),
    (id) => id,
  );
}

function basisEntryForElement(
  element: WorkflowElement,
  claims: WorkflowClaim[],
  differences: DifferenceInterpretation[],
  notes: string,
): ClaimBasisEntry {
  const elementClaimIds = element.claimIds ?? [];
  const elementClaims = elementClaimIds
    .map((claimId) => claims.find((claim) => claim.claimId === claimId))
    .filter((claim): claim is WorkflowClaim => claim !== undefined);
  const primaryClaim = elementClaims[0];
  return {
    workflowElementId: element.elementId,
    claimIds: elementClaimIds,
    sourceUnitIds: uniqueBy(elementClaims.flatMap((claim) => claim.unitIds), (id) => id),
    participantIds: uniqueBy(elementClaims.flatMap((claim) => claim.sourceParticipantIds ?? []), (id) => id),
    sessionIds: uniqueBy(elementClaims.flatMap((claim) => claim.sourceSessionIds ?? []), (id) => id),
    layerContextIds: uniqueBy(elementClaims.flatMap((claim) => claim.sourceLayerContextIds ?? []), (id) => id),
    truthLensContextIds: uniqueBy(elementClaims.flatMap((claim) => claim.truthLensContextIds ?? []), (id) => id),
    methodUsageIds: uniqueBy(elementClaimIds.flatMap((claimId) => methodUsageIdsForClaim(claimId, differences)), (id) => id),
    differenceIds: uniqueBy(elementClaimIds.flatMap((claimId) => differenceIdsForClaim(claimId, differences)), (id) => id),
    basis: primaryClaim?.basis,
    confidence: primaryClaim?.confidence,
    materiality: primaryClaim?.materiality,
    notes,
  };
}

function claimWarningText(claim: WorkflowClaim): string {
  return `${claim.claimId}: ${claim.normalizedStatement}`;
}

function understandingLevel(
  steps: WorkflowElement[],
  sequence: WorkflowElement[],
  unresolvedItems: string[],
  warningsCaveats: string[],
): AssembledWorkflowDraft["workflowUnderstandingLevel"] {
  if (unresolvedItems.length > 0) return "workflow_exists_but_not_package_ready";
  if (steps.length > 0 && sequence.length > 0) return "reconstructable_workflow_with_gaps";
  if (steps.length > 0 || sequence.length > 0 || warningsCaveats.length > 0) return "partial_workflow_understanding";
  return "partial_workflow_understanding";
}

export function assembleWorkflowDraftFromClaims(
  input: AssembleWorkflowDraftInput,
  repos: AssembleWorkflowDraftRepositories = {},
): AssembleWorkflowDraftResult {
  const now = input.now ?? new Date().toISOString();
  const draftId = input.draftId ?? `assembled_workflow_draft:${safeIdPart(input.caseId)}:${safeIdPart(input.basedOnBundleId)}`;
  const caseClaims = input.claims.filter((claim) => claim.caseId === input.caseId);
  const differences = (input.differences ?? []).filter((difference) => difference.caseId === input.caseId);

  const steps: WorkflowElement[] = [];
  const sequence: WorkflowElement[] = [];
  const decisions: WorkflowElement[] = [];
  const handoffs: WorkflowElement[] = [];
  const controls: WorkflowElement[] = [];
  const systemsTools: WorkflowElement[] = [];
  const variants: WorkflowElement[] = [];
  const warningsCaveats: string[] = [
    "Workflow assembly is advisory current understanding only; it is not readiness routing and not package eligibility.",
  ];
  const unresolvedItems: string[] = [];

  for (const claim of caseClaims) {
    const documentOnly = claimIsDocumentSignal(claim) && !participantSupportedDocumentClaim(claim, caseClaims);
    if (!claimIsAcceptedForAssembly(claim) || documentOnly) {
      const text = claimWarningText(claim);
      if (documentOnly) warningsCaveats.push(`${text} remains document/source signal only, not operational truth.`);
      else if (claim.status === "warning") warningsCaveats.push(`${text} remains warning/caveat material.`);
      else unresolvedItems.push(`${text} remains ${claim.status}; not assembled as clean workflow truth.`);
      continue;
    }

    const text = claimText(claim);
    if (claim.primaryClaimType === "execution_claim") {
      steps.push(workflowElementFromClaim("step", claim, "Accepted execution claim assembled as current workflow step."));
    }
    if (claim.primaryClaimType === "sequence_claim") {
      sequence.push(workflowElementFromClaim("sequence", claim, "Accepted sequence claim assembled as current supported sequence."));
    }
    if (claim.primaryClaimType === "decision_rule_claim") {
      decisions.push(workflowElementFromClaim("decision", claim, "Accepted decision rule claim assembled as current decision point."));
    }
    if (claim.primaryClaimType === "ownership_claim" || text.includes("handoff")) {
      handoffs.push(workflowElementFromClaim("handoff", claim, "Accepted ownership/handoff claim assembled as responsibility or handoff signal."));
    }
    if (text.includes("approval") || text.includes("approve") || text.includes("control")) {
      controls.push(workflowElementFromClaim("control", claim, "Accepted approval/control claim assembled as current control signal."));
    }
    if (text.includes("system") || text.includes("tool") || text.includes("platform")) {
      systemsTools.push(workflowElementFromClaim("system", claim, "Accepted system/tool claim assembled as current system or tool signal."));
    }
  }

  for (const difference of differences) {
    if (difference.differenceType === "completion") {
      warningsCaveats.push(`${difference.differenceId}: completion difference enriches workflow understanding without deciding readiness.`);
      continue;
    }
    if (difference.differenceType === "variant") {
      variants.push({
        elementId: `variant:${safeIdPart(difference.differenceId)}`,
        label: `Variant: ${difference.involvedClaimIds.join(" / ")}`,
        description: difference.explanation,
        claimIds: difference.involvedClaimIds,
        basis: {
          basisId: `basis:${safeIdPart(difference.differenceId)}`,
          basisType: "method_output",
          summary: "Variant preserved from DifferenceInterpretation; not flattened into one linear flow.",
          references: difference.involvedClaimIds.map((claimId) => ({
            referenceId: `ref:${safeIdPart(difference.differenceId)}:${safeIdPart(claimId)}`,
            referenceType: "workflow_claim",
            notes: claimId,
          })),
        },
      });
      continue;
    }
    if (difference.differenceType === "normative_reality_mismatch") {
      warningsCaveats.push(`${difference.differenceId}: normative/document-vs-reality mismatch remains caveat; document signal is not operational truth by default.`);
      continue;
    }
    unresolvedItems.push(`${difference.differenceId}: factual conflict remains unresolved/review-needed; not auto-resolved.`);
  }

  const allElements = [...steps, ...sequence, ...decisions, ...handoffs, ...controls, ...systemsTools, ...variants];
  const claimBasisMap = allElements.map((element) => basisEntryForElement(
    element,
    caseClaims,
    differences,
    element.elementId.startsWith("variant:")
      ? "Variant basis preserves alternate paths and associated difference/method usage traceability."
      : "Element basis preserves source claims, units, role/layer context, truth-lens context, differences, and method usage.",
  ));

  const draft: AssembledWorkflowDraft = {
    draftId,
    caseId: input.caseId,
    basedOnBundleId: input.basedOnBundleId,
    workflowUnderstandingLevel: understandingLevel(steps, sequence, unresolvedItems, warningsCaveats),
    steps: uniqueBy(steps, (element) => element.elementId),
    sequence: uniqueBy(sequence, (element) => element.elementId),
    decisions: uniqueBy(decisions, (element) => element.elementId),
    handoffs: uniqueBy(handoffs, (element) => element.elementId),
    controls: uniqueBy(controls, (element) => element.elementId),
    systemsTools: uniqueBy(systemsTools, (element) => element.elementId),
    variants: uniqueBy(variants, (element) => element.elementId),
    warningsCaveats: uniqueBy(warningsCaveats, (warning) => warning),
    unresolvedItems: uniqueBy(unresolvedItems, (item) => item),
    claimBasisMap,
    metadata: {
      createdAt: now,
      createdBy: input.createdBy ?? "system",
      notes: [
        `Assembly summary: ${steps.length} steps, ${sequence.length} sequence signals, ${decisions.length} decisions, ${handoffs.length} handoffs, ${controls.length} controls, ${variants.length} variants.`,
        "No seven-condition evaluation, readiness routing, Pre-6C gate, package generation, visual rendering, Copilot write, or Pass 7 mechanics are performed.",
      ].join(" "),
    },
  };

  const validation = validatePipelineRecord("AssembledWorkflowDraft", validateAssembledWorkflowDraft(draft));
  if (!validation.ok) return { ok: false, error: validation.error };

  const stored: StoredAssembledWorkflowDraft = { ...draft, createdAt: now, updatedAt: now };
  if (input.persist !== false) repos.assembledWorkflowDrafts?.save(stored);
  return { ok: true, draft: stored };
}

// ---------------------------------------------------------------------------
// Pass 6B Seven-Condition Evaluation and Workflow Readiness Result — Block 12
// ---------------------------------------------------------------------------

export interface EvaluateWorkflowReadinessInput {
  assembledWorkflowDraft: AssembledWorkflowDraft;
  resultId?: string;
  assessmentId?: string;
  now?: string;
  createdBy?: string;
  persist?: boolean;
  policyReferences?: string[];
}

export interface EvaluateWorkflowReadinessRepositories {
  workflowReadinessResults?: WorkflowReadinessResultRepository;
}

export interface EvaluateWorkflowReadinessOk {
  ok: true;
  sevenConditionAssessment: SevenConditionAssessment;
  readinessResult: StoredWorkflowReadinessResult;
}

export type EvaluateWorkflowReadinessResult =
  | EvaluateWorkflowReadinessOk
  | { ok: false; error: string };

const SEVEN_CONDITION_KEYS: readonly SevenConditionKey[] = [
  "core_sequence_continuity",
  "step_to_step_connection",
  "essential_step_requirements",
  "decision_rules_thresholds",
  "handoffs_responsibility",
  "controls_approvals",
  "use_case_boundary",
] as const;

function draftBasis(draft: AssembledWorkflowDraft, basisId: string, summary: string): Pass6SourceBasis {
  const claimRefs = uniqueBy(
    draft.claimBasisMap.flatMap((entry) => entry.claimIds),
    (id) => id,
  ).slice(0, 12);
  return {
    basisId,
    basisType: "method_output",
    summary,
    references: [
      {
        referenceId: `ref:${safeIdPart(draft.draftId)}:${safeIdPart(basisId)}`,
        referenceType: "assembled_workflow_draft",
        notes: draft.draftId,
      },
      ...claimRefs.map((claimId) => ({
        referenceId: `ref:${safeIdPart(basisId)}:${safeIdPart(claimId)}`,
        referenceType: "workflow_claim",
        notes: claimId,
      })),
    ],
  };
}

function conditionItem(
  draft: AssembledWorkflowDraft,
  key: SevenConditionKey,
  status: SevenConditionAssessmentItem["status"],
  rationale: string,
  blocksInitialPackage: boolean,
): SevenConditionAssessmentItem {
  return {
    status,
    rationale,
    basis: draftBasis(draft, `basis:${safeIdPart(draft.draftId)}:${key}`, rationale),
    blocksInitialPackage,
  };
}

function textIncludesAny(items: string[], terms: string[]): boolean {
  const text = items.join(" ").toLowerCase();
  return terms.some((term) => text.includes(term));
}

function hasDocumentOnlyCaveat(draft: AssembledWorkflowDraft): boolean {
  return textIncludesAny(draft.warningsCaveats, ["document/source signal only", "document signal is not operational truth"]);
}

function hasFactualConflict(draft: AssembledWorkflowDraft): boolean {
  return textIncludesAny(draft.unresolvedItems, ["factual conflict", "review-needed", "review needed"]);
}

function hasMissingEssentialDetail(draft: AssembledWorkflowDraft): boolean {
  return textIncludesAny(draft.unresolvedItems, ["missing essential", "missing factual", "essential detail", "required detail"]);
}

function hasBoundaryBlocker(draft: AssembledWorkflowDraft): boolean {
  return textIncludesAny([...draft.unresolvedItems, ...draft.warningsCaveats], ["boundary materially broken", "use-case boundary broken", "scope boundary broken"]);
}

function hasSequenceBlocker(draft: AssembledWorkflowDraft): boolean {
  return textIncludesAny(draft.unresolvedItems, ["sequence materially broken", "broken sequence", "sequence gap blocks"]);
}

function hasAutomationOnlyWeakness(draft: AssembledWorkflowDraft): boolean {
  return textIncludesAny(draft.warningsCaveats, ["automation-readiness", "automation readiness", "automation-supportiveness"]);
}

function evaluateSevenConditions(draft: AssembledWorkflowDraft): SevenConditionAssessment["conditions"] {
  const hasSteps = draft.steps.length > 0;
  const hasSequence = draft.sequence.length > 0;
  const hasDecisions = draft.decisions.length > 0;
  const hasHandoffs = draft.handoffs.length > 0;
  const hasControls = draft.controls.length > 0;
  const hasVariants = draft.variants.length > 0;
  const factualConflict = hasFactualConflict(draft);
  const missingEssential = hasMissingEssentialDetail(draft);
  const boundaryBlocker = hasBoundaryBlocker(draft);
  const sequenceBlocker = hasSequenceBlocker(draft);
  const documentOnly = hasDocumentOnlyCaveat(draft);
  const automationOnly = hasAutomationOnlyWeakness(draft);

  return {
    core_sequence_continuity: conditionItem(
      draft,
      "core_sequence_continuity",
      sequenceBlocker ? "materially_broken" : hasSequence ? (hasVariants ? "warning" : "clear_enough") : hasSteps ? "unknown" : "materially_broken",
      sequenceBlocker
        ? "Sequence evidence is materially broken and blocks current package use."
        : hasSequence
          ? "Core sequence is supported by assembled sequence evidence; variants remain visible where present."
          : hasSteps
            ? "Workflow work exists, but core sequence continuity is not yet established."
            : "No assembled workflow steps or sequence establish core continuity.",
      sequenceBlocker || (!hasSequence && hasSteps && draft.unresolvedItems.length > 0),
    ),
    step_to_step_connection: conditionItem(
      draft,
      "step_to_step_connection",
      sequenceBlocker ? "materially_broken" : hasSteps && hasSequence ? "clear_enough" : hasSteps ? "warning" : "unknown",
      sequenceBlocker
        ? "Step-to-step connection is materially broken."
        : hasSteps && hasSequence
          ? "Assembled steps have supporting sequence evidence."
          : hasSteps
            ? "Steps exist but connection evidence remains incomplete; this is not automatically a package blocker."
            : "No assembled steps are available to connect.",
      sequenceBlocker,
    ),
    essential_step_requirements: conditionItem(
      draft,
      "essential_step_requirements",
      missingEssential ? "materially_broken" : hasSteps ? (documentOnly ? "warning" : "clear_enough") : "unknown",
      missingEssential
        ? "Missing essential factual detail blocks current workflow understanding."
        : hasSteps
          ? "Essential step evidence is present; document-only material remains caveated where applicable."
          : "Essential workflow steps are not yet visible in the assembled draft.",
      missingEssential || !hasSteps,
    ),
    decision_rules_thresholds: conditionItem(
      draft,
      "decision_rules_thresholds",
      hasDecisions ? (hasVariants ? "warning" : "clear_enough") : "not_applicable",
      hasDecisions
        ? "Decision or threshold claims are assembled; variants remain visible and are not flattened."
        : "No decision/threshold requirement is currently evident in the assembled draft.",
      false,
    ),
    handoffs_responsibility: conditionItem(
      draft,
      "handoffs_responsibility",
      factualConflict ? "materially_broken" : hasHandoffs ? "clear_enough" : "warning",
      factualConflict
        ? "Material factual conflict affects handoff/responsibility and requires review before package."
        : hasHandoffs
          ? "Handoff or responsibility evidence is assembled."
          : "Handoff/responsibility evidence is weak or absent; warning only unless material conflict exists.",
      factualConflict,
    ),
    controls_approvals: conditionItem(
      draft,
      "controls_approvals",
      hasControls ? "clear_enough" : textIncludesAny([...draft.warningsCaveats, ...draft.unresolvedItems], ["approval", "control"]) ? "warning" : "not_applicable",
      hasControls
        ? "Approval/control evidence is assembled."
        : "Approval/control evidence is not clearly required or remains weak; weakness alone does not approve or block package.",
      false,
    ),
    use_case_boundary: conditionItem(
      draft,
      "use_case_boundary",
      boundaryBlocker ? "materially_broken" : documentOnly ? "warning" : "clear_enough",
      boundaryBlocker
        ? "Use-case boundary is materially broken and blocks current package use."
        : documentOnly
          ? "Boundary includes document/source signal caveats that must not be treated as operational truth by default."
          : "Use-case boundary is clear enough from assembled basis for current workflow understanding.",
      boundaryBlocker,
    ),
  };
}

function readinessDecisionFromConditions(
  draft: AssembledWorkflowDraft,
  conditions: SevenConditionAssessment["conditions"],
): WorkflowReadinessDecision {
  const conditionValues = SEVEN_CONDITION_KEYS.map((key) => conditions[key]);
  const blocking = conditionValues.filter((condition) => condition.blocksInitialPackage);
  const warning = conditionValues.some((condition) => condition.status === "warning") || draft.warningsCaveats.length > 1;
  if (hasFactualConflict(draft)) return "needs_review_decision_before_package";
  if (hasMissingEssentialDetail(draft)) return "needs_more_clarification_before_package";
  if (blocking.some((condition) => condition.status === "materially_broken")) return "needs_more_clarification_before_package";
  if (draft.steps.length === 0 && draft.sequence.length === 0) return "workflow_exists_but_current_basis_insufficient";
  if (draft.workflowUnderstandingLevel === "partial_workflow_understanding" && draft.sequence.length === 0) return "partial_only_not_package_ready";
  if (draft.workflowUnderstandingLevel === "workflow_exists_but_not_package_ready" && draft.unresolvedItems.length > 0) return "workflow_exists_but_current_basis_insufficient";
  if (warning || draft.variants.length > 0 || hasAutomationOnlyWeakness(draft)) return "ready_for_initial_package_with_warnings";
  return "ready_for_initial_package";
}

function allowedUseForDecision(
  decision: WorkflowReadinessDecision,
): WorkflowReadinessResult["allowedUseFor6C"] {
  if (decision === "ready_for_initial_package") return ["initial_package", "draft_operational_document"];
  if (decision === "ready_for_initial_package_with_warnings") return ["initial_package_with_warnings"];
  return ["none"];
}

function routingForDecision(decision: WorkflowReadinessDecision): string[] {
  if (decision === "ready_for_initial_package") return ["proceed_to_6c"];
  if (decision === "ready_for_initial_package_with_warnings") return ["proceed_to_6c_with_warnings"];
  if (decision === "needs_more_clarification_before_package") return ["send_to_pre_6c_clarification", "produce_gap_closure_brief_later"];
  if (decision === "needs_review_decision_before_package") return ["require_review_decision", "produce_gap_closure_brief_later"];
  if (decision === "partial_only_not_package_ready") return ["produce_gap_closure_brief_later"];
  return ["insufficient_basis_stop", "produce_gap_closure_brief_later"];
}

export function evaluateWorkflowReadinessFromDraft(
  input: EvaluateWorkflowReadinessInput,
  repos: EvaluateWorkflowReadinessRepositories = {},
): EvaluateWorkflowReadinessResult {
  const now = input.now ?? new Date().toISOString();
  const draft = input.assembledWorkflowDraft;
  const assessmentId = input.assessmentId ?? `seven_condition_assessment:${safeIdPart(draft.draftId)}`;
  const resultId = input.resultId ?? `workflow_readiness_result:${safeIdPart(draft.draftId)}`;

  const conditions = evaluateSevenConditions(draft);
  const assessment: SevenConditionAssessment = {
    assessmentId,
    caseId: draft.caseId,
    assembledWorkflowDraftId: draft.draftId,
    conditions,
    overallSummary: "Seven-condition assessment produced from assembled workflow draft only; no Pre-6C, 6C, visual, Copilot, Pass 7, or provider behavior executed.",
  };
  const assessmentValidation = validatePipelineRecord("SevenConditionAssessment", validateSevenConditionAssessment(assessment));
  if (!assessmentValidation.ok) return { ok: false, error: assessmentValidation.error };

  const decision = readinessDecisionFromConditions(draft, conditions);
  const gapIds = draft.unresolvedItems.map((_, index) => `gap:${safeIdPart(draft.draftId)}:${index + 1}`);
  const riskIds = draft.warningsCaveats
    .filter((warning) => !warning.includes("advisory current understanding"))
    .map((_, index) => `risk:${safeIdPart(draft.draftId)}:${index + 1}`);
  const result: WorkflowReadinessResult = {
    resultId,
    caseId: draft.caseId,
    assembledWorkflowDraftId: draft.draftId,
    readinessDecision: decision,
    sevenConditionAssessment: assessment,
    gapRiskSummary: {
      summary: [
        `${draft.unresolvedItems.length} unresolved item(s), ${draft.warningsCaveats.length} warning/caveat item(s), ${draft.variants.length} variant(s).`,
        "6C may use complete package material only when the readiness decision allows it.",
        "Warnings/caveats must remain visible; document/source claims must not be presented as complete operational truth by default.",
      ].join(" "),
      gapIds,
      riskIds,
    },
    allowedUseFor6C: allowedUseForDecision(decision),
    routingRecommendations: routingForDecision(decision),
    analysisMetadata: {
      createdAt: now,
      createdBy: input.createdBy ?? "system",
      notes: [
        `Policy references: ${(input.policyReferences ?? ["pass6-block12-default-policy"]).join(", ")}.`,
        "Scores/confidence may support review only; they do not approve readiness by themselves.",
        "Automation-readiness weakness is not treated as workflow incompleteness by itself.",
        "This block stores permission/routing bridge output only and does not generate package content.",
      ].join(" "),
    },
    is6CAllowed: decision === "ready_for_initial_package" || decision === "ready_for_initial_package_with_warnings",
  };
  const resultValidation = validatePipelineRecord("WorkflowReadinessResult", validateWorkflowReadinessResult(result));
  if (!resultValidation.ok) return { ok: false, error: resultValidation.error };

  const stored: StoredWorkflowReadinessResult = { ...result, createdAt: now, updatedAt: now };
  if (input.persist !== false) repos.workflowReadinessResults?.save(stored);
  return { ok: true, sevenConditionAssessment: assessment, readinessResult: stored };
}

// ---------------------------------------------------------------------------
// Pass 6B Methodology / Analysis Report and Admin Evaluation Surface — Block 13
// ---------------------------------------------------------------------------

export interface Pass6AnalysisReportInput {
  claims: WorkflowClaim[];
  methodUsages: AnalysisMethodUsage[];
  differences: DifferenceInterpretation[];
  assembledWorkflowDraft: AssembledWorkflowDraft;
  readinessResult: WorkflowReadinessResult;
  methodRegistry?: Pass6MethodRegistryAdminView;
  generatedAt?: string;
}

export interface Pass6AnalysisReportRepositories {
  workflowReadinessResults: WorkflowReadinessResultRepository;
  assembledWorkflowDrafts: AssembledWorkflowDraftRepository;
  workflowClaims: WorkflowClaimRepository;
  differenceInterpretations: DifferenceInterpretationRepository;
  analysisMethodUsages: AnalysisMethodUsageRepository;
  pass6ConfigurationProfiles?: Pass6ConfigurationProfileRepository;
}

export interface Pass6MethodologyAnalysisReport {
  reportId: string;
  resultId: string;
  caseId: string;
  generatedAt: string;
  audience: "admin_internal";
  reportBoundaryNotes: string[];
  workflowAssemblyView: {
    draftId: string;
    workflowUnderstandingLevel: AssembledWorkflowDraft["workflowUnderstandingLevel"];
    steps: WorkflowElement[];
    sequence: WorkflowElement[];
    decisions: WorkflowElement[];
    handoffs: WorkflowElement[];
    controls: WorkflowElement[];
    systemsTools: WorkflowElement[];
    variants: WorkflowElement[];
    warningsCaveats: string[];
    unresolvedItems: string[];
  };
  claimsReviewTable: Array<{
    claimId: string;
    claimType: WorkflowClaimType;
    status: WorkflowClaimStatus;
    normalizedStatement: string;
    sourceUnitIds: string[];
    participantIds: string[];
    sessionIds: string[];
    layerContextIds: string[];
    truthLensContextIds: string[];
    confidence?: WorkflowClaim["confidence"];
    materiality?: WorkflowClaim["materiality"];
    linkedWorkflowElementIds: string[];
    basis: Pass6SourceBasis;
  }>;
  methodUsageTable: Array<{
    methodUsageId: string;
    methodKey: AnalysisMethodKey;
    methodName: string;
    methodType: AnalysisMethodUsage["methodType"];
    methodCardVersion?: string;
    methodDefinition?: string;
    selectionReason: string;
    appliedTarget: {
      type: AnalysisMethodUsage["appliedToType"];
      id: string;
    };
    selectionSource: AnalysisMethodUsage["selectionSource"];
    suitability: AnalysisMethodUsage["suitabilityAssessment"];
    impactSummary: string;
    version: string;
    limitationsBoundaries: string[];
  }>;
  differenceMismatchTable: Array<{
    differenceId: string;
    differenceType: DifferenceInterpretation["differenceType"];
    involvedClaimIds: string[];
    involvedLayers: string[];
    involvedRoles: string[];
    recommendedRoute: DifferenceInterpretation["recommendedRoute"];
    materiality: DifferenceInterpretation["materiality"];
    explanation: string;
    methodUsageIds: string[];
  }>;
  sevenConditionAssessmentTable: Array<{
    conditionKey: SevenConditionKey;
    status: SevenConditionAssessmentItem["status"];
    rationale: string;
    basis: Pass6SourceBasis;
    blocksInitialPackage: boolean;
  }>;
  workflowReadinessSummary: {
    readinessDecision: WorkflowReadinessDecision;
    is6CAllowed: boolean;
    allowedUseFor6C: WorkflowReadinessResult["allowedUseFor6C"];
    routingRecommendations: string[];
    gapRiskSummary: WorkflowReadinessResult["gapRiskSummary"];
    metadata: WorkflowReadinessResult["analysisMetadata"];
  };
  decisionNeededPanel: {
    blockers: string[];
    reviewNeeded: string[];
    clarificationNeeded: string[];
    warningsProceedable: string[];
  };
  clientFacingSplitNote: string;
}

export type BuildPass6AnalysisReportResult =
  | { ok: true; report: Pass6MethodologyAnalysisReport }
  | { ok: false; error: string };

function workflowElementIdsForClaim(draft: AssembledWorkflowDraft, claimId: string): string[] {
  return [
    ...draft.steps,
    ...draft.sequence,
    ...draft.decisions,
    ...draft.handoffs,
    ...draft.controls,
    ...draft.systemsTools,
    ...draft.variants,
  ]
    .filter((element) => element.claimIds?.includes(claimId))
    .map((element) => element.elementId);
}

function methodCardForUsage(
  usage: AnalysisMethodUsage,
  registry?: Pass6MethodRegistryAdminView,
): Pass6MethodRegistryItem | undefined {
  return registry?.methods.find((method) => method.methodKey === usage.methodKey);
}

function sortedSevenConditionRows(
  assessment: SevenConditionAssessment,
): Pass6MethodologyAnalysisReport["sevenConditionAssessmentTable"] {
  return SEVEN_CONDITION_KEYS.map((conditionKey) => {
    const condition = assessment.conditions[conditionKey];
    return {
      conditionKey,
      status: condition.status,
      rationale: condition.rationale,
      basis: condition.basis,
      blocksInitialPackage: condition.blocksInitialPackage,
    };
  });
}

function buildDecisionNeededPanel(
  differences: DifferenceInterpretation[],
  readinessResult: WorkflowReadinessResult,
  draft: AssembledWorkflowDraft,
): Pass6MethodologyAnalysisReport["decisionNeededPanel"] {
  const conditionRows = sortedSevenConditionRows(readinessResult.sevenConditionAssessment);
  const blockers = [
    ...conditionRows
      .filter((condition) => condition.blocksInitialPackage)
      .map((condition) => `${condition.conditionKey}: ${condition.rationale}`),
    ...readinessResult.routingRecommendations
      .filter((route) => route.includes("stop"))
      .map((route) => `Routing blocker: ${route}`),
  ];
  const reviewNeeded = [
    ...differences
      .filter((difference) => difference.differenceType === "factual_conflict" || difference.recommendedRoute === "review_candidate" || difference.recommendedRoute === "blocker_candidate")
      .map((difference) => `${difference.differenceId}: ${difference.explanation}`),
    ...readinessResult.routingRecommendations
      .filter((route) => route === "require_review_decision")
      .map((route) => `Routing recommendation: ${route}`),
  ];
  const clarificationNeeded = [
    ...draft.unresolvedItems
      .filter((item) => item.toLowerCase().includes("missing") || item.toLowerCase().includes("clarification"))
      .map((item) => `Unresolved item: ${item}`),
    ...readinessResult.routingRecommendations
      .filter((route) => route === "send_to_pre_6c_clarification")
      .map((route) => `Routing recommendation: ${route}`),
  ];
  const warningsProceedable = [
    ...draft.warningsCaveats.map((warning) => `Warning/caveat: ${warning}`),
    ...conditionRows
      .filter((condition) => condition.status === "warning" && !condition.blocksInitialPackage)
      .map((condition) => `${condition.conditionKey}: ${condition.rationale}`),
  ];
  return {
    blockers: uniqueBy(blockers, (item) => item),
    reviewNeeded: uniqueBy(reviewNeeded, (item) => item),
    clarificationNeeded: uniqueBy(clarificationNeeded, (item) => item),
    warningsProceedable: uniqueBy(warningsProceedable, (item) => item),
  };
}

export function buildPass6MethodologyAnalysisReport(
  input: Pass6AnalysisReportInput,
): BuildPass6AnalysisReportResult {
  if (input.assembledWorkflowDraft.caseId !== input.readinessResult.caseId) {
    return { ok: false, error: "Assembled workflow draft and readiness result caseId do not match." };
  }
  if (input.assembledWorkflowDraft.draftId !== input.readinessResult.assembledWorkflowDraftId) {
    return { ok: false, error: "Readiness result does not reference the supplied assembled workflow draft." };
  }

  const draft = input.assembledWorkflowDraft;
  const registry = input.methodRegistry;
  const report: Pass6MethodologyAnalysisReport = {
    reportId: `pass6_analysis_report:${safeIdPart(input.readinessResult.resultId)}`,
    resultId: input.readinessResult.resultId,
    caseId: input.readinessResult.caseId,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    audience: "admin_internal",
    reportBoundaryNotes: [
      "This report is admin/internal analytical detail only.",
      "No client-facing Initial Workflow Package has been generated by this report.",
      "No Pre-6C questions, Gap Closure Brief, Pass 7 candidate, visual graph, Copilot state, or provider run is created by this report.",
      "6C later decides what becomes client-facing.",
    ],
    workflowAssemblyView: {
      draftId: draft.draftId,
      workflowUnderstandingLevel: draft.workflowUnderstandingLevel,
      steps: draft.steps,
      sequence: draft.sequence,
      decisions: draft.decisions,
      handoffs: draft.handoffs,
      controls: draft.controls,
      systemsTools: draft.systemsTools,
      variants: draft.variants,
      warningsCaveats: draft.warningsCaveats,
      unresolvedItems: draft.unresolvedItems,
    },
    claimsReviewTable: input.claims.map((claim) => ({
      claimId: claim.claimId,
      claimType: claim.primaryClaimType,
      status: claim.status,
      normalizedStatement: claim.normalizedStatement,
      sourceUnitIds: claim.unitIds,
      participantIds: claim.sourceParticipantIds ?? [],
      sessionIds: claim.sourceSessionIds ?? [],
      layerContextIds: claim.sourceLayerContextIds ?? [],
      truthLensContextIds: claim.truthLensContextIds ?? [],
      confidence: claim.confidence,
      materiality: claim.materiality,
      linkedWorkflowElementIds: workflowElementIdsForClaim(draft, claim.claimId),
      basis: claim.basis,
    })),
    methodUsageTable: input.methodUsages.map((usage) => {
      const methodCard = methodCardForUsage(usage, registry);
      return {
        methodUsageId: usage.methodUsageId,
        methodKey: usage.methodKey,
        methodName: usage.methodName,
        methodType: usage.methodType,
        methodCardVersion: methodCard?.methodVersion,
        methodDefinition: methodCard?.shortDefinition,
        selectionReason: usage.selectionReason,
        appliedTarget: {
          type: usage.appliedToType,
          id: usage.appliedToId,
        },
        selectionSource: usage.selectionSource,
        suitability: usage.suitabilityAssessment,
        impactSummary: usage.impact.impactSummary,
        version: usage.version,
        limitationsBoundaries: uniqueBy([
          ...(usage.suitabilityAssessment.limitations ?? []),
          ...(methodCard?.hardBoundaries ?? []),
          ...(methodCard?.limitations ?? []),
        ], (item) => item),
      };
    }),
    differenceMismatchTable: input.differences.map((difference) => ({
      differenceId: difference.differenceId,
      differenceType: difference.differenceType,
      involvedClaimIds: difference.involvedClaimIds,
      involvedLayers: difference.involvedLayers ?? [],
      involvedRoles: difference.involvedRoles ?? [],
      recommendedRoute: difference.recommendedRoute,
      materiality: difference.materiality ?? "unknown",
      explanation: difference.explanation,
      methodUsageIds: difference.methodUsageIds ?? [],
    })),
    sevenConditionAssessmentTable: sortedSevenConditionRows(input.readinessResult.sevenConditionAssessment),
    workflowReadinessSummary: {
      readinessDecision: input.readinessResult.readinessDecision,
      is6CAllowed: input.readinessResult.is6CAllowed,
      allowedUseFor6C: input.readinessResult.allowedUseFor6C,
      routingRecommendations: input.readinessResult.routingRecommendations,
      gapRiskSummary: input.readinessResult.gapRiskSummary,
      metadata: input.readinessResult.analysisMetadata,
    },
    decisionNeededPanel: buildDecisionNeededPanel(input.differences, input.readinessResult, draft),
    clientFacingSplitNote: "Admin/internal analysis report only. This is not the client-facing Initial Workflow Package; 6C later decides what can become client-facing.",
  };
  return { ok: true, report };
}

export function buildPass6MethodologyAnalysisReportFromRepositories(
  resultId: string,
  repos: Pass6AnalysisReportRepositories,
): BuildPass6AnalysisReportResult {
  const readinessResult = repos.workflowReadinessResults.findById(resultId);
  if (!readinessResult) return { ok: false, error: `WorkflowReadinessResult '${resultId}' not found.` };
  const draft = repos.assembledWorkflowDrafts.findById(readinessResult.assembledWorkflowDraftId);
  if (!draft) return { ok: false, error: `AssembledWorkflowDraft '${readinessResult.assembledWorkflowDraftId}' not found.` };
  const claims = repos.workflowClaims.findByCaseId(readinessResult.caseId);
  const differences = repos.differenceInterpretations.findByCaseId(readinessResult.caseId);
  const usageIds = new Set(differences.flatMap((difference) => difference.methodUsageIds ?? []));
  const methodUsages = repos.analysisMethodUsages.findAll()
    .filter((usage) => usageIds.has(usage.methodUsageId));
  return buildPass6MethodologyAnalysisReport({
    claims,
    methodUsages,
    differences,
    assembledWorkflowDraft: draft,
    readinessResult,
    methodRegistry: resolvePass6MethodRegistryForAdmin(repos.pass6ConfigurationProfiles),
  });
}

// ---------------------------------------------------------------------------
// Pass 6 Pre-6C Gap Closure, Inquiry Gate, and Question Generation — Block 14
// ---------------------------------------------------------------------------

export interface ProceedWithWarningsApprovalInput {
  approvedBy: string;
  approvedAt?: string;
  approvalNote: string;
  reasonForProceeding: string;
}

export interface RunPre6CGateInput {
  workflowReadinessResult: WorkflowReadinessResult;
  assembledWorkflowDraft?: AssembledWorkflowDraft;
  differences?: DifferenceInterpretation[];
  gateResultId?: string;
  now?: string;
  persist?: boolean;
  proceedWithWarningsApproval?: ProceedWithWarningsApprovalInput;
}

export interface RunPre6CGateRepositories {
  prePackageGateResults?: PrePackageGateResultRepository;
  clarificationNeeds?: ClarificationNeedRepository;
  inquiryPackets?: InquiryPacketRepository;
}

export interface RunPre6CGateOk {
  ok: true;
  gateResult: StoredPrePackageGateResult;
  clarificationNeeds: StoredClarificationNeed[];
  inquiryPackets: StoredInquiryPacket[];
}

export type RunPre6CGateResult =
  | RunPre6CGateOk
  | { ok: false; error: string };

function conditionIssueText(conditionKey: SevenConditionKey, condition: SevenConditionAssessmentItem): string {
  return `${conditionKey}: ${condition.status}. ${condition.rationale}`;
}

function targetForGateIssue(issueText: string, conditionKey?: SevenConditionKey): {
  targetRole: string;
  recommendedChannel: ClarificationNeed["recommendedChannel"];
  questionType: ClarificationNeed["questionType"];
  expectedAnswerType: ClarificationNeed["expectedAnswerType"];
} {
  const text = issueText.toLowerCase();
  if (text.includes("external") || text.includes("cross-functional") || text.includes("upstream") || text.includes("downstream") || text.includes("handoff outside")) {
    return { targetRole: "External or cross-functional process owner", recommendedChannel: "external_interface_review", questionType: "formal_email_inquiry", expectedAnswerType: "other" };
  }
  if (text.includes("approval") || text.includes("authority") || text.includes("owner") || text.includes("threshold") || conditionKey === "controls_approvals" || conditionKey === "handoffs_responsibility") {
    return { targetRole: "Manager or department owner", recommendedChannel: "manager_follow_up", questionType: "choice_based_with_optional_explanation", expectedAnswerType: text.includes("threshold") ? "threshold_value" : "approval_rule" };
  }
  if (text.includes("boundary") || text.includes("policy") || text.includes("document") || conditionKey === "use_case_boundary") {
    return { targetRole: "Department head or company-level owner", recommendedChannel: "source_document_review", questionType: "formal_email_inquiry", expectedAnswerType: "document_reference" };
  }
  if (text.includes("conflict") || text.includes("review")) {
    return { targetRole: "Admin reviewer", recommendedChannel: "admin_review", questionType: "admin_review_decision", expectedAnswerType: "other" };
  }
  if (text.includes("exception") || text.includes("escalation")) {
    return { targetRole: "Supervisor or senior role", recommendedChannel: "manager_follow_up", questionType: "meeting_agenda_item", expectedAnswerType: "free_text" };
  }
  return { targetRole: "Participant or frontline role", recommendedChannel: "participant_follow_up", questionType: "open_question", expectedAnswerType: "free_text" };
}

function usefulAnswerExample(expectedAnswerType: ClarificationNeed["expectedAnswerType"], targetRole: string): string {
  if (expectedAnswerType === "threshold_value") return "Approval is required above 10,000 SAR; below that amount the coordinator can proceed.";
  if (expectedAnswerType === "approval_rule") return "The department owner approves exceptions; routine requests are approved by the direct manager.";
  if (expectedAnswerType === "document_reference") return "The policy reference is SOP-12, section 4.2, but actual execution differs for urgent cases.";
  if (expectedAnswerType === "sequence_order") return "The coordinator checks the request first, then Finance reviews the tax form.";
  if (expectedAnswerType === "owner_name") return "The Operations Manager owns the final decision.";
  if (expectedAnswerType === "yes_no") return "Yes, this step happens before Finance receives the request.";
  return `${targetRole} can answer with the actual step, owner, exception, or say "I do not know / another team handles this" if outside their role.`;
}

function gateBasis(readiness: WorkflowReadinessResult, id: string, summary: string): Pass6SourceBasis {
  return {
    basisId: `basis:${safeIdPart(id)}`,
    basisType: "method_output",
    summary,
    references: [
      {
        referenceId: `ref:${safeIdPart(id)}:${safeIdPart(readiness.resultId)}`,
        referenceType: "workflow_readiness_result",
        notes: readiness.resultId,
      },
      {
        referenceId: `ref:${safeIdPart(id)}:${safeIdPart(readiness.assembledWorkflowDraftId)}`,
        referenceType: "assembled_workflow_draft",
        notes: readiness.assembledWorkflowDraftId,
      },
    ],
  };
}

function createClarificationNeedFromIssue(input: {
  readiness: WorkflowReadinessResult;
  issueId: string;
  issueText: string;
  conditionKey?: SevenConditionKey;
  relatedWorkflowElementId?: string;
  relatedClaimIds?: string[];
  relatedDifferenceIds?: string[];
  blocking: boolean;
  priority?: ClarificationNeed["priority"];
}): ClarificationNeed {
  const target = targetForGateIssue(input.issueText, input.conditionKey);
  const questionText = target.questionType === "admin_review_decision"
    ? `Please review this material issue before package generation: ${input.issueText}`
    : `Can you confirm the actual workflow detail for this gap: ${input.issueText}`;
  return {
    clarificationNeedId: `clarification_need:${safeIdPart(input.readiness.resultId)}:${safeIdPart(input.issueId)}`,
    questionType: target.questionType,
    questionText,
    targetRole: target.targetRole,
    whyItMatters: input.blocking
      ? "This gap blocks Initial Package readiness until the missing or conflicting workflow detail is reviewed."
      : "This warning can proceed only if the limitation remains visible and the admin accepts the caveat.",
    relatedWorkflowElementId: input.relatedWorkflowElementId,
    relatedGapId: input.issueId,
    relatedSevenConditionKey: input.conditionKey ?? "unknown",
    relatedClaimIds: input.relatedClaimIds,
    relatedDifferenceIds: input.relatedDifferenceIds,
    expectedAnswerType: target.expectedAnswerType,
    exampleAnswer: usefulAnswerExample(target.expectedAnswerType, target.targetRole),
    blockingStatus: input.blocking ? "blocking" : "non_blocking",
    basis: gateBasis(input.readiness, input.issueId, "Pre-6C clarification need generated from WorkflowReadinessResult; draft only, not evidence."),
    recommendedChannel: target.recommendedChannel,
    priority: input.priority ?? (input.blocking ? "high" : "medium"),
  };
}

function groupInquiryPackets(caseId: string, needs: ClarificationNeed[], now: string): InquiryPacket[] {
  const groups = new Map<string, ClarificationNeed[]>();
  for (const need of needs) {
    const key = `${need.recommendedChannel}:${need.targetRole ?? need.targetRecipient ?? "unknown"}`;
    groups.set(key, [...(groups.get(key) ?? []), need]);
  }
  return Array.from(groups.entries()).map(([key, clarificationNeeds]) => {
    const first = clarificationNeeds[0];
    return {
      inquiryPacketId: `inquiry_packet:${safeIdPart(caseId)}:${safeIdPart(key)}`,
      caseId,
      targetRole: first?.targetRole,
      targetRecipient: first?.targetRecipient,
      clarificationNeeds,
      packetStatus: "ready_for_admin_review",
      createdAt: now,
    };
  });
}

function gateDecisionForReadiness(
  readiness: WorkflowReadinessResult,
  needs: ClarificationNeed[],
  approval?: ProceedWithWarningsApprovalInput,
): GateDecision {
  if (readiness.readinessDecision === "ready_for_initial_package") return "no_gate_block_package_allowed";
  if (readiness.readinessDecision === "ready_for_initial_package_with_warnings") {
    return approval ? "proceed_with_warnings_approved" : "clarification_required_before_package";
  }
  if (readiness.readinessDecision === "needs_review_decision_before_package") return "review_decision_required_before_package";
  if (readiness.readinessDecision === "needs_more_clarification_before_package") return "clarification_required_before_package";
  return needs.length > 0 ? "clarification_required_before_package" : "package_blocked_gap_brief_required";
}

export function runPre6CGateFromReadiness(
  input: RunPre6CGateInput,
  repos: RunPre6CGateRepositories = {},
): RunPre6CGateResult {
  const readiness = input.workflowReadinessResult;
  const now = input.now ?? new Date().toISOString();
  const gateResultId = input.gateResultId ?? `pre_package_gate:${safeIdPart(readiness.resultId)}`;
  const needs: ClarificationNeed[] = [];

  const conditionRows = SEVEN_CONDITION_KEYS.map((conditionKey) => ({
    conditionKey,
    condition: readiness.sevenConditionAssessment.conditions[conditionKey],
  }));

  for (const row of conditionRows) {
    if (row.condition.blocksInitialPackage || row.condition.status === "materially_broken" || row.condition.status === "unknown") {
      needs.push(createClarificationNeedFromIssue({
        readiness,
        issueId: `condition:${row.conditionKey}`,
        issueText: conditionIssueText(row.conditionKey, row.condition),
        conditionKey: row.conditionKey,
        blocking: row.condition.blocksInitialPackage || row.condition.status === "materially_broken" || row.condition.status === "unknown",
        priority: row.condition.blocksInitialPackage ? "high" : "medium",
      }));
    }
  }

  for (const gapId of readiness.gapRiskSummary.gapIds) {
    needs.push(createClarificationNeedFromIssue({
      readiness,
      issueId: gapId,
      issueText: `${gapId}: ${readiness.gapRiskSummary.summary}`,
      blocking: !readiness.is6CAllowed,
      priority: readiness.is6CAllowed ? "medium" : "high",
    }));
  }

  for (const difference of input.differences ?? []) {
    if (difference.differenceType === "factual_conflict" || difference.recommendedRoute === "review_candidate" || difference.recommendedRoute === "blocker_candidate") {
      needs.push(createClarificationNeedFromIssue({
        readiness,
        issueId: `difference:${difference.differenceId}`,
        issueText: `${difference.differenceId}: ${difference.explanation}`,
        relatedClaimIds: difference.involvedClaimIds,
        relatedDifferenceIds: [difference.differenceId],
        blocking: difference.recommendedRoute === "blocker_candidate" || readiness.readinessDecision === "needs_review_decision_before_package",
        priority: difference.materiality === "high" ? "high" : "medium",
      }));
    }
  }

  if (readiness.readinessDecision === "ready_for_initial_package_with_warnings" && needs.length === 0) {
    needs.push(createClarificationNeedFromIssue({
      readiness,
      issueId: "proceed-with-warnings",
      issueText: `Proceed-with-warnings decision required. ${readiness.gapRiskSummary.summary}`,
      blocking: false,
      priority: "medium",
    }));
  }

  const uniqueNeeds = uniqueBy(needs, (need) => need.clarificationNeedId);
  for (const need of uniqueNeeds) {
    const validation = validatePipelineRecord("ClarificationNeed", validateClarificationNeed(need));
    if (!validation.ok) return { ok: false, error: validation.error };
  }

  const inquiryPackets = groupInquiryPackets(readiness.caseId, uniqueNeeds, now);
  for (const packet of inquiryPackets) {
    const validation = validatePipelineRecord("InquiryPacket", validateInquiryPacket(packet));
    if (!validation.ok) return { ok: false, error: validation.error };
  }

  const gateDecision = gateDecisionForReadiness(readiness, uniqueNeeds, input.proceedWithWarningsApproval);
  const gateResult: PrePackageGateResult = {
    gateResultId,
    caseId: readiness.caseId,
    workflowReadinessResultId: readiness.resultId,
    gateDecision,
    clarificationNeeds: uniqueNeeds,
    inquiryPackets,
    proceedWithWarningsApproval: input.proceedWithWarningsApproval ? {
      approvalStatus: "approved",
      approvedBy: input.proceedWithWarningsApproval.approvedBy,
      approvedAt: input.proceedWithWarningsApproval.approvedAt ?? now,
      approvalNote: input.proceedWithWarningsApproval.approvalNote,
      warningsAccepted: readiness.gapRiskSummary.riskIds.length > 0 ? readiness.gapRiskSummary.riskIds : readiness.routingRecommendations,
      reasonForProceeding: input.proceedWithWarningsApproval.reasonForProceeding,
      limitationsToKeepVisible: [
        readiness.gapRiskSummary.summary,
        "Proceed-with-warnings does not close the gap and does not convert warning material into evidence.",
      ],
      followUpRecommendation: "Keep accepted warnings visible in later 6C output and follow up after package delivery if needed.",
    } : undefined,
  };
  const gateValidation = validatePipelineRecord("PrePackageGateResult", validatePrePackageGateResult(gateResult));
  if (!gateValidation.ok) return { ok: false, error: gateValidation.error };

  const storedGate: StoredPrePackageGateResult = { ...gateResult, createdAt: now, updatedAt: now };
  const storedNeeds: StoredClarificationNeed[] = uniqueNeeds.map((need) => ({ ...need, createdAt: now, updatedAt: now }));
  const storedPackets: StoredInquiryPacket[] = inquiryPackets.map((packet) => ({ ...packet, updatedAt: now }));

  if (input.persist !== false) {
    repos.prePackageGateResults?.save(storedGate);
    for (const need of storedNeeds) repos.clarificationNeeds?.save(need);
    for (const packet of storedPackets) repos.inquiryPackets?.save(packet);
  }

  return { ok: true, gateResult: storedGate, clarificationNeeds: storedNeeds, inquiryPackets: storedPackets };
}

export function runPre6CGateFromRepositories(
  workflowReadinessResultId: string,
  repos: {
    workflowReadinessResults: WorkflowReadinessResultRepository;
    assembledWorkflowDrafts?: AssembledWorkflowDraftRepository;
    differenceInterpretations?: DifferenceInterpretationRepository;
  } & RunPre6CGateRepositories,
  input: Omit<RunPre6CGateInput, "workflowReadinessResult" | "assembledWorkflowDraft" | "differences"> = {},
): RunPre6CGateResult {
  const readiness = repos.workflowReadinessResults.findById(workflowReadinessResultId);
  if (!readiness) return { ok: false, error: `WorkflowReadinessResult '${workflowReadinessResultId}' not found.` };
  return runPre6CGateFromReadiness({
    ...input,
    workflowReadinessResult: readiness,
    assembledWorkflowDraft: repos.assembledWorkflowDrafts?.findById(readiness.assembledWorkflowDraftId) ?? undefined,
    differences: repos.differenceInterpretations?.findByCaseId(readiness.caseId) ?? [],
  }, repos);
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
