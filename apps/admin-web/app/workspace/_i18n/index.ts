import { ar } from "./ar";
import { en } from "./en";

export const workspaceDictionaries = { en, ar } as const;

export type WorkspaceLanguage = keyof typeof workspaceDictionaries;
export type WorkspaceDictionary = (typeof workspaceDictionaries)[WorkspaceLanguage];

export function getWorkspaceDirection(language: WorkspaceLanguage): "ltr" | "rtl" {
  return language === "ar" ? "rtl" : "ltr";
}
