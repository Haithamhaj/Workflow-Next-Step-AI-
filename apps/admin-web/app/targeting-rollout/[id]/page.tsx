import type { TargetingRolloutPlan } from "@workflow/contracts";
import Link from "next/link";
import TargetingRolloutPlanClient from "./TargetingRolloutPlanClient";

async function getPlan(id: string, companyId?: string, caseId?: string): Promise<TargetingRolloutPlan | null> {
  if (!companyId || !caseId) return null;
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/targeting-rollout/${id}?companyId=${encodeURIComponent(companyId)}&caseId=${encodeURIComponent(caseId)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<TargetingRolloutPlan>;
}

export default async function TargetingRolloutPlanPage({ params, searchParams }: { params: { id: string }; searchParams?: { companyId?: string; caseId?: string } }) {
  const plan = await getPlan(params.id, searchParams?.companyId, searchParams?.caseId);
  if (!plan) {
    return (
      <>
        <h2>Pass 4 plan not found</h2>
        <p><Link href="/targeting-rollout">Back to targeting rollout</Link></p>
      </>
    );
  }
  return <TargetingRolloutPlanClient initialPlan={plan} />;
}
