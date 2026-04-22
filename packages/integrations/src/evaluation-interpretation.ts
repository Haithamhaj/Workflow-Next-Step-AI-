/**
 * LLM-generated interpretation for false evaluation conditions.
 * §20.21–§20.22: AI-interpreted, admin-routed, rule-guarded.
 * §20.19–§20.20: workflow validity ≠ automation-supportiveness.
 *
 * If ANTHROPIC_API_KEY is missing or the API call fails, returns {} so that
 * an empty snapshot is stored and the evaluation can still proceed.
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  EvaluationConditions,
  EvaluationOutcome,
  ConditionInterpretations,
  ConditionInterpretation,
} from "@workflow/contracts";

const CONDITION_KEYS: (keyof EvaluationConditions)[] = [
  "sequenceContinuity",
  "aToBToCClarity",
  "coreStepConditions",
  "decisionRuleOrThreshold",
  "handoffResponsibility",
  "controlOrApproval",
  "boundary",
];

const SYSTEM_PROMPT = `You are a workflow analysis assistant applying §20 governance.

§20.19–§20.20 define two formally separate maturity levels:
- Workflow validity: sufficient reconstruction for documentation output
- Automation-supportiveness: structural clarity for later automation execution

A condition that is "not yet fully satisfied" is NOT the same as "materially broken":
(a) Not yet fully satisfied — a non-blocking weakness, compatible with ready_for_initial_package and finalizable_with_review
(b) Materially broken — breaks essential workflow completion, forces needs_more_clarification

For each false condition you must determine:
- workflowEffect: "blocking" only if the failure makes the workflow undocumentable; "non_blocking" for weaknesses; "none" if not relevant to workflow validity
- automationEffect: "blocking_for_automation" if automation is impossible, "limiting" if degraded, "none" if unaffected
- whyItMatters: specific impact on this workflow
- recommendedActions: 2–3 concrete actions for the admin

Key principle: non-automatable does not mean workflow-incomplete. Automation difficulties surface as recommendations, not workflow failures.`;

export async function generateEvaluationInterpretation(
  conditions: EvaluationConditions,
  outcome: EvaluationOutcome,
  synthesisContext?: string,
): Promise<ConditionInterpretations> {
  const falseKeys = CONDITION_KEYS.filter((k) => conditions[k] === false);

  if (falseKeys.length === 0) {
    return {};
  }

  const perConditionSchema: Record<string, object> = {};
  for (const key of falseKeys) {
    perConditionSchema[key] = {
      type: "object",
      required: [
        "workflowEffect",
        "automationEffect",
        "whyItMatters",
        "recommendedActions",
      ],
      properties: {
        workflowEffect: {
          type: "string",
          enum: ["none", "non_blocking", "blocking"],
        },
        automationEffect: {
          type: "string",
          enum: ["none", "limiting", "blocking_for_automation"],
        },
        whyItMatters: { type: "string" },
        recommendedActions: { type: "array", items: { type: "string" } },
      },
    };
  }

  const userMessage = [
    `Admin-supplied outcome: ${outcome}`,
    synthesisContext ? `Synthesis context: ${synthesisContext}` : null,
    `False conditions requiring interpretation: ${falseKeys.join(", ")}`,
    `All conditions:\n${JSON.stringify(conditions, null, 2)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      tools: [
        {
          name: "record_condition_interpretations",
          description:
            "Record §20.21 interpretations for each false condition. Include only entries for false conditions.",
          input_schema: {
            type: "object" as const,
            required: falseKeys,
            properties: perConditionSchema,
          },
        },
      ],
      tool_choice: { type: "auto" as const },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return {};
    }

    const raw = toolUse.input as Record<string, unknown>;
    const result: ConditionInterpretations = {};
    for (const key of falseKeys) {
      const entry = raw[key];
      if (entry && typeof entry === "object") {
        result[key] = entry as ConditionInterpretation;
      }
    }
    return result;
  } catch {
    return {};
  }
}
