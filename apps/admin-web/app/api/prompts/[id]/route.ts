import { NextResponse } from "next/server";
import { getPrompt } from "@workflow/prompts";
import { store } from "../../../../lib/store";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const prompt = getPrompt(params.id, store.prompts);
  if (prompt === null) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }
  return NextResponse.json(prompt);
}
