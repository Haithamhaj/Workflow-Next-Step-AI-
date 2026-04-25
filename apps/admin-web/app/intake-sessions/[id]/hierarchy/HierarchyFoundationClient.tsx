"use client";

import { useMemo, useState } from "react";

type GroupLayer =
  | "owner_or_executive"
  | "director_layer"
  | "manager_layer"
  | "supervisor_layer"
  | "senior_individual_contributor"
  | "frontline_operational"
  | "support_role"
  | "shared_service_role"
  | "approval_or_control_role"
  | "external_interface"
  | "system_or_queue_node"
  | "committee_or_group"
  | "temporary_or_project_role"
  | "unknown"
  | "custom";

type RelationshipType =
  | "dotted_line_manager"
  | "cross_functional_responsibility"
  | "shared_supervision"
  | "dual_reporting"
  | "temporary_project_reporting"
  | "operational_dependency"
  | "approval_relationship"
  | "matrix_relationship"
  | "external_interface_relationship"
  | "custom";

type SourceTriageScope =
  | "company_wide"
  | "department_wide"
  | "team_or_unit"
  | "role_specific"
  | "person_or_occupant"
  | "system_or_queue"
  | "approval_or_control_node"
  | "external_interface"
  | "unknown_needs_review";

interface NodeRecord {
  nodeId: string;
  roleLabel: string;
  groupLayer: GroupLayer;
  customGroupLabel?: string;
  customGroupReason?: string;
  primaryParentNodeId?: string;
  personName?: string;
  employeeId?: string;
  internalIdentifier?: string;
  occupantOfRole?: string;
  candidateParticipantFlag?: boolean;
  personRoleConfidence?: "high" | "medium" | "low" | "unknown";
  notes?: string;
}

interface SecondaryRelationship {
  relationshipId: string;
  fromNodeId: string;
  relatedNodeId: string;
  relationshipType: RelationshipType;
  relationshipScope: string;
  reasonOrNote: string;
  confidence: "high" | "medium" | "low" | "unknown";
  sourceBasis: "admin_entered" | "pasted_text" | "uploaded_document" | "source_evidence_candidate" | "unknown";
}

interface SourceTriageSuggestion {
  triageId: string;
  sourceId: string;
  sourceName: string;
  suggestedScope: SourceTriageScope;
  linkedNodeId?: string;
  linkedScopeLevel?: SourceTriageScope;
  signalType: string;
  suggestedReason: string;
  confidence: "high" | "medium" | "low" | "unknown";
  evidenceStatus: string;
  participantValidationNeeded: boolean;
  adminReviewQuestion: string;
  adminDecision: string;
  adminNote?: string;
  provider?: string;
  model?: string;
}

type PromptCapability = "hierarchy_draft" | "source_hierarchy_triage";

interface PromptSpecView {
  promptSpecId: string;
  linkedModule: string;
  purpose: string;
  status: string;
  version: number;
  blocks: { blockId: string; label: string; body: string; editable: boolean }[];
  previousActivePromptSpecId?: string;
}

interface PromptTestRunView {
  testRunId: string;
  promptSpecId: string;
  promptVersionId: string;
  capability: PromptCapability;
  testInput: string;
  activePromptOutput?: string;
  draftPromptOutput?: string;
  provider?: string;
  model?: string;
  activePromptVersion: number;
  draftPromptVersion: number;
  comparisonSummary: string;
  boundaryViolationFlags: string[];
  providerStatus: string;
  errorMessage?: string;
  adminNote?: string;
  createdAt: string;
}

