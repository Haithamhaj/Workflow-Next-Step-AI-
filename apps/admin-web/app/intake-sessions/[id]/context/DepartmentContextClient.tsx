"use client";

import { useState } from "react";

const INTERNAL_FAMILIES = [
  "sales",
  "operations",
  "hr",
  "it",
  "finance",
  "legal",
  "customer_support",
  "procurement",
  "marketing",
  "other_or_unknown",
];

export default function DepartmentContextClient({
  sessionId,
  primaryDepartments,
  initial,
}: {
  sessionId: string;
  primaryDepartments: readonly string[];
  initial: Record<string, unknown>;
}) {
  const framing = initial.framing as Record<string, unknown> | null;
  const [primaryDepartmentSelection, setPrimaryDepartmentSelection] = useState(String(framing?.primaryDepartmentSelection ?? "Operations"));
  const [customDepartmentLabel, setCustomDepartmentLabel] = useState(String(framing?.customDepartmentLabel ?? ""));
  const [mappingDecision, setMappingDecision] = useState(String(framing?.mappingDecision ?? "unknown"));
  const [acceptedInternalFamily, setAcceptedInternalFamily] = useState(String(framing?.acceptedInternalFamily ?? framing?.suggestedInternalFamily ?? "other_or_unknown"));
  const [companyContextAvailabilityStatus, setCompanyContextAvailabilityStatus] = useState(String(framing?.companyContextAvailabilityStatus ?? "company_context_pending_or_unknown"));
  const [departmentContextAvailabilityStatus, setDepartmentContextAvailabilityStatus] = useState(String(framing?.departmentContextAvailabilityStatus ?? "department_context_pending_or_unknown"));
  const [useCaseBoundaryStatus, setUseCaseBoundaryStatus] = useState(String(framing?.useCaseBoundaryStatus ?? "use_case_not_selected"));
  const [selectedUseCase, setSelectedUseCase] = useState(String(framing?.selectedUseCase ?? ""));
  const [useCaseScopeType, setUseCaseScopeType] = useState(String(framing?.useCaseScopeType ?? "unknown"));
  const [state, setState] = useState(initial);
  const [message, setMessage] = useState("");

  async function save() {
    setMessage("");
    const res = await fetch(`/api/intake-sessions/${sessionId}/department-context`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        primaryDepartmentSelection,
        customDepartmentLabel,
        mappingDecision,
        acceptedInternalFamily,
        companyContextAvailabilityStatus,
        departmentContextAvailabilityStatus,
        useCaseBoundaryStatus,
        selectedUseCase,
        useCaseScopeType,
      }),
    });
    const data = await res.json() as Record<string, unknown>;
    setState(data);
    setMessage(res.ok ? "Saved" : String(data.error ?? "Save failed"));
  }

  async function generate() {
    setMessage("");
    const res = await fetch(`/api/intake-sessions/${sessionId}/department-context`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "generate-structured-context" }),
    });
    const data = await res.json() as Record<string, unknown>;
    setState(data);
    setMessage(res.ok ? "Structured context saved" : String((data.readiness as { reason?: string } | undefined)?.reason ?? data.error ?? "Blocked"));
  }

  const currentFraming = state.framing as Record<string, unknown> | null;
  const structuredContext = state.structuredContext as { context?: Record<string, unknown> } | null;

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Department and Context Decisions</h3>
        <label>Primary department</label>
        <select value={primaryDepartmentSelection} onChange={(event) => setPrimaryDepartmentSelection(event.target.value)}>
          {primaryDepartments.map((department) => <option key={department} value={department}>{department}</option>)}
        </select>
        {primaryDepartmentSelection === "Other / Custom Department" && (
          <>
            <label>Custom department label</label>
            <input value={customDepartmentLabel} onChange={(event) => setCustomDepartmentLabel(event.target.value)} />
          </>
        )}
        <p className="muted">Company-facing label: <strong>{String(currentFraming?.activeDepartmentLabel ?? (customDepartmentLabel || primaryDepartmentSelection))}</strong></p>

        <label>Internal family mapping decision</label>
        <select value={mappingDecision} onChange={(event) => setMappingDecision(event.target.value)}>
          <option value="accepted">Accept suggestion</option>
          <option value="edited">Edit mapping</option>
          <option value="rejected">Reject mapping</option>
          <option value="unknown">Leave unknown</option>
        </select>
        <label>Internal family</label>
        <select value={acceptedInternalFamily} onChange={(event) => setAcceptedInternalFamily(event.target.value)}>
          {INTERNAL_FAMILIES.map((family) => <option key={family} value={family}>{family}</option>)}
        </select>
        <p className="muted">Suggested family: <code>{String(currentFraming?.suggestedInternalFamily ?? "not_saved_yet")}</code></p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Availability and Use Case</h3>
        <label>Company context</label>
        <select value={companyContextAvailabilityStatus} onChange={(event) => setCompanyContextAvailabilityStatus(event.target.value)}>
          <option value="company_context_provided">provided</option>
          <option value="company_context_skipped_by_admin">skipped by admin</option>
          <option value="company_context_pending_or_unknown">pending or unknown</option>
        </select>
        <label>Department context</label>
        <select value={departmentContextAvailabilityStatus} onChange={(event) => setDepartmentContextAvailabilityStatus(event.target.value)}>
          <option value="department_context_provided">provided</option>
          <option value="department_documents_not_available_confirmed">documents not available confirmed</option>
          <option value="department_context_skipped_by_admin">skipped by admin</option>
          <option value="department_context_pending_or_unknown">pending or unknown</option>
        </select>
        <label>Use case</label>
        <select value={useCaseBoundaryStatus} onChange={(event) => setUseCaseBoundaryStatus(event.target.value)}>
          <option value="use_case_not_selected">not selected</option>
          <option value="use_case_same_as_department">same as department</option>
          <option value="use_case_selected_custom">custom</option>
          <option value="use_case_needs_admin_review">needs admin review</option>
        </select>
        {useCaseBoundaryStatus === "use_case_selected_custom" && (
          <>
            <label>Custom use case</label>
            <input value={selectedUseCase} onChange={(event) => setSelectedUseCase(event.target.value)} />
            <label>Use case scope type</label>
            <select value={useCaseScopeType} onChange={(event) => setUseCaseScopeType(event.target.value)}>
              <option value="workflow">workflow</option>
              <option value="function">function</option>
              <option value="service_path">service path</option>
              <option value="operational_segment">operational segment</option>
              <option value="role_group">role group</option>
              <option value="unknown">unknown</option>
            </select>
          </>
        )}
        <button className="btn-primary" onClick={save}>Save decisions</button>
        <button className="btn-primary" onClick={generate} style={{ marginLeft: "8px" }}>Create structured context</button>
        {message && <p><code>{message}</code></p>}
        <p className="muted">Hierarchy intake is next, but it is not implemented in Phase 6.</p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Structured Context Review</h3>
        {structuredContext?.context ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(structuredContext.context, null, 2)}</pre>
        ) : (
          <p className="muted">No structured context record yet.</p>
        )}
      </div>
    </div>
  );
}
