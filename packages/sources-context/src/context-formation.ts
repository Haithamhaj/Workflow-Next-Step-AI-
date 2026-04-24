/**
 * Structured context formation — §12.
 * Gathers sources + website summaries for a session, assembles raw text,
 * calls the extraction provider to transform into StructuredContext.
 *
 * Provider is injected (DIP) — this module does not import integrations.
 */

import type {
  StructuredContext,
  ProviderName,
  WebsiteSummary,
  HierarchyNode,
  HierarchyInputMethod,
} from "@workflow/contracts";
import type {
  StoredIntakeSession,
  StoredIntakeSource,
  StoredWebsiteCrawlSession,
  IntakeSessionRepository,
  IntakeSourceRepository,
  WebsiteCrawlRepository,
} from "@workflow/persistence";
import { setStructuredContext } from "./intake-session.js";

// ---------------------------------------------------------------------------
// Provider interface (injected — matches ExtractionProvider.transformToStructuredContext)
// ---------------------------------------------------------------------------

export interface ContextTransformProvider {
  readonly name: ProviderName;
  transformToStructuredContext(input: {
    rawText: string;
    bucket: string;
    domain?: string;
  }): Promise<{
    structuredContext: StructuredContext;
    provider: ProviderName;
    model: string;
  }>;
}

// ---------------------------------------------------------------------------
// Context formation result with traceability
// ---------------------------------------------------------------------------

export interface ContextFormationResult {
  structuredContext: StructuredContext;
  /** Which provider actually ran. */
  provider: ProviderName;
  /** Model identifier (e.g. "gemini-2.0-flash" or "stub-no-api-key"). */
  model: string;
  /** Whether this was a real extraction or a stub passthrough. */
  wasRealExtraction: boolean;
  /** Source IDs that contributed to the raw text input. */
  sourceIds: string[];
  /** Crawl IDs whose site summaries were included. */
  crawlIds: string[];
  /** Timestamp. */
  formedAt: string;
}

// ---------------------------------------------------------------------------
// formStructuredContext — main entry point
// ---------------------------------------------------------------------------