interface Props {
  sessionId: string;
  initialState: {
    intake?: { pastedText?: string } | null;
    promptSpec?: PromptSpecView;
    compiledPromptPreview?: string;
    sourceTriagePromptSpec?: PromptSpecView;
    compiledSourceTriagePromptPreview?: string;
    pass3PromptSpecs?: PromptSpecView[];
    promptDrafts?: {
      hierarchyDraftPrompt?: PromptSpecView | null;
      sourceDraftPrompt?: PromptSpecView | null;
    };
    compiledDraftPromptPreviews?: {
      hierarchy?: string | null;
      sourceTriage?: string | null;
    };
    promptTestRuns?: PromptTestRunView[];
    latestSourceTriageJob?: {
      status: string;
      provider?: string;
      model?: string;
      errorMessage?: string;
    } | null;
    sourceTriageSuggestions?: SourceTriageSuggestion[];
    sourceTriageSuggestedScopes?: SourceTriageScope[];
    draft?: {
      status?: string;
      provider?: string;
      model?: string;
      errorMessage?: string;
      warnings?: string[];
      nodes: NodeRecord[];
      secondaryRelationships: SecondaryRelationship[];
    } | null;
    approvedSnapshot?: { approvedSnapshotId: string; structuralApprovalOnly: true; approvalScopeNote: string } | null;
    readinessSnapshot?: {
      status: string;
      nodeCount: number;
      relationshipCount: number;
      pass4Boundary: {
        participantTargetingCreated: false;
        rolloutOrderCreated: false;
        sessionsCreated: false;
      };
    } | null;
    groupingLayers: GroupLayer[];
    secondaryRelationshipTypes: RelationshipType[];
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.45rem 0.6rem",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  color: "var(--fg)",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

function emptyNode(index: number): NodeRecord {
  return {
    nodeId: `node_${index}`,
    roleLabel: "",
    groupLayer: "unknown",
  };
}

function emptyRelationship(index: number, nodes: NodeRecord[]): SecondaryRelationship {
  return {
    relationshipId: `rel_${index}`,
    fromNodeId: nodes[0]?.nodeId ?? "",
    relatedNodeId: nodes[1]?.nodeId ?? "",
    relationshipType: "dotted_line_manager",
    relationshipScope: "",
    reasonOrNote: "",
    confidence: "unknown",
    sourceBasis: "admin_entered",
  };
}

export default function HierarchyFoundationClient({ sessionId, initialState }: Props) {
  const [state, setState] = useState(initialState);
  const [pastedText, setPastedText] = useState(initialState.intake?.pastedText ?? "");
  const [nodes, setNodes] = useState<NodeRecord[]>(initialState.draft?.nodes ?? [emptyNode(1)]);
  const [relationships, setRelationships] = useState<SecondaryRelationship[]>(
    initialState.draft?.secondaryRelationships ?? [],
  );
  const [manualSourceId, setManualSourceId] = useState("");
  const [manualSourceName, setManualSourceName] = useState("");
  const [manualSourceScope, setManualSourceScope] = useState<SourceTriageScope>("unknown_needs_review");
  const [sourceAdminNote, setSourceAdminNote] = useState("");
  const [promptCapability, setPromptCapability] = useState<PromptCapability>(
    initialState.promptDrafts?.hierarchyDraftPrompt
      ? "hierarchy_draft"
      : initialState.promptDrafts?.sourceDraftPrompt
        ? "source_hierarchy_triage"
        : "hierarchy_draft",
  );
  const [promptDraftEdit, setPromptDraftEdit] = useState("Draft note: keep outputs reviewable and preserve Pass 3 boundaries.");
  const [promptTestInput, setPromptTestInput] = useState("Sales Director\nSales Manager\n2 Supervisors\n3 Senior Sales\n2 Sales\n2 Account Managers\n2 Communicators");
  const [promptAdminNote, setPromptAdminNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const nodeOptions = useMemo(() => nodes.filter((node) => node.nodeId.trim() && node.roleLabel.trim()), [nodes]);

  async function post(action: string, body: Record<string, unknown> = {}) {
    setError("");
    setMessage("");
    const res = await fetch(`/api/intake-sessions/${sessionId}/hierarchy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const data = await res.json() as typeof initialState & { error?: string; nodes?: NodeRecord[] };
    if (!res.ok) {
      setError(data.error ?? "Hierarchy action failed.");
      setState(data);
      return data;
    }
    if (data.nodes) {
      setNodes(data.nodes);
    } else {
      setState(data);
      if (data.draft?.nodes) setNodes(data.draft.nodes);
      if (data.draft?.secondaryRelationships) setRelationships(data.draft.secondaryRelationships);
    }
    setMessage(action);
    return data;
  }

  function updateNode(index: number, patch: Partial<NodeRecord>) {
    setNodes((prev) => prev.map((node, i) => i === index ? { ...node, ...patch } : node));
  }

  function updateRelationship(index: number, patch: Partial<SecondaryRelationship>) {
    setRelationships((prev) => prev.map((relationship, i) => i === index ? { ...relationship, ...patch } : relationship));
  }

  const activePromptForCapability = promptCapability === "hierarchy_draft" ? state.promptSpec : state.sourceTriagePromptSpec;
  const draftPromptForCapability = promptCapability === "hierarchy_draft"
    ? state.promptDrafts?.hierarchyDraftPrompt
    : state.promptDrafts?.sourceDraftPrompt;
  const activeCompiledPromptForCapability = promptCapability === "hierarchy_draft"
    ? state.compiledPromptPreview
    : state.compiledSourceTriagePromptPreview;
  const draftCompiledPromptForCapability = promptCapability === "hierarchy_draft"
    ? state.compiledDraftPromptPreviews?.hierarchy
    : state.compiledDraftPromptPreviews?.sourceTriage;
  const allPromptTestRuns = (state.promptTestRuns ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const matchingPromptTestRuns = allPromptTestRuns.filter((run) => run.capability === promptCapability);
  const promptTestRunsForCapability = matchingPromptTestRuns.length ? matchingPromptTestRuns : allPromptTestRuns;

  function savePromptDraft() {
    const sourcePrompt = draftPromptForCapability ?? activePromptForCapability;
    const blocks = sourcePrompt?.blocks.map((block, index) => {
      if (!block.editable || index !== 0) return block;
      return { ...block, body: `${block.body}\n\n${promptDraftEdit}`.trim() };
    });
    void post("save-prompt-draft", { capability: promptCapability, blocks });
  }

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {message ? <p className="muted">Saved: <code>{message}</code></p> : null}
      {error ? <div className="card" style={{ borderColor: "#933", color: "#f99" }}>{error}</div> : null}

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Hierarchy Intake</h3>
        <p className="muted">AI hierarchy drafts are provider-backed drafts only. Admin review/correction is required before structural approval.</p>
        <textarea
          value={pastedText}
          onChange={(event) => setPastedText(event.target.value)}
          rows={6}
          style={inputStyle}
          placeholder={"Chief Executive Officer\nOperations Director\nOperations Manager"}
        />
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => post("create-pasted-intake", { pastedText, createdBy: "admin" })}>
            Save pasted intake
          </button>
          <button className="btn-primary" onClick={() => post("parse-pasted-text", { pastedText })}>
            Parse into draft rows
          </button>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Provider Draft</h3>
        <p className="muted">Uses the active visible PromptSpec. If provider execution fails, the failure is persisted and manual drafting remains available.</p>
        <button className="btn-primary" onClick={() => post("generate-ai-draft")}>
          Generate AI draft
        </button>
        {state.draft?.status ? (
          <div style={{ marginTop: "10px" }}>
            <p>Status: <code>{state.draft.status}</code></p>
            {state.draft.provider ? <p>Provider: <code>{state.draft.provider}</code></p> : null}
            {state.draft.model ? <p>Model: <code>{state.draft.model}</code></p> : null}
            {state.draft.errorMessage ? <p style={{ color: "#f99" }}>Failure: {state.draft.errorMessage}</p> : null}
            {state.draft.warnings?.length ? (
              <ul>{state.draft.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Active PromptSpec</h3>
        {state.promptSpec ? (
          <>
            <p><code>{state.promptSpec.promptSpecId}</code> v{state.promptSpec.version} · {state.promptSpec.status}</p>
            <div style={{ display: "grid", gap: "8px" }}>
              {state.promptSpec.blocks.map((block) => (
                <details key={block.blockId} open={block.blockId === "role_definition" || block.blockId === "output_schema_contract"}>
                  <summary>{block.label}</summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{block.body}</pre>
                </details>
              ))}
            </div>
            <h4>Compiled Prompt Preview</h4>
            <pre style={{ whiteSpace: "pre-wrap", maxHeight: "360px", overflow: "auto" }}>{state.compiledPromptPreview}</pre>
          </>
        ) : (
          <p className="muted">No active PromptSpec loaded.</p>
        )}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Source-to-Hierarchy Triage</h3>
        <p className="muted">Links are tentative evidence candidates only. They do not validate workflow truth, responsibilities, KPIs, SOPs, policies, or actual practice.</p>
        <button className="btn-primary" onClick={() => post("generate-source-triage")}>
          Generate source triage
        </button>
        {state.latestSourceTriageJob ? (
          <div style={{ marginTop: "10px" }}>
            <p>Status: <code>{state.latestSourceTriageJob.status}</code></p>
            {state.latestSourceTriageJob.provider ? <p>Provider: <code>{state.latestSourceTriageJob.provider}</code></p> : null}
            {state.latestSourceTriageJob.model ? <p>Model: <code>{state.latestSourceTriageJob.model}</code></p> : null}
            {state.latestSourceTriageJob.errorMessage ? <p style={{ color: "#f99" }}>Failure: {state.latestSourceTriageJob.errorMessage}</p> : null}
          </div>
        ) : null}
        <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
          {(state.sourceTriageSuggestions ?? []).map((suggestion) => (
            <div key={suggestion.triageId} style={{ border: "1px solid var(--border)", borderRadius: "4px", padding: "10px" }}>
              <p><strong>{suggestion.sourceName}</strong> · <code>{suggestion.signalType}</code> · <code>{suggestion.suggestedScope}</code></p>
              <p>{suggestion.suggestedReason}</p>
              <p className="muted">{suggestion.adminReviewQuestion}</p>
              <p>Evidence status: <code>{suggestion.evidenceStatus}</code> · Admin decision: <code>{suggestion.adminDecision}</code> · Participant validation needed: <code>{String(suggestion.participantValidationNeeded)}</code></p>
              {suggestion.linkedNodeId ? <p>Linked node: <code>{suggestion.linkedNodeId}</code></p> : null}
              {suggestion.adminNote ? <p>Admin note: {suggestion.adminNote}</p> : null}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button onClick={() => post("update-source-triage", { triageId: suggestion.triageId, decisionAction: "accept", adminNote: sourceAdminNote || undefined })}>Accept link</button>
                <button onClick={() => post("update-source-triage", { triageId: suggestion.triageId, decisionAction: "reject", adminNote: sourceAdminNote || undefined })}>Reject link</button>
                <button onClick={() => post("update-source-triage", { triageId: suggestion.triageId, decisionAction: "change_scope", suggestedScope: "department_wide", linkedScopeLevel: "department_wide", adminNote: sourceAdminNote || "Changed to department-wide evidence candidate." })}>Change to department-wide</button>
                <button onClick={() => post("update-source-triage", { triageId: suggestion.triageId, decisionAction: "mark_participant_validation_needed", adminNote: sourceAdminNote || undefined })}>Needs participant validation</button>
                <button onClick={() => post("update-source-triage", { triageId: suggestion.triageId, decisionAction: "add_note", adminNote: sourceAdminNote || "Admin reviewed source evidence candidate." })}>Add note</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gap: "8px", marginTop: "12px" }}>
          <h4>Manual Source Link</h4>
          <input value={manualSourceId} onChange={(event) => setManualSourceId(event.target.value)} placeholder="Source ID" style={inputStyle} />
          <input value={manualSourceName} onChange={(event) => setManualSourceName(event.target.value)} placeholder="Source name" style={inputStyle} />
          <select value={manualSourceScope} onChange={(event) => setManualSourceScope(event.target.value as SourceTriageScope)} style={inputStyle}>
            {(state.sourceTriageSuggestedScopes ?? ["unknown_needs_review"]).map((scope) => <option key={scope} value={scope}>{scope}</option>)}
          </select>
          <input value={sourceAdminNote} onChange={(event) => setSourceAdminNote(event.target.value)} placeholder="Admin note for source triage actions" style={inputStyle} />
          <button onClick={() => post("create-manual-source-link", {
            sourceId: manualSourceId,
            sourceName: manualSourceName || manualSourceId,
            suggestedScope: manualSourceScope,
            linkedScopeLevel: manualSourceScope,
            adminNote: sourceAdminNote || undefined,
            participantValidationNeeded: manualSourceScope === "role_specific",
            createdBy: "admin",
          })}>Create manual evidence candidate</button>
        </div>
        {state.sourceTriagePromptSpec ? (
          <details style={{ marginTop: "12px" }}>
            <summary>Source Triage PromptSpec and compiled preview</summary>
            <p><code>{state.sourceTriagePromptSpec.promptSpecId}</code> v{state.sourceTriagePromptSpec.version} · {state.sourceTriagePromptSpec.status}</p>
            {state.sourceTriagePromptSpec.blocks.map((block) => (
              <details key={block.blockId}>
                <summary>{block.label}</summary>
                <pre style={{ whiteSpace: "pre-wrap" }}>{block.body}</pre>
              </details>
            ))}
            <h4>Compiled Source Triage Prompt Preview</h4>
            <pre style={{ whiteSpace: "pre-wrap", maxHeight: "360px", overflow: "auto" }}>{state.compiledSourceTriagePromptPreview}</pre>
          </details>
        ) : null}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Prompt Draft Testing</h3>
        <p className="muted">Draft saves do not activate prompts. Promotion requires the explicit action below, and previous active versions remain stored for rollback/reference.</p>
        <div style={{ display: "grid", gap: "8px" }}>
          <select value={promptCapability} onChange={(event) => setPromptCapability(event.target.value as PromptCapability)} style={inputStyle}>
            <option value="hierarchy_draft">Hierarchy draft prompt</option>
            <option value="source_hierarchy_triage">Source-to-hierarchy triage prompt</option>
          </select>
          <textarea
            value={promptDraftEdit}
            onChange={(event) => setPromptDraftEdit(event.target.value)}
            rows={3}
            style={inputStyle}
            placeholder="Draft section edit note"
          />
          <textarea
            value={promptTestInput}
            onChange={(event) => setPromptTestInput(event.target.value)}
            rows={4}
            style={inputStyle}
            placeholder="Same input used for active-vs-draft prompt test"
          />
          <input
            value={promptAdminNote}
            onChange={(event) => setPromptAdminNote(event.target.value)}
            style={inputStyle}
            placeholder="Admin note for prompt test or promotion"
          />
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={savePromptDraft}>Create/edit draft prompt</button>
            <button
              className="btn-primary"
              disabled={!draftPromptForCapability}
              onClick={() => post("run-prompt-test", {
                capability: promptCapability,
                draftPromptSpecId: draftPromptForCapability?.promptSpecId,
                testInput: promptTestInput,
                adminNote: promptAdminNote || undefined,
              })}
            >
              Run active-vs-draft test
            </button>
            <button
              disabled={!draftPromptForCapability}
              onClick={() => post("promote-prompt-draft", {
                draftPromptSpecId: draftPromptForCapability?.promptSpecId,
                adminNote: promptAdminNote || undefined,
              })}
            >
              Promote draft to active
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "12px", marginTop: "12px" }}>
          <div>
            <h4>Active Prompt</h4>
            {activePromptForCapability ? (
              <>
                <p><code>{activePromptForCapability.promptSpecId}</code> v{activePromptForCapability.version} · {activePromptForCapability.status}</p>
                {activePromptForCapability.blocks.map((block) => (
                  <details key={block.blockId}>
                    <summary>{block.label}</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>{block.body}</pre>
                  </details>
                ))}
                <h4>Compiled Active Prompt Preview</h4>
                <pre style={{ whiteSpace: "pre-wrap", maxHeight: "280px", overflow: "auto" }}>{activeCompiledPromptForCapability}</pre>
              </>
            ) : <p className="muted">No active prompt loaded.</p>}
          </div>
          <div>
            <h4>Draft Prompt</h4>
            {draftPromptForCapability ? (
              <>
                <p><code>{draftPromptForCapability.promptSpecId}</code> v{draftPromptForCapability.version} · {draftPromptForCapability.status}</p>
                {draftPromptForCapability.blocks.map((block) => (
                  <details key={block.blockId}>
                    <summary>{block.label}</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>{block.body}</pre>
                  </details>
                ))}
                <h4>Compiled Draft Prompt Preview</h4>
                <pre style={{ whiteSpace: "pre-wrap", maxHeight: "280px", overflow: "auto" }}>{draftCompiledPromptForCapability}</pre>
              </>
            ) : <p className="muted">No draft prompt saved for this capability.</p>}
          </div>
        </div>
        {promptTestRunsForCapability.length ? (
          <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
            <h4>Active-vs-Draft Comparison</h4>
            {promptTestRunsForCapability.slice(0, 3).map((run) => (
              <div key={run.testRunId} style={{ border: "1px solid var(--border)", borderRadius: "4px", padding: "10px" }}>
                <p><code>{run.testRunId}</code> · <code>{run.providerStatus}</code> · active v{run.activePromptVersion} vs draft v{run.draftPromptVersion}</p>
                {run.provider ? <p>Provider: <code>{run.provider}</code> · Model: <code>{run.model}</code></p> : null}
                {run.errorMessage ? <p style={{ color: "#f99" }}>Failure: {run.errorMessage}</p> : null}
                <p>{run.comparisonSummary}</p>
                <p>Boundary flags: <code>{run.boundaryViolationFlags.length ? run.boundaryViolationFlags.join(", ") : "none"}</code></p>
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "8px" }}>
                  <div>
                    <h4>Active Output</h4>
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: "220px", overflow: "auto" }}>{run.activePromptOutput ?? "No output persisted."}</pre>
                  </div>
                  <div>
                    <h4>Draft Output</h4>
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: "220px", overflow: "auto" }}>{run.draftPromptOutput ?? "No output persisted."}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {state.pass3PromptSpecs?.length ? (
          <details style={{ marginTop: "12px" }}>
            <summary>Prompt version records</summary>
            <ul>
              {state.pass3PromptSpecs.map((spec) => (
                <li key={spec.promptSpecId}>
                  <code>{spec.promptSpecId}</code> · <code>{spec.linkedModule}</code> · v{spec.version} · <code>{spec.status}</code>
                  {spec.previousActivePromptSpecId ? <> · previous active <code>{spec.previousActivePromptSpecId}</code></> : null}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Manual Draft Hierarchy</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
              <th>Node ID</th>
              <th>Role</th>
              <th>Group</th>
              <th>Primary parent</th>
              <th>Person-light fields</th>
            </tr>
          </thead>
          <tbody>
            {nodes.map((node, index) => (
              <tr key={`${node.nodeId}-${index}`} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px" }}>
                  <input value={node.nodeId} onChange={(event) => updateNode(index, { nodeId: event.target.value })} style={inputStyle} />
                </td>
                <td style={{ padding: "8px" }}>
                  <input value={node.roleLabel} onChange={(event) => updateNode(index, { roleLabel: event.target.value })} style={inputStyle} />
                </td>
                <td style={{ padding: "8px" }}>
                  <select value={node.groupLayer} onChange={(event) => updateNode(index, { groupLayer: event.target.value as GroupLayer })} style={inputStyle}>
                    {state.groupingLayers.map((layer) => <option key={layer} value={layer}>{layer}</option>)}
                  </select>
                  {node.groupLayer === "custom" ? (
                    <input
                      value={node.customGroupLabel ?? ""}
                      onChange={(event) => updateNode(index, { customGroupLabel: event.target.value })}
                      placeholder="Custom group label"
                      style={{ ...inputStyle, marginTop: "6px" }}
                    />
                  ) : null}
                </td>
                <td style={{ padding: "8px" }}>
                  <select value={node.primaryParentNodeId ?? ""} onChange={(event) => updateNode(index, { primaryParentNodeId: event.target.value || undefined })} style={inputStyle}>
                    <option value="">No primary parent</option>
                    {nodeOptions.filter((option) => option.nodeId !== node.nodeId).map((option) => (
                      <option key={option.nodeId} value={option.nodeId}>{option.nodeId} - {option.roleLabel}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: "8px" }}>
                  <input value={node.personName ?? ""} onChange={(event) => updateNode(index, { personName: event.target.value || undefined })} placeholder="Person name" style={inputStyle} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
          <button onClick={() => setNodes((prev) => [...prev, emptyNode(prev.length + 1)])}>Add node</button>
          <button className="btn-primary" onClick={() => post("save-manual-draft", { nodes, secondaryRelationships: relationships, createdBy: "admin", correctionNote: "Saved from Pass 3 foundation UI." })}>
            Save manual draft
          </button>
        </div>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Secondary Relationships</h3>
        {relationships.map((relationship, index) => (
          <div key={`${relationship.relationshipId}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <input value={relationship.relationshipId} onChange={(event) => updateRelationship(index, { relationshipId: event.target.value })} style={inputStyle} />
            <select value={relationship.fromNodeId} onChange={(event) => updateRelationship(index, { fromNodeId: event.target.value })} style={inputStyle}>
              {nodeOptions.map((node) => <option key={node.nodeId} value={node.nodeId}>{node.nodeId}</option>)}
            </select>
            <select value={relationship.relatedNodeId} onChange={(event) => updateRelationship(index, { relatedNodeId: event.target.value })} style={inputStyle}>
              {nodeOptions.map((node) => <option key={node.nodeId} value={node.nodeId}>{node.nodeId}</option>)}
            </select>
            <select value={relationship.relationshipType} onChange={(event) => updateRelationship(index, { relationshipType: event.target.value as RelationshipType })} style={inputStyle}>
              {state.secondaryRelationshipTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input value={relationship.relationshipScope} onChange={(event) => updateRelationship(index, { relationshipScope: event.target.value })} placeholder="Scope" style={inputStyle} />
            <input value={relationship.reasonOrNote} onChange={(event) => updateRelationship(index, { reasonOrNote: event.target.value })} placeholder="Reason or note" style={inputStyle} />
          </div>
        ))}
        <button onClick={() => setRelationships((prev) => [...prev, emptyRelationship(prev.length + 1, nodes)])}>
          Add secondary relationship
        </button>
      </section>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Structural Approval & Readiness</h3>
        <p className="muted">Approval is structural only. It does not validate responsibilities, KPIs, SOPs, policies, source claims, or workflow reality.</p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => post("approve-structural-snapshot", { approvedBy: "admin" })}>
            Approve structural snapshot
          </button>
          <button className="btn-primary" onClick={() => post("calculate-readiness")}>
            Calculate readiness snapshot
          </button>
        </div>
        {state.approvedSnapshot ? (
          <p>Approved snapshot: <code>{state.approvedSnapshot.approvedSnapshotId}</code></p>
        ) : null}
        {state.readinessSnapshot ? (
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(state.readinessSnapshot, null, 2)}</pre>
        ) : null}
      </section>
    </div>
  );
}
