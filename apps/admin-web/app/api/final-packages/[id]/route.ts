import { NextResponse } from "next/server";
import { getFinalPackage } from "@workflow/packages-output";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const record = getFinalPackage(params.id, store.finalPackages);
  if (record === null) {
    return NextResponse.json(
      { error: "Final package not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(record);
}
