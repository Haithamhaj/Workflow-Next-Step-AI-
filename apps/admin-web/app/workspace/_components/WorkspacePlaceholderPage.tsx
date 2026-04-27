"use client";

import Link from "next/link";
import { useState } from "react";
import {
  getWorkspaceDirection,
  workspaceDictionaries,
  type WorkspaceLanguage,
} from "../_i18n";
import { WorkspaceShell } from "./WorkspaceShell";
import { WorkspaceScreenVisuals } from "./WorkspaceVisualSystem";
import styles from "../workspace.module.css";

export type WorkspacePlaceholderKey =
  | "sources"
  | "hierarchy"
  | "targeting"
  | "evidence"
  | "analysis"
  | "prompts"
  | "package"
  | "advanced";

type AdvancedLinkKey = keyof (typeof workspaceDictionaries)["en"]["links"];

export interface WorkspacePlaceholderLink {
  href: string;
  labelKey: AdvancedLinkKey;
}

export function WorkspacePlaceholderPage({
  pageKey,
  links = [],
}: {
  pageKey: WorkspacePlaceholderKey;
  links?: WorkspacePlaceholderLink[];
}) {
  const [language, setLanguage] = useState<WorkspaceLanguage>("en");
  const dictionary = workspaceDictionaries[language];
  const direction = getWorkspaceDirection(language);
  const page = dictionary.pages[pageKey];

  function toggleLanguage() {
    setLanguage((current) => (current === "en" ? "ar" : "en"));
  }

  return (
    <WorkspaceShell
      dictionary={dictionary}
      direction={direction}
      language={language}
      onToggleLanguage={toggleLanguage}
    >
      <header className={styles.workspaceHeader}>
        <div className={styles.workspaceKicker}>{page.eyebrow}</div>
        <h2 className={styles.workspaceTitle}>{page.title}</h2>
        <p className={styles.workspaceLead}>{page.purpose}</p>
      </header>

      <section className={styles.workspaceBoundary} aria-label={dictionary.placeholder.screenBoundaryTitle}>
        <p className={styles.workspaceBoundaryTitle}>
          {dictionary.placeholder.screenBoundaryTitle}
        </p>
        <p className={styles.workspaceBoundaryText}>{dictionary.placeholder.displayOnly}</p>
        <p className={styles.workspaceBoundaryText}>{page.boundary}</p>
      </section>

      {pageKey !== "advanced" ? (
        <WorkspaceScreenVisuals pageKey={pageKey} dictionary={dictionary} />
      ) : null}

      <section className={styles.workspacePanel} aria-label={dictionary.placeholder.futureCapabilities}>
        <div className={styles.workspacePanelHeader}>
          <div>
            <div className={styles.workspaceKicker}>{dictionary.placeholder.stageLabel}</div>
            <h3 className={styles.workspacePanelTitle}>
              {dictionary.placeholder.futureCapabilities}
            </h3>
          </div>
          <span className={styles.workspaceCardBadge}>{dictionary.card.laterSlice}</span>
        </div>
        <div className={styles.workspaceCapabilityGrid}>
          {page.capabilities.map((capability) => (
            <div key={capability} className={styles.workspaceCapabilityCard}>
              {capability}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.workspacePanel} aria-label={dictionary.placeholder.advancedLinks}>
        <div className={styles.workspacePanelHeader}>
          <h3 className={styles.workspacePanelTitle}>{dictionary.placeholder.advancedLinks}</h3>
        </div>
        {links.length > 0 ? (
          <ul className={styles.workspaceLinkList}>
            {links.map((link) => (
              <li key={link.href}>
                <Link className={styles.workspaceAdminLink} href={link.href}>
                  {dictionary.links[link.labelKey]}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.workspaceCardPurpose}>{dictionary.placeholder.noAdvancedLinks}</p>
        )}
      </section>
    </WorkspaceShell>
  );
}
