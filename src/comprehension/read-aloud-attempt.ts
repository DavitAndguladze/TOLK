import type { ReadAloudSummary } from "../types";

/**
 * The instant a submission's readAloudStartedAt names, or null when it names none (missing, not a
 * string, or not a date). Compared as instants: the read-aloud route stores toISOString(), a
 * client may send "…00Z".
 */
export function namedReadingInstant(readAloudStartedAt: unknown): number | null {
  const instant = typeof readAloudStartedAt === "string" ? Date.parse(readAloudStartedAt) : NaN;
  return Number.isNaN(instant) ? null : instant;
}

/**
 * The saved read-aloud summary, only when it is the reading this Chapter Check submission names
 * (ChapterCheckAnswers.readAloudStartedAt). A silent reread, an abandoned attempt or a failed save
 * names nothing that matches, so an older reading is never credited (comms 0024).
 */
export function readAloudForAttempt(readAloudStartedAt: unknown, saved: ReadAloudSummary | null): ReadAloudSummary | null {
  const named = namedReadingInstant(readAloudStartedAt);
  return named !== null && saved && Date.parse(saved.startedAt) === named ? saved : null;
}
