import { NextResponse } from "next/server";
import {
  createInitialPackage,
  listInitialPackages,
} from "@workflow/packages-output";
import { store } from "../../../lib/store";

export async function GET() {
  return NextResponse.json(listInitialPackages(store.initialPackages));
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
  const outcome = createInitialPackage(body, store.initialPackages);
  if (!outcome.ok) {
    const status = outcome.error.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }
  return NextResponse.json(outcome.initialPackage, { status: 201 });
}
