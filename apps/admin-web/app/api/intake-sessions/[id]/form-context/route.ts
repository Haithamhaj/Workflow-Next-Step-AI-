import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "deferred",
      phase: "Pass 2 Phase 6",
      message: "Structured context generation UI is not started in Pass 2 Phase 3.",
    },
    { status: 501 },
  );
}
