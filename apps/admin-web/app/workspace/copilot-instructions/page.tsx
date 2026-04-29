"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWorkspaceDirection,
  workspaceDictionaries,
  type WorkspaceDictionary,
} from "../_i18n";
import { WorkspaceShell } from "../_components/WorkspaceShell";
import { useWorkspaceLanguage } from "../_components/useWorkspaceLanguage";
import styles from "../workspace.module.css";

type StageKey =
  | "sources_context"
  | "hierarchy"
  | "targeting"
  | "participant_evidence"
  | "analysis_package"
  | "prompt_studio"
  | "advanced_debug";

type PromptSource = "static_default" | "admin_custom";
type PromptStatus = "current" | "superseded";

interface InstructionDefault {
  refId: string;
  promptKey: string;
  stageKey: StageKey;
  displayName: string;
  systemPrompt: string;
}

interface InstructionRecord {
  systemPromptId: string;
  stageKey: StageKey;
  promptKey: string;
  status: PromptStatus;
  version: number;
  systemPrompt: string;
  source: PromptSource;
  defaultRefId: string;
  updatedAt: string;
  updatedBy: string;
  changeNote: string;
}

interface StageSummary {
  stageKey: StageKey;
  displayName: string;
  hasCurrent: boolean;
  currentVersion: number | null;
  currentSource: PromptSource | null;
}

interface StageResponse {
  ok: true;
  stageKey: StageKey;
  default: InstructionDefault;
  current: InstructionRecord | null;
  effective: {
    source: PromptSource;
    version: number;
    systemPrompt: string;
  };
  history?: InstructionRecord[];
}

interface ErrorResponse {
  ok: false;
  error: string;
  message: string;
  field?: string;
  violations?: string[];
}

const stageKeys: readonly StageKey[] = [
  "sources_context",
  "hierarchy",
  "targeting",
  "participant_evidence",
  "analysis_package",
  "prompt_studio",
  "advanced_debug",
];

function sourceLabel(source: PromptSource | null | undefined, dictionary: WorkspaceDictionary) {
  if (source === "admin_custom") return dictionary.copilotInstructions.customSource;
  return dictionary.copilotInstructions.defaultSource;
}

function statusLabel(status: PromptStatus, dictionary: WorkspaceDictionary) {
  return status === "current" ? dictionary.copilotInstructions.current : dictionary.copilotInstructions.superseded;
}

function friendlyError(error: ErrorResponse, dictionary: WorkspaceDictionary) {
  const copy = dictionary.copilotInstructions.errors;
  const key = error.error as keyof typeof copy;
  const base = copy[key] ?? copy.unknown;
  return error.violations && error.violations.length > 0
    ? `${base} (${error.violations.join(", ")})`
    : base;
}

