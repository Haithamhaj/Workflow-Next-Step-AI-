import { NextResponse } from "next/server";
import { validateCaseConfiguration } from "@workflow/contracts";
import { createCase, listCases } from "@workflow/core-case";
import { store } from "../../../lib/store";

export async function GET() {
  const cases = listCases(store.cases);
  return NextResponse.json(cases);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateCaseConfiguration(body);
  if (!result.ok) {
    return NextResponse.json(
      { errors: result.errors.map((e) => e.message ?? String(e)) },
      { status: 400 }
    );
  }

  try {
    const c = createCase(result.value, store.cases);
    return NextResponse.json(c, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
