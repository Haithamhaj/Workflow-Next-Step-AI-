import { NextResponse } from "next/server";
import { registerIntakeSource, listIntakeSourcesBySession, buildBatchSummary } from "@workflow/sources-context";
import { caseBelongsToCompany, listSourceLineageRecords } from "@workflow/persistence";
import { store } from "../../../lib/store";
import {
  getCompanyIdFromBody,
  getCompanyIdFromRequest,
  missingCompanyIdResponse,
  scopedNotFoundResponse,
} from "../../../lib/company-scope";

type Phase2InputType = "document" | "website_url" | "manual_note" | "image" | "audio";

function normalizeInputType(value: unknown): Phase2InputType {
  if (
    value === "document" ||
    value === "website_url" ||
    value === "manual_note" ||
    value === "image" ||
    value === "audio"
  ) {
    return value;
  }
  if (value === "video") {
    throw new Error("Video input is outside Pass 2 Phase 2 scope.");
  }
  return "document";
}

function sourceIdFrom(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : `isrc_${crypto.randomUUID()}`;
}

function caseIdFor(sessionId: string, value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return store.intakeSessions.findById(sessionId)?.caseId ?? "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const companyId = getCompanyIdFromRequest(request);
  if (!companyId) {
    return missingCompanyIdResponse();
  }
  const sessionId = url.searchParams.get("sessionId");
  const caseId = url.searchParams.get("caseId");
  const summary = url.searchParams.get("summary");

  if (sessionId && summary === "true") {
    const session = store.intakeSessions.findById(sessionId);
    if (!session || !caseBelongsToCompany(companyId, session.caseId, store.cases)) return scopedNotFoundResponse();
    const items = buildBatchSummary(sessionId, store.intakeSources);
    return NextResponse.json(items);
  }
  if (sessionId) {
    const session = store.intakeSessions.findById(sessionId);
    if (!session || !caseBelongsToCompany(companyId, session.caseId, store.cases)) return scopedNotFoundResponse();
    const sources = listIntakeSourcesBySession(sessionId, store.intakeSources);
    return NextResponse.json(sources);
  }
  if (!caseId) {
    return NextResponse.json({ error: "caseId is required when sessionId is not provided." }, { status: 400 });
  }
  const sources = listSourceLineageRecords(companyId, caseId, store.cases, store.intakeSources, { includeStale: true });
  return NextResponse.json(sources);
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  // Multipart/form-data: real file upload with bytes
  if (contentType.includes("multipart/form-data")) {
    return handleMultipartUpload(request);
  }

  // JSON fallback: metadata-only registration (backward compatible)
  return handleJsonRegistration(request);
}

async function handleMultipartUpload(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataStr = formData.get("metadata") as string | null;

    let meta: Record<string, unknown> = {};
    if (metadataStr) {
      try { meta = JSON.parse(metadataStr) as Record<string, unknown>; } catch { /* use defaults */ }
    }

    if (!file) {
      return NextResponse.json({ error: "No file in multipart body" }, { status: 400 });
    }

    const sessionId = String(meta.sessionId ?? "");
    const companyId = typeof meta.companyId === "string" ? meta.companyId.trim() : "";
    if (!companyId) {
      return missingCompanyIdResponse();
    }
    const caseId = caseIdFor(sessionId, meta.caseId);

    if (!sessionId || !caseId) {
      return NextResponse.json({ error: "sessionId and caseId are required" }, { status: 400 });
    }
    if (!caseBelongsToCompany(companyId, caseId, store.cases)) {
      return scopedNotFoundResponse();
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();

    const source = registerIntakeSource(
      {
        sourceId: sourceIdFrom(meta.sourceId),
        sessionId,
        companyId,
        caseId,
        inputType: normalizeInputType(meta.inputType),
        bucket: (meta.bucket as "company" | "department") ?? "company",
        displayName: typeof meta.displayName === "string" ? meta.displayName : file.name,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || "application/octet-stream",
        websiteUrl: typeof meta.websiteUrl === "string" ? meta.websiteUrl : undefined,
        noteText: typeof meta.noteText === "string" ? meta.noteText : undefined,
        noteOrigin: meta.noteOrigin as "typed_text" | "live_stt" | undefined,
      },
      store.intakeSources,
      store.intakeSessions,
    );

    // Store file bytes in-memory
    store.fileStore.set(source.sourceId, { bytes: arrayBuffer, mimeType: file.type || "application/octet-stream" });

    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("Invalid") ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}

async function handleJsonRegistration(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const b = body as Record<string, unknown>;
    const sessionId = String(b.sessionId ?? "");
    const companyId = getCompanyIdFromBody(body);
    if (!companyId) {
      return missingCompanyIdResponse();
    }
    const caseId = caseIdFor(sessionId, b.caseId);
    if (!caseBelongsToCompany(companyId, caseId, store.cases)) {
      return scopedNotFoundResponse();
    }
    const source = registerIntakeSource(
      {
        sourceId: sourceIdFrom(b.sourceId),
        sessionId,
        companyId,
        caseId,
        inputType: normalizeInputType(b.inputType),
        bucket: b.bucket as never,
        displayName: typeof b.displayName === "string" ? b.displayName : undefined,
        fileName: typeof b.fileName === "string" ? b.fileName : undefined,
        fileSize: typeof b.fileSize === "number" ? b.fileSize : undefined,
        mimeType: typeof b.mimeType === "string" ? b.mimeType : undefined,
        websiteUrl: typeof b.websiteUrl === "string" ? b.websiteUrl : undefined,
        noteText: typeof b.noteText === "string" ? b.noteText : undefined,
        noteOrigin: b.noteOrigin as "typed_text" | "live_stt" | undefined,
      },
      store.intakeSources,
      store.intakeSessions,
    );
    return NextResponse.json(source, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.startsWith("Invalid") ? 400 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
