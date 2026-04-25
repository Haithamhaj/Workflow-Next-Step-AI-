import type {
  BoundarySignal,
  ChannelStatus,
  ClarificationCandidate,
  ExtractionStatus,
  FirstNarrativeStatus,
  FirstPassExtractionOutput,
  ParticipantSession,
  ParticipantSessionState,
  ParticipationMode,
  RawEvidenceItem,
  TrustStatus,
} from "@workflow/contracts";
import type { InMemoryStore, StoredSessionAccessToken, StoredTelegramIdentityBinding } from "@workflow/persistence";

export interface Pass5SessionDashboardRow {
  session: ParticipantSession;
  rawEvidenceCount: number;
  openClarificationCount: number;
  boundarySignalCount: number;
  unresolvedItemCount: number;
  extractionDefectCount: number;
  evidenceDisputeCount: number;
  unmappedContentCount: number;
  latestExtraction: FirstPassExtractionOutput | null;
  nextActionLabel: string;
}

export interface Pass5DashboardFilters {
  caseId?: string;
  targetingPlanId?: string;
  participant?: string;
  channel?: ChannelStatus;
  participationMode?: ParticipationMode;
  sessionState?: ParticipantSessionState;
  firstNarrativeStatus?: FirstNarrativeStatus;
  trustStatus?: TrustStatus;
  extractionStatus?: ExtractionStatus;
  clarificationStatus?: ClarificationCandidate["status"];
  boundaryEscalation?: "requires_escalation" | "stop_asking" | "none";
  language?: string;
}

export interface Pass5DashboardSummary {
  totalSessions: number;
  activeOpenSessions: number;
  awaitingFirstNarrative: number;
  rawEvidencePendingTrustReview: number;
  firstPassExtractionReady: number;
  sessionsWithOpenClarifications: number;
  sessionsWithBoundarySignals: number;
  sessionsWithEscalationSignals: number;
  sessionsWithExtractionDefects: number;
  sessionsWithEvidenceDisputes: number;
  sessionsWithUnmappedContent: number;
  readyOrNearReadyForLaterSynthesisHandoff: number;
}

export interface Pass5SessionDashboardData {
  summary: Pass5DashboardSummary;
  rows: Pass5SessionDashboardRow[];
}

export interface Pass5SessionDetailData extends Pass5SessionDashboardRow {
  accessTokens: StoredSessionAccessToken[];
  telegramBindings: StoredTelegramIdentityBinding[];
  rawEvidenceItems: RawEvidenceItem[];
  extractionOutputs: FirstPassExtractionOutput[];
  clarificationCandidates: ClarificationCandidate[];
  boundarySignals: BoundarySignal[];
  supportedActions: string[];
}

const closedStates: ParticipantSessionState[] = [
  "session_closed_no_response",
  "session_paused_by_admin",
];

