import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { runAdminAssistantQuestion, selectNextClarificationCandidate } from "@workflow/participant-sessions";
import { composePass5SessionDetail } from "../../../lib/pass5-dashboard";
import { store } from "../../../lib/store";

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <div style={{ color: "#8a9099", fontSize: "12px" }}>{label}</div>
      <div style={{ fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined }}>{value ?? "—"}</div>
    </div>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>{children}</div>;
}

function ActionForm({ sessionId, action, children }: { sessionId: string; action: string; children: ReactNode }) {
  return (
    <form action={`/api/participant-sessions/${sessionId}/actions`} method="post" style={{ display: "inline-flex", gap: "6px", alignItems: "center", margin: "4px 6px 4px 0" }}>
      <input type="hidden" name="action" value={action} />
      {children}
    </form>
  );
}

const assistantRepos = {
  participantSessions: store.participantSessions,
  sessionAccessTokens: store.sessionAccessTokens,
  telegramIdentityBindings: store.telegramIdentityBindings,
  rawEvidenceItems: store.rawEvidenceItems,
  firstPassExtractionOutputs: store.firstPassExtractionOutputs,
  clarificationCandidates: store.clarificationCandidates,
  boundarySignals: store.boundarySignals,
  evidenceDisputes: store.evidenceDisputes,
  sessionNextActions: store.sessionNextActions,
  pass6HandoffCandidates: store.pass6HandoffCandidates,
  providerJobs: store.providerJobs,
  promptSpecs: store.structuredPromptSpecs,
};

