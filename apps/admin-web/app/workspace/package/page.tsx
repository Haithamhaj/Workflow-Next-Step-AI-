import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";

export default function WorkspacePackagePage() {
  return (
    <WorkspacePlaceholderPage
      pageKey="package"
      links={[
        { href: "/pass6/packages", labelKey: "pass6Packages" },
        { href: "/packages", labelKey: "packagePreview" },
        { href: "/initial-packages", labelKey: "initialPackages" },
        { href: "/final-packages", labelKey: "finalPackages" },
      ]}
    />
  );
}
