import { NextResponse } from "next/server";
import { getInitialPackage } from "@workflow/packages-output";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const record = getInitialPackage(params.id, store.initialPackages);
  if (record === null) {
    return NextResponse.json(
      { error: "Initial package not found" },
      { status: 404 },
    );
  }
  return NextResponse.json(record);
}
