"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FormState {
  companyId: string;
  caseId: string;
  domain: string;
  mainDepartment: string;
  subDepartment: string;
  useCaseLabel: string;
  companyProfileRef: string;
  operatorNotes: string;
}

const EMPTY: FormState = {
  companyId: "company-default-local",
  caseId: "",
  domain: "",
  mainDepartment: "",
  subDepartment: "",
  useCaseLabel: "",
  companyProfileRef: "",
  operatorNotes: "",
};

export default function NewCasePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const payload = {
      companyId: form.companyId,
      caseId: form.caseId,
      domain: form.domain,
      mainDepartment: form.mainDepartment,
      ...(form.subDepartment ? { subDepartment: form.subDepartment } : {}),
      useCaseLabel: form.useCaseLabel,
      companyProfileRef: form.companyProfileRef,
      ...(form.operatorNotes ? { operatorNotes: form.operatorNotes } : {}),
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push("/cases");
        return;
      }

      const data = (await res.json()) as {
        errors?: string[];
        error?: string;
      };

      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
      } else if (data.error) {
        setErrors([data.error]);
      } else {
        setErrors(["Unknown error"]);
      }
    } catch {
      setErrors(["Network error — could not reach server"]);
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.45rem 0.6rem",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--fg)",
    fontFamily: "inherit",
    fontSize: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "0.25rem",
    color: "var(--fg-muted)",
    fontSize: "0.85rem",
  };

  const fieldStyle: React.CSSProperties = { marginBottom: "1rem" };

  return (
    <>
      <h2>New Case</h2>

      {errors.length > 0 && (
        <div
          style={{
            background: "#3b1a1a",
            border: "1px solid #a33",
            borderRadius: "6px",
            padding: "0.75rem 1rem",
            marginBottom: "1rem",
          }}
        >
          <strong style={{ color: "#f88" }}>Validation errors</strong>
          <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem", color: "#f99" }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="card" style={{ maxWidth: "600px" }}>
        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Company ID *</label>
            <input style={inputStyle} value={form.companyId} onChange={update("companyId")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Case ID *</label>
            <input style={inputStyle} value={form.caseId} onChange={update("caseId")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Domain *</label>
            <input style={inputStyle} value={form.domain} onChange={update("domain")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Main Department *</label>
            <input style={inputStyle} value={form.mainDepartment} onChange={update("mainDepartment")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Sub Department</label>
            <input style={inputStyle} value={form.subDepartment} onChange={update("subDepartment")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Use Case Label *</label>
            <input style={inputStyle} value={form.useCaseLabel} onChange={update("useCaseLabel")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Company Profile Ref *</label>
            <input style={inputStyle} value={form.companyProfileRef} onChange={update("companyProfileRef")} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Operator Notes</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              value={form.operatorNotes}
              onChange={update("operatorNotes")}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary">
            {submitting ? "Creating…" : "Create Case"}
          </button>
        </form>
      </div>
    </>
  );
}