function searchValue(searchParams: Record<string, string | string[] | undefined> | undefined, key: string): string | undefined {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ParticipantSessionDetailPage({
  params,
  searchParams,
}: {
  params: { sessionId: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const detail = composePass5SessionDetail(store, params.sessionId);
  if (!detail) notFound();
  const nextCandidate = selectNextClarificationCandidate(params.sessionId, {
    participantSessions: store.participantSessions,
    clarificationCandidates: store.clarificationCandidates,
  });
  const assistantQuestion = searchValue(searchParams, "assistantQuestion");
  const assistantResult = assistantQuestion
    ? await runAdminAssistantQuestion({
      question: assistantQuestion,
      scope: "current_session",
      sessionId: params.sessionId,
      requestedByAdminId: "admin_operator",
    }, assistantRepos, null)
    : null;

  return (
    <>
      <p><Link href="/participant-sessions">← Participant session dashboard</Link></p>
      <h2>Participant Session Detail</h2>
      <p className="muted">Participant-level Pass 5 inspection only. This page does not create final workflow truth, synthesis, evaluation, or package output.</p>

      <Panel title="Session Context">
        <Grid>
          <Field label="Session ID" value={detail.session.sessionId} mono />
          <Field label="Case ID" value={detail.session.caseId} mono />
          <Field label="Targeting plan ID" value={detail.session.targetingPlanId} mono />
          <Field label="Target candidate ID" value={detail.session.targetCandidateId} mono />
          <Field label="Contact profile ID" value={detail.session.participantContactProfileId} mono />
          <Field label="Participant label" value={detail.session.participantLabel} />
          <Field label="Role / hierarchy node" value={detail.session.participantRoleOrNodeId} mono />
          <Field label="Department" value={detail.session.selectedDepartment} />
          <Field label="Use case" value={detail.session.selectedUseCase} />
          <Field label="Language" value={detail.session.languagePreference} />
          <Field label="Participation mode" value={detail.session.selectedParticipationMode} />
          <Field label="Session state" value={detail.session.sessionState} />
          <Field label="Created" value={detail.session.createdAt} mono />
          <Field label="Updated" value={detail.session.updatedAt} mono />
          <Field label="Next action" value={detail.nextActionLabel} />
        </Grid>
      </Panel>

      <Panel title="Channel Access">
        <Grid>
          <Field label="Channel status" value={detail.session.channelStatus} />
          <Field label="Session access token records" value={detail.accessTokens.length} />
          <Field label="Telegram bindings" value={detail.telegramBindings.length} />
          <Field label="Web token status" value={detail.accessTokens.map((token) => token.tokenStatus).join(", ") || "Unavailable"} />
          <Field label="Token expires" value={detail.accessTokens.map((token) => token.expiresAt).join(", ") || "Unavailable"} mono />
          <Field label="Token last used" value={detail.accessTokens.map((token) => token.lastUsedAt ?? "never").join(", ") || "Unavailable"} mono />
          <Field label="Telegram binding status" value={detail.telegramBindings.map((binding) => binding.bindingStatus).join(", ") || "Unavailable"} />
          <Field label="Telegram user ID" value={detail.telegramBindings.map((binding) => binding.telegramUserId).join(", ") || "Unavailable"} mono />
          <Field label="Channel next action" value={detail.nextActionLabel} />
        </Grid>
        <p className="muted">Token hashes and secrets are intentionally hidden.</p>
      </Panel>

      <Panel title="Raw Evidence">
        {detail.rawEvidenceItems.length === 0 ? <p className="muted">No raw evidence captured.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead><tr style={{ textAlign: "left", color: "#8a9099", borderBottom: "1px solid #333" }}>
              <th style={{ padding: "6px" }}>Evidence</th><th>Type</th><th>Channel</th><th>Captured</th><th>By</th><th>Trust</th><th>Confidence</th><th>Filename</th><th>Provider job</th><th>Clarification</th><th>Actions</th>
            </tr></thead>
            <tbody>{detail.rawEvidenceItems.map((item) => (
              <tr key={item.evidenceItemId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "6px", fontFamily: "monospace" }}>{item.evidenceItemId}</td>
                <td>{item.evidenceType}</td><td>{item.sourceChannel}</td><td>{item.capturedAt}</td><td>{item.capturedBy}</td><td>{item.trustStatus}</td><td>{item.confidenceScore}</td>
                <td>{item.originalFileName ?? "—"}</td><td>{item.providerJobId ?? "—"}</td><td>{item.linkedClarificationItemId ?? "—"}</td>
                <td>
                  {item.evidenceType === "participant_clarification_answer" ? (
                    <ActionForm sessionId={detail.session.sessionId} action="recheck">
                      <input type="hidden" name="answerEvidenceId" value={item.evidenceItemId} />
                      <button type="submit">Recheck answer</button>
                    </ActionForm>
                  ) : "—"}
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>

      <Panel title="Analysis Progress">
        <Grid>
          <Field label="First narrative status" value={detail.session.firstNarrativeStatus} />
          <Field label="Extraction status" value={detail.session.extractionStatus} />
          <Field label="Extraction outputs" value={detail.extractionOutputs.length} />
          <Field label="Unmapped content" value={detail.unmappedContentCount} />
          <Field label="Extraction defects" value={detail.extractionDefectCount} />
          <Field label="Evidence disputes" value={detail.evidenceDisputeCount} />
          <Field label="Unresolved items" value={detail.unresolvedItemCount} />
          <Field label="Later synthesis handoff readiness" value={detail.session.sessionState === "ready_for_later_synthesis_handoff" ? "ready" : detail.session.sessionState === "first_pass_extraction_ready" ? "near-ready" : "not ready"} />
        </Grid>
        {detail.extractionOutputs.map((output) => (
          <div key={output.extractionId} style={{ marginTop: "14px", borderTop: "1px solid #222", paddingTop: "12px" }}>
            <h4>{output.extractionId}</h4>
            <p><strong>Coverage:</strong> {output.sourceCoverageSummary}</p>
            <p><strong>Extracted overview:</strong> actors {output.extractedActors.length}, steps {output.extractedSteps.length}, decisions {output.extractedDecisionPoints.length}, handoffs {output.extractedHandoffs.length}</p>
            <p><strong>Sequence map:</strong> ordered {output.sequenceMap.orderedItemIds.length}, links {output.sequenceMap.sequenceLinks.length}, unclear transitions {output.sequenceMap.unclearTransitions.length}</p>
            <p><strong>Confidence notes:</strong> {output.confidenceNotes.join(" | ") || "—"}</p>
            <p><strong>Contradiction notes:</strong> {output.contradictionNotes.join(" | ") || "—"}</p>
            <details><summary>Unmapped content / defects / disputes</summary>
              <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({
                unmappedContentItems: output.unmappedContentItems,
                extractionDefects: output.extractionDefects,
                evidenceDisputes: output.evidenceDisputes,
              }, null, 2)}</pre>
            </details>
          </div>
        ))}
      </Panel>

      <Panel title="Clarification Queue">
        <p><strong>Next selectable candidate:</strong> {nextCandidate.ok ? `${nextCandidate.value.candidate.candidateId}${nextCandidate.value.activeQuestionAlreadyAsked ? " (active/asked)" : ""}` : nextCandidate.errors[0]?.message}</p>
        <div style={{ marginBottom: "12px" }}>
          {detail.supportedActions.map((action) => <code key={action} style={{ marginRight: "6px" }}>{action}</code>)}
        </div>
        <ActionForm sessionId={detail.session.sessionId} action="select-next"><button className="btn-primary" type="submit">Select next</button></ActionForm>
        <ActionForm sessionId={detail.session.sessionId} action="add-admin-exact">
          <input name="questionTheme" placeholder="Admin question theme" />
          <input name="exactQuestion" placeholder="Exact participant question" />
          <button className="btn-primary" type="submit">Add admin question</button>
        </ActionForm>
        {detail.clarificationCandidates.length === 0 ? <p className="muted">No clarification candidates.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead><tr style={{ textAlign: "left", color: "#8a9099", borderBottom: "1px solid #333" }}>
              <th style={{ padding: "6px" }}>Candidate</th><th>Priority</th><th>askNext</th><th>Created from</th><th>Status</th><th>Question</th><th>Why</th><th>Example</th><th>Actions</th>
            </tr></thead>
            <tbody>{detail.clarificationCandidates.map((candidate) => (
              <tr key={candidate.candidateId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "6px", fontFamily: "monospace" }}>{candidate.candidateId}</td>
                <td>{candidate.priority}</td><td>{String(candidate.askNext)}</td><td>{candidate.createdFrom}</td><td>{candidate.status}</td>
                <td>{candidate.participantFacingQuestion}</td><td>{candidate.whyItMatters}</td><td>{candidate.exampleAnswer}</td>
                <td>
                  <ActionForm sessionId={detail.session.sessionId} action="mark-asked"><input type="hidden" name="candidateId" value={candidate.candidateId} /><button type="submit">Mark asked</button></ActionForm>
                  <ActionForm sessionId={detail.session.sessionId} action="formulate"><input type="hidden" name="candidateId" value={candidate.candidateId} /><button type="submit">Formulate</button></ActionForm>
                  <ActionForm sessionId={detail.session.sessionId} action="dismiss"><input type="hidden" name="candidateId" value={candidate.candidateId} /><button type="submit">Dismiss</button></ActionForm>
                  <ActionForm sessionId={detail.session.sessionId} action="record-answer"><input type="hidden" name="candidateId" value={candidate.candidateId} /><input name="answerText" placeholder="Admin-entered participant answer" /><button type="submit">Record answer</button></ActionForm>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <p className="muted">Provider-backed formulation/recheck actions are supported by domain functions but require a configured executor; this dashboard does not fake provider success.</p>
      </Panel>

      <Panel title="Boundary / Escalation">
        {detail.boundarySignals.length === 0 ? <p className="muted">No boundary signals.</p> : detail.boundarySignals.map((signal) => (
          <div key={signal.boundarySignalId} className="card">
            <Grid>
              <Field label="Boundary signal" value={signal.boundarySignalId} mono />
              <Field label="Boundary type" value={signal.boundaryType} />
              <Field label="Workflow area" value={signal.workflowArea} />
              <Field label="Requires escalation" value={String(signal.requiresEscalation)} />
              <Field label="Stop asking participant" value={String(signal.shouldStopAskingParticipant)} />
              <Field label="Suggested owner/team" value={signal.participantSuggestedOwner ?? "—"} />
              <Field label="Suggested escalation target" value={signal.suggestedEscalationTarget} />
              <Field label="Escalation reason" value={signal.escalationReason ?? "—"} />
              <Field label="Confidence" value={signal.confidenceLevel} />
              <Field label="Linked evidence" value={signal.linkedEvidenceItemId} mono />
            </Grid>
            <p><strong>Participant statement:</strong> {signal.participantStatement}</p>
            <p><strong>Interpretation:</strong> {signal.interpretationNote}</p>
          </div>
        ))}
      </Panel>

      <Panel title="Admin Assistant / Section Copilot">
        <p className="muted">Read-only Pass 5 copilot. It receives a bounded DB-first context bundle, suggests routed admin actions, and does not mutate records or send participant messages.</p>
        <form method="get" style={{ display: "grid", gap: "8px", marginBottom: "12px" }}>
          <input name="assistantQuestion" defaultValue={assistantQuestion ?? ""} placeholder="Ask about this session's evidence, clarification status, boundary signals, disputes, or next action" />
          <button className="btn-primary" type="submit">Ask assistant</button>
        </form>
        {assistantResult ? (
          <div>
            <Grid>
              <Field label="Intent" value={assistantResult.intent} />
              <Field label="Provider status" value={assistantResult.answer?.providerStatus ?? "not run"} />
              <Field label="Provider job" value={assistantResult.answer?.providerJobId ?? "—"} mono />
              <Field label="Context records" value={assistantResult.contextBundle?.structuredRecords.length ?? 0} />
              <Field label="Evidence snippets" value={assistantResult.contextBundle?.evidenceSnippets.length ?? 0} />
              <Field label="No mutation performed" value={String(assistantResult.answer?.noMutationPerformed ?? true)} />
            </Grid>
            {assistantResult.answer ? (
              <>
                <p><strong>Finding:</strong> {assistantResult.answer.conciseFinding}</p>
                <p><strong>Recommended admin action:</strong> {assistantResult.answer.recommendedAdminAction ?? "Manual review"}</p>
                <p><strong>Uncertainty:</strong> {assistantResult.answer.whatRemainsUncertain.join(" | ") || "—"}</p>
                <details><summary>Evidence references and routed actions</summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify({
                    evidenceBasis: assistantResult.answer.evidenceBasis,
                    references: assistantResult.answer.references,
                    routedActionSuggestions: assistantResult.answer.routedActionSuggestions,
                    warnings: assistantResult.warnings,
                    errors: assistantResult.errors,
                  }, null, 2)}</pre>
                </details>
                <details><summary>Context bundle</summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(assistantResult.contextBundle, null, 2)}</pre>
                </details>
              </>
            ) : (
              <p className="muted">{assistantResult.errors[0]?.message ?? "Assistant question was not answered."}</p>
            )}
          </div>
        ) : null}
      </Panel>
    </>
  );
}
