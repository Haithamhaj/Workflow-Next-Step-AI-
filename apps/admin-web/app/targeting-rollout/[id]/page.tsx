import type { TargetingRolloutPlan } from "@workflow/contracts";
import Link from "next/link";
import TargetingRolloutPlanClient from "./TargetingRolloutPlanClient";

async function getPlan(id: string): Promise<TargetingRolloutPlan | null> {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/targeting-rollout/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<TargetingRolloutPlan>;
}

export default async function TargetingRolloutPlanPage({ params }: { params: { id: string } }) {
  const plan = await getPlan(params.id);
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
