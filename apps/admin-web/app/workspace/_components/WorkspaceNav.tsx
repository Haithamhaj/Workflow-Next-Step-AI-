import styles from "../workspace.module.css";
import type { WorkspaceDictionary } from "../_i18n";

const sections = [
  { id: "commandCenter", anchor: "commandCenter", labelKey: "commandCenter" },
  { id: "sources", anchor: "sources", labelKey: "sources" },
  { id: "hierarchy", anchor: "hierarchy", labelKey: "hierarchy" },
  { id: "targeting", anchor: "targeting", labelKey: "targeting" },
  { id: "evidence", anchor: "evidence", labelKey: "evidence" },
  { id: "analysis", anchor: "analysis", labelKey: "analysis" },
  { id: "promptStudio", anchor: "promptStudio", labelKey: "promptStudio" },
  { id: "package", anchor: "package", labelKey: "package" },
  { id: "advanced", anchor: "advanced", labelKey: "advanced" },
] as const;

export function WorkspaceNav({ dictionary }: { dictionary: WorkspaceDictionary }) {
  return (
    <aside className={styles.workspaceNav} aria-label="Workspace sections">
      <div className={styles.workspaceBrand}>
        <span className={styles.workspaceBrandLabel}>{dictionary.brand.title}</span>
        <span className={styles.workspaceBrandNote}>{dictionary.shellLabel}</span>
      </div>
      <nav>
        <ul className={styles.workspaceNavList}>
          {sections.map((section) => (
            <li key={section.id}>
              <a className={styles.workspaceNavLink} href={`#${section.anchor}`}>
                {dictionary.nav[section.labelKey]}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
