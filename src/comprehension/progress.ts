import { getBookProgress, getLevelLine } from "../db";
import type { ProgressView } from "../types";
import { getReaderWordBank } from "./complete-chapter";

/** Assembles the progress view (#15): the Level Line, Words Learned, and the active Word Bank. */
export async function getProgressView(readerId: string, bookId: string): Promise<ProgressView | null> {
  const progress = await getBookProgress(readerId, bookId);
  if (!progress) return null;

  const [levelLine, bank] = await Promise.all([getLevelLine(readerId, bookId), getReaderWordBank(readerId)]);
  const lastCompletedChapter = levelLine.at(-1)?.chapterNumber ?? null;
  const graduated = bank.filter((word) => word.graduated);

  return {
    bookId,
    levelLine,
    wordsLearned: {
      total: graduated.length,
      thisChapter: graduated.filter((word) => word.graduatedInChapter === lastCompletedChapter).map((word) => word.word),
    },
    wordBank: bank.filter((word) => !word.graduated),
    // No Streak persistence yet (#18 is R6's); not in #15's acceptance criteria.
    streak: { current: 0, longest: 0, lastDay: null },
  };
}
