import Link from "next/link";
import { notFound } from "next/navigation";
import { store } from "../../../lib/store";
import SourceActions from "./SourceActions";
import SourceRoleDecisionForm from "./SourceRoleDecisionForm";

export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: "8px 16px 8px 0", color: "#aaa", fontWeight: 500, verticalAlign: "top" }}>
        {label}
      </td>
      <td style={{ padding: "8px 0" }}>{value}</td>
    </tr>
  );
}

export default function IntakeSourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const source = store.intakeSources.findById(params.id);
  if (!source) notFound();
  const providerJobs = store.providerJobs.findBySourceId(source.sourceId);
  const suggestions = store.aiIntakeSuggestions.findBySourceId(source.sourceId);
  const sourceRoleDecisions = store.adminIntakeDecisions.findBySourceId(source.sourceId);
  const artifacts = store.textArtifacts.findBySourceId(source.sourceId);
  const crawlPlans = source.inputType === "website_url"
    ? store.websiteCrawlPlans.findBySourceId(source.sourceId)
    : [];
  const audioReview = source.inputType === "audio"
    ? store.audioTranscriptReviews.findBySourceId(source.sourceId)
    : null;

  return (
    <>
      <h2>Intake Source Detail</h2>
      <p>
        <Link href="/intake-sources">&larr; Back to sources</Link>
        {" | "}
        <Link href={`/intake-sessions/${source.sessionId}`}>View session</Link>
      </p>

      <div className="card" style={{ marginTop: "16px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <Row label="Source ID" value={<code>{source.sourceId}</code>} />
            <Row label="Session ID" value={<code>{source.sessionId}</code>} />
            <Row label="Case ID" value={<code>{source.caseId}</code>} />
            <Row label="Source kind" value={source.inputType} />
            <Row label="Primary bucket" value={source.bucket} />
            <Row label="Processing status" value={<code>{source.status}</code>} />
            <Row label="Admin review status" value={source.adminOverride ? "Override recorded" : "Not reviewed"} />
            <Row label="Display name" value={source.displayName ?? "Not provided"} />
            {source.fileName && <Row label="File name" value={source.fileName} />}
            {source.fileSize != null && <Row label="File size" value={`${source.fileSize} bytes`} />}
            {source.mimeType && <Row label="MIME type" value={source.mimeType} />}
            {source.websiteUrl && <Row label="Website URL" value={source.websiteUrl} />}
            {source.noteOrigin && <Row label="Note origin" value={source.noteOrigin} />}
            {source.noteText && (
              <Row
                label="Manual note"
                value={<pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{source.noteText}</pre>}
              />
            )}
            <Row label="storageRef" value="Not available in Phase 2 metadata registration" />
            <Row label="contentRef" value="Not available until provider/extraction phases" />
            <Row label="outputRef" value="Not available until provider/extraction phases" />
            <Row label="Created" value={new Date(source.createdAt).toLocaleString()} />
          </tbody>
        </table>
      </div>

      <SourceActions sourceId={source.sourceId} status={source.status} />

      {source.inputType === "website_url" && (
        <div className="card" style={{ marginTop: "16px" }}>
          <h3 style={{ margin: "0 0 8px" }}>Website Crawl</h3>
          <p style={{ marginTop: 0, color: "var(--fg-muted)" }}>
            Candidate discovery, approval, Crawl4AI execution, summary, chunks, and embeddings are tracked as intake/context infrastructure.
          </p>
          <p>
            <Link href={`/intake-sources/${source.sourceId}/crawl-approval`}>Open crawl approval flow</Link>
          </p>
          {crawlPlans.length === 0 ? (
            <p style={{ margin: 0, color: "var(--fg-muted)" }}>No crawl plan has been created yet.</p>
          ) : (
            <ul>
              {crawlPlans.map((plan) => (
                <li key={plan.crawlPlanId}>
                  <code>{plan.status}</code> — max pages {plan.maxPages} — candidates {plan.candidatePages.length}
                  {plan.errorMessage ? ` — ${plan.errorMessage}` : ""}
                </li>
              ))}
            </ul>
          )}
          <p style={{ margin: "8px 0 0", color: "var(--fg-muted)", fontSize: "0.85rem" }}>
            Page-level crawl content is hidden by default and available only from the crawl drill-down.
          </p>
        </div>
      )}

      {source.inputType === "audio" && (
        <div className="card" style={{ marginTop: "16px" }}>
          <h3 style={{ margin: "0 0 8px" }}>External Audio Transcript Review</h3>
          <p style={{ marginTop: 0, color: "var(--fg-muted)" }}>
            Raw external audio transcripts remain draft text until an admin approves or edits them.
          </p>
          <p>
            <Link href={`/intake-sources/${source.sourceId}/audio-review`}>Open transcript review</Link>
          </p>
          <p style={{ margin: 0 }}>
            Review status: <code>{audioReview?.status ?? "transcription_pending"}</code>
          </p>
          <p style={{ margin: "8px 0 0", color: "var(--fg-muted)", fontSize: "0.85rem" }}>
            Live admin dictation remains separate and may only save text as a manual/operator note.
          </p>
        </div>
      )}

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Provider Jobs</h3>
        {providerJobs.length === 0 ? (
          <p style={{ margin: 0, color: "var(--fg-muted)" }}>No provider jobs yet.</p>
        ) : (
          <ul>
            {providerJobs.map((job) => (
              <li key={job.jobId}>
                <code>{job.jobKind}</code> — <code>{job.status}</code>
                {job.errorMessage ? ` — ${job.errorMessage}` : ""}
                {job.outputRef ? ` — outputRef: ${job.outputRef}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>AI Intake Suggestions</h3>
        {suggestions.length === 0 ? (
          <p style={{ margin: 0, color: "var(--fg-muted)" }}>No source-role suggestion generated yet.</p>
        ) : (
          <ul>
            {suggestions.map((suggestion) => (
              <li key={suggestion.suggestionId}>
                <code>{suggestion.status}</code>
                {suggestion.suggestedSourceRole ? ` — ${suggestion.suggestedSourceRole}` : ""}
                {suggestion.shortRationale ? ` — ${suggestion.shortRationale}` : ""}
                {suggestion.errorMessage ? ` — ${suggestion.errorMessage}` : ""}
              </li>
            ))}
          </ul>
        )}
        <p style={{ margin: "8px 0 0", color: "var(--fg-muted)", fontSize: "0.85rem" }}>
          Suggestions are source-role intake triage only, not deep reference analysis.
        </p>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Admin Source-Role Decision</h3>
        <p style={{ marginTop: 0, color: "var(--fg-muted)" }}>
          Confirm, edit, override, or mark the AI source-role suggestion for review. The original AI suggestion remains stored separately.
        </p>
        <SourceRoleDecisionForm
          sourceId={source.sourceId}
          suggestionId={suggestions.at(-1)?.suggestionId}
          suggestedRole={suggestions.at(-1)?.suggestedSourceRole}
          suggestedScope={suggestions.at(-1)?.suggestedScope}
        />
        {sourceRoleDecisions.length > 0 && (
          <ul>
            {sourceRoleDecisions.map((decision) => (
              <li key={decision.decisionId}>
                <code>{decision.decision}</code>
                {decision.finalSourceRole ? ` — ${decision.finalSourceRole}` : ""}
                {decision.finalScope ? ` — ${decision.finalScope}` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <h3 style={{ margin: "0 0 8px" }}>Artifacts</h3>
        {artifacts.length === 0 ? (
          <p style={{ margin: 0, color: "var(--fg-muted)" }}>No extracted text, transcript, or embedding artifact yet.</p>
        ) : (
          <ul>
            {artifacts.map((artifact) => (
              <li key={artifact.artifactId}>
                <code>{artifact.artifactKind}</code> — <code>{artifact.artifactId}</code>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
