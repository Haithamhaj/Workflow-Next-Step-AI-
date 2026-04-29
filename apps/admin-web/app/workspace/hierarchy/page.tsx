import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspaceHierarchyPage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
      pageKey="hierarchy"
      links={[{ href: "/intake-sessions", labelKey: "intakeSessions" }]}
    />
  );
}
