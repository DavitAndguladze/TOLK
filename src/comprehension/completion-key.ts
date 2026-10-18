import { namedReadingInstant } from "./read-aloud-attempt";

/**
 * Identifies one completion's Chapter Check submission: its answers (in question order) and the
 * reading it names. The same key again is a retry (e.g. after a lost response), which gets the
 * stored result instead of being graded, spending a reading, or touching the Word Bank twice.
 */
export function completionKey(submission: { answers?: unknown; readAloudStartedAt?: unknown }): string {
  const answers = Array.isArray(submission.answers) ? submission.answers : [];
  const byQuestion = answers
    .map((a: { questionId?: unknown; answer?: unknown; via?: unknown }) => [String(a?.questionId), String(a?.answer), String(a?.via)])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify({ answers: byQuestion, reading: namedReadingInstant(submission.readAloudStartedAt) });
}
