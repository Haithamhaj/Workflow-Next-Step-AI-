export const en = {
  languageName: "English",
  languageToggle: "العربية",
  shellLabel: "Static shell only",
  brand: {
    title: "Guided Workspace",
    subtitle: "Workspace shell",
  },
  header: {
    kicker: "Workspace sandbox slice",
    title: "Guided Workspace",
    lead:
      "This is the Guided Workspace entry point. It will summarize existing operational stages across setup, sources, hierarchy, targeting, evidence, analysis, prompt control, and package review. Advanced and raw admin routes remain available through the existing admin UI.",
  },
  boundary: {
    label: "Boundary note",
    title: "Production boundary",
    text:
      "This workspace is a guided UI layer. It does not own workflow truth, approval gates, package eligibility, prompt lifecycle truth, provider execution, or state transitions.",
  },
  card: {
    laterSlice: "Coming in later slice",
    placeholder:
      "Static placeholder only. Production data, actions, and guided state will be added in later slices.",
    advancedLinksLabel: "advanced links",
  },
  nav: {
    commandCenter: "Command Center",
    sources: "Sources",
    hierarchy: "Hierarchy",
    targeting: "Targeting",
    evidence: "Evidence",
    analysis: "Analysis",
    promptStudio: "Prompt Studio",
    package: "Package",
    advanced: "Advanced",
  },
  sections: {
    commandCenter: {
      name: "Command Center",
      purpose: "Guided case-level control surface for the connected Pass 1-6 journey.",
    },
    sources: {
      name: "Sources",
      purpose: "Source and context workbench for intake material, context formation, and source warnings.",
    },
    hierarchy: {
      name: "Hierarchy",
      purpose: "Hierarchy review and structural grounding before participant targeting.",
    },
    targeting: {
      name: "Targeting",
      purpose: "Participant targeting and rollout planning before evidence collection.",
    },
    evidence: {
      name: "Evidence",
      purpose: "Participant evidence, transcript review, extraction, clarification, and handoff readiness.",
    },
    analysis: {
      name: "Analysis",
      purpose: "Pass 6 preparation, analysis, readiness review, Pre-6C gates, and external interfaces.",
    },
    promptStudio: {
      name: "Prompt Studio",
      purpose: "Friendly entry point for prompt control while PromptOps remains the source of truth.",
    },
    package: {
      name: "Package",
      purpose: "Package readiness, governed Pass 6 outputs, and package preview surfaces.",
    },
    advanced: {
      name: "Advanced",
      purpose: "Safe escape hatch to existing raw admin and debug surfaces.",
    },
  },
  links: {
    intakeSources: "Intake sources",
    intakeSessions: "Intake sessions",
    targetingRollout: "Targeting rollout",
    participantSessions: "Participant sessions",
    pass6Bundles: "Pass 6 bundles",
    pass6Evaluation: "Pass 6 evaluation",
    pre6cGates: "Pre-6C gates",
    interfaces: "Interfaces",
    promptRegistry: "Prompt registry",
    pass4Prompts: "Pass 4 prompts",
    pass6Prompts: "Pass 6 prompts",
    pass6Packages: "Pass 6 packages",
    packagePreview: "Package preview",
    initialPackages: "Initial packages",
    finalPackages: "Final packages",
    states: "States",
    adminConfig: "Admin config",
    reviewIssues: "Review issues",
    synthesis: "Synthesis",
    evaluations: "Evaluations",
  },
} as const;
