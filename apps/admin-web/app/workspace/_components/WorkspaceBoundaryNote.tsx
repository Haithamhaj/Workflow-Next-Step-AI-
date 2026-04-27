import styles from "../workspace.module.css";

export function WorkspaceBoundaryNote() {
  return (
    <section className={styles.workspaceBoundary} aria-label="Workspace boundary">
      <p className={styles.workspaceBoundaryTitle}>Production boundary</p>
      <p className={styles.workspaceBoundaryText}>
        This workspace is a guided UI layer. It does not own workflow truth,
        approval gates, package eligibility, prompt lifecycle truth, provider
        execution, or state transitions.
      </p>
    </section>
  );
}
