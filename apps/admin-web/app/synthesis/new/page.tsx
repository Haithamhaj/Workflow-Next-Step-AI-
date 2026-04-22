"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface DifferenceBlockForm {
  where: string;
  what: string;
  participantsPerSide: string;
  whyMatters: string;
  laterClosurePath: string;
}

function blankBlock(): DifferenceBlockForm {
  return {
    where: "",
    what: "",
    participantsPerSide: "",
    whyMatters: "",
    laterClosurePath: "",
  };
}

function splitLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

export default function NewSynthesisPage() {
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [blocks, setBlocks] = useState<DifferenceBlockForm[]>([blankBlock()]);

  function updateBlock(idx: number, field: keyof DifferenceBlockForm, value: string) {
    setBlocks((prev) => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)));
  }
  function addBlock() {
    setBlocks((prev) => [...prev, blankBlock()]);
  }
  function removeBlock(idx: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const synthesisId = String(fd.get("synthesisId") ?? "").trim();
    const caseId = String(fd.get("caseId") ?? "").trim();
    const sessionId = String(fd.get("sessionId") ?? "").trim();
    const commonPath = String(fd.get("commonPath") ?? "").trim();
    const majorUnresolvedItems = splitLines(String(fd.get("majorUnresolvedItems") ?? ""));
    const closureCandidates = splitLines(String(fd.get("closureCandidates") ?? ""));
    const escalationCandidates = splitLines(String(fd.get("escalationCandidates") ?? ""));
    const confidenceEvidenceNotes = String(fd.get("confidenceEvidenceNotes") ?? "").trim();

    const payload: Record<string, unknown> = {
      synthesisId,
      caseId,
      commonPath,
      differenceBlocks: blocks.filter((b) =>
        Object.values(b).some((v) => v.trim() !== ""),
      ),
      majorUnresolvedItems,
      closureCandidates,
      escalationCandidates,
      confidenceEvidenceNotes,
    };
    if (sessionId !== "") payload.sessionId = sessionId;

    try {
      const res = await fetch("/api/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 201) {
        const created = (await res.json()) as { synthesisId: string };
        router.push(`/synthesis/${created.synthesisId}`);
        return;
      }
      const data = (await res.json()) as { error?: string; errors?: string[] };
      if (data.errors && Array.isArray(data.errors)) setErrors(data.errors);
      else if (data.error) setErrors([data.error]);
      else setErrors(["Unknown error"]);
    } catch {
      setErrors(["Network error — could not reach server"]);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "16px",
  };
  const inputStyle: React.CSSProperties = {
    padding: "8px",
    background: "#1a1a1a",
    border: "1px solid #555",
    color: "#eee",
    borderRadius: "4px",
    fontSize: "0.95em",
  };

  return (
    <>
      <h2>New Synthesis</h2>
      <p style={{ color: "#aaa", marginBottom: "20px" }}>
        Record the §19.11 minimum output: common path, preserved material-difference blocks
        (§19.3), major unresolved items, closure candidates, escalation candidates.
      </p>

      {errors.length > 0 && (
        <div
          data-testid="validation-errors"
          style={{
            background: "#3b1a1a",
            border: "1px solid #a33",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <strong style={{ color: "#f88" }}>Validation errors</strong>
          <ul style={{ margin: "8px 0 0", paddingLeft: "20px", color: "#f99" }}>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ maxWidth: "780px" }}>
        <div style={fieldStyle}>
          <label htmlFor="synthesisId">Synthesis ID *</label>
          <input id="synthesisId" name="synthesisId" style={inputStyle} placeholder="e.g. synth-001" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="caseId">Case ID *</label>
          <input id="caseId" name="caseId" style={inputStyle} placeholder="e.g. case-001" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="sessionId">Session ID (optional)</label>
          <input id="sessionId" name="sessionId" style={inputStyle} placeholder="e.g. session-001" />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="commonPath">Common Path *</label>
          <textarea
            id="commonPath"
            name="commonPath"
            style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
            placeholder="Shared path across participants per §19.1."
          />
        </div>

        <fieldset
          style={{
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "12px 16px",
            marginBottom: "20px",
          }}
        >
          <legend style={{ padding: "0 8px", color: "#ccc" }}>
            Material difference blocks (§19.3 — five fields per block)
          </legend>
          {blocks.map((b, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #2a2a2a",
                borderRadius: "4px",
                padding: "12px",
                marginBottom: "12px",
                background: "#161616",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <strong style={{ color: "#bbb" }}>Block {idx + 1}</strong>
                {blocks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeBlock(idx)}
                    style={{ background: "transparent", color: "#c66", border: "none", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                )}
              </div>
              {(
                [
                  ["where", "Where"],
                  ["what", "What"],
                  ["participantsPerSide", "Participants per side"],
                  ["whyMatters", "Why it matters"],
                  ["laterClosurePath", "Later closure path"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} style={fieldStyle}>
                  <label>{label}</label>
                  <input
                    style={inputStyle}
                    value={b[key]}
                    onChange={(e) => updateBlock(idx, key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={addBlock}
            style={{
              background: "#223",
              color: "#9cf",
              border: "1px solid #446",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            + Add difference block
          </button>
        </fieldset>

        <div style={fieldStyle}>
          <label htmlFor="majorUnresolvedItems">Major unresolved items (one per line)</label>
          <textarea
            id="majorUnresolvedItems"
            name="majorUnresolvedItems"
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="closureCandidates">Closure candidates (one per line)</label>
          <textarea
            id="closureCandidates"
            name="closureCandidates"
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="escalationCandidates">Escalation candidates (one per line)</label>
          <textarea
            id="escalationCandidates"
            name="escalationCandidates"
            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="confidenceEvidenceNotes">Confidence / evidence notes (optional)</label>
          <textarea
            id="confidenceEvidenceNotes"
            name="confidenceEvidenceNotes"
            style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Saving…" : "Create Synthesis"}
        </button>
      </form>
    </>
  );
}
