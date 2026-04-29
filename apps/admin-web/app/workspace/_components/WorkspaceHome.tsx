"use client";

import { getWorkspaceDirection, workspaceDictionaries, type WorkspaceLanguage } from "../_i18n";
import { WorkspaceBoundaryNote } from "./WorkspaceBoundaryNote";
import { WorkspaceSectionCard } from "./WorkspaceSectionCard";
import { WorkspaceShell } from "./WorkspaceShell";
import {
  CommandCenterDashboard,
  EvidenceMetricRow,
  OrientationVisuals,
  PackageReadinessOverview,
  ReviewIssueList,
  StageJourneyMap,
  TruthBoundaryCard,
  WorkspaceCommandSection,
} from "./WorkspaceVisualSystem";
import { useWorkspaceLanguage } from "./useWorkspaceLanguage";
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

const staticModuleOrder = [
  "promptStudio",
  "package",
  "advanced",
] as const;

export function WorkspaceHome({
  initialLanguage = null,
}: {
  initialLanguage?: WorkspaceLanguage | null;
}) {
  const { language, toggleLanguage, isLanguageReady } = useWorkspaceLanguage(initialLanguage);
  const dictionary = workspaceDictionaries[language];
  const direction = getWorkspaceDirection(language);

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
      <WorkspaceCommandSection
        title={dictionary.visual.commandSections.critical.title}
        description={dictionary.visual.commandSections.critical.description}
      >
        <CommandCenterDashboard dictionary={dictionary} />
      </WorkspaceCommandSection>

      <WorkspaceCommandSection
        title={dictionary.visual.commandSections.evidence.title}
        description={dictionary.visual.commandSections.evidence.description}
      >
        <EvidenceMetricRow dictionary={dictionary} />
        <ReviewIssueList dictionary={dictionary} limit={3} />
        <TruthBoundaryCard dictionary={dictionary} />
      </WorkspaceCommandSection>

      <WorkspaceCommandSection
        title={dictionary.visual.commandSections.package.title}
        description={dictionary.visual.commandSections.package.description}
      >
        <PackageReadinessOverview dictionary={dictionary} />
      </WorkspaceCommandSection>

      <WorkspaceCommandSection
        title={dictionary.visual.commandSections.journey.title}
        description={dictionary.visual.commandSections.journey.description}
      >
        <StageJourneyMap dictionary={dictionary} compact />
      </WorkspaceCommandSection>

      <WorkspaceCommandSection
        title={dictionary.visual.commandSections.visual.title}
        description={dictionary.visual.commandSections.visual.description}
      >
        <OrientationVisuals dictionary={dictionary} />
      </WorkspaceCommandSection>

      <WorkspaceCommandSection
        title={dictionary.visual.commandSections.static.title}
        description={dictionary.visual.commandSections.static.description}
      >
        <WorkspaceBoundaryNote dictionary={dictionary} />
        <div className={styles.workspaceGrid}>
          {staticModuleOrder.map((sectionId) => {
            const section = dictionary.sections[sectionId];
            const links = (sectionLinks[sectionId] ?? []).map((link) => ({
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
      </WorkspaceCommandSection>
    </WorkspaceShell>
  );
}
