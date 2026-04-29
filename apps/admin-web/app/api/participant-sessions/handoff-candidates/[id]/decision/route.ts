import { NextResponse } from "next/server";
import { updatePass6HandoffCandidateAdminDecision } from "@workflow/participant-sessions";
import { store } from "../../../../../../lib/store";

const repos = {
  pass6HandoffCandidates: store.pass6HandoffCandidates,
};

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json().catch(() => ({})) as Record<string, unknown>
    : Object.fromEntries((await request.formData()).entries()) as Record<string, unknown>;
  const adminDecision = textValue(payload.adminDecision);
  const companyId = textValue(payload.companyId);
  const caseId = textValue(payload.caseId);
  if (!companyId || !caseId) {
    return NextResponse.json({ ok: false, error: "companyId_caseId_required" }, { status: 400 });
  }
  if (
    adminDecision !== "accepted_for_pass6"
    && adminDecision !== "dismissed"
    && adminDecision !== "needs_more_evidence"
    && adminDecision !== "pending"
  ) {
    return NextResponse.json({ ok: false, error: "invalid_adminDecision" }, { status: 400 });
  }
  const existing = repos.pass6HandoffCandidates.findByCompany(companyId, caseId, params.id);
  if (!existing) return NextResponse.json({ ok: false, error: "candidate_not_found" }, { status: 404 });
  const result = updatePass6HandoffCandidateAdminDecision(params.id, adminDecision, repos);
  const returnTo = textValue(payload.returnTo);
  if (returnTo && !contentType.includes("application/json")) {
    return NextResponse.redirect(new URL(`${returnTo}?handoffStatus=${encodeURIComponent(result.ok ? `decision:${adminDecision}` : result.errors[0]?.code ?? "failed")}`, request.url), { status: 303 });
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}
