/**
 * STT (Speech-to-Text) provider interface contract (§9, §11).
 * Audio modes: external_upload vs live_stt are architecturally separate.
 * This interface covers the external upload mode; live_stt is deferred.
 */

export interface STTResult {
  text: string;
  language?: string;
  durationSeconds?: number;
  confidence?: number;
  qualitySignal?: string;
  provider: string;
  model?: string;
}

export interface STTProvider {
  readonly name: string;

  /** Transcribe an audio file (external upload mode, §9). */
  transcribe(input: { audioData: Uint8Array; mimeType: string }): Promise<STTResult>;
}
