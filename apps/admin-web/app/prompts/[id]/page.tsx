import type { PromptRecord } from "@workflow/persistence";
import { isSystemPrompt, isUserPrompt } from "@workflow/prompts";
import Link from "next/link";

async function getPromptById(id: string): Promise<PromptRecord | null> {
  const res = await fetch(
    `http://localhost:${process.env.PORT ?? 3000}/api/prompts/${id}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json() as Promise<PromptRecord>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td
        style={{
          padding: "8px 16px 8px 0",
          color: "#aaa",
          fontWeight: 500,
          verticalAlign: "top",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </td>
      <td style={{ padding: "8px 0", fontFamily: "monospace" }}>{value}</td>
    </tr>
  );
}

export default async function PromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const prompt = await getPromptById(params.id);

  if (!prompt) {
    return (
      <>
        <h2>Prompt not found</h2>
        <p>
          <Link href="/prompts">← Back to prompts</Link>
        </p>
      </>
    );
  }

  const isSystem = isSystemPrompt(prompt);
  const isUser = isUserPrompt(prompt);
  const isActive = prompt.status === "active";

  // Role classification panel colours
  const roleBackground = isSystem ? "#0e0e2a" : "#0e2a0e";
  const roleBorder = isSystem ? "2px solid #3a3a7a" : "2px solid #3a7a3a";
  const roleColor = isSystem ? "#99f" : "#7f7";
  const roleLabel = isSystem ? "system" : isUser ? "user" : prompt.role;

  // Type classification pill colours
  const typeColors: Record<string, { bg: string; color: string; border: string }> = {
    extraction: { bg: "#1a1a2a", color: "#99f", border: "#446" },
    classification: { bg: "#2a1a0e", color: "#fa9", border: "#863" },
    synthesis: { bg: "#1a2a1a", color: "#7f7", border: "#363" },
    package_section_drafting: { bg: "#2a2a0e", color: "#ff9", border: "#663" },
    clarification_generation: { bg: "#2a0e1a", color: "#f9c", border: "#636" },
  };
  const tc = typeColors[prompt.promptType] ?? {
    bg: "#2a2a2a",
    color: "#aaa",
    border: "#444",
  };

  return (
    <>
      <h2>Prompt Detail</h2>
      <p>
        <Link href="/prompts">← Back to prompt registry</Link>
      </p>

      {/* Role + Type Classification Panel — visually distinct (proof item #7) */}
      <div
        style={{
          margin: "20px 0",
          padding: "16px 20px",
          borderRadius: "8px",
          background: roleBackground,
          border: roleBorder,
        }}
      >
        <div
          style={{
            marginBottom: "10px",
            fontSize: "0.8em",
            color: "#888",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Role &amp; Type Classification
        </div>

        {/* Role badge */}
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "0.9em",
            background: isSystem ? "#1a1a3a" : "#1a3a1a",
            color: roleColor,
            border: isSystem ? "1px solid #446" : "1px solid #363",
            marginRight: "10px",
          }}
        >
          {isSystem ? "⬛ system prompt" : isUser ? "👤 user prompt" : roleLabel}
        </span>

        {/* Type badge */}
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "0.9em",
            background: tc.bg,
            color: tc.color,
            border: `1px solid #${tc.border}`,
          }}
        >
          {prompt.promptType}
        </span>

        {/* Status */}
        <span
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "6px",
            fontSize: "0.85em",
            background: isActive ? "#0e2a0e" : "#2a0e0e",
            color: isActive ? "#7f7" : "#f77",
            border: isActive ? "1px solid #363" : "1px solid #633",
            marginLeft: "10px",
          }}
        >
          {isActive ? "● active" : "○ inactive"}
        </span>

        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,
            color: "#bbb",
            fontSize: "0.88em",
          }}
        >
          {isSystem
            ? "This prompt occupies the system message role in the LLM conversation. It sets behavioral context and constraints for the model (§30.7, OQ-001)."
            : isUser
            ? "This prompt occupies the user message role in the LLM conversation. It carries the task instruction or input to the model (§30.7, OQ-001)."
            : `Role: ${prompt.role} — see OQ-001 in OPEN_QUESTIONS.md for governance confirmation.`}
        </p>
      </div>

      {/* Full prompt record */}
      <div className="card" style={{ marginTop: "16px" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <tbody>
            <Row label="Prompt ID" value={prompt.promptId} />
            <Row label="Prompt Name" value={prompt.promptName} />
            <Row label="Prompt Type" value={prompt.promptType} />
            <Row label="Role" value={prompt.role} />
            <Row label="Linked Module" value={prompt.linkedModule} />
            <Row
              label="Linked Decision Block"
              value={prompt.linkedDecisionBlock ?? "—"}
            />
            <Row label="Purpose" value={
              <span style={{ fontFamily: "sans-serif", fontSize: "0.9em", color: "#ddd" }}>
                {prompt.promptPurpose}
              </span>
            } />
            <Row label="Version" value={prompt.promptVersion} />
            <Row label="Status" value={prompt.status} />
            <Row
              label="Input Contract Ref"
              value={prompt.inputContractRef ?? "—"}
            />
            <Row
              label="Output Contract Ref"
              value={prompt.outputContractRef ?? "—"}
            />
            <Row
              label="Section Links"
              value={
                prompt.sourceSectionLinks && prompt.sourceSectionLinks.length > 0
                  ? prompt.sourceSectionLinks.join(", ")
                  : "—"
              }
            />
            <Row label="Registered At" value={prompt.registeredAt} />
            <Row label="Notes" value={prompt.notes ?? "—"} />
          </tbody>
        </table>
      </div>
    </>
  );
}
