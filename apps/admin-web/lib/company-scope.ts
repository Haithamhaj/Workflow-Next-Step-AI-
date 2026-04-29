import { NextResponse } from "next/server";

export function getCompanyIdFromRequest(request: Request): string {
  return new URL(request.url).searchParams.get("companyId")?.trim() ?? "";
}

export function getCompanyIdFromBody(body: unknown): string {
  if (typeof body !== "object" || body === null) {
    return "";
  }
  const value = (body as { companyId?: unknown }).companyId;
  return typeof value === "string" ? value.trim() : "";
}

export function missingCompanyIdResponse(): NextResponse {
  return NextResponse.json(
    { error: "companyId is required for scoped access." },
    { status: 400 },
  );
}

export function scopedNotFoundResponse(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
