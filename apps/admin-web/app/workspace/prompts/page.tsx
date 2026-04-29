import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspacePromptsPage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
      pageKey="prompts"
      links={[
        { href: "/prompts", labelKey: "promptRegistry" },
        { href: "/targeting-rollout/prompts", labelKey: "pass4Prompts" },
        { href: "/pass6/prompts", labelKey: "pass6Prompts" },
      ]}
    />
  );
}
