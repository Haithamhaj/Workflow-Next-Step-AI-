import type { SessionState } from "@workflow/contracts";

// Visual mapping per §28.9 SessionState (6 values).
// Color choices are presentation only — the canonical values come from contracts.
const STATE_STYLES: Record<
  SessionState,
  { bg: string; fg: string; border: string; label: string }
> = {
  not_started: { bg: "#1a1a1a", fg: "#888", border: "#444", label: "not started" },
  input_received: { bg: "#1a2a3a", fg: "#7af", border: "#345", label: "input received" },
  extraction_in_progress: {
    bg: "#2a2a1a",
    fg: "#dd7",
    border: "#554",
    label: "extraction in progress",
  },
  follow_up_needed: {
    bg: "#3a2a1a",
    fg: "#fa7",
    border: "#653",
    label: "follow-up needed",
  },
  session_partial: {
    bg: "#2a1a2a",
    fg: "#c9c",
    border: "#636",
    label: "session partial",
  },
  session_ready_for_synthesis: {
    bg: "#1a3a1a",
    fg: "#7f7",
    border: "#363",
    label: "ready for synthesis",
  },
};

export function StateBadge({ state }: { state: SessionState }) {
  const s = STATE_STYLES[state];
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "4px",
        fontWeight: "bold",
        fontSize: "0.8em",
        background: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        fontFamily: "monospace",
      }}
    >
      {s.label}
    </span>
  );
}
