"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DEFAULT_COMPANY_ID = "company-default-local";

function splitLines(value: string): string[] {
  return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
}

export default function NewCaseEntryPacketPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"known_use_case" | "framing_candidate">("known_use_case");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    companyId: DEFAULT_COMPANY_ID,
    candidateId: "",
    framingRunId: "",
    proposedDomain: "",
    proposedMainDepartment: "",
    proposedUseCaseLabel: "",
    scopeType: "multi_function",
    scopeLabel: "",
    primaryFunctionalAnchor: "",
    participatingFunctions: "",
    excludedAdjacentScopes: "",
    boundaryStart: "",
    boundaryEnd: "",
    includedFramingSourceIds: "",
    assumptions: "",
    unknowns: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const payload = mode === "known_use_case"
      ? {
          source: "known_use_case",
          companyId: form.companyId,
          framingRunId: form.framingRunId || undefined,
          proposedDomain: form.proposedDomain,
          proposedMainDepartment: form.proposedMainDepartment,
          proposedUseCaseLabel: form.proposedUseCaseLabel,
          analysisScope: {
            scopeType: form.scopeType,
            scopeLabel: form.scopeLabel,
            primaryFunctionalAnchor: form.primaryFunctionalAnchor,
            participatingFunctions: splitLines(form.participatingFunctions),
            excludedAdjacentScopes: splitLines(form.excludedAdjacentScopes),
            scopeBoundary: { start: form.boundaryStart, end: form.boundaryEnd },
          },
          includedFramingSourceIds: splitLines(form.includedFramingSourceIds),
          assumptions: splitLines(form.assumptions),
          unknowns: splitLines(form.unknowns),
        }
      : {
          source: "framing_candidate",
          candidateId: form.candidateId,
          proposedDomain: form.proposedDomain,
          proposedMainDepartment: form.proposedMainDepartment || undefined,
          proposedUseCaseLabel: form.proposedUseCaseLabel || undefined,
          includedFramingSourceIds: splitLines(form.includedFramingSourceIds),
          assumptions: splitLines(form.assumptions),
          unknowns: splitLines(form.unknowns),
        };

    const response = await fetch("/api/company-framing/case-entry-packets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json() as { packetId?: string; error?: string };
    if (!response.ok || !data.packetId) {
      setError(data.error ?? "Could not create case entry packet.");
      setSubmitting(false);
      return;
    }
    router.push(`/company-framing/case-entry-packets/${data.packetId}`);
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.45rem 0.6rem", boxSizing: "border-box" };
  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };
  const labelStyle: React.CSSProperties = { display: "block", marginBottom: "0.25rem", color: "var(--fg-muted)", fontSize: "0.85rem" };

  return (
    <main>
      <Link href="/company-framing/case-entry-packets">Back to packets</Link>
      <h2>Create case entry packet</h2>
      <p data-testid="case-entry-packet-boundary-note" className="muted">
        Case entry packets are proposed formal cases. They do not prove workflow truth and do not create participant evidence.
      </p>
      <p data-testid="case-entry-packet-no-session-note" className="muted">
        Creating a packet does not create an intake session.
      </p>
      <p data-testid="case-entry-packet-no-source-required-note" className="muted">
        Sources are optional. No source field is required and no case-bound IntakeSource is created.
      </p>

      <form data-testid="case-entry-packet-create-form" onSubmit={submit} style={{ maxWidth: "52rem" }}>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="mode">Packet mode</label>
          <select id="mode" value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} style={inputStyle}>
            <option value="known_use_case">Known / operator-created case</option>
            <option value="framing_candidate">Selected framing candidate</option>
          </select>
        </div>

        {mode === "framing_candidate" ? (
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="candidateId">Candidate ID</label>
            <input id="candidateId" name="candidateId" required value={form.candidateId} onChange={(event) => update("candidateId", event.target.value)} style={inputStyle} />
          </div>
        ) : (
          <>
            {[
              ["companyId", "Company ID"],
              ["proposedMainDepartment", "Proposed main department"],
              ["proposedUseCaseLabel", "Proposed use case label"],
              ["scopeLabel", "Scope label"],
              ["primaryFunctionalAnchor", "Primary functional anchor"],
              ["boundaryStart", "Boundary start"],
              ["boundaryEnd", "Boundary end"],
            ].map(([field, label]) => (
              <div key={field} style={fieldStyle}>
                <label style={labelStyle} htmlFor={field}>{label}</label>
                <input id={field} name={field} required value={form[field as keyof typeof form]} onChange={(event) => update(field as keyof typeof form, event.target.value)} style={inputStyle} />
              </div>
            ))}
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="scopeType">Scope type</label>
              <select id="scopeType" name="scopeType" value={form.scopeType} onChange={(event) => update("scopeType", event.target.value)} style={inputStyle}>
                <option value="single_function">single_function</option>
                <option value="multi_function">multi_function</option>
                <option value="company_workflow_scope">company_workflow_scope</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="participatingFunctions">Participating functions</label>
              <textarea id="participatingFunctions" value={form.participatingFunctions} onChange={(event) => update("participatingFunctions", event.target.value)} rows={3} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="excludedAdjacentScopes">Excluded adjacent scopes</label>
              <textarea id="excludedAdjacentScopes" value={form.excludedAdjacentScopes} onChange={(event) => update("excludedAdjacentScopes", event.target.value)} rows={3} style={inputStyle} />
            </div>
          </>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="proposedDomain">Proposed domain</label>
          <input id="proposedDomain" name="proposedDomain" required value={form.proposedDomain} onChange={(event) => update("proposedDomain", event.target.value)} style={inputStyle} />
        </div>

        {mode === "framing_candidate" ? (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="proposedMainDepartment">Main department override</label>
              <input id="proposedMainDepartment" name="proposedMainDepartment" value={form.proposedMainDepartment} onChange={(event) => update("proposedMainDepartment", event.target.value)} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="proposedUseCaseLabel">Use case label override</label>
              <input id="proposedUseCaseLabel" name="proposedUseCaseLabel" value={form.proposedUseCaseLabel} onChange={(event) => update("proposedUseCaseLabel", event.target.value)} style={inputStyle} />
            </div>
          </>
        ) : null}

        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="includedFramingSourceIds">Included framing source IDs</label>
          <textarea id="includedFramingSourceIds" value={form.includedFramingSourceIds} onChange={(event) => update("includedFramingSourceIds", event.target.value)} rows={3} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="assumptions">Assumptions</label>
          <textarea id="assumptions" value={form.assumptions} onChange={(event) => update("assumptions", event.target.value)} rows={3} style={inputStyle} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle} htmlFor="unknowns">Unknowns</label>
          <textarea id="unknowns" value={form.unknowns} onChange={(event) => update("unknowns", event.target.value)} rows={3} style={inputStyle} />
        </div>

        {error ? <p role="alert" style={{ color: "#f88" }}>{error}</p> : null}
        <button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create case entry packet"}</button>
      </form>
    </main>
  );
}
