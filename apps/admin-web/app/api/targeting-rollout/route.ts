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

export async function GET(request: Request) {
  const companyId = new URL(request.url).searchParams.get("companyId");
  if (!companyId) return NextResponse.json({ error: "companyId is required." }, { status: 400 });
  return NextResponse.json(store.targetingRolloutPlans.findAll().filter((plan) => plan.companyId === companyId));
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await request.json() as { companyId?: string; caseId?: string; createdBy?: string }
      : Object.fromEntries((await request.formData()).entries()) as { companyId?: string; caseId?: string; createdBy?: string };
    if (!body.companyId || !body.caseId) return NextResponse.json({ error: "companyId and caseId are required." }, { status: 400 });
    if (!store.cases.findByCompanyAndCase(body.companyId, body.caseId)) return NextResponse.json({ error: "case not found." }, { status: 404 });
    const plan = createOrLoadTargetingRolloutPlan({ companyId: body.companyId, caseId: body.caseId, createdBy: body.createdBy }, repos);
    if (!contentType.includes("application/json")) {
      return NextResponse.redirect(new URL(`/targeting-rollout/${plan.planId}?companyId=${encodeURIComponent(plan.companyId)}&caseId=${encodeURIComponent(plan.caseId)}`, request.url), { status: 303 });
    }
    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
