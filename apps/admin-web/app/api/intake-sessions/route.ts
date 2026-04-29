import { NextResponse } from "next/server";
import { createIntakeSession } from "@workflow/sources-context";
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
  const url = new URL(request.url);
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }

  const caseId = url.searchParams.get("caseId");
  const sessions = caseId
    ? listRecordsByCompanyAndCase(companyId, caseId, store.cases, store.intakeSessions)
    : listRecordsByCompany(companyId, store.cases, store.intakeSessions);
  return NextResponse.json(sessions);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const b = body as Record<string, unknown>;
    const companyId = getCompanyIdFromBody(body);
    if (!companyId) {
      return missingCompanyIdResponse();
    }
    const caseId = String(b.caseId ?? "").trim();
    if (!caseId) {
      return NextResponse.json({ error: "caseId is required." }, { status: 400 });
    }
    if (!caseBelongsToCompany(companyId, caseId, store.cases)) {
      return scopedNotFoundResponse();
    }
    const session = createIntakeSession(
      {
        sessionId: typeof b.sessionId === "string" && b.sessionId.trim()
          ? b.sessionId.trim()
          : `intake_${crypto.randomUUID()}`,
        caseId,
        bucket: (b.bucket as "company" | "department") ?? "company",
        defaultProvider: "google",
        availableProviders: ["google", "openai"],
      },
      store.intakeSessions,
    );
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("Invalid") ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
