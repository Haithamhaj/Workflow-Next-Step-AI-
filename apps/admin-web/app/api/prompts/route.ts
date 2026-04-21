import { NextResponse } from "next/server";
import { registerPrompt, listPrompts } from "@workflow/prompts";
import { store } from "../../../lib/store";

export async function GET() {
  const prompts = listPrompts(store.prompts);
  return NextResponse.json(prompts);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const outcome = registerPrompt(body, store.prompts);

  if (!outcome.ok) {
    const status = outcome.error.includes("already registered") ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.prompt, { status: 201 });
}
