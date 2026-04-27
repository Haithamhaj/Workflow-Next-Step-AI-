import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspaceTargetingPage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="targeting"
      links={[
        { href: "/targeting-rollout", labelKey: "targetingRollout" },
        { href: "/targeting-rollout/prompts", labelKey: "pass4Prompts" },
      ]}
    />
  );
}
