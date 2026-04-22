/**
 * Hand-mirrored TypeScript type for SessionCreation.
 * Source of truth is src/schemas/session-creation.schema.json.
 * Spec refs: §28.9 (Session States), §28.10 (Session-State Transition Rule),
 *            §17.8 (Required Structure of Each Clarification Question).
 */

import type { SessionState } from "./states.js";

export interface SessionCreation {
  sessionId: string;
  caseId: string;
  participantLabel?: string;
  initialState?: SessionState;
  notes?: string;
}

/**
 * Clarification question structure per §17.8. Every clarification question
 * sent to a participant should include at minimum: the question itself,
 * a short explanation of why it is being asked, and a simple example of
 * a suitable answer.
 */
export interface ClarificationQuestion {
  question: string;
  explanation: string;
  example: string;
}
