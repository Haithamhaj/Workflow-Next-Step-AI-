import type { AdminIntakeDecision, AdminSourceRoleDecisionStatus, AttachmentScope } from "@workflow/contracts";
import type {
  AdminIntakeDecisionRepository,
  AIIntakeSuggestionRepository,
  IntakeSourceRepository,
  StoredAdminIntakeDecision,
} from "@workflow/persistence";

export interface AdminIntakeDecisionRepos {
  intakeSources: IntakeSourceRepository;
  aiIntakeSuggestions: AIIntakeSuggestionRepository;
  adminIntakeDecisions: AdminIntakeDecisionRepository;
}

function id(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function recordAdminSourceRoleDecision(input: {
  sourceId: string;
  decision: AdminSourceRoleDecisionStatus;
  decidedBy: string;
  suggestionId?: string;
  finalSourceRole?: string;
  finalScope?: AttachmentScope;
  reason?: string;
}, repos: AdminIntakeDecisionRepos): StoredAdminIntakeDecision {
  const source = repos.intakeSources.findById(input.sourceId);
  if (!source) throw new Error(`Intake source not found: ${input.sourceId}`);

  const suggestion = input.suggestionId
    ? repos.aiIntakeSuggestions.findById(input.suggestionId)
    : repos.aiIntakeSuggestions.findBySourceId(source.sourceId).at(-1);

  const finalSourceRole = input.finalSourceRole ?? suggestion?.suggestedSourceRole;
  const finalScope = input.finalScope ?? suggestion?.suggestedScope;

  if (input.decision !== "marked_needs_review" && !finalSourceRole) {
    throw new Error("finalSourceRole is required unless marking the suggestion for review.");
  }

  const decidedAt = new Date().toISOString();
  const decision: AdminIntakeDecision = {
    decisionId: id("admindecision"),
    intakeSourceId: source.sourceId,
    sessionId: source.sessionId,
    caseId: source.caseId,
    suggestionId: suggestion?.suggestionId,
    decidedBy: input.decidedBy,
    decidedAt,
    decision: input.decision,
    finalSourceRole,
    finalScope,
    reason: input.reason,
    preservesOriginalSuggestion: Boolean(suggestion),
  };

  repos.adminIntakeDecisions.save(decision);

  repos.intakeSources.save({
    ...source,
    aiSuggestedType: finalSourceRole ?? source.aiSuggestedType,
    aiSuggestedScope: finalScope ?? source.aiSuggestedScope,
    adminOverride: {
      classification: finalSourceRole,
      scope: finalScope,
      overriddenAt: decidedAt,
    },
    status: input.decision === "marked_needs_review" ? "needs_review" : source.status,
    updatedAt: decidedAt,
  });

  return decision;
}
