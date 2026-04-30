import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { store } from "../../../../lib/store";
import { DecisionForm } from "./DecisionForm";

export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "0.65rem 0", borderBottom: "1px solid var(--border)" }}>
      <dt className="muted" style={{ fontSize: "0.82rem", marginBottom: "0.2rem" }}>{label}</dt>
      <dd style={{ margin: 0 }}>{children || <span className="muted">Not set</span>}</dd>
    </div>
  );
}

function codeList(items?: string[]) {
  return items?.length ? items.map((item) => <code key={item}>{item} </code>) : null;
}

export default function FramingCandidateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const candidate = store.framingCandidates.findById(params.id);
  if (!candidate) notFound();
  const scope = candidate.analysisScope;

  return (
    <main data-testid="framing-candidate-detail">
      <Link href="/company-framing/candidates">Back to framing candidates</Link>
      <h2>Framing candidate detail</h2>
      <div data-testid="framing-candidate-boundary-note" style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "1rem", marginBottom: "1rem" }}>
        <strong>Candidate-only boundary</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          This candidate is an operator decision-support record. It is not workflow truth, not participant evidence,
          not Pass 6 synthesis/evaluation, not package-ready, and not an automation recommendation.
        </p>
        <p data-testid="framing-candidate-no-promotion-note" className="muted" style={{ marginBottom: 0 }}>
          No promotion action is available here. This page does not create a case or CaseEntryPacket.
        </p>
        <p data-testid="framing-candidate-no-caseid-note" className="muted" style={{ marginBottom: 0 }}>
          No caseId exists on this FramingCandidate record.
        </p>
      </div>

      <dl style={{ margin: 0 }}>
        <Field label="Candidate ID"><code>{candidate.candidateId}</code></Field>
        <Field label="Company ID"><code>{candidate.companyId}</code></Field>
        <Field label="Framing run ID"><code>{candidate.framingRunId}</code></Field>
        <Field label="Candidate name">{candidate.candidateName}</Field>
        <Field label="Status"><code>{candidate.status}</code></Field>
        <Field label="Recommendation">{candidate.recommendation}</Field>
        <Field label="Scope type">{scope.scopeType}</Field>
        <Field label="Scope label">{scope.scopeLabel}</Field>
        <Field label="Primary functional anchor">{scope.primaryFunctionalAnchor}</Field>
        <Field label="Participating functions">{codeList(scope.participatingFunctions)}</Field>
        <Field label="Excluded adjacent scopes">{codeList(scope.excludedAdjacentScopes)}</Field>
        <Field label="Boundary start">{scope.scopeBoundary.start}</Field>
        <Field label="Boundary end">{scope.scopeBoundary.end}</Field>
        <Field label="Boundary rationale">{scope.boundaryRationale}</Field>
        <Field label="Source basis IDs">{codeList(candidate.sourceBasisIds)}</Field>
        <Field label="Rationale">{candidate.rationale}</Field>
        <Field label="Risks">{codeList(candidate.risks)}</Field>
        <Field label="Unknowns">{codeList(candidate.unknowns)}</Field>
        <Field label="Split / merge notes">{candidate.splitMergeNotes}</Field>
        <Field label="Operator notes">{candidate.operatorNotes}</Field>
        <Field label="Score meaning">{candidate.scoreMeaning}</Field>
        <Field label="Score summary">
          {candidate.scoreSummary
            ? Object.entries(candidate.scoreSummary).map(([key, value]) => <span key={key}><code>{key}</code>: {value}{" "}</span>)
            : null}
        </Field>
        <Field label="Created at">{candidate.createdAt}</Field>
        <Field label="Updated at">{candidate.updatedAt}</Field>
      </dl>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Decision metadata</h3>
        <p className="muted">
          Updating this section changes review metadata only. It does not promote the candidate, create a case,
          create a packet, or trigger AI.
        </p>
        <DecisionForm
          candidateId={candidate.candidateId}
          initialStatus={candidate.status}
          initialRecommendation={candidate.recommendation}
          initialOperatorNotes={candidate.operatorNotes}
          initialSplitMergeNotes={candidate.splitMergeNotes}
        />
      </section>
    </main>
  );
}
