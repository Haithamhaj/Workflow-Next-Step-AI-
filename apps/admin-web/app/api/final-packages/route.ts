import { NextResponse } from "next/server";
import {
  createFinalPackage,
  listFinalPackages,
} from "@workflow/packages-output";
import { store } from "../../../lib/store";

export async function GET() {
  return NextResponse.json(listFinalPackages(store.finalPackages));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }
  const outcome = createFinalPackage(body, store.finalPackages);
  if (!outcome.ok) {
    const status = outcome.error.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }
  return NextResponse.json(outcome.finalPackage, { status: 201 });
}
