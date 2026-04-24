import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrCreateAudioTranscriptReview } from "@workflow/sources-context";
import { store } from "../../../../lib/store";
import AudioReviewClient from "./AudioReviewClient";

export const dynamic = "force-dynamic";

export default function AudioReviewPage({ params }: { params: { id: string } }) {
  const source = store.intakeSources.findById(params.id);
  if (!source || source.inputType !== "audio") notFound();
  const review = getOrCreateAudioTranscriptReview({
    sourceId: source.sourceId,
    repos: store,
  });
  const providerJobs = store.providerJobs.findBySourceId(source.sourceId).filter((job) => job.jobKind === "audio_transcription");
  const rawArtifact = review.rawTranscriptArtifactId ? store.textArtifacts.findById(review.rawTranscriptArtifactId) : null;
  const trustedArtifact = review.trustedTranscriptArtifactId ? store.textArtifacts.findById(review.trustedTranscriptArtifactId) : null;
  const chunks = store.contentChunks.findBySourceId(source.sourceId).filter((chunk) => chunk.pageContentId === review.reviewId);
  const embeddingJobs = store.embeddingJobs.findBySourceId(source.sourceId);

  return (
    <>
      <h2>External Audio Transcript Review</h2>
      <p>
        <Link href={`/intake-sources/${source.sourceId}`}>&larr; Source detail</Link>
      </p>
      <div className="card">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <tr><td style={{ padding: "6px 12px 6px 0", color: "var(--fg-muted)" }}>Source</td><td><code>{source.sourceId}</code></td></tr>
            <tr><td style={{ padding: "6px 12px 6px 0", color: "var(--fg-muted)" }}>File</td><td>{source.fileName ?? source.displayName ?? "Audio source"}</td></tr>
            <tr><td style={{ padding: "6px 12px 6px 0", color: "var(--fg-muted)" }}>MIME type</td><td>{source.mimeType ?? "Not provided"}</td></tr>
            <tr><td style={{ padding: "6px 12px 6px 0", color: "var(--fg-muted)" }}>Review status</td><td><code>{review.status}</code></td></tr>
            <tr><td style={{ padding: "6px 12px 6px 0", color: "var(--fg-muted)" }}>Raw artifact</td><td>{rawArtifact ? <code>{rawArtifact.artifactId}</code> : "None"}</td></tr>
            <tr><td style={{ padding: "6px 12px 6px 0", color: "var(--fg-muted)" }}>Trusted artifact</td><td>{trustedArtifact ? <code>{trustedArtifact.artifactId}</code> : "None"}</td></tr>
          </tbody>
        </table>
      </div>

      <AudioReviewClient sourceId={source.sourceId} initialReview={review} />

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Transcription Provider Jobs</h3>
        {providerJobs.length === 0 ? (
          <p style={{ color: "var(--fg-muted)" }}>No transcription provider jobs yet.</p>
        ) : (
          <ul>
            {providerJobs.map((job) => (
              <li key={job.jobId}>
                <code>{job.status}</code> — <code>{job.jobId}</code>
                {job.outputRef ? ` — raw outputRef: ${job.outputRef}` : ""}
                {job.errorMessage ? ` — ${job.errorMessage}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Trusted Text Infrastructure</h3>
        <p style={{ color: "var(--fg-muted)" }}>
          Chunks and embedding jobs are created only from approved or edited transcript text.
        </p>
        <p>Chunks: {chunks.length}</p>
        <p>Embedding jobs: {embeddingJobs.length}</p>
      </div>
    </>
  );
}
