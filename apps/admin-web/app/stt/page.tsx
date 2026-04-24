import Link from "next/link";

export default function STTPage() {
  return (
    <>
      <h2>Live Dictation</h2>
      <p>
        <Link href="/intake-sessions">&larr; Intake</Link>
      </p>
      <div className="card">
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          Live speech-to-text remains separate from external audio-file transcription. Live dictation may only save text as a manual/operator note in Pass 2.
        </p>
      </div>
    </>
  );
}
