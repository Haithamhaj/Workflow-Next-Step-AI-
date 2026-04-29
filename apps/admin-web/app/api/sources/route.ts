import { NextResponse } from "next/server";
import { registerSource } from "@workflow/sources-context";
import {
  caseBelongsToCompany,
  listRecordsByCompany,
  listRecordsByCompanyAndCase,
} from "@workflow/persistence";
import { store } from "../../../lib/store";
import {
  getCompanyIdFromBody,
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../lib/company-scope";

export async function GET(request: Request) {
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }

  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId")?.trim();
  const sources = caseId
    ? listRecordsByCompanyAndCase(companyId, caseId, store.cases, store.sources)
    : listRecordsByCompany(companyId, store.cases, store.sources);
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
    const companyId = getCompanyIdFromBody(body);
    if (!companyId) {
      return missingCompanyIdResponse();
    }
    const scopedBody = body as { companyId?: unknown; caseId?: unknown };
    const caseId = typeof scopedBody.caseId === "string"
      ? scopedBody.caseId.trim()
      : "";
    if (!caseId) {
      return NextResponse.json({ error: "caseId is required." }, { status: 400 });
    }
    if (!caseBelongsToCompany(companyId, caseId, store.cases)) {
      return scopedNotFoundResponse();
    }
    const { companyId: _companyId, ...sourcePayload } = scopedBody;
    const source = registerSource(sourcePayload, store.sources);
    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Validation errors (Invalid SourceRegistration: ...) → 400
    // Duplicate guard (Source already registered: ...) → 409
    const status = message.startsWith("Invalid SourceRegistration") ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
