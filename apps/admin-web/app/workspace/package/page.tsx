import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspacePackagePage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
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
