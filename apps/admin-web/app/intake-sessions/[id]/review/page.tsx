import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "../../../../lib/store";

export const dynamic = "force-dynamic";

export default function ReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = store.intakeSessions.findById(params.id);
  if (!session) notFound();

  const sources = store.intakeSources.findBySessionId(params.id);
  const notes = sources.filter((source) => source.inputType === "manual_note" && source.noteText);

  return (
    <>
      <h2>Phase 2 Intake Review</h2>
      <p>
        <Link href={`/intake-sessions/${params.id}`}>&larr; Session detail</Link>
        {" | "}
        <Link href={`/intake-sessions/${params.id}/batch-summary`}>Batch summary</Link>
      </p>

      <div className="card" style={{ marginTop: "16px" }}>
        <p style={{ margin: 0, color: "var(--fg-muted)" }}>
          This review is metadata-only. Structured context, provider extraction, crawl output, transcription, and embeddings are deferred to later phases.
        </p>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Session</h3>
        <p style={{ margin: 0 }}>
          <code>{session.sessionId}</code> for case <code>{session.caseId}</code>, status <code>{session.status}</code>.
        </p>
      </div>

      {notes.length > 0 && (
        <div className="card" style={{ marginTop: "16px" }}>
          <h3 style={{ margin: "0 0 8px" }}>Manual Notes ({notes.length})</h3>
          {notes.map((note) => (
            <div key={note.sourceId} style={{ marginBottom: "8px" }}>
              <Link href={`/intake-sources/${note.sourceId}`}>
                {note.displayName ?? "Untitled note"}
              </Link>
              <p style={{ margin: "4px 0 0", color: "var(--fg-muted)", whiteSpace: "pre-wrap" }}>
                {note.noteText}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Source Counts</h3>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <span>Documents: {sources.filter((source) => source.inputType === "document").length}</span>
          <span>Websites: {sources.filter((source) => source.inputType === "website_url").length}</span>
          <span>Notes: {sources.filter((source) => source.inputType === "manual_note").length}</span>
          <span>Images: {sources.filter((source) => source.inputType === "image").length}</span>
          <span>Audio: {sources.filter((source) => source.inputType === "audio").length}</span>
        </div>
      </div>
    </>
  );
}
