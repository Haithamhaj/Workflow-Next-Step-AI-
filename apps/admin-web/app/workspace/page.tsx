import { WorkspaceHome } from "./_components/WorkspaceHome";
import { getInitialWorkspaceLanguage } from "./_i18n/server";

export default function WorkspacePage() {
  return <WorkspaceHome initialLanguage={getInitialWorkspaceLanguage()} />;
}
