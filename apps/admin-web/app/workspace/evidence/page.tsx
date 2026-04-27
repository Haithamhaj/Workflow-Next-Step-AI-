import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspaceEvidencePage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="evidence"
      links={[{ href: "/participant-sessions", labelKey: "participantSessions" }]}
    />
  );
}
