import Link from "next/link";

export default function STTPage() {
  return (
    <>
      <h2>Live Dictation</h2>
      <p>
        <Link href="/intake-sessions">&larr; Intake</Link>
      </p>
      <div className="card">
        <p style={{ marginTop: 0, color: "var(--fg-muted)" }}>
          Live speech-to-text uses the configured Google STT provider path and remains separate from external audio-file transcript review.
        </p>
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          Live dictation does not create a case source until the admin saves the resulting text as a manual/operator note.
        </p>
      </div>
    </>
  );
}
