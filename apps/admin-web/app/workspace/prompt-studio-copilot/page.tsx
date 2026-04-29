"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  getWorkspaceDirection,
  workspaceDictionaries,
  type WorkspaceDictionary,
  type WorkspaceLanguage,
} from "../_i18n";
import { WorkspaceShell } from "../_components/WorkspaceShell";
import styles from "../workspace.module.css";

type ChatRole = "user" | "assistant";
type ProviderStatus =
  | "provider_success"
  | "provider_not_configured"
  | "provider_failed"
  | "deterministic_fallback";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatResponse {
  ok: true;
  stageKey: "prompt_studio";
  answer: string;
  model: string;
  providerStatus: ProviderStatus;
  contextSummary: {
    source: "prompt_studio_static_context";
    readOnly: true;
    stageKey: "prompt_studio";
    promptSpecRefCount?: number;
    warningCount?: number;
    instructionSource?: "static_default" | "admin_custom";
    instructionVersion?: number;
  };
}

interface ErrorResponse {
  ok: false;
  error: string;
  message: string;
  field?: string;
}

function friendlyError(error: ErrorResponse, dictionary: WorkspaceDictionary) {
  const copy = dictionary.promptStudioCopilot.errors;
  const key = error.error as keyof typeof copy;
  return copy[key] ?? copy.unknown;
}

function providerStatusClass(status: ProviderStatus) {
  if (status === "provider_success") return styles.workspaceStatus_ready;
  if (status === "provider_not_configured" || status === "deterministic_fallback") {
    return styles.workspaceStatus_waiting;
  }
  return styles.workspaceStatus_blocked;
}

export default function PromptStudioCopilotPage() {
  const [language, setLanguage] = useState<WorkspaceLanguage>("en");
  const dictionary = workspaceDictionaries[language];
  const direction = getWorkspaceDirection(language);
  const copy = dictionary.promptStudioCopilot;
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [lastResponse, setLastResponse] = useState<ChatResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackActive = useMemo(
    () => lastResponse?.providerStatus === "provider_not_configured"
      || lastResponse?.providerStatus === "provider_failed"
      || lastResponse?.providerStatus === "deterministic_fallback",
    [lastResponse],
  );

  function toggleLanguage() {
    setLanguage((currentLanguage) => (currentLanguage === "en" ? "ar" : "en"));
  }

  async function readJson<T>(response: Response): Promise<T> {
    const payload = await response.json() as T;
    if (!response.ok || (typeof payload === "object" && payload && "ok" in payload && payload.ok === false)) {
      throw payload;
    }
    return payload;
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError(copy.errors.missing_message);
      return;
    }

    setIsSending(true);
    setError(null);
    const nextHistory: ChatMessage[] = [...history, { role: "user", content: trimmed }];

    try {
      const response = await fetch("/api/stage-copilot/prompt-studio/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });
      const payload = await readJson<ChatResponse | ErrorResponse>(response);
      if (payload.ok) {
        setLastResponse(payload);
        setHistory([...nextHistory, { role: "assistant", content: payload.answer }]);
        setMessage("");
      }
    } catch (unknownError) {
      setError(friendlyError(unknownError as ErrorResponse, dictionary));
    } finally {
      setIsSending(false);
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

      <section className={styles.workspaceBoundary} aria-label={copy.boundaryCopy}>
        <p className={styles.workspaceBoundaryTitle}>{copy.boundaryCopy}</p>
        <p className={styles.workspaceBoundaryText}>{copy.separationCopy}</p>
        <p className={styles.workspaceBoundaryText}>{copy.analysisBoundary}</p>
      </section>

      {error ? (
        <section className={styles.workspaceErrorPanel} role="alert">
          <strong>{copy.errorTitle}</strong>
          <span>{error}</span>
        </section>
      ) : null}

      {fallbackActive ? (
        <section className={styles.workspaceSuccessPanel} role="status">
          {copy.fallbackNotice}
        </section>
      ) : null}

      <section className={styles.workspaceSectionGridTwo}>
        <div className={styles.workspacePanel}>
          <div className={styles.workspacePanelHeader}>
            <div>
              <h3 className={styles.workspacePanelTitle}>{copy.conversation}</h3>
              <p className={styles.workspacePanelDescription}>{copy.separationCopy}</p>
            </div>
          </div>

          <div className={styles.workspaceChatTranscript} aria-live="polite">
            {history.length > 0 ? history.map((item, index) => (
              <article
                key={`${item.role}-${index}`}
                className={item.role === "assistant" ? styles.workspaceAssistantMessage : styles.workspaceUserMessage}
              >
                <strong>{item.role === "assistant" ? copy.title : copy.messageLabel}</strong>
                <p>{item.content}</p>
              </article>
            )) : (
              <p className={styles.workspacePanelDescription}>{copy.emptyConversation}</p>
            )}
          </div>

          <form className={styles.workspaceChatForm} onSubmit={sendMessage}>
            <label className={styles.workspaceFieldLabel}>
              {copy.messageLabel}
              <textarea
                className={styles.workspaceChatTextarea}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={copy.messagePlaceholder}
                disabled={isSending}
                dir="auto"
              />
            </label>
            <button type="submit" disabled={isSending || !message.trim()}>
              {isSending ? copy.sending : copy.send}
            </button>
          </form>
        </div>

        <aside className={styles.workspaceGuardrailPanel} aria-label={copy.responseDetails}>
          <h3>{copy.responseDetails}</h3>
          <dl className={styles.workspaceMetadataList}>
            <div>
              <dt>{copy.providerStatus}</dt>
              <dd>
                <span className={`${styles.workspaceStatusPill} ${lastResponse ? providerStatusClass(lastResponse.providerStatus) : styles.workspaceStatus_placeholder}`}>
                  {lastResponse?.providerStatus ?? "-"}
                </span>
              </dd>
            </div>
            <div>
              <dt>{copy.model}</dt>
              <dd>{lastResponse?.model ?? "-"}</dd>
            </div>
            <div>
              <dt>{copy.contextSource}</dt>
              <dd>{lastResponse?.contextSummary.source ?? "-"}</dd>
            </div>
            <div>
              <dt>{copy.contextReadOnly}</dt>
              <dd>{lastResponse ? String(lastResponse.contextSummary.readOnly) : "-"}</dd>
            </div>
          </dl>
          <ul className={styles.workspaceGuardrailList}>
            <li>{copy.boundaryCopy}</li>
            <li>{copy.separationCopy}</li>
            <li>{copy.analysisBoundary}</li>
          </ul>
        </aside>
      </section>
    </WorkspaceShell>
  );
}
