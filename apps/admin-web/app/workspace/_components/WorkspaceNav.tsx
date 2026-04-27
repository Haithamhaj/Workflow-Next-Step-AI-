import styles from "../workspace.module.css";

const sections = [
  { id: "command-center", label: "Command Center" },
  { id: "sources", label: "Sources" },
  { id: "hierarchy", label: "Hierarchy" },
  { id: "targeting", label: "Targeting" },
  { id: "evidence", label: "Evidence" },
  { id: "analysis", label: "Analysis" },
  { id: "prompt-studio", label: "Prompt Studio" },
  { id: "package", label: "Package" },
  { id: "advanced", label: "Advanced" },
];

export function WorkspaceNav() {
  return (
    <aside className={styles.workspaceNav} aria-label="Workspace sections">
      <div className={styles.workspaceBrand}>
        <span className={styles.workspaceBrandLabel}>Guided Workspace</span>
        <span className={styles.workspaceBrandNote}>Shell only</span>
      </div>
      <nav>
        <ul className={styles.workspaceNavList}>
          {sections.map((section) => (
            <li key={section.id}>
              <a className={styles.workspaceNavLink} href={`#${section.id}`}>
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
