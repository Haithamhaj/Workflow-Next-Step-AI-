import { NextResponse } from "next/server";
import { registerSource, listSources } from "@workflow/sources-context";
import { store } from "../../../lib/store";

export async function GET() {
  const sources = listSources(store.sources);
  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const source = registerSource(body, store.sources);
    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Validation errors (Invalid SourceRegistration: ...) → 400
    // Duplicate guard (Source already registered: ...) → 409
    const status = message.startsWith("Invalid SourceRegistration") ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
