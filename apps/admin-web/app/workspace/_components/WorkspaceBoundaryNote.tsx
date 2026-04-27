import styles from "../workspace.module.css";
import type { WorkspaceDictionary } from "../_i18n";

export function WorkspaceBoundaryNote({
  dictionary,
}: {
  dictionary: WorkspaceDictionary;
}) {
  return (
    <section className={styles.workspaceBoundary} aria-label={dictionary.boundary.label}>
      <p className={styles.workspaceBoundaryTitle}>{dictionary.boundary.title}</p>
      <p className={styles.workspaceBoundaryText}>
        {dictionary.boundary.text}
      </p>
    </section>
  );
}
