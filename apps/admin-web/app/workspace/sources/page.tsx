import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspaceSourcesPage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="sources"
      links={[
        { href: "/intake-sources", labelKey: "intakeSources" },
        { href: "/intake-sessions", labelKey: "intakeSessions" },
      ]}
    />
  );
}
