import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const packet = store.caseEntryPackets.findById(params.id);
  if (!packet) {
    return NextResponse.json({ error: "CaseEntryPacket not found." }, { status: 404 });
  }
  return NextResponse.json(packet);
}
