import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "deferred",
      phase: "Future hierarchy intake slice",
      message: "Hierarchy intake is not started in Pass 2 Phase 7.",
    },
    { status: 501 },
  );
}
