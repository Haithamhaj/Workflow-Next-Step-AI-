"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSourceRoleDecisionStatus, AttachmentScope } from "@workflow/contracts";

const scopes: AttachmentScope[] = [
  "company_level",
  "department_level",
  "team_unit_level",
  "role_level",
  "person_level",
  "shared",
  "unknown",
];

export default function SourceRoleDecisionForm({
  sourceId,
  suggestionId,
  suggestedRole,
  suggestedScope,
}: {
  sourceId: string;
  suggestionId?: string;
  suggestedRole?: string;
  suggestedScope?: AttachmentScope;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<AdminSourceRoleDecisionStatus>("confirmed_ai_suggestion");
  const [role, setRole] = useState(suggestedRole ?? "");
  const [scope, setScope] = useState<AttachmentScope>(suggestedScope ?? "unknown");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const res = await fetch(`/api/intake-sources/${sourceId}/source-role-decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        suggestionId,
        finalSourceRole: role,
        finalScope: scope,
        reason,
        decidedBy: "admin",
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string };
      setError(data.error ?? "Decision failed");
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ display: "grid", gap: "0.5rem", maxWidth: "640px" }}>
      <label>
        Decision
        <select value={decision} onChange={(event) => setDecision(event.target.value as AdminSourceRoleDecisionStatus)}>
          <option value="confirmed_ai_suggestion">Confirm AI suggestion</option>
          <option value="edited_ai_suggestion">Edit AI suggestion</option>
          <option value="overridden_by_admin">Override by admin</option>
          <option value="marked_needs_review">Mark needs review</option>
        </select>
      </label>
      <label>
        Source role
        <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="source role" />
      </label>
      <label>
        Scope
        <select value={scope} onChange={(event) => setScope(event.target.value as AttachmentScope)}>
          {scopes.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label>
        Admin note
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={2} />
      </label>
      {error && <p style={{ color: "#f88", margin: 0 }}>{error}</p>}
      <button type="button" onClick={submit}>Save source-role decision</button>
    </div>
  );
}
