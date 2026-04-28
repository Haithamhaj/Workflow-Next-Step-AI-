import { NextResponse } from "next/server";
import {
  createEditableStageCopilotSystemPromptFromDefault,
  createNextStageCopilotSystemPromptVersion,
  getDefaultStageCopilotSystemPrompt,
  listDefaultStageCopilotSystemPrompts,
  resetStageCopilotSystemPromptToDefault,
  validateEditableStageCopilotSystemPromptRecord,
  type EditableStageCopilotSystemPromptRecord,
  type StageCopilotSystemPromptDefault,
  type StageCopilotSystemPromptStageKey,
} from "@workflow/stage-copilot";
import { store } from "../../../../lib/store";

type StageCopilotInstructionsAction = "save-custom" | "reset-to-default";

interface StageCopilotInstructionsRequestBody {
  action?: StageCopilotInstructionsAction;
  stageKey?: string;
  systemPrompt?: string;
  changeNote?: string;
  updatedBy?: string;
}

function jsonError(
  error: string,
  message: string,
  status: number,
  field?: string,
  violations: string[] = [],
) {
  return NextResponse.json({
    ok: false,
    error,
    message,
    field,
    violations,
  }, { status });
}

function textValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function boolValue(value: string | null): boolean {
  return value === "true" || value === "1";
}

function getSupportedDefault(stageKey: string): StageCopilotSystemPromptDefault | null {
  return getDefaultStageCopilotSystemPrompt(stageKey);
}

function findCurrentForDefault(
  defaultPrompt: StageCopilotSystemPromptDefault,
): EditableStageCopilotSystemPromptRecord | null {
  const current = store.stageCopilotSystemPrompts.findCurrentByStage(defaultPrompt.stageKey);
  return current ? { ...current, stageKey: defaultPrompt.stageKey as StageCopilotSystemPromptStageKey } : null;
}

function currentOrDefaultRecord(
  defaultPrompt: StageCopilotSystemPromptDefault,
  now: string,
  actorId: string,
): EditableStageCopilotSystemPromptRecord {
  const current = findCurrentForDefault(defaultPrompt);
  return current ?? createEditableStageCopilotSystemPromptFromDefault({
    defaultPrompt,
    now,
    actorId,
    changeNote: "Initialized from static default fallback for Stage Copilot Instructions.",
  });
}

function effectivePrompt(
  defaultPrompt: StageCopilotSystemPromptDefault,
  current: EditableStageCopilotSystemPromptRecord | null,
) {
  return current
    ? {
        source: current.source,
        version: current.version,
        systemPrompt: current.systemPrompt,
      }
    : {
        source: "static_default" as const,
        version: 1,
        systemPrompt: defaultPrompt.systemPrompt,
      };
}

function responseForStage(stageKey: string, includeHistory: boolean) {
  const defaultPrompt = getSupportedDefault(stageKey);
  if (!defaultPrompt) {
    return jsonError(
      "invalid_stage_key",
      "Unsupported Stage Copilot stageKey.",
      400,
      "stageKey",
    );
  }

  const current = findCurrentForDefault(defaultPrompt);
  return NextResponse.json({
    ok: true,
    stageKey: defaultPrompt.stageKey,
    default: defaultPrompt,
    current,
    effective: effectivePrompt(defaultPrompt, current),
    ...(includeHistory
      ? { history: store.stageCopilotSystemPrompts.listHistoryByStage(defaultPrompt.stageKey) }
      : {}),
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stageKey = textValue(url.searchParams.get("stageKey"));
  const includeHistory = boolValue(url.searchParams.get("includeHistory"));

  if (stageKey) {
    return responseForStage(stageKey, includeHistory);
  }

  const stages = listDefaultStageCopilotSystemPrompts().map((defaultPrompt) => {
    const current = findCurrentForDefault(defaultPrompt);
    return {
      stageKey: defaultPrompt.stageKey,
      defaultRefId: defaultPrompt.refId,
      defaultPromptKey: defaultPrompt.promptKey,
      displayName: defaultPrompt.displayName,
      hasCurrent: Boolean(current),
      currentVersion: current?.version ?? null,
      currentSource: current?.source ?? null,
    };
  });

  return NextResponse.json({ ok: true, stages });
}

export async function POST(request: Request) {
  let body: StageCopilotInstructionsRequestBody;
  try {
    body = await request.json() as StageCopilotInstructionsRequestBody;
  } catch {
    return jsonError(
      "invalid_json",
      "Request body must be valid JSON.",
      400,
    );
  }

  const action = body.action;
  if (action !== "save-custom" && action !== "reset-to-default") {
    return jsonError(
      "unsupported_action",
      "Unsupported Stage Copilot Instructions action.",
      400,
      "action",
    );
  }

  const stageKey = textValue(body.stageKey);
  if (!stageKey) {
    return jsonError(
      "invalid_stage_key",
      "Unsupported Stage Copilot stageKey.",
      400,
      "stageKey",
    );
  }

  const defaultPrompt = getSupportedDefault(stageKey);
  if (!defaultPrompt) {
    return jsonError(
      "invalid_stage_key",
      "Unsupported Stage Copilot stageKey.",
      400,
      "stageKey",
    );
  }

  const now = new Date().toISOString();
  const updatedBy = textValue(body.updatedBy) ?? "admin_operator";
  const current = currentOrDefaultRecord(defaultPrompt, now, updatedBy);

  try {
    if (action === "save-custom") {
      const systemPrompt = textValue(body.systemPrompt);
      if (!systemPrompt) {
        return jsonError(
          "missing_system_prompt",
          "systemPrompt is required for save-custom.",
          400,
          "systemPrompt",
        );
      }

      const transition = createNextStageCopilotSystemPromptVersion({
        current,
        systemPrompt,
        now,
        actorId: updatedBy,
        changeNote: textValue(body.changeNote) ?? "Stage Copilot Instructions custom save.",
      });
      const validation = validateEditableStageCopilotSystemPromptRecord(transition.current);
      if (!validation.ok) {
        return jsonError(
          "invalid_copilot_instructions",
          "Stage Copilot Instructions failed safety validation.",
          400,
          "systemPrompt",
          validation.violations,
        );
      }
      store.stageCopilotSystemPrompts.save(transition.current);
      return NextResponse.json({
        ok: true,
        stageKey: defaultPrompt.stageKey,
        current: transition.current,
        supersededPrevious: transition.supersededPrevious ?? null,
      });
    }

    const transition = resetStageCopilotSystemPromptToDefault({
      current,
      now,
      actorId: updatedBy,
      changeNote: textValue(body.changeNote) ?? "Stage Copilot Instructions reset to static default.",
    });
    store.stageCopilotSystemPrompts.save(transition.current);
    return NextResponse.json({
      ok: true,
      stageKey: defaultPrompt.stageKey,
      current: transition.current,
      supersededPrevious: transition.supersededPrevious ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonError(
      "repository_validation_failed",
      message,
      400,
      action === "save-custom" ? "systemPrompt" : "stageKey",
    );
  }
}
