import { NextResponse } from "next/server";
import { getPackageSurfaceDetail } from "../../../../lib/package-surface";
import { store } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const record = getPackageSurfaceDetail(params.id, store);
  if (record === null) {
    return NextResponse.json(
      { error: `Package surface '${params.id}' not found.` },
      { status: 404 },
    );
  }
  return NextResponse.json(record);
}
