"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StoredReviewIssueRecord } from "@workflow/review-issues";

const ACTION_TYPES = [
  "approve",
  "override",
  "request_follow_up",
  "escalate",
  "keep_visible_as_review_item",
  "unblock",
  "keep_blocked",
  "regenerate_affected_output",
] as const;

const TRANSITIONS = [
  "issue_discussion_active",
  "action_taken",
  "review_resolved",
] as const;

function panelColor(reviewState: string): string {
  switch (reviewState) {
    case "review_required":
      return "#ca4";
    case "issue_discussion_active":
      return "#7cf";
    case "action_taken":
      return "#c74";
    case "review_resolved":
      return "#4c7";
    default:
      return "#888";
  }
}

export function IssueDetailClient({
  issue,
}: {
  issue: StoredReviewIssueRecord;
}) {
  const router = useRouter();
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [transitionError, setTransitionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"discussion" | "action" | "transition" | null>(null);

  async function postJson(path: string, payload: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) throw new Error(data.error ?? "Unknown error");
  }

  async function handleDiscussionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDiscussionError(null);
    setBusy("discussion");
    const fd = new FormData(e.currentTarget);
    try {
      await postJson(`/api/issues/${issue.issueId}/discussion`, {
        entryId: String(fd.get("entryId") ?? "").trim(),
        authorType: "admin",
        message: String(fd.get("message") ?? "").trim(),
      });
      e.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setDiscussionError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function handleActionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null);
    setBusy("action");
    const fd = new FormData(e.currentTarget);
    try {
      await postJson(`/api/issues/${issue.issueId}/actions`, {
        actionId: String(fd.get("actionId") ?? "").trim(),
        actionType: String(fd.get("actionType") ?? "").trim(),
        actor: String(fd.get("actor") ?? "").trim(),
        note: String(fd.get("note") ?? "").trim(),
      });
      e.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  async function handleTransitionSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTransitionError(null);
    setBusy("transition");
    const fd = new FormData(e.currentTarget);
    try {
      await postJson(`/api/issues/${issue.issueId}/transition`, {
        toState: String(fd.get("toState") ?? "").trim(),
      });
      router.refresh();
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setBusy(null);
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    background: "#1a1a1a",
    border: "1px solid #555",
    color: "#eee",
    borderRadius: "4px",
    fontSize: "0.95em",
    width: "100%",
  };

  return (
    <>
      <section
        data-testid="review-state-panel"
        style={{
          background: "#141422",
          border: `2px solid ${panelColor(issue.reviewState)}`,
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "24px",
        }}
      >
        <div style={{ color: "#99a", fontSize: "0.8em", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
          Review state — §28.13 / §28.14
        </div>
        <div
          data-testid="review-state-badge"
          style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: "4px",
            background: "#223",
            color: panelColor(issue.reviewState),
            fontFamily: "monospace",
            fontSize: "1.05em",
          }}
        >
          {issue.reviewState}
        </div>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Issue Brief</h3>
        <dl
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: "8px 16px",
          }}
        >
          <dt style={{ color: "#888" }}>Issue title</dt>
          <dd style={{ margin: 0 }}>{issue.issueBrief.issueTitle}</dd>
          <dt style={{ color: "#888" }}>What happened</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.whatHappened}</dd>
          <dt style={{ color: "#888" }}>Why it was triggered</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.whyItWasTriggered}</dd>
          <dt style={{ color: "#888" }}>Likely source / diagnosis</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.likelySourceDiagnosis}</dd>
          <dt style={{ color: "#888" }}>Why it matters</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.whyItMatters}</dd>
          <dt style={{ color: "#888" }}>What it affects</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.whatItAffects}</dd>
          <dt style={{ color: "#888" }}>Severity / effect level</dt>
          <dd style={{ margin: 0 }}>{issue.issueBrief.severityEffectLevel}</dd>
          <dt style={{ color: "#888" }}>System recommendation</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.systemRecommendation}</dd>
          <dt style={{ color: "#888" }}>Corrective direction</dt>
          <dd style={{ margin: 0, whiteSpace: "pre-wrap" }}>{issue.issueBrief.correctiveDirection}</dd>
        </dl>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Linked Evidence</h3>
        <p style={{ color: "#aaa", marginBottom: "10px" }}>
          Direct record links and scoped evidence references for this issue.
        </p>
        <ul style={{ paddingLeft: "20px", marginBottom: "12px" }}>
          <li><a href={`/initial-packages/${issue.initialPackageId}`} style={{ color: "#7af" }}>Initial package: {issue.initialPackageId}</a></li>
          <li><a href={`/evaluations/${issue.evaluationId}`} style={{ color: "#7af" }}>Evaluation: {issue.evaluationId}</a></li>
          {issue.synthesisId ? (
            <li><a href={`/synthesis/${issue.synthesisId}`} style={{ color: "#7af" }}>Synthesis: {issue.synthesisId}</a></li>
          ) : null}
        </ul>
        {issue.linkedEvidence.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No additional linked evidence.</p>
        ) : (
          <ul style={{ paddingLeft: "20px", margin: 0 }}>
            {issue.linkedEvidence.map((entry, index) => (
              <li key={`${entry.label}-${index}`} style={{ marginBottom: "10px" }}>
                <div style={{ color: "#ddd" }}>{entry.label}</div>
                <div style={{ color: "#aaa" }}>{entry.relevance}</div>
                {entry.sourceReference ? <div style={{ color: "#888" }}>Source ref: {entry.sourceReference}</div> : null}
                {entry.sourceSectionLink ? <div style={{ color: "#888" }}>Section link: {entry.sourceSectionLink}</div> : null}
                {entry.decisionBlockLink ? <div style={{ color: "#888" }}>Decision block: {entry.decisionBlockLink}</div> : null}
                {entry.sessionId ? <div style={{ color: "#888" }}>Session ID: {entry.sessionId}</div> : null}
                {entry.sourceId ? <div style={{ color: "#888" }}>Source ID: {entry.sourceId}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Discussion Surface</h3>
        <p style={{ color: "#aaa", marginBottom: "10px" }}>
          Scope boundary: {issue.discussionThread.scopeBoundary}
        </p>
        {issue.discussionThread.entries.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No discussion entries yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px 0" }}>
            {issue.discussionThread.entries.map((entry) => (
              <li key={entry.entryId} style={{ border: "1px solid #333", borderRadius: "6px", padding: "12px", marginBottom: "10px" }}>
                <div style={{ color: "#99a", fontSize: "0.82em", marginBottom: "6px" }}>
                  {entry.authorType} · {entry.createdAt}
                </div>
                <div style={{ whiteSpace: "pre-wrap" }}>{entry.message}</div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleDiscussionSubmit} style={{ marginBottom: "12px" }}>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="entryId" style={{ display: "block", marginBottom: "4px" }}>Discussion entry ID</label>
            <input id="entryId" name="entryId" style={inputStyle} placeholder="e.g. entry-001" />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="message" style={{ display: "block", marginBottom: "4px" }}>
              Challenge interpretation / add corrective context / request reframing
            </label>
            <textarea id="message" name="message" style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }} />
          </div>
          {discussionError ? <p style={{ color: "#f88" }}>{discussionError}</p> : null}
          <button type="submit" className="btn-primary" disabled={busy === "discussion"}>
            {busy === "discussion" ? "Posting..." : "Add Discussion Entry"}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Action Controls</h3>
        <form onSubmit={handleActionSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="actionId" style={{ display: "block", marginBottom: "4px" }}>Action ID</label>
            <input id="actionId" name="actionId" style={inputStyle} placeholder="e.g. action-001" />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="actionType" style={{ display: "block", marginBottom: "4px" }}>Final admin action</label>
            <select id="actionType" name="actionType" style={inputStyle} defaultValue="approve">
              {ACTION_TYPES.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="actor" style={{ display: "block", marginBottom: "4px" }}>Actor</label>
            <input id="actor" name="actor" style={inputStyle} defaultValue="admin" />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="note" style={{ display: "block", marginBottom: "4px" }}>Short note</label>
            <textarea id="note" name="note" style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} />
          </div>
          {actionError ? <p style={{ color: "#f88" }}>{actionError}</p> : null}
          <button type="submit" className="btn-primary" disabled={busy === "action"}>
            {busy === "action" ? "Saving..." : "Apply Final Action"}
          </button>
        </form>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ marginBottom: "10px" }}>Review State Transition</h3>
        <form onSubmit={handleTransitionSubmit}>
          <div style={{ marginBottom: "10px" }}>
            <label htmlFor="toState" style={{ display: "block", marginBottom: "4px" }}>Transition to</label>
            <select id="toState" name="toState" style={inputStyle} defaultValue="review_resolved">
              {TRANSITIONS.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          {transitionError ? <p style={{ color: "#f88" }}>{transitionError}</p> : null}
          <button type="submit" className="btn-primary" disabled={busy === "transition"}>
            {busy === "transition" ? "Transitioning..." : "Apply Transition"}
          </button>
        </form>
      </section>

      <section>
        <h3 style={{ marginBottom: "10px" }}>Action History</h3>
        {issue.actionHistory.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No final admin actions recorded.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {issue.actionHistory.map((action) => (
              <li key={action.actionId} style={{ border: "1px solid #333", borderRadius: "6px", padding: "12px", marginBottom: "10px" }}>
                <div style={{ color: "#99a", fontSize: "0.82em", marginBottom: "6px" }}>
                  {action.actionType} · {action.actor} · {action.createdAt}
                </div>
                <div style={{ color: "#ccc", marginBottom: "4px" }}>
                  {action.priorReviewState} → {action.resultingReviewState}
                </div>
                {action.note ? <div style={{ whiteSpace: "pre-wrap" }}>{action.note}</div> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
