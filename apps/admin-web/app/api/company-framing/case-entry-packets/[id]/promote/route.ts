import { NextResponse } from "next/server";
import { promoteCaseEntryPacketToCase } from "@workflow/company-framing";
import { store } from "../../../../../../lib/store";

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const result = promoteCaseEntryPacketToCase(
    params.id,
    {
      caseId: stringFrom(b.caseId),
      promotedBy: stringFrom(b.promotedBy),
      companyProfileRef: stringFrom(b.companyProfileRef),
    },
    {
      packets: store.caseEntryPackets,
      cases: store.cases,
      candidates: store.framingCandidates,
    },
  );

  if (!result.ok) {
    const status = result.error.code === "packet_not_found" ? 404 : 400;
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status });
  }

  return NextResponse.json({ case: result.case, packet: result.packet }, { status: 201 });
}
