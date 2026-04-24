import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "deferred",
      phase: "Pass 3 Foundation Patch 1",
      message: "Provider-backed hierarchy draft generation is deferred. Use /api/intake-sessions/[id]/hierarchy for manual foundation intake and structural approval.",
    },
    { status: 501 },
  );
}
