/**
 * STT (Speech-to-Text) provider interface contract (§9, §11).
 * Audio modes: external_upload vs live_stt are architecturally separate.
 * The same provider interface may transcribe either mode; callers own the
 * review/source-save boundary.
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

  /** Transcribe provided audio bytes. */
  transcribe(input: { audioData: Uint8Array; mimeType: string }): Promise<STTResult>;
}
