import Link from "next/link";
import { store } from "../../../lib/store";

export const dynamic = "force-dynamic";

export default function CaseEntryPacketsPage({
  searchParams,
}: {
  searchParams: { companyId?: string; framingRunId?: string; candidateId?: string };
}) {
  const packets = searchParams.candidateId
    ? store.caseEntryPackets.findByCandidateId(searchParams.candidateId)
    : searchParams.framingRunId
      ? store.caseEntryPackets.findByFramingRunId(searchParams.framingRunId)
      : searchParams.companyId
        ? store.caseEntryPackets.findByCompanyId(searchParams.companyId)
        : store.caseEntryPackets.findAll();

  return (
    <main data-testid="case-entry-packet-list">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: 0 }}>Case entry packets</h2>
          <p data-testid="case-entry-packet-boundary-note" className="muted" style={{ margin: "0.4rem 0 0", maxWidth: "58rem" }}>
            Case entry packets are proposed cases waiting for formal case creation. They are not workflow truth,
            participant evidence, Pass 6 synthesis/evaluation, or package-ready findings.
          </p>
        </div>
        <Link href="/company-framing/case-entry-packets/new" style={{ whiteSpace: "nowrap" }}>Create packet</Link>
      </div>

      {packets.length === 0 ? (
        <p className="muted">No case entry packets created yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "0.5rem 0.75rem" }}>Packet</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Company</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Source</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Domain</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Department</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Use case</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Created case</th>
              <th style={{ padding: "0.5rem 0.75rem" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {packets.map((packet) => (
              <tr key={packet.packetId} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Link href={`/company-framing/case-entry-packets/${packet.packetId}`}><code>{packet.packetId}</code></Link>
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}><code>{packet.companyId}</code></td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{packet.source}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{packet.proposedDomain}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{packet.proposedMainDepartment}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{packet.proposedUseCaseLabel}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{packet.createdCaseId ? <code>{packet.createdCaseId}</code> : "Not promoted"}</td>
                <td style={{ padding: "0.5rem 0.75rem" }}>{packet.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
