import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

function read(path) {
  const absolutePath = join(repoRoot, path);
  assert.equal(existsSync(absolutePath), true, `${path} should exist`);
  return readFileSync(absolutePath, "utf8");
}

function includes(source, needle, label = needle) {
  assert.equal(source.includes(needle), true, `${label} should be present`);
}

function excludes(source, needle, label = needle) {
  assert.equal(source.includes(needle), false, `${label} should be absent`);
}

const dashboardHelper = read("apps/admin-web/lib/pass5-dashboard.ts");
const listPage = read("apps/admin-web/app/participant-sessions/page.tsx");
const detailPage = read("apps/admin-web/app/participant-sessions/[sessionId]/page.tsx");
const actionRoute = read("apps/admin-web/app/api/participant-sessions/[sessionId]/actions/route.ts");
const nav = read("apps/admin-web/components/Nav.tsx");

// Dashboard summary counts are composed from existing Pass 5 repositories/fields.
for (const count of [
  "totalSessions",
  "activeOpenSessions",
  "awaitingFirstNarrative",
  "rawEvidencePendingTrustReview",
  "firstPassExtractionReady",
  "sessionsWithOpenClarifications",
  "sessionsWithBoundarySignals",
  "sessionsWithEscalationSignals",
  "sessionsWithExtractionDefects",
  "sessionsWithEvidenceDisputes",
  "sessionsWithUnmappedContent",
  "readyOrNearReadyForLaterSynthesisHandoff",
]) {
  includes(dashboardHelper, count, `summary count ${count}`);
  includes(listPage, count, `rendered summary count ${count}`);
}

// Filters use only existing session/evidence/clarification/boundary fields.
for (const filter of [
  "caseId",
  "targetingPlanId",
  "participant",
  "channel",
  "participationMode",
  "sessionState",
  "firstNarrativeStatus",
  "trustStatus",
  "extractionStatus",
  "clarificationStatus",
  "boundaryEscalation",
  "language",
]) {
  includes(dashboardHelper, `filters.${filter}`, `dashboard filter ${filter}`);
  includes(listPage, `name="${filter}"`, `filter input ${filter}`);
}

// Session table required operational columns.
for (const column of [
  "Session",
  "Participant",
  "Role / node",
  "Case / plan",
  "Mode",
  "Channel",
  "State",
  "Narrative",
  "Evidence",
  "Extraction",
  "Clarifications",
  "Boundary",
  "Unresolved",
  "Updated",
  "Next action",
]) {
  includes(listPage, column, `session table column ${column}`);
}

// Next action labels are dashboard-facing derivations only.
for (const label of [
  "Complete contact details",
  "Copy/send session link",
  "Wait for participant response",
  "Review transcript",
  "Approve or edit transcript",
  "Run first-pass extraction",
  "Review extraction defects",
  "Review evidence disputes",
  "Review unmapped content",
  "Ask next clarification question",
  "Review boundary signal",
  "Mark ready for later synthesis handoff",
  "No immediate action",
]) {
  includes(dashboardHelper, label, `next action label ${label}`);
}

// Detail page exposes required panels and review visibility.
for (const panel of [
  "Session Context",
  "Channel Access",
  "Raw Evidence",
  "Analysis Progress",
  "Clarification Queue",
  "Boundary / Escalation",
  "Unmapped content / defects / disputes",
]) {
  includes(detailPage, panel, `detail panel ${panel}`);
}

for (const visibility of [
  "sourceCoverageSummary",
  "sequenceMap",
  "unmappedContentItems",
  "extractionDefects",
  "evidenceDisputes",
  "participantFacingQuestion",
  "whyItMatters",
  "exampleAnswer",
  "participantStatement",
  "requiresEscalation",
  "shouldStopAskingParticipant",
]) {
  includes(detailPage, visibility, `detail visibility ${visibility}`);
}

// Only existing Block 10 domain actions are exposed through the thin API route.
for (const action of [
  "selectNextClarificationCandidate",
  "formulateClarificationQuestion",
  "markClarificationCandidateAsked",
  "recordClarificationAnswer",
  "runClarificationAnswerRecheck",
  "addAdminClarificationCandidate",
  "dismissClarificationCandidate",
]) {
  includes(actionRoute, action, `thin action route uses ${action}`);
  includes(dashboardHelper, action, `dashboard detail data exposes ${action}`);
}
includes(detailPage, "detail.supportedActions", "detail page renders supported action list");

for (const formAction of [
  'action="select-next"',
  'action="add-admin-exact"',
  'action="mark-asked"',
  'action="formulate"',
  'action="dismiss"',
  'action="record-answer"',
  'action="recheck"',
]) {
  includes(detailPage, formAction, `visible admin form ${formAction}`);
}

includes(nav, "/participant-sessions", "admin navigation link");

// Secrets and future-scope mechanics are not exposed or introduced by Block 11.
excludes(detailPage, "token.tokenHash", "raw token hash rendering");
excludes(detailPage, "TELEGRAM_BOT_TOKEN", "Telegram token exposure");
for (const source of [dashboardHelper, listPage, detailPage, actionRoute]) {
  excludes(source, "adminAssistant", "admin assistant execution");
  excludes(source, "createFinalPackage", "package generation");
  excludes(source, "initialPackage", "initial package generation");
  excludes(source, "whatsapp", "WhatsApp API");
  excludes(source, "runPass6", "Pass 6 execution");
}

console.log("Pass 5 Block 11 admin dashboard proof passed.");
