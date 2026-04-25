import { NextResponse } from "next/server";
import {
  transitionTargetingPlan,
  updateCandidateDecision,
  updateParticipantContactProfile,
  updateQuestionHintSeed,
} from "@workflow/targeting-rollout";
import type { ParticipantContactProfile, TargetingRolloutPlanState } from "@workflow/contracts";
import { store } from "../../../../lib/store";

const repos = {
  intakeSessions: store.intakeSessions,
  approvedHierarchySnapshots: store.approvedHierarchySnapshots,
  hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
  sourceHierarchyTriageSuggestions: store.sourceHierarchyTriageSuggestions,
  structuredPromptSpecs: store.structuredPromptSpecs,
  targetingRolloutPlans: store.targetingRolloutPlans,
};

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const plan = store.targetingRolloutPlans.findById(params.id);
  if (!plan) return NextResponse.json({ error: "Targeting rollout plan not found." }, { status: 404 });
  return NextResponse.json(plan);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json() as {
      action?: string;
      candidateId?: string;
      adminDecision?: "pending" | "accepted" | "rejected" | "edited";
      targetType?: "core_participant" | "enrichment_participant" | "external_decision_or_clarification_source";
      rolloutStage?: number;
      rolloutOrder?: number;
      markContactDataMissing?: boolean;
      participantId?: string;
      updates?: Partial<ParticipantContactProfile>;
      hintId?: string;
      hintStatus?: "active" | "resolved_by_initial_narrative" | "used_in_followup" | "dismissed_by_admin";
      state?: TargetingRolloutPlanState;
      adminNote?: string;
    };
    if (body.action === "candidate" && body.candidateId) {
      return NextResponse.json(updateCandidateDecision({ planId: params.id, candidateId: body.candidateId, adminDecision: body.adminDecision, targetType: body.targetType, rolloutStage: body.rolloutStage, rolloutOrder: body.rolloutOrder, markContactDataMissing: body.markContactDataMissing, adminNote: body.adminNote }, repos));
    }
    if (body.action === "contact" && body.participantId) {
      return NextResponse.json(updateParticipantContactProfile({ planId: params.id, participantId: body.participantId, updates: body.updates ?? {}, updatedBy: "admin" }, repos));
    }
    if (body.action === "hint" && body.hintId && body.hintStatus) {
      return NextResponse.json(updateQuestionHintSeed({ planId: params.id, hintId: body.hintId, status: body.hintStatus, adminNote: body.adminNote }, repos));
    }
    if (body.action === "transition" && body.state) {
      return NextResponse.json(transitionTargetingPlan({ planId: params.id, state: body.state, adminUser: "admin", adminNote: body.adminNote }, repos));
    }
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
