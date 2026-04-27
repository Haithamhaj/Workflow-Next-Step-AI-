import type { ReactNode } from "react";
import { WorkspaceNav } from "./WorkspaceNav";
import styles from "../workspace.module.css";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.workspaceRoot}>
      <WorkspaceNav />
      <div className={styles.workspaceMain}>{children}</div>
    </div>
  );
}
