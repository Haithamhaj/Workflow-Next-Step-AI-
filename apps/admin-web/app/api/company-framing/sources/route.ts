import { NextResponse } from "next/server";
import { registerFramingSource } from "@workflow/company-framing";
import { store } from "../../../../lib/store";

type FramingInputType = "document" | "website_url" | "manual_note" | "image" | "audio";

function inputTypeFrom(value: unknown): FramingInputType | undefined {
  return value === "document"
    || value === "website_url"
    || value === "manual_note"
    || value === "image"
    || value === "audio"
    ? value
    : undefined;
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArrayFrom(value: unknown): string[] | undefined {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get("companyId");
  const status = url.searchParams.get("status");
  const inputType = url.searchParams.get("inputType");

  const sources = companyId
    ? store.framingSources.findByCompanyId(companyId)
    : store.framingSources.findAll();

  return NextResponse.json(
    sources.filter((source) =>
      (!status || source.status === status)
      && (!inputType || source.inputType === inputType)
    ),
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  if ("caseId" in b || "sessionId" in b) {
    return NextResponse.json(
      { error: "FramingSource is pre-case material; caseId and sessionId are not accepted." },
      { status: 400 },
    );
  }

  const inputType = inputTypeFrom(b.inputType);
  if (!inputType) {
    return NextResponse.json({ error: "inputType is required." }, { status: 400 });
  }

  const result = registerFramingSource(
    {
      framingSourceId: stringFrom(b.framingSourceId),
      companyId: stringFrom(b.companyId) ?? "",
      inputType,
      framingRunIds: stringArrayFrom(b.framingRunIds),
      displayName: stringFrom(b.displayName),
      fileName: stringFrom(b.fileName),
      mimeType: stringFrom(b.mimeType),
      websiteUrl: stringFrom(b.websiteUrl),
      noteText: stringFrom(b.noteText),
    },
    store.framingSources,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error.message, code: result.error.code }, { status: 400 });
  }

  return NextResponse.json(result.source, { status: 201 });
}
