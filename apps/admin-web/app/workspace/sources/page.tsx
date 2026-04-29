import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspaceSourcesPage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
      pageKey="sources"
      links={[
        { href: "/intake-sources", labelKey: "intakeSources" },
        { href: "/intake-sessions", labelKey: "intakeSessions" },
      ]}
    />
  );
}