export default function WorkspaceCopilotInstructionsPage() {
  const { language, toggleLanguage, isLanguageReady } = useWorkspaceLanguage();
  const dictionary = workspaceDictionaries[language];
  const direction = getWorkspaceDirection(language);
  const copy = dictionary.copilotInstructions;
  const [selectedStage, setSelectedStage] = useState<StageKey>("sources_context");
  const [stages, setStages] = useState<StageSummary[]>([]);
  const [stageState, setStageState] = useState<StageResponse | null>(null);
  const [instructions, setInstructions] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedStageLabel = copy.stages[selectedStage];
  const current = stageState?.current ?? null;
  const history = stageState?.history ?? [];
  const hasCustomCurrent = current?.source === "admin_custom";

  const selectedSummary = useMemo(
    () => stages.find((stage) => stage.stageKey === selectedStage) ?? null,
    [selectedStage, stages],
  );

  if (!isLanguageReady) {
    return <div className={styles.workspaceLanguageBoot} aria-hidden="true" />;
  }

  async function readJson<T>(response: Response): Promise<T> {
    const payload = await response.json() as T;
    if (!response.ok || (typeof payload === "object" && payload && "ok" in payload && payload.ok === false)) {
      throw payload;
    }
    return payload;
  }

  async function loadStages() {
    const response = await fetch("/api/stage-copilot/instructions", { cache: "no-store" });
    const payload = await readJson<{ ok: true; stages: StageSummary[] } | ErrorResponse>(response);
    if (payload.ok) setStages(payload.stages);
  }

  async function loadStage(stageKey: StageKey) {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stage-copilot/instructions?stageKey=${encodeURIComponent(stageKey)}&includeHistory=true`,
        { cache: "no-store" },
      );
      const payload = await readJson<StageResponse | ErrorResponse>(response);
      if (payload.ok) {
        setStageState(payload);
        setInstructions(payload.effective.systemPrompt);
        setChangeNote("");
      }
    } catch (unknownError) {
      setError(friendlyError(unknownError as ErrorResponse, dictionary));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStages().catch((unknownError) => {
      setError(friendlyError(unknownError as ErrorResponse, dictionary));
    });
  }, []);

  useEffect(() => {
    void loadStage(selectedStage);
  }, [selectedStage]);

  async function saveInstructions() {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/stage-copilot/instructions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "save-custom",
          stageKey: selectedStage,
          systemPrompt: instructions,
          ...(changeNote.trim() ? { changeNote: changeNote.trim() } : {}),
        }),
      });
      await readJson<{ ok: true } | ErrorResponse>(response);
      setMessage(copy.unsavedHint);
      await loadStages();
      await loadStage(selectedStage);
    } catch (unknownError) {
      setError(friendlyError(unknownError as ErrorResponse, dictionary));
    } finally {
      setIsSaving(false);
    }
  }

  async function resetToDefault() {
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/stage-copilot/instructions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "reset-to-default",
          stageKey: selectedStage,
          ...(changeNote.trim() ? { changeNote: changeNote.trim() } : {}),
        }),
      });
      await readJson<{ ok: true } | ErrorResponse>(response);
      setMessage(copy.resetHint);
      await loadStages();
      await loadStage(selectedStage);
    } catch (unknownError) {
      setError(friendlyError(unknownError as ErrorResponse, dictionary));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <WorkspaceShell
      dictionary={dictionary}
      direction={direction}
      language={language}
      onToggleLanguage={toggleLanguage}
    >
      <header className={styles.workspaceHeader}>
        <div className={styles.workspaceKicker}>{copy.eyebrow}</div>
        <h2 className={styles.workspaceTitle}>{copy.title}</h2>
        <p className={styles.workspaceLead}>{copy.purpose}</p>
      </header>

      <section className={styles.workspaceBoundary} aria-label={copy.boundaryTitle}>
        <p className={styles.workspaceBoundaryTitle}>{copy.separationWarning}</p>
        <p className={styles.workspaceBoundaryText}>{copy.analysisWarning}</p>
        <p className={styles.workspaceBoundaryText}>{copy.runtimeWarning}</p>
      </section>

      <section className={styles.workspacePanel} aria-label={copy.stageSelector}>
        <div className={styles.workspacePanelHeader}>
          <div>
            <div className={styles.workspaceKicker}>{copy.stageSelector}</div>
            <h3 className={styles.workspacePanelTitle}>{selectedStageLabel}</h3>
            <p className={styles.workspacePanelDescription}>
              {selectedSummary?.hasCurrent ? copy.usingCustom : copy.usingDefault}
            </p>
          </div>
          <span className={styles.workspaceCardBadge}>
            {sourceLabel(selectedSummary?.currentSource, dictionary)}
          </span>
        </div>
        <div className={styles.workspaceStageSelectorGrid}>
          {stageKeys.map((stageKey) => (
            <button
              key={stageKey}
              type="button"
              className={stageKey === selectedStage ? `${styles.workspaceStageButton} ${styles.workspaceStageButtonActive}` : styles.workspaceStageButton}
              onClick={() => setSelectedStage(stageKey)}
            >
              {copy.stages[stageKey]}
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <section className={styles.workspaceErrorPanel} role="alert">
          {error}
        </section>
      ) : null}

      {message ? (
        <section className={styles.workspaceSuccessPanel} role="status">
          {message}
        </section>
      ) : null}

      <section className={styles.workspaceSectionGridTwo}>
        <div className={styles.workspacePanel}>
          <div className={styles.workspacePanelHeader}>
            <div>
              <h3 className={styles.workspacePanelTitle}>{copy.editableInstructions}</h3>
              <p className={styles.workspacePanelDescription}>{copy.unsavedHint}</p>
            </div>
            <span className={styles.workspaceCardBadge}>
              {hasCustomCurrent ? copy.usingCustom : copy.usingDefault}
            </span>
          </div>
          <textarea
            className={styles.workspaceInstructionTextarea}
            dir="auto"
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            aria-label={copy.editableInstructions}
            disabled={isLoading || isSaving}
          />
          <label className={styles.workspaceFieldLabel}>
            {copy.changeNote}
            <input
              className={styles.workspaceTextInput}
              value={changeNote}
              onChange={(event) => setChangeNote(event.target.value)}
              placeholder={copy.changeNotePlaceholder}
              disabled={isSaving}
            />
          </label>
          <div className={styles.workspaceInstructionActions}>
            <button type="button" onClick={saveInstructions} disabled={isLoading || isSaving}>
              {copy.save}
            </button>
            <button type="button" onClick={resetToDefault} disabled={isLoading || isSaving}>
              {copy.reset}
            </button>
          </div>
        </div>

        <div className={styles.workspacePanel}>
          <div className={styles.workspacePanelHeader}>
            <div>
              <h3 className={styles.workspacePanelTitle}>{copy.metadata}</h3>
              <p className={styles.workspacePanelDescription}>{copy.effectiveInstructions}</p>
            </div>
          </div>
          <dl className={styles.workspaceMetadataList}>
            <div>
              <dt>{copy.source}</dt>
              <dd>{sourceLabel(stageState?.effective.source, dictionary)}</dd>
            </div>
            <div>
              <dt>{copy.version}</dt>
              <dd>{stageState?.effective.version ?? "-"}</dd>
            </div>
            <div>
              <dt>{copy.updatedAt}</dt>
              <dd>{current?.updatedAt ?? "-"}</dd>
            </div>
            <div>
              <dt>{copy.updatedBy}</dt>
              <dd>{current?.updatedBy ?? "-"}</dd>
            </div>
          </dl>
          <div className={styles.workspaceDefaultPreview}>
            <h4>{copy.defaultPreview}</h4>
            <pre dir="auto">{stageState?.default.systemPrompt ?? copy.loading}</pre>
          </div>
        </div>
      </section>

      <section className={styles.workspaceSectionGridTwo}>
        <div className={styles.workspacePanel}>
          <div className={styles.workspacePanelHeader}>
            <h3 className={styles.workspacePanelTitle}>{copy.history}</h3>
          </div>
          {history.length > 0 ? (
            <div className={styles.workspaceHistoryList}>
              {history.map((record) => (
                <article key={record.systemPromptId} className={styles.workspaceHistoryItem}>
                  <div>
                    <strong>{copy.version} {record.version}</strong>
                    <span>{statusLabel(record.status, dictionary)}</span>
                  </div>
                  <p>{sourceLabel(record.source, dictionary)} · {record.updatedAt} · {record.updatedBy}</p>
                  <p>{record.changeNote}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.workspacePanelDescription}>{copy.noHistory}</p>
          )}
        </div>

        <div className={styles.workspaceGuardrailPanel}>
          <h3>{copy.boundaryTitle}</h3>
          <p>{copy.separationWarning}</p>
          <ul className={styles.workspaceGuardrailList}>
            {copy.boundaryItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>
    </WorkspaceShell>
  );
}
