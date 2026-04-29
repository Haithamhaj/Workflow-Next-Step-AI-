import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspaceTargetingPage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
      pageKey="targeting"
      links={[
        { href: "/targeting-rollout", labelKey: "targetingRollout" },
        { href: "/targeting-rollout/prompts", labelKey: "pass4Prompts" },
      ]}
    />
  );
}
