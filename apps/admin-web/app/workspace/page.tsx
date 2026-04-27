import { WorkspaceBoundaryNote } from "./_components/WorkspaceBoundaryNote";
import { WorkspaceSectionCard } from "./_components/WorkspaceSectionCard";
import { WorkspaceShell } from "./_components/WorkspaceShell";
import styles from "./workspace.module.css";

const sections = [
  {
    id: "command-center",
    name: "Command Center",
    purpose: "Guided case-level control surface for the connected Pass 1-6 journey.",
  },
  {
    id: "sources",
    name: "Sources",
    purpose: "Source and context workbench for intake material, context formation, and source warnings.",
    links: [
      { href: "/intake-sources", label: "Intake sources" },
      { href: "/intake-sessions", label: "Intake sessions" },
    ],
  },
  {
    id: "hierarchy",
    name: "Hierarchy",
    purpose: "Hierarchy review and structural grounding before participant targeting.",
    links: [{ href: "/intake-sessions", label: "Intake sessions" }],
  },
  {
    id: "targeting",
    name: "Targeting",
    purpose: "Participant targeting and rollout planning before evidence collection.",
    links: [{ href: "/targeting-rollout", label: "Targeting rollout" }],
  },
  {
    id: "evidence",
    name: "Evidence",
    purpose: "Participant evidence, transcript review, extraction, clarification, and handoff readiness.",
    links: [{ href: "/participant-sessions", label: "Participant sessions" }],
  },
  {
    id: "analysis",
    name: "Analysis",
    purpose: "Pass 6 preparation, analysis, readiness review, Pre-6C gates, and external interfaces.",
    links: [
      { href: "/pass6/synthesis-input-bundles", label: "Pass 6 bundles" },
      { href: "/pass6/evaluation", label: "Pass 6 evaluation" },
      { href: "/pass6/pre6c-gates", label: "Pre-6C gates" },
      { href: "/pass6/interfaces", label: "Interfaces" },
    ],
  },
  {
    id: "prompt-studio",
    name: "Prompt Studio",
    purpose: "Friendly entry point for prompt control while PromptOps remains the source of truth.",
    links: [
      { href: "/prompts", label: "Prompt registry" },
      { href: "/targeting-rollout/prompts", label: "Pass 4 prompts" },
      { href: "/pass6/prompts", label: "Pass 6 prompts" },
    ],
  },
  {
    id: "package",
    name: "Package",
    purpose: "Package readiness, governed Pass 6 outputs, and package preview surfaces.",
    links: [
      { href: "/pass6/packages", label: "Pass 6 packages" },
      { href: "/packages", label: "Package preview" },
      { href: "/initial-packages", label: "Initial packages" },
      { href: "/final-packages", label: "Final packages" },
    ],
  },
  {
    id: "advanced",
    name: "Advanced",
    purpose: "Safe escape hatch to existing raw admin and debug surfaces.",
    links: [
      { href: "/states", label: "States" },
      { href: "/admin", label: "Admin config" },
      { href: "/issues", label: "Review issues" },
      { href: "/synthesis", label: "Synthesis" },
      { href: "/evaluations", label: "Evaluations" },
    ],
  },
];

export default function WorkspacePage() {
  return (
    <WorkspaceShell>
      <header className={styles.workspaceHeader}>
        <div className={styles.workspaceKicker}>Workspace sandbox slice</div>
        <h2 className={styles.workspaceTitle}>Guided Workspace</h2>
        <p className={styles.workspaceLead}>
          This is the Guided Workspace entry point. It will summarize existing
          operational stages across setup, sources, hierarchy, targeting,
          evidence, analysis, prompt control, and package review. Advanced and
          raw admin routes remain available through the existing admin UI.
        </p>
      </header>

      <WorkspaceBoundaryNote />

      <div className={styles.workspaceGrid}>
        {sections.map((section) => (
          <WorkspaceSectionCard
            key={section.id}
            id={section.id}
            name={section.name}
            purpose={section.purpose}
            links={section.links}
          />
        ))}
      </div>
    </WorkspaceShell>
  );
}
