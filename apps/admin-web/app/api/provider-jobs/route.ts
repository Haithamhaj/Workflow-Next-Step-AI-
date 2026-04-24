import { NextResponse } from "next/server";
import { store } from "../../../lib/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sourceId = url.searchParams.get("sourceId");
  const sessionId = url.searchParams.get("sessionId");
  if (sourceId) return NextResponse.json(store.providerJobs.findBySourceId(sourceId));
  if (sessionId) return NextResponse.json(store.providerJobs.findBySessionId(sessionId));
  return NextResponse.json(store.providerJobs.findAll());
}
