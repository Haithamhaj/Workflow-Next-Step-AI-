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

interface Props {
  sessionId: string;
  initialState: {
    intake?: { pastedText?: string } | null;
    promptSpec?: {
      promptSpecId: string;
      linkedModule: string;
      purpose: string;
      status: string;
      version: number;
      blocks: { blockId: string; label: string; body: string; editable: boolean }[];
    };
    compiledPromptPreview?: string;
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
