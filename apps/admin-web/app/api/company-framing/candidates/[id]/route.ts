import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const candidate = store.framingCandidates.findById(params.id);
  if (!candidate) {
    return NextResponse.json({ error: "FramingCandidate not found." }, { status: 404 });
  }
  return NextResponse.json(candidate);
}
