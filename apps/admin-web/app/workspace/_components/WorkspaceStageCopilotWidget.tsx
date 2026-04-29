"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "../workspace.module.css";
import type { WorkspaceDictionary } from "../_i18n";
import {
  StageCopilotChatPanel,
  type StageCopilotWidgetStageKey,
} from "./StageCopilotChatPanel";

interface WidgetStageConfig {
  stageKey: StageCopilotWidgetStageKey;
  label: string;
  endpoint: string;
  placeholder: string;
}

function stageFromPath(pathname: string | null): StageCopilotWidgetStageKey {
  if (!pathname) return "prompt_studio";
  if (pathname === "/workspace/sources" || pathname.startsWith("/workspace/sources/")) {
    return "sources_context";
  }
  if (
    pathname === "/workspace/prompts"
    || pathname.startsWith("/workspace/prompts/")
    || pathname === "/workspace/copilot-instructions"
    || pathname.startsWith("/workspace/copilot-instructions/")
    || pathname === "/workspace/prompt-studio-copilot"
    || pathname.startsWith("/workspace/prompt-studio-copilot/")
  ) {
    return "prompt_studio";
  }
  return "prompt_studio";
}

export function WorkspaceStageCopilotWidget({
  dictionary,
}: {
  dictionary: WorkspaceDictionary;
}) {
  const pathname = usePathname();
  const detectedStage = stageFromPath(pathname);
  const copy = dictionary.stageCopilotWidget;
  const stages = useMemo<WidgetStageConfig[]>(() => [
    {
      stageKey: "prompt_studio",
      label: copy.stages.prompt_studio,
      endpoint: "/api/stage-copilot/prompt-studio/chat",
      placeholder: copy.promptStudioPlaceholder,
    },
    {
      stageKey: "sources_context",
      label: copy.stages.sources_context,
      endpoint: "/api/stage-copilot/sources-context/chat",
      placeholder: copy.sourcesContextPlaceholder,
    },
  ], [copy]);
  const fallbackStage = stages[0] as WidgetStageConfig;
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStageKey, setSelectedStageKey] = useState<StageCopilotWidgetStageKey>(detectedStage);

  const activeStage = stages.find((stage) => stage.stageKey === selectedStageKey) ?? fallbackStage;
  const detectedStageLabel = stages.find((stage) => stage.stageKey === detectedStage)?.label ?? fallbackStage.label;

  return (
    <div className={styles.stageCopilotWidget} data-stage-copilot-widget>
      <button
        type="button"
        className={styles.stageCopilotWidgetTrigger}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="workspace-stage-copilot-panel"
      >
        <span>{copy.title}</span>
        <strong>{activeStage.label}</strong>
      </button>

      {isOpen ? (
        <div
          id="workspace-stage-copilot-panel"
          className={styles.stageCopilotWidgetPanel}
          role="dialog"
          aria-label={copy.title}
        >
          <div className={styles.stageCopilotWidgetTopbar}>
            <div>
              <span>{copy.title}</span>
              <strong>{activeStage.label}</strong>
            </div>
            <button
              type="button"
              className={styles.stageCopilotWidgetClose}
              onClick={() => setIsOpen(false)}
              aria-label={copy.close}
            >
              ×
            </button>
          </div>

          <div className={styles.stageCopilotStageControls}>
            <label>
              {copy.activeStage}
              <select
                value={selectedStageKey}
                onChange={(event) => setSelectedStageKey(event.target.value as StageCopilotWidgetStageKey)}
              >
                {stages.map((stage) => (
                  <option key={stage.stageKey} value={stage.stageKey}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <p>
              {copy.detectedStage}: <strong>{detectedStageLabel}</strong>
            </p>
          </div>

          <StageCopilotChatPanel
            key={activeStage.stageKey}
            stageKey={activeStage.stageKey}
            stageLabel={activeStage.label}
            endpoint={activeStage.endpoint}
            boundaryCopy={copy.boundaryCopy}
            placeholder={activeStage.placeholder}
            copy={copy.chat}
          />
        </div>
      ) : null}
    </div>
  );
}
