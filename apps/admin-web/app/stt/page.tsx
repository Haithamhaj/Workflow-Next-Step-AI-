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
          Live speech-to-text is deferred to the provider phase. Phase 2 does not implement an STT provider or claim provider-backed transcription.
        </p>
      </div>
    </>
  );
}
