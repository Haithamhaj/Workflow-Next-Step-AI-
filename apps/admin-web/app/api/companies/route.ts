import { NextResponse } from "next/server";
import { validateCompany } from "@workflow/contracts";
import { createCompany, listCompanies } from "@workflow/core-case";
import { store } from "../../../lib/store";

export async function GET() {
  return NextResponse.json(listCompanies(store.companies));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateCompany(body);
  if (!result.ok) {
    return NextResponse.json(
      { errors: result.errors.map((e) => e.message ?? String(e)) },
      { status: 400 },
    );
  }

  try {
    const company = createCompany(result.value, store.companies);
    return NextResponse.json(company, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
