import { NextResponse } from "next/server";
import { generateTargetingRecommendationPacket } from "@workflow/targeting-rollout";
import { GoogleExtractionProvider } from "@workflow/integrations";
import { store } from "../../../../../lib/store";

const repos = {
  intakeSessions: store.intakeSessions,
  approvedHierarchySnapshots: store.approvedHierarchySnapshots,
  hierarchyReadinessSnapshots: store.hierarchyReadinessSnapshots,
  sourceHierarchyTriageSuggestions: store.sourceHierarchyTriageSuggestions,
  structuredPromptSpecs: store.structuredPromptSpecs,
  targetingRolloutPlans: store.targetingRolloutPlans,
};

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const plan = store.targetingRolloutPlans.findById(params.id);
  if (!plan) return NextResponse.json({ error: "Targeting rollout plan not found." }, { status: 404 });
  const provider = new GoogleExtractionProvider();
  const next = await generateTargetingRecommendationPacket({ caseId: plan.caseId, provider, generatedBy: "admin" }, repos);
  return NextResponse.json(next);
}
