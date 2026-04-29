import { WorkspaceAdvancedPage as WorkspaceAdvancedScreen } from "../_components/WorkspaceAdvancedPage";
import { getInitialWorkspaceLanguage } from "../_i18n/server";

export default function WorkspaceAdvancedPage() {
  return <WorkspaceAdvancedScreen initialLanguage={getInitialWorkspaceLanguage()} />;
}
