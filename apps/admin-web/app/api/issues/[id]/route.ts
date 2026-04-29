import { NextResponse } from "next/server";
import { findRecordByCompany } from "@workflow/persistence";
import { store } from "../../../../lib/store";
import {
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../../lib/company-scope";

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }

  const issue = findRecordByCompany(companyId, context.params.id, store.cases, store.reviewIssues);
  if (issue === null) {
    return scopedNotFoundResponse();
  }

  return NextResponse.json(issue);
}
