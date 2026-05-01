import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { store } from "../../../../lib/store";
import { PromoteForm } from "./PromoteForm";

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

export default function CaseEntryPacketDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const packet = store.caseEntryPackets.findById(params.id);
  if (!packet) notFound();
  const scope = packet.analysisScope;

  return (
    <main data-testid="case-entry-packet-detail">
      <Link href="/company-framing/case-entry-packets">Back to packets</Link>
      <h2>Case entry packet detail</h2>
      <div data-testid="case-entry-packet-boundary-note" style={{ border: "1px solid var(--border)", borderRadius: "6px", padding: "1rem", marginBottom: "1rem" }}>
        <strong>Proposed case boundary</strong>
        <p className="muted" style={{ marginBottom: 0 }}>
          This packet is a proposed formal case entry. It is not workflow truth, not participant evidence,
          and not package-ready. Promotion creates only the formal case record.
        </p>
        <p data-testid="case-entry-packet-no-source-required-note" className="muted" style={{ marginBottom: 0 }}>
          Sources are optional. No source is required to promote this packet.
        </p>
      </div>

      <dl style={{ margin: 0 }}>
        <Field label="Packet ID"><code>{packet.packetId}</code></Field>
        <Field label="Company ID"><code>{packet.companyId}</code></Field>
        <Field label="Source mode">{packet.source}</Field>
        <Field label="Candidate ID">{packet.candidateId ? <code>{packet.candidateId}</code> : null}</Field>
        <Field label="Framing run ID">{packet.framingRunId ? <code>{packet.framingRunId}</code> : null}</Field>
        <Field label="Proposed domain">{packet.proposedDomain}</Field>
        <Field label="Proposed main department">{packet.proposedMainDepartment}</Field>
        <Field label="Proposed use case label">{packet.proposedUseCaseLabel}</Field>
        <Field label="Created case ID">
          {packet.createdCaseId ? (
            <>
              <code>{packet.createdCaseId}</code>{" "}
              <Link href={`/cases?companyId=${encodeURIComponent(packet.companyId)}`}>
                Open formal case list
              </Link>
            </>
          ) : "Not promoted"}
        </Field>
        <Field label="Scope type">{scope.scopeType}</Field>
        <Field label="Scope label">{scope.scopeLabel}</Field>
        <Field label="Primary functional anchor">{scope.primaryFunctionalAnchor}</Field>
        <Field label="Participating functions">{codeList(scope.participatingFunctions)}</Field>
        <Field label="Excluded adjacent scopes">{codeList(scope.excludedAdjacentScopes)}</Field>
        <Field label="Boundary start">{scope.scopeBoundary.start}</Field>
        <Field label="Boundary end">{scope.scopeBoundary.end}</Field>
        <Field label="Included framing sources">{codeList(packet.includedFramingSourceIds)}</Field>
        <Field label="Context-only framing sources">{codeList(packet.contextOnlyFramingSourceIds)}</Field>
        <Field label="Excluded framing sources">{codeList(packet.excludedFramingSourceIds)}</Field>
        <Field label="Assumptions">{codeList(packet.assumptions)}</Field>
        <Field label="Unknowns">{codeList(packet.unknowns)}</Field>
        <Field label="Created at">{packet.createdAt}</Field>
        <Field label="Promoted at">{packet.promotedAt}</Field>
        <Field label="Promoted by">{packet.promotedBy}</Field>
      </dl>

      <section style={{ marginTop: "1.5rem" }}>
        <h3>Promotion</h3>
        <p className="muted">
          Promotion creates a CaseConfiguration-compatible formal case. It does not create an intake session,
          case-bound IntakeSource, SourceToCaseLink, provider job, or Pass 3–6 output.
        </p>
        <PromoteForm packetId={packet.packetId} createdCaseId={packet.createdCaseId} />
      </section>
    </main>
  );
}
