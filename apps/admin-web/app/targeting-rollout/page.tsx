import type { TargetingRolloutPlan } from "@workflow/contracts";
import Link from "next/link";

async function getPlans(): Promise<TargetingRolloutPlan[]> {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/targeting-rollout`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json() as Promise<TargetingRolloutPlan[]>;
}

export default async function TargetingRolloutPage() {
  const plans = await getPlans();
  return (
    <>
      <h2>Pass 4 Targeting Rollout</h2>
      <p style={{ color: "#aaa" }}>Participant targeting and rollout planning from approved Pass 3 hierarchy snapshots. No outreach, invitations, sessions, responses, or workflow analysis happen here.</p>
      <form action="/api/targeting-rollout" method="post" style={{ margin: "20px 0", display: "flex", gap: "8px", alignItems: "center" }}>
        <input name="caseId" placeholder="caseId with approved Pass 3 readiness" style={{ minWidth: "320px" }} />
        <button className="btn-primary" type="submit">Create/load plan</button>
      </form>
      <p><Link href="/targeting-rollout/prompts">Pass 4 Prompt Workspace</Link></p>
      {plans.length === 0 ? (
        <p style={{ color: "#777" }}>No Pass 4 plans yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
              <th style={{ padding: "8px" }}>Plan</th>
              <th style={{ padding: "8px" }}>Case</th>
              <th style={{ padding: "8px" }}>Department</th>
              <th style={{ padding: "8px" }}>Use case</th>
              <th style={{ padding: "8px" }}>State</th>
              <th style={{ padding: "8px" }}>Provider</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.planId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px", fontFamily: "monospace" }}><Link href={`/targeting-rollout/${plan.planId}`}>{plan.planId}</Link></td>
                <td style={{ padding: "8px", fontFamily: "monospace" }}>{plan.caseId}</td>
                <td style={{ padding: "8px" }}>{plan.selectedDepartment}</td>
                <td style={{ padding: "8px" }}>{plan.selectedUseCase}</td>
                <td style={{ padding: "8px" }}>{plan.state}</td>
                <td style={{ padding: "8px" }}>{plan.providerStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
