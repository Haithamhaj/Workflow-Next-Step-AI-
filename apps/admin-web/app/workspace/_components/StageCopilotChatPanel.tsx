"use client";

import { FormEvent, useMemo, useState } from "react";
import styles from "../workspace.module.css";

export type StageCopilotWidgetStageKey = "prompt_studio" | "sources_context";
export type StageCopilotWidgetProviderStatus =
  | "provider_success"
  | "provider_not_configured"
  | "provider_failed"
  | "deterministic_fallback";

export interface StageCopilotChatPanelMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StageCopilotChatPanelCopy {
  messageLabel: string;
  send: string;
  sending: string;
  conversation: string;
  emptyConversation: string;
  providerStatus: string;
  model: string;
  context: string;
  fallbackResponse: string;
  fallbackNotice: string;
  errorTitle: string;
  missingMessage: string;
  unknownError: string;
}

interface StageCopilotChatResponse {
  ok: true;
  stageKey: StageCopilotWidgetStageKey;
  answer: string;
  model?: string;
  providerStatus?: StageCopilotWidgetProviderStatus;
  contextSummary?: {
    source?: string;
    readOnly?: boolean;
    stageKey?: string;
  };
}

interface StageCopilotChatError {
  ok: false;
  error?: string;
  message?: string;
  field?: string;
}

function providerStatusClass(status: StageCopilotWidgetProviderStatus | undefined) {
  if (status === "provider_success") return styles.workspaceStatus_ready;
  if (status === "provider_not_configured" || status === "deterministic_fallback") {
    return styles.workspaceStatus_waiting;
  }
  if (status === "provider_failed") return styles.workspaceStatus_blocked;
  return styles.workspaceStatus_placeholder;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T;
  if (!response.ok || (typeof payload === "object" && payload && "ok" in payload && payload.ok === false)) {
    throw payload;
  }
  return payload;
}

export function StageCopilotChatPanel({
  stageKey,
  stageLabel,
  endpoint,
  boundaryCopy,
  placeholder,
  copy,
  initialMessages = [],
  onProviderStatusChange,
}: {
  stageKey: StageCopilotWidgetStageKey;
  stageLabel: string;
  endpoint: string;
  boundaryCopy: string;
  placeholder: string;
  copy: StageCopilotChatPanelCopy;
  initialMessages?: StageCopilotChatPanelMessage[];
  onProviderStatusChange?: (status: StageCopilotWidgetProviderStatus) => void;
}) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<StageCopilotChatPanelMessage[]>(initialMessages);
  const [lastResponse, setLastResponse] = useState<StageCopilotChatResponse | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fallbackActive = useMemo(
    () => lastResponse?.providerStatus === "provider_not_configured"
      || lastResponse?.providerStatus === "provider_failed"
      || lastResponse?.providerStatus === "deterministic_fallback",
    [lastResponse],
  );

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError(copy.missingMessage);
      return;
    }

    setIsSending(true);
    setError(null);
    const priorHistory = history;
    const nextHistory: StageCopilotChatPanelMessage[] = [...priorHistory, { role: "user", content: trimmed }];

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: priorHistory,
        }),
      });
      const payload = await readJson<StageCopilotChatResponse | StageCopilotChatError>(response);
      if (payload.ok) {
        setLastResponse(payload);
        if (payload.providerStatus) onProviderStatusChange?.(payload.providerStatus);
        setHistory([...nextHistory, { role: "assistant", content: payload.answer }]);
        setMessage("");
      }
    } catch (unknownError) {
      const routeError = unknownError as StageCopilotChatError;
      setError(routeError.message ?? copy.unknownError);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className={styles.stageCopilotPanel} aria-label={stageLabel}>
      <p className={styles.stageCopilotBoundaryNote}>{boundaryCopy}</p>

      {error ? (
        <div className={styles.stageCopilotError} role="alert">
          <strong>{copy.errorTitle}</strong>
          <span>{error}</span>
        </div>
      ) : null}

      {fallbackActive ? (
        <div className={styles.stageCopilotFallback} role="status">
          {copy.fallbackNotice}
        </div>
      ) : null}

      <div className={styles.stageCopilotTranscript} aria-live="polite">
        {history.length > 0 ? history.map((item, index) => (
          <article
            key={`${stageKey}-${item.role}-${index}`}
            className={item.role === "assistant" ? styles.workspaceAssistantMessage : styles.workspaceUserMessage}
          >
            <strong>{item.role === "assistant" ? stageLabel : copy.messageLabel}</strong>
            <p>{item.content}</p>
          </article>
        )) : (
          <p className={styles.workspacePanelDescription}>{copy.emptyConversation}</p>
        )}
      </div>

      <dl className={styles.stageCopilotDetails}>
        <div>
          <dt>{copy.providerStatus}</dt>
          <dd>
            <span className={`${styles.workspaceStatusPill} ${providerStatusClass(lastResponse?.providerStatus)}`}>
              {lastResponse?.providerStatus ?? "-"}
            </span>
          </dd>
        </div>
        <div>
          <dt>{copy.model}</dt>
          <dd>{lastResponse?.model ?? "-"}</dd>
        </div>
        <div>
          <dt>{copy.context}</dt>
          <dd>
            {lastResponse?.contextSummary?.source ?? "-"}
            {lastResponse?.contextSummary ? ` / readOnly=${String(lastResponse.contextSummary.readOnly)}` : ""}
          </dd>
        </div>
      </dl>

      <form className={styles.stageCopilotForm} onSubmit={sendMessage}>
        <label className={styles.stageCopilotInputLabel}>
          {copy.messageLabel}
          <textarea
            className={styles.stageCopilotTextarea}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={placeholder}
            disabled={isSending}
            dir="auto"
          />
        </label>
        <div className={styles.stageCopilotFormFooter}>
          <button type="submit" disabled={isSending || !message.trim()}>
            {isSending ? copy.sending : copy.send}
          </button>
        </div>
      </form>
    </section>
  );
}
