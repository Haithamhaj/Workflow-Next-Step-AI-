import { cookies } from "next/headers";
import type { WorkspaceLanguage } from ".";

const WORKSPACE_LANGUAGE_COOKIE_KEY = "workflow_workspace_language";

export function getInitialWorkspaceLanguage(): WorkspaceLanguage | null {
  const value = cookies().get(WORKSPACE_LANGUAGE_COOKIE_KEY)?.value;
  return value === "en" || value === "ar" ? value : null;
}
