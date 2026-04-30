import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { store } from "../../../../lib/store";
import { StatusForm } from "./StatusForm";

export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "0.65rem 0", borderBottom: "1px solid var(--border)" }}>
      <dt className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.2rem" }}>{label}</dt>
      <dd style={{ margin: 0 }}>{children || <span className="muted">Not set</span>}</dd>
    </div>
  );
}

export default function FramingSourceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const source = store.framingSources.findById(params.id);
  if (!source) notFound();

  return (
    <main data-testid="framing-source-detail">
      <Link href="/company-framing/sources">Back to framing sources</Link>
      <h2>Framing source detail</h2>

      <div
        data-testid="framing-source-boundary-note"
        style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "1rem", marginBottom: "1rem" }}
      >
        <strong>Pre-case source boundary</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          This is a pre-case source used for company-level candidate framing. It is not participant evidence,
          not workflow truth, not a case-bound IntakeSource, and does not start Pass 2B or provider processing.
        </p>
        <p data-testid="framing-source-no-caseid-note" className="muted" style={{ marginBottom: 0 }}>
          No caseId exists on this FramingSource record.
        </p>
      </div>

      <dl style={{ margin: 0 }}>
        <Field label="Framing source ID"><code>{source.framingSourceId}</code></Field>
        <Field label="Company ID"><code>{source.companyId}</code></Field>
        <Field label="Input type">{source.inputType}</Field>
        <Field label="Status"><code>{source.status}</code></Field>
        <Field label="Source version">{source.sourceVersion}</Field>
        <Field label="Display name">{source.displayName}</Field>
        <Field label="File name">{source.fileName}</Field>
        <Field label="MIME type">{source.mimeType}</Field>
        <Field label="Website URL">{source.websiteUrl}</Field>
        <Field label="Note text">{source.noteText}</Field>
        <Field label="Framing run IDs">
          {source.framingRunIds?.length ? source.framingRunIds.map((id) => <code key={id}>{id} </code>) : null}
        </Field>
        <Field label="Extracted text ref">{source.extractedTextRef}</Field>
        <Field label="Processing job refs">
          {source.processingJobRefs?.length ? source.processingJobRefs.map((id) => <code key={id}>{id} </code>) : null}
        </Field>
        <Field label="Failure reason">{source.failureReason}</Field>
        <Field label="Created at">{source.createdAt}</Field>
        <Field label="Updated at">{source.updatedAt}</Field>
      </dl>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Status metadata</h3>
        <p className="muted">
          Updating status here only changes metadata. It does not run OCR, STT, extraction, crawling, AI, or promotion.
        </p>
        <StatusForm sourceId={source.framingSourceId} initialStatus={source.status} />
      </section>
    </main>
  );
}
