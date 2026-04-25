import {
  buildParticipantGuidanceText,
  resolveSessionAccessToken,
} from "@workflow/participant-sessions";
import { store } from "../../../../lib/store";
import { SessionNarrativeForm } from "./SessionNarrativeForm";

export const dynamic = "force-dynamic";

function TokenErrorPanel({ message }: { message: string }) {
  return (
    <section className="card" style={{ borderColor: "#6d3740", background: "#1b1013" }}>
      <h2>Session link unavailable</h2>
      <p style={{ color: "#f0b8bf", marginBottom: 0 }}>{message}</p>
    </section>
  );
}

export default function ParticipantWebSessionPage({
  params,
}: {
  params: { token: string };
}) {
  const resolved = resolveSessionAccessToken(
    params.token,
    store.sessionAccessTokens,
    store.participantSessions,
  );

  if (!resolved.ok) {
    return <TokenErrorPanel message={resolved.errors[0]?.message ?? "This session link is not valid."} />;
  }
  if (resolved.token.channelType !== "web_session_chatbot") {
    return <TokenErrorPanel message="This link is not configured for a web participant session." />;
  }

  const session = resolved.participantSession;
  const alreadySubmitted = Boolean(session.firstNarrativeEvidenceId ?? session.rawEvidence.firstNarrativeEvidenceId);
  const guidance = buildParticipantGuidanceText(session, "web");

  return (
    <div
      dir={guidance.language === "ar" ? "rtl" : "ltr"}
      lang={guidance.language}
      style={{ maxWidth: "760px", display: "grid", gap: "18px" }}
    >
      <section>
        <p className="muted" style={{ margin: "0 0 4px" }}>
          Participant session
        </p>
        <h2 style={{ marginBottom: "8px" }}>{session.participantLabel}</h2>
        {guidance.language === "ar" ? (
          <p style={{ color: "#c6ced8", margin: 0 }}>
            نناقش <strong>{session.selectedUseCase}</strong> ضمن{" "}
            <strong>{session.selectedDepartment}</strong>.
          </p>
        ) : (
          <p style={{ color: "#c6ced8", margin: 0 }}>
            We are discussing <strong>{session.selectedUseCase}</strong> for{" "}
            <strong>{session.selectedDepartment}</strong>.
          </p>
        )}
      </section>

      <section className="card" style={{ background: "#10161e" }}>
        <h3 style={{ marginTop: 0 }}>Before you begin</h3>
        <ul style={{ display: "grid", gap: "8px", paddingLeft: "20px", marginBottom: 0 }}>
          {guidance.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <SessionNarrativeForm token={params.token} alreadySubmitted={alreadySubmitted} />
      </section>
    </div>
  );
}
