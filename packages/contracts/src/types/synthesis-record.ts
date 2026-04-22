/**
 * Hand-mirrored TypeScript type for SynthesisRecord.
 * Source of truth is src/schemas/synthesis-record.schema.json.
 * Spec refs: §19.1 hybrid synthesis philosophy, §19.3 material-difference-block
 *            minimum fields, §19.11 minimum synthesis output structure.
 */

/**
 * One preserved material difference block per §19.3. The five fields are
 * the spec's literal minimum set — where, what, participants per side,
 * why matters, and the later closure path.
 */
export interface SynthesisDifferenceBlock {
  where: string;
  what: string;
  participantsPerSide: string;
  whyMatters: string;
  laterClosurePath: string;
}

export interface SynthesisRecord {
  synthesisId: string;
  caseId: string;
  sessionId?: string;
  commonPath: string;
  differenceBlocks: SynthesisDifferenceBlock[];
  majorUnresolvedItems: string[];
  closureCandidates: string[];
  escalationCandidates: string[];
  confidenceEvidenceNotes?: string;
}