export async function formStructuredContext(
  sessionId: string,
  provider: ContextTransformProvider,
  repos: {
    sessionRepo: IntakeSessionRepository;
    sourceRepo: IntakeSourceRepository;
    crawlRepo: WebsiteCrawlRepository;
  },
): Promise<ContextFormationResult> {
  const session = repos.sessionRepo.findById(sessionId);
  if (!session) throw new Error(`Intake session not found: ${sessionId}`);

  // 1. Gather all sources for this session
  const sources = repos.sourceRepo.findBySessionId(sessionId);

  // 2. Gather website summaries from crawl sessions for this session
  const allCrawls = repos.crawlRepo.findAll();
  const sessionCrawls = allCrawls.filter((c) => c.sessionId === sessionId);
  const completedCrawls = sessionCrawls.filter(
    (c) => c.status === "completed" && c.siteSummary,
  );

  // 3. Assemble raw text from all sources
  const textParts: string[] = [];
  const contributingSourceIds: string[] = [];

  for (const src of sources) {
    const parts: string[] = [];
    parts.push(`--- Source: ${src.displayName ?? src.sourceId} ---`);
    parts.push(`Type: ${src.inputType} | Bucket: ${src.bucket}`);

    if (src.inputType === "website_url" && src.websiteUrl) {
      parts.push(`URL: ${src.websiteUrl}`);
    }

    if (src.extractedText) {
      parts.push(`Extracted text:\n${src.extractedText}`);
    } else if (src.noteText) {
      parts.push(`Note text (${src.noteOrigin ?? "unknown origin"}):\n${src.noteText}`);
    }

    if (src.fileName) {
      parts.push(`File: ${src.fileName} (${src.mimeType ?? "unknown type"})`);
    }

    textParts.push(parts.join("\n"));
    contributingSourceIds.push(src.sourceId);
  }

  // 4. Add website summaries
  const contributingCrawlIds: string[] = [];
  for (const crawl of completedCrawls) {
    if (!crawl.siteSummary) continue;
    const summary: WebsiteSummary = crawl.siteSummary;
    const parts: string[] = [];
    parts.push(`--- Website Summary: ${crawl.baseUrl} ---`);
    parts.push(`Company identity: ${summary.companyIdentity}`);
    parts.push(`Services: ${summary.servicesProvided}`);
    parts.push(`Domain: ${summary.domainSignal}`);
    if (summary.visibleDepartments.length > 0) {
      parts.push(`Departments: ${summary.visibleDepartments.join(", ")}`);
    }
    if (summary.visibleProjectsClientsPartners.length > 0) {
      parts.push(`Projects/Clients/Partners: ${summary.visibleProjectsClientsPartners.join(", ")}`);
    }
    if (summary.importantSignals.length > 0) {
      parts.push(`Important signals: ${summary.importantSignals.join(", ")}`);
    }
    textParts.push(parts.join("\n"));
    contributingCrawlIds.push(crawl.crawlId);
  }

  const rawText = textParts.join("\n\n");
  const now = new Date().toISOString();

  // 5. If no text at all, return empty context with honest assessment
  if (!rawText.trim()) {
    const emptyContext: StructuredContext = {
      companyName: "",
      companyScopeSummary: "",
      domain: "unknown",
      visibleServicesOrProducts: [],
      mainDepartment: "",
      visibleRoleFamiliesOrOrgSignals: [],
      keyContextSignalsAndRisks: [],
      confidenceAndUnknowns: "No source text available for extraction. Add sources first.",
    };

    setStructuredContext(sessionId, emptyContext, repos.sessionRepo);

    return {
      structuredContext: emptyContext,
      provider: provider.name,
      model: "no-input",
      wasRealExtraction: false,
      sourceIds: [],
      crawlIds: [],
      formedAt: now,
    };
  }

  // 6. Call the provider
  const result = await provider.transformToStructuredContext({
    rawText,
    bucket: session.bucket,
    domain: session.structuredContext?.domain,
  });

  const wasRealExtraction = !result.model.startsWith("stub-") && result.model !== "no-input";

  // 7. Store on session
  setStructuredContext(sessionId, result.structuredContext, repos.sessionRepo);

  return {
    structuredContext: result.structuredContext,
    provider: result.provider,
    model: result.model,
    wasRealExtraction,
    sourceIds: contributingSourceIds,
    crawlIds: contributingCrawlIds,
    formedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Hierarchy draft parsing — conservative, no hallucination
// ---------------------------------------------------------------------------

export interface HierarchyDraftResult {
  nodes: HierarchyNode[];
  inputMethod: HierarchyInputMethod;
  /** Number of roles that had only a label (no person/phone/team). */
  minimalEntries: number;
  /** Whether the parser detected tree structure (indents/branches). */
  detectedStructure: boolean;
  /** Warnings about parsing quality. */
  warnings: string[];
}

/**
 * Parse pasted text into a flat HierarchyNode[].
 * Conservative: only extracts role labels that appear in the text.
 * Does NOT infer reports-to chains from indentation unless the text
 * explicitly states reporting relationships.
 */
export function parseHierarchyDraft(
  text: string,
  inputMethod: HierarchyInputMethod,
): HierarchyDraftResult {
  if (!text.trim()) {
    return {
      nodes: [],
      inputMethod,
      minimalEntries: 0,
      detectedStructure: false,
      warnings: ["Empty input — no roles extracted."],
    };
  }

  const lines = text.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
  const nodes: HierarchyNode[] = [];
  const warnings: string[] = [];
  let minimalCount = 0;
  let hasTreeChars = false;

  // Detect tree characters
  if (text.match(/[├└│─┤]/)) {
    hasTreeChars = true;
  }

  // Track parent from indentation for conservative reports-to
  const indentStack: { indent: number; label: string }[] = [];

  for (const rawLine of lines) {
    const indent = rawLine.length - rawLine.trimStart().length;
    // Strip tree characters and bullet markers
    const cleaned = rawLine
      .replace(/^[├└│─┤┬\s]+/, "")
      .replace(/^[•*\-–—>]+\s*/, "")
      .replace(/^\d+[.)]\s*/, "")
      .trim();

    if (!cleaned) continue;

    // Try to split "Role - Person Name" or "Role: Person Name"
    const separators = [" - ", " – ", " — ", ": "];
    let roleLabel = cleaned;
    let personName: string | undefined;
    let otherDetails: string | undefined;

    for (const sep of separators) {
      const idx = cleaned.indexOf(sep);
      if (idx > 0) {
        const left = cleaned.slice(0, idx).trim();
        const right = cleaned.slice(idx + sep.length).trim();
        // If right side looks like a name (2-3 words, no special chars), use it
        if (right.length > 0 && right.length < 60 && !right.includes("\n")) {
          roleLabel = left;
          // Check if right has parenthetical detail like "Name (title)"
          const parenMatch = right.match(/^(.+?)\s*\((.+?)\)$/);
          if (parenMatch) {
            personName = parenMatch[1]!.trim();
            otherDetails = parenMatch[2]!.trim();
          } else {
            personName = right;
          }
        }
        break;
      }
    }

    if (!roleLabel) continue;

    // Conservative reports-to: only from indentation structure
    let reportsTo: string | undefined;
    if (hasTreeChars && indent > 0) {
      // Find nearest parent with less indentation
      while (indentStack.length > 0 && indentStack[indentStack.length - 1]!.indent >= indent) {
        indentStack.pop();
      }
      if (indentStack.length > 0) {
        reportsTo = indentStack[indentStack.length - 1]!.label;
      }
    }

    // Update indent stack
    indentStack.push({ indent, label: roleLabel });

    const node: HierarchyNode = { roleLabel };
    let isMinimal = true;

    if (personName) {
      node.personName = personName;
      isMinimal = false;
    }
    if (reportsTo) {
      node.reportsTo = reportsTo;
      isMinimal = false;
    }
    if (otherDetails) {
      node.otherDetails = otherDetails;
      isMinimal = false;
    }

    if (isMinimal) minimalCount++;
    nodes.push(node);
  }

  if (nodes.length === 0) {
    warnings.push("No recognizable role labels found in input.");
  }
  if (minimalCount === nodes.length && nodes.length > 3) {
    warnings.push("All entries are role-only — consider adding person names or reporting lines for richer hierarchy.");
  }
  if (nodes.length > 0 && !hasTreeChars && !text.includes("reports to")) {
    warnings.push("No tree structure detected — hierarchy is flat. Add indentation or 'reports to' for structure.");
  }

  return {
    nodes,
    inputMethod,
    minimalEntries: minimalCount,
    detectedStructure: hasTreeChars,
    warnings,
  };
}
