import { NextResponse } from "next/server";
import { providerRegistry } from "@workflow/integrations";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    audioBase64?: string;
    mimeType?: string;
  };
  if (!body.audioBase64) {
    return NextResponse.json({ error: "audioBase64 is required" }, { status: 400 });
  }
  const provider = providerRegistry.getSTTProvider();
  if (!provider) {
    return NextResponse.json(
      { error: "GOOGLE_STT_API_KEY is not configured for live dictation." },
      { status: 424 },
    );
  }
  try {
    const result = await provider.transcribe({
      audioData: Uint8Array.from(atob(body.audioBase64), (char) => char.charCodeAt(0)),
      mimeType: body.mimeType ?? "audio/wav",
    });
    return NextResponse.json({
      mode: "live_stt",
      transcriptText: result.text,
      provider: result.provider,
      model: result.model,
      language: result.language,
      confidence: result.confidence,
      qualitySignal: result.qualitySignal,
      sourceCreated: false,
      sourceBoundary: "save_as_manual_note_required",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 424 },
    );
  }
}
