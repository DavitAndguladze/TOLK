// The Word Bank (ADR-0009): the words a Reader hasn't mastered yet, and how each one graduates.
import type { ChapterCheck, ChapterVersion, Grading, ReadAloudSummary, WordBankEntry, WordBankUpdate, WordOutcome } from "../types";

/** What one Chapter showed about the Reader's words, lowercase with punctuation stripped (see chapterEvidence). */
export interface ChapterEvidence {
  chapterNumber: number;
  /** Read-aloud Misses and wrong Complex Word answers. */
  missed: string[];
  flagged: string[];
  /** Every word of the Chapter Version the Reader read. */
  seen: string[];
  /** Read aloud correctly everywhere they appeared. */
  readCorrectly: string[];
  /** Complex Words whose Chapter Check question got a 2. */
  answeredCorrectly: string[];
}

export function updateWordBank(bank: WordBankEntry[], chapter: ChapterEvidence): WordBankUpdate {
  const { chapterNumber } = chapter;
  const flagged = new Set(chapter.flagged);
  const seen = new Set(chapter.seen);
  // Spec #2 and #13: read or answered correctly. #41 proposes answered correctly only (comms request 0018).
  const knewIt = new Set([...chapter.readCorrectly, ...chapter.answeredCorrectly]);
  const entries = new Map(bank.map((entry) => [entry.word, { ...entry }]));

  for (const entry of entries.values()) {
    // A Graduated Word flagged again returns to the bank, keeping how often it was seen.
    if (entry.graduated && flagged.has(entry.word)) {
      Object.assign(entry, { source: "flagged", graduated: false, graduatedInChapter: null, addedInChapter: chapterNumber, timesSeen: entry.timesSeen + 1 });
      continue;
    }
    if (entry.graduated || chapterNumber <= entry.addedInChapter) continue;
    if (seen.has(entry.word)) entry.timesSeen += 1;
    if (knewIt.has(entry.word) && !flagged.has(entry.word)) {
      entry.graduated = true;
      entry.graduatedInChapter = chapterNumber;
    }
  }

  const add = (word: string, source: WordBankEntry["source"]) => {
    if (entries.has(word)) return;
    entries.set(word, { word, source, timesSeen: 1, graduated: false, addedInChapter: chapterNumber, graduatedInChapter: null });
  };
  for (const word of chapter.missed) add(word, "wrong");
  for (const word of flagged) add(word, "flagged");

  const next = [...entries.values()];
  return {
    bank: next,
    graduatedThisChapter: next.filter((e) => e.graduatedInChapter === chapterNumber).map((e) => e.word),
    wordsLearnedTotal: next.filter((e) => e.graduated).length,
  };
}

const normalize = (word: string) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

/** The Word Bank's view of one graded Chapter. `readAloud` is null when the Reader read silently. */
export function chapterEvidence({
  version,
  check,
  grading,
  readAloud,
}: {
  version: Pick<ChapterVersion, "chapterNumber" | "tokens">;
  check: ChapterCheck;
  grading: Pick<Grading, "questionGrades" | "missedWords">;
  readAloud: Pick<ReadAloudSummary, "wordResults"> | null;
}): ChapterEvidence {
  const tokenWords = new Map(version.tokens.map((t) => [t.index, normalize(t.normalized)]));
  const fullyCorrect = new Set(grading.questionGrades.filter((g) => g.grade === 2).map((g) => g.questionId));
  const results = readAloud?.wordResults ?? [];
  const wordsWith = (outcomes: WordOutcome[]) =>
    new Set(results.flatMap((r) => (outcomes.includes(r.outcome) ? (tokenWords.get(r.tokenIndex) ?? []) : [])));
  const stumbled = wordsWith(["mispronounced", "skipped"]);
  return {
    chapterNumber: version.chapterNumber,
    missed: grading.missedWords.filter((m) => m.source !== "flagged").map((m) => normalize(m.word)),
    flagged: grading.missedWords.filter((m) => m.source === "flagged").map((m) => normalize(m.word)),
    seen: [...tokenWords.values()],
    readCorrectly: [...wordsWith(["correct"])].filter((word) => !stumbled.has(word)),
    answeredCorrectly: check.questions.flatMap((q) => (q.kind === "complex-word" && q.word && fullyCorrect.has(q.id) ? [normalize(q.word)] : [])),
  };
}
