import type { STTProvider, STTResult } from "./stt-provider.js";

function getEnv(key: string): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.[key];
  } catch {
    return undefined;
  }
}

export function defaultGoogleSTTModel(): string {
  return getEnv("GOOGLE_STT_MODEL") ?? "chirp";
}

export class GoogleSpeechToTextProvider implements STTProvider {
  readonly name = "google_speech_to_text";

  async transcribe(input: { audioData: Uint8Array; mimeType: string }): Promise<STTResult> {
    const apiKey = getEnv("GOOGLE_STT_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_STT_API_KEY is not configured for Google Speech-to-Text.");
    }
    const languageCode = getEnv("GOOGLE_STT_LANGUAGE_CODE") ?? "en-US";
    const model = defaultGoogleSTTModel();
    let binary = "";
    for (let index = 0; index < input.audioData.byteLength; index++) {
      binary += String.fromCharCode(input.audioData[index]!);
    }
    const audioContent = btoa(binary);
    const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        config: {
          encoding: input.mimeType.includes("wav") ? "LINEAR16" : "ENCODING_UNSPECIFIED",
          languageCode,
          model,
        },
        audio: { content: audioContent },
      }),
    });
    const payload = await response.json() as {
      results?: Array<{ alternatives?: Array<{ transcript?: string }> }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Google Speech-to-Text failed with ${response.status}`);
    }
    const text = payload.results?.flatMap((result) => result.alternatives?.[0]?.transcript ?? []).join("\n") ?? "";
    return { text, provider: "google_speech_to_text", language: languageCode };
  }
}
