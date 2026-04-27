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
  placeholder: {
    stageLabel: "Workspace placeholder",
    futureCapabilities: "Future capabilities",
    advancedLinks: "Advanced raw routes",
    noAdvancedLinks: "No advanced links are needed for this placeholder yet.",
    screenBoundaryTitle: "Screen boundary",
    displayOnly:
      "This workspace screen is display and planning only in this slice. It does not own business logic.",
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
    cases: "Cases",
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
    pass6Methods: "Pass 6 methods",
    pass6Configuration: "Pass 6 configuration",
  },
  advanced: {
    boundary:
      "Advanced surfaces are for inspection, troubleshooting, and existing admin workflows. They are not the guided workspace path and must not be treated as a second source of workflow truth.",
    mustNotTitle: "What Advanced must not do",
    mustNotItems: [
      "Advanced links do not bypass approval gates.",
      "Advanced links do not change package eligibility.",
      "Advanced links do not override evidence trust.",
      "Advanced links do not replace prompt lifecycle governance.",
      "Advanced links do not create client-facing delivery scope.",
    ],
    groups: {
      coreAdmin: {
        title: "Core Admin",
        description:
          "Existing case, intake, state, and admin configuration surfaces. Advanced because they expose raw setup and state-oriented records.",
      },
      sourceContext: {
        title: "Source / Context",
        description:
          "Raw intake and source processing surfaces. The guided workspace does not own source classification, extraction, or context truth.",
      },
      targetingEvidence: {
        title: "Targeting / Participant Evidence",
        description:
          "Existing targeting and participant-session work areas. Advanced routes retain detailed records and action panels.",
      },
      promptOps: {
        title: "PromptOps",
        description:
          "Prompt registry and prompt workspace surfaces. Advanced because prompt lifecycle truth remains in PromptOps.",
      },
      pass6Analysis: {
        title: "Pass 6 Analysis",
        description:
          "Pass 6 preparation, readiness, gate, interface, method, and configuration surfaces. The guided workspace does not own readiness or package eligibility.",
      },
      packagePreview: {
        title: "Package / Preview",
        description:
          "Governed package output and preview surfaces. Advanced because Initial Package, Final Package, preview, and release concepts must stay distinct.",
      },
      reviewIssues: {
        title: "Review / Issues",
        description:
          "Review, synthesis, and evaluation record surfaces. Advanced routes are for inspection and existing admin workflows, not a guided path.",
      },
    },
  },
  visual: {
    status: {
      complete: "Complete",
      warning: "Warning",
      approved: "Approved",
      needsReview: "Needs review",
      blocked: "Blocked",
      placeholder: "Static placeholder",
      ready: "Ready",
      waiting: "Waiting",
      notReady: "Not ready",
    },
    actions: {
      reviewEvidence: "Review evidence",
      openAdvanced: "Open advanced route",
      tune: "Tune",
      compare: "Compare",
      activate: "Activate",
      disabled: "Disabled in this slice",
    },
    priority: {
      title: "Review evidence blockers before package readiness can continue.",
      explanation:
        "This is a static next-action example. Later slices will derive the next safe action from backend view models and existing gates.",
      urgency: "Needs review",
      actionLabel: "Review blockers",
    },
    stageJourneyTitle: "Pass 1-6 journey",
    stageJourneyDescription:
      "Static orientation map showing how the guided workspace will organize the connected workflow.",
    stages: [
      {
        number: "1",
        label: "Setup / Case",
        status: "complete",
        purpose: "Case framing is available for the workspace shell.",
        hint: "Command Center",
      },
      {
        number: "2",
        label: "Sources & Context",
        status: "warning",
        purpose: "Documents are useful signals, not workflow truth.",
        hint: "Source scope review",
      },
      {
        number: "3",
        label: "Hierarchy",
        status: "approved",
        purpose: "Structure can guide targeting without proving execution.",
        hint: "Role/interface grounding",
      },
      {
        number: "4",
        label: "Targeting",
        status: "needsReview",
        purpose: "Participant order and question seeds need operator review.",
        hint: "Planning only",
      },
      {
        number: "5",
        label: "Participant Evidence",
        status: "blocked",
        purpose: "Evidence blockers must be resolved before package readiness.",
        hint: "Transcript trust",
      },
      {
        number: "6",
        label: "Analysis & Package",
        status: "waiting",
        purpose: "Package readiness waits on accepted evidence and gates.",
        hint: "Pass 6 preparation",
      },
    ],
    evidenceMetrics: [
      { label: "Participants", value: "4" },
      { label: "Trusted transcripts", value: "3 / 4" },
      { label: "Open clarifications", value: "2" },
      { label: "Evidence disputes", value: "1" },
    ],
    reviewIssuesTitle: "Needs review",
    reviewIssues: [
      {
        title: "Transcript review required",
        why: "One participant transcript is not trusted yet.",
        impact: "Package readiness remains blocked.",
        action: "Review transcript trust before analysis continues.",
        boundary: "Evidence trust gate",
        status: "blocked",
      },
      {
        title: "Finance handoff unclear",
        why: "Participants describe different handoff owners.",
        impact: "Workflow handoff cannot be finalized.",
        action: "Queue clarification before synthesis.",
        boundary: "Workflow truth boundary",
        status: "needsReview",
      },
      {
        title: "KPI document conflicts with participant reality",
        why: "The documented SLA does not match participant descriptions.",
        impact: "Treat document as a signal until validated.",
        action: "Mark as source signal, not workflow truth.",
        boundary: "Document signal",
        status: "warning",
      },
    ],
    truthBoundaryTitle: "Truth boundaries",
    truthBoundaries: [
      "Accepted evidence is not final workflow truth.",
      "Documents are signals until validated against reality.",
      "Hierarchy approval confirms structure, not workflow truth.",
    ],
    packageReadinessTitle: "Initial Package readiness",
    packageReminder: "Initial Package is not Final Package.",
    packageReadiness: [
      { label: "Prepare Evidence", status: "ready" },
      { label: "Analyze Workflow", status: "waiting" },
      { label: "Gate / Readiness", status: "blocked" },
      { label: "Package Preview", status: "notReady" },
    ],
    methodsTitle: "Method lenses",
    methodsReminder: "Methods explain analysis; they do not invent evidence.",
    methods: [
      { title: "BPMN / Process Structure Lens", detail: "Frames steps, decisions, handoffs, and exception paths." },
      { title: "SIPOC / Boundary Lens", detail: "Clarifies suppliers, inputs, process boundaries, outputs, and customers." },
      { title: "Triangulation Lens", detail: "Compares documents, participants, and evidence anchors before conclusions." },
      { title: "Theory-in-Use vs Stated Process", detail: "Separates what people do from what documents say should happen." },
      { title: "RACI / Responsibility Lens", detail: "Checks responsibility, accountability, consultation, and informed roles." },
    ],
    departmentMap: {
      title: "Department / Role / Interface Map",
      label:
        "Hierarchy and role maps show structure and interfaces. They do not prove workflow truth.",
      legend: {
        internal: "Internal role",
        external: "External interface",
        system: "System / queue node",
        validation: "Needs validation",
        signal: "Source signal only",
        scope: "In use-case scope",
        outside: "Outside primary scope",
      },
      nodes: {
        manager: "Sales Manager",
        supervisor: "Sales Supervisor",
        executive: "Sales Executive",
        finance: "Finance Coordinator",
        operations: "Operations Coordinator",
        crm: "CRM Queue / System Node",
        clientSuccess: "Client Success / External Interface",
      },
      boundary:
        "Do not treat hierarchy structure as actual workflow execution. Source-to-role signals remain evidence candidates.",
    },
    workflowMiniMap: {
      title: "Workflow Mini Map",
      label: "Static visual placeholder — real map will later come from WorkflowGraph JSON.",
      steps: [
        "Start",
        "Collect client information",
        "Decision: Finance approval needed?",
        "Finance handoff",
        "Activation readiness",
      ],
      warning: "Unresolved handoff",
    },
    screenPanels: {
      sources: {
        cards: [
          "Source card: SOP / policy / SLA / KPI / role document",
          "Document signal badge: useful for interpretation only",
          "Source role and scope decision remains future backend-driven behavior",
        ],
      },
      hierarchy: {
        whyTitle: "Why this role matters",
        whyText:
          "Sales roles shape participant targeting, but role signals must be validated by participant evidence before workflow conclusions.",
      },
      targeting: {
        cards: [
          "Sales Manager — rollout order 1 — validate approvals and exceptions",
          "Sales Executive — rollout order 2 — validate day-to-day intake reality",
          "Finance Coordinator — external clarification source — validate handoff boundary",
        ],
        questionSeedsTitle: "Question seeds",
        questionSeeds: [
          "Where does onboarding wait for finance input?",
          "Which CRM queue status is trusted by the team?",
          "Who resolves missing client information?",
        ],
      },
      evidence: {
        lifecycleTitle: "Evidence lifecycle",
        lifecycle: [
          "Session captured",
          "Transcript reviewed",
          "Extraction prepared",
          "Clarifications queued",
        ],
      },
      analysis: {
        tabs: ["Prepare Evidence", "Analyze Workflow", "Gate / Readiness", "Package Preview"],
      },
      prompts: {
        groups: [
          "Source Understanding",
          "Hierarchy Drafting",
          "Evidence Extraction",
          "Clarification Questions",
          "Synthesis",
          "Package Writing",
        ],
        comparisonTitle: "Before / after comparison placeholder",
        before: "Before: technical prompt output with raw labels.",
        after: "After: admin-friendly explanation with preserved governance boundaries.",
      },
      package: {
        blockedTitle: "Package preview blocked",
        blockedText:
          "Initial Package preview remains disabled until evidence blockers and readiness gates are satisfied by backend-controlled logic.",
        artifacts: ["Gap brief", "Draft operational document", "Visual workflow map", "Client-safe preview"],
      },
    },
  },
  pages: {
    sources: {
      eyebrow: "Stage 2",
      title: "Sources & Context",
      purpose: "Source and context workbench placeholder.",
      boundary:
        "Sources help interpretation but do not become workflow truth by default.",
      capabilities: [
        "Registered sources",
        "Source processing status",
        "Source role and scope review",
        "Document signal vs workflow truth",
      ],
    },
    hierarchy: {
      eyebrow: "Stage 3",
      title: "Hierarchy",
      purpose: "Hierarchy reasoning and structural grounding placeholder.",
      boundary: "Hierarchy approval confirms structure, not workflow truth.",
      capabilities: [
        "Approved hierarchy snapshot",
        "Source-to-role signals",
        "External interface markers",
        "Readiness toward targeting",
      ],
    },
    targeting: {
      eyebrow: "Stage 4",
      title: "Targeting",
      purpose: "Participant targeting and rollout planning placeholder.",
      boundary:
        "Participant targeting is planning, not workflow truth. Question hints are not fixed questions and are not sent automatically.",
      capabilities: [
        "Suggested participants",
        "Contact readiness",
        "Rollout order",
        "Question seeds for later",
      ],
    },
    evidence: {
      eyebrow: "Stage 5",
      title: "Evidence",
      purpose: "Participant evidence and transcript review placeholder.",
      boundary: "Accepted evidence is not final workflow truth.",
      capabilities: [
        "Participant sessions",
        "Transcript trust review",
        "Evidence extraction status",
        "Clarifications, disputes, and boundaries",
      ],
    },
    analysis: {
      eyebrow: "Stage 6",
      title: "Analysis",
      purpose: "Pass 6 preparation, analysis, readiness, and package gate placeholder.",
      boundary:
        "Methods explain analysis; they do not invent evidence. Scores cannot approve the package by themselves.",
      capabilities: [
        "Prepare evidence folders",
        "Method and lens analysis",
        "Readiness dimensions",
        "Pre-6C gate status",
      ],
    },
    prompts: {
      eyebrow: "Prompt Studio",
      title: "Prompt Studio",
      purpose: "Friendly Prompt Studio placeholder.",
      boundary:
        "Prompts can affect wording, extraction behavior, clarification style, drafting style, explanation style, and Copilot answer style. Prompts must not own state transitions, approval gates, package eligibility, release decisions, locked governance, or evidence trust.",
      capabilities: [
        "Active prompt profiles",
        "Draft vs active comparison",
        "Prompt test results",
        "Advanced PromptOps links",
      ],
    },
    package: {
      eyebrow: "Package",
      title: "Package",
      purpose: "Package readiness and preview placeholder.",
      boundary:
        "Initial Package is not Final Package. Current workflow reality and target-state workflow must remain separate.",
      capabilities: [
        "Initial Package readiness",
        "Gap brief",
        "Workflow visual preview",
        "Client-safe package preview",
      ],
    },
    advanced: {
      eyebrow: "Advanced",
      title: "Advanced Details",
      purpose: "Safe escape hatch to raw admin surfaces.",
      boundary:
        "Advanced surfaces are for inspection, troubleshooting, and existing admin workflows. They are not the guided workspace path and must not be treated as a second source of workflow truth.",
      capabilities: [
        "Raw admin routes",
        "Provider and prompt logs",
        "Package and admin records",
        "Debug and proof surfaces",
      ],
    },
  },
} as const;
