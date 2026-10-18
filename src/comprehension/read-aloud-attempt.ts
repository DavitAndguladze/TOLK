import type { ReadAloudSummary } from "../types";

/**
 * The read-aloud summary this Chapter Check submission may be graded with: the candidate whose
 * `startedAt` the answers name (ChapterCheckAnswers.readAloudStartedAt), or null. A silent reread or
 * a failed save names nothing that matches, so an older reading is never credited (comms 0024).
 * Candidates are the saved summary and the one this submission was last graded with, so a retried
 * submission gets the same grade after the first one spent the saved summary.
 */
export function readAloudForAttempt(readAloudStartedAt: unknown, candidates: (ReadAloudSummary | null)[]): ReadAloudSummary | null {
  // Compared as instants: the read-aloud route stores toISOString(), the client may send "…00Z".
  const named = typeof readAloudStartedAt === "string" ? Date.parse(readAloudStartedAt) : NaN;
  if (Number.isNaN(named)) return null;
  return candidates.find((summary) => summary && Date.parse(summary.startedAt) === named) ?? null;
}
