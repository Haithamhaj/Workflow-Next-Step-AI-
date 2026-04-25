"use client";

import type { ParticipantContactProfile, TargetCandidate, TargetingRolloutPlan, TargetingRolloutPlanState } from "@workflow/contracts";
import { useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid #2a2a2a" }}><h3>{title}</h3>{children}</section>;
}

export default function TargetingRolloutPlanClient({ initialPlan }: { initialPlan: TargetingRolloutPlan }) {
  const [plan, setPlan] = useState(initialPlan);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: unknown) {
    setError(null);
    const res = await fetch(`/api/targeting-rollout/${plan.planId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Request failed"); return; }
    setPlan(data);
  }

  async function generate() {
    setError(null);
    const res = await fetch(`/api/targeting-rollout/${plan.planId}/generate`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Generation failed"); return; }
    setPlan(data);
  }

  function candidateAction(candidate: TargetCandidate, adminDecision: TargetCandidate["adminDecision"]) {
    void patch({ action: "candidate", candidateId: candidate.candidateId, adminDecision });
  }

  function updateContact(profile: ParticipantContactProfile, form: FormData) {
    const updates = {
      displayName: String(form.get("displayName") ?? ""),
      mobileNumber: String(form.get("mobileNumber") ?? "") || undefined,
      whatsAppNumber: String(form.get("whatsAppNumber") ?? "") || undefined,
      telegramHandle: String(form.get("telegramHandle") ?? "") || undefined,
      email: String(form.get("email") ?? "") || undefined,
      preferredChannel: String(form.get("preferredChannel") ?? "") || undefined,
      adminNote: String(form.get("adminNote") ?? "") || undefined,
      contactDataSource: {
        displayName: "pass4_manual_entry",
        mobileNumber: "pass4_manual_entry",
        whatsAppNumber: "pass4_manual_entry",
        telegramHandle: "pass4_manual_entry",
        email: "pass4_manual_entry",
        preferredChannel: "pass4_manual_entry",
      },
    };
    void patch({ action: "contact", participantId: profile.participantId, updates });
  }

  function transition(state: TargetingRolloutPlanState) {
    void patch({ action: "transition", state });
  }

  return (
    <>
      <h2>Targeting Plan Overview</h2>
      {error ? <p style={{ color: "#ff8a8a" }}>{error}</p> : null}
      <div className="card">
        <p><strong>Case:</strong> <code>{plan.caseId}</code></p>
        <p><strong>Department:</strong> {plan.selectedDepartment}</p>
        <p><strong>Use case:</strong> {plan.selectedUseCase}</p>
        <p><strong>Pass 3 readiness:</strong> <code>{plan.basisReadinessSnapshotId}</code></p>
        <p><strong>Current plan state:</strong> {plan.state}</p>
        <p><strong>Next action:</strong> Review AI packet, candidate decisions, contact readiness, hint seeds, then approve or request rework.</p>
      </div>

      <Section title="AI Recommendation Packet">
        <button className="btn-primary" type="button" onClick={generate}>Generate/regenerate packet</button>
        <p><strong>Provider status:</strong> {plan.providerStatus}</p>
        <p><strong>Prompt version used:</strong> {plan.recommendationPacketSummary?.generatedByPromptVersionId ?? "not generated"}</p>
        <p><strong>Generation time:</strong> {plan.recommendationPacketSummary?.generatedAt ?? "not generated"}</p>
        {plan.providerFailure ? <p style={{ color: "#ffb36b" }}><strong>Failure:</strong> {plan.providerFailure.message}. Manual planning remains available.</p> : null}
        <p><strong>Confidence:</strong> {plan.recommendationPacketSummary?.confidenceSummary ?? "Manual/pass-through plan awaiting AI packet or admin edits."}</p>
      </Section>

      <Section title="Review Target Candidates">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9em" }}>
          <thead><tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}><th>Candidate</th><th>Type</th><th>Node</th><th>Reason</th><th>Stage</th><th>Decision</th><th>Actions</th></tr></thead>
          <tbody>
            {plan.targetCandidates.map((candidate) => (
              <tr key={candidate.candidateId} style={{ borderBottom: "1px solid #222" }}>
                <td>{candidate.personLabel ?? candidate.roleLabel ?? candidate.candidateId}</td>
                <td>{candidate.targetType}</td>
                <td><code>{candidate.linkedHierarchyNodeId ?? "none"}</code></td>
                <td>{candidate.suggestedReason}</td>
                <td>{candidate.suggestedRolloutStage}</td>
                <td>{candidate.adminDecision}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button type="button" onClick={() => candidateAction(candidate, "accepted")}>Accept</button>{" "}
                  <button type="button" onClick={() => candidateAction(candidate, "rejected")}>Reject</button>{" "}
                  <button type="button" onClick={() => void patch({ action: "candidate", candidateId: candidate.candidateId, targetType: "external_decision_or_clarification_source" })}>External</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Participant Contact Profiles">
        {plan.participantContactProfiles.map((profile) => (
          <form key={profile.participantId} action={(form) => updateContact(profile, form)} className="card" style={{ marginBottom: "12px" }}>
            <p><strong>{profile.roleLabel}</strong> <code>{profile.contactDataStatus}</code></p>
            <input name="displayName" defaultValue={profile.displayName} placeholder="Display name" />
            <input name="mobileNumber" defaultValue={profile.mobileNumber ?? ""} placeholder="Mobile" />
            <input name="whatsAppNumber" defaultValue={profile.whatsAppNumber ?? ""} placeholder="WhatsApp" />
            <input name="telegramHandle" defaultValue={profile.telegramHandle ?? ""} placeholder="Telegram" />
            <input name="email" defaultValue={profile.email ?? ""} placeholder="Email" />
            <select name="preferredChannel" defaultValue={profile.preferredChannel ?? ""}>
              <option value="">No preferred channel</option>
              <option value="mobile">Mobile</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
              <option value="email">Email</option>
            </select>
            <input name="adminNote" defaultValue={profile.adminNote ?? ""} placeholder="Admin note" />
            <button type="submit">Save contact</button>
            <p style={{ color: "#aaa" }}>Available: {profile.availableChannels.join(", ") || "none"}; preferred channel is optional in Pass 4.</p>
          </form>
        ))}
      </Section>

      <Section title="Question-Hint Seeds Preview">
        <p style={{ color: "#aaa" }}>These are later Pass 5 analytical hints, not participant-facing questions.</p>
        {plan.questionHintSeeds.length === 0 ? <p>No hint seeds stored.</p> : plan.questionHintSeeds.map((hint) => (
          <div key={hint.hintId} className="card" style={{ marginBottom: "8px" }}>
            <p><strong>{hint.suggestedLaterQuestionTheme}</strong> <code>{hint.status}</code></p>
            <p>{hint.documentSignal}</p>
            <p>{hint.triggerConditionForPass5}</p>
            <button type="button" onClick={() => void patch({ action: "hint", hintId: hint.hintId, hintStatus: "dismissed_by_admin" })}>Dismiss</button>
          </div>
        ))}
      </Section>

      <Section title="Final Targeting Plan Review">
        <p><strong>Approved targets:</strong> {plan.finalReviewSummary.approvedCandidateIds.length}</p>
        <p><strong>Rejected/removed:</strong> {plan.finalReviewSummary.rejectedCandidateIds.length}</p>
        <p><strong>Contact gaps:</strong> {plan.finalReviewSummary.unresolvedContactGaps.join("; ") || "none"}</p>
        <p><strong>Final plan state:</strong> {plan.finalPlanState}</p>
        <ul>
          <li>No outreach sent: {String(plan.boundaryConfirmations.noOutreachSent)}</li>
          <li>No invitations created: {String(plan.boundaryConfirmations.noInvitationsCreated)}</li>
          <li>No participant sessions created: {String(plan.boundaryConfirmations.noParticipantSessionsCreated)}</li>
          <li>No participant responses collected: {String(plan.boundaryConfirmations.noParticipantResponsesCollected)}</li>
          <li>No workflow analysis performed: {String(plan.boundaryConfirmations.noWorkflowAnalysisPerformed)}</li>
        </ul>
        <button type="button" onClick={() => transition("under_admin_review")}>Move under review</button>{" "}
        <button type="button" onClick={() => transition("approved_ready_for_outreach")}>Approve ready</button>{" "}
        <button type="button" onClick={() => transition("approved_with_contact_gaps")}>Approve with contact gaps</button>{" "}
        <button type="button" onClick={() => transition("needs_rework")}>Needs rework</button>{" "}
        <button type="button" onClick={() => transition("rejected")}>Reject</button>
      </Section>
    </>
  );
}
