import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspaceHierarchyPage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="hierarchy"
      links={[{ href: "/intake-sessions", labelKey: "intakeSessions" }]}
    />
  );
}
