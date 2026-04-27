"use client";

import { useState } from "react";
import {
  getWorkspaceDirection,
  workspaceDictionaries,
  type WorkspaceLanguage,
} from "../_i18n";
import { WorkspaceBoundaryNote } from "./WorkspaceBoundaryNote";
import { WorkspaceSectionCard } from "./WorkspaceSectionCard";
import { WorkspaceShell } from "./WorkspaceShell";
import {
  CommandSummaryCards,
  EvidenceMetricRow,
  OrientationVisuals,
  PackageReadinessStrip,
  PriorityActionBanner,
  ReviewIssueList,
  StageJourneyMap,
  TruthBoundaryCard,
} from "./WorkspaceVisualSystem";
import styles from "../workspace.module.css";

const sectionLinks = {
  sources: [
    { href: "/intake-sources", labelKey: "intakeSources" },
    { href: "/intake-sessions", labelKey: "intakeSessions" },
  ],
  hierarchy: [{ href: "/intake-sessions", labelKey: "intakeSessions" }],
  targeting: [{ href: "/targeting-rollout", labelKey: "targetingRollout" }],
  evidence: [{ href: "/participant-sessions", labelKey: "participantSessions" }],
  analysis: [
    { href: "/pass6/synthesis-input-bundles", labelKey: "pass6Bundles" },
    { href: "/pass6/evaluation", labelKey: "pass6Evaluation" },
    { href: "/pass6/pre6c-gates", labelKey: "pre6cGates" },
    { href: "/pass6/interfaces", labelKey: "interfaces" },
  ],
  promptStudio: [
    { href: "/prompts", labelKey: "promptRegistry" },
    { href: "/targeting-rollout/prompts", labelKey: "pass4Prompts" },
    { href: "/pass6/prompts", labelKey: "pass6Prompts" },
  ],
  package: [
    { href: "/pass6/packages", labelKey: "pass6Packages" },
    { href: "/packages", labelKey: "packagePreview" },
    { href: "/initial-packages", labelKey: "initialPackages" },
    { href: "/final-packages", labelKey: "finalPackages" },
  ],
  advanced: [
    { href: "/states", labelKey: "states" },
    { href: "/admin", labelKey: "adminConfig" },
    { href: "/issues", labelKey: "reviewIssues" },
    { href: "/synthesis", labelKey: "synthesis" },
    { href: "/evaluations", labelKey: "evaluations" },
  ],
} as const;

const sectionOrder = [
  "commandCenter",
  "sources",
  "hierarchy",
  "targeting",
  "evidence",
  "analysis",
  "promptStudio",
  "package",
  "advanced",
] as const;

export function WorkspaceHome() {
  const [language, setLanguage] = useState<WorkspaceLanguage>("en");
  const dictionary = workspaceDictionaries[language];
  const direction = getWorkspaceDirection(language);

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
        <div className={styles.workspaceKicker}>{dictionary.header.kicker}</div>
        <h2 className={styles.workspaceTitle}>{dictionary.header.title}</h2>
        <p className={styles.workspaceLead}>{dictionary.header.lead}</p>
      </header>

      <WorkspaceBoundaryNote dictionary={dictionary} />

      <CommandSummaryCards dictionary={dictionary} />

      <PriorityActionBanner dictionary={dictionary} />

      <StageJourneyMap dictionary={dictionary} />

      <EvidenceMetricRow dictionary={dictionary} />

      <ReviewIssueList dictionary={dictionary} limit={3} />

      <PackageReadinessStrip dictionary={dictionary} />

      <OrientationVisuals dictionary={dictionary} />

      <TruthBoundaryCard dictionary={dictionary} />

      <div className={styles.workspaceGrid}>
        {sectionOrder.map((sectionId) => {
          const section = dictionary.sections[sectionId];
          const links = (sectionLinks[sectionId as keyof typeof sectionLinks] ?? []).map((link) => ({
            href: link.href,
            label: dictionary.links[link.labelKey],
          }));

          return (
            <WorkspaceSectionCard
              key={sectionId}
              id={sectionId}
              name={section.name}
              purpose={section.purpose}
              dictionary={dictionary}
              links={links}
            />
          );
        })}
      </div>
    </WorkspaceShell>
  );
}
