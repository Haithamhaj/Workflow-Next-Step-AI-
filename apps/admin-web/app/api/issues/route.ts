import { NextResponse } from "next/server";
import {
  createReviewIssue,
} from "@workflow/review-issues";
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
  const issues = caseId
    ? listRecordsByCompanyAndCase(companyId, caseId, store.cases, store.reviewIssues)
    : listRecordsByCompany(companyId, store.cases, store.reviewIssues);
  return NextResponse.json(issues);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const companyId = getCompanyIdFromBody(body);
  if (!companyId) {
    return missingCompanyIdResponse();
  }
  const scopedBody = body as { companyId?: unknown; caseId?: unknown };
  const caseId = typeof scopedBody.caseId === "string" ? scopedBody.caseId.trim() : "";
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required." }, { status: 400 });
  }
  if (!caseBelongsToCompany(companyId, caseId, store.cases)) {
    return scopedNotFoundResponse();
  }

  const { companyId: _companyId, ...issuePayload } = scopedBody;
  const outcome = createReviewIssue(issuePayload, store.reviewIssues);
  if (!outcome.ok) {
    const status = outcome.error.includes("already exists") ? 409 : 400;
    return NextResponse.json({ error: outcome.error }, { status });
  }

  return NextResponse.json(outcome.issue, { status: 201 });
}
