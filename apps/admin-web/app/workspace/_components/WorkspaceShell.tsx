import type { ReactNode } from "react";
import { WorkspaceNav } from "./WorkspaceNav";
import type { WorkspaceDictionary, WorkspaceLanguage } from "../_i18n";
import styles from "../workspace.module.css";

export function WorkspaceShell({
  children,
  dictionary,
  direction,
  language,
  onToggleLanguage,
}: {
  children: ReactNode;
  dictionary: WorkspaceDictionary;
  direction: "ltr" | "rtl";
  language: WorkspaceLanguage;
  onToggleLanguage: () => void;
}) {
  const languageToggle = (
    <button
      type="button"
      className={styles.workspaceLanguageToggle}
      onClick={onToggleLanguage}
      aria-label={`${dictionary.languageToggleLabel} ${dictionary.languageToggle}`}
    >
      <span>{dictionary.languageToggleLabel}</span>
      <strong>{dictionary.languageToggle}</strong>
    </button>
  );

  return (
    <div className={styles.workspaceRoot} dir={direction} lang={language}>
      <WorkspaceNav dictionary={dictionary} languageToggle={languageToggle} />
      <div className={styles.workspaceMain}>{children}</div>
    </div>
  );
}
