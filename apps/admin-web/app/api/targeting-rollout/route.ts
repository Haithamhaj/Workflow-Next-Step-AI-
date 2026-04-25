import { NextResponse } from "next/server";
import { createOrLoadTargetingRolloutPlan } from "@workflow/targeting-rollout";
import { store } from "../../../lib/store";

const repos = {
  intakeSessions: store.intakeSessions,
  approvedHierarchySnapshots: store.approvedHierarchySnapshots,
  hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
  sourceHierarchyTriageSuggestions: store.sourceHierarchyTriageSuggestions,
  structuredPromptSpecs: store.structuredPromptSpecs,
  targetingRolloutPlans: store.targetingRolloutPlans,
};

export async function GET() {
  return NextResponse.json(store.targetingRolloutPlans.findAll());
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await request.json() as { caseId?: string; createdBy?: string }
      : Object.fromEntries((await request.formData()).entries()) as { caseId?: string; createdBy?: string };
    if (!body.caseId) return NextResponse.json({ error: "caseId is required." }, { status: 400 });
    const plan = createOrLoadTargetingRolloutPlan({ caseId: body.caseId, createdBy: body.createdBy }, repos);
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL(`/targeting-rollout/${plan.planId}`, request.url), { status: 303 });
    }
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
