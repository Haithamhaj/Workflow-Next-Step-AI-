"use client";

import { useEffect, useState } from "react";
import type { WorkspaceLanguage } from "../_i18n";

const WORKSPACE_LANGUAGE_STORAGE_KEY = "workflow.workspace.language";
const WORKSPACE_LANGUAGE_COOKIE_KEY = "workflow_workspace_language";

function isWorkspaceLanguage(value: string | null): value is WorkspaceLanguage {
  return value === "en" || value === "ar";
}

function writeWorkspaceLanguageCookie(language: WorkspaceLanguage) {
  document.cookie = `${WORKSPACE_LANGUAGE_COOKIE_KEY}=${language}; path=/workspace; max-age=31536000; SameSite=Lax`;
}

export function useWorkspaceLanguage(initialLanguage: WorkspaceLanguage | null = null) {
  const [language, setLanguage] = useState<WorkspaceLanguage>(initialLanguage ?? "en");
  const [isLanguageReady, setIsLanguageReady] = useState(initialLanguage !== null);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(WORKSPACE_LANGUAGE_STORAGE_KEY);
    if (isWorkspaceLanguage(storedLanguage)) {
      setLanguage(storedLanguage);
      writeWorkspaceLanguageCookie(storedLanguage);
    }
    setIsLanguageReady(true);
  }, []);

  function toggleLanguage() {
    setLanguage((current) => {
      const nextLanguage: WorkspaceLanguage = current === "en" ? "ar" : "en";
      window.localStorage.setItem(WORKSPACE_LANGUAGE_STORAGE_KEY, nextLanguage);
      writeWorkspaceLanguageCookie(nextLanguage);
      return nextLanguage;
    });
  }

  return { language, toggleLanguage, isLanguageReady };
}
