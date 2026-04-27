import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspaceAdvancedPage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="advanced"
      links={[
        { href: "/states", labelKey: "states" },
        { href: "/admin", labelKey: "adminConfig" },
        { href: "/issues", labelKey: "reviewIssues" },
        { href: "/prompts", labelKey: "promptRegistry" },
        { href: "/pass6/configuration", labelKey: "pass6Configuration" },
        { href: "/pass6/prompts", labelKey: "pass6Prompts" },
        { href: "/pass6/packages", labelKey: "pass6Packages" },
        { href: "/packages", labelKey: "packagePreview" },
        { href: "/synthesis", labelKey: "synthesis" },
        { href: "/evaluations", labelKey: "evaluations" },
      ]}
    />
  );
}
