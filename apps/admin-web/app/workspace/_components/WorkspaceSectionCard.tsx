import Link from "next/link";
import styles from "../workspace.module.css";
import type { WorkspaceDictionary } from "../_i18n";

interface WorkspaceSectionCardProps {
  id: string;
  name: string;
  purpose: string;
  dictionary: WorkspaceDictionary;
  links?: { href: string; label: string }[];
}

export function WorkspaceSectionCard({
  id,
  name,
  purpose,
  dictionary,
  links = [],
}: WorkspaceSectionCardProps) {
  return (
    <section id={id} className={styles.workspaceCard}>
      <div className={styles.workspaceCardHeader}>
        <h3 className={styles.workspaceCardTitle}>{name}</h3>
        <span className={styles.workspaceCardBadge}>{dictionary.card.laterSlice}</span>
      </div>
      <p className={styles.workspaceCardPurpose}>{purpose}</p>
      <p className={styles.workspaceCardNote}>
        {dictionary.card.placeholder}
      </p>
      {links.length > 0 ? (
        <ul className={styles.workspaceLinkList} aria-label={`${name} ${dictionary.card.advancedLinksLabel}`}>
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
