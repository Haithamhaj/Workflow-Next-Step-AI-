import Link from "next/link";
import { composePass5Dashboard, type Pass5DashboardFilters } from "../../lib/pass5-dashboard";
import { store } from "../../lib/store";

function value(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const raw = searchParams[key];
  return Array.isArray(raw) ? raw[0] : raw;
}

function filtersFromSearch(searchParams: Record<string, string | string[] | undefined>): Pass5DashboardFilters {
  return {
    caseId: value(searchParams, "caseId"),
    targetingPlanId: value(searchParams, "targetingPlanId"),
    participant: value(searchParams, "participant"),
    channel: value(searchParams, "channel") as Pass5DashboardFilters["channel"],
    participationMode: value(searchParams, "participationMode") as Pass5DashboardFilters["participationMode"],
    sessionState: value(searchParams, "sessionState") as Pass5DashboardFilters["sessionState"],
    firstNarrativeStatus: value(searchParams, "firstNarrativeStatus") as Pass5DashboardFilters["firstNarrativeStatus"],
    trustStatus: value(searchParams, "trustStatus") as Pass5DashboardFilters["trustStatus"],
    extractionStatus: value(searchParams, "extractionStatus") as Pass5DashboardFilters["extractionStatus"],
    clarificationStatus: value(searchParams, "clarificationStatus") as Pass5DashboardFilters["clarificationStatus"],
    boundaryEscalation: value(searchParams, "boundaryEscalation") as Pass5DashboardFilters["boundaryEscalation"],
    language: value(searchParams, "language"),
  };
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card" style={{ margin: 0 }}>
      <div style={{ color: "#8a9099", fontSize: "12px" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function FilterInput({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label style={{ display: "grid", gap: "4px", fontSize: "12px", color: "#8a9099" }}>
      {label}
      <input name={name} defaultValue={defaultValue ?? ""} style={{ minWidth: 0 }} />
    </label>
  );
}

export default function ParticipantSessionsDashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filters = filtersFromSearch(searchParams);
  const dashboard = composePass5Dashboard(store, filters);
  return (
    <>
      <h2>Participant Session Command Dashboard</h2>
      <p className="muted">
        Pass 5 operational visibility for participant-level sessions, evidence, extraction drafts, clarification queues, and boundary signals. This dashboard does not synthesize workflow truth.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px", margin: "18px 0" }}>
        <SummaryCard label="Total sessions" value={dashboard.summary.totalSessions} />
        <SummaryCard label="Active/open sessions" value={dashboard.summary.activeOpenSessions} />
        <SummaryCard label="Awaiting first narrative" value={dashboard.summary.awaitingFirstNarrative} />
        <SummaryCard label="Raw evidence pending trust review" value={dashboard.summary.rawEvidencePendingTrustReview} />
        <SummaryCard label="First-pass extraction ready" value={dashboard.summary.firstPassExtractionReady} />
        <SummaryCard label="Open clarification queues" value={dashboard.summary.sessionsWithOpenClarifications} />
        <SummaryCard label="Boundary/escalation signals" value={`${dashboard.summary.sessionsWithBoundarySignals}/${dashboard.summary.sessionsWithEscalationSignals}`} />
        <SummaryCard label="Defects / disputes / unmapped" value={`${dashboard.summary.sessionsWithExtractionDefects}/${dashboard.summary.sessionsWithEvidenceDisputes}/${dashboard.summary.sessionsWithUnmappedContent}`} />
        <SummaryCard label="Ready or near-ready for later synthesis handoff" value={dashboard.summary.readyOrNearReadyForLaterSynthesisHandoff} />
        <SummaryCard label="Handoff pending / accepted" value={`${dashboard.summary.pendingPass6HandoffCandidates}/${dashboard.summary.acceptedPass6HandoffCandidates}`} />
        <SummaryCard label="Handoff dismissed / needs evidence" value={`${dashboard.summary.dismissedPass6HandoffCandidates}/${dashboard.summary.needsMoreEvidencePass6HandoffCandidates}`} />
      </section>

      <form method="get" className="card" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "10px" }}>
        <FilterInput name="caseId" label="Case ID" defaultValue={filters.caseId} />
        <FilterInput name="targetingPlanId" label="Targeting plan" defaultValue={filters.targetingPlanId} />
        <FilterInput name="participant" label="Participant / role" defaultValue={filters.participant} />
        <FilterInput name="channel" label="Channel status" defaultValue={filters.channel} />
        <FilterInput name="participationMode" label="Participation mode" defaultValue={filters.participationMode} />
        <FilterInput name="sessionState" label="Session state" defaultValue={filters.sessionState} />
        <FilterInput name="firstNarrativeStatus" label="First narrative status" defaultValue={filters.firstNarrativeStatus} />
        <FilterInput name="trustStatus" label="Raw evidence trust" defaultValue={filters.trustStatus} />
        <FilterInput name="extractionStatus" label="Extraction status" defaultValue={filters.extractionStatus} />
        <FilterInput name="clarificationStatus" label="Clarification status" defaultValue={filters.clarificationStatus} />
        <FilterInput name="boundaryEscalation" label="Boundary escalation" defaultValue={filters.boundaryEscalation} />
        <FilterInput name="language" label="Language" defaultValue={filters.language} />
        <div style={{ alignSelf: "end", display: "flex", gap: "8px" }}>
          <button className="btn-primary" type="submit">Filter</button>
          <Link href="/participant-sessions" style={{ padding: "6px 0" }}>Clear</Link>
        </div>
      </form>

      <section className="card">
        <h3>Participant Sessions</h3>
        {dashboard.rows.length === 0 ? (
          <p className="muted">No participant sessions match the current filters.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #333", color: "#8a9099" }}>
                  <th style={{ padding: "8px" }}>Session</th>
                  <th style={{ padding: "8px" }}>Participant</th>
                  <th style={{ padding: "8px" }}>Role / node</th>
                  <th style={{ padding: "8px" }}>Case / plan</th>
                  <th style={{ padding: "8px" }}>Mode</th>
                  <th style={{ padding: "8px" }}>Channel</th>
                  <th style={{ padding: "8px" }}>State</th>
                  <th style={{ padding: "8px" }}>Narrative</th>
                  <th style={{ padding: "8px" }}>Evidence</th>
                  <th style={{ padding: "8px" }}>Extraction</th>
                  <th style={{ padding: "8px" }}>Clarifications</th>
                  <th style={{ padding: "8px" }}>Boundary</th>
                  <th style={{ padding: "8px" }}>Unresolved</th>
                  <th style={{ padding: "8px" }}>Updated</th>
                  <th style={{ padding: "8px" }}>Next action</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.rows.map((row) => (
                  <tr key={row.session.sessionId} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}><Link href={`/participant-sessions/${row.session.sessionId}`}>{row.session.sessionId}</Link></td>
                    <td style={{ padding: "8px" }}>{row.session.participantLabel}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{row.session.participantRoleOrNodeId}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{row.session.caseId}<br />{row.session.targetingPlanId}</td>
                    <td style={{ padding: "8px" }}>{row.session.selectedParticipationMode}</td>
                    <td style={{ padding: "8px" }}>{row.session.channelStatus}</td>
                    <td style={{ padding: "8px" }}>{row.session.sessionState}</td>
                    <td style={{ padding: "8px" }}>{row.session.firstNarrativeStatus}</td>
                    <td style={{ padding: "8px" }}>{row.rawEvidenceCount}</td>
                    <td style={{ padding: "8px" }}>{row.session.extractionStatus}</td>
                    <td style={{ padding: "8px" }}>{row.openClarificationCount}</td>
                    <td style={{ padding: "8px" }}>{row.boundarySignalCount}</td>
                    <td style={{ padding: "8px" }}>{row.unresolvedItemCount}</td>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{row.session.updatedAt}</td>
                    <td style={{ padding: "8px" }}>{row.nextActionLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
