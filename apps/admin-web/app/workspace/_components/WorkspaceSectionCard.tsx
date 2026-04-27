import Link from "next/link";
import styles from "../workspace.module.css";

interface WorkspaceSectionCardProps {
  id: string;
  name: string;
  purpose: string;
  links?: { href: string; label: string }[];
}

export function WorkspaceSectionCard({
  id,
  name,
  purpose,
  links = [],
}: WorkspaceSectionCardProps) {
  return (
    <section id={id} className={styles.workspaceCard}>
      <div className={styles.workspaceCardHeader}>
        <h3 className={styles.workspaceCardTitle}>{name}</h3>
        <span className={styles.workspaceCardBadge}>Later slice</span>
      </div>
      <p className={styles.workspaceCardPurpose}>{purpose}</p>
      <p className={styles.workspaceCardNote}>
        Static placeholder only. Production data, actions, and guided state will
        be added in later slices.
      </p>
      {links.length > 0 ? (
        <ul className={styles.workspaceLinkList} aria-label={`${name} advanced links`}>
          {links.map((link) => (
            <li key={link.href}>
              <Link className={styles.workspaceAdminLink} href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
