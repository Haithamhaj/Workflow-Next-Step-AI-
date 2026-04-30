import { NextResponse } from "next/server";
import { store } from "../../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const source = store.framingSources.findById(params.id);
  if (!source) {
    return NextResponse.json({ error: "FramingSource not found." }, { status: 404 });
  }
  return NextResponse.json(source);
}
