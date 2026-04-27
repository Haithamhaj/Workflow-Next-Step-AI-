import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspacePromptsPage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="prompts"
      links={[
        { href: "/prompts", labelKey: "promptRegistry" },
        { href: "/targeting-rollout/prompts", labelKey: "pass4Prompts" },
        { href: "/pass6/prompts", labelKey: "pass6Prompts" },
      ]}
    />
  );
}
