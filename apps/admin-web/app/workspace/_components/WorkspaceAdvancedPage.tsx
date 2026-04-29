"use client";

import Link from "next/link";
import { getWorkspaceDirection, workspaceDictionaries, type WorkspaceLanguage } from "../_i18n";
import { WorkspaceShell } from "./WorkspaceShell";
import { useWorkspaceLanguage } from "./useWorkspaceLanguage";
import styles from "../workspace.module.css";

type AdvancedGroupKey = keyof (typeof workspaceDictionaries)["en"]["advanced"]["groups"];
type LinkKey = keyof (typeof workspaceDictionaries)["en"]["links"];

const advancedGroups: Array<{
  key: AdvancedGroupKey;
  links: Array<{ href: string; labelKey: LinkKey }>;
}> = [
  {
    key: "coreAdmin",
    links: [
      { href: "/cases", labelKey: "cases" },
      { href: "/intake-sessions", labelKey: "intakeSessions" },
      { href: "/intake-sources", labelKey: "intakeSources" },
      { href: "/states", labelKey: "states" },
      { href: "/admin", labelKey: "adminConfig" },
    ],
  },
  {
    key: "sourceContext",
    links: [
      { href: "/intake-sources", labelKey: "intakeSources" },
      { href: "/intake-sessions", labelKey: "intakeSessions" },
    ],
  },
  {
    key: "targetingEvidence",
    links: [
      { href: "/targeting-rollout", labelKey: "targetingRollout" },
      { href: "/participant-sessions", labelKey: "participantSessions" },
    ],
  },
  {
    key: "promptOps",
    links: [
      { href: "/prompts", labelKey: "promptRegistry" },
      { href: "/targeting-rollout/prompts", labelKey: "pass4Prompts" },
      { href: "/pass6/prompts", labelKey: "pass6Prompts" },
    ],
  },
  {
    key: "pass6Analysis",
    links: [
      { href: "/pass6/synthesis-input-bundles", labelKey: "pass6Bundles" },
      { href: "/pass6/evaluation", labelKey: "pass6Evaluation" },
      { href: "/pass6/pre6c-gates", labelKey: "pre6cGates" },
      { href: "/pass6/interfaces", labelKey: "interfaces" },
      { href: "/pass6/methods", labelKey: "pass6Methods" },
      { href: "/pass6/configuration", labelKey: "pass6Configuration" },
    ],
  },
  {
    key: "packagePreview",
    links: [
      { href: "/pass6/packages", labelKey: "pass6Packages" },
      { href: "/packages", labelKey: "packagePreview" },
      { href: "/initial-packages", labelKey: "initialPackages" },
      { href: "/final-packages", labelKey: "finalPackages" },
    ],
  },
  {
    key: "reviewIssues",
    links: [
      { href: "/issues", labelKey: "reviewIssues" },
      { href: "/synthesis", labelKey: "synthesis" },
      { href: "/evaluations", labelKey: "evaluations" },
    ],
  },
];

export function WorkspaceAdvancedPage({
  initialLanguage = null,
}: {
  initialLanguage?: WorkspaceLanguage | null;
}) {
  const { language, toggleLanguage, isLanguageReady } = useWorkspaceLanguage(initialLanguage);
  const dictionary = workspaceDictionaries[language];
  const direction = getWorkspaceDirection(language);
  const page = dictionary.pages.advanced;

  if (!isLanguageReady) {
    return <div className={styles.workspaceLanguageBoot} aria-hidden="true" />;
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
        <p className={styles.workspaceBoundaryText}>{dictionary.advanced.boundary}</p>
      </section>

      <section className={styles.workspaceGuardrailPanel} aria-label={dictionary.advanced.mustNotTitle}>
        <h3 className={styles.workspacePanelTitle}>{dictionary.advanced.mustNotTitle}</h3>
        <ul className={styles.workspaceGuardrailList}>
          {dictionary.advanced.mustNotItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className={styles.workspaceAdvancedGroupGrid} aria-label={dictionary.placeholder.advancedLinks}>
        {advancedGroups.map((group) => {
          const copy = dictionary.advanced.groups[group.key];
          return (
            <article key={group.key} className={styles.workspaceAdvancedGroup}>
              <h3 className={styles.workspacePanelTitle}>{copy.title}</h3>
              <p className={styles.workspaceCardPurpose}>{copy.description}</p>
              <ul className={styles.workspaceLinkList}>
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link className={styles.workspaceAdminLink} href={link.href}>
                      {dictionary.links[link.labelKey]}
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>
    </WorkspaceShell>
  );
}
