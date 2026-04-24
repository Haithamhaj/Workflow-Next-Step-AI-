import type { STTProvider, STTResult } from "./stt-provider.js";

function getEnv(key: string): string | undefined {
  try {
    return ((globalThis as Record<string, unknown>).process as { env: Record<string, string | undefined> } | undefined)?.env?.[key];
  } catch {
    return undefined;
  }
}

export function defaultGoogleSTTModel(): string {
  return getEnv("GOOGLE_STT_EXTERNAL_MODEL") ?? "latest_long";
}

function getGoogleSTTProjectId(): string | undefined {
  return getEnv("GOOGLE_STT_PROJECT_ID") ?? getEnv("GOOGLE_CLOUD_PROJECT") ?? getEnv("GCLOUD_PROJECT");
}

function getGoogleSTTLocation(): string {
  return getEnv("GOOGLE_STT_LOCATION") ?? "global";
}

function getGoogleSTTRecognizerId(): string {
  return getEnv("GOOGLE_STT_RECOGNIZER") ?? "default-recognizer";
}

function getLanguageCodes(): string[] {
  const configured = getEnv("GOOGLE_STT_LANGUAGE_CODES") ?? getEnv("GOOGLE_STT_LANGUAGE_CODE") ?? "en-US";
  return configured
    .split(",")
    .map((languageCode) => languageCode.trim())
    .filter(Boolean);
}

function toBase64(audioData: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < audioData.byteLength; index++) {
    binary += String.fromCharCode(audioData[index]!);
  }
  return btoa(binary);
}

function summarizeConfidence(alternatives: Array<{ confidence?: number }>): number | undefined {
  const confidenceValues = alternatives
    .map((alternative) => alternative.confidence)
    .filter((confidence): confidence is number => typeof confidence === "number");
  return confidenceValues.length > 0
    ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
    : undefined;
}

function qualitySignal(confidence: number | undefined): string {
  return confidence == null ? "confidence_not_returned" : `average_confidence:${confidence.toFixed(3)}`;
}

export class GoogleSpeechToTextProvider implements STTProvider {
  readonly name = "google_speech_to_text";

  async transcribe(input: { audioData: Uint8Array; mimeType: string }): Promise<STTResult> {
    const apiKey = getEnv("GOOGLE_STT_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_STT_API_KEY is not configured for Google Speech-to-Text.");
    }
    const model = defaultGoogleSTTModel();
    if (model === "chirp_3") {
      return this.transcribeV2(input, apiKey, model);
    }
    return this.transcribeV1(input, apiKey, model);
  }

  private async transcribeV1(
    input: { audioData: Uint8Array; mimeType: string },
    apiKey: string,
    model: string,
  ): Promise<STTResult> {
    const languageCode = getLanguageCodes()[0] ?? "en-US";
    const audioContent = toBase64(input.audioData);
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
      results?: Array<{ alternatives?: Array<{ transcript?: string; confidence?: number }> }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Google Speech-to-Text failed with ${response.status}`);
    }
    const alternatives = payload.results?.flatMap((result) => result.alternatives?.[0] ?? []) ?? [];
    const text = alternatives.flatMap((alternative) => alternative.transcript ?? []).join("\n");
    const confidence = summarizeConfidence(alternatives);
    return {
      text,
      provider: "google_speech_to_text",
      language: languageCode,
      confidence,
      qualitySignal: qualitySignal(confidence),
      model,
    };
  }

  private async transcribeV2(
    input: { audioData: Uint8Array; mimeType: string },
    apiKey: string,
    model: string,
  ): Promise<STTResult> {
    const projectId = getGoogleSTTProjectId();
    if (!projectId) {
      throw new Error("GOOGLE_STT_PROJECT_ID, GOOGLE_CLOUD_PROJECT, or GCLOUD_PROJECT is required for Google Speech-to-Text V2 chirp_3.");
    }
    const location = getGoogleSTTLocation();
    const recognizerId = getGoogleSTTRecognizerId();
    const languageCodes = getLanguageCodes();
    const audioContent = toBase64(input.audioData);
    const recognizer = `projects/${projectId}/locations/${location}/recognizers/${recognizerId}`;
    const response = await fetch(
      `https://speech.googleapis.com/v2/${recognizer}:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recognizer,
          config: {
            autoDecodingConfig: {},
            languageCodes,
            model,
          },
          content: audioContent,
        }),
      },
    );
    const payload = await response.json() as {
      results?: Array<{ alternatives?: Array<{ transcript?: string; confidence?: number }>; languageCode?: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(payload.error?.message ?? `Google Speech-to-Text V2 failed with ${response.status}`);
    }
    const alternatives = payload.results?.flatMap((result) => result.alternatives?.[0] ?? []) ?? [];
    const text = alternatives.flatMap((alternative) => alternative.transcript ?? []).join("\n");
    const confidence = summarizeConfidence(alternatives);
    return {
      text,
      provider: "google_speech_to_text",
      language: payload.results?.find((result) => result.languageCode)?.languageCode ?? languageCodes[0] ?? "en-US",
      confidence,
      qualitySignal: qualitySignal(confidence),
      model,
    };
  }
}
