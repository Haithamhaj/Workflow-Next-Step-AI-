import { NextResponse } from "next/server";
import type { AdminSourceRoleDecisionStatus, AttachmentScope } from "@workflow/contracts";
import { recordAdminSourceRoleDecision } from "@workflow/sources-context";
import { store } from "../../../../../lib/store";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => ({})) as {
    decision?: AdminSourceRoleDecisionStatus;
    decidedBy?: string;
    suggestionId?: string;
    finalSourceRole?: string;
    finalScope?: AttachmentScope;
    reason?: string;
  };
  if (!body.decision) {
    return NextResponse.json({ error: "decision is required" }, { status: 400 });
  }
  try {
    const decision = recordAdminSourceRoleDecision({
      sourceId: params.id,
      decision: body.decision,
      decidedBy: body.decidedBy ?? "admin",
      suggestionId: body.suggestionId,
      finalSourceRole: body.finalSourceRole,
      finalScope: body.finalScope,
      reason: body.reason,
    }, store);
    return NextResponse.json(decision, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 409 },
    );
  }
}
