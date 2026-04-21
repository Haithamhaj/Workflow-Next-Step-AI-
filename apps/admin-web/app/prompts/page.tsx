import type { PromptRecord } from "@workflow/persistence";
import Link from "next/link";

async function getPrompts(): Promise<PromptRecord[]> {
  const res = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/prompts`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json() as Promise<PromptRecord[]>;
}

function RoleBadge({ role }: { role: string }) {
  const isSystem = role === "system";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "4px",
        fontWeight: "bold",
        fontSize: "0.8em",
        background: isSystem ? "#1a1a3a" : "#1a3a1a",
        color: isSystem ? "#99f" : "#7f7",
        border: isSystem ? "1px solid #446" : "1px solid #363",
      }}
    >
      {role}
    </span>
  );
}

function TypeBadge({ promptType }: { promptType: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "4px",
        fontSize: "0.8em",
        background: "#2a1a2a",
        color: "#c9c",
        border: "1px solid #636",
      }}
    >
      {promptType}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <span
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: isActive ? "#4a4" : "#a44",
        marginRight: "6px",
        verticalAlign: "middle",
      }}
    />
  );
}

export default async function PromptsPage() {
  const prompts = await getPrompts();

  return (
    <>
      <h2>Prompt Registry</h2>
      <p style={{ color: "#aaa", marginBottom: "16px" }}>
        All registered prompt units (§29.9). Each prompt must be traceable to a module and purpose.
      </p>
      <Link href="/prompts/new" className="btn-primary" style={{ display: "inline-block", marginBottom: "24px" }}>
        + Register Prompt
      </Link>

      {prompts.length === 0 ? (
        <p style={{ color: "#666", fontStyle: "italic" }}>No prompts registered yet.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.9em",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "1px solid #333", color: "#888", textAlign: "left" }}>
              <th style={{ padding: "8px 12px" }}>Prompt ID</th>
              <th style={{ padding: "8px 12px" }}>Name</th>
              <th style={{ padding: "8px 12px" }}>Type</th>
              <th style={{ padding: "8px 12px" }}>Role</th>
              <th style={{ padding: "8px 12px" }}>Module</th>
              <th style={{ padding: "8px 12px" }}>Version</th>
              <th style={{ padding: "8px 12px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {prompts.map((p) => (
              <tr key={p.promptId} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: "8px 12px", fontFamily: "monospace" }}>
                  <Link href={`/prompts/${p.promptId}`} style={{ color: "#7af" }}>
                    {p.promptId}
                  </Link>
                </td>
                <td style={{ padding: "8px 12px" }}>{p.promptName}</td>
                <td style={{ padding: "8px 12px" }}>
                  <TypeBadge promptType={p.promptType} />
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <RoleBadge role={p.role} />
                </td>
                <td style={{ padding: "8px 12px", color: "#aaa", fontFamily: "monospace" }}>
                  {p.linkedModule}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", color: "#aaa" }}>
                  {p.promptVersion}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <StatusDot status={p.status} />
                  {p.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
