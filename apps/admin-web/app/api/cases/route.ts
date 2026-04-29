import { NextResponse } from "next/server";
import { validateCaseConfiguration } from "@workflow/contracts";
import { createCase, listCases } from "@workflow/core-case";
import { DEFAULT_LOCAL_COMPANY_ID } from "@workflow/persistence";
import { store } from "../../../lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId") ?? DEFAULT_LOCAL_COMPANY_ID;
  const cases = listCases(store.cases, companyId);
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
    if (!store.companies.findById(result.value.companyId)) {
      return NextResponse.json(
        { error: `Company '${result.value.companyId}' not found.` },
        { status: 404 },
      );
    }
    const c = createCase(result.value, store.cases);
    return NextResponse.json(c, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