function latestByCreatedAt<T extends { createdAt: string }>(items: T[]): T | null {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export function derivePass5NextAction(row: Omit<Pass5SessionDashboardRow, "nextActionLabel">): string {
  const session = row.session;
  if (session.sessionState === "blocked_contact_gap" || session.channelStatus === "contact_data_missing") return "Complete contact details";
  if (session.firstNarrativeStatus === "not_received") return "Wait for participant response";
  if (session.firstNarrativeStatus === "received_voice_pending_transcript") return "Review transcript";
  if (session.firstNarrativeStatus === "transcript_pending_review") return "Approve or edit transcript";
  if (session.extractionStatus === "eligible") return "Run first-pass extraction";
  if (row.extractionDefectCount > 0) return "Review extraction defects";
  if (row.evidenceDisputeCount > 0) return "Review evidence disputes";
  if (row.unmappedContentCount > 0) return "Review unmapped content";
  if (row.openClarificationCount > 0) return "Ask next clarification question";
  if (row.boundarySignalCount > 0) return "Review boundary signal";
  if (session.sessionState === "ready_for_later_synthesis_handoff") return "Mark ready for later synthesis handoff";
  if (session.sessionState === "session_prepared" && session.channelStatus === "channel_selected_pending_dispatch") return "Copy/send session link";
  return "No immediate action";
}

function rowForSession(session: ParticipantSession, store: InMemoryStore): Pass5SessionDashboardRow {
  const rawEvidenceItems = store.rawEvidenceItems.findBySessionId(session.sessionId);
  const clarificationCandidates = store.clarificationCandidates.findBySessionId(session.sessionId);
  const boundarySignals = store.boundarySignals.findBySessionId(session.sessionId);
  const extractionOutputs = store.firstPassExtractionOutputs.findBySessionId(session.sessionId);
  const latestExtraction = latestByCreatedAt(extractionOutputs);
  const rowWithoutAction = {
    session,
    rawEvidenceCount: rawEvidenceItems.length,
    openClarificationCount: clarificationCandidates.filter((c) => c.status === "open" || c.status === "asked" || c.status === "partially_resolved").length,
    boundarySignalCount: boundarySignals.length,
    unresolvedItemCount: session.unresolvedItems.length,
    extractionDefectCount: extractionOutputs.reduce((sum, output) => sum + output.extractionDefects.length, 0),
    evidenceDisputeCount: extractionOutputs.reduce((sum, output) => sum + output.evidenceDisputes.length, 0),
    unmappedContentCount: extractionOutputs.reduce((sum, output) => sum + output.unmappedContentItems.length, 0),
    latestExtraction,
  };
  return {
    ...rowWithoutAction,
    nextActionLabel: derivePass5NextAction(rowWithoutAction),
  };
}

function matchesFilters(row: Pass5SessionDashboardRow, store: InMemoryStore, filters: Pass5DashboardFilters): boolean {
  const session = row.session;
  if (filters.caseId && session.caseId !== filters.caseId) return false;
  if (filters.targetingPlanId && session.targetingPlanId !== filters.targetingPlanId) return false;
  if (filters.participant) {
    const needle = filters.participant.toLowerCase();
    const haystack = `${session.participantLabel} ${session.participantRoleOrNodeId}`.toLowerCase();
    if (!haystack.includes(needle)) return false;
  }
  if (filters.channel && session.channelStatus !== filters.channel) return false;
  if (filters.participationMode && session.selectedParticipationMode !== filters.participationMode) return false;
  if (filters.sessionState && session.sessionState !== filters.sessionState) return false;
  if (filters.firstNarrativeStatus && session.firstNarrativeStatus !== filters.firstNarrativeStatus) return false;
  if (filters.extractionStatus && session.extractionStatus !== filters.extractionStatus) return false;
  if (filters.language && session.languagePreference !== filters.language) return false;
  if (filters.trustStatus && !store.rawEvidenceItems.findBySessionId(session.sessionId).some((item) => item.trustStatus === filters.trustStatus)) return false;
  if (filters.clarificationStatus && !store.clarificationCandidates.findBySessionId(session.sessionId).some((candidate) => candidate.status === filters.clarificationStatus)) return false;
  if (filters.boundaryEscalation) {
    const signals = store.boundarySignals.findBySessionId(session.sessionId);
    if (filters.boundaryEscalation === "requires_escalation" && !signals.some((signal) => signal.requiresEscalation)) return false;
    if (filters.boundaryEscalation === "stop_asking" && !signals.some((signal) => signal.shouldStopAskingParticipant)) return false;
    if (filters.boundaryEscalation === "none" && signals.some((signal) => signal.requiresEscalation || signal.shouldStopAskingParticipant)) return false;
  }
  return true;
}

export function composePass5Dashboard(store: InMemoryStore, filters: Pass5DashboardFilters = {}): Pass5SessionDashboardData {
  const allRows = store.participantSessions.findAll().map((session) => rowForSession(session, store));
  const rows = allRows.filter((row) => matchesFilters(row, store, filters));
  const summary: Pass5DashboardSummary = {
    totalSessions: allRows.length,
    activeOpenSessions: allRows.filter((row) => !closedStates.includes(row.session.sessionState)).length,
    awaitingFirstNarrative: allRows.filter((row) => row.session.sessionState === "awaiting_first_narrative" || row.session.firstNarrativeStatus === "not_received").length,
    rawEvidencePendingTrustReview: store.rawEvidenceItems.findAll().filter((item) => item.trustStatus === "raw_unreviewed").length,
    firstPassExtractionReady: allRows.filter((row) => row.session.sessionState === "first_pass_extraction_ready").length,
    sessionsWithOpenClarifications: allRows.filter((row) => row.openClarificationCount > 0).length,
    sessionsWithBoundarySignals: allRows.filter((row) => row.boundarySignalCount > 0).length,
    sessionsWithEscalationSignals: allRows.filter((row) => store.boundarySignals.findBySessionId(row.session.sessionId).some((signal) => signal.requiresEscalation)).length,
    sessionsWithExtractionDefects: allRows.filter((row) => row.extractionDefectCount > 0).length,
    sessionsWithEvidenceDisputes: allRows.filter((row) => row.evidenceDisputeCount > 0).length,
    sessionsWithUnmappedContent: allRows.filter((row) => row.unmappedContentCount > 0).length,
    readyOrNearReadyForLaterSynthesisHandoff: allRows.filter((row) => row.session.sessionState === "ready_for_later_synthesis_handoff" || row.session.sessionState === "first_pass_extraction_ready").length,
  };
  return { summary, rows };
}

export function composePass5SessionDetail(store: InMemoryStore, sessionId: string): Pass5SessionDetailData | null {
  const session = store.participantSessions.findById(sessionId);
  if (!session) return null;
  const row = rowForSession(session, store);
  return {
    ...row,
    accessTokens: store.sessionAccessTokens.findByParticipantSessionId(sessionId),
    telegramBindings: store.telegramIdentityBindings.findByParticipantSessionId(sessionId),
    rawEvidenceItems: store.rawEvidenceItems.findBySessionId(sessionId),
    extractionOutputs: store.firstPassExtractionOutputs.findBySessionId(sessionId),
    clarificationCandidates: store.clarificationCandidates.findBySessionId(sessionId),
    boundarySignals: store.boundarySignals.findBySessionId(sessionId),
    supportedActions: [
      "listOpenClarificationCandidates",
      "selectNextClarificationCandidate",
      "formulateClarificationQuestion",
      "markClarificationCandidateAsked",
      "recordClarificationAnswer",
      "runClarificationAnswerRecheck",
      "addAdminClarificationCandidate",
      "dismissClarificationCandidate",
      "createBoundarySignalFromAnswer",
    ],
  };
}
