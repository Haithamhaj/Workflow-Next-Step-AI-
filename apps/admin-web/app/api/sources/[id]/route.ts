import { NextResponse } from "next/server";
import { getSource } from "@workflow/sources-context";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const source = getSource(params.id, store.sources);
  if (source === null) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }
  return NextResponse.json(source);
}
