import { NextResponse } from "next/server";
import { getSynthesis } from "@workflow/synthesis-evaluation";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const record = getSynthesis(params.id, store.synthesis);
  if (record === null) {
    return NextResponse.json({ error: "Synthesis not found" }, { status: 404 });
  }
  return NextResponse.json(record);
}
