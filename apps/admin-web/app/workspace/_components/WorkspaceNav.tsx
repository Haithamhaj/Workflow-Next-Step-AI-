"use client";

import type { ReactNode } from "react";
import styles from "../workspace.module.css";
import type { WorkspaceDictionary } from "../_i18n";
import { usePathname } from "next/navigation";

const sections = [
  { id: "commandCenter", href: "/workspace", labelKey: "commandCenter" },
  { id: "sources", href: "/workspace/sources", labelKey: "sources" },
  { id: "hierarchy", href: "/workspace/hierarchy", labelKey: "hierarchy" },
  { id: "targeting", href: "/workspace/targeting", labelKey: "targeting" },
  { id: "evidence", href: "/workspace/evidence", labelKey: "evidence" },
  { id: "analysis", href: "/workspace/analysis", labelKey: "analysis" },
  { id: "promptStudio", href: "/workspace/prompts", labelKey: "promptStudio" },
  { id: "copilotInstructions", href: "/workspace/copilot-instructions", labelKey: "copilotInstructions" },
  { id: "package", href: "/workspace/package", labelKey: "package" },
  { id: "advanced", href: "/workspace/advanced", labelKey: "advanced" },
] as const;

export function WorkspaceNav({
  dictionary,
  languageToggle,
}: {
  dictionary: WorkspaceDictionary;
  languageToggle?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className={styles.workspaceNav} aria-label="Workspace sections">
      <div className={styles.workspaceBrand}>
        <span className={styles.workspaceBrandLabel}>{dictionary.brand.title}</span>
        <span className={styles.workspaceBrandNote}>{dictionary.shellLabel}</span>
        {languageToggle}
      </div>
      <nav>
        <ul className={styles.workspaceNavList}>
          {sections.map((section) => (
            <li key={section.id}>
              <a
                className={pathname === section.href ? `${styles.workspaceNavLink} ${styles.workspaceNavLinkActive}` : styles.workspaceNavLink}
                href={section.href}
                aria-current={pathname === section.href ? "page" : undefined}
              >
                {dictionary.nav[section.labelKey]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
