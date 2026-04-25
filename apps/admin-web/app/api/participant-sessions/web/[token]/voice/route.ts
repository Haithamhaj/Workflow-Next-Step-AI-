import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import {
  resolveSessionAccessToken,
  submitWebSessionFirstNarrativeVoice,
} from "@workflow/participant-sessions";
import { store } from "../../../../../../lib/store";

const repos = {
  sessionAccessTokens: store.sessionAccessTokens,
  participantSessions: store.participantSessions,
  rawEvidenceItems: store.rawEvidenceItems,
};

function statusFor(code: string): number {
  if (code === "narrative_already_submitted") return 409;
  if (code === "missing_audio_artifact") return 400;
  if (code === "token_not_found" || code === "session_not_found") return 404;
  if (
    code === "token_expired" ||
    code === "token_revoked" ||
    code === "token_completed" ||
    code === "token_blocked_review_required" ||
    code === "channel_type_mismatch"
  ) {
    return 403;
  }
  return 400;
}

function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+/, "");
  return cleaned || "participant-voice-upload";
}

async function storeAudioArtifact(file: File): Promise<{ artifactRef: string; originalFileName: string }> {
  const originalFileName = safeFileName(file.name || "participant-voice-upload");
  const artifactId = `participant_audio_${crypto.randomUUID()}`;
  const fileName = `${artifactId}_${originalFileName}`;
  const relativePath = join("data", "participant-session-audio", fileName);
  const absolutePath = join(process.cwd(), relativePath);
  await mkdir(join(process.cwd(), "data", "participant-session-audio"), { recursive: true });
  await writeFile(absolutePath, Buffer.from(await file.arrayBuffer()));
  return {
    artifactRef: `file:${relativePath}`,
    originalFileName,
  };
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Voice upload must use multipart/form-data." }, { status: 400 });
  }

  const formData = await request.formData();
  const file = formData.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A non-empty audio file is required." }, { status: 400 });
  }
  if (file.type && !file.type.startsWith("audio/") && file.type !== "application/octet-stream") {
    return NextResponse.json({ error: "Uploaded file must be an audio file." }, { status: 400 });
  }

  const resolved = resolveSessionAccessToken(params.token, store.sessionAccessTokens, store.participantSessions);
  if (!resolved.ok) {
    const first = resolved.errors[0];
    return NextResponse.json(
      { error: first?.message ?? "Unable to resolve session token.", code: first?.code ?? "unknown_error" },
      { status: statusFor(first?.code ?? "unknown_error") },
    );
  }
  if (resolved.token.channelType !== "web_session_chatbot") {
    return NextResponse.json(
      { error: "Session access token is not a web session token.", code: "channel_type_mismatch" },
      { status: 403 },
    );
  }
  const existingEvidenceItemId =
    resolved.participantSession.firstNarrativeEvidenceId ??
    resolved.participantSession.rawEvidence.firstNarrativeEvidenceId;
  if (existingEvidenceItemId) {
    return NextResponse.json(
      {
        error: "First narrative has already been submitted for this participant session.",
        code: "narrative_already_submitted",
        existingEvidenceItemId,
      },
      { status: 409 },
    );
  }

  const artifact = await storeAudioArtifact(file);
  const result = submitWebSessionFirstNarrativeVoice(params.token, artifact, repos);
  if (!result.ok) {
    const first = result.errors[0];
    return NextResponse.json(
      {
        error: first?.message ?? "Unable to submit voice narrative.",
        code: first?.code ?? "unknown_error",
        existingEvidenceItemId: result.existingEvidenceItemId,
      },
      { status: statusFor(first?.code ?? "unknown_error") },
    );
  }

  return NextResponse.json(
    {
      participantSession: result.participantSession,
      rawEvidenceItem: result.rawEvidenceItem,
    },
    { status: 201 },
  );
}
