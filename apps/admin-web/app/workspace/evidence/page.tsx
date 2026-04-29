import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspaceEvidencePage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
      pageKey="evidence"
      links={[{ href: "/participant-sessions", labelKey: "participantSessions" }]}
    />
  );
}
