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
  { params }: { params: { id: string } }
) {
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }

  const source = findRecordByCompany(companyId, params.id, store.cases, store.sources);
  if (source === null) {
    return scopedNotFoundResponse();
  }
  return NextResponse.json(source);
}
