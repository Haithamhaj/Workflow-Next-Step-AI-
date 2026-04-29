import { WorkspacePlaceholderPage } from "../_components/WorkspacePlaceholderPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspaceAnalysisPage() {
  return (
    <WorkspacePlaceholderPage
      initialLanguage={getInitialWorkspaceLanguage()}
      pageKey="analysis"
      links={[
        { href: "/pass6/synthesis-input-bundles", labelKey: "pass6Bundles" },
        { href: "/pass6/evaluation", labelKey: "pass6Evaluation" },
        { href: "/pass6/pre6c-gates", labelKey: "pre6cGates" },
        { href: "/pass6/interfaces", labelKey: "interfaces" },
        { href: "/pass6/methods", labelKey: "pass6Methods" },
        { href: "/pass6/configuration", labelKey: "pass6Configuration" },
      ]}
    />
  );
}
